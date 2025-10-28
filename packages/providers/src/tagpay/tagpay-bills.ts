import {
  Biller,
  BillPaymentData,
  BillPaymentResult,
  BillValidationData,
  BillValidationResult,
  BillHistory,
  GetBillersParams,
} from '../types/bills.js';

import { TagPayConfig } from './config.js';
import { TagPayBase } from './tagpay-base.js';

export class TagPayBills extends TagPayBase {
  constructor(config: TagPayConfig) {
    super(config);
  }

  async getBillers(params?: GetBillersParams): Promise<Biller[]> {
    // TODO: Implement TagPay billers retrieval
    throw new Error('Method not implemented');
  }

  async validateBill(validationData: BillValidationData): Promise<BillValidationResult> {
    // TODO: Implement TagPay bill validation
    throw new Error('Method not implemented');
  }

  async payBill(paymentData: BillPaymentData): Promise<BillPaymentResult> {
    // TODO: Implement TagPay bill payment
    throw new Error('Method not implemented');
  }

  async getBillHistory(params?: { page?: number; limit?: number; customerId?: string }): Promise<BillHistory[]> {
    // TODO: Implement TagPay bill history
    throw new Error('Method not implemented');
  }
}
