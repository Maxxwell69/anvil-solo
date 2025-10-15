# 🚀 START HERE - Railway + Local Setup

**Complete guide for running on Railway (production) and testing locally.**

---

## 🎯 What You'll Have

After following this guide:

✅ **Production Server** - Running on Railway with PostgreSQL  
✅ **Local Testing** - Running on your machine for development  
✅ **Full License System** - With UI, API, database  
✅ **Easy Deployment** - One command to update production  

---

## 📋 Quick Decision

Choose your path:

### **Path 1: Deploy to Railway First** (Recommended)
Best if you want to see it live immediately.

**→ Follow Section A below**

### **Path 2: Test Locally First**
Best if you want to explore features locally.

**→ Follow Section B below**

---

## 🚂 SECTION A: Deploy to Railway (Production)

### **Method 1: Automated Script** (Easiest)

1. Open PowerShell in the `cloud-services` folder
2. Run: `.\DEPLOY-RAILWAY.bat`
3. Follow the prompts
4. Done! ✅

### **Method 2: Manual Steps**

```bash
# 1. Navigate to cloud-services folder
cd c:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\cloud-services

# 2. Install Railway CLI (if not installed)
npm install -g @railway/cli

# 3. Login to Railway
railway login

# 4. Initialize project
railway init
# Choose: "Create a new project"
# Name: "anvil-license-server"

# 5. Add PostgreSQL
railway add
# Select: "Database" → "PostgreSQL"

# 6. Set environment variables
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS=*

# 7. Deploy!
railway up

# 8. Get your URL
railway domain
railway status
```

**Your server is now live! 🎉**

Visit your Railway URL to see it running.

---

## 💻 SECTION B: Set Up Local Testing

### **Option 1: Use Railway Database** (Quick & Easy)

```bash
# 1. Get Railway database URL
railway variables

# 2. Create .env.local file with:
DATABASE_URL=<copy-from-railway>
JWT_SECRET=local-test-key
ADMIN_KEY=local-test-admin
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*

# 3. Install & run
npm install
npm run dev

# 4. Open browser
http://localhost:3000
```

### **Option 2: Local PostgreSQL** (Best Practice)

**Install PostgreSQL:**
- Download: https://www.postgresql.org/download/windows/
- Or use Docker: `docker run --name anvil-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`

**Setup:**
```bash
# 1. Create database
psql -U postgres
CREATE DATABASE anvil_licenses_local;
\q

# 2. Create .env.local file with:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anvil_licenses_local
JWT_SECRET=local-test-key
ADMIN_KEY=local-test-admin
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*

# 3. Install & run
npm install
npm run dev

# 4. Open browser
http://localhost:3000
```

---

## 🔄 Development Workflow

### **Daily Development:**

```
1. CODE LOCALLY
   ↓
   npm run dev
   http://localhost:3000
   
2. TEST FEATURES
   ↓
   Create test data
   Test all functionality
   
3. COMMIT CHANGES
   ↓
   git add .
   git commit -m "your changes"
   
4. DEPLOY TO RAILWAY
   ↓
   railway up
   
5. TEST PRODUCTION
   ↓
   https://your-url.railway.app
```

### **Quick Commands:**

```bash
# Local testing
npm run dev

# Deploy to Railway
railway up

# View production logs
railway logs

# View production status
railway status

# Open Railway dashboard
railway open
```

---

## 🌐 Access Points

### **Local (Testing):**
- 🏠 Homepage: http://localhost:3000
- 🔐 Login: http://localhost:3000/login
- 👤 Dashboard: http://localhost:3000/dashboard
- ⚙️ Admin: http://localhost:3000/admin
- 📡 API: http://localhost:3000/api

### **Railway (Production):**
- 🏠 Homepage: https://your-url.railway.app
- 🔐 Login: https://your-url.railway.app/login
- 👤 Dashboard: https://your-url.railway.app/dashboard
- ⚙️ Admin: https://your-url.railway.app/admin
- 📡 API: https://your-url.railway.app/api

---

## 👤 Create First Admin

### **On Railway (Production):**

```bash
# 1. Register user at your Railway URL
# Visit: https://your-url.railway.app/register

# 2. Connect to Railway database
railway run psql

# 3. Make user admin
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
\q

# 4. Login at admin panel
# Visit: https://your-url.railway.app/admin
```

### **On Local:**

```bash
# 1. Register user
# Visit: http://localhost:3000/register

# 2. Connect to local database
psql -U postgres -d anvil_licenses_local

# 3. Make user admin
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
\q

# 4. Login at admin panel
# Visit: http://localhost:3000/admin
```

---

## 🎯 What To Do First

### **After Railway Deployment:**

1. ✅ Visit your Railway URL
2. ✅ Register first user
3. ✅ Make them super admin
4. ✅ Login to admin panel
5. ✅ Generate test license
6. ✅ Configure fee structures

### **After Local Setup:**

1. ✅ Start local server
2. ✅ Visit localhost:3000
3. ✅ Register test user
4. ✅ Make them admin
5. ✅ Test all features
6. ✅ Create test data

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **START-HERE.md** | This file - Quick start guide |
| **RAILWAY-SETUP-COMPLETE.md** | Complete Railway deployment guide |
| **LOCAL-TESTING-SETUP.md** | Local development setup |
| **LICENSE-SERVER-GUIDE.md** | Full system documentation |
| **API-REFERENCE.md** | Complete API documentation |
| **QUICK-START.md** | 5-minute quick start |

---

## 🛠️ Helper Scripts

| Script | Purpose |
|--------|---------|
| **DEPLOY-RAILWAY.bat** | Automated Railway deployment |
| **START-SERVER.bat** | Start local server |
| **INSTALL.bat** | Install dependencies |

---

## 🚨 Troubleshooting

### **Railway Issues:**

```bash
# Check deployment status
railway status

# View logs
railway logs

# Reconnect database
railway add

# Redeploy
railway up
```

### **Local Issues:**

```bash
# Database connection error
# - Check PostgreSQL is running
# - Verify .env.local settings

# Port already in use
# - Kill process on port 3000
# - Or use different port in .env.local

# Module not found
npm install

# Build errors
npm run dev  # Use dev mode instead
```

---

## 💡 Pro Tips

### **For Railway:**
1. Use `railway logs --follow` to watch deployments
2. Set up GitHub integration for auto-deploy
3. Monitor usage in Railway dashboard
4. Keep production secrets secure

### **For Local:**
1. Use `npm run dev` for hot reload
2. Keep test data separate
3. Use local database for isolation
4. Test thoroughly before deploying

---

## 🎉 Quick Start Checklist

### **Railway Setup:**
- [ ] Install Railway CLI
- [ ] Login to Railway
- [ ] Create project
- [ ] Add PostgreSQL
- [ ] Set environment variables
- [ ] Deploy with `railway up`
- [ ] Get domain URL
- [ ] Test deployment
- [ ] Create admin user

### **Local Setup:**
- [ ] Choose database option (Railway or Local)
- [ ] Create .env.local file
- [ ] Install dependencies
- [ ] Start with `npm run dev`
- [ ] Open localhost:3000
- [ ] Register test user
- [ ] Make admin
- [ ] Test features

---

## 🆘 Need Help?

### **Check These Files:**
1. `RAILWAY-SETUP-COMPLETE.md` - Detailed Railway guide
2. `LOCAL-TESTING-SETUP.md` - Local setup guide
3. `LICENSE-SERVER-GUIDE.md` - Full documentation
4. `API-REFERENCE.md` - API endpoints

### **Common Commands:**
```bash
# Railway
railway login          # Login
railway up            # Deploy
railway logs          # View logs
railway status        # Check status
railway open          # Open dashboard

# Local
npm install           # Install
npm run dev           # Start
npm run build         # Build
npm start             # Run built version
```

---

## 🎯 Next Steps

### **After Setup:**

1. **Deploy to Railway** (if not done)
2. **Test locally** with real features
3. **Create admin user** on both environments
4. **Configure fee structures**
5. **Generate test licenses**
6. **Update desktop app** with Railway URL
7. **Start using the system!**

---

## 🚀 You're Ready!

Choose your path:
- **→ Production First**: Run `DEPLOY-RAILWAY.bat`
- **→ Local First**: Follow Section B above

Then:
- **→ Read**: `RAILWAY-SETUP-COMPLETE.md` for details
- **→ Test**: Generate licenses and test features
- **→ Deploy**: Update desktop app with your URL

---

**Your complete license server with Railway + Local is ready! 🎉**

**Start now:**
```bash
# For Railway deployment
.\DEPLOY-RAILWAY.bat

# For local testing
npm run dev
```

**Happy coding! 💻**

