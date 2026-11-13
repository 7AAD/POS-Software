import { expect, test, type Page } from '@playwright/test';

async function addBurger(page: Page) {
  await page.getByRole('button', { name: 'Choose Shami Burger', exact: true }).click();
  const item = page.getByRole('dialog', { name: 'Add Shami Burger', exact: true });
  await item.getByLabel('Special instructions', { exact: true }).fill('No onions');
  await item.getByRole('button', { name: 'Add to order', exact: true }).click();
}

async function checkout(page: Page) {
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cash', exact: true })).toBeVisible();
}

async function paidOrders(page: Page) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Orders', exact: true }).click();
  await page.getByRole('group', { name: 'Order lists', exact: true }).getByRole('button', { name: 'Paid orders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Paid orders', exact: true })).toBeVisible();
}

test('cash checkout keeps exact decimal change, customer details, and a read-only sale after restart', async ({ page }) => {
  await page.goto('/#menu');
  await page.getByRole('button', { name: 'Edit Shami Burger', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit menu item', exact: true });
  await editor.getByLabel('Price for Regular', { exact: true }).fill('155.50');
  await editor.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.getByRole('link', { name: 'Take an order', exact: true }).click();
  await addBurger(page);
  await page.getByRole('button', { name: 'Customer and table details', exact: true }).click();
  const details = page.getByRole('dialog', { name: 'Customer and table details', exact: true });
  await details.getByLabel('Customer name (optional)', { exact: true }).fill('Sara');
  await details.getByLabel('Table (optional)', { exact: true }).fill('3');
  await details.getByRole('button', { name: 'Done', exact: true }).click();
  await checkout(page);
  const originalCheckout = page.url();
  await page.getByLabel('Cash received (Rs.)', { exact: true }).fill('50');
  await expect(page.getByRole('button', { name: 'Record payment', exact: true })).toBeDisabled();
  await expect(page.getByText('Rs. 105.50 more is needed to pay this order.', { exact: true })).toBeVisible();
  await page.getByLabel('Cash received (Rs.)', { exact: true }).fill('200');
  await expect(page.locator('.payment-amounts')).toContainText('Rs. 44.50');
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Completed sale', exact: true })).toBeVisible();
  const payment = page.getByRole('region', { name: 'Payment details', exact: true });
  await expect(payment).toContainText('Total paidRs. 155.50');
  await expect(payment).toContainText('Change to returnRs. 44.50');
  await expect(page.getByRole('region', { name: 'Order details', exact: true })).toContainText('Sara');
  await paidOrders(page);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('link', { name: 'View sale for order #1', exact: true }).click();
  await expect(payment).toContainText('Rs. 155.50');
  await expect(page.getByRole('region', { name: 'Order details', exact: true })).toContainText('Note: No onions');
  await expect(page.getByRole('button', { name: 'Record payment', exact: true })).toHaveCount(0);
  await page.goto(originalCheckout);
  await expect(page.getByRole('status')).toHaveText('Payment already recorded');
  await expect(page.getByRole('button', { name: 'Record payment', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'New order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Order', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Current Order', exact: true })).toContainText('0 items');
});

for (const method of ['JazzCash', 'Easypaisa', 'Bank transfer']) {
  test(`${method} requires receipt confirmation and records the full payment offline`, async ({ page, context }) => {
    await page.goto('/#order'); await addBurger(page); await checkout(page);
    await page.getByRole('button', { name: method, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Record payment', exact: true })).toBeDisabled();
    await page.getByLabel('Transaction reference (optional)', { exact: true }).fill('Transfer 123');
    await page.getByLabel('I confirmed the money was received', { exact: true }).check();
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Record payment', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Completed sale', exact: true })).toBeVisible();
    const payment = page.getByRole('region', { name: 'Payment details', exact: true });
    await expect(payment).toContainText(`Paid · ${method}`);
    await expect(payment).toContainText('Transfer 123');
    await expect(payment).toContainText('Total paidRs. 140');
    await expect(payment.getByText('Change to return', { exact: true })).toHaveCount(0);
    await context.setOffline(false);
    await page.reload();
    await expect(payment).toContainText(`Paid · ${method}`);
    await paidOrders(page);
    await expect(page.getByRole('article')).toHaveCount(1);
  });
}

test('failed payment storage keeps the order open and a double retry creates one sale', async ({ page }) => {
  await page.goto('/#order'); await addBurger(page); await checkout(page);
  await page.getByRole('button', { name: 'Exact amount', exact: true }).click();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    (window as unknown as { restorePaymentPut(): void }).restorePaymentPut = () => { IDBObjectStore.prototype.put = put; };
    IDBObjectStore.prototype.put = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not confirm the payment record');
  await expect(page.getByLabel('Cash received (Rs.)', { exact: true })).toHaveValue('140.00');
  const remaining = await page.evaluate(async () => {
    const path = '/data/client.ts';
    const { getSavedOrderStore, getSalesStore } = await import(path);
    return { open: (await (await getSavedOrderStore()).list()).length, paid: (await (await getSalesStore()).list()).length };
  });
  expect(remaining).toEqual({ open: 1, paid: 0 });
  await page.evaluate(() => (window as unknown as { restorePaymentPut(): void }).restorePaymentPut());
  await page.getByRole('button', { name: 'Record payment', exact: true }).evaluate(element => {
    (element as HTMLButtonElement).click(); (element as HTMLButtonElement).click();
  });
  await expect(page.getByRole('heading', { name: 'Completed sale', exact: true })).toBeVisible();
  await paidOrders(page); await page.reload();
  await expect(page.getByRole('article')).toHaveCount(1);
});

test('a changed saved order must be reviewed again before taking payment', async ({ page }) => {
  await page.goto('/#order'); await addBurger(page); await checkout(page);
  await page.evaluate(async () => {
    const path = '/data/client.ts';
    const { getSavedOrderStore } = await import(path);
    const store = await getSavedOrderStore();
    const [order] = await store.list();
    await store.save({ id: order.id, expectedRevision: order.revision,
      details: order.details, lines: [{ ...order.lines[0], quantity: 2 }] });
  });
  await page.getByLabel('Cash received (Rs.)', { exact: true }).fill('300');
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('changed elsewhere');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Orders', exact: true }).click();
  await page.getByRole('button', { name: 'Open order #1', exact: true }).click();
  await expect(page.locator('.cart-total')).toContainText('Rs. 280');
  await checkout(page);
  await page.getByRole('button', { name: 'Exact amount', exact: true }).click();
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Payment details', exact: true })).toContainText('Total paidRs. 280');
});

test('completed pizza deals preserve each flavour, premium charge, and bundle quantity', async ({ page }) => {
  await page.goto('/#menu');
  await page.getByRole('button', { name: 'Edit Deal 8', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit menu item', exact: true });
  await editor.getByLabel('Premium extra (Rs.)', { exact: true }).fill('75');
  await editor.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.getByRole('link', { name: 'Take an order', exact: true }).click();
  await page.getByRole('button', { name: 'Deals', exact: true }).click();
  await page.getByRole('button', { name: 'Choose Deal 8', exact: true }).click();
  const item = page.getByRole('dialog', { name: 'Add Deal 8', exact: true });
  await item.getByLabel('Small pizza 1', { exact: true }).selectOption('menu-pizzas-tikka-small');
  await item.getByLabel('Small pizza 2', { exact: true }).selectOption('menu-pizzas-supreme-small');
  await item.getByLabel('Small pizza 3', { exact: true }).selectOption('menu-pizzas-malai-boti-small');
  await item.getByRole('button', { name: 'Increase Deal 8 quantity', exact: true }).click();
  await item.getByRole('button', { name: 'Add to order', exact: true }).click();
  await checkout(page);
  await page.getByLabel('Cash received (Rs.)', { exact: true }).fill('3000');
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Payment details', exact: true })).toContainText('Change to returnRs. 300');
  await page.reload();
  const order = page.getByRole('region', { name: 'Order details', exact: true });
  await expect(order).toContainText('2 × Deal 8');
  await expect(order).toContainText('Small pizza 2: Supreme (premium)');
  await expect(order).toContainText('Small pizza 3: Malai Boti (premium)');
  await expect(order).toContainText('Rs. 2,700');
});

test('back navigation cannot pay an older saved copy while the current cart has unsaved edits', async ({ page }) => {
  await page.goto('/#order'); await addBurger(page); await checkout(page);
  await page.getByRole('link', { name: 'Back to POS', exact: true }).click();
  await page.getByRole('button', { name: 'Increase Shami Burger Regular quantity', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Save changes before checkout', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record payment', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Review unsaved changes', exact: true }).click();
  await expect(page.locator('.cart-total')).toContainText('Rs. 280');
  await checkout(page);
  await page.getByRole('button', { name: 'Exact amount', exact: true }).click();
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Payment details', exact: true })).toContainText('Total paidRs. 280');
});
