import type { Request, Response, NextFunction } from 'express';

import { LedgerClient } from '@packages/ledger-client';
import { systemLogger } from '@packages/logging';

export interface ValidateBalanceOptions {
  /**
   * Account type to check
   * Default: 'wallet'
   */
  accountType?: 'wallet' | 'investment';

  /**
   * Sub-account to check
   * Default: 'checking'
   */
  subAccount?: string;

  /**
   * Safety buffer amount to add to required balance
   * Default: 0
   */
  buffer?: number;

  /**
   * Field name in request body that contains the amount
   * Default: 'amount'
   */
  amountField?: string;

  /**
   * Field name in request body that contains the currency
   * Default: 'currency'
   */
  currencyField?: string;

  /**
   * Use cache for balance lookup
   * Default: true
   */
  useCache?: boolean;

  /**
   * Cache TTL in seconds
   * Default: 30
   */
  cacheTTL?: number;
}

/**
 * Validate Balance Middleware
 *
 * Checks if user has sufficient balance for the requested operation.
 * Must be used AFTER requireAuth() middleware.
 *
 * Usage:
 * ```typescript
 * router.post('/payment',
 *   requireAuth(),
 *   validateBalance({ accountType: 'wallet', buffer: 1 }),
 *   processPayment
 * );
 * ```
 */
export function validateBalance(options: ValidateBalanceOptions = {}) {
  const ledgerClient = new LedgerClient();

  const config = {
    accountType: options.accountType || 'wallet',
    subAccount: options.subAccount || 'checking',
    buffer: options.buffer || 0,
    amountField: options.amountField || 'amount',
    currencyField: options.currencyField || 'currency',
    useCache: options.useCache !== false,
    cacheTTL: options.cacheTTL || 30,
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

      // Get amount and currency from request
      const amount = parseFloat(req.body[config.amountField]);
      const currency = req.body[config.currencyField] || 'usd';

      if (isNaN(amount) || amount <= 0) {
        res.status(400).json({
          error: 'Valid amount is required',
          code: 'INVALID_AMOUNT',
        });
        return;
      }

      // Build account ID
      const accountId = `${req.user.userId}:${config.accountType}:${config.subAccount}:${currency}`;

      // Get balance from Ledger (with caching)
      const balance = await ledgerClient.getBalance(accountId, {
        useCache: config.useCache,
        cacheTTL: config.cacheTTL,
      });

      if (!balance) {
        res.status(404).json({
          error: 'Account not found',
          code: 'ACCOUNT_NOT_FOUND',
          accountId,
        });
        return;
      }

      // Check sufficient balance
      const available = parseFloat(balance.availableBalance);
      const required = amount + config.buffer;

      if (available < required) {
        systemLogger.warn('Insufficient funds', {
          userId: req.user.userId,
          accountId,
          available,
          required,
          shortfall: required - available,
        });

        res.status(400).json({
          error: 'Insufficient funds',
          code: 'INSUFFICIENT_FUNDS',
          details: {
            available: available.toFixed(4),
            required: required.toFixed(4),
            shortfall: (required - available).toFixed(4),
          },
        });
        return;
      }

      systemLogger.debug('Balance validation passed', {
        userId: req.user.userId,
        accountId,
        available,
        required,
      });

      next();
    } catch (error) {
      systemLogger.error('Error in validateBalance middleware', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
      });

      res.status(500).json({
        error: 'Error validating balance',
        code: 'VALIDATION_ERROR',
      });
    }
  };
}
