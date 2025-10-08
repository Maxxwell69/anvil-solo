# ANVIL SOLO

**Standalone Solana Meme Coin Trading Bot**

A downloadable desktop application for automated trading strategies on Solana. Execute DCA, ratio trading, and volume generation on Pump.fun, Raydium, Meteora, and Token-2022 tokens.

---

## 🎯 Features

### Trading Strategies
- **DCA (Dollar Cost Averaging)** - Buy or sell tokens on a schedule (hourly, daily, custom intervals)
- **Ratio Trading** - Create trading volume with configurable buy/sell ratios while maintaining target positions
- **Bundle Trading** - Execute multiple rapid trades for volume generation using multiple wallets

### Security
- ✅ Private keys encrypted locally with AES-256-GCM
- ✅ Master password protection
- ✅ Keys never leave your computer
- ✅ HD wallet derivation for sub-wallets

### DEX Support (via Jupiter V6)
- ✅ Pump.fun (bonding curve trades)
- ✅ Raydium (AMM pools)
- ✅ Meteora (DLMM pools)
- ✅ Token-2022 standard
- ✅ Automatic best price routing

---

## 🏗️ Project Structure

```
anvil-solo/
├── src/
│   ├── main/                      # Electron main process (Node.js)
│   │   ├── main.ts                # Application entry point
│   │   ├── wallet/
│   │   │   ├── encryption.ts      # AES-256-GCM encryption
│   │   │   └── manager.ts         # Wallet operations
│   │   ├── jupiter/
│   │   │   └── client.ts          # Jupiter V6 SDK integration
│   │   ├── strategies/
│   │   │   ├── dca.ts             # DCA strategy engine
│   │   │   ├── ratio.ts           # Ratio trading engine
│   │   │   └── bundle.ts          # Bundle trading engine
│   │   ├── database/
│   │   │   └── schema.ts          # SQLite database
│   │   └── ipc/                   # IPC handlers (TODO)
│   └── renderer/                  # React UI (TODO)
│       ├── pages/
│       ├── components/
│       └── hooks/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- Solana wallet with SOL for trading

### Installation

```bash
# Clone or download the project
cd anvil-solo

# Install dependencies (already done)
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

### Building for Production

```bash
# Build for your platform
npm run package

# Executables will be in the 'release' folder
```

---

## 💻 Usage

### 1. Import or Generate Wallet

```typescript
// Supports multiple formats:
// - Base58 (Phantom export format)
// - JSON array [1,2,3,...]
// - Base64

// Via IPC (from renderer):
await window.electron.wallet.import(privateKey, password, 'Main Wallet');
```

### 2. Create a DCA Strategy

```typescript
const dcaConfig = {
  tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  direction: 'buy',
  totalAmount: 10,          // 10 SOL total
  numberOfOrders: 24,       // Split into 24 orders
  frequency: 'hourly',      // Execute every hour
  slippageBps: 100,         // 1% slippage
  priorityFeeLamports: 100000,
  maxBuyPrice: 0.000001,    // Optional price limit
};

const { strategyId } = await window.electron.strategy.dca.create(dcaConfig);
await window.electron.strategy.dca.start(strategyId);
```

### 3. Create a Ratio Trading Strategy

```typescript
const ratioConfig = {
  tokenAddress: 'TOKEN_MINT_ADDRESS',
  dailyVolumeSol: 50,       // Target 50 SOL/day volume
  buyRatio: 60,             // 60% buy
  sellRatio: 40,            // 40% sell
  tradesPerHour: 10,        // 10 trades/hour
  targetTokenBalance: 1000000,
  rebalanceThresholdPercent: 10,
  randomizeTiming: true,
  randomizeAmount: true,
  slippageBps: 100,
  priorityFeeLamports: 100000,
  useMultipleWallets: true,
};

const { strategyId } = await window.electron.strategy.ratio.create(ratioConfig);
await window.electron.strategy.ratio.start(strategyId);
```

### 4. Create a Bundle Trading Strategy

```typescript
const bundleConfig = {
  tokenAddress: 'TOKEN_MINT_ADDRESS',
  tradesPerBundle: 10,
  minutesBetweenBundles: 30,
  minTradeSizeSol: 0.1,
  maxTradeSizeSol: 1.0,
  useMultipleWallets: true,
  rotateWallets: true,
  slippageBps: 100,
  priorityFeeLamports: 100000,
  tradeSizeDistribution: 'random',
};

const { strategyId } = await window.electron.strategy.bundle.create(bundleConfig);
await window.electron.strategy.bundle.start(strategyId);
```

---

## 🔐 Security Best Practices

1. **Strong Master Password**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers
   - Store securely (password manager)

2. **Backup Your Wallet**
   - Export private key after creation
   - Store in secure location (encrypted USB, password manager)
   - Never share your private key

3. **Test with Small Amounts**
   - Start with small SOL amounts
   - Verify strategies work as expected
   - Scale up after testing

4. **Monitor Regularly**
   - Check transaction logs
   - Verify balances
   - Watch for errors

---

## 📊 Database Schema

### Wallets
- `id` - Auto-increment ID
- `encrypted_private_key` - AES-256-GCM encrypted key
- `public_key` - Wallet public address
- `derivation_path` - HD path (for derived wallets)
- `is_main` - Main wallet flag
- `label` - User-friendly name
- `created_at` - Timestamp

### Strategies
- `id` - Auto-increment ID
- `type` - 'dca', 'ratio', or 'bundle'
- `token_address` - Token mint address
- `config` - JSON configuration
- `status` - 'active', 'paused', 'stopped', 'completed'
- `progress` - JSON progress tracking
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Transactions
- `id` - Auto-increment ID
- `strategy_id` - FK to strategies
- `signature` - Solana transaction signature
- `type` - 'buy' or 'sell'
- `input_token` - Input mint address
- `output_token` - Output mint address
- `input_amount` - Amount in
- `output_amount` - Amount out
- `dex_used` - DEX name (Raydium, Pump.fun, etc.)
- `price` - Price impact
- `status` - 'pending', 'confirmed', 'failed'
- `error` - Error message (if failed)
- `timestamp` - Timestamp

---

## 🛠️ Development Status

### ✅ Completed (Phase 1-3)
- [x] Project initialization
- [x] TypeScript configuration
- [x] Database schema (SQLite)
- [x] Wallet encryption (AES-256-GCM)
- [x] Wallet manager (import, generate, unlock, derive)
- [x] Jupiter V6 integration
- [x] DCA strategy engine
- [x] Ratio trading engine
- [x] Bundle trading engine
- [x] Main Electron entry point
- [x] IPC handlers (wallet & strategies)

### 🔄 In Progress (Phase 4-5)
- [ ] React UI components
- [ ] Dashboard page
- [ ] Strategy creation forms
- [ ] Activity log display
- [ ] Settings page

### ⏳ Planned (Phase 6-7)
- [ ] License system
- [ ] Auto-update mechanism
- [ ] Electron builder configuration
- [ ] Code signing
- [ ] Distribution (Windows, Mac, Linux)
- [ ] Documentation & tutorials

---

## 🐛 Troubleshooting

### Jupiter API Errors
```
Error: Failed to get quote
```
**Solution**: Check RPC URL in settings. Use a private RPC (Helius, QuickNode) for better reliability.

### Transaction Failed
```
Error: Transaction simulation failed
```
**Solution**: Increase slippage tolerance or priority fee. Check SOL balance for gas.

### Wallet Unlock Failed
```
Error: Failed to decrypt private key
```
**Solution**: Verify password is correct. Password is case-sensitive.

---

## 📈 Performance Tips

1. **Use Private RPC**
   - Public RPCs rate limit aggressively
   - Consider Helius, QuickNode, or Triton
   - Costs ~$50-100/month but much faster

2. **Optimize Priority Fees**
   - Low: 50,000 lamports (slow)
   - Medium: 100,000 lamports (standard)
   - High: 500,000+ lamports (fast)

3. **Derived Wallets**
   - Generate 5-10 wallets for bundle/ratio trading
   - Distributes transactions across accounts
   - Reduces rate limiting

---

## 📜 License

Commercial software. All rights reserved.

---

## 🤝 Support

For support, feature requests, or bug reports:
- Email: support@anvil.trading (placeholder)
- Discord: discord.gg/anvil (placeholder)
- Twitter: @AnvilTrading (placeholder)

---

## ⚠️ Disclaimer

This software is for educational and research purposes. Trading cryptocurrencies carries risk. Only trade with funds you can afford to lose. The developers are not responsible for any financial losses.

**Use at your own risk.**

---

## 🗺️ Roadmap

### v1.0 (Current)
- Core trading strategies
- Local wallet management
- Jupiter integration

### v1.1 (Q2 2025)
- React UI
- Real-time charts
- Strategy templates

### v1.2 (Q3 2025)
- Advanced analytics
- P&L tracking
- Export reports

### v2.0 (Q4 2025)
- Cloud sync (optional)
- Mobile companion app
- API access

---

**Built with ❤️ for the Solana community**




