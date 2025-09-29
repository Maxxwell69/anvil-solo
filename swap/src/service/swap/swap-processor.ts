import { SwapProcessor, SwapData, SwapResult } from '../../interfaces/SwapProcessor';
import { Logger } from '../../interfaces/Logger';
import { MessageQueue } from '../../interfaces/MessageQueue';
import { SwapTaskType } from '../../interfaces/SwapTask';
import { AppConfig } from '../../interfaces/Config';
import databaseService from '../database';

/**
 * Service for processing swap operations
 */
export class SwapProcessorService implements SwapProcessor {
  /**
   * Create a new SwapProcessorService
   * @param messageQueue The message queue to publish to
   * @param logger The logger to use
   * @param config The application configuration
   */
  constructor(
    private readonly messageQueue: MessageQueue,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  /**
   * Process a swap operation by publishing it to the message queue
   * @param data The swap data to process
   * @returns The result of the swap operation
   */
  async processSwap(data: SwapData): Promise<SwapResult> {
    try {
      this.logger.info(`Processing swap request for user ${data.userId}`);
      
      // Determine the task type based on the swap data
      const taskType = this.determineTaskType(data);
      
      // Create the task
      const task = {
        id: data._id,
        type: taskType,
        data,
        timestamp: new Date().toISOString()
      };
      
      // Connect to the message queue if not already connected
      if (!this.messageQueue.isHealthy()) {
        await this.messageQueue.connect();
      }
      
      // Publish the task to the queue
      await this.messageQueue.publish(
        this.config.rabbitmq.swapQueueName,
        task
      );
      
      // Update the swap status to pending
      await databaseService.updateSwapStatus(data._id, 'PENDING');
      
      this.logger.info(`Swap request queued for user ${data.userId}`);
      
      return {
        success: true
      };
    } catch (error) {
      this.logger.error(`Failed to queue swap for user ${data.userId}`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Determine the task type based on the swap data
   * @param data The swap data
   * @returns The task type
   */
  private determineTaskType(data: SwapData): SwapTaskType {
    const { flag, dir, buyProgress, sellProgress, buy, sell } = data;
    
    if (dir === 'two') {
      return flag ? SwapTaskType.BUY : SwapTaskType.SELL;
    } else if (dir === 'one') {
      if (buyProgress < buy && flag) {
        return SwapTaskType.BUY;
      } else if (sellProgress < sell && !flag) {
        return SwapTaskType.SELL;
      }
    }
    
    // Default to checking balance if we can't determine the task type
    return SwapTaskType.CHECK_BALANCE;
  }
}

/**
 * Create a new SwapProcessorService
 * @param messageQueue The message queue to publish to
 * @param logger The logger to use
 * @param config The application configuration
 * @returns A new SwapProcessorService
 */
export const createSwapProcessor = (
  messageQueue: MessageQueue,
  logger: Logger,
  config: AppConfig
): SwapProcessor => {
  return new SwapProcessorService(messageQueue, logger, config);
};
