import { Request, Response } from 'express';

import { asyncHandler } from '@packages/errors';

class AccountsControllers {
  // Create bank account
  createAccount = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Create bank account endpoint' });
  });

  // Get account details
  getAccount = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Get account details endpoint' });
  });

  // Get all user accounts
  getUserAccounts = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Get user accounts endpoint' });
  });

  // Get account balance
  getAccountBalance = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Get account balance endpoint' });
  });

  // Link external bank account
  linkBankAccount = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Link external bank account endpoint' });
  });

  // Unlink bank account
  unlinkBankAccount = asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Unlink bank account endpoint' });
  });
}

export default AccountsControllers;

