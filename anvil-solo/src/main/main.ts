import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import { initializeDatabase, closeDatabase } from './database/schema';
import { WalletManager } from './wallet/manager';
import { JupiterClient } from './jupiter/client';
import { LicenseManager } from './license/manager';
import { FeeManager } from './fees/manager';
import { DCAStrategy, DCAConfig } from './strategies/dca';
import { RatioStrategy, RatioConfig } from './strategies/ratio';
import { BundleStrategy, BundleConfig } from './strategies/bundle';

// Global instances
let mainWindow: BrowserWindow | null = null;
let walletManager: WalletManager | null = null;
let jupiterClient: JupiterClient | null = null;
let licenseManager: LicenseManager | null = null;
let feeManager: FeeManager | null = null;
const activeStrategies = new Map<number, DCAStrategy | RatioStrategy | BundleStrategy>();

// Default RPC URL (can be changed in settings)
const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';

// Configure auto-updater
autoUpdater.autoDownload = false; // Ask user before downloading
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('🔄 Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log(`✨ Update available: v${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('✅ App is up to date');
});

autoUpdater.on('error', (err) => {
  console.error('❌ Update error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  const message = `Downloaded ${progressObj.percent.toFixed(2)}%`;
  console.log(message);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('✅ Update downloaded, will install on quit');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  // Load the HTML file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('✅ Main window created');
}

/**
 * Initialize application
 */
async function initializeApp() {
  console.log('🚀 Initializing Anvil Solo...');

  // Initialize database
  initializeDatabase();
  console.log('✅ Database initialized');

  // Initialize Jupiter client
  jupiterClient = new JupiterClient(DEFAULT_RPC_URL);
  console.log('✅ Jupiter client initialized');

  // Initialize wallet manager
  walletManager = new WalletManager(DEFAULT_RPC_URL);
  console.log('✅ Wallet manager initialized');

  // Initialize license manager
  licenseManager = new LicenseManager();
  const licenseInfo = licenseManager.getLicenseInfo();
  console.log(`✅ License: ${licenseInfo.tier.toUpperCase()} tier`);

  // Initialize fee manager
  feeManager = new FeeManager(DEFAULT_RPC_URL);
  const feeConfig = feeManager.getFeeConfig();
  if (feeConfig.feeEnabled && feeConfig.feeWalletAddress) {
    console.log(`💰 Transaction fees: ${feeConfig.feePercentage}% → ${feeConfig.feeWalletAddress.substring(0, 8)}...`);
  }

  // Check Jupiter API health
  const jupiterHealthy = await jupiterClient.healthCheck();
  console.log(jupiterHealthy ? '✅ Jupiter API accessible' : '⚠️  Jupiter API not accessible');
  
  // Load active and paused strategies from database into memory
  await loadActiveStrategiesFromDatabase();
}

/**
 * Load active and paused strategies from database into memory
 */
async function loadActiveStrategiesFromDatabase() {
  try {
    const db = require('./database/schema').getDatabase();
    const strategies = db.prepare(`
      SELECT * FROM strategies 
      WHERE status IN ('active', 'paused')
      ORDER BY id ASC
    `).all();
    
    console.log(`🔄 Loading ${strategies.length} active/paused strategies from database...`);
    
    for (const s of strategies) {
      const config = JSON.parse(s.config);
      const strategyId = s.id;
      
      try {
        if (s.type === 'dca') {
          const strategy = new DCAStrategy(strategyId, config, jupiterClient!, walletManager!);
          activeStrategies.set(strategyId, strategy);
          
          // Auto-start if it was active
          if (s.status === 'active') {
            await strategy.start();
          }
        } else if (s.type === 'ratio') {
          const strategy = new RatioStrategy(strategyId, config, jupiterClient!, walletManager!);
          activeStrategies.set(strategyId, strategy);
          
          if (s.status === 'active') {
            await strategy.start();
          }
        } else if (s.type === 'bundle') {
          const strategy = new BundleStrategy(strategyId, config, jupiterClient!, walletManager!);
          activeStrategies.set(strategyId, strategy);
          
          if (s.status === 'active') {
            await strategy.start();
          }
        }
        
        console.log(`✅ Loaded ${s.type} strategy #${strategyId} (${s.status})`);
      } catch (error: any) {
        console.error(`❌ Failed to load strategy #${strategyId}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error('❌ Error loading strategies from database:', error);
  }
}

// ============================================================================
// IPC HANDLERS - Wallet Management
// ============================================================================

ipcMain.handle('wallet:import', async (event, privateKey: string, password: string, label?: string) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const publicKey = await walletManager.importWallet(privateKey, password, label);
    return { success: true, publicKey };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:generate', async (event, password: string, label?: string) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const publicKey = await walletManager.generateWallet(password, label);
    return { success: true, publicKey };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:unlock', async (event, password: string) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const unlocked = await walletManager.unlockWallet(password);
    return { success: unlocked };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:lock', async (event) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    walletManager.lock();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:getBalance', async (event, publicKey?: string) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const balance = await walletManager.getBalance(publicKey);
    return { success: true, balance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:getTokenBalance', async (event, walletPubkey: string, tokenMint: string) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const balance = await walletManager.getTokenBalance(walletPubkey, tokenMint);
    return { success: true, balance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:getAll', async (event) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const wallets = walletManager.getAllWallets();
    return { success: true, wallets };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:generateDerived', async (event, count: number) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const publicKeys = await walletManager.generateDerivedWallets(count);
    return { success: true, publicKeys };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:withdrawSol', async (event, fromPublicKey: string, toAddress: string, amount: number) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const signature = await walletManager.withdrawSol(fromPublicKey, toAddress, amount);
    return { success: true, signature };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:withdrawToken', async (event, fromPublicKey: string, toAddress: string, tokenMint: string, amount: number) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const signature = await walletManager.withdrawToken(fromPublicKey, toAddress, tokenMint, amount);
    return { success: true, signature };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:getAllWithBalances', async (event) => {
  try {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    const wallets = walletManager.getAllWallets();
    
    // Get balances for each wallet
    const walletsWithBalances = await Promise.all(
      wallets.map(async (wallet) => {
        const balance = await walletManager!.getBalance(wallet.publicKey);
        return { ...wallet, balance };
      })
    );
    
    return { success: true, wallets: walletsWithBalances };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Token Management
// ============================================================================

ipcMain.handle('tokens:add', async (event, tokenData: { name: string; symbol?: string; contractAddress: string; decimals?: number; notes?: string }) => {
  try {
    const db = require('./database/schema').getDatabase();
    
    let validationWarning = null;
    
    // Try to validate with Jupiter (but don't fail if it's not accessible)
    if (jupiterClient) {
      try {
        const isValid = await jupiterClient.validateToken(tokenData.contractAddress);
        if (!isValid) {
          validationWarning = 'Token not found on Jupiter (may not be tradable)';
        } else {
          // Try to get token info from Jupiter
          try {
            const tokenInfo = await jupiterClient.getTokenInfo(tokenData.contractAddress);
            if (tokenInfo) {
              tokenData.symbol = tokenData.symbol || tokenInfo.symbol;
              tokenData.decimals = tokenData.decimals || tokenInfo.decimals;
            }
          } catch (e) {
            // Continue even if token info fetch fails
          }
        }
      } catch (error: any) {
        console.log('Jupiter validation failed (API not accessible):', error.message);
        validationWarning = 'Could not validate with Jupiter (API not accessible)';
      }
    }
    
    const result = db.prepare(`
      INSERT INTO tokens (name, symbol, contract_address, decimals, notes, added_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      tokenData.name,
      tokenData.symbol || null,
      tokenData.contractAddress,
      tokenData.decimals || 9,
      tokenData.notes || null,
      Date.now()
    );
    
    return { 
      success: true, 
      tokenId: result.lastInsertRowid,
      warning: validationWarning
    };
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      return { success: false, error: 'Token already exists in your list' };
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tokens:getAll', async (event) => {
  try {
    const db = require('./database/schema').getDatabase();
    const tokens = db.prepare('SELECT * FROM tokens ORDER BY is_favorite DESC, name ASC').all();
    return { success: true, tokens };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tokens:delete', async (event, tokenId: number) => {
  try {
    const db = require('./database/schema').getDatabase();
    db.prepare('DELETE FROM tokens WHERE id = ?').run(tokenId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tokens:toggleFavorite', async (event, tokenId: number) => {
  try {
    const db = require('./database/schema').getDatabase();
    db.prepare(`
      UPDATE tokens 
      SET is_favorite = NOT is_favorite 
      WHERE id = ?
    `).run(tokenId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tokens:update', async (event, tokenId: number, updates: { name?: string; symbol?: string; notes?: string }) => {
  try {
    const db = require('./database/schema').getDatabase();
    const setParts = [];
    const values = [];
    
    if (updates.name !== undefined) {
      setParts.push('name = ?');
      values.push(updates.name);
    }
    if (updates.symbol !== undefined) {
      setParts.push('symbol = ?');
      values.push(updates.symbol);
    }
    if (updates.notes !== undefined) {
      setParts.push('notes = ?');
      values.push(updates.notes);
    }
    
    if (setParts.length > 0) {
      values.push(tokenId);
      db.prepare(`UPDATE tokens SET ${setParts.join(', ')} WHERE id = ?`).run(...values);
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Jupiter / Token Info
// ============================================================================

ipcMain.handle('jupiter:getTokenInfo', async (event, mintAddress: string) => {
  try {
    if (!jupiterClient) throw new Error('Jupiter client not initialized');
    const tokenInfo = await jupiterClient.getTokenInfo(mintAddress);
    return { success: true, tokenInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('jupiter:validateToken', async (event, mintAddress: string) => {
  try {
    if (!jupiterClient) throw new Error('Jupiter client not initialized');
    const isValid = await jupiterClient.validateToken(mintAddress);
    return { success: true, isValid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('jupiter:getPrice', async (event, mintAddress: string) => {
  try {
    if (!jupiterClient) throw new Error('Jupiter client not initialized');
    const price = await jupiterClient.getTokenPriceInSol(mintAddress);
    return { success: true, price };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - License Management
// ============================================================================

ipcMain.handle('license:getInfo', async (event) => {
  try {
    if (!licenseManager) throw new Error('License manager not initialized');
    const info = licenseManager.getLicenseInfo();
    return { success: true, info };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:activate', async (event, licenseKey: string) => {
  try {
    if (!licenseManager) throw new Error('License manager not initialized');
    const result = await licenseManager.activateLicense(licenseKey);
    return result;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('license:validate', async (event) => {
  try {
    if (!licenseManager) throw new Error('License manager not initialized');
    const isValid = await licenseManager.validateLicense();
    const info = licenseManager.getLicenseInfo();
    return { success: true, isValid, info };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:deactivate', async (event) => {
  try {
    if (!licenseManager) throw new Error('License manager not initialized');
    const result = await licenseManager.deactivateLicense();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('license:getHwid', async (event) => {
  try {
    if (!licenseManager) throw new Error('License manager not initialized');
    const hwid = licenseManager.getHwid();
    return { success: true, hwid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Strategy Management
// ============================================================================

ipcMain.handle('strategies:getAll', async (event) => {
  try {
    const db = require('./database/schema').getDatabase();
    
    // Debug: log all strategies
    const allStrategies = db.prepare('SELECT id, type, status FROM strategies').all();
    console.log('📊 All strategies in DB:', allStrategies);
    
    const strategies = db.prepare(`
      SELECT 
        s.*,
        t.name as token_name,
        t.symbol as token_symbol
      FROM strategies s
      LEFT JOIN tokens t ON s.token_address = t.contract_address
      WHERE s.status IN ('active', 'paused')
      ORDER BY s.created_at DESC
    `).all();
    
    console.log(`📊 Returning ${strategies.length} active/paused strategies`);
    
    // Parse config JSON for each strategy
    const parsedStrategies = strategies.map((s: any) => ({
      ...s,
      config: JSON.parse(s.config),
      progress: s.progress ? JSON.parse(s.progress) : null,
      token_name: s.token_name || null,
      token_symbol: s.token_symbol || null
    }));
    
    return { success: true, strategies: parsedStrategies };
  } catch (error: any) {
    console.error('❌ Error getting strategies:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:get', async (event, strategyId: number) => {
  try {
    const db = require('./database/schema').getDatabase();
    const strategy = db.prepare(`
      SELECT 
        s.*,
        t.name as token_name,
        t.symbol as token_symbol
      FROM strategies s
      LEFT JOIN tokens t ON s.token_address = t.contract_address
      WHERE s.id = ?
    `).get(strategyId);
    
    if (!strategy) {
      return { success: false, error: 'Strategy not found' };
    }
    
    const parsed = {
      ...strategy,
      config: JSON.parse(strategy.config),
      progress: strategy.progress ? JSON.parse(strategy.progress) : null,
      token_name: strategy.token_name || null,
      token_symbol: strategy.token_symbol || null
    };
    
    return { success: true, strategy: parsed };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - DCA Strategy
// ============================================================================

ipcMain.handle('strategy:dca:create', async (event, config: DCAConfig) => {
  try {
    if (!walletManager || !jupiterClient) throw new Error('Services not initialized');
    
    // Save strategy to database
    const db = require('./database/schema').getDatabase();
    const result = db.prepare(`
      INSERT INTO strategies (type, token_address, config, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('dca', config.tokenAddress, JSON.stringify(config), 'stopped', Date.now(), Date.now());
    
    const strategyId = result.lastInsertRowid as number;
    
    // Create and store strategy instance
    const strategy = new DCAStrategy(strategyId, config, jupiterClient, walletManager);
    activeStrategies.set(strategyId, strategy);
    
    return { success: true, strategyId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:dca:start', async (event, strategyId: number) => {
  try {
    const strategy = activeStrategies.get(strategyId) as DCAStrategy;
    if (!strategy) throw new Error('Strategy not found');
    await strategy.start();
    
    // Update database status to active
    const db = require('./database/schema').getDatabase();
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('active', Date.now(), strategyId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:dca:pause', async (event, strategyId: number) => {
  try {
    const strategy = activeStrategies.get(strategyId) as DCAStrategy;
    if (!strategy) throw new Error('Strategy not found');
    await strategy.pause();
    
    // Update database status to paused
    const db = require('./database/schema').getDatabase();
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('paused', Date.now(), strategyId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:dca:stop', async (event, strategyId: number) => {
  try {
    console.log(`⏹️ Stopping DCA strategy #${strategyId}`);
    const strategy = activeStrategies.get(strategyId) as DCAStrategy;
    if (!strategy) {
      console.log(`⚠️ Strategy #${strategyId} not found in activeStrategies`);
    } else {
      await strategy.stop();
      activeStrategies.delete(strategyId);
    }
    
    // Update database status to stopped
    const db = require('./database/schema').getDatabase();
    const result = db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('stopped', Date.now(), strategyId);
    
    console.log(`✅ Strategy #${strategyId} marked as stopped in DB (${result.changes} rows updated)`);
    
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error stopping strategy #${strategyId}:`, error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Ratio Strategy
// ============================================================================

ipcMain.handle('strategy:ratio:create', async (event, config) => {
  try {
    if (!walletManager || !jupiterClient) throw new Error('Services not initialized');
    
    const db = require('./database/schema').getDatabase();
    const result = db.prepare(`
      INSERT INTO strategies (type, token_address, config, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('ratio', config.tokenAddress, JSON.stringify(config), 'stopped', Date.now(), Date.now());
    
    const strategyId = result.lastInsertRowid as number;
    
    const strategy = new RatioStrategy(strategyId, config, jupiterClient, walletManager);
    activeStrategies.set(strategyId, strategy);
    
    return { success: true, strategyId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:ratio:start', async (event, strategyId: number) => {
  try {
    const strategy = activeStrategies.get(strategyId) as RatioStrategy;
    if (!strategy) throw new Error('Strategy not found');
    await strategy.start();
    
    // Update database status to active
    const db = require('./database/schema').getDatabase();
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('active', Date.now(), strategyId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:ratio:pause', async (event, strategyId: number) => {
  try {
    const strategy = activeStrategies.get(strategyId) as RatioStrategy;
    if (!strategy) throw new Error('Strategy not found');
    await strategy.pause();
    
    // Update database status to paused
    const db = require('./database/schema').getDatabase();
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('paused', Date.now(), strategyId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:ratio:stop', async (event, strategyId: number) => {
  try {
    console.log(`⏹️ Stopping Ratio strategy #${strategyId}`);
    const strategy = activeStrategies.get(strategyId) as RatioStrategy;
    if (!strategy) {
      console.log(`⚠️ Strategy #${strategyId} not found in activeStrategies`);
    } else {
      await strategy.stop();
      activeStrategies.delete(strategyId);
    }
    
    // Update database status to stopped
    const db = require('./database/schema').getDatabase();
    const result = db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('stopped', Date.now(), strategyId);
    
    console.log(`✅ Strategy #${strategyId} marked as stopped in DB (${result.changes} rows updated)`);
    
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error stopping strategy #${strategyId}:`, error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Bundle Strategy
// ============================================================================

ipcMain.handle('strategy:bundle:create', async (event, config) => {
  try {
    if (!walletManager || !jupiterClient) throw new Error('Services not initialized');
    
    const db = require('./database/schema').getDatabase();
    const result = db.prepare(`
      INSERT INTO strategies (type, token_address, config, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('bundle', config.tokenAddress, JSON.stringify(config), 'stopped', Date.now(), Date.now());
    
    const strategyId = result.lastInsertRowid as number;
    
    const strategy = new BundleStrategy(strategyId, config, jupiterClient, walletManager);
    activeStrategies.set(strategyId, strategy);
    
    return { success: true, strategyId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:bundle:start', async (event, strategyId: number) => {
  try {
    const strategy = activeStrategies.get(strategyId) as BundleStrategy;
    if (!strategy) throw new Error('Strategy not found');
    await strategy.start();
    
    // Update database status to active
    const db = require('./database/schema').getDatabase();
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('active', Date.now(), strategyId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:bundle:pause', async (event, strategyId: number) => {
  try {
    const strategy = activeStrategies.get(strategyId) as BundleStrategy;
    if (!strategy) throw new Error('Strategy not found');
    await strategy.pause();
    
    // Update database status to paused
    const db = require('./database/schema').getDatabase();
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('paused', Date.now(), strategyId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:bundle:stop', async (event, strategyId: number) => {
  try {
    console.log(`⏹️ Stopping Bundle strategy #${strategyId}`);
    const strategy = activeStrategies.get(strategyId) as BundleStrategy;
    if (!strategy) {
      console.log(`⚠️ Strategy #${strategyId} not found in activeStrategies`);
    } else {
      await strategy.stop();
      activeStrategies.delete(strategyId);
    }
    
    // Update database status to stopped
    const db = require('./database/schema').getDatabase();
    const result = db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('stopped', Date.now(), strategyId);
    
    console.log(`✅ Strategy #${strategyId} marked as stopped in DB (${result.changes} rows updated)`);
    
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error stopping strategy #${strategyId}:`, error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Fee Management
// ============================================================================

ipcMain.handle('fees:getConfig', async (event) => {
  try {
    if (!feeManager) throw new Error('Fee manager not initialized');
    const config = feeManager.getFeeConfig();
    return { success: true, config };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fees:updateConfig', async (event, config: any) => {
  try {
    if (!feeManager) throw new Error('Fee manager not initialized');
    feeManager.updateFeeConfig(config);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fees:getStats', async (event) => {
  try {
    if (!feeManager) throw new Error('Fee manager not initialized');
    const stats = feeManager.getTotalFeesCollected();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Auto-Updater
// ============================================================================

ipcMain.handle('updater:checkForUpdates', async (event) => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater:downloadUpdate', async (event) => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater:quitAndInstall', async (event) => {
  autoUpdater.quitAndInstall(false, true);
  return { success: true };
});

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(async () => {
  await initializeApp();
  createWindow();

  // Check for updates after a short delay
  setTimeout(() => {
    if (process.env.NODE_ENV !== 'development') {
      autoUpdater.checkForUpdates();
    }
  }, 5000); // Wait 5 seconds after startup

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop all active strategies
  activeStrategies.forEach(strategy => {
    if ('stop' in strategy) {
      strategy.stop();
    }
  });
  
  // Close database
  closeDatabase();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup
  activeStrategies.forEach(strategy => {
    if ('stop' in strategy) {
      strategy.stop();
    }
  });
  closeDatabase();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

console.log('✅ Anvil Solo started');

