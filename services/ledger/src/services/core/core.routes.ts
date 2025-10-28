import express from 'express';

import CoreControllers from './core.controllers.js';

class CoreRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: CoreControllers) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.get('/health', this.controller.healthCheck);
    return this.router;
  };
}

export default CoreRoutes;
