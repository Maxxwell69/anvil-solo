# 🎯 Anvil Solo Professional Installer Guide

## What the Installer Does

Your Anvil Solo installer is now configured as a **professional Windows installer** that handles everything automatically.

---

## 🔐 User Experience During Installation

### **Step 1: User Downloads Installer**
- File name: `Anvil-Solo-Setup-3.0.0.exe`
- Size: ~150 MB
- Downloaded from your license server dashboard

### **Step 2: User Runs Installer**
When they double-click the installer:

```
┌─────────────────────────────────────────┐
│  Windows Security Warning               │
│                                         │
│  Do you want to allow this app to      │
│  make changes to your device?           │
│                                         │
│  Anvil Solo Setup                       │
│  Publisher: Anvil Labs                  │
│                                         │
│     [Yes]  [No]                         │
└─────────────────────────────────────────┘
```

✅ **This is NORMAL and REQUIRED** - it's asking for admin permissions

### **Step 3: License Agreement**
```
┌─────────────────────────────────────────┐
│  Anvil Solo Setup                       │
│                                         │
│  License Agreement                      │
│  ─────────────────────────────          │
│  ANVIL SOLO LICENSE AGREEMENT           │
│                                         │
│  Copyright (c) 2025 Anvil Labs...       │
│                                         │
│  [Scroll to read full agreement]        │
│                                         │
│  ☐ I accept the agreement               │
│                                         │
│     [Back]  [Next]  [Cancel]            │
└─────────────────────────────────────────┘
```

User must check the box to continue.

### **Step 4: Installation Location**
```
┌─────────────────────────────────────────┐
│  Anvil Solo Setup                       │
│                                         │
│  Select Destination Location            │
│  ─────────────────────────────          │
│  Where should Anvil Solo be installed?  │
│                                         │
│  C:\Program Files\Anvil Solo            │
│                                         │
│     [Browse...]                         │
│                                         │
│  Space required: 500 MB                 │
│  Space available: 50 GB                 │
│                                         │
│     [Back]  [Next]  [Cancel]            │
└─────────────────────────────────────────┘
```

Default: `C:\Program Files\Anvil Solo` ✅ Professional location

### **Step 5: Start Menu Folder**
```
┌─────────────────────────────────────────┐
│  Anvil Solo Setup                       │
│                                         │
│  Select Start Menu Folder               │
│  ─────────────────────────────          │
│  Start Menu folder: Anvil Solo          │
│                                         │
│  ☑ Create a desktop shortcut            │
│                                         │
│     [Back]  [Next]  [Cancel]            │
└─────────────────────────────────────────┘
```

✅ Desktop shortcut is checked by default

### **Step 6: Ready to Install**
```
┌─────────────────────────────────────────┐
│  Anvil Solo Setup                       │
│                                         │
│  Ready to Install                       │
│  ─────────────────────────────          │
│  Setup is ready to install:             │
│                                         │
│  Installation folder:                   │
│    C:\Program Files\Anvil Solo          │
│                                         │
│  Start Menu folder:                     │
│    Anvil Solo                           │
│                                         │
│  Additional tasks:                      │
│    - Create desktop shortcut            │
│                                         │
│     [Back]  [Install]  [Cancel]         │
└─────────────────────────────────────────┘
```

### **Step 7: Installing**
```
┌─────────────────────────────────────────┐
│  Anvil Solo Setup                       │
│                                         │
│  Installing                             │
│  ─────────────────────────────          │
│  Please wait while Setup installs       │
│  Anvil Solo on your computer.           │
│                                         │
│  [████████░░░░░░░░░░] 45%              │
│                                         │
│  Extracting files...                    │
│                                         │
│     [Cancel]                            │
└─────────────────────────────────────────┘
```

Takes 1-2 minutes depending on system.

### **Step 8: Completed**
```
┌─────────────────────────────────────────┐
│  Anvil Solo Setup                       │
│                                         │
│  Completing Anvil Solo Setup            │
│  ─────────────────────────────          │
│  Setup has finished installing          │
│  Anvil Solo on your computer.           │
│                                         │
│  ☑ Launch Anvil Solo                    │
│                                         │
│     [Finish]                            │
└─────────────────────────────────────────┘
```

✅ If checked, Anvil Solo launches automatically!

---

## 📂 What Gets Installed

### **Program Files:**
```
C:\Program Files\Anvil Solo\
├── Anvil Solo.exe          # Main application
├── resources\              # Application resources
├── locales\                # Language files
└── uninstall.exe           # Uninstaller
```

### **Start Menu:**
```
Start Menu → All Programs → Anvil Solo
├── Anvil Solo              # Launch app
└── Uninstall Anvil Solo    # Uninstaller
```

### **Desktop:**
```
Desktop\
└── Anvil Solo.lnk          # Desktop shortcut
```

### **Application Data:**
```
C:\Users\[Username]\AppData\Roaming\anvil-solo\
├── strategies.db           # User strategies
├── settings.json           # User settings
└── logs\                   # Application logs
```

---

## 🗑️ Uninstallation

Users can uninstall via:

### **Method 1: Start Menu**
1. Click Start
2. Find "Anvil Solo"
3. Click "Uninstall Anvil Solo"

### **Method 2: Control Panel**
1. Open Control Panel
2. Programs → Uninstall a program
3. Find "Anvil Solo"
4. Click "Uninstall"

### **Method 3: Settings (Windows 10/11)**
1. Settings → Apps
2. Find "Anvil Solo"
3. Click "Uninstall"

**What gets removed:**
- ✅ Program Files
- ✅ Desktop shortcut
- ✅ Start Menu entries
- ✅ Registry entries
- ❌ User data (preserved by default)

---

## 🔧 Build the Installer

### **Quick Build:**
```bash
# From anvil-solo directory:
BUILD-INSTALLER.bat
```

### **Manual Build:**
```bash
cd anvil-solo

# Install dependencies
npm install

# Build application
npm run build

# Create installer
npm run package
```

### **Output:**
```
release\
└── Anvil-Solo-Setup-3.0.0.exe  ← Professional installer!
```

---

## 🚀 Deploy to Download Server

### **Step 1: Build Installer**
```bash
cd anvil-solo
BUILD-INSTALLER.bat
```

### **Step 2: Copy to Server**
```bash
cd ..
COPY-TO-DOWNLOADS.bat
```

### **Step 3: Deploy to Railway**
```bash
cd cloud-services
git add public/downloads/
git commit -m "Add Anvil Solo installer"
git push
```

---

## ✅ Installer Features Checklist

- ✅ Administrator permission request (UAC)
- ✅ License agreement display
- ✅ Custom installation directory
- ✅ Desktop shortcut creation
- ✅ Start Menu entries
- ✅ Professional install wizard
- ✅ Progress bar during install
- ✅ Launch app after install option
- ✅ Complete uninstaller
- ✅ Windows integration
- ✅ Program Files installation
- ✅ Proper file associations
- ✅ Preserved user data on uninstall

---

## 🎯 What Makes This Professional

### **Security:**
- ✅ Requests admin permissions properly
- ✅ Signed installer (can be added later)
- ✅ UAC integration
- ✅ Installs to protected directory

### **User Experience:**
- ✅ Multi-step wizard (not silent/one-click)
- ✅ User can choose install location
- ✅ Shows license agreement
- ✅ Creates shortcuts automatically
- ✅ Launches app after install

### **System Integration:**
- ✅ Appears in Control Panel
- ✅ Appears in Windows Settings
- ✅ Proper Start Menu entries
- ✅ Desktop shortcut
- ✅ Uninstaller included

### **Maintainability:**
- ✅ Version number in filename
- ✅ Easy to rebuild
- ✅ Automated build script
- ✅ Preserves user data

---

## 📝 Testing Checklist

Before distributing:

1. ✅ Run installer on clean Windows machine
2. ✅ Verify UAC prompt appears
3. ✅ Check license agreement shows
4. ✅ Confirm installation location
5. ✅ Verify desktop shortcut created
6. ✅ Check Start Menu entries
7. ✅ Launch app from shortcuts
8. ✅ Test app functionality
9. ✅ Run uninstaller
10. ✅ Verify clean removal

---

## 🆘 Troubleshooting

### **"Windows protected your PC" message:**
```
┌─────────────────────────────────────────┐
│  Windows protected your PC              │
│  Microsoft Defender SmartScreen         │
│  prevented an unrecognized app          │
│                                         │
│     [Don't run]                         │
│     [More info] ← Click this            │
└─────────────────────────────────────────┘
```

**Solution for users:**
1. Click "More info"
2. Click "Run anyway"

**Solution for you (optional):**
- Sign the installer with a code signing certificate
- Cost: ~$100-300/year
- Prevents this warning

### **"Not signed" warning:**
- Normal for unsigned installers
- Can be ignored by clicking "Run anyway"
- Or purchase code signing certificate

### **Install fails:**
- Make sure user has admin rights
- Check antivirus isn't blocking
- Try "Run as administrator"

---

## 🎯 Summary

Your installer is now **production-ready** and provides a **professional installation experience**:

1. ✅ User downloads from dashboard
2. ✅ Runs installer
3. ✅ Grants admin permission
4. ✅ Reads license agreement
5. ✅ Chooses install location
6. ✅ Installer does everything automatically
7. ✅ App launches and works!

**No manual setup required by users!** 🚀

