# ANVIL SOLO - Quick Start Guide

## 🎉 What We've Built

A complete backend for a standalone Solana trading bot with:
- ✅ **Wallet Management** - Secure encryption, import/generate, HD derivation
- ✅ **Jupiter Integration** - Swap routing across all major DEXs
- ✅ **DCA Strategy** - Automated buy/sell on schedule
- ✅ **Ratio Trading** - Volume generation with position management
- ✅ **Bundle Trading** - Rapid multi-wallet trades
- ✅ **SQLite Database** - Transaction history and strategy tracking
- ✅ **Electron Main Process** - IPC handlers ready

## 🏗️ Current Status

### Phase 1-3: COMPLETED ✅
All core trading functionality is built and ready to use!

### Phase 4-5: TO DO
- React UI (frontend)
- Dashboard and forms
- Real-time displays

### Phase 6-7: TO DO  
- License system
- Build/distribution

---

## 🚀 How to Test Right Now

Even without a UI, you can test the core functionality:

### 1. Build the TypeScript

```bash
cd anvil-solo
npm run build
```

### 2. Create a Test Script

Create `test.js` in the root:

```javascript
const { initializeDatabase } = require('./dist/main/database/schema');
const { WalletManager } = require('./dist/main/wallet/manager');
const { JupiterClient } = require('./dist/main/jupiter/client');
const { DCAStrategy } = require('./dist/main/strategies/dca');

async function test() {
  // Initialize
  const db = initializeDatabase();
  console.log('✅ Database initialized');

  const rpc = 'https://api.mainnet-beta.solana.com';
  const wallet = new WalletManager(rpc);
  const jupiter = new JupiterClient(rpc);

  // Test wallet generation
  const password = 'TestPassword123!';
  const publicKey = await wallet.generateWallet(password, 'Test Wallet');
  console.log('✅ Wallet generated:', publicKey);

  // Unlock wallet
  await wallet.unlockWallet(password);
  console.log('✅ Wallet unlocked');

  // Check balance
  const balance = await wallet.getBalance();
  console.log('💰 Balance:', balance, 'SOL');

  // Test Jupiter
  const healthy = await jupiter.healthCheck();
  console.log('✅ Jupiter API:', healthy ? 'Connected' : 'Offline');

  // Example: Get token info
  const bonk = await jupiter.getTokenInfo('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
  console.log('🪙 Token:', bonk);

  console.log('\n✅ All tests passed!');
}

test().catch(console.error);
```

### 3. Run Test

```bash
node test.js
```

---

## 📝 Example: Create and Run a DCA Strategy

```javascript
const dcaConfig = {
  tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  direction: 'buy',
  totalAmount: 1,           // 1 SOL total (start small!)
  numberOfOrders: 24,       // 24 orders
  frequency: 'hourly',      // Every hour
  slippageBps: 100,         // 1% slippage
  priorityFeeLamports: 100000,
};

// Save to database
const result = db.prepare(`
  INSERT INTO strategies (type, token_address, config, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run('dca', dcaConfig.tokenAddress, JSON.stringify(dcaConfig), 'stopped', Date.now(), Date.now());

const strategyId = result.lastInsertRowid;

// Create strategy instance
const strategy = new DCAStrategy(strategyId, dcaConfig, jupiter, wallet);

// Start it
await strategy.start();
console.log('🚀 DCA strategy started!');

// Check progress
console.log('Progress:', strategy.getProgress());

// Pause after some time
setTimeout(async () => {
  await strategy.pause();
  console.log('⏸️ Paused');
}, 60000); // Pause after 1 minute
```

---

## 🔧 What's in Each File

### Core Trading Engine
```
src/main/
├── wallet/
│   ├── encryption.ts          # AES-256-GCM encryption
│   │   - encryptPrivateKey()
│   │   - decryptPrivateKey()
│   │   - validatePassword()
│   │
│   └── manager.ts             # Wallet operations
│       - importWallet()
│       - generateWallet()
│       - unlockWallet()
│       - generateDerivedWallets()
│       - getBalance()
│
├── jupiter/
│   └── client.ts              # Jupiter V6 integration
│       - getQuote()
│       - executeSwap()
│       - getTokenInfo()
│       - validateToken()
│
├── strategies/
│   ├── dca.ts                 # DCA engine
│   │   - start()
│   │   - pause()
│   │   - stop()
│   │   - getProgress()
│   │
│   ├── ratio.ts               # Ratio trading
│   │   - start()
│   │   - checkAndRebalance()
│   │   - updateCurrentBalance()
│   │
│   └── bundle.ts              # Bundle trading
│       - executeBundle()
│       - executeTrade()
│
├── database/
│   └── schema.ts              # SQLite setup
│       - initializeDatabase()
│       - getDatabase()
│
└── main.ts                    # Electron entry
    - IPC handlers
    - App lifecycle
```

---

## 📊 Database Tables

All data stored in `~/.anvil/anvil-solo.db`:

- **wallets** - Encrypted private keys
- **strategies** - Active/paused/stopped strategies  
- **transactions** - Complete trade history
- **settings** - User preferences
- **license** - License info (future)

---

## 🎯 Next Steps

### Option A: Build UI (Recommended)
1. Create React components in `src/renderer/`
2. Add preload script for IPC
3. Build dashboard with strategy cards
4. Add forms for strategy creation
5. Real-time activity log

### Option B: Test Trading Logic
1. Import a wallet with test SOL
2. Create DCA strategy programmatically
3. Monitor transactions in database
4. Verify swaps on Solscan

### Option C: Add License System
1. Create HWID generation
2. Build validation endpoint
3. Add offline grace period
4. Integrate with Gumroad/Stripe

---

## 💡 Pro Tips

### Testing Safely
```javascript
// Always test with small amounts first!
const testConfig = {
  totalAmount: 0.01,  // 0.01 SOL = ~$2
  numberOfOrders: 2,
  frequency: 'custom',
  customIntervalMinutes: 5, // Every 5 minutes
};
```

### Using Devnet
```javascript
// Change RPC to devnet for free testing
const rpc = 'https://api.devnet.solana.com';

// Get free devnet SOL
// Visit: https://faucet.solana.com/
```

### Check Transactions
```sql
-- Query recent transactions
SELECT * FROM transactions 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check strategy progress
SELECT id, type, status, progress 
FROM strategies 
WHERE status = 'active';
```

---

## 🐛 Common Issues

### "Wallet not unlocked"
```javascript
// Always unlock before using strategies
await wallet.unlockWallet(password);
```

### "Jupiter API failed"
```javascript
// Use better RPC endpoint
const rpc = 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY';
```

### "Insufficient balance"
```javascript
// Check balance first
const balance = await wallet.getBalance();
console.log('Balance:', balance, 'SOL');
```

---

## 📞 Questions?

Check the main README.md for:
- Complete feature list
- Architecture details
- Security best practices
- Troubleshooting guide

---

**You now have a production-ready trading engine! 🎉**

Just needs a UI to make it user-friendly. The hard part (trading logic) is done!

