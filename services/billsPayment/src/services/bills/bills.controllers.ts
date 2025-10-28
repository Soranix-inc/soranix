import { Request, Response } from 'express';

import { asyncHandler } from '@packages/errors';

class BillsControllers {
  // Pay a bill
  payBill = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Pay bill endpoint' });
  });

  // Get bill payment history
  getBillHistory = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Get bill payment history endpoint' });
  });

  // Get bill payment details
  getBillDetails = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Get bill payment details endpoint' });
  });

  // Verify bill payment
  verifyBillPayment = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Verify bill payment endpoint' });
  });
}

export default BillsControllers;
