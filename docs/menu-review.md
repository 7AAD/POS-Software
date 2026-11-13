# Master Foods reviewed menu

Source: the two original menu photos supplied in the planning conversation.
Photo 1 shows deals; photo 2 shows the regular menu. All prices below are PKR.
The owner reviewed this transcription and supplied the clarifications below.
`data/menu-source.csv` preserves the source prices; `data/catalog/` contains the
initial import. The menu has 52 editable items with 90 size/price choices.

For single-price items, Regular is only the database label; the photo does not
state a size. Juice/shake prices use Small/Large as previously confirmed.
A dash in the pizza table means no price is offered in the photo, not zero.
Printed names such as Lazania and Musammi are retained and editable.

## Burgers

| Item | Price |
|---|---:|
| Shami Burger | 140 |
| Double Anda Burger | 180 |
| Chicken Shami Burger | 180 |
| Chicken Burger | 200 |
| Cheesy Chicken Burger | 280 |
| Zinger Burger | 300 |
| Cheesy Zinger Burger | 380 |
| Mighty Burger | 500 |
| Cheesy Mighty Burger | 600 |
| Patty Burger | 250 |
| Cheesy Patty Burger | 330 |

## Shawarmas

| Item | Size / portion | Price |
|---|---|---:|
| Chicken Shawarma | Small | 160 |
| Chicken Shawarma | Large | 200 |
| Zinger Shawarma | Small | 250 |
| Zinger Shawarma | Large | 300 |
| Platter | 2 Bread | 400 |
| Extra Bread | Not specified | 50 |

## Sandwiches

| Item | Size / portion | Price |
|---|---|---:|
| Club Sandwich | Not specified | 350 |
| Chicken Sandwich | Not specified | 400 |

## Fries and loaded fries

| Item | Size / portion | Price |
|---|---|---:|
| Fries | Regular | 100 |
| Fries | Medium | 200 |
| Fries | Large | 300 |
| Loaded Fries | Regular | 300 |
| Loaded Fries | Large | 500 |

## Snacks and dip

| Item | Size / portion | Price |
|---|---|---:|
| Twister | Not specified | 100 |
| Nuggets | 6 Pieces | 300 |
| Hot Wings | 6 Pieces | 300 |
| Hot Shots | 10 Pieces | 300 |
| Dip Sauce | Not specified | 50 |

## Pizzas

| Flavour | Small | Medium | Large | Family |
|---|---:|---:|---:|---:|
| Tikka | 400 | 750 | 1,000 | 1,600 |
| Fajita | 400 | 750 | 1,000 | 1,600 |
| Vegetable | 400 | 750 | 1,000 | 1,600 |
| Supreme | 500 | 800 | 1,200 | 1,800 |
| Malai Boti | 500 | 800 | 1,200 | 1,800 |
| Kababish | 600 | 900 | 1,400 | 2,000 |
| Kabab Crust | 600 | 900 | 1,400 | 2,000 |
| Crown Crust | — | 900 | 1,400 | 2,000 |
| Cheese Crust | — | 900 | 1,400 | 2,000 |
| Lazania | — | 1,000 | 1,800 | 2,200 |

The owner confirmed Tikka and Fajita are separate flavours at the same prices.

## Juices and shakes

| Item | Small | Large |
|---|---:|---:|
| Banana Shake | 120 | 150 |
| Apple Shake | 120 | 150 |
| Mango Shake | 120 | 150 |
| Strawberry Shake | 120 | 150 |
| Carrot Juice | 100 | 120 |
| Musammi Juice | 120 | 150 |

## Deals

Use the bold, uncrossed price as the fixed base selling price. Crossed-out
prices are recorded only as reference, not as an automatic discount.

| Deal | Printed contents | Selling price | Crossed-out price |
|---|---|---:|---:|
| 1 | 1 Zinger Burger + Fries + 1 NR | 400 | 470 |
| 2 | 2 Zinger Burgers + Fries + 2 NR | 800 | 940 |
| 3 | 3 Zinger Burgers + Fries + 1 L drink | 1,200 | 1,320 |
| 4 | 1 Club Sandwich + Fries + 1 NR | 450 | 520 |
| 5 | 1 Zinger Burger + 1 Zinger Shawarma + Fries + 0.5 L drink | 650 | 750 |
| 6 | 2 Zinger Burgers + 2 Zinger Shawarmas + Fries + 1 L drink | 1,400 | 1,520 |
| 7 | 1 Small Pizza + 1 Zinger Burger + 0.5 L drink | 700 | 800 |
| 8 | 3 Small Pizzas + 1 L drink | 1,200 | 1,320 |
| 9 | 1 Medium Pizza + 2 Zinger Burgers + 1 L drink | 1,400 | 1,500 |
| 10 | 1 Medium Pizza + 3 Zinger Burgers + 1.5 L drink | 1,700 | 1,850 |
| 11 | 2 Medium Pizzas + 1.5 L drink | 1,550 | 1,700 |
| 12 | 2 Large Pizzas + 1.5 L drink | 2,000 | 2,200 |

## Owner clarifications

1. Tikka and Fajita are separate flavours at the same prices.
2. Keep Fries as written in the deals; do not invent sizes or portion counts.
3. Keep Zinger Shawarmas as written in Deals 5 and 6, without adding a size.
4. Premium pizza costs extra. The amount is unset and editable, not guessed.
5. Already entered items must also be editable.
6. Base pizza flavours are Tikka, Fajita, and Vegetable. Premium flavours are
   Supreme, Malai Boti (owner: Malai), Crown Crust, Kababish, Kabab Crust,
   Cheese Crust, and Lazania.
7. Charge the extra for each premium pizza. Multiply the resulting bundle price
   by the ordered bundle quantity. Do not charge standalone pizza prices in deals.

NR already means a configurable 250 ml or 350 ml drink. That decision is
preserved; no new default or extra charge has been assumed.

No standalone soft-drink/water prices, drink flavour list, pizza diameters,
or extra cheese/add-on prices are printed. None have been invented.

## Entry behavior

The reviewed catalog imports in one transaction, with a permanent import marker.
Reopening or updating the app does not overwrite owner edits or repeat imports.
Matching pre-existing owner items retain their IDs and prices. Menu items,
sizes/prices, categories, availability, and deal contents stay editable.
Deal contents remain editable text. Order choices are also editable in each
item's editor. A separate, atomic import adds the reviewed pizza counts/sizes and
NR choices once, only to deals whose contents and premium rule still match.
It preserves owner prices/extras and never restores removed or changed choices.
Linked choices follow the source item's name and availability; removed menu sizes
become unavailable. Changed deal contents need their choices reviewed manually.
