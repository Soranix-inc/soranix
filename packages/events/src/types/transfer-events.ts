import { BaseEvent, EventConfig, EventPriority, DeliveryGuarantee } from './base-event.js';

// Transfer Event Interfaces
export interface TransferInitiatedData {
  transferId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TransferCompletedData extends TransferInitiatedData {
  status: string;
  completedAt: Date;
  transactionId?: string;
}

export interface TransferFailedData extends TransferInitiatedData {
  status: string;
  error: string;
  failedAt: Date;
}

// Transfer Event Types
export interface TransferInitiatedEvent extends BaseEvent {
  eventType: 'transfer.initiated';
  data: TransferInitiatedData;
}

export interface TransferCompletedEvent extends BaseEvent {
  eventType: 'transfer.completed';
  data: TransferCompletedData;
}

export interface TransferFailedEvent extends BaseEvent {
  eventType: 'transfer.failed';
  data: TransferFailedData;
}

// Transfer Event Configuration
export const TRANSFER_EVENT_CONFIG: Record<string, EventConfig> = {
  'transfer.initiated': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 300000, // 5 minutes
    maxRetries: 3,
  },
  'transfer.completed': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 3,
  },
  'transfer.failed': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 3,
  },
};
