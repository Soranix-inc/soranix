import { Request, Response } from 'express';

import { asyncHandler } from '@packages/errors';

import { Currency } from '../../types/account-types.js';

import BalanceServices from './balance.services.js';

class BalanceControllers {
  private balanceServices: BalanceServices;

  constructor() {
    this.balanceServices = new BalanceServices();
  }

  getBalance = asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;

    const balance = await this.balanceServices.getBalance(accountId);

    if (!balance) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: balance,
    });
  });

  getUserBalances = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const balances = await this.balanceServices.getUserBalances(userId);

    res.status(200).json({
      success: true,
      data: {
        userId,
        balances,
        totalAccounts: balances.length,
      },
    });
  });

  getHistoricalBalance = asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Date parameter is required (format: YYYY-MM-DD)',
      });
      return;
    }

    const asOf = new Date(date);
    if (isNaN(asOf.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
      return;
    }

    const balance = await this.balanceServices.getHistoricalBalance(accountId, asOf);

    if (!balance) {
      res.status(404).json({
        success: false,
        error: 'Account not found or no entries before this date',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: balance,
    });
  });

  getSystemTotal = asyncHandler(async (req: Request, res: Response) => {
    const { currency } = req.query;

    if (!currency || typeof currency !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Currency parameter is required',
      });
      return;
    }

    const total = await this.balanceServices.getSystemTotalBalance(currency as Currency);

    res.status(200).json({
      success: true,
      data: {
        currency,
        totalBalance: total,
      },
    });
  });
}

export default BalanceControllers;



