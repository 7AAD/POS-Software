import type { Database } from './database-types';

export const schemaVersion = 1;

const initialSchema = [
  `CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(name)) > 0)
  )`,
  `CREATE TABLE menu_items (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(name)) > 0),
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
    UNIQUE(category_id, name)
  )`,
  `CREATE TABLE menu_variants (
    id TEXT PRIMARY KEY NOT NULL,
    item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(name)) > 0),
    price_paisa INTEGER NOT NULL CHECK(
      typeof(price_paisa) = 'integer' AND price_paisa BETWEEN 0 AND 9007199254740991
    ),
    UNIQUE(item_id, name)
  )`,
  'CREATE INDEX menu_items_category ON menu_items(category_id)',
  'CREATE INDEX menu_variants_item ON menu_variants(item_id)',
  'INSERT INTO schema_migrations(version) VALUES (1)',
];

export async function initializeSchema(database: Database): Promise<void> {
  const tables = await database.query<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
  );
  if (tables.length === 0) {
    await database.write(initialSchema.map(statement => ({ statement, values: [] })));
    return;
  }

  const [current] = await database.query<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_migrations',
  );
  if (current?.version !== schemaVersion) {
    throw new Error('This database version is not supported. Update the app before opening it.');
  }
}
