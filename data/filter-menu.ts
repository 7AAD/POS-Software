import type { Category, MenuItem } from './menu-types';

export function filterMenu(items: MenuItem[], categories: Category[], query: string, categoryId: string) {
  const visible = items.filter(item => (!categoryId || item.categoryId === categoryId) &&
    item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const groups = categories.map(category => ({
    category, items: visible.filter(item => item.categoryId === category.id),
  })).filter(group => group.items.length > 0);
  return { visible, groups };
}
