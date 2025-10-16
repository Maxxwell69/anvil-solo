# 🚂 Railway Deployment - Complete Guide

Deploy your Anvil License Server to Railway in minutes!

---

## 📋 Prerequisites

- Node.js installed locally
- Git installed
- Railway account (free tier works!)

---

## 🚀 Step-by-Step Deployment

### **Step 1: Install Railway CLI**

```bash
npm install -g @railway/cli
```

Or use PowerShell:
```powershell
iwr https://railway.app/install.ps1 | iex
```

### **Step 2: Login to Railway**

```bash
railway login
```

This will open your browser - login with GitHub, Google, or email.

### **Step 3: Initialize Project**

```bash
cd c:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\cloud-services
railway init
```

**When prompted:**
- Choose "Create a new project"
- Name it: `anvil-license-server`
- Choose "Empty project"

### **Step 4: Add PostgreSQL Database**

```bash
railway add
```

**Select:** 
1. `Database` 
2. `PostgreSQL`

Wait for it to provision (about 30 seconds).

### **Step 5: Generate and Set Environment Variables**

Run these commands one by one:

```bash
# Generate JWT Secret
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Generate Admin Key
railway variables set ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set other variables
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS=*
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
railway variables set FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

**Note:** Railway automatically sets `DATABASE_URL` when you add PostgreSQL!

### **Step 6: Deploy Your Code**

```bash
railway up
```

This will:
- ✅ Upload your code
- ✅ Install dependencies
- ✅ Build TypeScript
- ✅ Start the server

**Wait for:** "✅ Build successful" and "✅ Deployment live"

### **Step 7: Get Your Production URL**

```bash
railway domain
```

This will generate a public URL like: `https://anvil-license-server-production.up.railway.app`

**Save this URL!** This is your production server.

### **Step 8: Test Your Deployment**

```bash
# Get your URL
railway status

# Test health endpoint
curl https://your-url.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "service": "anvil-license-server",
  "version": "3.0.0"
}
```

---

## 🎉 Deployment Complete!

Your license server is now live on Railway!

### **Access Your Production Server:**

- 🌐 **Website**: `https://your-url.up.railway.app`
- 🔐 **Login**: `https://your-url.up.railway.app/login`
- 👤 **Register**: `https://your-url.up.railway.app/register`
- ⚙️ **Admin**: `https://your-url.up.railway.app/admin`
- 📡 **API**: `https://your-url.up.railway.app/api`

---

## 💻 Local Development Setup

Now let's set up your local testing environment:

### **Step 1: Get Database URL**

```bash
# View all variables
railway variables

# Copy the DATABASE_URL value
```

### **Step 2: Create Local .env File**

Create `.env.local` file:

```env
# Local Development Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anvil_licenses_local
JWT_SECRET=local-test-secret-key
ADMIN_KEY=local-test-admin-key
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*
```

**Or use Railway's database for local testing:**

```env
# Use Railway database for local testing
DATABASE_URL=<copy from railway variables>
JWT_SECRET=local-test-secret-key
ADMIN_KEY=local-test-admin-key
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*
```

### **Step 3: Install Dependencies Locally**

```bash
npm install
```

### **Step 4: Run Local Server**

```bash
# Development mode (with hot reload)
npm run dev

# Production mode (requires build)
npm run build
npm start
```

**Access locally at:** http://localhost:3000

---

## 🔄 Railway + Local Workflow

### **Development Process:**

1. **Code locally** with `npm run dev`
2. **Test** on http://localhost:3000
3. **Commit changes** to git
4. **Deploy** with `railway up`
5. **Test production** on Railway URL

### **Separate Databases:**

**Option 1: Separate Local Database (Recommended)**
- Local: PostgreSQL on your machine
- Production: Railway PostgreSQL
- No conflicts, safe testing

**Option 2: Shared Railway Database (Quick Testing)**
- Both use Railway PostgreSQL
- Faster setup
- Be careful with test data

---

## 🛠️ Useful Railway Commands

### **Deployment**
```bash
railway up                    # Deploy current code
railway up --detach          # Deploy without watching logs
```

### **Environment Variables**
```bash
railway variables            # List all variables
railway variables set KEY=value
railway variables delete KEY
```

### **Logs**
```bash
railway logs                 # View live logs
railway logs --follow        # Stream logs in real-time
```

### **Status**
```bash
railway status               # Show deployment status
railway domain               # Show/generate domain
```

### **Database**
```bash
railway run psql             # Connect to PostgreSQL
railway connect postgres     # Get connection details
```

### **Open in Browser**
```bash
railway open                 # Open Railway dashboard
railway open --service       # Open deployed service
```

---

## 📊 Monitoring Your Deployment

### **View in Railway Dashboard:**

```bash
railway open
```

You'll see:
- ✅ Deployment status
- ✅ Resource usage (CPU, Memory)
- ✅ Live logs
- ✅ Environment variables
- ✅ Database metrics

### **Check Health:**

```bash
curl https://your-url.up.railway.app/health
```

### **View Logs:**

```bash
railway logs --follow
```

---

## 🔐 Security Best Practices

### **Environment Variables:**

✅ **DO:**
- Use Railway dashboard to manage secrets
- Generate unique keys for production
- Keep JWT_SECRET and ADMIN_KEY private

❌ **DON'T:**
- Commit `.env` to git
- Share your ADMIN_KEY
- Use same keys for local and production

### **Database:**

✅ **DO:**
- Use separate databases for dev/prod
- Backup production database regularly
- Monitor database size

### **Deployment:**

✅ **DO:**
- Test locally before deploying
- Review logs after deployment
- Monitor error rates

---

## 🚨 Troubleshooting

### **Issue: Build Failed**

```bash
# View build logs
railway logs

# Common fixes:
railway variables set NODE_VERSION=18
railway up --detach
```

### **Issue: Database Connection Error**

```bash
# Check DATABASE_URL is set
railway variables | grep DATABASE_URL

# Reconnect database
railway add
```

### **Issue: Deployment Timeout**

```bash
# Check service status
railway status

# Redeploy
railway up --detach
```

### **Issue: 404 on Routes**

- Check `nixpacks.toml` is present
- Verify `package.json` scripts
- Check build logs for errors

---

## 📈 Scaling on Railway

### **Free Tier:**
- ✅ 500 hours/month
- ✅ $5 usage credit
- ✅ Shared resources
- ✅ Perfect for development

### **Pro Tier ($20/month):**
- ✅ Unlimited projects
- ✅ More resources
- ✅ Priority support
- ✅ Custom domains

### **Resource Limits:**

Railway auto-scales based on usage. Monitor in dashboard.

---

## 🎯 Next Steps

### **After Deployment:**

1. ✅ **Test all endpoints** with your Railway URL
2. ✅ **Create first admin user**:
   ```bash
   # Register at https://your-url.up.railway.app/register
   # Then update in Railway database
   ```
3. ✅ **Configure fee structures** in admin panel
4. ✅ **Update desktop app** with Railway URL
5. ✅ **Set up custom domain** (optional)

### **Custom Domain Setup:**

```bash
# In Railway dashboard:
# 1. Go to Settings
# 2. Click "Generate Domain" or "Add Custom Domain"
# 3. Add your domain (e.g., api.yourdomain.com)
# 4. Update DNS records as shown
```

---

## 📝 Environment Variables Reference

### **Required:**
- `DATABASE_URL` - Auto-set by Railway
- `JWT_SECRET` - Authentication secret
- `ADMIN_KEY` - Admin API key

### **Optional:**
- `PORT` - Auto-set by Railway (default: 3000)
- `NODE_ENV` - Set to "production"
- `ALLOWED_ORIGINS` - CORS origins (* for all)
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `FEE_WALLET_ADDRESS` - Default fee wallet

---

## 🔄 Updating Your Deployment

### **Deploy New Changes:**

```bash
# 1. Make changes locally
# 2. Test with npm run dev
# 3. Deploy to Railway
railway up

# Watch deployment
railway logs --follow
```

### **Rollback if Needed:**

```bash
# View deployments
railway status

# Rollback in dashboard if needed
railway open
```

---

## 💡 Pro Tips

1. **Use Railway Dashboard** for easy monitoring
2. **Set up GitHub integration** for auto-deploy
3. **Monitor logs regularly** for errors
4. **Backup database** before major updates
5. **Test locally first** before deploying
6. **Use separate Railway project** for staging

---

## 🆘 Support

### **Railway Help:**
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### **License Server Help:**
- Check `LICENSE-SERVER-GUIDE.md`
- Check `API-REFERENCE.md`
- View logs: `railway logs`

---

## ✅ Checklist

### **Initial Setup:**
- [ ] Install Railway CLI
- [ ] Login to Railway
- [ ] Create project
- [ ] Add PostgreSQL
- [ ] Set environment variables
- [ ] Deploy code
- [ ] Generate domain
- [ ] Test deployment

### **Post-Deployment:**
- [ ] Create admin user
- [ ] Test all API endpoints
- [ ] Configure fee structures
- [ ] Update desktop app URL
- [ ] Set up monitoring
- [ ] Configure custom domain (optional)

---

## 🎉 You're All Set!

Your Anvil License Server is now:
- ✅ Running on Railway (production)
- ✅ Accessible via public URL
- ✅ Connected to PostgreSQL database
- ✅ Ready to accept users and generate licenses

**Start using it:**
1. Go to your Railway URL
2. Register an account
3. Make yourself admin
4. Start generating licenses!

---

**Happy deploying! 🚀**


