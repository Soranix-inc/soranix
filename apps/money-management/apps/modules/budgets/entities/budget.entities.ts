import { Common } from "@/libs";
import { BUDGET_STATE_ENUM, BUDGET_STATUS_ENUM } from "@/libs/enums";
import {
	Column,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
	Relation,
} from "typeorm";

// prettier-ignore
@Entity({ name: "budgets" })
export class Budget extends Common {
	@PrimaryGeneratedColumn("uuid") id!: string;
	@Column({ type: "varchar" }) name!: string;
	@Column({ type: "varchar" }) description!: string;
	@Column({ type: "enum", enum: BUDGET_STATUS_ENUM }) status!: BUDGET_STATUS_ENUM;
	@Column({ type: "uuid", nullable: true }) parentBudget!: string | undefined;
	@Column({ type: "enum", enum: BUDGET_STATE_ENUM }) state!: BUDGET_STATE_ENUM;
	@Column({ type: "int" }) allocatedAmount!: number;
	@Column({ type: "boolean" }) isGlobal!: boolean;
	@Column({ type: "uuid" }) userId!: string;
	@Column({ type: "uuid" }) accountId!: string;
	@Column({ type: "jsonb" }) configuration!: BudgetSettings; 

	@OneToOne(() => Budget)
	@JoinColumn({ name: "parentBudget" })
	Parent!: Relation<Budget>;
}

export interface BudgetSettings {
	isActive: boolean;
}
