# 💻 Local Testing Setup

Quick guide to set up local development environment for testing.

---

## 🎯 Two Options

### **Option 1: Use Railway Database (Easiest)**
Test locally but use your Railway PostgreSQL database.

### **Option 2: Local PostgreSQL (Best Practice)**
Run PostgreSQL locally for isolated testing.

---

## ⚡ Option 1: Use Railway Database (Quick)

### **Step 1: Get Railway Database URL**

```bash
cd c:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\cloud-services
railway variables
```

Copy the `DATABASE_URL` value.

### **Step 2: Create Local .env**

Create `.env.local` file:

```env
# Local Testing with Railway Database
DATABASE_URL=<paste-railway-database-url-here>
JWT_SECRET=local-test-secret
ADMIN_KEY=local-test-admin-key
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

### **Step 3: Install Dependencies**

```bash
npm install
```

### **Step 4: Run Local Server**

```bash
npm run dev
```

**Access at:** http://localhost:3000

**✅ Done!** You're now testing locally with Railway's database.

---

## 🏠 Option 2: Local PostgreSQL (Isolated Testing)

### **Step 1: Install PostgreSQL**

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for `postgres` user

**Or use Docker:**
```bash
docker run --name anvil-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### **Step 2: Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE anvil_licenses_local;

# Exit
\q
```

**Or with pgAdmin:**
1. Open pgAdmin
2. Right-click Databases → Create → Database
3. Name: `anvil_licenses_local`

### **Step 3: Create Local .env**

Create `.env.local` file:

```env
# Local Testing with Local Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anvil_licenses_local
JWT_SECRET=local-test-secret
ADMIN_KEY=local-test-admin-key
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

**Update the connection string if needed:**
- Replace `postgres:postgres` with your username:password
- Replace `localhost:5432` if using different host/port

### **Step 4: Install Dependencies**

```bash
npm install
```

### **Step 5: Run Local Server**

```bash
npm run dev
```

**Access at:** http://localhost:3000

The database schema will be created automatically on first run!

---

## 🔄 Local + Railway Workflow

### **Development Process:**

```
┌─────────────────────────────────────────┐
│  1. CODE & TEST LOCALLY                 │
│     npm run dev                         │
│     http://localhost:3000               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. TEST WITH LOCAL DATA                │
│     Create test users                   │
│     Generate test licenses              │
│     Test all features                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. COMMIT CHANGES                      │
│     git add .                           │
│     git commit -m "feature"             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. DEPLOY TO RAILWAY                   │
│     railway up                          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  5. TEST ON PRODUCTION                  │
│     https://your-url.railway.app        │
└─────────────────────────────────────────┘
```

---

## 🛠️ Local Development Commands

### **Start Server:**
```bash
# Development mode (hot reload)
npm run dev

# Legacy version (simpler, no DB required)
npm run dev:legacy

# Production build (requires build first)
npm run build
npm start
```

### **Database:**
```bash
# Connect to local database
psql -U postgres -d anvil_licenses_local

# View tables
\dt

# View users
SELECT * FROM users;

# Make user admin
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

### **Testing:**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","username":"testuser"}'
```

---

## 🔍 Troubleshooting Local Setup

### **Issue: Database Connection Failed**

**Check if PostgreSQL is running:**
```bash
# Windows Services
services.msc
# Look for "postgresql" service

# Or check port
netstat -an | findstr 5432
```

**Fix:**
- Start PostgreSQL service
- Check username/password in .env.local
- Verify database exists: `psql -U postgres -l`

### **Issue: Port 3000 Already in Use**

**Find what's using the port:**
```bash
netstat -ano | findstr :3000
```

**Kill the process:**
```bash
taskkill /PID <process-id> /F
```

**Or use different port:**
Update `.env.local`: `PORT=3001`

### **Issue: Module Not Found**

```bash
# Clean install
rm -rf node_modules
npm install
```

### **Issue: TypeScript Errors**

```bash
# Use dev mode (no build needed)
npm run dev

# Or fix and rebuild
npm run build
```

---

## 📊 Comparing Environments

| Feature | Local Testing | Railway Production |
|---------|--------------|-------------------|
| **Database** | Local PostgreSQL | Railway PostgreSQL |
| **URL** | http://localhost:3000 | https://your-url.railway.app |
| **Data** | Test data only | Real user data |
| **Hot Reload** | ✅ Yes (npm run dev) | ❌ No |
| **Cost** | Free | Free tier available |
| **Speed** | Fast | Internet dependent |
| **Isolation** | Complete | Public access |

---

## 🔐 Environment Files

### **.env.local** (Local Testing)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anvil_licenses_local
JWT_SECRET=local-test-secret
ADMIN_KEY=local-test-admin-key
PORT=3000
NODE_ENV=development
```

### **Railway** (Production)
Set via Railway CLI or Dashboard:
- `DATABASE_URL` - Auto-set
- `JWT_SECRET` - Generated secure key
- `ADMIN_KEY` - Generated secure key
- `NODE_ENV=production`

**⚠️ Never commit .env files to git!**

---

## 🎯 Quick Start Scripts

### **START-LOCAL.bat**
```batch
@echo off
echo Starting local development server...
npm run dev
```

### **TEST-LOCAL.bat**
```batch
@echo off
echo Testing local endpoints...
curl http://localhost:3000/health
pause
```

---

## 💡 Best Practices

### **Local Development:**
✅ Use separate local database
✅ Test all changes before deploying
✅ Use development mode for hot reload
✅ Keep test data separate from production

### **Environment Management:**
✅ Different secrets for local/production
✅ Never commit .env files
✅ Document environment variables
✅ Use .env.example for templates

### **Database:**
✅ Backup before major changes
✅ Use migrations for schema changes
✅ Test with realistic data
✅ Clear test data regularly

---

## 🚀 Ready to Start!

### **Quick Setup:**

1. **Choose your option** (Railway DB or Local DB)
2. **Create .env.local** with appropriate settings
3. **Run** `npm install`
4. **Start** `npm run dev`
5. **Open** http://localhost:3000

### **First Test:**

1. Register a user
2. Make them admin in database
3. Login to admin panel
4. Generate test license
5. Test all features

---

## 📚 Additional Resources

- **Full Guide**: `LICENSE-SERVER-GUIDE.md`
- **Railway Setup**: `RAILWAY-SETUP-COMPLETE.md`
- **API Docs**: `API-REFERENCE.md`
- **Quick Start**: `QUICK-START.md`

---

**Happy coding! 💻**


