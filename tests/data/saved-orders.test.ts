import { afterEach, beforeEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openTestDatabase } from './sqlite-fixture';
import { initializeSchema } from '../../data/schema';
import { importInitialMenu } from '../../data/import-initial-menu';
import { importOrderOptions } from '../../data/import-order-options';
import { createMenuStore } from '../../data/menu-store';
import { createSavedOrderStore } from '../../data/saved-order-store';
import { createCartLine } from '../../data/order-cart';
import { emptyOrderDetails } from '../../data/order-types';
import { OrderConflictError } from '../../data/order-error';
import type { SaveOrderInput } from '../../data/saved-order-types';
import type { MenuItem } from '../../data/menu-types';
import type { Database, SqlValue } from '../../data/database-types';

let database: ReturnType<typeof openTestDatabase>;
let menu: MenuItem[];
beforeEach(async () => {
  database = openTestDatabase();
  await initializeSchema(database);
  await importInitialMenu(database);
  await importOrderOptions(database);
  menu = await createMenuStore(database).listMenuItems();
});
afterEach(() => database.close());

function draft(id = 'order-1'): SaveOrderInput {
  const burger = menu.find(item => item.name === 'Shami Burger')!;
  return { id, expectedRevision: 0, details: { ...emptyOrderDetails },
    lines: [createCartLine(burger, menu, burger.variants[0].id, 1, {}, 'No onions')] };
}

it('keeps two complete orders across a real database close/reopen and later menu changes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'master-foods-orders-'));
  const path = join(directory, 'orders.sqlite');
  let disk = openTestDatabase(path);
  try {
    await initializeSchema(disk);
    await importInitialMenu(disk);
    await importOrderOptions(disk);
    const store = createSavedOrderStore(disk);
    const pizza = { ...menu.find(item => item.name === 'Deal 8')!, premiumExtraPaisa: 7500 };
    const first = await store.save({ id: 'pizza-order', expectedRevision: 0,
      details: { type: 'delivery', table: '', customerName: 'Ali', customerPhone: '03001234567' },
      lines: [createCartLine(pizza, menu, pizza.variants[0].id, 2, {
        'pizza:0': 'menu-pizzas-tikka-small', 'pizza:1': 'menu-pizzas-supreme-small',
        'pizza:2': 'menu-pizzas-malai-boti-small',
      }, 'No onions')] });
    const second = await store.save({ ...draft('burger-order'), details: { ...emptyOrderDetails, table: '3' } });
    const burger = menu.find(item => item.name === 'Shami Burger')!;
    await createMenuStore(disk).saveMenuItem({ ...burger, name: 'Owner Burger', active: false,
      variants: [{ ...burger.variants[0], pricePaisa: 99900 }] });
    disk.close();
    disk = openTestDatabase(path);
    await initializeSchema(disk);
    const reopened = createSavedOrderStore(disk);
    expect(await reopened.get(first.id)).toEqual(first);
    expect(await reopened.get(second.id)).toEqual(second);
    expect(first.totalPaisa).toBe(270000);
    expect(second.totalPaisa).toBe(14000);
    expect(second.lines[0].itemName).toBe('Shami Burger');
    expect((await reopened.list()).map(order => order.number).sort()).toEqual([1, 2]);
  } finally { disk.close(); rmSync(directory, { recursive: true, force: true }); }
});

it('updates the same order without changing its number or creating a duplicate', async () => {
  const store = createSavedOrderStore(database);
  const original = await store.save(draft());
  const edited = await store.save({ id: original.id, expectedRevision: original.revision,
    details: { ...original.details, type: 'takeaway', customerName: 'Sara' },
    lines: [{ ...original.lines[0], quantity: 3 }] });
  expect(edited.number).toBe(original.number);
  expect(edited.createdAt).toBe(original.createdAt);
  expect(edited.revision).toBe(2);
  expect(edited.totalPaisa).toBe(42000);
  expect(edited.details.customerName).toBe('Sara');
  expect(await store.list()).toEqual([edited]);
});

it('rejects stale edits while allowing an identical retry of the last save', async () => {
  const store = createSavedOrderStore(database);
  const original = await store.save(draft());
  const update = { id: original.id, expectedRevision: 1, details: original.details,
    lines: [{ ...original.lines[0], quantity: 2 }] };
  const current = await store.save(update);
  await expect(store.save({ ...update, lines: [{ ...original.lines[0], quantity: 4 }] })).rejects.toBeInstanceOf(OrderConflictError);
  expect(await store.get(original.id)).toEqual(current);
  expect(await store.save(update)).toEqual(current);
  expect((await store.list())).toHaveLength(1);
});

it('a retry after a lost acknowledgement uses the same saved order and number', async () => {
  let failRead = true;
  const flaky: Database = { ...database, async query<Row>(statement: string, values?: SqlValue[]) {
    if (statement.includes('FROM open_orders WHERE') && failRead) { failRead = false; throw new Error('Read interrupted'); }
    return database.query<Row>(statement, values);
  } };
  const input = draft();
  await expect(createSavedOrderStore(flaky).save(input)).rejects.toThrow('Read interrupted');
  const store = createSavedOrderStore(database);
  const retried = await store.save(input);
  expect(retried.number).toBe(1);
  expect(retried.revision).toBe(1);
  expect(await store.list()).toEqual([retried]);
});

it('rolls back failed writes, keeping the saved version and leaving failed new orders absent', async () => {
  const store = createSavedOrderStore(database);
  const original = await store.save(draft());
  const failing: Database = { ...database, write(statements) {
    return database.write([...statements, { statement: 'INSERT INTO missing_table VALUES (1)', values: [] }]);
  } };
  const broken = createSavedOrderStore(failing);
  await expect(broken.save({ id: original.id, expectedRevision: 1, details: original.details,
    lines: [{ ...original.lines[0], quantity: 2 }] })).rejects.toThrow();
  await expect(broken.save(draft('never-saved'))).rejects.toThrow();
  expect(await store.list()).toEqual([original]);
  expect((await store.save(draft('next-order'))).number).toBe(2);
});

it('validates snapshots and totals before touching saved data', async () => {
  const store = createSavedOrderStore(database);
  const original = await store.save(draft());
  const valid = { id: original.id, expectedRevision: 1, details: original.details, lines: original.lines };
  const invalid: SaveOrderInput[] = [
    { ...valid, lines: [] }, { ...valid, id: '' }, { ...valid, expectedRevision: -1 },
    { ...valid, lines: [original.lines[0], original.lines[0]] },
    { ...valid, details: { ...original.details, customerPhone: '1'.repeat(31) } },
    { ...valid, lines: [{ ...original.lines[0], quantity: 100 }] },
    { ...valid, lines: [{ ...original.lines[0], unitPricePaisa: 999 }] },
    { ...valid, lines: [{ ...original.lines[0], notes: 'x'.repeat(501) }] },
    { ...valid, lines: [{ ...original.lines[0], basePricePaisa: Number.MAX_SAFE_INTEGER,
      unitPricePaisa: Number.MAX_SAFE_INTEGER, quantity: 2 }] },
  ];
  for (const input of invalid) await expect(store.save(input)).rejects.toThrow();
  expect(await store.list()).toEqual([original]);
});

it('reports inconsistent stored totals without resetting or rewriting the order', async () => {
  const store = createSavedOrderStore(database);
  const original = await store.save(draft());
  await database.write([{ statement: 'UPDATE open_orders SET total_paisa = 1 WHERE id = ?', values: [original.id] }]);
  await expect(store.get(original.id)).rejects.toThrow('stored data has not been changed');
  await expect(store.list()).rejects.toThrow();
  expect(await database.query('SELECT id, total_paisa FROM open_orders')).toEqual([{ id: original.id, total_paisa: 1 }]);
});

it('upgrades version-four storage without resetting the existing menu or choices', async () => {
  const before = await createMenuStore(database).listMenuItems();
  await database.write([
    { statement: 'DROP TABLE sales', values: [] },
    { statement: 'DROP TABLE open_orders', values: [] },
    { statement: 'DELETE FROM schema_migrations WHERE version >= 5', values: [] },
  ]);
  await initializeSchema(database);
  await initializeSchema(database);
  expect(await createMenuStore(database).listMenuItems()).toEqual(before);
  expect(await createSavedOrderStore(database).list()).toEqual([]);
});
