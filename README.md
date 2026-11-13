# Master Foods POS

An Android point-of-sale app for a small fast-food shop. We build one agreed
section at a time: discuss, agree, build, test, then improve.

## What works now

- A React home screen that checks local menu storage and shows saved item counts.
- Dark navy and orange styling from the UI reference, with shared branding,
  icons, rounded cards, and clear loading and error states.
- An Android project using Capacitor and its native SQLite plugin.
- A versioned database for categories, menu items, and size-based prices.
- The reviewed Master Foods menu: 52 items, 90 price choices, and 10 categories.
- Menu sections follow the printed category/item order, with Deals 1–12 in
  sequence. Editing names/prices keeps their position; new entries append.
- A menu editor: search/filter, add items, edit existing names, sizes, prices,
  availability, deal contents, and premium extras. Categories can be added/renamed.
- Data functions to list, add, and edit categories and menu items. Each item has
  at least one size; use `Regular` when it has only one price.
- Exact PKR amounts stored as integer paisa: PKR 150.50 is saved as `15050`.
- Validation and transactions: an invalid edit leaves the previous menu intact.
- An order-taking screen: search the grouped menu, select sizes and deal choices,
  add instructions, change quantities, and see exact PKR totals.
- A compact POS layout based on the latest reference: order-type tabs, scrolling
  category chips, two-column food cards, a current-order panel, and bottom navigation.
  The header opens customer details and search; the menu scrolls in its own area.
  [See the current mobile layout](docs/screenshots/order-taking-mobile.png).
- Dine-in, takeaway, and delivery drafts with optional customer/phone/table details.
- Editable deal choice groups, linked menu availability, and a premium charge for
  each premium pizza. Existing cart lines keep their added names and prices.
- Saved open orders: save a cart on this device, restart the app, and reopen it
  from Orders. Keep multiple orders, add items later, and update the same order.
- Saved/unsaved indicators and save/discard choices before switching orders.
  Failed saves keep the draft and the last saved copy available.
- Checkout records Cash, JazzCash, Easypaisa, and bank-transfer payments offline.
  Cash calculates change; digital receipts require the cashier's confirmation.
- Paid orders keep a read-only completed sale with all item choices, prices,
  customer details, payment amounts, references, and time. Reopen it after restart.
- An on-screen customer receipt: open View receipt from a completed sale. It uses
  the recorded items, sizes, choices, instructions, payment, and cash change.

The reviewed menu imports once per device. Existing owner entries win when
names match, and later edits are never reset by reopening or updating the app.
Premium pizza extras on Deals 7–12 have no invented amount: set the extra in the
item editor. Tikka, Fajita, and Vegetable are included; the other reviewed flavours
cost extra per premium pizza. Unpriced premium choices cannot be ordered.
Tap Save order before closing or reloading. Saved orders retain their customer
details, instructions, choices, and prices; reopen them through Orders.
Later edits need Save changes. Unfinished unsaved edits stay only while the app
is open. Checkout saves the current cart before reviewing payment. Digital money
is confirmed in the provider/bank app and recorded here. Login, receipt printing,
discounts, tax, and backups remain future tasks.
See the [order-taking checks](docs/order-taking.md) and
[saved-order test steps](docs/open-orders.md).
See [checkout and payment checks](docs/checkout.md) for the payment flow.
See the [receipt layout and checks](docs/receipts.md) for on-screen receipts.
See [the agreed requirements](docs/requirements.md) for the longer-term scope.

## Git work in progress

Order-taking and the remaining ordering segments stay on `feature/order-taking`,
with commits for completed stages. Keep `main` and the published preview at their
current version until the final segment is agreed complete. Pushing this branch
does not deploy GitHub Pages. The Android workflow can be run manually on this
branch to download a test APK without merging or publishing the website.
The completed previous section is saved at Git tag
[`checkpoint/order-taking-efd3b23`](https://github.com/7AAD/POS-Software/tree/checkpoint/order-taking-efd3b23).
The open-orders section is preserved at
[`checkpoint/open-orders-cb22f0d`](https://github.com/7AAD/POS-Software/tree/checkpoint/open-orders-cb22f0d).
The checkout section is preserved at
[`checkpoint/checkout-6515a76`](https://github.com/7AAD/POS-Software/tree/checkpoint/checkout-6515a76).

## Run the development version

Install Node.js 24 (the version is recorded in `.nvmrc`). From this folder:

```sh
npm ci
npm run dev
```

Vite starts the development server on port **8000**, including access from the
cloud preview. Press Ctrl+C to stop the server. Keep it running while using the
preview. It reports an error if that port is already occupied.

Use this development server instead of opening `index.html` directly or running
Python's static server: React's TypeScript files must be processed by Vite.
If an old static server is still running on port 8000, stop it before starting
Vite. Serving the source files directly produces a blank page.

For a production web build:

```sh
npm run build
npm run preview
```

## Android

The Android app packages its screens and uses a SQLite file on the phone.
Menu and saved-order storage need no internet or remote server. Its minimum Android
version is 7.0 (API 24).

Use Android Studio with JDK 21, Android SDK 36, and Build Tools 36.0.0 installed:

```sh
npm run android:sync
npm run android:open
```

Then run the app on an Android phone or emulator in Android Studio. After a web
code change, run `npm run android:sync` before building Android again.
For a command-line debug APK with the SDK configured:

```sh
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
The Android package ID currently is `com.masterfoods.pos`.

## Download an APK from GitHub

Once this project and its workflow have been pushed to `main`, GitHub Actions
can build and attach the APK for download. Publishing an environment snapshot
alone does not push these project files to GitHub.

1. Sign in to GitHub and open `7AAD/POS-Software`.
2. Open **Actions → Build Android APK**. A push to `main` starts a build;
   for the current segment, select **Run workflow → feature/order-taking**.
3. Open the completed run with a green check mark.
4. Under **Artifacts**, download **master-foods-debug**.
5. Extract the downloaded ZIP and install `app-debug.apk` on your Android phone.

The workflow runs the database tests, builds the app, and attaches the APK.
Artifacts are retained for 14 days; run the workflow again if a download expires.
A file path in the cloud workspace is not a published download attachment.

## Hosted web preview

The `Publish web preview` workflow builds the app and deploys `dist/` to GitHub
Pages after pushes to `main`. In repository **Settings → Pages**, set the build
source to **GitHub Actions** once before the first deployment.

After a successful deployment, open **Actions → Publish web preview → deploy**
and follow the deployment URL. A successful local build alone does not mean the
website is published. No cloud workspace server or port selection is needed.

The hosted version is a browser preview with its own device-local menu storage.
It does not synchronize with the Android app and is not an offline-installable
website. Relative asset paths let the same build work under the repository's
Pages URL and inside Android.

## Where data is saved

- **Android:** native SQLite in the app's private device storage.
- **Browser preview:** SQLite runs locally through `sql.js`; successful writes
  are saved as a database snapshot in IndexedDB. Use one tab for this preview.
  Its SQLite engine is bundled locally, with no CDN dependency.

The browser is a development preview, not an installable offline website.
Writes work without internet after loading, but refreshing still needs the
local server. Browser storage is separate from Android storage; clearing site
data removes it. No cloud or file backups exist yet.

## Folder map

- `AGENTS.md`: the exact project rules for future Codex tasks.
- `index.html` and `main.tsx`: start React and open the home screen.
- `App.tsx`: selects each screen by hash navigation and keeps the working draft.
- `pages/`: Home, Menu, POS, Open Orders, Checkout, Paid Orders, and the completed
  Sale and Receipt views. Each screen has its own file.
- `components/`: shared UI and styling, including `StatusCard.tsx` and `styles.css`.
- `data/`: all loading and saving logic. `schema.ts` defines the database;
  `menu-store.ts` provides menu operations; `money.ts` handles PKR conversion.
  `database.ts` selects the Android or browser storage adapter.
- `data/order-pricing.ts` and `order-cart.ts`: validate selections, count premium
  pizzas, keep price snapshots, and calculate totals without decimal rounding.
- `data/import-order-options.ts`: adds reviewed deal choices once, preserving edits.
- `data/saved-order-store.ts`: saves and opens orders atomically in the same local
  database. `saved-order-validation.ts` checks their stored snapshots and totals.
- `data/use-order-cart.ts` and `use-order-navigation.ts`: manage the working draft,
  saved/unsaved state, and safe switching between orders.
- `data/sales-store.ts`: atomically records one payment and closes its open order.
  `payment-validation.ts` checks received amounts, change, and digital confirmation.
- `components/OrderReview.tsx`, `OrderLineDetails.tsx`, and `SaleSummary.tsx`:
  shared order and payment details for checkout and completed sales.
- `components/ReceiptDocument.tsx` and `receipt.css`: the responsive receipt paper;
  `pages/Receipt.tsx` opens its saved sale using the existing data layer.
- `data/catalog/`: the reviewed initial menu. `import-initial-menu.ts` saves it
  atomically once per database; `menu-source.csv` records the photo transcription.
- `tests/data/`: tests the actual schema, menu rules, persistence, and PKR amounts.
- `tests/browser/`: checks startup, menu editing/persistence, and taking orders
  offline, including saved orders after reload, failed saves, and safe switching.
- `android/`: Capacitor's native Android project. Generated web assets are ignored.
- `.github/workflows/`: builds a downloadable test APK in GitHub Actions.
- `docs/`: agreed requirements and decisions still to discuss.
- `package-lock.json`: generated dependency versions; use `npm ci` to reproduce them.

Check `components/` and `data/` before adding a component or function.
Keep each file focused on one job and at most 300 lines.

## Checks

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:browser
npm run test:preview
```

If Chromium is already installed, skip the download and set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable when running browser tests.
Browser tests use temporary, isolated browser storage; they do not edit your menu.
Native SQLite and phone behavior must also be tested on an Android device before
using the app in the shop.

`test:preview` serves the existing `dist/` build under `/POS-Software/`, matching
GitHub Pages. Run `npm run build` first. This check catches broken hosted asset
paths that a development-server test would miss. It also needs Python 3.

## Features to build next

Discuss each feature before starting it. One numbered feature per Codex task:

1. [x] Menu editor: manage categories, items, sizes, prices, and availability.
2. [ ] Menu customization: priced add-ons; structured deal choices now work.
3. [ ] Staff access: owner and cashier roles with offline owner PIN approval.
4. [x] Order taking: dine-in, takeaway, and delivery carts with customer details.
5. [x] Open orders: save, reopen, and update unfinished orders.
6. [ ] Discounts: owner-approved item or menu-wide promotions, with no stacking.
7. [ ] Tax settings: optional Punjab tax applied after discounts, using verified rules.
8. [x] Checkout and payments: Cash, JazzCash, Easypaisa, and bank transfer.
9. [x] On-screen receipts: review the receipt for a completed sale.
10. [ ] Receipt printing: connect the chosen printer and paper width.
11. [ ] Sales history: filtering and reporting; a basic paid-order list now works.
12. [ ] File backups: export and safely restore the local database.
13. [ ] Cloud backups: back up and restore when connected.
14. [ ] Daily report: summarize sales and transaction counts.
