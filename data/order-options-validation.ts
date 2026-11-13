import type { OrderOptions } from './order-option-types';

// Also validates JSON loaded from a device; malformed choices must not bill as free.
export function validateOrderOptions(value: unknown): asserts value is OrderOptions {
  const fail = () => { throw new Error('Order choices need unique names, valid quantities, and at most 20 options per group.'); };
  const text = (entry: unknown): entry is string =>
    typeof entry === 'string' && entry.trim().length > 0 && entry.length <= 100;
  if (!value || typeof value !== 'object' || !('groups' in value) || !Array.isArray(value.groups)) return fail();
  if (value.groups.length > 10) return fail();
  const groupIds = new Set<string>();
  let slots = 0;
  for (const group of value.groups) {
    if (!group || !text(group.id) || groupIds.has(group.id) || !text(group.label) ||
        !Number.isInteger(group.quantity) || group.quantity < 1 || group.quantity > 10 ||
        !Array.isArray(group.options) || group.options.length > 20) return fail();
    groupIds.add(group.id);
    slots += group.quantity;
    const ids = new Set<string>();
    const names = new Set<string>();
    for (const option of group.options) {
      if (!option || !text(option.id) || ids.has(option.id) || !text(option.name) ||
          names.has(option.name.trim().toLowerCase()) || typeof option.premium !== 'boolean' ||
          (option.menuVariantId !== undefined && !text(option.menuVariantId))) return fail();
      ids.add(option.id);
      names.add(option.name.trim().toLowerCase());
    }
  }
  if (slots > 20) return fail();
}

export function readOrderOptions(json: string): OrderOptions {
  const options: unknown = JSON.parse(json);
  validateOrderOptions(options);
  return options;
}
