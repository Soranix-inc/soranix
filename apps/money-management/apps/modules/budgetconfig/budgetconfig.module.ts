import { Router } from "express";
import { DataSource, Repository } from "typeorm";
import { BudgetConfigController } from "./budgetconfig.controller";
import { BudgetConfigRouter } from "./budgetconfig.router";
import { BudgetConfigService } from "./budgetconfig.service";
import { BudgetConfig } from "./entities/budgetconfig.entities";

export class BudgetConfigModule {
	public service: BudgetConfigService;
	public repo: Repository<BudgetConfig>;
	public controller: BudgetConfigController;
	public router: BudgetConfigRouter;
	public routes: Router;

	constructor(private readonly datasource: DataSource) {
		this.repo = this.datasource.getRepository(BudgetConfig);
		this.service = new BudgetConfigService(this.repo);
		this.controller = new BudgetConfigController(this.service);
		this.router = new BudgetConfigRouter(this.controller);
		this.routes = this.router.routes();
	}
}
