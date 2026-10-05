# 0523 — Cosmo opens

**Accepted 2026-10-05.** Item 3 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
Builds on [0521](0521-the-hangar-opens.md)'s hangar and [0522](0522-the-score-pays-in-shards.md)'s
shards; amends [0461](0461-the-ships-are-jazzed.md)'s *the walnut plate is the only one that shows
them*, and keeps [0466](0466-the-dice-swing-once.md)'s one swing for everything that hangs.

## The ask

> *"… choose what is hanging from the dashboard in the novelty dice slot …"*

> *"The Cosmo's Cosmetics shop will let you buy additional things that will be equippable onto your
> spaceship, starting items to buy will be some other fun things to hang from the dashboard - like a
> eucalyptus potpurri tree, a picture of the alien's family in a little frame, a golf ball."*

Priced from the first played clear (157 shards): *"let's set the cheaper stuff at 250 shards for a base
level."*

## The rule

**Every dash can hang one thing. The fuzzy dice are every player's; a eucalyptus tree, the alien's
family in a gilt frame and a golf ball are sold at Cosmo's, the hangar's second tab, for 250 Star
Shards each. Anything owned hangs on any ship.**

| | |
|---|---|
| **the table** | `src/content/dangles.ts`: four rows, each a name, a line and a price — `null` for the dice, which are not sold. `WARES` is what Cosmo's shelves, every row with a price |
| **what each ship opens on** | `hangs` on its ship row: the estate its dice, so its dash is as it was, and the others nothing |
| **the hangar** | `owned` per dangle and `hung` per ship. `bought` takes the price and gives the ware, once, and only when the balance covers it; `hung` hangs an owned dangle or nothing. The reducer refuses everything else |
| **kept** | new fields on `itc_hangar` version 1, per field: only `true` is read of what is owned, and a dangle hung that the document does not own reads as the ship's own, so an edited document buys nothing |
| **the hangar screen** | a second slot band, *Hanging*: nothing, then every dangle, the unbought ones shut and the band saying they are at Cosmo's. Two columns at every size — the pilot and their card, beside the dash and what hangs |
| **Cosmo's** | `shop`, tabbed with the hangar: the shelf band, *Buy* while the ware in the window can be bought and not once it is owned, the band's line saying the price, *Need n more Star Shards*, or that it is the player's, and the balance in the corner |
| **the preview** | the real readout is up over the shop too, wearing the ware in the window, so a dangle is seen swinging from the player's own dash before a shard is spent |
| **the drawing** | every dangle a body on the dice's one swing (0466), shown by a class on the readout: the tree a car-air-freshener pine, the family three of the alien's own in a gilt frame, the ball dimpled. Every colour a role moved, as the fur is |

## Why it is built the way it is

**The dash is the readout.** No cockpit is drawn, and at the ship's box a dangle in the world would be
smaller than the smallest mark the bake allows. The dice already hung from the plate and swung on the
frame's lurch; every dangle hangs there and swings on the same swing.

**The dice are the slot's, no longer the walnut plate's.** Since 0521 a ship may wear the walnut dash,
and the dice came with it. Hung by the slot, they go where the player puts them, and the estate opens
with them so nothing it showed has moved.

**A bought thing hangs on any ship.** Decided while it was planned and still vetoable: the player paid
for it. A ship's own slots wait for its win; a ware does not.

**The shelf is a band, the purchase an action.** A band is how every screen here offers a choice, with
the cursor, a pad and a thumb on the same terms. *Buy* is the one press that spends, and it goes once
there is nothing left to buy, so it is never a button that does nothing. Which ware is in the window
is the shell's to hold: it is where the player is looking and nothing about it is kept, so it is
`ShelfName`, a third kind of band name beside a setting and a slot.

**On a phone a slot shows the one that is on.** Two bands of four and five names, each two lines in
half a phone, were the column's height three times over and put Back under a 480x320's fold. The
arrows step them, passing over what is shut, and the band's one line says what is shut and why. On the
shortest phones the hangar's pilot card goes, and the panel starts under the readout's corner.

## What it costs

- **The hangar was one column and is two.** With three bands and the tabs it was taller than a
  1280x720. Photographed at the desktop, an 844x390 and a 480x320.
- **The family photo was redrawn once.** The first drawing was a green smudge at the size of a count:
  pale green on a pale card. Three figures with eyes on a dusk of the ally's lavender read as three.
- **Two of 0522's probes moved** — the key's writer and the hangar's balance — and break what they
  broke.

## Rollback

`owned` and `hung` are new fields on the existing `itc_hangar` key, version 1. Reverting leaves them in
the document unread; the previous reader ignores fields it does not know. Shards spent on a ware are
not refunded by a revert — they were spent, and the balance the older version reads is what is left.

## What guards it

`tests/cosmo.test.ts`: the shelf and its prices, buying once and never on credit, nothing not for sale,
hanging only what is owned, the key kept and a forged one refused. `tests/cosmo.browser.test.ts`, in the
page: every ware tried on the dash, Buy taking the price once and going, the shelf saying how far off
the next is, and the run wearing what the hangar hung. Probes in `scripts/probes/0523-cosmo-opens.mjs`.

## Owed

- A play: a ware bought and flown with, on each plate.
- **Who Cosmo is** — still a name on a tab. A face and a line, like the pilots', is the plan's open
  question.
- A sound for a purchase. Nothing is heard when a ware is bought; it wants the ear before it is added.
- Ion Thrusters, at 400, are item 10.
