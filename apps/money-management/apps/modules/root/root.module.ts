import express from "express";
import { DataSource } from "typeorm";
import { BudgetModule } from "../budgets";

export class RootModule {
	private readonly router: express.Router;
	private readonly budget: BudgetModule;
	constructor(private readonly db: DataSource) {
		this.router = express.Router();
		this.budget = new BudgetModule(this.db);
	}

	routes = () => {
		this.router.use(this.budget.routes);
		return this.router;
	};
}
