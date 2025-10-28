import { v4 as uuidv4 } from 'uuid';

import { EventSubscriber, EventHandler } from '@packages/events';
import { systemLogger } from '@packages/logging';

import CoreServices from '../../services/core/core.services.js';
import { AccountId, TransactionType, Currency } from '../../types/account-types.js';

/**
 * Transfer Event Subscriber
 *
 * Listens to transfer events and creates ledger entries
 */
export class TransferEventSubscriber {
  constructor(
    private subscriber: EventSubscriber,
    private coreServices: CoreServices
  ) {}

  async subscribeToTransferEvents(): Promise<void> {
    await this.subscribeToTransferInitiated();
    await this.subscribeToTransferCompleted();
  }

  private async subscribeToTransferInitiated(): Promise<void> {
    const handler: EventHandler = async (event, data: any) => {
      try {
        systemLogger.info('Processing transfer.initiated event', {
          eventId: event.eventId,
          transferId: data.transferId,
          from: data.fromUserId,
          to: data.toUserId,
          amount: data.amount,
        });

        const entryId = uuidv4();
        const fromAccountId = AccountId.user(
          data.fromUserId,
          'wallet' as any,
          'checking',
          data.currency || Currency.USD
        );
        const toAccountId = AccountId.user(data.toUserId, 'wallet' as any, 'checking', data.currency || Currency.USD);

        // Create double-entry: Debit sender, Credit receiver
        await this.coreServices.createDoubleEntry({
          entryId,
          entries: [
            {
              accountId: fromAccountId,
              counterAccountId: toAccountId,
              debit: data.amount,
              credit: '0',
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.P2P_TRANSFER,
              referenceId: data.transferId,
              referenceType: 'transfer',
              description: `Transfer to ${data.toUserId}`,
              metadata: {
                transferType: data.transferType,
                note: data.note,
              },
              createdBy: 'ledger-service',
            },
            {
              accountId: toAccountId,
              counterAccountId: fromAccountId,
              debit: '0',
              credit: data.amount,
              currency: data.currency || Currency.USD,
              transactionType: TransactionType.P2P_TRANSFER,
              referenceId: data.transferId,
              referenceType: 'transfer',
              description: `Transfer from ${data.fromUserId}`,
              createdBy: 'ledger-service',
            },
          ],
        });

        systemLogger.info('Transfer ledger entries created', {
          entryId,
          transferId: data.transferId,
        });
      } catch (error) {
        systemLogger.error('Failed to process transfer.initiated event', {
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    await this.subscriber.subscribe('transfer.initiated', handler, {
      queue: 'ledger.transfers',
      prefetch: 10,
    });
  }

  private async subscribeToTransferCompleted(): Promise<void> {
    const handler: EventHandler = async (event, data: any) => {
      systemLogger.info('Transfer completed - no additional ledger action needed', {
        transferId: data.transferId,
      });
      // Transfer was already recorded on initiation
      // Could update metadata or create audit entry here if needed
    };

    await this.subscriber.subscribe('transfer.completed', handler, {
      queue: 'ledger.transfers.completed',
      prefetch: 10,
    });
  }
}
