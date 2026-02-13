import { BuyPowerBills } from './buypower-bills.js';
import { BuyPowerConfig } from './config.js';

export default class BuyPower {
  public bills: BuyPowerBills;

  constructor(config: BuyPowerConfig) {
    this.bills = new BuyPowerBills(config);
  }
}

// Export individual classes for advanced usage
export { BuyPowerBills };
export type { BuyPowerConfig } from './config.js';



