/* eslint-disable no-await-in-loop */
/**
 * Data Migrator
 * Handles the actual data migration between databases
 */

import { Logger } from '@zintrust/core';
import type { MigrationConfig, MigrationProgress } from '../types';

/**
 * Database connection types
 */
export interface SourceConnection {
  driver: string;
  connectionString: string;
  connected: boolean;
}

export interface TargetConnection {
  type: 'd1' | 'd1-remote';
  database: string;
  connected: boolean;
}

export interface TableInfo {
  name: string;
  rowCount?: number;
}

/**
 * DataMigrator - Sealed namespace for data migration
 * Provides chunked data migration with progress tracking
 */
export const DataMigrator = Object.freeze({
  /**
   * Migrate data from source to target
   */
  async migrateData(config: MigrationConfig): Promise<MigrationProgress> {
    Logger.info('Starting data migration...');

    try {
      // Initialize progress tracking
      const progress: MigrationProgress = {
        migrationId: config.migrationId || 'unknown',
        startTime: new Date(),
        currentTable: '',
        table: '',
        totalTables: 0,
        processedRows: 0,
        totalRows: 0,
        percentage: 0,
        errors: {},
        status: 'processing',
      };

      // Connect to source database
      Logger.info('Connecting to source database...');
      const sourceConnection = await DataMigrator.connectToSource(config);

      // Connect to target D1 database
      Logger.info('Connecting to target D1 database...');
      const targetConnection = await DataMigrator.connectToTarget(config);

      // Get schema information
      const schema = await DataMigrator.getSchemaInfo(sourceConnection);
      progress.totalTables = schema.tables.length;

      // Calculate total rows for progress tracking
      progress.totalRows = schema.tables.reduce((total, table) => total + (table.rowCount || 0), 0);

      Logger.info(`Migrating ${progress.totalTables} tables with ${progress.totalRows} total rows`);

      // Migrate each table in parallel for better performance
      Logger.info('Starting parallel table migration...');
      const tablePromises = schema.tables.map(async (table) => {
        Logger.info(`Migrating table: ${table.name}`);

        const tableResult = await DataMigrator.migrateTable(
          table,
          sourceConnection,
          targetConnection,
          config
        );

        return {
          table,
          result: tableResult,
        };
      });

      // Wait for all table migrations to complete
      const tableResults = await Promise.all(tablePromises);

      // Update progress with results
      for (const { table, result } of tableResults) {
        progress.processedRows += result.rowsMigrated;

        // Add any errors to progress
        if (result.errors.length > 0) {
          progress.errors[table.name] = result.errors.join('; ');
        }

        Logger.info(`Table ${table.name} completed: ${result.rowsMigrated} rows migrated`);
      }

      // Update final percentage
      progress.percentage =
        progress.totalRows > 0
          ? Math.round((progress.processedRows / progress.totalRows) * 100)
          : 0;

      progress.status = 'completed';
      Logger.info(
        `Migration completed: ${progress.processedRows}/${progress.totalRows} rows migrated`
      );

      return progress;
    } catch (error) {
      Logger.error('Data migration failed:', error);
      throw error;
    }
  },

  /**
   * Connect to source database
   */
  async connectToSource(config: MigrationConfig): Promise<SourceConnection> {
    // Mock implementation - in real scenario, use appropriate database drivers
    Logger.info(`Connecting to ${config.sourceDriver} database: ${config.sourceConnection}`);

    // Simulate connection
    const connection = {
      driver: config.sourceDriver,
      connectionString: config.sourceConnection,
      connected: true,
    };

    Logger.info('✓ Source database connected');
    return connection;
  },

  /**
   * Connect to target D1 database
   */
  async connectToTarget(config: MigrationConfig): Promise<TargetConnection> {
    // Mock implementation - in real scenario, use D1 API or SQLite
    Logger.info(`Connecting to D1 database: ${config.targetDatabase}`);

    // Simulate connection
    const connection = {
      type: config.targetType,
      database: config.targetDatabase,
      connected: true,
    };

    Logger.info('✓ Target D1 database connected');
    return connection;
  },

  /**
   * Get schema information from source database
   */
  async getSchemaInfo(_connection: SourceConnection): Promise<{ tables: TableInfo[] }> {
    // Mock implementation - use SchemaAnalyzer in real scenario
    Logger.info('Retrieving schema information...');

    const tables = [
      { name: 'users', rowCount: 1000 },
      { name: 'posts', rowCount: 5000 },
      { name: 'comments', rowCount: 15000 },
    ];

    Logger.info(`Found ${tables.length} tables`);
    return { tables };
  },

  /**
   * Migrate single table
   */
  async migrateTable(
    table: TableInfo,
    sourceConnection: SourceConnection,
    targetConnection: TargetConnection,
    config: MigrationConfig
  ): Promise<{ rowsMigrated: number; errors: string[] }> {
    Logger.info(`Migrating table: ${table.name}`);

    const errors: string[] = [];
    let rowsMigrated = 0;

    try {
      const totalRows = table.rowCount || 0;
      const batchSize = config.batchSize || 1000;

      Logger.info(`Processing ${totalRows} rows in batches of ${batchSize}`);

      // Process data in chunks sequentially for data integrity
      for (let offset = 0; offset < totalRows; offset += batchSize) {
        try {
          const chunk = await DataMigrator.readDataChunk(
            sourceConnection,
            table.name,
            offset,
            batchSize
          );

          if (chunk.length === 0) break;

          // Transform data for D1 compatibility
          const transformedChunk = await DataMigrator.transformData(chunk, table.name);

          // Insert data into target
          await DataMigrator.insertData(targetConnection, table.name, transformedChunk);

          rowsMigrated += chunk.length;

          // Log progress for large tables
          if (totalRows > 10000 && rowsMigrated % (batchSize * 10) === 0) {
            const percentage = Math.round((rowsMigrated / totalRows) * 100);
            Logger.info(`Table ${table.name}: ${rowsMigrated}/${totalRows} (${percentage}%)`);
          }
        } catch (error) {
          const errorMsg = `Chunk processing failed at offset ${offset}: ${error}`;
          Logger.error(errorMsg);
          errors.push(errorMsg);
          // Continue with next chunk instead of failing completely
          continue;
        }
      }

      Logger.info(`Table ${table.name} completed: ${rowsMigrated} rows migrated`);
    } catch (error) {
      const errorMsg = `Failed to migrate table ${table.name}: ${error}`;
      Logger.error(errorMsg);
      errors.push(errorMsg);
    }

    return { rowsMigrated, errors };
  },

  /**
   * Read data chunk from source database
   */
  async readDataChunk(
    _sourceConnection: SourceConnection,
    tableName: string,
    offset: number,
    batchSize: number
  ): Promise<Record<string, unknown>[]> {
    // Mock implementation - in real scenario, execute SELECT query with LIMIT/OFFSET
    Logger.debug(`Reading chunk from ${tableName}: offset ${offset}, size ${batchSize}`);

    // Simulate data chunk
    const chunk = Array.from({ length: Math.min(batchSize, 100) }, (_, index) => ({
      id: offset + index + 1,
      name: `Record ${offset + index + 1}`,
      created_at: new Date().toISOString(),
    }));

    return chunk;
  },

  /**
   * Transform data for D1 compatibility
   */
  async transformData(
    chunk: Record<string, unknown>[],
    tableName: string
  ): Promise<Record<string, unknown>[]> {
    Logger.debug(`Transforming ${chunk.length} rows for table ${tableName}`);

    // Mock implementation - apply D1-specific transformations
    return chunk.map((row) => {
      const transformed = { ...row };

      // Example transformations:
      // - Convert datetime formats
      // - Handle unsupported data types
      // - Apply data sanitization

      if (transformed['created_at']) {
        const createdAt = transformed['created_at'];
        if (
          typeof createdAt === 'string' ||
          typeof createdAt === 'number' ||
          createdAt instanceof Date
        ) {
          transformed['created_at'] = new Date(createdAt).toISOString();
        }
      }

      return transformed;
    });
  },

  /**
   * Insert data into target database
   */
  async insertData(
    _targetConnection: TargetConnection,
    tableName: string,
    data: Record<string, unknown>[]
  ): Promise<void> {
    Logger.debug(`Inserting ${data.length} rows into ${tableName}`);

    // Mock implementation - in real scenario, execute INSERT statements
    // For D1, this would use the D1 API or direct SQLite operations

    // Simulate insertion delay with proper async approach
    await new Promise((resolve) => {
      const delay = 10;
      const startTime = Date.now();

      const checkDelay = (): void => {
        if (Date.now() - startTime >= delay) {
          resolve(void 0);
        } else {
          // Use setImmediate for non-blocking delay
          setImmediate(checkDelay);
        }
      };

      checkDelay();
    });
  },

  /**
   * Create migration progress tracker
   */
  createProgress(migrationId: string): MigrationProgress {
    return {
      migrationId,
      startTime: new Date(),
      currentTable: '',
      table: '',
      totalTables: 0,
      totalRows: 0,
      processedRows: 0,
      percentage: 0,
      errors: {},
      status: 'pending',
    };
  },

  /**
   * Update migration progress
   */
  updateProgress(
    progress: MigrationProgress,
    updates: Partial<MigrationProgress>
  ): MigrationProgress {
    return { ...progress, ...updates };
  },
});
