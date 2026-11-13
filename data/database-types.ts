export type SqlValue = string | number | null;

export interface SqlStatement {
  statement: string;
  values: SqlValue[];
}

// Menus and saved orders use this interface on Android and in database tests.
export interface Database {
  query<Row>(statement: string, values?: SqlValue[]): Promise<Row[]>;
  write(statements: SqlStatement[]): Promise<void>;
}
