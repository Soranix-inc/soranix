import { DomainEvent, EventConfig, EventPriority, DeliveryGuarantee, EventMetadata } from './base-event.js';

// Notification Events
export interface NotificationData {
  notificationId: string;
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export class NotificationSentEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: NotificationData & { sentAt: Date; channel: string },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('notification.sent', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: false,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class NotificationDeliveredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: NotificationData & { deliveredAt: Date; channel: string },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('notification.delivered', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: false,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class NotificationFailedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: NotificationData & { failedAt: Date; error: string; channel: string },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('notification.failed', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: false,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class EmailSentEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: {
      emailId: string;
      userId: string;
      to: string;
      subject: string;
      templateId?: string;
      sentAt: Date;
      metadata?: Record<string, any>;
    },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('email.sent', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: false,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class SMSSentEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: {
      smsId: string;
      userId: string;
      to: string;
      message: string;
      sentAt: Date;
      metadata?: Record<string, any>;
    },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('sms.sent', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: false,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class PushSentEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: {
      pushId: string;
      userId: string;
      deviceToken: string;
      title: string;
      body: string;
      sentAt: Date;
      metadata?: Record<string, any>;
    },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('push.sent', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: false,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}
