# 🔧 Requirements to Build Proper Installer

## Why You Need This

To create a **proper .exe installer** (not just a zip file), electron-builder needs Windows Build Tools.

---

## ⚠️ The Error You're Seeing

```
ERROR: Cannot create symbolic link : A required privilege is not held by the client
```

**This happens because:**
1. Creating symlinks requires admin permissions
2. OR Windows Build Tools need to be installed

---

## ✅ Solution - 2 Options

### **Option 1: Run as Administrator** (Quick - Try This First)

**1. Close this window**

**2. Right-click on `BUILD-PROPER-INSTALLER.bat`**

**3. Select "Run as administrator"**

**4. Click "Yes" when prompted**

**This should work!** The script will have permission to create symlinks.

---

### **Option 2: Install Windows Build Tools** (If Option 1 Fails)

**Run PowerShell as Administrator:**

```powershell
npm install --global windows-build-tools
```

**Wait 15-30 minutes** (downloads Visual Studio Build Tools)

**Then run:**
```
BUILD-PROPER-INSTALLER.bat
```

---

## 🎯 What You Get

### **With Proper Installer (.exe):**

```
AnvilSolo-Setup-3.1.1.exe  (~150 MB)

When user runs it:
┌─────────────────────────────────┐
│ Anvil Solo Setup Wizard         │
├─────────────────────────────────┤
│                                 │
│ [Next] → License Agreement      │
│ [Next] → Choose Install Location│
│ [Next] → Select Components      │
│ [Install] → Progress Bar        │
│ [Finish] → App Launches         │
│                                 │
└─────────────────────────────────┘

Includes:
✅ Desktop shortcut
✅ Start Menu entry  
✅ Uninstaller
✅ Windows integration
✅ Auto-launch option
✅ Professional experience
```

### **With Portable Version (.zip):**

```
AnvilSolo-Portable-v3.1.1.zip  (~127 MB)

User must:
1. Extract zip
2. Find .exe file
3. Run it manually
4. No shortcuts created
5. No uninstaller

Works but less professional.
```

---

## 🚀 Recommended Approach

**For Production:**
- Use proper installer (.exe)
- Professional experience
- Users expect this

**Requirements:**
- Run build script as administrator
- OR install Windows Build Tools once

**For Quick Testing:**
- Portable version works fine
- Already created and uploaded
- Users can use it now

---

## 📋 Build Commands

### **For Installer (.exe):**
```bash
# Right-click and "Run as administrator"
BUILD-PROPER-INSTALLER.bat
```

### **For Portable (.zip) - What You Have Now:**
```bash
# Already built!
anvil-solo\anvil-solo-fixed.zip
```

---

## ✅ Current Status

**You have:** Portable version (zip) ✅
**You want:** Installer version (.exe) ⚡
**You need:** Run as administrator OR install Build Tools

**Try:** Right-click `BUILD-PROPER-INSTALLER.bat` → "Run as administrator"

---

**This should create the proper installer you want!** 🚀

