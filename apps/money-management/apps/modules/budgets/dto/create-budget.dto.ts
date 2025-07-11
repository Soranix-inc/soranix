import { BaseOmit } from "@/index";
import { BUDGET_STATE_ENUM, BUDGET_STATUS_ENUM } from "@/libs/enums";
import { Type } from "class-transformer";
import {
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from "class-validator";
import { Budget } from "../entities/budget.entities";

export class CreateBudgetDto implements BaseOmit<Budget> {
	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsNotEmpty()
	@IsString()
	description!: string;

	@IsNotEmpty()
	@IsString()
	@IsEnum(BUDGET_STATUS_ENUM)
	status!: BUDGET_STATUS_ENUM;

	@IsOptional()
	parentBudget!: string | undefined;

	@IsNotEmpty()
	@IsString()
	@IsEnum(BUDGET_STATE_ENUM)
	state!: BUDGET_STATE_ENUM;

	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	allocatedAmount!: number;

	@IsNotEmpty()
	@IsBoolean()
	isGlobal!: boolean;

	@IsNotEmpty()
	@IsString()
	@IsUUID()
	userId!: string;

	@IsNotEmpty()
	@IsString()
	@IsUUID()
	accountId!: string;

	@IsNotEmpty()
	@IsObject()
	@Type(() => CreateBudgetSettings)
	configuration!: CreateBudgetSettings;
}

export class CreateBudgetSettings {
	@IsNotEmpty()
	@IsBoolean()
	isActive!: boolean;
}
