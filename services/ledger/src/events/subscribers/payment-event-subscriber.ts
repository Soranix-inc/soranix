import { v4 as uuidv4 } from 'uuid';

import { EventSubscriber, EventHandler } from '@packages/events';
import { systemLogger } from '@packages/logging';

import CoreServices from '../../services/core/core.services.js';
import { AccountId, TransactionType, Currency } from '../../types/account-types.js';

/**
 * Payment Event Subscriber
 *
 * Listens to payment events and creates corresponding ledger entries
 */
export class PaymentEventSubscriber {
  constructor(
    private subscriber: EventSubscriber,
    private coreServices: CoreServices
  ) {}

  async subscribeToPaymentEvents(): Promise<void> {
    await this.subscribeToPaymentCreated();
    await this.subscribeToPaymentCompleted();
    await this.subscribeToPaymentFailed();
  }

  private async subscribeToPaymentCreated(): Promise<void> {
    const handler: EventHandler = async (event, data: any) => {
      try {
        systemLogger.info('Processing payment.created event', {
          eventId: event.eventId,
          paymentId: data.paymentId,
          userId: data.userId,
          amount: data.amount,
        });

        const entryId = uuidv4();
        const userAccountId = AccountId.user(data.userId, 'wallet' as any, 'checking', data.currency || Currency.USD);

        // Create double-entry: Debit user, Credit system pending
        await this.coreServices.createDoubleEntry({
          entryId,
          entries: [
            {
              accountId: userAccountId,
              counterAccountId: 'system:pending:payments',
              debit: data.amount,
              credit: '0',
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.PAYMENT,
              referenceId: data.paymentId,
              referenceType: 'payment',
              description: `Payment ${data.paymentMethod || 'credit_card'}`,
              metadata: {
                paymentMethod: data.paymentMethod,
                merchantId: data.merchantId,
              },
              createdBy: 'ledger-service',
            },
            {
              accountId: 'system:pending:payments',
              counterAccountId: userAccountId,
              debit: '0',
              credit: data.amount,
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.PAYMENT,
              referenceId: data.paymentId,
              referenceType: 'payment',
              description: `Payment pending from ${data.userId}`,
              createdBy: 'ledger-service',
            },
          ],
        });

        systemLogger.info('Payment ledger entries created', {
          entryId,
          paymentId: data.paymentId,
        });
      } catch (error) {
        systemLogger.error('Failed to process payment.created event', {
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    await this.subscriber.subscribe('payment.created', handler, {
      queue: 'ledger.payments',
      prefetch: 10,
    });
  }

  private async subscribeToPaymentCompleted(): Promise<void> {
    const handler: EventHandler = async (event, data: any) => {
      try {
        systemLogger.info('Processing payment.completed event', {
          eventId: event.eventId,
          paymentId: data.paymentId,
        });

        // Payment completed: Move from pending to revenue
        const entryId = uuidv4();

        await this.ledgerService.createDoubleEntry({
          entryId,
          entries: [
            {
              accountId: 'system:pending:payments',
              counterAccountId: 'revenue:payments',
              debit: data.amount,
              credit: '0',
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.PAYMENT,
              referenceId: data.paymentId,
              referenceType: 'payment',
              description: `Payment completed - ${data.paymentId}`,
              createdBy: 'ledger-service',
            },
            {
              accountId: 'revenue:payments',
              counterAccountId: 'system:pending:payments',
              debit: '0',
              credit: data.amount,
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.PAYMENT,
              referenceId: data.paymentId,
              referenceType: 'payment',
              description: `Revenue from payment ${data.paymentId}`,
              createdBy: 'ledger-service',
            },
          ],
        });

        systemLogger.info('Payment completion ledger entries created', {
          entryId,
          paymentId: data.paymentId,
        });
      } catch (error) {
        systemLogger.error('Failed to process payment.completed event', {
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    await this.subscriber.subscribe('payment.completed', handler, {
      queue: 'ledger.payments.completed',
      prefetch: 10,
    });
  }

  private async subscribeToPaymentFailed(): Promise<void> {
    const handler: EventHandler = async (event, data: any) => {
      try {
        systemLogger.info('Processing payment.failed event', {
          eventId: event.eventId,
          paymentId: data.paymentId,
        });

        // Payment failed: Refund user from pending
        const entryId = uuidv4();
        const userAccountId = AccountId.user(data.userId, 'wallet' as any, 'checking', data.currency || Currency.USD);

        await this.ledgerService.createDoubleEntry({
          entryId,
          entries: [
            {
              accountId: 'system:pending:payments',
              counterAccountId: userAccountId,
              debit: data.amount,
              credit: '0',
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.REFUND,
              referenceId: data.paymentId,
              referenceType: 'payment',
              description: `Payment failed - refund ${data.paymentId}`,
              createdBy: 'ledger-service',
            },
            {
              accountId: userAccountId,
              counterAccountId: 'system:pending:payments',
              debit: '0',
              credit: data.amount,
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.REFUND,
              referenceId: data.paymentId,
              referenceType: 'payment',
              description: `Refund for failed payment`,
              metadata: {
                failureReason: data.reason,
              },
              createdBy: 'ledger-service',
            },
          ],
        });

        systemLogger.info('Payment failure refund ledger entries created', {
          entryId,
          paymentId: data.paymentId,
        });
      } catch (error) {
        systemLogger.error('Failed to process payment.failed event', {
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    await this.subscriber.subscribe('payment.failed', handler, {
      queue: 'ledger.payments.failed',
      prefetch: 10,
    });
  }
}
