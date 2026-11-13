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
  variants: MenuVariant[];
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
  variants: { id?: string; name: string; pricePaisa: number }[];
}
