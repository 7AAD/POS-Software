import { expect, test } from '@playwright/test';

test('the menu is grouped in printed order and edits keep their place', async ({ page }) => {
  await page.goto('/#menu');
  const headings = page.getByRole('heading', { level: 2 });
  await expect(headings).toHaveText([
    'Burgers', 'Shawarmas', 'Sandwiches', 'Fries', 'Loaded Fries',
    'Snacks', 'Dip Sauce', 'Pizzas', 'Juice', 'Deals',
  ]);
  const burgers = page.getByRole('region', { name: 'Burgers', exact: true });
  await expect(burgers.getByRole('heading', { level: 3 }).first()).toHaveText('Shami Burger');
  const deals = page.getByRole('region', { name: 'Deals', exact: true });
  await expect(deals.getByRole('heading', { level: 3 }))
    .toHaveText(Array.from({ length: 12 }, (_, index) => `Deal ${index + 1}`));
  await burgers.getByRole('button', { name: 'Edit Shami Burger', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit menu item' });
  await dialog.getByLabel('Item name', { exact: true }).fill('ZZ Owner Burger');
  await dialog.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(burgers.getByRole('heading', { level: 3 }).first()).toHaveText('ZZ Owner Burger');
  await page.reload();
  await expect(burgers.getByRole('heading', { level: 3 }).first()).toHaveText('ZZ Owner Burger');
  await page.getByLabel('Search items', { exact: true }).fill('shawarma');
  await expect(headings).toHaveText(['Shawarmas']);
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByLabel('Search items', { exact: true }).fill('');
  await page.getByLabel('Category', { exact: true }).selectOption({ label: 'Deals' });
  await expect(headings).toHaveText(['Deals']);
  await expect(page.getByRole('article')).toHaveCount(12);
});

test('existing imported items can be edited offline and edits survive reload', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Manage menu' }).click();
  const original = page.getByRole('article', { name: 'Shami Burger', exact: true });
  await expect(original).toContainText('Rs. 140');
  await original.getByRole('button', { name: 'Edit Shami Burger', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit menu item' });
  await dialog.getByLabel('Item name', { exact: true }).fill('Shami Special');
  await dialog.getByLabel('Price for Regular', { exact: true }).fill('155.50');
  await dialog.getByLabel('Available', { exact: true }).uncheck();
  await context.setOffline(true);
  await dialog.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const edited = page.getByRole('article', { name: 'Shami Special', exact: true });
  await expect(edited).toContainText('Rs. 155.50');
  await expect(edited).toContainText('Unavailable');
  await context.setOffline(false);
  await page.reload();
  await expect(edited).toContainText('Rs. 155.50');
  await expect(page.getByRole('article', { name: 'Shami Burger', exact: true })).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('dd')).toHaveText(['10', '52']);
});

test('items can be added and their named sizes edited or removed', async ({ page }) => {
  await page.goto('/#menu');
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Item name', { exact: true }).fill('Test Pizza');
  await dialog.getByLabel('Category', { exact: true }).selectOption({ label: 'Pizzas' });
  await dialog.getByLabel('Size 1', { exact: true }).fill('Small');
  await dialog.getByLabel('Price for Small', { exact: true }).fill('350');
  await dialog.getByRole('button', { name: 'Add size', exact: true }).click();
  await dialog.getByLabel('Size 2', { exact: true }).fill('Large');
  await dialog.getByLabel('Price for Large', { exact: true }).fill('650');
  await dialog.getByRole('button', { name: 'Save item', exact: true }).click();
  const item = page.getByRole('article', { name: 'Test Pizza', exact: true });
  await expect(dialog).not.toBeVisible();
  await expect(item).toContainText('Rs. 350');
  await expect(item).toContainText('Rs. 650');
  await item.getByRole('button', { name: 'Edit Test Pizza', exact: true }).click();
  await dialog.getByRole('button', { name: 'Remove Small size', exact: true }).click();
  await dialog.getByLabel('Price for Large', { exact: true }).fill('675');
  await dialog.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(item).toContainText('Rs. 675');
  await expect(item).not.toContainText('Small');
  await page.getByLabel('Search items', { exact: true }).fill('test pizza');
  await expect(page.getByRole('article')).toHaveCount(1);
});

test('categories can be added and renamed without losing their items', async ({ page }) => {
  await page.goto('/#menu');
  await page.getByRole('button', { name: 'Categories', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Manage categories' });
  await dialog.getByLabel('Category name', { exact: true }).fill('Sauces');
  await dialog.getByRole('button', { name: 'Add category', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Rename Sauces', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close editor', exact: true }).click();
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  const itemDialog = page.getByRole('dialog', { name: 'Add menu item' });
  await itemDialog.getByLabel('Item name', { exact: true }).fill('Garlic Dip');
  await itemDialog.getByLabel('Category', { exact: true }).selectOption({ label: 'Sauces' });
  await itemDialog.getByLabel('Price for Regular', { exact: true }).fill('50');
  await itemDialog.getByRole('button', { name: 'Save item', exact: true }).click();
  await page.getByRole('button', { name: 'Categories', exact: true }).click();
  await dialog.getByRole('button', { name: 'Rename Sauces', exact: true }).click();
  await dialog.getByLabel('Category name', { exact: true }).fill('Dips & Extras');
  await dialog.getByRole('button', { name: 'Save category', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close editor', exact: true }).click();
  await page.reload();
  await page.getByLabel('Category', { exact: true }).selectOption({ label: 'Dips & Extras' });
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toContainText('Garlic Dip');
});

test('deal contents and premium extras are editable without guessing a fee', async ({ page }) => {
  await page.goto('/#menu');
  const deal = page.getByRole('article', { name: 'Deal 7', exact: true });
  await expect(deal).toContainText('amount not set');
  await deal.getByRole('button', { name: 'Edit Deal 7', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit menu item' });
  await expect(dialog.getByLabel('Premium option costs extra', { exact: true })).toBeChecked();
  await expect(dialog.getByLabel('Premium extra (Rs.)', { exact: true })).toHaveValue('');
  await dialog.getByLabel('Premium extra (Rs.)', { exact: true }).fill('75');
  await dialog.getByLabel('Details / deal contents', { exact: true }).fill('Owner-edited pizza deal');
  await dialog.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(deal).toContainText('Owner-edited pizza deal');
  await expect(deal).toContainText('Rs. 75');
});

test('duplicate names fail safely and cancelling discards unsaved edits', async ({ page }) => {
  await page.goto('/#menu');
  const item = page.getByRole('article', { name: 'Shami Burger', exact: true });
  await item.getByRole('button', { name: 'Edit Shami Burger', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Item name', { exact: true }).fill('Zinger Burger');
  await dialog.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('already exists');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(item).toContainText('Rs. 140');
  await expect(item).toContainText('Available');
});
