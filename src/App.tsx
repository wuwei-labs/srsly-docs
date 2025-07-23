import React, { useState, useEffect, useRef } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { SDKCodeEditor } from './components/ui/sdk-code-editor'
import AcceptRentalForm, { AcceptRentalFormData } from './components/forms/AcceptRentalForm'
import CreateContractForm, { CreateContractFormData } from './components/forms/CreateContractForm'

// Import SRSLY SDK and Solana Web3
const { PublicKey } = require('@solana/web3.js')
const { 
  acceptRental, 
  cancelRental, 
  closeRental, 
  resetRental,
  createContract,
  closeContract,
  setConfig 
} = require('@wuwei-labs/srsly')

// Types
interface DebugLog {
  timestamp: string
  message: string
  data?: any
}

type OperationType = 'createContract' | 'closeContract' | 'acceptRental' | 'cancelRental' | 'closeRental' | 'resetRental'

export default function App() {
  // Wallet Adapter hooks
  const { publicKey, connected, connecting, wallet, sendTransaction } = useWallet()
  const { connection } = useConnection()
  
  // State management
  const [activeOperation, setActiveOperation] = useState<OperationType | null>(null)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [walletBalance, setWalletBalance] = useState<string>('Not loaded')
  const [rpcInfo, setRpcInfo] = useState<string>('Not connected')
  const [transactionResult, setTransactionResult] = useState<{
    type: 'success' | 'error' | null
    content: string
  }>({ type: null, content: '' })
  
  const [operationLoading, setOperationLoading] = useState(false)
  const [logsPanelOpen, setLogsPanelOpen] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('devnet')
  const [customRpcUrl, setCustomRpcUrl] = useState('')
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    responseTime?: number
  }>({ connected: false })
  
  // Network options
  const networkOptions = [
    { value: 'devnet', label: 'Devnet', url: 'https://api.devnet.solana.com' },
    { value: 'mainnet', label: 'Mainnet', url: 'https://api.mainnet-beta.solana.com' },
    { value: 'testnet', label: 'Testnet', url: 'https://api.testnet.solana.com' },
    { value: 'custom', label: 'Custom', url: '' }
  ]
  
  // Contract Operations (Owner) Settings
  const [contractUseConnectedWallet, setContractUseConnectedWallet] = useState(true)
  const [contractPrivateKey, setContractPrivateKey] = useState('')
  const [showContractKeyInput, setShowContractKeyInput] = useState(false)
  
  // Rental Operations Settings  
  const [rentalUseConnectedWallet, setRentalUseConnectedWallet] = useState(true)
  const [rentalPrivateKey, setRentalPrivateKey] = useState('')
  const [showRentalKeyInput, setShowRentalKeyInput] = useState(false)

  // Refs
  const debugOutputRef = useRef<HTMLDivElement>(null)

  // Debug logging function
  const logToDebug = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString()
    const newLog: DebugLog = { timestamp, message, data }
    
    setDebugLogs(prev => [...prev, newLog])
    console.log(message, data)
    
    // Keep logs panel closed to avoid covering code editor
    
    // Auto-scroll debug output
    setTimeout(() => {
      if (debugOutputRef.current) {
        debugOutputRef.current.scrollTop = debugOutputRef.current.scrollHeight
      }
    }, 100)
  }

  // State for SDK code editors
  const [createContractCode, setCreateContractCode] = useState(`// Core SRSLY SDK function call - edit the parameters below
const instruction = await createContract({
  owner: wallet.publicKey?.toBase58() || "YOUR_WALLET_ADDRESS",
  fleet: "FLEET_NFT_ADDRESS", 
  ownerProfile: "OWNER_PROFILE_ADDRESS",
  rate: 1000000, // Rate in lamports
  durationMax: 86400, // Max duration in seconds
  paymentsFreq: 3600 // Payment frequency in seconds
});`)
  const [codeEditorError, setCodeEditorError] = useState<string>('')

  // Configure SDK when wallet connects
  useEffect(() => {
    if (connected && connection) {
      logToDebug(`✅ Wallet connected: ${wallet?.adapter?.name || 'Unknown'}`)
      logToDebug(`👤 Public key: ${publicKey?.toString()}`)
      logToDebug(`🔗 RPC URL: ${connection.rpcEndpoint}`)
      
      // Configure SDK with holosim programs
      setConfig({
        programs: 'holosim',
        network: 'devnet',
        rpcUrl: connection.rpcEndpoint
      })

      logToDebug('✅ SDK configured for holosim programs')
      setRpcInfo(`🌐 RPC: ${connection.rpcEndpoint}`)
      
      // Fetch wallet balance
      if (publicKey) {
        fetchWalletBalance(publicKey, connection.rpcEndpoint, connection)
      }
    } else if (!connected) {
      setWalletBalance('Not loaded')
      setRpcInfo('Not connected')
    }
  }, [connected, connection, publicKey, wallet])


  const fetchWalletBalance = async (publicKey: any, rpcUrl: string, conn: any) => {
    try {
      setWalletBalance('⏳ Fetching balance...')
      
      logToDebug('💰 Fetching wallet balance via RPC connection...')
      logToDebug(`🔗 RPC Endpoint: ${rpcUrl}`)
      logToDebug(`👤 Public Key: ${publicKey.toString()}`)
      
      const startTime = performance.now()
      const balanceInLamports = await conn.getBalance(publicKey)
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      const balanceInSOL = balanceInLamports / (window as any).solanaWeb3.LAMPORTS_PER_SOL
      
      setWalletBalance(`💰 Balance: ${balanceInSOL.toFixed(4)} SOL`)
      setRpcInfo(`🌐 RPC: ${rpcUrl} (${responseTime}ms)`)
      
      logToDebug(`✅ Balance fetch successful: ${balanceInSOL.toFixed(4)} SOL`)
      logToDebug(`⚡ Response time: ${responseTime}ms`)
      
      setConnectionStatus({ connected: true, responseTime })
      
      return { success: true, balance: balanceInSOL, responseTime }
    } catch (error: any) {
      setWalletBalance('❌ Failed to fetch balance')
      setRpcInfo(`🌐 RPC: ${rpcUrl} (failed)`)
      
      logToDebug(`❌ Balance fetch failed: ${error.message}`)
      setConnectionStatus({ connected: false })
      return { success: false, error: error.message }
    }
  }

  // Keyboard support for logs panel and network dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (logsPanelOpen) {
          setLogsPanelOpen(false)
        }
        if (showNetworkDropdown) {
          setShowNetworkDropdown(false)
        }
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (showNetworkDropdown) {
        const target = e.target as HTMLElement
        if (!target.closest('.network-dropdown')) {
          setShowNetworkDropdown(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [logsPanelOpen, showNetworkDropdown])

  // Initialize app
  useEffect(() => {
    logToDebug('🚀 SRSLY Browser Demo Loading...')
    logToDebug('🚀 Demo loaded - Wallet Adapter configured for auto-connect')
  }, [])


  // Handle operation form display
  const showOperationForm = (operation: OperationType) => {
    setActiveOperation(operation)
    setTransactionResult({ type: null, content: '' })
    logToDebug(`📝 Showing ${operation} form`)
  }

  // Handle Accept Rental form submission
  const handleAcceptRental = async (formData: AcceptRentalFormData) => {
    if (!connected || !publicKey || !sendTransaction || !connection) {
      throw new Error('Wallet not connected or transaction method not available')
    }

    setOperationLoading(true)
    setTransactionResult({ type: null, content: '' })

    try {
      logToDebug('🔄 Starting rental acceptance flow...')
      logToDebug('📋 Form data:', formData)
      logToDebug(`🔗 Using wallet: ${wallet?.adapter?.name}`)

      // Step 1: Build instruction with STRING address (Universal Signer Pattern)
      const instruction = await acceptRental({
        borrower: publicKey.toString(),           // STRING ADDRESS (browser pattern)
        borrowerProfile: formData.profile,
        borrowerFaction: formData.faction,
        contract: formData.contract,
        duration: formData.duration
      })
      
      logToDebug('✅ Instruction built successfully')

      // Step 2: Convert to web3.js format and create transaction
      const web3Instruction = await instruction.web3js(PublicKey)
      const transaction = new (window as any).solanaWeb3.Transaction().add(web3Instruction)
      
      logToDebug(`✅ Transaction created with ${transaction.instructions.length} instruction(s)`)
      logToDebug('📤 Sending to wallet for signing via Wallet Adapter...')
      
      // Use Wallet Adapter's sendTransaction method
      const signature = await sendTransaction(transaction, connection)

      logToDebug(`✅ Transaction sent! Signature: ${signature}`)
      logToDebug('⏳ Waiting for confirmation...')
      
      await connection.confirmTransaction(signature, 'confirmed')
      logToDebug('🎉 Transaction confirmed!')

      // Show success
      setTransactionResult({
        type: 'success',
        content: `
          <h3>🎉 Rental Accepted Successfully!</h3>
          <p><strong>Signature:</strong> <code>${signature}</code></p>
          <p><strong>User:</strong> <code>${publicKey.toString()}</code></p>
          <p><strong>Wallet:</strong> ${wallet?.adapter?.name}</p>
          <p><strong>Network:</strong> Devnet</p>
          <p><strong>Universal Signer Test:</strong> ✅ PASSED</p>
          <p>
            <a href="https://explorer.solana.com/tx/${signature}?cluster=devnet"
               target="_blank" class="text-primary hover:underline">
              View on Explorer →
            </a>
          </p>
        `
      })

    } catch (error: any) {
      console.error('Rental acceptance failed:', error)
      logToDebug(`❌ Error: ${error.message}`)
      
      setTransactionResult({
        type: 'error',
        content: `
          <h3>❌ Transaction Failed</h3>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Universal Signer Test:</strong> ❌ FAILED</p>
        `
      })
    } finally {
      setOperationLoading(false)
    }
  }

  // Handle Create Contract form submission
  const handleCreateContract = async (formData: CreateContractFormData) => {
    if (!connected || !publicKey || !sendTransaction || !connection) {
      throw new Error('Wallet not connected or transaction method not available')
    }

    setOperationLoading(true)
    setTransactionResult({ type: null, content: '' })

    try {
      logToDebug('🔄 Starting contract creation flow...')
      logToDebug('📋 Form data:', formData)
      logToDebug(`🔗 Using wallet: ${wallet?.adapter?.name}`)

      const instruction = await createContract({
        owner: publicKey.toString(),
        fleet: formData.fleet,
        ownerProfile: formData.ownerProfile,
        rate: formData.rate,
        durationMax: formData.maxDuration,
        paymentsFreq: formData.paymentFreq
      })

      logToDebug('✅ Contract creation instruction built successfully')

      const web3Instruction = await instruction.web3js(PublicKey)
      const transaction = new (window as any).solanaWeb3.Transaction().add(web3Instruction)

      logToDebug(`✅ Transaction created with ${transaction.instructions.length} instruction(s)`)
      logToDebug('📤 Sending to wallet for signing via Wallet Adapter...')

      // Use Wallet Adapter's sendTransaction method
      const signature = await sendTransaction(transaction, connection)

      logToDebug(`✅ Transaction sent! Signature: ${signature}`)
      logToDebug('⏳ Waiting for confirmation...')
      await connection.confirmTransaction(signature, 'confirmed')
      logToDebug('🎉 Contract created successfully!')

      setTransactionResult({
        type: 'success',
        content: `
          <h3>🎉 Contract Created Successfully!</h3>
          <p><strong>Signature:</strong> <code>${signature}</code></p>
          <p><strong>Owner:</strong> <code>${publicKey.toString()}</code></p>
          <p><strong>Wallet:</strong> ${wallet?.adapter?.name}</p>
          <p><strong>Network:</strong> Devnet</p>
          <p>
            <a href="https://explorer.solana.com/tx/${signature}?cluster=devnet"
               target="_blank" class="text-primary hover:underline">
              View on Explorer →
            </a>
          </p>
        `
      })

    } catch (error: any) {
      console.error('Contract creation failed:', error)
      logToDebug(`❌ Error: ${error.message}`)
      
      setTransactionResult({
        type: 'error',
        content: `
          <h3>❌ Contract Creation Failed</h3>
          <p><strong>Error:</strong> ${error.message}</p>
        `
      })
    } finally {
      setOperationLoading(false)
    }
  }

  // Handle transaction submission from SDK code editor
  const handleTransactionSubmit = async (operationType: OperationType, editorCode: string) => {
    if (!connected || !publicKey || !sendTransaction || !connection) {
      setCodeEditorError('Wallet not connected or transaction method not available')
      return
    }

    setOperationLoading(true)
    setTransactionResult({ type: null, content: '' })
    setCodeEditorError('') // Clear previous errors

    try {
      logToDebug(`🔄 Executing ${operationType} from code editor...`)
      logToDebug(`📝 Editor code:\n${editorCode}`)
      
      // Execute the code by creating an async function and calling it
      // This will execute the exact SDK code the user edited
      const executeCode = new Function('createContract', 'closeContract', 'acceptRental', 'cancelRental', 'closeRental', 'resetRental', 'wallet', 'PublicKey', 'logToDebug', `
        return (async () => {
          ${editorCode}
          return instruction;
        })();
      `)
      
      const instruction = await executeCode(
        createContract, closeContract, acceptRental, cancelRental, closeRental, resetRental,
        { publicKey, connected, sendTransaction },
        PublicKey,
        logToDebug
      )
      
      logToDebug('✅ SDK call successful, instruction generated')
      logToDebug('📋 Instruction data: ' + JSON.stringify(instruction, null, 2))
      
      setTransactionResult({
        type: 'success',
        content: `
          <h3>🎉 ${operationType} Executed Successfully!</h3>
          <p>The SDK function was executed from your edited code.</p>
          <p>Instruction generated successfully - check logs for details.</p>
        `
      })

    } catch (error: any) {
      console.error(`${operationType} failed:`, error)
      logToDebug(`❌ Error: ${error.message}`)
      
      // Show error directly in code editor instead of toast
      setCodeEditorError(error.message)
      
    } finally {
      setOperationLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto pl-4 pr-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">SRSLY</h1>
              <div className="ml-4 hidden sm:block">
                <div className="text-xs text-muted-foreground">SDK Demo</div>
                <div className="text-xs text-muted-foreground">Devnet • v2.0.0-beta.46</div>
              </div>
            </div>
            
            {/* Wallet Connection */}
            <div className="flex flex-col items-end gap-2">
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !text-primary-foreground !h-8 !px-3 !text-sm !rounded-md !font-medium" />
              
              {connected && publicKey && (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Network:</span>
                  <div className="relative network-dropdown">
                    <Button
                      onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs flex items-center gap-1.5 bg-card hover:bg-muted"
                    >
                      {networkOptions.find(n => n.value === selectedNetwork)?.label || 'Devnet'}
                      <span className="text-xs opacity-60 transition-transform duration-200">▼</span>
                    </Button>
                    
                    {showNetworkDropdown && (
                      <div className="absolute right-0 top-8 bg-card border border-border rounded-md shadow-lg z-50 min-w-[200px]">
                        {networkOptions.map((network) => (
                          <div key={network.value}>
                            <button
                              onClick={() => {
                                setSelectedNetwork(network.value)
                                if (network.value !== 'custom') {
                                  setShowNetworkDropdown(false)
                                  logToDebug(`🔄 Network changed to: ${network.label}`)
                                  logToDebug(`🌐 RPC URL: ${network.url}`)
                                  setRpcInfo(`🌐 RPC: ${network.url}`)
                                }
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                            >
                              {network.label}
                            </button>
                            {network.value === 'custom' && selectedNetwork === 'custom' && (
                              <div className="px-3 py-2 border-t border-border">
                                <Input
                                  value={customRpcUrl}
                                  onChange={(e) => setCustomRpcUrl(e.target.value)}
                                  placeholder="Enter custom RPC URL"
                                  className="text-xs h-6 mb-2"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex gap-1">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (customRpcUrl.trim()) {
                                        logToDebug(`🔄 Custom RPC URL set: ${customRpcUrl}`)
                                        setRpcInfo(`🌐 RPC: ${customRpcUrl} (custom)`)
                                      }
                                      setShowNetworkDropdown(false)
                                    }}
                                    size="sm"
                                    className="h-5 px-2 text-xs flex-1"
                                  >
                                    Set
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowNetworkDropdown(false)
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="h-5 px-2 text-xs flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {connectionStatus.connected && connectionStatus.responseTime && (
                    <div className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                      ✓ {connectionStatus.responseTime}ms
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile wallet info */}
          {connected && publicKey && (
            <div className="mt-2 md:hidden flex justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Network:</span>
                  <div className="relative network-dropdown">
                    <Button
                      onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs flex items-center gap-1.5 bg-card hover:bg-muted"
                    >
                      {networkOptions.find(n => n.value === selectedNetwork)?.label || 'Devnet'}
                      <span className="text-xs opacity-60 transition-transform duration-200">▼</span>
                    </Button>
                  
                  {showNetworkDropdown && (
                    <div className="absolute right-0 top-8 bg-card border border-border rounded-md shadow-lg z-50 min-w-[250px]">
                      {networkOptions.map((network) => (
                        <div key={network.value}>
                          <button
                            onClick={() => {
                              setSelectedNetwork(network.value)
                              if (network.value !== 'custom') {
                                setShowNetworkDropdown(false)
                                logToDebug(`🔄 Network changed to: ${network.label}`)
                                logToDebug(`🌐 RPC URL: ${network.url}`)
                                setRpcInfo(`🌐 RPC: ${network.url}`)
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                          >
                            {network.label}
                          </button>
                          {network.value === 'custom' && selectedNetwork === 'custom' && (
                            <div className="px-3 py-2 border-t border-border">
                              <Input
                                value={customRpcUrl}
                                onChange={(e) => setCustomRpcUrl(e.target.value)}
                                placeholder="Enter custom RPC URL"
                                className="text-xs h-6 mb-2"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex gap-1">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (customRpcUrl.trim()) {
                                      logToDebug(`🔄 Custom RPC URL set: ${customRpcUrl}`)
                                      setRpcInfo(`🌐 RPC: ${customRpcUrl} (custom)`)
                                    }
                                    setShowNetworkDropdown(false)
                                  }}
                                  size="sm"
                                  className="h-5 px-2 text-xs flex-1"
                                >
                                  Set
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowNetworkDropdown(false)
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="h-5 px-2 text-xs flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {connectionStatus.connected && connectionStatus.responseTime && (
                  <div className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    ✓ {connectionStatus.responseTime}ms
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Main Content */}
        <div className="space-y-6">

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Contract Operations (Owner) Column */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">📄 Contract Operations (Owner)</h2>
                  
                  {/* Wallet Selection for Contracts */}
                  <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="contract-connected-wallet"
                        checked={contractUseConnectedWallet}
                        onChange={(e) => setContractUseConnectedWallet(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="contract-connected-wallet" className="text-sm">
                        Use connected wallet ({connected ? publicKey?.toString().slice(0, 8) + '...' : 'None'})
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="contract-private-key"
                        checked={!contractUseConnectedWallet}
                        onChange={(e) => setContractUseConnectedWallet(!e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="contract-private-key" className="text-sm">
                        Use private key
                      </label>
                      {!contractUseConnectedWallet && (
                        <Button
                          onClick={() => setShowContractKeyInput(!showContractKeyInput)}
                          variant="outline"
                          size="sm"
                          className="ml-2"
                        >
                          {showContractKeyInput ? 'Hide' : 'Import'}
                        </Button>
                      )}
                    </div>
                    
                    {!contractUseConnectedWallet && showContractKeyInput && (
                      <div className="mt-2">
                        <Input
                          type="password"
                          placeholder="Enter private key (base58)"
                          value={contractPrivateKey}
                          onChange={(e) => setContractPrivateKey(e.target.value)}
                          className="text-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Private key will be used for contract operations
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Operation Tabs */}
                  <div className="border-b border-border mb-4">
                    <nav className="flex gap-2">
                      <button
                        onClick={() => setActiveOperation('createContract')}
                        className={`px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                          activeOperation === 'createContract' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Create Contract
                      </button>
                      <button
                        onClick={() => setActiveOperation('closeContract')}
                        className={`px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                          activeOperation === 'closeContract' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Close Contract
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Code Block and Test Area */}
                <div className="space-y-4">
                  {activeOperation === 'createContract' && (
                    <div>
                      <SDKCodeEditor
                        initialCode={createContractCode}
                        onChange={(code) => {
                          setCreateContractCode(code)
                          setCodeEditorError('') // Clear error when user edits
                        }}
                        error={codeEditorError}
                        className="mb-4"
                      />
                      
                      <div className="mt-4">
                        <Button 
                          onClick={() => handleTransactionSubmit('createContract', createContractCode)}
                          disabled={!connected}
                          className="w-full"
                        >
                          Submit Transaction
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {activeOperation === 'closeContract' && (
                    <div>
                      <LiveProvider
                        code={`// Close an existing contract
const instruction = await closeContract({
  owner: wallet.publicKey?.toBase58() || "YOUR_WALLET_ADDRESS",
  contract: "CONTRACT_ADDRESS" // Replace with actual contract address
});`}
                        scope={liveScope}
                        noInline
                      >
                        <div className="border border-border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 border-b border-border p-3">
                            <h4 className="text-sm font-medium">Interactive Code - Edit and Execute</h4>
                          </div>
                          <LiveEditor className="font-mono text-sm" />
                          <div className="border-t border-border p-3 bg-muted/30">
                            <LivePreview />
                            <LiveError className="text-red-400 text-sm mt-2" />
                          </div>
                        </div>
                      </LiveProvider>
                    </div>
                  )}
                  
                  {!activeOperation && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <h4 className="font-medium">Ready to go!</h4>
                        <p>Select an operation tab above to get started</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rental Operations Column */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">🏠 Rental Operations</h2>
                  
                  {/* Wallet Selection for Rentals */}
                  <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="rental-connected-wallet"
                        checked={rentalUseConnectedWallet}
                        onChange={(e) => setRentalUseConnectedWallet(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="rental-connected-wallet" className="text-sm">
                        Use connected wallet ({connected ? publicKey?.toString().slice(0, 8) + '...' : 'None'})
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="rental-private-key"
                        checked={!rentalUseConnectedWallet}
                        onChange={(e) => setRentalUseConnectedWallet(!e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="rental-private-key" className="text-sm">
                        Use private key
                      </label>
                      {!rentalUseConnectedWallet && (
                        <Button
                          onClick={() => setShowRentalKeyInput(!showRentalKeyInput)}
                          variant="outline"
                          size="sm"
                          className="ml-2"
                        >
                          {showRentalKeyInput ? 'Hide' : 'Import'}
                        </Button>
                      )}
                    </div>
                    
                    {!rentalUseConnectedWallet && showRentalKeyInput && (
                      <div className="mt-2">
                        <Input
                          type="password"
                          placeholder="Enter private key (base58)"
                          value={rentalPrivateKey}
                          onChange={(e) => setRentalPrivateKey(e.target.value)}
                          className="text-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Private key will be used for rental operations
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Operation Tabs */}
                  <div className="border-b border-border mb-4">
                    <nav className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setActiveOperation('acceptRental')}
                        className={`px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                          activeOperation === 'acceptRental' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Accept Rental
                      </button>
                      <button
                        onClick={() => setActiveOperation('cancelRental')}
                        className={`px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                          activeOperation === 'cancelRental' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Cancel Rental
                      </button>
                      <button
                        onClick={() => setActiveOperation('closeRental')}
                        className={`px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                          activeOperation === 'closeRental' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Close Rental
                      </button>
                      <button
                        onClick={() => setActiveOperation('resetRental')}
                        className={`px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                          activeOperation === 'resetRental' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Reset Rental
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Code Block and Test Area */}
                <div className="space-y-4">
                  {activeOperation === 'acceptRental' && (
                    <div>
                      <LiveProvider
                        code={`// Accept a rental from an existing contract
const instruction = await acceptRental({
  borrower: wallet.publicKey?.toBase58() || "YOUR_WALLET_ADDRESS",
  borrowerProfile: "BORROWER_PROFILE_ADDRESS", // Replace with actual profile
  borrowerFaction: "BORROWER_FACTION_ADDRESS", // Replace with actual faction
  contract: "CONTRACT_ADDRESS", // Replace with actual contract
  duration: 3600 // Duration in seconds (1 hour)
});`}
                        scope={liveScope}
                        noInline
                      >
                        <div className="border border-border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 border-b border-border p-3">
                            <h4 className="text-sm font-medium">Interactive Code - Edit and Execute</h4>
                          </div>
                          <LiveEditor className="font-mono text-sm" />
                          <div className="border-t border-border p-3 bg-muted/30">
                            <LivePreview />
                            <LiveError className="text-red-400 text-sm mt-2" />
                          </div>
                        </div>
                      </LiveProvider>
                    </div>
                  )}
                  
                  {activeOperation === 'cancelRental' && (
                    <div>
                      <LiveProvider
                        code={`// Cancel an active rental
const instruction = await cancelRental({
  borrower: wallet.publicKey?.toBase58() || "YOUR_WALLET_ADDRESS",
  rental: "RENTAL_ADDRESS" // Replace with actual rental address
});`}
                        scope={liveScope}
                        noInline
                      >
                        <div className="border border-border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 border-b border-border p-3">
                            <h4 className="text-sm font-medium">Interactive Code - Edit and Execute</h4>
                          </div>
                          <LiveEditor className="font-mono text-sm" />
                          <div className="border-t border-border p-3 bg-muted/30">
                            <LivePreview />
                            <LiveError className="text-red-400 text-sm mt-2" />
                          </div>
                        </div>
                      </LiveProvider>
                    </div>
                  )}
                  
                  {activeOperation === 'closeRental' && (
                    <div>
                      <LiveProvider
                        code={`// Close/complete an active rental
const instruction = await closeRental({
  borrower: wallet.publicKey?.toBase58() || "YOUR_WALLET_ADDRESS",
  rental: "RENTAL_ADDRESS" // Replace with actual rental address
});`}
                        scope={liveScope}
                        noInline
                      >
                        <div className="border border-border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 border-b border-border p-3">
                            <h4 className="text-sm font-medium">Interactive Code - Edit and Execute</h4>
                          </div>
                          <LiveEditor className="font-mono text-sm" />
                          <div className="border-t border-border p-3 bg-muted/30">
                            <LivePreview />
                            <LiveError className="text-red-400 text-sm mt-2" />
                          </div>
                        </div>
                      </LiveProvider>
                    </div>
                  )}
                  
                  {activeOperation === 'resetRental' && (
                    <div>
                      <LiveProvider
                        code={`// Reset a rental to initial state
const instruction = await resetRental({
  borrower: wallet.publicKey?.toBase58() || "YOUR_WALLET_ADDRESS", 
  rental: "RENTAL_ADDRESS" // Replace with actual rental address
});`}
                        scope={liveScope}
                        noInline
                      >
                        <div className="border border-border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 border-b border-border p-3">
                            <h4 className="text-sm font-medium">Interactive Code - Edit and Execute</h4>
                          </div>
                          <LiveEditor className="font-mono text-sm" />
                          <div className="border-t border-border p-3 bg-muted/30">
                            <LivePreview />
                            <LiveError className="text-red-400 text-sm mt-2" />
                          </div>
                        </div>
                      </LiveProvider>
                    </div>
                  )}
                  
                  {!activeOperation && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <h4 className="font-medium">Ready to go!</h4>
                        <p>Select an operation tab above to get started</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Transaction Results */}
          {transactionResult.type && (
            <div className={`border rounded-lg p-4 ${
              transactionResult.type === 'success' 
                ? 'border-green-200 bg-green-50 text-green-800' 
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: transactionResult.content }} />
            </div>
          )}

        </div>
      </div>

      {/* Logs Panel - Bottom Horizontal with Integrated Toggle */}
      <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border transition-transform duration-300 z-50 shadow-2xl ${
        logsPanelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-2.25rem)]'
      }`}>
        <div className="flex flex-col h-80">
          {/* Toggle Button Bar */}
          <div className="flex items-center justify-end px-3 py-1 border-b border-border bg-card">
            <Button
              onClick={() => setLogsPanelOpen(!logsPanelOpen)}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 hover:bg-muted h-8 px-2"
            >
              📋
              {debugLogs.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {debugLogs.length}
                </span>
              )}
              <span className="text-xs">
                {logsPanelOpen ? '▼' : '▲'}
              </span>
            </Button>
          </div>
          
          {/* Logs Content */}
          <div 
            ref={debugOutputRef}
            className="debug-output relative flex-1 overflow-y-auto"
          >
            {debugLogs.map((log, index) => (
              <div key={index}>
                [{log.timestamp}] {log.message}
                {log.data && (
                  <div>{JSON.stringify(log.data, null, 2)}</div>
                )}
              </div>
            ))}
            {debugLogs.length === 0 && (
              <div className="text-muted-foreground text-sm p-4">
                Logs will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Extend window object for TypeScript
declare global {
  interface Window {
    solana?: any
    phantom?: any
    backpack?: any
    solflare?: any
    solanaWeb3?: any
  }
}