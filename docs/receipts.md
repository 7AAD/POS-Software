# On-screen receipt layout

The checkout section is saved at `checkpoint/checkout-6515a76`. Receipt work
continues on `feature/order-taking`; `main` and the public preview stay unchanged.

Examples: [cash receipt](screenshots/receipt-mobile.png),
[digital receipt](screenshots/receipt-digital-mobile.png), and
[receipt screen](screenshots/receipt-screen-mobile.png). These images use test orders.

## Try it on your phone

1. Complete a test checkout. From the completed sale, tap **View receipt**.
2. Check Master Foods, the order number, Paid status, paid date/time, order type,
   and any saved table/customer details.
3. Check each item's quantity, name, size, unit price, and line total. Saved deal
   choices, premium extras, contents, and special instructions should be visible.
4. Check the total, payment method, amount received, and cash change. A saved
   digital reference appears when provided; cash change is shown for cash receipts.
5. Use Back to sale or Paid orders to return. To find it after restarting, open
   Orders → Paid orders → View sale → View receipt.
6. Change a menu name or price, then reopen the same receipt. Its earlier sale
   details and paid time stay unchanged. Viewing it never records another payment.
7. Scroll a long receipt to the final item and thank-you message. The whole bill
   stays on the page, without a short internal list that hides later items.

## Design and data

The receipt uses a light paper card, dark text, the Master Foods logo/name, and
orange accents within the existing app. It adapts to phone and desktop widths.
It uses the saved order number as its identifier; opening it creates no new number.
The paid time comes from the completed sale, not the time the receipt is viewed.

`pages/Receipt.tsx` uses the existing `useSales` loader. `ReceiptDocument.tsx`
renders that completed sale with the shared money formatter, payment labels,
order-type labels, and `OrderLineDetails`. No database migration or new write
operation was introduced. Missing sales show a retry state without a false receipt.

The only shop identity provided is Master Foods. No shop address, merchant phone,
tax registration, tax rate, delivery fee, or printer setting has been invented.
The current total and premium extras are exactly those recorded at checkout.

## Scope and checks

This section covers the on-screen layout. Printer connection, paper width,
physical printing, and file export are separate features once the printer is chosen.

Browser checks cover offline viewing after loading, reload, unchanged receipts
after menu edits, no extra payments from viewing, long orders, premium choices,
digital references, and missing records. The built-site check opens and reloads
the receipt under `/POS-Software/`. Android packages the same screen for offline use.
