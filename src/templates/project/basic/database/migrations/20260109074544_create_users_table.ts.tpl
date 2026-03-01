/**
 * Migration: CreateUsersTable
 * Creates users table
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

    await schema.create('users', (table: Blueprint) => {
      table.id();
      table.string('name');
      table.string('email').unique();
      table.string('password');
      table.timestamps();
    });
  },

  async down(db: IDatabase): Promise<void> {
    const schema = MigrationSchema.create(db);
    await schema.dropIfExists('users');
  },
};
