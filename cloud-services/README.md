# ☁️ Anvil Cloud Services

Cloud backend for Anvil Solo desktop app - handles license validation, strategy execution, and data storage.

## 🎯 What This Does

This service runs on Railway and provides:

1. **License Validation** - Verify user licenses
2. **Cloud Strategy Execution** - Run strategies in the cloud (no local resources)
3. **Data Storage** - Store trade history and settings

### 🔒 **IMPORTANT: NO WALLETS OR PRIVATE KEYS!**

This service does NOT:
- ❌ Store private keys
- ❌ Store wallet seeds
- ❌ Have access to user funds
- ❌ Execute transactions directly

Only the desktop app has wallet access. The cloud service just tracks data.

---

## 🚀 Quick Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 2: Create Project
```bash
cd cloud-services
railway init
```

### Step 3: Set Environment Variables
```bash
railway variables set ADMIN_KEY=your_secure_admin_key
railway variables set SOLANA_RPC_URL=your_rpc_url
railway variables set ALLOWED_ORIGINS=*
```

### Step 4: Deploy
```bash
railway up
```

---

## 📡 API Endpoints

### License Management

#### Activate License
```http
POST /api/license/activate
Content-Type: application/json

{
  "licenseKey": "ANVIL-XXXXXXXXXXXX",
  "hardwareId": "machine-id-here",
  "email": "user@example.com"
}
```

#### Validate License
```http
POST /api/license/validate
Content-Type: application/json

{
  "licenseKey": "ANVIL-XXXXXXXXXXXX",
  "hardwareId": "machine-id-here"
}
```

#### Generate License (Admin Only)
```http
POST /api/license/generate
X-Admin-Key: your_admin_key
Content-Type: application/json

{
  "tier": "starter|pro|enterprise",
  "email": "customer@example.com"
}
```

### Strategy Management

All strategy endpoints require license authentication:
```http
X-License-Key: ANVIL-XXXXXXXXXXXX
X-Hardware-Id: machine-id-here
```

#### Create Strategy
```http
POST /api/strategy/create
X-License-Key: your_key
X-Hardware-Id: your_hwid

{
  "strategyType": "dca",
  "tokenAddress": "TokenAddressHere",
  "config": {
    "totalAmount": 1.0,
    "orders": 10,
    "interval": 3600
  }
}
```

#### List Strategies
```http
GET /api/strategy/list
X-License-Key: your_key
X-Hardware-Id: your_hwid
```

#### Toggle Strategy
```http
POST /api/strategy/:id/toggle
X-License-Key: your_key
X-Hardware-Id: your_hwid
```

### Data Management

#### Save Settings
```http
POST /api/data/settings
X-License-Key: your_key
X-Hardware-Id: your_hwid

{
  "settings": { "theme": "dark" },
  "preferences": { "notifications": true }
}
```

#### Get Trade History
```http
GET /api/data/trades?limit=100&offset=0
X-License-Key: your_key
X-Hardware-Id: your_hwid
```

---

## 🗄️ Database Schema

### Tables:
- `licenses` - License keys and limits
- `strategy_executions` - Cloud-based strategies
- `trade_history` - All trades
- `user_data` - Settings and preferences
- `analytics` - Usage analytics

### Security:
- ✅ No private keys stored
- ✅ No wallet data
- ✅ License authentication required
- ✅ Hardware ID binding

---

## 🔐 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - 100 requests per 15 minutes
- **Input Validation** - Joi schemas
- **License Binding** - Hardware ID verification

---

## 💻 Local Development

```bash
npm install
npm run dev
```

Server runs on http://localhost:3000

---

## 📊 License Tiers

| Tier | Price | Max Strategies | Max Wallets |
|------|-------|----------------|-------------|
| Starter | $299 | 3 | 3 |
| Pro | $699 | 10 | 10 |
| Enterprise | $1,999 | Unlimited | Unlimited |

---

## 🌐 Environment Variables

Required for Railway:
```
PORT=3000
ADMIN_KEY=your_secure_key
SOLANA_RPC_URL=your_rpc_endpoint
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 📝 Notes

- Database is SQLite for simplicity
- Can upgrade to PostgreSQL if needed
- No wallets or keys ever stored
- Desktop app handles all transactions
- Cloud just tracks and validates

---

Built for Anvil Solo Desktop App

