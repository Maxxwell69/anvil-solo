# 🌐 Jupiter API Routing Guide for Home Computers

## Understanding the Issue

When running Anvil trading bot from home, you may encounter issues connecting to Jupiter API. This is because:

1. **DNS Resolution Failures** - Your ISP's DNS may not resolve `*.jup.ag` domains properly
2. **Firewall Blocking** - Windows Firewall or router may block crypto-related APIs
3. **ISP Restrictions** - Some ISPs throttle or block cryptocurrency services
4. **Network Configuration** - Incorrect proxy or DNS settings
5. **Geographic Restrictions** - Some regions have limited access to crypto APIs

---

## 🔍 How the App Finds Jupiter API

### Multiple Fallback Strategy

The app uses a **smart fallback system** with 3 Jupiter endpoints:

```
1. https://lite-api.jup.ag/v6       (PRIMARY - Lite API)
2. https://quote-api.jup.ag/v6      (FALLBACK 1 - Standard API)
3. https://api.jup.ag/v6            (FALLBACK 2 - Alternative)
```

### Automatic Retry Logic

- **3 retry attempts** per endpoint
- **Exponential backoff**: 10s → 15s → 20s
- **Timeout handling**: Aborts slow requests
- **Error logging**: Shows which endpoint failed and why

### Enhanced Client Features

The `EnhancedJupiterClient` also supports:
- QuickNode mirror endpoint
- Token validation from multiple sources
- DexScreener API as backup
- Birdeye API for token data

---

## 🚨 Common Issues & Solutions

### Issue 1: DNS Resolution Failure

**Symptoms:**
```
❌ ENOTFOUND quote-api.jup.ag
❌ DNS lookup failed
```

**Solution A: Flush DNS Cache**
```powershell
ipconfig /flushdns
```

**Solution B: Change DNS Servers**

1. Open Network Settings
2. Change DNS to:
   - **Google DNS**: `8.8.8.8` and `8.8.4.4`
   - **Cloudflare DNS**: `1.1.1.1` and `1.0.0.1`

**Quick Fix:**
Run the automated tool:
```bash
fix-jupiter-dns.bat
```
(Must run as Administrator)

---

### Issue 2: Firewall Blocking

**Symptoms:**
```
❌ ETIMEDOUT
❌ Connection timeout after 10s
```

**Solution A: Allow in Windows Firewall**
1. Open Windows Security
2. Firewall & Network Protection
3. Allow an app through firewall
4. Add your Anvil app (`electron.exe`)

**Solution B: Temporarily Disable Firewall**
```powershell
# Test only - don't leave disabled!
netsh advfirewall set allprofiles state off
```

---

### Issue 3: ISP Blocking Crypto APIs

**Symptoms:**
- All 3 endpoints fail
- Works on mobile hotspot but not home WiFi
- Other crypto sites also don't work

**Solutions:**

**Option A: Use VPN**
- Recommended: NordVPN, ProtonVPN, Mullvad
- Connect to any server
- Retry the app

**Option B: Use Mobile Hotspot**
- Enable hotspot on your phone
- Connect computer to phone's WiFi
- Bypass ISP restrictions

**Option C: Use Tor (Advanced)**
- Install Tor Browser
- Configure app to use Tor proxy
- Not recommended for production trading

---

### Issue 4: Router Configuration

**Symptoms:**
- Intermittent connection
- Works sometimes, fails other times

**Solutions:**

1. **Restart Router**
   ```
   Unplug for 30 seconds, plug back in
   ```

2. **Update Router Firmware**
   - Log into router admin panel (usually 192.168.1.1)
   - Check for firmware updates
   - Apply updates

3. **Disable QoS/Traffic Shaping**
   - Some routers deprioritize crypto traffic
   - Disable QoS in router settings

4. **Enable UPnP**
   - Helps with port forwarding
   - Usually in Advanced Settings

---

## 🛠️ Diagnostic Tools

### Tool 1: Quick DNS Test
```bash
test-jupiter-dns.bat
```
Tests basic connectivity to Jupiter API.

### Tool 2: Full Diagnostic
```bash
diagnose-jupiter.bat
```
Comprehensive test of:
- Internet connectivity
- DNS resolution
- All 3 Jupiter endpoints
- Firewall status
- Proxy settings
- Network adapter info

### Tool 3: Auto-Fix DNS Issues
```bash
fix-jupiter-dns.bat
```
**(Run as Administrator)**

Automatically:
- Flushes DNS cache
- Resets network stack
- Configures alternative DNS
- Tests connectivity

---

## 🔧 Advanced Troubleshooting

### Check Which Endpoint Works

Run this PowerShell command:
```powershell
# Test endpoint 1
Invoke-WebRequest -Uri "https://lite-api.jup.ag/v6/health" -UseBasicParsing

# Test endpoint 2
Invoke-WebRequest -Uri "https://quote-api.jup.ag/v6/health" -UseBasicParsing

# Test endpoint 3
Invoke-WebRequest -Uri "https://api.jup.ag/v6/health" -UseBasicParsing
```

### Test Actual Quote Request

```powershell
$url = "https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000"
$response = Invoke-WebRequest -Uri $url -UseBasicParsing
$response.Content | ConvertFrom-Json
```

### Check DNS Propagation

```bash
nslookup quote-api.jup.ag
nslookup quote-api.jup.ag 8.8.8.8
```

If second works but first doesn't → Your ISP DNS is the problem.

### Trace Route

```bash
tracert quote-api.jup.ag
```

Shows the network path. If it times out early, indicates network/ISP issue.

---

## 📊 What the App Does Automatically

The Anvil bot handles routing intelligently:

### On Startup
1. Health check on all 3 endpoints
2. Remember which ones work
3. Prioritize working endpoints

### During Trading
1. Try primary endpoint first
2. If fails, try fallback 1
3. If fails, try fallback 2
4. If all fail, wait 30s and retry
5. Log all errors for debugging

### Error Recovery
1. Detect DNS failures vs. API failures
2. Automatically switch to working endpoint
3. Continue trading without manual intervention
4. Show clear error messages in UI

---

## 🌍 Geographic Considerations

### Regions with Common Issues

1. **China** - Use VPN (required)
2. **Russia** - Use VPN (recommended)
3. **Turkey** - Some ISPs block crypto
4. **India** - Intermittent blocking
5. **Middle East** - Some countries restrict

### Best Practices by Region

**North America / Europe:**
- Usually works out of the box
- Google DNS recommended if ISP DNS fails

**Asia-Pacific:**
- Use Cloudflare DNS (1.1.1.1)
- Consider VPN for consistency
- Check local regulations

**Restricted Regions:**
- VPN is essential
- Use obfuscated VPN protocols
- Consider dedicated IP

---

## ✅ Verification Checklist

Before running the bot, verify:

- [ ] Internet connection is stable
- [ ] Can access `https://jup.ag` in browser
- [ ] DNS resolves `quote-api.jup.ag`
- [ ] Firewall allows app
- [ ] No proxy blocking requests
- [ ] At least one Jupiter endpoint works

Run the diagnostic:
```bash
diagnose-jupiter.bat
```

If all checks pass, the app should work!

---

## 🆘 Still Not Working?

If you've tried everything:

1. **Check Jupiter Status**
   - Visit https://status.jup.ag
   - Check Twitter @JupiterExchange
   - Jupiter may be down (rare)

2. **Try Different Network**
   - Mobile hotspot
   - Different WiFi
   - Friend's house

3. **Check System Time**
   ```powershell
   w32tm /resync
   ```
   Incorrect time can cause SSL errors.

4. **Antivirus Software**
   - Some antivirus blocks crypto APIs
   - Add exception for app
   - Or temporarily disable

5. **Windows Host File**
   ```
   C:\Windows\System32\drivers\etc\hosts
   ```
   Make sure no entries block `jup.ag`

---

## 📞 Technical Details for Advanced Users

### DNS Resolution Process

1. Check local cache
2. Query configured DNS server
3. If fails, try alternative DNS
4. If all DNS fail, try direct IP (not applicable for CDNs)

### How to Set Alternative DNS Permanently

**Windows:**
```powershell
# Get adapter name
Get-NetAdapter

# Set DNS (replace "Wi-Fi" with your adapter)
Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses ("8.8.8.8","8.8.4.4")
```

**Router-level DNS:**
1. Log into router (192.168.1.1 or 192.168.0.1)
2. Find DNS settings (usually under WAN or Internet)
3. Set Primary: `8.8.8.8` Secondary: `8.8.4.4`
4. Reboot router

### Using Hosts File Override (Emergency)

If DNS completely fails, you can hardcode Jupiter IPs:
```
# Open as Administrator:
notepad C:\Windows\System32\drivers\etc\hosts

# Add (example IPs - check actual IPs first):
# 104.26.x.x  quote-api.jup.ag
# 104.26.x.x  api.jup.ag
# 104.26.x.x  lite-api.jup.ag
```

⚠️ **Warning:** IPs can change! This is a temporary fix only.

### Custom RPC Endpoints

For even more reliability, use your own RPC:
```typescript
// In config
solanaRpcUrl: "https://your-custom-rpc.com"
```

Recommended providers:
- QuickNode (paid, very reliable)
- Helius (generous free tier)
- Alchemy (good for testing)

---

## 📈 Performance Optimization

### Reduce Latency

1. **Use Local DNS Cache**
   ```powershell
   net start dnscache
   ```

2. **Increase DNS Cache Time**
   ```powershell
   reg add "HKLM\SYSTEM\CurrentControlSet\Services\Dnscache\Parameters" /v MaxCacheTtl /t REG_DWORD /d 86400 /f
   ```

3. **Use Closest RPC**
   - North America: Mainnet Beta
   - Europe: Mainnet Beta
   - Asia: Consider regional RPC providers

### Monitor Connection Quality

```powershell
# Ping Jupiter
ping quote-api.jup.ag -t

# Watch for:
# - Latency < 100ms: Good
# - Latency 100-300ms: Acceptable
# - Latency > 300ms or timeouts: Problem
```

---

## 🔐 Security Considerations

### Safe DNS Providers

✅ **Trusted:**
- Google DNS (8.8.8.8)
- Cloudflare DNS (1.1.1.1)
- Quad9 DNS (9.9.9.9)
- OpenDNS (208.67.222.222)

❌ **Avoid:**
- Unknown free DNS services
- DNS from untrusted sources
- DNS that requires payment for "premium" access

### VPN Recommendations

✅ **Good for Trading:**
- NordVPN
- ProtonVPN
- Mullvad
- ExpressVPN

⚠️ **Avoid:**
- Free VPNs (slow, unreliable, may steal data)
- VPNs from countries with data retention laws

---

## 📝 Logging & Debugging

### Enable Verbose Logging

In the app, enable debug mode:
```typescript
// main.ts
const DEBUG = true;
```

### Check Logs

Logs are stored in:
```
%APPDATA%\anvil-solo\logs\
```

Look for entries like:
```
[ERROR] Jupiter API failed: ENOTFOUND
[INFO] Switching to fallback endpoint
[SUCCESS] Connected to api.jup.ag
```

### Report Issues

If reporting bugs, include:
1. Full error message
2. Output from `diagnose-jupiter.bat`
3. Your location/ISP
4. Windows version
5. App version

---

## 🎯 Quick Reference

| Problem | Solution | Command |
|---------|----------|---------|
| DNS fails | Flush cache | `ipconfig /flushdns` |
| All endpoints fail | Change DNS | `fix-jupiter-dns.bat` |
| Timeout | Check firewall | Allow app in firewall |
| ISP blocking | Use VPN | Connect to VPN |
| Intermittent | Restart router | Power cycle router |
| Full diagnostic | Run tool | `diagnose-jupiter.bat` |

---

## ✨ Success Indicators

You'll know it's working when you see:

```
✅ Jupiter API is reachable
✅ Using Jupiter endpoint: https://quote-api.jup.ag/v6
✅ Got quote: outAmount=1234567
✅ Swap transaction confirmed
```

---

**Last Updated:** October 2024  
**Anvil Version:** 3.0  
**Jupiter API:** v6






