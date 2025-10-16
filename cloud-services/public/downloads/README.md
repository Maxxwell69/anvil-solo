# 📥 Anvil Solo Download Files

**Place Anvil Solo installer files here for users to download**

---

## 📁 Files Needed

Place these files in this folder:

```
cloud-services/public/downloads/
├── anvil-solo-setup.exe         (Windows installer)
├── anvil-solo-portable.zip      (Windows portable)
└── anvil-solo-mac.dmg           (macOS installer)
```

---

## 🔨 How to Create These Files

### **Step 1: Build Anvil Solo**

```bash
cd c:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo

# Install dependencies (if not done)
npm install

# Build the app
npm run build
```

### **Step 2: Package as Installer**

```bash
# Create installer/executable
npm run package
```

This creates files in `anvil-solo/release/` folder.

### **Step 3: Copy to Downloads Folder**

```bash
# From anvil-solo folder, run:
copy release\*.exe ..\cloud-services\public\downloads\anvil-solo-setup.exe
```

Or manually:
1. Open `anvil-solo\release\` folder
2. Find the `.exe` file
3. Copy it to `cloud-services\public\downloads\`
4. Rename to `anvil-solo-setup.exe`

---

## 📦 Creating Portable Version

```bash
# In anvil-solo folder
cd release
7z a anvil-solo-portable.zip win-unpacked\*

# Copy to downloads
copy anvil-solo-portable.zip ..\..\cloud-services\public\downloads\
```

---

## 🍎 For Mac Version

Build on Mac or use cross-platform build:

```bash
# In anvil-solo folder
npm run package:mac

# Copy DMG to downloads folder
```

---

## 🚀 After Adding Files

### **Files Should Be:**
```
public/downloads/
├── anvil-solo-setup.exe (actual file, ~150 MB)
├── anvil-solo-portable.zip (actual file, ~145 MB)
└── README.md (this file)
```

### **Then:**

1. Commit and push to GitHub
2. Railway will deploy
3. Files will be available for download!

**OR for testing locally:**

Just add the files and restart your local server - downloads will work immediately!

---

## 🌐 Download URLs

After setup, files are available at:

```
https://your-url.railway.app/api/downloads/windows-setup
https://your-url.railway.app/api/downloads/windows-portable
https://your-url.railway.app/api/downloads/mac-dmg
```

Users access these from their dashboard download tab!

---

## ⚠️ Important Notes

### **File Size Limits:**

- **Railway**: ~10GB total storage
- **GitHub**: Max 100MB per file (use Git LFS for larger)
- **Recommended**: Use cloud storage (S3, R2) for large files

### **For Production:**

Consider using cloud storage:
- AWS S3
- Cloudflare R2
- Backblaze B2
- Digital Ocean Spaces

See `DOWNLOAD-SYSTEM-SETUP.md` for cloud storage setup.

---

## ✅ Quick Start (Local Testing)

1. Build Anvil Solo
2. Copy exe to this folder
3. Restart license server
4. Go to dashboard → Downloads tab
5. Click download button
6. File downloads!

---

**The download system is ready - just add the files!** 🚀


