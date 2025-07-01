import { Router } from "express";
import { Repository, type DataSource } from "typeorm";
import { BudgetController } from "./budgets.controller";
import { BudgetRoute } from "./budgets.routes";
import { BudgetService } from "./budgets.service";
import { Budget } from "./entities/budget.entities";

export class BudgetModule {
	public service: BudgetService;
	public controller: BudgetController;
	public router: BudgetRoute;
	public routes: Router;
	private repo: Repository<Budget>;

	constructor(private readonly datasource: DataSource) {
		this.repo = this.datasource.getRepository<Budget>(Budget);
		this.service = new BudgetService(this.repo);
		this.controller = new BudgetController(this.service);
		this.router = new BudgetRoute(this.controller);
		this.routes = this.router.routes();
	}
}
