import {
  EventPublisher,
  EventMetadata,
  createEventInstance,
  EventPayload,
  RegisterUserEvent,
  RegisterUserData,
  EmailVerificationRequestedEvent,
  EmailVerificationRequestedData,
  AllDomainEvents,
} from '@packages/events';
import { systemLogger } from '@packages/logging';

export class AuthEventPublisher {
  constructor(private publisher: EventPublisher) {}

  private createAuthEvent<T extends AllDomainEvents>(
    event: EventPayload<T>,
    aggregateId: string,
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ): T {
    return createEventInstance<T>(event, aggregateId, options);
  }

  private getDefaultMetadata(overrides?: Record<string, any>): EventMetadata {
    return {
      source: 'auth-service',
      service: 'auth',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      ...overrides,
    };
  }

  async publishUserRegistered(
    userId: string,
    userData: RegisterUserData,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const eventMetadata = this.getDefaultMetadata(metadata);

      const event: RegisterUserEvent = this.createAuthEvent(
        {
          eventType: 'auth.user.registered',
          data: userData,
        } as RegisterUserEvent,
        userId,
        { metadata: eventMetadata }
      );

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

  async publishEmailVerificationRequested(
    userId: string,
    verificationData: EmailVerificationRequestedData,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const eventMetadata = this.getDefaultMetadata(metadata);

      const event: EmailVerificationRequestedEvent = this.createAuthEvent(
        {
          eventType: 'auth.email.verification.requested',
          data: verificationData,
        } as EmailVerificationRequestedEvent,
        userId,
        { metadata: eventMetadata }
      );

      await this.publisher.publish(event);

      systemLogger.info('Email verification requested event published', {
        eventId: event.eventId,
        userId,
        email: verificationData.email,
      });
    } catch (error) {
      systemLogger.error('Failed to publish email verification requested event', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
