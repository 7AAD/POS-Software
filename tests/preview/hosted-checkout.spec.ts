import { expect, test } from '@playwright/test';

test('the built checkout stores one paid sale at the repository path and restores it after reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#order');
  await page.getByRole('button', { name: 'Choose Shami Burger', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to order', exact: true }).click();
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await page.getByLabel('Cash received (Rs.)', { exact: true }).fill('200');
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  const payment = page.getByRole('region', { name: 'Payment details', exact: true });
  await expect(payment).toContainText('Change to returnRs. 60');
  await page.reload();
  await expect(payment).toContainText('Total paidRs. 140');
  await expect(page.getByRole('button', { name: 'Record payment', exact: true })).toHaveCount(0);
  expect(page.url()).toContain('/POS-Software/#sale/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
