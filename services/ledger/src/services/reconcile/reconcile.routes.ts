import express from 'express';

import ReconcileControllers from './reconcile.controllers.js';

class ReconcileRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: ReconcileControllers) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.get('/:accountId', this.controller.reconcileAccount);
    this.router.post('/all', this.controller.reconcileAll);
    return this.router;
  };
}

export default ReconcileRoutes;

