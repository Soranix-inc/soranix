import express from 'express';

import BalanceModules from '../balance/balance.modules.js';
import CoreModules from '../core/core.modules.js';
import EntriesModules from '../entries/entries.modules.js';
import ReconcileModules from '../reconcile/reconcile.modules.js';

class RootModules {
  private readonly router: express.Router;
  public readonly balance: BalanceModules;
  public readonly entries: EntriesModules;
  public readonly reconcile: ReconcileModules;
  public readonly core: CoreModules;

  constructor() {
    this.router = express.Router();
    this.balance = new BalanceModules();
    this.entries = new EntriesModules();
    this.reconcile = new ReconcileModules();
    this.core = new CoreModules();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use('/balance', this.balance.routes.routes());
    this.router.use('/entries', this.entries.routes.routes());
    this.router.use('/reconcile', this.reconcile.routes.routes());
    this.router.use('/core', this.core.routes.routes());
    return this.router;
  }

  routes() {
    return this.router;
  }
}

export default RootModules;



