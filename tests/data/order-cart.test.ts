import { beforeEach, afterEach, expect, it } from 'vitest';
import { openTestDatabase } from './sqlite-fixture';
import { initializeSchema } from '../../data/schema';
import { importInitialMenu } from '../../data/import-initial-menu';
import { importOrderOptions } from '../../data/import-order-options';
import { createMenuStore } from '../../data/menu-store';
import { addCartLine, cartTotal, changeCartQuantity, createCartLine } from '../../data/order-cart';
import { priceOrderSelection, resolveOrderGroups } from '../../data/order-pricing';
import type { MenuItem } from '../../data/menu-types';

let database: ReturnType<typeof openTestDatabase>;
let menu: MenuItem[];
const item = (name: string) => menu.find(entry => entry.name === name)!;

beforeEach(async () => {
  database = openTestDatabase();
  await initializeSchema(database);
  await importInitialMenu(database);
  await importOrderOptions(database);
  menu = await createMenuStore(database).listMenuItems();
});
afterEach(() => database.close());

it('charges per premium pizza, then multiplies the whole bundle by its quantity', () => {
  const deal = { ...item('Deal 8'), premiumExtraPaisa: 7500 };
  const line = createCartLine(deal, menu, deal.variants[0].id, 2, {
    'pizza:0': 'menu-pizzas-tikka-small', 'pizza:1': 'menu-pizzas-malai-boti-small',
    'pizza:2': 'menu-pizzas-supreme-small',
  }, 'No onions');
  expect(line.basePricePaisa).toBe(120000);
  expect(line.premiumPaisa).toBe(15000);
  expect(line.unitPricePaisa).toBe(135000);
  expect(cartTotal([line])).toBe(270000);
  expect(line.choices.map(choice => choice.premium)).toEqual([false, true, true]);
  expect(line.notes).toBe('No onions');
});

it('requires every flavour and cannot charge an unset premium fee as zero', () => {
  const deal = item('Deal 7');
  const id = deal.variants[0].id;
  expect(() => priceOrderSelection(deal, menu, id, {})).toThrow('Choose small pizza');
  expect(() => priceOrderSelection(deal, menu, id, { 'pizza:0': 'menu-pizzas-supreme-small' })).toThrow('Set the premium extra');
  expect(priceOrderSelection(deal, menu, id, { 'pizza:0': 'menu-pizzas-fajita-small' }).unitPricePaisa).toBe(70000);
  expect(() => priceOrderSelection({ ...deal, orderOptions: undefined }, menu, id, {})).toThrow('Set up order choices');
});

it('uses only offered sizes and follows linked menu availability and renamed flavours', () => {
  expect(resolveOrderGroups(item('Deal 7'), menu)[0].options.map(option => option.name)).toEqual([
    'Tikka', 'Fajita', 'Vegetable', 'Supreme', 'Malai Boti', 'Kababish', 'Kabab Crust',
  ]);
  const largeOptions = resolveOrderGroups(item('Deal 12'), menu)[0].options;
  expect(largeOptions).toHaveLength(10);
  expect(largeOptions.filter(option => !option.premium).map(option => option.name)).toEqual(['Tikka', 'Fajita', 'Vegetable']);
  const tikka = item('Tikka');
  const changed = menu.map(entry => entry.id === tikka.id ? { ...entry, name: 'Owner Tikka', active: false } : entry);
  expect(resolveOrderGroups(item('Deal 7'), changed)[0].options[0]).toMatchObject({ name: 'Owner Tikka', available: false });
  expect(() => priceOrderSelection(item('Deal 7'), changed, item('Deal 7').variants[0].id,
    { 'pizza:0': 'menu-pizzas-tikka-small' })).toThrow('unavailable');
  const removedSize = menu.map(entry => entry.id === tikka.id ? { ...entry, variants: entry.variants.slice(1) } : entry);
  expect(resolveOrderGroups(item('Deal 7'), removedSize)[0].options[0].available).toBe(false);
});

it('keeps sale-time snapshots, merging only identical sizes, notes, choices, and prices', () => {
  const burger = item('Shami Burger');
  const first = createCartLine(burger, menu, burger.variants[0].id, 1, {}, '  No sauce  ');
  const second = createCartLine(burger, menu, burger.variants[0].id, 2, {}, 'No sauce');
  let lines = addCartLine([first], second);
  expect(lines).toHaveLength(1);
  expect(lines[0].quantity).toBe(3);
  expect(lines[0].id).toBe(first.id);
  lines = addCartLine(lines, createCartLine(burger, menu, burger.variants[0].id, 1, {}, 'Extra sauce'));
  const changed = { ...burger, name: 'Owner Burger', variants: [{ ...burger.variants[0], pricePaisa: 15550 }] };
  lines = addCartLine(lines, createCartLine(changed, menu, changed.variants[0].id, 1, {}, 'No sauce'));
  expect(lines).toHaveLength(3);
  expect(lines[0].itemName).toBe('Shami Burger');
  expect(lines[0].unitPricePaisa).toBe(14000);
  expect(cartTotal(lines)).toBe(71550);
  expect(cartTotal(changeCartQuantity(lines, first.id, 2))).toBe(57550);
});

it('does not add standalone flavour prices to a fixed-price deal', () => {
  const deal = item('Deal 7');
  const expensiveTikka = menu.map(entry => entry.name === 'Tikka' ? {
    ...entry, variants: entry.variants.map(variant => ({ ...variant, pricePaisa: 99999999 })),
  } : entry);
  expect(priceOrderSelection(deal, expensiveTikka, deal.variants[0].id,
    { 'pizza:0': 'menu-pizzas-tikka-small' }).unitPricePaisa).toBe(70000);
});

it('requires both NR sizes without inventing a shawarma or fries size', () => {
  const deal = item('Deal 2');
  expect(() => priceOrderSelection(deal, menu, deal.variants[0].id, { 'nr:0': '250 ml' })).toThrow('nr drink 2');
  const quote = priceOrderSelection(deal, menu, deal.variants[0].id, { 'nr:0': '250 ml', 'nr:1': '350 ml' });
  expect(quote.choices.map(choice => choice.name)).toEqual(['250 ml', '350 ml']);
  const shawarmaDeal = item('Deal 5');
  expect(priceOrderSelection(shawarmaDeal, menu, shawarmaDeal.variants[0].id, {}).choices).toEqual([]);
  expect(shawarmaDeal.description).toContain('Zinger Shawarma + Fries');
});

it('rejects invalid quantities, unavailable items, bad sizes, and unsafe totals without changing a cart', () => {
  const burger = item('Shami Burger');
  const line = createCartLine(burger, menu, burger.variants[0].id, 1, {}, '');
  const lines = [line];
  for (const quantity of [0, -1, 1.5, 100, NaN]) {
    expect(() => changeCartQuantity(lines, line.id, quantity)).toThrow('Quantity');
  }
  expect(() => createCartLine({ ...burger, active: false }, menu, burger.variants[0].id, 1, {}, '')).toThrow('unavailable');
  expect(() => createCartLine(burger, menu, 'missing', 1, {}, '')).toThrow('size');
  const costly = { ...burger, variants: [{ ...burger.variants[0], pricePaisa: Number.MAX_SAFE_INTEGER }] };
  expect(() => createCartLine(costly, menu, costly.variants[0].id, 2, {}, '')).toThrow('too large');
  const big = createCartLine(costly, menu, costly.variants[0].id, 1, {}, '');
  expect(() => addCartLine(lines, big)).toThrow('too large');
  expect(() => addCartLine([{ ...line, quantity: 99 }], line)).toThrow('Quantity');
  expect(lines).toEqual([line]);
  expect(line.quantity).toBe(1);
});
