import { Request, Response } from 'express';

import { asyncHandler } from '@packages/errors';

import EntriesServices from './entries.services.js';

class EntriesControllers {
  private entriesServices: EntriesServices;

  constructor() {
    this.entriesServices = new EntriesServices();
  }

  getAccountHistory = asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const entries = await this.entriesServices.getAccountHistory(
      accountId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.status(200).json({
      success: true,
      data: {
        accountId,
        entries,
        count: entries.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  });

  getTransactionEntries = asyncHandler(async (req: Request, res: Response) => {
    const { entryId } = req.params;

    const entries = await this.entriesServices.getTransactionEntries(entryId);

    res.status(200).json({
      success: true,
      data: {
        entryId,
        entries,
        count: entries.length,
      },
    });
  });
}

export default EntriesControllers;

