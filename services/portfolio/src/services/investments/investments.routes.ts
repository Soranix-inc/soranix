import express from 'express';

import InvestmentsControllers from './investments.controllers';

class InvestmentsRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: InvestmentsControllers) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.post('/', this.controller.createInvestment);
    this.router.get('/:investmentId', this.controller.getInvestment);
    this.router.get('/portfolio/:userId', this.controller.getUserPortfolio);
    this.router.get('/portfolio/:userId/performance', this.controller.getPortfolioPerformance);
    this.router.post('/buy', this.controller.buyAsset);
    this.router.post('/sell', this.controller.sellAsset);
    this.router.get('/transactions/:userId', this.controller.getTransactionHistory);
    return this.router;
  };
}

export default InvestmentsRoutes;
