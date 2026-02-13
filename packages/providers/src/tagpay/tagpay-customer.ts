import { Customer, CreateCustomerData, UpdateCustomerData, KycData, KycResult } from '../types/customer.js';

import { TagPayConfig } from './config.js';
import { TagPayBase } from './tagpay-base.js';

export class TagPayCustomer extends TagPayBase {
  constructor(config: TagPayConfig) {
    super(config);
  }

  async createCustomer(customerData: CreateCustomerData): Promise<Customer> {
    // TODO: Implement TagPay customer creation
    throw new Error('Method not implemented');
  }

  async getCustomer(customerId: string): Promise<Customer> {
    // TODO: Implement TagPay customer retrieval
    throw new Error('Method not implemented');
  }

  async updateCustomer(customerId: string, updateData: UpdateCustomerData): Promise<Customer> {
    // TODO: Implement TagPay customer update
    throw new Error('Method not implemented');
  }

  async updateKyc(customerId: string, kycData: KycData): Promise<KycResult> {
    // TODO: Implement TagPay KYC update
    throw new Error('Method not implemented');
  }

  async listCustomers(params?: { page?: number; limit?: number }): Promise<Customer[]> {
    // TODO: Implement TagPay customer listing
    throw new Error('Method not implemented');
  }
}



