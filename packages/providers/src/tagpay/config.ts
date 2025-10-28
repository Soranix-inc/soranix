import { BaseProviderConfig } from '../types/common.js';

export interface TagPayConfig extends BaseProviderConfig {
  environment: 'sandbox' | 'production';
  webhookSecret?: string;
  encryptionKey?: string;
}

export const TAGPAY_ENDPOINTS = {
  CUSTOMER: {
    CREATE: '/customers',
    GET: '/customers/{id}',
    UPDATE: '/customers/{id}',
    UPDATE_KYC: '/customers/{id}/kyc',
    LIST: '/customers',
  },
  WALLET: {
    CREATE: '/wallets',
    GET: '/wallets/{id}',
    GET_BALANCE: '/wallets/{id}/balance',
    TRANSFER: '/wallets/transfer',
    TRANSACTIONS: '/wallets/{id}/transactions',
  },
  BILLS: {
    GET_BILLERS: '/billers',
    VALIDATE_BILL: '/bills/validate',
    PAY_BILL: '/bills/pay',
    GET_HISTORY: '/bills/history',
  },
  HEALTH: '/health',
} as const;
