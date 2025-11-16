import { TagPayConfig } from './config.js';
import { TagPayBills } from './tagpay-bills.js';
import { TagPayCustomer } from './tagpay-customer.js';
import { TagPayWallet } from './tagpay-wallet.js';

export default class TagPay {
  public customer: TagPayCustomer;
  public wallet: TagPayWallet;
  public bills: TagPayBills;

  constructor(config: TagPayConfig) {
    this.customer = new TagPayCustomer(config);
    this.wallet = new TagPayWallet(config);
    this.bills = new TagPayBills(config);
  }
}

// Export individual classes for advanced usage
export { TagPayCustomer, TagPayWallet, TagPayBills };
export type { TagPayConfig } from './config.js';

