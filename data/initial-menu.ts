import foods from './catalog/foods.json';
import pizzas from './catalog/pizzas.json';
import drinksAndDeals from './catalog/drinks-and-deals.json';
import type { MenuItemInput, MenuVariant } from './menu-types';

export type CatalogItem = Omit<MenuItemInput, 'categoryId' | 'variants'> & {
  id: string;
  category: string;
  variants: MenuVariant[];
};

export const initialMenu: CatalogItem[] = [...foods, ...pizzas, ...drinksAndDeals];
export const initialMenuImportId = 'master-foods-menu-v1';
