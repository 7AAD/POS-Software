import { expect, test } from '@playwright/test';

test('the built home and SQLite engine work under the GitHub Pages path', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const engine = page.waitForResponse(response =>
    response.url().includes('/POS-Software/assets/sql-wasm-browser.wasm'),
  );
  await page.goto('./');
  expect((await engine).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Menu storage is ready' })).toBeVisible();
  await expect(page.getByText('MASTER FOODS', { exact: true })).toBeVisible();
  await expect(page.locator('dd')).toHaveText(['10', '52']);
  await page.getByRole('link', { name: 'Manage menu' }).click();
  const item = page.getByRole('article', { name: 'Shami Burger', exact: true });
  await item.getByRole('button', { name: 'Edit Shami Burger', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit menu item' });
  await dialog.getByLabel('Price for Regular', { exact: true }).fill('145');
  await dialog.getByRole('button', { name: 'Save item', exact: true }).click();
  await page.reload();
  await expect(item).toContainText('Rs. 145');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
