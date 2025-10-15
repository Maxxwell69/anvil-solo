# ☁️ CLOUD SERVICES DEPLOYMENT GUIDE

## 🎯 **Complete Backend System**

Deploy your cloud infrastructure for:
1. **License Management** - Validate & manage user licenses
2. **Archive Sync** - Cloud backup of archived strategies
3. **Fee Collection Tracking** - Monitor revenue from transaction fees

---

## 🚀 **Quick Deploy to Railway (15 minutes)**

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

### **Step 2: Initialize Project**
```bash
cd anvil3.0/cloud-services
railway init
```

Choose:
- Create new project: **Anvil Cloud Services**
- Environment: **production**

### **Step 3: Add PostgreSQL Database**
```bash
railway add
```
Select: **PostgreSQL**

Railway will automatically:
- ✅ Create PostgreSQL database
- ✅ Set DATABASE_URL environment variable
- ✅ Configure connection

### **Step 4: Set Environment Variables**
```bash
# Required variables
railway variables set ADMIN_KEY=your_secure_random_key_here
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
railway variables set FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
railway variables set ALLOWED_ORIGINS=*
railway variables set NODE_ENV=production
```

### **Step 5: Deploy!**
```bash
railway up
```

Your API will be live at: `https://your-project.up.railway.app`

---

## 📡 **API Endpoints**

### **1. License Management**

#### **Activate License**
```http
POST https://your-app.up.railway.app/api/license/activate
Content-Type: application/json

{
  "licenseKey": "ANVIL-XXXXXXXXXXXX",
  "hardwareId": "user-machine-id",
  "email": "user@example.com"
}

Response:
{
  "valid": true,
  "activated": true,
  "license": {
    "tier": "pro",
    "maxStrategies": 10,
    "maxWallets": 10,
    "expiresAt": null
  }
}
```

#### **Validate License**
```http
POST https://your-app.up.railway.app/api/license/validate
Content-Type: application/json

{
  "licenseKey": "ANVIL-XXXXXXXXXXXX",
  "hardwareId": "user-machine-id"
}

Response:
{
  "valid": true,
  "license": {
    "tier": "pro",
    "maxStrategies": 10,
    "status": "active"
  }
}
```

#### **Generate License (Admin)**
```http
POST https://your-app.up.railway.app/api/license/generate
X-Admin-Key: your_admin_key
Content-Type: application/json

{
  "tier": "pro",
  "email": "customer@example.com"
}

Response:
{
  "success": true,
  "licenseKey": "ANVIL-ABC123DEF456...",
  "tier": "pro",
  "limits": {
    "maxStrategies": 10,
    "maxWallets": 10
  }
}
```

---

### **2. Archive Sync**

#### **Sync Archive to Cloud**
```http
POST https://your-app.up.railway.app/api/archive/sync
X-License-Key: ANVIL-XXXXXXXXXXXX
X-Hardware-Id: user-machine-id
Content-Type: application/json

{
  "strategyData": {
    "id": 5,
    "type": "dca",
    "token_address": "DezXAZ8...",
    "config": { ... },
    "progress": { ... },
    "archive_notes": "Completed successfully",
    "created_at": 1697234567890,
    "archived_at": 1697334567890,
    "total_volume": 5.4
  },
  "transactions": [
    {
      "signature": "4h7Ks...",
      "type": "buy",
      "input_token": "So111...",
      "output_token": "DezXA...",
      "input_amount": 0.1,
      "output_amount": 100000,
      "status": "confirmed",
      "timestamp": 1697234567890
    }
  ]
}

Response:
{
  "success": true,
  "message": "Strategy archived to cloud",
  "strategyId": 5,
  "transactionsSynced": 1
}
```

#### **List Archived Strategies**
```http
GET https://your-app.up.railway.app/api/archive/list
X-License-Key: ANVIL-XXXXXXXXXXXX
X-Hardware-Id: user-machine-id

Response:
{
  "success": true,
  "archives": [
    {
      "id": 1,
      "local_strategy_id": 5,
      "strategy_type": "dca",
      "token_address": "DezXAZ8...",
      "config": { ... },
      "progress": { ... },
      "archive_notes": "Completed successfully",
      "transaction_count": 10,
      "total_volume": 5.4,
      "synced_at": "2024-10-14T..."
    }
  ]
}
```

---

### **3. Fee Collection Tracking**

#### **Record Fee Transaction**
```http
POST https://your-app.up.railway.app/api/fees/record
Content-Type: application/json

{
  "fromWallet": "UserWallet123...",
  "toWallet": "82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd",
  "amount": 0.0005,
  "signature": "4h7KsTransactionHash...",
  "strategyId": 5,
  "strategyType": "dca",
  "timestamp": 1697234567890
}

Response:
{
  "success": true,
  "message": "Fee transaction recorded"
}
```

#### **Get Fee Statistics (Admin)**
```http
GET https://your-app.up.railway.app/api/fees/stats
X-Admin-Key: your_admin_key

Response:
{
  "success": true,
  "stats": {
    "total": {
      "total_transactions": 1234,
      "total_sol": 15.678,
      "total_usd": 3135.60
    },
    "byType": [
      { "strategy_type": "ratio", "count": 500, "total_sol": 8.2 },
      { "strategy_type": "dca", "count": 400, "total_sol": 5.1 },
      { "strategy_type": "bundle", "count": 334, "total_sol": 2.4 }
    ],
    "daily": [
      { "date": "2024-10-14", "transactions": 45, "sol": 0.567, "usd": 113.40 }
    ]
  }
}
```

#### **Verify Fee Wallet Balance (Admin)**
```http
GET https://your-app.up.railway.app/api/fees/verify-balance
X-Admin-Key: your_admin_key

Response:
{
  "success": true,
  "wallet": "82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd",
  "balance": {
    "lamports": 15678000000,
    "sol": 15.678,
    "usd": 3135.60
  },
  "timestamp": "2024-10-14T..."
}
```

---

## 💾 **Database Schema**

### **Tables Created:**

1. **licenses** - License keys and activation data
2. **strategy_executions** - Cloud-executed strategies  
3. **trade_history** - All trades across users
4. **user_data** - User settings and preferences
5. **analytics** - Usage analytics
6. **archived_strategies** - Cloud-synced archives
7. **archived_transactions** - Transactions for archives
8. **fee_collections** - All fee transactions tracked

### **Storage Requirements:**
- Small (100 users): ~50 MB
- Medium (1,000 users): ~500 MB  
- Large (10,000 users): ~5 GB

Railway provides **5GB free** on hobby plan!

---

## 💰 **Railway Pricing:**

### **Hobby Plan (Recommended for Start)**
```
Cost: $5/month
Includes:
  • 512 MB RAM
  • Shared CPU
  • 5 GB storage
  • PostgreSQL database
  • Custom domain
  • SSL certificates

Good for: 100-500 users
```

### **Pro Plan (When You Scale)**
```
Cost: $20/month
Includes:
  • 8 GB RAM
  • Dedicated CPU
  • 100 GB storage
  • Better performance
  • Priority support

Good for: 500-5,000 users
```

---

## 🔐 **Security Setup:**

### **1. Generate Secure Admin Key**
```bash
# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **2. Set Admin Key in Railway**
```bash
railway variables set ADMIN_KEY=your_generated_key_here
```

### **3. Save Admin Key Securely**
- Store in password manager
- Never commit to git
- Use for admin operations

---

## 📊 **Testing Your Deployment:**

### **Test 1: Health Check**
```bash
curl https://your-app.up.railway.app/health

Expected:
{
  "status": "ok",
  "timestamp": "2024-10-14T...",
  "service": "anvil-cloud-services",
  "version": "2.0.0"
}
```

### **Test 2: Generate Test License**
```bash
curl -X POST https://your-app.up.railway.app/api/license/generate \
  -H "X-Admin-Key: your_admin_key" \
  -H "Content-Type: application/json" \
  -d '{"tier":"pro","email":"test@example.com"}'

Expected:
{
  "success": true,
  "licenseKey": "ANVIL-...",
  "tier": "pro"
}
```

### **Test 3: Validate License**
```bash
curl -X POST https://your-app.up.railway.app/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"ANVIL-...","hardwareId":"test-123"}'

Expected:
{
  "valid": true,
  "license": { ... }
}
```

---

## 🔗 **Connect Desktop App to Cloud**

### **Update Desktop App Configuration:**

In `anvil-solo/src/main/license/manager.ts`, set:
```typescript
const LICENSE_API_URL = 'https://your-app.up.railway.app/api/license';
```

Or make it configurable in settings!

---

## 📋 **Post-Deployment Checklist:**

- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Environment variables set
- [ ] App deployed successfully
- [ ] Health check responds
- [ ] Can generate test license
- [ ] Can validate license
- [ ] Database tables created
- [ ] Indexes created
- [ ] Admin key secured

---

## 🎯 **What You'll Have:**

### **License System:**
- ✅ Generate unlimited license keys
- ✅ Validate in real-time
- ✅ Hardware ID binding
- ✅ Tier-based limits
- ✅ Expiration handling

### **Archive System:**
- ✅ Sync archived strategies to cloud
- ✅ Store all transaction data
- ✅ Retrieve from any device
- ✅ Backup and recovery

### **Fee Tracking:**
- ✅ Record all fee transactions
- ✅ Real-time statistics
- ✅ Revenue analytics
- ✅ Wallet balance verification
- ✅ Per-user fee tracking

---

## 💡 **Next Steps:**

1. **Deploy to Railway** (15 min)
2. **Generate test licenses** (2 min)
3. **Update desktop app** to use cloud URL (5 min)
4. **Test license activation** (5 min)
5. **Test archive sync** (5 min)
6. **Monitor fee collection** (ongoing)

---

## 📈 **Revenue Tracking:**

Once deployed, you can:
- See total fees collected
- Track daily/monthly revenue
- Analyze which strategies generate most fees
- Monitor active users
- Export data for accounting

---

**Ready to deploy? Just run: `railway up` from cloud-services folder!** 🚀


