import { BUDGET_CYCLE, ON_OVERRUN } from "@/libs";
import { create_helper } from "@/libs/helpers/create.helper";
import { delete_helper } from "@/libs/helpers/delete.helper";
import { find_one_by_id_helper } from "@/libs/helpers/find-by-id.helper";
import { paginate_helper } from "@/libs/helpers/paginate.helper";
import { update_helper } from "@/libs/helpers/update.helper";
import { EntityManager, Repository } from "typeorm";
import { CreateBudgetConfigDto } from "./dto/create-budgetconfig.dto";
import { InsertBudgetConfigDto } from "./dto/insert-budgetconfig.dto";
import { UpdateBudgetConfigDto } from "./dto/update-budgetconfig.dto";
import { BudgetConfig } from "./entities/budgetconfig.entities";

export class BudgetConfigService {
	constructor(private readonly budgetconfig: Repository<BudgetConfig>) {}

	insert = (body: InsertBudgetConfigDto, manager?: EntityManager) => {
		return this.create(
			{
				user_id: body.user_id,
				cascade_on_delete_parent: body.cascade_on_delete_parent ?? false,
				strategy: body.strategy,
				default_cycle: BUDGET_CYCLE.MONTHLY,
				zero_based_budgeting: body.zero_based_budgeting ?? false,
				income_allocation: body.income_allocation ?? 80,
				on_budget_overrun: body.on_budget_overrun ?? ON_OVERRUN.NOTIFY,
				maintain_hierarchy_on_map: body.maintain_hierarchy_on_map ?? false,
				map_budget_to_expense: body.map_budget_to_expense ?? true,
			},
			manager
		);
	};

	modify = async (
		id: string,
		updates: UpdateBudgetConfigDto,
		manager?: EntityManager
	) => {
		const { user_id, ...rest } = updates;
		return this.update(id, rest, manager);
	};

	findByUserId = async (id: string) => {
		return this.budgetconfig.findOneBy({ user_id: id });
	};

	get = async (query: Record<string, any> = {}) => {
		return paginate_helper(this.budgetconfig, query);
	};

	findById = async (id: string) => {
		return find_one_by_id_helper(this.budgetconfig, id);
	};

	create = async (body: CreateBudgetConfigDto, manager?: EntityManager) => {
		return create_helper<BudgetConfig>(this.budgetconfig, body, manager);
	};

	delete = async (id: string, manager?: EntityManager) => {
		return delete_helper(this.budgetconfig, id, manager);
	};

	update = async (
		id: string,
		updates: UpdateBudgetConfigDto,
		manager?: EntityManager
	) => {
		return update_helper(this.budgetconfig, id, updates, manager);
	};
}
