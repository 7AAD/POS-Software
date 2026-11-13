# Order-taking segment

This segment is on `feature/order-taking`. Keep it there through the remaining
ordering segments; do not merge or deploy the website before the final segment.
The GitHub Pages link still shows the version on `main`.

## Try this segment

Run `npm ci` and `npm run dev`, then open the address Vite reports and choose
**Take an order**. On Android, install an APK built from this branch, then choose
the same button. In GitHub, run **Actions → Build Android APK → Run workflow**
with branch **feature/order-taking** to create that APK.

The POS screen follows the compact reference: Dine-in/Takeaway/Delivery tabs,
category chips, two-column food cards, and Current Order below the menu on phones.
Scroll the cards to find more items. The header's search button searches the whole
menu; its person button opens customer and table details. Bottom navigation opens
Home, POS, Orders, and Menu. Save order keeps the cart on this device;
payment comes in the checkout segment. See [saving and reopening orders](open-orders.md).

1. Choose Shami Burger, add an instruction, and increase quantity to two.
   The total should be Rs. 280. Add the same selection/instruction again:
   it combines into quantity three, totalling Rs. 420.
2. Choose the Shawarmas category, add Chicken Shawarma, choose Large, and check the Rs. 200 price. Change a
   quantity, then remove a line. Totals should update immediately.
3. Choose Menu in the bottom bar and change Shami Burger's price. Return to POS.
   The already-added line keeps its old price; adding it again uses the new price
   and creates a separate line. Customer details also stay through navigation.
4. Choose the Deals category and open Deal 8. It requires three Small pizza choices. Base flavours work at the
   listed deal price. Premium choices stay disabled until an extra is set.
5. In Menu, edit Deal 8 and set a test premium extra, for example Rs. 75.
   Return to POS → Deals → Deal 8 and choose Tikka, Supreme, and Malai Boti, quantity two.
   Expected: (Rs. 1,200 + Rs. 75 + Rs. 75) × 2 = **Rs. 2,700**.
   This example is a test amount, not a default or agreed selling fee.
6. Mark Tikka unavailable in Manage menu. Both its standalone Add button and
   linked deal choices become unavailable for new selections.
7. Edit a deal and expand **Order choices**. Change its labels, required counts,
   options, links, or Premium marks. Save and reopen to check persistence.
8. Try clearing a cart: Keep order cancels; Clear order removes items and customer
   details. After loading the app, these order interactions also work offline.

Use a test browser/profile or restore test menu prices and availability afterward.
Menu settings are saved; tap Save order to keep a cart. A saved open order is
unfinished and has not been paid or completed.

## Pricing and choices

- Deal choices are structured alongside the editable contents text. The initial
  choices follow the reviewed photos: Small pizza counts for Deals 7–8, Medium
  for 9–11, Large for 12, and 250/350 ml NR choices for Deals 1, 2, and 4.
- Tikka, Fajita, and Vegetable are base flavours. Supreme, Malai Boti, Kababish,
  Kabab Crust, Crown Crust, Cheese Crust, and Lazania are premium.
- Small Crown Crust, Cheese Crust, and Lazania are not offered in the reviewed
  menu; those Small choices have not been invented.
- Each selected premium pizza adds that deal's configured extra. Bundle quantity
  multiplies both the base price and all selected extras. Missing extras cannot
  become zero charges. Standalone pizzas already use their listed size price.
- A linked choice follows the menu item's current name and availability, but
  ignores its standalone price. Removing the linked size disables the choice.
  Custom choices have their own names and are controlled by the deal editor.
- Fries and Zinger Shawarmas in deals retain the printed wording without added
  sizes. Drink brands and extra charges have not been invented.
- Changing contents text does not rewrite configured choices. Review both when
  changing a deal. Earlier owner-edited contents are left for manual setup.
- All amounts and totals use integer paisa. Unsafe totals and quantities outside
  1–99 are rejected before changing the cart.

## Current limits

Saved open orders survive closing or reloading; reopen them from Orders. Unsaved
drafts and edits stay in memory, and browsers warn before leaving where supported.
Payment, receipts, discounts, tax, delivery charges, addresses, and staff access
remain future tasks. Native behavior still needs a test on the shop's Android phone.

## Automated checks

`npm test` covers the real SQLite migration/import, editable choices, per-pizza
premium maths, price snapshots, line merging, invalid inputs, and safe totals.
`npm run test:browser` exercises the menu and order flows with isolated storage.
After `npm run build`, `npm run test:preview` checks the actual build under the
GitHub Pages repository path. `npm run android:sync` packages it for Android.
