import express from 'express';

import TransactionsModules from '../transactions/transactions.modules';

class RootModules {
  private readonly router: express.Router;
  public readonly transactions: TransactionsModules;

  constructor() {
    this.router = express.Router();
    this.transactions = new TransactionsModules();
    this.intializaRoutes();
  }

  public intializaRoutes() {
    this.router.use('/transactions', this.transactions.routes.routes());
    return this.router;
  }

  routes() {
    return this.router;
  }
}

export default RootModules;
