import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Encrypts a private key with a user-provided password
 * Uses PBKDF2 for key derivation and AES-256-GCM for encryption
 * 
 * @param privateKey - The private key to encrypt (base64 string)
 * @param password - User's master password
 * @returns Encrypted data as base64 string (format: salt + iv + tag + encrypted)
 */
export function encryptPrivateKey(privateKey: string, password: string): string {
  if (!privateKey || !password) {
    throw new Error('Private key and password are required');
  }

  // Generate random salt
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Derive encryption key from password
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
  
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt the private key
  const encrypted = Buffer.concat([
    cipher.update(privateKey, 'utf8'),
    cipher.final()
  ]);
  
  // Get authentication tag
  const tag = cipher.getAuthTag();
  
  // Combine: salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  
  return combined.toString('base64');
}

/**
 * Decrypts an encrypted private key with a user-provided password
 * 
 * @param encryptedData - The encrypted data (base64 string)
 * @param password - User's master password
 * @returns Decrypted private key as base64 string
 */
export function decryptPrivateKey(encryptedData: string, password: string): string {
  if (!encryptedData || !password) {
    throw new Error('Encrypted data and password are required');
  }

  try {
    // Decode from base64
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive encryption key from password
    const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Failed to decrypt private key. Invalid password or corrupted data.');
  }
}

/**
 * Validates if a password is strong enough
 * Minimum 8 characters, at least one uppercase, one lowercase, one number
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true, message: 'Password is strong' };
}

/**
 * Generates a cryptographically secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}





