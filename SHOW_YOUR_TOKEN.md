# 🪙 How to See Your $af Token Purchase

## ✅ What I Fixed

The Trades & Volume page now:
1. ✅ Correctly identifies which token was bought/sold
2. ✅ Shows token names (fetches from Jupiter API automatically)
3. ✅ Displays the full token address
4. ✅ Shows your $af token purchase

**Problem was:** The query was using `input_token` for all trades, but for BUY trades, the actual token is in `output_token`!

**Fixed:** Now uses the correct field based on direction (buy/sell)

---

## 🚀 See Your $af Token Now

### **Step 1: Restart the App**
```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
node start-app.js
```

### **Step 2: Unlock Wallet**
Enter your password

### **Step 3: Visit Trades & Volume Page**
Click **📊 Trades & Volume** in the left sidebar

### **Step 4: You Should Now See:**

**Summary Stats:**
```
Total Trades: 1
Total Volume: 0.01 SOL
Today's Volume: 0.01 SOL
Success Rate: 100%
```

**Today's Activity:**
```
Buys Today: 1 (0.010 SOL)
Sells Today: 0 (0.000 SOL)
```

**Recent Trades:**
```
✅ 📥 BUY 0.0100 SOL
   [timestamp] • Strategy #1
   5snjXZ6jhX... [View on Solscan]
```

**Volume by Token (Last 7 Days):**
```
🪙 $af (or token name from Jupiter)
   [Full token address shown below name]
   📈 Buys: 0.010 SOL
   📉 Sells: 0.000 SOL
   📊 Trades: 1
```

---

## 💡 How Token Names Work

The app tries to get token names in this order:

1. **Token Manager** - Your saved tokens with custom names
2. **Jupiter API** - Official token name/symbol
3. **Fallback** - Shows shortened address (if both fail)

### **To Add Custom Name for Your $af Token:**

1. Go to **🪙 Token Manager**
2. Click **Add Token**
3. Fill in:
   - **Name:** `$af` (or whatever you want)
   - **Symbol:** `AF` (optional)
   - **Address:** [paste the full token address]
4. Save
5. Go back to **📊 Trades & Volume**
6. Now shows your custom name!

---

## 🔍 What Token Address Did You Buy?

From your transaction on Solscan:
https://solscan.io/tx/5snjXZ6jhXpQYd7PvurFCGsQEgiwBPM1Rqb9M7NQURS9Cddt3MBSPhxJD1tCt36NQndW7fjkKtKFZ5mrF5iUGvzA

**To find the token:**
1. Open that link in browser
2. Look at "Token Balances Change" section
3. You'll see: `-0.01 SOL` and `+XXX [TOKEN_NAME]`
4. Copy the token address

**Then add it to Token Manager with the name you want!**

---

## 📊 Debug: Check Database

If you still don't see the trade, let's verify it's in the database:

**When you restart the app, watch the terminal for:**
```
📊 Retrieved X transactions from database
First transaction: {
  id: 1,
  direction: 'buy',
  token_mint: '[YOUR_TOKEN_ADDRESS]',
  amount: 0.01,
  status: 'confirmed'
}
```

If you see this, the data is there and should display!

---

## 🎯 Expected Result

After restarting, the **📊 Trades & Volume** page should show:

1. **Top Stats Cards** - Your trade counted
2. **Today's Activity** - 1 buy for 0.01 SOL  
3. **Recent Trades** - Your transaction listed with link to Solscan
4. **Volume by Token** - Your $af token with full address and stats

**The token name will either be:**
- `$af (AF)` - if Jupiter knows it
- Or shortened address - if it's a new/unlisted token

**You can add a custom name in Token Manager!**

---

## 🔧 Troubleshooting

### **Page is Empty:**

**Check terminal for:**
```
Loading trades and volume data...
📊 Retrieved 0 transactions from database
```

If 0 transactions → Data might not have saved. Check:
1. Was the swap successful? (you said yes)
2. Look for `logTransaction` calls in terminal
3. Database might not have transaction table

### **Shows Transaction But Wrong Token:**

This shouldn't happen now - the query is fixed to use:
- `output_token` for BUY trades (the token you received)
- `input_token` for SELL trades (the token you sent)

### **Token Name Missing:**

Normal for new/unlisted tokens. Add to Token Manager:
1. Copy token address from trades page
2. Go to Token Manager
3. Add with friendly name
4. Refresh trades page

---

## ✅ Action Items

**Right now:**
1. Restart the app
2. Unlock wallet
3. Click **📊 Trades & Volume**
4. Take a screenshot and tell me what you see!

**If your $af token shows:**
- ✅ Everything is working!
- Copy the token address
- Add to Token Manager with name "$af"

**If it's still empty:**
- Share the terminal output (especially lines about "Retrieved X transactions")
- I'll debug further

---

**Restart now and check the Trades & Volume page!** 🚀



