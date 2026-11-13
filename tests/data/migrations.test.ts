import { expect, it } from 'vitest';
import { initializeSchema } from '../../data/schema';
import { createMenuStore } from '../../data/menu-store';
import { openTestDatabase } from './sqlite-fixture';

it('upgrades a version-one database without losing owner items or prices', async () => {
  const database = openTestDatabase();
  try {
    const legacy = [
      'CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY)',
      'INSERT INTO schema_migrations(version) VALUES (1)',
      'CREATE TABLE categories(id TEXT PRIMARY KEY, name TEXT NOT NULL)',
      'CREATE TABLE menu_items(id TEXT PRIMARY KEY, category_id TEXT, name TEXT, active INTEGER)',
      'CREATE TABLE menu_variants(id TEXT PRIMARY KEY, item_id TEXT, name TEXT, price_paisa INTEGER)',
      "INSERT INTO categories VALUES ('owner-category', 'Owner category')",
      "INSERT INTO menu_items VALUES ('owner-item', 'owner-category', 'Owner item', 0)",
      "INSERT INTO menu_variants VALUES ('owner-size', 'owner-item', 'Regular', 12345)",
    ];
    await database.write(legacy.map(statement => ({ statement, values: [] })));
    await initializeSchema(database);
    await initializeSchema(database);
    expect(await createMenuStore(database).listMenuItems()).toEqual([{
      id: 'owner-item', categoryId: 'owner-category', name: 'Owner item', active: false,
      description: '', premiumExtraRequired: false, premiumExtraPaisa: null,
      variants: [{ id: 'owner-size', name: 'Regular', pricePaisa: 12345 }],
    }]);
    expect(await database.query('SELECT version FROM schema_migrations ORDER BY version')).toEqual([{ version: 1 }, { version: 2 }, { version: 3 }]);
  } finally { database.close(); }
});
