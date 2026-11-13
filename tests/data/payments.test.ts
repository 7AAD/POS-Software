import { afterEach, beforeEach, expect, it } from 'vitest';
import { openTestDatabase } from './sqlite-fixture';
import { initializeSchema } from '../../data/schema';
import { importInitialMenu } from '../../data/import-initial-menu';
import { createMenuStore } from '../../data/menu-store';
import { createCartLine } from '../../data/order-cart';
import { emptyOrderDetails } from '../../data/order-types';
import { createSavedOrderStore } from '../../data/saved-order-store';
import { createSalesStore } from '../../data/sales-store';
import { paymentAmounts } from '../../data/payment-validation';
import { paymentMethods, type PaymentInput, type PaymentMethod } from '../../data/payment-types';
import { OrderConflictError, OrderPaidError } from '../../data/order-error';
import type { SavedOrder } from '../../data/saved-order-types';
import type { Database, SqlValue } from '../../data/database-types';

let database: ReturnType<typeof openTestDatabase>;
let order: SavedOrder;
beforeEach(async () => {
  database = openTestDatabase();
  await initializeSchema(database);
  await importInitialMenu(database);
  const menu = await createMenuStore(database).listMenuItems();
  const burger = menu.find(item => item.name === 'Shami Burger')!;
  order = await createSavedOrderStore(database).save({ id: 'order-1', expectedRevision: 0,
    details: { ...emptyOrderDetails, table: '3', customerName: 'Sara' },
    lines: [createCartLine(burger, menu, burger.variants[0].id, 1, {}, 'No onions')] });
});
afterEach(() => database.close());

function payment(method: PaymentMethod = 'cash'): PaymentInput {
  return { id: 'payment-1', orderId: order.id, expectedRevision: order.revision,
    expectedTotalPaisa: order.totalPaisa, method, receivedPaisa: method === 'cash' ? 20000 : 14000,
    confirmedReceived: method !== 'cash', reference: method === 'cash' ? '' : 'Transfer 123' };
}

it.each(paymentMethods)('records $label and closes only the matching open order', async ({ value }) => {
  const store = createSalesStore(database);
  const sale = await store.pay(payment(value));
  expect(sale.totalPaisa).toBe(14000);
  expect(sale.receivedPaisa).toBe(value === 'cash' ? 20000 : 14000);
  expect(sale.changePaisa).toBe(value === 'cash' ? 6000 : 0);
  expect(sale.method).toBe(value);
  expect(sale.lines).toEqual(order.lines);
  expect(sale.details).toEqual(order.details);
  expect(await createSavedOrderStore(database).list()).toEqual([]);
  await expect(createSavedOrderStore(database).get(order.id)).rejects.toBeInstanceOf(OrderPaidError);
  expect(await store.findForOrder(order.id)).toEqual(sale);
});

it('calculates exact change in paisa, including decimal and zero-total payments', () => {
  expect(paymentAmounts(15550, 'cash', 20000).changePaisa).toBe(4450);
  expect(paymentAmounts(29, 'cash', 100).changePaisa).toBe(71);
  expect(paymentAmounts(0, 'cash', 0).changePaisa).toBe(0);
  expect(paymentAmounts(Number.MAX_SAFE_INTEGER, 'cash', Number.MAX_SAFE_INTEGER).changePaisa).toBe(0);
});

it('rejects partial cash, invalid amounts, unsupported methods, and unconfirmed digital payments without writes', async () => {
  const valid = payment();
  const invalid: PaymentInput[] = [
    { ...valid, receivedPaisa: 13999 }, { ...valid, receivedPaisa: -1 },
    { ...valid, receivedPaisa: 14000.5 }, { ...valid, receivedPaisa: Number.MAX_SAFE_INTEGER + 1 },
    { ...valid, expectedTotalPaisa: NaN }, { ...valid, expectedRevision: 0 },
    { ...valid, id: '' }, { ...valid, reference: 'x'.repeat(101) },
    { ...valid, method: 'card' as PaymentMethod },
    { ...payment('jazzcash'), confirmedReceived: false },
    { ...payment('easypaisa'), receivedPaisa: 15000 },
    { ...payment('bank-transfer'), receivedPaisa: 10000 },
  ];
  for (const input of invalid) await expect(createSalesStore(database).pay(input)).rejects.toThrow();
  expect(await createSalesStore(database).list()).toEqual([]);
  expect(await createSavedOrderStore(database).get(order.id)).toEqual(order);
});

it('reuses an identical payment retry and never allows a second payment or edits to the paid order', async () => {
  const store = createSalesStore(database);
  const input = payment();
  const sale = await store.pay(input);
  expect(await store.pay(input)).toEqual(sale);
  await expect(store.pay({ ...input, id: 'another-payment' })).rejects.toBeInstanceOf(OrderPaidError);
  await expect(store.pay({ ...input, receivedPaisa: 25000 })).rejects.toBeInstanceOf(OrderPaidError);
  await expect(createSavedOrderStore(database).save({ id: order.id, expectedRevision: order.revision,
    details: order.details, lines: [{ ...order.lines[0], quantity: 3 }] })).rejects.toBeInstanceOf(OrderPaidError);
  expect(await store.list()).toEqual([sale]);
  expect(await database.query('SELECT status, revision FROM open_orders WHERE id = ?', [order.id]))
    .toEqual([{ status: 'paid', revision: 2 }]);
});

it('rejects a stale checkout total and revision before recording any sale', async () => {
  const store = createSavedOrderStore(database);
  const changed = await store.save({ id: order.id, expectedRevision: 1,
    details: order.details, lines: [{ ...order.lines[0], quantity: 2 }] });
  await expect(createSalesStore(database).pay(payment())).rejects.toBeInstanceOf(OrderConflictError);
  expect(await createSalesStore(database).list()).toEqual([]);
  expect(await store.get(order.id)).toEqual(changed);
});

it('checks the revision inside the payment transaction if the order changes after review', async () => {
  let changeOnce = true;
  const guarded: Database = { ...database, async write(statements) {
    if (changeOnce && statements[0].statement.includes('INSERT INTO sales')) {
      changeOnce = false;
      await createSavedOrderStore(database).save({ id: order.id, expectedRevision: 1,
        details: order.details, lines: [{ ...order.lines[0], quantity: 2 }] });
    }
    await database.write(statements);
  } };
  await expect(createSalesStore(guarded).pay(payment())).rejects.toBeInstanceOf(OrderConflictError);
  expect(await createSalesStore(database).list()).toEqual([]);
  expect((await createSavedOrderStore(database).get(order.id)).totalPaisa).toBe(28000);
});

it('records one sale when two different payment attempts race for the same order', async () => {
  const store = createSalesStore(database);
  const results = await Promise.allSettled([store.pay(payment()), store.pay({ ...payment(), id: 'payment-2' })]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
  expect(await store.list()).toHaveLength(1);
  expect(await createSavedOrderStore(database).list()).toEqual([]);
});

it('allows concurrent identical retries without recording another payment', async () => {
  const store = createSalesStore(database);
  const [first, second] = await Promise.all([store.pay(payment()), store.pay(payment())]);
  expect(second).toEqual(first);
  expect(await store.list()).toEqual([first]);
});

it('recovers an identical payment that finishes between checking its sale and loading the order', async () => {
  const input = payment();
  let intervene = true;
  const raced: Database = { ...database, async query<Row>(statement: string, values?: SqlValue[]) {
    if (intervene && statement.includes('FROM open_orders WHERE')) {
      intervene = false;
      await createSalesStore(database).pay(input);
    }
    return database.query<Row>(statement, values);
  } };
  const sale = await createSalesStore(raced).pay(input);
  expect(await createSalesStore(database).list()).toEqual([sale]);
  expect(await createSavedOrderStore(database).list()).toEqual([]);
});
