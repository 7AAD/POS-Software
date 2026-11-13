import type { MenuItem } from './menu-types';
import type { ResolvedOrderGroup } from './order-option-types';
import type { OrderChoiceSnapshot, OrderSelections } from './order-types';

export function resolveOrderGroups(item: MenuItem, menu: MenuItem[]): ResolvedOrderGroup[] {
  return (item.orderOptions?.groups ?? []).map(group => ({ ...group,
    options: group.options.map(option => {
      if (!option.menuVariantId) return { ...option, available: true };
      const linked = menu.find(entry => entry.variants.some(variant => variant.id === option.menuVariantId));
      return { ...option, name: linked?.name ?? option.name, available: linked?.active ?? false };
    }),
  }));
}

// Count each premium pizza in one bundle, then quantity multiplies that bundle.
export function priceOrderSelection(item: MenuItem, menu: MenuItem[], variantId: string, selections: OrderSelections) {
  if (!item.active) throw new Error('This item is unavailable. Choose another item.');
  const variant = item.variants.find(entry => entry.id === variantId);
  if (!variant) throw new Error('Choose an available size.');
  if (item.premiumExtraRequired && !item.orderOptions?.groups.length) {
    throw new Error('Set up order choices in Manage menu before ordering this item.');
  }
  const choices: OrderChoiceSnapshot[] = [];
  for (const group of resolveOrderGroups(item, menu)) {
    for (let index = 0; index < group.quantity; index++) {
      const label = group.quantity > 1 ? `${group.label} ${index + 1}` : group.label;
      const selected = group.options.find(option => option.id === selections[`${group.id}:${index}`]);
      if (!selected) throw new Error(`Choose ${label.toLowerCase()}.`);
      if (!selected.available) throw new Error(`${selected.name} is unavailable. Choose another option.`);
      choices.push({ label, name: selected.name, premium: selected.premium });
    }
  }
  const premiumCount = choices.filter(choice => choice.premium).length;
  if (premiumCount && (!item.premiumExtraRequired || item.premiumExtraPaisa == null || item.premiumExtraPaisa <= 0)) {
    throw new Error('Set the premium extra in Manage menu before adding premium pizza.');
  }
  const premiumPaisa = premiumCount * (item.premiumExtraPaisa ?? 0);
  const unitPricePaisa = variant.pricePaisa + premiumPaisa;
  if (![variant.pricePaisa, premiumPaisa, unitPricePaisa].every(value => Number.isSafeInteger(value) && value >= 0)) {
    throw new Error('This order amount is too large. Reduce the price or quantity.');
  }
  return { variant, choices, basePricePaisa: variant.pricePaisa, premiumPaisa, unitPricePaisa };
}
