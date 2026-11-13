import type { OrderOptions } from './order-option-types';

export interface Category {
  id: string;
  name: string;
}

export interface MenuVariant {
  id: string;
  name: string;
  pricePaisa: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  active: boolean;
  description: string;
  premiumExtraRequired: boolean;
  premiumExtraPaisa: number | null;
  variants: MenuVariant[];
  orderOptions?: OrderOptions;
}

export interface CategoryInput {
  id?: string;
  name: string;
}

export interface MenuItemInput {
  id?: string;
  categoryId: string;
  name: string;
  active?: boolean;
  description?: string;
  premiumExtraRequired?: boolean;
  premiumExtraPaisa?: number | null;
  variants: { id?: string; name: string; pricePaisa: number }[];
  orderOptions?: OrderOptions | null;
}
