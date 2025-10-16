# 🔧 Manual Fee Settings Fix

## Quick Fix (Do This Now)

Since the database migration didn't run, let's manually add the fee settings.

### Option 1: Use the Fix Script

1. **Close Anvil Solo** completely
2. **Run**: `anvil3.0\anvil-solo\FIX-FEE-SETTINGS.bat`
3. **Follow the prompts**
4. **Restart Anvil Solo**

### Option 2: Manual Database Edit

1. **Download SQLite Browser**: https://sqlitebrowser.org/
2. **Open your database**: `C:\Users\[YOUR_USERNAME]\.anvil\anvil-solo.db`
3. **Go to "Execute SQL" tab**
4. **Run these commands**:
```sql
INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_enabled', 'true');
INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_percentage', '0.5');
INSERT OR REPLACE INTO settings (key, value) VALUES ('fee_wallet_address', '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd');
```
5. **Save and close**
6. **Restart Anvil Solo**

### Option 3: DevTools Console Fix

1. **Open DevTools** (🔧 button)
2. **Go to Console tab**
3. **Run this command**:
```javascript
// This will add fee settings via the app's API
window.electron.fees.updateConfig({
  feeEnabled: true,
  feePercentage: 0.5,
  feeWalletAddress: '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd'
});
```

---

## ✅ After the Fix

When you restart Anvil Solo, you should see:

**At startup:**
```
💰 Transaction fees: 0.5% → 82wZpbqx...
```

**During trades:**
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

## 🧪 Test the Fix

1. **Create a small test trade** (0.01 SOL)
2. **Start the strategy**
3. **Watch console logs** for fee collection
4. **Check Solscan** for the fee transaction

---

**Try Option 3 first (DevTools console) - it's the quickest!**
