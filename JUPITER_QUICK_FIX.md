# ⚡ Jupiter API - Quick Fix Guide

## 🚨 Error: Cannot Connect to Jupiter API

### Symptoms
```
❌ DNS Resolution Problem Detected!
❌ ENOTFOUND quote-api.jup.ag
❌ All Jupiter endpoints failed
```

---

## 🔧 QUICK FIXES (Try in Order)

### Fix #1: Automated Tool (EASIEST) ⭐
```bash
# Right-click → Run as Administrator
fix-jupiter-dns.bat
```
This will automatically:
- Flush DNS cache
- Reset network stack
- Configure Google DNS
- Test connectivity

**Then restart your computer.**

---

### Fix #2: Manual DNS Change (FAST)

**Windows 10/11:**
1. Open Settings → Network & Internet
2. Click your connection (WiFi or Ethernet)
3. Click "Edit" under DNS server assignment
4. Select "Manual"
5. Turn on IPv4
6. Enter:
   - Preferred DNS: `8.8.8.8`
   - Alternate DNS: `8.8.4.4`
7. Save

**Then run:**
```powershell
ipconfig /flushdns
```

---

### Fix #3: Flush DNS Cache (QUICKEST)

Open PowerShell and run:
```powershell
ipconfig /flushdns
ipconfig /registerdns
ipconfig /release
ipconfig /renew
```

Then restart the app.

---

### Fix #4: Check Firewall

1. Open Windows Security
2. Firewall & Network Protection
3. Allow an app through firewall
4. Click "Change settings"
5. Find "Electron" or your app
6. Check ✅ Private and Public
7. Click OK

---

### Fix #5: Use VPN (ISP Blocking)

If your ISP blocks crypto APIs:
1. Install a VPN (NordVPN, ProtonVPN, etc.)
2. Connect to any server
3. Restart the app

**Alternative:** Use mobile hotspot from your phone

---

## 🧪 Test if Fixed

Run this in PowerShell:
```powershell
Invoke-WebRequest -Uri "https://quote-api.jup.ag/v6/health" -UseBasicParsing
```

**Success looks like:**
```
StatusCode: 200
StatusDescription: OK
```

---

## 📊 Full Diagnostic

For detailed analysis:
```bash
diagnose-jupiter.bat
```

This will check:
- Internet connection
- DNS resolution
- All 3 Jupiter endpoints
- Firewall status
- Proxy settings
- Network adapter

---

## ❓ Still Not Working?

### Check System Issues

**1. Time Sync Problem**
```powershell
w32tm /resync
```

**2. Antivirus Blocking**
- Add exception for your trading app
- Or temporarily disable to test

**3. Hosts File Check**
Open `C:\Windows\System32\drivers\etc\hosts`
Make sure NO lines mention `jup.ag`

**4. Router Issues**
- Power cycle router (unplug 30 seconds)
- Update router firmware
- Check if router blocks crypto domains

---

## 🌍 Geographic Issues

### Your ISP May Block Crypto

**Test:** Try on mobile hotspot
- If works on hotspot → ISP is blocking
- Solution: Use VPN permanently

**Countries with Common Blocks:**
- China (VPN required)
- Russia (VPN recommended)
- Turkey (some ISPs)
- India (intermittent)
- Middle East (varies)

---

## 💡 Understanding the Error

### What's Happening?
Your computer tries to reach Jupiter API in 3 steps:
1. **DNS Lookup** - Convert `quote-api.jup.ag` to IP address
2. **TCP Connection** - Connect to that IP
3. **HTTPS Request** - Send/receive data

**DNS errors** happen at step 1 - your computer can't even find Jupiter's IP address.

### Why DNS Fails
- ISP's DNS server is slow/broken
- DNS cache is corrupted
- Firewall blocks DNS queries
- ISP blocks crypto domains
- Network configuration issue

### How the App Handles It
The app tries **3 different Jupiter endpoints**:
1. `https://lite-api.jup.ag/v6` (Lite API)
2. `https://quote-api.jup.ag/v6` (Standard)
3. `https://api.jup.ag/v6` (Alternative)

Each attempt retries **3 times** with increasing timeouts.

If all fail → You need to fix DNS/network.

---

## ✅ Prevention

### Set Reliable DNS Permanently

**Recommended DNS Servers:**

| Provider | Primary | Secondary | Notes |
|----------|---------|-----------|-------|
| Google | 8.8.8.8 | 8.8.4.4 | Fast, reliable |
| Cloudflare | 1.1.1.1 | 1.0.0.1 | Privacy-focused |
| Quad9 | 9.9.9.9 | 149.112.112.112 | Security-focused |
| OpenDNS | 208.67.222.222 | 208.67.220.220 | Family-safe |

**Set at Router Level** (affects all devices):
1. Log into router (usually 192.168.1.1)
2. Find DNS settings (under WAN/Internet)
3. Enter Google DNS
4. Save and reboot router

---

## 📱 Emergency Backup Plan

If nothing works:

1. **Use Mobile Hotspot**
   - Enable hotspot on phone
   - Connect PC to phone's WiFi
   - Run trading app

2. **Use Different Location**
   - Friend's house
   - Coffee shop WiFi
   - Library (if allowed)

3. **Wait for ISP Fix**
   - Sometimes temporary
   - Check back in a few hours

---

## 🆘 Get Help

If you've tried everything:

1. Run full diagnostic:
   ```bash
   diagnose-jupiter.bat > diagnostic-log.txt
   ```

2. Send `diagnostic-log.txt` with:
   - Your location/country
   - Your ISP name
   - Windows version
   - Full error message

---

## 📚 More Information

**Detailed Guide:** See `JUPITER_ROUTING_GUIDE.md`

**Troubleshooting:** See `TROUBLESHOOTING_GUIDE.md`

**App Issues:** See `IMPLEMENTATION_STATUS.md`

---

**Last Updated:** October 2024  
**Works With:** Anvil 3.0, Jupiter API v6






