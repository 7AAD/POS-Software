import { afterEach, beforeEach, expect, it } from 'vitest';
import { openTestDatabase } from './sqlite-fixture';
import { initializeSchema } from '../../data/schema';
import { importInitialMenu } from '../../data/import-initial-menu';
import { importOrderOptions } from '../../data/import-order-options';
import { createMenuStore } from '../../data/menu-store';
import { readOrderOptions, validateOrderOptions } from '../../data/order-options-validation';

let database: ReturnType<typeof openTestDatabase>;
beforeEach(async () => {
  database = openTestDatabase();
  await initializeSchema(database);
  await importInitialMenu(database);
});
afterEach(() => database.close());

it('adds choices without resetting owner prices and never overwrites later choice edits', async () => {
  const store = createMenuStore(database);
  const original = (await store.listMenuItems()).find(item => item.name === 'Deal 7')!;
  await store.saveMenuItem({ ...original, premiumExtraPaisa: 7500, variants: [{ ...original.variants[0], pricePaisa: 72500 }] });
  await importOrderOptions(database);
  const seeded = (await store.listMenuItems()).find(item => item.id === original.id)!;
  expect(seeded.premiumExtraPaisa).toBe(7500);
  expect(seeded.variants[0].pricePaisa).toBe(72500);
  expect(seeded.orderOptions?.groups[0].quantity).toBe(1);
  const changed = await store.saveMenuItem({ ...seeded, orderOptions: { groups: [] } });
  await importOrderOptions(database);
  expect((await store.listMenuItems()).find(item => item.id === original.id)).toEqual(changed);
});

it('does not infer a bundle structure after its contents or premium rule were changed', async () => {
  const store = createMenuStore(database);
  const menu = await store.listMenuItems();
  const deal7 = menu.find(item => item.name === 'Deal 7')!;
  const deal8 = menu.find(item => item.name === 'Deal 8')!;
  await store.saveMenuItem({ ...deal7, description: 'Owner special: different pizzas' });
  await store.saveMenuItem({ ...deal8, premiumExtraRequired: false });
  await importOrderOptions(database);
  const current = await store.listMenuItems();
  expect(current.find(item => item.id === deal7.id)?.orderOptions).toBeUndefined();
  expect(current.find(item => item.id === deal8.id)?.orderOptions).toBeUndefined();
});

it('uses matching owner pizza IDs and sizes instead of requiring seed IDs', async () => {
  const store = createMenuStore(database);
  const tikka = (await store.listMenuItems()).find(item => item.name === 'Tikka')!;
  await database.write([
    { statement: 'DELETE FROM menu_variants WHERE item_id = ?', values: [tikka.id] },
    { statement: 'DELETE FROM menu_items WHERE id = ?', values: [tikka.id] },
  ]);
  await store.saveMenuItem({ ...tikka, id: 'owner-tikka',
    variants: tikka.variants.map(variant => ({ ...variant, id: `owner-${variant.name}` })) });
  await importOrderOptions(database);
  const deal = (await store.listMenuItems()).find(item => item.name === 'Deal 7')!;
  expect(deal.orderOptions?.groups[0].options.find(option => option.name === 'Tikka')?.menuVariantId).toBe('owner-Small');
});

it('validates choice settings and preserves the previous menu on invalid edits', async () => {
  await importOrderOptions(database);
  const store = createMenuStore(database);
  const deal = (await store.listMenuItems()).find(item => item.name === 'Deal 7')!;
  const bad = { groups: [{ id: 'pizza', label: 'Pizza', quantity: 2, options: [
    { id: 'a', name: 'Tikka', premium: false }, { id: 'b', name: 'tikka', premium: true },
  ] }] };
  await expect(store.saveMenuItem({ ...deal, name: 'Should not save', orderOptions: bad })).rejects.toThrow('Order choices');
  await expect(store.saveMenuItem({ ...deal, premiumExtraRequired: false })).rejects.toThrow('Enable premium');
  expect((await store.listMenuItems()).find(item => item.id === deal.id)).toEqual(deal);
  for (const value of [null, {}, { groups: 'oops' }, { groups: [{ id: 'x', label: 'Pizza', quantity: 0, options: [] }] }]) {
    expect(() => validateOrderOptions(value)).toThrow('Order choices');
  }
  expect(() => readOrderOptions('{"groups":42}')).toThrow('Order choices');
});

it('upgrades a version-three menu without altering stored owner data', async () => {
  const store = createMenuStore(database);
  const before = await store.listMenuItems();
  await database.write([
    { statement: 'ALTER TABLE menu_items DROP COLUMN order_options_json', values: [] },
      { statement: 'DROP TABLE sales', values: [] },
      { statement: 'DROP TABLE open_orders', values: [] },
      { statement: 'DELETE FROM schema_migrations WHERE version >= 4', values: [] },
  ]);
  await initializeSchema(database);
  await initializeSchema(database);
  expect(await store.listMenuItems()).toEqual(before);
});
