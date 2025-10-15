# 🧪 Anvil Solo - Micro Testing Guide

## Quick Test Setup for Live Trading Verification

This guide shows you how to test Anvil Solo with micro amounts to verify trades execute successfully.

---

## 📋 Prerequisites

### 1. **Wallet with SOL**
- Minimum: `0.01 SOL` (~$2 USD)
- Recommended: `0.05 SOL` for multiple tests

### 2. **Test Token Recommendation: BONK**
- **Address**: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- **Why?**: Highly liquid, very cheap, widely available
- **Alternative**: Any pump.fun token with good liquidity

---

## 🚀 Step-by-Step Micro Test

### **Step 1: Add Test Token**
1. Open Anvil Solo
2. Go to **Token Manager** page
3. Click **Add Token**
4. Fill in:
   - Name: `BONK`
   - Symbol: `BONK`
   - Address: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
5. Click **Add Token**

### **Step 2: Create Micro DCA Strategy**
1. Go to **DCA Strategy** page
2. Fill in the form:
   ```
   Token: Select "BONK" from dropdown
   Wallet: Select your wallet (must have SOL)
   Direction: Buy (SOL → Token)
   Total Amount: 0.001          ← Very small test amount!
   Number of Orders: 1          ← Single test trade
   Frequency: Hourly
   Slippage: 5%
   Priority Fee: 100000
   ```
3. Click **Create DCA Strategy**

### **Step 3: Start the Strategy**
1. Go to **Dashboard**
2. Find your DCA strategy
3. Click **▶️ Start** button
4. **Watch the terminal** (PowerShell window running the app)

---

## 👀 What to Watch For

### **Terminal Output - SUCCESS:**
```
======================================================================
✅ DCA TRADE EXECUTED SUCCESSFULLY!
======================================================================
Strategy #10 - BUY Order 1/1
Amount: 0.001 SOL
Transaction: 4xK7n8p2mF5k...
View on Solscan: https://solscan.io/tx/4xK7n8p2mF5k...
======================================================================
```

### **Activity Log - Will Show:**
```
💱 📥 Buy Trade Executed
0.0010 SOL → 1,234 tokens
🔗 View on Solscan: 4xK7n8p2...
TRADE | Strategy #10 | 3:45 PM
```

### **Dashboard Stats - Will Update:**
```
Total Trades: 1
Today's Volume: 0.001 SOL
Active Strategies: 1
```

### **Wallet Balance - Will Change:**
- SOL balance decreases by ~0.001
- BONK balance increases (visible after refresh)

---

## 🔍 Verification Steps

### **1. Check Terminal**
- ✅ Look for the success banner with transaction signature
- ✅ Copy the Solscan URL and open in browser
- ✅ Verify transaction shows as "Success" on Solscan

### **2. Check Activity Log**
- Go to **Activity** page in app
- ✅ See the trade listed
- ✅ Click the Solscan link
- ✅ Verify DEX used (Raydium, Orca, etc.)

### **3. Check Wallet**
- Go to **Wallet** page
- Click **🔄 Refresh Balances**
- ✅ SOL balance decreased
- ✅ Token balance increased (BONK should appear in holdings)

### **4. Check Dashboard**
- ✅ "Total Trades" increased by 1
- ✅ "Today's Volume" shows 0.001 SOL
- ✅ Strategy status shows execution time

---

## 🧪 Test Scenarios

### **Test 1: Basic Buy (RECOMMENDED FIRST)**
```
Token: BONK
Direction: Buy
Amount: 0.001 SOL
Orders: 1
Expected Cost: ~$0.20 USD
```

### **Test 2: Multiple Orders DCA**
```
Token: BONK
Direction: Buy
Amount: 0.005 SOL
Orders: 5
Frequency: Custom → 1 minute
Expected: 5 trades over 5 minutes
Cost: ~$1 USD
```

### **Test 3: Sell After Buy**
```
Token: BONK
Direction: Sell
Amount: 50% of your BONK balance
Orders: 1
Expected: Converts BONK back to SOL
```

### **Test 4: Ratio Trading (Volume Generation)**
```
Token: BONK
Daily Volume: 0.01 SOL
Buy Ratio: 50%
Sell Ratio: 50%
Trades/Hour: 6
Expected: Balanced buy/sell every 10 minutes
```

---

## 📊 Expected Terminal Output (Example)

```powershell
🔄 Loading 1 active/paused strategies from database...
🚀 Starting DCA strategy #10
   Token: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
   Direction: BUY
   Total: 0.001 SOL/tokens
   Orders: 1 × 0.0010 each
   Schedule: 0 * * * *
✅ Loaded dca strategy #10 (active)

[Wait for scheduled time - on the hour]

📊 Executing DCA order 1/1
   Fetching quote for 0.001 SOL...
   Executing swap...

======================================================================
✅ DCA TRADE EXECUTED SUCCESSFULLY!
======================================================================
Strategy #10 - BUY Order 1/1
Amount: 0.001 SOL
Transaction: 4xK7n8p2mF5kQr9vL3nT8cJ6yH1wP...
View on Solscan: https://solscan.io/tx/4xK7n8p2mF5kQr9vL3nT8cJ6yH1wP...
======================================================================
```

---

## ⚠️ Troubleshooting

### **No Trade Executed?**

**Check Strategy Schedule:**
- DCA runs on a cron schedule (hourly = top of the hour)
- If you create at 3:45 PM, next execution is 4:00 PM
- Use "Custom Interval: 1 minute" for faster testing

**Check Wallet Balance:**
- Make sure wallet has enough SOL for the trade + gas
- Minimum: 0.001 SOL + 0.000005 SOL (gas)

**Check Jupiter API:**
- Terminal should NOT show "Jupiter API not accessible"
- With Helius RPC, this should be fixed

### **Trade Failed?**

Common reasons:
1. **Insufficient balance** - Need more SOL
2. **Slippage too low** - Increase to 5-10% for micro amounts
3. **Token not liquid** - Use BONK or popular tokens
4. **Network congestion** - Wait and retry

---

## 💡 Pro Tips

### **Fastest Test (Immediate Execution):**
```
Frequency: Custom
Custom Interval: 1 minute
```
- Trade executes 1 minute after starting strategy
- No need to wait for hourly schedule

### **Cost-Effective Testing:**
```
Amount: 0.001 SOL per test
~$0.20 USD per trade
5 tests = ~$1 USD total
```

### **Watch Multiple Indicators:**
1. **Terminal** - Real-time execution logs
2. **Activity Log** - Historical record with links
3. **Dashboard** - Aggregate statistics
4. **Wallet** - Balance changes
5. **Solscan** - Blockchain confirmation

---

## ✅ Success Indicators

You'll know it's working when you see **ALL** of these:

- ✅ Terminal shows transaction signature
- ✅ Activity Log shows trade with Solscan link
- ✅ Dashboard "Total Trades" increments
- ✅ Solscan confirms transaction
- ✅ Wallet balance changes (after refresh)

---

## 🎯 Next Steps After Successful Test

Once you confirm trades work:

1. **Scale up** to real trading amounts
2. **Test other strategies** (Ratio, Bundle)
3. **Monitor performance** over 24 hours
4. **Analyze** activity logs for patterns
5. **Optimize** slippage and fees based on results

---

## 📞 If You Need Help

Check these in order:
1. **Terminal logs** - Any errors?
2. **Activity Log** - "Trade" category filter
3. **Helius RPC** - Is it configured correctly?
4. **Wallet balance** - Enough SOL?
5. **Token liquidity** - Is token tradeable on Jupiter?

---

**Ready to test!** Your app is configured with:
- ✅ Helius RPC (fast, reliable)
- ✅ Enhanced logging (clear signatures)
- ✅ Activity tracking (with Solscan links)
- ✅ Dashboard metrics (real-time stats)
- ✅ Multi-token support (including Token-2022)

**Start with 0.001 SOL test to verify everything works!** 🚀






