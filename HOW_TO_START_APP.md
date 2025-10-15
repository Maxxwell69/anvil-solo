# 🚀 How to Start Anvil Solo Desktop App

## ⚡ Quick Start (Easiest)

### Option 1: Double-Click the Batch File
```
Double-click: START_ANVIL.bat
```

This automatically:
- Navigates to correct folder
- Installs dependencies if needed
- Builds the app
- Starts Electron

---

### Option 2: Command Line
```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
npm start
```

---

### Option 3: Direct Electron
```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
npx electron dist\main\main.js
```

---

## 🔍 If App Doesn't Appear

### Check 1: Is it Running?
```powershell
Get-Process | Where-Object { $_.ProcessName -like "*electron*" }
```

If you see output, the app IS running - check your taskbar!

### Check 2: Look Everywhere
- Check taskbar (bottom of screen)
- Press `Alt + Tab` to cycle windows
- Check if it's minimized
- Look for "Anvil Solo" or "Electron"

### Check 3: Check for Errors
```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
npm run build
```

Look for any error messages.

---

## 🛠️ If Still Not Working

### Rebuild Everything:
```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo

# Clean build
Remove-Item -Path dist -Recurse -Force
Remove-Item -Path node_modules -Recurse -Force

# Reinstall
npm install --ignore-scripts

# Rebuild
npm run build

# Start
npm start
```

---

## 📁 Correct Folder Structure

Make sure you're in the RIGHT folder:

```
❌ WRONG: C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\
✅ RIGHT: C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo\
```

---

## 🎯 What Should Happen

When the app starts successfully, you'll see:

1. **Console Output:**
   ```
   🚀 Initializing Anvil Solo...
   ✅ Database initialized
   ✅ Jupiter client initialized
   ✅ Wallet manager initialized
   ✅ License: FREE tier
   ```

2. **Window Appears:**
   - Purple/blue gradient background
   - Lock icon
   - Three options:
     - Unlock Wallet
     - Generate New Wallet
     - Import Wallet

---

## 🆘 Emergency: Can't Get It Working?

### Use the Batch File:
1. Navigate to: `C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\`
2. Double-click `START_ANVIL.bat`
3. It will do everything for you

---

## 💡 Pro Tip

**Create a Desktop Shortcut:**
1. Right-click `START_ANVIL.bat`
2. Send to → Desktop (create shortcut)
3. Rename to "Anvil Solo"
4. Now you can start it from your desktop!

---

**The app should be starting now. Check your screen!** 👀






