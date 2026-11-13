import { expect, test } from '@playwright/test';

test('mobile home opens a real empty SQLite database', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Menu storage is ready' })).toBeVisible();
  await expect(page.getByText('No menu items yet.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('menu writes work offline and persist across a page reload', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Menu storage is ready' })).toBeVisible();

  // Access the same data layer as the app, without adding a temporary editor.
  await page.evaluate(async () => {
    const modulePath = '/data/client.ts';
    const { getMenuStore } = await import(modulePath);
    (window as unknown as { menuStore: unknown }).menuStore = await getMenuStore();
  });
  await context.setOffline(true);
  const saved = await page.evaluate(async () => {
    const store = (window as unknown as {
      menuStore: import('../../data/menu-store').MenuStore;
    }).menuStore;
    const category = await store.saveCategory({ name: 'Test drinks' });
    await store.saveMenuItem({
      categoryId: category.id, name: 'Test juice',
      variants: [{ name: 'Small', pricePaisa: 15000 }, { name: 'Large', pricePaisa: 25000 }],
    });
    return store.listMenuItems();
  });
  expect(saved[0].variants.map(variant => variant.pricePaisa)).toEqual([15000, 25000]);

  // This web preview is not a PWA; restore asset access before reloading.
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Menu storage is ready' })).toBeVisible();
  await expect(page.locator('dd')).toHaveText(['1', '1']);
  const reopened = await page.evaluate(async () => {
    const modulePath = '/data/client.ts';
    const { getMenuStore } = await import(modulePath);
    return (await getMenuStore()).listMenuItems();
  });
  expect(reopened).toEqual(saved);
});

test('database opening failure shows an error and can be retried', async ({ page }) => {
  await page.route('**/sql-wasm-browser.wasm', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Please try again');
  await page.unroute('**/sql-wasm-browser.wasm');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Menu storage is ready' })).toBeVisible();
});

test('a failed durable save leaves the current and reopened menu unchanged', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Menu storage is ready' })).toBeVisible();
  const result = await page.evaluate(async () => {
    const modulePath = '/data/client.ts';
    const { getMenuStore } = await import(modulePath);
    const store = await getMenuStore();
    await store.saveCategory({ name: 'Original category' });
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
    let rejected = false;
    try {
      await store.saveCategory({ name: 'Unsaved category' });
    } catch {
      rejected = true;
    } finally {
      IDBObjectStore.prototype.put = originalPut;
    }
    return { rejected, categories: await store.listCategories() };
  });
  expect(result.rejected).toBe(true);
  expect(result.categories.map((category: { name: string }) => category.name)).toEqual(['Original category']);
  await page.reload();
  await expect(page.locator('dd')).toHaveText(['1', '0']);
});
