import express from 'express';

import AccountsModules from '../accounts/accounts.modules';

class RootModules {
  private readonly router: express.Router;
  public readonly accounts: AccountsModules;

  constructor() {
    this.router = express.Router();
    this.accounts = new AccountsModules();
    this.intializaRoutes();
  }

  public intializaRoutes() {
    this.router.use('/accounts', this.accounts.routes.routes());
    return this.router;
  }

  routes() {
    return this.router;
  }
}

export default RootModules;

