import { afterEach, beforeEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openTestDatabase } from './sqlite-fixture';
import { initializeSchema } from '../../data/schema';
import { importInitialMenu } from '../../data/import-initial-menu';
import { createMenuStore } from '../../data/menu-store';
import { createCartLine } from '../../data/order-cart';
import { emptyOrderDetails } from '../../data/order-types';
import { createSavedOrderStore } from '../../data/saved-order-store';
import { createSalesStore } from '../../data/sales-store';
import type { Database, SqlValue } from '../../data/database-types';

let database: ReturnType<typeof openTestDatabase>;
beforeEach(async () => { database = openTestDatabase(); await initializeSchema(database); await importInitialMenu(database); });
afterEach(() => database.close());

async function prepare(db: Database) {
  const menu = await createMenuStore(db).listMenuItems();
  const burger = menu.find(item => item.name === 'Shami Burger')!;
  const order = await createSavedOrderStore(db).save({ id: 'order-1', expectedRevision: 0,
    details: { ...emptyOrderDetails, customerName: 'Sara', table: '3' },
    lines: [createCartLine(burger, menu, burger.variants[0].id, 1, {}, 'No onions')] });
  return { id: 'payment-1', orderId: order.id, expectedRevision: order.revision,
    expectedTotalPaisa: order.totalPaisa, method: 'cash' as const, receivedPaisa: 20000,
    confirmedReceived: false, reference: '' };
}

it('rolls back both the sale and paid status if a write fails, then retries safely', async () => {
  const input = await prepare(database);
  const broken: Database = { ...database, write(statements) {
    return database.write([...statements, { statement: 'INSERT INTO missing_table VALUES (1)', values: [] }]);
  } };
  await expect(createSalesStore(broken).pay(input)).rejects.toThrow();
  expect(await createSalesStore(database).list()).toEqual([]);
  expect(await createSavedOrderStore(database).list()).toHaveLength(1);
  const sale = await createSalesStore(database).pay(input);
  expect(sale.totalPaisa).toBe(14000);
  expect(await createSavedOrderStore(database).list()).toEqual([]);
});

it('recovers a committed payment after its acknowledgement is interrupted without another sale', async () => {
  const input = await prepare(database);
  let written = false;
  let failRead = true;
  const flaky: Database = { ...database,
    async write(statements) { await database.write(statements); written = true; },
    async query<Row>(statement: string, values?: SqlValue[]) {
      if (written && failRead && statement.includes('FROM sales WHERE order_id')) {
        failRead = false; throw new Error('Acknowledgement interrupted');
      }
      return database.query<Row>(statement, values);
    },
  };
  await expect(createSalesStore(flaky).pay(input)).rejects.toThrow('Acknowledgement interrupted');
  const store = createSalesStore(database);
  const sale = await store.pay(input);
  expect(await store.list()).toEqual([sale]);
  expect(await createSavedOrderStore(database).list()).toEqual([]);
});

it('preserves completed sale snapshots and payment details across a real database restart', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'master-foods-sales-'));
  const path = join(directory, 'sales.sqlite');
  let disk = openTestDatabase(path);
  try {
    await initializeSchema(disk); await importInitialMenu(disk);
    const input = await prepare(disk);
    const sale = await createSalesStore(disk).pay(input);
    const store = createMenuStore(disk);
    const burger = (await store.listMenuItems()).find(item => item.name === 'Shami Burger')!;
    await store.saveMenuItem({ ...burger, name: 'Owner Burger', variants: [{ ...burger.variants[0], pricePaisa: 99900 }] });
    disk.close(); disk = openTestDatabase(path);
    await initializeSchema(disk);
    expect(await createSalesStore(disk).get(sale.id)).toEqual(sale);
    expect(sale.lines[0].itemName).toBe('Shami Burger');
    expect(sale.lines[0].notes).toBe('No onions');
    expect(sale.changePaisa).toBe(6000);
    expect(await createSavedOrderStore(disk).list()).toEqual([]);
  } finally { disk.close(); rmSync(directory, { recursive: true, force: true }); }
});

it('upgrades version-five storage without changing the menu or existing open orders', async () => {
  await prepare(database);
  const before = await createSavedOrderStore(database).list();
  const menu = await createMenuStore(database).listMenuItems();
  await database.write([
    { statement: 'DROP TABLE sales', values: [] },
    { statement: 'ALTER TABLE open_orders DROP COLUMN status', values: [] },
    { statement: 'DELETE FROM schema_migrations WHERE version = 6', values: [] },
  ]);
  await initializeSchema(database); await initializeSchema(database);
  expect(await createSavedOrderStore(database).list()).toEqual(before);
  expect(await createMenuStore(database).listMenuItems()).toEqual(menu);
  expect(await createSalesStore(database).list()).toEqual([]);
});

it('detects damaged paid snapshots without changing or deleting the completed sale', async () => {
  const input = await prepare(database);
  const sale = await createSalesStore(database).pay(input);
  await database.write([{ statement: 'UPDATE sales SET lines_json = ? WHERE id = ?',
    values: [JSON.stringify([{ ...sale.lines[0], quantity: 2 }]), sale.id] }]);
  await expect(createSalesStore(database).get(sale.id)).rejects.toThrow('stored data has not been changed');
  expect(await database.query('SELECT id, total_paisa FROM sales')).toEqual([{ id: sale.id, total_paisa: 14000 }]);
});
