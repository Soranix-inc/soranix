import express from 'express';

import BillsModules from '../bills/bills.modules';

class RootModules {
  private readonly router: express.Router;
  public readonly bills: BillsModules;

  constructor() {
    this.router = express.Router();
    this.bills = new BillsModules();
    this.intializaRoutes();
  }

  public intializaRoutes() {
    this.router.use('/bills', this.bills.routes.routes());
    return this.router;
  }

  routes() {
    return this.router;
  }
}

export default RootModules;

