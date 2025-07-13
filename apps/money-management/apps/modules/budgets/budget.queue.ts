import { RmqService } from "@/libs/rmq/rmq.service";
import { BudgetService } from "./budgets.service";

export class BudgetMessageQueues {
	constructor(
		private readonly rmq: RmqService,
		private readonly service: BudgetService
	) {}

	findBudgetById = async () => {
		return this.rmq.subscribe("FIND_BUDGET_BY_ID", (id: string) =>
			this.service.findById(id)
		);
	};

	getPaginatedBudgets = async () => {
		return this.rmq.subscribe(
			"FIND_BUDGET_BY_PAGINATION",
			(query: Record<string, any> = {}) => this.service.get(query)
		);
	};
}
