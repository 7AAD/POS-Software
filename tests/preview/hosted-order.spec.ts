import { expect, test } from '@playwright/test';

test('the built order screen works at its hosted path with exact prices', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#order');
  await expect(page.getByRole('heading', { name: 'New Order' })).toBeVisible();
  await page.getByRole('button', { name: 'Pizzas', exact: true }).click();
  await page.getByRole('button', { name: 'Choose Tikka', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Tikka', exact: true });
  await dialog.getByLabel('Size / portion', { exact: true }).selectOption({ label: 'Small · Rs. 400' });
  await dialog.getByRole('button', { name: 'Add to order', exact: true }).click();
  await expect(page.locator('.cart-total')).toContainText('Rs. 400');
  await page.getByRole('button', { name: 'Save order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Order #1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Order saved', exact: true })).toBeDisabled();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Orders', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Open order #1', exact: true }).click();
  await expect(page.locator('.cart-total')).toContainText('Rs. 400');
  expect(page.url()).toContain('#order');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
