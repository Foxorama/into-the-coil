# 0524 — The special is fitted

**Accepted 2026-10-05.** Item 4 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
Amends [0441](0441-a-pilot-flies-their-own-ship.md)'s *a run opens with two charges of its own gun's
special*; the slot's rule is [0521](0521-the-hangar-opens.md)'s dash rule exactly.

## The ask

> *"the specials should be separate as well and let you pair the shuriken special with the lightning
> gun once you've unlocked both"*

## The rule

**A ship opens a run on two charges of the special fitted to it in the hangar — its own gun's until it
has been won in, and then the special of any ship that has been won in too.**

| | |
|---|---|
| **the slot** | `special` on the hangar slice: whose special each ship opens with, its own by default. `specialOpen` is `plateOpen`, one line — a ship's own slot, open with its win, offering what won ships bring |
| **the band** | *Special*, in the hangar's right column under what hangs: the four specials, each named as the bomb pickup's faces name it, with its line and the ship it comes from. Shut ones say why, in the dash's words |
| **the run** | `begin` carries the fitted special and `startingArsenal` opens on two of it. Absent, it is the ship's own (`ownSpecial`), so the rig and the tests that fly a run begin exactly as before; the shell always passes the fitting |
| **the ward** | unchanged, and it already read the side of the opening special: a nova fitted to the fighter goes on the ward's trigger, and Burn's void is not added on top, as the caddie's never was |
| **kept** | a new field on `itc_hangar` version 1, per ship, refused unless its own wins open it |

## Why it is built the way it is

**No art and no new fight.** Every special is already thrown from every ship by the bomb pickup (0441),
and none of them reads the gun that is fitted. The one place a ship's gun chose its special was
`startingArsenal`'s first line, and that line now reads the fitting.

**A default, not a constant.** The ship's own special is shared code's fallback, and the hangar's
fitting is the instance — 0282. The action's `special` is optional for that reason and no other: 21
tests and two rig pages begin a run without naming one, and they mean the ship's own.

**One rule for every ship slot.** The dash, the special and — items 5 and 6 — the gun are each a ship's
own slot that opens with its win and offers what other won ships bring. `specialOpen` calls
`plateOpen` rather than restating it, and the shut band's words come from one sentence with the slot's
name in it.

**The hangar was laid out again for three slots.** With the special under what hangs, two options to a
row put the tabs under the readout's corner on a 1280x720. The dash and the special now stand four to a
row and what hangs three. On the shortest phones the special takes the room under the faces that the
card gave up, so Back stays on the screen, and on every phone the balance moved to the bottom corner,
where it no longer stands over Cosmo's tab. Photographed at all three sizes.

## Rollback

`special` is a new field on the existing `itc_hangar` key, version 1. Reverting leaves it unread and
every run opens on its own gun's special again.

## What guards it

`tests/special-slot.test.ts`: every ship on its own, the ask's pairing shut until both are won and open
after, the dash's rule word for word, the run opening on the fitting or on its own, the nova on the
ward's trigger with no void, and the key. `tests/special-slot.browser.test.ts`: the estate's storm fitted
to the fighter, flown, and the readout saying two storms. Probes in
`scripts/probes/0524-the-special-is-fitted.mjs`.

## Owed

- A play of a borrowed special on each tier, Burn especially, where a nova on a ship with no shell is a
  different opening from the caddie's.
- Items 5 and 6, the guns, which share this slot's rule and are the expensive half of the plan.
