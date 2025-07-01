import { BUDGET_CYCLE, Common, ON_OVERRUN } from "@/libs";
import { Column, PrimaryGeneratedColumn } from "typeorm";

// prettier-ignore
export class BudgetConfig extends Common {
	@PrimaryGeneratedColumn("uuid") id!: string;
	@Column({ type: "boolean" }) map_budget_to_expense!: boolean;
	@Column({ type: "boolean" }) maintain_hierarchy_on_map!: boolean;
	@Column({ type: "enum", enum: ON_OVERRUN, default: ON_OVERRUN.NOTIFY }) on_budget_overrun!: ON_OVERRUN;
	@Column({ type: "int", default: 80 }) income_allocation!: number;
	@Column({ type: "boolean" }) zero_based_budgeting!: boolean;
	@Column({ type: "enum", enum: BUDGET_CYCLE, default: BUDGET_CYCLE.MONTHLY }) default_cycle!: BUDGET_CYCLE;
	@Column({ type: "varchar" }) strategy!: string;
	@Column({ type: "uuid" }) user_id!: string;
	@Column({ type: "boolean" }) cascade_on_delete_parent!: boolean;
}
