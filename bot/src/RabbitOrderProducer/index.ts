import swapInfoController from "../controller/swap";
import { delay } from "../service";
import { rabbitexecuteSwapBatch } from "./rabbit";
import { ConfigService } from "../service/config";
import { Logger } from "../interfaces/Logger";
import { HealthCheck } from "../interfaces/HealthCheck";

const cron = require("node-cron");
let timeAmount = 0;
let logger: Logger;
let healthCheck: HealthCheck | null = null;

// Get global resources if available
const getResources = () => {
  try {
    // Try to get logger and health check from global scope
    if (!logger) {
      // If not available, create a simple console logger
      logger = {
        debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args),
        info: (message: string, ...args: any[]) => console.info(`[INFO] ${message}`, ...args),
        warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
        error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
      };
    }
  } catch (error) {
    console.error('Error getting resources:', error);
  }
};

export const startSwapProcess = async () => {
  getResources();
  
  timeAmount = 0;
  logger.info('Starting swap process with 1 minute interval');
  
  // Update health status if available
  if (healthCheck) {
    healthCheck.reportStatus('swap-scheduler', 'UP');
  }
  
  cron.schedule("*/1 * * * *", () => {
    processSwap(1);
  });
};

// Register the health check (called from main.ts)
export const registerHealthCheck = (health: HealthCheck, log: Logger) => {
  healthCheck = health;
  logger = log;
  logger.info('Health check registered for swap process');
};

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 3000;
const DELAY_BETWEEN_SWAPS = 1000;

const processSwap = async (interval: number) => {
  try {
    // Get resources if not already available
    getResources();
    
    if (timeAmount > 360) {
      timeAmount = 0;
    }

    timeAmount += interval;
    logger.debug(`Processing swap batch at time interval: ${timeAmount}`);

    const swapInfo = await swapInfoController.swapInfo();
    if (!swapInfo?.data.length) {
      logger.debug('No swap info data available');
      return;
    }

    const activeUsers = swapInfo.data.filter(
      (user: any) => user.active && timeAmount % user.loopTime === 0
    );
    
    logger.info(`Processing ${activeUsers.length} active users`);
    
    // Update health status if available
    if (healthCheck) {
      healthCheck.reportStatus('swap-processor', 'UP', { 
        activeUsersCount: activeUsers.length,
        timeInterval: timeAmount
      });
    }

    for (let i = 0; i < activeUsers.length; i += BATCH_SIZE) {
      const batch = activeUsers.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (user: any) => {
          try {
            await rabbitexecuteSwapBatch(user);
            logger.debug("Processing swap for user:", {
              userDexID: user.dexId,
              userId: user.userId,
              amount: user.amount,
              amountToken: user.amountToken,
              baseSymbol: user.baseSymbol,
              quoteSymbol: user.quoteSymbol,
              baseToken: user.baseToken,
              quoteToken: user.quoteToken,
              buy: user.buy,
              sell: user.sell,
              buyProgress: user.buyProgress,
              sellProgress: user.sellProgress,
              flag: user.flag,
              isBalance: user.isBalance,
              priorityFee: user.priorityFee,
              dir: user.dir,
              fee: user.fee,
              loopTime: user.loopTime,
              active: user.active,
            });
          } catch (error) {
            logger.error(
              `Error processing swap for user ${user.userId}:`,
              error
            );
            
            // Report error to health check
            if (healthCheck) {
              healthCheck.reportStatus(`swap-user-${user.userId}`, 'DEGRADED', {
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
              });
            }
          }
        })
      );

      if (i + BATCH_SIZE < activeUsers.length) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }
  } catch (error) {
    logger.error("Error in processSwap:", error);
    
    // Report error to health check
    if (healthCheck) {
      healthCheck.reportStatus('swap-processor', 'DEGRADED', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }
};