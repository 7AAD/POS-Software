import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openTestDatabase } from './sqlite-fixture';
import { initializeSchema } from '../../data/schema';
import { importInitialMenu } from '../../data/import-initial-menu';
import { createMenuStore } from '../../data/menu-store';

describe('reviewed menu import', () => {
  let database: ReturnType<typeof openTestDatabase>;
  beforeEach(async () => { database = openTestDatabase(); await initializeSchema(database); });
  afterEach(() => database.close());

  it('imports the complete catalog with separate Tikka and Fajita prices', async () => {
    await importInitialMenu(database);
    const store = createMenuStore(database);
    expect(await store.listCategories()).toHaveLength(10);
    const items = await store.listMenuItems();
    expect(items).toHaveLength(52);
    expect(items.flatMap(item => item.variants)).toHaveLength(90);
    for (const name of ['Tikka', 'Fajita']) {
      expect(items.find(item => item.name === name)?.variants.map(size => size.pricePaisa))
        .toEqual([40000, 75000, 100000, 160000]);
    }
    expect(items.find(item => item.name === 'Cheese Crust')?.variants.some(size => size.name === 'Small')).toBe(false);
  });

  it('keeps the deal wording and does not invent premium charges', async () => {
    await importInitialMenu(database);
    const items = await createMenuStore(database).listMenuItems();
    const deal = items.find(item => item.name === 'Deal 6')!;
    expect(deal.description).toBe('2 Zinger Burgers + 2 Zinger Shawarmas + Fries + 1 L drink');
    expect(deal.variants[0].pricePaisa).toBe(140000);
    for (let number = 7; number <= 12; number++) {
      expect(items.find(item => item.name === `Deal ${number}`)).toMatchObject({
        premiumExtraRequired: true, premiumExtraPaisa: null,
      });
    }
  });

  it('never resets edited names, prices, categories, or availability on reopening', async () => {
    await importInitialMenu(database);
    const store = createMenuStore(database);
    const original = (await store.listMenuItems()).find(item => item.name === 'Shami Burger')!;
    const edited = await store.saveMenuItem({
      ...original, name: 'Owner special', active: false,
      variants: [{ ...original.variants[0], pricePaisa: 15550 }],
    });
    await store.saveCategory({ id: edited.categoryId, name: 'Owner burgers' });
    await initializeSchema(database);
    await importInitialMenu(database);
    expect((await store.listMenuItems()).find(item => item.id === edited.id)).toEqual(edited);
    expect((await store.listMenuItems()).some(item => item.name === 'Shami Burger')).toBe(false);
    expect((await store.listCategories()).find(category => category.id === edited.categoryId)?.name).toBe('Owner burgers');
    expect(await store.listMenuItems()).toHaveLength(52);
  });

  it('preserves matching owner items and custom prices when importing for the first time', async () => {
    const store = createMenuStore(database);
    const category = await store.saveCategory({ name: 'burgers' });
    const existing = await store.saveMenuItem({
      categoryId: category.id, name: 'Shami Burger', variants: [{ name: 'Regular', pricePaisa: 99900 }],
    });
    await importInitialMenu(database);
    expect((await store.listMenuItems()).find(item => item.name === 'Shami Burger')).toEqual(existing);
    expect(await store.listCategories()).toContainEqual(category);
    expect(await store.listCategories()).toHaveLength(10);
  });

  it('rolls back a failed import and can retry without duplicate or partial data', async () => {
    await database.write([{
      statement: `CREATE TRIGGER fail_import BEFORE INSERT ON menu_items WHEN NEW.name = 'Fajita'
        BEGIN SELECT RAISE(ABORT, 'simulated import failure'); END`, values: [],
    }]);
    await expect(importInitialMenu(database)).rejects.toThrow();
    expect(await createMenuStore(database).listCategories()).toEqual([]);
    expect(await createMenuStore(database).listMenuItems()).toEqual([]);
    expect(await database.query('SELECT * FROM menu_imports')).toEqual([]);
    await database.write([{ statement: 'DROP TRIGGER fail_import', values: [] }]);
    await importInitialMenu(database);
    expect(await createMenuStore(database).listMenuItems()).toHaveLength(52);
  });

  it('stores edited deal contents and premium fees and rejects inconsistent fees', async () => {
    await importInitialMenu(database);
    const store = createMenuStore(database);
    const deal = (await store.listMenuItems()).find(item => item.name === 'Deal 7')!;
    const edited = await store.saveMenuItem({ ...deal, description: 'Owner-edited contents', premiumExtraPaisa: 7500 });
    expect((await store.listMenuItems()).find(item => item.id === edited.id)).toEqual(edited);
    await expect(store.saveMenuItem({ ...edited, premiumExtraRequired: false })).rejects.toThrow();
    await expect(store.saveMenuItem({ ...edited, premiumExtraPaisa: -1 })).rejects.toThrow();
    await expect(store.saveMenuItem({ ...edited, premiumExtraPaisa: 0 })).rejects.toThrow();
    expect((await store.listMenuItems()).find(item => item.id === edited.id)).toEqual(edited);
  });
});
