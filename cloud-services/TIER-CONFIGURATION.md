# 🎯 License Tier Configuration - Your Custom Setup

## 📊 Your 4-Tier System

---

## 🆓 **FREE TIER**

### **What They Get:**
- ✅ **1 DCA strategy** only
- ✅ **1 active at a time**
- ❌ NO Ratio trading (locked/greyed out)
- ❌ NO Bundle system (locked/greyed out)
- ❌ NO Cloud sync (locked/greyed out)

### **Pricing:**
- **Monthly**: $0
- **Yearly**: $0
- **Trade Fee**: 10%

### **In Anvil Solo UI:**
```
DCA Tab:       ✅ ACTIVE (can use 1)
Ratio Tab:     🔒 GREYED OUT with "Unlock in Tier 1" message
Bundle Tab:    🔒 GREYED OUT with "Unlock in Tier 2" message
Cloud Sync:    🔒 LOCKED
```

---

## 💎 **TIER 1 - STARTER** (1st Paid Tier)

### **What They Get:**
- ✅ **2 DCA strategies**
- ✅ **1 Ratio trade**
- ✅ **Cloud sync UNLOCKED**
- ✅ **Ratio trading section UNLOCKED**
- ❌ NO Bundle system yet (locked/greyed out)

### **Pricing:**
- **Monthly**: $29.99
- **Yearly**: $299.99
- **Trade Fee**: 7.5%

### **In Anvil Solo UI:**
```
DCA Tab:       ✅ ACTIVE (can use 2)
Ratio Tab:     ✅ UNLOCKED (can use 1)
Bundle Tab:    🔒 GREYED OUT with "Unlock in Tier 2" message
Cloud Sync:    ✅ ENABLED
```

---

## 💼 **TIER 2 - PROFESSIONAL** (2nd Paid Tier)

### **What They Get:**
- ✅ **3 DCA strategies**
- ✅ **3 Ratio trades**
- ✅ **3 Bundle reconciles**
- ✅ **Bundle system UNLOCKED**
- ✅ **Cloud sync enabled**
- ✅ **All sections accessible**

### **Pricing:**
- **Monthly**: $59.99
- **Yearly**: $599.99
- **Trade Fee**: 5%

### **In Anvil Solo UI:**
```
DCA Tab:       ✅ ACTIVE (can use 3)
Ratio Tab:     ✅ ACTIVE (can use 3)
Bundle Tab:    ✅ UNLOCKED (can use 3)
Cloud Sync:    ✅ ENABLED
```

---

## 🚀 **TIER 3 - ENTERPRISE** (Final/Ultimate Tier)

### **What They Get:**
- ✅ **UNLIMITED DCA strategies**
- ✅ **UNLIMITED Ratio trades**
- ✅ **UNLIMITED Bundle reconciles**
- ✅ **ALL features unlocked**
- ✅ **Cloud sync enabled**
- ✅ **Advanced settings unlocked**
- ✅ **Priority support**

### **Pricing:**
- **Monthly**: $99.99
- **Yearly**: $999.99
- **Trade Fee**: 2.5%

### **In Anvil Solo UI:**
```
DCA Tab:       ✅ UNLIMITED
Ratio Tab:     ✅ UNLIMITED
Bundle Tab:    ✅ UNLIMITED
Cloud Sync:    ✅ ENABLED
Advanced:      ✅ UNLOCKED
```

---

## 🎨 How to Implement UI Locking in Anvil Solo

### **Step 1: Validate License on App Start**

```javascript
// In Anvil Solo main.ts
async function initializeLicense() {
    const response = await fetch('https://anvil-solo-production.up.railway.app/api/license/validate-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            licenseKey: getUserLicenseKey(),
            hardwareId: getHardwareId()
        })
    });
    
    const data = await response.json();
    
    if (data.success && data.valid) {
        return data.license;
    }
    
    throw new Error('Invalid license');
}

const license = await initializeLicense();
applyLicenseRestrictions(license);
```

---

### **Step 2: Apply UI Restrictions**

```javascript
function applyLicenseRestrictions(license) {
    const features = license.features;
    const uiElements = features.ui_elements;
    
    // DCA Strategy
    if (features.strategies.dca.max === 0) {
        lockDCASection();
    } else {
        enableDCASection(features.strategies.dca.max);
    }
    
    // Ratio Trading
    if (features.strategies.ratio.locked || !features.strategies.ratio.enabled) {
        lockRatioSection();
        showUpgradePrompt('ratio', 'Unlock in Tier 1');
    } else {
        enableRatioSection(features.strategies.ratio.max);
    }
    
    // Bundle System
    if (features.strategies.bundle.locked || !features.strategies.bundle.enabled) {
        lockBundleSection();
        showUpgradePrompt('bundle', 'Unlock in Tier 2');
    } else {
        enableBundleSection(features.strategies.bundle.max);
    }
    
    // Cloud Sync
    if (uiElements.cloud_sync === 'locked') {
        lockCloudSync();
        showUpgradePrompt('cloud', 'Unlock in Tier 1');
    } else {
        enableCloudSync();
    }
}
```

---

### **Step 3: Lock/Grey Out UI Elements**

```javascript
function lockRatioSection() {
    const ratioTab = document.getElementById('ratio-tab');
    const ratioContent = document.getElementById('ratio-content');
    
    // Grey out visually
    ratioTab.style.opacity = '0.5';
    ratioTab.style.cursor = 'not-allowed';
    ratioContent.style.opacity = '0.4';
    ratioContent.style.pointerEvents = 'none';
    
    // Add lock icon
    ratioTab.innerHTML = `
        <i class="fas fa-lock"></i> Ratio Trading 
        <span class="text-xs">(Tier 1+)</span>
    `;
    
    // Add upgrade overlay
    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay';
    overlay.innerHTML = `
        <div class="upgrade-prompt">
            <i class="fas fa-lock text-4xl mb-4"></i>
            <h3>Ratio Trading Locked</h3>
            <p>Upgrade to Tier 1 to unlock</p>
            <button onclick="showUpgradePage()">Upgrade Now</button>
        </div>
    `;
    ratioContent.appendChild(overlay);
}

function lockBundleSection() {
    const bundleTab = document.getElementById('bundle-tab');
    const bundleContent = document.getElementById('bundle-content');
    
    bundleTab.style.opacity = '0.5';
    bundleTab.style.cursor = 'not-allowed';
    bundleContent.style.opacity = '0.4';
    bundleContent.style.pointerEvents = 'none';
    
    bundleTab.innerHTML = `
        <i class="fas fa-lock"></i> Bundle Reconcile 
        <span class="text-xs">(Tier 2+)</span>
    `;
}
```

---

### **Step 4: Enforce Strategy Limits**

```javascript
function canAddDCAStrategy(license) {
    const currentDCAs = getActiveDCAStrategies().length;
    const maxDCAs = license.features.strategies.dca.max;
    
    if (currentDCAs >= maxDCAs) {
        showError(`Maximum ${maxDCAs} DCA strategies allowed in ${license.tierDisplayName}`);
        showUpgradeButton();
        return false;
    }
    
    return true;
}

function canAddRatioStrategy(license) {
    const features = license.features;
    
    if (features.strategies.ratio.locked || !features.strategies.ratio.enabled) {
        showError('Ratio trading not available in your tier');
        showUpgradeButton('tier1');
        return false;
    }
    
    const currentRatios = getActiveRatioStrategies().length;
    const maxRatios = features.strategies.ratio.max;
    
    if (currentRatios >= maxRatios) {
        showError(`Maximum ${maxRatios} Ratio strategies allowed in ${license.tierDisplayName}`);
        showUpgradeButton();
        return false;
    }
    
    return true;
}
```

---

## 🎨 CSS Styles for Locked Sections

```css
/* Add to Anvil Solo renderer CSS */

.locked-section {
    opacity: 0.4;
    pointer-events: none;
    position: relative;
}

.locked-section::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(2px);
}

.locked-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 1000;
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.upgrade-prompt {
    color: #333;
}

.upgrade-prompt i {
    color: #9333ea;
}

.upgrade-prompt button {
    background: #9333ea;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    margin-top: 16px;
    cursor: pointer;
}

.upgrade-prompt button:hover {
    background: #7e22ce;
}

.locked-tab {
    opacity: 0.5;
    cursor: not-allowed !important;
}

.locked-tab::before {
    content: '🔒 ';
}
```

---

## 📱 Example Implementation in Anvil Solo

### **File: `src/renderer/app.js`**

```javascript
// After license validation
async function configureLicenseFeatures() {
    try {
        const license = await validateLicense();
        
        // Store globally
        window.currentLicense = license;
        
        // Apply UI restrictions
        applyUIRestrictions(license);
        
        // Set limits
        setStrategyLimits(license);
        
        console.log('License tier:', license.tierDisplayName);
        console.log('Trade fee:', license.fees.tradeFeePercentage + '%');
        
    } catch (error) {
        showLicenseError(error);
    }
}

function applyUIRestrictions(license) {
    const ui = license.features.ui_elements;
    
    // Ratio Trading Section
    if (ui.ratio_section === 'locked') {
        lockUISection('ratio-trading', 'Tier 1');
    }
    
    // Bundle System Section
    if (ui.bundle_section === 'locked') {
        lockUISection('bundle-reconcile', 'Tier 2');
    }
    
    // Cloud Sync
    if (ui.cloud_sync === 'locked') {
        disableCloudSync('Tier 1');
    }
}

function lockUISection(sectionId, unlockTier) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    section.classList.add('locked-section');
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay';
    overlay.innerHTML = `
        <i class="fas fa-lock text-5xl text-purple-600 mb-4"></i>
        <h3 class="text-xl font-bold mb-2">Locked Feature</h3>
        <p class="text-gray-600 mb-4">Available in ${unlockTier} and higher</p>
        <button onclick="window.api.openUpgradePage()" 
                class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            Upgrade Now
        </button>
    `;
    section.appendChild(overlay);
}
```

---

## 📋 Feature Summary

| Feature | Free | Tier 1 | Tier 2 | Tier 3 |
|---------|------|--------|--------|--------|
| **DCA Strategies** | 1 | 2 | 3 | Unlimited |
| **Ratio Trades** | 🔒 Locked | 1 | 3 | Unlimited |
| **Bundle Reconcile** | 🔒 Locked | 🔒 Locked | 3 | Unlimited |
| **Cloud Sync** | 🔒 Locked | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| **Max Active Total** | 1 | 3 | 9 | 999 |
| **Trade Fee** | 10% | 7.5% | 5% | 2.5% |
| **Price/Month** | Free | $29.99 | $59.99 | $99.99 |
| **Price/Year** | Free | $299.99 | $599.99 | $999.99 |

---

## 💰 Pricing Structure

### **Monthly Plans:**
```
Free:   $0.00/month    (10% trade fee)
Tier 1: $29.99/month   (7.5% trade fee)
Tier 2: $59.99/month   (5% trade fee)
Tier 3: $99.99/month   (2.5% trade fee)
```

### **Yearly Plans (Save ~17%):**
```
Free:   $0.00/year     (10% trade fee)
Tier 1: $299.99/year   (7.5% trade fee) - Save $60
Tier 2: $599.99/year   (5% trade fee)   - Save $120
Tier 3: $999.99/year   (2.5% trade fee) - Save $200
```

---

## 🔓 Unlock Progression

### **User Journey:**

```
FREE → Tries DCA
    ↓
    Wants Ratio trading
    ↓
TIER 1 → Uses DCA + Ratio, Cloud sync
    ↓
    Wants Bundle reconcile
    ↓
TIER 2 → Professional trader
    ↓
    Needs unlimited strategies
    ↓
TIER 3 → Power user / Trading firm
```

---

## 🎨 UI Element States

### **Locked State (Free & Tier 1 - No Bundle):**
```html
<div class="strategy-section locked-section">
    <div class="locked-overlay">
        <i class="fas fa-lock"></i>
        <h3>Bundle Reconcile</h3>
        <p>Unlock in Tier 2</p>
        <button>Upgrade to Tier 2</button>
    </div>
    <!-- Greyed out content -->
</div>
```

### **Unlocked State (Tier 2+):**
```html
<div class="strategy-section">
    <!-- Fully functional content -->
    <h3>Bundle Reconcile</h3>
    <button>Create New Bundle</button>
</div>
```

---

## 📡 License Response Format

### **When Anvil Solo Validates License:**

```json
{
  "success": true,
  "valid": true,
  "license": {
    "tier": "tier1",
    "tierDisplayName": "Tier 1 - Starter",
    
    "features": {
      "strategies": {
        "dca": {"max": 2, "enabled": true},
        "ratio": {"max": 1, "enabled": true},
        "bundle": {"max": 0, "enabled": false, "locked": true}
      },
      "ui_elements": {
        "ratio_section": "unlocked",
        "bundle_section": "locked",
        "cloud_sync": "unlocked"
      },
      "max_active_total": 3
    },
    
    "limits": {
      "maxConcurrentStrategies": 3,
      "maxWallets": 2,
      "maxDailyTrades": 100
    },
    
    "fees": {
      "tradeFeePercentage": 7.5,
      "feeRecipientWallet": "82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd"
    },
    
    "permissions": {
      "canUseAdvancedStrategies": true,
      "canCloudSync": true
    }
  }
}
```

---

## 🔧 Admin Can Change

### **In Admin Panel:**

**For Each Tier, Modify:**

1. **Prices:**
   - Monthly: $29.99 → Change to any amount
   - Yearly: $299.99 → Change to any amount

2. **Trade Fees:**
   - Free: 10% → Adjust up/down
   - Tier 1: 7.5% → Adjust up/down
   - Tier 2: 5% → Adjust up/down
   - Tier 3: 2.5% → Adjust up/down

3. **Strategy Limits:**
   - DCA max: 1, 2, 3, 999
   - Ratio max: 0, 1, 3, 999
   - Bundle max: 0, 0, 3, 999

4. **Features:**
   - Enable/disable specific features
   - Lock/unlock UI sections
   - Cloud sync on/off

---

## 💡 Upgrade Prompts

### **When Free User Clicks Ratio Tab:**
```
┌──────────────────────────────────┐
│         🔒 Locked Feature        │
│                                  │
│    Ratio Trading Available in    │
│          Tier 1 ($29.99)         │
│                                  │
│  ✓ 2 DCA + 1 Ratio              │
│  ✓ Cloud Sync                   │
│  ✓ 7.5% trade fee               │
│                                  │
│     [Upgrade to Tier 1]         │
└──────────────────────────────────┘
```

### **When Tier 1 User Clicks Bundle Tab:**
```
┌──────────────────────────────────┐
│         🔒 Locked Feature        │
│                                  │
│   Bundle System Available in     │
│         Tier 2 ($59.99)          │
│                                  │
│  ✓ 3 DCA + 3 Ratio + 3 Bundle   │
│  ✓ 5% trade fee (lower!)        │
│  ✓ All features unlocked         │
│                                  │
│     [Upgrade to Tier 2]         │
└──────────────────────────────────┘
```

---

## 🚀 **Ready to Deploy!**

Your system is now configured with:

✅ **4 tiers** (Free, Tier 1, Tier 2, Tier 3)  
✅ **Exact strategy limits** you specified  
✅ **Progressive unlocking** (DCA → Ratio → Bundle)  
✅ **Cloud sync** unlocks at Tier 1  
✅ **Trade fees** (10% → 7.5% → 5% → 2.5%)  
✅ **Your wallet** configured for all fees  
✅ **Admin can change** everything  

---

**Commit and push to deploy!** 🚀


