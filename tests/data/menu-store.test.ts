import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMenuStore, type MenuStore } from '../../data/menu-store';
import { initializeSchema } from '../../data/schema';
import { openTestDatabase } from './sqlite-fixture';

describe('local menu storage', () => {
  let database: ReturnType<typeof openTestDatabase>;
  let store: MenuStore;

  beforeEach(async () => {
    database = openTestDatabase();
    await initializeSchema(database);
    store = createMenuStore(database);
  });

  afterEach(() => database.close());

  async function addJuice() {
    const category = await store.saveCategory({ name: 'Juices' });
    return store.saveMenuItem({
      categoryId: category.id,
      name: 'Fresh juice',
      variants: [
        { name: 'Small', pricePaisa: 15000 },
        { name: 'Large', pricePaisa: 25000 },
      ],
    });
  }

  it('starts empty without inventing menu items or prices', async () => {
    expect(await store.listCategories()).toEqual([]);
    expect(await store.listMenuItems()).toEqual([]);
  });

  it('saves an item with Small and Large prices in exact paisa', async () => {
    const item = await addJuice();
    expect(await store.listMenuItems()).toEqual([item]);
  });

  it('edits category, item, sizes, price, and availability without duplicate items', async () => {
    const item = await addJuice();
    await store.saveCategory({ id: item.categoryId, name: 'Fresh drinks' });
    const edited = await store.saveMenuItem({
      ...item, name: 'Orange juice', active: false,
      variants: [{ ...item.variants[0], pricePaisa: 17550 }],
    });
    expect(await store.listMenuItems()).toEqual([edited]);
    expect(await store.listCategories()).toEqual([{ id: item.categoryId, name: 'Fresh drinks' }]);
  });

  it('uses bound parameters for names containing quotes and SQL', async () => {
    const name = "Chef's special'); DROP TABLE categories; --";
    await store.saveCategory({ name });
    expect((await store.listCategories())[0].name).toBe(name);
  });

  it('rejects duplicate category and item names without changing the existing menu', async () => {
    const item = await addJuice();
    await expect(store.saveCategory({ name: 'juices' })).rejects.toThrow();
    await expect(store.saveMenuItem({ ...item, id: undefined })).rejects.toThrow();
    expect(await store.listMenuItems()).toEqual([item]);
  });

  it('rejects an item belonging to a missing category', async () => {
    await expect(store.saveMenuItem({
      categoryId: 'missing', name: 'Fries',
      variants: [{ name: 'Regular', pricePaisa: 20000 }],
    })).rejects.toThrow();
    expect(await store.listMenuItems()).toEqual([]);
  });

  it('rolls back the complete edit when inserting a size fails', async () => {
    const item = await addJuice();
    const other = await store.saveMenuItem({
      categoryId: item.categoryId, name: 'Other juice',
      variants: [{ name: 'Regular', pricePaisa: 10000 }],
    });
    const before = await store.listMenuItems();
    await expect(store.saveMenuItem({
      ...item, name: 'Changed name',
      variants: [{ ...other.variants[0], pricePaisa: 999 }],
    })).rejects.toThrow();
    expect(await store.listMenuItems()).toEqual(before);
  });

  it('reopens the schema without resetting saved data', async () => {
    const item = await addJuice();
    await initializeSchema(database);
    expect(await store.listMenuItems()).toEqual([item]);
  });

  it('refuses an unknown schema version without resetting data', async () => {
    const item = await addJuice();
    await database.write([{ statement: 'INSERT INTO schema_migrations(version) VALUES (99)', values: [] }]);
    await expect(initializeSchema(database)).rejects.toThrow('not supported');
    expect(await store.listMenuItems()).toEqual([item]);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid paisa price %s', async pricePaisa => {
      const item = await addJuice();
      await expect(store.saveMenuItem({
        ...item, variants: [{ name: 'Regular', pricePaisa }],
      })).rejects.toThrow('whole paisa');
      expect(await store.listMenuItems()).toEqual([item]);
    },
  );

  it('rejects empty names, missing sizes, and duplicate size names', async () => {
    await expect(store.saveCategory({ name: ' ' })).rejects.toThrow();
    const item = await addJuice();
    await expect(store.saveMenuItem({ ...item, name: ' ' })).rejects.toThrow();
    await expect(store.saveMenuItem({ ...item, variants: [] })).rejects.toThrow();
    await expect(store.saveMenuItem({ ...item, variants: [
      { name: 'Small', pricePaisa: 100 }, { name: ' small ', pricePaisa: 200 },
    ] })).rejects.toThrow('unique');
    expect(await store.listMenuItems()).toEqual([item]);
  });

  it('keeps saved menu data after closing and reopening a database file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'master-foods-test-'));
    const path = join(directory, 'menu.sqlite');
    let file = openTestDatabase(path);
    try {
      await initializeSchema(file);
      const original = await createMenuStore(file).saveCategory({ name: 'Burgers' });
      file.close();
      file = openTestDatabase(path);
      await initializeSchema(file);
      expect(await createMenuStore(file).listCategories()).toEqual([original]);
    } finally {
      file.close();
      rmSync(directory, { recursive: true });
    }
  });
});
