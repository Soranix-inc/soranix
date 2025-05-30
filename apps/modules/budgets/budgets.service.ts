import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import * as schemas from '@/db/schema/index';

export class BudgetService {
  /** TODO: add budget config service here also */
  constructor(
    private readonly db: NodePgDatabase<typeof schemas> & {
      $client: Pool;
    }
  ) {}

  /** creating new budgets as well as their configurations */
  initialize = async (body: CreateBudgetDto) => {};

  get = async (query: Record<string, any> = {}) => {};

  findById = async (id: string) => {};

  create = async (body: CreateBudgetDto) => {};

  delete = async (id: string) => {};

  update = async (id: string, updates: UpdateBudgetDto) => {};
}
