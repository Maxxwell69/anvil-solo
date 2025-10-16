# 🚀 SIMPLE DEPLOYMENT - STEP BY STEP

## ✅ **Follow These Exact Steps:**

---

## **STEP 1: Add PostgreSQL Database**

You already ran `railway add` and saw the menu.

**Do this NOW in your terminal:**
1. Use **↓ arrow key** to select **"Database"**
2. Press **Enter**
3. Select **"PostgreSQL"**  
4. Press **Enter**
5. Wait for "✅ Database added"

Then come back here for Step 2.

---

## **STEP 2: Generate Admin Key**

Run this command to generate a secure admin key:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output** (it will look like: `a1b2c3d4e5f6...`)

---

## **STEP 3: Set Environment Variables**

Replace `YOUR_ADMIN_KEY_HERE` with the key you just generated:

```bash
railway variables set ADMIN_KEY=YOUR_ADMIN_KEY_HERE
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
railway variables set FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
railway variables set ALLOWED_ORIGINS=*
railway variables set NODE_ENV=production
```

**Copy and paste ALL 5 commands** one by one.

---

## **STEP 4: Deploy Your Code**

```bash
railway up
```

This will:
- Build your TypeScript code
- Upload to Railway
- Start your server

Wait for "✅ Deployment successful"

---

## **STEP 5: Get Your API URL**

```bash
railway status
```

Look for the URL (something like: `https://anvil-cloud-services.up.railway.app`)

**Copy this URL** - you'll need it!

---

## **STEP 6: Test Your API**

Replace YOUR_URL with your Railway URL:

```bash
curl https://YOUR_URL/health
```

Should return:
```json
{
  "status": "ok",
  "service": "anvil-cloud-services",
  "version": "2.0.0"
}
```

✅ **If you see this, it's working!**

---

## **STEP 7: Generate Your First License**

Replace YOUR_ADMIN_KEY and YOUR_URL:

```bash
curl -X POST https://YOUR_URL/api/license/generate -H "X-Admin-Key: YOUR_ADMIN_KEY" -H "Content-Type: application/json" -d "{\"tier\":\"pro\",\"email\":\"test@example.com\"}"
```

Should return:
```json
{
  "success": true,
  "licenseKey": "ANVIL-ABC123...",
  "tier": "pro"
}
```

✅ **Save this license key!**

---

## ✅ **DONE!**

Your cloud backend is now live!

**You have:**
- ✅ API running on Railway
- ✅ PostgreSQL database
- ✅ License system working
- ✅ Archive sync ready
- ✅ Fee tracking ready

**Next:** Update your desktop app to use this URL!

---

## 🔗 **Quick Reference:**

**Your Railway Dashboard:** `railway open`
**View Logs:** `railway logs`
**Check Variables:** `railway variables`
**Redeploy:** `railway up`

---

## 📝 **Save These:**

- **Railway URL:** `https://your-project.up.railway.app`
- **Admin Key:** (the one you generated)
- **Test License:** (the one you just generated)

---

**That's it! Your backend is deployed!** 🎉



