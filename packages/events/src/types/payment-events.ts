import { BaseEvent, EventConfig, EventPriority, DeliveryGuarantee } from './base-event.js';

// Payment Event Interfaces
export interface PaymentCreatedData {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  merchantId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentProcessingData extends PaymentCreatedData {
  status: string;
  processingTime?: number;
}

export interface PaymentCompletedData extends PaymentCreatedData {
  status: string;
  completedAt: Date;
  transactionId?: string;
}

export interface PaymentFailedData extends PaymentCreatedData {
  status: string;
  error: string;
  failedAt: Date;
}

// Payment Event Types
export interface PaymentCreatedEvent extends BaseEvent {
  eventType: 'payment.created';
  data: PaymentCreatedData;
}

export interface PaymentProcessingEvent extends BaseEvent {
  eventType: 'payment.processing';
  data: PaymentProcessingData;
}

export interface PaymentCompletedEvent extends BaseEvent {
  eventType: 'payment.completed';
  data: PaymentCompletedData;
}

export interface PaymentFailedEvent extends BaseEvent {
  eventType: 'payment.failed';
  data: PaymentFailedData;
}

// Payment Event Configuration
export const PAYMENT_EVENT_CONFIG: Record<string, EventConfig> = {
  'payment.created': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 300000, // 5 minutes
    maxRetries: 3,
  },
  'payment.processing': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 300000, // 5 minutes
    maxRetries: 3,
  },
  'payment.completed': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 3,
  },
  'payment.failed': {
    priority: EventPriority.CRITICAL,
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    requiresEncryption: true,
    ttl: 604800000, // 7 days
    maxRetries: 3,
  },
};
