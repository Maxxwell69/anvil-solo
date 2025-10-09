// Anvil Solo - Frontend Application
console.log('Anvil Solo UI loaded');

// Check if window.electronAPI exists (preload bridge)
if (!window.electronAPI) {
  console.error('electronAPI not found - preload may not be working');
  alert('Error: Application bridge not initialized. Please restart the app.');
}

// Placeholder alert for now
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  
  // For now, show a simple welcome message
  const unlockScreen = document.getElementById('unlock-screen');
  if (unlockScreen) {
    // Add basic functionality to unlock button
    const unlockBtn = document.getElementById('unlock-btn');
    const generateBtn = document.getElementById('generate-wallet-btn');
    const importBtn = document.getElementById('import-wallet-btn');
    
    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => {
        alert('Wallet unlock feature coming soon! For now, click "Generate New Wallet" to get started.');
      });
    }
    
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        showModal('generate-modal');
      });
    }
    
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        showModal('import-modal');
      });
    }
  }
  
  // Setup modal handlers
  setupModals();
  
  // Setup navigation
  setupNavigation();
  
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

function setupModals() {
  // Generate wallet modal
  const genCreateBtn = document.getElementById('gen-create-btn');
  const genCancelBtn = document.getElementById('gen-cancel-btn');
  
  if (genCreateBtn) {
    genCreateBtn.addEventListener('click', () => {
      const password = document.getElementById('gen-password').value;
      const confirm = document.getElementById('gen-confirm-password').value;
      
      if (!password || password.length < 8) {
        showError('gen-error', 'Password must be at least 8 characters');
        return;
      }
      
      if (password !== confirm) {
        showError('gen-error', 'Passwords do not match');
        return;
      }
      
      // Show success and go to main app
      hideModal('generate-modal');
      showSuccessMessage('Wallet generated successfully! You can now start trading.');
      setTimeout(() => {
        showMainApp();
      }, 2000);
    });
  }
  
  if (genCancelBtn) {
    genCancelBtn.addEventListener('click', () => {
      hideModal('generate-modal');
    });
  }
  
  // Import wallet modal
  const importCreateBtn = document.getElementById('import-create-btn');
  const importCancelBtn = document.getElementById('import-cancel-btn');
  
  if (importCreateBtn) {
    importCreateBtn.addEventListener('click', () => {
      const privateKey = document.getElementById('import-private-key').value;
      const password = document.getElementById('import-password').value;
      const confirm = document.getElementById('import-confirm-password').value;
      
      if (!privateKey) {
        showError('import-error', 'Please enter your private key');
        return;
      }
      
      if (!password || password.length < 8) {
        showError('import-error', 'Password must be at least 8 characters');
        return;
      }
      
      if (password !== confirm) {
        showError('import-error', 'Passwords do not match');
        return;
      }
      
      // Show success and go to main app
      hideModal('import-modal');
      showSuccessMessage('Wallet imported successfully! You can now start trading.');
      setTimeout(() => {
        showMainApp();
      }, 2000);
    });
  }
  
  if (importCancelBtn) {
    importCancelBtn.addEventListener('click', () => {
      hideModal('import-modal');
    });
  }
  
  // Success modal
  const successOkBtn = document.getElementById('success-ok-btn');
  if (successOkBtn) {
    successOkBtn.addEventListener('click', () => {
      hideModal('success-modal');
    });
  }
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
  
  // Load license info
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

function loadLicenseInfo() {
  // Placeholder - show FREE tier by default
  const tierEl = document.getElementById('license-tier');
  const statusEl = document.getElementById('license-status');
  const hwidEl = document.getElementById('license-hwid');
  
  if (tierEl) tierEl.textContent = 'FREE';
  if (statusEl) statusEl.textContent = 'Active';
  if (hwidEl) hwidEl.textContent = 'Not available';
  
  // Update features
  document.getElementById('feature-strategies').textContent = '1';
  document.getElementById('feature-wallets').textContent = '3';
  document.getElementById('feature-types').textContent = 'DCA only';
  document.getElementById('feature-cloud').textContent = 'No';
  
  // License activation
  const activateBtn = document.getElementById('activate-license-btn');
  if (activateBtn) {
    activateBtn.addEventListener('click', () => {
      const licenseKey = document.getElementById('license-key-input').value;
      if (!licenseKey) {
        showLicenseStatus('Please enter a license key', 'error');
        return;
      }
      
      showLicenseStatus('License activation feature will be connected to API soon!', 'success');
      console.log('License key entered:', licenseKey);
    });
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
