import { PartialType } from "@nestjs/mapped-types";
import { CreateBudgetConfigDto } from "./create-budgetconfig.dto";
export class UpdateBudgetConfigDto extends PartialType(CreateBudgetConfigDto) {}
