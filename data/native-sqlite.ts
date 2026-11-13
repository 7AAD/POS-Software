import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { Database, SqlStatement, SqlValue } from './database-types';
import { serializeDatabase } from './serialize-database';

const databaseName = 'master_foods';
const sqlite = new SQLiteConnection(CapacitorSQLite);

export async function openNativeDatabase(): Promise<Database> {
  await sqlite.checkConnectionsConsistency();
  const exists = await sqlite.isConnection(databaseName, false);
  const connection = exists.result
    ? await sqlite.retrieveConnection(databaseName, false)
    : await sqlite.createConnection(databaseName, false, 'no-encryption', 1, false);
  if (!(await connection.isDBOpen()).result) await connection.open();
  await connection.execute('PRAGMA foreign_keys = ON;', false);

  return serializeDatabase({
    async query<Row>(statement: string, values: SqlValue[] = []) {
      const result = await connection.query(statement, values);
      return (result.values ?? []) as Row[];
    },
    async write(statements: SqlStatement[]) {
      // Android commits the complete edit to its SQLite file or rolls it back.
      await connection.executeSet(statements, true);
    },
  });
}
