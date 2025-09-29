import http from 'http';
import { HealthCheck, HealthInfo, HealthStatus, ComponentHealth } from '../../interfaces/HealthCheck';
import { Logger } from '../../interfaces/Logger';

/**
 * HTTP-based implementation of the HealthCheck interface
 */
export class HealthCheckService implements HealthCheck {
  private server: http.Server | null = null;
  private components: Record<string, ComponentHealth> = {};
  private isStarted = false;

  /**
   * Create a new HealthCheckService
   * @param port The port to run the health check server on
   * @param livenessPath The path for the liveness probe
   * @param readinessPath The path for the readiness probe
   * @param logger The logger to use
   */
  constructor(
    private readonly port: number,
    private readonly livenessPath: string,
    private readonly readinessPath: string,
    private readonly logger: Logger
  ) {}

  /**
   * Start the health check server
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    return new Promise((resolve) => {
      this.server = http.createServer(this.handleRequest.bind(this));
      this.server.listen(this.port, () => {
        this.isStarted = true;
        this.logger.info(`Health check server started on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the health check server
   */
  async stop(): Promise<void> {
    if (!this.isStarted || !this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          this.logger.error('Error stopping health check server', err);
          reject(err);
        } else {
          this.isStarted = false;
          this.logger.info('Health check server stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Report the health status of a component
   * @param component The name of the component
   * @param status The health status of the component
   * @param details Additional details about the component's health
   */
  reportStatus(component: string, status: HealthStatus, details?: Record<string, any>): void {
    this.components[component] = { status, details };
    this.logger.debug(`Health status for ${component} updated to ${status}`, details);
  }

  /**
   * Get the current health information
   */
  getHealth(): HealthInfo {
    // Calculate overall status
    let overallStatus: HealthStatus = 'UP';
    
    for (const component of Object.values(this.components)) {
      if (component.status === 'DOWN') {
        overallStatus = 'DOWN';
        break;
      } else if (component.status === 'DEGRADED' && overallStatus === 'UP') {
        overallStatus = 'DEGRADED';
      }
    }
    
    return {
      status: overallStatus,
      components: { ...this.components },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle an HTTP request
   * @param req The HTTP request
   * @param res The HTTP response
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url || '/';
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // Handle GET request
    if (req.method === 'GET') {
      if (url === this.livenessPath || url === '/health') {
        // Liveness probe - just check if the service is running
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'UP' }));
      } else if (url === this.readinessPath) {
        // Readiness probe - check if the service is ready to handle requests
        const health = this.getHealth();
        const statusCode = health.status === 'UP' ? 200 : health.status === 'DEGRADED' ? 200 : 503;
        
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
      } else {
        // Not found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } else {
      // Method not allowed
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  }
}

/**
 * Create a new HealthCheckService
 * @param port The port to run the health check server on
 * @param livenessPath The path for the liveness probe
 * @param readinessPath The path for the readiness probe
 * @param logger The logger to use
 * @returns A new HealthCheckService
 */
export const createHealthCheck = (
  port: number,
  livenessPath: string,
  readinessPath: string,
  logger: Logger
): HealthCheck => {
  return new HealthCheckService(port, livenessPath, readinessPath, logger);
};
