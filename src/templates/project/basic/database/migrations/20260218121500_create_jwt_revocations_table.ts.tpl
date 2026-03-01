/**
 * Migration: CreateJwtRevocationsTable
 * Creates a storage table for JWT token revocation (token invalidation).
 */
import type { Blueprint, IDatabase } from '@zintrust/core';
import { MigrationSchema } from '@zintrust/core';

export interface Migration {
  up(db: IDatabase): Promise<void>;
  down(db: IDatabase): Promise<void>;
}

export const migration: Migration = {
  async up(db: IDatabase): Promise<void> {
    const schema = MigrationSchema.create(db);

    await schema.create('zintrust_jwt_revocations', (table: Blueprint) => {
      table.id();
      table.string('user_id', 191).nullable();
      table.string('jti', 128).unique();
      table.string('sub', 191).nullable();
      table.string('kind', 16).notNullable().default('revoked');
      table.bigInteger('expires_at_ms');
      table.timestamp('revoked_at').notNullable().default('CURRENT_TIMESTAMP');

      table.index(['user_id']);
      table.index(['kind']);
      table.index(['expires_at_ms']);
    });
  },

  async down(db: IDatabase): Promise<void> {
    const schema = MigrationSchema.create(db);
    await schema.dropIfExists('zintrust_jwt_revocations');
  },
};
