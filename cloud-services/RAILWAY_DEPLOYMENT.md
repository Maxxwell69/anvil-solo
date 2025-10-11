# 🚂 Deploy Anvil Cloud Services to Railway

## 🎯 What You're Deploying

A cloud backend that provides:
- ✅ License validation
- ✅ Cloud strategy execution  
- ✅ Trade history storage
- ✅ User settings sync
- ❌ **NO wallet access** (wallets stay in desktop app)

---

## 📋 Prerequisites

1. **Railway Account** - Sign up at https://railway.app
2. **Railway CLI** (optional but recommended)
3. **Admin Key** - Generate a secure key

---

## 🚀 Deployment Steps

### Method 1: Using Railway CLI (Recommended)

#### Step 1: Install Railway CLI
```powershell
npm install -g @railway/cli
```

#### Step 2: Login to Railway
```powershell
railway login
```

#### Step 3: Initialize Project
```powershell
cd cloud-services
railway init
```

Choose:
- Create new project: **Yes**
- Project name: **anvil-cloud-services**

#### Step 4: Set Environment Variables
```powershell
# Required
railway variables set ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
railway variables set NODE_ENV=production

# Optional
railway variables set ALLOWED_ORIGINS=https://yourdomain.com
```

#### Step 5: Deploy
```powershell
railway up
```

#### Step 6: Get Your URL
```powershell
railway domain
```

Your API will be live at: `https://your-project.railway.app`

---

### Method 2: Using Railway Web Dashboard

#### Step 1: Go to Railway
https://railway.app/new

#### Step 2: New Project
- Click "New Project"
- Select "Empty Project"

#### Step 3: Add Service
- Click "New Service"
- Select "GitHub Repo"
- Connect to: `Maxxwell69/anvil-solo`
- Root directory: `cloud-services`

#### Step 4: Set Environment Variables
In the Railway dashboard:
```
PORT = 3000
NODE_ENV = production
ADMIN_KEY = [generate secure random string]
SOLANA_RPC_URL = https://api.mainnet-beta.solana.com
ALLOWED_ORIGINS = https://yourdomain.com
```

#### Step 5: Deploy
Railway will automatically deploy on push to main branch.

---

## 🔑 Generate Admin Key

```powershell
# PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Use this as your `ADMIN_KEY`.

---

## ✅ Verify Deployment

### Test Health Endpoint
```powershell
curl https://your-project.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-11T...",
  "service": "anvil-cloud-services"
}
```

### Test License Generation (Admin)
```powershell
$headers = @{
  "x-admin-key" = "your_admin_key"
  "Content-Type" = "application/json"
}

$body = @{
  tier = "pro"
  email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-project.railway.app/api/license/generate" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

---

## 📊 Database Setup

Railway uses SQLite by default. The database file is stored in Railway's persistent volume.

### To Use PostgreSQL Instead (Optional):

1. Add PostgreSQL service in Railway
2. Update `cloud-services/package.json`:
```json
"dependencies": {
  "pg": "^8.11.3"
}
```
3. Update database connection code

---

## 🔗 Connect Desktop App

Update your desktop app (anvil-solo) to use the cloud service:

### In anvil-solo configuration:
```typescript
// src/main/config/cloud.ts
export const cloudConfig = {
  apiUrl: 'https://your-project.railway.app',
  licenseKey: 'ANVIL-XXXXXXXXXXXXX', // User's license
  hardwareId: machineId() // Auto-generated
};
```

### API Client Example:
```typescript
// src/main/api/client.ts
import { machineId } from 'node-machine-id';

const API_URL = 'https://your-project.railway.app';
const LICENSE_KEY = 'user-license-key';

async function validateLicense() {
  const response = await fetch(`${API_URL}/api/license/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      licenseKey: LICENSE_KEY,
      hardwareId: machineId()
    })
  });
  
  return response.json();
}
```

---

## 🎛️ Railway Dashboard

Once deployed, you can:
- View logs
- Monitor performance
- Restart service
- Update environment variables
- View metrics

Access at: https://railway.app/dashboard

---

## 💰 Pricing

Railway Pricing:
- **Hobby Plan**: $5/month (free $5 credit)
- **Pro Plan**: $20/month

Your service should fit in the Hobby plan easily.

---

## 🔄 Updates

To update the service:

### Via CLI:
```powershell
cd cloud-services
# Make changes
git add .
git commit -m "Update cloud service"
git push origin main
railway up
```

### Via GitHub:
- Push to main branch
- Railway auto-deploys

---

## 🆘 Troubleshooting

### Build Fails
- Check logs in Railway dashboard
- Verify `package.json` has correct dependencies
- Ensure TypeScript compiles: `npm run build`

### Can't Connect
- Check Railway service is running
- Verify environment variables set
- Check CORS settings
- Test health endpoint first

### Database Issues
- Railway provides persistent storage
- Database created on first run
- Check logs for SQL errors

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

---

**Your cloud service will be live in minutes!** 🚀

