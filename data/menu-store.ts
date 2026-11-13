import type { Database } from './database-types';
import type { Category, CategoryInput, MenuItem, MenuItemInput } from './menu-types';
import { requiredText, validateMenuItem } from './menu-validation';

interface ItemRow {
  id: string;
  categoryId: string;
  name: string;
  active: number;
  description: string;
  premiumExtraRequired: number;
  premiumExtraPaisa: number | null;
  variantId: string;
  variantName: string;
  pricePaisa: number;
}

export function createMenuStore(database: Database) {
  return {
    async listCategories(): Promise<Category[]> {
      return database.query<Category>('SELECT id, name FROM categories ORDER BY name');
    },

    async saveCategory(input: CategoryInput): Promise<Category> {
      const category = {
        id: input.id === undefined ? crypto.randomUUID() : requiredText(input.id, 'Category ID'),
        name: requiredText(input.name, 'Category name'),
      };
      await database.write([{
        statement: `INSERT INTO categories(id, name) VALUES (?, ?)
          ON CONFLICT(id) DO UPDATE SET name = excluded.name`,
        values: [category.id, category.name],
      }]);
      return category;
    },

    async listMenuItems(): Promise<MenuItem[]> {
      const rows = await database.query<ItemRow>(`
        SELECT item.id, item.category_id AS categoryId, item.name, item.active,
          item.description, item.premium_extra_required AS premiumExtraRequired,
          item.premium_extra_paisa AS premiumExtraPaisa,
          variant.id AS variantId, variant.name AS variantName,
          variant.price_paisa AS pricePaisa
        FROM menu_items AS item
        JOIN menu_variants AS variant ON variant.item_id = item.id
        ORDER BY item.name, variant.price_paisa, variant.name
      `);
      const items = new Map<string, MenuItem>();
      for (const row of rows) {
        let item = items.get(row.id);
        if (!item) {
          item = {
            id: row.id, categoryId: row.categoryId, name: row.name,
            active: row.active === 1, variants: [],
            description: row.description, premiumExtraRequired: row.premiumExtraRequired === 1,
            premiumExtraPaisa: row.premiumExtraPaisa,
          };
          items.set(row.id, item);
        }
        item.variants.push({ id: row.variantId, name: row.variantName, pricePaisa: row.pricePaisa });
      }
      return [...items.values()];
    },

    async saveMenuItem(input: MenuItemInput): Promise<MenuItem> {
      validateMenuItem(input);
      const item: MenuItem = {
        id: input.id === undefined ? crypto.randomUUID() : requiredText(input.id, 'Item ID'),
        categoryId: requiredText(input.categoryId, 'Category'),
        name: requiredText(input.name, 'Item name'),
        active: input.active ?? true,
        description: input.description?.trim() ?? '',
        premiumExtraRequired: input.premiumExtraRequired ?? false,
        premiumExtraPaisa: input.premiumExtraPaisa ?? null,
        variants: input.variants.map(variant => ({
          id: variant.id === undefined ? crypto.randomUUID() : requiredText(variant.id, 'Size ID'),
          name: requiredText(variant.name, 'Size name'),
          pricePaisa: variant.pricePaisa,
        })),
      };
      await database.write([
        {
          statement: `INSERT INTO menu_items(id, category_id, name, active, description,
              premium_extra_required, premium_extra_paisa) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET category_id = excluded.category_id,
              name = excluded.name, active = excluded.active, description = excluded.description,
              premium_extra_required = excluded.premium_extra_required,
              premium_extra_paisa = excluded.premium_extra_paisa`,
          values: [item.id, item.categoryId, item.name, Number(item.active), item.description,
            Number(item.premiumExtraRequired), item.premiumExtraPaisa],
        },
        { statement: 'DELETE FROM menu_variants WHERE item_id = ?', values: [item.id] },
        ...item.variants.map(variant => ({
          statement: 'INSERT INTO menu_variants(id, item_id, name, price_paisa) VALUES (?, ?, ?, ?)',
          values: [variant.id, item.id, variant.name, variant.pricePaisa],
        })),
      ]);
      return item;
    },
  };
}

export type MenuStore = ReturnType<typeof createMenuStore>;
