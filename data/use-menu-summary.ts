import { useEffect, useState } from 'react';
import { getMenuStore } from './client';

type MenuSummary =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; categories: number; items: number };

export function useMenuSummary() {
  const [summary, setSummary] = useState<MenuSummary>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const store = await getMenuStore();
        const [categories, items] = await Promise.all([
          store.listCategories(), store.listMenuItems(),
        ]);
        if (!cancelled) setSummary({ status: 'ready', categories: categories.length, items: items.length });
      } catch (error) {
        console.error('Could not open the local menu database:', error);
        if (!cancelled) setSummary({ status: 'error' });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  function retry() {
    window.location.reload();
  }

  return { summary, retry };
}
