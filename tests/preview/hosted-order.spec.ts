import { expect, test } from '@playwright/test';

test('the built order screen works at its hosted path with exact prices', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#order');
  await expect(page.getByRole('heading', { name: 'What’s cooking?' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose Tikka', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Tikka', exact: true });
  await dialog.getByLabel('Size / portion', { exact: true }).selectOption({ label: 'Small · Rs. 400' });
  await dialog.getByRole('button', { name: 'Add to order', exact: true }).click();
  await expect(page.locator('.cart-total')).toContainText('Rs. 400');
  await page.getByRole('link', { name: 'View order · 1 Rs. 400' }).click();
  await expect(page.getByRole('region', { name: 'Your cart', exact: true })).toBeFocused();
  expect(page.url()).toContain('#order');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
