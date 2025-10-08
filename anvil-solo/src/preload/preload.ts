import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Wallet operations
  wallet: {
    import: (privateKey: string, password: string, label?: string) => 
      ipcRenderer.invoke('wallet:import', privateKey, password, label),
    generate: (password: string, label?: string) => 
      ipcRenderer.invoke('wallet:generate', password, label),
    unlock: (password: string) => 
      ipcRenderer.invoke('wallet:unlock', password),
    lock: () => 
      ipcRenderer.invoke('wallet:lock'),
    getBalance: (publicKey?: string) => 
      ipcRenderer.invoke('wallet:getBalance', publicKey),
    getTokenBalance: (walletPubkey: string, tokenMint: string) => 
      ipcRenderer.invoke('wallet:getTokenBalance', walletPubkey, tokenMint),
    getAll: () => 
      ipcRenderer.invoke('wallet:getAll'),
    getAllWithBalances: () => 
      ipcRenderer.invoke('wallet:getAllWithBalances'),
    generateDerived: (count: number) => 
      ipcRenderer.invoke('wallet:generateDerived', count),
    withdrawSol: (fromPublicKey: string, toAddress: string, amount: number) => 
      ipcRenderer.invoke('wallet:withdrawSol', fromPublicKey, toAddress, amount),
    withdrawToken: (fromPublicKey: string, toAddress: string, tokenMint: string, amount: number) => 
      ipcRenderer.invoke('wallet:withdrawToken', fromPublicKey, toAddress, tokenMint, amount),
  },

  // Token management
  tokens: {
    add: (tokenData: { name: string; symbol?: string; contractAddress: string; decimals?: number; notes?: string }) => 
      ipcRenderer.invoke('tokens:add', tokenData),
    getAll: () => 
      ipcRenderer.invoke('tokens:getAll'),
    delete: (tokenId: number) => 
      ipcRenderer.invoke('tokens:delete', tokenId),
    toggleFavorite: (tokenId: number) => 
      ipcRenderer.invoke('tokens:toggleFavorite', tokenId),
    update: (tokenId: number, updates: { name?: string; symbol?: string; notes?: string }) => 
      ipcRenderer.invoke('tokens:update', tokenId, updates),
  },

  // Jupiter operations
  jupiter: {
    getTokenInfo: (mintAddress: string) => 
      ipcRenderer.invoke('jupiter:getTokenInfo', mintAddress),
    validateToken: (mintAddress: string) => 
      ipcRenderer.invoke('jupiter:validateToken', mintAddress),
    getPrice: (mintAddress: string) => 
      ipcRenderer.invoke('jupiter:getPrice', mintAddress),
  },

  // License operations
  license: {
    getInfo: () => 
      ipcRenderer.invoke('license:getInfo'),
    activate: (licenseKey: string) => 
      ipcRenderer.invoke('license:activate', licenseKey),
    validate: () => 
      ipcRenderer.invoke('license:validate'),
    deactivate: () => 
      ipcRenderer.invoke('license:deactivate'),
    getHwid: () => 
      ipcRenderer.invoke('license:getHwid'),
  },

  // Auto-updater operations
  updater: {
    checkForUpdates: () => 
      ipcRenderer.invoke('updater:checkForUpdates'),
    downloadUpdate: () => 
      ipcRenderer.invoke('updater:downloadUpdate'),
    quitAndInstall: () => 
      ipcRenderer.invoke('updater:quitAndInstall'),
    onUpdateAvailable: (callback: (info: any) => void) => 
      ipcRenderer.on('update-available', (event, info) => callback(info)),
    onDownloadProgress: (callback: (progress: any) => void) => 
      ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
    onUpdateDownloaded: (callback: (info: any) => void) => 
      ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
  },

  // Strategy operations
  strategy: {
    getAll: () => 
      ipcRenderer.invoke('strategies:getAll'),
    get: (strategyId: number) => 
      ipcRenderer.invoke('strategy:get', strategyId),
    dca: {
      create: (config: any) => 
        ipcRenderer.invoke('strategy:dca:create', config),
      start: (strategyId: number) => 
        ipcRenderer.invoke('strategy:dca:start', strategyId),
      pause: (strategyId: number) => 
        ipcRenderer.invoke('strategy:dca:pause', strategyId),
      stop: (strategyId: number) => 
        ipcRenderer.invoke('strategy:dca:stop', strategyId),
    },
    ratio: {
      create: (config: any) => 
        ipcRenderer.invoke('strategy:ratio:create', config),
      start: (strategyId: number) => 
        ipcRenderer.invoke('strategy:ratio:start', strategyId),
      pause: (strategyId: number) => 
        ipcRenderer.invoke('strategy:ratio:pause', strategyId),
      stop: (strategyId: number) => 
        ipcRenderer.invoke('strategy:ratio:stop', strategyId),
    },
    bundle: {
      create: (config: any) => 
        ipcRenderer.invoke('strategy:bundle:create', config),
      start: (strategyId: number) => 
        ipcRenderer.invoke('strategy:bundle:start', strategyId),
      pause: (strategyId: number) => 
        ipcRenderer.invoke('strategy:bundle:pause', strategyId),
      stop: (strategyId: number) => 
        ipcRenderer.invoke('strategy:bundle:stop', strategyId),
    },
  },
});

// TypeScript declarations for the exposed API
declare global {
  interface Window {
    electron: {
      wallet: {
        import: (privateKey: string, password: string, label?: string) => Promise<any>;
        generate: (password: string, label?: string) => Promise<any>;
        unlock: (password: string) => Promise<any>;
        lock: () => Promise<any>;
        getBalance: (publicKey?: string) => Promise<any>;
        getTokenBalance: (walletPubkey: string, tokenMint: string) => Promise<any>;
        getAll: () => Promise<any>;
        getAllWithBalances: () => Promise<any>;
        generateDerived: (count: number) => Promise<any>;
        withdrawSol: (fromPublicKey: string, toAddress: string, amount: number) => Promise<any>;
        withdrawToken: (fromPublicKey: string, toAddress: string, tokenMint: string, amount: number) => Promise<any>;
      };
      tokens: {
        add: (tokenData: { name: string; symbol?: string; contractAddress: string; decimals?: number; notes?: string }) => Promise<any>;
        getAll: () => Promise<any>;
        delete: (tokenId: number) => Promise<any>;
        toggleFavorite: (tokenId: number) => Promise<any>;
        update: (tokenId: number, updates: { name?: string; symbol?: string; notes?: string }) => Promise<any>;
      };
      jupiter: {
        getTokenInfo: (mintAddress: string) => Promise<any>;
        validateToken: (mintAddress: string) => Promise<any>;
        getPrice: (mintAddress: string) => Promise<any>;
      };
      license: {
        getInfo: () => Promise<any>;
        activate: (licenseKey: string) => Promise<any>;
        validate: () => Promise<any>;
        deactivate: () => Promise<any>;
        getHwid: () => Promise<any>;
      };
      updater: {
        checkForUpdates: () => Promise<any>;
        downloadUpdate: () => Promise<any>;
        quitAndInstall: () => Promise<any>;
        onUpdateAvailable: (callback: (info: any) => void) => void;
        onDownloadProgress: (callback: (progress: any) => void) => void;
        onUpdateDownloaded: (callback: (info: any) => void) => void;
      };
      strategy: {
        getAll: () => Promise<any>;
        get: (strategyId: number) => Promise<any>;
        dca: {
          create: (config: any) => Promise<any>;
          start: (strategyId: number) => Promise<any>;
          pause: (strategyId: number) => Promise<any>;
          stop: (strategyId: number) => Promise<any>;
        };
        ratio: {
          create: (config: any) => Promise<any>;
          start: (strategyId: number) => Promise<any>;
          pause: (strategyId: number) => Promise<any>;
          stop: (strategyId: number) => Promise<any>;
        };
        bundle: {
          create: (config: any) => Promise<any>;
          start: (strategyId: number) => Promise<any>;
          pause: (strategyId: number) => Promise<any>;
          stop: (strategyId: number) => Promise<any>;
        };
      };
    };
  }
}



