# 🎯 Anvil License Admin Panel

A beautiful, single-file admin dashboard for managing your Anvil Solo licenses!

## 🚀 Quick Start

### Option 1: Run Locally

```powershell
# Start local server
npx serve license-admin -p 8080

# Open in browser
http://localhost:8080
```

### Option 2: Open File Directly

Just open `license-admin/index.html` in your browser!

## 🔑 Login

1. **API URL:** `https://endearing-compassion-production-bde0.up.railway.app`
2. **Admin Key:** `8d88a621d27bba636602c879c8461dbd9ab50db13c0bbca96b3a6d0fc943d6b9`

## ✨ Features

### 📊 Analytics Dashboard
- **Total Licenses** - See all licenses created
- **Active Licenses** - See how many are activated
- **Monthly Revenue** - Track your earnings
- **Recent Activations** - See who's activating licenses

### ➕ Create License
- Generate new license keys instantly
- Choose tier: Starter, Pro, Enterprise, or Lifetime
- Set expiration days
- Add customer email and notes
- Copy generated key to clipboard

### 👥 User Management
- View all licenses and their status
- See activation status (active/inactive)
- Extend licenses with one click
- Filter and search users

## 🎨 Features

✅ **Beautiful UI** - Modern gradient design  
✅ **Real-time Updates** - Auto-refreshes every 30 seconds  
✅ **Responsive** - Works on desktop, tablet, mobile  
✅ **Single File** - No build process needed  
✅ **Secure** - Admin key authentication  
✅ **Easy to Deploy** - Host anywhere (Netlify, Vercel, GitHub Pages)  

## 🌐 Deploy Online (Optional)

### Netlify (Easiest)

1. Go to: https://app.netlify.com
2. Drag and drop the `license-admin` folder
3. Done! Get your admin URL like: `your-app.netlify.app`

### Vercel

```bash
cd license-admin
npx vercel
```

### GitHub Pages

1. Push to GitHub
2. Go to Settings → Pages
3. Select source: `/license-admin` folder
4. Access at: `https://yourusername.github.io/anvil-solo/`

## 📱 Usage

### Creating a License

1. Click **"Create License"** tab
2. Select tier (Starter/Pro/Enterprise/Lifetime)
3. Enter customer email (optional)
4. Set validity days (e.g., 30 for monthly)
5. Click **"Generate License Key"**
6. Copy the key and send to customer

### Viewing Analytics

- Dashboard auto-refreshes every 30 seconds
- See real-time activations
- Track revenue by tier
- Monitor user growth

### Managing Users

1. Click **"Users"** tab
2. View all licenses and their status
3. Click **"Extend"** to add more days
4. Search by license key or email

## 🔒 Security

- Admin key is never stored locally
- All API calls use HTTPS
- Authentication required for all actions
- No database access needed (uses Railway API)

## 💡 Tips

1. **Bookmark the page** after logging in
2. **Save your admin key** securely (password manager)
3. **Use on mobile** - works great on phones!
4. **Deploy online** for access anywhere
5. **Share with team** - they can use same admin key

## 🎯 What You Can Do

✅ View real-time analytics  
✅ Create new licenses instantly  
✅ Manage all users  
✅ Extend licenses  
✅ Track revenue  
✅ Monitor activations  
✅ Copy license keys  

## 📊 Analytics Explained

**Total Licenses** - All license keys you've created  
**Active Licenses** - Keys that have been activated by users  
**Monthly Revenue** - Based on activated licenses and their tiers  
**Recent Activations** - Last 10 licenses that were activated  

## 🚀 Pro Tips

1. **Create bulk licenses** by opening multiple tabs
2. **Use notes** to track promotional codes or discounts
3. **Set appropriate expiry** - 30 days for monthly, 365 for yearly
4. **Monitor activations** to see which tiers are popular
5. **Extend licenses** for good customers easily

## 🎨 Customization

Want to customize the look? Edit `index.html`:

- **Colors:** Change the gradient (lines 14-15)
- **Logo:** Replace the 🔑 emoji with your logo
- **Branding:** Update title and text

## 📞 Support

If you need help:
1. Check Railway API is online
2. Verify admin key is correct
3. Check browser console for errors
4. Ensure API URL includes `https://`

## 🎊 You're Ready!

Open the admin panel and start managing your licenses! 🚀

---

**Admin URL (Local):** http://localhost:8080  
**API URL:** https://endearing-compassion-production-bde0.up.railway.app  
**Admin Key:** Save it securely!  

