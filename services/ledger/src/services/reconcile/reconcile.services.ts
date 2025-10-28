import BalanceServices from '../balance/balance.services.js';

class ReconcileServices {
  private balanceServices: BalanceServices;

  constructor() {
    this.balanceServices = new BalanceServices();
  }

  async reconcileAccount(accountId: string) {
    return await this.balanceServices.reconcileAccount(accountId);
  }

  async reconcileAllAccounts() {
    return await this.balanceServices.reconcileAllAccounts();
  }
}

export default ReconcileServices;
