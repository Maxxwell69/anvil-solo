# 🔧 Anvil Solo - Troubleshooting Guide

## 🎯 Common Issues & Solutions

---

## Issue: "Ratio Trading Doesn't Work"

### Possible Causes:

#### 1. **App Not Running**
**Check:** Is the Electron window visible?
```powershell
Get-Process | Where-Object { $_.ProcessName -eq "electron" }
```

**Solution:** Start the app
```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
node start-app.js
```

#### 2. **No Wallet Created**
**Symptom:** Can't create strategies
**Solution:** 
- Click "Generate New Wallet" first
- Or "Import Wallet" if you have one

#### 3. **Insufficient SOL Balance**
**Symptom:** Strategy created but no trades execute
**Solution:**
- Add at least 0.05 SOL to your wallet
- Check balance in dashboard

#### 4. **Jupiter API Unreachable**
**Symptom:** "Jupiter API not accessible" warning
**Solution:**
- This is usually temporary
- The app will retry automatically
- Check internet connection
- Try again in a few minutes

#### 5. **Invalid Token Address**
**Symptom:** Strategy fails to create
**Solution:**
- Verify token address is correct (44 characters)
- Test with known token like BONK: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`

#### 6. **Strategy Not Starting**
**Symptom:** Strategy created but shows as "pending"
**Solution:**
- Check activity log for errors
- Restart the app
- Try smaller amounts first

---

## 🧪 Testing Smart Ratio Feature

### Test Scenario:

**Step 1: Create Test Strategy**
```
Token: BONK (DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263)
Buy Ratio: 25% (1 buy)
Sell Ratio: 75% (3 sells)
Daily Volume: 0.02 SOL
Trades/Hour: 6
```

**Step 2: Start with Low SOL**
- Only add 0.02 SOL to wallet
- This will trigger reversal quickly for testing

**Step 3: Watch the Logs**
You should see:
```
📊 Executing BUY trade: 0.005 SOL
📊 Executing SELL trade: 0.005 SOL
📊 Executing SELL trade: 0.005 SOL
📊 Executing SELL trade: 0.005 SOL
...
⚠️  LOW SOL WARNING: 0.008 SOL remaining
🔄 REVERSING RATIO: Was 25% buy → Now 25% SELL
```

**Step 4: Verify Reversal**
- Strategy should now SELL more often
- SOL balance should increase
- Check activity log for SELL transactions

---

## 🔍 Debugging Steps

### 1. Check App Logs
```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
node start-app.js
```

Watch the console output for:
- ✅ Green checkmarks = working
- ⚠️  Yellow warnings = non-critical
- ❌ Red errors = need attention

### 2. Check Database
```powershell
# Database location
dir C:\Users\maxxf\.anvil\
```

Should see: `anvil-solo.db`

### 3. Verify Build
```powershell
cd anvil-solo
npm run build
```

Should complete without errors.

### 4. Check Strategy Status
Open app → Dashboard → Should show active strategies

---

## 🌐 Network Issues

### Jupiter API Not Accessible

**Symptoms:**
```
Health check failed for https://quote-api.jup.ag/v6
⚠️  Jupiter API not accessible
```

**Solutions:**

#### Fix 1: Check Internet
```powershell
ping google.com
```

#### Fix 2: Flush DNS
```powershell
ipconfig /flushdns
```

#### Fix 3: Test Jupiter Directly
```powershell
curl https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263&amount=1000000
```

If this works, Jupiter is accessible.

#### Fix 4: Wait and Retry
- Sometimes Jupiter has temporary outages
- App will automatically retry
- Usually resolves in 5-10 minutes

---

## 🐛 Common Errors

### Error: "Cannot find module"
**Solution:**
```powershell
cd anvil-solo
npm install --ignore-scripts
npm run build
```

### Error: "Database locked"
**Solution:**
- Close all instances of the app
- Delete: `C:\Users\maxxf\.anvil\anvil-solo.db-wal`
- Restart app

### Error: "Insufficient funds"
**Solution:**
- Add more SOL to wallet
- Check balance in dashboard
- Minimum 0.05 SOL recommended

---

## 🔄 Reset Everything

If nothing works, try a complete reset:

```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo

# Delete database (WARNING: Loses wallet if not backed up!)
Remove-Item C:\Users\maxxf\.anvil\anvil-solo.db -Force

# Delete node_modules
Remove-Item node_modules -Recurse -Force

# Delete dist
Remove-Item dist -Recurse -Force

# Reinstall
npm install --ignore-scripts

# Rebuild
npm run build

# Start fresh
node start-app.js
```

**WARNING:** This deletes your wallet! Only do if you have backup!

---

## 📊 Expected Behavior

### When Ratio Trading Works:

**Console Output:**
```
🚀 Starting Ratio Trading strategy #1
   Token: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
   Daily Volume: 0.1 SOL
   Ratio: 25% BUY / 75% SELL
   Trades/hour: 4

💰 Current token balance: 0.00
📊 Executing BUY trade: 0.0104 SOL
   ✅ BUY: signature123abc...
   📊 Today: 0.01/0.1 SOL
   🏦 Balance: 1234.56 tokens

📊 Executing SELL trade: 0.0104 SOL
   ✅ SELL: signature456def...
   📊 Today: 0.02/0.1 SOL
   🏦 Balance: 1100.23 tokens
```

### When Smart Reversal Triggers:
```
⚠️  LOW SOL WARNING: 0.0085 SOL remaining
🔄 REVERSING RATIO: Was 25% buy → Now 25% SELL
   Strategy will now SELL to build SOL back up!
```

---

## 🆘 Still Not Working?

### Create a Detailed Error Report:

1. **Run app with logs:**
```powershell
cd anvil-solo
node start-app.js > app-log.txt 2>&1
```

2. **Check the log file:**
```powershell
cat app-log.txt
```

3. **Share specific error message** - I can help debug!

---

## ✅ **Current Feature Status:**

### Working:
- ✅ Wallet generation/import
- ✅ DCA strategies
- ✅ Bundle trading
- ✅ Database storage
- ✅ Activity logging

### Recently Added:
- ✅ Smart ratio reversal
- ✅ Desktop shortcut
- ✅ Enhanced Jupiter client
- ✅ Token safety checks

### May Need Testing:
- ⚠️ Ratio trading execution
- ⚠️ Token Manager UI
- ⚠️ Cloud services integration

---

## 📝 Quick Diagnostic

**Run this to diagnose:**
```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo

Write-Host "Checking installation..."
Write-Host "Node modules: $(Test-Path node_modules)"
Write-Host "Dist folder: $(Test-Path dist)"
Write-Host "Main file: $(Test-Path dist\main\main.js)"
Write-Host "Database: $(Test-Path C:\Users\maxxf\.anvil\anvil-solo.db)"
Write-Host ""
Write-Host "Starting app..."
node start-app.js
```

---

**Tell me the specific error you're seeing and I'll help fix it!** 🔧

