/**
 * Idempotency Configuration
 */
export interface IdempotencyConfig {
  /**
   * Time to live for idempotency keys (in seconds)
   * Default: 86400 (24 hours)
   */
  ttl?: number;

  /**
   * Prefix for Redis keys
   * Default: 'idem'
   */
  keyPrefix?: string;

  /**
   * Enable request fingerprint checking
   * Prevents rapid duplicates even with different idempotency keys
   * Default: true
   */
  useFingerprintCheck?: boolean;

  /**
   * Time window for fingerprint checking (in seconds)
   * Default: 300 (5 minutes)
   */
  fingerprintWindowSeconds?: number;
}

/**
 * Request Fingerprint for duplicate detection
 */
export interface RequestFingerprint {
  /**
   * The resource being operated on (e.g., user_id, account_id)
   */
  resourceId: string;

  /**
   * The operation being performed (e.g., 'payment', 'transfer')
   */
  operation: string;

  /**
   * Amount involved in the operation
   */
  amount: string | number;

  /**
   * Additional context for uniqueness
   */
  context?: Record<string, any>;
}

/**
 * Idempotency check result
 */
export interface IdempotencyResult {
  /**
   * Whether this is a duplicate request
   */
  isDuplicate: boolean;

  /**
   * Cached result from previous request (if duplicate)
   */
  cachedResult?: any;

  /**
   * Metadata about the original request
   */
  metadata?: {
    originalTimestamp?: Date;
    expiresAt?: Date;
  };
}

/**
 * Stored idempotency data in Redis
 */
export interface IdempotencyData {
  key: string;
  result: any;
  fingerprint?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}



