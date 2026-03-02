---
title: Google Cloud Storage Adapter
description: Google Cloud Storage adapter for ZinTrust's storage system
---

# Google Cloud Storage Adapter

The `@zintrust/storage-gcs` package provides a Google Cloud Storage driver for ZinTrust's storage system, enabling scalable file storage with Google's cloud infrastructure.

## Installation

```bash
zin add  @zintrust/storage-gcs
```

## Configuration

Add the GCS storage configuration to your environment:

```typescript
// config/storage.ts
import { StorageConfig } from '@zintrust/core';

export const storage: StorageConfig = {
  driver: 'gcs',
  gcs: {
    projectId: process.env.GCS_PROJECT_ID,
    keyFilename: process.env.GCS_KEY_FILENAME,
    bucket: process.env.GCS_BUCKET,
    apiEndpoint: process.env.GCS_API_ENDPOINT,
    retryOptions: {
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
    },
  },
};
```

## Environment Variables

```bash
GCS_PROJECT_ID=your-project-id
GCS_KEY_FILENAME=./path/to/service-account-key.json
GCS_BUCKET=your-bucket-name
GCS_API_ENDPOINT=https://storage.googleapis.com
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

- **Google Cloud Integration**: Full GCS API integration
- **Scalable Storage**: Virtually unlimited storage capacity
- **High Availability**: 99.99% availability SLA
- **Global Access**: Global access to stored files
- **Versioning**: Object versioning support
- **Lifecycle Management**: Automated lifecycle policies
- **Security**: Encryption and IAM integration
- **Performance**: High-performance uploads/downloads
- **Monitoring**: Cloud Monitoring integration

## Advanced Configuration

### Service Account Authentication

```typescript
export const storage: StorageConfig = {
  driver: 'gcs',
  gcs: {
    projectId: 'your-project-id',
    credentials: {
      client_email: 'service-account@your-project.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
    },
    bucket: 'your-bucket',
  },
};
```

### Application Default Credentials

```typescript
export const storage: StorageConfig = {
  driver: 'gcs',
  gcs: {
    projectId: 'your-project-id',
    // Use application default credentials
    bucket: 'your-bucket',
  },
};
```

### Custom API Endpoint

```typescript
export const storage: StorageConfig = {
  driver: 'gcs',
  gcs: {
    projectId: 'your-project-id',
    keyFilename: './key.json',
    bucket: 'your-bucket',
    apiEndpoint: 'https://storage.googleapis.com',
    // For testing with emulator
    // apiEndpoint: 'http://localhost:9092',
  },
};
```

## Bucket Operations

### Create Bucket

```typescript
import { GCSManager } from '@zintrust/storage-gcs';

const manager = new GCSManager();

// Create bucket
await manager.createBucket('my-new-bucket', {
  location: 'US-CENTRAL1',
  storageClass: 'STANDARD',
  versioning: {
    enabled: true,
  },
  lifecycle: {
    rules: [
      {
        action: { type: 'Delete' },
        condition: { age: 30 }, // Delete after 30 days
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
    action: { type: 'SetStorageClass', storageClass: 'COLDLINE' },
    condition: { age: 90 },
  },
  {
    action: { type: 'Delete' },
    condition: { age: 365 },
  },
]);

// Set labels
await manager.setLabels('my-bucket', {
  environment: 'production',
  project: 'zintrust',
});
```

## File Operations

### Upload with Options

```typescript
// Upload with encryption
await Storage.upload('secure/document.pdf', buffer, {
  encryptionKey: 'my-encryption-key',
  contentType: 'application/pdf',
});

// Upload with predefined ACL
await Storage.upload('public/image.jpg', buffer, {
  predefinedAcl: 'publicRead',
  contentType: 'image/jpeg',
});

// Upload with custom metadata
await Storage.upload('files/data.csv', buffer, {
  metadata: {
    category: 'reports',
    department: 'finance',
    uploadedAt: new Date().toISOString(),
    tags: JSON.stringify(['important', 'q1-2024']),
  },
});
```

### Download Options

```typescript
// Download specific version
const oldVersion = await Storage.download('files/data.csv', {
  generation: '1234567890',
});

// Download with decryption
const decryptedBuffer = await Storage.download('secure/document.pdf', {
  decryptionKey: 'my-encryption-key',
});
```

### Version Management

```typescript
// List file versions
const versions = await Storage.listVersions('files/data.csv');
// Returns: Array<{ generation: string, size: number, lastModified: Date, metadata: object }>

// Restore old version
await Storage.restoreVersion('files/data.csv', '1234567890');

// Delete specific version
await Storage.deleteVersion('files/data.csv', '1234567890');
```

## Advanced Features

### Resumable Uploads

```typescript
// Start resumable upload
const uploadUrl = await Storage.createResumableUpload('large-file.zip', {
  contentType: 'application/zip',
  metadata: { originalName: 'large-file.zip' },
});

// Upload in chunks
const chunkSize = 8 * 1024 * 1024; // 8MB chunks
for (let start = 0; start < fileBuffer.length; start += chunkSize) {
  const end = Math.min(start + chunkSize, fileBuffer.length);
  const chunk = fileBuffer.slice(start, end);

  await Storage.uploadChunk(uploadUrl, chunk, start, end - 1);
}

// Complete upload
await Storage.completeResumableUpload(uploadUrl);
```

### Signed URLs

```typescript
// Generate signed URL for upload
const uploadUrl = await Storage.signedUploadUrl('uploads/', {
  expiresIn: 3600, // 1 hour
  contentType: 'image/jpeg',
  contentLength: 5 * 1024 * 1024, // 5MB
  metadata: { uploadedBy: 'user-123' },
});

// Generate signed URL for download
const downloadUrl = await Storage.signedUrl('private/document.pdf', {
  expiresIn: 1800, // 30 minutes
  responseDisposition: 'attachment; filename="document.pdf"',
});

// Generate signed URL with conditions
const conditionalUrl = await Storage.signedUrl('files/data.csv', {
  expiresIn: 3600,
  conditions: {
    headers: { 'Content-Type': 'text/csv' },
    contentLengthRange: { min: 0, max: 1024 * 1024 }, // Max 1MB
  },
});
```

### Object Composition

```typescript
// Compose multiple objects into one
const sourceFiles = ['uploads/part1.pdf', 'uploads/part2.pdf', 'uploads/part3.pdf'];

await Storage.compose('uploads/complete.pdf', sourceFiles);
```

### Batch Operations

```typescript
import { GCSBatch } from '@zintrust/storage-gcs';

const batch = new GCSBatch();

// Add operations to batch
batch.delete('files/old-file1.pdf');
batch.delete('files/old-file2.pdf');
batch.copy('files/current.pdf', 'archive/current-backup.pdf');

// Execute batch
const results = await batch.execute();
```

## Security

### Encryption

```typescript
// Customer-supplied encryption keys
await Storage.upload('encrypted/file.pdf', buffer, {
  encryptionKey: 'my-base64-encoded-encryption-key',
});

// Customer-managed encryption keys (CMEK)
await Storage.upload('cmek/file.pdf', buffer, {
  kmsKeyName: 'projects/my-project/locations/us-central1/keyRings/my-keyring/cryptoKeys/my-key',
});
```

### IAM Integration

```typescript
// Use IAM conditions for signed URLs
const conditionalUrl = await Storage.signedUrl('sensitive/data.csv', {
  expiresIn: 3600,
  iamConditions: [
    'request.time < timestamp("2024-01-01T00:00:00Z")',
    'resource.name.startsWith("projects/_/buckets/secure-bucket/objects/")',
  ],
});
```

### Public Access Prevention

```typescript
// Enable public access prevention at bucket level
await manager.setPublicAccessPrevention('my-bucket', 'enforced');

// Check if object is publicly accessible
const isPublic = await Storage.isPublic('public/image.jpg');
```

## Performance Optimization

### Parallel Uploads

```typescript
import { parallelUpload } from '@zintrust/storage-gcs';

// Upload large file in parallel
await parallelUpload('large-file.zip', fileBuffer, {
  chunkSize: 16 * 1024 * 1024, // 16MB chunks
  concurrency: 4,
});
```

### Transfer Acceleration

```typescript
export const storage: StorageConfig = {
  driver: 'gcs',
  gcs: {
    // ... other config
    transferAcceleration: true,
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
  metadata: { cacheExpiry: '2024-12-31' },
});
```

## Monitoring and Logging

### Cloud Monitoring Integration

```typescript
import { GCSMonitoring } from '@zintrust/storage-gcs';

const monitoring = new GCSMonitoring();

// Get bucket metrics
const metrics = await monitoring.getBucketMetrics('my-bucket');
// Returns: { storageSize: number, objectCount: number, apiCalls: number }

// Create custom metrics
await monitoring.createCustomMetric('storage/operations', {
  type: 'GAUGE',
  units: 'Count',
});
```

### Activity Logging

```typescript
// Enable bucket logging
await manager.enableLogging('my-bucket', {
  logBucket: 'my-bucket-logs',
  logObjectPrefix: 'access-logs/',
});

// Get audit logs
const auditLogs = await monitoring.getAuditLogs('my-bucket', {
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-01-31'),
});
```

## Error Handling

### Retry Configuration

```typescript
export const storage: StorageConfig = {
  driver: 'gcs',
  gcs: {
    // ... other config
    retryOptions: {
      autoRetry: true,
      maxRetries: 5,
      retryDelay: 1000,
      maxRetryDelay: 30000,
      retryableErrorCodes: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
    },
  },
};
```

### Error Types

```typescript
try {
  await Storage.upload('file.pdf', buffer);
} catch (error) {
  if (error.code === 403) {
    console.log('Permission denied - check IAM policies');
  } else if (error.code === 404) {
    console.log('Bucket not found');
  } else if (error.code === 429) {
    console.log('Rate limit exceeded - retry later');
  } else {
    console.log('GCS error:', error.message);
  }
}
```

## Testing

### Emulator Integration

```typescript
// Use GCS emulator for testing
export const storage: StorageConfig = {
  driver: 'gcs',
  gcs: {
    projectId: 'test-project',
    apiEndpoint: 'http://localhost:9092',
    // Use emulator credentials
    credentials: {
      client_email: 'test@example.com',
      private_key: 'test-key',
    },
  },
};
```

### Mock GCS

```typescript
import { GCSMock } from '@zintrust/storage-gcs';

// Use mock for testing
const mockGCS = new GCSMock();

// Mock operations
mockGCS.on('upload', (bucket, filename, data) => {
  console.log('Mock upload:', bucket, filename, data.length);
});

// Test file operations
await mockGCS.upload('test-bucket', 'test.txt', Buffer.from('test'));
const exists = await mockGCS.exists('test-bucket', 'test.txt');
expect(exists).toBe(true);
```

## Best Practices

1. **Use Appropriate Storage Class**: Choose storage class based on access patterns
2. **Implement Lifecycle Policies**: Automate data lifecycle management
3. **Enable Versioning**: Protect against accidental deletion
4. **Use Encryption**: Encrypt sensitive data at rest
5. **Monitor Usage**: Track storage usage and costs
6. **Optimize Uploads**: Use resumable uploads for large files
7. **Implement Caching**: Set appropriate cache headers
8. **Use IAM**: Implement fine-grained access control

## Limitations

- **Object Size**: Maximum 5TB per object
- **Bucket Count**: Limited by project quotas
- **API Rate Limits**: Rate limits apply to GCS API
- **Naming Restrictions**: Bucket names have specific requirements
- **Regional Limitations**: Some features are region-specific
- **Network Latency**: Network issues can affect performance

## Cost Optimization

### Storage Classes

```typescript
// Move old files to cold storage
await manager.changeStorageClass('my-bucket', 'old-data/', 'COLDLINE');

// Archive very old data
await manager.changeStorageClass('my-bucket', 'archive/', 'ARCHIVE');
```

### Lifecycle Rules

```typescript
// Optimize costs with lifecycle rules
await manager.setLifecycleRules('my-bucket', [
  // Move to coldline after 30 days
  {
    action: { type: 'SetStorageClass', storageClass: 'COLDLINE' },
    condition: { age: 30, matchesStorageClass: ['STANDARD'] },
  },
  // Move to archive after 90 days
  {
    action: { type: 'SetStorageClass', storageClass: 'ARCHIVE' },
    condition: { age: 90, matchesStorageClass: ['COLDLINE'] },
  },
  // Delete after 365 days
  {
    action: { type: 'Delete' },
    condition: { age: 365 },
  },
]);
```
