# Checkout and payments

The previous section is saved at `checkpoint/open-orders-cb22f0d`. This section
continues on `feature/order-taking`; `main` and the published preview stay unchanged.

## Try it on your phone

Views: [Cash checkout](screenshots/checkout-mobile.png),
[desktop checkout](screenshots/checkout-desktop.png),
[completed sale](screenshots/completed-sale-mobile.png), and
[paid orders](screenshots/paid-orders-mobile.png).

Use test orders for these checks. Original menu prices are used in the examples;
if you changed your menu, use the total shown by your app.

1. Add a Shami Burger at its original Rs. 140 price. Tap Checkout. The cart saves
   before checkout opens, so leaving checkout still keeps the unpaid order.
2. Review the customer details, instructions, choices, quantities, and total.
3. Choose Cash. Enter Rs. 200 received: the change should be **Rs. 60**.
   Entering less than the total keeps Record payment disabled. Exact amount
   fills the amount due without changing the order's price.
4. Tap Record payment. Wait for Payment recorded and the completed sale.
5. Restart the app. Open Orders → Paid orders and choose View sale. Confirm the
   original total, cash received, change, and order details are still there.
6. Start another order. In checkout choose JazzCash, Easypaisa, or Bank transfer.
   The received amount equals the full total. Check the incoming money in the
   provider/bank app, optionally enter its reference, then confirm receipt in POS.
7. Record payment. Reopen its completed sale and check the method/reference.
8. Open a completed order's old checkout screen: it should show the existing
   payment and have no Record payment button. A paid order cannot be charged again.
9. Choose View receipt to review the customer receipt from that same saved sale.

Restore any test menu edits afterward. Example premium extras used in tests are
not defaults or agreed selling fees; configure your actual extra in Menu.

## Payment behavior

- Supported methods are exactly Cash, JazzCash, Easypaisa, and bank transfer.
- Each order has one full payment in this section. Cash received can exceed the
  total; the difference is change. Digital received amounts match the total exactly.
- Digital money is received and checked outside POS. This app records the
  cashier's confirmation, method, amount, and optional reference locally.
- All calculations use integer paisa. For a Rs. 155.50 order with Rs. 200 cash,
  change is exactly Rs. 44.50. Invalid, partial, and unsafe amounts are rejected.
- Checkout uses the saved order's sale-time prices and choices. Current menu edits
  never rewrite it. A changed order revision/total requires a new review.
- Unsaved edits reached through back/forward navigation block an older checkout
  copy. Return to POS and choose Checkout to save and review the updated order.
- A successful payment atomically stores the completed sale and marks the source
  order paid. A failed write leaves it open and retains the working details.
- Retries keep the same payment ID; a unique order link prevents duplicate payments,
  including concurrent attempts and restarting after an interrupted acknowledgement.
- A completed sale is read-only. Additional purchases use a new order.

## Current scope

Open orders are the unpaid working orders. Paid orders keep their original
snapshots, method, received amount, cash change, reference, and paid time.
Payment may be recorded before or after preparing the food; this section records
financial payment and does not mark food prepared or delivered.

On-screen receipts are available from the completed sale. Printer integration,
split/partial payments, refunds, discounts, tax,
delivery charges, staff permissions, and advanced history reports remain future
tasks. No provider connection, bank credentials, fees, or tax rates are assumed.
Android stores records in native SQLite. The browser preview retains its existing
single-tab SQLite/IndexedDB storage and separate-device limits.

## Checks

Data tests exercise real SQLite transactions, each method, decimal change,
invalid/underpaid amounts, digital confirmation, stale revisions, duplicate and
concurrent payments, rollback, interrupted acknowledgements, database restart,
and version-five migration without losing open orders.

Browser tests cover the phone checkout flow for all methods, offline recording,
read-only sale recovery, premium deal snapshots, storage failure/retry, double
clicks, changed orders, and back navigation with unsaved edits. The built-site
check records/reopens a sale under `/POS-Software/` before Android packaging.
