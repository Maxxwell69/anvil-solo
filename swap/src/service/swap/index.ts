import { SwapProcessor, SwapData, SwapResult } from '../../interfaces/SwapProcessor';
import { Logger } from '../../interfaces/Logger';
import { executeSwap } from '../../index';

/**
 * Service for processing swap operations
 */
export class SwapProcessorService implements SwapProcessor {
  /**
   * Create a new SwapProcessorService
   * @param logger The logger to use
   */
  constructor(private readonly logger: Logger) {}

  /**
   * Process a swap operation
   * @param data The swap data to process
   * @returns The result of the swap operation
   */
  async processSwap(data: SwapData): Promise<SwapResult> {
    try {
      this.logger.info(`Processing swap for user ${data.userId}`);
      
      await executeSwap(data, this.logger);
      
      this.logger.info(`Swap completed successfully for user ${data.userId}`);
      
      return {
        success: true
      };
    } catch (error) {
      this.logger.error(`Swap failed for user ${data.userId}`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}

/**
 * Create a new SwapProcessorService
 * @param logger The logger to use
 * @returns A new SwapProcessorService
 */
export const createSwapProcessor = (logger: Logger): SwapProcessor => {
  return new SwapProcessorService(logger);
};
