import { Type } from "class-transformer";
import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from "class-validator";
import { CreateBudgetSettings } from "./create-budget.dto";

export class InsertBudgetDto {
	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsNotEmpty()
	@IsString()
	description!: string;

	@IsOptional()
	@IsUUID()
	parentBudget?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	allocatedAmount?: number;

	@IsNotEmpty()
	@IsBoolean()
	isGlobal!: boolean;

	@IsNotEmpty()
	@IsUUID()
	userId!: string;

	@IsNotEmpty()
	@IsUUID()
	accountId!: string;

	@IsOptional()
	@Type(() => CreateBudgetSettings)
	configuration!: CreateBudgetSettings;
}
