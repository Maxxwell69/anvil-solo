# 🧪 Live Testing Checklist - Development Mode

## ✅ What We're Testing

Running Anvil Solo from terminal (`npm start`) to verify everything works before building the installer.

---

## 📋 Test Checklist

### Test 1: App Startup ✅
- [ ] App window opens
- [ ] No crash on startup
- [ ] Terminal shows initialization logs
- [ ] Database initialized successfully

**Expected Terminal Output:**
```
✅ Database initialized
✅ Wallet manager ready
✅ Jupiter client initialized
✅ License manager ready
```

---

### Test 2: Fee Settings Check 🔧
- [ ] Open DevTools (F12)
- [ ] Check console for fee settings message
- [ ] Run fee config command if needed

**Expected Console Output:**
```
🔧 Ensuring fee settings exist...
✅ Fee settings verified - all present
```

**If Settings Missing, Run:**
```javascript
window.electron.fees.updateConfig({
  feeEnabled: true, 
  feePercentage: 0.5, 
  feeWalletAddress: '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd'
});
```

---

### Test 3: Wallet Check 💰
- [ ] Go to Wallets page
- [ ] Wallet displays correctly
- [ ] SOL balance shows (not "undefined")
- [ ] No errors in console

**Expected:**
- Wallet address visible
- Balance: `X.XXX SOL`
- No `balance.toFixed is not a function` error

---

### Test 4: Create DCA Strategy 📊
- [ ] Go to Create Strategy → DCA
- [ ] Fill in settings:
  - Token: Valid address
  - Amount: 0.01 SOL (small test)
  - Interval: 5 minutes (quick test)
  - Direction: Buy
- [ ] Create strategy
- [ ] Strategy appears on dashboard

**Expected:**
- Strategy created successfully
- Shows on dashboard
- Status: Stopped (initially)

---

### Test 5: Start Strategy ▶️
- [ ] Click "Start" button on strategy
- [ ] Status changes to "Running"
- [ ] Console shows startup message
- [ ] Terminal shows strategy started

**Expected Terminal Output:**
```
✅ DCA Strategy #1 started
⏱️ Next execution at: [timestamp]
```

**Expected Console Output:**
```
Strategy started
Next trade in 5 minutes
```

---

### Test 6: Wait for First Trade ⏱️
- [ ] Wait for interval time (5 minutes)
- [ ] Watch terminal for trade execution
- [ ] Watch console for trade logs
- [ ] Check for fee collection

**Expected Terminal Output:**
```
💰 Executing DCA order...
📊 Current price: $X.XX
💵 Trade amount: 0.01 SOL
🔄 Getting quote from Jupiter...
✅ Quote received
🚀 Executing swap...
✅ Transaction successful!
📝 Signature: https://solscan.io/tx/[hash]
🔍 Checking fee collection...
📊 Fee config: enabled=true, percentage=0.5%, wallet=82wZpbqx...
💵 Trade amount: 0.0100 SOL
💰 Fee amount: 0.00005 SOL (50000 lamports)
💸 Transferring 0.5% fee: 0.00005 SOL...
✅ Fee collected successfully!
📝 Fee transaction: https://solscan.io/tx/[hash]
```

---

### Test 7: Verify Fee Collection 💸
- [ ] Copy fee transaction signature from terminal
- [ ] Open in Solscan
- [ ] Verify fee went to: `82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd`
- [ ] Check fee wallet balance increased

**Fee Wallet:**
https://solscan.io/account/82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd

---

### Test 8: Activity Feed 📋
- [ ] Check bottom of app for activity feed
- [ ] Feed shows recent trade
- [ ] Click toggle to expand/collapse
- [ ] Messages update in real-time

**Expected:**
```
Just now - 🚀 Trade executed: Bought X tokens
1 min ago - 💰 Fee collected: 0.00005 SOL
```

---

### Test 9: Delete Strategy 🗑️
- [ ] Click delete button on strategy
- [ ] Confirmation modal appears
- [ ] Click "Delete Permanently"
- [ ] Modal closes automatically
- [ ] Strategy removed from dashboard
- [ ] No need to refresh

**Expected:**
- Modal shows warning
- Deletion works
- Modal auto-closes
- Dashboard updates automatically

---

### Test 10: DevTools Button 🔧
- [ ] Look for 🔧 button (bottom right, faint)
- [ ] Hover over it (becomes more visible)
- [ ] Click it
- [ ] DevTools opens
- [ ] Debug info modal appears

**Expected:**
- Button visible on hover
- Opens DevTools
- Shows app status info

---

## 🐛 Common Issues to Watch For

### Issue 1: Fee Settings Missing
**Symptom:** Console doesn't show "Fee settings verified"
**Fix:** Run the `window.electron.fees.updateConfig()` command

### Issue 2: No Trades Executing
**Symptom:** Strategy is "Running" but no trades happen
**Check:**
- Terminal logs for errors
- Wallet balance sufficient?
- Token address valid?
- RPC connection working?

### Issue 3: Balance Shows "undefined"
**Symptom:** Wallet balance says "undefined SOL"
**Check:** Should be fixed in v3.1.2 (balanceResult.balance fix)

### Issue 4: Fee Collection Fails
**Symptom:** Trade succeeds but no fee collected
**Check Terminal for:**
```
❌ Fee collection failed: [error]
```
**Or:**
```
⚠️ Fee wallet address not configured
ℹ️ Fee collection disabled
```

---

## 📝 Test Results Template

### Test Run: [Date/Time]

**App Startup:** ✅/❌
**Fee Settings:** ✅/❌
**Wallet Display:** ✅/❌
**Create Strategy:** ✅/❌
**Start Strategy:** ✅/❌
**Trade Execution:** ✅/❌
**Fee Collection:** ✅/❌
**Activity Feed:** ✅/❌
**Delete Strategy:** ✅/❌
**DevTools Button:** ✅/❌

**Issues Found:**
1. [Description]
2. [Description]

**Terminal Errors:**
```
[Paste any errors here]
```

**Console Errors:**
```
[Paste any errors here]
```

---

## 🎯 Success Criteria

All tests must pass before building installer:

- ✅ App starts without errors
- ✅ Fee settings automatically configured
- ✅ Wallet balance displays correctly
- ✅ Strategy creates and starts
- ✅ Trades execute successfully
- ✅ Fees are collected (0.5%)
- ✅ Activity feed updates in real-time
- ✅ Delete strategy works
- ✅ DevTools button functional

---

## 🚀 After All Tests Pass

1. **Close the app** (Ctrl+C in terminal)
2. **Rebuild installer:** `npm run build && npx electron-builder --win --config.npmRebuild=false`
3. **Test installer** on fresh machine
4. **Upload to GitHub** releases
5. **Update dashboard** download link
6. **Deploy cloud services** to Railway

---

**Let's test everything step by step!** 🧪

