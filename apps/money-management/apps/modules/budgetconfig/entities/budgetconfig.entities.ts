/** refers to the template for users budgets */
import { BUDGET_CYCLE, Common, ON_OVERRUN } from "@/libs";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

// prettier-ignore
@Entity({name: 'budget_config'})
export class BudgetConfig extends Common {
	@PrimaryGeneratedColumn("uuid") id!: string;
	@Column({ type: "boolean", default: true }) map_budget_to_expense!: boolean;
	@Column({ type: "boolean", default: false }) maintain_hierarchy_on_map!: boolean;
	@Column({ type: "enum", enum: ON_OVERRUN, default: ON_OVERRUN.NOTIFY }) on_budget_overrun!: ON_OVERRUN;
	@Column({ type: "int", default: 80 }) income_allocation!: number;
	@Column({ type: "boolean", default: false }) zero_based_budgeting!: boolean;
	@Column({ type: "enum", enum: BUDGET_CYCLE, default: BUDGET_CYCLE.MONTHLY }) default_cycle!: BUDGET_CYCLE;
	@Column({ type: "varchar" }) strategy!: string;
	@Column({ type: "uuid", unique: true }) user_id!: string;
	@Column({ type: "boolean", default: false }) cascade_on_delete_parent!: boolean;
}
