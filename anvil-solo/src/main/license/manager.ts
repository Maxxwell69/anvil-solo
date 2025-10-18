import { machineIdSync } from 'node-machine-id';
import fetch from 'cross-fetch';
import { getDatabase } from '../database/schema';

const LICENSE_API_URL = process.env.LICENSE_API_URL || 'https://anvil.shoguncrypto.com';

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

// Free tier limits - RESTRICTED (users must purchase license for full features)
const FREE_TIER_FEATURES: LicenseFeatures = {
  maxActiveStrategies: 1, // Only 1 active strategy
  maxWallets: 1, // Only 1 wallet
  strategyTypes: ['dca'], // DCA only - no ratio or bundle trading
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
   * Check for hardcoded special license keys
   */
  private checkHardcodedLicense(licenseKey: string): { tier: LicenseTier; features: LicenseFeatures; expiresAt: number | null } | null {
    const hardcodedLicenses: Record<string, { tier: LicenseTier; features: LicenseFeatures; expiresAt: number | null }> = {
      // STARTER TIER - Special access key
      'ANVIL-STARTER-2025': {
        tier: LicenseTier.STARTER,
        features: {
          maxActiveStrategies: 3,
          maxWallets: 3,
          strategyTypes: ['dca', 'ratio', 'bundle'],
          cloudBackup: true,
          prioritySupport: false,
        },
        expiresAt: null, // Never expires
      },
      
      // PRO TIER - Special access key
      'ANVIL-PRO-2025': {
        tier: LicenseTier.PRO,
        features: {
          maxActiveStrategies: 10,
          maxWallets: 10,
          strategyTypes: ['dca', 'ratio', 'bundle'],
          cloudBackup: true,
          prioritySupport: true,
        },
        expiresAt: null, // Never expires
      },
      
      // ENTERPRISE TIER - Special access key
      'ANVIL-ENTERPRISE-2025': {
        tier: LicenseTier.ENTERPRISE,
        features: {
          maxActiveStrategies: -1, // Unlimited
          maxWallets: -1, // Unlimited
          strategyTypes: ['dca', 'ratio', 'bundle'],
          cloudBackup: true,
          prioritySupport: true,
        },
        expiresAt: null, // Never expires
      },
      
      // LIFETIME TIER - Special access key
      'ANVIL-LIFETIME-2025': {
        tier: LicenseTier.LIFETIME,
        features: {
          maxActiveStrategies: -1, // Unlimited
          maxWallets: -1, // Unlimited
          strategyTypes: ['dca', 'ratio', 'bundle'],
          cloudBackup: true,
          prioritySupport: true,
        },
        expiresAt: null, // Never expires
      },
    };
    
    return hardcodedLicenses[licenseKey] || null;
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
          features: result.features ? JSON.parse(result.features) : FREE_TIER_FEATURES,
          expiresAt: result.expires_at ? new Date(result.expires_at).toISOString() : null,
          isValid: true,
          lastValidated: result.last_validated ? new Date(result.last_validated) : null,
        };

        // Check if we should revalidate
        const shouldRevalidate = !this.currentLicense.lastValidated || 
          (Date.now() - this.currentLicense.lastValidated.getTime() > 24 * 60 * 60 * 1000); // 24 hours

        if (shouldRevalidate) {
          this.validateLicense().catch(err => {
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
      console.log(`Activating license: ${licenseKey} for HWID: ${this.hwid}`);
      
      // Check for special hardcoded licenses first (for testing/early access)
      const hardcodedLicense = this.checkHardcodedLicense(licenseKey);
      if (hardcodedLicense) {
        console.log('✅ Hardcoded license detected:', hardcodedLicense.tier);
        
        // Save license to database
        this.db.prepare(`
          INSERT OR REPLACE INTO license (id, license_key, tier, features, expires_at, activated_at, last_validated)
          VALUES (1, ?, ?, ?, ?, ?, ?)
        `).run(
          licenseKey,
          hardcodedLicense.tier,
          JSON.stringify(hardcodedLicense.features),
          hardcodedLicense.expiresAt,
          Date.now(),
          Date.now()
        );
        
        // Update current license
        this.currentLicense = {
          tier: hardcodedLicense.tier,
          features: hardcodedLicense.features,
          expiresAt: hardcodedLicense.expiresAt ? new Date(hardcodedLicense.expiresAt).toISOString() : null,
          isValid: true,
          lastValidated: new Date(),
        };
        
        return {
          success: true,
          message: `License activated successfully! Welcome to ${hardcodedLicense.tier.toUpperCase()} tier.`,
          license: this.currentLicense,
        };
      }
      
      const response = await fetch(`${LICENSE_API_URL}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          hardwareId: this.hwid, // Changed from 'hwid' to 'hardwareId' to match backend
        }),
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('Activation error from server:', error);
        return {
          success: false,
          message: error.error || 'License activation failed',
        };
      }

      const data = await response.json();
      console.log('Activation response:', data);

      // Backend returns { valid, activated, license: {...} }
      if (!data.valid || !data.activated) {
        return {
          success: false,
          message: 'License activation failed - invalid response from server',
        };
      }

      const license = data.license;
      
      // Map backend tier features
      const features = {
        maxActiveStrategies: license.maxStrategies || 1,
        maxWallets: license.maxWallets || 1,
        strategyTypes: ['dca', 'ratio', 'bundle'], // All types allowed for paid licenses
        cloudBackup: true,
        prioritySupport: license.tier !== 'starter',
      };

      // Save license to database
      this.db.prepare(`
        INSERT OR REPLACE INTO license (id, license_key, tier, features, expires_at, activated_at, last_validated)
        VALUES (1, ?, ?, ?, ?, ?, ?)
      `).run(
        licenseKey,
        license.tier,
        JSON.stringify(features),
        license.expiresAt ? new Date(license.expiresAt).getTime() : null,
        Date.now(),
        Date.now()
      );

      // Update current license
      this.currentLicense = {
        tier: license.tier,
        features: features,
        expiresAt: license.expiresAt,
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
      // Get license key and hardware ID from database
      const result = this.db.prepare('SELECT license_key FROM license WHERE id = 1').get();
      if (!result || !result.license_key) {
        console.log('No license key found in database');
        return false;
      }

      console.log(`Validating license: ${result.license_key} with HWID: ${this.hwid}`);

      const response = await fetch(`${LICENSE_API_URL}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          licenseKey: result.license_key,
          hardwareId: this.hwid
        }),
      });

      console.log(`Validation response status: ${response.status}`);

      if (!response.ok) {
        console.log('Validation failed - resetting to free tier');
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
      console.log('Validation response:', data);

      if (!data.valid) {
        console.log('License marked as invalid by server');
        return false;
      }

      const license = data.license;

      // Map backend tier features
      const features = {
        maxActiveStrategies: license.maxStrategies || 1,
        maxWallets: license.maxWallets || 1,
        strategyTypes: ['dca', 'ratio', 'bundle'],
        cloudBackup: true,
        prioritySupport: license.tier !== 'starter',
      };

      // Update license in database
      this.db.prepare(`
        UPDATE license SET last_validated = ?, features = ?, expires_at = ?, tier = ? WHERE id = 1
      `).run(
        new Date().toISOString(),
        JSON.stringify(features),
        license.expiresAt,
        license.tier
      );

      // Update current license
      this.currentLicense = {
        tier: license.tier,
        features: features,
        expiresAt: license.expiresAt,
        isValid: true,
        lastValidated: new Date(),
      };

      console.log('License validated successfully:', this.currentLicense);
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


