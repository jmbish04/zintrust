/**
 * Migration: AddKindToJwtRevocationsTable
 * Adds a 'kind' column so the same table can distinguish revoked tokens vs active sessions.
 */

import { Schema as MigrationSchema, type Blueprint } from '@/migrations/schema';
import type { IDatabase } from '@orm/Database';

export interface Migration {
  up(db: IDatabase): Promise<void>;
  down(db: IDatabase): Promise<void>;
}

export const migration: Migration = {
  async up(db: IDatabase): Promise<void> {
    const schema = MigrationSchema.create(db);

    const hasKind = await schema.hasColumn('zintrust_jwt_revocations', 'kind');
    if (!hasKind) {
      await schema.table('zintrust_jwt_revocations', (table: Blueprint) => {
        table.string('kind', 16).notNullable().default('revoked');
        table.index(['kind']);
      });
    }
  },

  async down(_db: IDatabase): Promise<void> {
    // Note: dropping columns/FKs varies by driver; SQLite/D1 requires a table rebuild.
  },
};
