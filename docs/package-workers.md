---
title: Workers
description: Cloudflare Workers adapter for ZinTrust
---

# Workers

The `@zintrust/workers` package provides Cloudflare Workers integration for ZinTrust, enabling serverless deployment and edge computing capabilities.

## Installation

```bash
npm install @zintrust/workers
```

## Configuration

Add the Workers configuration to your environment:

```typescript
// config/workers.ts
import { WorkersConfig } from '@zintrust/core';

export const workers: WorkersConfig = {
  enabled: true,
  runtime: 'cloudflare',
  deployment: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
  },
  routes: {
    enabled: true,
    patterns: [
      'api.example.com/*',
      'app.example.com/api/*',
    ],
  },
  environment: {
    variables: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
    },
    secrets: {
      DATABASE_URL: 'database-url-secret',
      API_KEY: 'api-key-secret',
    },
  },
  limits: {
    cpuMs: 50000,
    memory: 128,
    maxRequests: 1000,
  },
};
```

## Environment Variables

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
WORKERS_ENABLED=true
```

## Usage

```typescript
import { Workers } from '@zintrust/core';

// Define worker
const apiWorker = Workers.define({
  name: 'api-worker',
  routes: ['api.example.com/*'],
  handler: async (request, env, ctx) => {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/users') {
      const users = await env.DB.prepare('SELECT * FROM users').all();
      return Response.json(users);
    }
    
    return new Response('Not Found', { status: 404 });
  },
});

// Deploy worker
await Workers.deploy(apiWorker, {
  accountId: 'your-account-id',
  zoneId: 'your-zone-id',
});

// Get worker metrics
const metrics = await Workers.getMetrics('api-worker');
```

## Features

- **Serverless Runtime**: Cloudflare Workers runtime support
- **Edge Deployment**: Global edge network deployment
- **Route Management**: Automatic route configuration
- **Environment Variables**: Secure environment and secret management
- **Performance Monitoring**: Built-in performance metrics
- **Hot Reloading**: Development hot reloading
- **Multi-Environment**: Support for multiple deployment environments
- **Durable Objects**: Durable Objects integration

## Worker Definition

### Basic Worker

```typescript
import { Workers } from '@zintrust/workers';

const basicWorker = Workers.define({
  name: 'basic-worker',
  handler: async (request, env, ctx) => {
    // Handle different HTTP methods
    if (request.method === 'GET') {
      return Response.json({ message: 'Hello from ZinTrust Worker!' });
    }
    
    if (request.method === 'POST') {
      const body = await request.json();
      return Response.json({ received: body });
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  },
});
```

### Advanced Worker

```typescript
const advancedWorker = Workers.define({
  name: 'advanced-worker',
  routes: ['api.example.com/*'],
  middleware: [
    corsMiddleware,
    authMiddleware,
    rateLimitMiddleware,
  ],
  handler: async (request, env, ctx) => {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Route handling
    if (path.startsWith('/api/users')) {
      return handleUserRequest(request, env, ctx);
    }
    
    if (path.startsWith('/api/posts')) {
      return handlePostRequest(request, env, ctx);
    }
    
    return new Response('Not Found', { status: 404 });
  },
  environment: {
    variables: {
      API_VERSION: 'v1',
      MAX_REQUESTS: 1000,
    },
    secrets: {
      DATABASE_URL: 'database-secret',
      JWT_SECRET: 'jwt-secret',
    },
  },
  limits: {
    cpuMs: 50000,
    memory: 128,
  },
});
```

### Durable Objects Worker

```typescript
const durableObjectWorker = Workers.define({
  name: 'durable-worker',
  durableObjects: {
    ChatRoom: {
      class: ChatRoomDO,
      scriptName: 'chat-room-do',
    },
  },
  handler: async (request, env, ctx) => {
    const url = new URL(request.url);
    const id = env.ChatRoom.idFromName(url.pathname.split('/')[2]);
    const stub = env.ChatRoom.get(id);
    
    return stub.fetch(request);
  },
});

class ChatRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.messages = [];
  }
  
  async fetch(request) {
    const url = new URL(request.url);
    
    if (request.method === 'POST' && url.pathname === '/message') {
      const message = await request.json();
      this.messages.push({
        ...message,
        timestamp: Date.now(),
      });
      
      // Persist to Durable Object storage
      await this.state.storage.put('messages', this.messages);
      
      return Response.json({ success: true });
    }
    
    if (request.method === 'GET' && url.pathname === '/messages') {
      const messages = await this.state.storage.get('messages') || [];
      return Response.json(messages);
    }
    
    return new Response('Not Found', { status: 404 });
  }
}
```

## Middleware

### CORS Middleware

```typescript
import { cors } from '@zintrust/workers';

const corsMiddleware = cors({
  origins: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

### Authentication Middleware

```typescript
import { auth } from '@zintrust/workers';

const authMiddleware = auth({
  type: 'jwt',
  secret: env.JWT_SECRET,
  algorithms: ['HS256'],
  optional: false,
  onError: (error) => {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  },
});
```

### Rate Limiting Middleware

```typescript
import { rateLimit } from '@zintrust/workers';

const rateLimitMiddleware = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (request) => {
    return request.headers.get('CF-Connecting-IP') || 'unknown';
  },
  onLimit: () => {
    return Response.json({ error: 'Too Many Requests' }, { status: 429 });
  },
});
```

## Database Integration

### D1 Database

```typescript
const d1Worker = Workers.define({
  name: 'd1-worker',
  bindings: {
    DB: {
      type: 'd1',
      databaseName: 'my-database',
    },
  },
  handler: async (request, env, ctx) => {
    if (request.method === 'GET' && request.url.includes('/users')) {
      const users = await env.DB.prepare('SELECT * FROM users').all();
      return Response.json(users);
    }
    
    if (request.method === 'POST' && request.url.includes('/users')) {
      const { name, email } = await request.json();
      const result = await env.DB.prepare(
        'INSERT INTO users (name, email) VALUES (?, ?)'
      ).bind(name, email).run();
      
      return Response.json({ id: result.meta.last_row_id });
    }
    
    return new Response('Not Found', { status: 404 });
  },
});
```

### KV Storage

```typescript
const kvWorker = Workers.define({
  name: 'kv-worker',
  bindings: {
    CACHE: {
      type: 'kv',
      namespaceId: 'cache-namespace',
    },
  },
  handler: async (request, env, ctx) => {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    if (request.method === 'GET' && key) {
      const value = await env.CACHE.get(key);
      return value ? Response.json({ value }) : new Response('Not Found', { status: 404 });
    }
    
    if (request.method === 'PUT' && key) {
      const { value, ttl } = await request.json();
      await env.CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
      return Response.json({ success: true });
    }
    
    return new Response('Bad Request', { status: 400 });
  },
});
```

## Deployment

### Local Development

```typescript
import { WorkersDev } from '@zintrust/workers';

const devServer = new WorkersDev({
  port: 8787,
  hotReload: true,
  env: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
  },
});

devServer.addWorker(basicWorker);
devServer.addWorker(advancedWorker);

await devServer.start();
console.log('Workers development server running on http://localhost:8787');
```

### Production Deployment

```typescript
import { WorkersDeploy } from '@zintrust/workers';

const deployer = new WorkersDeploy({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

// Deploy single worker
await deployer.deploy(basicWorker, {
  zoneId: 'your-zone-id',
  routes: ['api.example.com/*'],
});

// Deploy multiple workers
await deployer.deployBatch([
  { worker: basicWorker, zoneId: 'zone-1' },
  { worker: advancedWorker, zoneId: 'zone-2' },
]);
```

### Environment Management

```typescript
// Development environment
const devConfig = {
  environment: 'development',
  variables: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    API_URL: 'http://localhost:3000',
  },
  secrets: {
    DATABASE_URL: 'dev-db-url',
  },
};

// Production environment
const prodConfig = {
  environment: 'production',
  variables: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
    API_URL: 'https://api.example.com',
  },
  secrets: {
    DATABASE_URL: 'prod-db-url',
  },
};

// Deploy with environment
await deployer.deploy(basicWorker, {
  zoneId: 'your-zone-id',
  environment: 'production',
  config: prodConfig,
});
```

## Performance Monitoring

### Metrics Collection

```typescript
import { WorkersMetrics } from '@zintrust/workers';

const metrics = new WorkersMetrics({
  enabled: true,
  interval: 60000, // Collect metrics every minute
  destinations: ['prometheus', 'cloudwatch'],
});

// Get worker metrics
const workerMetrics = await metrics.getWorkerMetrics('api-worker');
// Returns: {
//   requests: 1000,
//   errors: 5,
//   averageLatency: 150,
//   p95Latency: 300,
//   cpuUsage: 45,
//   memoryUsage: 67,
// }

// Get route-specific metrics
const routeMetrics = await metrics.getRouteMetrics('api-worker', '/api/users');
```

### Performance Optimization

```typescript
const optimizedWorker = Workers.define({
  name: 'optimized-worker',
  optimization: {
    caching: {
      enabled: true,
      ttl: 300, // 5 minutes
      strategies: ['memory', 'edge'],
    },
    compression: {
      enabled: true,
      algorithms: ['gzip', 'br'],
    },
    minification: {
      enabled: true,
      level: 'advanced',
    },
  },
  handler: async (request, env, ctx) => {
    // Optimized handler logic
    const cacheKey = `response:${request.url}`;
    const cached = await env.CACHE.get(cacheKey);
    
    if (cached) {
      return new Response(cached, {
        headers: { 'X-Cache': 'HIT' },
      });
    }
    
    const response = await handleRequest(request, env, ctx);
    
    // Cache response
    ctx.waitUntil(env.CACHE.put(cacheKey, response.clone().body, {
      expirationTtl: 300,
    }));
    
    return response;
  },
});
```

## Security

### Security Headers

```typescript
import { securityHeaders } from '@zintrust/workers';

const securityMiddleware = securityHeaders({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", 'https://cdn.example.com'],
      'style-src': ["'self'", 'https://fonts.googleapis.com'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubdomains: true,
    preload: true,
  },
  frameOptions: 'DENY',
  contentTypeOptions: 'nosniff',
});
```

### Input Validation

```typescript
import { validate } from '@zintrust/workers';

const validationMiddleware = validate({
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 0, maximum: 150 },
    },
    required: ['name', 'email'],
  },
  onError: (errors) => {
    return Response.json({ errors }, { status: 400 });
  },
});
```

## Testing

### Unit Testing

```typescript
import { WorkersTest } from '@zintrust/workers';

const testEnv = new WorkersTest({
  bindings: {
    DB: {
      type: 'd1',
      databaseName: 'test-db',
      localMode: true,
    },
    CACHE: {
      type: 'kv',
      localMode: true,
    },
  },
});

// Test worker
test('GET /api/users returns users', async () => {
  const request = new Request('https://api.example.com/api/users');
  const response = await basicWorker.handler(request, testEnv.env, testEnv.ctx);
  
  expect(response.status).toBe(200);
  const users = await response.json();
  expect(Array.isArray(users)).toBe(true);
});
```

### Integration Testing

```typescript
import { WorkersIntegrationTest } from '@zintrust/workers';

const integrationTest = new WorkersIntegrationTest({
  accountId: 'test-account',
  zoneId: 'test-zone',
  workers: [basicWorker, advancedWorker],
});

// Test API endpoints
test('API endpoints work correctly', async () => {
  const response = await integrationTest.request('GET', '/api/users');
  expect(response.status).toBe(200);
  
  const createResponse = await integrationTest.request('POST', '/api/users', {
    name: 'Test User',
    email: 'test@example.com',
  });
  expect(createResponse.status).toBe(201);
});
```

## Best Practices

1. **Keep Workers Small**: Minimize worker size for faster cold starts
2. **Use Caching**: Implement caching for frequently accessed data
3. **Handle Errors**: Implement comprehensive error handling
4. **Monitor Performance**: Track worker performance metrics
5. **Security**: Implement proper security headers and validation
6. **Environment Management**: Use different configs for different environments
7. **Testing**: Write comprehensive tests for workers
8. **Documentation**: Document worker APIs and usage

## Limitations

- **CPU Time**: Limited CPU time per request (50ms for free tier)
- **Memory**: Limited memory (128MB for free tier)
- **Request Size**: Maximum request size limitations
- **Execution Time**: Maximum execution time limits
- **Storage**: Limited storage capabilities
- **External APIs**: Rate limits on external API calls

## Troubleshooting

### Common Issues

1. **Cold Starts**: Optimize worker code for faster cold starts
2. **Memory Issues**: Reduce memory usage and optimize data structures
3. **Timeout Errors**: Increase timeout limits or optimize code
4. **Deployment Issues**: Check configuration and credentials
5. **Route Issues**: Verify route patterns and zone configuration

### Debug Mode

```typescript
export const workers: WorkersConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  logging: {
    level: 'debug',
    logRequests: true,
    logResponses: false,
    logErrors: true,
    logPerformance: true,
  },
};
```
