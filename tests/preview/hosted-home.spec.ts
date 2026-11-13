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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
