import { Request, Response } from 'express';

import { asyncHandler } from '@packages/errors';

class CoreControllers {
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Core ledger service operational',
    });
  });
}

export default CoreControllers;
