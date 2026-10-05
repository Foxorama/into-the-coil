# 0526 — The gun is fitted

**Accepted 2026-10-05.** Item 6 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
Puts [0525](0525-the-gun-is-a-layer.md)'s layer in the hangar; the slot's rule is
[0521](0521-the-hangar-opens.md)'s dash rule exactly, as [0524](0524-the-special-is-fitted.md)'s is.

## The ask

> *"I do want guns to be interchangable per ship as well, it's expensive, but it makes the modding a lot
> more fun and a lot higher quality"*

and, asked which ships a gun may go on: *"Only onto ships you've won in."*

## The rule

**A ship flies a run with the gun fitted to it in the hangar — its own until it has been won in, and then
the gun of any ship that has been won in too. Everything that draws the ship draws that gun.**

| | |
|---|---|
| **the slot** | `gun` on the hangar slice: whose gun each ship flies, its own by default. `gunOpen` is `plateOpen`, one line |
| **the band** | *Gun*: the four guns by name, each with its line and the ship it comes from. Shut ones say why, in the dash's words |
| **the run** | the shell passes the fitted gun to `begin`, which 0525 already carried; absent, it is the ship's own |
| **the atlas** | the six sprites of each ship — three stages, each with its hit flash — re-baked in place with the gun it flies, at a run's start, on a pilot changed in the hangar, and after every full bake of the atlas, as `bakeNebula` re-bakes the sky. A ship back on its own gun is baked back. `withGun` scopes the choice to one bake, so nothing else reads it |
| **the pictures** | the readout's lives icon and the title's flyer from the chrome's own atlas, re-baked the same way; the pilot card's ship and its gun line; the intro's hangar, where the saucer, seen from the side, stands the borrowed gun's side mount on its rim's nose in place of the ray gun; the finale |
| **the readout** | says the gun with the lives — *"3 lives, Arc"* — because its icon is hidden from a reader, and since this item the picture was the only place that said which gun was flying |
| **kept** | a new field on `itc_hangar` version 1, per ship, refused unless its own wins open it |

## Why it is built the way it is

**Re-baked in place, not a second set of sprites.** Sixteen pairings of six sprites would be 96 bitmaps
for a run that flies one ship. The sky already re-bakes its sprites in place when the place changes, and
nothing holds a reference to a sprite's bitmap across a frame, so the same move serves here. What it
costs is that every full bake has to be followed by it, and there are three full bakes; each now calls
the same function after it.

**One rule for every ship slot, the third time.** `gunOpen` calls `plateOpen`; the band's shut line is the
dash's sentence with the slot's name in it.

**The hangar was laid out again for four slots.** A fourth band down the right column put the tabs under
the readout's corner on a 1280x720 and Back under an 844x390's fold. The gun now stands beside the
special under the card — the two things a run fights with, read across — and the panel stands a little
lower, its rows a little closer. Measured with the type widened toward CI's: the tabs clear the readout
by 21 px here and 10 px widened, and Back ends 44 px above the bottom at worst. On the shortest phones the gun
takes the room under the faces and the special goes under it.

## The boss floor, in all sixteen

A borrowed gun fires from a different place, so 0260's floor — forty seconds and eight volleys a phase,
the serpent's twenty-eight — was measured with every gun in its own ship and is now applied to twelve
pairings it never saw. **Flown, all twelve, from every held place, before anything changed:** a borrowed
gun lands within about three seconds of its own ship's time, either way, and every pairing meets every
floor but one — the ray fitted to the estate, whose bonnet hardpoint stands well forward of the saucer's
rim, ended the serpent's first phase in 7.0 s, **7.8 volleys** where eight are asked. The closest of the
rest is the ray on the Firebird and the estate against the quetzal, at 40.0 s.

Answered on the serpent's row, as 0441 answered its pairings: the serpent authors the ray at **0.93**.
The saucer's own ray takes that fight in about fifty seconds, so the only fight it moves is the one that
was under.

The floor's flight and its two checks moved into `tests/boss-floor.ts`, so the own four (still in
`tests/level.test.ts` and `tests/serpent.test.ts`, with their reasons) and the borrowed twelve
(`tests/gun-floor.test.ts`) are held by one copy, which now reports every pairing under the floor
rather than the first. The twelve cost about two and a half minutes, so they have a file of their own,
which is the unit CI's shards deal.

## Rollback

`gun` is a new field on the existing `itc_hangar` key, version 1. Reverting leaves it unread and every
ship flies its own gun again.

## What guards it

`tests/gun-slot.test.ts`: every ship on its own, the ask's pairing shut until both are won and open
after, the dash's rule word for word, the band's names and whose each is, the run flying the fitting
from the fitted hardpoint or its own, and the key, old and new. `tests/gun-slot.browser.test.ts`: the
estate's arc fitted to Hook's fighter, the hangar's card naming it, flown, and the readout saying it.
Probes in `scripts/probes/0526-the-gun-is-fitted.mjs`.

## Owed

- A play of a borrowed gun on every ship, and the eye on each mount in its place at the shipped camera —
  0525's design pass, which this item makes visible.
- Items 7 to 10.
