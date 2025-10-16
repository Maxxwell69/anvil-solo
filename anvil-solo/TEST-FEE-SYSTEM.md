# 🔍 Fee System Troubleshooting Guide

## Problem: Fees Not Being Collected

Let's diagnose step by step.

---

## Step 1: Check if Database Has Fee Settings

1. **Find your database**:
   ```
   Windows: C:\Users\[YOUR_USERNAME]\.anvil\anvil-solo.db
   ```

2. **Open with SQLite Browser** (download from https://sqlitebrowser.org/)

3. **Go to "Browse Data" tab**

4. **Select `settings` table**

5. **Look for these rows**:
   ```
   fee_enabled = true
   fee_percentage = 0.5
   fee_wallet_address = 82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
   ```

### If These Don't Exist:

Run this SQL (in "Execute SQL" tab):
```sql
INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_enabled', 'true');
INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_percentage', '0.5');
INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd');
```

---

## Step 2: Verify App is Using New Code

1. **Close Anvil Solo** completely
2. **Delete the old database** to force recreation:
   ```
   C:\Users\[YOUR_USERNAME]\.anvil\anvil-solo.db
   ```
3. **Run the NEW installer**:
   ```
   anvil3.0\anvil-solo\release\Anvil Solo-Setup-3.0.0.exe
   ```
4. **Create a new wallet** (or import existing)
5. **Open DevTools** (🔧 button bottom right)

---

## Step 3: Check Console Logs During Startup

When app starts, you should see:
```
✅ License: FREE tier
💰 Transaction fees: 0.5% → 82wZpbqx...
```

### If You Don't See This:
- Fee system isn't initialized
- Database isn't being read correctly
- Old version still running

---

## Step 4: Create Test Trade

1. **Go to DCA** tab
2. **Create small test**:
   - Token: Any token
   - Direction: Buy
   - Total: 0.01 SOL
   - Orders: 1
   - Interval: Hourly
3. **Click "Create Strategy"**
4. **Go to Dashboard**
5. **Click "Start"** on the strategy

---

## Step 5: Watch Console Logs

After trade executes, you should see:
```
🔍 Checking fee collection...
📊 Fee config: enabled=true, percentage=0.5%, wallet=82wZpbqx...
💵 Trade amount: 0.010000 SOL
💰 Fee amount: 0.000050 SOL (50000 lamports)
💸 Transferring 0.5% fee: 0.000050 SOL...
✅ Fee collected successfully!
📝 Fee transaction: https://solscan.io/tx/[SIGNATURE]
```

---

## Common Issues & Solutions

### Issue 1: "Fee collection disabled"
**Console shows**: `ℹ️ Fee collection disabled`

**Solution**:
```sql
UPDATE settings SET value = 'true' WHERE key = 'fee_enabled';
```
Restart app.

---

### Issue 2: "Fee wallet address not configured"
**Console shows**: `⚠️ Fee wallet address not configured`

**Solution**:
```sql
UPDATE settings SET value = '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd' WHERE key = 'fee_wallet_address';
```
Restart app.

---

### Issue 3: No fee logs at all
**Console shows**: No fee messages

**Problem**: Old version of app running

**Solution**:
1. Close app completely
2. Check Task Manager - kill any "Anvil Solo" processes
3. Reinstall from `release\Anvil Solo-Setup-3.0.0.exe`
4. Try again

---

### Issue 4: "Fee collection failed: insufficient funds"
**Console shows**: `❌ Fee collection failed: insufficient funds`

**Problem**: Wallet doesn't have enough SOL for the fee + transaction cost

**Solution**:
- Add more SOL to wallet (need ~0.001 SOL minimum)
- Or reduce trade size

---

### Issue 5: FeeManager not initialized
**Error**: `Cannot read property 'getFeeConfig' of undefined`

**Problem**: FeeManager not being passed to strategy

**Solution**: This is a code issue. The strategy constructors need the feeManager parameter.

**Check**: Open `dist/main/main.js` and search for `new DCAStrategy` - should have 5 parameters including `feeManager`.

---

## Manual Test Script

If you want to test fee collection without waiting for a trade:

1. Open DevTools console
2. Run:
```javascript
// Check fee config
await window.electron.fees.getConfig()

// Expected output:
// {success: true, config: {feeEnabled: true, feePercentage: 0.5, feeWalletAddress: "82wZpbqx..."}}
```

---

## Nuclear Option: Fresh Install

If nothing works:

1. **Uninstall** Anvil Solo
2. **Delete** `C:\Users\[YOUR_USERNAME]\.anvil\` folder
3. **Delete** `C:\Users\[YOUR_USERNAME]\AppData\Roaming\anvil-solo\` folder
4. **Reinstall** from `release\Anvil Solo-Setup-3.0.0.exe`
5. **Create new wallet**
6. **Try again**

---

## What to Report

If still not working, send me:

1. **Console logs** from DevTools (full output)
2. **Screenshot** of settings table in database
3. **App version** shown in about/settings
4. **Steps you tried** from this guide

---

## Quick Check Command

To verify the new build is actually being used, check the file dates:

```powershell
dir "C:\Program Files\Anvil Solo\resources\app.asar" | Select-Object LastWriteTime
```

Should show today's date/time.

---

**Next Steps**: Try Step 1-5 in order and report back what you see in the console logs!

