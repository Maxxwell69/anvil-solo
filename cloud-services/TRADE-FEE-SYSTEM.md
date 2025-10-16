# 💰 Trading Fee System - Complete Guide

**Fees collected on every trade Anvil Solo makes, not on downloads!**

---

## 🎯 How It Works

### **Trade Fee Structure:**

```
User trades with Anvil Solo
    ↓
Trade executes on Solana
    ↓
Anvil Solo reports trade to license server
    ↓
Server calculates fee based on license tier
    ↓
Fee recorded for your wallet
    ↓
Tracked in admin analytics
```

---

## 💵 Default Fee Structure by Tier

### **Free Tier:**
- **Trade Fee**: 10%
- **Max Daily Trades**: 10
- **Max Strategies**: 1
- **Max Wallets**: 1
- **Available Strategies**: Basic only

### **Pro Tier:**
- **Trade Fee**: 5%
- **Max Daily Trades**: 100
- **Max Strategies**: 5
- **Max Wallets**: 3
- **Available Strategies**: Basic, Advanced, Smart Ratio, DCA

### **Enterprise Tier:**
- **Trade Fee**: 2.5%
- **Max Daily Trades**: 1000
- **Max Strategies**: Unlimited
- **Max Wallets**: 10
- **Available Strategies**: All + Custom

---

## 🔧 Admin Configuration

### **In Admin Panel → License Tiers Tab:**

You can configure for each tier:

**Pricing:**
- Monthly price (e.g., $49.99)
- Yearly price (e.g., $499.99)

**Trading Limits:**
- Max concurrent strategies
- Max wallets
- Max daily trades

**Fee Configuration:**
- Trade fee percentage (0.00 - 100.00%)
- Fee recipient wallet (your Solana address)

**Features Enabled:**
- Which strategies available
- Advanced features access
- Cloud sync enabled
- API access

---

## 📊 How Anvil Solo Reports Trades

### **API Endpoint:**
```
POST /api/trades/record-trade
```

### **What Anvil Solo Sends:**

```json
{
  "licenseKey": "ANVIL-XXXX-XXXX-XXXX-XXXX",
  "tradeSignature": "5x7Y...blockchain-signature",
  "tokenIn": "So11111111111111111111111111111111111111112",
  "tokenOut": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amountIn": 1.5,
  "amountOut": 150.25
}
```

### **Server Response:**

```json
{
  "success": true,
  "tradeFee": {
    "id": 123,
    "feePercentage": 5.0,
    "feeAmountSol": 0.075,
    "feeRecipientWallet": "82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd",
    "status": "pending"
  }
}
```

---

## 🎯 What License Tier Controls in Anvil Solo

### **Free Tier Users See:**
- ✅ Basic strategy only
- ✅ RSI and MACD indicators
- ❌ No auto-trading
- ❌ No advanced strategies
- ❌ No cloud sync
- ⚠️ 10% fee on all trades

### **Pro Tier Users See:**
- ✅ All standard strategies (Basic, Advanced, Smart Ratio, DCA)
- ✅ All indicators
- ✅ Auto-trading enabled
- ✅ Backtesting
- ✅ Cloud sync
- ✅ Up to 5 concurrent strategies
- ⚠️ 5% fee on all trades

### **Enterprise Tier Users See:**
- ✅ Everything in Pro
- ✅ Custom strategy builder
- ✅ API access
- ✅ Webhooks
- ✅ Unlimited strategies
- ✅ Priority support
- ⚠️ 2.5% fee on all trades

---

## 🔗 Integration with Anvil Solo Desktop App

### **On App Start:**

```javascript
// Anvil Solo validates license
const response = await fetch('https://your-server/api/license/validate-enhanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licenseKey: userLicenseKey,
    hardwareId: getHardwareId()
  })
});

const { license } = await response.json();

// Configure app based on license
app.config = {
  maxStrategies: license.limits.maxConcurrentStrategies,
  maxWallets: license.limits.maxWallets,
  maxDailyTrades: license.limits.maxDailyTrades,
  enabledStrategies: license.features.strategies,
  tradeFeePercentage: license.fees.tradeFeePercentage,
  feeWallet: license.fees.feeRecipientWallet,
  canUseAdvanced: license.permissions.canUseAdvancedStrategies,
  canCloudSync: license.permissions.canCloudSync,
};

// Hide/show features based on tier
if (!license.permissions.canUseAdvancedStrategies) {
  hideAdvancedStrategies();
}
if (!license.permissions.canCloudSync) {
  hideCloudSyncOptions();
}
```

### **On Each Trade:**

```javascript
// After trade executes
const tradeResult = await executeSwap(...);

// Report trade to license server
await fetch('https://your-server/api/trades/record-trade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licenseKey: userLicenseKey,
    tradeSignature: tradeResult.signature,
    tokenIn: swapConfig.tokenIn,
    tokenOut: swapConfig.tokenOut,
    amountIn: swapConfig.amountIn,
    amountOut: tradeResult.amountOut,
  })
});

// Fee is now tracked on server
```

---

## ⚙️ Admin Panel - Tier Configuration

### **Manage License Tiers:**

**In Admin Panel:**

1. Go to **"License Tiers"** tab (new tab!)
2. See all tiers:
   - Free Trial
   - Professional
   - Enterprise

**For Each Tier, You Can Edit:**

**Pricing:**
- Monthly price: $49.99
- Yearly price: $499.99

**Trading Fees:**
- Trade fee %: 5.0%
- Fee wallet: 82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd

**Limits:**
- Max strategies: 5
- Max wallets: 3
- Max daily trades: 100

**Features:**
- Available strategies: ["basic", "advanced", "smart_ratio", "dca"]
- Indicators: ["all"]
- Auto-trading: true/false
- Backtesting: true/false
- Cloud sync: true/false
- API access: true/false

---

## 📊 Revenue Tracking

### **View in Admin Panel:**

**Dashboard Shows:**
- Total trade fees collected
- Fees by license tier
- Average fee per trade
- Number of trades today/week/month

**Trade Fees Tab Shows:**
- All recent trades
- Fee amount per trade
- User/license info
- Trade signatures
- Status (pending/completed)

### **Query Revenue:**

```sql
-- Total revenue from trading fees
SELECT 
    SUM(fee_amount_sol) as total_fees_sol,
    COUNT(*) as total_trades,
    tier
FROM trade_fees
WHERE status = 'completed'
GROUP BY tier;

-- Revenue by day
SELECT 
    DATE(created_at) as date,
    SUM(fee_amount_sol) as daily_fees,
    COUNT(*) as daily_trades
FROM trade_fees
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🎨 Feature Control Examples

### **Example 1: Hide Advanced Strategies**

In Anvil Solo app:
```javascript
if (!license.permissions.canUseAdvancedStrategies) {
    // Hide from UI
    document.getElementById('advanced-strategies-tab').style.display = 'none';
    
    // Disable in code
    if (strategyType === 'advanced') {
        throw new Error('Advanced strategies not available in your tier. Upgrade to Pro!');
    }
}
```

### **Example 2: Limit Strategy Count**

```javascript
const activeStrategies = getActiveStrategies();

if (activeStrategies.length >= license.limits.maxConcurrentStrategies) {
    showError(`Maximum ${license.limits.maxConcurrentStrategies} strategies allowed in ${license.tier} tier`);
    showUpgradeButton();
    return;
}
```

### **Example 3: Cloud Sync Control**

```javascript
if (license.permissions.canCloudSync) {
    showCloudSyncButton();
    enableAutoSync();
} else {
    hideCloudSyncFeatures();
    showUpgradePrompt('Cloud sync available in Pro tier');
}
```

---

## 💡 API Endpoints

### **For Anvil Solo Desktop App:**

```
POST /api/license/validate-enhanced
→ Returns tier features, limits, and permissions

POST /api/trades/record-trade
→ Records trade and calculates fee

GET /api/trades/fees/:licenseKey
→ Get fee summary for license

GET /api/tiers/list
→ Get all available tiers (for upgrade page)
```

### **For Admin:**

```
PATCH /api/tiers/admin/:tierName
→ Update tier configuration (pricing, fees, features)

GET /api/trades/admin/all-fees
→ View all trade fees and revenue
```

---

## 📋 Quick Setup Checklist

After accessing admin panel:

- [ ] Review default tier configuration
- [ ] Update pricing if needed
- [ ] Confirm trade fee percentages
- [ ] Verify fee wallet address
- [ ] Test license validation
- [ ] Generate test license
- [ ] Test trade fee recording
- [ ] Verify fees appear in admin panel

---

## 🚀 Summary

### **System Now Configured For:**

✅ **Trade-based fees** (not download fees)  
✅ **Tier-based fee percentages** (10%/5%/2.5%)  
✅ **Admin can change** prices and fees  
✅ **Feature control** per tier  
✅ **License dictates** what user sees in Anvil Solo  
✅ **Automatic fee tracking** on every trade  
✅ **Revenue analytics** in admin panel  

---

**Your Fee Wallet:**
```
82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

**Default Trade Fees:**
- Free: 10%
- Pro: 5%
- Enterprise: 2.5%

---

Ready to deploy with this new structure! 🚀


