import express from 'express';

import BillsControllers from './bills.controllers';

class BillsRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: BillsControllers) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.post('/pay', this.controller.payBill);
    this.router.get('/history/:userId', this.controller.getBillHistory);
    this.router.get('/:billId', this.controller.getBillDetails);
    this.router.post('/verify/:billId', this.controller.verifyBillPayment);
    return this.router;
  };
}

export default BillsRoutes;



