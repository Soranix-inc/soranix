import { Common } from "@/libs";
import { BUDGET_STATE_ENUM, BUDGET_STATUS_ENUM } from "@/libs/enums";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "budgets" })
export class Budget extends Common {
	@PrimaryGeneratedColumn("uuid")
	@Column({ type: "varchar" })
	id!: string;
	@Column({ type: "varchar" }) name!: string;
	@Column({ type: "varchar" }) description!: string;
	@Column({ type: "enum", enum: BUDGET_STATUS_ENUM })
	status!: BUDGET_STATUS_ENUM;
	@Column({ type: "varchar" }) parentBudget!: string;
	@Column({ type: "enum", enum: BUDGET_STATE_ENUM }) state!: BUDGET_STATE_ENUM;
	@Column({ type: "int" }) allocatedAmount!: number;
	@Column({ type: "boolean" }) isGlobal!: boolean;
	@Column({ type: "uuid" }) userId!: string;
	@Column({ type: "uuid" }) accountId!: string;
	@Column({ type: "jsonb" }) configuration!: any; // TODO: change this to budget configurations
}
