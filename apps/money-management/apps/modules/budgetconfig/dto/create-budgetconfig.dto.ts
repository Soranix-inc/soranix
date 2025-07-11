import { BaseOmit } from "@/index";
import { BUDGET_CYCLE, ON_OVERRUN } from "@/libs";
import {
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsString,
	IsUUID,
	Min,
} from "class-validator";
import { BudgetConfig } from "../entities/budgetconfig.entities";

export class CreateBudgetConfigDto implements BaseOmit<BudgetConfig, "Budget"> {
	@IsNotEmpty()
	@IsBoolean()
	map_budget_to_expense!: boolean;

	@IsNotEmpty()
	@IsBoolean()
	maintain_hierarchy_on_map!: boolean;

	@IsNotEmpty()
	@IsString()
	@IsEnum(ON_OVERRUN)
	on_budget_overrun!: ON_OVERRUN;

	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	income_allocation!: number;

	@IsNotEmpty()
	@IsBoolean()
	zero_based_budgeting!: boolean;

	@IsNotEmpty()
	@IsString()
	@IsEnum(BUDGET_CYCLE)
	default_cycle!: BUDGET_CYCLE;

	@IsNotEmpty()
	@IsString()
	strategy!: string;

	@IsNotEmpty()
	@IsString()
	@IsUUID()
	user_id!: string;

	@IsNotEmpty()
	@IsBoolean()
	cascade_on_delete_parent!: boolean;
}
