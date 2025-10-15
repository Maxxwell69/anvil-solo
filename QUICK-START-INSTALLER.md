# 🚀 Quick Start: Build & Deploy Anvil Solo Installer

## ⚡ Super Fast Start (3 Commands)

### **Build Installer:**
```bash
cd anvil-solo
BUILD-INSTALLER.bat
```

### **Copy to Downloads:**
```bash
cd ..
COPY-TO-DOWNLOADS.bat
```

### **Deploy to Railway:**
```bash
cd cloud-services
git add public/downloads/
git commit -m "Add Anvil Solo installer"
git push
```

**Done! Users can now download!** 🎉

---

## 📋 What You'll Get

### **Professional Windows Installer:**
- ✅ Asks for admin permissions (UAC)
- ✅ Shows license agreement
- ✅ User chooses install location
- ✅ Creates desktop shortcut
- ✅ Adds to Start Menu
- ✅ Includes uninstaller
- ✅ Launches app after install

### **File Details:**
- **Name:** `Anvil-Solo-Setup-3.0.0.exe`
- **Size:** ~150 MB
- **Type:** Windows Installer (NSIS)
- **Admin:** Required ✅
- **Signed:** Optional (add later)

---

## 🎯 Step-by-Step Process

### **1. Build the Installer**

```bash
cd c:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
BUILD-INSTALLER.bat
```

**What happens:**
1. Cleans previous builds
2. Installs dependencies
3. Builds TypeScript → JavaScript
4. Creates professional installer
5. Output: `release\Anvil-Solo-Setup-3.0.0.exe`

**Time:** 3-5 minutes

---

### **2. Test Locally (Optional)**

```bash
# Double-click to test:
release\Anvil-Solo-Setup-3.0.0.exe
```

**What to check:**
- ✅ UAC prompt appears
- ✅ License agreement shows
- ✅ Can choose install location
- ✅ Desktop shortcut created
- ✅ Start Menu entry added
- ✅ App launches successfully
- ✅ Uninstaller works

---

### **3. Copy to Download Server**

```bash
cd c:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0
COPY-TO-DOWNLOADS.bat
```

**What happens:**
1. Finds installer in `anvil-solo/release/`
2. Copies to `cloud-services/public/downloads/anvil-solo-setup.exe`
3. Ready for upload!

---

### **4. Deploy to Railway**

```bash
cd cloud-services
git status              # See what changed
git add .               # Add downloads folder
git commit -m "Add Anvil Solo installer for user downloads"
git push                # Deploy to Railway
```

**Wait for deployment:**
```
Railway is deploying...
✓ Build successful
✓ Deploy successful
```

---

### **5. Verify Download Works**

**Test download:**
1. Go to: `https://anvil-solo-production.up.railway.app/dashboard`
2. Login with your account
3. Click "Downloads" tab
4. See: **Anvil Solo - Windows Installer**
5. Click **[Download]** button
6. File downloads! ✅

**Direct download URL:**
```
https://anvil-solo-production.up.railway.app/api/downloads/windows-setup
```

---

## 🏠 For Local Testing

### **Option 1: Local Server + Local Download**

```bash
# Terminal 1: Start local server
cd cloud-services
npm run dev

# Terminal 2: Build installer
cd anvil-solo
BUILD-INSTALLER.bat

# Copy to downloads
cd ..
COPY-TO-DOWNLOADS.bat

# Access: http://localhost:3000/dashboard
```

### **Option 2: Local Server + Network Access**

```bash
# Start server
cd cloud-services
npm run dev

# Find your IP
ipconfig
# Look for: IPv4 Address: 192.168.1.xxx

# Share with others on same network:
http://192.168.1.xxx:3000
```

---

## 📦 Installer Configuration

### **What's Configured:**

```json
{
  "installer": "NSIS",
  "version": "3.0.0",
  "adminRequired": true,
  "showLicense": true,
  "allowChangeLocation": true,
  "desktopShortcut": true,
  "startMenuShortcut": true,
  "runAfterInstall": true,
  "uninstaller": true
}
```

### **Installation Flow:**

```
User downloads → Double-clicks
    ↓
UAC prompt (admin permission)
    ↓
License agreement
    ↓
Choose install location
    ↓
Choose shortcuts
    ↓
Installing... (progress bar)
    ↓
Completed → Launch app!
```

---

## 🔧 Files Modified

### **anvil-solo/package.json**
- ✅ Version updated to 3.0.0
- ✅ NSIS configuration added
- ✅ Admin permissions enabled
- ✅ Shortcuts configured

### **anvil-solo/LICENSE.txt**
- ✅ Commercial license created
- ✅ Shows during installation
- ✅ User must accept to continue

### **anvil-solo/BUILD-INSTALLER.bat**
- ✅ One-click build script
- ✅ Cleans + builds + packages
- ✅ Shows progress

### **COPY-TO-DOWNLOADS.bat**
- ✅ Copies to download server
- ✅ Finds installer automatically
- ✅ Ready for deployment

---

## ✅ Complete System Flow

```
Developer → Build installer → Copy to downloads → Deploy to Railway
                                                          ↓
User → Login to dashboard → Click Downloads → Download installer
                                                          ↓
User → Double-click installer → Grant admin → Accept license → Install
                                                          ↓
User → App launches → Enter license key → Start trading! 🚀
```

---

## 📊 Download System Features

### **User Dashboard Shows:**
```
┌────────────────────────────────────────┐
│ 🪟 Anvil Solo - Windows Installer     │
│ Complete installer for Windows 10/11  │
│ Version 3.0.0 • 150 MB • Free         │
│                        [Download]      │
└────────────────────────────────────────┘
```

### **Download History:**
```
Downloaded Files:
- Anvil Solo 3.0.0 (Today, 2:30 PM)
```

### **Direct Links:**
```
https://your-url.railway.app/api/downloads/windows-setup
https://your-url.railway.app/api/downloads/windows-portable
https://your-url.railway.app/api/downloads/mac-dmg
```

---

## 🎯 Summary

### **What You Built:**
1. ✅ Professional Windows installer with UAC
2. ✅ License agreement display
3. ✅ Desktop & Start Menu shortcuts
4. ✅ Proper uninstaller
5. ✅ Download system on license server
6. ✅ User dashboard for downloads
7. ✅ Automated build scripts

### **User Experience:**
1. ✅ Download from secure dashboard
2. ✅ Run professional installer
3. ✅ Grant permissions (normal)
4. ✅ Accept license
5. ✅ Choose location
6. ✅ Install automatically
7. ✅ Launch and use!

### **No Manual Setup Required!**
Everything is handled by the installer:
- ✅ File extraction
- ✅ Shortcut creation
- ✅ Registry entries
- ✅ Start Menu entries
- ✅ Uninstaller
- ✅ Windows integration

---

## 🚀 Ready to Deploy?

Run these 3 commands:

```bash
# 1. Build
cd anvil-solo
BUILD-INSTALLER.bat

# 2. Copy
cd ..
COPY-TO-DOWNLOADS.bat

# 3. Deploy
cd cloud-services
git add .
git commit -m "Add Anvil Solo installer"
git push
```

**That's it!** Your users can now download a professional installer that handles everything! 🎉

