# 💰 New 3-Level Fee System

**Flexible fee structure: System Default → Tier Override → User Override**

---

## 🎯 How It Works

### **3-Level Priority System:**

```
1️⃣ SYSTEM DEFAULT (Settings)
    ↓ (if no tier override)
2️⃣ TIER OVERRIDE (per tier: free, tier1, tier2, tier3)
    ↓ (if no user override)
3️⃣ USER OVERRIDE (per individual user)
```

**Priority:** User Override > Tier Override > System Default

---

## ⚙️ Level 1: System Default Fee (Settings)

### **Location:** Admin Panel → Settings Tab

**Default Trade Fee:** `0.5%`

This applies to **all users** unless overridden by tier or user settings.

### **How to Change:**

**In Admin Panel:**
1. Go to **"Settings"** tab
2. Find **"default_trade_fee_percentage"**
3. Click "Edit"
4. Change value: `0.5` → `1.0` (or any %)
5. Click "Save"

**Result:** All users without overrides now use 1.0%

---

## 🎫 Level 2: Tier-Level Override (Optional)

### **Location:** Admin Panel → License Tiers Tab

Set different fees for each tier:

| Tier | Default Fee | You Can Override To: |
|------|-------------|----------------------|
| **Free** | Uses system (0.5%) | Override to 10% |
| **Tier 1** | Uses system (0.5%) | Override to 5% |
| **Tier 2** | Uses system (0.5%) | Override to 2.5% |
| **Tier 3** | Uses system (0.5%) | Override to 1% |

### **How to Set Tier Override:**

**In Admin Panel:**
1. Go to **"License Tiers"** section
2. Click **"Edit"** on FREE tier
3. Set **"Trade Fee Override"**: `10.0`
4. Click "Save"
5. Repeat for other tiers

**Result:** 
- Free tier users: 10%
- Other tiers without override: still use system default (0.5%)

---

## 👤 Level 3: User-Level Override (Optional)

### **Location:** Admin Panel → Users → View User → Edit

Set custom fee for specific users:

**Use Cases:**
- VIP customer: 0.1% (special rate)
- Partner: 0% (no fees)
- Beta tester: 0.25% (discount)
- High-volume trader: 0.5% (volume discount)

### **How to Set User Override:**

**In Admin Panel:**
1. Go to **"Users"** tab
2. Click on a user
3. Click **"Edit User"**
4. Set **"Fee Override %"**: `0.1`
5. Add **"Fee Notes"**: `VIP customer - special rate`
6. Click "Save"

**Result:** This specific user pays 0.1% on all trades, regardless of their tier!

---

## 📊 Example Scenarios

### **Scenario 1: All Using System Default**

**System Settings:**
- Default fee: 0.5%

**All Tiers:**
- No tier overrides set (all NULL)

**Result:**
- Everyone pays 0.5%

---

### **Scenario 2: Tier Overrides Set**

**System Settings:**
- Default fee: 0.5%

**Tier Overrides:**
- Free: 10%
- Tier 1: 5%
- Tier 2: NULL (use default)
- Tier 3: NULL (use default)

**Result:**
- Free users: 10%
- Tier 1 users: 5%
- Tier 2 users: 0.5% (system default)
- Tier 3 users: 0.5% (system default)

---

### **Scenario 3: User Override**

**System Settings:**
- Default fee: 0.5%

**Tier Overrides:**
- Free: 10%

**User john@example.com (Free tier):**
- User override: 0.1%

**Result:**
- Regular free users: 10% (tier override)
- john@example.com: 0.1% (user override wins!)

---

## 🔧 Admin Panel UI

### **Settings Tab:**

```
┌────────────────────────────────────────┐
│ System Settings                        │
├────────────────────────────────────────┤
│                                        │
│ Fee Configuration                      │
│ ┌────────────────────────────────────┐ │
│ │ Default Trade Fee %:  [0.5]  Edit │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Fee Wallet: 82wZp...     Edit      │ │
│ └────────────────────────────────────┘ │
│                                        │
│ This is the base fee applied to all   │
│ trades unless overridden by tier or   │
│ user settings.                         │
└────────────────────────────────────────┘
```

### **License Tiers Tab:**

```
┌────────────────────────────────────────┐
│ License Tiers                          │
├────────────────────────────────────────┤
│                                        │
│ FREE TIER                              │
│ Price: $0                              │
│ Trade Fee Override: [10.0] or [NULL]  │
│ (NULL = use system default 0.5%)      │
│ [Edit]                                 │
│                                        │
│ TIER 1                                 │
│ Price: $29.99/mo                       │
│ Trade Fee Override: [NULL]             │
│ (Using system default: 0.5%)          │
│ [Edit]                                 │
└────────────────────────────────────────┘
```

### **User Profile:**

```
┌────────────────────────────────────────┐
│ User: john@example.com                 │
├────────────────────────────────────────┤
│ Email: john@example.com                │
│ Tier: tier1                            │
│ Role: user                             │
│                                        │
│ Fee Configuration:                     │
│ ┌────────────────────────────────────┐ │
│ │ Fee Override %: [  ] (optional)   │ │
│ │ Fee Notes: [               ]       │ │
│ │                                    │ │
│ │ Current Fee: 0.5% (from: system)  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Set override to give this user a      │
│ custom fee rate (e.g., 0.1% for VIP)  │
└────────────────────────────────────────┘
```

---

## 💡 Common Use Cases

### **Use Case 1: Simple Flat Fee**

**Setup:**
- System default: 0.5%
- All tier overrides: NULL
- No user overrides

**Result:** Everyone pays 0.5%

---

### **Use Case 2: Encourage Upgrades**

**Setup:**
- System default: 0.5%
- Free tier override: 10%
- Tier 1 override: 5%
- Tier 2, 3: NULL (use default 0.5%)

**Result:**
- Free: 10% (high to encourage upgrade)
- Tier 1: 5%
- Tier 2: 0.5%
- Tier 3: 0.5%

---

### **Use Case 3: VIP Customer**

**Setup:**
- System default: 0.5%
- Customer user override: 0.1%

**Result:**
- This customer pays only 0.1%
- Great for partnerships or high-volume traders

---

## 🔍 Fee Calculation Logic

```javascript
// When user makes a trade, system checks:

1. Does user have fee_override_percentage set?
   YES → Use that fee
   NO  → Go to step 2

2. Does user's tier have trade_fee_percentage set?
   YES → Use tier fee
   NO  → Go to step 3

3. Use system default_trade_fee_percentage
```

---

## 📊 Database Structure

### **system_settings table:**
```
setting_key: 'default_trade_fee_percentage'
setting_value: '0.5'
```

### **license_tiers table:**
```
tier_name: 'free'
trade_fee_percentage: 10.0 (or NULL to use default)
```

### **users table:**
```
email: 'john@example.com'
fee_override_percentage: 0.1 (or NULL to use tier/default)
fee_notes: 'VIP customer'
```

---

## 🎯 Admin Actions

### **Set System Default Fee:**
```
Settings → Edit "default_trade_fee_percentage" → Save
```

### **Set Tier Fee Override:**
```
License Tiers → Edit Free Tier → Set fee to 10% → Save
```

### **Set User Fee Override:**
```
Users → Click user → Edit → Set Fee Override to 0.1% → Save
```

---

## ✅ Benefits of This System

### **Flexibility:**
✅ One place to change fee for everyone (system default)  
✅ Different fees per tier if wanted  
✅ Custom fees for VIP customers  

### **Easy Management:**
✅ Change system default: affects everyone instantly  
✅ Tier overrides: optional, only if you want different rates  
✅ User overrides: perfect for special deals  

### **Clear Priority:**
✅ User override always wins (special deals)  
✅ Then tier override (if set)  
✅ Then system default (fallback)  

---

## 📋 Quick Setup Guide

### **Step 1: Set System Default (Required)**
```
Admin → Settings → default_trade_fee_percentage = 0.5
```

### **Step 2: Set Tier Overrides (Optional)**
```
Admin → Tiers → Free Tier → Set override = 10%
Admin → Tiers → Tier 1 → Set override = 5%
(Leave Tier 2 & 3 as NULL to use system default)
```

### **Step 3: Set User Overrides (As Needed)**
```
Admin → Users → View User → Edit → Fee Override = 0.1%
```

---

## 🚀 Your Recommended Configuration

### **System Default:**
```
0.5% - Good baseline for paid tiers
```

### **Tier Overrides:**
```
Free:   10% - High fee, encourages upgrade
Tier 1: 5%  - Better than free
Tier 2: NULL - Uses system 0.5%
Tier 3: NULL - Uses system 0.5%
```

### **User Overrides:**
```
Set individually for:
- VIP customers (lower fee)
- Partners (0% fee)
- Beta testers (special rate)
```

---

## ✅ Summary

**Your New Fee System:**

✅ **System Default:** 0.5% in settings (easy to change for everyone)  
✅ **4 Tiers:** free, tier1, tier2, tier3 (each can override default)  
✅ **User Override:** Set custom fee per user in their profile  
✅ **Priority Logic:** User > Tier > System  
✅ **Admin UI:** Manage all three levels easily  

---

**Deploying this new system now!** 🚀

