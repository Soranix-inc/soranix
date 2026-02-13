import crypto from 'crypto';

import { systemLogger } from '@packages/logging';

export class EventEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  private static getEncryptionKey(): Buffer {
    const keyString = process.env.EVENT_ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('EVENT_ENCRYPTION_KEY environment variable is required');
    }

    // Ensure key is exactly 32 bytes
    const key = Buffer.from(keyString, 'hex');
    if (key.length !== this.KEY_LENGTH) {
      throw new Error(`Encryption key must be ${this.KEY_LENGTH * 2} hex characters (${this.KEY_LENGTH} bytes)`);
    }

    return key;
  }

  static encrypt(data: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAAD(Buffer.from('soranix-events', 'utf8'));

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combine IV + tag + encrypted data
      const combined = iv.toString('hex') + tag.toString('hex') + encrypted;

      return combined;
    } catch (error) {
      systemLogger.error('Failed to encrypt event data', { error: error.message });
      throw new Error('Encryption failed');
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();

      // Extract IV, tag, and encrypted data
      const iv = Buffer.from(encryptedData.slice(0, this.IV_LENGTH * 2), 'hex');
      const tag = Buffer.from(encryptedData.slice(this.IV_LENGTH * 2, (this.IV_LENGTH + this.TAG_LENGTH) * 2), 'hex');
      const encrypted = encryptedData.slice((this.IV_LENGTH + this.TAG_LENGTH) * 2);

      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAAD(Buffer.from('soranix-events', 'utf8'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      systemLogger.error('Failed to decrypt event data', { error: error.message });
      throw new Error('Decryption failed');
    }
  }

  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  static isEncrypted(data: string): boolean {
    // Check if data looks like encrypted format (hex string with expected length)
    return /^[0-9a-f]+$/i.test(data) && data.length > (this.IV_LENGTH + this.TAG_LENGTH) * 2;
  }
}



