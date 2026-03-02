---
title: Cloudflare R2 Storage Adapter
description: Cloudflare R2 adapter for ZinTrust's storage system
---

# Cloudflare R2 Storage Adapter

The `@zintrust/storage-r2` package provides a Cloudflare R2 driver for ZinTrust's storage system, enabling S3-compatible storage with Cloudflare's edge network.

## Installation

```bash
npm install @zintrust/storage-r2
```

## Configuration

Add the R2 storage configuration to your environment:

```typescript
// config/storage.ts
import { StorageConfig } from '@zintrust/core';

export const storage: StorageConfig = {
  driver: 'r2',
  r2: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucket: process.env.CLOUDFLARE_R2_BUCKET,
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || 'https://your-account-id.r2.cloudflarestorage.com',
    region: 'auto',
  },
};
```

## Environment Variables

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET=your-bucket-name
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
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

- **S3 Compatible**: Full S3 API compatibility
- **Edge Network**: Global edge network distribution
- **Zero Egress Fees**: No data transfer fees
- **High Performance**: Low latency access worldwide
- **Auto-scaling**: Automatic scaling with usage
- **Security**: Built-in security features
- **Developer Tools**: Rich developer ecosystem
- **Cost Predictable**: Simple, predictable pricing

## Advanced Configuration

### Custom Endpoint

```typescript
export const storage: StorageConfig = {
  driver: 'r2',
  r2: {
    accountId: 'your-account-id',
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
    bucket: 'your-bucket',
    endpoint: 'https://your-account-id.r2.cloudflarestorage.com',
    // For testing with MinIO or other S3-compatible services
    // endpoint: 'http://localhost:9000',
    forcePathStyle: true,
  },
};
```

### Multiple Buckets

```typescript
export const storage: StorageConfig = {
  driver: 'r2',
  r2: {
    accountId: 'your-account-id',
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
    buckets: {
      public: 'public-assets',
      private: 'private-files',
      uploads: 'user-uploads',
    },
    defaultBucket: 'public-assets',
  },
};
```

### Client Configuration

```typescript
export const storage: StorageConfig = {
  driver: 'r2',
  r2: {
    // ... other config
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
import { R2Manager } from '@zintrust/storage-r2';

const manager = new R2Manager();

// Create bucket
await manager.createBucket('my-new-bucket', {
  location: 'WEUR', // Western Europe
  locationConstraint: 'WEUR',
});

// List buckets
const buckets = await manager.listBuckets();
// Returns: Array<{ name: string, creationDate: Date }>
```

### Configure Bucket

```typescript
// Enable public access
await manager.setPublicAccess('my-bucket', true);

// Set CORS configuration
await manager.setCORS('my-bucket', [
  {
    allowedOrigins: ['https://example.com'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['*'],
    maxAgeSeconds: 3600,
  },
]);

// Set bucket policies
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
// Upload with custom headers
await Storage.upload('documents/report.pdf', buffer, {
  contentType: 'application/pdf',
  cacheControl: 'public, max-age=31536000',
  contentEncoding: 'gzip',
  metadata: {
    originalName: 'annual-report.pdf',
    uploadedBy: 'user-123',
    category: 'reports',
  },
});

// Multipart upload for large files
const uploadId = await Storage.createMultipartUpload('large-file.zip');

const parts = [];
const chunkSize = 8 * 1024 * 1024; // 8MB chunks
for (let i = 0; i < fileBuffer.length; i += chunkSize) {
  const part = await Storage.uploadPart(uploadId, i + 1, 
    fileBuffer.slice(i, i + chunkSize));
  parts.push(part);
}

await Storage.completeMultipartUpload(uploadId, parts);
```

### Download Options

```typescript
// Download with range
const partialBuffer = await Storage.download('large-file.zip', {
  range: { start: 0, end: 1024 * 1024 }, // First 1MB
});

// Download with conditional requests
const buffer = await Storage.download('file.pdf', {
  ifModifiedSince: new Date('2024-01-01'),
  ifNoneMatch: 'etag-value',
});
```

### File Management

```typescript
// Copy file
await Storage.copy('source/file.pdf', 'backup/file.pdf');

// Move file
await Storage.move('temp/file.pdf', 'final/file.pdf');

// Get file metadata
const metadata = await Storage.getMetadata('documents/report.pdf');
// Returns: { size: number, lastModified: Date, contentType: string, etag: string, metadata: object }

// Update metadata
await Storage.updateMetadata('documents/report.pdf', {
  category: 'important',
  reviewed: 'true',
});
```

## Advanced Features

### Signed URLs

```typescript
// Generate signed URL for upload
const uploadUrl = await Storage.signedUploadUrl('uploads/', {
  expiresIn: 3600, // 1 hour
  key: 'user-uploads/file.pdf',
  contentType: 'application/pdf',
  contentLength: 5 * 1024 * 1024, // 5MB
  metadata: { uploadedBy: 'user-123' },
});

// Generate signed URL for download
const downloadUrl = await Storage.signedUrl('private/document.pdf', {
  expiresIn: 1800, // 30 minutes
  responseDisposition: 'attachment; filename="document.pdf"',
  responseContentType: 'application/pdf',
});

// Generate signed URL with conditions
const conditionalUrl = await Storage.signedUrl('uploads/', {
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
import { R2Batch } from '@zintrust/storage-r2';

const batch = new R2Batch();

// Add operations to batch
batch.delete('files/old-file1.pdf');
batch.delete('files/old-file2.pdf');
batch.copy('files/current.pdf', 'archive/current-backup.pdf');

// Execute batch
const results = await batch.execute();
// Returns: Array<{ success: boolean, error?: string }>
```

## Performance Optimization

### Parallel Uploads

```typescript
import { parallelUpload } from '@zintrust/storage-r2';

// Upload large file in parallel
await parallelUpload('large-file.zip', fileBuffer, {
  chunkSize: 16 * 1024 * 1024, // 16MB chunks
  concurrency: 4,
});
```

### Edge Caching

```typescript
// Set cache headers for edge caching
await Storage.upload('static/style.css', cssBuffer, {
  cacheControl: 'public, max-age=31536000, immutable',
});

// Set custom cache headers
await Storage.upload('images/photo.jpg', imageBuffer, {
  cacheControl: 'public, max-age=86400',
  expires: new Date(Date.now() + 86400 * 1000).toUTCString(),
});
```

### Compression

```typescript
// Compress uploads
await Storage.upload('data.json', jsonBuffer, {
  contentEncoding: 'gzip',
  contentType: 'application/json',
  cacheControl: 'public, max-age=3600',
});
```

## Security

### Access Control

```typescript
// Set bucket policy for public access
await manager.setPolicy('public-bucket', {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: '*' },
      Action: ['s3:GetObject'],
      Resource: ['arn:aws:s3:::public-bucket/*'],
    },
  ],
});

// Set private bucket policy
await manager.setPolicy('private-bucket', {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: 'arn:aws:iam::account:user/app-user' },
      Action: ['s3:*'],
      Resource: ['arn:aws:s3:::private-bucket/*'],
    },
  ],
});
```

### CORS Configuration

```typescript
await manager.setCORS('my-bucket', [
  {
    allowedOrigins: ['https://example.com', 'https://app.example.com'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAgeSeconds: 86400,
    exposeHeaders: ['ETag', 'Content-Length'],
  },
]);
```

### Encryption

```typescript
// Server-side encryption
await Storage.upload('secure/document.pdf', buffer, {
  serverSideEncryption: 'AES256',
});

// Customer-provided encryption keys
await Storage.upload('encrypted/file.pdf', buffer, {
  sseCustomerKey: 'my-base64-encoded-encryption-key',
  sseCustomerAlgorithm: 'AES256',
});
```

## Monitoring and Metrics

### Usage Metrics

```typescript
import { R2Monitoring } from '@zintrust/storage-r2';

const monitoring = new R2Monitoring();

// Get bucket metrics
const metrics = await monitoring.getBucketMetrics('my-bucket');
// Returns: { storageSize: number, objectCount: number, classAOperations: number, classBOperations: number }

// Get account metrics
const accountMetrics = await monitoring.getAccountMetrics();
// Returns: { totalStorage: number, totalOperations: number, costEstimate: number }
```

### Analytics

```typescript
// Get popular files
const popularFiles = await monitoring.getPopularFiles('my-bucket', {
  period: '7d',
  limit: 10,
});

// Get usage by region
const regionalUsage = await monitoring.getRegionalUsage('my-bucket');
```

## Error Handling

### Retry Configuration

```typescript
export const storage: StorageConfig = {
  driver: 'r2',
  r2: {
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
        'RequestTimeout',
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
    console.log('Access denied - check credentials');
  } else if (error.code === 'NoSuchBucket') {
    console.log('Bucket does not exist');
  } else if (error.code === 'RequestTimeout') {
    console.log('Request timeout - retrying');
  } else {
    console.log('R2 error:', error.message);
  }
}
```

## Testing

### Local Testing with MinIO

```typescript
// Use MinIO for local testing
export const storage: StorageConfig = {
  driver: 'r2',
  r2: {
    accountId: 'test-account',
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    bucket: 'test-bucket',
    endpoint: 'http://localhost:9000',
    forcePathStyle: true,
    region: 'us-east-1',
  },
};
```

### Mock R2

```typescript
import { R2Mock } from '@zintrust/storage-r2';

// Use mock for testing
const mockR2 = new R2Mock();

// Mock operations
mockR2.on('upload', (bucket, key, data) => {
  console.log('Mock upload:', bucket, key, data.length);
});

// Test file operations
await mockR2.upload('test-bucket', 'test.txt', Buffer.from('test'));
const exists = await mockR2.exists('test-bucket', 'test.txt');
expect(exists).toBe(true);
```

## Integration with Cloudflare Services

### Workers Integration

```typescript
// Use R2 in Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'PUT') {
      const file = await request.arrayBuffer();
      await env.MY_BUCKET.put('file.pdf', file);
      return new Response('File uploaded');
    }
    
    if (request.method === 'GET') {
      const file = await env.MY_BUCKET.get('file.pdf');
      return new Response(file.body);
    }
  },
};
```

### Pages Integration

```typescript
// Use R2 in Cloudflare Pages
export async function onRequestPost(context) {
  const { request, env } = context;
  const formData = await request.formData();
  const file = formData.get('file');
  
  await env.MY_BUCKET.put(`uploads/${file.name}`, file);
  
  return new Response('File uploaded successfully');
}
```

## Best Practices

1. **Use Appropriate Cache Headers**: Set cache headers for static assets
2. **Implement Lifecycle Policies**: Automate data management
3. **Use Compression**: Compress text-based files
4. **Optimize Uploads**: Use multipart uploads for large files
5. **Monitor Usage**: Track storage usage and costs
6. **Implement Security**: Use proper access controls
7. **Edge Optimization**: Leverage Cloudflare's edge network
8. **Error Handling**: Implement robust error handling

## Limitations

- **Object Size**: Maximum 5GB per object (for single upload)
- **Multipart Upload**: Maximum 5TB per object
- **Bucket Count**: Limited by account limits
- **API Rate Limits**: Rate limits apply to R2 API
- **Naming Restrictions**: Bucket names must be globally unique
- **Regional Availability**: Some features may be region-specific

## Cost Optimization

### Storage Classes

```typescript
// R2 doesn't have storage classes like S3, but you can implement lifecycle policies
await manager.setLifecycleRules('my-bucket', [
  {
    action: { type: 'Delete' },
    condition: { age: 365 }, // Delete after 1 year
  },
]);
```

### Usage Monitoring

```typescript
// Monitor costs
const costAnalysis = await monitoring.getCostAnalysis('my-bucket');
// Returns: { storageCost: number, operationCost: number, totalCost: number }

// Set up alerts for high usage
await monitoring.setUsageAlert('my-bucket', {
  storageThreshold: 100 * 1024 * 1024 * 1024, // 100GB
  operationThreshold: 1000000, // 1M operations
});
