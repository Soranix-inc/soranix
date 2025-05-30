import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BudgetController } from './budgets.controller';
import { BudgetRoute } from './budgets.route';
import { BudgetService } from './budgets.service';
import { Pool } from 'pg';
import * as schemas from '@/db/schema/index';

export class BudgetModule {
  public service: BudgetService;
  public controller: BudgetController;
  public router: BudgetRoute;

  constructor(
    private readonly db: NodePgDatabase<typeof schemas> & {
      $client: Pool;
    }
  ) {
    this.service = new BudgetService(db);
    this.controller = new BudgetController(this.service);
    this.router = new BudgetRoute(this.controller);
  }
}
