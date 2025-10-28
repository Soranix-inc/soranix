import { Request, Response } from 'express';

import { asyncHandler } from '@packages/errors';
import { systemLogger } from '@packages/logging';

import ReconcileServices from './reconcile.services.js';

class ReconcileControllers {
  private reconcileServices: ReconcileServices;

  constructor() {
    this.reconcileServices = new ReconcileServices();
  }

  reconcileAccount = asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;

    const result = await this.reconcileServices.reconcileAccount(accountId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  reconcileAll = asyncHandler(async (req: Request, res: Response) => {
    systemLogger.info('Starting full system reconciliation');

    const results = await this.reconcileServices.reconcileAllAccounts();

    res.status(200).json({
      success: true,
      data: {
        totalMismatches: results.length,
        mismatches: results,
      },
    });
  });
}

export default ReconcileControllers;
