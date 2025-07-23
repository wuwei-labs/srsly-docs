# SRSLY SDK Browser Demo

This is a browser-based demonstration of the SRSLY SDK's **Universal Signer Pattern**. It uses the published npm package (`@wuwei-labs/srsly@2.0.0-beta.45`) for true end-to-end testing, ensuring the SDK works correctly in browser environments exactly as users would experience it.

## 🎯 What This Tests

### Universal Signer Pattern
- **Browser Usage**: Pass string addresses to SDK functions
- **Instruction Building**: SDK creates instructions without signing capability
- **Wallet Integration**: Browser wallets handle transaction signing
- **End-to-End Flow**: Complete rental acceptance process

### Key Validation Points
1. ✅ String addresses create proper TransactionSigners internally
2. ✅ Instructions build correctly with NoopSigners
3. ✅ Borrower account is marked as `isSigner: true` in web3.js format
4. ✅ Transactions can be signed by wallet extensions
5. ✅ No "Cannot read properties of undefined" errors

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- A Solana wallet extension (Backpack, Phantom, Solflare, etc.)
- Some devnet SOL for testing

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The demo will open automatically at `http://localhost:8080`

### Production Build

```bash
# Build for production
npm run build

# Serve the built files
npx serve dist
```

## 📋 Usage Instructions

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve connection in your wallet extension
   - Your address will be displayed

2. **Fill Form**
   - **Contract Address**: Use the pre-filled test contract or enter your own
   - **Profile Address**: Enter your Star Atlas profile address
   - **Faction**: Select MUD, ONI, or Ustur
   - **Duration**: Enter rental duration in seconds (default: 1 day)

3. **Accept Rental**
   - Click "Accept Rental" button
   - SDK builds instruction using your address as a **string**
   - Wallet extension prompts you to sign the transaction
   - Transaction is submitted to devnet

4. **Monitor Debug Output**
   - Watch the debug section for detailed flow information
   - See exactly how string addresses are processed
   - Verify instruction structure and account metadata

## 🔍 What to Look For

### In Debug Output
```
[timestamp] 👤 User address (string): 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
[timestamp] 🏗️  Building instruction with string address...
[timestamp] ✅ Instruction built successfully
[timestamp] 🔄 Converting to web3.js format...
[timestamp] ✅ Borrower account found and marked as signer
[timestamp]    Address: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
[timestamp]    isSigner: true
[timestamp]    isWritable: true
```

### Success Indicators
- ✅ No "Cannot read properties of undefined" errors
- ✅ Borrower marked as signer in instruction metadata
- ✅ Transaction successfully signed by wallet
- ✅ Transaction confirmed on devnet

## 🏗️ Technical Details

### Webpack Configuration
- **Target**: `web` for browser compatibility
- **Polyfills**: Node.js modules (crypto, stream, buffer) for Solana libraries
- **Externals**: Solana Web3.js loaded from CDN for wallet compatibility
- **Source Maps**: Enabled for debugging
- **NPM Package**: Uses published `@wuwei-labs/srsly@2.0.0-beta.45` (not local build)

### SDK Integration
```javascript
// Import SDK (bundled via webpack)
const { acceptRental, setConfig } = require('@wuwei-labs/srsly');

// Configure for devnet
setConfig({ 
    programs: 'atlasnet',
    network: 'devnet'
});

// Use STRING address (browser pattern)
const instruction = await acceptRental({
    borrower: wallet.publicKey.toString(),  // String, not signer object!
    borrowerProfile: profileAddress,
    borrowerFaction: 'mud',
    contract: contractAddress,
    duration: 86400
});

// Convert to web3.js for wallet compatibility
const web3Instruction = await instruction.web3js();
const transaction = new Transaction().add(web3Instruction);

// Wallet handles signing
const signature = await wallet.sendTransaction(transaction, connection);
```

## 🔌 Supported Wallets

The demo supports multiple Solana wallet extensions:

### Backpack Wallet
```typescript
const wallet = window.backpack?.solana;
const userAddress = wallet.publicKey.toString();
```

### Phantom Wallet
```typescript
const wallet = window.phantom?.solana;
const userAddress = wallet.publicKey.toString();
```

### Solflare Wallet
```typescript
const wallet = window.solflare?.solana;
const userAddress = wallet.publicKey.toString();
```

### Generic Solana Wallet
```typescript
const wallet = window.solana;
const userAddress = wallet.publicKey.toString();
```

### Browser vs CLI Pattern
| Environment | Input Type | SDK Behavior | Signing |
|-------------|------------|--------------|---------|
| **Browser** | String Address | Creates NoopSigner | Wallet Extension |
| **CLI/Node** | Signer Object | Uses Real Signer | SDK Direct |

## 🐛 Troubleshooting

### Common Issues

**"No Solana wallet found"**
- Install Phantom, Solflare, or another Solana wallet extension
- Refresh the page after installation

**"Cannot read properties of undefined"**
- This indicates the Universal Signer fix isn't working
- Check debug output for specific error location

**"Transaction is missing signatures"**
- Wallet extension may have rejected the signing request
- Check wallet extension for error messages

**Build/Bundle Errors**
- Run `npm install` to ensure all dependencies are installed
- Try `npm run build` to see detailed webpack errors

### Debug Tips
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Monitor Network tab for failed requests
4. Use debug output section in the demo

## 📚 Related Documentation

- [Universal Signer Tests](../features/universal-signer.test.mjs)
- [Browser Usage Examples](../../examples/browser-usage.md)
- [SRSLY SDK README](../../README.md)

## 🤝 Contributing

This demo is part of the SRSLY SDK testing suite. When modifying:

1. Test both successful and error flows
2. Verify debug output is helpful for troubleshooting
3. Ensure compatibility with different wallet extensions
4. Update this README if adding new features

## 📝 License

Same as SRSLY SDK project.