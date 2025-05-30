import { BUDGET_STATE_ENUM, BUDGET_STATUS_ENUM } from '@/libs/enums';

export class Budget {
  id!: string;
  name!: string;
  description!: string;
  status!: BUDGET_STATUS_ENUM;
  parentBudget!: string;
  state!: BUDGET_STATE_ENUM;
  allocatedAmount!: number;
  isGlobal!: boolean;
  userId!: string;
  accountId!: string;
  configuration!: any; // TODO: change this to budget configurations
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date;
}
