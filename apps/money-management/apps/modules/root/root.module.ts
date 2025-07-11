import express from "express";
import { DataSource } from "typeorm";
import { BudgetConfigModule } from "../budgetconfig/budgetconfig.module";
import { BudgetModule } from "../budgets";

export class RootModule {
	private readonly router: express.Router;
	private readonly budget: BudgetModule;
	private readonly budgetConfig: BudgetConfigModule;

	constructor(private readonly db: DataSource) {
		this.router = express.Router();
		this.budget = new BudgetModule(this.db);
		this.budgetConfig = new BudgetConfigModule(this.db);
	}

	routes = () => {
		this.router.use(this.budget.routes);
		this.router.use(this.budgetConfig.routes);
		return this.router;
	};
}
