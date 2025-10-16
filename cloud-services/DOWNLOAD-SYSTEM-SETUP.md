# 📥 Anvil Solo Download System

**Complete guide to hosting and distributing Anvil Solo from your license server**

---

## 🎯 Overview

Users will be able to:
- ✅ Download Anvil Solo from their dashboard
- ✅ Get the correct version for their OS (Windows/Mac/Linux)
- ✅ Download based on their license tier
- ✅ Automatic download tracking
- ✅ Version management

---

## 📦 Files to Host

### **Anvil Solo Build Files:**

You need to upload these files to be downloadable:

```
anvil-solo-windows-setup.exe     (~150 MB)
anvil-solo-windows-portable.zip  (~145 MB)
anvil-solo-mac.dmg              (~155 MB)
anvil-solo-linux.AppImage       (~150 MB)
```

---

## 🗂️ File Storage Options

### **Option 1: Railway Volume Storage (Best for Railway)**

Railway provides volume storage for files.

**Setup:**
1. In Railway Dashboard → Your Service
2. Go to "Volumes" tab
3. Click "New Volume"
4. Mount path: `/app/downloads`
5. Upload files via FTP or API

### **Option 2: Cloud Storage (Recommended)**

**Use S3, Google Cloud Storage, or similar:**

**AWS S3:**
- Create bucket: `anvil-solo-downloads`
- Upload installer files
- Generate signed URLs for downloads

**Cloudflare R2:**
- Free tier available
- Similar to S3
- No egress fees

**Backblaze B2:**
- Very affordable
- S3-compatible API
- Good for large files

### **Option 3: Direct Server Files (Quick Start)**

Store files directly on Railway:
- Upload to `/public/downloads/` folder
- Serve via static file server
- Limited by Railway disk space (~10GB)

---

## 🔧 Quick Setup: Direct Server Files

### **Step 1: Create Downloads Folder**

In your project:
```
cloud-services/
└── public/
    └── downloads/
        ├── anvil-solo-setup.exe
        ├── anvil-solo-portable.zip
        └── README.txt
```

### **Step 2: Build Anvil Solo**

From your `anvil-solo` directory:

```bash
cd c:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo

# Build for Windows
npm run build

# Package as installer
npm run package
```

This creates installer in `release/` folder.

### **Step 3: Copy to Downloads Folder**

```bash
# Copy built file to cloud-services/public/downloads/
copy release\anvil-solo-setup-3.0.0.exe ..\cloud-services\public\downloads\anvil-solo-setup.exe
```

### **Step 4: Configure Download Metadata**

Files are configured in code - see next section.

---

## 💻 For Home Network Testing

### **Local Network Setup:**

**Option 1: Use Ngrok (Easiest)**

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000
```

You get URL like: `https://abc123.ngrok.io`

**Option 2: Port Forwarding**

1. Find your local IP: `ipconfig`
2. Router admin → Port forwarding
3. Forward port 3000 → Your PC IP
4. Access via: `http://your-public-ip:3000`

**Option 3: Tailscale (Best for Home)**

1. Install Tailscale: https://tailscale.com
2. Access from anywhere: `http://your-pc-tailscale-ip:3000`
3. Works on home network and remotely

---

## 🔗 Configuring Available Downloads

Files are already configured in `src/routes/downloads.ts`:

```typescript
const AVAILABLE_FILES = [
    {
        name: 'anvil-solo-setup.exe',
        version: '3.0.0',
        size: 150000000,
        description: 'Anvil Solo Trading Bot - Windows Setup',
        requiresLicense: true,
        minTier: 'free', // free, tier1, tier2, tier3
    },
    {
        name: 'anvil-solo-portable.zip',
        version: '3.0.0',
        size: 145000000,
        description: 'Anvil Solo - Portable Version',
        requiresLicense: true,
        minTier: 'free',
    },
];
```

---

## 📥 User Download Flow

### **From User Dashboard:**

```
1. User logs in → Dashboard
   ↓
2. Goes to "Downloads" tab
   ↓
3. Sees available files for their tier
   ↓
4. Clicks "Download" button
   ↓
5. Server checks:
   - Has valid license? ✅
   - Tier allows this file? ✅
   - Within download limits? ✅
   ↓
6. Generates secure download token
   ↓
7. User clicks download link
   ↓
8. File downloads to their computer
   ↓
9. Download tracked in database
```

---

## 🎯 Implementation Status

### **Already Built:**
✅ Download tracking database tables  
✅ Download API endpoints  
✅ User dashboard download tab  
✅ Secure token generation  
✅ Download history tracking  

### **Need to Add:**
⏳ Actual file hosting  
⏳ File upload to server  
⏳ Production file serving  

---

Ready to set up the actual file hosting! Would you like to:

1. **Use Railway storage** (upload files to server)
2. **Use cloud storage** (S3, R2, etc. - better for large files)
3. **Test locally first** (home network setup)

Let me know and I'll set it up! 🚀


