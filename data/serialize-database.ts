import type { Database, SqlStatement, SqlValue } from './database-types';

// Each read waits for earlier writes and their durable storage to finish.
export function serializeDatabase(database: Database): Database {
  let pending: Promise<unknown> = Promise.resolve();
  function enqueue<Result>(operation: () => Promise<Result>): Promise<Result> {
    const result = pending.then(operation);
    pending = result.catch(() => undefined);
    return result;
  }

  return {
    query<Row>(statement: string, values: SqlValue[] = []) {
      return enqueue(() => database.query<Row>(statement, values));
    },
    write(statements: SqlStatement[]) {
      return enqueue(() => database.write(statements));
    },
  };
}
