---
title: Storage Adapter
description: Core storage adapter for ZinTrust's storage system
---

# Storage Adapter

The `@zintrust/storage` package provides the core storage interface and utilities for ZinTrust's storage system, offering a unified API for various storage backends.

## Installation

```bash
zin add  @zintrust/storage
```

## Configuration

Add the storage configuration to your environment:

```typescript
// config/storage.ts
import { StorageConfig } from '@zintrust/core';

export const storage: StorageConfig = {
  driver: 'local', // or 's3', 'gcs', 'r2'
  local: {
    root: process.env.STORAGE_ROOT || './storage',
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:3000/storage',
  },
};
```

## Environment Variables

```bash
STORAGE_ROOT=./storage
STORAGE_BASE_URL=http://localhost:3000/storage
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

- **Unified Interface**: Consistent API across all storage backends
- **Multiple Drivers**: Support for local, S3, GCS, and R2 storage
- **File Operations**: Upload, download, delete, and list files
- **Metadata Support**: Store and retrieve file metadata
- **URL Generation**: Generate public and signed URLs
- **Streaming**: Stream files for large uploads/downloads
- **Error Handling**: Comprehensive error handling
- **Type Safety**: Full TypeScript support

## Core API

### File Operations

```typescript
// Upload file
const result = await Storage.upload(path, content, options);
// Returns: { key: string, url: string, size: number, etag: string }

// Download file
const buffer = await Storage.download(path);
// Returns: Buffer

// Get file info
const info = await Storage.info(path);
// Returns: { key: string, size: number, contentType: string, lastModified: Date, metadata: object }

// Check existence
const exists = await Storage.exists(path);
// Returns: boolean

// Delete file
await Storage.delete(path);

// Copy file
await Storage.copy(sourcePath, destinationPath);

// Move file
await Storage.move(sourcePath, destinationPath);
```

### URL Operations

```typescript
// Get public URL
const url = Storage.url('documents/file.pdf');
// Returns: string

// Get signed URL (temporary access)
const signedUrl = await Storage.signedUrl('documents/file.pdf', {
  expiresIn: 3600, // 1 hour
});
// Returns: string

// Get thumbnail URL
const thumbnailUrl = Storage.thumbnailUrl('images/photo.jpg', {
  width: 200,
  height: 200,
});
// Returns: string
```

### Directory Operations

```typescript
// List files
const files = await Storage.list('documents/', {
  recursive: true,
  limit: 100,
  prefix: 'report-',
});
// Returns: { files: Array<{ key: string, size: number, lastModified: Date }>, cursor?: string }

// Create directory
await Storage.createDirectory('documents/2024/');

// Delete directory
await Storage.deleteDirectory('documents/2024/', { recursive: true });
```

## Advanced Configuration

### Multiple Storage Disks

```typescript
export const storage: StorageConfig = {
  default: 'local',
  disks: {
    local: {
      driver: 'local',
      root: './storage',
      baseUrl: 'http://localhost:3000/storage',
    },
    s3: {
      driver: 's3',
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET,
    },
    gcs: {
      driver: 'gcs',
      keyFilename: process.env.GCS_KEY_FILE,
      bucket: process.env.GCS_BUCKET,
    },
  },
};
```

### Use Specific Disk

```typescript
// Use specific storage disk
const s3Storage = Storage.disk('s3');
await s3Storage.upload('file.pdf', buffer);

// Or use disk for specific operations
await Storage.disk('s3').upload('file.pdf', buffer);
```

## File Upload Options

### Content Type Detection

```typescript
import { mime } from '@zintrust/storage';

// Auto-detect content type
const contentType = mime.getType('file.pdf'); // 'application/pdf'

// Upload with auto-detection
await Storage.upload('file.pdf', buffer, {
  contentType: mime.getType('file.pdf'),
});
```

### Metadata

```typescript
await Storage.upload('file.pdf', buffer, {
  metadata: {
    originalName: 'document.pdf',
    uploadedBy: 'user-123',
    category: 'reports',
    tags: JSON.stringify(['important', '2024']),
  },
});
```

### Visibility Control

```typescript
// Public file
await Storage.upload('public/file.pdf', buffer, {
  visibility: 'public',
});

// Private file
await Storage.upload('private/file.pdf', buffer, {
  visibility: 'private',
});
```

## Streaming Operations

### Stream Upload

```typescript
import { createReadStream } from 'fs';

const stream = createReadStream('./large-file.zip');
await Storage.uploadStream('archives/large-file.zip', stream, {
  contentType: 'application/zip',
});
```

### Stream Download

```typescript
const stream = await Storage.downloadStream('archives/large-file.zip');
stream.pipe(fs.createWriteStream('./downloaded-file.zip'));
```

### Multipart Upload

```typescript
// For large files (>100MB)
const uploadId = await Storage.createMultipartUpload('large-file.zip');

const parts = [];
for (let i = 0; i < totalParts; i++) {
  const part = await Storage.uploadPart(uploadId, i + 1, partBuffer);
  parts.push(part);
}

await Storage.completeMultipartUpload(uploadId, parts);
```

## File Processing

### Image Processing

```typescript
import { ImageProcessor } from '@zintrust/storage';

// Resize image
const resizedBuffer = await ImageProcessor.resize(imageBuffer, {
  width: 800,
  height: 600,
  fit: 'cover',
});

// Generate thumbnails
const thumbnails = await ImageProcessor.thumbnails(imageBuffer, [
  { width: 150, height: 150 },
  { width: 300, height: 300 },
  { width: 600, height: 400 },
]);

// Optimize image
const optimizedBuffer = await ImageProcessor.optimize(imageBuffer, {
  quality: 80,
  format: 'webp',
});
```

### File Validation

```typescript
import { FileValidator } from '@zintrust/storage';

// Validate file type
const isValidImage = FileValidator.validateType(buffer, ['image/jpeg', 'image/png']);

// Validate file size
const isValidSize = FileValidator.validateSize(buffer, { max: 10 * 1024 * 1024 }); // 10MB

// Validate image dimensions
const dimensions = await FileValidator.getImageDimensions(buffer);
if (dimensions.width > 4000 || dimensions.height > 4000) {
  throw new Error('Image too large');
}
```

## Security

### File Access Control

```typescript
// Signed URL with specific permissions
const signedUrl = await Storage.signedUrl('private/file.pdf', {
  expiresIn: 3600,
  permissions: 'read',
});

// Upload URL with content restrictions
const uploadUrl = await Storage.signedUploadUrl('uploads/', {
  expiresIn: 1800,
  allowedTypes: ['image/jpeg', 'image/png'],
  maxSize: 5 * 1024 * 1024, // 5MB
});
```

### Virus Scanning

```typescript
import { VirusScanner } from '@zintrust/storage';

// Scan uploaded file
const scanResult = await VirusScanner.scan(buffer);
if (scanResult.infected) {
  await Storage.delete('uploads/infected-file.pdf');
  throw new Error('File contains virus');
}
```

### Content Security

```typescript
import { ContentSecurity } from '@zintrust/storage';

// Sanitize filename
const safeFilename = ContentSecurity.sanitizeFilename(userInput);

// Validate file content
const isSafe = await ContentSecurity.validateContent(buffer, {
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
});
```

## Performance Optimization

### Caching

```typescript
export const storage: StorageConfig = {
  driver: 's3',
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 100 * 1024 * 1024, // 100MB
  },
};
```

### Compression

```typescript
// Compress uploaded files
await Storage.upload('file.txt', buffer, {
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 6,
  },
});
```

### CDN Integration

```typescript
export const storage: StorageConfig = {
  driver: 's3',
  cdn: {
    enabled: true,
    baseUrl: 'https://cdn.example.com',
    cacheControl: 'public, max-age=31536000',
  },
};
```

## Error Handling

### Custom Error Handler

```typescript
Storage.setErrorHandler(async (error, context) => {
  console.log('Storage error:', error.message);
  console.log('Context:', context);

  // Log to monitoring system
  await logError(error, context);

  // Send alert for critical errors
  if (error.severity === 'critical') {
    await sendAlert(error);
  }
});
```

### Error Types

```typescript
try {
  await Storage.upload('file.pdf', buffer);
} catch (error) {
  if (error.code === 'FILE_TOO_LARGE') {
    console.log('File size exceeds limit');
  } else if (error.code === 'INVALID_FILE_TYPE') {
    console.log('File type not allowed');
  } else if (error.code === 'STORAGE_FULL') {
    console.log('Storage quota exceeded');
  } else {
    console.log('Storage error:', error.message);
  }
}
```

## Testing

### Mock Storage

```typescript
import { StorageMock } from '@zintrust/storage';

// Use mock for testing
const mockStorage = new StorageMock();

// Mock file operations
mockStorage.on('upload', (key, content) => {
  console.log('Mock upload:', key, content.length);
});

// Test file operations
await mockStorage.upload('test.txt', Buffer.from('test content'));
const exists = await mockStorage.exists('test.txt');
expect(exists).toBe(true);
```

### Test Utilities

```typescript
import { StorageTestUtils } from '@zintrust/storage';

// Create test files
const testFile = StorageTestUtils.createTestFile('test.pdf', 1024);

// Clean up test storage
await StorageTestUtils.cleanup('test-storage');
```

## Monitoring and Metrics

### Storage Metrics

```typescript
const metrics = await Storage.getMetrics();
// Returns:
{
  totalFiles: 1000,
  totalSize: 1024000000,
  uploadsToday: 50,
  downloadsToday: 200,
  averageUploadSize: 1024000,
  popularFiles: [
    { key: 'documents/report.pdf', downloads: 150 },
    { key: 'images/logo.png', downloads: 89 },
  ],
}
```

### Performance Metrics

```typescript
const performance = await Storage.getPerformanceMetrics();
// Returns:
{
  averageUploadTime: 2500, // ms
  averageDownloadTime: 1200, // ms,
  uploadThroughput: 10.5, // MB/s
  downloadThroughput: 25.3, // MB/s
  errorRate: 0.01, // 1%
}
```

## Best Practices

1. **Use Appropriate Storage**: Choose the right storage backend for your needs
2. **Implement Caching**: Cache frequently accessed files
3. **Use CDN**: Serve files through CDN for better performance
4. **Validate Files**: Always validate uploaded files
5. **Monitor Usage**: Monitor storage usage and performance
6. **Implement Backups**: Regular backup of important files
7. **Security**: Use signed URLs for private files
8. **Cleanup**: Regular cleanup of old/temporary files

## Limitations

- **File Size**: Some storage providers have file size limits
- **API Limits**: Rate limits may apply to storage APIs
- **Network Latency**: Network issues can affect performance
- **Concurrent Uploads**: Limits on concurrent operations
- **Metadata Limits**: Metadata size restrictions may apply
