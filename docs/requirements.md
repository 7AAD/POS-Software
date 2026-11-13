# Agreed product direction

## Shop and experience

- Master Foods, a local fast-food shop in Punjab, Pakistan.
- Installable Android app using React, Capacitor, and SQLite.
- Start with one phone. Consider multiple devices later; synchronization is not
  part of this first database task.
- Core operation must work offline. Store the database on the phone.
- Simple mobile screens, clear labels, large touch targets, and few steps.
- Visual direction: navy background (`#101722`), orange accents (`#F97316`),
  slate cards, high-contrast text, and a shared Master Foods header.
- Apply the reference's visual style to implemented features. Its additional
  screens and sample business figures are not part of the current foundation.
- Discuss and agree on each section before implementation; test it afterward.
- Keep screens in `pages/`, shared UI in `components/`, and data logic in `data/`.
- One job per file, with no file over 300 lines.

## Menu

- Owner-editable categories, items, prices, sizes, add-ons, and meal deals.
- Support special instructions on orders.
- Juices have Small and Large prices.
- NR drinks refer to 250 ml or 350 ml, configurable per item or deal.
- The owner reviewed the photo transcription in `menu-review.md`. The initial
  catalog contains 52 items, 90 price choices, and 10 categories.
- Tikka and Fajita are separate flavours with identical listed prices.
- Deals retain the words Fries and Zinger Shawarmas without invented sizes or
  portion counts. Premium pizza costs extra; the actual amount is not yet given.
- Existing imported items must remain editable. Initial imports must not replace
  owner edits or matching existing owner entries.

## Orders and money

- Dine-in, takeaway, and delivery.
- Optional table number; customer name and phone number.
- Keep open orders, switch between them, and add items later.
- Payment can happen before or after preparation.
- Currency: PKR. Store monetary amounts as integer paisa.
- Percentage and fixed-PKR discounts; either menu-wide or on selected items.
- One discount type at a time, with no stacking.
- Discounts need owner PIN approval, including offline.
- Tax can be enabled or disabled. Add it on top of prices after discounts.
- Verify the applicable Punjab restaurant tax rules and rates before building
  tax calculations; no rate has been agreed or implemented.

## Access, printing, and backup

- Owner has full access. Cashier has limited operational access.
- Receipt printer support is required.
- Both cloud backup and exported backup files, with restore support.
- Authentication, PIN protection, backups, and printing are future features.

## Decisions still needed before their related feature

- Exact cashier permissions and owner PIN setup/recovery rules.
- Whether an individual-item promotion excludes a menu-wide promotion for the
  entire menu or only the affected item; never combine discounts on one item.
- Supported payment methods and delivery address/charge requirements.
- Printer model, paper width, and connection type.
- Cloud backup provider, schedule, and recovery process.
- Confirmed tax rules, rounding, and any payment-method-dependent tax rates.

## Implemented foundation and menu editor

The runtime, versioned database, menu storage API, and menu editor are implemented.
Categories have names. Items belong to a category and have names, availability,
and one or more named sizes with prices. Item edits and their sizes are atomic.
The home screen shows storage status/counts and opens the menu editor. The editor
supports names, categories, sizes/prices, availability, contents, and optional
premium charges. Imports and upgrades preserve owner data. Premium charges are
unset until supplied; no charge amount or pricing formula has been inferred.
Add-ons, structured deals, permissions, orders, discounts, tax, and backups will be designed
in their own tasks. Later order records must keep a snapshot of sale-time names
and prices so menu edits cannot rewrite past sales.
