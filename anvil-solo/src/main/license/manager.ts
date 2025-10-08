import { machineIdSync } from 'node-machine-id';
import fetch from 'cross-fetch';
import { getDatabase } from '../database/schema';

const LICENSE_API_URL = process.env.LICENSE_API_URL || 'https://your-license-api.railway.app';

export enum LicenseTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  LIFETIME = 'lifetime',
}

export interface LicenseFeatures {
  maxActiveStrategies: number; // -1 = unlimited
  maxWallets: number; // -1 = unlimited
  strategyTypes: string[];
  cloudBackup: boolean;
  prioritySupport: boolean;
}

export interface LicenseInfo {
  tier: LicenseTier;
  features: LicenseFeatures;
  expiresAt: string | null;
  isValid: boolean;
  lastValidated: Date | null;
}

// Free tier limits
const FREE_TIER_FEATURES: LicenseFeatures = {
  maxActiveStrategies: 1,
  maxWallets: 3,
  strategyTypes: ['dca'],
  cloudBackup: false,
  prioritySupport: false,
};

export class LicenseManager {
  private hwid: string;
  private currentLicense: LicenseInfo | null = null;
  private db: any;

  constructor() {
    this.hwid = this.getHardwareId();
    this.db = getDatabase();
    this.loadLicenseFromDatabase();
  }

  /**
   * Get unique hardware ID for this machine
   */
  private getHardwareId(): string {
    try {
      return machineIdSync();
    } catch (error) {
      console.error('Failed to get machine ID:', error);
      // Fallback to a generated ID stored in database
      return this.getOrCreateFallbackId();
    }
  }

  /**
   * Get or create a fallback hardware ID
   */
  private getOrCreateFallbackId(): string {
    const result = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('hwid');
    
    if (result) {
      return result.value;
    }

    // Generate new fallback ID
    const fallbackId = `ANVIL-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('hwid', fallbackId);
    return fallbackId;
  }

  /**
   * Load license information from local database
   */
  private loadLicenseFromDatabase(): void {
    try {
      const result = this.db.prepare('SELECT * FROM license WHERE id = 1').get();
      
      if (result && result.license_key) {
        this.currentLicense = {
          tier: result.tier as LicenseTier,
          features: JSON.parse(result.features || '{}'),
          expiresAt: result.expires_at,
          isValid: true,
          lastValidated: result.last_validated ? new Date(result.last_validated) : null,
        };

        // Check if we should revalidate
        const shouldRevalidate = !this.currentLicense.lastValidated || 
          (Date.now() - this.currentLicense.lastValidated.getTime() > 24 * 60 * 60 * 1000); // 24 hours

        if (shouldRevalidate && result.token) {
          this.validateLicense(result.token).catch(err => {
            console.warn('Auto-revalidation failed:', err.message);
          });
        }
      } else {
        // No license, use free tier
        this.currentLicense = {
          tier: LicenseTier.FREE,
          features: FREE_TIER_FEATURES,
          expiresAt: null,
          isValid: true,
          lastValidated: null,
        };
      }
    } catch (error) {
      console.error('Failed to load license from database:', error);
      this.currentLicense = {
        tier: LicenseTier.FREE,
        features: FREE_TIER_FEATURES,
        expiresAt: null,
        isValid: true,
        lastValidated: null,
      };
    }
  }

  /**
   * Activate a license key
   */
  async activateLicense(licenseKey: string): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
    try {
      const response = await fetch(`${LICENSE_API_URL}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          hwid: this.hwid,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.error || 'License activation failed',
        };
      }

      const data = await response.json();

      // Save license to database
      this.db.prepare(`
        INSERT OR REPLACE INTO license (id, license_key, tier, token, features, expires_at, activated_at, last_validated)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        licenseKey,
        data.tier,
        data.token,
        JSON.stringify(data.features),
        data.expiresAt,
        new Date().toISOString(),
        new Date().toISOString()
      );

      // Update current license
      this.currentLicense = {
        tier: data.tier,
        features: data.features,
        expiresAt: data.expiresAt,
        isValid: true,
        lastValidated: new Date(),
      };

      return {
        success: true,
        message: 'License activated successfully!',
        license: this.currentLicense,
      };
    } catch (error: any) {
      console.error('License activation error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please check your internet connection.',
      };
    }
  }

  /**
   * Validate current license with server
   */
  async validateLicense(token?: string): Promise<boolean> {
    try {
      // Get token from database if not provided
      if (!token) {
        const result = this.db.prepare('SELECT token FROM license WHERE id = 1').get();
        if (!result || !result.token) {
          return false;
        }
        token = result.token;
      }

      const response = await fetch(`${LICENSE_API_URL}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        this.currentLicense = {
          tier: LicenseTier.FREE,
          features: FREE_TIER_FEATURES,
          expiresAt: null,
          isValid: true,
          lastValidated: null,
        };
        return false;
      }

      const data = await response.json();

      // Update license in database
      this.db.prepare(`
        UPDATE license SET last_validated = ?, features = ?, expires_at = ? WHERE id = 1
      `).run(
        new Date().toISOString(),
        JSON.stringify(data.features),
        data.expiresAt
      );

      // Update current license
      this.currentLicense = {
        tier: data.tier,
        features: data.features,
        expiresAt: data.expiresAt,
        isValid: true,
        lastValidated: new Date(),
      };

      return true;
    } catch (error) {
      console.error('License validation error:', error);
      return false;
    }
  }

  /**
   * Get current license information
   */
  getLicenseInfo(): LicenseInfo {
    return this.currentLicense || {
      tier: LicenseTier.FREE,
      features: FREE_TIER_FEATURES,
      expiresAt: null,
      isValid: true,
      lastValidated: null,
    };
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof LicenseFeatures): boolean {
    const info = this.getLicenseInfo();
    return !!info.features[feature];
  }

  /**
   * Check if user can create more strategies
   */
  canCreateStrategy(currentCount: number): boolean {
    const info = this.getLicenseInfo();
    const limit = info.features.maxActiveStrategies;
    return limit === -1 || currentCount < limit;
  }

  /**
   * Check if user can create more wallets
   */
  canCreateWallet(currentCount: number): boolean {
    const info = this.getLicenseInfo();
    const limit = info.features.maxWallets;
    return limit === -1 || currentCount < limit;
  }

  /**
   * Check if a strategy type is allowed
   */
  isStrategyTypeAllowed(type: string): boolean {
    const info = this.getLicenseInfo();
    return info.features.strategyTypes.includes(type);
  }

  /**
   * Deactivate current license
   */
  async deactivateLicense(): Promise<{ success: boolean; message: string }> {
    try {
      const result = this.db.prepare('SELECT token FROM license WHERE id = 1').get();
      
      if (!result || !result.token) {
        return { success: false, message: 'No active license found' };
      }

      const response = await fetch(`${LICENSE_API_URL}/api/license/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: result.token }),
      });

      if (!response.ok) {
        return { success: false, message: 'Failed to deactivate license' };
      }

      // Remove from database
      this.db.prepare('DELETE FROM license WHERE id = 1').run();

      // Reset to free tier
      this.currentLicense = {
        tier: LicenseTier.FREE,
        features: FREE_TIER_FEATURES,
        expiresAt: null,
        isValid: true,
        lastValidated: null,
      };

      return { success: true, message: 'License deactivated successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Deactivation failed' };
    }
  }

  /**
   * Get hardware ID (for display purposes)
   */
  getHwid(): string {
    return this.hwid;
  }
}

export default LicenseManager;


