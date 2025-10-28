import { BaseEvent, EventConfig, EventPriority, DeliveryGuarantee } from './base-event.js';

// Bills Payment Event Interfaces
export interface BillPaymentInitiatedData {
  billPaymentId: string;
  userId: string;
  billerId: string;
  amount: number;
  currency: string;
  billReference: string;
  dueDate: Date;
  metadata?: Record<string, any>;
}

export interface BillPaymentCompletedData extends BillPaymentInitiatedData {
  status: string;
  completedAt: Date;
  transactionId?: string;
}

export interface BillPaymentFailedData extends BillPaymentInitiatedData {
  status: string;
  error: string;
  failedAt: Date;
}

// Bills Payment Event Types
export interface BillPaymentInitiatedEvent extends BaseEvent {
  eventType: 'bill.payment.initiated';
  data: BillPaymentInitiatedData;
}

export interface BillPaymentCompletedEvent extends BaseEvent {
  eventType: 'bill.payment.completed';
  data: BillPaymentCompletedData;
}

export interface BillPaymentFailedEvent extends BaseEvent {
  eventType: 'bill.payment.failed';
  data: BillPaymentFailedData;
}

// Bills Payment Event Configuration
export const BILLS_EVENT_CONFIG: Record<string, EventConfig> = {
  'bill.payment.initiated': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 300000, // 5 minutes
    maxRetries: 3,
  },
  'bill.payment.completed': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 3,
  },
  'bill.payment.failed': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 3,
  },
};
