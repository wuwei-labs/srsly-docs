# CLAUDE.md - AI Assistant Guidelines for SRSLY Documentation Site

## Project Context

This is the official documentation and live demo site for the SRSLY SDK, a Solana program for fleet rentals in Star Atlas. The site serves dual purposes:

1. **Professional Documentation Site**: Using modern tools (Docusaurus, Wallet Adapter)
2. **Rigorous SDK Testing**: CommonJS + Webpack integration for dogfooding the hardest build scenario

## Architecture Overview

### **Layer 1: Docusaurus Core** (ESM/TypeScript)
- Documentation framework and static site generation
- React components for UI structure  
- Markdown processing and routing
- Modern build system with TypeScript support

### **Layer 2: Solana Wallet Adapter** (ESM/React)
- Professional wallet connection/management
- useWallet(), useConnection() hooks
- WalletMultiButton UI components
- Automatic wallet detection and state management

### **Layer 3: SRSLY SDK Bridge** (CommonJS + Webpack)
- @wuwei-labs/srsly@2.0.0-beta.46 via CommonJS imports
- Webpack bundling for browser compatibility
- Bridge between modern wallet adapter and CJS SDK
- Tests the most challenging integration scenario

## Key Dependencies & Versions

### Core Framework
- Docusaurus: ^3.8.1 (ESM/TypeScript)
- React: ^19.1.0
- TypeScript: ^5.6.3
- pnpm: Package manager (NOT npm)

### Solana Ecosystem
- @wuwei-labs/srsly: 2.0.0-beta.46 (CommonJS integration)
- @solana/wallet-adapter-react: ^0.15.39 (Modern wallet handling)
- @solana/wallet-adapter-react-ui: ^0.9.35 (UI components)
- @solana/wallet-adapter-wallets: ^0.19.32 (Wallet implementations)
- @solana/web3.js: ^1.98.2 (Solana RPC)

### Build Tools
- Webpack: ^5.100.2 (CommonJS bundling)
- Babel: For CJS transpilation
- Various polyfills: buffer, crypto-browserify, stream-browserify, etc.

## Development Workflow

### 1. SDK Integration Testing (Primary Goal)
- All SRSLY SDK operations must work via CommonJS imports
- Webpack bundles SDK for browser compatibility
- Bridge connects modern wallet adapter to CJS SDK
- Continuous validation of published beta package

### 2. Documentation Development
- Markdown files in `/docs` directory
- React components in `/src/components`
- API documentation auto-generated from types
- Code examples for both CJS and ESM usage

### 3. Deployment
- GitHub Pages via Actions workflow
- Automatic deployment on main branch push
- Custom domain support available

## Critical Architecture Patterns

### **Hybrid Integration Pattern**
```typescript
// Modern wallet management (ESM/React)
const { publicKey, sendTransaction } = useWallet();
const { connection } = useConnection();

// Bridge to CommonJS SDK
const signature = await window.SRSLYSDKBridge.executeAcceptRental(
  { publicKey, sendTransaction }, // Modern wallet adapter
  connection,                      // Modern connection  
  formData                        // Operation parameters
);
```

### **CommonJS SDK Bridge**
```javascript
// webpack bundles this to window.SRSLYSDKBridge
const { acceptRental } = require('@wuwei-labs/srsly');

window.SRSLYSDKBridge = {
  async executeAcceptRental(walletAdapter, connection, params) {
    const instruction = await acceptRental({
      borrower: walletAdapter.publicKey.toBase58(),
      ...params
    });
    // Convert and send via modern wallet adapter
  }
};
```

## File Structure

```
srsly-docs/
├── CLAUDE.md                    # This file (AI guidelines)
├── IMPLEMENTATION.md            # Detailed technical plan
├── README.md                    # Project overview
├── package.json                 # pnpm dependencies & scripts
├── pnpm-lock.yaml              # Locked dependency versions
├── docusaurus.config.ts        # Site configuration
├── webpack.sdk.config.js       # CommonJS SDK bundling
├── tsconfig.json               # TypeScript configuration
├── sidebars.ts                 # Documentation navigation
├── src/
│   ├── components/
│   │   ├── WalletProvider.tsx   # Wallet adapter setup
│   │   ├── SDKDemo.tsx         # Main demo component
│   │   └── HomepageFeatures/   # Landing page sections
│   ├── css/
│   │   └── custom.css          # Custom styling
│   └── pages/
│       └── index.tsx           # Homepage
├── sdk-integration/
│   └── cjs-bridge.js           # CommonJS SDK bridge
├── docs/                       # Documentation content
├── blog/                       # Blog posts (optional)
├── static/
│   ├── js/                     # Generated webpack bundles
│   └── img/                    # Static assets
└── .github/
    └── workflows/
        └── deploy.yml          # GitHub Pages deployment
```

## Current Implementation Status

### ✅ Completed
- [x] GitHub repository created (https://github.com/anthonyra/srsly-docs)
- [x] Docusaurus TypeScript template initialized
- [x] pnpm package manager configured
- [x] Basic project structure established
- [x] AI assistant guidelines documented (this file)

### 🚧 In Progress
- [ ] IMPLEMENTATION.md technical documentation
- [ ] Package.json dependency configuration
- [ ] Solana Wallet Adapter setup
- [ ] CommonJS SDK bridge development
- [ ] Demo component creation
- [ ] GitHub Pages deployment configuration

### 📋 Pending
- [ ] Complete SDK operations integration
- [ ] Documentation content creation
- [ ] Code examples and tutorials
- [ ] UI/UX polish
- [ ] Performance optimization
- [ ] Community features

## Command Reference

### Development Commands
```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Build for production
pnpm build

# Build SDK bridge
pnpm run build:sdk

# Serve production build locally
pnpm serve

# Clear Docusaurus cache
pnpm clear
```

### Repository Commands
```bash
# Commit and push changes
git add .
git commit -m "feat: description of changes"
git push origin main

# Deploy to GitHub Pages (automatic via Actions)
# Triggered on push to main branch
```

## Common Issues & Solutions

### Build Issues
- **Webpack polyfill errors**: Ensure all Node.js polyfills are configured
- **React hydration warnings**: Use client-side only rendering for wallet components
- **TypeScript errors**: Check type declarations for wallet extensions

### Integration Issues
- **Wallet detection fails**: Verify wallet extensions are installed and enabled
- **SDK functions undefined**: Check webpack bundle loading and window global
- **Transaction signing errors**: Validate bridge between wallet adapter and CJS SDK

### Deployment Issues
- **GitHub Pages 404**: Check base URL configuration in docusaurus.config.ts
- **Asset loading fails**: Verify static file paths and deployment URLs
- **Build fails in CI**: Ensure all dependencies and scripts are properly configured

## Emergency Recovery Procedures

### If Development Server Won't Start
1. Clear node modules: `rm -rf node_modules pnpm-lock.yaml`
2. Reinstall: `pnpm install`
3. Clear Docusaurus cache: `pnpm clear`
4. Restart: `pnpm start`

### If Wallet Integration Breaks
1. Check wallet extension installation
2. Verify wallet adapter versions compatibility
3. Test bridge function in browser console
4. Review webpack bundle loading

### If SDK Integration Fails
1. Verify @wuwei-labs/srsly@2.0.0-beta.46 installation
2. Check webpack configuration for CommonJS bundling
3. Test individual SDK functions in Node.js environment
4. Review polyfill configuration

## Next Steps for AI Assistant

When resuming work on this project:

1. **Check current todo list status** - Use TodoWrite tool to see progress
2. **Review IMPLEMENTATION.md** - Check detailed technical plan
3. **Verify dependencies** - Ensure all packages are installed correctly
4. **Test basic functionality** - Run `pnpm start` to verify Docusaurus works
5. **Continue from last completed task** - Focus on highest priority pending items

## Success Criteria

### Technical Validation
- [ ] All wallet extensions connect successfully (Phantom, Backpack, Solflare)
- [ ] All SRSLY SDK operations work via CommonJS imports
- [ ] Transactions sign and execute successfully
- [ ] Documentation site builds and deploys without errors
- [ ] Mobile responsiveness and cross-browser compatibility

### User Experience
- [ ] Professional wallet connection UX
- [ ] Clear documentation with working examples
- [ ] Copy-paste ready code snippets
- [ ] Fast loading times and smooth interactions
- [ ] Accessible design and navigation

### Dogfooding Validation
- [ ] CommonJS + Webpack integration thoroughly tested
- [ ] Published beta package (@wuwei-labs/srsly@2.0.0-beta.46) validated
- [ ] Edge cases and error conditions handled
- [ ] Performance benchmarks established
- [ ] Integration patterns documented for developers

This documentation ensures seamless continuation of the project regardless of interruptions or assistant changes.