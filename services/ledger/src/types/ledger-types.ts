import type { TransactionType, Currency } from './account-types.js';

/**
 * Ledger Entry Interface
 * Represents a single entry in the double-entry ledger
 */
export interface LedgerEntry {
  // Identity
  id: string;
  entryId: string; // Groups related entries (both sides of transaction)
  sequenceNumber: number; // Per-account sequence for ordering and conflict detection

  // Account Information
  accountId: string;
  accountType: string;
  counterAccountId: string;

  // Transaction Details
  debit: string; // Stored as string to prevent floating point issues
  credit: string;
  currency: Currency;

  // Running Balance
  balance: string; // Balance AFTER this transaction

  // Transaction Metadata
  transactionType: TransactionType;
  referenceId?: string; // Original transaction ID from source service
  referenceType?: string; // payment, bill, transfer, etc.
  description: string;
  metadata?: Record<string, any>;

  // Tracking
  createdAt: Date;
  createdBy: string; // Service or user that created it

  // Idempotency
  idempotencyKey: string; // Server-generated, prevents duplicates

  // Immutability marker
  immutable: boolean; // Always true after creation
}

/**
 * Input for creating a ledger entry
 */
export interface CreateLedgerEntryInput {
  accountId: string;
  counterAccountId: string;
  debit?: string | number;
  credit?: string | number;
  currency: Currency;
  transactionType: TransactionType;
  referenceId?: string;
  referenceType?: string;
  description: string;
  metadata?: Record<string, any>;
  createdBy: string;
  idempotencyKey?: string; // Optional: server generates if not provided
}

/**
 * Ledger Entry Pair (for double-entry)
 */
export interface LedgerEntryPair {
  entryId: string;
  entries: [CreateLedgerEntryInput, CreateLedgerEntryInput];
}

/**
 * Account Balance (cached)
 */
export interface AccountBalance {
  accountId: string;
  userId?: string;
  accountType: string;
  subAccount: string;
  currency: Currency;
  balance: string;
  availableBalance: string; // balance - reserved
  reservedBalance: string; // money locked for pending transactions
  lastEntryId: string;
  lastSequenceNumber: number;
  updatedAt: Date;
}

/**
 * Idempotency Record
 */
export interface IdempotencyRecord {
  key: string;
  entryId: string;
  accountId: string;
  result: any;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Balance Query Result
 */
export interface BalanceResult {
  accountId: string;
  balance: string;
  availableBalance: string;
  currency: Currency;
  asOf: Date;
}

/**
 * Transaction History Query
 */
export interface TransactionHistoryQuery {
  accountId: string;
  startDate?: Date;
  endDate?: Date;
  transactionTypes?: TransactionType[];
  limit?: number;
  offset?: number;
}

/**
 * Reconciliation Result
 */
export interface ReconciliationResult {
  accountId: string;
  cachedBalance: string;
  computedBalance: string;
  discrepancy: string;
  status: 'ok' | 'mismatch';
}

