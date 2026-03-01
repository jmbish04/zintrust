---
title: Cloudflare D1 Database Adapter
description: Cloudflare D1 adapter for ZinTrust's database system
---

# Cloudflare D1 Database Adapter

The `@zintrust/db-d1` package provides a Cloudflare D1 driver for ZinTrust's database system, enabling serverless SQLite database operations on Cloudflare's edge platform.

## Installation

```bash
zin add  @zintrust/db-d1
```

## Configuration

Add the D1 database configuration to your environment:

```typescript
// config/database.ts
import { DatabaseConfig } from '@zintrust/core';

export const database: DatabaseConfig = {
  driver: 'd1',
  d1: {
    databaseBinding: 'DB', // Cloudflare D1 binding name
    maxConnections: 10,
  },
};
```

## Environment Variables

```bash
D1_DATABASE_BINDING=DB
```

## Usage

```typescript
import { Model } from '@zintrust/core';

// Define a model
const User = Model.define({
  tableName: 'users',
  schema: {
    id: { type: 'number', primary: true, autoIncrement: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: true, unique: true },
    created_at: { type: 'datetime', default: () => new Date() },
  },
});

// Create operations
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
});

// Query operations
const users = await User.where('name', 'John').get();
const user = await User.find(1);

// Update operations
await User.where('id', 1).update({ name: 'Jane Doe' });

// Delete operations
await User.where('id', 1).delete();
```

## Features

- **Edge Computing**: Leverages Cloudflare's global network
- **Serverless**: No server management required
- **SQLite Compatible**: Full SQLite feature support
- **Connection Pooling**: Efficient connection management
- **Type Safety**: Full TypeScript support
- **Migrations**: Database migration support

## Options

| Option            | Type   | Default  | Description                |
| ----------------- | ------ | -------- | -------------------------- |
| `databaseBinding` | string | required | Cloudflare D1 binding name |
| `maxConnections`  | number | 10       | Maximum connections        |
| `timeout`         | number | 5000     | Query timeout in ms        |

## Cloudflare Workers Integration

### wrangler.toml

```toml
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"
```

### Worker Script

```typescript
export default {
  async fetch(request, env, ctx) {
    // Use D1 database through ZinTrust
    const users = await User.all();
    return Response.json(users);
  },
};
```

## Migrations

Create migration files in your project:

```typescript
// migrations/001_create_users_table.ts
export const up = async (db) => {
  await db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const down = async (db) => {
  await db.exec('DROP TABLE users');
};
```

## Performance Considerations

- **Cold Starts**: D1 may have cold start latency
- **Query Optimization**: Use indexes for better performance
- **Batch Operations**: Use transactions for multiple operations
- **Connection Reuse**: Reuse connections when possible

## Error Handling

The D1 adapter handles:

- Connection timeouts
- Query syntax errors
- Constraint violations
- Database size limits
- Network issues

## Limitations

- **Query Size**: Limited to 1MB per query
- **Database Size**: 500MB limit per database
- **Concurrent Connections**: Limited concurrent connections
- **Regions**: May have regional availability constraints
