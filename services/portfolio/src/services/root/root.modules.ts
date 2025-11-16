import express from 'express';

import InvestmentsModules from '../investments/investments.modules';

class RootModules {
  private readonly router: express.Router;
  public readonly investments: InvestmentsModules;

  constructor() {
    this.router = express.Router();
    this.investments = new InvestmentsModules();
    this.intializaRoutes();
  }

  public intializaRoutes() {
    this.router.use('/investments', this.investments.routes.routes());
    return this.router;
  }

  routes() {
    return this.router;
  }
}

export default RootModules;

