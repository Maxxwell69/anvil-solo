import amqp from 'amqplib';
import { ConfigService } from '../service/config';

// Configure batch processing
const BATCH_SIZE = 10;
const QUEUE_NAME = 'swap_orders';

// Initialize RabbitMQ channel
let channel: amqp.Channel | null = null;

export async function initializeRabbitMQ() {
  try {    
    const connection = await amqp.connect(ConfigService.getConfig().rabbitmq?.url );
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.prefetch(BATCH_SIZE);
    console.log('RabbitMQ connection established');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

export async function rabbitexecuteSwapBatch(userData: any) {
  try {
    if (!channel) {
      await initializeRabbitMQ();
    }

    const messageId = `${userData.userId}_${userData.baseSymbol}_${userData.quoteSymbol}_${Date.now()}`;
    const messagePayload = {
      ...userData,
      messageId,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Send to RabbitMQ queue with message ID in headers
    channel!.sendToQueue(
      QUEUE_NAME,
      Buffer.from(JSON.stringify(messagePayload)),
      { 
        persistent: true,
        messageId,
        headers: {
          messageId
        }
      }
    );

    console.log(`Swap order queued for user ${userData.userId}`);
    return true;
  } catch (error) {
    console.error('Error in executeSwapBatch:', error);
    throw error;
  }
}

// Handle connection errors
process.on('SIGINT', async () => {
  try {
    if (channel) {
      await channel.close();
    }
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
