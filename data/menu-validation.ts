import type { MenuItemInput } from './menu-types';
import { validateOrderOptions } from './order-options-validation';

export function requiredText(value: string, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) {
    throw new Error(`${label} must contain 1–100 characters.`);
  }
  return value.trim();
}

export function validateMenuItem(input: MenuItemInput): void {
  requiredText(input.name, 'Item name');
  requiredText(input.categoryId, 'Category');
  if (input.orderOptions != null) {
    validateOrderOptions(input.orderOptions);
    if (!input.premiumExtraRequired && input.orderOptions.groups.some(group => group.options.some(option => option.premium))) {
      throw new Error('Enable premium extras or remove Premium marks from the order choices.');
    }
  }
  if (input.description !== undefined &&
      (typeof input.description !== 'string' || input.description.length > 1000)) {
    throw new Error('Details must contain at most 1,000 characters.');
  }
  if (input.premiumExtraRequired !== undefined && typeof input.premiumExtraRequired !== 'boolean') {
    throw new Error('Premium extra must be enabled or disabled.');
  }
  if (input.premiumExtraPaisa !== undefined && input.premiumExtraPaisa !== null) {
    if (!input.premiumExtraRequired || !Number.isSafeInteger(input.premiumExtraPaisa) || input.premiumExtraPaisa <= 0) {
      throw new Error('Enable premium extra and enter a positive whole paisa amount.');
    }
  }
  if (input.active !== undefined && typeof input.active !== 'boolean') {
    throw new Error('Item availability must be true or false.');
  }
  if (!Array.isArray(input.variants) || input.variants.length === 0) {
    throw new Error('Add at least one size and price. Use Regular for an item with one price.');
  }
  const names = new Set<string>();
  const ids = new Set<string>();
  for (const variant of input.variants) {
    const name = requiredText(variant.name, 'Size name').toLowerCase();
    if (names.has(name)) throw new Error('Size names must be unique within an item.');
    names.add(name);
    if (variant.id !== undefined) {
      const id = requiredText(variant.id, 'Size ID');
      if (ids.has(id)) throw new Error('Size IDs must be unique within an item.');
      ids.add(id);
    }
    if (!Number.isSafeInteger(variant.pricePaisa) || variant.pricePaisa < 0) {
      throw new Error('Prices must be non-negative whole paisa amounts.');
    }
  }
}
