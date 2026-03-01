---
title: Amazon S3 Storage Adapter
description: Amazon S3 adapter for ZinTrust's storage system
---

# Amazon S3 Storage Adapter

The `@zintrust/storage-s3` package provides an Amazon S3 driver for ZinTrust's storage system, enabling scalable file storage with AWS's cloud infrastructure.

## Installation

```bash
npm install @zintrust/storage-s3
```

## Configuration

Add the S3 storage configuration to your environment:

```typescript
// config/storage.ts
import { StorageConfig } from '@zintrust/core';

export const storage: StorageConfig = {
  driver: 's3',
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    bucket: process.env.AWS_BUCKET,
    endpoint: process.env.AWS_ENDPOINT, // Optional custom endpoint
    forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === 'true',
    signatureVersion: 'v4',
  },
};
```

## Environment Variables

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SESSION_TOKEN=your_session_token
AWS_BUCKET=your-bucket-name
AWS_ENDPOINT=https://s3.amazonaws.com
AWS_FORCE_PATH_STYLE=false
```

## Usage

```typescript
import { Storage } from '@zintrust/core';

// Upload a file
const uploadedFile = await Storage.upload('documents/report.pdf', fileBuffer, {
  contentType: 'application/pdf',
  metadata: {
    originalName: 'annual-report.pdf',
    uploadedBy: 'user-123',
  },
});

// Get file URL
const url = Storage.url('documents/report.pdf');

// Download a file
const fileBuffer = await Storage.download('documents/report.pdf');

// Check if file exists
const exists = await Storage.exists('documents/report.pdf');

// Delete a file
await Storage.delete('documents/report.pdf');

// List files
const files = await Storage.list('documents/', { recursive: true });
```

## Features

- **AWS Integration**: Full S3 API integration
- **Scalable Storage**: Virtually unlimited storage capacity
- **High Availability**: 99.999999999% (11 nines) durability
- **Global Access**: Global access to stored files
- **Versioning**: Object versioning support
- **Lifecycle Management**: Automated lifecycle policies
- **Security**: Encryption and IAM integration
- **Performance**: High-performance uploads/downloads
- **Monitoring**: CloudWatch integration

## Advanced Configuration

### AWS Credentials

```typescript
export const storage: StorageConfig = {
  driver: 's3',
  s3: {
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'your-access-key',
      secretAccessKey: 'your-secret-key',
      // or use IAM role
      // credentials: new AWS.SharedIniFileCredentials({ profile: 'default' }),
    },
    bucket: 'your-bucket',
  },
};
```

### Custom Endpoint

```typescript
export const storage: StorageConfig = {
  driver: 's3',
  s3: {
    region: 'us-east-1',
    endpoint: 'https://s3.us-east-1.amazonaws.com',
    // For testing with MinIO or other S3-compatible services
    // endpoint: 'http://localhost:9000',
    forcePathStyle: true,
    signatureVersion: 'v4',
  },
};
```

### Client Configuration

```typescript
export const storage: StorageConfig = {
  driver: 's3',
  s3: {
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

## Bucket Operations

### Create Bucket

```typescript
import { S3Manager } from '@zintrust/storage-s3';

const manager = new S3Manager();

// Create bucket
await manager.createBucket('my-new-bucket', {
  region: 'us-east-1',
  acl: 'private',
  versioning: {
    Status: 'Enabled',
  },
  lifecycle: {
    Rules: [
      {
        ID: 'DeleteOldObjects',
        Status: 'Enabled',
        Expiration: { Days: 30 },
      },
    ],
  },
});
```

### Configure Bucket

```typescript
// Enable versioning
await manager.enableVersioning('my-bucket');

// Set lifecycle rules
await manager.setLifecycleRules('my-bucket', [
  {
    ID: 'TransitionToIA',
    Status: 'Enabled',
    Transitions: [
      { Days: 30, StorageClass: 'STANDARD_IA' },
      { Days: 90, StorageClass: 'GLACIER' },
      { Days: 365, StorageClass: 'DEEP_ARCHIVE' },
    ],
  },
  {
    ID: 'DeleteOldObjects',
    Status: 'Enabled',
    Expiration: { Days: 3650 },
  },
]);

// Set bucket policy
await manager.setPolicy('my-bucket', {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: '*' },
      Action: ['s3:GetObject'],
      Resource: ['arn:aws:s3:::my-bucket/public/*'],
    },
  ],
});
```

## File Operations

### Upload with Options

```typescript
// Upload with storage class
await Storage.upload('archive/document.pdf', buffer, {
  storageClass: 'GLACIER',
  contentType: 'application/pdf',
});

// Upload with encryption
await Storage.upload('secure/file.pdf', buffer, {
  serverSideEncryption: 'AES256',
  contentType: 'application/pdf',
});

// Upload with KMS encryption
await Storage.upload('kms-encrypted/file.pdf', buffer, {
  serverSideEncryption: 'aws:kms',
  sseKmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
});

// Upload with metadata
await Storage.upload('files/data.csv', buffer, {
  metadata: {
    originalName: 'data.csv',
    uploadedBy: 'user-123',
    category: 'reports',
    tags: JSON.stringify(['important', '2024']),
  },
});
```

### Download Options

```typescript
// Download specific version
const oldVersion = await Storage.download('files/data.csv', {
  versionId: '1234567890abcdef1234567890abcdef12345678',
});

// Download with range
const partialBuffer = await Storage.download('large-file.zip', {
  range: { start: 0, end: 1024 * 1024 }, // First 1MB
});
```

### Version Management

```typescript
// List file versions
const versions = await Storage.listVersions('files/data.csv');
// Returns: Array<{ versionId: string, size: number, lastModified: Date, isLatest: boolean }>

// Restore version
await Storage.restoreVersion('files/data.csv', '1234567890abcdef1234567890abcdef12345678');

// Delete specific version
await Storage.deleteVersion('files/data.csv', '1234567890abcdef1234567890abcdef12345678');
```

## Advanced Features

### Multipart Upload

```typescript
// Create multipart upload
const uploadId = await Storage.createMultipartUpload('large-file.zip', {
  contentType: 'application/zip',
  metadata: { originalName: 'large-file.zip' },
});

// Upload parts
const parts = [];
const chunkSize = 8 * 1024 * 1024; // 8MB chunks
for (let i = 0; i < fileBuffer.length; i += chunkSize) {
  const partNumber = i + 1;
  const partBuffer = fileBuffer.slice(i, i + chunkSize);
  
  const part = await Storage.uploadPart(uploadId, partNumber, partBuffer);
  parts.push({ partNumber, etag: part.ETag });
}

// Complete multipart upload
await Storage.completeMultipartUpload(uploadId, parts);
```

### Presigned URLs

```typescript
// Generate presigned URL for upload
const uploadUrl = await Storage.presignedUrl('PUT', 'uploads/', {
  expiresIn: 3600, // 1 hour
  key: 'user-uploads/file.pdf',
  contentType: 'application/pdf',
  contentLength: 5 * 1024 * 1024, // 5MB
  metadata: { uploadedBy: 'user-123' },
});

// Generate presigned URL for download
const downloadUrl = await Storage.presignedUrl('GET', 'private/document.pdf', {
  expiresIn: 1800, // 30 minutes
  responseDisposition: 'attachment; filename="document.pdf"',
  responseContentType: 'application/pdf',
});

// Generate presigned URL with conditions
const conditionalUrl = await Storage.presignedUrl('PUT', 'uploads/', {
  expiresIn: 3600,
  conditions: [
    { acl: 'public-read' },
    { 'content-type': 'image/jpeg' },
    ['content-length-range', 0, 5 * 1024 * 1024], // Max 5MB
  ],
});
```

### Presigned POST

```typescript
// Generate presigned POST for browser uploads
const postPolicy = await Storage.presignedPost('uploads/', {
  expiresIn: 3600,
  conditions: [
    { bucket: 'my-bucket' },
    { key: 'uploads/${filename}' },
    { acl: 'public-read' },
    ['starts-with', '$Content-Type', 'image/'],
    ['content-length-range', 0, 10 * 1024 * 1024], // Max 10MB
  ],
});

// Returns form data for browser uploads
console.log(postPolicy.url);
console.log(postPolicy.fields);
```

### Batch Operations

```typescript
import { S3Batch } from '@zintrust/storage-s3';

const batch = new S3Batch();

// Add operations to batch
batch.delete('files/old-file1.pdf');
batch.delete('files/old-file2.pdf');
batch.copy('files/current.pdf', 'archive/current-backup.pdf');

// Execute batch
const results = await batch.execute();
// Returns: Array<{ success: boolean, error?: string }>
```

## Storage Classes

### Standard Storage Classes

```typescript
// Upload with different storage classes
await Storage.upload('hot-data/file.json', buffer, {
  storageClass: 'STANDARD', // Frequent access
});

await Storage.upload('infrequent-data/file.json', buffer, {
  storageClass: 'STANDARD_IA', // Infrequent access
});

await Storage.upload('archive-data/file.json', buffer, {
  storageClass: 'GLACIER', // Long-term archive
});

await Storage.upload('deep-archive/file.json', buffer, {
  storageClass: 'DEEP_ARCHIVE', // Long-term deep archive
});
```

### Intelligent Tiering

```typescript
await Storage.upload('auto-tiering/file.json', buffer, {
  storageClass: 'INTELLIGENT_TIERING', // Automatic tiering
});
```

## Security

### Encryption

```typescript
// Server-side encryption with S3-managed keys
await Storage.upload('encrypted/file.pdf', buffer, {
  serverSideEncryption: 'AES256',
});

// Server-side encryption with KMS
await Storage.upload('kms-encrypted/file.pdf', buffer, {
  serverSideEncryption: 'aws:kms',
  sseKmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
});

// Server-side encryption with customer-provided keys
await Storage.upload('customer-key/file.pdf', buffer, {
  serverSideEncryption: 'aws:kms',
  sseCustomerAlgorithm: 'AES256',
  sseCustomerKey: 'your-base64-encoded-key',
});
```

### Access Control

```typescript
// Set object ACL
await Storage.setAcl('public/file.jpg', 'public-read');

// Set bucket policy
await manager.setPolicy('my-bucket', {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: 'arn:aws:iam::123456789012:user/app-user' },
      Action: ['s3:GetObject', 's3:PutObject'],
      Resource: ['arn:aws:s3:::my-bucket/user-files/*'],
    },
  ],
});
```

### CORS Configuration

```typescript
await manager.setCORS('my-bucket', [
  {
    AllowedOrigins: ['https://example.com'],
    AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    AllowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    MaxAgeSeconds: 3600,
    ExposeHeaders: ['ETag', 'Content-Length'],
  },
]);
```

## Performance Optimization

### Parallel Uploads

```typescript
import { parallelUpload } from '@zintrust/storage-s3';

// Upload large file in parallel
await parallelUpload('large-file.zip', fileBuffer, {
  chunkSize: 16 * 1024 * 1024, // 16MB chunks
  concurrency: 4,
});
```

### Transfer Acceleration

```typescript
export const storage: StorageConfig = {
  driver: 's3',
  s3: {
    // ... other config
    useAccelerateEndpoint: true,
  },
};
```

### Caching

```typescript
// Set cache control headers
await Storage.upload('static/style.css', cssBuffer, {
  cacheControl: 'public, max-age=31536000, immutable',
});

// Set custom caching
await Storage.upload('images/photo.jpg', imageBuffer, {
  cacheControl: 'public, max-age=86400',
  expires: new Date(Date.now() + 86400 * 1000).toUTCString(),
});
```

## Monitoring and Metrics

### CloudWatch Integration

```typescript
import { S3Monitoring } from '@zintrust/storage-s3';

const monitoring = new S3Monitoring();

// Get bucket metrics
const metrics = await monitoring.getBucketMetrics('my-bucket');
// Returns: { bucketSize: number, objectCount: number, uploadCount: number, downloadCount: number }

// Create custom metrics
await monitoring.putMetricData({
  Namespace: 'ZinTrust/Storage',
  MetricData: [
    {
      MetricName: 'UploadTime',
      Value: uploadTime,
      Unit: 'Milliseconds',
      Dimensions: [
        { Name: 'BucketName', Value: 'my-bucket' },
      ],
    },
  ],
});
```

### S3 Event Notifications

```typescript
// Set up event notifications
await manager.setNotification('my-bucket', {
  TopicConfigurations: [
    {
      Id: 'UploadNotification',
      TopicArn: 'arn:aws:sns:us-east-1:123456789012:upload-notifications',
      Events: ['s3:ObjectCreated:*'],
      Filter: {
        Key: {
          FilterRules: [
            { Name: 'prefix', Value: 'uploads/' },
          ],
        },
      },
    },
  ],
});
```

## Error Handling

### Retry Configuration

```typescript
export const storage: StorageConfig = {
  driver: 's3',
  s3: {
    // ... other config
    retryOptions: {
      maxRetries: 5,
      retryDelay: 1000,
      maxRetryDelay: 30000,
      retryableErrorCodes: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
      ],
    },
  },
};
```

### Error Types

```typescript
try {
  await Storage.upload('file.pdf', buffer);
} catch (error) {
  if (error.code === 'AccessDenied') {
    console.log('Access denied - check IAM policies');
  } else if (error.code === 'NoSuchBucket') {
    console.log('Bucket does not exist');
  } else if (error.code === 'RequestTimeout') {
    console.log('Request timeout - retrying');
  } else if (error.code === 'SlowDown') {
    console.log('Rate limit exceeded - slow down requests');
  } else {
    console.log('S3 error:', error.message);
  }
}
```

## Testing

### Local Testing with MinIO

```typescript
// Use MinIO for local testing
export const storage: StorageConfig = {
  driver: 's3',
  s3: {
    region: 'us-east-1',
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    bucket: 'test-bucket',
    endpoint: 'http://localhost:9000',
    forcePathStyle: true,
    signatureVersion: 'v4',
  },
};
```

### Mock S3

```typescript
import { S3Mock } from '@zintrust/storage-s3';

// Use mock for testing
const mockS3 = new S3Mock();

// Mock operations
mockS3.on('upload', (bucket, key, data) => {
  console.log('Mock upload:', bucket, key, data.length);
});

// Test file operations
await mockS3.upload('test-bucket', 'test.txt', Buffer.from('test'));
const exists = await mockS3.exists('test-bucket', 'test.txt');
expect(exists).toBe(true);
```

## Best Practices

1. **Use Appropriate Storage Class**: Choose storage class based on access patterns
2. **Implement Lifecycle Policies**: Automate data lifecycle management
3. **Enable Versioning**: Protect against accidental deletion
4. **Use Encryption**: Encrypt sensitive data at rest
5. **Monitor Usage**: Track storage usage and costs
6. **Optimize Uploads**: Use multipart uploads for large files
7. **Implement Caching**: Set appropriate cache headers
8. **Use IAM**: Implement fine-grained access control

## Limitations

- **Object Size**: Maximum 5TB per object
- **Multipart Upload**: Maximum 5TB per object with 10,000 parts
- **Bucket Count**: Limited by account quotas (100 by default)
- **API Rate Limits**: Rate limits apply to S3 API
- **Naming Restrictions**: Bucket names must be globally unique
- **Regional Limitations**: Some features are region-specific

## Cost Optimization

### Storage Classes

```typescript
// Move old files to cheaper storage
await manager.transitionObjects('my-bucket', 'old-data/', {
  days: 30,
  storageClass: 'STANDARD_IA',
});

// Archive very old data
await manager.transitionObjects('my-bucket', 'archive/', {
  days: 90,
  storageClass: 'GLACIER',
});
```

### Lifecycle Rules

```typescript
// Optimize costs with lifecycle rules
await manager.setLifecycleRules('my-bucket', [
  // Move to IA after 30 days
  {
    ID: 'TransitionToIA',
    Status: 'Enabled',
    Transitions: [
      { Days: 30, StorageClass: 'STANDARD_IA' },
    ],
  },
  // Move to Glacier after 90 days
  {
    ID: 'TransitionToGlacier',
    Status: 'Enabled',
    Transitions: [
      { Days: 90, StorageClass: 'GLACIER' },
    ],
  },
  // Delete after 365 days
  {
    ID: 'DeleteOldObjects',
    Status: 'Enabled',
    Expiration: { Days: 365 },
  },
]);
```
