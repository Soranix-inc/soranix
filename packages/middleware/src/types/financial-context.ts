/**
 * Financial context attached to requests
 */
export interface FinancialContext {
  accountId: string;
  balance: string;
  availableBalance: string;
  currency: string;
  asOf: Date;
}

/**
 * Extend Express Request to include financial context
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Balance information attached by attachBalance middleware
       */
      balance?: FinancialContext;

      /**
       * Account ID attached by middleware
       */
      accountId?: string;
    }
  }
}

export {};
