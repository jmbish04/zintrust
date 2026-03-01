---
title: SQS Queue Adapter
description: SQS adapter for ZinTrust's queue system
---

# SQS Queue Adapter

The `@zintrust/queue-sqs` package provides an Amazon SQS driver for ZinTrust's queue system, enabling scalable message queuing with AWS Simple Queue Service.

## Installation

```bash
zin add  @zintrust/queue-sqs
```

## Configuration

Add the SQS queue configuration to your environment:

```typescript
// config/queue.ts
import { QueueConfig } from '@zintrust/core';

export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    endpoint: process.env.SQS_ENDPOINT, // Optional custom endpoint
    maxRetries: 3,
    retryDelay: 1000,
    visibilityTimeout: 30,
    messageRetentionPeriod: 1209600, // 14 days
    receiveMessageWaitTime: 20, // Long polling
    maxNumberOfMessages: 10,
  },
};
```

## Environment Variables

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SESSION_TOKEN=your_session_token
SQS_ENDPOINT=https://sqs.us-east-1.amazonaws.com
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

- **AWS Integration**: Full AWS SQS API integration
- **Auto Scaling**: Automatic scaling with SQS infrastructure
- **Long Polling**: Efficient message retrieval with long polling
- **Dead Letter Queues**: Built-in DLQ support
- **Message Visibility**: Configurable visibility timeout
- **Message Attributes**: Support for message metadata
- **FIFO Queues**: First-In-First-Out queue support
- **Server-Side Encryption**: Message encryption at rest
- **Monitoring**: CloudWatch integration
- **Multi-Region**: Cross-region queue support

## Advanced Configuration

### AWS Credentials

```typescript
export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'your-access-key',
      secretAccessKey: 'your-secret-key',
      // or use IAM role
      // credentials: new AWS.SharedIniFileCredentials({ profile: 'default' }),
    },
  },
};
```

### Custom Endpoint

```typescript
export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    region: 'us-east-1',
    endpoint: 'https://sqs.localstack.cloud:4566', // LocalStack for testing
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  },
};
```

### Client Configuration

```typescript
export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    region: 'us-east-1',
    clientConfig: {
      maxRetries: 5,
      retryDelayOptions: {
        customBackoff: (retryCount) => Math.pow(2, retryCount) * 100,
      },
      httpOptions: {
        timeout: 30000,
        connectTimeout: 5000,
      },
    },
  },
};
```

## Queue Types

### Standard Queue

```typescript
const StandardJob = Queue.define({
  queue: 'standard-queue',
  sqs: {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/standard-queue',
  },
  handler: async (job) => {
    console.log('Processing standard job:', job.data);
  },
});
```

### FIFO Queue

```typescript
const FIFOJob = Queue.define({
  queue: 'fifo-queue',
  sqs: {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/fifo-queue.fifo',
    fifo: true,
    messageGroupId: 'group-1',
    messageDeduplicationId: 'dedup-1',
  },
  handler: async (job) => {
    console.log('Processing FIFO job:', job.data);
  },
});
```

### Delayed Queue

```typescript
const DelayedJob = Queue.define({
  queue: 'delayed-queue',
  sqs: {
    delaySeconds: 300, // 5 minutes delay
  },
  handler: async (job) => {
    console.log('Processing delayed job:', job.data);
  },
});
```

## Message Options

### Message Attributes

```typescript
await Job.dispatch(
  {
    message: 'Custom message',
  },
  {
    messageAttributes: {
      source: {
        DataType: 'String',
        StringValue: 'web-api',
      },
      priority: {
        DataType: 'Number',
        StringValue: '10',
      },
      isUrgent: {
        DataType: 'Binary',
        BinaryValue: Buffer.from('true'),
      },
    },
  }
);
```

### Message System Attributes

```typescript
await Job.dispatch(
  {
    message: 'Message with system attributes',
  },
  {
    systemAttributes: {
      AWSTraceHeader: {
        DataType: 'String',
        StringValue: 'trace-id',
      },
    },
  }
);
```

### Message Deduplication

```typescript
await FIFOJob.dispatch(
  {
    message: 'Unique message',
  },
  {
    messageDeduplicationId: `unique-${Date.now()}-${jobId}`,
    messageGroupId: 'user-processing',
  }
);
```

## Dead Letter Queues

### Configure DLQ

```typescript
const JobWithDLQ = Queue.define({
  queue: 'processing-queue',
  sqs: {
    deadLetterQueue: {
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/dlq-processing',
      maxReceiveCount: 3,
    },
  },
  options: {
    attempts: 3,
  },
  handler: async (job) => {
    await processJob(job.data);
  },
});
```

### Process Dead Letters

```typescript
const DLQJob = Queue.define({
  queue: 'dlq-processing',
  handler: async (job) => {
    console.log('Dead letter message:', job.data);
    console.log('Receive count:', job.attributes.ApproximateReceiveCount);
    console.log('Error:', job.error);

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

### Batch Processing

```typescript
const BatchJob = Queue.define({
  queue: 'batch-queue',
  sqs: {
    maxNumberOfMessages: 10,
    waitTime: 20,
  },
  handler: async (jobs) => {
    // Process multiple jobs at once
    const results = await processBatch(jobs.map((job) => job.data));
    return results;
  },
});
```

### Priority Processing

```typescript
const PriorityJob = Queue.define({
  queue: 'priority-queue',
  sqs: {
    priorityAttribute: 'priority',
  },
  handler: async (job) => {
    console.log('Processing priority job:', job.data);
  },
});

// Dispatch with priority
await PriorityJob.dispatch(
  {
    message: 'High priority task',
  },
  {
    messageAttributes: {
      priority: {
        DataType: 'Number',
        StringValue: '10',
      },
    },
  }
);
```

### Scheduled Jobs

```typescript
const ScheduledJob = Queue.define({
  queue: 'scheduled-queue',
  sqs: {
    delaySeconds: 60 * 60, // 1 hour delay
  },
  handler: async (job) => {
    await generateDailyReport();
  },
});
```

## Queue Management

### Create Queue

```typescript
import { SQSManager } from '@zintrust/queue-sqs';

const manager = new SQSManager();

// Create standard queue
const queueUrl = await manager.createQueue({
  QueueName: 'my-queue',
  Attributes: {
    VisibilityTimeout: '30',
    MessageRetentionPeriod: '1209600',
  },
});

// Create FIFO queue
const fifoQueueUrl = await manager.createQueue({
  QueueName: 'my-fifo-queue.fifo',
  Attributes: {
    FifoQueue: 'true',
    ContentBasedDeduplication: 'true',
  },
});
```

### Configure Queue

```typescript
await manager.setQueueAttributes(queueUrl, {
  VisibilityTimeout: '60',
  ReceiveMessageWaitTimeSeconds: '20',
  RedrivePolicy: JSON.stringify({
    deadLetterTargetArn: 'dlq-arn',
    maxReceiveCount: 5,
  }),
});
```

### Queue Monitoring

```typescript
const attributes = await manager.getQueueAttributes(queueUrl, [
  'ApproximateNumberOfMessages',
  'ApproximateNumberOfMessagesNotVisible',
  'ApproximateNumberOfMessagesDelayed',
]);

console.log('Queue stats:', {
  waiting: attributes.ApproximateNumberOfMessages,
  processing: attributes.ApproximateNumberOfMessagesNotVisible,
  delayed: attributes.ApproximateNumberOfMessagesDelayed,
});
```

## Performance Optimization

### Long Polling

```typescript
export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    receiveMessageWaitTime: 20, // 20 seconds long polling
    maxNumberOfMessages: 10, // Batch up to 10 messages
  },
};
```

### Batch Operations

```typescript
// Batch send messages
const entries = [
  { Id: '1', MessageBody: JSON.stringify({ task: 'task1' }) },
  { Id: '2', MessageBody: JSON.stringify({ task: 'task2' }) },
  { Id: '3', MessageBody: JSON.stringify({ task: 'task3' }) },
];

await manager.sendMessageBatch(queueUrl, entries);

// Batch delete messages
const deleteEntries = [
  { Id: '1', ReceiptHandle: 'receipt1' },
  { Id: '2', ReceiptHandle: 'receipt2' },
];

await manager.deleteMessageBatch(queueUrl, deleteEntries);
```

### Connection Pooling

```typescript
export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    region: 'us-east-1',
    maxConnections: 20,
    connectionTimeout: 10000,
    requestTimeout: 30000,
  },
};
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
      maxDelay: 30000,
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
        return false; // Don't retry
      }
    }
  },
});
```

### Error Monitoring

```typescript
Queue.setErrorHandler(async (job, error) => {
  console.log('SQS job failed:', job.id, error.message);

  // Log to CloudWatch
  await logToCloudWatch('SQSJobError', {
    jobId: job.id,
    queue: job.queue,
    error: error.message,
    timestamp: new Date().toISOString(),
  });

  // Send alert for critical errors
  if (error.severity === 'critical') {
    await sendAlert(error);
  }
});
```

## Security

### Server-Side Encryption

```typescript
export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    region: 'us-east-1',
    kmsMasterKeyId: 'alias/sqs-encryption-key',
  },
};

// Or configure per queue
await manager.setQueueAttributes(queueUrl, {
  KmsMasterKeyId: 'alias/sqs-encryption-key',
  KmsDataKeyReusePeriodSeconds: '300',
});
```

### VPC Endpoints

```typescript
export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    region: 'us-east-1',
    endpoint: 'https://vpce-xxxxx.sqs.us-east-1.vpce.amazonaws.com',
  },
};
```

### IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:CreateQueue"
      ],
      "Resource": "arn:aws:sqs:us-east-1:123456789012:*"
    }
  ]
}
```

## Monitoring and Metrics

### CloudWatch Metrics

```typescript
import { CloudWatch } from '@zintrust/queue-sqs';

const cloudWatch = new CloudWatch();

// Get queue metrics
const metrics = await cloudWatch.getQueueMetrics('email-queue', {
  ApproximateNumberOfMessages: 'Average',
  ApproximateAgeOfOldestMessage: 'Maximum',
  NumberOfMessagesReceived: 'Sum',
  NumberOfMessagesDeleted: 'Sum',
});
```

### Custom Metrics

```typescript
// Publish custom metrics
await cloudWatch.putMetricData({
  Namespace: 'ZinTrust/Queues',
  MetricData: [
    {
      MetricName: 'JobProcessingTime',
      Value: processingTime,
      Unit: 'Milliseconds',
      Dimensions: [{ Name: 'QueueName', Value: 'email-queue' }],
    },
  ],
});
```

## Testing

### LocalStack

```typescript
// Use LocalStack for local testing
export const queue: QueueConfig = {
  driver: 'sqs',
  sqs: {
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  },
};
```

### Mock SQS

```typescript
import { SQSMock } from '@zintrust/queue-sqs';

// Use mock for testing
const mockSQS = new SQSMock();

// Mock message sending
mockSQS.on('sendMessage', (queueUrl, message) => {
  console.log('Mock send:', queueUrl, message);
});

// Test job processing
await mockSQS.process('test-queue', async (job) => {
  expect(job.data).toEqual({ test: 'data' });
});
```

## Limitations

- **Message Size**: SQS messages limited to 256KB
- **Visibility Timeout**: Maximum 12 hours
- **Retention Period**: Maximum 14 days
- **Message Delay**: Maximum 15 minutes
- **API Limits**: SQS API rate limits apply
- **Regional**: Queues are regional, not global
- **Ordering**: Standard queues don't guarantee ordering (use FIFO for ordering)
