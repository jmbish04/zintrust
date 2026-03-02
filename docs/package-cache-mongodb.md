---
title: MongoDB Cache Adapter
description: MongoDB adapter for ZinTrust's cache system
---

# MongoDB Cache Adapter

The `@zintrust/cache-mongodb` package provides a MongoDB driver for ZinTrust's cache system, allowing you to use MongoDB as a cache backend.

## Installation

```bash
zin add  @zintrust/cache-mongodb
```

## Configuration

Add the MongoDB cache configuration to your environment:

```typescript
// config/cache.ts
import { CacheConfig } from '@zintrust/core';

export const cache: CacheConfig = {
  driver: 'mongodb',
  mongodb: {
    uri: process.env.MONGODB_URI,
    database: process.env.MONGODB_DATABASE || 'zintrust_cache',
    collection: process.env.MONGODB_COLLECTION || 'cache',
    ttl: 3600, // Default TTL in seconds
  },
};
```

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=zintrust_cache
MONGODB_COLLECTION=cache
```

## Usage

```typescript
import { Cache } from '@zintrust/core';

// Set a value
await Cache.set('user:123', { name: 'John', age: 30 }, 3600);

// Get a value
const user = await Cache.get('user:123');

// Delete a value
await Cache.delete('user:123');

// Clear all cache
await Cache.clear();
```

## Features

- **TTL Support**: Automatic expiration of cache entries
- **Connection Pooling**: Efficient MongoDB connection management
- **Error Handling**: Robust error handling and reconnection logic
- **Performance**: Optimized for high-throughput caching scenarios

## Options

| Option        | Type   | Default          | Description                  |
| ------------- | ------ | ---------------- | ---------------------------- |
| `uri`         | string | required         | MongoDB connection URI       |
| `database`    | string | 'zintrust_cache' | Database name                |
| `collection`  | string | 'cache'          | Collection name              |
| `ttl`         | number | 3600             | Default TTL in seconds       |
| `maxPoolSize` | number | 10               | Maximum connection pool size |
| `minPoolSize` | number | 1                | Minimum connection pool size |

## Error Handling

The MongoDB cache adapter includes comprehensive error handling for:

- Connection failures
- Network timeouts
- Authentication errors
- Database errors

Errors are logged and appropriate fallback behavior is implemented to ensure application stability.
