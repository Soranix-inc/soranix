/**
 * Account Types and Structure
 *
 * Account ID Format: {user_id}:{account_type}:{sub_account}:{currency}
 * Examples:
 * - alice_123:wallet:checking:usd
 * - alice_123:wallet:savings:usd
 * - alice_123:investment:stocks:usd
 * - alice_123:investment:crypto:btc
 */

export enum AccountType {
  // User Accounts
  WALLET = 'wallet',
  INVESTMENT = 'investment',
  BILLS = 'bills',

  // System Accounts
  SYSTEM = 'system',
  LIABILITY = 'liability',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum WalletSubAccount {
  CHECKING = 'checking', // Main spending account
  SAVINGS = 'savings', // Savings account
  RESERVE = 'reserve', // Reserved funds (pending transactions)
}

export enum InvestmentSubAccount {
  STOCKS = 'stocks', // Stock portfolio
  CRYPTO = 'crypto', // Cryptocurrency
  BONDS = 'bonds', // Bonds
  MUTUAL_FUNDS = 'mutual_funds',
}

export enum SystemSubAccount {
  FEES = 'fees',
  RESERVES = 'reserves',
  PENDING = 'pending',
  EXCHANGE = 'exchange',
  BILLS_PAYABLE = 'bills_payable',
}

export enum Currency {
  // Fiat
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
  NGN = 'ngn',

  // Crypto
  BTC = 'btc',
  ETH = 'eth',
  USDT = 'usdt',
  USDC = 'usdc',
}

export enum TransactionType {
  // Deposits & Withdrawals
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',

  // Transfers
  P2P_TRANSFER = 'p2p_transfer',
  INTERNAL_TRANSFER = 'internal_transfer', // Between user's own accounts

  // Payments
  PAYMENT = 'payment',
  BILL_PAYMENT = 'bill_payment',
  REFUND = 'refund',

  // Exchanges
  EXCHANGE_FIAT = 'exchange_fiat', // Fiat to Crypto
  EXCHANGE_CRYPTO = 'exchange_crypto', // Crypto to Fiat
  EXCHANGE_CRYPTO_SWAP = 'exchange_crypto_swap', // Crypto to Crypto

  // Investments
  STOCK_PURCHASE = 'stock_purchase',
  STOCK_SALE = 'stock_sale',
  DIVIDEND = 'dividend',

  // Fees & Charges
  FEE = 'fee',
  INTEREST = 'interest',
  PENALTY = 'penalty',

  // Corrections
  CORRECTION = 'correction',
  REVERSAL = 'reversal',
}

/**
 * Account ID Builder
 */
export class AccountId {
  static user(userId: string, accountType: AccountType, subAccount: string, currency: Currency): string {
    return `${userId}:${accountType}:${subAccount}:${currency}`;
  }

  static system(subAccount: SystemSubAccount, currency?: Currency): string {
    return currency ? `system:${subAccount}:${currency}` : `system:${subAccount}`;
  }

  static parse(accountId: string): {
    userId?: string;
    accountType: string;
    subAccount: string;
    currency?: string;
  } {
    const parts = accountId.split(':');

    if (parts[0] === 'system') {
      return {
        accountType: parts[0],
        subAccount: parts[1],
        currency: parts[2],
      };
    }

    return {
      userId: parts[0],
      accountType: parts[1],
      subAccount: parts[2],
      currency: parts[3],
    };
  }

  static isUserAccount(accountId: string): boolean {
    return (
      !accountId.startsWith('system:') &&
      !accountId.startsWith('liability:') &&
      !accountId.startsWith('revenue:') &&
      !accountId.startsWith('expense:')
    );
  }

  static isSystemAccount(accountId: string): boolean {
    return !this.isUserAccount(accountId);
  }
}

