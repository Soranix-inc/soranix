import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { CreateBudgetConfigDto } from "./create-budgetconfig.dto";

export class InsertBudgetConfigDto extends PartialType(CreateBudgetConfigDto) {
	@IsNotEmpty()
	@IsString()
	@IsUUID()
	user_id!: string;

	@IsNotEmpty()
	@IsString()
	strategy!: string;
}
