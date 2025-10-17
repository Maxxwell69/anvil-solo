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
  
  // Setup wallet creation/import first
  setupWalletCreation();
  
  // Setup wallet page buttons
  setupWalletPage();
  
  // Setup strategy pages
  setupDCAPage();
  setupRatioPage();
  setupBundlePage();
  
  // Setup token manager
  setupTokenManager();
  
  // Check if wallet exists and show appropriate screen
  checkWalletAndShowScreen();
  
  // Setup navigation
  setupNavigation();
  
  // Setup license activation
  setupLicenseActivation();
  
  // Setup trades page
  setupTradesPage();
  
  // Setup DevTools button
  setupDevToolsButton();
  
  // Setup Activity Feed
  setupActivityFeed();
  
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

function setupWalletCreation() {
  // Generate Wallet Button (unlock screen)
  const generateWalletBtn = document.getElementById('generate-wallet-btn');
  if (generateWalletBtn) {
    generateWalletBtn.addEventListener('click', () => {
      console.log('Opening generate wallet modal');
      showModal('generate-modal');
    });
  }
  
  // Import Wallet Button (unlock screen)
  const importWalletBtn = document.getElementById('import-wallet-btn');
  if (importWalletBtn) {
    importWalletBtn.addEventListener('click', () => {
      console.log('Opening import wallet modal');
      showModal('import-modal');
    });
  }
  
  // Generate Wallet Button (wallet page)
  const walletGenerateNewBtn = document.getElementById('wallet-generate-new-btn');
  if (walletGenerateNewBtn) {
    walletGenerateNewBtn.addEventListener('click', () => {
      console.log('Opening generate wallet modal from wallet page');
      showModal('generate-modal');
    });
  }
  
  // Import Wallet Button (wallet page)
  const walletImportBtn = document.getElementById('wallet-import-btn');
  if (walletImportBtn) {
    walletImportBtn.addEventListener('click', () => {
      console.log('Opening import wallet modal from wallet page');
      showModal('import-modal');
    });
  }
  
  // Password Toggle Buttons
  setupPasswordToggles();
  
  // Generate Modal - Create Wallet
  const genCreateBtn = document.getElementById('gen-create-btn');
  if (genCreateBtn) {
    genCreateBtn.addEventListener('click', async () => {
      const password = document.getElementById('gen-password').value;
      const confirmPassword = document.getElementById('gen-confirm-password').value;
      const genError = document.getElementById('gen-error');
      
      // Validation
      if (!password || password.length < 8) {
        genError.textContent = '❌ Password must be at least 8 characters';
        genError.style.display = 'block';
        return;
      }
      
      if (password !== confirmPassword) {
        genError.textContent = '❌ Passwords do not match';
        genError.style.display = 'block';
        return;
      }
      
      try {
        genError.style.display = 'none';
        genCreateBtn.disabled = true;
        genCreateBtn.textContent = 'Creating Wallet...';
        
        // Call the backend to generate wallet
        const result = await window.electron.wallet.generate(password, 'Main Wallet');
        
        if (result.success) {
          // Show success modal with wallet info
          hideModal('generate-modal');
          showSuccessMessage(`
            <h3>✅ Wallet Created Successfully!</h3>
            <p><strong>Public Key:</strong></p>
            <p style="word-break: break-all; background: #2c3e50; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${result.publicKey}</p>
            <p style="color: #e74c3c; margin-top: 15px;"><strong>⚠️ IMPORTANT:</strong> Your wallet is encrypted with your password. Never share your password with anyone!</p>
          `);
          
          // Clear form
          document.getElementById('gen-password').value = '';
          document.getElementById('gen-confirm-password').value = '';
          
          // Refresh wallet list if on wallet page
          setTimeout(() => {
            if (typeof loadAllWallets === 'function') {
              loadAllWallets();
            }
          }, 1000);
        } else {
          genError.textContent = `❌ ${result.message || 'Failed to create wallet'}`;
          genError.style.display = 'block';
        }
      } catch (error) {
        genError.textContent = `❌ Error: ${error.message}`;
        genError.style.display = 'block';
        console.error('Generate wallet error:', error);
      } finally {
        genCreateBtn.disabled = false;
        genCreateBtn.textContent = 'Create Wallet';
      }
    });
  }
  
  // Generate Modal - Cancel
  const genCancelBtn = document.getElementById('gen-cancel-btn');
  if (genCancelBtn) {
    genCancelBtn.addEventListener('click', () => {
      hideModal('generate-modal');
      document.getElementById('gen-password').value = '';
      document.getElementById('gen-confirm-password').value = '';
      document.getElementById('gen-error').style.display = 'none';
    });
  }
  
  // Import Modal - Import Wallet
  const importCreateBtn = document.getElementById('import-create-btn');
  if (importCreateBtn) {
    importCreateBtn.addEventListener('click', async () => {
      const privateKey = document.getElementById('import-private-key').value.trim();
      const password = document.getElementById('import-password').value;
      const confirmPassword = document.getElementById('import-confirm-password').value;
      const importError = document.getElementById('import-error');
      
      // Validation
      if (!privateKey) {
        importError.textContent = '❌ Please enter your private key';
        importError.style.display = 'block';
        return;
      }
      
      if (!password || password.length < 8) {
        importError.textContent = '❌ Password must be at least 8 characters';
        importError.style.display = 'block';
        return;
      }
      
      if (password !== confirmPassword) {
        importError.textContent = '❌ Passwords do not match';
        importError.style.display = 'block';
        return;
      }
      
      try {
        importError.style.display = 'none';
        importCreateBtn.disabled = true;
        importCreateBtn.textContent = 'Importing Wallet...';
        
        // Call the backend to import wallet
        const result = await window.electron.wallet.import(privateKey, password, 'Imported Wallet');
        
        if (result.success) {
          // Show success modal
          hideModal('import-modal');
          showSuccessMessage(`
            <h3>✅ Wallet Imported Successfully!</h3>
            <p><strong>Public Key:</strong></p>
            <p style="word-break: break-all; background: #2c3e50; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${result.publicKey}</p>
            <p style="color: #27ae60; margin-top: 15px;">Your wallet is now ready to use!</p>
          `);
          
          // Clear form
          document.getElementById('import-private-key').value = '';
          document.getElementById('import-password').value = '';
          document.getElementById('import-confirm-password').value = '';
          
          // Refresh wallet list if on wallet page
          setTimeout(() => {
            if (typeof loadAllWallets === 'function') {
              loadAllWallets();
            }
          }, 1000);
        } else {
          importError.textContent = `❌ ${result.message || 'Failed to import wallet'}`;
          importError.style.display = 'block';
        }
      } catch (error) {
        importError.textContent = `❌ Error: ${error.message}`;
        importError.style.display = 'block';
        console.error('Import wallet error:', error);
      } finally {
        importCreateBtn.disabled = false;
        importCreateBtn.textContent = 'Import Wallet';
      }
    });
  }
  
  // Import Modal - Cancel
  const importCancelBtn = document.getElementById('import-cancel-btn');
  if (importCancelBtn) {
    importCancelBtn.addEventListener('click', () => {
      hideModal('import-modal');
      document.getElementById('import-private-key').value = '';
      document.getElementById('import-password').value = '';
      document.getElementById('import-confirm-password').value = '';
      document.getElementById('import-error').style.display = 'none';
    });
  }
  
  // Success Modal - OK Button
  const successOkBtn = document.getElementById('success-ok-btn');
  if (successOkBtn) {
    successOkBtn.addEventListener('click', () => {
      hideModal('success-modal');
    });
  }
}

function setupWalletPage() {
  // Refresh Wallets Button
  const refreshWalletsBtn = document.getElementById('refresh-wallets-btn');
  if (refreshWalletsBtn) {
    refreshWalletsBtn.addEventListener('click', () => {
      console.log('Refreshing wallets...');
      loadAllWallets();
    });
  }
  
  // Load wallets on page load
  loadAllWallets();
  
  // Setup withdraw modal
  setupWithdrawModal();
}

// Load all wallets with balances and token holdings
async function loadAllWallets() {
  try {
    console.log('🔍 loadAllWallets() called - NEW VERSION');
    const walletsList = document.getElementById('all-wallets-list');
    if (!walletsList) {
      console.error('❌ all-wallets-list element not found');
      return;
    }
    
    walletsList.innerHTML = '<div class="empty-state">Loading wallets...</div>';
    
    if (!window.electron || !window.electron.wallet || !window.electron.token) {
      console.error('❌ Electron APIs not available');
      walletsList.innerHTML = '<div class="empty-state">⚠️ Wallet manager not initialized</div>';
      return;
    }
    
    // Get all wallets with balances
    console.log('🔍 Calling getAllWithBalances()...');
    const walletsResult = await window.electron.wallet.getAllWithBalances();
    console.log('🔍 getAllWithBalances result:', walletsResult);
    
    if (!walletsResult.success || !walletsResult.wallets || walletsResult.wallets.length === 0) {
      console.log('❌ No wallets found');
      walletsList.innerHTML = '<div class="empty-state">No wallets found. Create or import a wallet to get started.</div>';
      return;
    }
    
    console.log(`✅ Found ${walletsResult.wallets.length} wallet(s)`);
    
    // Get saved tokens
    const tokensResponse = await window.electron.token.list();
    const savedTokens = tokensResponse.success ? tokensResponse.tokens : [];
    
    walletsList.innerHTML = '';
    
    // Display each wallet
    for (const wallet of walletsResult.wallets) {
      console.log(`🔍 Processing wallet: ${wallet.publicKey}, balance: ${wallet.balance}`);
      const walletCard = document.createElement('div');
      walletCard.className = 'wallet-card';
      walletCard.style.background = '#1a1f36';
      walletCard.style.padding = '20px';
      walletCard.style.borderRadius = '10px';
      walletCard.style.border = '1px solid #2a2f46';
      walletCard.style.marginBottom = '15px';
      
      // Wallet header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '15px';
      header.style.paddingBottom = '15px';
      header.style.borderBottom = '1px solid #2a2f46';
      
      const leftInfo = document.createElement('div');
      leftInfo.innerHTML = `
        <div style="font-size: 1.1em; font-weight: bold; color: #fff; margin-bottom: 5px;">
          ${wallet.label || 'Wallet'}
        </div>
        <div style="font-family: monospace; font-size: 0.85em; color: #8892a6; cursor: pointer;" 
             onclick="navigator.clipboard.writeText('${wallet.publicKey}'); alert('📋 Address copied!')">
          ${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-8)} 📋
        </div>
      `;
      
      header.appendChild(leftInfo);
      walletCard.appendChild(header);
      
      // SOL Balance row
      const solRow = document.createElement('div');
      solRow.style.display = 'flex';
      solRow.style.justifyContent = 'space-between';
      solRow.style.alignItems = 'center';
      solRow.style.padding = '12px 15px';
      solRow.style.background = 'rgba(102, 126, 234, 0.1)';
      solRow.style.borderRadius = '8px';
      solRow.style.marginBottom = '10px';
      
      console.log(`🔍 Creating SOL row for wallet ${wallet.publicKey} with balance ${wallet.balance}`);
      solRow.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.2em;">◎</span>
          <div>
            <div style="font-weight: bold; color: #fff;">SOL</div>
            <div style="font-size: 0.85em; color: #8892a6;">Solana</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="font-size: 1.2em; font-weight: 600; color: #2ed573;">
            ${wallet.balance.toFixed(4)} SOL
          </div>
          <button class="btn btn-small" style="background: #667eea; padding: 8px 15px;" 
                  onclick="openWithdrawModal('sol', '${wallet.publicKey}', ${wallet.balance})">
            💸 Withdraw
          </button>
        </div>
      `;
      console.log(`🔍 SOL row HTML created with withdraw button`);
      
      walletCard.appendChild(solRow);
      
      // Load token balances
      if (savedTokens.length > 0) {
        for (const token of savedTokens) {
          try {
            const balanceResult = await window.electron.wallet.getTokenBalance(wallet.publicKey, token.contract_address);
            const balance = balanceResult.success ? balanceResult.balance : 0;
            
            if (balance > 0) {
              const tokenRow = document.createElement('div');
              tokenRow.style.display = 'flex';
              tokenRow.style.justifyContent = 'space-between';
              tokenRow.style.alignItems = 'center';
              tokenRow.style.padding = '12px 15px';
              tokenRow.style.background = 'rgba(46, 213, 115, 0.05)';
              tokenRow.style.borderRadius = '8px';
              tokenRow.style.marginBottom = '10px';
              
              tokenRow.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 1.2em;">🪙</span>
                  <div>
                    <div style="font-weight: bold; color: #fff;">${token.symbol || token.name}</div>
                    <div style="font-size: 0.85em; color: #8892a6;">${token.name || token.symbol}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="font-size: 1.1em; font-weight: 600; color: #2ed573;">
                    ${balance.toFixed(4)}
                  </div>
                  <button class="btn btn-small" style="background: #2ed573; padding: 8px 15px;" 
                          onclick="openWithdrawModal('token', '${wallet.publicKey}', ${balance}, '${token.contract_address}', '${token.symbol || token.name}', ${token.decimals || 9})">
                    💸 Withdraw
                  </button>
                </div>
              `;
              
              walletCard.appendChild(tokenRow);
            }
          } catch (err) {
            console.warn(`Could not get balance for ${token.symbol}:`, err.message);
          }
        }
      }
      
      walletsList.appendChild(walletCard);
    }
    
    console.log(`✅ Loaded ${walletsResult.wallets.length} wallet(s) with balances`);
    
    // Debug: Check what's actually in the DOM
    setTimeout(() => {
      const walletsList = document.getElementById('all-wallets-list');
      console.log('🔍 Final DOM content:', walletsList.innerHTML);
      const withdrawButtons = walletsList.querySelectorAll('button[onclick*="openWithdrawModal"]');
      console.log(`🔍 Found ${withdrawButtons.length} withdraw buttons in DOM`);
    }, 100);
    
  } catch (error) {
    console.error('Error loading wallets:', error);
    const walletsList = document.getElementById('all-wallets-list');
    if (walletsList) {
      walletsList.innerHTML = '<div class="empty-state">⚠️ Error loading wallets</div>';
    }
  }
}

// Open withdraw modal
function openWithdrawModal(type, fromWallet, balance, tokenMint = null, tokenSymbol = null, decimals = 9) {
  const modal = document.getElementById('withdraw-modal');
  const title = document.getElementById('withdraw-modal-title');
  const amountLabel = document.getElementById('withdraw-modal-amount-label');
  const amountInput = document.getElementById('withdraw-modal-amount');
  const balanceHint = document.getElementById('withdraw-modal-balance-hint');
  const toInput = document.getElementById('withdraw-modal-to');
  const confirmBtn = document.getElementById('withdraw-modal-confirm-btn');
  
  if (!modal) return;
  
  // Set modal content based on type
  if (type === 'sol') {
    title.textContent = '💸 Withdraw SOL';
    amountLabel.textContent = 'Amount (SOL)';
    balanceHint.textContent = `Available: ${balance.toFixed(4)} SOL (min 0.001 SOL kept for rent)`;
    amountInput.max = Math.max(0, balance - 0.001);
    amountInput.value = Math.max(0, balance - 0.001).toFixed(4);
  } else {
    title.textContent = `💸 Withdraw ${tokenSymbol}`;
    amountLabel.textContent = `Amount (${tokenSymbol})`;
    balanceHint.textContent = `Available: ${balance.toFixed(4)} ${tokenSymbol}`;
    amountInput.max = balance;
    amountInput.value = balance.toFixed(4);
  }
  
  // Clear previous inputs
  toInput.value = '';
  
  // Remove old event listeners by cloning
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  // Add new event listener
  newConfirmBtn.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    const toAddress = toInput.value.trim();
    
    if (!toAddress) {
      showWithdrawStatus('Please enter a destination address', 'error');
      return;
    }
    
    if (amount <= 0 || amount > balance) {
      showWithdrawStatus('Invalid amount', 'error');
      return;
    }
    
    showWithdrawStatus('Processing withdrawal...', 'info');
    newConfirmBtn.disabled = true;
    
    try {
      let result;
      if (type === 'sol') {
        result = await window.electron.wallet.withdrawSol(fromWallet, toAddress, amount);
      } else {
        result = await window.electron.wallet.withdrawToken(fromWallet, toAddress, tokenMint, amount);
      }
      
      if (result.success) {
        showWithdrawStatus(`✅ Withdrawal successful! Signature: ${result.signature.slice(0, 8)}...`, 'success');
        setTimeout(() => {
          hideModal('withdraw-modal');
          loadAllWallets(); // Refresh wallet list
        }, 2000);
      } else {
        showWithdrawStatus(`❌ Withdrawal failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showWithdrawStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
      newConfirmBtn.disabled = false;
    }
  });
  
  // Show modal
  showModal('withdraw-modal');
}

// Show withdraw status message
function showWithdrawStatus(message, type) {
  const statusDiv = document.getElementById('withdraw-modal-status');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
  }
}

// Setup withdraw modal
function setupWithdrawModal() {
  const cancelBtn = document.getElementById('withdraw-modal-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideModal('withdraw-modal');
    });
  }
}

function setupDCAPage() {
  // Custom interval visibility toggle
  const frequencySelect = document.getElementById('dca-frequency');
  const customIntervalDiv = document.getElementById('dca-custom-interval');
  
  if (frequencySelect && customIntervalDiv) {
    frequencySelect.addEventListener('change', () => {
      if (frequencySelect.value === 'custom') {
        customIntervalDiv.style.display = 'block';
      } else {
        customIntervalDiv.style.display = 'none';
      }
    });
  }
  
  // Direction change - update amount label
  const directionSelect = document.getElementById('dca-direction');
  const amountLabel = document.getElementById('dca-amount-label');
  const amountHint = document.getElementById('dca-amount-hint');
  
  if (directionSelect && amountLabel && amountHint) {
    directionSelect.addEventListener('change', () => {
      if (directionSelect.value === 'buy') {
        amountLabel.textContent = 'Total Amount (SOL)';
        amountHint.textContent = 'Total SOL to spend buying tokens';
      } else {
        amountLabel.textContent = 'Total Amount (Tokens)';
        amountHint.textContent = 'Total tokens to sell for SOL';
      }
    });
  }
  
  // Token dropdown sync
  const tokenSelect = document.getElementById('dca-token-select');
  const tokenInput = document.getElementById('dca-token');
  if (tokenSelect && tokenInput) {
    tokenSelect.addEventListener('change', () => {
      if (tokenSelect.value) {
        tokenInput.value = tokenSelect.value;
      }
    });
  }
  
  // Create DCA Strategy Button
  const createDCABtn = document.getElementById('create-dca-btn');
  if (createDCABtn) {
    createDCABtn.addEventListener('click', async () => {
      await createDCAStrategy();
    });
  }
}

async function createDCAStrategy() {
  const statusEl = document.getElementById('dca-status');
  const createBtn = document.getElementById('create-dca-btn');
  
  try {
    // Get form values
    const tokenSelect = document.getElementById('dca-token-select').value;
    const tokenInput = document.getElementById('dca-token').value.trim();
    const tokenMint = tokenSelect || tokenInput;
    const walletId = document.getElementById('dca-wallet-select').value;
    const direction = document.getElementById('dca-direction').value;
    const totalAmount = parseFloat(document.getElementById('dca-amount').value);
    const numOrders = parseInt(document.getElementById('dca-orders').value);
    const frequency = document.getElementById('dca-frequency').value;
    const customInterval = parseInt(document.getElementById('dca-interval-minutes').value || '60');
    const slippage = parseFloat(document.getElementById('dca-slippage').value);
    const priorityFee = parseInt(document.getElementById('dca-priority-fee').value);
    
    // Validation
    if (!tokenMint) {
      showStatus(statusEl, '❌ Please enter a token address', 'error');
      return;
    }
    
    if (!walletId) {
      showStatus(statusEl, '❌ Please select a wallet', 'error');
      return;
    }
    
    if (!totalAmount || totalAmount <= 0) {
      showStatus(statusEl, '❌ Please enter a valid total amount', 'error');
      return;
    }
    
    if (!numOrders || numOrders < 1) {
      showStatus(statusEl, '❌ Please enter a valid number of orders', 'error');
      return;
    }
    
    // Calculate interval in minutes
    let intervalMinutes;
    switch (frequency) {
      case 'hourly': intervalMinutes = 60; break;
      case '2h': intervalMinutes = 120; break;
      case '4h': intervalMinutes = 240; break;
      case '6h': intervalMinutes = 360; break;
      case 'daily': intervalMinutes = 1440; break;
      case 'custom': intervalMinutes = customInterval; break;
      default: intervalMinutes = 60;
    }
    
    // Prepare config
    const config = {
      tokenMint,
      tokenAddress: tokenMint, // Backend expects tokenAddress
      walletId: walletId, // Selected wallet
      direction,
      totalAmount,
      numberOfOrders: numOrders, // Backend expects numberOfOrders
      frequency: frequency, // Pass frequency string
      customIntervalMinutes: frequency === 'custom' ? customInterval : undefined,
      slippageBps: Math.floor(slippage * 100), // Convert to basis points
      priorityFeeLamports: priorityFee,
    };
    
    console.log('Creating DCA strategy with config:', config);
    
    // Disable button
    createBtn.disabled = true;
    createBtn.textContent = 'Creating Strategy...';
    showStatus(statusEl, '⏳ Creating DCA strategy...', 'info');
    
    // Call backend
    if (!window.electron || !window.electron.strategy) {
      throw new Error('Strategy API not available');
    }
    
    const result = await window.electron.strategy.dca.create(config);
    
    if (result.success) {
      showStatus(statusEl, `✅ DCA Strategy #${result.strategyId} created successfully!`, 'success');
      
      // Clear form
      document.getElementById('dca-token').value = '';
      document.getElementById('dca-amount').value = '';
      document.getElementById('dca-orders').value = '';
      
      // Go to dashboard after 2 seconds
      setTimeout(() => {
        showPage('dashboard');
      }, 2000);
    } else {
      showStatus(statusEl, `❌ Failed to create strategy: ${result.error || 'Unknown error'}`, 'error');
    }
    
  } catch (error) {
    console.error('Error creating DCA strategy:', error);
    showStatus(statusEl, `❌ Error: ${error.message}`, 'error');
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Create DCA Strategy';
  }
}

function setupRatioPage() {
  // Token dropdown sync
  const tokenSelect = document.getElementById('ratio-token-select');
  const tokenInput = document.getElementById('ratio-token');
  if (tokenSelect && tokenInput) {
    tokenSelect.addEventListener('change', () => {
      if (tokenSelect.value) {
        tokenInput.value = tokenSelect.value;
      }
    });
  }
  
  // Create Ratio Strategy Button
  const createRatioBtn = document.getElementById('create-ratio-btn');
  if (createRatioBtn) {
    createRatioBtn.addEventListener('click', async () => {
      await createRatioStrategy();
    });
  }
  
  console.log('Ratio page setup ready');
}

async function createRatioStrategy() {
  const statusEl = document.getElementById('ratio-status');
  const createBtn = document.getElementById('create-ratio-btn');
  
  try {
    // Get form values
    const tokenSelect = document.getElementById('ratio-token-select').value;
    const tokenInput = document.getElementById('ratio-token').value.trim();
    const tokenMint = tokenSelect || tokenInput;
    const walletId = document.getElementById('ratio-wallet-select').value;
    
    const buyCount = parseInt(document.getElementById('ratio-buy-count').value);
    const sellCount = parseInt(document.getElementById('ratio-sell-count').value);
    const initialSol = parseFloat(document.getElementById('ratio-initial-sol').value);
    const totalSolLimit = parseFloat(document.getElementById('ratio-total-sol').value);
    const intervalMinutes = parseInt(document.getElementById('ratio-interval').value);
    
    const slippage = parseFloat(document.getElementById('ratio-slippage').value);
    const priorityFee = parseInt(document.getElementById('ratio-priority-fee').value);
    const randomizeTiming = document.getElementById('ratio-randomize').checked;
    const useMultiWallets = document.getElementById('ratio-multi-wallet').checked;
    const roundTripMode = document.getElementById('ratio-round-trip').checked;
    
    // Validation
    if (!tokenMint) {
      showStatus(statusEl, '❌ Please enter a token address', 'error');
      return;
    }
    
    if (!walletId) {
      showStatus(statusEl, '❌ Please select a wallet', 'error');
      return;
    }
    
    if (!buyCount || buyCount < 1) {
      showStatus(statusEl, '❌ Number of buys must be at least 1', 'error');
      return;
    }
    
    if (!sellCount || sellCount < 1) {
      showStatus(statusEl, '❌ Number of sells must be at least 1', 'error');
      return;
    }
    
    if (!initialSol || initialSol <= 0) {
      showStatus(statusEl, '❌ Initial SOL must be greater than 0', 'error');
      return;
    }
    
    if (!totalSolLimit || totalSolLimit <= 0) {
      showStatus(statusEl, '❌ Total SOL limit must be greater than 0', 'error');
      return;
    }
    
    if (initialSol >= totalSolLimit) {
      showStatus(statusEl, '❌ Total SOL limit must be greater than initial SOL', 'error');
      return;
    }
    
    if (!intervalMinutes || intervalMinutes < 1) {
      showStatus(statusEl, '❌ Interval must be at least 1 minute', 'error');
      return;
    }
    
    // Prepare config
    const config = {
      tokenAddress: tokenMint,
      walletId: walletId,
      buyCount: buyCount,
      sellCount: sellCount,
      roundTripMode: roundTripMode,
      initialSolPerTrade: initialSol,
      totalSolLimit: totalSolLimit,
      intervalMinutes: intervalMinutes,
      slippageBps: Math.floor(slippage * 100),
      priorityFeeLamports: priorityFee,
      randomizeTiming: randomizeTiming,
      useMultipleWallets: useMultiWallets,
    };
    
    console.log('Creating Ratio strategy with config:', config);
    
    // Disable button
    createBtn.disabled = true;
    createBtn.textContent = 'Creating Strategy...';
    showStatus(statusEl, '⏳ Creating Ratio strategy...', 'info');
    
    // Call backend
    if (!window.electron || !window.electron.strategy) {
      throw new Error('Strategy API not available');
    }
    
    const result = await window.electron.strategy.ratio.create(config);
    
    if (result.success) {
      showStatus(statusEl, `✅ Ratio Strategy #${result.strategyId} created successfully!`, 'success');
      
      // Clear form
      document.getElementById('ratio-token').value = '';
      
      // Show info about the strategy
      setTimeout(() => {
        alert(
          `✅ Ratio Strategy Created!\n\n` +
          `Pattern: ${buyCount} buys : ${sellCount} sells\n` +
          `Initial trade: ${initialSol} SOL\n` +
          `Will run until ${totalSolLimit} SOL total used\n\n` +
          `Go to Dashboard to start it!`
        );
        showPage('dashboard');
      }, 1000);
    } else {
      showStatus(statusEl, `❌ Failed to create strategy: ${result.error || 'Unknown error'}`, 'error');
    }
    
  } catch (error) {
    console.error('Error creating Ratio strategy:', error);
    showStatus(statusEl, `❌ Error: ${error.message}`, 'error');
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Create Ratio Strategy';
  }
}

function setupBundlePage() {
  // Token dropdown sync
  const tokenSelect = document.getElementById('bundle-token-select');
  const tokenInput = document.getElementById('bundle-token');
  if (tokenSelect && tokenInput) {
    tokenSelect.addEventListener('change', () => {
      if (tokenSelect.value) {
        tokenInput.value = tokenSelect.value;
      }
    });
  }
  
  // Bundle type toggle - show/hide delay field
  const instantRadio = document.getElementById('bundle-type-instant');
  const delayedRadio = document.getElementById('bundle-type-delayed');
  const delayField = document.getElementById('bundle-delay-field');
  
  if (instantRadio && delayedRadio && delayField) {
    instantRadio.addEventListener('change', () => {
      if (instantRadio.checked) {
        delayField.style.display = 'none';
      }
    });
    
    delayedRadio.addEventListener('change', () => {
      if (delayedRadio.checked) {
        delayField.style.display = 'block';
      }
    });
  }
  
  // Create Bundle Strategy Button
  const createBundleBtn = document.getElementById('create-bundle-btn');
  if (createBundleBtn) {
    createBundleBtn.addEventListener('click', async () => {
      await createBundleStrategy();
    });
  }
  
  console.log('Bundle page setup ready');
}

async function createBundleStrategy() {
  const statusEl = document.getElementById('bundle-status');
  const createBtn = document.getElementById('create-bundle-btn');
  
  try {
    // Get form values
    const tokenSelect = document.getElementById('bundle-token-select').value;
    const tokenInput = document.getElementById('bundle-token').value.trim();
    const tokenMint = tokenSelect || tokenInput;
    const walletId = document.getElementById('bundle-wallet-select').value;
    
    const bundleType = document.getElementById('bundle-type-instant').checked ? 'instant' : 'delayed';
    const buysPerBundle = parseInt(document.getElementById('bundle-buys-count').value);
    const totalBundles = parseInt(document.getElementById('bundle-total-count').value);
    const minBuyAmount = parseFloat(document.getElementById('bundle-min-buy').value);
    const maxBuyAmount = parseFloat(document.getElementById('bundle-max-buy').value);
    const bundleInterval = parseInt(document.getElementById('bundle-interval').value);
    const tradeDelay = parseInt(document.getElementById('bundle-trade-delay').value || '10');
    
    const slippage = parseFloat(document.getElementById('bundle-slippage').value);
    const priorityFee = parseInt(document.getElementById('bundle-priority-fee').value);
    const useMultiWallets = document.getElementById('bundle-multi-wallet').checked;
    
    // Validation
    if (!tokenMint) {
      showStatus(statusEl, '❌ Please enter a token address', 'error');
      return;
    }
    
    if (!walletId) {
      showStatus(statusEl, '❌ Please select a wallet', 'error');
      return;
    }
    
    if (!buysPerBundle || buysPerBundle < 2 || buysPerBundle > 5) {
      showStatus(statusEl, '❌ Buys per bundle must be between 2-5', 'error');
      return;
    }
    
    if (!totalBundles || totalBundles < 1) {
      showStatus(statusEl, '❌ Total bundles must be at least 1', 'error');
      return;
    }
    
    if (!minBuyAmount || minBuyAmount <= 0) {
      showStatus(statusEl, '❌ Min buy amount must be greater than 0', 'error');
      return;
    }
    
    if (!maxBuyAmount || maxBuyAmount <= minBuyAmount) {
      showStatus(statusEl, '❌ Max buy amount must be greater than min', 'error');
      return;
    }
    
    if (!bundleInterval || bundleInterval < 1) {
      showStatus(statusEl, '❌ Bundle interval must be at least 1 minute', 'error');
      return;
    }
    
    // Prepare config
    const config = {
      tokenAddress: tokenMint,
      walletId: walletId,
      bundleType: bundleType,
      buysPerBundle: buysPerBundle,
      minBuyAmount: minBuyAmount,
      maxBuyAmount: maxBuyAmount,
      bundleInterval: bundleInterval,
      delayBetweenTrades: bundleType === 'delayed' ? tradeDelay : undefined,
      totalBundles: totalBundles,
      slippageBps: Math.floor(slippage * 100),
      priorityFeeLamports: priorityFee,
      useMultipleWallets: useMultiWallets,
    };
    
    console.log('Creating Bundle Reconcile strategy with config:', config);
    
    // Disable button
    createBtn.disabled = true;
    createBtn.textContent = 'Creating Strategy...';
    showStatus(statusEl, '⏳ Creating Bundle strategy...', 'info');
    
    // Call backend
    if (!window.electron || !window.electron.strategy) {
      throw new Error('Strategy API not available');
    }
    
    const result = await window.electron.strategy.bundle.create(config);
    
    if (result.success) {
      showStatus(statusEl, `✅ Bundle Strategy #${result.strategyId} created successfully!`, 'success');
      
      // Clear form
      document.getElementById('bundle-token').value = '';
      
      // Show info about the strategy
      setTimeout(() => {
        const totalTrades = totalBundles * (buysPerBundle + 1); // buys + 1 reconciling sell
        const typeDesc = bundleType === 'instant' ? 'Instant (fast)' : `Delayed (${tradeDelay}s between trades)`;
        alert(
          `✅ Bundle Reconcile Strategy Created!\n\n` +
          `Type: ${typeDesc}\n` +
          `Pattern: ${buysPerBundle} buys → 1 reconciling sell\n` +
          `Total Bundles: ${totalBundles}\n` +
          `Expected Trades: ${totalTrades}\n\n` +
          `Go to Dashboard to start it!`
        );
        showPage('dashboard');
      }, 1000);
    } else {
      showStatus(statusEl, `❌ Failed to create strategy: ${result.error || 'Unknown error'}`, 'error');
    }
    
  } catch (error) {
    console.error('Error creating Bundle strategy:', error);
    showStatus(statusEl, `❌ Error: ${error.message}`, 'error');
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Create Bundle Strategy';
  }
}

function setupTokenManager() {
  // Add Token Button
  const addTokenBtn = document.getElementById('add-token-btn');
  if (addTokenBtn) {
    addTokenBtn.addEventListener('click', async () => {
      await addToken();
    });
  }
  
  // Fetch Token Info Button
  const fetchTokenInfoBtn = document.getElementById('fetch-token-info-btn');
  if (fetchTokenInfoBtn) {
    fetchTokenInfoBtn.addEventListener('click', async () => {
      await fetchTokenInfo();
    });
  }
  
  // Clear Form Button
  const clearTokenFormBtn = document.getElementById('clear-token-form-btn');
  if (clearTokenFormBtn) {
    clearTokenFormBtn.addEventListener('click', () => {
      document.getElementById('token-name').value = '';
      document.getElementById('token-symbol').value = '';
      document.getElementById('token-address').value = '';
      document.getElementById('token-notes').value = '';
      const statusEl = document.getElementById('token-status');
      if (statusEl) statusEl.style.display = 'none';
    });
  }
  
  // Also allow Enter key on address field to trigger fetch
  const tokenAddressInput = document.getElementById('token-address');
  if (tokenAddressInput) {
    tokenAddressInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        fetchTokenInfo();
      }
    });
  }
  
  // Browse Jupiter Tokens Button
  const browseJupiterBtn = document.getElementById('browse-jupiter-tokens-btn');
  if (browseJupiterBtn) {
    browseJupiterBtn.addEventListener('click', async () => {
      await showJupiterTokenBrowser();
    });
  }
  
  // Close Jupiter Browser Button
  const closeJupiterBrowserBtn = document.getElementById('close-jupiter-browser-btn');
  if (closeJupiterBrowserBtn) {
    closeJupiterBrowserBtn.addEventListener('click', () => {
      document.getElementById('jupiter-tokens-browser').style.display = 'none';
    });
  }
  
  // Jupiter Token Search
  const jupiterTokenSearch = document.getElementById('jupiter-token-search');
  if (jupiterTokenSearch) {
    jupiterTokenSearch.addEventListener('input', (e) => {
      filterJupiterTokens(e.target.value);
    });
  }
}

async function fetchTokenInfo() {
  const statusEl = document.getElementById('token-status');
  const fetchBtn = document.getElementById('fetch-token-info-btn');
  const addressInput = document.getElementById('token-address');
  const nameInput = document.getElementById('token-name');
  const symbolInput = document.getElementById('token-symbol');
  
  try {
    const address = addressInput.value.trim();
    
    if (!address) {
      showStatus(statusEl, '❌ Please enter a token address first', 'error');
      return;
    }
    
    // Basic validation
    if (address.length < 32 || address.length > 44) {
      showStatus(statusEl, '❌ Invalid Solana token address format', 'error');
      return;
    }
    
    // Disable button and show loading
    fetchBtn.disabled = true;
    fetchBtn.textContent = '⏳ Fetching...';
    showStatus(statusEl, '🔍 Fetching comprehensive token data...', 'info');
    
    // Use the new enhanced backend API
    if (window.electron && window.electron.jupiter) {
      const result = await window.electron.jupiter.getTokenData(address);
      
      if (result.success && result.info) {
        const { info, priceInSol, isTradeable, estimatedSlippage } = result;
        
        // Auto-fill form fields
        if (info.name) {
          nameInput.value = info.name;
        }
        if (info.symbol) {
          symbolInput.value = info.symbol;
        }
        
        // Build detailed status message
        let statusMessage = `✅ Found: ${info.name || 'Token'} (${info.symbol || 'N/A'})`;
        
        // Add price if available
        if (priceInSol > 0) {
          const solPrice = 200; // Current SOL price (could fetch from API)
          const priceUsd = priceInSol * solPrice;
          statusMessage += ` • Price: ${priceInSol.toFixed(9)} SOL`;
          if (priceUsd > 0.00001) {
            statusMessage += ` ($${priceUsd.toFixed(6)})`;
          }
        }
        
        // Add decimals
        statusMessage += ` • Decimals: ${info.decimals || 9}`;
        
        // Add tradeable status
        if (isTradeable) {
          statusMessage += ` • ✅ Tradeable`;
          if (estimatedSlippage > 0) {
            statusMessage += ` (est. ${estimatedSlippage.toFixed(2)}% slippage for 0.01 SOL)`;
          }
        } else {
          statusMessage += ` • ⚠️ Not validated (may have low liquidity)`;
        }
        
        showStatus(statusEl, statusMessage, 'success');
        
        console.log('✅ Enhanced token data fetched:', result);
        
        // Show logo if available
        if (info.logoURI) {
          // Could display logo here if you want
          console.log('Token logo available:', info.logoURI);
        }
        
      } else {
        // Fallback to simple Jupiter API
        console.log('Enhanced fetch failed, trying simple API...');
        const jupiterTokensAPI = 'https://tokens.jup.ag/token/' + address;
        
        try {
          const response = await fetch(jupiterTokensAPI);
          
          if (response.ok) {
            const tokenData = await response.json();
            
            if (tokenData.name) nameInput.value = tokenData.name;
            if (tokenData.symbol) symbolInput.value = tokenData.symbol;
            
            showStatus(statusEl, 
              `✅ Found: ${tokenData.name || 'Token'} (${tokenData.symbol || 'N/A'}) • Decimals: ${tokenData.decimals || 9}`, 
              'success'
            );
          } else {
            showStatus(statusEl, 
              '⚠️ Token not in Jupiter list. Please enter name manually. Token may be new/unlisted.', 
              'warning'
            );
          }
        } catch (fetchError) {
          console.error('Jupiter API fetch error:', fetchError);
          showStatus(statusEl, 
            '⚠️ Could not fetch from Jupiter. Please enter token details manually.', 
            'warning'
          );
        }
      }
    } else {
      showStatus(statusEl, '❌ Backend API not available', 'error');
    }
    
  } catch (error) {
    console.error('Error fetching token info:', error);
    showStatus(statusEl, `❌ Error: ${error.message}`, 'error');
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = '🔍 Fetch Token Info';
  }
}

async function addToken() {
  const statusEl = document.getElementById('token-status');
  const addBtn = document.getElementById('add-token-btn');
  
  try {
    // Get form values
    const name = document.getElementById('token-name').value.trim();
    const symbol = document.getElementById('token-symbol').value.trim();
    const address = document.getElementById('token-address').value.trim();
    const notes = document.getElementById('token-notes').value.trim();
    
    // Validation
    if (!name) {
      showStatus(statusEl, '❌ Please enter a token name (or click "Fetch Token Info")', 'error');
      return;
    }
    
    if (!address) {
      showStatus(statusEl, '❌ Please enter a token address', 'error');
      return;
    }
    
    // Basic Solana address validation (should be 32-44 characters)
    if (address.length < 32 || address.length > 44) {
      showStatus(statusEl, '❌ Invalid Solana token address', 'error');
      return;
    }
    
    // Disable button
    addBtn.disabled = true;
    addBtn.textContent = 'Adding Token...';
    showStatus(statusEl, '⏳ Adding token...', 'info');
    
    // Call backend
    if (!window.electron || !window.electron.token) {
      throw new Error('Tokens API not available');
    }
    
    const result = await window.electron.token.add({
      name,
      symbol: symbol || undefined,
      contractAddress: address,
      notes: notes || undefined,
    });
    
    if (result.success) {
      showStatus(statusEl, `✅ Token "${name}" added successfully!`, 'success');
      
      // Clear form
      document.getElementById('token-name').value = '';
      document.getElementById('token-symbol').value = '';
      document.getElementById('token-address').value = '';
      document.getElementById('token-notes').value = '';
      
      // Reload token list
      loadTokens();
    } else {
      showStatus(statusEl, `❌ Failed to add token: ${result.error || 'Unknown error'}`, 'error');
    }
    
  } catch (error) {
    console.error('Error adding token:', error);
    showStatus(statusEl, `❌ Error: ${error.message}`, 'error');
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = 'Add Token';
  }
}

let jupiterTokensCache = [];

async function showJupiterTokenBrowser() {
  const browserSection = document.getElementById('jupiter-tokens-browser');
  const jupiterTokensList = document.getElementById('jupiter-tokens-list');
  
  // Show the browser section
  browserSection.style.display = 'block';
  browserSection.scrollIntoView({ behavior: 'smooth' });
  
  try {
    jupiterTokensList.innerHTML = '<div class="empty-state">⏳ Loading verified tokens from Jupiter...</div>';
    
    // Fetch all verified tokens from Jupiter
    const response = await fetch('https://tokens.jup.ag/tokens?tags=verified');
    
    if (!response.ok) {
      throw new Error('Failed to fetch Jupiter tokens');
    }
    
    const tokens = await response.json();
    jupiterTokensCache = tokens;
    
    console.log(`✅ Loaded ${tokens.length} verified tokens from Jupiter`);
    
    // Display tokens
    renderJupiterTokens(tokens);
    
  } catch (error) {
    console.error('Error loading Jupiter tokens:', error);
    jupiterTokensList.innerHTML = '<div class="empty-state">❌ Failed to load Jupiter tokens. Check your connection.</div>';
  }
}

function renderJupiterTokens(tokens) {
  const jupiterTokensList = document.getElementById('jupiter-tokens-list');
  
  if (tokens.length === 0) {
    jupiterTokensList.innerHTML = '<div class="empty-state">No tokens found</div>';
    return;
  }
  
  // Show first 100 tokens (for performance)
  const displayTokens = tokens.slice(0, 100);
  
  jupiterTokensList.innerHTML = displayTokens.map(token => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #34495e; cursor: pointer;" 
         onclick="selectJupiterToken('${token.address}', '${token.name.replace(/'/g, "\\'")}', '${token.symbol}')">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${token.logoURI ? `<img src="${token.logoURI}" style="width: 24px; height: 24px; border-radius: 50%;" onerror="this.style.display='none'" />` : ''}
          <div>
            <div style="font-size: 13px; font-weight: bold; color: #fff;">${token.name}</div>
            <div style="font-size: 11px; color: #7f8c8d;">${token.symbol}</div>
          </div>
        </div>
      </div>
      <div style="font-size: 10px; color: #7f8c8d; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">
        ${token.address.substring(0, 8)}...${token.address.substring(token.address.length - 6)}
      </div>
      <button class="btn btn-small" style="background: #27ae60; min-width: 60px;" onclick="event.stopPropagation(); selectJupiterToken('${token.address}', '${token.name.replace(/'/g, "\\'")}', '${token.symbol}')">
        ➕ Add
      </button>
    </div>
  `).join('');
  
  if (tokens.length > 100) {
    jupiterTokensList.innerHTML += `<div style="padding: 10px; text-align: center; color: #7f8c8d; font-size: 12px;">Showing first 100 tokens. Use search to find more.</div>`;
  }
}

function filterJupiterTokens(searchTerm) {
  if (!jupiterTokensCache || jupiterTokensCache.length === 0) {
    return;
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  if (!term) {
    renderJupiterTokens(jupiterTokensCache);
    return;
  }
  
  const filtered = jupiterTokensCache.filter(token => 
    token.name.toLowerCase().includes(term) ||
    token.symbol.toLowerCase().includes(term) ||
    token.address.toLowerCase().includes(term)
  );
  
  console.log(`Found ${filtered.length} matching tokens for: ${searchTerm}`);
  renderJupiterTokens(filtered);
}

function selectJupiterToken(address, name, symbol) {
  // Fill in the add token form
  document.getElementById('token-address').value = address;
  document.getElementById('token-name').value = name;
  document.getElementById('token-symbol').value = symbol;
  
  // Scroll to form
  document.getElementById('tokens-page').scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Hide Jupiter browser
  document.getElementById('jupiter-tokens-browser').style.display = 'none';
  
  // Show success message
  const statusEl = document.getElementById('token-status');
  showStatus(statusEl, `✅ Selected: ${name} (${symbol}) - Click "Add Token" to save it`, 'success');
}

async function loadTokens() {
  console.log('Loading tokens...');
  const tokensList = document.getElementById('tokens-list');
  
  if (!tokensList) {
    console.error('Tokens list element not found');
    return;
  }
  
  try {
    // Show loading state
    tokensList.innerHTML = '<div class="empty-state">Loading tokens...</div>';
    
    if (!window.electron || !window.electron.token) {
      console.error('Electron tokens API not available');
      tokensList.innerHTML = '<div class="empty-state">⚠️ Tokens API not available</div>';
      return;
    }
    
    // Get all tokens
    const response = await window.electron.token.list();
    
    console.log('Tokens loaded:', response);
    
    if (!response || !response.success) {
      tokensList.innerHTML = `<div class="empty-state">❌ Error: ${response?.error || 'Failed to load tokens'}</div>`;
      return;
    }
    
    const tokens = response.tokens || [];
    
    if (tokens.length === 0) {
      tokensList.innerHTML = '<div class="empty-state">No tokens added yet. Add your first token above!</div>';
      return;
    }
    
    // Display tokens
    tokensList.innerHTML = '';
    tokens.forEach((token) => {
      const tokenCard = document.createElement('div');
      tokenCard.className = 'token-card';
      tokenCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <strong style="font-size: 16px;">${token.name}</strong>
              ${token.symbol ? `<span style="background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${token.symbol}</span>` : ''}
            </div>
            <div style="font-family: monospace; font-size: 12px; color: #7f8c8d; word-break: break-all; margin-bottom: 5px;">
              ${token.contract_address}
            </div>
            ${token.notes ? `<div style="font-size: 12px; color: #95a5a6; margin-top: 5px;">${token.notes}</div>` : ''}
          </div>
          <div style="display: flex; gap: 5px;">
            <button class="btn btn-icon" onclick="copyToClipboard('${token.contract_address}')" title="Copy Address">
              📋
            </button>
            <button class="btn btn-icon" onclick="deleteToken(${token.id})" title="Delete Token" style="background: #e74c3c;">
              🗑️
            </button>
          </div>
        </div>
      `;
      tokensList.appendChild(tokenCard);
    });
    
    console.log(`✅ Loaded ${tokens.length} token(s)`);
    
  } catch (error) {
    console.error('Error loading tokens:', error);
    tokensList.innerHTML = `<div class="empty-state">❌ Error loading tokens: ${error.message}</div>`;
  }
}

async function deleteToken(tokenId) {
  if (!confirm('Are you sure you want to delete this token?')) {
    return;
  }
  
  try {
    const result = await window.electron.token.delete(tokenId);
    if (result.success) {
      console.log('✅ Token deleted');
      loadTokens(); // Refresh list
    } else {
      alert(`Failed to delete token: ${result.error}`);
    }
  } catch (error) {
    console.error('Error deleting token:', error);
    alert(`Error: ${error.message}`);
  }
}

async function populateTokenDropdowns() {
  console.log('Populating token dropdowns...');
  
  try {
    if (!window.electron || !window.electron.token) {
      console.warn('Tokens API not available');
      return;
    }
    
    // Get all tokens
    const response = await window.electron.token.list();
    
    if (!response || !response.success) {
      console.error('Failed to load tokens for dropdown');
      return;
    }
    
    const tokens = response.tokens || [];
    console.log(`📊 Found ${tokens.length} token(s) in database`);
    
    // Populate all token dropdowns
    const dropdownIds = [
      'dca-token-select',
      'ratio-token-select',
      'bundle-token-select',
      'withdraw-token-select'
    ];
    
    dropdownIds.forEach(dropdownId => {
      const dropdown = document.getElementById(dropdownId);
      if (dropdown) {
        // Keep the first option (placeholder)
        const firstOption = dropdown.options[0];
        dropdown.innerHTML = '';
        
        if (tokens.length === 0) {
          // No tokens - show helpful message
          const noTokensOption = document.createElement('option');
          noTokensOption.value = '';
          noTokensOption.textContent = '-- No tokens saved yet - Add in Token Manager or enter address below --';
          dropdown.appendChild(noTokensOption);
        } else {
          // Has tokens - add placeholder then tokens
          dropdown.appendChild(firstOption);
          
          tokens.forEach(token => {
            const option = document.createElement('option');
            option.value = token.contract_address;
            option.textContent = `${token.name}${token.symbol ? ` (${token.symbol})` : ''} - ${token.contract_address.substring(0, 8)}...`;
            dropdown.appendChild(option);
          });
        }
        
        console.log(`✅ Populated ${dropdownId} with ${tokens.length} token(s)`);
      }
    });
    
  } catch (error) {
    console.error('Error populating token dropdowns:', error);
  }
}

async function populateWalletDropdowns() {
  console.log('Populating wallet dropdowns...');
  
  try {
    if (!window.electron || !window.electron.wallet) {
      console.warn('Wallet API not available');
      return;
    }
    
    // Get all wallets
    const response = await window.electron.wallet.getAllWithBalances();
    
    if (!response || !response.success) {
      console.error('Failed to load wallets for dropdown');
      return;
    }
    
    const wallets = response.wallets || [];
    
    // Populate all wallet dropdowns
    const dropdownIds = [
      'dca-wallet-select',
      'ratio-wallet-select',
      'bundle-wallet-select'
    ];
    
    dropdownIds.forEach(dropdownId => {
      const dropdown = document.getElementById(dropdownId);
      if (dropdown) {
        // Keep the first option (placeholder)
        const firstOption = dropdown.options[0];
        dropdown.innerHTML = '';
        dropdown.appendChild(firstOption);
        
        // Add wallet options
        wallets.forEach((wallet, index) => {
          const option = document.createElement('option');
          option.value = wallet.id || wallet.publicKey; // Use wallet ID if available, fallback to publicKey
          const label = wallet.label || `Wallet ${index + 1}`;
          const shortAddress = wallet.publicKey.substring(0, 8) + '...';
          const balance = (wallet.balance || 0).toFixed(4);
          option.textContent = `${label} (${shortAddress}) - ${balance} SOL`;
          dropdown.appendChild(option);
        });
        
        console.log(`✅ Populated ${dropdownId} with ${wallets.length} wallet(s)`);
      }
    });
    
  } catch (error) {
    console.error('Error populating wallet dropdowns:', error);
  }
}

function showStatus(element, message, type) {
  if (element) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        element.style.display = 'none';
      }, 5000);
    }
  }
}

function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.password-input-wrapper');
      const input = wrapper.querySelector('input');
      const icon = btn.querySelector('.password-toggle-icon');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
      } else {
        input.type = 'password';
        icon.textContent = '👁️';
      }
    });
  });
}

function showSuccessMessage(htmlContent) {
  const successMessage = document.getElementById('success-message');
  successMessage.innerHTML = htmlContent;
  showModal('success-modal');
}

function setupLicenseActivation() {
  const activateBtn = document.getElementById('activate-license-btn');
  const testConnectionBtn = document.getElementById('test-license-connection-btn');
  const validateBtn = document.getElementById('validate-license-btn');
  const deactivateBtn = document.getElementById('deactivate-license-btn');
  
  // Test Connection
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', async () => {
      showLicenseStatus('🔌 Testing connection to license server...', 'info');
      testConnectionBtn.disabled = true;
      testConnectionBtn.textContent = '🔄 Testing...';
      
      try {
        if (window.electron && window.electron.license && window.electron.license.testConnection) {
          const result = await window.electron.license.testConnection();
          
          if (result.connected) {
            showLicenseStatus(`✅ Connected to license server! (${result.responseTime}ms)\n${result.data}`, 'success');
          } else {
            showLicenseStatus(`❌ Cannot reach license server:\n${result.error}\n\nCheck your internet connection or firewall settings.`, 'error');
          }
        } else {
          showLicenseStatus('❌ Test connection feature not available', 'error');
        }
      } catch (error) {
        console.error('Connection test error:', error);
        showLicenseStatus(`❌ Test failed: ${error.message}`, 'error');
      } finally {
        testConnectionBtn.disabled = false;
        testConnectionBtn.textContent = '🔌 Test Connection';
      }
    });
  }
  
  // Activate License
  if (activateBtn) {
    activateBtn.addEventListener('click', async () => {
      const licenseKey = document.getElementById('license-key-input').value.trim();
      
      if (!licenseKey) {
        showLicenseStatus('Please enter a license key', 'error');
        return;
      }
      
      showLicenseStatus('Activating license...', 'info');
      activateBtn.disabled = true;
      activateBtn.textContent = '⏳ Activating...';
      
      try {
        // Call the backend API
        if (window.electron && window.electron.license) {
          console.log(`🔑 Attempting to activate license: ${licenseKey}`);
          const result = await window.electron.license.activate(licenseKey);
          console.log('📋 Activation result:', result);
          
          if (result.success) {
            showLicenseStatus(`✅ ${result.license.tier.toUpperCase()} license activated successfully!`, 'success');
            updateLicenseDisplay(result.license);
            
            // Reload license info to update UI
            await loadLicenseInfo();
          } else {
            console.error('❌ Activation failed:', result.message);
            showLicenseStatus(`❌ Activation failed: ${result.message}`, 'error');
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
        console.error('❌ License activation error:', error);
        showLicenseStatus(`❌ Error: ${error.message}`, 'error');
      } finally {
        activateBtn.disabled = false;
        activateBtn.textContent = 'Activate License';
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
  
  // Load data based on page
  if (pageName === 'wallet') {
    loadAllWallets();
  } else if (pageName === 'dashboard') {
    loadStrategies();
  } else if (pageName === 'tokens') {
    loadTokens();
  } else if (pageName === 'activity') {
    loadActivityLogs();
  } else if (pageName === 'trades') {
    loadTradesData();
  } else if (pageName === 'sync') {
    loadSyncPage();
  } else if (pageName === 'monitor') {
    if (window.loadMonitorPage) loadMonitorPage();
  } else if (pageName === 'diagnostics') {
    // Diagnostics page - ready for manual diagnostic run
    console.log('Diagnostics page loaded - click "Run Full Diagnostic" to start');
  } else if (pageName === 'dca' || pageName === 'ratio' || pageName === 'bundle') {
    populateTokenDropdowns();
    populateWalletDropdowns();
  } else if (pageName === 'wallet') {
    populateWithdrawWallets();
    populateTokenDropdowns(); // For token withdrawal
  }
}

async function checkWalletAndShowScreen() {
  try {
    // Check if any wallet exists
    if (window.electron && window.electron.wallet) {
      const walletsResult = await window.electron.wallet.list();
      
      if (walletsResult.success && walletsResult.wallets && walletsResult.wallets.length > 0) {
        // Wallet exists - show unlock screen
        console.log('✅ Wallet found - showing unlock screen');
        showUnlockScreen();
        setupUnlockButton();
      } else {
        // No wallet - go directly to main app (will show wallet creation page)
        console.log('⚠️ No wallet found - showing main app');
        showMainApp();
      }
    } else {
      // Electron API not loaded - show main app
      console.warn('Electron API not available - showing main app');
      showMainApp();
    }
  } catch (error) {
    console.error('Error checking wallet:', error);
    // On error, show main app
    showMainApp();
  }
}

function showUnlockScreen() {
  document.getElementById('unlock-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
  
  // Focus on password input
  setTimeout(() => {
    const passwordInput = document.getElementById('unlock-password');
    if (passwordInput) {
      passwordInput.focus();
    }
  }, 100);
}

function setupUnlockButton() {
  const unlockBtn = document.getElementById('unlock-btn');
  const unlockPassword = document.getElementById('unlock-password');
  const unlockError = document.getElementById('unlock-error');
  
  if (unlockBtn && unlockPassword) {
    // Remove any existing listeners
    const newUnlockBtn = unlockBtn.cloneNode(true);
    unlockBtn.parentNode.replaceChild(newUnlockBtn, unlockBtn);
    
    newUnlockBtn.addEventListener('click', async () => {
      const password = unlockPassword.value;
      
      if (!password) {
        if (unlockError) {
          unlockError.textContent = 'Please enter your password';
          unlockError.style.display = 'block';
        }
        return;
      }
      
      try {
        console.log('Attempting to unlock wallet...');
        newUnlockBtn.disabled = true;
        newUnlockBtn.textContent = 'Unlocking...';
        
        const result = await window.electron.wallet.unlock(password);
        
        if (result.success) {
          console.log('✅ Wallet unlocked successfully!');
          showMainApp();
        } else {
          throw new Error(result.error || 'Failed to unlock wallet');
        }
      } catch (error) {
        console.error('❌ Unlock failed:', error);
        if (unlockError) {
          unlockError.textContent = error.message || 'Incorrect password';
          unlockError.style.display = 'block';
        }
        newUnlockBtn.disabled = false;
        newUnlockBtn.textContent = 'Unlock Wallet';
      }
    });
    
    // Also allow Enter key to unlock
    unlockPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        newUnlockBtn.click();
      }
    });
  }
}

function showMainApp() {
  document.getElementById('unlock-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  
  // Load license info from backend
  loadLicenseInfo();
  
  // Load strategies on dashboard
  loadStrategies();
  
  // Setup dashboard refresh button
  const refreshStrategiesBtn = document.getElementById('refresh-strategies-btn');
  if (refreshStrategiesBtn) {
    refreshStrategiesBtn.addEventListener('click', () => {
      console.log('Refreshing strategies...');
      loadStrategies();
    });
  }
  
  // Setup lock wallet button
  setupLockWalletButton();
}

function setupLockWalletButton() {
  const lockBtn = document.getElementById('lock-wallet-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', async () => {
      try {
        console.log('Locking wallet...');
        const result = await window.electron.wallet.lock();
        if (result.success) {
          console.log('✅ Wallet locked');
          showUnlockScreen();
          setupUnlockButton();
        }
      } catch (error) {
        console.error('❌ Failed to lock wallet:', error);
      }
    });
  }
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
    
    // Load fee information
    await loadFeeInfo();
  } catch (error) {
    console.error('Error loading license info:', error);
    // On any error, default to FREE tier
    resetToFreeTier();
  }
}

// Load fee configuration and display in settings
async function loadFeeInfo() {
  try {
    const feeStatusEl = document.getElementById('fee-status');
    const feePercentageEl = document.getElementById('fee-percentage');
    const feeWalletEl = document.getElementById('fee-wallet');
    
    if (!feeStatusEl || !feePercentageEl || !feeWalletEl) {
      return; // Elements don't exist yet
    }
    
    // Get fee config from backend (using IPC)
    // For now, show the default values
    feeStatusEl.textContent = 'Active';
    feeStatusEl.style.color = '#2ed573';
    feePercentageEl.textContent = '0.5%';
    feeWalletEl.textContent = '82wZpbqxXAq5qFUQey3qgjWvVrTf8izc9McByMdRHvrd';
    
  } catch (error) {
    console.error('Error loading fee info:', error);
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


function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('✅ Copied to clipboard:', text);
      // Show a temporary success message
      const toast = document.createElement('div');
      toast.textContent = '✅ Copied to clipboard!';
      toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; padding: 10px 20px; border-radius: 4px; z-index: 10000;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  } else {
    console.warn('Clipboard API not available');
  }
}

async function loadDashboardStats() {
  try {
    if (!window.electron || !window.electron.stats) {
      console.warn('Stats API not available');
      return;
    }
    
    const response = await window.electron.stats.getDashboard();
    
    if (response && response.success) {
      const stats = response.stats;
      
      // Update stat cards
      document.getElementById('total-trades').textContent = stats.totalTrades || 0;
      
      const todayVolumeEl = document.getElementById('today-volume');
      if (todayVolumeEl) {
        todayVolumeEl.textContent = `${(stats.todayVolume || 0).toFixed(4)} SOL`;
      }
      
      console.log(`📊 Dashboard stats loaded: ${stats.totalTrades} trades, ${stats.todayVolume} SOL today`);
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

async function loadStrategies() {
  console.log('Loading all strategies...');
  const strategiesList = document.getElementById('strategies-list');
  
  if (!strategiesList) {
    console.error('Strategies list element not found');
    return;
  }
  
  try {
    // Show loading state
    strategiesList.innerHTML = '<div class="empty-state">Loading strategies...</div>';
    
    if (!window.electron || !window.electron.strategy) {
      console.error('Electron strategy API not available');
      strategiesList.innerHTML = '<div class="empty-state">⚠️ Strategy API not available</div>';
      return;
    }
    
    // Get all strategies
    const response = await window.electron.strategy.getAll();
    
    // Also load dashboard stats
    await loadDashboardStats();
    
    console.log('Strategies response:', response);
    
    if (!response || !response.success) {
      strategiesList.innerHTML = `<div class="empty-state">❌ Error: ${response?.error || 'Failed to load strategies'}</div>`;
      return;
    }
    
    const strategies = response.strategies || [];
    
    if (strategies.length === 0) {
      strategiesList.innerHTML = '<div class="empty-state">No active strategies. Create one to get started!</div>';
      return;
    }
    
    // Display strategies
    strategiesList.innerHTML = '';
    strategies.forEach(async (strategy) => {
      const strategyCard = document.createElement('div');
      strategyCard.className = 'strategy-card';
      
      // Determine strategy type and icon
      let typeLabel = 'Unknown';
      let typeIcon = '📊';
      if (strategy.type === 'dca') {
        typeLabel = 'DCA';
        typeIcon = '📈';
      } else if (strategy.type === 'ratio') {
        typeLabel = 'Ratio Trading';
        typeIcon = '🎯';
      } else if (strategy.type === 'bundle') {
        typeLabel = 'Bundle';
        typeIcon = '📦';
      }
      
      // Status badge
      let statusBadge = '';
      let statusColor = '#95a5a6';
      if (strategy.status === 'active') {
        statusBadge = '🟢 Active';
        statusColor = '#27ae60';
      } else if (strategy.status === 'paused') {
        statusBadge = '⏸️ Paused';
        statusColor = '#f39c12';
      } else if (strategy.status === 'completed') {
        statusBadge = '✅ Completed';
        statusColor = '#3498db';
      } else if (strategy.status === 'stopped') {
        statusBadge = '⏹️ Stopped';
        statusColor = '#95a5a6';
      }
      
      // Format dates
      const createdDate = strategy.created_at ? new Date(strategy.created_at).toLocaleString() : 'N/A';
      const lastExecution = strategy.progress?.lastExecutionTime ? new Date(strategy.progress.lastExecutionTime).toLocaleString() : 'Not executed yet';
      const nextExecution = strategy.status === 'active' && strategy.progress?.nextExecutionTime ? 
        new Date(strategy.progress.nextExecutionTime).toLocaleString() : 'N/A';
      
      // Get token name from token manager or Jupiter
      let tokenDisplay = strategy.config.tokenAddress ? strategy.config.tokenAddress.substring(0, 8) + '...' : 'N/A';
      try {
        if (window.electron && strategy.config.tokenAddress) {
          // Try Token Manager first
          if (window.electron.token) {
            const tokens = await window.electron.token.list();
            if (tokens.success && tokens.tokens) {
              const token = tokens.tokens.find(t => t.contract_address === strategy.config.tokenAddress);
              if (token && token.name) {
                tokenDisplay = `${token.name}${token.symbol ? ` (${token.symbol})` : ''}`;
              }
            }
          }
          
          // If still showing address, try Jupiter
          if (tokenDisplay.includes('...') && window.electron.jupiter) {
            const tokenInfo = await window.electron.jupiter.getTokenInfo(strategy.config.tokenAddress);
            if (tokenInfo && tokenInfo.name) {
              tokenDisplay = `${tokenInfo.name}${tokenInfo.symbol ? ` (${tokenInfo.symbol})` : ''}`;
            }
          }
        }
      } catch (err) {
        console.log('Could not load token name:', err);
      }
      
      // Get wallet name/label
      let walletDisplay = 'Main Wallet (default)';
      try {
        if (window.electron && window.electron.wallet && strategy.config.walletId) {
          const wallets = await window.electron.wallet.list();
          if (wallets.success && wallets.wallets) {
            const wallet = wallets.wallets.find(w => 
              w.id == strategy.config.walletId || w.publicKey === strategy.config.walletId
            );
            if (wallet) {
              const balanceResult = await window.electron.wallet.getBalance(wallet.publicKey);
              if (balanceResult.success) {
                walletDisplay = `${wallet.label || 'Wallet'} (${balanceResult.balance.toFixed(4)} SOL)`;
              } else {
                walletDisplay = `${wallet.label || 'Wallet'} (Error loading balance)`;
              }
            }
          }
        }
      } catch (err) {
        console.log('Could not load wallet info:', err);
      }
      
      // Format interval time better
      let intervalDisplay = 'N/A';
      if (strategy.type === 'dca' && strategy.config.frequency) {
        const freqMap = {
          'hourly': 'Every Hour',
          '2h': 'Every 2 Hours',
          '4h': 'Every 4 Hours',
          '6h': 'Every 6 Hours',
          'daily': 'Every Day',
          'custom': `Every ${strategy.config.customIntervalMinutes || 0} min`
        };
        intervalDisplay = freqMap[strategy.config.frequency] || strategy.config.frequency;
      } else if (strategy.config.intervalMinutes) {
        intervalDisplay = `Every ${strategy.config.intervalMinutes} min`;
      }
      
      strategyCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="font-size: 20px;">${typeIcon}</span>
              <strong style="font-size: 16px;">${typeLabel} #${strategy.id}</strong>
              <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${statusBadge}</span>
            </div>
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 3px;">
              🪙 Token: <strong style="color: #fff;">${tokenDisplay}</strong>
            </div>
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 3px;">
              💰 Wallet: <strong style="color: #fff;">${walletDisplay}</strong>
            </div>
            <div style="font-size: 11px; color: #95a5a6;">
              📅 Created: ${createdDate}
            </div>
          </div>
          <div style="display: flex; gap: 5px;">
            ${strategy.status === 'active' ? `
              <button class="btn btn-small" onclick="pauseStrategy(${strategy.id}, '${strategy.type}')" style="background: #f39c12; min-width: 80px;">⏸️ Pause</button>
              <button class="btn btn-small" onclick="stopStrategy(${strategy.id}, '${strategy.type}')" style="background: #e74c3c; min-width: 80px;">⏹️ Stop</button>
            ` : strategy.status === 'paused' ? `
              <button class="btn btn-small" onclick="startStrategy(${strategy.id}, '${strategy.type}')" style="background: #27ae60; min-width: 80px;">▶️ Resume</button>
              <button class="btn btn-small" onclick="stopStrategy(${strategy.id}, '${strategy.type}')" style="background: #e74c3c; min-width: 80px;">⏹️ Stop</button>
            ` : strategy.status === 'stopped' ? `
              <button class="btn btn-small" onclick="startStrategy(${strategy.id}, '${strategy.type}')" style="background: #27ae60; min-width: 80px;">▶️ Start</button>
            ` : strategy.status === 'completed' ? `
              <span style="color: #27ae60; font-weight: 600;">✅ Completed</span>
            ` : ''}
            <button class="btn btn-small" onclick="confirmDeleteStrategy(${strategy.id}, '${strategy.type}', '${typeLabel}')" style="background: #dc2626; min-width: 80px;">🗑️ Delete</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 13px; margin-bottom: 8px;">
          ${strategy.type === 'dca' ? `
            <div><span style="color: #7f8c8d;">Direction:</span> <strong>${strategy.config.direction === 'buy' ? '📥 Buy' : '📤 Sell'}</strong></div>
            <div><span style="color: #7f8c8d;">Total Amount:</span> <strong>${strategy.config.totalAmount} ${strategy.config.direction === 'buy' ? 'SOL' : 'tokens'}</strong></div>
            <div><span style="color: #7f8c8d;">Orders:</span> <strong>${strategy.progress?.completed || 0} / ${strategy.config.numberOfOrders || strategy.config.numOrders || 0}</strong></div>
            <div><span style="color: #7f8c8d;">Interval:</span> <strong>${intervalDisplay}</strong></div>
          ` : strategy.type === 'ratio' ? `
            <div><span style="color: #7f8c8d;">Pattern:</span> <strong>${strategy.config.buyCount || 3} buys : ${strategy.config.sellCount || 2} sells</strong></div>
            <div><span style="color: #7f8c8d;">Base Amount:</span> <strong>${strategy.progress?.baseTokenAmount ? strategy.progress.baseTokenAmount.toFixed(0) : 'Not set'} tokens</strong></div>
            <div><span style="color: #7f8c8d;">SOL Progress:</span> <strong>${(strategy.progress?.totalSolUsed || 0).toFixed(2)} / ${strategy.config.totalSolLimit || 0} SOL (${strategy.config.totalSolLimit ? ((strategy.progress?.totalSolUsed || 0) / strategy.config.totalSolLimit * 100).toFixed(0) : 0}%)</strong></div>
            <div><span style="color: #7f8c8d;">Trades:</span> <strong>${strategy.progress?.totalTrades || 0} total (${strategy.progress?.totalBuyTrades || 0} buys, ${strategy.progress?.totalSellTrades || 0} sells)</strong></div>
            <div><span style="color: #7f8c8d;">Current Cycle:</span> <strong>#${(strategy.progress?.currentCycle || 0) + 1}, Trade ${(strategy.progress?.tradesInCycle || 0) + 1}/${(strategy.config.buyCount || 0) + (strategy.config.sellCount || 0)}</strong></div>
            <div><span style="color: #7f8c8d;">Interval:</span> <strong>${strategy.config.intervalMinutes || 0} min${strategy.config.randomizeTiming ? ' (±20%)' : ''}</strong></div>
          ` : strategy.type === 'bundle' ? `
            <div><span style="color: #7f8c8d;">Type:</span> <strong>${strategy.config.bundleType === 'instant' ? '⚡ Instant' : '⏱️ Delayed'}</strong></div>
            <div><span style="color: #7f8c8d;">Pattern:</span> <strong>${strategy.config.buysPerBundle || 3} buys → 1 reconcile sell</strong></div>
            <div><span style="color: #7f8c8d;">Buy Range:</span> <strong>${strategy.config.minBuyAmount || 0}-${strategy.config.maxBuyAmount || 0} SOL</strong></div>
            <div><span style="color: #7f8c8d;">Progress:</span> <strong>${strategy.progress?.bundlesCompleted || 0} / ${strategy.config.totalBundles || 0} bundles (${strategy.config.totalBundles ? ((strategy.progress?.bundlesCompleted || 0) / strategy.config.totalBundles * 100).toFixed(0) : 0}%)</strong></div>
            <div><span style="color: #7f8c8d;">Trades:</span> <strong>${strategy.progress?.totalTrades || 0} total (${strategy.progress?.totalBuys || 0} buys, ${strategy.progress?.totalSells || 0} sells)</strong></div>
            <div><span style="color: #7f8c8d;">Interval:</span> <strong>${strategy.config.bundleInterval || 0} min${strategy.config.bundleType === 'delayed' ? `, ${strategy.config.delayBetweenTrades || 10}s delays` : ''}</strong></div>
          ` : ''}
        </div>
        <div style="border-top: 1px solid #34495e; padding-top: 8px; font-size: 11px; color: #7f8c8d;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 5px;">
            <div>⏱️ Last Execution: <strong>${lastExecution}</strong></div>
            ${strategy.status === 'active' ? `<div>⏭️ Next Execution: <strong>${nextExecution}</strong></div>` : ''}
          </div>
        </div>
      `;
      strategiesList.appendChild(strategyCard);
    });
    
    // Update strategy count
    document.getElementById('active-strategies').textContent = strategies.filter(s => s.status === 'active').length;
    
    console.log(`✅ Loaded ${strategies.length} strateg(ies)`);
    
  } catch (error) {
    console.error('Error loading strategies:', error);
    strategiesList.innerHTML = `<div class="empty-state">❌ Error loading strategies: ${error.message}</div>`;
  }
}

// Load archived strategies
async function loadSyncPage() {
  console.log('Loading sync page...');
  
  try {
    // Load data summary
    await loadSyncDataSummary();
    
    // Load sync history
    await loadSyncHistory();
    
    // Setup sync buttons
    setupSyncButtons();
    
    console.log('✅ Sync page loaded successfully');
    
  } catch (error) {
    console.error('Error loading sync page:', error);
    showSyncStatus('❌ Error loading sync page: ' + error.message, 'error');
  }
}

async function loadSyncDataSummary() {
  try {
    // Get active strategies count
    let activeStrategies = 0;
    if (window.electron?.strategy?.getAll) {
      const strategiesResponse = await window.electron.strategy.getAll();
      activeStrategies = strategiesResponse.success ? strategiesResponse.strategies.length : 0;
    }
    
    // Get total trades (from database directly)
    let totalTrades = 0;
    let totalVolume = 0;
    if (window.electron?.database?.query) {
      try {
        const tradesResult = await window.electron.database.query('SELECT COUNT(*) as count, SUM(amount) as volume FROM trades');
        if (tradesResult.success && tradesResult.rows && tradesResult.rows[0]) {
          totalTrades = tradesResult.rows[0].count || 0;
          totalVolume = tradesResult.rows[0].volume || 0;
        }
      } catch (err) {
        console.warn('Could not query trades:', err);
      }
    }
    
    // Get last sync time (from local storage)
    const lastSync = localStorage.getItem('lastSyncTime') || 'Never';
    
    // Update UI
    const activeStrategiesEl = document.getElementById('sync-active-strategies');
    const totalTradesEl = document.getElementById('sync-total-trades');
    const totalVolumeEl = document.getElementById('sync-total-volume');
    const lastSyncEl = document.getElementById('sync-last-sync');
    
    if (activeStrategiesEl) activeStrategiesEl.textContent = activeStrategies;
    if (totalTradesEl) totalTradesEl.textContent = totalTrades.toLocaleString();
    if (totalVolumeEl) totalVolumeEl.textContent = totalVolume.toFixed(2) + ' SOL';
    if (lastSyncEl) lastSyncEl.textContent = lastSync;
    
  } catch (error) {
    console.error('Error loading sync data summary:', error);
  }
}

async function loadSyncHistory() {
  const syncHistory = document.getElementById('sync-history');
  if (!syncHistory) return;
  
  try {
    // Get sync history from local storage
    const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');
    
    if (history.length === 0) {
      syncHistory.innerHTML = '<div class="empty-state">No sync history available</div>';
      return;
    }
    
    // Display sync history
    syncHistory.innerHTML = '';
    history.forEach((entry, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'sync-history-item';
      
      const statusClass = entry.success ? 'success' : 'error';
      const statusText = entry.success ? 'Success' : 'Failed';
      
      historyItem.innerHTML = `
        <div>
          <div style="font-weight: 500; color: #fff;">${entry.action}</div>
          <div class="sync-history-time">${new Date(entry.timestamp).toLocaleString()}</div>
        </div>
        <div class="sync-history-status ${statusClass}">${statusText}</div>
      `;
      
      syncHistory.appendChild(historyItem);
    });
    
  } catch (error) {
    console.error('Error loading sync history:', error);
    syncHistory.innerHTML = '<div class="empty-state">Error loading sync history</div>';
  }
}

function setupSyncButtons() {
  // Sync Now button
  const syncNowBtn = document.getElementById('sync-now-btn');
  if (syncNowBtn) {
    syncNowBtn.onclick = () => performSync();
  }
  
  // View Cloud Dashboard button
  const viewDashboardBtn = document.getElementById('view-cloud-dashboard-btn');
  if (viewDashboardBtn) {
    viewDashboardBtn.onclick = () => {
      window.open('https://anvil.shoguncrypto.com/dashboard', '_blank');
    };
  }
  
  // Sync Settings button
  const syncSettingsBtn = document.getElementById('sync-settings-btn');
  if (syncSettingsBtn) {
    syncSettingsBtn.onclick = () => {
      showSyncStatus('⚙️ Sync settings coming soon!', 'info');
    };
  }
}

async function performSync() {
  const syncBtn = document.getElementById('sync-now-btn');
  const statusDiv = document.getElementById('sync-status');
  
  if (!syncBtn || !statusDiv) return;
  
  try {
    // Disable button and show loading
    syncBtn.disabled = true;
    syncBtn.innerHTML = '⏳ Syncing...';
    showSyncStatus('🔄 Starting data sync...', 'info');
    
    // Collect all data
    const syncData = await collectSyncData();
    
    // Send to cloud
    const result = await sendDataToCloud(syncData);
    
    if (result.success) {
      // Update last sync time
      const now = new Date().toLocaleString();
      localStorage.setItem('lastSyncTime', now);
      
      // Add to sync history
      addToSyncHistory('Data Sync', true, 'Successfully synced all data to cloud');
      
      showSyncStatus('✅ Data synced successfully!', 'success');
      
      // Refresh data summary
      await loadSyncDataSummary();
      await loadSyncHistory();
      
    } else {
      throw new Error(result.error || 'Sync failed');
    }
    
  } catch (error) {
    console.error('Sync error:', error);
    showSyncStatus('❌ Sync failed: ' + error.message, 'error');
    addToSyncHistory('Data Sync', false, error.message);
  } finally {
    // Re-enable button
    syncBtn.disabled = false;
    syncBtn.innerHTML = '☁️ Sync Now';
  }
}

async function collectSyncData() {
  console.log('Collecting sync data...');
  
  const data = {
    timestamp: new Date().toISOString(),
    strategies: [],
    trades: [],
    transactions: [],
    settings: {},
    version: '3.6.0'
  };
  
  try {
    // Get strategies
    if (window.electron?.strategy?.getAll) {
      const strategiesResponse = await window.electron.strategy.getAll();
      if (strategiesResponse.success) {
        data.strategies = strategiesResponse.strategies;
      }
    }
    
    // Get all data from database
    if (window.electron?.database?.query) {
      try {
        // Get trades
        const tradesResult = await window.electron.database.query('SELECT * FROM trades ORDER BY created_at DESC LIMIT 1000');
        if (tradesResult.success && tradesResult.rows) {
          data.trades = tradesResult.rows;
        }
        
        // Get transactions
        const txResult = await window.electron.database.query('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 1000');
        if (txResult.success && txResult.rows) {
          data.transactions = txResult.rows;
        }
        
        // Get settings
        const settingsResult = await window.electron.database.query('SELECT * FROM settings');
        if (settingsResult.success && settingsResult.rows) {
          data.settings = settingsResult.rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
          }, {});
        }
      } catch (err) {
        console.warn('Error querying database:', err);
      }
    }
    
    console.log(`✅ Collected ${data.strategies.length} strategies, ${data.trades.length} trades, ${data.transactions.length} transactions`);
    return data;
    
  } catch (error) {
    console.error('Error collecting sync data:', error);
    throw error;
  }
}

async function sendDataToCloud(data) {
  console.log('Sending data to cloud...');
  
  try {
    const response = await fetch('https://anvil.shoguncrypto.com/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Cloud sync response:', result);
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error('Cloud sync error:', error);
    return { success: false, error: error.message };
  }
}

function showSyncStatus(message, type = 'info') {
  const statusDiv = document.getElementById('sync-status');
  if (!statusDiv) return;
  
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;
  
  // Auto-hide after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status-message';
    }, 5000);
  }
}

function addToSyncHistory(action, success, message) {
  try {
    const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');
    
    history.unshift({
      action,
      success,
      message,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('syncHistory', JSON.stringify(history));
    
  } catch (error) {
    console.error('Error adding to sync history:', error);
  }
}


// Strategy control functions
async function startStrategy(strategyId, type) {
  try {
    console.log(`Starting ${type} strategy #${strategyId}`);
    const result = await window.electron.strategy[type].start(strategyId);
    if (result.success) {
      console.log('✅ Strategy started');
      loadStrategies(); // Refresh list
    } else {
      console.error('Failed to start strategy:', result.error);
      alert(`Failed to start strategy: ${result.error}`);
    }
  } catch (error) {
    console.error('Error starting strategy:', error);
    alert(`Error: ${error.message}`);
  }
}

async function pauseStrategy(strategyId, type) {
  try {
    console.log(`Pausing ${type} strategy #${strategyId}`);
    const result = await window.electron.strategy[type].pause(strategyId);
    if (result.success) {
      console.log('✅ Strategy paused');
      loadStrategies(); // Refresh list
    } else {
      console.error('Failed to pause strategy:', result.error);
      alert(`Failed to pause strategy: ${result.error}`);
    }
  } catch (error) {
    console.error('Error pausing strategy:', error);
    alert(`Error: ${error.message}`);
  }
}

async function stopStrategy(strategyId, type) {
  if (!confirm(`Are you sure you want to stop strategy #${strategyId}? This cannot be undone.`)) {
    return;
  }
  
  try {
    console.log(`Stopping ${type} strategy #${strategyId}`);
    const result = await window.electron.strategy[type].stop(strategyId);
    if (result.success) {
      console.log('✅ Strategy stopped');
      loadStrategies(); // Refresh list
    } else {
      console.error('Failed to stop strategy:', result.error);
      alert(`Failed to stop strategy: ${result.error}`);
    }
  } catch (error) {
    console.error('Error stopping strategy:', error);
    alert(`Error: ${error.message}`);
  }
}

// Archive functionality removed - replaced with Data Sync system

// Permanently delete strategy (use with extreme caution)
async function deleteStrategy(strategyId) {
  if (!confirm(
    `⚠️ PERMANENTLY DELETE Strategy #${strategyId}?\n\n` +
    `❌ This will DELETE ALL DATA:\n` +
    `  • Strategy configuration\n` +
    `  • All transaction history\n` +
    `  • All activity logs\n` +
    `  • Fee records\n\n` +
    `💡 TIP: Use "Data Sync" to backup before deleting!\n\n` +
    `Are you ABSOLUTELY SURE?`
  )) {
    return;
  }
  
  // Double confirmation
  if (!confirm('This cannot be undone. Delete permanently?')) {
    return;
  }
  
  try {
    console.log(`Permanently deleting strategy #${strategyId}`);
    const result = await window.electron.strategy.delete(strategyId);
    
    if (result.success) {
      console.log('✅ Strategy permanently deleted');
      alert('Strategy permanently deleted.');
      loadStrategies(); // Refresh list
    } else {
      alert(`Failed to delete strategy: ${result.error}`);
    }
  } catch (error) {
    console.error('Error deleting strategy:', error);
    alert(`Error: ${error.message}`);
  }
}

// Restore functionality removed - replaced with Data Sync system

// ============================================================================
// ACTIVITY LOG MANAGEMENT
// ============================================================================

async function loadActivityLogs() {
  console.log('Loading activity logs...');
  const activityList = document.getElementById('activity-log-list');
  
  if (!activityList) {
    console.error('Activity log list element not found');
    return;
  }
  
  try {
    // Show loading state
    activityList.innerHTML = '<div class="empty-state">Loading activity...</div>';
    
    if (!window.electron || !window.electron.activity) {
      console.error('Electron activity API not available');
      activityList.innerHTML = '<div class="empty-state">⚠️ Activity API not available</div>';
      return;
    }
    
    // Get filter
    const categoryFilter = document.getElementById('activity-filter-category')?.value || '';
    const params = categoryFilter ? { category: categoryFilter, limit: 100 } : { limit: 100 };
    
    // Get all activity logs
    const response = await window.electron.activity.getAll(params);
    
    console.log('Activity logs response:', response);
    
    if (!response || !response.success) {
      activityList.innerHTML = `<div class="empty-state">❌ Error: ${response?.error || 'Failed to load activity logs'}</div>`;
      return;
    }
    
    const logs = response.logs || [];
    
    if (logs.length === 0) {
      activityList.innerHTML = '<div class="empty-state">No activity yet. Create and run strategies to see activity!</div>';
      return;
    }
    
    // Display activity logs
    activityList.innerHTML = '';
    logs.forEach((log) => {
      const logItem = document.createElement('div');
      logItem.className = 'activity-item';
      
      // Determine icon and color based on category and severity
      let icon = '📝';
      let iconColor = '#3498db';
      
      if (log.category === 'strategy') icon = '📊';
      if (log.category === 'trade') icon = '💱';
      if (log.category === 'wallet') icon = '💰';
      if (log.category === 'system') icon = '⚙️';
      
      if (log.severity === 'success') iconColor = '#27ae60';
      if (log.severity === 'warning') iconColor = '#f39c12';
      if (log.severity === 'error') iconColor = '#e74c3c';
      
      // Format timestamp
      const timestamp = new Date(log.timestamp).toLocaleString();
      
      // Parse metadata for transaction info
      let transactionLink = '';
      if (log.metadata) {
        try {
          const metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
          if (metadata.signature) {
            transactionLink = `
              <div style="margin-top: 8px;">
                <a href="https://solscan.io/tx/${metadata.signature}" target="_blank" 
                   style="color: #3498db; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">
                  🔗 View on Solscan: ${metadata.signature.substring(0, 16)}...
                </a>
                ${metadata.dex ? `<span style="margin-left: 10px; color: #95a5a6; font-size: 11px;">DEX: ${metadata.dex}</span>` : ''}
              </div>
            `;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      logItem.innerHTML = `
        <div style="display: flex; align-items: start; gap: 15px; padding: 15px; border-bottom: 1px solid #34495e;">
          <div style="font-size: 24px; color: ${iconColor};">${icon}</div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 5px;">
              <strong style="font-size: 14px;">${log.title}</strong>
              <span style="font-size: 11px; color: #95a5a6;">${timestamp}</span>
            </div>
            ${log.description ? `<div style="font-size: 12px; color: #bdc3c7; margin-bottom: 5px;">${log.description}</div>` : ''}
            ${transactionLink}
            <div style="display: flex; gap: 10px; font-size: 11px; color: #7f8c8d; margin-top: 8px;">
              <span style="background: #34495e; padding: 2px 8px; border-radius: 3px;">${log.category.toUpperCase()}</span>
              ${log.strategy_id ? `<span>Strategy #${log.strategy_id}</span>` : ''}
              ${log.wallet_label ? `<span>Wallet: ${log.wallet_label}</span>` : ''}
            </div>
          </div>
        </div>
      `;
      activityList.appendChild(logItem);
    });
    
    console.log(`✅ Loaded ${logs.length} activity log(s)`);
    
  } catch (error) {
    console.error('Error loading activity logs:', error);
    activityList.innerHTML = `<div class="empty-state">❌ Error loading activity logs: ${error.message}</div>`;
  }
}

// Setup activity log page
document.addEventListener('DOMContentLoaded', () => {
  // Refresh button
  const refreshActivityBtn = document.getElementById('refresh-activity-btn');
  if (refreshActivityBtn) {
    refreshActivityBtn.addEventListener('click', () => {
      console.log('Refreshing activity logs...');
      loadActivityLogs();
    });
  }
  
  // Category filter
  const categoryFilter = document.getElementById('activity-filter-category');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      console.log('Activity filter changed');
      loadActivityLogs();
    });
  }
  
  // Listen for real-time activity updates
  if (window.electron && window.electron.activity) {
    window.electron.activity.onNewActivity((activity) => {
      console.log('New activity received:', activity);
      // Reload the activity log to show the new activity
      if (document.getElementById('activity-page').classList.contains('active')) {
        loadActivityLogs();
      }
    });
  }
});

// Setup trades & volume page
function setupTradesPage() {
  const refreshBtn = document.getElementById('refresh-trades-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      console.log('Refreshing trades data...');
      loadTradesData();
    });
  }
}

// Setup DevTools button
function setupDevToolsButton() {
  const devToolsBtn = document.getElementById('devtools-button');
  if (devToolsBtn) {
    devToolsBtn.addEventListener('click', () => {
      console.log('Opening DevTools...');
      
      // Show console logs in a modal
      showConsoleLogs();
      
      // Also open DevTools
      if (window.electron && window.electron.openDevTools) {
        window.electron.openDevTools();
      }
    });
  }
  
  // Listen for console logs from main process
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('devtools-logs', (event, logs) => {
      console.log('Received logs from main process:', logs);
    });
  }
}

// Show console logs in a modal
function showConsoleLogs() {
  // Create console modal if it doesn't exist
  let consoleModal = document.getElementById('console-modal');
  if (!consoleModal) {
    consoleModal = document.createElement('div');
    consoleModal.id = 'console-modal';
    consoleModal.className = 'modal';
    consoleModal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; max-height: 600px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2>🔧 Console Logs & Debug Info</h2>
          <button onclick="hideModal('console-modal')" style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
        <div id="console-output" style="background: #1a1a1a; color: #00ff00; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; max-height: 400px; overflow-y: auto; white-space: pre-wrap;"></div>
        <div style="margin-top: 15px;">
          <button onclick="refreshConsoleLogs()" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Refresh Logs</button>
          <button onclick="testLicenseConnection()" style="background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Test License</button>
        </div>
      </div>
    `;
    document.body.appendChild(consoleModal);
  }
  
  // Show the modal
  showModal('console-modal');
  
  // Load initial logs
  refreshConsoleLogs();
}

// Refresh console logs
async function refreshConsoleLogs() {
  const output = document.getElementById('console-output');
  if (!output) return;
  
  const logs = [
    '🔧 DevTools Console - Debug Information',
    '=====================================',
    '',
    '📊 App Status:',
    '  ✅ Electron App: Running',
    '  ✅ Renderer Process: Active',
    '  ✅ Main Process: Connected',
    '',
    '🔑 License System:',
    '  🌐 Server: https://pure-analysis.up.railway.app',
    '  📝 Status: Checking...',
    '',
    '💾 Database:',
    '  📁 Location: ~/.anvil/anvil-solo.db',
    '  🔗 Status: Connected',
    '',
    '🌐 Network Connections:',
    '  🔗 Solana RPC: https://mainnet.helius-rpc.com',
    '  🔗 Jupiter API: https://quote-api.jup.ag/v6',
    '  🔗 License Server: https://pure-analysis.up.railway.app',
    '',
    '📈 Available Features:',
    '  ✅ Wallet Management',
    '  ✅ DCA Strategies',
    '  ✅ Token Management',
    '  ✅ License Validation',
    '',
    '🔍 Recent Activity:',
    '  ' + new Date().toLocaleString() + ' - Console opened',
    '',
    '💡 Tips:',
    '  - Check Network tab in DevTools for failed requests',
    '  - Look for red error messages in Console tab',
    '  - Test license connection if activation fails',
    ''
  ];
  
  output.textContent = logs.join('\n');
  
  // Test license connection
  try {
    if (window.electron && window.electron.license) {
      const licenseInfo = await window.electron.license.getInfo();
      const statusLine = `  📝 Status: ${licenseInfo.isValid ? 'Valid' : 'Invalid'} (${licenseInfo.tier})`;
      logs[8] = statusLine;
      output.textContent = logs.join('\n');
    }
  } catch (error) {
    logs[8] = `  📝 Status: Error - ${error.message}`;
    output.textContent = logs.join('\n');
  }
}

// Test license connection
async function testLicenseConnection() {
  const output = document.getElementById('console-output');
  if (!output) return;
  
  try {
    output.textContent += '\n\n🧪 Testing License Connection...\n';
    
    if (window.electron && window.electron.license) {
      const result = await window.electron.license.validate();
      output.textContent += `✅ License validation: ${result ? 'Success' : 'Failed'}\n`;
      
      const info = await window.electron.license.getInfo();
      output.textContent += `📊 License info: ${JSON.stringify(info, null, 2)}\n`;
    } else {
      output.textContent += '❌ License API not available\n';
    }
  } catch (error) {
    output.textContent += `❌ License test failed: ${error.message}\n`;
  }
}

async function loadTradesData() {
  console.log('Loading trades and volume data...');
  
  try {
    if (!window.electron || !window.electron.transaction) {
      console.error('Transaction API not available');
      return;
    }
    
    // Get all transactions
    const result = await window.electron.transaction.getAll();
    
    if (!result.success || !result.transactions) {
      console.error('Failed to load transactions');
      return;
    }
    
    const transactions = result.transactions;
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Calculate stats
    const totalTrades = transactions.length;
    const successfulTrades = transactions.filter(t => t.status === 'confirmed').length;
    const successRate = totalTrades > 0 ? ((successfulTrades / totalTrades) * 100).toFixed(1) : 0;
    
    // Total volume (all time)
    const totalVolume = transactions
      .filter(t => t.status === 'confirmed')
      .reduce((sum, t) => sum + (parseFloat(t.amount_sol) || 0), 0);
    
    // Today's data
    const todayTrades = transactions.filter(t => t.timestamp >= oneDayAgo);
    const todayVolume = todayTrades
      .filter(t => t.status === 'confirmed')
      .reduce((sum, t) => sum + (parseFloat(t.amount_sol) || 0), 0);
    
    const todayBuys = todayTrades.filter(t => t.direction === 'buy' && t.status === 'confirmed');
    const todaySells = todayTrades.filter(t => t.direction === 'sell' && t.status === 'confirmed');
    
    const todayBuysVolume = todayBuys.reduce((sum, t) => sum + (parseFloat(t.amount_sol) || 0), 0);
    const todaySellsVolume = todaySells.reduce((sum, t) => sum + (parseFloat(t.amount_sol) || 0), 0);
    
    const avgTradeSize = totalTrades > 0 ? (totalVolume / totalTrades).toFixed(4) : 0;
    
    // Update summary stats
    document.getElementById('total-trades-count').textContent = totalTrades;
    document.getElementById('total-volume-sol').textContent = `${totalVolume.toFixed(2)} SOL`;
    document.getElementById('today-volume-sol').textContent = `${todayVolume.toFixed(2)} SOL`;
    document.getElementById('success-rate').textContent = `${successRate}%`;
    
    // Update today's activity
    document.getElementById('today-buys').textContent = todayBuys.length;
    document.getElementById('today-sells').textContent = todaySells.length;
    document.getElementById('today-buys-volume').textContent = `${todayBuysVolume.toFixed(3)} SOL`;
    document.getElementById('today-sells-volume').textContent = `${todaySellsVolume.toFixed(3)} SOL`;
    document.getElementById('avg-trade-size').textContent = avgTradeSize;
    
    // Get active strategies count
    if (window.electron.strategy) {
      const strategiesResult = await window.electron.strategy.getAll();
      if (strategiesResult.success) {
        const activeCount = strategiesResult.strategies.filter(s => s.status === 'active').length;
        document.getElementById('active-strategies-count').textContent = activeCount;
      }
    }
    
    // Display recent trades (last 20)
    const recentTradesList = document.getElementById('recent-trades-list');
    if (recentTradesList) {
      const recentTrades = transactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
      
      if (recentTrades.length === 0) {
        recentTradesList.innerHTML = '<div class="empty-state">No trades yet</div>';
      } else {
        recentTradesList.innerHTML = '';
        recentTrades.forEach(trade => {
          const tradeEl = document.createElement('div');
          tradeEl.className = 'activity-item';
          
          const statusIcon = trade.status === 'confirmed' ? '✅' : 
                            trade.status === 'failed' ? '❌' : '⏳';
          const directionIcon = trade.direction === 'buy' ? '📥' : '📤';
          const directionColor = trade.direction === 'buy' ? '#27ae60' : '#e74c3c';
          
          const date = new Date(trade.timestamp).toLocaleString();
          
          tradeEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                  <span>${statusIcon}</span>
                  <span style="color: ${directionColor}; font-weight: bold;">${directionIcon} ${trade.direction.toUpperCase()}</span>
                  <span style="font-size: 13px; color: #fff;">${parseFloat(trade.amount_sol).toFixed(4)} SOL</span>
                </div>
                <div style="font-size: 11px; color: #7f8c8d;">
                  ${date} • Strategy #${trade.strategy_id}
                </div>
                ${trade.transaction_id ? `
                  <div style="font-size: 10px; color: #7f8c8d; margin-top: 2px;">
                    <a href="https://solscan.io/tx/${trade.transaction_id}" target="_blank" style="color: #3498db;">
                      ${trade.transaction_id.substring(0, 16)}...
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
          recentTradesList.appendChild(tradeEl);
        });
      }
    }
    
    // Calculate volume by token (last 7 days)
    const volumeByToken = {};
    transactions
      .filter(t => t.timestamp >= sevenDaysAgo && t.status === 'confirmed')
      .forEach(t => {
        const tokenAddr = t.token_mint || 'Unknown';
        if (!volumeByToken[tokenAddr]) {
          volumeByToken[tokenAddr] = { buys: 0, sells: 0, total: 0, trades: 0 };
        }
        const amount = parseFloat(t.amount_sol) || 0;
        volumeByToken[tokenAddr].total += amount;
        volumeByToken[tokenAddr].trades++;
        if (t.direction === 'buy') {
          volumeByToken[tokenAddr].buys += amount;
        } else {
          volumeByToken[tokenAddr].sells += amount;
        }
      });
    
    // Display volume by token
    const volumeByTokenEl = document.getElementById('volume-by-token');
    if (volumeByTokenEl) {
      const tokens = Object.entries(volumeByToken).sort((a, b) => b[1].total - a[1].total);
      
      if (tokens.length === 0) {
        volumeByTokenEl.innerHTML = '<div class="empty-state">No trades in last 7 days</div>';
      } else {
        // Fetch token names for each address
        volumeByTokenEl.innerHTML = '<div class="empty-state">Loading token details...</div>';
        
        const tokenElements = [];
        for (const [addr, data] of tokens) {
          let tokenDisplay = addr.substring(0, 12) + '...';
          let tokenSymbol = '';
          
          // Try to get token name from Token Manager
          try {
            if (window.electron && window.electron.token) {
              const tokensResult = await window.electron.token.list();
              if (tokensResult.success && tokensResult.tokens) {
                const token = tokensResult.tokens.find(t => t.contract_address === addr);
                if (token) {
                  tokenDisplay = token.name;
                  tokenSymbol = token.symbol ? ` (${token.symbol})` : '';
                }
              }
            }
          } catch (err) {
            console.log('Could not fetch token name for:', addr);
          }
          
          // Try to get token info from Jupiter
          if (tokenDisplay.includes('...')) {
            try {
              if (window.electron && window.electron.jupiter) {
                const tokenInfo = await window.electron.jupiter.getTokenInfo(addr);
                if (tokenInfo && tokenInfo.name) {
                  tokenDisplay = tokenInfo.name;
                  tokenSymbol = tokenInfo.symbol ? ` (${tokenInfo.symbol})` : '';
                }
              }
            } catch (err) {
              console.log('Could not fetch Jupiter token info for:', addr);
            }
          }
          
          tokenElements.push(`
            <div style="border-bottom: 1px solid #34495e; padding: 12px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-size: 13px; color: #fff;">
                  🪙 <strong>${tokenDisplay}${tokenSymbol}</strong>
                </div>
                <div style="font-size: 14px; font-weight: bold;">
                  ${data.total.toFixed(3)} SOL
                </div>
              </div>
              <div style="font-size: 10px; color: #7f8c8d; margin-bottom: 5px;">
                ${addr}
              </div>
              <div style="display: flex; gap: 20px; font-size: 11px; color: #7f8c8d;">
                <span>📈 Buys: ${data.buys.toFixed(3)} SOL</span>
                <span>📉 Sells: ${data.sells.toFixed(3)} SOL</span>
                <span>📊 Trades: ${data.trades}</span>
              </div>
            </div>
          `);
        }
        
        volumeByTokenEl.innerHTML = tokenElements.join('');
      }
    }
    
    console.log('✅ Trades data loaded');
    
  } catch (error) {
    console.error('Error loading trades data:', error);
  }
}

// Export functions for inline handlers
window.showPage = showPage;
// Activity Feed Management
let activityFeedExpanded = false;
let activityFeedItems = [];

// Setup Activity Feed
function setupActivityFeed() {
  const toggleBtn = document.getElementById('activity-feed-toggle');
  const clearBtn = document.getElementById('activity-feed-clear');
  const activityFeed = document.getElementById('activity-feed');
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      activityFeedExpanded = !activityFeedExpanded;
      if (activityFeedExpanded) {
        activityFeed.classList.add('expanded');
        toggleBtn.textContent = '📋';
        toggleBtn.title = 'Collapse Activity Feed';
      } else {
        activityFeed.classList.remove('expanded');
        toggleBtn.textContent = '📋';
        toggleBtn.title = 'Expand Activity Feed';
      }
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearActivityFeed();
    });
  }
  
  // Listen for activity updates from main process
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('activity-update', (event, activity) => {
      addActivityItem(activity);
    });
  }
  
  // Add initial activity item
  addActivityItem({
    type: 'info',
    message: '📊 Activity feed ready - watching for trades...',
    timestamp: new Date()
  });
}

// Add activity item to feed
function addActivityItem(activity) {
  const content = document.getElementById('activity-feed-content');
  if (!content) return;
  
  const timeStr = formatTime(activity.timestamp || new Date());
  const typeClass = activity.type || 'info';
  
  const activityItem = document.createElement('div');
  activityItem.className = `activity-item ${typeClass}`;
  activityItem.innerHTML = `
    <span class="activity-time">${timeStr}</span>
    <span class="activity-message">${activity.message}</span>
  `;
  
  // Add to top of feed
  content.insertBefore(activityItem, content.firstChild);
  
  // Keep only last 50 items
  const items = content.querySelectorAll('.activity-item');
  if (items.length > 50) {
    content.removeChild(items[items.length - 1]);
  }
  
  // Auto-expand feed for important activities
  if (activity.type === 'success' || activity.type === 'error') {
    if (!activityFeedExpanded) {
      const toggleBtn = document.getElementById('activity-feed-toggle');
      if (toggleBtn) {
        toggleBtn.click();
      }
    }
  }
  
  // Store in memory
  activityFeedItems.unshift({
    ...activity,
    timestamp: activity.timestamp || new Date()
  });
  
  // Keep only last 100 in memory
  if (activityFeedItems.length > 100) {
    activityFeedItems = activityFeedItems.slice(0, 100);
  }
}

// Clear activity feed
function clearActivityFeed() {
  const content = document.getElementById('activity-feed-content');
  if (!content) return;
  
  content.innerHTML = '';
  activityFeedItems = [];
  
  // Add initial message
  addActivityItem({
    type: 'info',
    message: '📊 Activity feed cleared',
    timestamp: new Date()
  });
}

// Format time for display
function formatTime(timestamp) {
  const now = new Date();
  const diff = now - timestamp;
  
  if (diff < 1000) return 'now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Strategy deletion functions
let strategyToDelete = null;

// Show delete confirmation modal
function confirmDeleteStrategy(strategyId, strategyType, typeLabel) {
  strategyToDelete = { id: strategyId, type: strategyType, label: typeLabel };
  
  // Remove existing modal if it exists to ensure clean state
  const existingModal = document.getElementById('delete-strategy-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create fresh delete confirmation modal
  const deleteModal = document.createElement('div');
  deleteModal.id = 'delete-strategy-modal';
  deleteModal.className = 'modal';
  deleteModal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <h2>🗑️ Delete Strategy</h2>
      <div style="margin: 20px 0;">
        <p style="color: #e74c3c; font-weight: bold; margin-bottom: 15px;">
          ⚠️ WARNING: This action cannot be undone!
        </p>
        <p>Are you sure you want to permanently delete this <strong>${typeLabel}</strong> strategy?</p>
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 10px;">
          This will remove the strategy from your dashboard and cannot be recovered.
        </p>
      </div>
      <div class="form-actions">
        <button id="delete-strategy-cancel-btn" class="btn btn-secondary">Cancel</button>
        <button id="delete-strategy-confirm-btn" class="btn btn-danger">🗑️ Delete Permanently</button>
      </div>
    </div>
  `;
  document.body.appendChild(deleteModal);
  
  // Add event listeners (fresh for each modal)
  document.getElementById('delete-strategy-cancel-btn').addEventListener('click', () => {
    hideModal('delete-strategy-modal');
    deleteModal.remove();
    strategyToDelete = null;
  });
  
  document.getElementById('delete-strategy-confirm-btn').addEventListener('click', async () => {
    if (strategyToDelete) {
      try {
        await deleteStrategy(strategyToDelete.id);
        // Close modal and refresh after successful deletion
        hideModal('delete-strategy-modal');
        deleteModal.remove();
        strategyToDelete = null;
        // Refresh the dashboard
        await loadStrategies();
      } catch (error) {
        console.error('Error in delete confirmation:', error);
        alert('Failed to delete strategy: ' + error.message);
      }
    }
  });
  
  // Show the modal
  showModal('delete-strategy-modal');
}

// Delete strategy function
async function deleteStrategy(strategyId) {
  try {
    console.log(`Deleting strategy #${strategyId}...`);
    
    if (!window.electron || !window.electron.strategy) {
      throw new Error('Strategy API not available');
    }
    
    // Call backend to delete strategy
    const result = await window.electron.strategy.delete(strategyId);
    
    if (result.success) {
      console.log(`✅ Strategy #${strategyId} deleted successfully`);
      
      // Show success message
      showStatusMessage(`✅ Strategy #${strategyId} deleted successfully`, 'success');
      
      // Navigate to dashboard
      showPage('dashboard');
      
      // Reload strategies to update the dashboard
      await loadStrategies();
      
      // Also reload dashboard stats
      await loadDashboardStats();
      
    } else {
      throw new Error(result.error || 'Failed to delete strategy');
    }
    
  } catch (error) {
    console.error('❌ Failed to delete strategy:', error);
    showStatusMessage(`❌ Failed to delete strategy: ${error.message}`, 'error');
  }
}

window.copyToClipboard = copyToClipboard;
window.startStrategy = startStrategy;
window.pauseStrategy = pauseStrategy;
window.stopStrategy = stopStrategy;
window.deleteStrategy = deleteStrategy;
window.deleteToken = deleteToken;
window.selectJupiterToken = selectJupiterToken;
window.confirmDeleteStrategy = confirmDeleteStrategy;
