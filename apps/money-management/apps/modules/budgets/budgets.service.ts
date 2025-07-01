import { create_helper } from "@/libs/helpers/create.helper";
import { delete_helper } from "@/libs/helpers/delete.helper";
import { find_one_by_id_helper } from "@/libs/helpers/find-by-id.helper";
import { paginate_helper } from "@/libs/helpers/paginate.helper";
import { update_helper } from "@/libs/helpers/update.helper";
import { EntityManager, Repository } from "typeorm";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { Budget } from "./entities/budget.entities";

export class BudgetService {
	/** TODO: add budget config service here also */
	constructor(private readonly budget: Repository<Budget>) {}

	/** creating new budgets as well as their configurations */
	initialize = async (body: CreateBudgetDto) => {};

	get = async (query: Record<string, any> = {}) => {
		return paginate_helper(this.budget, query);
	};

	findById = async (id: string) => {
		return find_one_by_id_helper(this.budget, id);
	};

	create = async (body: CreateBudgetDto, manager?: EntityManager) => {
		return create_helper<Budget>(this.budget, body, manager);
	};

	delete = async (id: string, manager?: EntityManager) => {
		return delete_helper(this.budget, id, manager);
	};

	update = async (
		id: string,
		updates: UpdateBudgetDto,
		manager?: EntityManager
	) => {
		return update_helper(this.budget, id, updates, manager);
	};
}
