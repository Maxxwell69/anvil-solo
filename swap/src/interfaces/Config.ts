/**
 * RabbitMQ configuration
 */
export interface RabbitMQConfig {
  /**
   * RabbitMQ connection URL
   */
  url: string;

  /**
   * Number of messages to prefetch
   */
  prefetchCount: number;

  /**
   * Queue name to consume swap tasks from
   */
  swapQueueName: string;

  /**
   * Maximum number of retries for failed tasks
   */
  maxRetries: number;

  /**
   * Delay between tasks in milliseconds
   */
  taskDelayMs: number;
}

/**
 * MongoDB configuration
 */
export interface MongoDBConfig {
  /**
   * MongoDB connection URL
   */
  url: string;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /**
   * Port to run the health check server on
   */
  port: number;

  /**
   * Path for the liveness probe
   */
  livenessPath: string;

  /**
   * Path for the readiness probe
   */
  readinessPath: string;
}

/**
 * Swap service configuration
 */
export interface SwapConfig {
  /**
   * Processing interval in milliseconds
   */
  processingInterval: number;

  /**
   * Default Referral Fee Percentage
   */
  referralFeePercentage: number;

  /**
   * Admin wallet address
   */
  adminWalletAddress: string;

  /**
   * Minimum amount
   */
  minimumAmount: number;

  /**
   * Minimum Deposit amount
   */
  minimumDepositAmount: number;

  /**
   * Fee percentage
   */
  feePercentage: number;

  /**
   * Withdraw Fee percentage
   */
  withdrawFee: number;

  /**
   * Slippage
   */
  slippage: number;
}

/**
 * Solana configuration
 */
export interface SolanaConfig {
  /**
   * Network Fee
   */
  networkFee: number;

  /**
   * Solana RPC URL
   */
  rpcUrl: string;

  /**
   * Solana SPL token program
   */
  splTokenProgram: string;

  /**
   * Solscan URL
   */
  solscanUrl: string;
}

/**
 * TG configuration
 */
export interface TGBotConfig {
  /**
   * TGBot token
   */
  token: string;

  /**
   * TGBot Super Admin
   */
  superAdmin: string;

  /**
   * TGBot Intro Video
   */
  introVideo: string;
}

export interface ServicesConfig {
  /**
   * Dexscreener URL
   */
  dexScreenerApiUrl: string;
}

/**
 * Social configuration
 */
export interface SocialConfig {
  /**
   * Telegram URL
   */
  telegram: string;

  /**
   * Twitter URL
   */
  twitter: string;

  /**
   * Website URL
   */
  website: string;

  /**
   * Support URL
   */
  support: string;
}

/**
 * Application configuration
 */
export interface AppConfig {
  /**
   * Log level
   */
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  /**
   * RabbitMQ configuration
   */
  rabbitmq: RabbitMQConfig;

  /**
   * MongoDB configuration
   */
  mongodb: MongoDBConfig;

  /**
   * Health check configuration
   */
  healthCheck: HealthCheckConfig;

  /**
   * Swap service configuration
   */
  swap: SwapConfig;

  /**
   * Solana configuration
   */
  solana: SolanaConfig;

  /**
   * Services configuration
   */
  services: ServicesConfig;

  /**
   * Socials
   */
  social: SocialConfig;


  /**
   * TG Bot Config
   */
  tgBot: TGBotConfig

  encryption_salt: string
}
