import { BUDGET_STATE_ENUM, BUDGET_STATUS_ENUM } from '@/libs/enums';
import { CreateBudgetDto } from './create-budget.dto';

type OMIT = Omit<
  CreateBudgetDto,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'configuration'
  | 'userId'
  | 'accountId'
>;
export class UpdateBudgetDto implements Partial<OMIT> {
  name?: string | undefined;
  description?: string | undefined;
  allocatedAmount?: number | undefined;
  isGlobal?: boolean | undefined;
  parentBudget?: string | undefined;
  state?: BUDGET_STATE_ENUM | undefined;
  status?: BUDGET_STATUS_ENUM | undefined;
}
