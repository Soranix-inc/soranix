import express from "express";
import { DataSource } from "typeorm";
import { BudgetConfigModule } from "../budgetconfig/budgetconfig.module";
import { BudgetModule } from "../budgets";

export class RootModule {
	private readonly router: express.Router;
	private readonly budget: BudgetModule;
	private readonly budgetConfig: BudgetConfigModule;

	constructor(budget: BudgetModule, budgetConfig: BudgetConfigModule) {
		this.router = express.Router();
		this.budget = budget;
		this.budgetConfig = budgetConfig;
	}

	static create = async (db: DataSource) => {
		const budget = await BudgetModule.create(db);
		const budgetConfig = new BudgetConfigModule(db);
		return new RootModule(budget, budgetConfig);
	};

	routes = () => {
		this.router.use(this.budget.routes);
		this.router.use(this.budgetConfig.routes);
		return this.router;
	};
}
