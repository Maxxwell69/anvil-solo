# 💰 Fee Structure Setup Guide

**Configure fees for Anvil Solo downloads and license purchases**

---

## 🎯 Overview

Set up automatic fee collection on:
- ✅ Software downloads
- ✅ License purchases
- ✅ License renewals
- ✅ Any transaction type

Fees can be:
- Percentage-based (e.g., 2.5%)
- Fixed amount (e.g., $5.00)
- Tiered (different rates for different amounts)

---

## 🔐 Step 1: Access Admin Panel

### **Login:**
1. Go to: `https://anvil-solo-production.up.railway.app/login`
2. Email: `maxx@pantherpilot.com`
3. Password: `ShogunMaxx1969!`

### **Access Admin:**
```
https://anvil-solo-production.up.railway.app/admin
```

**Note:** You need `super_admin` role to access this!

---

## 💵 Step 2: Configure Your Fee Wallet

### **Your Solana Wallet for Fee Collection:**

```
82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

This wallet will receive all fees from:
- Anvil Solo downloads
- License purchases
- Any configured fee structures

---

## 📊 Step 3: Set Up Fee Structures

### **In Admin Panel:**

1. Go to **"Fee Structures"** tab
2. Click **"Add Fee Structure"**

---

### **Fee Structure #1: Download Fee**

**Configure:**
- **Name**: `Anvil Solo Download Fee`
- **Description**: `Applied to all Anvil Solo software downloads`
- **Fee Type**: `Percentage`
- **Fee Value**: `2.5` (for 2.5%)
- **Applies To**: `Download`
- **Tier Filter**: Leave empty (applies to all tiers)
- **Recipient Wallet**: `82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd`
- **Priority**: `1`
- **Active**: ✅ Checked

**Click "Add"**

---

### **Fee Structure #2: License Purchase Fee**

**Configure:**
- **Name**: `License Purchase Fee`
- **Description**: `Applied when users purchase licenses`
- **Fee Type**: `Percentage`
- **Fee Value**: `5.0` (for 5%)
- **Applies To**: `License`
- **Tier Filter**: Leave empty
- **Recipient Wallet**: `82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd`
- **Priority**: `2`
- **Active**: ✅ Checked

**Click "Add"**

---

### **Fee Structure #3: Pro Tier Download Fee (Optional)**

**Configure:**
- **Name**: `Pro Tier Premium Fee`
- **Description**: `Additional fee for Pro tier downloads`
- **Fee Type**: `Fixed`
- **Fee Value**: `1.0` (for $1.00)
- **Applies To**: `Download`
- **Tier Filter**: `pro`
- **Recipient Wallet**: `82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd`
- **Priority**: `3`
- **Active**: ✅ Checked

**Click "Add"**

---

## 🔗 Step 4: Connect to Anvil Solo Downloads

### **Download Files Configuration:**

The system has these predefined download files:

```javascript
anvil-solo-setup.exe       // Windows installer
anvil-solo-portable.zip    // Portable version
anvil-solo-mac.dmg         // macOS version
```

**Each download automatically:**
1. ✅ Checks user has valid license
2. ✅ Calculates applicable fees
3. ✅ Records fee transaction
4. ✅ Generates secure download token
5. ✅ Tracks download in analytics

---

## 💡 Step 5: How Fees Are Applied

### **When User Downloads Anvil Solo:**

```
1. User clicks "Download" button
   ↓
2. System checks active fees for "download" type
   ↓
3. Calculates total fees:
   - Download Fee: 2.5% 
   - Pro Tier Fee: $1.00 (if applicable)
   ↓
4. Records transaction in fee_transactions table
   ↓
5. User gets download link
   ↓
6. Fees tracked for your wallet
```

---

## 📊 Step 6: View Fee Analytics

### **In Admin Panel:**

1. Go to **"Overview"** tab
2. See **"Total Revenue"** card
3. Click **"Fee Structures"** tab to view all fees
4. Check **"Audit Log"** to see fee applications

### **View Transactions:**

All fee transactions are logged in the database:

```sql
SELECT * FROM fee_transactions 
WHERE recipient_wallet = '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd'
ORDER BY created_at DESC;
```

---

## 🎯 Step 7: Configure Download Files

### **Edit Available Files:**

In `src/routes/downloads.ts`, the `AVAILABLE_FILES` array defines what can be downloaded:

```typescript
const AVAILABLE_FILES = [
    {
        name: 'anvil-solo-setup.exe',
        version: '3.0.0',
        size: 150000000, // 150 MB
        description: 'Anvil Solo Trading Bot - Windows Setup',
        requiresLicense: true,
    },
    // Add more files...
];
```

**To add more files:**
1. Edit `src/routes/downloads.ts`
2. Add new file object to array
3. Commit and push to GitHub
4. Railway auto-deploys

---

## 💳 Fee Structure Examples

### **Example 1: Simple Percentage**
```
Type: Percentage
Value: 2.5
Result: 2.5% of download size or license price
```

### **Example 2: Fixed Amount**
```
Type: Fixed
Value: 5.0
Result: $5.00 flat fee per download
```

### **Example 3: Tiered (Advanced)**
```
Type: Tiered
Min Amount: 0
Max Amount: 100
Value: 2.0 (2%)

Another tier:
Min Amount: 100
Max Amount: 1000
Value: 1.5 (1.5%)
```

---

## 🔄 Step 8: Fee Collection Workflow

### **Automatic Fee Tracking:**

```
User downloads Anvil Solo
    ↓
System calculates fees
    ↓
Creates fee_transaction record:
    - User ID
    - License ID
    - Fee amount
    - Recipient wallet (yours)
    - Status: pending
    ↓
Records in database
    ↓
Shows in admin analytics
    ↓
You can track all revenue
```

---

## 💼 Your Fee Wallet Configuration

### **Primary Fee Wallet:**
```
Address: 82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
Network: Solana
Purpose: Receive all license server fees
```

**Set in Railway Variables:**
```
FEE_WALLET_ADDRESS=82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

---

## 📈 Step 9: Monitor Fee Revenue

### **In Admin Dashboard:**

**View:**
- Total revenue (all time)
- Recent transactions
- Fees by type
- Revenue by license tier
- Download fee analytics

### **Database Queries:**

**Total revenue:**
```sql
SELECT 
    SUM(fee_amount) as total_revenue,
    COUNT(*) as total_transactions
FROM fee_transactions
WHERE status = 'completed';
```

**Revenue by type:**
```sql
SELECT 
    transaction_type,
    SUM(fee_amount) as revenue,
    COUNT(*) as count
FROM fee_transactions
GROUP BY transaction_type;
```

---

## ⚙️ Step 10: Advanced Fee Configuration

### **Multiple Fee Wallets:**

You can set different recipient wallets for different fee types:

```
Download fees    → Wallet A
License fees     → Wallet B
Renewal fees     → Wallet C
```

### **Tier-Specific Fees:**

```
Free tier    → No fees
Pro tier     → 2.5% fee
Enterprise   → 1% fee (volume discount)
```

### **Priority System:**

Lower priority number = applied first:
```
Priority 1: Base download fee (2.5%)
Priority 2: Tier bonus fee (1%)
Priority 3: Special promotion fee (-0.5%)
```

---

## 📋 Quick Setup Checklist

- [ ] Access admin panel
- [ ] Go to Fee Structures tab
- [ ] Add Download Fee (2.5%, recipient: your wallet)
- [ ] Add License Fee (5%, recipient: your wallet)
- [ ] Set wallets to active
- [ ] Test by requesting download
- [ ] Verify fee appears in transactions
- [ ] Check analytics dashboard

---

## 🎯 Recommended Fee Structures for Anvil Solo

### **For Downloads:**
```
Name: Standard Download Fee
Type: Percentage
Value: 2.5%
Applies To: Download
Wallet: 82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

### **For License Sales:**
```
Name: License Purchase Fee
Type: Percentage  
Value: 5%
Applies To: License
Wallet: 82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

### **For Renewals:**
```
Name: Renewal Processing Fee
Type: Fixed
Value: $2.00
Applies To: Renewal
Wallet: 82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd
```

---

## 🔗 Integration with Anvil Solo

### **In Desktop App:**

The Anvil Solo app will:
1. Request download from license server
2. Receive fee breakdown
3. Show user total cost
4. Get secure download link
5. Track download completion

### **API Flow:**

```javascript
// Desktop app requests download
POST /api/downloads/request/anvil-solo-setup.exe
Authorization: Bearer <user-token>

// Server responds with:
{
  "downloadToken": "secure-token",
  "downloadUrl": "/api/downloads/file/token",
  "fees": {
    "total": 2.50,
    "breakdown": [
      {
        "name": "Download Fee",
        "amount": 2.50,
        "type": "percentage"
      }
    ]
  }
}
```

---

## ✅ After Fee Setup

Users downloading Anvil Solo will:
1. See total cost (including fees)
2. Fees automatically calculated
3. Transaction recorded
4. Revenue tracked in your admin panel
5. Fees go to your wallet

---

**First, let's get you into the admin panel, then you can configure all these fees with a nice UI!** 🚀

**Current status:** Waiting for Railway to deploy the database fix, then you can register and I'll help you become super_admin!


