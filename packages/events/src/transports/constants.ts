/**
 * Transport Constants
 * One exchange per service for better isolation and ownership
 */

export const EXCHANGES = {
  // Service-specific exchanges
  AUTH: 'soranix.auth',
  USERS: 'soranix.users',
  LEDGER: 'soranix.ledger',
  PAYMENTS: 'soranix.payments',
  BANKING: 'soranix.banking',
  PORTFOLIO: 'soranix.portfolio',
  BILLS_PAYMENT: 'soranix.bills-payment',
  TRANSFERS: 'soranix.transfers',
  FLOWS: 'soranix.flows',
  MONEY_MANAGEMENT: 'soranix.money-management',
  NOTIFICATION: 'soranix.notification',
  BILLING: 'soranix.billing',
  AI: 'soranix.ai',

  // System exchanges
  AUDIT: 'soranix.audit',
  DEAD_LETTER: 'soranix.dlx',
} as const;
