/**
 * D1 Migrator Package
 * Migrate any database to Cloudflare D1 with resumable operations
 */

// CLI Commands
import { MigrateToD1Command } from './cli/MigrateToD1Command';

// Utilities
import { CheckpointManager } from './utils/CheckpointManager';
import { DataValidator } from './utils/DataValidator';

// CLI Components
import { DataMigrator } from './cli/DataMigrator';
import { ProgressTracker } from './cli/ProgressTracker';
import { SchemaAnalyzer } from './cli/SchemaAnalyzer';

// Schema Components
import { SchemaBuilder } from './schema/SchemaBuilder';
import { TypeConverter } from './schema/TypeConverter';
import { SchemaValidator } from './schema/Validator';

/**
 * D1 Migrator - Sealed namespace for database migration operations
 * Provides comprehensive migration from MySQL, PostgreSQL, SQLite, SQL Server to D1/D1Remote
 */
export const D1Migrator = Object.freeze({
  // CLI Commands
  MigrateToD1Command,

  // Core Components
  CheckpointManager,
  DataValidator,
  SchemaAnalyzer,
  DataMigrator,
  ProgressTracker,

  // Schema Components
  TypeConverter,
  SchemaBuilder,
  SchemaValidator,
});

// Export types for external use
export type {
  CheckpointData,
  ColumnSchema,
  DataValidationResult,
  IndexSchema,
  MigrationConfig,
  MigrationProgress,
  MigrationState,
  TableSchema,
} from './types';

export default D1Migrator;
