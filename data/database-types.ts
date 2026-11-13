export type SqlValue = string | number | null;

export interface SqlStatement {
  statement: string;
  values: SqlValue[];
}

// The menu uses this small interface on both Android and in database tests.
export interface Database {
  query<Row>(statement: string, values?: SqlValue[]): Promise<Row[]>;
  write(statements: SqlStatement[]): Promise<void>;
}
