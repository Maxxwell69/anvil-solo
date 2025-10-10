# 🤖 Anvil Bot v3.0 - Solana Trading Bot with Referral System

<div align="center">

![Status](https://img.shields.io/badge/Status-Development-yellow)
![Security](https://img.shields.io/badge/Security-4%2F10-red)
![License](https://img.shields.io/badge/License-Review_Required-blue)

**A sophisticated Telegram bot for automated Solana token trading with built-in referral system**

[Documentation](#documentation) •
[Features](#features) •
[Setup](#quick-setup) •
[Security](#security-status) •
[Contributing](#contributing)

</div>

---

## 📋 Overview

Anvil Bot is a production-grade Telegram bot that enables automated cryptocurrency trading on the Solana blockchain. It includes a comprehensive referral/affiliate system, admin dashboard, and enterprise-ready infrastructure.

### 🎯 Key Capabilities

- 🤖 **Telegram Bot** - User-friendly interface for trading
- 💱 **Automated Swaps** - Raydium & Pump.fun integration  
- 🎁 **Referral System** - Fully integrated affiliate program
- 📊 **Admin Dashboard** - React-based management interface
- 🔐 **Wallet Management** - Secure multi-wallet support
- 💰 **Fee Distribution** - Real-time earnings distribution
- ☸️ **Kubernetes Ready** - Production deployment with Helm

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Telegram Users                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   Bot Service  │ ◄─── Telegram Bot API
         │   (Node.js)    │
         └────────┬───────┘
                  │
          ┌───────┴────────┐
          │   RabbitMQ     │ ◄─── Message Queue
          └───────┬────────┘
                  │
         ┌────────▼───────┐
         │  Swap Service  │ ◄─── Solana Blockchain
         │   (Node.js)    │
         └────────┬───────┘
                  │
          ┌───────▼────────┐
          │    MongoDB     │ ◄─── Database
          └────────────────┘
                  ▲
                  │
         ┌────────┴───────┐
         │ Admin Service  │
         │   (Express)    │
         └────────┬───────┘
                  ▲
         ┌────────┴───────┐
         │     React      │
         │   Dashboard    │
         └────────────────┘
```

---

## ⚡ Features

### Core Trading Features
- ✅ Token swapping on Raydium DEX
- ✅ Pump.fun meme token support
- ✅ Configurable slippage (default 5%)
- ✅ Priority fees for faster execution
- ✅ Multi-wallet batch transactions
- ✅ Automatic retry mechanism (max 3 attempts)

### Referral/Affiliate System
- ✅ **Automatic Code Generation** - Unique codes per user
- ✅ **Real-time Fee Distribution** - SOL sent during swaps
- ✅ **Admin Controls** - Configure percentages per user
- ✅ **Database Tracking** - Complete referral relationships
- ✅ **Default Fee:** 30% of swap fees to referrer
- ✅ **Wallet Management** - Users set their earnings wallet

### Security Features
- ✅ AES-256-GCM encryption for private keys
- ✅ Secure IV generation
- ✅ Authentication tags for data integrity
- ✅ Environment-based secrets management
- ✅ Kubernetes secrets integration

### Admin Features
- User management
- Token configuration
- Trade monitoring
- Fee adjustments
- Referral management
- Balance checking
- System analytics

---

## 🚀 Quick Setup

### Prerequisites
```bash
Node.js 16+
MongoDB
RabbitMQ
Solana Wallet
Telegram Bot Token
```

### Installation

```bash
# Clone repository
git clone https://github.com/Maxxwell69/anvil3.0.git
cd anvil3.0

# Install bot service
cd bot
npm install

# Install swap service
cd ../swap
npm install

# Install admin dashboard
cd ../apps/admin-dashboard
npm install
```

### Configuration

1. **Get Telegram Bot Token**
   - Message @BotFather on Telegram
   - Create new bot with `/newbot`
   - Copy the token

2. **Create Configuration Files**
```bash
# Bot config
cp bot/src/config.example.json bot/src/config.json

# Swap config
cp swap/src/config.example.json swap/src/config.json

# Edit both files with your credentials
```

3. **Set Environment Variables**
```bash
export TG_BOT_TOKEN="your_bot_token"
export MONGODB_URL="mongodb://localhost:27017/anvil_bot_db"
export RABBITMQ_URL="amqp://localhost:5672"
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export ENCRYPTION_SALT="your_32_character_random_string"
```

4. **Start Services**
```bash
# Terminal 1 - Start MongoDB & RabbitMQ
cd bot
docker-compose up -d

# Terminal 2 - Start Bot
cd bot
npm run dev

# Terminal 3 - Start Swap Service
cd swap
npm run dev

# Terminal 4 - Start Admin Dashboard
cd apps/admin-dashboard
npm start
```

5. **Test Bot**
   - Open Telegram
   - Send `/start` to your bot
   - Send `/referral` to test referral system

---

## 🔒 Security Status

### Current Score: 4/10 ⚠️

| Area | Score | Status |
|------|-------|--------|
| Authentication | 1/10 | 🔴 Critical |
| Authorization | 1/10 | 🔴 Critical |
| Input Validation | 3/10 | 🟡 Medium |
| Secrets Management | 2/10 | 🟡 Medium |
| Encryption | 8/10 | ✅ Good |
| Infrastructure | 7/10 | ✅ Good |

### 🚨 Critical Issues (Fix Before Production)

1. **No Authentication Middleware**
   - Admin API routes are completely unprotected
   - Anyone can access sensitive endpoints
   - **Fix:** Implement JWT middleware

2. **Hardcoded Credentials**
   - Admin credentials in plain text
   - **Fix:** Use environment variables + bcrypt

3. **Overly Permissive CORS**
   - Allows all origins (`origin: "*"`)
   - **Fix:** Whitelist specific domains

4. **Sensitive Data in Logs**
   - Private keys logged to console
   - **Fix:** Implement proper logging with redaction

5. **Insufficient Rate Limiting**
   - Basic throttling only on swaps
   - **Fix:** Add express-rate-limit to all endpoints

6. **Basic Input Validation**
   - Minimal validation on user inputs
   - **Fix:** Implement Joi or express-validator

### ✅ Security Strengths

- ✅ Good encryption implementation (AES-256-GCM)
- ✅ Mongoose ODM (NoSQL injection protection)
- ✅ Kubernetes secrets management
- ✅ Environment variable configuration
- ✅ Docker container isolation

---

## 📚 Documentation

### Main Documentation
- **[Complete Project Summary](./ANVIL_BOT_PROJECT_SUMMARY.md)** - Comprehensive guide (12,000+ words)
- **[Quick Start Prompt](./QUICK_START_PROMPT.txt)** - AI agent instructions
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Kubernetes deployment

### Key Sections
- [Configuration Requirements](./ANVIL_BOT_PROJECT_SUMMARY.md#configuration-requirements)
- [Security Analysis](./ANVIL_BOT_PROJECT_SUMMARY.md#security-analysis)
- [Referral System Details](./ANVIL_BOT_PROJECT_SUMMARY.md#features--capabilities)
- [Troubleshooting Guide](./ANVIL_BOT_PROJECT_SUMMARY.md#troubleshooting)

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Total Files | 262 |
| Lines of Code | 73,531+ |
| Dependencies | 2,500+ packages |
| Services | 5 microservices |
| Languages | TypeScript, JavaScript |
| Docker Images | 3 |

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Bot:** node-telegram-bot-api
- **Blockchain:** @solana/web3.js, Raydium SDK
- **Queue:** RabbitMQ (amqplib)
- **Database:** MongoDB (Mongoose)
- **API:** Express.js
- **Auth:** JWT

### Frontend
- **Framework:** React 18
- **State:** Redux Toolkit
- **Routing:** React Router
- **Styling:** CSS/SCSS
- **HTTP:** Axios

### DevOps
- **Containers:** Docker
- **Orchestration:** Kubernetes
- **Package Manager:** Helm
- **CI/CD:** GitHub Actions ready

---

## 🔄 Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run dev

# Build and verify
npm run build

# Commit and push
git add .
git commit -m "feat: description"
git push origin feature/your-feature

# Create Pull Request on GitHub
```

---

## ⚠️ Important Warnings

### DO NOT:
- ❌ Deploy without fixing authentication
- ❌ Commit `config.json` or `.env` files
- ❌ Use example credentials in production
- ❌ Expose private keys in logs
- ❌ Skip security hardening
- ❌ Use `origin: "*"` in production

### ALWAYS:
- ✅ Test in development first
- ✅ Use environment variables for secrets
- ✅ Implement error handling
- ✅ Monitor logs and metrics
- ✅ Keep dependencies updated
- ✅ Backup database regularly

---

## 📝 Next Steps

### Before Production Deployment

1. **Security Fixes** (2-3 days)
   - [ ] Implement JWT authentication
   - [ ] Remove hardcoded credentials
   - [ ] Fix CORS configuration
   - [ ] Add rate limiting
   - [ ] Implement input validation
   - [ ] Clean up logging

2. **Testing** (1-2 days)
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] E2E testing
   - [ ] Load testing
   - [ ] Security testing

3. **Configuration** (1 day)
   - [ ] Set up production RPC endpoints
   - [ ] Configure MongoDB Atlas
   - [ ] Set up CloudAMQP
   - [ ] Generate secure secrets
   - [ ] Configure monitoring

4. **Deployment** (1-2 days)
   - [ ] Build Docker images
   - [ ] Push to container registry
   - [ ] Configure Kubernetes cluster
   - [ ] Deploy with Helm
   - [ ] Set up monitoring

**Estimated Time to Production:** ~1 week

---

## 🤝 Contributing

This is currently a private project. If you're a developer working on this:

1. Read the full [Project Summary](./ANVIL_BOT_PROJECT_SUMMARY.md)
2. Review [Security Issues](#security-status)
3. Create feature branch from `development`
4. Make changes with proper testing
5. Submit Pull Request with detailed description

---

## 📞 Support

### Issues
- GitHub Issues: https://github.com/Maxxwell69/anvil3.0/issues

### Resources
- [Solana Documentation](https://docs.solana.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [MongoDB Docs](https://docs.mongodb.com/)
- [RabbitMQ Docs](https://www.rabbitmq.com/documentation.html)

---

## 📄 License

Review license requirements before commercial use.

---

## 🙏 Acknowledgments

- Original project: [ShogunEX/anvil-bot](https://github.com/ShogunEX/anvil-bot)
- Solana community
- Raydium protocol
- Telegram Bot API

---

<div align="center">

**⚠️ Production Deployment Status: NOT READY**

**Security fixes required. See [Security Status](#security-status) for details.**

---

Made with ❤️ for the Solana community

</div>
