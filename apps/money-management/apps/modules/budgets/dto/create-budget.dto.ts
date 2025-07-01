import { BUDGET_STATUS_ENUM, BUDGET_STATE_ENUM } from '@/libs/enums';
import { Budget } from '../entities/budget';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBudgetDto implements Budget {
  id!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  status!: BUDGET_STATUS_ENUM;

  @IsOptional()
  parentBudget!: string;

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

  configuration: any;

  createdAt!: Date;

  updatedAt!: Date;

  deletedAt!: Date;
}
