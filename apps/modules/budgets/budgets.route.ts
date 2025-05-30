import { BudgetController } from './budgets.controller';
import express from 'express';

export class BudgetRoute {
  private readonly router: express.Router;
  constructor(private readonly controller: BudgetController) {
    this.router = express.Router();
  }

  routes = () => {
    this.router.get('/', this.controller.getBudgets);
    this.router.get('/:id/', this.controller.findBudget);
    this.router.delete('/:id/', this.controller.deleteBudget);
    this.router.post('/', this.controller.makeBudget);
    this.router.patch('/:id', this.controller.updateBudget);
    return this.router;
  };
}
