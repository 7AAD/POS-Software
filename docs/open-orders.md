# Saving and reopening orders

The previous order-taking section is saved at Git tag
`checkpoint/order-taking-efd3b23`. This section continues on
`feature/order-taking`; `main` and the published website remain unchanged.

## Try it on your phone

Install the current test APK from this branch. Use test orders for these checks.
[View the saved-order screen](screenshots/open-orders-mobile.png).

1. In POS, add two Shami Burgers. The total should be Rs. 280.
2. Choose Dine-in and open the person icon in the header. Enter a table and
   optional customer name/phone, then tap Done.
3. Tap **Save order**. Wait for an order number and the **Saved** indicator.
4. Tap **New order**, add a different item, and save it. It gets another number.
5. Close the app fully, reopen it, and tap **Orders** in the bottom navigation.
   Both saved orders should be listed with their original totals and details.
6. Open the first order. Change a quantity or add an item, then tap
   **Save changes**. Its order number stays the same.
7. Restart again and check that the first order has its updated total and the
   second order is unchanged.
8. Change a menu price, then reopen an earlier order. Its saved lines keep their
   original prices. Adding the same item now uses its current price as a new line.
9. Make an unsaved edit and switch orders. Try Keep editing, Discard changes,
   and Save and switch. Discarding edits keeps the last saved version.

For a pizza check, configure a test premium amount on a deal first. A saved
order must retain every chosen flavour, the per-pizza extras, bundle quantity,
instructions, customer details, and total after reopening. Restore any test menu
prices afterward. Amounts have not been invented or changed by this feature.

## What the controls mean

- **Save order:** stores a new unfinished order on this device.
- **Save changes:** updates the currently opened order.
- **Saved:** the current copy has finished saving successfully.
- **Unsaved:** this copy has edits that still need saving.
- **New order:** starts a separate cart. Save/discard choices protect unfinished edits.
- **Orders:** lists saved open orders and opens them in POS.
- **Clear order:** clears the working cart; saved orders stay in the list.

Unsaved drafts and edits are not automatically restored after closing. Save first.
On restart the app opens a fresh workspace; use Orders to reopen a saved order.
Saving an open order does not take payment, print a receipt, or count it as a
completed sale. Closing/cancelling paid orders belongs to checkout and later tasks.
Orders are local to this installation, with the same browser/Android separation
as the menu. Backups and multiple-device synchronization remain future work.

## Storage behavior

Schema version 5 adds `open_orders` without altering existing menu data. Each row
stores customer details, the complete line snapshots, total in integer paisa,
order number, revision, and created/updated times. Numbers are local to the device.
Menu IDs are references inside snapshots, so deleting a menu size cannot delete
or reprice an earlier order.

The complete order updates in one transaction. A failed SQLite write or browser
snapshot save leaves both the prior saved order and the working cart intact.
Retries reuse the draft ID. Revision checks stop stale edits from overwriting
a newer saved version. If a conflict appears, open Orders and review the newer
copy; switching asks before discarding current edits.

## Checks

- Data tests close and reopen a real SQLite file with two complete orders,
  preserve snapshots after menu edits, and cover rollback, retry, stale writes,
  invalid snapshots, corrupt totals, and version-four upgrades.
- Browser tests save two orders offline, reload, reopen, edit, and switch them;
  they also simulate full device storage and check a safe retry.
- The production-path check saves and reloads an order under `/POS-Software/`.
- Build/sync Android, then repeat the phone checklist before shop use.
