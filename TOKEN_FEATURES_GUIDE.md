# 🪙 Token Manager - Auto-Fetch & Jupiter Integration

## ✨ New Features Added!

Your Token Manager now has **3 ways** to add tokens with auto-populated information!

---

## 🚀 Method 1: Auto-Fetch from Address (EASIEST)

### **How It Works:**

1. **Go to 🪙 Token Manager**
2. **Paste token address** in the "Contract Address" field
3. **Click "🔍 Fetch Token Info"** button
4. **Auto-fills:** Name, Symbol, Decimals from Jupiter API!
5. **Click "Add Token"** to save

### **Example - Adding Your $af Token:**

```
Step 1: Paste address
Contract Address: [YOUR_$AF_ADDRESS]

Step 2: Click "🔍 Fetch Token Info"
↓
Auto-fills:
✅ Name: "$af" (or official name)
✅ Symbol: "AF"
✅ Decimals: Detected automatically

Step 3: Click "Add Token"
✅ Saved!
```

### **Keyboard Shortcut:**
- Paste address → Press **Enter** → Auto-fetches!

---

## 🌐 Method 2: Browse Jupiter Verified Tokens (NEW!)

### **How It Works:**

1. **Go to 🪙 Token Manager**
2. **Click "🌐 Browse Jupiter Tokens"** button
3. **Browse hundreds of verified tokens** with:
   - Token logos
   - Official names
   - Symbols
   - Contract addresses
4. **Search** to find specific tokens
5. **Click "➕ Add"** to select any token
6. **Click "Add Token"** to save

### **Example - Adding BONK:**

```
Step 1: Click "🌐 Browse Jupiter Tokens"

Step 2: Search "BONK" in the search box

Step 3: See results:
🐕 BONK
   Symbol: BONK
   Address: DezXAZ...

Step 4: Click "➕ Add"
↓
Form auto-fills with BONK details

Step 5: Click "Add Token"
✅ Saved!
```

### **Features:**
- **100+ Popular Tokens:** BONK, WIF, USDC, RAY, etc.
- **Search:** Type name, symbol, or address
- **Logos:** Visual token icons
- **Verified:** Only Jupiter-verified tokens
- **One-Click:** Select and add instantly

---

## ✏️ Method 3: Manual Entry (For New/Unlisted Tokens)

### **For tokens not in Jupiter (like your $af):**

1. **Enter manually:**
   - Name: `$af` (whatever you want to call it)
   - Symbol: `AF`
   - Address: [paste full address]
   - Notes: Optional notes
2. **Click "Add Token"**

### **When to Use Manual:**
- Brand new tokens (not yet listed)
- Custom/private tokens
- Test tokens
- Tokens you want custom names for

---

## 🔍 How Auto-Fetch Works

### **API Endpoints Used:**

**Primary: Jupiter Tokens API**
```
https://tokens.jup.ag/token/[ADDRESS]
```
Returns: name, symbol, decimals, logo, tags

**Fallback: Jupiter Quote API**
```
Uses your backend Jupiter client
```
If token exists, returns basic info

**Result:**
- ✅ Verified tokens: Full info with logo
- ⚠️ Unverified tokens: May get partial info or need manual entry
- ❌ Brand new tokens: Manual entry required

---

## 📊 What Data is Fetched

### **From Jupiter Verified List:**
```json
{
  "address": "DezXAZ8z...",
  "name": "Bonk",
  "symbol": "BONK",
  "decimals": 5,
  "logoURI": "https://...",
  "tags": ["verified", "community"]
}
```

### **What Gets Saved to Your Database:**
```sql
- name: "Bonk"
- symbol: "BONK"  
- contract_address: "DezXAZ8z..."
- decimals: 5
- notes: (your optional notes)
- created_at: timestamp
```

---

## 🎯 Use Cases

### **For Volume Trading:**
```
Add 10-20 popular tokens from Jupiter browser:
- BONK, WIF, USDC, RAY, etc.
- All verified and safe
- Auto-populated details
- Ready to trade immediately
```

### **For New Token Launch:**
```
Your token not in Jupiter yet?
1. Enter address
2. Click "Fetch Token Info"
3. If not found, enter name manually
4. Add to your list
5. Now easily select in strategies
```

### **For Portfolio Tracking:**
```
Add all tokens you hold:
- Browse Jupiter for popular ones
- Manual entry for rare/new ones
- Notes field for your reminders
- Quick access in all strategy forms
```

---

## 💡 Benefits for Your Network

### **Shared Token Database:**

When users add tokens using Jupiter API:

1. **Consistent Names** - Everyone sees same official names
2. **Verified Data** - Jupiter curates their list
3. **Up-to-Date** - Fetches latest info each time
4. **No Typos** - Auto-fill prevents errors
5. **Logos** - Visual identification

### **For Multi-User Scenarios:**

If you deploy this for a team/network:
- Everyone can browse same Jupiter list
- Consistent token naming across users
- Easy onboarding (just browse and add)
- No need for manual token databases

---

## 🔧 Technical Details

### **Jupiter Tokens API Endpoints:**

**Get Single Token:**
```
GET https://tokens.jup.ag/token/[ADDRESS]
```

**Get All Verified Tokens:**
```
GET https://tokens.jup.ag/tokens?tags=verified
```

**Get All Tokens (including unverified):**
```
GET https://tokens.jup.ag/tokens
```

**Alternative (Lite API):**
```
GET https://lite-api.jup.ag/tokens/v1/
```

### **Response Format:**
```json
{
  "address": "string",
  "name": "string",
  "symbol": "string",
  "decimals": number,
  "logoURI": "string",
  "tags": ["verified", "community", etc.],
  "extensions": {...}
}
```

---

## 🎨 Visual Guide

### **Token Manager Page Layout:**

```
┌────────────────────────────────────────────────────┐
│ 🪙 Token Manager                                   │
├────────────────────────────────────────────────────┤
│                                                     │
│ Add New Token                                       │
│ ┌─────────────────────────────────────────────┐   │
│ │ Token Name: [Bonk              ]            │   │
│ │ Symbol:     [BONK              ]            │   │
│ │ Address:    [DezXAZ8z...]  [🔍 Fetch Info] │   │
│ │ Notes:      [Optional notes...   ]          │   │
│ │                                              │   │
│ │ [Add Token]  [Clear Form]                   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ My Tokens                  [🌐 Browse Jupiter]     │
│ ┌─────────────────────────────────────────────┐   │
│ │ BONK (BONK) 🌟                              │   │
│ │ DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263│   │
│ │ [📋 Copy] [⭐ Favorite] [✏️ Edit] [🗑️]     │   │
│ └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### **Jupiter Token Browser:**

```
┌────────────────────────────────────────────────────┐
│ Jupiter Verified Tokens                            │
│ Search: [bonk_____________]                        │
├────────────────────────────────────────────────────┤
│ 🐕 Bonk                    DezXAZ8...  [➕ Add]   │
│    BONK                                            │
├────────────────────────────────────────────────────┤
│ 🐶 dogwifhat               EKpQGS...  [➕ Add]    │
│    WIF                                             │
├────────────────────────────────────────────────────┤
│ 💵 USD Coin                EPjFWd...  [➕ Add]    │
│    USDC                                            │
└────────────────────────────────────────────────────┘
```

---

## 🚀 How to Use (Step-by-Step)

### **Scenario A: Adding Your $af Token**

1. Open Anvil → **🪙 Token Manager**
2. Paste your $af address in "Contract Address"
3. Click **"🔍 Fetch Token Info"**
4. If found on Jupiter:
   - Name/Symbol auto-fills
   - Click "Add Token" to save
5. If not found:
   - Enter name manually: `$af`
   - Enter symbol: `AF`
   - Click "Add Token"

**Result:** Your $af token is now in your list with a friendly name!

### **Scenario B: Adding Popular Tokens**

1. Open Anvil → **🪙 Token Manager**
2. Click **"🌐 Browse Jupiter Tokens"**
3. Search for tokens:
   - Type "BONK" → Click ➕ Add
   - Type "WIF" → Click ➕ Add
   - Type "USDC" → Click ➕ Add
4. Each click auto-fills the form
5. Click "Add Token" to save each one

**Result:** Quickly build your token list from verified sources!

---

## 💾 Data Storage: Local vs Network

### **Where Tokens Are Stored:**

**Your Personal List:**
```
Location: C:\Users\maxxf\.anvil\anvil-solo.db
Table: tokens
Access: Only you
```

**Jupiter's Network List:**
```
Source: https://tokens.jup.ag/tokens
Access: Everyone (public API)
Updates: Real-time from Jupiter
Tokens: 1000+ verified tokens
```

### **How They Work Together:**

1. **Jupiter** = Central verified token database (read-only)
2. **Your DB** = Personal saved token list (read-write)

**When you add a token:**
- Fetched from Jupiter (verified info)
- Saved to your local DB (for quick access)
- Available in all dropdowns
- Shown on strategy cards

---

## 🌍 Network Token Sharing (Future Feature)

### **If You Want Team/Network to Share Tokens:**

**Option A: Cloud Token Sync (Advanced)**
```typescript
// Future feature
- Upload your token list to cloud
- Team members download shared list
- Everyone uses same tokens
- Centralized token management
```

**Option B: Export/Import Lists**
```
- Export: tokens.json file
- Share with team
- They import into their apps
- Manual sync
```

**Option C: Use Jupiter Only**
```
- Everyone uses Jupiter browser
- No custom lists needed
- All tokens verified
- Simplest approach
```

### **Recommendation:**
For now, just use **Jupiter Browser** - everyone on your network can browse the same verified list!

---

## ✅ What's Now Working

### **Token Manager Features:**

1. ✅ **Auto-Fetch** - Paste address, click button, details filled
2. ✅ **Jupiter Browser** - Browse 100+ verified tokens
3. ✅ **Search** - Find tokens by name, symbol, address
4. ✅ **Logos** - Visual token identification
5. ✅ **One-Click Add** - Select from list and save
6. ✅ **Manual Entry** - For unlisted tokens
7. ✅ **Clear Form** - Reset all fields

### **Integration:**

- ✅ Token names show on strategy cards
- ✅ Token names show on Trades & Volume page
- ✅ Dropdowns in DCA/Ratio/Bundle forms
- ✅ Easy copy/paste of addresses
- ✅ Favorite tokens for quick access

---

## 🎯 Quick Start Guide

### **Step 1: Add Your $af Token**
```
1. Token Manager → Paste $af address
2. Click "🔍 Fetch Token Info"
3. If auto-fills → Great!
4. If not → Enter "$af" as name
5. Click "Add Token"
```

### **Step 2: Add Popular Tokens**
```
1. Click "🌐 Browse Jupiter Tokens"
2. Search "BONK" → Click "➕ Add" → Save
3. Search "WIF" → Click "➕ Add" → Save
4. Search "USDC" → Click "➕ Add" → Save
```

### **Step 3: See Token Names Everywhere**
```
- Dashboard strategy cards show "BONK" not addresses
- Trades & Volume page shows token names
- Easy to identify your trading activity
```

---

## 📱 Restart and Try It!

```powershell
cd C:\Users\maxxf\OneDrive\Desktop\shogun\Anvil3.0\anvil3.0\anvil-solo
node start-app.js
```

**Then:**
1. Unlock wallet
2. Go to **🪙 Token Manager**
3. Try the **"🔍 Fetch Token Info"** button
4. Try the **"🌐 Browse Jupiter Tokens"** button
5. Add your $af token with auto-fetch or manual entry

---

## 🆘 Troubleshooting

### **Fetch Token Info Not Working:**

**Check console for:**
```
❌ Jupiter API fetch error: [error]
```

**Solutions:**
1. Run `fix-jupiter-dns.bat` if DNS issue
2. Check internet connection
3. Jupiter API may be temporarily down
4. Use manual entry as fallback

### **Browse Jupiter Tokens Empty:**

**Solutions:**
1. Check internet connection
2. Wait a moment for API response
3. Try refreshing the page
4. Use auto-fetch or manual entry instead

### **Token Not Found:**

If your token is very new:
- ✅ Normal - not in Jupiter list yet
- ✅ Use manual entry
- ✅ Still works fine
- ✅ You can add any token

---

## 🎓 Understanding the Token Network

### **Jupiter's Role:**

Jupiter maintains a **public verified token list** that:
- Anyone can access (free API)
- Updates in real-time
- Curated for quality/safety
- Includes 1000+ Solana tokens

### **Your Token Manager:**

Your **personal database** that:
- Stores tokens YOU want to track
- Can include Jupiter tokens + your own
- Syncs with Jupiter for verified info
- Private to your installation

### **How They Connect:**

```
Jupiter Network (Cloud)
         ↓
    [Fetch API]
         ↓
Your Token Manager (Local)
         ↓
Strategy Cards / Trades Page
```

**Benefits:**
- Get verified info from network
- Store locally for speed
- Best of both worlds!

---

## 🔮 Future Enhancements

### **Planned Features:**

1. **Token Price Integration**
   - Show current price
   - Price charts
   - 24h change %

2. **Token Analytics**
   - Volume per token
   - P&L tracking
   - Performance metrics

3. **Shared Token Lists**
   - Export/import token lists
   - Team collaboration
   - Cloud sync (optional)

4. **Smart Recommendations**
   - Popular tokens on network
   - Trending tokens
   - High liquidity tokens

---

## ✅ Summary

**What You Now Have:**

1. **Auto-Fetch** - Paste address → Click button → Done!
2. **Jupiter Browser** - Browse verified tokens → One-click add
3. **Manual Entry** - For new/custom tokens
4. **Trades Page Fixed** - Shows token names properly
5. **Strategy Cards** - Display friendly names
6. **Network Integration** - Uses Jupiter's verified list

**Where Data Lives:**
- **Jupiter API** = Public verified token network (read-only)
- **Your Database** = Personal token list (read-write)
- **Best of both!**

---

## 🚀 Try It Now!

**Restart the app and:**

1. Go to **🪙 Token Manager**
2. Click **"🌐 Browse Jupiter Tokens"**
3. Search for "BONK" 
4. Click "➕ Add"
5. Save it
6. Go to **📊 Trades & Volume**
7. Your $af token should now show with name!

---

**All features are live! Restart and test!** 🎉



