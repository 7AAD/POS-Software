import type { MenuItem } from './menu-types';
import { priceOrderSelection } from './order-pricing';
import { maxOrderQuantity, type CartLine, type OrderSelections } from './order-types';

function validateQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxOrderQuantity) {
    throw new Error(`Quantity must be between 1 and ${maxOrderQuantity}.`);
  }
}

export function cartTotal(lines: CartLine[]): number {
  let total = 0;
  for (const line of lines) {
    validateQuantity(line.quantity);
    if (!Number.isSafeInteger(line.unitPricePaisa) || line.unitPricePaisa < 0) {
      throw new Error('This item has an invalid price. Remove it and choose it again.');
    }
    total += line.unitPricePaisa * line.quantity;
    if (!Number.isSafeInteger(total)) throw new Error('This order amount is too large. Reduce the price or quantity.');
  }
  return total;
}

export function createCartLine(item: MenuItem, menu: MenuItem[], variantId: string,
  quantity: number, selections: OrderSelections, notes: string): CartLine {
  validateQuantity(quantity);
  if (notes.length > 500) throw new Error('Instructions must contain at most 500 characters.');
  const price = priceOrderSelection(item, menu, variantId, selections);
  const line: CartLine = {
    id: crypto.randomUUID(), menuItemId: item.id, variantId,
    itemName: item.name, variantName: price.variant.name, description: item.description,
    basePricePaisa: price.basePricePaisa, premiumPaisa: price.premiumPaisa,
    unitPricePaisa: price.unitPricePaisa, choices: price.choices, quantity, notes: notes.trim(),
  };
  cartTotal([line]);
  return line;
}

function sameConfiguration(first: CartLine, second: CartLine): boolean {
  const { id: firstId, quantity: firstQuantity, ...firstSnapshot } = first;
  const { id: secondId, quantity: secondQuantity, ...secondSnapshot } = second;
  return JSON.stringify(firstSnapshot) === JSON.stringify(secondSnapshot);
}

export function addCartLine(lines: CartLine[], added: CartLine): CartLine[] {
  const matching = lines.find(line => sameConfiguration(line, added));
  const next = matching ? lines.map(line => line.id === matching.id ?
    { ...line, quantity: line.quantity + added.quantity } : line) : [...lines, added];
  cartTotal(next);
  return next;
}

export function changeCartQuantity(lines: CartLine[], id: string, quantity: number): CartLine[] {
  validateQuantity(quantity);
  const next = lines.map(line => line.id === id ? { ...line, quantity } : line);
  cartTotal(next);
  return next;
}
