import { MessageQueue, Message } from '../../interfaces/MessageQueue';
import { Logger } from '../../interfaces/Logger';
import { SwapTaskType, SwapData } from '../../interfaces/SwapTask';
import { executeSwap } from '../../index';
import databaseService from '../database';
import { HealthCheck } from '../../interfaces/HealthCheck';
import { AppConfig } from '../../interfaces/Config';

/**
 * Service for processing swap tasks from a message queue
 */
export class SwapWorkerService {
  private isRunning = false;

  /**
   * Create a new SwapWorkerService
   * @param messageQueue The message queue to consume from
   * @param logger The logger to use
   * @param healthCheck The health check to use
   * @param config The application configuration
   */
  constructor(
    private readonly messageQueue: MessageQueue,
    private readonly logger: Logger,
    private readonly healthCheck: HealthCheck,
    private readonly config: AppConfig
  ) {}

  /**
   * Start the worker service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      this.logger.info('Starting swap worker service');
      
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
      this.logger.info('Swap worker service started');
    } catch (error) {
      this.healthCheck.reportStatus('rabbitmq', 'DOWN', { error: String(error) });
      this.logger.error('Failed to start swap worker service', error);
      throw error;
    }
  }

  /**
   * Handle a message from the message queue
   * @param message The message to handle
   */
  private async handleMessage(message: Message): Promise<void> {
    try {
      this.logger.debug('Received swap task', { id: message.id });
      
      const { type, data, id } = message.content;
      
      // Update swap status to processing
      await databaseService.updateSwapStatus(id, 'PROCESSING');
      
      // Process the task based on its type
      switch (type) {
        case SwapTaskType.BUY:
          await this.processBuyTask(id, data);
          break;
          
        case SwapTaskType.SELL:
          await this.processSellTask(id, data);
          break;
          
        case SwapTaskType.CHECK_BALANCE:
          await this.processCheckBalanceTask(id, data);
          break;
          
        default:
          throw new Error(`Unknown task type: ${type}`);
      }
      
      // Acknowledge the message
      await this.messageQueue.acknowledge(message);
      this.logger.info('Swap task processed successfully', { id: message.id });
      
      // Schedule the next task if needed
      await this.scheduleNextTask(id, data);
    } catch (error) {
      this.logger.error('Error handling swap task', { id: message.id, error });
      
      // Update swap status to failed
      try {
        const { id } = message.content;
        await databaseService.updateSwapStatus(
          id, 
          'FAILED', 
          error instanceof Error ? error.message : String(error)
        );
      } catch (updateError) {
        this.logger.error('Failed to update swap status', updateError);
      }
      
      // Reject the message and requeue it if it hasn't been retried too many times
      const retryCount = message.properties.headers?.retryCount || 0;
      
      if (retryCount < this.config.rabbitmq.maxRetries) {
        // Requeue with incremented retry count
        const options = {
          headers: {
            ...message.properties.headers,
            retryCount: retryCount + 1
          }
        };
        
        // Publish to a delay queue or directly back to the main queue
        await this.messageQueue.publish(
          this.config.rabbitmq.swapQueueName,
          message.content,
          options
        );
        
        // Acknowledge the original message
        await this.messageQueue.acknowledge(message);
        
        this.logger.info('Requeued failed swap task', { 
          id: message.id, 
          retryCount: retryCount + 1 
        });
      } else {
        // Max retries reached, don't requeue
        await this.messageQueue.acknowledge(message);
        this.logger.warn('Max retries reached for swap task', { id: message.id });
      }
    }
  }

  /**
   * Process a buy task
   * @param taskId The ID of the task
   * @param data The swap data
   */
  private async processBuyTask(taskId: string, data: SwapData): Promise<void> {
    this.logger.info(`Processing buy task for swap ${taskId}`);
    
    // Set flag to true for buy operation
    const swapData = {
      ...data,
      flag: true
    };
    
    // Execute the swap
    await executeSwap(swapData, this.logger);
    
    this.logger.info(`Buy task completed for swap ${taskId}`);
  }

  /**
   * Process a sell task
   * @param taskId The ID of the task
   * @param data The swap data
   */
  private async processSellTask(taskId: string, data: SwapData): Promise<void> {
    this.logger.info(`Processing sell task for swap ${taskId}`);
    
    // Set flag to false for sell operation
    const swapData = {
      ...data,
      flag: false
    };
    
    // Execute the swap
    await executeSwap(swapData, this.logger);
    
    this.logger.info(`Sell task completed for swap ${taskId}`);
  }

  /**
   * Process a check balance task
   * @param taskId The ID of the task
   * @param data The swap data
   */
  private async processCheckBalanceTask(taskId: string, data: SwapData): Promise<void> {
    this.logger.info(`Checking balance for swap ${taskId}`);
    
    // Implementation would depend on your specific balance checking logic
    // This is a placeholder
    
    this.logger.info(`Balance check completed for swap ${taskId}`);
  }

  /**
   * Schedule the next task for a swap
   * @param swapId The ID of the swap
   * @param data The swap data
   */
  private async scheduleNextTask(swapId: string, data: SwapData): Promise<void> {
    try {
      // Get the latest swap info
      const swapInfo = await databaseService.getSwapInfo(swapId);
      
      // Only schedule next task if the swap is still active
      if (!swapInfo.active) {
        this.logger.info(`Swap ${swapId} is no longer active, not scheduling next task`);
        return;
      }
      
      // Determine the next task type
      let nextTaskType: SwapTaskType;
      
      if (swapInfo.dir === 'two') {
        // For two-direction swaps, alternate between buy and sell
        nextTaskType = swapInfo.flag ? SwapTaskType.BUY : SwapTaskType.SELL;
      } else if (swapInfo.dir === 'one') {
        // For one-direction swaps, check progress
        if (swapInfo.buyProgress < swapInfo.buy && swapInfo.flag) {
          nextTaskType = SwapTaskType.BUY;
        } else if (swapInfo.sellProgress < swapInfo.sell && !swapInfo.flag) {
          nextTaskType = SwapTaskType.SELL;
        } else {
          // Swap cycle completed
          this.logger.info(`Swap cycle completed for ${swapId}`);
          return;
        }
      } else {
        this.logger.warn(`Unknown swap direction: ${swapInfo.dir}`);
        return;
      }
      
      // Schedule the next task with a delay
      setTimeout(async () => {
        try {
          await this.messageQueue.publish(
            this.config.rabbitmq.swapQueueName,
            {
              id: swapId,
              type: nextTaskType,
              data: swapInfo,
              timestamp: new Date().toISOString()
            }
          );
          
          this.logger.info(`Scheduled next task for swap ${swapId}`, { type: nextTaskType });
        } catch (error) {
          this.logger.error(`Failed to schedule next task for swap ${swapId}`, error);
        }
      }, this.config.rabbitmq.taskDelayMs || 2000);
    } catch (error) {
      this.logger.error(`Error scheduling next task for swap ${swapId}`, error);
    }
  }

  /**
   * Stop the worker service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.logger.info('Stopping swap worker service');
      
      // Close the message queue connection
      await this.messageQueue.close();
      
      // Stop the health check server
      await this.healthCheck.stop();
      
      this.isRunning = false;
      this.logger.info('Swap worker service stopped');
    } catch (error) {
      this.logger.error('Error stopping swap worker service', error);
      throw error;
    }
  }
}

/**
 * Create a new SwapWorkerService
 * @param messageQueue The message queue to consume from
 * @param logger The logger to use
 * @param healthCheck The health check to use
 * @param config The application configuration
 * @returns A new SwapWorkerService
 */
export const createSwapWorkerService = (
  messageQueue: MessageQueue,
  logger: Logger,
  healthCheck: HealthCheck,
  config: AppConfig
): SwapWorkerService => {
  return new SwapWorkerService(
    messageQueue,
    logger,
    healthCheck,
    config
  );
};
