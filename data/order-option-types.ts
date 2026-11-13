// Linked choices use menu availability/names, but never its standalone price.
export interface OrderChoiceOption {
  id: string;
  name: string;
  premium: boolean;
  menuVariantId?: string;
}

export interface OrderChoiceGroup {
  id: string;
  label: string;
  quantity: number;
  options: OrderChoiceOption[];
}

export interface OrderOptions {
  groups: OrderChoiceGroup[];
}

export interface ResolvedOrderOption extends OrderChoiceOption {
  available: boolean;
}

export interface ResolvedOrderGroup extends Omit<OrderChoiceGroup, 'options'> {
  options: ResolvedOrderOption[];
}
