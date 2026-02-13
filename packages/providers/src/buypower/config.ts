import { BaseProviderConfig } from '../types/common.js';

export interface BuyPowerConfig extends BaseProviderConfig {
  environment: 'sandbox' | 'production';
  merchantId: string;
  webhookSecret?: string;
}

export const BUYPOWER_ENDPOINTS = {
  BILLS: {
    GET_BILLERS: '/billers',
    VALIDATE_BILL: '/bills/validate',
    PAY_BILL: '/bills/pay',
    GET_HISTORY: '/bills/history',
    GET_CATEGORIES: '/billers/categories',
  },
  HEALTH: '/health',
} as const;



