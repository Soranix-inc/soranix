import amqp, { type Connection, type Channel } from 'amqplib';

import { systemLogger } from '@packages/logging';

export interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
  heartbeat?: number;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export class RabbitMQConnection {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: RabbitMQConfig;
  private reconnectAttempts = 0;
  private isConnecting = false;

  constructor(config: RabbitMQConfig) {
    this.config = {
      vhost: '/',
      heartbeat: 60,
      reconnectDelay: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const connectionString = this.buildConnectionString();
      systemLogger.info('Connecting to RabbitMQ...', { host: this.config.host, port: this.config.port });

      const conn = await amqp.connect(connectionString);
      this.connection = conn as unknown as Connection;
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }

      this.channel = (await (this.connection as any).createChannel()) as Channel;
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Set up connection event handlers
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));

      // Set up channel event handlers
      this.channel.on('error', this.handleChannelError.bind(this));
      this.channel.on('close', this.handleChannelClose.bind(this));

      this.reconnectAttempts = 0;
      this.isConnecting = false;

      systemLogger.info('Successfully connected to RabbitMQ');
    } catch (error) {
      this.isConnecting = false;
      systemLogger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : String(error),
      });
      await this.handleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }

      systemLogger.info('Disconnected from RabbitMQ');
    } catch (error) {
      systemLogger.error('Error disconnecting from RabbitMQ', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available. Call connect() first.');
    }
    return this.channel;
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  private buildConnectionString(): string {
    const { host, port, username, password, vhost } = this.config;
    return `amqp://${username}:${password}@${host}:${port}${vhost}`;
  }

  private handleConnectionError(error: Error): void {
    systemLogger.error('RabbitMQ connection error', { error: error.message });
  }

  private handleConnectionClose(): void {
    systemLogger.warn('RabbitMQ connection closed');
    this.connection = null;
    this.channel = null;
    this.handleReconnect();
  }

  private handleChannelError(error: Error): void {
    systemLogger.error('RabbitMQ channel error', { error: error.message });
  }

  private handleChannelClose(): void {
    systemLogger.warn('RabbitMQ channel closed');
    this.channel = null;
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      systemLogger.error('Max reconnection attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay! * this.reconnectAttempts;

    systemLogger.info(`Attempting to reconnect to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        systemLogger.error('Reconnection failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, delay);
  }
}

let rabbitMQConnection: RabbitMQConnection | null = null;

export function getRabbitMQConnection(): RabbitMQConnection {
  if (!rabbitMQConnection) {
    const config: RabbitMQConfig = {
      host: process.env.RABBITMQ_HOST || 'localhost',
      port: parseInt(process.env.RABBITMQ_PORT || '5672'),
      username: process.env.RABBITMQ_USERNAME || 'guest',
      password: process.env.RABBITMQ_PASSWORD || 'guest',
      vhost: process.env.RABBITMQ_VHOST || '/',
    };

    rabbitMQConnection = new RabbitMQConnection(config);
  }

  return rabbitMQConnection;
}
