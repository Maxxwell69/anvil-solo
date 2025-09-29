# Swap Service

This service processes swap orders from RabbitMQ and executes them. It has been redesigned to work efficiently in both Kubernetes and local Docker environments.

## Features

- Processes swap orders from RabbitMQ queue
- Kubernetes-native design with health checks
- Horizontal scaling support
- Graceful shutdown handling
- Backward compatible with Docker Compose
- SOLID principles implementation for maintainability

## Architecture

The service follows SOLID principles with a clean architecture:

### Domain Layer
- Interfaces defining core business logic
- SwapProcessor, MessageQueue, HealthCheck interfaces

### Service Layer
- Implementation of domain interfaces
- Separation of concerns with single responsibility classes
- Dependency injection for loose coupling

### Infrastructure Layer
- External dependencies like MongoDB and RabbitMQ
- Configuration management
- Logging services

## Running Locally

### Using Docker Compose

The service can be run locally using Docker Compose:

```bash
cd bot
docker-compose up -d
```

This will start:
- MongoDB
- RabbitMQ
- Redis
- Swap service with health checks

### Without Docker

To run the service directly:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript code:
   ```bash
   npm run build
   ```

3. Run the service:
   ```bash
   node dist/main.js
   ```

4. For development with auto-reload:
   ```bash
   npm run dev
   ```

## Environment Variables

The service supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | From config.json |
| `RABBITMQ_URL` | RabbitMQ connection string | From config.json |
| `RABBITMQ_QUEUE` | RabbitMQ queue name | swap_orders |
| `REDIS_URL` | Redis connection string (optional) | From config.json |
| `PREFETCH_COUNT` | Number of messages to prefetch from RabbitMQ | 5 |
| `HEALTH_PORT` | Port for health check server | 8080 |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | info |

## Configuration

The service can be configured using environment variables or a config.json file. Copy the config.example.json file to config.json and modify as needed:

```bash
cp src/config.example.json src/config.json
```

## Kubernetes Deployment

The service is designed to run in Kubernetes with the provided Helm chart:

```bash
cd anvil-bot-chart
helm install anvil-bot . --namespace your-namespace
```

### Scaling

The service can be scaled manually:

```bash
kubectl scale deployment anvil-bot-swap --replicas=3 -n your-namespace
```

Or automatically using the Horizontal Pod Autoscaler (HPA) by setting `autoscaling.enabled: true` in the values.yaml file.

### Health Checks

The service exposes health check endpoints:

- `/health` or `/health/live`: Liveness probe
- `/health/ready`: Readiness probe

## Architecture Benefits

The service has been redesigned to be Kubernetes-native:

1. **Single Responsibility**: Each class has one clear responsibility
2. **Open/Closed**: Components are open for extension but closed for modification
3. **Dependency Inversion**: High-level modules don't depend on low-level modules
4. **Interface Segregation**: Clients only depend on interfaces they use
5. **Liskov Substitution**: Implementations can be swapped without affecting clients

## Monitoring

The service can be monitored through:

1. Kubernetes health checks
2. Logs (stdout/stderr)
3. RabbitMQ queue metrics
