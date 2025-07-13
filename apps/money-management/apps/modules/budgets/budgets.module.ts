import { RmqModule } from "@/libs/rmq";
import { Router } from "express";
import { Repository, type DataSource } from "typeorm";
import { BudgetConfigModule } from "../budgetconfig/budgetconfig.module";
import { BudgetMessageQueues } from "./budget.queue";
import { BudgetController } from "./budgets.controller";
import { BudgetRoute } from "./budgets.routes";
import { BudgetService } from "./budgets.service";
import { Budget } from "./entities/budget.entities";

export class BudgetModule {
	public repo: Repository<Budget>;
	public service: BudgetService;
	public controller: BudgetController;
	public router: BudgetRoute;
	public routes: Router;
	public queues: BudgetMessageQueues;

	constructor(
		repo: Repository<Budget>,
		service: BudgetService,
		controller: BudgetController,
		router: BudgetRoute,
		routes: Router,
		queues: BudgetMessageQueues
	) {
		this.repo = repo;
		this.service = service;
		this.controller = controller;
		this.router = router;
		this.routes = routes;
		this.queues = queues;
		this.listenToQueues();
	}

	static create = async (datasource: DataSource) => {
		const budgetconfigservice = new BudgetConfigModule(datasource).service;
		const rmq = await RmqModule.create("");
		const repo = datasource.getRepository<Budget>(Budget);
		const service = new BudgetService(repo, budgetconfigservice);
		const queues = new BudgetMessageQueues(rmq.service, service);
		const controller = new BudgetController(service);
		const router = new BudgetRoute(controller);
		const routes = router.routes();
		return new BudgetModule(repo, service, controller, router, routes, queues);
	};

	listenToQueues = async () => {
		await this.queues.findBudgetById();
		await this.queues.getPaginatedBudgets();
	};
}
