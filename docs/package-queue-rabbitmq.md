---
title: RabbitMQ Queue Adapter
description: RabbitMQ adapter for ZinTrust's queue system
---

# RabbitMQ Queue Adapter

The `@zintrust/queue-rabbitmq` package provides a RabbitMQ driver for ZinTrust's queue system, enabling robust message queuing with RabbitMQ's advanced features.

## Installation

```bash
zin add  @zintrust/queue-rabbitmq
```

## Configuration

Add the RabbitMQ queue configuration to your environment:

```typescript
// config/queue.ts
import { QueueConfig } from '@zintrust/core';

export const queue: QueueConfig = {
  driver: 'rabbitmq',
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    hostname: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672'),
    username: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD,
    vhost: process.env.RABBITMQ_VHOST || '/',
    heartbeat: 60,
    timeout: 30000,
    prefetch: 10,
    retryAttempts: 3,
    retryDelay: 5000,
  },
};
```

## Environment Variables

```bash
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
```

## Usage

```typescript
import { Queue } from '@zintrust/core';

// Define a job
const SendEmailJob = Queue.define({
  queue: 'email-queue',
  handler: async (job) => {
    const { to, subject, content } = job.data;
    await sendEmail(to, subject, content);
  },
  options: {
    attempts: 3,
    backoff: 'exponential',
    delay: 1000,
  },
});

// Dispatch a job
await SendEmailJob.dispatch({
  to: 'user@example.com',
  subject: 'Welcome!',
  content: 'Welcome to our service!',
});

// Process jobs
await Queue.process('email-queue', async (job) => {
  await SendEmailJob.handler(job);
});
```

## Features

- **AMQP Protocol**: Full AMQP 0-9-1 protocol support
- **Connection Management**: Automatic connection and channel management
- **Message Acknowledgment**: Reliable message delivery with ack/nack
- **Exchange Types**: Support for direct, fanout, topic, and headers exchanges
- **Routing**: Advanced routing and message filtering
- **Dead Letter Queues**: Automatic dead lettering for failed messages
- **Message Persistence**: Durable queues and messages
- **Cluster Support**: RabbitMQ cluster support
- **Monitoring**: Built-in monitoring and metrics

## Advanced Configuration

### Connection Options

```typescript
export const queue: QueueConfig = {
  driver: 'rabbitmq',
  rabbitmq: {
    url: 'amqp://localhost:5672',
    connectionOptions: {
      heartbeat: 60,
      timeout: 30000,
      clientProperties: {
        product: 'ZinTrust',
        version: '1.0.0',
        platform: 'Node.js',
      },
    },
    socketOptions: {
      timeout: 30000,
      noDelay: true,
      keepAlive: true,
    },
  },
};
```

### SSL/TLS Configuration

```typescript
export const queue: QueueConfig = {
  driver: 'rabbitmq',
  rabbitmq: {
    url: 'amqps://localhost:5671',
    sslOptions: {
      ca: fs.readFileSync('/path/to/ca-cert.pem'),
      key: fs.readFileSync('/path/to/client-key.pem'),
      cert: fs.readFileSync('/path/to/client-cert.pem'),
      rejectUnauthorized: true,
    },
  },
};
```

### Cluster Configuration

```typescript
export const queue: QueueConfig = {
  driver: 'rabbitmq',
  rabbitmq: {
    urls: ['amqp://node1:5672', 'amqp://node2:5672', 'amqp://node3:5672'],
    connectionOptions: {
      retryDelay: 5000,
      maxRetries: 10,
    },
  },
};
```

## Exchange Types

### Direct Exchange

```typescript
const DirectJob = Queue.define({
  queue: 'direct-queue',
  exchange: {
    name: 'direct-exchange',
    type: 'direct',
    durable: true,
  },
  routingKey: 'email.send',
  handler: async (job) => {
    console.log('Direct exchange job:', job.data);
  },
});
```

### Fanout Exchange

```typescript
const FanoutJob = Queue.define({
  queue: 'fanout-queue',
  exchange: {
    name: 'fanout-exchange',
    type: 'fanout',
    durable: true,
  },
  handler: async (job) => {
    console.log('Fanout exchange job:', job.data);
  },
});
```

### Topic Exchange

```typescript
const TopicJob = Queue.define({
  queue: 'topic-queue',
  exchange: {
    name: 'topic-exchange',
    type: 'topic',
    durable: true,
  },
  routingKey: 'user.*.created',
  handler: async (job) => {
    console.log('Topic exchange job:', job.data);
  },
});

// Dispatch with specific routing key
await TopicJob.dispatch(
  {
    user: { id: 1, name: 'John' },
  },
  {
    routingKey: 'user.premium.created',
  }
);
```

### Headers Exchange

```typescript
const HeadersJob = Queue.define({
  queue: 'headers-queue',
  exchange: {
    name: 'headers-exchange',
    type: 'headers',
    durable: true,
  },
  headers: {
    priority: 'high',
    source: 'api',
  },
  handler: async (job) => {
    console.log('Headers exchange job:', job.data);
  },
});
```

## Message Options

### Message Priorities

```typescript
await HighPriorityJob.dispatch(
  {
    message: 'Urgent notification',
  },
  {
    priority: 10, // 0-10 priority range
    expiration: 60000, // 60 seconds TTL
  }
);
```

### Message Headers

```typescript
await Job.dispatch(
  {
    message: 'Custom message',
  },
  {
    headers: {
      'x-custom-header': 'custom-value',
      'x-source': 'web-api',
      'x-version': '1.0',
    },
    persistent: true, // Make message persistent
  }
);
```

### Delayed Messages

```typescript
await DelayedJob.dispatch(
  {
    message: 'Send in 5 minutes',
  },
  {
    delay: 5 * 60 * 1000, // 5 minutes delay
  }
);
```

## Dead Letter Queues

### Configure Dead Letter Exchange

```typescript
const JobWithDLQ = Queue.define({
  queue: 'processing-queue',
  deadLetterQueue: {
    exchange: 'dlx-exchange',
    routingKey: 'dlq.processing',
    ttl: 60000, // Time to live in DLQ
  },
  handler: async (job) => {
    // Process job that might fail
    await riskyOperation(job.data);
  },
});
```

### Handle Dead Letter Messages

```typescript
const DLQHandler = Queue.define({
  queue: 'dead-letter-queue',
  exchange: {
    name: 'dlx-exchange',
    type: 'direct',
  },
  routingKey: 'dlq.processing',
  handler: async (job) => {
    console.log('Dead letter message:', job.data);
    console.log('Death reason:', job.properties.headers['x-death']);

    // Decide whether to retry or archive
    if (shouldRetry(job)) {
      await JobWithDLQ.dispatch(job.data);
    } else {
      await archiveFailedJob(job);
    }
  },
});
```

## Advanced Features

### Message Patterns

#### Request-Reply Pattern

```typescript
// Request
const response = await RequestJob.dispatch(
  {
    query: 'SELECT * FROM users',
  },
  {
    replyTo: 'response-queue',
    correlationId: generateId(),
    timeout: 30000,
  }
);

// Reply handler
const ResponseJob = Queue.define({
  queue: 'response-queue',
  handler: async (job) => {
    const { correlationId, data } = job.data;
    // Handle response
  },
});
```

#### Publish-Subscribe Pattern

```typescript
// Publisher
await PublisherJob.dispatch(
  {
    event: 'user.created',
    data: { id: 1, name: 'John' },
  },
  {
    exchange: 'events-exchange',
    type: 'topic',
    routingKey: 'user.created',
  }
);

// Multiple subscribers
const EmailSubscriber = Queue.define({
  queue: 'email-subscriber',
  exchange: 'events-exchange',
  type: 'topic',
  routingKey: 'user.*',
  handler: async (job) => {
    await sendWelcomeEmail(job.data);
  },
});

const AnalyticsSubscriber = Queue.define({
  queue: 'analytics-subscriber',
  exchange: 'events-exchange',
  type: 'topic',
  routingKey: 'user.*',
  handler: async (job) => {
    await trackUserEvent(job.data);
  },
});
```

### Batch Processing

```typescript
const BatchJob = Queue.define({
  queue: 'batch-queue',
  batchSize: 10,
  batchTimeout: 5000,
  handler: async (jobs) => {
    // Process multiple jobs at once
    const results = await processBatch(jobs.map((job) => job.data));
    return results;
  },
});
```

### Scheduled Jobs

```typescript
const ScheduledJob = Queue.define({
  queue: 'scheduled-queue',
  schedule: '0 9 * * *', // Cron expression - daily at 9 AM
  timezone: 'America/New_York',
  handler: async (job) => {
    await generateDailyReport();
  },
});
```

## Error Handling

### Retry Strategies

```typescript
const RetryJob = Queue.define({
  queue: 'retry-queue',
  options: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
  handler: async (job) => {
    try {
      await processJob(job.data);
    } catch (error) {
      if (error.code === 'RETRYABLE') {
        throw error; // Will trigger retry
      } else {
        // Non-retryable error
        job.ack(); // Acknowledge and don't retry
      }
    }
  },
});
```

### Error Monitoring

```typescript
const ErrorMonitoringJob = Queue.define({
  queue: 'monitored-queue',
  onError: async (job, error) => {
    // Log error to monitoring system
    await logError(job, error);

    // Send alert if error rate is high
    const errorRate = await getErrorRate('monitored-queue');
    if (errorRate > 0.1) {
      await sendAlert('High error rate in monitored-queue');
    }
  },
  handler: async (job) => {
    await processJob(job.data);
  },
});
```

## Performance Optimization

### Connection Pooling

```typescript
export const queue: QueueConfig = {
  driver: 'rabbitmq',
  rabbitmq: {
    // ... other config
    channelPool: {
      size: 10,
      max: 20,
      min: 2,
      acquireTimeoutMillis: 30000,
    },
  },
};
```

### Prefetch Configuration

```typescript
export const queue: QueueConfig = {
  driver: 'rabbitmq',
  rabbitmq: {
    // ... other config
    prefetch: {
      default: 10,
      'high-priority-queue': 5,
      'batch-queue': 20,
    },
  },
};
```

### Flow Control

```typescript
const FlowControlJob = Queue.define({
  queue: 'flow-control-queue',
  flowControl: {
    active: true,
    threshold: 100, // Stop processing when queue size > 100
    resumeThreshold: 50, // Resume when queue size < 50
  },
  handler: async (job) => {
    await processJob(job.data);
  },
});
```

## Monitoring and Metrics

### Queue Metrics

```typescript
const metrics = await Queue.getMetrics('email-queue');
// Returns:
{
  queue: 'email-queue',
  messages: 150,
  consumers: 3,
  messageRate: 25.5,
  messageStats: {
    publish: 100,
    deliver: 95,
    ack: 90,
    reject: 5,
  },
}
```

### Connection Health

```typescript
const health = await Queue.getConnectionHealth();
// Returns:
{
  connected: true,
  channels: 5,
  connections: 2,
  memoryUsage: 1024000,
  socketOptions: { /* ... */ },
}
```

## Testing

### Mock RabbitMQ

```typescript
import { RabbitMQMock } from '@zintrust/queue-rabbitmq';

// Use mock for testing
const mockQueue = new RabbitMQMock();

// Mock message publishing
mockQueue.on('publish', (queue, message) => {
  console.log('Mock publish:', queue, message);
});

// Test job processing
await mockQueue.process('test-queue', async (job) => {
  expect(job.data).toEqual({ test: 'data' });
});
```

### Integration Testing

```typescript
import { TestRabbitMQ } from '@zintrust/queue-rabbitmq';

// Use test RabbitMQ instance
const testQueue = new TestRabbitMQ({
  url: 'amqp://localhost:5673', // Different port for testing
});

// Setup test data
await testQueue.purgeQueue('test-queue');
await testQueue.publish('test-queue', { test: 'data' });

// Run test
const result = await processTestJob();
expect(result).toBeTruthy();
```

## Security

### Authentication

```typescript
export const queue: QueueConfig = {
  driver: 'rabbitmq',
  rabbitmq: {
    url: 'amqp://user:password@localhost:5672',
    auth: {
      mechanism: 'PLAIN', // or 'EXTERNAL', 'AMQPLAIN'
      username: 'user',
      password: 'password',
    },
  },
};
```

### Access Control

```typescript
export const queue: QueueConfig = {
  driver: 'rabbitmq',
  rabbitmq: {
    // ... other config
    permissions: {
      configure: '.*',
      write: '.*',
      read: '.*',
    },
  },
};
```

## Limitations

- **Message Size**: RabbitMQ has message size limits
- **Queue Depth**: Large queues can impact performance
- **Network Latency**: Network issues can affect message delivery
- **Memory Usage**: High memory usage for large message volumes
