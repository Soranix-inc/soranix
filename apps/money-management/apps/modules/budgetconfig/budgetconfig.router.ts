import express from "express";
import { BudgetConfigController } from "./budgetconfig.controller";

export class BudgetConfigRouter {
	private readonly router: express.Router;
	constructor(private readonly controllers: BudgetConfigController) {
		this.router = express.Router();
	}

	routes = () => {
		this.router.get("/", this.controllers.getBudgetConfigs);
		this.router.get("/:id/", this.controllers.findBudgetConfigById);
		this.router.get("/user/:id/", this.controllers.findBudgetConfigByUserId);
		this.router.patch("/:id/", this.controllers.updateBudgetConfig);
		return this.router;
	};
}
