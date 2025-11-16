// Wallet-related types

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum WalletStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  PENDING = 'pending',
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  PAYMENT = 'payment',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface CreateWalletData {
  userId: string;
  currency: string;
  initialBalance?: number;
}

export interface WalletTransferData {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
}

export interface WalletTransferResult {
  transactionId: string;
  status: TransactionStatus;
  message: string;
}

