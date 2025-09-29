import { AppConfig, RabbitMQConfig, MongoDBConfig, HealthCheckConfig, SwapConfig, SolanaConfig, TGBotConfig, ServicesConfig, SocialConfig } from '../../interfaces/Config';
import fs from 'fs';
import path from 'path';

/**
 * Service for loading configuration from environment variables and config files
 */
export class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  /**
   * Create a new ConfigService
   * @param config The application configuration
   */
  private constructor(config: AppConfig) {
    this.config = config;
  }

  /**
   * Load the application configuration
   * @returns The application configuration
   */
  static load(configPath: string = process.env.CONFIG_PATH || path.resolve(__dirname, '../../config.json')): AppConfig {
    if (!ConfigService.instance) {
      // Load config from file
      let fileConfig: any = {};

      try {
        if (fs.existsSync(configPath)) {
          const configFile = fs.readFileSync(configPath, 'utf8');
          fileConfig = JSON.parse(configFile);
        }
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error);
      }

      // Load RabbitMQ configuration
      const rabbitmq: RabbitMQConfig = {
        url: process.env.RABBITMQ_URL || fileConfig.rabbitmq_url,
        prefetchCount: parseInt(
          process.env.RABBITMQ_PREFETCH_COUNT ||
          fileConfig.rabbitmq_prefetch_count || '5', 10
        ),
        swapQueueName: process.env.RABBITMQ_QUEUE_NAME ||
          fileConfig.rabbitmq_queue_name || 'swap_orders',
        maxRetries: parseInt(
          process.env.RABBITMQ_MAX_RETRIES ||
          fileConfig.rabbitmq_max_retries || '3', 10
        ),
        taskDelayMs: parseInt(
          process.env.RABBITMQ_TASK_DELAY_MS ||
          fileConfig.rabbitmq_task_delay_ms || '2000', 10
        )
      };

      // Load MongoDB configuration
      const mongodb: MongoDBConfig = {
        url: process.env.MONGODB_URL || fileConfig.mongodb_url
      };

      // Load health check configuration
      const healthCheck: HealthCheckConfig = {
        port: parseInt(
          process.env.HEALTH_CHECK_PORT || 
          fileConfig.health_check_port || '8080', 10
        ),
        livenessPath: process.env.HEALTH_CHECK_LIVENESS_PATH || 
                     fileConfig.health_check_liveness_path || '/health/liveness',
        readinessPath: process.env.HEALTH_CHECK_READINESS_PATH || 
                      fileConfig.health_check_readiness_path || '/health/readiness'
      };

      // Load swap configuration
      const swap: SwapConfig = {
        processingInterval: parseInt(
          process.env.SWAP_PROCESSING_INTERVAL || 
          fileConfig.swap_processing_interval || '60000', 10
        ),
        referralFeePercentage: parseFloat(
          process.env.SWAP_REFERRAL_FEE_PERCENTAGE || 
          fileConfig.swap_referral_fee_percentage || '0.3'
        ),
        adminWalletAddress: process.env.SWAP_ADMIN_WALLET_ADDRESS || 
                          fileConfig.swap_admin_wallet_address || '',
        minimumAmount: parseFloat(
          process.env.SWAP_MINIMUM_AMOUNT || 
          fileConfig.swap_minimum_amount || '0.002'
        ),
        minimumDepositAmount: parseFloat(
          process.env.SWAP_MINIMUM_DEPOSIT_AMOUNT || 
          fileConfig.swap_minimum_deposit_amount || '0.01'
        ),
        feePercentage: parseFloat(
          process.env.SWAP_FEE_PERCENTAGE || 
          fileConfig.swap_fee_percentage || '0.0005'
        ),
        withdrawFee: parseFloat(
          process.env.SWAP_WITHDRAW_FEE || 
          fileConfig.swap_withdraw_fee || '0.000005'
        ),
        slippage: parseInt(
          process.env.SWAP_SLIPPAGE || 
          fileConfig.swap_slippage || '5'
        ),
      };

      // Load Solana configuration
      const solana: SolanaConfig = {
        networkFee: parseFloat(
          process.env.SOLANA_NETWORK_FEE || 
          fileConfig.solana_network_fee || '0.002'
        ),
        rpcUrl: process.env.SOLANA_RPC_URL || 
               fileConfig.solana_rpc_url || 
               'https://api.mainnet-beta.solana.com',
        splTokenProgram: process.env.SOLANA_SPL_TOKEN_PROGRAM || 
                        fileConfig.solana_spl_token_program || 
                        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        solscanUrl: process.env.SOLSCAN_URL || 
                   fileConfig.solscan_url || 
                   'https://solscan.io/tx'
      };

      // Load TGBot configuration
      const tgBot: TGBotConfig = {
        token: process.env.TG_BOT_TOKEN || 
             fileConfig.tg_bot_token || '',
        superAdmin: process.env.TG_BOT_SUPER_ADMIN_ID || 
                  fileConfig.tg_bot_super_admin_id?.toString() || '',
        introVideo: process.env.TG_BOT_INTRO_VIDEO_ID || 
                fileConfig.tg_bot_intro_video_id || ''
      };

      // Load Service Configuration
      const services: ServicesConfig = {
        dexScreenerApiUrl: process.env.DEXSCREENER_API_URL || 
             fileConfig.dexscreener_api_url || ''
      }

      const social: SocialConfig = {
        telegram: process.env.TELEGRAM_URL || 
          fileConfig.telegram_url || '',
        twitter: process.env.TWITTER_URL || 
          fileConfig.twitter_url || '',
        website: process.env.WEBSITE_URL || 
          fileConfig.website_url || '',
        support: process.env.SUPPORT_URL || 
          fileConfig.support_url || ''
      }

      const encryption_salt: string = process.env.ENCRYPTION_SALT || 
             fileConfig.encryption_salt || ''
      // Create the application configuration
      const config: AppConfig = {
        logLevel: (process.env.LOG_LEVEL || fileConfig.log_level || 'info') as 'debug' | 'info' | 'warn' | 'error',
        rabbitmq,
        mongodb,
        healthCheck,
        swap,
        solana,
        services,
        social,
        tgBot,
        encryption_salt 
      };

      ConfigService.instance = new ConfigService(config);
    }

    return ConfigService.instance.config;
  }

  /**
 * Get the current configuration
 * @returns The current configuration
 */
  static getConfig(): AppConfig {
    if (!ConfigService.instance) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return ConfigService.instance.config;
  }
}