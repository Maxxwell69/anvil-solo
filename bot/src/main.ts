import { initBot } from "./index";
import { connectDatabase } from "./db";
import { startSwapProcess } from "./RabbitOrderProducer";
import { initializeRabbitMQ } from "./RabbitOrderProducer/rabbit";
import { ConfigService } from "./service/config";
import { createLogger } from "./service/logger";
import { createHealthCheck } from "./service/health";
import { HealthCheck } from "./interfaces/HealthCheck";

// Global variables for resources that need cleanup
let healthCheck: HealthCheck;

async function start() {
  try {
    // Load configuration
    const config = ConfigService.load();
    
    // Create logger
    const logger = createLogger(config.logLevel || 'info');
    logger.info('Starting bot application');
    
    // Create health check service
    healthCheck = createHealthCheck(
      config.healthCheck?.port || 3000,
      config.healthCheck?.livenessPath || '/health/liveness',
      config.healthCheck?.readinessPath || '/health/readiness',
      logger
    );
    
    // Start health check server
    await healthCheck.start();
    logger.info('Health check server started');
    
    // Report initial status
    healthCheck.reportStatus('health', 'UP');
    
    // Connect to database
    // Ensure we pass the string URL rather than the database object
    await connectDatabase(config.mongodb.url);
    healthCheck.reportStatus('database', 'UP');
    logger.info('Connected to database');
    
    // Initialize RabbitMQ
    await initializeRabbitMQ();
    healthCheck.reportStatus('rabbitmq', 'UP');
    logger.info('RabbitMQ producer initialized successfully');
    
    // Initialize bot
    await initBot();
    healthCheck.reportStatus('bot', 'UP');
    logger.info('Bot initialized successfully');
    
    // Register health check with the swap process
    const { registerHealthCheck } = await import('./RabbitOrderProducer');
    registerHealthCheck(healthCheck, logger);
    
    // Start swap process
    await startSwapProcess();
    logger.info('Swap process started successfully');
    
    logger.info('Bot application started successfully');
    
    // Handle graceful shutdown
    setupGracefulShutdown(logger);
  } catch (error) {
    console.error("Bot Start Error: ", error);
    process.exit(1);
  }
}

function setupGracefulShutdown(logger: any) {
  // Handle termination signals
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    
    try {
      // Stop health check server first to report service as down
      if (healthCheck) {
        healthCheck.reportStatus('health', 'DOWN', { reason: 'Shutdown in progress' });
        await healthCheck.stop();
        logger.info('Health check server stopped');
      }
      
      // Add any other cleanup here
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start the application
start();
