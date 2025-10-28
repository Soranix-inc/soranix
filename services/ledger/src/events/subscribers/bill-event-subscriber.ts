import { v4 as uuidv4 } from 'uuid';

import { EventSubscriber, EventHandler } from '@packages/events';
import { systemLogger } from '@packages/logging';

import CoreServices from '../../services/core/core.services.js';
import { AccountId, TransactionType, Currency } from '../../types/account-types.js';

/**
 * Bill Payment Event Subscriber
 *
 * Listens to bill payment events and creates ledger entries
 */
export class BillEventSubscriber {
  constructor(
    private subscriber: EventSubscriber,
    private coreServices: CoreServices
  ) {}

  async subscribeToBillEvents(): Promise<void> {
    await this.subscribeToBillPaymentInitiated();
    await this.subscribeToBillPaymentCompleted();
  }

  private async subscribeToBillPaymentInitiated(): Promise<void> {
    const handler: EventHandler = async (event, data: any) => {
      try {
        systemLogger.info('Processing bill.payment.initiated event', {
          eventId: event.eventId,
          billId: data.billId,
          userId: data.userId,
          amount: data.amount,
        });

        const entryId = uuidv4();
        const userAccountId = AccountId.user(data.userId, 'wallet' as any, 'checking', data.currency || Currency.USD);

        // Create double-entry: Debit user wallet, Credit system bills payable
        await this.coreServices.createDoubleEntry({
          entryId,
          entries: [
            {
              accountId: userAccountId,
              counterAccountId: 'system:bills_payable',
              debit: data.amount,
              credit: '0',
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.BILL_PAYMENT,
              referenceId: data.billId,
              referenceType: 'bill',
              description: `Bill payment: ${data.billerName || 'Unknown biller'}`,
              metadata: {
                billerId: data.billerId,
                billerName: data.billerName,
                billReference: data.billReference,
                dueDate: data.dueDate,
              },
              createdBy: 'ledger-service',
            },
            {
              accountId: 'system:bills_payable',
              counterAccountId: userAccountId,
              debit: '0',
              credit: data.amount,
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.BILL_PAYMENT,
              referenceId: data.billId,
              referenceType: 'bill',
              description: `Bill payment from ${data.userId}`,
              createdBy: 'ledger-service',
            },
          ],
        });

        systemLogger.info('Bill payment ledger entries created', {
          entryId,
          billId: data.billId,
        });
      } catch (error) {
        systemLogger.error('Failed to process bill.payment.initiated event', {
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    await this.subscriber.subscribe('bill.payment.initiated', handler, {
      queue: 'ledger.bills',
      prefetch: 10,
    });
  }

  private async subscribeToBillPaymentCompleted(): Promise<void> {
    const handler: EventHandler = async (event, data: any) => {
      try {
        systemLogger.info('Processing bill.payment.completed event', {
          eventId: event.eventId,
          billId: data.billId,
        });

        // Bill completed: Move from payable to expense
        const entryId = uuidv4();

        await this.coreServices.createDoubleEntry({
          entryId,
          entries: [
            {
              accountId: 'system:bills_payable',
              counterAccountId: 'expense:bills',
              debit: data.amount,
              credit: '0',
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.BILL_PAYMENT,
              referenceId: data.billId,
              referenceType: 'bill',
              description: `Bill payment completed - ${data.billId}`,
              createdBy: 'ledger-service',
            },
            {
              accountId: 'expense:bills',
              counterAccountId: 'system:bills_payable',
              debit: '0',
              credit: data.amount,
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.BILL_PAYMENT,
              referenceId: data.billId,
              referenceType: 'bill',
              description: `Bill expense - ${data.billId}`,
              createdBy: 'ledger-service',
            },
          ],
        });

        systemLogger.info('Bill completion ledger entries created', {
          entryId,
          billId: data.billId,
        });
      } catch (error) {
        systemLogger.error('Failed to process bill.payment.completed event', {
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    await this.subscriber.subscribe('bill.payment.completed', handler, {
      queue: 'ledger.bills.completed',
      prefetch: 10,
    });
  }
}
