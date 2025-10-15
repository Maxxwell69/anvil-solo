# ☁️ Anvil Solo - Cloud Services Setup Guide

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           USER'S COMPUTER (Desktop App)             │
│  ┌──────────────────────────────────────────────┐  │
│  │  Anvil Solo (Electron)                       │  │
│  │  - Wallet Management (🔐 Private Keys)       │  │
│  │  - UI & User Experience                      │  │
│  │  - Transaction Signing                       │  │
│  └──────────────────────┬───────────────────────┘  │
└─────────────────────────┼───────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────┐
│         RAILWAY CLOUD (Cloud Services)              │
│  ┌──────────────────────────────────────────────┐  │
│  │  Cloud API Service                           │  │
│  │  - License Validation ✅                     │  │
│  │  - Strategy Execution ⚙️                     │  │
│  │  - Data Storage 💾                           │  │
│  │  - NO Wallets ❌                             │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 🔒 Security Model:
- **Desktop App:** Holds all private keys (encrypted locally)
- **Cloud Service:** Only stores strategy configs and trade data
- **Communication:** HTTPS with license authentication
- **Keys:** NEVER leave user's computer

---

## 📂 What Was Created

### Cloud Service (`cloud-services/`)
```
cloud-services/
├── src/
│   ├── index.ts              # Main server
│   ├── database/
│   │   └── init.ts          # Database schema
│   ├── routes/
│   │   ├── license.ts       # License API
│   │   ├── strategy.ts      # Strategy API
│   │   └── data.ts          # Data storage API
│   └── middleware/
│       └── auth.ts          # Authentication
├── package.json
├── tsconfig.json
├── railway.json             # Railway config
├── nixpacks.toml           # Build config
└── README.md               # API documentation
```

### Desktop App Integration (`anvil-solo/src/main/cloud/`)
```
anvil-solo/src/main/cloud/
└── client.ts               # Cloud API client
```

---

## 🚀 Quick Start

### Step 1: Install Cloud Service Dependencies
```powershell
cd cloud-services
npm install
```

### Step 2: Test Locally
```powershell
# Create env file
copy env.example .env

# Edit .env with your values
# Then start:
npm run dev
```

Server runs on: http://localhost:3000

### Step 3: Deploy to Railway

#### Option A: Using Railway CLI (Recommended)
```powershell
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd cloud-services
railway init
railway up
```

#### Option B: Using Railway Website
1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo: `Maxxwell69/anvil-solo`
4. Set root directory: `cloud-services`
5. Add environment variables
6. Deploy!

### Step 4: Configure Desktop App
```powershell
cd anvil-solo

# Update with your Railway URL
# Edit src/main/config or use environment variable
```

---

## 🔑 Environment Variables for Railway

### Required:
```bash
PORT=3000
NODE_ENV=production
ADMIN_KEY=your_secure_admin_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Optional:
```bash
ALLOWED_ORIGINS=https://yourdomain.com
DATABASE_PATH=./data/anvil-cloud.db
```

### Generate Secure Keys:
```powershell
# Admin key
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 📡 API Endpoints

### License API
- `POST /api/license/activate` - Activate license
- `POST /api/license/validate` - Validate license
- `POST /api/license/generate` - Generate license (admin)
- `POST /api/license/deactivate` - Deactivate license (admin)

### Strategy API
- `POST /api/strategy/create` - Create cloud strategy
- `GET /api/strategy/list` - List all strategies
- `GET /api/strategy/:id` - Get strategy details
- `POST /api/strategy/:id/toggle` - Pause/resume strategy
- `DELETE /api/strategy/:id` - Delete strategy

### Data API
- `POST /api/data/settings` - Save user settings
- `GET /api/data/settings` - Get user settings
- `GET /api/data/trades` - Get trade history
- `POST /api/data/trade` - Record trade
- `GET /api/data/analytics` - Get analytics

### Health Check
- `GET /health` - Service health status

---

## 💻 How Desktop App Uses Cloud

### 1. License Validation (On Startup)
```typescript
// Desktop app checks license with cloud
const client = getCloudClient({ 
  apiUrl: 'https://your-app.railway.app' 
});

await client.init();
const validation = await client.validateLicense();

if (!validation.valid) {
  // Show license activation screen
}
```

### 2. Cloud Strategy Creation (User Choice)
```typescript
// User can choose: run locally OR in cloud
const strategy = {
  type: 'dca',
  token: 'TokenAddress',
  config: { totalAmount: 1.0, orders: 10 }
};

if (runInCloud) {
  // Create in cloud
  await client.createCloudStrategy(
    strategy.type, 
    strategy.token, 
    strategy.config
  );
} else {
  // Run locally (existing code)
  localStrategyManager.create(strategy);
}
```

### 3. Data Sync (Background)
```typescript
// Periodically sync data to cloud
setInterval(async () => {
  await client.saveSettings(settings, preferences);
  const history = await client.getTradeHistory();
}, 60000); // Every minute
```

---

## 🎨 UI Changes Needed

Add to desktop app settings:

### License Tab
- Input field for license key
- Activate button
- Show license tier and limits
- Show activation status

### Strategy Creation
- Checkbox: "☁️ Run in cloud" 
- If checked: creates in Railway
- If unchecked: runs locally

### Settings
- Cloud API URL configuration
- Enable/disable cloud sync
- View cloud strategy status

---

## 💰 License Tiers

### Starter - $299
```json
{
  "tier": "starter",
  "maxStrategies": 3,
  "maxWallets": 3
}
```

### Pro - $699
```json
{
  "tier": "pro",
  "maxStrategies": 10,
  "maxWallets": 10
}
```

### Enterprise - $1,999
```json
{
  "tier": "enterprise",
  "maxStrategies": 999,
  "maxWallets": 999
}
```

---

## 🔄 Workflow

### First Time User:
1. Download Anvil Solo
2. Open app → See license screen
3. Enter license key
4. App validates with Railway
5. License activated → App unlocks
6. User can now create strategies

### Creating Cloud Strategy:
1. User clicks "New Strategy"
2. Selects "☁️ Run in Cloud"
3. Configures strategy
4. Desktop app sends config to Railway
5. Railway executes strategy
6. Results synced back to desktop app

### Benefits of Cloud Execution:
- ✅ Computer doesn't need to stay on
- ✅ Strategies run 24/7
- ✅ Lower resource usage locally
- ✅ Multiple devices can view same strategies

---

## 🛠️ Implementation Checklist

### Cloud Service (Railway):
- ✅ License validation API
- ✅ Strategy management API
- ✅ Data storage API
- ✅ Database schema
- ✅ Authentication middleware
- ✅ Rate limiting
- ✅ Security headers

### Desktop App Updates Needed:
- [ ] Add cloud client (`src/main/cloud/client.ts` - CREATED!)
- [ ] Add license activation UI
- [ ] Add "run in cloud" option to strategy forms
- [ ] Add cloud sync indicator
- [ ] Add settings for cloud API URL
- [ ] Update package.json with node-fetch dependency

### Testing:
- [ ] Test license activation
- [ ] Test cloud strategy creation
- [ ] Test data sync
- [ ] Test offline mode (fallback to local)

---

## 🚀 Deployment Steps

### 1. Deploy to Railway
```powershell
cd cloud-services
npm install
railway login
railway init
railway variables set ADMIN_KEY=your_key
railway up
```

### 2. Note Your Railway URL
```
https://anvil-cloud-services.railway.app
```

### 3. Generate Test License
```powershell
$headers = @{
  "x-admin-key" = "your_admin_key"
  "Content-Type" = "application/json"
}

$body = @{
  tier = "pro"
  email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-app.railway.app/api/license/generate" `
  -Method POST -Headers $headers -Body $body
```

### 4. Update Desktop App
```typescript
// In anvil-solo/src/main/config.ts
export const cloudConfig = {
  apiUrl: 'https://your-app.railway.app'
};
```

### 5. Test Integration
- Build desktop app
- Enter license key
- Create cloud strategy
- Verify it appears in Railway database

---

## 📊 Monitoring

### Railway Dashboard
- **Logs:** Real-time service logs
- **Metrics:** CPU, memory, requests
- **Database:** SQLite file in persistent volume
- **Deployments:** View all deployments

### Health Check
```bash
curl https://your-app.railway.app/health
```

---

## ⚠️ Important Notes

### What Cloud Service Does:
- ✅ Validates licenses
- ✅ Stores strategy configurations
- ✅ Records trade history
- ✅ Syncs settings across devices

### What Cloud Service NEVER Does:
- ❌ **Never** stores private keys
- ❌ **Never** stores wallet seeds  
- ❌ **Never** executes transactions (desktop app does this)
- ❌ **Never** has access to user funds

### Data Flow:
1. **Desktop App:** Signs and sends transactions
2. **Desktop App:** Reports results to cloud
3. **Cloud:** Stores data for analytics
4. **Cloud:** Coordinates strategy timing
5. **Desktop App:** Executes based on cloud schedule

---

## 🎯 Next Steps

1. **Deploy cloud service to Railway** ✅ Created
2. **Update desktop app with cloud client** ✅ Created
3. **Add license UI to desktop app** (TODO)
4. **Test end-to-end** (TODO)
5. **Set up payment processing** (Stripe/Gumroad)
6. **Launch!** 🚀

---

## 📞 Support

- Railway: https://railway.app/help
- Cloud Services Docs: See `cloud-services/README.md`
- Desktop App Docs: See `anvil-solo/START_HERE.md`

---

**Your cloud backend is ready to deploy!** 🎉






