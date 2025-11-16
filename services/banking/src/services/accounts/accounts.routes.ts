import express from 'express';

import AccountsControllers from './accounts.controllers';

class AccountsRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: AccountsControllers) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.post('/', this.controller.createAccount);
    this.router.get('/:accountId', this.controller.getAccount);
    this.router.get('/user/:userId', this.controller.getUserAccounts);
    this.router.get('/:accountId/balance', this.controller.getAccountBalance);
    this.router.post('/link', this.controller.linkBankAccount);
    this.router.delete('/unlink/:accountId', this.controller.unlinkBankAccount);
    return this.router;
  };
}

export default AccountsRoutes;

