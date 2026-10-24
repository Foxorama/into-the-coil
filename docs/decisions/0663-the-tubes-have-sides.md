# 0663 — The tubes have sides

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 10. Amends
[0578](0578-the-tubes-are-sold.md): the rack was one band of six shapes with no sides, and the shelf sold a *second*
tube of each kind.

## The ask

> *"Missile tubes should be individual and have a left/right slot, not have a '2nd tube'. You can buy up to two of
> each tube & equip them however you like. The two tubes + one of each is way overengineering it."*

## The rule

- **Two slots, the left and the right** — `tubeLeft` and `tubeRight` on Hangin' Out under *Loadout*, where the `rack`
  band was. Each holds nothing or a tube of a kind (`TUBE_SLOT_OPTIONS` in `src/content/racks.ts`), and each is open
  to a tube the tubes owned are enough for beside what the other slot holds; on 0657's terms what is shut is hidden.
  No band offers *one of each* or *2 missiles* any more: a pair is what the two slots say.
- **A rack is a pair of slots** — `slots` on every row, nine rows, one per pair of none, straight and seeker.
  0578's six names are six of them and keep their meaning, each with its tube or tubes on the side it was drawn
  on: a lone tube on the left, *one of each* straight-left. The new three are `straightRight`, `homingRight` and
  `mixedSwapped`. `rackOf(left, right)` names the row; `tubes` is read off the slots left first, and that is the
  order the run opens on, so the first missile — the one that pops to the top of the lane — leaves from the left.
- **Cosmo's *Fit it now* fills the empty slot** — `rackWith`: the left if it is empty, else the right, else in
  place of the right, so what is fitted keeps its side.
- **No second tube on the shelf** — the second of a kind is still its own ware underneath, because the save owns
  each by name, but it is called what the first is: *Missile Tube*, *"Your second — one for each side"*. While the
  first is not owned, it says *"Your second — buy the first one before it"* rather than *"Buy the Missile Tube
  first"* on a row also called Missile Tube.

## A lone tube flies from the ship's one-tube place

A ship with one tube carries it where its row puts one tube (`tubes[1]`), whichever slot it is fitted in, and the
cars and the bike draw a single roof turret there. Flying a lone right-slot tube from the right would need the run to
carry an empty slot — a new shape for `run.tubes`, read by the pickups, the surge, the readout and both triggers — and
a stage of art per side on four ships. **That is not done here, and it is the one part of the ask this falls short
of**: a lone tube's slot is kept and shown in the hangar, and the run flies it from the one-tube place. If the play
says the side matters for one tube, that is the work it costs.

## Rejected

- **A count per kind on the shelf in place of two wares.** It would change the save's `owned` from a flag per ware
  to a number, for a difference only in what the shelf calls the second ware.

## What guards it

- `tests/tube-shop.test.ts`, *0663*: every pair of slots is one rack and no pair two, each rack's tubes are its
  slots left first; *Fit it now* keeps sides; the open racks for each holding; the save keeps a swapped pair and a
  lone right tube; the two bands are on the loadout with none and then each kind; no ware is called a second.
- `tests/tube-shop.browser.test.ts`, *0663 — THE ASK*: on the built page, a seeker in the left slot and a missile
  tube in the right, and the run opens on them that way round. The other browser tests that fitted *one of each*
  from the `rack` band fit it from the two slots.

The probes in `scripts/probes/0663-the-tubes-have-sides.mjs` make the swapped pair the same as one of each, sell
the second as a second, and cross the two bands. 0579's probes name the renamed loadout test and put `tubeLeft`,
not the gone `rack`, under both tabs.

## Rollback

**The save's `rack` field may now hold three values no earlier build knows** — `straightRight`, `homingRight` and
`mixedSwapped` ([0001](0001-revertability-not-risk-rating.md)). An earlier build reads a rack it does not know as
`bare` (`hangarFrom`, `src/save/hangar.ts`): that ship's tubes come off, and nothing bought is lost — `owned` is
unchanged, so the tubes are refitted by hand. The six names 0578 wrote mean what they did, so a save from before
this reads exactly as it did.
