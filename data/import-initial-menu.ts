import type { Database, SqlStatement } from './database-types';
import { initialMenu, initialMenuImportId } from './initial-menu';
import { requiredText, validateMenuItem } from './menu-validation';

export async function importInitialMenu(database: Database): Promise<void> {
  const imported = await database.query<{ id: string }>(
    'SELECT id FROM menu_imports WHERE id = ?', [initialMenuImportId],
  );
  if (imported.length) return;

  const categories = await database.query<{ id: string; name: string }>('SELECT id, name FROM categories');
  const items = await database.query<{ id: string; categoryId: string; name: string }>(
    'SELECT id, category_id AS categoryId, name FROM menu_items',
  );
  const categoryIds = new Map<string, string>();
  const statements: SqlStatement[] = [];
  for (const name of new Set(initialMenu.map(item => item.category))) {
    requiredText(name, 'Category name');
    const seedId = 'menu-category-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = categories.find(category =>
      category.name.toLowerCase() === name.toLowerCase() || category.id === seedId,
    );
    const id = existing?.id ?? seedId;
    categoryIds.set(name, id);
    if (!existing) statements.push({
      statement: `INSERT INTO categories(id, name, sort_order)
        VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))`, values: [id, name],
    });
  }

  for (const item of initialMenu) {
    const categoryId = categoryIds.get(item.category)!;
    validateMenuItem({ ...item, categoryId });
    // Existing owner entries win, including renamed entries with a seed ID.
    if (items.some(existing => existing.id === item.id ||
        (existing.categoryId === categoryId && existing.name.toLowerCase() === item.name.toLowerCase()))) continue;
    statements.push({
      statement: `INSERT INTO menu_items(id, category_id, name, active, description,
        premium_extra_required, premium_extra_paisa, sort_order)
        VALUES (?, ?, ?, 1, ?, ?, NULL, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM menu_items))`,
      values: [item.id, categoryId, item.name, item.description ?? '', Number(item.premiumExtraRequired ?? false)],
    });
    for (const [index, variant] of item.variants.entries()) statements.push({
      statement: 'INSERT INTO menu_variants(id, item_id, name, price_paisa, sort_order) VALUES (?, ?, ?, ?, ?)',
      values: [variant.id, item.id, variant.name, variant.pricePaisa, index],
    });
  }
  statements.push({ statement: 'INSERT INTO menu_imports(id) VALUES (?)', values: [initialMenuImportId] });
  // The catalog and marker commit together. Reopening never resets owner edits.
  await database.write(statements);
}
