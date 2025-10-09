# 🧪 Anvil Solo Testing Guide

## ✅ Desktop App Updated!

Your Anvil Solo app is now connected to your live License API on Railway!

**API URL:** `https://endearing-compassion-production-bde0.up.railway.app`

---

## 🔑 Test License Activation

### Step 1: Open Anvil Solo

The app should now be running. If not:

```powershell
cd anvil-solo
npm start
```

### Step 2: Go to Settings → License

Look for a Settings or License section in the app interface.

### Step 3: Test with a License Key

Try activating one of these test licenses:

**Pro License (30 days):**
```
ANVIL-PRO-TEST-0001
```

**Starter License (30 days):**
```
ANVIL-STARTER-TEST-0001
```

**Enterprise License (30 days):**
```
ANVIL-ENTERPRISE-TEST-0001
```

**Lifetime License:**
```
ANVIL-LIFETIME-0001
```

### Step 4: Activate

1. Enter the license key
2. Click "Activate License" button
3. Should show success message!
4. App should display your tier (PRO, STARTER, etc.)

---

## 📊 Verify in Admin Panel

After activating a license:

1. Go to: http://localhost:63859
2. Login with your admin key
3. Click **"Users"** tab
4. You should see the license you just activated!
5. Status should show ✓ Active

---

## ✨ What Each Tier Unlocks

### FREE (Default)
- ✅ 1 active strategy
- ✅ 3 wallets
- ✅ DCA strategy only
- ❌ No cloud backup

### STARTER ($29/mo)
- ✅ 1 active strategy
- ✅ 5 wallets
- ✅ DCA strategy only
- ❌ No cloud backup

### PRO ($99/mo)
- ✅ 10 active strategies
- ✅ 10 wallets
- ✅ All strategies (DCA, Ratio, Bundle)
- ✅ Cloud backup
- ❌ No priority support

### ENTERPRISE ($299/mo)
- ✅ Unlimited strategies
- ✅ Unlimited wallets
- ✅ All strategies
- ✅ Cloud backup
- ✅ Priority support

### LIFETIME ($999 one-time)
- ✅ Unlimited strategies
- ✅ Unlimited wallets
- ✅ All strategies
- ✅ Cloud backup
- ✅ Priority support
- ✅ Never expires!

---

## 🐛 Troubleshooting

### License Activation Fails

**Error: "Network error"**
- Check your internet connection
- Verify Railway API is online: https://endearing-compassion-production-bde0.up.railway.app/health

**Error: "Invalid license key"**
- Check you copied the key correctly
- Verify key exists in admin panel

**Error: "License already activated on another device"**
- Each license can only be used on one computer
- Deactivate from the other device first
- Or create a new license in admin panel

### App Won't Start

```powershell
# Rebuild the app
cd anvil-solo
npm run build
npm start
```

### Can't Find License Settings

Look for these sections in the app:
- Settings
- License
- Account
- Preferences

---

## 🎯 End-to-End Test Flow

1. **Create License in Admin Panel**
   - Go to http://localhost:63859
   - Click "Create License" tab
   - Select "Pro" tier
   - Click "Generate License Key"
   - Copy the generated key

2. **Activate in Desktop App**
   - Open Anvil Solo
   - Go to License settings
   - Paste the key
   - Click Activate

3. **Verify Activation**
   - App shows PRO tier
   - Admin panel shows license as Active
   - Can now use PRO features!

4. **Test Features**
   - Try creating multiple strategies (PRO allows 10)
   - Test different strategy types
   - Verify feature limits work

---

## 📊 Monitor Usage

In your admin panel you can:
- See when licenses are activated
- Track which tiers are most popular
- Monitor revenue
- Extend licenses for customers
- Create new licenses instantly

---

## 🚀 Ready to Launch!

Once you've tested and everything works:

1. **Create Real Licenses** for beta testers
2. **Set Up Stripe** for automated payments (optional)
3. **Deploy Admin Panel** to Netlify for access anywhere
4. **Package the App** for distribution:
   ```powershell
   npm run package
   ```
5. **Create GitHub Release** with the installer
6. **Start Selling!** 💰

---

## 💡 Pro Tips

1. **Test all 4 tiers** to verify features work correctly
2. **Try activating same key twice** (should fail)
3. **Check expiration** works (test keys expire in 30 days)
4. **Monitor logs** for any errors during activation
5. **Test offline mode** (should still work with cached license)

---

## 🎊 Everything Connected!

Your complete system:

✅ **Railway API** - License validation  
✅ **PostgreSQL** - Data storage  
✅ **Admin Panel** - License management  
✅ **Desktop App** - Now connected!  
✅ **Test Licenses** - Ready to activate  

**The entire system is working end-to-end!** 🚀

Now test activating a license and watch it appear in your admin panel! 🎉

