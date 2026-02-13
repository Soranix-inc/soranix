import bcrypt from 'bcrypt';

import { systemLogger } from '@packages/logging';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordService {
  private readonly saltRounds: number;
  private readonly minLength: number;

  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      return hash;
    } catch (error) {
      systemLogger.error('Failed to hash password', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      systemLogger.error('Failed to verify password', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

 

}



