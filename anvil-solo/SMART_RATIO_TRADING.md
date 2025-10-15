# 🎯 Smart Ratio Trading - Auto-Reversing System

## ✅ NEW FEATURE: Auto-Reverse Ratio When Resources Run Out!

I just implemented your requested feature!

---

## 🧠 How It Works

### **Example: 1 Buy to 3 Sells (25% buy, 75% sell)**

#### **Phase 1: Normal Ratio**
```
Starting with 0.1 SOL:
- Trade 1: BUY  (spend SOL, get tokens)
- Trade 2: SELL (spend tokens, get SOL)
- Trade 3: SELL (spend tokens, get SOL)
- Trade 4: SELL (spend tokens, get SOL)
- Repeat...
```

#### **Phase 2: SOL Runs Out (< 0.01 SOL remaining)**
```
⚠️  LOW SOL WARNING
🔄 RATIO REVERSED AUTOMATICALLY!
Now trading: 75% SELL / 25% BUY

- Trade 5: SELL (build SOL back up)
- Trade 6: SELL (build SOL back up)
- Trade 7: SELL (build SOL back up)
- Trade 8: BUY  (occasional buy)
- Repeat...

SOL balance rebuilds!
```

#### **Phase 3: SOL Recovered (> 0.03 SOL)**
```
✅ SOL RECOVERED
🔄 REVERTING TO NORMAL RATIO
Back to: 25% BUY / 75% SELL

Continue trading normally...
```

---

## 🔄 **Smart Reversal Triggers:**

### **Trigger 1: SOL Runs Low**
```javascript
if (solBalance < 0.01 SOL) {
  // REVERSE: Flip buy/sell ratio
  // Start SELLING more to rebuild SOL
}
```

**Example:**
- **Normal:** 60% buy / 40% sell
- **Reversed:** 40% buy / 60% sell (sells more to get SOL back)

### **Trigger 2: Tokens Run Out**
```javascript
if (tokenBalance < 0.001 tokens) {
  // REVERSE BACK: Return to normal ratio
  // Start BUYING more to get tokens
}
```

### **Trigger 3: SOL Recovers**
```javascript
if (solBalance > 0.03 SOL) {
  // AUTO-REVERT: Back to normal ratio
  // Can start buying again
}
```

---

## 🎯 **Configuration Examples:**

### Example 1: Accumulation Mode
```javascript
{
  buyRatio: 80,   // 80% buy
  sellRatio: 20,  // 20% sell
}
```

**What Happens:**
1. Mostly buys (accumulates tokens)
2. When SOL runs out → **reverses to 20% buy / 80% sell**
3. Sells tokens to get SOL back
4. When SOL recovered → **back to 80% buy / 20% sell**
5. Cycle continues!

### Example 2: Volume Generation
```javascript
{
  buyRatio: 50,   // 50% buy
  sellRatio: 50,  // 50% sell
}
```

**What Happens:**
1. Balanced buy/sell
2. When SOL runs out → still 50/50 (already balanced)
3. When tokens run out → still 50/50
4. Maintains equilibrium naturally!

### Example 3: Selling Bias
```javascript
{
  buyRatio: 30,   // 30% buy
  sellRatio: 70,  // 70% sell
}
```

**What Happens:**
1. Mostly sells (generates SOL)
2. When tokens run out → **reverses to 70% buy / 30% sell**
3. Buys tokens to rebuild supply
4. When tokens recovered → **back to 30% buy / 70% sell**
5. Continues selling!

---

## 📊 **Reversal Thresholds:**

### Minimum Balances:
```javascript
MIN_SOL_REQUIRED = 0.01 SOL    // Below this → reverse to selling
MIN_TOKEN_REQUIRED = 0.001 tokens  // Below this → reverse to buying
```

### Recovery Thresholds:
```javascript
SOL_RECOVERY = 0.03 SOL (3x minimum)
TOKEN_RECOVERY = 0.003 tokens (3x minimum)
```

---

## 🎨 **What You'll See:**

### In the Console:
```
⚠️  LOW SOL WARNING: 0.0085 SOL remaining
🔄 REVERSING RATIO: Was 60% buy → Now 60% SELL
   Strategy will now SELL to build SOL back up!

... (trades execute) ...

✅ SOL RECOVERED: 0.0421 SOL available
🔄 REVERSING BACK TO NORMAL: 60% buy / 40% sell
```

### In the UI (Activity Log):
- Shows when ratio reversed
- Displays reversal count
- Updates strategy status

---

## 💡 **Smart Features:**

### 1. **Automatic Detection**
- Checks balances before each trade
- No manual intervention needed
- Prevents strategy from stopping

### 2. **Intelligent Recovery**
- Waits for 3x minimum before reversing back
- Prevents oscillating back and forth
- Smooth transitions

### 3. **Tracks Reversals**
- Counts how many times ratio flipped
- Shows in progress report
- Helps you understand strategy behavior

### 4. **Maintains Ratio Percentages**
- If you set 1:3 (25% / 75%), it stays 1:3
- Just swaps which side gets which percentage
- Keeps your intended distribution

---

## 🔧 **How to Use:**

### Step 1: Create Ratio Strategy
```
In the app:
1. Click "Ratio Trading"
2. Enter token address
3. Set Buy Ratio: 25% (1 buy)
4. Set Sell Ratio: 75% (3 sells)
5. Set daily volume and trades/hour
6. Create!
```

### Step 2: Watch It Work
```
Phase 1: Buys 1, Sells 3 (normal)
↓ (SOL runs low)
Phase 2: Buys 3, Sells 1 (reversed!)
↓ (SOL recovers)
Phase 3: Buys 1, Sells 3 (back to normal)
```

### Step 3: Monitor Progress
- Check activity log for reversal messages
- Watch balances in dashboard
- See reversal count in strategy details

---

## 🎯 **Perfect For:**

### Volume Generation
- **Start with:** 50% buy / 50% sell
- **Auto-balances** when resources run low
- **Continuous operation** without stopping

### Token Accumulation
- **Start with:** 80% buy / 20% sell
- **Automatically sells** when SOL runs out
- **Builds SOL back** then continues buying

### Market Making
- **Start with:** Custom ratio
- **Self-adjusting** based on resources
- **Never stops** due to balance issues

---

## 📈 **Example Scenario:**

```
You set: 1 buy to 3 sells (25%/75%)
Starting: 0.1 SOL, 0 tokens

Trade 1: BUY  0.025 SOL → Get 1000 tokens    (0.075 SOL, 1000 tokens)
Trade 2: SELL 250 tokens → Get 0.02 SOL     (0.095 SOL, 750 tokens)
Trade 3: SELL 250 tokens → Get 0.02 SOL     (0.115 SOL, 500 tokens)
Trade 4: SELL 250 tokens → Get 0.02 SOL     (0.135 SOL, 250 tokens)
Trade 5: BUY  0.025 SOL → Get 1000 tokens    (0.110 SOL, 1250 tokens)
...continues...

After many trades, SOL drops to 0.008:

⚠️  LOW SOL WARNING
🔄 RATIO REVERSED!

Now: 3 sells to 1 buy (75% sell / 25% buy)

Trade 20: SELL 300 tokens → Get 0.03 SOL    (0.038 SOL, 950 tokens)
Trade 21: SELL 300 tokens → Get 0.03 SOL    (0.068 SOL, 650 tokens)
Trade 22: SELL 300 tokens → Get 0.03 SOL    (0.098 SOL, 350 tokens)
Trade 23: BUY  0.025 SOL → Get 1000 tokens   (0.073 SOL, 1350 tokens)
...continues building SOL...

SOL reaches 0.035:

✅ SOL RECOVERED
🔄 BACK TO NORMAL: 1 buy to 3 sells

Continues with original ratio!
```

---

## ⚙️ **Configuration:**

### In Strategy Creation:
```javascript
{
  buyRatio: 25,      // 25% of trades are BUYS (1 in 4)
  sellRatio: 75,     // 75% of trades are SELLS (3 in 4)
  // When SOL low → automatically flips!
}
```

---

## 🎊 **Benefits:**

✅ **Never Stops** - Auto-adjusts when resources run low  
✅ **Self-Balancing** - Builds back whichever resource is needed  
✅ **Maintains Ratio** - Keeps your chosen proportion  
✅ **Smooth Operation** - No manual intervention required  
✅ **Smart Recovery** - Waits for sufficient balance before reverting  

---

## 🚀 **Ready to Use!**

This feature is now built into your ratio trading strategy!

**Just:**
1. Double-click "Anvil Solo" on your desktop
2. Create a Ratio Trading strategy
3. Set your buy/sell ratio (e.g., 1:3)
4. Watch it intelligently reverse when needed!

---

**Your ratio trading is now SMART and self-sufficient!** 🧠✨






