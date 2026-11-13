import { cartTotal } from './order-cart';
import { OrderValidationError } from './order-error';
import type { CartLine, OrderDetails } from './order-types';

const text = (value: unknown, limit: number, required = false): value is string =>
  typeof value === 'string' && value.length <= limit && (!required || value.trim().length > 0);
const money = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function validateOrderDetails(value: unknown): asserts value is OrderDetails {
  const details = value as Partial<OrderDetails> | null;
  if (!details || !['dine-in', 'takeaway', 'delivery'].includes(details.type ?? '') ||
      !text(details.table, 30) || !text(details.customerName, 100) || !text(details.customerPhone, 30)) {
    throw new OrderValidationError('Check the order type and customer details before saving.');
  }
}

export function validateOrderLines(value: unknown): asserts value is CartLine[] {
  if (!Array.isArray(value) || value.length === 0) throw new OrderValidationError('Add at least one item before saving an order.');
  const ids = new Set<string>();
  for (const line of value) {
    if (!line || !text(line.id, 100, true) || ids.has(line.id) ||
        !text(line.menuItemId, 100, true) || !text(line.variantId, 100, true) ||
        !text(line.itemName, 100, true) || !text(line.variantName, 100, true) ||
        !text(line.description, 1000) || !text(line.notes, 500) ||
        !money(line.basePricePaisa) || !money(line.premiumPaisa) || !money(line.unitPricePaisa) ||
        line.basePricePaisa + line.premiumPaisa !== line.unitPricePaisa ||
        !Array.isArray(line.choices) || line.choices.length > 20 ||
        line.choices.some((choice: unknown) => {
          const entry = choice as Partial<CartLine['choices'][number]> | null;
          return !entry || !text(entry.label, 120, true) || !text(entry.name, 100, true) || typeof entry.premium !== 'boolean';
        })) throw new OrderValidationError('This order has invalid item details. Review it before saving.');
    ids.add(line.id);
  }
  try { cartTotal(value); }
  catch (error) { throw new OrderValidationError(error instanceof Error ? error.message : 'Check the order quantities and prices.'); }
}
