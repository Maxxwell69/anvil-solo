# 🚀 How to Distribute Anvil Solo to Users

## Complete Distribution Guide

This guide covers everything from building the installer to getting it in your users' hands.

---

## 📋 Pre-Distribution Checklist

Before distributing, ensure:

- [ ] All features tested and working
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] License system working
- [ ] Version number updated in package.json
- [ ] LICENSE.txt is current

---

## 🔨 Step 1: Build the Installer

### Option A: Quick Build (Recommended)
```bash
cd anvil-solo
BUILD-AND-VERIFY.bat
```

This will:
- Clean previous builds
- Compile TypeScript
- Create installer
- Generate SHA-256 checksums
- Show file sizes

### Option B: Manual Build
```bash
cd anvil-solo
npm install
npm run build
npm run package
```

### Output Location
```
anvil-solo\release\
├── Anvil-Solo-Setup-3.0.0.exe          ← The installer
└── Anvil-Solo-Setup-3.0.0.exe.sha256.txt  ← Verification hash
```

---

## 🧪 Step 2: Test the Installer

**ALWAYS test before distributing!**

### Test on Clean System
1. Use a VM or test computer (not your dev machine)
2. Install Windows 10 or 11 fresh
3. Run the installer
4. Verify all features work
5. Test uninstaller

### Test Checklist
- [ ] Installer runs without errors
- [ ] UAC prompt appears
- [ ] License agreement displays
- [ ] Installation completes successfully
- [ ] Desktop shortcut created
- [ ] Start Menu entries created
- [ ] App launches from shortcuts
- [ ] Wallet creation works
- [ ] Can import wallet
- [ ] Can connect to Jupiter
- [ ] Can create strategies
- [ ] Uninstaller works

---

## 📤 Step 3: Copy to Download Server

### Automated Method (Recommended)
```bash
cd anvil3.0
DISTRIBUTE-TO-USERS.bat
```

This copies:
- ✅ Installer executable
- ✅ SHA-256 checksum
- ✅ All user documentation
- ✅ Download page HTML

### Manual Method
```bash
# Copy installer
copy anvil-solo\release\Anvil-Solo-Setup-3.0.0.exe cloud-services\public\downloads\anvil-solo-setup.exe

# Copy checksum
copy anvil-solo\release\*.sha256.txt cloud-services\public\downloads\

# Copy docs
copy anvil-solo\*.md cloud-services\public\docs\
```

---

## 🌐 Step 4: Deploy to Server

### If Using Railway

```bash
cd cloud-services
git status                               # Check what's changed
git add public/downloads/ public/docs/   # Stage files
git commit -m "Release Anvil Solo v3.0.0"
git push                                 # Deploy to Railway
```

Railway will automatically:
- Build and deploy
- Make files available
- Update the live server

### If Using Other Hosting

Upload these files to your web server:
- `public/downloads/anvil-solo-setup.exe`
- `public/downloads/*.sha256.txt`
- `public/docs/*.md`
- `public/docs/download.html`

---

## 🔗 Step 5: Share Download Links

### Primary Download Link
```
https://anvil-solo-production.up.railway.app/api/downloads/windows-setup
```

### Alternative Links
```
Direct installer:
https://your-domain.com/downloads/anvil-solo-setup.exe

Download page:
https://your-domain.com/docs/download.html

Documentation:
https://your-domain.com/docs/installation-guide.md
https://your-domain.com/docs/quick-start-guide.md
https://your-domain.com/docs/user-manual.md
```

### Checksum for Verification
Share the SHA-256 hash from the `.sha256.txt` file so users can verify their download wasn't tampered with.

---

## 📧 Step 6: Notify Users

### Email Template

```
Subject: Anvil Solo v3.0.0 Now Available!

Hi [User],

Anvil Solo v3.0.0 is now available for download!

📥 DOWNLOAD:
https://anvil-solo-production.up.railway.app/api/downloads/windows-setup

📋 QUICK INSTALL:
1. Download the installer (150 MB)
2. Run the .exe file
3. Click "Yes" when Windows asks permission
4. Follow the wizard
5. Start trading!

🔒 VERIFY YOUR DOWNLOAD (Optional):
SHA-256: [paste hash from .sha256.txt file]

📚 DOCUMENTATION:
- Installation Guide: https://your-domain.com/docs/installation-guide.md
- Quick Start: https://your-domain.com/docs/quick-start-guide.md
- Full Manual: https://your-domain.com/docs/user-manual.md

⚠️ SECURITY NOTE:
If Windows shows "Windows protected your PC", click "More info" then 
"Run anyway". This is normal for new software.

Need help? Reply to this email or visit your dashboard.

Happy trading!
The Anvil Labs Team
```

---

## 💬 Social Media Announcement

### Twitter/X Post
```
🚀 Anvil Solo v3.0.0 is LIVE!

Professional Solana trading bot with:
✅ DCA automation
✅ Volume generation  
✅ Bundle trading
✅ Jupiter integration

Download for Windows:
[link]

#Solana #Trading #Crypto
```

### Discord Announcement
```
@everyone 

🎉 Anvil Solo v3.0.0 Released! 🎉

Download now: [link]

What's new:
• Improved performance
• Better Jupiter integration
• Enhanced security
• New bundle features
• Redesigned UI

Windows 10/11 only. 
See #installation-help if you need assistance!
```

---

## 📊 Step 7: Monitor Distribution

### Track Downloads
Check your server logs for:
- Number of downloads
- Download locations (geography)
- Successful completions
- Any error patterns

### Collect Feedback
Monitor for:
- Installation issues
- First-run problems
- Common questions
- Feature requests

### Quick Stats Dashboard
If using Railway with analytics:
```
Visit your Railway dashboard
→ Deployments
→ Metrics
→ Check bandwidth usage (indicates downloads)
```

---

## 🐛 Common Distribution Issues

### Issue: Download is Slow
**Cause:** Large file size + server bandwidth

**Solutions:**
- Use CDN for distribution
- Compress installer (already optimized)
- Use download mirror
- Upgrade hosting plan

---

### Issue: Users Can't Download
**Cause:** Server offline, wrong URL, or firewall

**Solutions:**
- Verify server is running
- Test download link yourself
- Check server logs
- Provide alternative download source

---

### Issue: Antivirus Flags Installer
**Cause:** Unsigned executable

**Solutions:**
- Expected for new software
- Add instructions to user docs
- Consider code signing certificate ($100-300/year)
- Submit to Microsoft SmartScreen for reputation

---

### Issue: Installation Fails for Users
**Cause:** Insufficient permissions, corrupted download

**Solutions:**
- Tell users to "Run as administrator"
- Verify checksum matches
- Provide alternative download link
- Check if antivirus is interfering

---

## 🔐 Security Best Practices

### Code Signing (Optional but Recommended)

**Why:** Eliminates "Windows protected your PC" warnings

**How:**
1. Purchase code signing certificate ($100-300/year)
   - DigiCert
   - Sectigo
   - GlobalSign
2. Sign the installer before distribution
3. Windows will trust it immediately

**Command to Sign:**
```bash
signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 "Anvil-Solo-Setup-3.0.0.exe"
```

### Checksum Verification

Always provide SHA-256 hash:
1. Generate during build (BUILD-AND-VERIFY.bat does this)
2. Share hash publicly (website, email, Discord)
3. Users can verify with: `certutil -hashfile installer.exe SHA256`

### Secure Distribution Checklist
- [ ] HTTPS for all download links
- [ ] SHA-256 checksum provided
- [ ] Checksum shared via multiple channels
- [ ] Download page on secure domain
- [ ] Server access logs monitored
- [ ] Malware scan before distribution

---

## 📈 Distribution Channels

### 1. Your Dashboard (Primary)
Users log in and download from their account

**Pros:**
- License verification
- Download tracking
- User management

### 2. Direct Download Link
Public or private link to installer

**Pros:**
- Simple
- Fast
- No login required

**Cons:**
- No tracking
- No verification

### 3. GitHub Releases
Upload to GitHub as a release

**Pros:**
- Automatic versioning
- Download statistics
- Change log display
- CDN distribution

**How:**
```bash
# Create release on GitHub
1. Go to your repo
2. Releases → Create new release
3. Tag: v3.0.0
4. Upload: Anvil-Solo-Setup-3.0.0.exe
5. Add release notes
6. Publish
```

### 4. Download Aggregators
- Softpedia
- Download.com
- FileHippo

**Note:** Requires submission and approval

---

## 🎯 Distribution Checklist

Before releasing to public:

- [ ] Installer built and tested
- [ ] Documentation complete
- [ ] Checksum generated
- [ ] Files uploaded to server
- [ ] Download links tested
- [ ] Server has capacity
- [ ] Support channels ready
- [ ] Announcement prepared
- [ ] Monitoring in place
- [ ] Backup download location ready

---

## 🔄 Update Distribution

When releasing updates:

### Version the Files
```
anvil-solo-setup-3.0.0.exe  ← Old version
anvil-solo-setup-3.1.0.exe  ← New version
anvil-solo-setup.exe        ← Always latest (symlink)
```

### Keep Old Versions
- Users might need to downgrade
- Good for debugging
- Helps support team

### Notify Existing Users
```
Subject: Anvil Solo v3.1.0 Update Available

New features in v3.1.0:
• [Feature 1]
• [Feature 2]
• [Bug fixes]

Download: [link]

Your current version will continue to work, but we recommend upgrading.
```

### Auto-Update (Future Feature)
Configure electron-updater in the app:
- Checks for updates on launch
- Downloads in background
- Prompts user to restart
- Installs automatically

---

## 📞 Support During Launch

### Be Available
First 24-48 hours are critical:
- Monitor email
- Watch Discord/social
- Check error logs
- Quick bug fixes ready

### Common Launch Day Issues
1. Installation problems
2. Antivirus false positives
3. Windows permission issues
4. Server overload
5. Documentation questions

### Have Ready
- FAQ document
- Video tutorial
- Support staff
- Backup download server
- Quick-fix updates ready

---

## ✅ Distribution Complete!

You're ready to distribute Anvil Solo to users!

**Quick Command Sequence:**
```bash
cd anvil-solo
BUILD-AND-VERIFY.bat

cd ..
DISTRIBUTE-TO-USERS.bat

cd cloud-services
git add .
git commit -m "Release v3.0.0"
git push

# Share download link!
```

**Users need:**
1. Download link
2. Installation instructions
3. Quick start guide
4. Support contact

**You have:**
1. ✅ Professional installer
2. ✅ Complete documentation
3. ✅ Security checksums
4. ✅ Distribution system

**Go launch! 🚀**

