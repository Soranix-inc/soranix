import { EventPublisher, createEvent, UserRegisteredEvent, UserRegisteredData } from '@packages/events';
import { systemLogger } from '@packages/logging';

export class UserEventPublisher {
  constructor(private publisher: EventPublisher) {}

  async publishUserRegistered(
    userId: string,
    userData: UserRegisteredData,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const event = createEvent<UserRegisteredEvent>('user.registered', userId, userData, {
        metadata: {
          source: 'auth-service',
          service: 'auth',
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0',
          ...metadata,
        },
      });

      await this.publisher.publish(event);

      systemLogger.info('User registered event published', {
        eventId: event.eventId,
        userId,
        email: userData.email,
      });
    } catch (error) {
      systemLogger.error('Failed to publish user registered event', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

