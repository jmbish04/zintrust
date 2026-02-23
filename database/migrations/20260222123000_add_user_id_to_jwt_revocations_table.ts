/**
 * Migration: AddUserIdToJwtRevocationsTable
 * Adds a 'user_id' column so developers can attribute JWT session/revocation rows to a user.
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

    const hasUserId = await schema.hasColumn('zintrust_jwt_revocations', 'user_id');
    if (!hasUserId) {
      await schema.table('zintrust_jwt_revocations', (table: Blueprint) => {
        table.string('user_id', 191).nullable();
        table.index(['user_id']);
      });
    }
  },

  async down(_db: IDatabase): Promise<void> {
    // Note: dropping columns/FKs varies by driver; SQLite/D1 requires a table rebuild.
  },
};
