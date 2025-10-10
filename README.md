# 🖥️ Anvil Solo - Desktop Trading Bot

<div align="center">

![Status](https://img.shields.io/badge/Status-Ready-green)
![Platform](https://img.shields.io/badge/Platform-Desktop-blue)
![No Telegram](https://img.shields.io/badge/Telegram-Not_Required-red)

**A powerful desktop application for automated Solana token trading**

**NO Telegram • NO Cloud Services • 100% Local**

</div>

---

## ⚡ What is Anvil Solo?

Anvil Solo is a **desktop-only** trading bot for Solana tokens. It runs entirely on your computer with no Telegram dependency.

### ✨ Key Features

- 🖥️ **Desktop Application** - Windows, Mac, Linux
- 🔐 **Password Protected** - Your keys, encrypted locally
- 📊 **Real-time Dashboard** - Live balance and stats
- 💱 **DCA Trading** - Dollar-cost averaging strategies
- 📈 **Ratio Trading** - Volume generation with buy/sell ratios
- 📦 **Bundle Trading** - Rapid multi-trade execution
- 💰 **Multi-wallet Support** - Derived wallets for volume
- 🎨 **Beautiful UI** - Modern dark theme with purple accents

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 16+
```

### Installation & Launch

```powershell
cd anvil-solo
npm install
npm run build
npm start
```

**That's it!** The desktop app will open.

---

## 📚 Complete Documentation

Everything you need is in the `anvil-solo/` folder:

### Essential Guides
- 📖 **[START_HERE.md](./anvil-solo/START_HERE.md)** - Complete setup guide
- ⚡ **[QUICKSTART.md](./anvil-solo/QUICKSTART.md)** - Quick tutorial
- 🎨 **[UI_GUIDE.md](./anvil-solo/UI_GUIDE.md)** - User interface walkthrough
- 🚀 **[LAUNCH_SUCCESS.md](./anvil-solo/LAUNCH_SUCCESS.md)** - Feature overview
- 📘 **[README.md](./anvil-solo/README.md)** - Full documentation

---

## 🎯 What You Can Do

### 1. DCA Strategy
- Schedule automatic buys/sells
- Set custom intervals (every 5 min, hourly, daily)
- Split total amount across multiple orders
- Perfect for accumulating positions

### 2. Ratio Trading
- Generate trading volume organically
- Maintain specific buy/sell ratios (e.g., 60/40)
- Randomize trade sizes and timing
- Keep target token balance

### 3. Bundle Trading
- Execute rapid sequential trades
- Rotate through multiple wallets
- Configurable trade counts
- Great for testing or volume

### 4. Wallet Management
- Generate new Solana wallets
- Import existing wallets
- Create derived wallets (up to 10)
- View balances in real-time
- Encrypted storage

---

## 🔒 Security

### Your Keys, Your Control
- ✅ All private keys stored **locally** and encrypted
- ✅ AES-256-GCM encryption
- ✅ Password-protected access
- ✅ No cloud services
- ✅ No data sent to external servers
- ✅ Open source - audit the code yourself

### What We DON'T Do
- ❌ No Telegram integration
- ❌ No cloud storage
- ❌ No external dependencies for keys
- ❌ No user tracking
- ❌ No data collection

---

## 💻 System Requirements

### Minimum
- **OS:** Windows 10+, macOS 10.13+, Ubuntu 18.04+
- **RAM:** 4 GB
- **Storage:** 500 MB
- **Internet:** Required for blockchain RPC

### Recommended
- **RAM:** 8 GB+
- **Storage:** 1 GB+
- **Internet:** Stable connection for best performance

---

## 🛠️ Development

### Tech Stack
- **Runtime:** Electron
- **Language:** TypeScript
- **Blockchain:** Solana Web3.js
- **DEX:** Jupiter Aggregator
- **Database:** SQLite (local)
- **UI:** HTML/CSS/JavaScript

### Build Commands
```bash
npm run build      # Compile TypeScript
npm run dev        # Development mode with hot reload
npm start          # Production mode
npm run package    # Create distributable
```

---

## 📖 Learning Resources

### Documentation
- [Anvil Solo Complete Guide](./anvil-solo/START_HERE.md)
- [UI User Guide](./anvil-solo/UI_GUIDE.md)
- [Quick Start Tutorial](./anvil-solo/QUICKSTART.md)

### External
- [Solana Documentation](https://docs.solana.com/)
- [Jupiter Aggregator](https://station.jup.ag/docs)
- [Electron Docs](https://www.electronjs.org/docs)

---

## 🎯 Use Cases

Perfect for:
- 📈 **DCA Investors** - Automate your accumulation strategy
- 💹 **Volume Traders** - Generate organic trading activity
- 🎮 **Market Makers** - Maintain liquidity
- 🧪 **Token Launchers** - Test your token's trading
- 💰 **Serious Traders** - Full control, no middleman

---

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Use at your own risk. 

- Cryptocurrency trading involves risk
- Test with small amounts first
- Only invest what you can afford to lose
- Not financial advice

---

## 🤝 Contributing

This is a personal project. If you'd like to contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check the documentation in `anvil-solo/`

---

## 📄 License

Review license terms before commercial use.

---

<div align="center">

**🎉 Ready to start trading?**

```bash
cd anvil-solo && npm start
```

**Desktop-only. No Telegram. Full control.** 🚀

---

Made for serious Solana traders

</div>
