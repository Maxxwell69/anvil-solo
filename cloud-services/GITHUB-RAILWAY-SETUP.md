# 🚀 GitHub + Railway Auto-Deploy Setup

**No terminal commands needed! Everything through web interfaces.**

---

## 📋 Overview

This setup will:
1. ✅ Push your code to GitHub
2. ✅ Connect Railway to GitHub
3. ✅ Auto-deploy on every commit
4. ✅ Manage everything from dashboards

---

## STEP 1: Create GitHub Repository

### **A. Go to GitHub**

1. Open browser: https://github.com
2. Click the **"+"** button (top right)
3. Click **"New repository"**

### **B. Create Repository**

**Settings:**
- **Repository name**: `anvil-license-server`
- **Description**: `Anvil Solo License Management System`
- **Visibility**: Private (recommended) or Public
- **☐** Do NOT initialize with README
- **☐** Do NOT add .gitignore
- **☐** Do NOT add license

Click **"Create repository"**

### **C. Copy the Repository URL**

You'll see something like:
```
https://github.com/YOUR-USERNAME/anvil-license-server.git
```

**Copy this URL** - you'll need it!

---

## STEP 2: Push Code to GitHub

### **Option A: Using GitHub Desktop (Easiest)**

1. **Download GitHub Desktop**: https://desktop.github.com/
2. **Install and login** with your GitHub account
3. Click **"Add" → "Add Existing Repository"**
4. Browse to: `C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\cloud-services`
5. Click **"Add Repository"**
6. Click **"Publish repository"**
7. Choose visibility (Private recommended)
8. Click **"Publish"**

**Done!** Your code is now on GitHub.

---

### **Option B: Using Git in File Explorer**

1. **Install Git for Windows**: https://git-scm.com/download/win
2. **Right-click** in the `cloud-services` folder
3. Click **"Git Bash Here"**
4. Copy and paste these commands:

```bash
git init
git add .
git commit -m "Initial commit - Anvil License Server"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/anvil-license-server.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

---

## STEP 3: Create .gitignore File

Before pushing, create this file to avoid uploading sensitive data:

**Create file:** `cloud-services\.gitignore`

**Contents:**
```
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Build output
dist/
build/

# Logs
logs/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Railway
.railway/
```

---

## STEP 4: Connect Railway to GitHub

### **A. Open Railway Dashboard**

1. Go to: https://railway.app
2. Login with your account
3. Click **"New Project"**

### **B. Deploy from GitHub**

1. Click **"Deploy from GitHub repo"**
2. Click **"Configure GitHub App"**
3. **Grant Railway access** to your repositories
4. Select **"anvil-license-server"** repository
5. Click **"Deploy Now"**

**Railway will now:**
- ✅ Clone your repository
- ✅ Detect it's a Node.js app
- ✅ Install dependencies
- ✅ Start building
- ✅ Deploy automatically!

---

## STEP 5: Add PostgreSQL Database

**In Railway Dashboard:**

1. Click your project
2. Click **"+ New"** button
3. Select **"Database"**
4. Select **"Add PostgreSQL"**
5. Wait 30 seconds for provisioning

**Railway will automatically:**
- ✅ Create database
- ✅ Set `DATABASE_URL` environment variable
- ✅ Connect it to your service

---

## STEP 6: Set Environment Variables

**In Railway Dashboard:**

1. Click on your **service** (the one running your code)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these variables:

### **Required Variables:**

**JWT_SECRET**
```
Generate at: https://www.uuidgenerator.net/
Or use: https://randomkeygen.com/
Value: Any random 64-character string
```

**ADMIN_KEY**
```
Generate another random 64-character string
Value: Different from JWT_SECRET
```

**NODE_ENV**
```
production
```

**ALLOWED_ORIGINS**
```
*
```

### **Optional Variables:**

**SOLANA_RPC_URL**
```
https://api.mainnet-beta.solana.com
```

**FEE_WALLET_ADDRESS**
```
82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

4. Click **"Save"** after adding all variables

**Railway will auto-restart** your service with new variables!

---

## STEP 7: Get Your URL

**In Railway Dashboard:**

1. Click on your **service**
2. Go to **"Settings"** tab
3. Scroll to **"Domains"** section
4. Click **"Generate Domain"**

You'll get a URL like:
```
https://anvil-license-server-production.up.railway.app
```

**Save this URL!** This is your production server.

---

## STEP 8: Enable Auto-Deploy

**Already enabled!** Railway automatically deploys when you push to GitHub.

**To verify:**

1. In Railway Dashboard → Your Project
2. Go to **"Settings"** tab
3. Check **"Source"** section
4. Should show: Connected to GitHub repository

**Every time you push to GitHub:**
- ✅ Railway detects changes
- ✅ Builds automatically
- ✅ Deploys automatically
- ✅ Zero terminal commands!

---

## 🎉 DONE! How It Works Now

### **Your Workflow:**

```
1. Edit code locally
   ↓
2. Save files
   ↓
3. Open GitHub Desktop
   ↓
4. Write commit message
   ↓
5. Click "Commit to main"
   ↓
6. Click "Push origin"
   ↓
7. Railway auto-deploys!
   ↓
8. Check deployment in Railway dashboard
```

**No terminal needed!** ✨

---

## 📊 Managing Your Deployment

### **View Deployment Status**

1. Go to https://railway.app
2. Click your project
3. See real-time build logs
4. Check deployment status

### **View Application Logs**

1. Click your service
2. Go to **"Deployments"** tab
3. Click latest deployment
4. View logs

### **Update Environment Variables**

1. Click your service
2. Go to **"Variables"** tab
3. Edit any variable
4. Click save
5. Auto-restarts with new config

### **Rollback Deployment**

1. Go to **"Deployments"** tab
2. Click three dots on previous deployment
3. Click **"Redeploy"**

---

## 🔄 Making Updates

### **To Update Your Code:**

**Using GitHub Desktop:**
1. Make changes to files
2. Open GitHub Desktop
3. Review changes
4. Write commit message
5. Click **"Commit to main"**
6. Click **"Push origin"**
7. Railway auto-deploys!

**Using GitHub Web:**
1. Go to your repository on GitHub
2. Click on file to edit
3. Click pencil icon (edit)
4. Make changes
5. Scroll down
6. Click **"Commit changes"**
7. Railway auto-deploys!

---

## 🎯 First Time Setup Checklist

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Create Railway project
- [ ] Connect Railway to GitHub repo
- [ ] Add PostgreSQL database
- [ ] Set environment variables
- [ ] Generate domain/URL
- [ ] Test deployment
- [ ] Create first admin user

---

## 🔐 Create First Admin User

### **Option 1: Via Railway Dashboard**

1. Click your PostgreSQL database
2. Go to **"Data"** tab
3. Click **"Connect"**
4. Run this query:
```sql
-- First register a user at your URL
-- Then run this:
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

### **Option 2: Via External Tool**

1. In Railway Dashboard → PostgreSQL
2. Go to **"Connect"** tab
3. Copy connection string
4. Use pgAdmin or any SQL tool
5. Connect and run update query

---

## 📝 Environment Variables Quick Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Database connection | Auto-set by Railway |
| `JWT_SECRET` | Auth token secret | Random 64-char string |
| `ADMIN_KEY` | Admin API key | Random 64-char string |
| `NODE_ENV` | Environment | `production` |
| `ALLOWED_ORIGINS` | CORS origins | `*` or your domain |
| `PORT` | Server port | Auto-set by Railway |

---

## 🆘 Troubleshooting

### **Deployment Failed**

1. Check **Deployments** tab in Railway
2. View build logs
3. Fix errors
4. Push to GitHub again

### **App Crashes on Start**

1. Check **Logs** in Railway
2. Most common: Missing `DATABASE_URL`
3. Ensure PostgreSQL is connected
4. Check all environment variables are set

### **Can't Access URL**

1. Ensure domain is generated
2. Check deployment succeeded
3. View logs for errors
4. Verify app is running

### **Database Connection Error**

1. Ensure PostgreSQL is added
2. Check `DATABASE_URL` is set
3. Verify database is running
4. Check connection string format

---

## 🎨 Customizing Your Setup

### **Custom Domain**

1. Railway → Settings → Domains
2. Click **"Custom Domain"**
3. Enter your domain
4. Update DNS records as shown
5. SSL auto-configured!

### **Branch Deployments**

1. Railway → Settings → Source
2. Enable branch deploys
3. Every branch gets its own URL
4. Perfect for testing!

### **Environment-Specific Configs**

1. Create multiple Railway projects
2. One for staging, one for production
3. Connect to different GitHub branches
4. Different environment variables

---

## 📈 Monitoring

### **View Metrics:**

1. Railway Dashboard → Your Service
2. Go to **"Metrics"** tab
3. See CPU, Memory, Network usage

### **Set Up Alerts:**

1. Go to **"Settings"**
2. Configure crash detection
3. Get email notifications

---

## 💡 Pro Tips

### **1. Use GitHub Branches**
- `main` branch → Production
- `dev` branch → Staging
- Feature branches → Testing

### **2. Write Good Commit Messages**
```
✅ Good: "Add user authentication system"
✅ Good: "Fix database connection error"
❌ Bad: "updates"
❌ Bad: "fix"
```

### **3. Use .gitignore**
Never commit:
- `.env` files
- `node_modules/`
- Passwords or keys

### **4. Monitor Logs**
Check Railway logs regularly for errors

### **5. Test Before Pushing**
Test locally before committing to GitHub

---

## 🔗 Useful Links

- **Railway Dashboard**: https://railway.app/dashboard
- **GitHub Repository**: https://github.com/YOUR-USERNAME/anvil-license-server
- **Your Production URL**: (Generated by Railway)
- **PostgreSQL Dashboard**: Railway → Your Database

---

## ✅ Success Checklist

After setup, verify:
- [ ] Code pushed to GitHub
- [ ] Railway connected to repo
- [ ] Database connected
- [ ] Environment variables set
- [ ] Domain generated
- [ ] App deployed successfully
- [ ] Can access URL in browser
- [ ] Admin user created
- [ ] Auto-deploy working (push to test)

---

## 🎉 You're Done!

Now you have:
- ✅ GitHub repository for version control
- ✅ Railway auto-deployment
- ✅ PostgreSQL database
- ✅ Production URL
- ✅ No terminal commands needed!

**Every change you make:**
1. Edit code
2. Commit in GitHub Desktop
3. Push to GitHub
4. Railway auto-deploys

**That's it!** 🚀

---

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **GitHub Guides**: https://guides.github.com

---

**Happy deploying with GitHub + Railway!** 🎊

