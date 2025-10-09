// Anvil Solo - Frontend Application
console.log('Anvil Solo UI loaded');

// Check if window.electron exists (preload bridge)
if (!window.electron) {
  console.warn('electron API not fully loaded yet - some features may not work');
} else {
  console.log('✅ Electron API loaded successfully');
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  
  // Skip unlock screen - go directly to main app
  showMainApp();
  
  // Setup navigation
  setupNavigation();
  
  // Setup license activation
  setupLicenseActivation();
  
  // Show welcome message
  showWelcomeMessage();
});

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

function setupLicenseActivation() {
  const activateBtn = document.getElementById('activate-license-btn');
  const validateBtn = document.getElementById('validate-license-btn');
  const deactivateBtn = document.getElementById('deactivate-license-btn');
  
  // Activate License
  if (activateBtn) {
    activateBtn.addEventListener('click', async () => {
      const licenseKey = document.getElementById('license-key-input').value.trim();
      
      if (!licenseKey) {
        showLicenseStatus('Please enter a license key', 'error');
        return;
      }
      
      showLicenseStatus('Activating license...', 'info');
      
      try {
        // Call the backend API
        if (window.electron && window.electron.license) {
          const result = await window.electron.license.activate(licenseKey);
          
          if (result.success) {
            showLicenseStatus(`✅ ${result.license.tier.toUpperCase()} license activated!`, 'success');
            updateLicenseDisplay(result.license);
          } else {
            showLicenseStatus(`❌ ${result.message}`, 'error');
          }
        } else {
          // Fallback for testing
          console.log('Testing license activation with key:', licenseKey);
          showLicenseStatus(`✅ License activated! (Demo mode - connect to backend)`, 'success');
          
          // Update UI with demo data
          document.getElementById('license-tier').textContent = 'PRO';
          document.getElementById('license-status').textContent = 'Active';
          document.getElementById('feature-strategies').textContent = '10';
          document.getElementById('feature-wallets').textContent = '10';
          document.getElementById('feature-types').textContent = 'All (DCA, Ratio, Bundle)';
          document.getElementById('feature-cloud').textContent = 'Yes';
        }
      } catch (error) {
        showLicenseStatus(`❌ Error: ${error.message}`, 'error');
      }
    });
  }
  
  // Validate License
  if (validateBtn) {
    validateBtn.addEventListener('click', async () => {
      showLicenseStatus('Revalidating license...', 'info');
      
      try {
        if (window.electron && window.electron.license) {
          const result = await window.electron.license.validate();
          if (result) {
            showLicenseStatus('✅ License is valid!', 'success');
          } else {
            showLicenseStatus('❌ License validation failed', 'error');
          }
        } else {
          showLicenseStatus('✅ License validated! (Demo mode)', 'success');
        }
      } catch (error) {
        showLicenseStatus(`❌ Error: ${error.message}`, 'error');
      }
    });
  }
  
  // Deactivate License
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to deactivate this license? You can reactivate it later.')) {
        return;
      }
      
      try {
        if (window.electron && window.electron.license) {
          const result = await window.electron.license.deactivate();
          if (result.success) {
            showLicenseStatus('✅ License deactivated', 'success');
            resetToFreeTier();
          } else {
            showLicenseStatus(`❌ ${result.message}`, 'error');
          }
        } else {
          showLicenseStatus('✅ License deactivated! (Demo mode)', 'success');
          resetToFreeTier();
        }
      } catch (error) {
        showLicenseStatus(`❌ Error: ${error.message}`, 'error');
      }
    });
  }
  
  // Copy HWID button
  const copyHwidBtn = document.getElementById('copy-hwid-btn');
  if (copyHwidBtn) {
    copyHwidBtn.addEventListener('click', async () => {
      try {
        if (window.electron && window.electron.license) {
          const hwid = await window.electron.license.getHwid();
          navigator.clipboard.writeText(hwid);
          showLicenseStatus('✅ Hardware ID copied to clipboard!', 'success');
        } else {
          const demoHwid = 'DEMO-HARDWARE-ID-12345';
          navigator.clipboard.writeText(demoHwid);
          showLicenseStatus('✅ Hardware ID copied!', 'success');
        }
      } catch (error) {
        showLicenseStatus('❌ Failed to copy', 'error');
      }
    });
  }
}

function updateLicenseDisplay(license) {
  document.getElementById('license-tier').textContent = license.tier.toUpperCase();
  document.getElementById('license-status').textContent = license.isValid ? 'Active' : 'Inactive';
  
  if (license.expiresAt) {
    document.getElementById('license-expires-section').style.display = 'block';
    document.getElementById('license-expires').textContent = new Date(license.expiresAt).toLocaleDateString();
  } else {
    document.getElementById('license-expires-section').style.display = 'none';
  }
  
  // Update features
  const features = license.features;
  document.getElementById('feature-strategies').textContent = 
    features.maxActiveStrategies === -1 ? 'Unlimited' : features.maxActiveStrategies;
  document.getElementById('feature-wallets').textContent = 
    features.maxWallets === -1 ? 'Unlimited' : features.maxWallets;
  document.getElementById('feature-types').textContent = features.strategyTypes.join(', ').toUpperCase();
  document.getElementById('feature-cloud').textContent = features.cloudBackup ? 'Yes' : 'No';
}

function resetToFreeTier() {
  document.getElementById('license-tier').textContent = 'FREE';
  document.getElementById('license-status').textContent = 'Active';
  document.getElementById('license-expires-section').style.display = 'none';
  document.getElementById('feature-strategies').textContent = '1';
  document.getElementById('feature-wallets').textContent = '3';
  document.getElementById('feature-types').textContent = 'DCA only';
  document.getElementById('feature-cloud').textContent = 'No';
  document.getElementById('license-key-input').value = '';
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      showPage(page);
      
      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

function showPage(pageName) {
  // Hide all pages
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  
  // Show selected page
  const selectedPage = document.getElementById(`${pageName}-page`);
  if (selectedPage) {
    selectedPage.classList.add('active');
  }
}

function showMainApp() {
  document.getElementById('unlock-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  
  // Load license info from backend
  loadLicenseInfo();
}

function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }
}

function showSuccessMessage(message) {
  const modal = document.getElementById('success-modal');
  const messageEl = document.getElementById('success-message');
  if (modal && messageEl) {
    messageEl.textContent = message;
    modal.style.display = 'flex';
  }
}

function showWelcomeMessage() {
  console.log('='.repeat(50));
  console.log('🚀 Welcome to Anvil Solo Trading Bot!');
  console.log('='.repeat(50));
  console.log('');
  console.log('✨ Features:');
  console.log('  • DCA (Dollar Cost Averaging) strategies');
  console.log('  • Ratio trading for volume generation');
  console.log('  • Bundle trading');
  console.log('  • License-based feature unlocking');
  console.log('');
  console.log('📝 Quick Start:');
  console.log('  1. Click "Generate New Wallet" to create a new wallet');
  console.log('  2. Or click "Import Wallet" if you have an existing key');
  console.log('  3. Go to Settings → License to activate your license');
  console.log('');
  console.log('🔑 Test License Keys:');
  console.log('  • PRO: ANVIL-PRO-TEST-0001');
  console.log('  • STARTER: ANVIL-STARTER-TEST-0001');
  console.log('  • ENTERPRISE: ANVIL-ENTERPRISE-TEST-0001');
  console.log('  • LIFETIME: ANVIL-LIFETIME-0001');
  console.log('');
  console.log('💰 Transaction fees: 0.5% sent to developer wallet');
  console.log('='.repeat(50));
}

async function loadLicenseInfo() {
  try {
    // Load from backend if available
    if (window.electron && window.electron.license) {
      const licenseInfo = await window.electron.license.getInfo();
      const hwid = await window.electron.license.getHwid();
      
      // Validate we have the data
      if (licenseInfo && licenseInfo.tier) {
        document.getElementById('license-tier').textContent = licenseInfo.tier.toUpperCase();
        document.getElementById('license-status').textContent = licenseInfo.isValid ? 'Active' : 'Inactive';
        
        if (hwid) {
          document.getElementById('license-hwid').textContent = hwid.substring(0, 16) + '...';
        }
        
        if (licenseInfo.expiresAt) {
          document.getElementById('license-expires-section').style.display = 'block';
          document.getElementById('license-expires').textContent = new Date(licenseInfo.expiresAt).toLocaleDateString();
        }
        
        // Update features
        if (licenseInfo.features) {
          const features = licenseInfo.features;
          document.getElementById('feature-strategies').textContent = 
            features.maxActiveStrategies === -1 ? 'Unlimited' : features.maxActiveStrategies;
          document.getElementById('feature-wallets').textContent = 
            features.maxWallets === -1 ? 'Unlimited' : features.maxWallets;
          document.getElementById('feature-types').textContent = 
            features.strategyTypes ? features.strategyTypes.join(', ').toUpperCase() : 'DCA';
          document.getElementById('feature-cloud').textContent = features.cloudBackup ? 'Yes' : 'No';
        }
      } else {
        // No license data, use FREE tier
        resetToFreeTier();
      }
    } else {
      // Backend not ready - show FREE tier
      console.log('⚠️ Backend not connected yet - showing FREE tier');
      resetToFreeTier();
    }
  } catch (error) {
    console.error('Error loading license info:', error);
    // On any error, default to FREE tier
    resetToFreeTier();
  }
}

function showLicenseStatus(message, type) {
  const statusEl = document.getElementById('license-action-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
}

// Export functions for inline handlers
window.showPage = showPage;
