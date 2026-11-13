import initSqlJs from 'sql.js';
import { createStore, get, set } from 'idb-keyval';
import type { Database, SqlStatement, SqlValue } from './database-types';
import { serializeDatabase } from './serialize-database';

// Browser development uses real SQLite with a durable IndexedDB snapshot.
// Android uses its native SQLite file instead (see native-sqlite.ts).
export async function openWebDatabase(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: file => `${import.meta.env.BASE_URL}assets/${file}` });
  const storage = createStore('master-foods-pos', 'databases');
  const saved = await get<Uint8Array>('menu', storage);
  let connection = new SQL.Database(saved);

  return serializeDatabase({
    async query<Row>(statement: string, values: SqlValue[] = []) {
      const query = connection.prepare(statement);
      try {
        query.bind(values);
        const rows: Row[] = [];
        while (query.step()) rows.push(query.getAsObject() as Row);
        return rows;
      } finally {
        query.free();
      }
    },
    async write(statements: SqlStatement[]) {
      // Edit a copy: a failed SQL statement or IndexedDB save leaves the current
      // database unchanged. This is for the single-tab development preview.
      const edited = new SQL.Database(connection.export());
      try {
        edited.run('PRAGMA foreign_keys = ON');
        edited.run('BEGIN TRANSACTION');
        for (const { statement, values } of statements) edited.run(statement, values);
        edited.run('COMMIT');
        await set('menu', edited.export(), storage);
      } catch (error) {
        edited.close();
        throw error;
      }
      connection.close();
      connection = edited;
    },
  });
}
