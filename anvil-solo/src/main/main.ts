import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import dns from 'dns';
import { initializeDatabase, closeDatabase } from './database/schema';
import { WalletManager } from './wallet/manager';
import { JupiterClient } from './jupiter/client';
import { LicenseManager } from './license/manager';
import { FeeManager } from './fees/manager';
import { DCAStrategy, DCAConfig } from './strategies/dca';
import { RatioStrategy, RatioConfig } from './strategies/ratio';
import { BundleStrategy, BundleConfig } from './strategies/bundle';

// Configure DNS servers for better reliability across all installations
// Uses Google DNS (8.8.8.8, 8.8.4.4) and Cloudflare DNS (1.1.1.1, 1.0.0.1)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
console.log('🌐 DNS servers configured: Google DNS + Cloudflare DNS');

// Global instances
let mainWindow: BrowserWindow | null = null;
let walletManager: WalletManager | null = null;
let jupiterClient: JupiterClient | null = null;
let licenseManager: LicenseManager | null = null;
let feeManager: FeeManager | null = null;
const activeStrategies = new Map<number, DCAStrategy | RatioStrategy | BundleStrategy>();

// Activity Log Helper
function logActivity(params: {
  eventType: string;
  category: 'strategy' | 'trade' | 'wallet' | 'system';
  title: string;
  description?: string;
  strategyId?: number;
  walletId?: number;
  transactionId?: number;
  metadata?: any;
  severity?: 'info' | 'success' | 'warning' | 'error';
}) {
  // Send activity update to renderer for real-time feed
  if (mainWindow) {
    const activityMessage = `${params.title}${params.description ? ` - ${params.description}` : ''}`;
    mainWindow.webContents.send('activity-update', {
      type: params.severity || 'info',
      message: activityMessage,
      timestamp: new Date(),
      category: params.category,
      eventType: params.eventType,
      strategyId: params.strategyId
    });
  }
  try {
    const db = require('./database/schema').getDatabase();
    db.prepare(`
      INSERT INTO activity_logs (event_type, category, title, description, strategy_id, wallet_id, transaction_id, metadata, severity, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      params.eventType,
      params.category,
      params.title,
      params.description || null,
      params.strategyId || null,
      params.walletId || null,
      params.transactionId || null,
      params.metadata ? JSON.stringify(params.metadata) : null,
      params.severity || 'info',
      Date.now()
    );
    
    // Send to frontend if window is available
    if (mainWindow) {
      mainWindow.webContents.send('activity-log-update', {
        ...params,
        timestamp: Date.now()
      });
    }
  } catch (error: any) {
    console.error('❌ Failed to log activity:', error.message);
  }
}

// Default RPC URL (can be changed in settings)
const DEFAULT_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=18937bea-7c1f-4930-9474-7c3b715235de';

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

  // Open DevTools only in development mode
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

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
          const strategy = new DCAStrategy(strategyId, config, jupiterClient!, walletManager!, feeManager!);
          activeStrategies.set(strategyId, strategy);
          
          // Auto-start if it was active
          if (s.status === 'active') {
            await strategy.start();
          }
        } else if (s.type === 'ratio') {
          const { RatioSimpleStrategy } = require('./strategies/ratio-simple');
          const strategy = new RatioSimpleStrategy(strategyId, config, jupiterClient!, walletManager!, feeManager!);
          activeStrategies.set(strategyId, strategy);
          
          if (s.status === 'active') {
            await strategy.start();
          }
        } else if (s.type === 'bundle') {
          const { BundleReconcileStrategy } = require('./strategies/bundle-reconcile');
          const strategy = new BundleReconcileStrategy(strategyId, config, jupiterClient!, walletManager!, feeManager!);
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
    
    // Get balances (SOL + tokens) for each wallet
    const walletsWithBalances = await Promise.all(
      wallets.map(async (wallet) => {
        const [balance, tokens] = await Promise.all([
          walletManager!.getBalance(wallet.publicKey),
          walletManager!.getAllTokenBalances(wallet.publicKey)
        ]);
        return { ...wallet, balance, tokens };
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

ipcMain.handle('jupiter:getTokenData', async (event, mintAddress: string) => {
  try {
    if (!jupiterClient) throw new Error('Jupiter client not initialized');
    console.log(`Fetching comprehensive token data for: ${mintAddress}`);
    const tokenData = await jupiterClient.getTokenData(mintAddress);
    return { success: true, ...tokenData };
  } catch (error: any) {
    console.error('Error fetching token data:', error);
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

ipcMain.handle('license:testConnection', async (event) => {
  try {
    const https = require('https');
    const LICENSE_API_URL = process.env.LICENSE_API_URL || 'https://anvil.shoguncrypto.com';
    
    console.log(`Testing connection to: ${LICENSE_API_URL}/api/license/test`);
    
    return new Promise((resolve) => {
      const start = Date.now();
      
      const req = https.get(`${LICENSE_API_URL}/api/license/test`, (res: any) => {
        const time = Date.now() - start;
        let data = '';
        
        res.on('data', (chunk: any) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`Connection test response (${res.statusCode}): ${data}`);
          resolve({
            success: true,
            connected: true,
            responseTime: time,
            statusCode: res.statusCode,
            data: data
          });
        });
      });
      
      req.on('error', (error: any) => {
        console.error('Connection test error:', error);
        resolve({
          success: true,
          connected: false,
          error: error.message
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: true,
          connected: false,
          error: 'Connection timeout (10s)'
        });
      });
    });
  } catch (error: any) {
    console.error('License test connection error:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - DevTools
// ============================================================================

ipcMain.handle('devtools:open', async (event) => {
  try {
    if (mainWindow) {
      // Open DevTools and focus on Console tab
      mainWindow.webContents.openDevTools();
      
      // Send recent console logs to renderer
      const logs = [
        '🔧 DevTools opened via IPC',
        '📊 App Status: Running',
        '🔑 License Server: https://pure-analysis.up.railway.app',
        '💾 Database: Connected',
        '🌐 RPC: https://mainnet.helius-rpc.com',
        '📈 Jupiter API: https://quote-api.jup.ag/v6'
      ];
      
      // Send logs to renderer for display
      mainWindow.webContents.send('devtools-logs', logs);
      
      console.log('🔧 DevTools opened via IPC');
      return { success: true };
    } else {
      throw new Error('Main window not available');
    }
  } catch (error: any) {
    console.error('❌ Failed to open DevTools:', error.message);
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
      WHERE s.status != 'archived'
      ORDER BY s.created_at ASC
    `).all();
    
    console.log(`📊 Returning ${strategies.length} strateg(ies)`);
    
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

// ============================================================================
// IPC HANDLERS - Transaction History
// ============================================================================

ipcMain.handle('transactions:getAll', async (event) => {
  try {
    const db = require('./database/schema').getDatabase();
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    
    const transactions = db.prepare(`
      SELECT 
        id,
        strategy_id,
        signature as transaction_id,
        type as direction,
        input_token,
        output_token,
        input_amount,
        output_amount,
        CASE 
          WHEN input_token = '${SOL_MINT}' THEN input_amount
          WHEN output_token = '${SOL_MINT}' THEN output_amount
          ELSE 0
        END as amount_sol,
        dex_used,
        price,
        status,
        error,
        timestamp,
        CASE 
          WHEN type = 'buy' THEN output_token 
          ELSE input_token 
        END as token_mint
      FROM transactions
      ORDER BY timestamp DESC
      LIMIT 1000
    `).all();
    
    console.log(`📊 Retrieved ${transactions.length} transactions from database`);
    
    // Debug: show first transaction if exists
    if (transactions.length > 0) {
      console.log('First transaction:', {
        id: transactions[0].id,
        direction: transactions[0].direction,
        token_mint: transactions[0].token_mint,
        amount_sol: transactions[0].amount_sol,
        status: transactions[0].status
      });
    }
    
    return { success: true, transactions };
  } catch (error: any) {
    console.error('❌ Error getting transactions:', error);
    return { success: false, error: error.message, transactions: [] };
  }
});

ipcMain.handle('transactions:getByStrategy', async (event, strategyId: number) => {
  try {
    const db = require('./database/schema').getDatabase();
    
    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE strategy_id = ?
      ORDER BY timestamp DESC
    `).all(strategyId);
    
    return { success: true, transactions };
  } catch (error: any) {
    console.error('❌ Error getting strategy transactions:', error);
    return { success: false, error: error.message, transactions: [] };
  }
});

ipcMain.handle('transactions:getStats', async (event) => {
  try {
    const db = require('./database/schema').getDatabase();
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    
    // Total trades
    const totalTrades = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
    
    // Successful trades
    const successfulTrades = db.prepare(`
      SELECT COUNT(*) as count FROM transactions WHERE status = 'confirmed'
    `).get();
    
    // Total volume in SOL (both buy and sell)
    // For BUY: SOL is input_token, count input_amount
    // For SELL: SOL is output_token, count output_amount
    const totalVolume = db.prepare(`
      SELECT SUM(
        CASE 
          WHEN input_token = ? THEN input_amount
          WHEN output_token = ? THEN output_amount
          ELSE 0
        END
      ) as volume 
      FROM transactions 
      WHERE status = 'confirmed'
    `).get(SOL_MINT, SOL_MINT);
    
    // Today's volume (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const todayVolume = db.prepare(`
      SELECT SUM(
        CASE 
          WHEN input_token = ? THEN input_amount
          WHEN output_token = ? THEN output_amount
          ELSE 0
        END
      ) as volume 
      FROM transactions 
      WHERE status = 'confirmed' AND timestamp >= ?
    `).get(SOL_MINT, SOL_MINT, oneDayAgo);
    
    return {
      success: true,
      stats: {
        totalTrades: totalTrades.count || 0,
        successfulTrades: successfulTrades.count || 0,
        totalVolume: totalVolume.volume || 0,
        todayVolume: todayVolume.volume || 0
      }
    };
  } catch (error: any) {
    console.error('❌ Error getting transaction stats:', error);
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
    const strategy = new DCAStrategy(strategyId, config, jupiterClient, walletManager, feeManager!);
    activeStrategies.set(strategyId, strategy);
    
    // Log activity
    logActivity({
      eventType: 'strategy_created',
      category: 'strategy',
      title: `DCA Strategy #${strategyId} Created`,
      description: `${config.direction === 'buy' ? 'Buy' : 'Sell'} ${config.totalAmount} over ${config.numberOfOrders} orders`,
      strategyId,
      metadata: {
        type: 'dca',
        direction: config.direction,
        totalAmount: config.totalAmount,
        numberOfOrders: config.numberOfOrders,
        frequency: config.frequency,
        tokenAddress: config.tokenAddress
      },
      severity: 'success'
    });
    
    return { success: true, strategyId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:dca:start', async (event, strategyId: number) => {
  try {
    if (!walletManager || !jupiterClient) throw new Error('Services not initialized');
    
    // Get strategy config from database
    const db = require('./database/schema').getDatabase();
    const strategyData = db.prepare('SELECT config FROM strategies WHERE id = ?').get(strategyId) as any;
    if (!strategyData) throw new Error('Strategy not found in database');
    
    const config = JSON.parse(strategyData.config) as DCAConfig;
    
    // Get or create strategy instance
    let strategy = activeStrategies.get(strategyId) as DCAStrategy;
    if (!strategy) {
      console.log(`   Creating new DCA strategy instance for #${strategyId}`);
      strategy = new DCAStrategy(strategyId, config, jupiterClient, walletManager, feeManager!);
      activeStrategies.set(strategyId, strategy);
    }
    
    // Check wallet balance
    // Get the wallet to be used for this strategy (or default to main wallet)
    let walletToUse: any;
    if (config.walletId) {
      // Find wallet by ID or public key
      walletToUse = walletManager.getAllWallets().find(w => 
        w.id === Number(config.walletId) || w.publicKey === config.walletId
      );
      if (!walletToUse) {
        throw new Error(`Wallet not found: ${config.walletId}`);
      }
    } else {
      // Use main wallet
      walletToUse = walletManager.getAllWallets().find(w => w.isMain);
      if (!walletToUse) throw new Error('No main wallet found');
    }
    
    const balance = await walletManager.getBalance(walletToUse.publicKey);
    
    // Validate balance based on direction
    if (config.direction === 'buy') {
      const requiredSOL = config.totalAmount + 0.01; // Add buffer for fees
      if (balance < requiredSOL) {
        throw new Error(`Insufficient SOL balance in wallet ${walletToUse.label || walletToUse.publicKey.substring(0, 8)}. Required: ${requiredSOL.toFixed(4)} SOL, Available: ${balance.toFixed(4)} SOL`);
      }
    } else {
      // For sell, check token balance
      const tokenBalance = await walletManager.getTokenBalance(walletToUse.publicKey, config.tokenAddress);
      if (tokenBalance < config.totalAmount) {
        throw new Error(`Insufficient token balance in wallet ${walletToUse.label || walletToUse.publicKey.substring(0, 8)}. Required: ${config.totalAmount}, Available: ${tokenBalance}`);
      }
    }
    
    // Balance is sufficient, start strategy
    await strategy.start();
    
    // Update database status to active
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('active', Date.now(), strategyId);
    
    // Log activity
    logActivity({
      eventType: 'strategy_started',
      category: 'strategy',
      title: `DCA Strategy #${strategyId} Started`,
      description: 'Strategy is now actively executing trades',
      strategyId,
      severity: 'success'
    });
    
    return { success: true };
  } catch (error: any) {
    // Log failure to activity log
    logActivity({
      eventType: 'strategy_start_failed',
      category: 'strategy',
      title: `❌ Failed to Start Strategy #${strategyId}`,
      description: error.message,
      strategyId,
      severity: 'error'
    });
    
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
    
    // Log activity
    logActivity({
      eventType: 'strategy_paused',
      category: 'strategy',
      title: `DCA Strategy #${strategyId} Paused`,
      description: 'Strategy execution temporarily suspended',
      strategyId,
      severity: 'info'
    });
    
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
    
    // Log activity
    logActivity({
      eventType: 'strategy_stopped',
      category: 'strategy',
      title: `DCA Strategy #${strategyId} Stopped`,
      description: 'Strategy execution terminated',
      strategyId,
      severity: 'warning'
    });
    
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
    
    console.log('Creating Ratio strategy with config:', config);
    
    const db = require('./database/schema').getDatabase();
    const result = db.prepare(`
      INSERT INTO strategies (type, token_address, config, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('ratio', config.tokenAddress, JSON.stringify(config), 'stopped', Date.now(), Date.now());
    
    const strategyId = result.lastInsertRowid as number;
    
    // Use the new simplified ratio strategy
    const { RatioSimpleStrategy } = require('./strategies/ratio-simple');
    const strategy = new RatioSimpleStrategy(strategyId, config, jupiterClient, walletManager, feeManager!);
    activeStrategies.set(strategyId, strategy);
    
    // Log activity
    const db2 = require('./database/schema').getDatabase();
    db2.prepare(`
      INSERT INTO activity_logs (event_type, category, title, description, strategy_id, metadata, severity, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'strategy_created',
      'strategy',
      `Ratio Strategy #${strategyId} Created`,
      `${config.buyCount} buys : ${config.sellCount} sells pattern with ${config.totalSolLimit} SOL limit`,
      strategyId,
      JSON.stringify({
        type: 'ratio',
        buyCount: config.buyCount,
        sellCount: config.sellCount,
        initialSol: config.initialSolPerTrade,
        totalLimit: config.totalSolLimit
      }),
      'success',
      Date.now()
    );
    
    return { success: true, strategyId };
  } catch (error: any) {
    console.error('Error creating ratio strategy:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:ratio:start', async (event, strategyId: number) => {
  try {
    if (!walletManager || !jupiterClient) throw new Error('Services not initialized');
    
    // Get strategy config from database
    const db = require('./database/schema').getDatabase();
    const strategyData = db.prepare('SELECT config FROM strategies WHERE id = ?').get(strategyId) as any;
    if (!strategyData) throw new Error('Strategy not found in database');
    
    const config = JSON.parse(strategyData.config);
    
    // Get or create strategy instance using new simplified version
    const existingStrategy = activeStrategies.get(strategyId);
    let strategy;
    if (!existingStrategy) {
      console.log(`   Creating new Ratio strategy instance for #${strategyId}`);
      const { RatioSimpleStrategy } = require('./strategies/ratio-simple');
      strategy = new RatioSimpleStrategy(strategyId, config, jupiterClient, walletManager, feeManager!);
      activeStrategies.set(strategyId, strategy);
    } else {
      strategy = existingStrategy;
    }
    
    if ('start' in strategy) {
      await strategy.start();
    }
    
    // Update database status to active
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('active', Date.now(), strategyId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:ratio:pause', async (event, strategyId: number) => {
  try {
    const strategy = activeStrategies.get(strategyId);
    if (!strategy) throw new Error('Strategy not found');
    if ('pause' in strategy) {
      await strategy.pause();
    }
    
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
    const strategy = activeStrategies.get(strategyId);
    if (!strategy) {
      console.log(`⚠️ Strategy #${strategyId} not found in activeStrategies`);
    } else {
      if ('stop' in strategy) {
        await strategy.stop();
      }
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
    
    console.log('Creating Bundle Reconcile strategy with config:', config);
    
    const db = require('./database/schema').getDatabase();
    const result = db.prepare(`
      INSERT INTO strategies (type, token_address, config, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('bundle', config.tokenAddress, JSON.stringify(config), 'stopped', Date.now(), Date.now());
    
    const strategyId = result.lastInsertRowid as number;
    
    // Use the new reconciling bundle strategy
    const { BundleReconcileStrategy } = require('./strategies/bundle-reconcile');
    const strategy = new BundleReconcileStrategy(strategyId, config, jupiterClient, walletManager, feeManager!);
    activeStrategies.set(strategyId, strategy);
    
    // Log activity
    const db2 = require('./database/schema').getDatabase();
    db2.prepare(`
      INSERT INTO activity_logs (event_type, category, title, description, strategy_id, metadata, severity, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'strategy_created',
      'strategy',
      `Bundle Reconcile Strategy #${strategyId} Created`,
      `${config.bundleType === 'instant' ? 'Instant' : 'Delayed'} bundle: ${config.buysPerBundle} buys → reconciling sell`,
      strategyId,
      JSON.stringify({
        type: 'bundle_reconcile',
        bundleType: config.bundleType,
        buysPerBundle: config.buysPerBundle,
        totalBundles: config.totalBundles
      }),
      'success',
      Date.now()
    );
    
    return { success: true, strategyId };
  } catch (error: any) {
    console.error('Error creating bundle strategy:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:bundle:start', async (event, strategyId: number) => {
  try {
    if (!walletManager || !jupiterClient) throw new Error('Services not initialized');
    
    // Get strategy config from database
    const db = require('./database/schema').getDatabase();
    const strategyData = db.prepare('SELECT config FROM strategies WHERE id = ?').get(strategyId) as any;
    if (!strategyData) throw new Error('Strategy not found in database');
    
    const config = JSON.parse(strategyData.config);
    
    // Get or create strategy instance using new reconcile version
    const existingStrategy = activeStrategies.get(strategyId);
    let strategy;
    if (!existingStrategy) {
      console.log(`   Creating new Bundle Reconcile strategy instance for #${strategyId}`);
      const { BundleReconcileStrategy } = require('./strategies/bundle-reconcile');
      strategy = new BundleReconcileStrategy(strategyId, config, jupiterClient, walletManager, feeManager!);
      activeStrategies.set(strategyId, strategy);
    } else {
      strategy = existingStrategy;
    }
    
    if ('start' in strategy) {
      await strategy.start();
    }
    
    // Update database status to active
    db.prepare('UPDATE strategies SET status = ?, updated_at = ? WHERE id = ?')
      .run('active', Date.now(), strategyId);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('strategy:bundle:pause', async (event, strategyId: number) => {
  try {
    const strategy = activeStrategies.get(strategyId);
    if (!strategy) throw new Error('Strategy not found');
    if ('pause' in strategy) {
      await strategy.pause();
    }
    
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
    const strategy = activeStrategies.get(strategyId);
    if (!strategy) {
      console.log(`⚠️ Strategy #${strategyId} not found in activeStrategies`);
    } else {
      if ('stop' in strategy) {
        await strategy.stop();
      }
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
// IPC HANDLERS - Strategy Archive & Deletion
// ============================================================================

// Archive strategy (soft delete - keeps all data)
ipcMain.handle('strategy:archive', async (event, strategyId: number, notes?: string) => {
  try {
    console.log(`📦 Archiving strategy #${strategyId}`);
    
    // Make sure strategy is stopped first
    const strategy = activeStrategies.get(strategyId);
    if (strategy) {
      console.log(`⚠️ Strategy #${strategyId} is still active, stopping it first`);
      if ('stop' in strategy) {
        await strategy.stop();
      }
      activeStrategies.delete(strategyId);
    }
    
    // Archive in database (keep all data)
    const db = require('./database/schema').getDatabase();
    
    const result = db.prepare(`
      UPDATE strategies 
      SET status = 'archived', 
          archived_at = ?,
          archive_notes = ?,
          updated_at = ?
      WHERE id = ?
    `).run(Date.now(), notes || null, Date.now(), strategyId);
    
    if (result.changes > 0) {
      console.log(`✅ Strategy #${strategyId} archived (all data preserved)`);
      
      // Log to activity
      logActivity({
        eventType: 'strategy_archived',
        category: 'strategy',
        title: `Strategy #${strategyId} Archived`,
        description: notes || 'Strategy archived - all data preserved for local storage',
        strategyId,
        metadata: {
          canRestore: true,
          cloudSynced: false
        },
        severity: 'info'
      });
      
      return { success: true };
    } else {
      return { success: false, error: 'Strategy not found' };
    }
  } catch (error: any) {
    console.error(`❌ Error archiving strategy #${strategyId}:`, error);
    return { success: false, error: error.message };
  }
});

// Restore archived strategy
ipcMain.handle('strategy:restore', async (event, strategyId: number) => {
  try {
    console.log(`♻️ Restoring strategy #${strategyId}`);
    
    const db = require('./database/schema').getDatabase();
    
    const result = db.prepare(`
      UPDATE strategies 
      SET status = 'stopped',
          archived_at = NULL,
          archive_notes = NULL,
          updated_at = ?
      WHERE id = ? AND status = 'archived'
    `).run(Date.now(), strategyId);
    
    if (result.changes > 0) {
      console.log(`✅ Strategy #${strategyId} restored`);
      
      logActivity({
        eventType: 'strategy_restored',
        category: 'strategy',
        title: `Strategy #${strategyId} Restored`,
        description: 'Strategy restored from archive',
        strategyId,
        severity: 'success'
      });
      
      return { success: true };
    } else {
      return { success: false, error: 'Strategy not found or not archived' };
    }
  } catch (error: any) {
    console.error(`❌ Error restoring strategy #${strategyId}:`, error);
    return { success: false, error: error.message };
  }
});

// Get archived strategies
ipcMain.handle('strategy:getArchived', async (event) => {
  try {
    const db = require('./database/schema').getDatabase();
    
    const strategies = db.prepare(`
      SELECT 
        s.*,
        t.name as token_name,
        t.symbol as token_symbol,
        (SELECT COUNT(*) FROM transactions WHERE strategy_id = s.id) as transaction_count,
        (SELECT SUM(input_amount) FROM transactions WHERE strategy_id = s.id AND status = 'confirmed') as total_volume
      FROM strategies s
      LEFT JOIN tokens t ON s.token_address = t.contract_address
      WHERE s.status = 'archived'
      ORDER BY s.archived_at DESC
    `).all();
    
    // Parse config and progress JSON
    const parsedStrategies = strategies.map((s: any) => ({
      ...s,
      config: JSON.parse(s.config),
      progress: s.progress ? JSON.parse(s.progress) : null,
      token_name: s.token_name || null,
      token_symbol: s.token_symbol || null
    }));
    
    return { success: true, strategies: parsedStrategies };
  } catch (error: any) {
    console.error('❌ Error getting archived strategies:', error);
    return { success: false, error: error.message };
  }
});

// Permanently delete strategy (use with caution - deletes all data)
ipcMain.handle('strategy:delete', async (event, strategyId: number) => {
  try {
    console.log(`🗑️ PERMANENTLY deleting strategy #${strategyId}`);
    
    // Make sure strategy is stopped first
    const strategy = activeStrategies.get(strategyId);
    if (strategy) {
      console.log(`⚠️ Strategy #${strategyId} is still active, stopping it first`);
      activeStrategies.delete(strategyId);
    }
    
    // Delete from database (with related records)
    const db = require('./database/schema').getDatabase();
    
    // Delete related activity logs first
    db.prepare('DELETE FROM activity_logs WHERE strategy_id = ?').run(strategyId);
    console.log(`   Deleted activity logs for strategy #${strategyId}`);
    
    // Delete related transactions (this will cascade if ON DELETE CASCADE is working)
    db.prepare('DELETE FROM transactions WHERE strategy_id = ?').run(strategyId);
    console.log(`   Deleted transactions for strategy #${strategyId}`);
    
    // Delete fee transactions
    db.prepare('DELETE FROM fee_transactions WHERE strategy_id = ?').run(strategyId);
    
    // Finally delete the strategy
    const result = db.prepare('DELETE FROM strategies WHERE id = ?').run(strategyId);
    
    if (result.changes > 0) {
      console.log(`✅ Strategy #${strategyId} and all related records permanently deleted`);
      
      // Log to activity (without strategy_id since it's been deleted)
      logActivity({
        eventType: 'strategy_deleted',
        category: 'strategy',
        title: `Strategy #${strategyId} Permanently Deleted`,
        description: 'Strategy and all related records permanently removed',
        // Note: No strategyId here because the strategy has been deleted
        severity: 'warning'
      });
      
      return { success: true };
    } else {
      return { success: false, error: 'Strategy not found in database' };
    }
  } catch (error: any) {
    console.error(`❌ Error deleting strategy #${strategyId}:`, error);
    return { success: false, error: error.message };
  }
});

// Mark strategy as synced to cloud
ipcMain.handle('strategy:markSynced', async (event, strategyId: number) => {
  try {
    const db = require('./database/schema').getDatabase();
    
    const result = db.prepare(`
      UPDATE strategies 
      SET cloud_synced = TRUE,
          updated_at = ?
      WHERE id = ?
    `).run(Date.now(), strategyId);
    
    if (result.changes > 0) {
      console.log(`☁️ Strategy #${strategyId} marked as synced to cloud`);
      return { success: true };
    } else {
      return { success: false, error: 'Strategy not found' };
    }
  } catch (error: any) {
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
// IPC HANDLERS - Statistics
// ============================================================================

ipcMain.handle('stats:getDashboard', async (event) => {
  try {
    const db = require('./database/schema').getDatabase();
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    
    // Get total trades
    const totalTrades = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any;
    
    // Get successful trades
    const successfulTrades = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = ?').get('confirmed') as any;
    
    // Get total volume in SOL (both buy and sell)
    // For BUY: SOL is input_token, count input_amount
    // For SELL: SOL is output_token, count output_amount
    const volumeResult = db.prepare(`
      SELECT SUM(
        CASE 
          WHEN input_token = ? THEN input_amount
          WHEN output_token = ? THEN output_amount
          ELSE 0
        END
      ) as volume 
      FROM transactions 
      WHERE status = ?
    `).get(SOL_MINT, SOL_MINT, 'confirmed') as any;
    
    // Get today's volume (same logic)
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayVolume = db.prepare(`
      SELECT SUM(
        CASE 
          WHEN input_token = ? THEN input_amount
          WHEN output_token = ? THEN output_amount
          ELSE 0
        END
      ) as volume 
      FROM transactions 
      WHERE status = ? AND timestamp >= ?
    `).get(SOL_MINT, SOL_MINT, 'confirmed', todayStart) as any;
    
    // Get recent transactions
    const recentTxs = db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 5').all();
    
    return {
      success: true,
      stats: {
        totalTrades: totalTrades.count || 0,
        successfulTrades: successfulTrades.count || 0,
        failedTrades: (totalTrades.count || 0) - (successfulTrades.count || 0),
        totalVolume: volumeResult.volume || 0,
        todayVolume: todayVolume.volume || 0,
        recentTransactions: recentTxs
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IPC HANDLERS - Activity Logs
// ============================================================================

ipcMain.handle('activity:getAll', async (event, params?: { limit?: number; category?: string }) => {
  try {
    const db = require('./database/schema').getDatabase();
    let query = `
      SELECT 
        a.*,
        s.type as strategy_type,
        w.label as wallet_label
      FROM activity_logs a
      LEFT JOIN strategies s ON a.strategy_id = s.id
      LEFT JOIN wallets w ON a.wallet_id = w.id
    `;
    
    const conditions: string[] = [];
    const queryParams: any[] = [];
    
    if (params?.category) {
      conditions.push('a.category = ?');
      queryParams.push(params.category);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY a.timestamp DESC';
    
    if (params?.limit) {
      query += ' LIMIT ?';
      queryParams.push(params.limit);
    }
    
    const logs = db.prepare(query).all(...queryParams);
    
    // Parse metadata JSON
    const parsedLogs = logs.map((log: any) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));
    
    return { success: true, logs: parsedLogs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
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

// ============================================================================
// SYSTEM DIAGNOSTICS
// ============================================================================

// Get system information
ipcMain.handle('system:getInfo', async () => {
  try {
    const os = require('os');
    
    return {
      success: true,
      info: {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || 'Unknown',
        totalMemory: (os.totalmem() / (1024 ** 3)).toFixed(2) + ' GB',
        freeMemory: (os.freemem() / (1024 ** 3)).toFixed(2) + ' GB',
        uptime: Math.floor(os.uptime() / 3600) + ' hours',
        nodeVersion: process.version,
        electronVersion: process.versions.electron
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Test internet connectivity
ipcMain.handle('system:testInternet', async () => {
  try {
    const https = require('https');
    
    return new Promise((resolve) => {
      const start = Date.now();
      
      const req = https.get('https://www.google.com', (res: any) => {
        const time = Date.now() - start;
        resolve({
          success: true,
          connected: true,
          responseTime: time,
          statusCode: res.statusCode
        });
      });
      
      req.on('error', (error: any) => {
        resolve({
          success: true,
          connected: false,
          error: error.message
        });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          success: true,
          connected: false,
          error: 'Connection timeout'
        });
      });
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Test DNS resolution (Jupiter API)
ipcMain.handle('system:testDNS', async () => {
  try {
    const https = require('https');
    
    return new Promise((resolve) => {
      const start = Date.now();
      
      const req = https.get('https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=So11111111111111111111111111111111111111112&amount=1000000', (res: any) => {
        const time = Date.now() - start;
        resolve({
          success: true,
          connected: true,
          responseTime: time,
          statusCode: res.statusCode
        });
      });
      
      req.on('error', (error: any) => {
        const errorMsg = error.message || '';
        const isDnsError = errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo');
        
        resolve({
          success: true,
          connected: false,
          isDnsError: isDnsError,
          error: error.message,
          code: error.code
        });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          success: true,
          connected: false,
          error: 'Connection timeout'
        });
      });
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

console.log('✅ Anvil Solo started');

