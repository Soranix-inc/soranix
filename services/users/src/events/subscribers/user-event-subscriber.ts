import { EventSubscriber, EventHandler, UserRegisteredData } from '@packages/events';
import { systemLogger } from '@packages/logging';

export class UserEventSubscriber {
  constructor(private subscriber: EventSubscriber) {}

  async subscribeToUserEvents(): Promise<void> {
    await this.subscribeToUserRegistered();
  }

  private async subscribeToUserRegistered(): Promise<void> {
    const handler: EventHandler = async (event, data: UserRegisteredData) => {
      try {
        systemLogger.info('Received user.registered event', {
          eventId: event.eventId,
          userId: data.userId,
          email: data.email,
        });

        // TODO: Add your business logic here
        // Examples:
        // - Create user profile in users database
        // - Initialize user preferences
        // - Set up default settings
        // - Create user wallet/account

        systemLogger.info('Processing new user registration', {
          userId: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        });

        // Simulate processing
        await this.handleUserRegistration(data);

        systemLogger.info('User registration processed successfully', {
          userId: data.userId,
        });
      } catch (error) {
        systemLogger.error('Failed to process user.registered event', {
          eventId: event.eventId,
          userId: data.userId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    await this.subscriber.subscribe(['user.registered'], handler);

    systemLogger.info('Subscribed to user.registered events');
  }

  private async handleUserRegistration(data: UserRegisteredData): Promise<void> {
    // TODO: Implement your user registration handling logic
    // For example:
    // 1. Create user profile in database
    // 2. Initialize user settings
    // 3. Create user-related resources

    systemLogger.info('User registration handler executed', {
      userId: data.userId,
      email: data.email,
    });

    // Example: Simulate database operation
    // await userRepository.createProfile({
    //   userId: data.userId,
    //   email: data.email,
    //   firstName: data.firstName,
    //   lastName: data.lastName,
    // });
  }
}
