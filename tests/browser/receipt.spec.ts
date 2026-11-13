import { expect, test } from '@playwright/test';

test('a cash receipt keeps its original sale details after menu edits, reload, and repeated viewing', async ({ page, context }) => {
  await page.goto('/#order');
  await page.getByRole('button', { name: 'Choose Shami Burger', exact: true }).click();
  const item = page.getByRole('dialog', { name: 'Add Shami Burger', exact: true });
  await item.getByLabel('Special instructions', { exact: true }).fill('No onions');
  await item.getByRole('button', { name: 'Add to order', exact: true }).click();
  await page.getByRole('button', { name: 'Customer and table details', exact: true }).click();
  const details = page.getByRole('dialog', { name: 'Customer and table details', exact: true });
  await details.getByLabel('Table (optional)', { exact: true }).fill('3');
  await details.getByLabel('Customer name (optional)', { exact: true }).fill('Sara');
  await details.getByLabel('Phone (optional)', { exact: true }).fill('03001234567');
  await details.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await page.getByLabel('Cash received (Rs.)', { exact: true }).fill('200');
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Completed sale', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('link', { name: 'View receipt', exact: true }).click();
  const receipt = page.getByRole('article', { name: 'Receipt for order #1', exact: true });
  await expect(receipt).toContainText('MASTER FOODS');
  await expect(receipt).toContainText('PAID');
  await expect(receipt).toContainText('Sara');
  await expect(receipt).toContainText('03001234567');
  await expect(receipt).toContainText('Dine-in');
  await expect(receipt).toContainText('Table3');
  await expect(receipt).toContainText('1 × Shami Burger');
  await expect(receipt).toContainText('Note: No onions');
  await expect(receipt.locator('.receipt-total')).toContainText('Rs. 140');
  await expect(receipt.locator('.receipt-payment')).toContainText('Cash');
  await expect(receipt.locator('.receipt-payment')).toContainText('Amount receivedRs. 200');
  await expect(receipt.locator('.receipt-payment')).toContainText('ChangeRs. 60');
  const paidTime = await receipt.locator('time').getAttribute('datetime');
  await context.setOffline(false);
  await page.reload();
  await expect(receipt).toBeVisible();
  await expect(receipt.locator('time')).toHaveAttribute('datetime', paidTime!);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Shami Burger', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit menu item', exact: true });
  await editor.getByLabel('Item name', { exact: true }).fill('Owner Burger');
  await editor.getByLabel('Price for Regular', { exact: true }).fill('155.50');
  await editor.getByRole('button', { name: 'Save item', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Orders', exact: true }).click();
  await page.getByRole('button', { name: 'Paid orders', exact: true }).click();
  await page.getByRole('link', { name: 'View sale for order #1', exact: true }).click();
  await page.getByRole('link', { name: 'View receipt', exact: true }).click();
  await expect(receipt).toContainText('Shami Burger');
  await expect(receipt).not.toContainText('Owner Burger');
  await expect(receipt.locator('.receipt-total')).toContainText('Rs. 140');
  await expect(receipt.locator('time')).toHaveAttribute('datetime', paidTime!);
  await expect(page.getByRole('button', { name: 'Record payment', exact: true })).toHaveCount(0);
  const sales = await page.evaluate(async () => {
    const path = '/data/client.ts';
    const { getSalesStore } = await import(path);
    return (await (await getSalesStore()).list()).length;
  });
  expect(sales).toBe(1);
});

test('a long digital receipt shows all lines, deal choices, premium amounts, and its saved reference', async ({ page }) => {
  await page.goto('/#order');
  await page.getByRole('button', { name: 'Choose Shami Burger', exact: true }).waitFor();
  const saleId = await page.evaluate(async () => {
    const clientPath = '/data/client.ts';
    const cartPath = '/data/order-cart.ts';
    const { getMenuStore, getSavedOrderStore, getSalesStore } = await import(clientPath);
    const { createCartLine } = await import(cartPath);
    const menu = await (await getMenuStore()).listMenuItems();
    const burger = menu.find((entry: { name: string }) => entry.name === 'Shami Burger');
    const deal = { ...menu.find((entry: { name: string }) => entry.name === 'Deal 8'), premiumExtraPaisa: 7500 };
    const lines = Array.from({ length: 12 }, (_, index) =>
      createCartLine(burger, menu, burger.variants[0].id, 1, {}, `Burger instructions ${index + 1}`));
    lines.push(createCartLine(deal, menu, deal.variants[0].id, 2, {
      'pizza:0': 'menu-pizzas-tikka-small', 'pizza:1': 'menu-pizzas-supreme-small', 'pizza:2': 'menu-pizzas-malai-boti-small',
    }, 'Last item instructions'));
    const order = await (await getSavedOrderStore()).save({ id: 'long-receipt-order', expectedRevision: 0,
      details: { type: 'takeaway', table: '', customerName: 'Long test order', customerPhone: '' }, lines });
    const sale = await (await getSalesStore()).pay({ id: 'long-receipt-payment', orderId: order.id,
      expectedRevision: order.revision, expectedTotalPaisa: order.totalPaisa, method: 'bank-transfer',
      receivedPaisa: order.totalPaisa, confirmedReceived: true, reference: 'BANK-123' });
    return sale.id;
  });
  await page.goto(`/#receipt/${saleId}`);
  const receipt = page.getByRole('article', { name: 'Receipt for order #1', exact: true });
  await expect(receipt.locator('.receipt-items > li')).toHaveCount(13);
  await expect(receipt).toContainText('2 × Deal 8');
  await expect(receipt).toContainText('Small pizza 2: Supreme (premium)');
  await expect(receipt).toContainText('Small pizza 3: Malai Boti (premium)');
  await expect(receipt).toContainText('Includes Rs. 150 premium extras per bundle.');
  await expect(receipt).toContainText('Last item instructions');
  await expect(receipt.locator('.receipt-total')).toContainText('Rs. 4,380');
  await expect(receipt.locator('.receipt-payment')).toContainText('Bank transfer');
  await expect(receipt.locator('.receipt-payment')).toContainText('BANK-123');
  await expect(receipt.getByText('Change', { exact: true })).toHaveCount(0);
  await receipt.getByText('Thank you for your order!', { exact: true }).scrollIntoViewIfNeeded();
  await expect(receipt.getByText('Thank you for your order!', { exact: true })).toBeVisible();
  const last = await receipt.locator('.receipt-items > li').last().boundingBox();
  const paper = await receipt.boundingBox();
  expect(last!.y + last!.height).toBeLessThan(paper!.y + paper!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a missing sale shows a recoverable error without creating a receipt or payment', async ({ page }) => {
  await page.goto('/#receipt/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Receipt could not be opened', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('stored sale has not been changed');
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('link', { name: 'Paid orders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No paid orders yet', exact: true })).toBeVisible();
});
