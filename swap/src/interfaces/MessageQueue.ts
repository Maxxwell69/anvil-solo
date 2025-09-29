/**
 * Represents a message from a message queue
 */
export interface Message {
  /**
   * Unique identifier for the message
   */
  id: string;
  
  /**
   * The content of the message
   */
  content: any;
  
  /**
   * Additional properties associated with the message
   */
  properties: Record<string, any>;
  
  /**
   * The raw message object from the underlying implementation
   */
  raw: any;
}

/**
 * Handler function for processing messages
 */
export type MessageHandler = (message: Message) => Promise<void>;

/**
 * Interface for interacting with a message queue
 */
export interface MessageQueue {
  /**
   * Connect to the message queue
   */
  connect(): Promise<void>;
  
  /**
   * Start consuming messages from a queue
   * @param queueName The name of the queue to consume from
   * @param handler The function to handle each message
   */
  consume(queueName: string, handler: MessageHandler): Promise<void>;
  
  /**
   * Publish a message to a queue
   * @param queueName The name of the queue to publish to
   * @param content The content of the message
   * @param options Additional options for the message
   */
  publish(queueName: string, content: any, options?: Record<string, any>): Promise<void>;
  
  /**
   * Acknowledge a message as successfully processed
   * @param message The message to acknowledge
   */
  acknowledge(message: Message): Promise<void>;
  
  /**
   * Reject a message as failed to process
   * @param message The message to reject
   * @param requeue Whether to requeue the message for later processing
   */
  reject(message: Message, requeue: boolean): Promise<void>;
  
  /**
   * Close the connection to the message queue
   */
  close(): Promise<void>;
  
  /**
   * Check if the connection is healthy
   */
  isHealthy(): boolean;
}
