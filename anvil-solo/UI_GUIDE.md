# 🎨 ANVIL SOLO - UI USER GUIDE

## 🎉 Your UI is Ready!

The Electron app should now be running on your computer. If you don't see a window, check your taskbar or run `npm start` again.

### First-Time Database Reset (if needed)
If you have issues with an old wallet password, close the app and run:
```powershell
Remove-Item -Path "$env:USERPROFILE\.anvil\anvil-solo.db" -Force
```
Then restart the app to start fresh.

---

## 🔓 First Time Setup

### Step 1: Generate or Import a Wallet

When you first open the app, you'll see a lock screen with options:

#### Option A: Generate New Wallet
1. Click **"Generate New Wallet"**
2. Enter a master password (minimum 8 characters)
3. Confirm your password
4. **Save your public key** that is displayed
5. **IMPORTANT**: Save your password securely!

#### Option B: Import Existing Wallet
1. Click **"Import Wallet"**
2. Paste your private key (supports Base58, JSON, or Base64 formats)
3. Enter a master password
4. Confirm your password

#### Option C: Unlock Existing Wallet
1. Enter your master password
2. Click **"Unlock Wallet"**

**💡 Tip**: Click the 👁️ icon next to the password field to show/hide your password as you type!

---

## 📊 Dashboard

Once unlocked, you'll see the main dashboard:

### What You See:
- **SOL Balance** - Your current balance
- **Active Strategies** - Number of running strategies (updates in real-time)
- **Today's Volume** - Trading volume processed today
- **Total Trades** - All-time trade count

### Active Strategies Panel:

When you create a strategy (DCA, Ratio, or Bundle), it will automatically appear here with:
- **Strategy Type & ID** - e.g., "DCA Strategy #1"
- **Token Information**:
  - Shows **token name** if it's in your Token Manager (e.g., "My Favorite Token")
  - Falls back to shortened address if not in your list
  - Full contract address shown below for reference
- **Strategy Details** - Clear summary with emojis (📈 Buy, 📉 Sell, 💹 Volume, etc.)
- **Detailed Breakdown Panel** - Shows all configuration details:
  - DCA: Orders, Frequency, Slippage
  - Ratio: Trades/Hour, Buy/Sell Ratio, Target Balance
  - Bundle: Interval, Trade Size, Multi-Wallet settings
- **Status Badge** - ACTIVE (green), PAUSED (orange), or STOPPED (red)
- **Control Buttons**:
  - ✏️ **Edit** - Load strategy settings into form (blue button)
  - ⏸️ **Pause** - Temporarily pause the strategy
  - ▶️ **Resume** - Restart a paused strategy
  - ⏹️ **Stop** - Permanently stop the strategy (cannot be undone)

The dashboard auto-refreshes every 10 seconds to show the latest strategy status.

**💡 Tip**: Click the **🔄 Refresh** button in the Active Strategies section to manually force an immediate refresh!

### Navigation Sidebar:
- 📊 **Dashboard** - Overview and active strategies
- 🪙 **Token Manager** - Save and manage your favorite tokens
- 📈 **DCA Strategy** - Create dollar-cost averaging strategies
- 🎯 **Ratio Trading** - Create volume with buy/sell ratios
- 📦 **Bundle Trading** - Rapid multi-trade execution
- 📋 **Activity Log** - View recent transactions
- 💰 **Wallet** - Wallet management and derived wallets

---

## 🪙 Token Manager

**Add tokens to your list before trading to make strategy creation easier!**

### Adding a Token:

1. Click **"Token Manager"** in the sidebar
2. Fill out the form:
   - **Token Name**: Give it a friendly name (e.g., "Bonk")
   - **Symbol**: Optional ticker symbol (e.g., "BONK")
   - **Contract Address**: The Solana token mint address
   - **Notes**: Optional notes about the token
3. Click **"Add Token"**
4. Token will be validated with Jupiter API if available
   - ⚠️ **Note**: If Jupiter API is not accessible, token will still be added with a warning
   - You can add any valid Solana token address even if not listed on Jupiter

### Managing Your Tokens:

- **⭐ Star Icon**: Click to mark/unmark as favorite (favorites appear first)
- **📋 Copy Icon**: Click to copy the contract address to clipboard
- **🗑️ Delete Icon**: Remove the token from your list
- **Click the address**: Quick copy to clipboard

### Using Saved Tokens in Strategies:

When creating a DCA, Ratio, or Bundle strategy:
1. You'll see a dropdown at the top: **"Select Token"**
2. Choose from your saved tokens (favorites appear with ⭐)
3. The address automatically fills in the token field below
4. Or skip the dropdown and paste an address directly

**Example Tokens to Add:**
- **Bonk**: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- **WIF**: `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm`
- **SOL**: `So11111111111111111111111111111111111111112`

---

## 📈 Creating a DCA Strategy

1. Click **"DCA Strategy"** in the sidebar
2. Fill out the form:

### Required Fields:
- **Select Token**: Choose from your saved tokens (or skip to enter manually)
- **Token Address**: Solana token mint address
  - Example (BONK): `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
  - 💡 **Tip**: Add tokens in Token Manager first for easy selection!
- **Direction**: 
  - `Buy` = Convert SOL → Token
  - `Sell` = Convert Token → SOL
- **Total Amount**: Total SOL or tokens to trade
- **Number of Orders**: How many orders to split into (e.g., 24)
- **Frequency**: When to execute
  - Hourly, Every 2h, Every 4h, Every 6h, Daily, or Custom

### Optional Fields:
- **Slippage %**: How much price movement to allow (default 1%)
- **Priority Fee**: Transaction priority (default 100000 lamports)

### Example:
```
Token: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
Direction: Buy
Total Amount: 1 SOL
Number of Orders: 24
Frequency: Hourly
Slippage: 1%
```
**Result**: Buys 0.0417 SOL worth of BONK every hour for 24 hours

3. Click **"Create DCA Strategy"**
4. Strategy starts automatically!
5. You'll be redirected to the Dashboard where you can see it in the Active Strategies panel

---

## 🎯 Creating a Ratio Trading Strategy

1. Click **"Ratio Trading"** in the sidebar
2. Fill out the form:

### Required Fields:
- **Token Address**: Solana token mint address
- **Daily Volume (SOL)**: Target daily trading volume (e.g., 50 SOL)
- **Trades Per Hour**: How many trades per hour (e.g., 10)
- **Buy Ratio %**: Percentage of buys (e.g., 60%)
- **Sell Ratio %**: Percentage of sells (e.g., 40%)
- **Target Token Balance**: Token balance to maintain (e.g., 1000000)
- **Rebalance Threshold %**: When to rebalance (e.g., 10%)

### Options:
- ✅ **Randomize timing and amounts** - Makes trading look organic

### Example:
```
Token: YOUR_TOKEN_ADDRESS
Daily Volume: 50 SOL
Trades Per Hour: 10
Buy Ratio: 60%
Sell Ratio: 40%
Target Balance: 1000000 tokens
Rebalance: 10%
```
**Result**: Creates 50 SOL of daily volume with 60/40 buy/sell ratio

3. Click **"Create Ratio Strategy"**
4. Strategy starts automatically and appears on the Dashboard

---

## 📦 Creating a Bundle Trading Strategy

1. Click **"Bundle Trading"** in the sidebar
2. Fill out the form:

### Required Fields:
- **Token Address**: Solana token mint address
- **Trades Per Bundle**: Number of trades in each bundle (1-20)
- **Minutes Between Bundles**: Time between bundles (e.g., 30 minutes)
- **Min Trade Size (SOL)**: Minimum trade amount (e.g., 0.1 SOL)
- **Max Trade Size (SOL)**: Maximum trade amount (e.g., 1.0 SOL)

### Options:
- ✅ **Use multiple wallets** - Rotates through derived wallets

### Example:
```
Token: YOUR_TOKEN_ADDRESS
Trades Per Bundle: 10
Minutes Between: 30
Min Size: 0.1 SOL
Max Size: 1.0 SOL
Use Multiple Wallets: ✅
```
**Result**: Executes 10 trades every 30 minutes with randomized amounts

3. Click **"Create Bundle Strategy"**
4. Strategy starts automatically and appears on the Dashboard

---

## 💰 Wallet Management

Click **"Wallet"** in the sidebar to access comprehensive wallet tools:

### My Wallets Section:

View all your wallets with real-time balances:
- **👑 Main Wallet** - Your primary wallet (crown icon)
- **Bot Wallets** - Derived wallets for trading
- **Live SOL Balances** - Updated in green (e.g., 2.5000 SOL)
- **🔍 Solscan Button** - Opens wallet on Solscan.io to inspect transactions
- **📋 Copy Button** - Quick copy wallet address to clipboard
- **🔄 Refresh Button** - Manually update all balances

### Generate Additional Wallets:

1. Enter number of wallets (1-10)
2. Click **"Generate Wallets"**
3. Wallets appear in "My Wallets" list
4. Use for volume trading across multiple accounts

**Why Multiple Wallets?**
- Distribute trades across accounts
- Avoid rate limiting
- Make volume look more organic

### 💸 Withdraw SOL:

Transfer SOL from any of your wallets:

1. **From Wallet**: Select source wallet (shows balance)
2. **To Address**: Enter destination Solana address
3. **Amount**: Enter SOL amount
   - ⚠️ **Important**: 0.001 SOL minimum kept for rent
4. Click **"Withdraw SOL"**
5. Confirm transaction
6. Transaction signature displayed on success

**Example:**
```
From: 👑 Main Wallet (2.5000 SOL)
To: YourFriendWalletAddress...
Amount: 1.5 SOL
```

### 🪙 Withdraw Tokens:

Transfer tokens from any of your wallets:

1. **From Wallet**: Select source wallet
2. **Select Token**: Choose from saved tokens (optional)
   - Or manually enter token mint address
3. **To Address**: Enter destination Solana address
4. **Amount**: Enter token amount
   - ⚠️ **Critical**: Wallet must have at least 0.001 SOL for gas!
5. Click **"Withdraw Tokens"**
6. Confirm transaction
7. Transaction signature displayed on success

**Gas Fee Warning:**
- Token transfers require SOL for gas fees
- Minimum 0.001 SOL required in source wallet
- If insufficient SOL, withdrawal will fail
- Add SOL to wallet first if needed

**Example:**
```
From: Bot Wallet 1 (0.1000 SOL)
Token: My Pump Token (PUMP)
To: YourExternalWallet...
Amount: 1000000 tokens
```

---

## 🔒 Security Features

### Password Visibility Toggle:
- Click the 👁️ icon to show your password
- Click the 🙈 icon to hide it again
- Useful for verifying your password when typing

### Lock Your Wallet:
- Click **🔒 Lock Wallet** at the bottom of the sidebar
- Wallet keys removed from memory
- Must unlock again with password

### Auto-Lock:
- Wallet automatically locks after 15 minutes of inactivity (future feature)

### Your Keys:
- Encrypted with AES-256-GCM
- Stored locally in: `C:\Users\YOUR_NAME\.anvil\anvil-solo.db`
- **Never** transmitted over the network

---

## 📋 Activity Log

Click **"Activity Log"** to see:
- Recent transactions
- Success/failure status
- Transaction signatures (click to view on Solscan)
- Timestamps

---

## ⚙️ Tips & Best Practices

### 1. Start Small
- Test with 0.01-0.1 SOL first
- Verify everything works as expected
- Scale up gradually

### 2. Monitor Your Strategies
- Check dashboard regularly
- View activity log for transaction status
- Watch SOL balance

### 3. Token Selection
- Use verified token addresses
- Check liquidity on DEX Screener
- Start with well-known tokens (BONK, WIF, etc.)

### 4. Slippage Settings
- 1% for liquid tokens
- 2-5% for moderate liquidity
- 5-10% for low liquidity or meme coins

### 5. Priority Fees
- 100,000 lamports = normal speed
- 500,000 lamports = faster
- 1,000,000 lamports = priority

---

## 🚨 Troubleshooting

### App Won't Start
```bash
cd anvil-solo
npm install
npm run build
npm start
```

### Wallet Won't Unlock
- Verify password is correct (case-sensitive)
- If forgotten, you'll need to import wallet again with private key

### Transactions Failing
- Check SOL balance (need gas for transactions)
- Increase slippage tolerance
- Increase priority fee
- Verify token address is correct

### Jupiter API Errors
- Check internet connection
- Try again in a few minutes
- Consider using a private RPC endpoint

---

## 🎯 Quick Workflows

### Workflow 1: Test DCA on BONK
1. Unlock wallet
2. Go to DCA Strategy
3. Enter BONK address: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
4. Direction: Buy
5. Total: 0.01 SOL
6. Orders: 3
7. Frequency: Custom → 5 minutes
8. Create & Watch!

### Workflow 2: Create Volume
1. Generate 5 derived wallets
2. Go to Ratio Trading
3. Set Daily Volume: 10 SOL
4. Trades Per Hour: 5
5. Buy/Sell: 50/50
6. Enable randomization
7. Create & Monitor!

---

## 📞 Need Help?

If you encounter issues:
1. Check the console (F12 or Ctrl+Shift+I)
2. Look for error messages
3. Verify your wallet has sufficient SOL
4. Check token address is valid

---

## 🎉 You're Ready!

Your trading bot is now fully functional with a beautiful UI. Start creating strategies and let Anvil Solo handle the trading!

**Happy Trading! 🚀**

