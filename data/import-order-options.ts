import type { Database, SqlStatement } from './database-types';
import { initialMenu } from './initial-menu';
import type { OrderChoiceGroup } from './order-option-types';
import { createMenuStore } from './menu-store';

const importId = 'master-foods-order-choices-v1';
const baseFlavours = new Set(['Tikka', 'Fajita', 'Vegetable']);
const pizzaDeals = [
  { deal: 7, size: 'Small', quantity: 1 },
  { deal: 8, size: 'Small', quantity: 3 },
  { deal: 9, size: 'Medium', quantity: 1 },
  { deal: 10, size: 'Medium', quantity: 1 },
  { deal: 11, size: 'Medium', quantity: 2 },
  { deal: 12, size: 'Large', quantity: 2 },
];

// Add reviewed choices once, only where the printed contents still match.
// Changed owner deals, prices, names, and premium amounts are never overwritten.
export async function importOrderOptions(database: Database): Promise<void> {
  const imported = await database.query('SELECT id FROM menu_imports WHERE id = ?', [importId]);
  if (imported.length) return;
  const store = createMenuStore(database);
  const [menu, categories] = await Promise.all([store.listMenuItems(), store.listCategories()]);
  const pizzaCategory = categories.find(category => category.name.toLowerCase() === 'pizzas');
  const statements: SqlStatement[] = [];
  for (const item of initialMenu.filter(entry => entry.category === 'Deals')) {
    const groups: OrderChoiceGroup[] = [];
    const pizza = pizzaDeals.find(entry => item.id === `menu-deals-deal-${entry.deal}`);
    if (pizza) groups.push({
      id: 'pizza', label: `${pizza.size} pizza`, quantity: pizza.quantity,
      options: initialMenu.filter(entry => entry.category === 'Pizzas').flatMap(flavour => {
        const linked = menu.find(entry => entry.id === flavour.id ||
          (entry.categoryId === pizzaCategory?.id && entry.name.toLowerCase() === flavour.name.toLowerCase()));
        const variant = linked?.variants.find(entry => entry.name.toLowerCase() === pizza.size.toLowerCase());
        return variant ? [{ id: variant.id, name: linked!.name,
          premium: !baseFlavours.has(flavour.name), menuVariantId: variant.id }] : [];
      }),
    });
    const nrQuantity = item.id === 'menu-deals-deal-2' ? 2 :
      ['menu-deals-deal-1', 'menu-deals-deal-4'].includes(item.id) ? 1 : 0;
    if (nrQuantity) groups.push({ id: 'nr', label: 'NR drink', quantity: nrQuantity,
      options: ['250 ml', '350 ml'].map(name => ({ id: name, name, premium: false })) });
    if (!groups.length) continue;
    statements.push({
      statement: `UPDATE menu_items SET order_options_json = ?
        WHERE id = ? AND description = ? AND order_options_json IS NULL
          AND (? = 0 OR premium_extra_required = 1)`,
      values: [JSON.stringify({ groups }), item.id, item.description ?? '', Number(Boolean(pizza))],
    });
  }
  statements.push({ statement: 'INSERT INTO menu_imports(id) VALUES (?)', values: [importId] });
  await database.write(statements);
}
