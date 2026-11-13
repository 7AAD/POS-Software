import { openDatabase } from './database';
import { createMenuStore, type MenuStore } from './menu-store';
import type { Database } from './database-types';
import { createSavedOrderStore, type SavedOrderStore } from './saved-order-store';
import { initializeSchema } from './schema';
import { importInitialMenu } from './import-initial-menu';
import { importOrderOptions } from './import-order-options';

let databasePromise: Promise<Database> | undefined;

function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await openDatabase();
      await initializeSchema(database);
      await importInitialMenu(database);
      await importOrderOptions(database);
      return database;
    })().catch(error => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

export async function getMenuStore(): Promise<MenuStore> {
  return createMenuStore(await getDatabase());
}

export async function getSavedOrderStore(): Promise<SavedOrderStore> {
  return createSavedOrderStore(await getDatabase());
}
