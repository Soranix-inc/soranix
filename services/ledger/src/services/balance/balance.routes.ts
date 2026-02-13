import express from 'express';

import BalanceControllers from './balance.controllers.js';

class BalanceRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: BalanceControllers) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.get('/:accountId', this.controller.getBalance);
    this.router.get('/:accountId/historical', this.controller.getHistoricalBalance);
    this.router.get('/user/:userId', this.controller.getUserBalances);
    this.router.get('/system/total', this.controller.getSystemTotal);
    return this.router;
  };
}

export default BalanceRoutes;



