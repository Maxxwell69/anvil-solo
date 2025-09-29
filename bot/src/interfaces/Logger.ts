/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Interface for logging functionality
 */
export interface Logger {
  /**
   * Log a debug message
   * @param message The message to log
   * @param args Additional args to include in the log
   */
  debug(message: string, ...args: any[]): void;

  /**
   * Log an informational message
   * @param message The message to log
   * @param args Additional args to include in the log
   */
  info(message: string, ...args: any[]): void;

  /**
   * Log a warning message
   * @param message The message to log
   * @param args Additional args to include in the log
   */
  warn(message: string, ...args: any[]): void;

  /**
   * Log an error message
   * @param message The message to log
   * @param args Additional args to include in the log
   */
  error(message: string, ...args: any[]): void;
}
