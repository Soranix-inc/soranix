import { BaseEvent } from '../types/base-event.js';

/**
 * Event Router - Determines which transport to use for each event type
 *
 * Strategy:
 * - Kafka: Financial events that need audit trail, replay capability, and long retention (7 years)
 * - RabbitMQ: Operational events that are fire-and-forget (emails, notifications, background jobs)
 * - Both: Critical events that benefit from redundancy
 */
export class EventRouter {
  /**
   * Should this event go to Kafka?
   * (Financial events that need audit trail & replay)
   */
  static shouldUseKafka(eventType: string): boolean {
    const kafkaEvents = [
      // Financial domain (7-year retention for compliance)
      'payment.',
      'transfer.',
      'deposit.',
      'withdrawal.',
      'bill.',
      'exchange.',
      'ledger.',
      'balance.',

      // Audit & compliance
      'audit.',
      'compliance.',
      'kyc.verified', // Important for compliance
      'kyc.rejected',
    ];

    return kafkaEvents.some((prefix) => eventType.startsWith(prefix));
  }

  /**
   * Should this event go to RabbitMQ?
   * (Operational events that are fire-and-forget)
   */
  static shouldUseRabbitMQ(eventType: string): boolean {
    const rabbitmqEvents = [
      // User operational events
      'user.registered',
      'user.login',
      'user.logout',
      'user.profile.',

      // Notifications (fire-and-forget)
      'email.',
      'sms.',
      'push.',
      'notification.',

      // Background jobs
      'report.',
      'kyc.initiated', // Start of KYC process

      // AI/ML tasks
      'ai.',
    ];

    return rabbitmqEvents.some((prefix) => eventType.startsWith(prefix));
  }

  /**
   * Get transport type for event
   * @returns 'kafka' | 'rabbitmq' | 'both'
   */
  static getTransportType(event: BaseEvent): 'kafka' | 'rabbitmq' | 'both' {
    const useKafka = this.shouldUseKafka(event.eventType);
    const useRabbitMQ = this.shouldUseRabbitMQ(event.eventType);

    if (useKafka && useRabbitMQ) return 'both'; // Publish to both for redundancy
    if (useKafka) return 'kafka';
    if (useRabbitMQ) return 'rabbitmq';

    // Default: Use RabbitMQ for unknown events (safer for operational events)
    return 'rabbitmq';
  }

  /**
   * Check if event should use specific transport
   */
  static usesTransport(event: BaseEvent, transport: 'kafka' | 'rabbitmq'): boolean {
    const transportType = this.getTransportType(event);
    return transportType === transport || transportType === 'both';
  }
}
