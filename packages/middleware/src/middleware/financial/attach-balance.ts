import type { Request, Response, NextFunction } from 'express';

import { LedgerClient } from '@packages/ledger-client';
import { systemLogger } from '@packages/logging';

import type { FinancialContext } from '../../types/financial-context.js';

export interface AttachBalanceOptions {
  /**
   * Account type to fetch
   */
  accountType: 'wallet' | 'investment';

  /**
   * Sub-account to fetch
   * Default: 'checking' for wallet, 'crypto' for investment
   */
  subAccount?: string;

  /**
   * Currency field in request (body or query)
   * Default: 'currency'
   */
  currencyField?: string;

  /**
   * Use cache for balance lookup
   * Default: true
   */
  useCache?: boolean;

  /**
   * Where to attach balance in request
   * Default: 'balance'
   */
  attachTo?: string;

  /**
   * Fail request if account not found
   * Default: true
   */
  required?: boolean;
}

/**
 * Attach Balance Middleware
 *
 * Fetches and attaches user's balance to the request object.
 * Must be used AFTER requireAuth() middleware.
 *
 * Usage:
 * ```typescript
 * router.post('/payment',
 *   requireAuth(),
 *   attachBalance({ accountType: 'wallet' }),
 *   processPayment
 * );
 *
 * // In controller
 * async processPayment(req, res) {
 *   const currentBalance = req.balance.availableBalance;
 *   // ...
 * }
 * ```
 */
export function attachBalance(options: AttachBalanceOptions) {
  const ledgerClient = new LedgerClient();

  const config = {
    subAccount: options.subAccount || (options.accountType === 'wallet' ? 'checking' : 'crypto'),
    currencyField: options.currencyField || 'currency',
    useCache: options.useCache !== false,
    attachTo: options.attachTo || 'balance',
    required: options.required !== false,
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      // Get currency from request
      const currency = req.body[config.currencyField] || req.query[config.currencyField] || 'usd';

      // Build account ID
      const accountId = `${req.user.userId}:${options.accountType}:${config.subAccount}:${currency}`;
      req.accountId = accountId; // Also attach account ID

      // Get balance from Ledger
      const balance = await ledgerClient.getBalance(accountId, {
        useCache: config.useCache,
      });

      if (!balance) {
        if (config.required) {
          res.status(404).json({
            error: 'Account not found',
            code: 'ACCOUNT_NOT_FOUND',
            accountId,
          });
          return;
        } else {
          // Not required, continue without balance
          next();
          return;
        }
      }

      // Attach balance to request
      const financialContext: FinancialContext = {
        accountId: balance.accountId,
        balance: balance.balance,
        availableBalance: balance.availableBalance,
        currency: balance.currency,
        asOf: balance.asOf,
      };

      req[config.attachTo] = financialContext;

      systemLogger.debug('Balance attached to request', {
        userId: req.user.userId,
        accountId,
        balance: balance.balance,
      });

      next();
    } catch (error) {
      systemLogger.error('Error in attachBalance middleware', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
      });

      res.status(500).json({
        error: 'Error fetching balance',
        code: 'BALANCE_FETCH_ERROR',
      });
    }
  };
}

