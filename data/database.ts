import { Capacitor } from '@capacitor/core';
import type { Database } from './database-types';

export async function openDatabase(): Promise<Database> {
  if (Capacitor.isNativePlatform()) {
    const { openNativeDatabase } = await import('./native-sqlite');
    return openNativeDatabase();
  }
  const { openWebDatabase } = await import('./web-sqlite');
  return openWebDatabase();
}
