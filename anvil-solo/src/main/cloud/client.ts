/**
 * Cloud API Client for Anvil Solo
 * Connects desktop app to Railway cloud services
 * 
 * SECURITY NOTE: This client only sends:
 * - License keys
 * - Hardware IDs
 * - Strategy configurations
 * - Trade data
 * 
 * NEVER sends:
 * - Private keys
 * - Wallet seeds
 * - Passwords
 */

import { machineId } from 'node-machine-id';
import fetch from 'node-fetch';

// Cloud API configuration
const CLOUD_API_URL = process.env.CLOUD_API_URL || 'http://localhost:3000';

interface CloudConfig {
  apiUrl?: string;
  licenseKey?: string;
}

class CloudClient {
  private apiUrl: string;
  private licenseKey: string | null = null;
  private hardwareId: string | null = null;
  
  constructor(config: CloudConfig = {}) {
    this.apiUrl = config.apiUrl || CLOUD_API_URL;
  }
  
  async init() {
    // Get hardware ID (unique to this machine)
    this.hardwareId = await machineId();
  }
  
  setLicenseKey(key: string) {
    this.licenseKey = key;
  }
  
  private async request(endpoint: string, options: any = {}) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add license headers if available
    if (this.licenseKey) {
      headers['X-License-Key'] = this.licenseKey;
    }
    if (this.hardwareId) {
      headers['X-Hardware-Id'] = this.hardwareId;
    }
    
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }
  
  // License Methods
  async activateLicense(licenseKey: string, email?: string) {
    const result = await this.request('/api/license/activate', {
      method: 'POST',
      body: JSON.stringify({
        licenseKey,
        hardwareId: this.hardwareId,
        email
      })
    });
    
    if (result.valid) {
      this.licenseKey = licenseKey;
    }
    
    return result;
  }
  
  async validateLicense() {
    if (!this.licenseKey) {
      throw new Error('No license key set');
    }
    
    return this.request('/api/license/validate', {
      method: 'POST',
      body: JSON.stringify({
        licenseKey: this.licenseKey,
        hardwareId: this.hardwareId
      })
    });
  }
  
  // Strategy Methods
  async createCloudStrategy(strategyType: string, tokenAddress: string, config: any) {
    return this.request('/api/strategy/create', {
      method: 'POST',
      body: JSON.stringify({
        strategyType,
        tokenAddress,
        config
      })
    });
  }
  
  async listStrategies() {
    return this.request('/api/strategy/list');
  }
  
  async toggleStrategy(strategyId: number) {
    return this.request(`/api/strategy/${strategyId}/toggle`, {
      method: 'POST'
    });
  }
  
  async deleteStrategy(strategyId: number) {
    return this.request(`/api/strategy/${strategyId}`, {
      method: 'DELETE'
    });
  }
  
  async getStrategy(strategyId: number) {
    return this.request(`/api/strategy/${strategyId}`);
  }
  
  // Data Methods
  async saveSettings(settings: any, preferences: any) {
    return this.request('/api/data/settings', {
      method: 'POST',
      body: JSON.stringify({
        settings,
        preferences
      })
    });
  }
  
  async getSettings() {
    return this.request('/api/data/settings');
  }
  
  async getTradeHistory(limit: number = 100, offset: number = 0) {
    return this.request(`/api/data/trades?limit=${limit}&offset=${offset}`);
  }
  
  async recordTrade(tradeData: any) {
    return this.request('/api/data/trade', {
      method: 'POST',
      body: JSON.stringify(tradeData)
    });
  }
  
  async getAnalytics() {
    return this.request('/api/data/analytics');
  }
  
  // Health Check
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.json();
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }
}

// Singleton instance
let cloudClient: CloudClient | null = null;

export function getCloudClient(config?: CloudConfig): CloudClient {
  if (!cloudClient) {
    cloudClient = new CloudClient(config);
  }
  return cloudClient;
}

export default CloudClient;

