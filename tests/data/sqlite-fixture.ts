import { DatabaseSync } from 'node:sqlite';
import type { Database, SqlStatement, SqlValue } from '../../data/database-types';

// Tests execute the production schema and statements against real SQLite.
export function openTestDatabase(path = ':memory:'): Database & { close(): void } {
  const connection = new DatabaseSync(path);
  connection.exec('PRAGMA foreign_keys = ON');
  return {
    async query<Row>(statement: string, values: SqlValue[] = []): Promise<Row[]> {
      return connection.prepare(statement).all(...values) as Row[];
    },
    async write(statements: SqlStatement[]): Promise<void> {
      connection.exec('BEGIN TRANSACTION');
      try {
        for (const { statement, values } of statements) connection.prepare(statement).run(...values);
        connection.exec('COMMIT');
      } catch (error) {
        connection.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => connection.close(),
  };
}
