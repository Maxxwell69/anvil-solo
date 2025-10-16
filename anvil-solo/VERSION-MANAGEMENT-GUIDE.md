# 📋 Version Management Guide

## Current Version: 3.1.1

---

## 🎯 Version Numbering System

**Format**: `MAJOR.MINOR.PATCH` (e.g., 3.1.1)

- **MAJOR** (3.x.x): Major features, breaking changes
- **MINOR** (x.1.x): New features, non-breaking changes
- **PATCH** (x.x.1): Bug fixes, small improvements

---

## ✅ Checklist for Each Release

When you're ready to release a new version, follow this checklist:

### 1. Update Version Number

**File**: `anvil3.0/anvil-solo/package.json`
```json
{
  "name": "anvil-solo",
  "version": "3.1.2",  ← UPDATE THIS
  ...
}
```

### 2. Update UI Version Display

**File**: `anvil3.0/anvil-solo/src/renderer/index.html`
```html
<div class="logo">
  <h2>⚡ Anvil Solo</h2>
  <span class="version-badge" id="app-version">v3.1.2</span>  ← UPDATE THIS
</div>
```

### 3. Build the App

```powershell
cd anvil3.0\anvil-solo
npm run build
npx electron-builder --win --config.npmRebuild=false
```

**Output**: `release\Anvil Solo-Setup-3.1.2.exe`

### 4. Update Cloud Services Dashboard

**File**: `anvil3.0/cloud-services/public/js/dashboard.js`
```javascript
const availableDownloads = [
    {
        id: 'windows-installer',
        displayName: 'Anvil Solo - Windows Installer',
        description: 'Professional installer - Creates desktop shortcut and Start Menu entry',
        version: '3.1.2',  ← UPDATE THIS
        size: 88635462,
        platform: 'windows',
        downloadUrl: 'https://github.com/Maxxwell69/anvil-solo/releases/download/v3.1.2/Anvil-Solo-Setup-3.1.2.exe'  ← UPDATE THIS
    }
];
```

### 5. Create Git Tag

```powershell
git add .
git commit -m "Release v3.1.2 - [Brief description of changes]"
git tag -a v3.1.2 -m "Version 3.1.2 - [Description]"
git push origin main
git push origin v3.1.2
```

### 6. Create GitHub Release

1. **Go to**: https://github.com/Maxxwell69/anvil-solo/releases
2. **Click**: "Draft a new release"
3. **Tag**: `v3.1.2`
4. **Title**: `Anvil Solo v3.1.2 - [Feature Name]`
5. **Description**: See template below
6. **Upload**: `Anvil Solo-Setup-3.1.2.exe` from `release\` folder
7. **Click**: "Publish release"

### 7. Deploy Cloud Services

```powershell
cd anvil3.0\cloud-services
git add public/js/dashboard.js
git commit -m "Update download link to v3.1.2"
git push
```

Railway will auto-deploy.

### 8. Verify Everything

- ✅ GitHub release has the installer
- ✅ Download link works
- ✅ Cloud dashboard shows correct version
- ✅ App shows version in UI
- ✅ Version matches across all places

---

## 📝 GitHub Release Template

```markdown
## 🚀 What's New in v3.1.2

### ✨ New Features
- Feature 1 description
- Feature 2 description

### 🐛 Bug Fixes
- Fix 1 description
- Fix 2 description

### 🔧 Improvements
- Improvement 1 description
- Improvement 2 description

---

## 📥 Installation

### Windows
1. Download `Anvil-Solo-Setup-3.1.2.exe`
2. Run the installer
3. If Windows SmartScreen appears:
   - Click "More info"
   - Click "Run anyway"
4. Follow the installation wizard

### Upgrading from Previous Version
- Your wallet data will be preserved
- Your strategies will be preserved
- Database will auto-migrate

---

## ⚙️ System Requirements

- Windows 10/11 (64-bit)
- 4 GB RAM minimum
- 200 MB disk space

---

## 🔐 Security Note

This is an unsigned application, which may trigger Windows SmartScreen warnings. This is normal for Electron apps. The application is safe to use.

To verify integrity:
- Check the file hash (SHA256): [INSERT HASH]
- Scan at VirusTotal: https://www.virustotal.com

---

## 📊 What's Included

- ✅ DCA Strategy
- ✅ Ratio Trading Strategy  
- ✅ Bundle Reconcile Strategy
- ✅ Transaction Fee Collection (0.5%)
- ✅ License Management
- ✅ Auto-Updates
- ✅ Real-time Activity Feed
- ✅ DevTools for Debugging

---

## 📞 Support

Issues? Visit: https://github.com/Maxxwell69/anvil-solo/issues

---

**Full Changelog**: https://github.com/Maxxwell69/anvil-solo/compare/v3.1.1...v3.1.2
```

---

## 🔄 Version History

### v3.1.1 (Current)
- ✅ Database migration for fee settings
- ✅ Enhanced fee collection logging
- ✅ Fixed delete modal closing
- ✅ Fee system fully integrated
- ✅ Version badge in UI

### v3.1.0
- ✅ Real-time activity feed
- ✅ DevTools button
- ✅ License server integration
- ✅ Balance display fixes

### v3.0.0
- ✅ Initial release
- ✅ DCA, Ratio, Bundle strategies
- ✅ Jupiter integration
- ✅ Wallet management

---

## 🚀 Quick Update Script

Save this as `UPDATE-VERSION.bat`:

```batch
@echo off
echo ========================================
echo Anvil Solo - Version Update Script
echo ========================================
echo.

set /p VERSION="Enter new version (e.g., 3.1.2): "

echo.
echo Updating to version %VERSION%...
echo.

REM Update package.json
echo [1/4] Updating package.json...
powershell -Command "(gc anvil3.0\anvil-solo\package.json) -replace '\"version\": \".*\"', '\"version\": \"%VERSION%\"' | Out-File -encoding ASCII anvil3.0\anvil-solo\package.json"

REM Update HTML
echo [2/4] Updating UI version badge...
powershell -Command "(gc anvil3.0\anvil-solo\src\renderer\index.html) -replace '<span class=\"version-badge\" id=\"app-version\">v.*</span>', '<span class=\"version-badge\" id=\"app-version\">v%VERSION%</span>' | Out-File -encoding ASCII anvil3.0\anvil-solo\src\renderer\index.html"

REM Update dashboard.js
echo [3/4] Updating cloud services dashboard...
powershell -Command "(gc anvil3.0\cloud-services\public\js\dashboard.js) -replace 'version: ''.*''', 'version: ''%VERSION%''' | Out-File -encoding ASCII anvil3.0\cloud-services\public\js\dashboard.js"
powershell -Command "(gc anvil3.0\cloud-services\public\js\dashboard.js) -replace 'download/v.*/Anvil-Solo-Setup-.*\\.exe', 'download/v%VERSION%/Anvil-Solo-Setup-%VERSION%.exe' | Out-File -encoding ASCII anvil3.0\cloud-services\public\js\dashboard.js"

echo [4/4] Building installer...
cd anvil3.0\anvil-solo
call npm run build
call npx electron-builder --win --config.npmRebuild=false

echo.
echo ========================================
echo ✅ Version Updated to %VERSION%!
echo ========================================
echo.
echo Next steps:
echo 1. Test the installer: release\Anvil Solo-Setup-%VERSION%.exe
echo 2. Create git tag: git tag -a v%VERSION% -m "Version %VERSION%"
echo 3. Push to GitHub: git push origin main && git push origin v%VERSION%
echo 4. Create GitHub release and upload installer
echo 5. Deploy cloud services: cd cloud-services && git push
echo.
pause
```

---

## 📊 Files to Update for Each Release

| File | What to Update | Example |
|------|----------------|---------|
| `package.json` | version field | `"version": "3.1.2"` |
| `index.html` | version-badge span | `<span>v3.1.2</span>` |
| `dashboard.js` | version & downloadUrl | `version: '3.1.2'` |
| Git | Create tag | `git tag v3.1.2` |
| GitHub | Create release | Upload installer |

---

## ✅ Current Status

- **App Version**: 3.1.1
- **UI Shows**: v3.1.1
- **Dashboard Points To**: v3.1.1
- **Git Tag**: v3.1.1 (needs to be created)
- **GitHub Release**: v3.1.1 (needs installer upload)

---

## 🎯 Next Release (3.1.2) Will Include

- [ ] Minimum trade amount validation
- [ ] Enhanced fee collection verification
- [ ] Performance improvements
- [ ] UI enhancements
- [ ] Bug fixes from user feedback

---

**Keep this guide updated with each release!**

