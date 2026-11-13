import { expect, it } from 'vitest';
import { openTestDatabase } from './sqlite-fixture';
import { initializeSchema } from '../../data/schema';
import { importInitialMenu } from '../../data/import-initial-menu';
import { createMenuStore } from '../../data/menu-store';

it('keeps printed category, item, size, and numeric deal order after edits', async () => {
  const database = openTestDatabase();
  try {
    await initializeSchema(database);
    await importInitialMenu(database);
    const store = createMenuStore(database);
    const categories = await store.listCategories();
    expect(categories.map(category => category.name)).toEqual([
      'Burgers', 'Shawarmas', 'Sandwiches', 'Fries', 'Loaded Fries',
      'Snacks', 'Dip Sauce', 'Pizzas', 'Juice', 'Deals',
    ]);
    const items = await store.listMenuItems();
    expect(items.slice(0, 3).map(item => item.name)).toEqual(['Shami Burger', 'Double Anda Burger', 'Chicken Shami Burger']);
    expect(items.filter(item => item.name.startsWith('Deal ')).map(item => item.name))
      .toEqual(Array.from({ length: 12 }, (_, index) => `Deal ${index + 1}`));
    await store.saveCategory({ ...categories[0], name: 'ZZ Burgers' });
    const tikka = items.find(item => item.name === 'Tikka')!;
    await store.saveMenuItem({ ...tikka, variants: tikka.variants.map(size => ({
      ...size, pricePaisa: size.name === 'Small' ? 999999 : size.pricePaisa,
    })) });
    expect((await store.listMenuItems()).find(item => item.id === tikka.id)?.variants.map(size => size.name))
      .toEqual(['Small', 'Medium', 'Large', 'Family']);
    expect((await store.listCategories())[0].name).toBe('ZZ Burgers');
    await store.saveMenuItem({ categoryId: categories[0].id, name: 'AAA New Burger', variants: [{ name: 'Regular', pricePaisa: 10000 }] });
    expect((await store.listMenuItems()).filter(item => item.categoryId === categories[0].id).at(-1)?.name).toBe('AAA New Burger');
  } finally { database.close(); }
});

it('upgrades version-two menus to persistent ordering without resetting owner changes', async () => {
  const database = openTestDatabase();
  try {
    await initializeSchema(database);
    await importInitialMenu(database);
    const store = createMenuStore(database);
    const original = (await store.listMenuItems())[0];
    await store.saveMenuItem({ ...original, name: 'ZZ Owner Burger', variants: [{ ...original.variants[0], pricePaisa: 99900 }] });
    const before = await store.listMenuItems();
    // Remove later metadata to reproduce a real v2 database.
    await database.write([
      ...['categories', 'menu_items', 'menu_variants'].map(table => ({ statement: `ALTER TABLE ${table} DROP COLUMN sort_order`, values: [] })),
      { statement: 'ALTER TABLE menu_items DROP COLUMN order_options_json', values: [] },
      { statement: 'DROP TABLE sales', values: [] },
      { statement: 'DROP TABLE open_orders', values: [] },
      { statement: 'DELETE FROM schema_migrations WHERE version >= 3', values: [] },
    ]);
    await initializeSchema(database);
    await importInitialMenu(database);
    expect(await store.listMenuItems()).toEqual(before);
    expect((await store.listMenuItems())[0].name).toBe('ZZ Owner Burger');
    expect((await store.listMenuItems())[0].variants[0].pricePaisa).toBe(99900);
  } finally { database.close(); }
});
