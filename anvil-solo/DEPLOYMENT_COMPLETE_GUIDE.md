# Anvil Solo - Complete Deployment Guide

This guide covers deploying the full monetization system with license management, cloud backup, and auto-updates.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploy License API](#deploy-license-api)
3. [Configure Desktop App](#configure-desktop-app)
4. [Set Up Auto-Updates](#set-up-auto-updates)
5. [Create Releases](#create-releases)
6. [Monetization Setup](#monetization-setup)

---

## 🛠️ Prerequisites

### Required Accounts:
- ✅ GitHub account (for releases & actions)
- ✅ Railway.app or Heroku account (for license API)
- ✅ Stripe or Paddle account (for payments - optional for now)

### Local Requirements:
- ✅ Node.js 20+ installed
- ✅ PostgreSQL (for local testing)
- ✅ Git installed

---

## 🚀 1. Deploy License API

### Option A: Railway.app (Recommended - Easiest)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   - Set root directory to `services/license-api`

3. **Add PostgreSQL**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   JWT_SECRET=<generate-random-32-char-string>
   PORT=3001
   ```
   
   Generate JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy**
   - Railway will auto-deploy
   - Get your URL: https://your-app.railway.app
   - Save this URL!

6. **Initialize Database**
   - Go to Railway dashboard → PostgreSQL → Query tab
   - Copy & paste contents of `services/license-api/schema.sql`
   - Run query

### Option B: Heroku

```bash
cd services/license-api
heroku create anvil-license-api
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set NODE_ENV=production
git subtree push --prefix services/license-api heroku main
heroku run psql < schema.sql
```

### Option C: Render.com

1. Create new Web Service
2. Connect GitHub repo
3. Set root directory: `services/license-api`
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

---

## ⚙️ 2. Configure Desktop App

### Update License API URL

**File:** `anvil-solo/src/main/license/manager.ts`

Change line 5:
```typescript
const LICENSE_API_URL = process.env.LICENSE_API_URL || 'https://your-license-api.railway.app';
```

Replace `your-license-api.railway.app` with your actual Railway URL!

### Rebuild App

```bash
cd anvil-solo
npm run build
npm start
```

### Test License Activation

1. Open app
2. Go to Settings (⚙️ icon)
3. Enter test license key: `ANVIL-PRO-TEST-0001`
4. Click "Activate License"
5. Should see "PRO tier" activated!

---

## 🔄 3. Set Up Auto-Updates

### Using GitHub Releases (FREE - Recommended)

1. **Update package.json publish settings**
   
   File: `anvil-solo/package.json`
   ```json
   "publish": {
     "provider": "github",
     "owner": "YOUR-GITHUB-USERNAME",
     "repo": "anvil-solo",
     "releaseType": "release"
   }
   ```
   
   Replace `YOUR-GITHUB-USERNAME` with your actual GitHub username.

2. **Create GitHub Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create token with `repo` scope
   - Save token securely

3. **Set Token in Environment**
   
   Windows:
   ```powershell
   $env:GH_TOKEN="your-github-token"
   ```
   
   Mac/Linux:
   ```bash
   export GH_TOKEN="your-github-token"
   ```

4. **Build & Publish First Release**
   ```bash
   cd anvil-solo
   npm version 1.0.0  # Set initial version
   npm run build
   npm run package
   ```
   
   This creates installers in `anvil-solo/release/`

5. **Upload to GitHub**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   
   Or manually create a release on GitHub and upload the installers.

### Alternative: Self-Hosted on S3

If you prefer AWS S3:

1. Update `package.json`:
   ```json
   "publish": {
     "provider": "s3",
     "bucket": "anvil-solo-updates",
     "region": "us-east-1"
   }
   ```

2. Set AWS credentials:
   ```bash
   export AWS_ACCESS_KEY_ID=xxx
   export AWS_SECRET_ACCESS_KEY=xxx
   ```

---

## 📦 4. Create Releases

### Automated via GitHub Actions

**Already configured!** The workflow in `.github/workflows/release.yml` will:

1. Build for Windows, Mac, Linux
2. Create installers
3. Upload to GitHub Releases
4. Trigger auto-updates for users

**To release a new version:**

```bash
# Update version
cd anvil-solo
npm version patch  # or minor, or major

# Push tag
git push && git push --tags
```

GitHub Actions will automatically build and publish!

### Manual Releases

```bash
cd anvil-solo
npm run build
npm run package
```

Then upload files from `release/` to GitHub Releases manually.

---

## 💳 5. Monetization Setup

### Generate License Keys

```bash
cd services/license-api
npm run dev
```

Create a simple admin script:

**File:** `services/license-api/src/generateKey.ts`

```typescript
import { pool } from './index';

async function createLicense(tier: string, expiresInDays: number | null, email?: string) {
  const key = generateLicenseKey();
  const expiresAt = expiresInDays ? 
    new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;
  
  await pool.query(
    'INSERT INTO licenses (license_key, tier, email, expires_at) VALUES ($1, $2, $3, $4)',
    [key, tier, email, expiresAt]
  );
  
  console.log(`✅ Created ${tier} license: ${key}`);
  return key;
}

// Usage:
createLicense('pro', 30, 'customer@email.com').then(() => process.exit());
```

Run:
```bash
ts-node src/generateKey.ts
```

### Integrate with Stripe

1. Create Stripe account
2. Create products for each tier
3. On successful payment, generate and email license key
4. Use Stripe webhooks to handle subscriptions

Example webhook handler:
```typescript
app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const tier = session.metadata.tier;
    const email = session.customer_email;
    
    // Generate and email license
    const licenseKey = await createLicense(tier, 30, email);
    await sendLicenseEmail(email, licenseKey);
  }
  
  res.json({ received: true });
});
```

---

## 🧪 Testing End-to-End

### 1. Test License API

```bash
# Test activation
curl -X POST https://your-api.railway.app/api/license/activate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "ANVIL-PRO-TEST-0001",
    "hwid": "test-hardware-id"
  }'
```

Expected response:
```json
{
  "success": true,
  "token": "jwt-token...",
  "tier": "pro",
  "features": { ... }
}
```

### 2. Test Desktop App

1. Launch app
2. Go to Settings → License
3. Enter: `ANVIL-PRO-TEST-0001`
4. Click "Activate License"
5. Should show "PRO tier"
6. Try creating multiple strategies (should work)

### 3. Test Updates

1. Build version 1.0.0
2. Install on test machine
3. Build version 1.0.1
4. Publish to GitHub Releases
5. App should detect and offer update

---

## 📊 Monitoring & Analytics

### Track License Activations

Add to license API:

```typescript
app.get('/api/admin/stats', async (req, res) => {
  const stats = await pool.query(`
    SELECT 
      tier,
      COUNT(*) as count,
      COUNT(CASE WHEN hwid IS NOT NULL THEN 1 END) as activated
    FROM licenses
    GROUP BY tier
  `);
  
  res.json({ stats: stats.rows });
});
```

### User Metrics

Track in database:
- Active users (from `last_validated` timestamp)
- Revenue (from Stripe)
- Popular tiers
- Churn rate

---

## 🔒 Security Checklist

### Before Going Live:

- ✅ Change JWT_SECRET to strong random value
- ✅ Enable HTTPS only (Railway/Heroku handle this)
- ✅ Add rate limiting to API endpoints
- ✅ Set up monitoring/alerts
- ✅ Code sign your desktop app installers
- ✅ Test license deactivation flow
- ✅ Verify hardware ID binding works
- ✅ Test with expired license
- ✅ Test cloud backup with real data

### Code Signing (for trusted installers)

**Windows:**
- Get code signing certificate ($100-500/year)
- Use SignTool or electron-builder

**Mac:**
- Apple Developer Account ($99/year)
- Get Developer ID certificate
- Notarize the app

**Linux:**
- No signing required for AppImage

---

## 💰 Estimated Costs

### Minimum Setup (for launch):
- Railway.app: **$5-10/month** (includes PostgreSQL)
- GitHub: **FREE** (for releases)
- **Total: ~$10/month**

### Professional Setup:
- Railway/Heroku: **$20/month**
- Stripe: **2.9% + 30¢ per transaction**
- Code signing cert (Windows): **~$100/year**
- Apple Developer: **$99/year**
- **Total: ~$240/year + transaction fees**

### Expected ROI:
- 10 PRO users = $990/month revenue
- Costs = ~$20/month
- **Profit = $970/month** 🚀

---

## 📞 Support & Troubleshooting

### Common Issues:

**License API won't deploy:**
- Check DATABASE_URL is set
- Verify PostgreSQL database exists
- Run schema.sql to create tables

**Auto-updates not working:**
- Verify GH_TOKEN is set
- Check GitHub release assets exist
- Ensure version numbers follow semver

**License activation fails:**
- Check API URL in license/manager.ts
- Verify JWT_SECRET matches on server
- Check network connectivity

### Get Help:

- Check logs in Railway dashboard
- Test API endpoints with curl/Postman
- Enable debug logging in desktop app

---

## 🎯 Launch Checklist

Before launching to customers:

- ✅ License API deployed and tested
- ✅ Test licenses working
- ✅ Desktop app connects to API
- ✅ Feature gating works
- ✅ Auto-update system tested
- ✅ GitHub releases configured
- ✅ Payment system integrated (Stripe)
- ✅ Customer support email set up
- ✅ Terms of Service created
- ✅ Privacy Policy created
- ✅ Landing page/website
- ✅ Documentation updated

---

## 🚢 Quick Launch (Minimal Viable)

If you want to launch ASAP with just core features:

1. **Deploy License API** (15 minutes)
   - Railway.app + PostgreSQL
   - Set JWT_SECRET
   - Run schema.sql

2. **Update App Config** (2 minutes)
   - Change LICENSE_API_URL in manager.ts
   - Rebuild app

3. **Test Locally** (10 minutes)
   - Activate test license
   - Verify tier shows correctly
   - Test feature limits

4. **Build Installer** (5 minutes)
   ```bash
   cd anvil-solo
   npm run build
   npm run package
   ```

5. **Distribute** 
   - Upload installer to Google Drive/Dropbox
   - Share link with beta testers
   - Manually send license keys

6. **Iterate & Improve**
   - Set up auto-updates later
   - Add Stripe integration when ready
   - Build marketing site over time

**Total Time: ~30 minutes to launch! 🎉**

---

## 📝 Next Steps After Launch

1. **Monitor Usage**
   - Watch license activations
   - Track errors in Railway logs
   - Gather user feedback

2. **Iterate Features**
   - Add requested strategies
   - Improve UI based on feedback
   - Fix bugs quickly

3. **Marketing**
   - Create landing page
   - Post on crypto Twitter
   - Join Solana Discord communities
   - Make tutorial videos

4. **Scale**
   - Add more payment options
   - Create affiliate program
   - Build team features
   - Add mobile app (future)

---

## 💡 Pro Tips

1. **Start with test licenses** - Give free PRO licenses to beta testers
2. **Offer lifetime deal early** - Creates immediate revenue
3. **Use GitHub Discussions** - Free community support
4. **Automate license delivery** - Use Stripe webhooks
5. **Track metrics** - Google Analytics for website, Mixpanel for app

---

## 🎊 You're Ready!

Everything is now in place:
- ✅ Jupiter API with fallbacks
- ✅ License system (backend + frontend)
- ✅ Cloud strategy backup
- ✅ Auto-update system
- ✅ Build pipeline
- ✅ Multi-tier monetization

**Deploy the license API and start selling! 💰**

Questions? Check the troubleshooting section or review the implementation logs.


