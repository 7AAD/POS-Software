import { useEffect, useState } from 'react';
import { getMenuStore } from './client';
import type { Category, CategoryInput, MenuItem, MenuItemInput } from './menu-types';
import { updateMenuEntry } from './update-menu-entry';

interface EditorState {
  loading: boolean;
  error: boolean;
  categories: Category[];
  items: MenuItem[];
}

export function useMenuEditor() {
  const [state, setState] = useState<EditorState>({ loading: true, error: false, categories: [], items: [] });
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const store = await getMenuStore();
        const [categories, items] = await Promise.all([store.listCategories(), store.listMenuItems()]);
        if (!cancelled) setState({ loading: false, error: false, categories, items });
      } catch (error) {
        console.error('Could not load the menu:', error);
        if (!cancelled) setState(previous => ({ ...previous, loading: false, error: true }));
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function saveItem(input: MenuItemInput) {
    const saved = await (await getMenuStore()).saveMenuItem(input);
    setState(previous => ({ ...previous,
      items: updateMenuEntry(previous.items, saved),
    }));
  }

  async function saveCategory(input: CategoryInput) {
    const saved = await (await getMenuStore()).saveCategory(input);
    setState(previous => ({ ...previous,
      categories: updateMenuEntry(previous.categories, saved),
    }));
  }

  return { ...state, saveItem, saveCategory };
}
