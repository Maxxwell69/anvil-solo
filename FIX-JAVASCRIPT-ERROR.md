# 🔧 Fix JavaScript Error on Launch

## What's Happening

When you run "Anvil Solo.exe", you're getting a JavaScript error. This could be several things:

---

## 🔍 Quick Diagnosis

### **What error message do you see?**

**Option 1: Window opens with DevTools showing error**
```
The app opens, DevTools (developer console) appears
Shows red error messages like:
- "Cannot find module..."
- "Failed to load resource..."  
- "ReferenceError..."
```

**Option 2: App crashes immediately**
```
Double-click Anvil Solo.exe
Window flashes briefly
Closes immediately
No error shown
```

**Option 3: Blank white screen**
```
App window opens
Shows blank white page
No content loads
```

---

## ✅ Quick Fix #1: Disable DevTools

The app is set to open DevTools (developer console) by default. Let me rebuild without it:

**In `main.ts` line 123:**
```typescript
// REMOVE THIS LINE:
mainWindow.webContents.openDevTools();
```

---

## ✅ Quick Fix #2: Check Build Files

The build might be missing files. Let me verify what's in the packaged app:

**Check if these files exist in the extracted folder:**
```
Anvil Solo/
├── Anvil Solo.exe ✅
├── resources/
│   └── app.asar  ✅ (contains all code)
├── locales/ ✅
└── ...

Inside app.asar should be:
├── dist/
│   ├── main/
│   │   └── main.js ✅
│   ├── preload/
│   │   └── preload.js ✅
│   └── renderer/
│       ├── index.html ✅
│       ├── app.js ✅
│       └── styles.css ✅
```

---

## 🧪 Test Build Locally First

Before distributing, test if it works on YOUR computer:

**1. Extract the zip:**
```
Extract: anvil-solo-portable.zip
To: C:\Test\Anvil Solo
```

**2. Run it:**
```
Double-click: Anvil Solo.exe
```

**3. What happens?**
- App opens? ✅
- Shows unlock screen? ✅
- JavaScript error? ❌ Need to fix

---

## 🔧 Rebuild Without DevTools

Let me create a production build with fixes:

**Update `src/main/main.ts`:**
```typescript
// Line 108-130, change to:
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // REMOVE THIS LINE FOR PRODUCTION:
  // mainWindow.webContents.openDevTools();

  // Only open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('✅ Main window created');
}
```

---

## 🚀 Rebuild Steps

**1. Fix the DevTools issue:**
```bash
cd anvil3.0/anvil-solo
# Edit src/main/main.ts (remove openDevTools line)
```

**2. Clean rebuild:**
```bash
rm -rf dist
rm -rf release  
npm run build
npm run package
```

**3. Test locally:**
```bash
# Extract the new release/win-unpacked
# Run Anvil Solo.exe
# Should work without errors
```

**4. Repackage:**
```bash
Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "anvil-solo-portable-fixed.zip"
```

**5. Upload new version to Google Drive**

---

## 📋 Common JavaScript Errors

### **Error 1: "Cannot find module 'better-sqlite3'"**
**Cause:** Native module not included
**Fix:** Ensure native modules are in asarUnpack

### **Error 2: "Failed to load resource: net::ERR_FILE_NOT_FOUND"**
**Cause:** Missing renderer files
**Fix:** Verify renderer folder copied to dist

### **Error 3: "Uncaught ReferenceError: require is not defined"**
**Cause:** NodeIntegration disabled but code tries to use require
**Fix:** Use contextBridge in preload script

### **Error 4: "Database not initialized"**
**Cause:** SQLite path issues in packaged app
**Fix:** Use proper paths with app.getPath('userData')

---

## 🎯 What I Need to Know

**To help you fix this, tell me:**

1. **What's the exact error message?**
   - Take a screenshot if possible
   - Or copy the error text

2. **Does the app window open?**
   - Yes, but blank
   - Yes, with DevTools showing error
   - No, crashes immediately

3. **When you tested on YOUR computer, did it work?**
   - Haven't tested
   - Works on my computer
   - Same error on my computer

---

## ⚡ Quick Fix to Deploy Now

**Disable DevTools and rebuild:**

I'll create a fixed version. Switch to agent mode and I'll:
1. Remove DevTools line
2. Add error logging
3. Rebuild properly
4. Test locally
5. Upload fixed version

**This will likely fix the JavaScript error!**

---

## 📞 Next Steps

**Tell me the exact error and I'll fix it immediately!**

Or if you want me to rebuild with DevTools disabled, I can do that now.

