import { openDatabase } from './database';
import { createMenuStore, type MenuStore } from './menu-store';
import { initializeSchema } from './schema';
import { importInitialMenu } from './import-initial-menu';

let storePromise: Promise<MenuStore> | undefined;

export function getMenuStore(): Promise<MenuStore> {
  if (!storePromise) {
    storePromise = (async () => {
      const database = await openDatabase();
      await initializeSchema(database);
      await importInitialMenu(database);
      return createMenuStore(database);
    })().catch(error => {
      storePromise = undefined;
      throw error;
    });
  }
  return storePromise;
}
