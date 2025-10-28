import { SoranixError } from '../errors/soranix-error.js';

/**
 * Base error class for payment-related errors
 */
export class PaymentError extends SoranixError {
  constructor(code: string, message: string, context?: Record<string, any>) {
    super(code, message, 400, { context });
    this.name = 'PaymentError';
  }
}

/**
 * Insufficient balance error
 */
export class InsufficientBalanceError extends PaymentError {
  constructor(userId: string, required: number, available: number, currency: string) {
    super('INSUFFICIENT_BALANCE', 'Insufficient balance for transaction', {
      userId,
      required,
      available,
      currency,
      field: 'balance',
    });
  }
}

/**
 * Payment method not found error
 */
export class PaymentMethodNotFoundError extends PaymentError {
  constructor(userId: string, paymentMethodId: string) {
    super('PAYMENT_METHOD_NOT_FOUND', 'Payment method not found', {
      userId,
      paymentMethodId,
      field: 'paymentMethod',
    });
  }
}

/**
 * Payment failed error
 */
export class PaymentFailedError extends PaymentError {
  constructor(transactionId: string, reason: string, provider?: string) {
    super('PAYMENT_FAILED', `Payment failed: ${reason}`, {
      transactionId,
      reason,
      provider,
      field: 'payment',
    });
  }
}

/**
 * Invalid payment amount error
 */
export class InvalidPaymentAmountError extends PaymentError {
  constructor(amount: number, currency: string, reason?: string) {
    const message = reason ? `Invalid payment amount: ${reason}` : `Invalid payment amount: ${amount} ${currency}`;

    super('INVALID_PAYMENT_AMOUNT', message, {
      amount,
      currency,
      reason,
      field: 'amount',
    });
  }
}

/**
 * Payment provider error
 */
export class PaymentProviderError extends PaymentError {
  constructor(provider: string, operation: string, originalError: string) {
    super('PAYMENT_PROVIDER_ERROR', `Payment provider error: ${originalError}`, {
      provider,
      operation,
      originalError,
      field: 'provider',
    });
  }
}
