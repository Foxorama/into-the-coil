# 0578 — The tubes are sold

**Accepted 2026-10-07.** Item 3b of [`the-arms-planned`](../../reports/the-arms-planned-2026-10-07.md),
the hangar's half of the tubes; [0577](0577-the-tubes-are-full.md) is the run's. Builds on
[0523](0523-cosmo-opens.md)'s shop and [0542](0542-cosmos-counter.md)'s shelves.

⚠️ **Superseded in part by [0579](0579-the-loadout-has-tabs.md)**: *the band*. The tubes are fitted on Hangin'
Out under *Loadout*, behind sub-tabs that gave it the height, and Paint & Parts' headings came back. The trade,
the racks, the run and the key stand.

## The ask

> *"let's add the missile tubes are puchasable items from Cosmo's — you can buy 1-2 of both homing and
> regular missiles and equip them how you want on a ship -> 1 homing, 1 regular, 2 homing, 2 regular
> etc"*

> *"if a player hasn't bought the missile tubes, then they need to collect the missile powerups in game"*

Priced when asked: *"500 each."*

## The rule

**Cosmo's sells four tubes — the first and second of each kind, 500 Star Shards each, the second of a kind
once the first is owned — and Paint & Parts fits a rack on each ship, which the run opens on.**

| | |
|---|---|
| **the wares** | `src/content/racks.ts`, `TUBE_WARES`: a Missile Tube, a Second Missile Tube, a Seeker Tube, a Second Seeker Tube. A fourth shelf, *Tubes*, at the end of Cosmo's aisle. `OwnableRow.needs` names a ware that must be owned first, and `canBuy` refuses until it is (`needsFirst`) |
| **the racks** | `RACKS`: none, one of either kind, two of either, one of each — *"1 homing, 1 regular, 2 homing, 2 regular etc."* A rack is open when the tubes owned are enough of each kind for it (`rackOpen`), on any ship |
| **the band** | *Tubes*, on Paint & Parts in the Parts group beside the wheels and the flame; each rack drawn as its tubes' pickup faces |
| **the run** | `startRun` hands `lifecycle.begin` the fitted rack's tubes, and the run opens on them (0577's `begin`). A ship with none opens bare, and the field's missile pickups fill its tubes — 0577 |
| **the shop** | a tube in the window says *Buy the Missile Tube first* while it waits, and has no Buy; *Fit it now* puts it into the ship's rack beside what is fitted, or in place of the bottom tube of a full one |
| **the readout** | the lives counter's label says the tubes after the gun — *"3 lives, Pulse, Missiles and Seekers"* |
| **kept** | `rack`, a new field on `itc_hangar` version 1, per ship; a rack the document's own tubes do not fill reads as none |

## Why it is built the way it is

**Two tables, because two things are owned and fitted.** A tube is a thing bought, once each; a rack is
what a ship carries, any of six. Owning *two* straight tubes is two wares rather than a count on one, so
`owned` stays the record of booleans every save reader already trusts (0523): only `true` is read.

**The second waits for the first.** *"1-2 of both"* sells a second of a kind; without the order, the second
could be bought alone and a rack of one would need the second to stand in for the first. `needs` is a field
on the row, so a later ware with a prerequisite is a row and not a branch.

**On Paint & Parts, and it was built on Hangin' Out first.** The tubes are loadout as the gun and the
special are, and the first build put the band beside them. A fifth band on Hangin' Out put Back under the
fold on every phone the layout guard holds (by 26 to 40 pixels) and made the desktop panel scroll past
*Hanging*. Paint & Parts' Paint column already stands three bands tall when the ship is toned, so a third
in Parts costs its height nothing on the desktop. On a phone it was 10 pixels over at 480x320, and at
667x375 CI's fonts stood the plate 11 pixels taller than Hangin' Out's, which
[0548](0548-the-hangar-holds-still.md) holds still; so on every phone the tab's two group headings go —
each band still names itself. The tubes are parts of the ship, beside its wheels.

**The rack is the run's input, and nothing in the frame knows where it came from.** 0577 made the run's
tubes a list `begin` takes; this decision only fills it.

## Rollback

`rack` is a new field on the existing `itc_hangar` key, version 1, and the four tubes are new keys on its
`owned` record. Reverting leaves both in the document unread; the previous reader ignores fields and kinds
it does not know, and every ship opens bare as it did. Shards spent on a tube are not refunded by a revert.

## What guards it

`tests/tube-shop.test.ts`: the four at 500 on their own shelf; the second refused before the first, and the
shelf saying so; every rack the ask names and found by its shape; a rack open only on enough tubes, on any
ship; the band on Paint & Parts; the run opening on each rack; the key keeping racks and refusing a forged
one. `tests/tube-shop.browser.test.ts`, in the page: one of each fitted on Paint & Parts and the run's
readout naming a Missiles tube and a Seekers tube; a ship with nothing fitted naming none. Probes in
`scripts/probes/0578-the-tubes-are-sold.mjs`.

## Owed

- A play of the price, and whether 500 a tube buys a run too easy a start — 0577's full rate makes a bought
  rack the strongest opening the game has.
- The pad's ship is baked bare whatever its rack (`paintBlue` draws stage 0); the field's ship wears its
  tubes. Drawing them on the pad is the stand's picture, not this decision's.
