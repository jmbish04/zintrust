/**
 * Schema Validator
 * Validates schemas and provides detailed error reporting
 */

import type { ColumnSchema, TableSchema } from '../types';

/**
 * SchemaValidator - Sealed namespace for schema validation
 * Provides comprehensive schema validation utilities
 */
export const SchemaValidator = Object.freeze({
  /**
   * Validate complete schema
   */
  validateSchema(tables: TableSchema[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    tables.forEach((table, index) => {
      const tableValidation = SchemaValidator.validateTable(table);
      errors.push(
        ...tableValidation.errors.map((error) => `Table ${index + 1} (${table.name}): ${error}`)
      );
      warnings.push(
        ...tableValidation.warnings.map(
          (warning) => `Table ${index + 1} (${table.name}): ${warning}`
        )
      );
    });

    // Check for duplicate table names
    const tableNames = tables.map((t) => t.name.toLowerCase());
    const duplicates = tableNames.filter((name, index) => tableNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate table names: ${[...new Set(duplicates)].join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate single table
   */
  validateTable(table: TableSchema): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate table name
    if (!table.name || table.name.trim() === '') {
      errors.push('Table name is required');
    } else if (!/^\w*$/.test(table.name)) {
      errors.push(
        `Invalid table name: ${table.name}. Must start with letter or underscore and contain only letters, numbers, and underscores`
      );
    } else if (table.name.length > 64) {
      errors.push(`Table name too long: ${table.name}. Maximum 64 characters`);
    }

    // Validate columns
    if (!table.columns || table.columns.length === 0) {
      errors.push('Table must have at least one column');
    } else {
      const columnNames = table.columns.map((c) => c.name.toLowerCase());
      const duplicateColumns = columnNames.filter(
        (name, index) => columnNames.indexOf(name) !== index
      );
      if (duplicateColumns.length > 0) {
        errors.push(`Duplicate column names: ${[...new Set(duplicateColumns)].join(', ')}`);
      }

      table.columns.forEach((column, colIndex) => {
        const columnValidation = SchemaValidator.validateColumn(column);
        errors.push(
          ...columnValidation.errors.map(
            (error) => `Column ${colIndex + 1} (${column.name}): ${error}`
          )
        );
        warnings.push(
          ...columnValidation.warnings.map(
            (warning) => `Column ${colIndex + 1} (${column.name}): ${warning}`
          )
        );
      });
    }

    // Validate primary key
    if (table.primaryKey) {
      const hasPrimaryKeyColumn = table.columns.some((column) => column.name === table.primaryKey);
      if (!hasPrimaryKeyColumn) {
        errors.push(`Primary key column '${table.primaryKey}' not found in table definition`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate single column
   */
  validateColumn(column: ColumnSchema): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate column name
    if (!column.name || column.name.trim() === '') {
      errors.push('Column name is required');
    } else if (!/^\w*$/.test(column.name)) {
      errors.push(
        `Invalid column name: ${column.name}. Must start with letter or underscore and contain only letters, numbers, and underscores`
      );
    } else if (column.name.length > 64) {
      errors.push(`Column name too long: ${column.name}. Maximum 64 characters`);
    }

    // Validate column type
    if (!column.type || column.type.trim() === '') {
      errors.push('Column type is required');
    } else {
      const validTypes = [
        'integer',
        'text',
        'real',
        'numeric',
        'blob',
        'varchar',
        'char',
        'date',
        'datetime',
        'boolean',
      ];

      const normalizedType = column.type.toLowerCase();
      if (!validTypes.includes(normalizedType)) {
        warnings.push(
          `Potentially unsupported column type: ${column.type}. SQLite/D1 may not fully support this type`
        );
      }
    }

    // Validate nullable
    if (column.nullable !== undefined && typeof column.nullable !== 'boolean') {
      errors.push('Nullable property must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Check for schema compatibility issues
   */
  checkCompatibility(issues: { sourceDriver: string; tables: TableSchema[] }): {
    blocking: string[];
    warnings: string[];
  } {
    const blocking: string[] = [];
    const warnings: string[] = [];

    const { sourceDriver, tables } = issues;

    tables.forEach((table) => {
      table.columns.forEach((column) => {
        const type = column.type.toLowerCase();

        const compatibilityWarning = SchemaValidator.checkColumnTypeCompatibility(
          type,
          sourceDriver,
          table.name,
          column.name
        );
        if (compatibilityWarning) {
          warnings.push(compatibilityWarning);
        }
      });
    });

    return { blocking, warnings };
  },

  /**
   * Check column type compatibility for specific driver
   */
  checkColumnTypeCompatibility(
    type: string,
    sourceDriver: string,
    tableName: string,
    columnName: string
  ): string | null {
    switch (sourceDriver) {
      case 'mysql':
        return SchemaValidator.checkMySQLCompatibility(type, tableName, columnName);
      case 'postgresql':
        return SchemaValidator.checkPostgreSQLCompatibility(type, tableName, columnName);
      case 'sqlserver':
        return SchemaValidator.checkSQLServerCompatibility(type, tableName, columnName);
      default:
        return SchemaValidator.checkGeneralCompatibility(type, tableName, columnName);
    }
  },

  /**
   * Check MySQL-specific compatibility
   */
  checkMySQLCompatibility(type: string, tableName: string, columnName: string): string | null {
    if (type.includes('enum') || type.includes('set')) {
      return `MySQL ENUM/SET types will be converted to TEXT in table: ${tableName}.${columnName}`;
    }
    if (type.includes('json')) {
      return `MySQL JSON types will be converted to TEXT in table: ${tableName}.${columnName}`;
    }
    return null;
  },

  /**
   * Check PostgreSQL-specific compatibility
   */
  checkPostgreSQLCompatibility(type: string, tableName: string, columnName: string): string | null {
    if (type.includes('uuid')) {
      return `PostgreSQL UUID will be converted to TEXT in table: ${tableName}.${columnName}`;
    }
    if (type.includes('jsonb')) {
      return `PostgreSQL JSONB will be converted to TEXT in table: ${tableName}.${columnName}`;
    }
    return null;
  },

  /**
   * Check SQL Server-specific compatibility
   */
  checkSQLServerCompatibility(type: string, tableName: string, columnName: string): string | null {
    if (type.includes('uniqueidentifier')) {
      return `SQL Server UNIQUEIDENTIFIER will be converted to TEXT in table: ${tableName}.${columnName}`;
    }
    if (type.includes('varbinary') || type.includes('image')) {
      return `SQL Server binary types will be converted to BLOB in table: ${tableName}.${columnName}`;
    }
    return null;
  },

  /**
   * Check general compatibility issues
   */
  checkGeneralCompatibility(type: string, tableName: string, columnName: string): string | null {
    if (type.includes('decimal') || type.includes('numeric')) {
      return `Decimal/numeric types may lose precision when converted to REAL in table: ${tableName}.${columnName}`;
    }
    return null;
  },

  /**
   * Generate validation report
   */
  generateReport(validation: { valid: boolean; errors: string[]; warnings: string[] }): string {
    let report = '# Schema Validation Report\n\n';
    report += `## Status: ${validation.valid ? 'VALID' : 'INVALID'}\n\n`;

    if (validation.errors.length > 0) {
      report += `## Errors (${validation.errors.length})\n\n`;
      validation.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
      report += '\n';
    }

    if (validation.warnings.length > 0) {
      report += `## Warnings (${validation.warnings.length})\n\n`;
      validation.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`;
      });
    }

    return report;
  },
});
