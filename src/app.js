/**
 * SRSLY SDK Browser Demo - Universal Signer Pattern Test
 *
 * This demo tests the browser flow where:
 * 1. String addresses are passed to the SDK (not signer objects)
 * 2. SDK builds instructions without signing capability
 * 3. Wallet adapters handle transaction signing
 */

// Import SRSLY SDK (bundled via webpack)
const { PublicKey } = require('@solana/web3.js');
const { 
    acceptRental, 
    cancelRental, 
    closeRental, 
    resetRental,
    createContract,
    closeContract,
    setConfig 
} = require('@wuwei-labs/srsly');

// Global state
let wallet = null;
let connection = null;
let currentTab = 'contracts';
let currentOperation = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 SRSLY Browser Demo Loading...');

    // Connection will be initialized when wallet connects with custom RPC

    // Setup event listeners
    setupEventListeners();

    // SDK and connection will be configured when wallet connects
    logToDebug('🚀 Demo loaded - waiting for wallet connection to configure SDK');

    // Initialize empty states
    clearActiveForms();

    // Check for existing wallet connection
    await checkWalletConnection();
});

function setupEventListeners() {
    const connectWalletBtn = document.getElementById('connectWallet');
    const copyLogsBtn = document.getElementById('copyLogs');
    const copyErrorsBtn = document.getElementById('copyErrors');
    const clearLogsBtn = document.getElementById('clearLogs');
    const debugOutput = document.getElementById('debugOutput');

    // Wallet connection
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Debug controls
    copyLogsBtn.addEventListener('click', copyLogsToClipboard);
    copyErrorsBtn.addEventListener('click', copyErrorsToClipboard);
    clearLogsBtn.addEventListener('click', clearLogs);
    debugOutput.addEventListener('scroll', updateScrollIndicator);
    
    // Tab switching
    setupTabListeners();
    
    // Operation buttons
    setupOperationListeners();
}

async function connectWallet() {
    const connectBtn = document.getElementById('connectWallet');
    const walletStatus = document.getElementById('walletStatus');
    const walletAddress = document.getElementById('walletAddress');

    try {
        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;

        // Check for available wallets (order matters - most specific first)
        if (window.backpack?.solana) {
            wallet = window.backpack.solana;
            logToDebug('🎒 Backpack wallet detected');
        } else if (window.phantom?.solana) {
            wallet = window.phantom.solana;
            logToDebug('👻 Phantom wallet detected');
        } else if (window.solflare?.solana) {
            wallet = window.solflare.solana;
            logToDebug('☀️ Solflare wallet detected');
        } else if (window.solana) {
            wallet = window.solana;
            logToDebug('👛 Generic Solana wallet detected');
        } else {
            throw new Error('No Solana wallet found. Please install Backpack, Phantom, Solflare, or another Solana wallet.');
        }

        // Connect to wallet
        const response = await wallet.connect();
        const publicKey = response.publicKey || wallet.publicKey;

        if (!publicKey) {
            throw new Error('Failed to get public key from wallet');
        }

        // Detect wallet RPC sources (no form override)
        const detectedSources = detectRpcSources(wallet);
        const selectedRpc = selectWalletRpc(detectedSources);

        logToDebug(`🔗 Using RPC URL: ${selectedRpc.url} (${selectedRpc.source})`);

        // Initialize connection with the selected RPC URL
        connection = new solanaWeb3.Connection(selectedRpc.url, 'confirmed');
        logToDebug(`🔄 Connection initialized: ${selectedRpc.url}`);

        // Configure SDK with holosim programs and selected RPC
        setConfig({
            programs: 'holosim',
            network: 'devnet',
            rpcUrl: selectedRpc.url
        });

        logToDebug(`✅ SDK configured for holosim programs with RPC: ${selectedRpc.url}`);

        // Update UI
        walletStatus.innerHTML = '<div class="status success">✅ Wallet connected successfully!</div>';
        walletAddress.innerHTML = `<div class="address">${publicKey.toString()}</div>`;

        connectBtn.textContent = 'Connected';
        connectBtn.disabled = false;
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-success');

        // Enable operation buttons
        enableOperationButtons();

        logToDebug(`✅ Connected to wallet: ${publicKey.toString()}`);
        logToDebug('🎯 Ready to test Universal Signer Pattern');
        
        // Validate RPC connection
        await validateRpcConnection(connection);
        await fetchWalletBalance(publicKey, selectedRpc.url);

    } catch (error) {
        console.error('Wallet connection failed:', error);
        walletStatus.innerHTML = `<div class="status error">❌ ${error.message}</div>`;
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.disabled = false;

        logToDebug(`❌ Wallet connection failed: ${error.message}`);
    }
}

// Tab Management Functions
function setupTabListeners() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    currentOperation = null; // Clear current operation when switching tabs
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Clear any active forms
    clearActiveForms();
    
    logToDebug(`📑 Switched to ${tabName} tab`);
}

// Operation Button Management
function setupOperationListeners() {
    // Contract operations
    document.getElementById('createContractBtn').addEventListener('click', () => showOperationForm('createContract'));
    document.getElementById('closeContractBtn').addEventListener('click', () => showOperationForm('closeContract'));

    // Rental operations  
    document.getElementById('acceptRentalBtn').addEventListener('click', () => showOperationForm('acceptRental'));
    document.getElementById('cancelRentalBtn').addEventListener('click', () => showOperationForm('cancelRental'));
    document.getElementById('closeRentalBtn').addEventListener('click', () => showOperationForm('closeRental'));
    document.getElementById('resetRentalBtn').addEventListener('click', () => showOperationForm('resetRental'));
}

function enableOperationButtons() {
    const operationButtons = document.querySelectorAll('.operation-btn');
    operationButtons.forEach(btn => {
        btn.disabled = false;
    });
    logToDebug('✅ Operation buttons enabled');
}

function clearActiveForms() {
    const contractForms = document.getElementById('contractForms');
    const rentalForms = document.getElementById('rentalForms');
    
    contractForms.innerHTML = getEmptyState('Select an operation above to get started');
    rentalForms.innerHTML = getEmptyState('Select an operation above to get started');
}

function getEmptyState(message) {
    return `
        <div class="empty-state">
            <h4>Ready to go!</h4>
            <p>${message}</p>
        </div>
    `;
}

// Form Management System
function showOperationForm(operation) {
    currentOperation = operation;
    const formsContainer = currentTab === 'contracts' ? 
        document.getElementById('contractForms') : 
        document.getElementById('rentalForms');
    
    const formHtml = generateFormHtml(operation);
    formsContainer.innerHTML = formHtml;
    
    // Setup form submission
    const form = formsContainer.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => handleOperationSubmit(e, operation));
    }
    
    logToDebug(`📝 Showing ${operation} form`);
}

function generateFormHtml(operation) {
    const forms = {
        createContract: () => `
            <div class="operation-form active">
                <h3>📄 Create Contract</h3>
                <form>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fleet">Fleet Address:</label>
                            <input type="text" id="fleet" placeholder="Fleet address to rent out" required>
                        </div>
                        <div class="form-group">
                            <label for="ownerProfile">Owner Profile:</label>
                            <input type="text" id="ownerProfile" placeholder="Your Star Atlas profile" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="rate">Rate (per payment period):</label>
                            <input type="number" id="rate" placeholder="1000" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="paymentFreq">Payment Frequency:</label>
                            <select id="paymentFreq" required>
                                <option value="">Select frequency</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="maxDuration">Maximum Duration (seconds):</label>
                            <input type="number" id="maxDuration" placeholder="604800" min="3600" required>
                            <small>How long renters can rent for (e.g., 604800 = 1 week)</small>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="clearActiveForms()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Contract</button>
                    </div>
                </form>
            </div>
        `,
        
        closeContract: () => `
            <div class="operation-form active">
                <h3>🔒 Close Contract</h3>
                <form>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="contractAddress">Contract Address:</label>
                            <input type="text" id="contractAddress" placeholder="Contract to close" required>
                        </div>
                        <div class="form-group">
                            <label for="fleetAddress">Fleet Address:</label>
                            <input type="text" id="fleetAddress" placeholder="Fleet address" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="clearActiveForms()">Cancel</button>
                        <button type="submit" class="btn btn-secondary">Close Contract</button>
                    </div>
                </form>
            </div>
        `,
        
        acceptRental: () => `
            <div class="operation-form active">
                <h3>✅ Accept Rental</h3>
                <form>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="contract">Contract Address:</label>
                            <input type="text" id="contract" placeholder="EPyZnehZCztLfsMX4zdxy4vjRpGP8JHyp51ZN6sys4UJ" 
                                   value="EPyZnehZCztLfsMX4zdxy4vjRpGP8JHyp51ZN6sys4UJ" required>
                        </div>
                        <div class="form-group">
                            <label for="profile">Borrower Profile:</label>
                            <input type="text" id="profile" placeholder="Your Star Atlas profile address" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="faction">Faction:</label>
                            <select id="faction" required>
                                <option value="">Select Faction</option>
                                <option value="mud">MUD</option>
                                <option value="oni">ONI</option>
                                <option value="ustur">Ustur</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="duration">Duration (seconds):</label>
                            <input type="number" id="duration" placeholder="86400" value="86400" min="3600" required>
                            <small>Default: 86400 (1 day)</small>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="clearActiveForms()">Cancel</button>
                        <button type="submit" class="btn btn-success">Accept Rental</button>
                    </div>
                </form>
            </div>
        `,
        
        cancelRental: () => `
            <div class="operation-form active">
                <h3>❌ Cancel Rental</h3>
                <form>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="contractAddress">Contract Address:</label>
                            <input type="text" id="contractAddress" placeholder="Contract with active rental" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="clearActiveForms()">Cancel</button>
                        <button type="submit" class="btn btn-warning">Cancel Rental</button>
                    </div>
                </form>
            </div>
        `,
        
        closeRental: () => `
            <div class="operation-form active">
                <h3>🏁 Close Rental</h3>
                <form>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="contractAddress">Contract Address:</label>
                            <input type="text" id="contractAddress" placeholder="Contract with completed rental" required>
                        </div>
                        <div class="form-group">
                            <label for="borrowerAddress">Borrower Address:</label>
                            <input type="text" id="borrowerAddress" placeholder="Borrower's address" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="ownerTokenAccount">Owner Token Account:</label>
                            <input type="text" id="ownerTokenAccount" placeholder="Owner's token account" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="clearActiveForms()">Cancel</button>
                        <button type="submit" class="btn btn-info">Close Rental</button>
                    </div>
                </form>
            </div>
        `,
        
        resetRental: () => `
            <div class="operation-form active">
                <h3>🔄 Reset Rental</h3>
                <form>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fleetAddress">Fleet Address:</label>
                            <input type="text" id="fleetAddress" placeholder="Fleet address" required>
                        </div>
                        <div class="form-group">
                            <label for="contractAddress">Contract Address:</label>
                            <input type="text" id="contractAddress" placeholder="Contract to reset" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="rentalStateAddress">Rental State Address:</label>
                            <input type="text" id="rentalStateAddress" placeholder="Rental state address" required>
                        </div>
                        <div class="form-group">
                            <label for="faction">Faction:</label>
                            <select id="faction" required>
                                <option value="">Select Faction</option>
                                <option value="mud">MUD</option>
                                <option value="oni">ONI</option>
                                <option value="ustur">Ustur</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="ownerProfile">Owner Profile:</label>
                            <input type="text" id="ownerProfile" placeholder="Owner's profile address" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="clearActiveForms()">Cancel</button>
                        <button type="submit" class="btn btn-secondary">Reset Rental</button>
                    </div>
                </form>
            </div>
        `
    };
    
    return forms[operation] ? forms[operation]() : '<div class="empty-state"><p>Operation not implemented yet</p></div>';
}

// Operation Handler - routes to specific operation handlers
async function handleOperationSubmit(event, operation) {
    event.preventDefault();
    
    if (!wallet || !wallet.publicKey) {
        alert('Please connect your wallet first');
        return;
    }
    
    logToDebug(`🔄 Starting ${operation} operation...`);
    
    try {
        switch (operation) {
            case 'createContract':
                await handleCreateContract(event);
                break;
            case 'closeContract':
                await handleCloseContract(event);
                break;
            case 'acceptRental':
                await handleAcceptRental(event);
                break;
            case 'cancelRental':
                await handleCancelRental(event);
                break;
            case 'closeRental':
                await handleCloseRental(event);
                break;
            case 'resetRental':
                await handleResetRental(event);
                break;
            default:
                logToDebug(`⚠️ ${operation} implementation not found`);
                alert(`${operation} implementation not found!`);
        }
    } catch (error) {
        logToDebug(`❌ ${operation} failed: ${error.message}`);
        showTransactionError(error);
    }
}

// Accept Rental Handler (updated for new form structure)
async function handleAcceptRental(event) {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        // Update UI to show loading
        submitBtn.innerHTML = '<span class="spinner"></span>Processing...';
        submitBtn.disabled = true;

        // Clear previous results
        document.getElementById('transactionResults').innerHTML = '';
        logToDebug('🔄 Starting rental acceptance flow...');

        // Get form data from the new form structure
        const formData = getAcceptRentalFormData();
        logToDebug('📋 Form data:', formData);

        // Get user address as STRING (Universal Signer Pattern)
        const userAddress = wallet.publicKey.toString();
        logToDebug(`👤 User address: ${userAddress}`);

        // Step 1: Build instruction with STRING address
        const instruction = await acceptRental({
            borrower: userAddress,           // STRING ADDRESS (browser pattern)
            borrowerProfile: formData.profile,
            borrowerFaction: formData.faction,
            contract: formData.contract,
            duration: formData.duration
        });
        
        logToDebug('✅ Instruction built successfully');

        // Step 2: Convert to web3.js format and create transaction
        const web3Instruction = await instruction.web3js(PublicKey);
        validateInstructionStructure(web3Instruction, userAddress);
        const transaction = new solanaWeb3.Transaction().add(web3Instruction);
        
        logToDebug(`✅ Transaction created with ${transaction.instructions.length} instruction(s)`);
        logToDebug('📤 Sending to wallet for signing...');
        
        let signature;
        
        // Special handling for Backpack wallet (Method 4: sign + manual send)
        if (window.backpack?.solana && wallet === window.backpack.solana) {
            logToDebug('🎒 Detected Backpack wallet - using sign + manual send approach');
            signature = await signAndSendBackpackTransaction(wallet, transaction, connection);
        } else if (wallet.sendTransaction) {
            // Standard wallet API (Phantom, Solflare, etc.)
            logToDebug('🔄 Using standard wallet.sendTransaction API');
            signature = await wallet.sendTransaction(transaction, connection);
        } else if (wallet.signAndSendTransaction) {
            // Alternative wallet API (some wallets use this)
            logToDebug('🔄 Using wallet.signAndSendTransaction API');
            const signed = await wallet.signAndSendTransaction(transaction);
            signature = signed.signature;
        } else if (wallet.signTransaction) {
            // Manual sign and send (other wallets)
            logToDebug('🔄 Using manual sign and send approach');
            const signedTransaction = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize());
        } else {
            throw new Error('Wallet does not support any known transaction sending methods');
        }

        logToDebug(`✅ Transaction sent! Signature: ${signature}`);

        // Step 6: Wait for confirmation
        logToDebug('⏳ Waiting for confirmation...');
        await connection.confirmTransaction(signature, 'confirmed');

        logToDebug('🎉 Transaction confirmed!');

        // Show success
        showTransactionSuccess(signature, userAddress, 'Rental Accepted');

    } catch (error) {
        console.error('Rental acceptance failed:', error);
        logToDebug(`❌ Error: ${error.message}`);

        if (error.stack) {
            logToDebug(`📊 Stack trace: ${error.stack}`);
        }

        showTransactionError(error);
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Contract Operations Handlers
async function handleCreateContract(event) {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.innerHTML = '<span class="spinner"></span>Creating...';
        submitBtn.disabled = true;

        document.getElementById('transactionResults').innerHTML = '';
        logToDebug('🔄 Starting contract creation flow...');

        const formData = getCreateContractFormData();
        logToDebug('📋 Form data:', formData);

        const userAddress = wallet.publicKey.toString();
        logToDebug(`👤 Owner address: ${userAddress}`);

        const instruction = await createContract({
            owner: userAddress,
            fleet: formData.fleet,
            ownerProfile: formData.ownerProfile,
            rate: formData.rate,
            durationMax: formData.maxDuration,
            paymentsFreq: formData.paymentFreq
        });

        logToDebug('✅ Contract creation instruction built successfully');

        const web3Instruction = await instruction.web3js(PublicKey);
        const transaction = new solanaWeb3.Transaction().add(web3Instruction);

        logToDebug(`✅ Transaction created with ${transaction.instructions.length} instruction(s)`);
        logToDebug('📤 Sending to wallet for signing...');

        let signature;
        if (window.backpack?.solana && wallet === window.backpack.solana) {
            signature = await signAndSendBackpackTransaction(wallet, transaction, connection);
        } else if (wallet.sendTransaction) {
            signature = await wallet.sendTransaction(transaction, connection);
        } else if (wallet.signAndSendTransaction) {
            const signed = await wallet.signAndSendTransaction(transaction);
            signature = signed.signature;
        } else if (wallet.signTransaction) {
            const signedTransaction = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize());
        } else {
            throw new Error('Wallet does not support any known transaction sending methods');
        }

        logToDebug(`✅ Transaction sent! Signature: ${signature}`);
        logToDebug('⏳ Waiting for confirmation...');
        await connection.confirmTransaction(signature, 'confirmed');
        logToDebug('🎉 Contract created successfully!');

        showTransactionSuccess(signature, userAddress, 'Contract Created');

    } catch (error) {
        console.error('Contract creation failed:', error);
        logToDebug(`❌ Error: ${error.message}`);
        if (error.stack) {
            logToDebug(`📊 Stack trace: ${error.stack}`);
        }
        showTransactionError(error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleCloseContract(event) {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.innerHTML = '<span class="spinner"></span>Closing...';
        submitBtn.disabled = true;

        document.getElementById('transactionResults').innerHTML = '';
        logToDebug('🔄 Starting contract closure flow...');

        const formData = getCloseContractFormData();
        logToDebug('📋 Form data:', formData);

        const userAddress = wallet.publicKey.toString();
        logToDebug(`👤 Owner address: ${userAddress}`);

        const instruction = await closeContract({
            owner: userAddress,
            fleet: formData.fleetAddress,
            contract: formData.contractAddress,
            faction: 'mud' // Default faction for now
        });

        logToDebug('✅ Contract closure instruction built successfully');

        const web3Instruction = await instruction.web3js(PublicKey);
        const transaction = new solanaWeb3.Transaction().add(web3Instruction);

        logToDebug(`✅ Transaction created with ${transaction.instructions.length} instruction(s)`);

        let signature;
        if (window.backpack?.solana && wallet === window.backpack.solana) {
            signature = await signAndSendBackpackTransaction(wallet, transaction, connection);
        } else if (wallet.sendTransaction) {
            signature = await wallet.sendTransaction(transaction, connection);
        } else if (wallet.signTransaction) {
            const signedTransaction = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize());
        } else {
            throw new Error('Wallet does not support transaction sending');
        }

        logToDebug(`✅ Transaction sent! Signature: ${signature}`);
        await connection.confirmTransaction(signature, 'confirmed');
        logToDebug('🎉 Contract closed successfully!');

        showTransactionSuccess(signature, userAddress, 'Contract Closed');

    } catch (error) {
        console.error('Contract closure failed:', error);
        logToDebug(`❌ Error: ${error.message}`);
        showTransactionError(error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Rental Operations Handlers
async function handleCancelRental(event) {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.innerHTML = '<span class="spinner"></span>Canceling...';
        submitBtn.disabled = true;

        document.getElementById('transactionResults').innerHTML = '';
        logToDebug('🔄 Starting rental cancellation flow...');

        const formData = getCancelRentalFormData();
        logToDebug('📋 Form data:', formData);

        const userAddress = wallet.publicKey.toString();
        logToDebug(`👤 Borrower address: ${userAddress}`);

        const instruction = await cancelRental({
            borrower: userAddress,
            contract: formData.contractAddress
        });

        logToDebug('✅ Rental cancellation instruction built successfully');

        const web3Instruction = await instruction.web3js(PublicKey);
        const transaction = new solanaWeb3.Transaction().add(web3Instruction);

        let signature;
        if (window.backpack?.solana && wallet === window.backpack.solana) {
            signature = await signAndSendBackpackTransaction(wallet, transaction, connection);
        } else if (wallet.sendTransaction) {
            signature = await wallet.sendTransaction(transaction, connection);
        } else if (wallet.signTransaction) {
            const signedTransaction = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize());
        } else {
            throw new Error('Wallet does not support transaction sending');
        }

        logToDebug(`✅ Transaction sent! Signature: ${signature}`);
        await connection.confirmTransaction(signature, 'confirmed');
        logToDebug('🎉 Rental canceled successfully!');

        showTransactionSuccess(signature, userAddress, 'Rental Canceled');

    } catch (error) {
        console.error('Rental cancellation failed:', error);
        logToDebug(`❌ Error: ${error.message}`);
        showTransactionError(error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleCloseRental(event) {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.innerHTML = '<span class="spinner"></span>Closing...';
        submitBtn.disabled = true;

        document.getElementById('transactionResults').innerHTML = '';
        logToDebug('🔄 Starting rental closure flow...');

        const formData = getCloseRentalFormData();
        logToDebug('📋 Form data:', formData);

        const userAddress = wallet.publicKey.toString();
        logToDebug(`👤 User address: ${userAddress}`);

        const instruction = await closeRental({
            borrower: formData.borrowerAddress,
            ownerTokenAccount: formData.ownerTokenAccount,
            contract: formData.contractAddress
        });

        logToDebug('✅ Rental closure instruction built successfully');

        const web3Instruction = await instruction.web3js(PublicKey);
        const transaction = new solanaWeb3.Transaction().add(web3Instruction);

        let signature;
        if (window.backpack?.solana && wallet === window.backpack.solana) {
            signature = await signAndSendBackpackTransaction(wallet, transaction, connection);
        } else if (wallet.sendTransaction) {
            signature = await wallet.sendTransaction(transaction, connection);  
        } else if (wallet.signTransaction) {
            const signedTransaction = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize());
        } else {
            throw new Error('Wallet does not support transaction sending');
        }

        logToDebug(`✅ Transaction sent! Signature: ${signature}`);
        await connection.confirmTransaction(signature, 'confirmed');
        logToDebug('🎉 Rental closed successfully!');

        showTransactionSuccess(signature, userAddress, 'Rental Closed');

    } catch (error) {
        console.error('Rental closure failed:', error);
        logToDebug(`❌ Error: ${error.message}`);
        showTransactionError(error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleResetRental(event) {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.innerHTML = '<span class="spinner"></span>Resetting...';
        submitBtn.disabled = true;

        document.getElementById('transactionResults').innerHTML = '';
        logToDebug('🔄 Starting rental reset flow...');

        const formData = getResetRentalFormData();
        logToDebug('📋 Form data:', formData);

        const userAddress = wallet.publicKey.toString();
        logToDebug(`👤 User address: ${userAddress}`);

        const instruction = await resetRental({
            fleet: formData.fleetAddress,
            contract: formData.contractAddress,
            rentalState: formData.rentalStateAddress,
            faction: formData.faction,
            ownerProfile: formData.ownerProfile
        });

        logToDebug('✅ Rental reset instruction built successfully');

        const web3Instruction = await instruction.web3js(PublicKey);
        const transaction = new solanaWeb3.Transaction().add(web3Instruction);

        let signature;
        if (window.backpack?.solana && wallet === window.backpack.solana) {
            signature = await signAndSendBackpackTransaction(wallet, transaction, connection);
        } else if (wallet.sendTransaction) {
            signature = await wallet.sendTransaction(transaction, connection);
        } else if (wallet.signTransaction) {
            const signedTransaction = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize());
        } else {
            throw new Error('Wallet does not support transaction sending');
        }

        logToDebug(`✅ Transaction sent! Signature: ${signature}`);
        await connection.confirmTransaction(signature, 'confirmed');
        logToDebug('🎉 Rental reset successfully!');

        showTransactionSuccess(signature, userAddress, 'Rental Reset');

    } catch (error) {
        console.error('Rental reset failed:', error);
        logToDebug(`❌ Error: ${error.message}`);
        showTransactionError(error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Helper function for accept rental form data
function getAcceptRentalFormData() {
    return {
        contract: document.getElementById('contract').value.trim(),
        profile: document.getElementById('profile').value.trim(),
        faction: document.getElementById('faction').value,
        duration: parseInt(document.getElementById('duration').value)
    };
}

// Legacy function (keeping for compatibility with old handleRentalSubmit)
function getFormData() {
    return getAcceptRentalFormData();
}

// Form data helper functions for each operation
function getCreateContractFormData() {
    return {
        fleet: document.getElementById('fleet').value.trim(),
        ownerProfile: document.getElementById('ownerProfile').value.trim(),
        rate: parseInt(document.getElementById('rate').value),
        paymentFreq: document.getElementById('paymentFreq').value,
        maxDuration: parseInt(document.getElementById('maxDuration').value)
    };
}

function getCloseContractFormData() {
    return {
        contractAddress: document.getElementById('contractAddress').value.trim(),
        fleetAddress: document.getElementById('fleetAddress').value.trim()
    };
}

function getCancelRentalFormData() {
    return {
        contractAddress: document.getElementById('contractAddress').value.trim()
    };
}

function getCloseRentalFormData() {
    return {
        contractAddress: document.getElementById('contractAddress').value.trim(),
        borrowerAddress: document.getElementById('borrowerAddress').value.trim(),
        ownerTokenAccount: document.getElementById('ownerTokenAccount').value.trim()
    };
}

function getResetRentalFormData() {
    return {
        fleetAddress: document.getElementById('fleetAddress').value.trim(),
        contractAddress: document.getElementById('contractAddress').value.trim(),
        rentalStateAddress: document.getElementById('rentalStateAddress').value.trim(),
        faction: document.getElementById('faction').value,
        ownerProfile: document.getElementById('ownerProfile').value.trim()
    };
}

// Simplified instruction validation
function validateInstructionStructure(web3Instruction, expectedBorrowerAddress) {
    // Basic structure validation
    if (!web3Instruction.keys || !web3Instruction.programId || !web3Instruction.data) {
        throw new Error('Invalid instruction structure');
    }

    // Find and validate borrower account
    const borrowerAccount = web3Instruction.keys.find(key => {
        const keyAddress = key.pubkey.toString ? key.pubkey.toString() : key.pubkey;
        return keyAddress === expectedBorrowerAddress;
    });

    if (!borrowerAccount) {
        throw new Error('Borrower account not found in instruction keys');
    }

    if (!borrowerAccount.isSigner) {
        throw new Error('CRITICAL: Borrower account is not marked as signer!');
    }

    logToDebug(`✅ Instruction validated - borrower marked as signer`);
}

function showTransactionSuccess(signature, userAddress, operationType = 'Transaction') {
    const results = document.getElementById('transactionResults');
    results.className = 'results success';
    results.innerHTML = `
        <h3>🎉 ${operationType} Successful!</h3>
        <p><strong>Signature:</strong> <code>${signature}</code></p>
        <p><strong>User:</strong> <code>${userAddress}</code></p>
        <p><strong>Network:</strong> Devnet</p>
        <p><strong>Universal Signer Test:</strong> ✅ PASSED</p>
        <p>
            <a href="https://explorer.solana.com/tx/${signature}?cluster=devnet"
               target="_blank" class="btn btn-primary">
                View on Explorer
            </a>
        </p>
    `;
}

function showTransactionError(error) {
    const results = document.getElementById('transactionResults');
    results.className = 'results error';
    results.innerHTML = `
        <h3>❌ Transaction Failed</h3>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Universal Signer Test:</strong> ❌ FAILED</p>
        <details>
            <summary>Error Details</summary>
            <pre>${error.stack || 'No stack trace available'}</pre>
        </details>
    `;
}

function logToDebug(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const debugOutput = document.getElementById('debugOutput');

    let logLine = `[${timestamp}] ${message}`;

    if (data !== null) {
        logLine += '\n' + JSON.stringify(data, null, 2);
    }

    debugOutput.textContent += logLine + '\n';
    debugOutput.scrollTop = debugOutput.scrollHeight;
    
    // Update scroll indicator
    updateScrollIndicator();

    // Also log to console
    console.log(message, data);
}

function clearLogs() {
    const debugOutput = document.getElementById('debugOutput');
    const copyFeedback = document.getElementById('copyFeedback');
    
    debugOutput.textContent = '';
    copyFeedback.textContent = '🗑️ Logs cleared';
    
    setTimeout(() => {
        copyFeedback.textContent = '';
    }, 1500);
    
    updateScrollIndicator();
    logToDebug('🧹 Debug logs cleared');
}

function updateScrollIndicator() {
    const debugOutput = document.getElementById('debugOutput');
    const scrollIndicator = document.getElementById('scrollIndicator');
    
    if (!debugOutput || !scrollIndicator) return;
    
    const isScrolledToBottom = debugOutput.scrollTop >= (debugOutput.scrollHeight - debugOutput.clientHeight - 10);
    const hasContent = debugOutput.textContent.trim().length > 0;
    const hasScrollableContent = debugOutput.scrollHeight > debugOutput.clientHeight;
    
    // Show indicator if there's scrollable content and user is not at the bottom
    if (hasContent && hasScrollableContent && !isScrolledToBottom) {
        scrollIndicator.classList.add('visible');
    } else {
        scrollIndicator.classList.remove('visible');
    }
}

function normalizeRpcUrl(url) {
    if (!url || typeof url !== 'string') {
        return url;
    }
    
    // Strip www. prefix if present
    const normalized = url.replace(/^https:\/\/www\./, 'https://');
    
    if (normalized !== url) {
        logToDebug(`🔧 Normalized RPC URL: ${url} → ${normalized}`);
    }
    
    return normalized;
}

function detectRpcSources(wallet) {
    const sources = {};
    
    logToDebug('🔍 Detecting available RPC sources...');
    
    // Check various wallet RPC properties and normalize URLs
    if (wallet?.connection?.rpcEndpoint) {
        const original = wallet.connection.rpcEndpoint;
        sources.walletConnection = normalizeRpcUrl(original);
        logToDebug(`📍 Found wallet.connection.rpcEndpoint: ${original}`);
    }
    
    if (wallet?.rpcEndpoint) {
        const original = wallet.rpcEndpoint;
        sources.walletDirect = normalizeRpcUrl(original);
        logToDebug(`📍 Found wallet.rpcEndpoint: ${original}`);
    }
    
    if (wallet?._rpc) {
        const original = wallet._rpc;
        sources.walletPrivate = normalizeRpcUrl(original);
        logToDebug(`📍 Found wallet._rpc: ${original}`);
    }
    
    // Check existing global connection
    if (connection?.rpcEndpoint) {
        const original = connection.rpcEndpoint;
        sources.existingConnection = normalizeRpcUrl(original);
        logToDebug(`📍 Found existing connection.rpcEndpoint: ${original}`);
    }
    
    // Check if wallet has connection object with endpoint
    if (wallet?.connection?._rpcEndpoint) {
        const original = wallet.connection._rpcEndpoint;
        sources.walletConnectionPrivate = normalizeRpcUrl(original);
        logToDebug(`📍 Found wallet.connection._rpcEndpoint: ${original}`);
    }
    
    const sourceCount = Object.keys(sources).length;
    logToDebug(`🔍 Detected ${sourceCount} RPC source(s) from wallet`);
    
    return sources;
}

function selectWalletRpc(detectedSources) {
    const fallbackRpc = 'https://api.devnet.solana.com';
    
    logToDebug('🎯 Selecting RPC from wallet sources only (no form override)');
    
    // Priority order for wallet RPC sources
    const walletRpcSources = [
        { key: 'walletConnection', label: 'wallet.connection.rpcEndpoint' },
        { key: 'walletDirect', label: 'wallet.rpcEndpoint' },
        { key: 'walletConnectionPrivate', label: 'wallet.connection._rpcEndpoint' },
        { key: 'walletPrivate', label: 'wallet._rpc' },
        { key: 'existingConnection', label: 'existing connection' }
    ];
    
    // Try to use wallet-provided RPC (highest priority)
    for (const source of walletRpcSources) {
        if (detectedSources[source.key]) {
            logToDebug(`🎯 Using wallet RPC from ${source.label}: ${detectedSources[source.key]}`);
            return { 
                url: detectedSources[source.key], 
                source: `wallet (${source.label})` 
            };
        }
    }
    
    // Fallback if no wallet RPC detected
    logToDebug(`⚠️  No wallet RPC detected, using fallback: ${fallbackRpc}`);
    logToDebug('💡 Note: This may cause transaction signing issues if wallet uses different RPC');
    return { url: fallbackRpc, source: 'fallback (no wallet RPC detected)' };
}

async function copyLogsToClipboard() {
    const debugOutput = document.getElementById('debugOutput');
    const copyFeedback = document.getElementById('copyFeedback');
    
    try {
        const logText = debugOutput.textContent;
        await navigator.clipboard.writeText(logText);
        
        copyFeedback.textContent = '✅ All logs copied!';
        setTimeout(() => {
            copyFeedback.textContent = '';
        }, 2000);
        
        logToDebug('📋 All debug logs copied to clipboard');
    } catch (error) {
        copyFeedback.textContent = '❌ Failed to copy';
        setTimeout(() => {
            copyFeedback.textContent = '';
        }, 2000);
        
        logToDebug(`❌ Failed to copy logs: ${error.message}`);
    }
}

// Minimal Backpack transaction handler using the working Method 4 approach
async function signAndSendBackpackTransaction(wallet, transaction, connection) {
    logToDebug('🎒 Using Method 4: sign + manual send (proven working method)');
    
    if (!wallet.signTransaction) {
        throw new Error('Backpack wallet does not support signTransaction method');
    }
    
    // Ensure transaction has recent blockhash and fee payer
    if (!transaction.recentBlockhash) {
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;
        logToDebug(`✅ Set blockhash: ${blockhash.slice(0, 8)}...`);
    }
    
    // Sign transaction with Backpack
    const signedTransaction = await wallet.signTransaction(transaction);
    logToDebug('✅ Transaction signed with Backpack');
    
    // Send manually using our connection
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    logToDebug(`✅ Transaction sent successfully: ${signature}`);
    
    return signature;
}

// Simplified RPC connection validation
async function validateRpcConnection(connection) {
    try {
        await connection.getLatestBlockhash();
        logToDebug('✅ RPC connection validated');
        return true;
    } catch (error) {
        logToDebug(`❌ RPC connection failed: ${error.message}`);
        return false;
    }
}

// Simplified error copying
async function copyErrorsToClipboard() {
    const debugOutput = document.getElementById('debugOutput');
    const copyFeedback = document.getElementById('copyFeedback');
    
    try {
        const logText = debugOutput.textContent;
        const errorLines = logText.split('\n').filter(line => 
            line.includes('❌') || line.includes('Error:') || line.includes('FAILED')
        );
        
        if (errorLines.length === 0) {
            copyFeedback.textContent = '✅ No errors found!';
        } else {
            await navigator.clipboard.writeText(errorLines.join('\n'));
            copyFeedback.textContent = '✅ Errors copied!';
        }
        
        setTimeout(() => copyFeedback.textContent = '', 2000);
    } catch (error) {
        copyFeedback.textContent = '❌ Failed to copy';
        setTimeout(() => copyFeedback.textContent = '', 2000);
    }
}

async function fetchWalletBalance(publicKey, rpcUrl) {
    const balanceDiv = document.getElementById('walletBalance');
    const rpcInfoDiv = document.getElementById('rpcInfo');
    
    try {
        // Show loading state
        balanceDiv.innerHTML = '⏳ Fetching balance...';
        rpcInfoDiv.innerHTML = `🌐 Testing RPC: ${rpcUrl}`;
        
        logToDebug('💰 Fetching wallet balance via RPC connection...');
        logToDebug(`🔗 RPC Endpoint: ${rpcUrl}`);
        logToDebug(`👤 Public Key: ${publicKey.toString()}`);
        
        const startTime = performance.now();
        
        // Fetch balance using the established connection
        const balanceInLamports = await connection.getBalance(publicKey);
        
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        // Convert lamports to SOL
        const balanceInSOL = balanceInLamports / solanaWeb3.LAMPORTS_PER_SOL;
        
        // Update UI
        balanceDiv.innerHTML = `💰 Balance: ${balanceInSOL.toFixed(4)} SOL`;
        rpcInfoDiv.innerHTML = `🌐 RPC: ${rpcUrl} (${responseTime}ms)`;
        
        logToDebug(`✅ Balance fetch successful: ${balanceInSOL.toFixed(4)} SOL`);
        logToDebug(`⚡ Response time: ${responseTime}ms`);
        logToDebug(`🔍 Raw balance: ${balanceInLamports} lamports`);
        
        return { success: true, balance: balanceInSOL, responseTime };
        
    } catch (error) {
        // Show error state
        balanceDiv.innerHTML = '❌ Failed to fetch balance';
        rpcInfoDiv.innerHTML = `🌐 RPC: ${rpcUrl} (failed)`;
        
        logToDebug(`❌ Balance fetch failed: ${error.message}`);
        logToDebug(`🔍 Error details: ${error.stack || 'No stack trace'}`);
        
        return { success: false, error: error.message };
    }
}

async function checkWalletConnection() {
    // Check if wallet is already connected (for page refresh)
    let connectedWallet = null;
    let walletName = '';

    if (window.backpack?.solana?.isConnected) {
        connectedWallet = window.backpack.solana;
        walletName = 'Backpack';
        logToDebug('🎒 Backpack wallet already connected');
    } else if (window.phantom?.solana?.isConnected) {
        connectedWallet = window.phantom.solana;
        walletName = 'Phantom';
        logToDebug('👻 Phantom wallet already connected');
    } else if (window.solflare?.solana?.isConnected) {
        connectedWallet = window.solflare.solana;
        walletName = 'Solflare';
        logToDebug('☀️ Solflare wallet already connected');
    }

    if (connectedWallet) {
        const publicKey = connectedWallet.publicKey;
        if (publicKey) {
            wallet = connectedWallet;
            
            // Configure SDK and connection for already connected wallet
            const detectedSources = detectRpcSources(connectedWallet);
            const selectedRpc = selectWalletRpc(detectedSources);
            
            connection = new solanaWeb3.Connection(selectedRpc.url, 'confirmed');
            setConfig({
                programs: 'holosim',
                network: 'devnet',
                rpcUrl: selectedRpc.url
            });
            
            logToDebug(`🔄 SDK configured for pre-connected ${walletName} wallet with RPC: ${selectedRpc.url} (${selectedRpc.source})`);
            
            // Update UI
            document.getElementById('walletStatus').innerHTML =
                `<div class="status success">✅ ${walletName} wallet already connected</div>`;
            document.getElementById('walletAddress').innerHTML =
                `<div class="address">${publicKey.toString()}</div>`;
            document.getElementById('connectWallet').textContent = 'Connected';
            enableOperationButtons();

            logToDebug(`✅ ${walletName} wallet was already connected: ${publicKey.toString()}`);
            
            // Test connection for pre-connected wallet
            await fetchWalletBalance(publicKey, selectedRpc.url);
        }
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    logToDebug(`🚨 Global error: ${event.error?.message || event.message}`);
});

// Log when the script loads
console.log('📜 SRSLY Browser Demo script loaded');
logToDebug('📜 SRSLY Browser Demo initialized');
