import express from 'express';

import TransactionsControllers from './transactions.controllers';

class TransactionsRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: TransactionsControllers) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.post('/initiate', this.controller.initiatePayment);
    this.router.get('/:transactionId', this.controller.getTransaction);
    this.router.get('/history/:userId', this.controller.getTransactionHistory);
    this.router.post('/verify/:transactionId', this.controller.verifyPayment);
    this.router.post('/refund/:transactionId', this.controller.refundPayment);
    return this.router;
  };
}

export default TransactionsRoutes;
