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
- Dine-in, takeaway, and delivery drafts with optional customer/phone/table details.
- Editable deal choice groups, linked menu availability, and a premium charge for
  each premium pizza. Existing cart lines keep their added names and prices.

The reviewed menu imports once per device. Existing owner entries win when
names match, and later edits are never reset by reopening or updating the app.
Premium pizza extras on Deals 7–12 have no invented amount: set the extra in the
item editor. Tikka, Fajita, and Vegetable are included; the other reviewed flavours
cost extra per premium pizza. Unpriced premium choices cannot be ordered.
Draft carts stay while navigating within the app; closing or reloading clears
them. Saving/reopening orders, login, checkout, payments, printing, and backups
remain future tasks. [Order-taking test steps](docs/order-taking.md) explain how
to check this segment and its limits.
See [the agreed requirements](docs/requirements.md) for the longer-term scope.

## Git work in progress

Order-taking and the remaining ordering segments stay on `feature/order-taking`,
with commits for completed stages. Keep `main` and the published preview at their
current version until the final segment is agreed complete. Pushing this branch
does not deploy GitHub Pages. The Android workflow can be run manually on this
branch to download a test APK without merging or publishing the website.

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
Core menu storage needs no internet or remote server. Its minimum Android
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
- `App.tsx`: selects Home, Menu, or Order with hash navigation and keeps the draft.
- `pages/`: one file per screen: `Home.tsx`, `Menu.tsx`, and `Order.tsx`.
- `components/`: shared UI and styling, including `StatusCard.tsx` and `styles.css`.
- `data/`: all loading and saving logic. `schema.ts` defines the database;
  `menu-store.ts` provides menu operations; `money.ts` handles PKR conversion.
  `database.ts` selects the Android or browser storage adapter.
- `data/order-pricing.ts` and `order-cart.ts`: validate selections, count premium
  pizzas, keep price snapshots, and calculate totals without decimal rounding.
- `data/import-order-options.ts`: adds reviewed deal choices once, preserving edits.
- `data/catalog/`: the reviewed initial menu. `import-initial-menu.ts` saves it
  atomically once per database; `menu-source.csv` records the photo transcription.
- `tests/data/`: tests the actual schema, menu rules, persistence, and PKR amounts.
- `tests/browser/`: checks startup, menu editing/persistence, and taking orders
  offline, including premium fees and drafts kept through navigation.
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
5. [ ] Open orders: save, reopen, and update unfinished orders.
6. [ ] Discounts: owner-approved item or menu-wide promotions, with no stacking.
7. [ ] Tax settings: optional Punjab tax applied after discounts, using verified rules.
8. [ ] Payments: pay before or after preparation using the agreed payment methods.
9. [ ] Receipts: print completed orders using the chosen printer connection.
10. [ ] Sales history: review completed sales and payment status.
11. [ ] File backups: export and safely restore the local database.
12. [ ] Cloud backups: back up and restore when connected.
13. [ ] Daily report: summarize sales and transaction counts.
