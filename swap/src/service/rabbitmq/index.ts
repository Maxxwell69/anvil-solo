import amqp from 'amqplib';
import { MessageQueue, Message, MessageHandler } from '../../interfaces/MessageQueue';
import { Logger } from '../../interfaces/Logger';

/**
 * RabbitMQ implementation of the MessageQueue interface
 */
export class RabbitMQService implements MessageQueue {
  private connection: any = null;
  private channel: any = null;
  private isConnected = false;

  /**
   * Create a new RabbitMQService
   * @param url The RabbitMQ connection URL
   * @param prefetchCount The number of messages to prefetch
   * @param logger The logger to use
   */
  constructor(
    private readonly url: string,
    private readonly prefetchCount: number,
    private readonly logger: Logger
  ) {}

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      this.logger.info(`Connecting to RabbitMQ at ${this.url}`);
      
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Set prefetch count
      await this.channel.prefetch(this.prefetchCount);
      
      // Set up connection event handlers
      this.connection.on('error', (err: any) => {
        this.logger.error('RabbitMQ connection error', err);
        this.isConnected = false;
      });
      
      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });
      
      this.isConnected = true;
      this.logger.info('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Start consuming messages from a queue
   * @param queueName The name of the queue to consume from
   * @param handler The function to handle each message
   */
  async consume(queueName: string, handler: MessageHandler): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }
    
    try {
      // Assert queue exists
      await this.channel.assertQueue(queueName, { durable: true });
      
      this.logger.info(`Starting to consume messages from queue ${queueName}`);
      
      // Start consuming
      await this.channel.consume(queueName, async (msg: any) => {
        if (!msg) {
          return;
        }
        
        try {
          // Parse message content
          const content = JSON.parse(msg.content.toString());
          
          // Create message object
          const message: Message = {
            id: msg.properties.messageId || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
            content,
            properties: msg.properties,
            raw: msg
          };
          
          // Process message
          await handler(message);
        } catch (error) {
          this.logger.error('Error processing message', error);
          // Reject the message and requeue it
          this.channel.nack(msg, false, true);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to consume from queue ${queueName}`, error);
      throw error;
    }
  }

  /**
   * Acknowledge a message as successfully processed
   * @param message The message to acknowledge
   */
  async acknowledge(message: Message): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }
    
    try {
      this.channel.ack(message.raw);
    } catch (error) {
      this.logger.error('Failed to acknowledge message', error);
      throw error;
    }
  }

  /**
   * Reject a message as failed to process
   * @param message The message to reject
   * @param requeue Whether to requeue the message for later processing
   */
  async reject(message: Message, requeue: boolean): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }
    
    try {
      this.channel.nack(message.raw, false, requeue);
    } catch (error) {
      this.logger.error('Failed to reject message', error);
      throw error;
    }
  }
  
  /**
   * Publish a message to a queue
   * @param queueName The name of the queue to publish to
   * @param content The content of the message
   * @param options Additional options for the message
   */
  async publish(queueName: string, content: any, options?: Record<string, any>): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }
    
    try {
      // Assert queue exists
      await this.channel.assertQueue(queueName, { durable: true });
      
      // Prepare message options
      const messageOptions = {
        persistent: true, // Make message persistent
        messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        timestamp: Date.now(),
        ...options
      };
      
      // Convert content to Buffer
      const buffer = Buffer.from(JSON.stringify(content));
      
      // Publish message
      this.channel.sendToQueue(queueName, buffer, messageOptions);
      
      this.logger.debug(`Published message to queue ${queueName}`, { messageId: messageOptions.messageId });
    } catch (error) {
      this.logger.error(`Failed to publish message to queue ${queueName}`, error);
      throw error;
    }
  }

  /**
   * Close the connection to RabbitMQ
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      
      if (this.connection) {
        await this.connection.close();
      }
      
      this.isConnected = false;
      this.logger.info('Closed RabbitMQ connection');
    } catch (error) {
      this.logger.error('Failed to close RabbitMQ connection', error);
      throw error;
    }
  }

  /**
   * Check if the connection is healthy
   */
  isHealthy(): boolean {
    return this.isConnected;
  }
}

/**
 * Create a new RabbitMQService
 * @param url The RabbitMQ connection URL
 * @param prefetchCount The number of messages to prefetch
 * @param logger The logger to use
 * @returns A new RabbitMQService
 */
export const createRabbitMQService = (
  url: string,
  prefetchCount: number,
  logger: Logger
): MessageQueue => {
  return new RabbitMQService(url, prefetchCount, logger);
};
