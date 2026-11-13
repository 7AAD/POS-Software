import { expect, test, type Page } from '@playwright/test';

async function burger(page: Page, note = '') {
  await page.getByRole('button', { name: 'Choose Shami Burger', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Shami Burger', exact: true });
  if (note) await dialog.getByLabel('Special instructions', { exact: true }).fill(note);
  await dialog.getByRole('button', { name: 'Add to order', exact: true }).click();
}

async function save(page: Page, number: number, changes = false) {
  await page.getByRole('button', { name: changes ? 'Save changes' : 'Save order', exact: true }).click();
  await expect(page.getByRole('heading', { name: `Order #${number}`, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Order saved', exact: true })).toBeDisabled();
}

async function orders(page: Page) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Orders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Open orders', exact: true })).toBeVisible();
}

test('saves two orders offline and reopens their complete details and premium choices after restarting', async ({ page, context }) => {
  await page.goto('/#menu');
  await page.getByRole('button', { name: 'Edit Deal 8', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit menu item', exact: true });
  await editor.getByLabel('Premium extra (Rs.)', { exact: true }).fill('75');
  await editor.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.getByRole('link', { name: 'Take an order', exact: true }).click();
  await page.getByRole('button', { name: 'Delivery', exact: true }).click();
  await page.getByRole('button', { name: 'Customer and table details', exact: true }).click();
  const details = page.getByRole('dialog', { name: 'Customer and table details', exact: true });
  await details.getByLabel('Customer name (optional)', { exact: true }).fill('Ali');
  await details.getByLabel('Phone (optional)', { exact: true }).fill('03001234567');
  await details.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Deals', exact: true }).click();
  await page.getByRole('button', { name: 'Choose Deal 8', exact: true }).click();
  const deal = page.getByRole('dialog', { name: 'Add Deal 8', exact: true });
  await deal.getByLabel('Small pizza 1', { exact: true }).selectOption('menu-pizzas-tikka-small');
  await deal.getByLabel('Small pizza 2', { exact: true }).selectOption('menu-pizzas-supreme-small');
  await deal.getByLabel('Small pizza 3', { exact: true }).selectOption('menu-pizzas-malai-boti-small');
  await deal.getByLabel('Special instructions', { exact: true }).fill('No onions');
  await deal.getByRole('button', { name: 'Increase Deal 8 quantity', exact: true }).click();
  await deal.getByRole('button', { name: 'Add to order', exact: true }).click();
  await context.setOffline(true);
  await save(page, 1);
  await page.getByRole('button', { name: 'New order', exact: true }).click();
  await page.getByRole('button', { name: 'Burgers', exact: true }).click();
  await burger(page, 'Extra sauce');
  await page.getByRole('button', { name: 'Increase Shami Burger Regular quantity', exact: true }).click();
  await page.getByRole('button', { name: 'Customer and table details', exact: true }).click();
  await details.getByLabel('Table (optional)', { exact: true }).fill('3');
  await details.getByLabel('Customer name (optional)', { exact: true }).fill('Sara');
  await details.getByRole('button', { name: 'Done', exact: true }).click();
  await save(page, 2);
  await context.setOffline(false);
  await page.reload();
  await orders(page);
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.getByRole('article', { name: 'Order #1', exact: true })).toContainText('Rs. 2,700');
  await expect(page.getByRole('article', { name: 'Order #2', exact: true })).toContainText('Table 3');
  await page.getByRole('button', { name: 'Open order #1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Delivery', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const cart = page.getByRole('region', { name: 'Current Order', exact: true });
  await expect(cart).toContainText('Small pizza 2: Supreme (premium)');
  await expect(cart).toContainText('Small pizza 3: Malai Boti (premium)');
  await expect(cart).toContainText('Note: No onions');
  await page.getByRole('button', { name: 'Customer and table details', exact: true }).click();
  await expect(details.getByLabel('Customer name (optional)', { exact: true })).toHaveValue('Ali');
  await expect(details.getByLabel('Phone (optional)', { exact: true })).toHaveValue('03001234567');
  await details.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Increase Deal 8 Bundle quantity', exact: true }).click();
  await save(page, 1, true);
  await orders(page);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.getByRole('article', { name: 'Order #1', exact: true })).toContainText('Rs. 4,050');
  await page.getByRole('button', { name: 'Open order #2', exact: true }).click();
  await expect(cart.locator('.cart-total')).toContainText('Rs. 280');
  await expect(cart).toContainText('Note: Extra sauce');
});

test('switching orders offers keep, discard, and save without losing saved copies', async ({ page }) => {
  await page.goto('/#order');
  await burger(page, 'First'); await save(page, 1);
  await page.getByRole('button', { name: 'New order', exact: true }).click();
  await burger(page, 'Second'); await save(page, 2);
  await page.getByRole('button', { name: 'Increase Shami Burger Regular quantity', exact: true }).click();
  await orders(page);
  await page.getByRole('button', { name: 'Open order #1', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Save changes first?', exact: true });
  await confirm.getByRole('button', { name: 'Keep editing', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Order #2', exact: true })).toBeVisible();
  await expect(page.locator('.cart-total')).toContainText('Rs. 280');
  await orders(page);
  await page.getByRole('button', { name: 'Open order #1', exact: true }).click();
  await confirm.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Order #1', exact: true })).toBeVisible();
  await expect(page.locator('.cart-total')).toContainText('Rs. 140');
  await page.getByRole('button', { name: 'Increase Shami Burger Regular quantity', exact: true }).click();
  await page.getByRole('button', { name: 'New order', exact: true }).click();
  await confirm.getByRole('button', { name: 'Save and switch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Order', exact: true })).toBeVisible();
  await burger(page, 'Third');
  await orders(page);
  await page.getByRole('button', { name: 'Open order #2', exact: true }).click();
  await confirm.getByRole('button', { name: 'Save and switch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Order #2', exact: true })).toBeVisible();
  await expect(page.locator('.cart-total')).toContainText('Rs. 140');
  await page.getByRole('button', { name: 'Clear order', exact: true }).click();
  await page.getByRole('dialog', { name: 'Clear this order?', exact: true }).getByRole('button', { name: 'Clear order', exact: true }).click();
  await orders(page);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('article', { name: 'Order #1', exact: true })).toContainText('Rs. 280');
  await expect(page.getByRole('article', { name: 'Order #2', exact: true })).toContainText('Rs. 140');
  await expect(page.getByRole('article', { name: 'Order #3', exact: true })).toContainText('Rs. 140');
});

test('a failed save-and-switch keeps the current draft and permits a single successful retry', async ({ page }) => {
  await page.goto('/#order');
  await burger(page, 'Saved'); await save(page, 1);
  await page.getByRole('button', { name: 'New order', exact: true }).click();
  await burger(page, 'Must stay here');
  await page.getByRole('button', { name: 'Increase Shami Burger Regular quantity', exact: true }).click();
  await orders(page);
  await page.getByRole('button', { name: 'Open order #1', exact: true }).click();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    (window as unknown as { restoreOrderPut(): void }).restoreOrderPut = () => { IDBObjectStore.prototype.put = put; };
    IDBObjectStore.prototype.put = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  const confirm = page.getByRole('dialog', { name: 'Save changes first?', exact: true });
  await confirm.getByRole('button', { name: 'Save and switch', exact: true }).click();
  await expect(confirm.getByRole('alert')).toContainText('current changes are still here');
  await confirm.getByRole('button', { name: 'Keep editing', exact: true }).click();
  await expect(page.locator('.cart-total')).toContainText('Rs. 280');
  await expect(page.getByRole('region', { name: 'Current Order', exact: true })).toContainText('Must stay here');
  await expect(page.getByRole('button', { name: 'Save order', exact: true })).toBeEnabled();
  await page.evaluate(() => (window as unknown as { restoreOrderPut(): void }).restoreOrderPut());
  await save(page, 2);
  await orders(page);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.getByRole('article', { name: 'Order #2', exact: true })).toContainText('Rs. 280');
});

test('menu price changes preserve saved lines and use new prices only for new additions', async ({ page }) => {
  await page.goto('/#order');
  await burger(page); await save(page, 1);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Shami Burger', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit menu item', exact: true });
  await editor.getByLabel('Price for Regular', { exact: true }).fill('155.50');
  await editor.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await orders(page);
  await page.reload();
  await page.getByRole('button', { name: 'Open order #1', exact: true }).click();
  await expect(page.locator('.cart-total')).toContainText('Rs. 140');
  await burger(page);
  await expect(page.locator('.cart-lines > li')).toHaveCount(2);
  await expect(page.locator('.cart-total')).toContainText('Rs. 295.50');
  await save(page, 1, true);
  await orders(page);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article', { name: 'Order #1', exact: true })).toContainText('Rs. 295.50');
});

test('conflicting saved edits can be reviewed and reopened without silently overwriting them', async ({ page }) => {
  await page.goto('/#order');
  await burger(page); await save(page, 1);
  await page.evaluate(async () => {
    const modulePath = '/data/client.ts';
    const { getSavedOrderStore } = await import(modulePath);
    const store = await getSavedOrderStore();
    const [order] = await store.list();
    await store.save({ id: order.id, expectedRevision: order.revision, details: order.details,
      lines: [{ ...order.lines[0], quantity: 2 }] });
  });
  await page.getByRole('button', { name: 'Increase Shami Burger Regular quantity', exact: true }).click();
  await page.getByRole('button', { name: 'Increase Shami Burger Regular quantity', exact: true }).click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('changed elsewhere');
  await expect(page.locator('.cart-total')).toContainText('Rs. 420');
  await orders(page);
  await expect(page.getByRole('article', { name: 'Order #1', exact: true })).toContainText('Saved copy updated');
  await page.getByRole('button', { name: 'Open order #1', exact: true }).click();
  await page.getByRole('dialog', { name: 'Save changes first?', exact: true }).getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.locator('.cart-total')).toContainText('Rs. 280');
  await page.getByRole('button', { name: 'Increase Shami Burger Regular quantity', exact: true }).click();
  await save(page, 1, true);
});
