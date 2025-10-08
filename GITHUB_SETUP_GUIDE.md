# 🚀 GitHub Setup & Deployment Guide

## Your Repository: https://github.com/Maxxwell69/anvil-solo

---

## 📦 PUSH YOUR CODE TO GITHUB

### Step 1: Initialize Git (if not already done)

```bash
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Complete Anvil Solo with License & Admin System"
```

### Step 2: Connect to Your GitHub Repository

```bash
# Add remote repository
git remote add origin https://github.com/Maxxwell69/anvil-solo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note:** You may need to authenticate with GitHub. Use a Personal Access Token instead of password.

### Step 3: Create Personal Access Token (If Needed)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (all), `workflow`
4. Generate token
5. Copy token (you won't see it again!)
6. Use token as password when pushing

---

## 🔑 CONFIGURE AUTO-UPDATES

Your app is already configured to use GitHub Releases for auto-updates!

### Configuration (Already Done! ✅)

**File:** `anvil-solo/package.json`
```json
"publish": {
  "provider": "github",
  "owner": "Maxxwell69",
  "repo": "anvil-solo",
  "releaseType": "release"
}
```

### How Auto-Updates Work:

1. You create a new version: `npm version patch`
2. You push tag: `git push --tags`
3. GitHub Actions builds installers
4. Published to GitHub Releases
5. **Users get auto-updated!** ✨

---

## 🏗️ CREATE YOUR FIRST RELEASE

### Step 1: Build the Application

```bash
cd anvil-solo

# Build TypeScript
npm run build

# Create installer
npm run package

# Installers created in: anvil-solo/release/
```

### Step 2: Create GitHub Release

**Option A: Manual Upload**

1. Go to https://github.com/Maxxwell69/anvil-solo/releases
2. Click "Create a new release"
3. Tag: `v1.0.0`
4. Title: `Anvil Solo v1.0.0 - Initial Release`
5. Upload files from `anvil-solo/release/`:
   - `anvil-solo-setup-1.0.0.exe` (Windows)
   - `anvil-solo-1.0.0.dmg` (Mac) 
   - `anvil-solo-1.0.0.AppImage` (Linux)
   - `latest.yml` (auto-update config)
6. Click "Publish release"

**Option B: Automated (GitHub Actions)**

Already configured! Just push a tag:

```bash
# Set version
cd anvil-solo
npm version 1.0.0

# Push tag
git push origin v1.0.0

# GitHub Actions will automatically:
# - Build for Windows, Mac, Linux
# - Create installers
# - Publish to releases
# - Enable auto-updates!
```

---

## 🔧 GITHUB ACTIONS SETUP

### Enable GitHub Actions

1. Go to https://github.com/Maxxwell69/anvil-solo/settings/actions
2. Enable "Allow all actions and reusable workflows"
3. Save

### Required Secrets

**For GitHub Actions to publish releases:**

1. Go to https://github.com/Maxxwell69/anvil-solo/settings/secrets/actions
2. No additional secrets needed! `GITHUB_TOKEN` is automatic

### Workflow File

Already created: `.github/workflows/release.yml`

This will:
- ✅ Build on Windows, Mac, Linux
- ✅ Create installers
- ✅ Publish to GitHub Releases
- ✅ Trigger user auto-updates

---

## 📚 REPOSITORY STRUCTURE

### What to Commit:

✅ **Source code** (`anvil-solo/src/`)
✅ **Documentation** (all .md files)
✅ **Admin API** (`services/license-api/`)
✅ **Admin Dashboard** (`apps/admin-dashboard/`)
✅ **Build configs** (`package.json`, `tsconfig.json`)
✅ **GitHub Actions** (`.github/workflows/`)

### What NOT to Commit:

❌ `node_modules/` (dependencies)
❌ `dist/` (build output)
❌ `release/` (installers)
❌ `.env` (environment variables)
❌ `*.db` (database files)
❌ Private keys or secrets

**Already configured in `.gitignore`!** ✅

---

## 🌐 DEPLOY ADMIN API

### Deploy to Railway (Recommended)

1. **Connect Railway to GitHub:**
   - Go to https://railway.app
   - "New Project" → "Deploy from GitHub repo"
   - Select: `Maxxwell69/anvil-solo`
   - Root directory: `services/license-api`

2. **Add PostgreSQL:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - `DATABASE_URL` will be auto-set

3. **Set Environment Variables:**
   ```
   JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ADMIN_API_KEY=<random-32-character-string>
   NODE_ENV=production
   ```

4. **Initialize Database:**
   - In Railway dashboard → PostgreSQL → Query
   - Copy contents of `services/license-api/schema.sql`
   - Paste and execute

5. **Deploy!**
   - Railway auto-deploys on every git push
   - Get your URL: `https://anvil-admin-api.up.railway.app`

6. **Update Desktop App:**
   - Edit `anvil-solo/src/main/license/manager.ts`
   - Line 5: Change URL to your Railway URL
   - Rebuild and redeploy

---

## 🔄 CONTINUOUS DEPLOYMENT

### Auto-Deploy Flow:

```
1. Make changes to code
   ↓
2. Commit: git add . && git commit -m "New feature"
   ↓
3. Push: git push
   ↓
4. Railway auto-deploys API (if changed)
   ↓
5. For desktop app: npm version patch && git push --tags
   ↓
6. GitHub Actions builds & publishes
   ↓
7. Users get auto-updated!
```

---

## 📊 MONITOR YOUR DEPLOYMENT

### Check Admin API:

```bash
# Health check
curl https://your-app.railway.app/health

# Should return:
# {"status":"ok","service":"anvil-license-api"}
```

### Check GitHub Actions:

1. Go to https://github.com/Maxxwell69/anvil-solo/actions
2. See build status for each push
3. Download build artifacts if needed

### Check Releases:

1. Go to https://github.com/Maxxwell69/anvil-solo/releases
2. See all published versions
3. Download installers
4. Check auto-update files (latest.yml)

---

## 💡 BEST PRACTICES

### Branching Strategy:

```
main          ← Production (auto-deploys)
├── develop   ← Development (testing)
└── feature/* ← New features
```

### Commit Messages:

```
✨ feat: Add new strategy type
🐛 fix: Fix Jupiter API retry logic
📝 docs: Update user guide
🎨 style: Improve UI layout
⚡ perf: Optimize swap execution
🔧 chore: Update dependencies
```

### Release Process:

1. Merge features to `develop`
2. Test thoroughly
3. Merge to `main`
4. Tag version: `git tag v1.0.1`
5. Push: `git push --tags`
6. GitHub Actions handles the rest!

---

## 🎯 QUICK COMMANDS

### Development:

```bash
# Build and run
cd anvil-solo
npm run build && npm start

# Watch mode (rebuild on changes)
npm run dev

# Package for distribution
npm run package
```

### Git Workflow:

```bash
# Daily workflow
git add .
git commit -m "Description of changes"
git push

# Create new release
cd anvil-solo
npm version patch  # or minor, or major
git push
git push --tags

# View commit history
git log --oneline --graph
```

### Railway Deployment:

```bash
# View logs
railway logs

# Connect to database
railway run psql

# Re-deploy
git push origin main
```

---

## 📦 DISTRIBUTION

### For Beta Testers:

**Option 1: Direct Download**
- Build installer: `npm run package`
- Upload to Google Drive/Dropbox
- Share link

**Option 2: GitHub Releases (Recommended)**
- Push tag to GitHub
- Users download from Releases page
- Auto-updates work!

### For Public Launch:

1. **Create landing page** (or use GitHub Pages)
2. **Set up Stripe** for payments
3. **Deploy admin API** to Railway
4. **Publish to GitHub Releases**
5. **Market on social media**
6. **Start selling!** 💰

---

## 🚨 IMPORTANT REMINDERS

### Before Pushing:

- ✅ `.gitignore` is configured (don't commit secrets!)
- ✅ Remove any test private keys
- ✅ Update LICENSE file if needed
- ✅ Review README for accuracy
- ✅ Test build locally first

### Before Public Release:

- ✅ Set up fee wallet address
- ✅ Deploy admin API
- ✅ Test license activation
- ✅ Create test licenses
- ✅ Write Terms of Service
- ✅ Write Privacy Policy
- ✅ Set up support email

### Security Checklist:

- ✅ No private keys in code
- ✅ No API secrets in code
- ✅ Environment variables for sensitive data
- ✅ Strong JWT_SECRET set
- ✅ HTTPS enforced
- ✅ Input validation on all endpoints

---

## 🎉 YOU'RE ALL SET!

### What's Configured:

✅ **GitHub Repository:** https://github.com/Maxxwell69/anvil-solo  
✅ **Auto-Updates:** Configured for your repo  
✅ **Build Pipeline:** GitHub Actions ready  
✅ **Admin API:** Ready to deploy to Railway  
✅ **Documentation:** Complete and professional  

### Next Steps:

1. ✅ **Push code to GitHub** (commands above)
2. ✅ **Enable GitHub Actions**
3. ✅ **Deploy admin API to Railway**
4. ✅ **Create first release**
5. ✅ **Start distributing!**

---

## 📞 Need Help?

**Questions about:**
- Git/GitHub → https://docs.github.com
- Railway → https://docs.railway.app
- Electron Builder → https://www.electron.build
- GitHub Actions → https://docs.github.com/actions

---

**Ready to push? Run the commands above and let's go live!** 🚀

**Your GitHub:**https://github.com/Maxxwell69/anvil-solo


