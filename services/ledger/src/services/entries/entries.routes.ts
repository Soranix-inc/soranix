import express from 'express';

import EntriesControllers from './entries.controllers.js';

class EntriesRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: EntriesControllers) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.get('/:accountId', this.controller.getAccountHistory);
    this.router.get('/transaction/:entryId', this.controller.getTransactionEntries);
    return this.router;
  };
}

export default EntriesRoutes;
