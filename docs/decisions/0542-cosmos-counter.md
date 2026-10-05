# 0542 — Cosmo's counter

**Accepted 2026-10-06.** Item 5 of [`the-menus-are-a-place`](../../reports/the-menus-are-a-place-2026-10-05.md):
*Cosmo's counter*.

## The ask

> *"Good Cosmo's Cosmetics shop background with categories and items previewed properly."* The plan's
> item 5: Cosmo behind the counter with a line, three shelves by table, the price on the face and on
> *Buy*, the try-on on the stage for every kind of ware, and the owned state as a line rather than a dead
> button. Cosmo is the alien in the gilt frame, and the shop is built to grow: *"there'll be more
> cosmetics added for lots of things so it'll need space to grow"*.

## What was built

- **A shelf per table.** `SHELVES` in `src/content/wares.ts` is the ownable tables walked in order —
  what hangs, what turns, what burns — each shelf the wares of its table that have a price. The shop's
  choices are an **aisle**, a band naming every shelf, and a band per shelf. A desktop shows every shelf
  that fits; a phone shows the one the aisle has in view (`setInView`), and its bands drop their labels
  as the hangar's do. A new kind of cosmetic is a table, a line in `SHELF_KINDS` and a row in `SHELVES`,
  never a layout change.
- **The price on the face and on Buy.** A ware's face reads *Golf ball · 250 ✦*, or *· yours* once it is
  owned; *Buy* reads *Buy · 250 ✦* and is gone on a ware owned, so no button does nothing (0523).
- **Cosmo**, a row in `src/content/cosmo.ts` (`KeeperRow`): a face in a ring at the plate's head, the name
  and a line — a greeting, what the balance is short by, thanks for a sale, where an owned ware is fitted.
  The face is painted by `src/render/cosmo-art.ts`, the same bust the stall draws.
- **Every ware tried on where it goes.** On Cosmo's tab the ship on its pad wears the ware in the window:
  a dangle on the dash (0523), a rim on the wheels of a ship that has them, a flame in its exhaust —
  before a shard is spent, and nothing is fitted until the hangar fits it (`standFit` in `mount.ts`).

## Where this departs from the plan

**The camera is not at the bar.** The plan stood it there, the counter and its lit shelf filling the
stand with the ship on its pad beyond. The bar's window and the pad are sixty-four units apart, and no
camera that fills the screen holds both in a stand a third of it wide: at the bar the ship stood under
the plate, and the try-on — the item's point — happened where nobody could see it. So **Cosmo keeps a
stall on the deck beside the pad** (`STAGE.stall`, `STAGE.keeper`), and the tab's camera stands between
the two at a zoom of 1.4. Below about 1.35 the room's deck stops short of the foot of a 4:3 screen,
which `tests/stand.test.ts` already holds.

**The stall is drawn on Cosmo's tab alone.** The hangar's camera sees the deck from 58 units along, and
Cosmo's needs the stall past 60 to hold it whole beside the ship, so no placement is out of the one frame
and in the other: drawn on every tab, it stood cut in half at the hangar's left edge, Cosmo staring at
the plate. The intro's room never had it, so nothing the player saw before loses it.

Both can be vetoed on play: the bar camera comes back if the ship may leave the frame, or the stall stays
on every tab if a half-seen stall reads as the room going on.

## What guards it

- `tests/cosmo.test.ts`: every ware for sale on exactly one shelf, in its table's order, each shelf a band,
  the aisle naming them all.
- `tests/cosmo.browser.test.ts`: a ware picked off its shelf, the price on its face and on *Buy*, Cosmo's
  thanks for the sale and the shortfall on the next.
- `tests/wheels.browser.test.ts` and `tests/flames.browser.test.ts`: the spinners and the thrusters in the
  window are on the ship on its pad before they are bought, and buying them fits nothing.
- `tests/stand.test.ts`: Cosmo, the stall and the ship in the stand's part of the screen at the six sizes,
  the stall over the bust, and neither on the other tabs.

Probes in `scripts/probes/0542-cosmos-counter.mjs`.

## Owed

- A play on the branch preview, and the two departures above for a veto.
- The purchase sound 0523 owed still waits for the ear.
