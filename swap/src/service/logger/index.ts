import { Logger, LogLevel } from '../../interfaces/Logger';

/**
 * Console-based implementation of the Logger interface
 */
export class LoggerService implements Logger {
  /**
   * Create a new LoggerService
   * @param level The minimum level to log
   */
  constructor(
    private readonly level: 'debug' | 'info' | 'warn' | 'error' = 'info'
  ) { }

  /**
   * Check if a log level should be output
   * @param level The log level to check
   * @returns Whether the log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex >= currentLevelIndex;
  }

  /**
   * Format a log message
   * @param level The log level
   * @param message The message to log
   * @returns The formatted log message
   */
  private formatLog(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param meta Additional metadata to include in the log
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatLog('debug', message), ...args);
    }
  }

  /**
   * Log an informational message
   * @param message The message to log
   * @param meta Additional metadata to include in the log
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatLog('info', message), ...args);
    }
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param meta Additional metadata to include in the log
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message), ...args);
    }
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param error The error object or additional metadata to include in the log
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatLog('error', message), ...args);
    }
  }
}

/**
 * Create a new LoggerService with the specified log level
 * @param level The minimum log level to output
 * @returns A new LoggerService
 */
export const createLogger = (level: LogLevel = 'info'): Logger => {
  return new LoggerService(level);
};
