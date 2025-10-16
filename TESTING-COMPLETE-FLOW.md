# 🧪 Testing Complete Flow - User Journey

## Complete End-to-End Test

Let's test the entire user experience from discovery to trading.

---

## 🎯 Test Scenario

**Goal:** Verify a user can:
1. Find your product
2. Register for access
3. Purchase a license
4. Download the app
5. Activate their license
6. Execute trades

---

## 📋 Complete Test Flow

### **Phase 1: Registration & Access** 🆕

**URL:** `https://anvil-solo-production.up.railway.app/register`

#### Test Steps:
```
1. User visits registration page
2. Creates account with:
   - Email
   - Password
   - (Optional) Application info
3. Receives confirmation email
4. Account pending approval (if gated access enabled)
5. Admin approves account
6. User can now log in
```

**Test Checklist:**
- [ ] Registration form works
- [ ] Email validation works
- [ ] Password encryption works
- [ ] User can log in after registration
- [ ] Dashboard accessible

---

### **Phase 2: License Purchase**

**URL:** `https://anvil-solo-production.up.railway.app/dashboard`

#### Test Steps:
```
1. User logs in to dashboard
2. Views license tiers:
   - Free: 1 strategy, DCA only
   - Tier 1: 3 strategies, all types
   - Tier 2: 10 strategies, priority support
   - Tier 3: Unlimited, white-glove
3. Clicks "Purchase License"
4. Completes payment (Stripe/Gumroad)
5. License key generated
6. License key displayed on dashboard
```

**Test Checklist:**
- [ ] Dashboard shows tier information
- [ ] Payment integration works
- [ ] License key generated after payment
- [ ] License key visible on dashboard
- [ ] User can copy license key

---

### **Phase 3: App Download**

**URL:** `https://anvil-solo-production.up.railway.app/download.html`

#### Test Steps:
```
1. User clicks "Download" on dashboard
2. Redirected to download page
3. Clicks download button
4. File downloads from GitHub:
   https://github.com/Maxxwell69/anvil-solo/releases/download/v3.0.0/anvil-solo-portable.zip
5. Downloads complete (127 MB)
6. File saved to Downloads folder
```

**Test Checklist:**
- [ ] Download page loads
- [ ] Download link works
- [ ] File downloads completely
- [ ] File is correct size (~127 MB)
- [ ] No corruption (can extract)

---

### **Phase 4: Installation**

#### Test Steps:
```
1. Locate downloaded zip file
2. Right-click → "Extract All"
3. Extract to: C:\Program Files\Anvil Solo
4. Open extracted folder
5. Find "Anvil Solo.exe"
6. Double-click to run
```

**Test Checklist:**
- [ ] Zip extracts without errors
- [ ] All files present
- [ ] App launches when exe clicked
- [ ] No Windows security errors (or expected ones)
- [ ] App window opens

---

### **Phase 5: License Activation**

#### Test Steps:
```
1. App opens to license screen
2. User enters license key from dashboard
3. App contacts: https://endearing-compassion-production-bde0.up.railway.app
4. License validated:
   - HWID captured
   - Tier verified
   - Features unlocked
5. Welcome screen shows
6. Features available based on tier
```

**Test Checklist:**
- [ ] License input field appears
- [ ] Can paste license key
- [ ] Validation happens (loading indicator)
- [ ] Success message shows
- [ ] Correct tier features unlocked
- [ ] Free tier users see limitations

**Test Cases:**

**Test Case 1: Free User**
```
Input: No license key (skip)
Expected: 
  - 1 strategy max
  - DCA only
  - No ratio trading
  - No bundle trading
```

**Test Case 2: Paid License**
```
Input: Valid tier 1 license key
Expected:
  - 3 strategies max
  - All strategy types available
  - Features unlocked
```

**Test Case 3: Invalid License**
```
Input: Random/fake license key
Expected:
  - Validation fails
  - Error message shown
  - Falls back to free tier
```

**Test Case 4: Expired License**
```
Input: Valid but expired license
Expected:
  - Validation fails
  - "License expired" message
  - Falls back to free tier
```

---

### **Phase 6: Wallet Setup**

#### Test Steps:
```
1. License activated
2. App shows wallet setup
3. User chooses:
   Option A: Create new wallet
   Option B: Import existing wallet
```

**Option A - Create New Wallet:**
```
1. Click "Create New Wallet"
2. Enter strong password
3. Seed phrase displayed
4. User writes down seed phrase
5. Confirm seed phrase
6. Wallet created
7. Wallet address shown
```

**Option B - Import Wallet:**
```
1. Click "Import Wallet"
2. Paste seed phrase (12 or 24 words)
3. Enter password for app
4. Wallet imported
5. Wallet address shown
```

**Test Checklist:**
- [ ] Create wallet works
- [ ] Seed phrase generated (12 words)
- [ ] Seed phrase displayed clearly
- [ ] Import wallet works
- [ ] Password encryption works
- [ ] Wallet address displayed
- [ ] Can copy wallet address

---

### **Phase 7: Fund Wallet**

#### Test Steps:
```
1. Copy wallet address
2. Open Phantom/Coinbase/exchange
3. Send test amount (0.1 SOL)
4. Wait for confirmation
5. Balance updates in Anvil Solo
```

**Test Checklist:**
- [ ] Can copy wallet address
- [ ] Receives SOL from external wallet
- [ ] Balance shows correctly
- [ ] Balance updates in real-time

---

### **Phase 8: Create Strategy**

#### Test Steps - DCA Strategy:
```
1. Click "New Strategy"
2. Select "DCA"
3. Fill in:
   - Token: BONK (paste address)
   - Direction: Buy
   - Total Amount: 0.05 SOL
   - Number of Orders: 5
   - Frequency: Every 10 minutes
   - Slippage: 1%
4. Click "Create"
5. Strategy appears in list
```

**Test Checklist:**
- [ ] Strategy creation form appears
- [ ] All fields work
- [ ] Validation works (can't create invalid)
- [ ] Strategy saves to database
- [ ] Strategy shows in list

---

### **Phase 9: Execute Trade**

#### Test Steps:
```
1. Find created strategy
2. Click "Start"
3. Confirm start
4. Strategy status: "Active"
5. First trade executes
6. Transaction appears in history
7. Click transaction ID
8. Opens Solscan
9. Transaction verified on blockchain
```

**Test Checklist:**
- [ ] Start button works
- [ ] Strategy status updates
- [ ] Trade executes
- [ ] Transaction ID generated
- [ ] Shows in transaction history
- [ ] Solscan link works
- [ ] Trade visible on blockchain
- [ ] Balance decreases correctly
- [ ] Token balance increases

---

### **Phase 10: Monitor & Manage**

#### Test Steps:
```
1. View active strategies
2. Check progress (1/5 orders complete)
3. View transaction history
4. Pause strategy
5. Resume strategy
6. Stop strategy
7. View final results
```

**Test Checklist:**
- [ ] Progress bar updates
- [ ] Can pause mid-execution
- [ ] Can resume after pause
- [ ] Can stop strategy
- [ ] History shows all trades
- [ ] Profit/loss calculated

---

## 🧪 Test Checklist Summary

### **Backend (Cloud Services)**
- [ ] User registration works
- [ ] Login authentication works
- [ ] License generation works
- [ ] License validation API works
- [ ] HWID validation works
- [ ] Tier system enforced
- [ ] Download endpoint works

### **Distribution**
- [ ] Download page accessible
- [ ] File downloads from GitHub
- [ ] File is correct (not corrupt)
- [ ] Instructions clear

### **App Functionality**
- [ ] App launches
- [ ] License activation works
- [ ] Wallet creation works
- [ ] Wallet import works
- [ ] Balance checking works
- [ ] Strategy creation works
- [ ] Trade execution works
- [ ] Transaction history works

### **License Enforcement**
- [ ] Free tier: Limited to 1 strategy
- [ ] Free tier: DCA only (no ratio/bundle)
- [ ] Paid tier: Features unlocked
- [ ] Invalid license: Falls back to free
- [ ] Expired license: Handled correctly

---

## 🚀 Live Testing URLs

### **Your Services:**
```
Dashboard:  https://anvil-solo-production.up.railway.app
Register:   https://anvil-solo-production.up.railway.app/register
Login:      https://anvil-solo-production.up.railway.app/login
Download:   https://anvil-solo-production.up.railway.app/download.html

API Endpoints:
License:    https://endearing-compassion-production-bde0.up.railway.app/api/license
Validate:   https://endearing-compassion-production-bde0.up.railway.app/api/license/validate
```

### **GitHub:**
```
Release:    https://github.com/Maxxwell69/anvil-solo/releases/tag/v3.0.0
Download:   https://github.com/Maxxwell69/anvil-solo/releases/download/v3.0.0/anvil-solo-portable.zip
```

---

## 🎯 Quick Test Script

**Complete test in 15 minutes:**

```bash
# 1. Register (2 min)
Visit: https://anvil-solo-production.up.railway.app/register
Create account

# 2. Get License (2 min)
Login to dashboard
Copy license key (or use free tier)

# 3. Download (3 min)
Click download link
Wait for 127 MB download

# 4. Install (2 min)
Extract zip
Run Anvil Solo.exe

# 5. Activate (1 min)
Enter license key
Or skip for free tier

# 6. Wallet (2 min)
Create wallet
Fund with 0.1 SOL

# 7. Trade (3 min)
Create DCA strategy
Start strategy
Verify on Solscan
```

---

## 🐛 Common Issues to Test For

### **Registration Issues:**
- [ ] Duplicate email handling
- [ ] Weak password rejection
- [ ] Email validation

### **License Issues:**
- [ ] Invalid format rejection
- [ ] Already used license
- [ ] Wrong tier features

### **Download Issues:**
- [ ] Slow download
- [ ] Incomplete download
- [ ] Corrupt file

### **App Issues:**
- [ ] Won't launch
- [ ] Crashes on start
- [ ] Can't connect to API

### **Trading Issues:**
- [ ] Insufficient balance
- [ ] Invalid token address
- [ ] Slippage too low
- [ ] Network congestion

---

## ✅ Success Criteria

**Test passes when:**
1. ✅ User can register
2. ✅ User can purchase/activate license
3. ✅ User can download app
4. ✅ User can install app
5. ✅ License activates correctly
6. ✅ Wallet functions work
7. ✅ Trades execute successfully
8. ✅ Transactions appear on blockchain
9. ✅ Free tier limitations enforced
10. ✅ Paid tier features unlocked

---

## 📝 Test Results Template

```
Date: _____________
Tester: _____________
Version: v3.0.0

Phase 1 - Registration:        [ ] Pass [ ] Fail
Phase 2 - License Purchase:    [ ] Pass [ ] Fail
Phase 3 - Download:            [ ] Pass [ ] Fail
Phase 4 - Installation:        [ ] Pass [ ] Fail
Phase 5 - Activation:          [ ] Pass [ ] Fail
Phase 6 - Wallet Setup:        [ ] Pass [ ] Fail
Phase 7 - Fund Wallet:         [ ] Pass [ ] Fail
Phase 8 - Create Strategy:     [ ] Pass [ ] Fail
Phase 9 - Execute Trade:       [ ] Pass [ ] Fail
Phase 10 - Monitor:            [ ] Pass [ ] Fail

Overall: [ ] PASS [ ] FAIL

Issues Found:
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 🚀 Ready to Test!

**Start here:**
1. Open: `https://anvil-solo-production.up.railway.app/register`
2. Follow the test flow above
3. Report any issues found

**Railway is deploying your latest changes now!** ✅

