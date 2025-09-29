import { connectDatabase } from './db';
import { createLogger } from './service/logger';
import { ConfigService } from './service/config';
import { createHealthCheck } from './service/health';
import { createRabbitMQService } from './service/rabbitmq';
import { createSwapProcessor } from './service/swap';
import { createSwapConsumerService } from './service/consumer';

/**
 * Start the application
 */
async function start() {
  try {
    // Load configuration
    const config = ConfigService.load();
    
    // Create logger
    const logger = createLogger(config.logLevel);
    logger.info('Starting application');
    
    // Create health check
    const healthCheck = createHealthCheck(
      config.healthCheck.port,
      config.healthCheck.livenessPath,
      config.healthCheck.readinessPath,
      logger
    );
    
    // Connect to MongoDB
    await connectDatabase(config.mongodb.url);
    logger.info('Connected to MongoDB');
    
    // Create RabbitMQ service
    const messageQueue = createRabbitMQService(
      config.rabbitmq.url,
      10,
      logger
    );
    
    // Create swap processor
    const swapProcessor = createSwapProcessor(logger);
    
    // Create swap consumer service
    const consumerService = createSwapConsumerService(
      messageQueue,
      swapProcessor,
      healthCheck,
      logger,
      config
    );
    
    // Create swap worker service
    // const { createSwapWorkerService } = require('./service/swap-worker');
    // const workerService = createSwapWorkerService(
    //   messageQueue,
    //   logger,
    //   healthCheck,
    //   config
    // );
    
    // Start the services
    await consumerService.start();
    // await workerService.start();
    
    // logger.info('Services started successfully');
    
    logger.info('Application started successfully');
    
    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down application');
      
      try {
        await consumerService.stop();

        // await Promise.all([
        //   consumerService.stop(),
        //   workerService.stop()
        // ]);
        logger.info('Application shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };
    
    // Handle termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  // Don't exit the process, just log the error
});

// Start the application
start();
