import type { Request, Response, NextFunction } from 'express';

import { LedgerClient } from '@packages/ledger-client';
import { systemLogger } from '@packages/logging';

export interface CheckAccountOptions {
  /**
   * Account type to check
   */
  accountType: 'wallet' | 'investment';

  /**
   * Sub-account to check
   */
  subAccount?: string;

  /**
   * Currency field in request
   */
  currencyField?: string;
}

/**
 * Check Account Middleware
 *
 * Verifies that the user's account exists.
 * Useful for ensuring account setup before operations.
 *
 * Usage:
 * ```typescript
 * router.post('/transfer',
 *   requireAuth(),
 *   checkAccount({ accountType: 'wallet' }),
 *   processTransfer
 * );
 * ```
 */
export function checkAccount(options: CheckAccountOptions) {
  const ledgerClient = new LedgerClient();

  const config = {
    subAccount: options.subAccount || (options.accountType === 'wallet' ? 'checking' : 'crypto'),
    currencyField: options.currencyField || 'currency',
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      const currency = req.body[config.currencyField] || req.query[config.currencyField] || 'usd';
      const accountId = `${req.user.userId}:${options.accountType}:${config.subAccount}:${currency}`;

      const balance = await ledgerClient.getBalance(accountId);

      if (!balance) {
        res.status(404).json({
          error: 'Account does not exist',
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Please set up your account before performing this operation',
          accountId,
        });
        return;
      }

      req.accountId = accountId;
      next();
    } catch (error) {
      systemLogger.error('Error in checkAccount middleware', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        error: 'Error checking account',
        code: 'ACCOUNT_CHECK_ERROR',
      });
    }
  };
}



