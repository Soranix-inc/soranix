import fs from 'fs';
import path from 'path';

/**
 * Load private key from environment variable or file
 * Priority: 1. JWT_PRIVATE_KEY env var (base64), 2. File from JWT_PRIVATE_KEY_PATH
 */
export function loadPrivateKey(): string {
  // Try environment variable first (base64 encoded)
  if (process.env.JWT_PRIVATE_KEY) {
    try {
      return Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('utf8');
    } catch (error) {
      throw new Error('Failed to decode JWT_PRIVATE_KEY from base64');
    }
  }

  // Try file path
  const keyPath = process.env.JWT_PRIVATE_KEY_PATH;
  if (!keyPath) {
    throw new Error('JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH environment variable is required for signing JWTs');
  }

  try {
    const resolvedPath = path.resolve(keyPath);
    return fs.readFileSync(resolvedPath, 'utf8');
  } catch (error) {
    throw new Error(
      `Failed to load private key from ${keyPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load public key from environment variable or file
 * Priority: 1. JWT_PUBLIC_KEY env var (base64), 2. File from JWT_PUBLIC_KEY_PATH
 */
export function loadPublicKey(): string {
  // Try environment variable first (base64 encoded)
  if (process.env.JWT_PUBLIC_KEY) {
    try {
      return Buffer.from(process.env.JWT_PUBLIC_KEY, 'base64').toString('utf8');
    } catch (error) {
      throw new Error('Failed to decode JWT_PUBLIC_KEY from base64');
    }
  }

  // Try file path
  const keyPath = process.env.JWT_PUBLIC_KEY_PATH;
  if (!keyPath) {
    throw new Error('JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH environment variable is required for verifying JWTs');
  }

  try {
    const resolvedPath = path.resolve(keyPath);
    return fs.readFileSync(resolvedPath, 'utf8');
  } catch (error) {
    throw new Error(
      `Failed to load public key from ${keyPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Encode a key to base64 for use in environment variables
 * Useful for converting PEM files to env var format
 */
export function encodeKeyToBase64(keyContent: string): string {
  return Buffer.from(keyContent, 'utf8').toString('base64');
}

/**
 * Helper to check if keys are configured
 */
export function hasPrivateKeyConfig(): boolean {
  return !!(process.env.JWT_PRIVATE_KEY || process.env.JWT_PRIVATE_KEY_PATH);
}

export function hasPublicKeyConfig(): boolean {
  return !!(process.env.JWT_PUBLIC_KEY || process.env.JWT_PUBLIC_KEY_PATH);
}

