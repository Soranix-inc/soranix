/**
 * Ledger Client Types
 */

export interface BalanceResponse {
  accountId: string;
  balance: string;
  availableBalance: string;
  currency: string;
  asOf: Date;
}

export interface UserBalancesResponse {
  userId: string;
  balances: BalanceResponse[];
  totalAccounts: number;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  balance: string;
  transactionType: string;
  description: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface TransactionHistoryResponse {
  accountId: string;
  entries: LedgerEntry[];
  count: number;
  limit: number;
  offset: number;
}

export interface LedgerClientConfig {
  baseUrl?: string;
  timeout?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

export interface BalanceCheckOptions {
  useCache?: boolean;
  cacheTTL?: number;
}



