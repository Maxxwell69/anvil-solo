# 🔍 Quick Trade Debug Guide

## Why Trades Might Not Be Happening

### Common Causes:
1. **Strategy Not Started** - Most common!
2. **Insufficient Balance** - Not enough SOL in wallet
3. **Wrong Token Address** - Token doesn't exist or invalid
4. **RPC Issues** - Connection problems
5. **License Restrictions** - Free tier limitations

---

## 📋 Step-by-Step Debug

### Step 1: Check Strategy Status
1. Open Anvil Solo
2. Go to **Dashboard**
3. Look at your strategy card
4. **Status should be**: `Running` (green)
5. **If it says**: `Stopped` or `Paused` → Click **"Start"** button

### Step 2: Check Console Logs
1. Press **F12**
2. Click **"Console"** tab
3. Look for these messages:

**Good Signs:**
```
✅ DCA Strategy #1 started
✅ Fee settings verified - all present
⏱️ Next execution at: [timestamp]
📊 Checking price for token...
```

**Bad Signs:**
```
❌ Strategy not found
❌ Insufficient balance
❌ RPC connection failed
❌ Token not found
```

### Step 3: Check Wallet Balance
1. Go to **Wallets** page
2. Check **SOL Balance**
3. **Minimum needed**:
   - DCA: Your trade amount + 0.01 SOL (for fees)
   - Example: 0.05 SOL trade = need 0.06 SOL minimum

### Step 4: Check DCA Settings
1. Go to **Dashboard**
2. Click on your strategy
3. Verify:
   - **Interval**: Not too long (e.g., 5 minutes for testing)
   - **Amount**: Not too small (minimum 0.001 SOL)
   - **Token Address**: Valid Solana address
   - **Direction**: Buy or Sell selected

### Step 5: Check License Status
1. Go to **Settings** → **License**
2. **Status should be**: `Active` or `Free Tier`
3. **If "Invalid"**: Activate license first

---

## 🧪 Quick Test Strategy

### Create a Test DCA:
1. **Go to**: Create Strategy → DCA
2. **Settings**:
   - Token: `So11111111111111111111111111111111111111112` (Wrapped SOL)
   - Amount: `0.01 SOL`
   - Interval: `5 minutes` (for quick testing)
   - Direction: `Buy`
   - Wallet: Your main wallet
3. **Click**: Create Strategy
4. **Click**: Start (green play button)
5. **Wait 5 minutes**
6. **Check console** for trade execution

---

## 💡 Console Commands to Check Status

Press F12 → Console, then try these:

### Check if strategy is running:
```javascript
// This won't work from console, use the UI instead
// Just check the Dashboard for "Running" status
```

### Check wallet balance:
```javascript
await window.electron.wallet.getBalance();
```

### Check license:
```javascript
await window.electron.license.getInfo();
```

---

## 🔧 Common Fixes

### Fix 1: Strategy Not Started
**Problem**: Strategy shows "Stopped"
**Solution**: Click the **"Start"** button on the strategy card

### Fix 2: Insufficient Balance
**Problem**: Console shows "Insufficient balance"
**Solution**: 
1. Go to Wallets
2. Deposit more SOL
3. Or reduce trade amount in strategy settings

### Fix 3: Wrong Token Address
**Problem**: Console shows "Token not found"
**Solution**:
1. Verify token address on Solscan
2. Make sure it's a valid SPL token
3. Use a known token for testing (USDC, BONK, etc.)

### Fix 4: Interval Too Long
**Problem**: Strategy is running but waiting
**Solution**:
1. Check console for "Next execution at: [time]"
2. If it's hours away, edit strategy
3. Change interval to 5-10 minutes for testing

### Fix 5: RPC Connection Issues
**Problem**: Console shows RPC errors
**Solution**:
1. Check internet connection
2. App uses: `https://mainnet.helius-rpc.com`
3. If persistent, might need to wait or restart app

---

## ✅ What Success Looks Like

### In Console (F12):
```
⏱️ Next execution at: [timestamp]
💰 Executing DCA order...
📊 Current price: $X.XX
💵 Trade amount: 0.01 SOL
🔄 Getting quote from Jupiter...
✅ Quote received: X tokens
🚀 Executing swap...
✅ Transaction successful!
📝 Signature: https://solscan.io/tx/[hash]
💰 Collecting 0.5% fee: 0.00005 SOL
✅ Fee collected: [signature]
```

### On Dashboard:
- Strategy status: **Running** (green)
- Last execution: **Just now** or recent timestamp
- Total trades: **Increases** after each execution
- SOL spent: **Increases** with each trade

---

## 🎯 Quick Troubleshooting Checklist

- [ ] Strategy status is **"Running"** (not Stopped/Paused)
- [ ] Wallet has enough SOL (trade amount + 0.01 SOL)
- [ ] Token address is valid
- [ ] Interval is reasonable (5-60 minutes)
- [ ] Console shows no red error messages
- [ ] License is active or free tier
- [ ] Internet connection is working
- [ ] Waited for the interval time to pass

---

## 🆘 Still Not Working?

### Get Detailed Logs:
1. Press **F12** → **Console**
2. Look for the **most recent** error message (red text)
3. Screenshot it
4. Check what it says

### Common Error Messages:

**"Strategy not found"**
→ Strategy was deleted or not created properly

**"Insufficient balance"**
→ Add more SOL to wallet

**"Token not found"**
→ Use a different token address

**"RPC connection failed"**
→ Check internet, try restarting app

**"License restriction"**
→ Activate license or check free tier limits

**"Quote failed"**
→ Token might have low liquidity or be invalid

---

## 📞 Need Help?

If you've checked everything and it still doesn't work:
1. Open Console (F12)
2. Take a screenshot of any red errors
3. Note your strategy settings
4. Check if strategy is actually "Running"

**Most common issue**: Forgot to click the "Start" button! ▶️

---

**Remember: The strategy must be "Running" (green status) for trades to execute!**

