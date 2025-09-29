import { MessageQueue } from '../../interfaces/MessageQueue';
import { SwapProcessor, SwapData } from '../../interfaces/SwapProcessor';
import { HealthCheck, HealthStatus } from '../../interfaces/HealthCheck';
import { Logger } from '../../interfaces/Logger';
import { AppConfig } from '../../interfaces/Config';
import { delay } from '..';

/**
 * Service for consuming swap operations from a message queue
 */
export class SwapConsumerService {
  private isRunning = false;

  /**
   * Create a new SwapConsumerService
   * @param messageQueue The message queue to consume from
   * @param swapProcessor The swap processor to use
   * @param healthCheck The health check to use
   * @param logger The logger to use
   * @param config The application configuration
   */
  constructor(
    private readonly messageQueue: MessageQueue,
    private readonly swapProcessor: SwapProcessor,
    private readonly healthCheck: HealthCheck,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  /**
   * Start the consumer service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      this.logger.info('Starting swap consumer service');
      
      // Start the health check server
      await this.healthCheck.start();
      this.healthCheck.reportStatus('health', 'UP');
      
      // Connect to the message queue
      await this.messageQueue.connect();
      this.healthCheck.reportStatus('rabbitmq', 'UP');
      
      // Start consuming messages
      await this.messageQueue.consume(
        this.config.rabbitmq.swapQueueName,
        this.handleMessage.bind(this)
      );
      
      this.isRunning = true;
      this.logger.info('Swap consumer service started');
    } catch (error) {
      this.healthCheck.reportStatus('rabbitmq', 'DOWN', { error: String(error) });
      this.logger.error('Failed to start swap consumer service', error);
      throw error;
    }
  }

  /**
   * Handle a message from the message queue
   * @param message The message to handle
   */
  private async handleMessage(message: any): Promise<void> {
    try {
      this.logger.debug('Received message', { id: message.id });
      // Acknowledge the message
      await this.messageQueue.acknowledge(message);
      
      const randomDelay = Math.floor(Math.random() * 5000) + 5000;
      await delay(randomDelay);
      // Process the message
      const result = await this.swapProcessor.processSwap(message.content as SwapData);
      
      if (result.success) {
        this.logger.info('Message processed successfully', { id: message.id });
      } else {
        // Reject the message
        await this.messageQueue.reject(message, true);
        this.logger.error('Message processing failed', { id: message.id, error: result.error });
      }
    } catch (error) {
      this.logger.error('Error handling message', error);
      
      // Reject the message
      await this.messageQueue.reject(message, true);
    }
  }

  /**
   * Stop the consumer service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.logger.info('Stopping swap consumer service');
      
      // Close the message queue connection
      await this.messageQueue.close();
      
      // Stop the health check server
      await this.healthCheck.stop();
      
      this.isRunning = false;
      this.logger.info('Swap consumer service stopped');
    } catch (error) {
      this.logger.error('Error stopping swap consumer service', error);
      throw error;
    }
  }
}

/**
 * Create a new SwapConsumerService
 * @param messageQueue The message queue to consume from
 * @param swapProcessor The swap processor to use
 * @param healthCheck The health check to use
 * @param logger The logger to use
 * @param config The application configuration
 * @returns A new SwapConsumerService
 */
export const createSwapConsumerService = (
  messageQueue: MessageQueue,
  swapProcessor: SwapProcessor,
  healthCheck: HealthCheck,
  logger: Logger,
  config: AppConfig
): SwapConsumerService => {
  return new SwapConsumerService(
    messageQueue,
    swapProcessor,
    healthCheck,
    logger,
    config
  );
};
