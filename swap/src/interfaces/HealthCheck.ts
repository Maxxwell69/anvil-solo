/**
 * Health status of a component
 */
export type HealthStatus = 'UP' | 'DOWN' | 'DEGRADED';

/**
 * Health information for a component
 */
export interface ComponentHealth {
  status: HealthStatus;
  details?: Record<string, any>;
}

/**
 * Overall health information for the application
 */
export interface HealthInfo {
  status: HealthStatus;
  components: Record<string, ComponentHealth>;
  timestamp: string;
}

/**
 * Interface for health check functionality
 */
export interface HealthCheck {
  /**
   * Start the health check service
   */
  start(): Promise<void>;
  
  /**
   * Stop the health check service
   */
  stop(): Promise<void>;
  
  /**
   * Report the health status of a component
   * @param component The name of the component
   * @param status The health status of the component
   * @param details Additional details about the component's health
   */
  reportStatus(component: string, status: HealthStatus, details?: Record<string, any>): void;
  
  /**
   * Get the current health information
   */
  getHealth(): HealthInfo;
}
