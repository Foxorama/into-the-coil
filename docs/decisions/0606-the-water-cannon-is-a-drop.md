# 0606 — The Water Cannon's face is a drop

**Accepted 2026-10-12.** **Amends [0595](0595-the-aqua-duck-paints.md)** in one place: the picture on the
Water Cannon's pickup face (`pickupWater`). The jet, its sweep, its ink and its landing are untouched.

## The report

From the review sheet of the secret pilots, at zoom 4 beside every other face:

> *"The water special pickup looks weird, it could just be a water drop"*

## The rule

**The Water Cannon's face is one drop of water, point up, in the `water` ink: a shaded crescent down its
right side and round its bottom, a streak of light down its left, and a glint above the streak. It sits in
the pickup's bubble at three quarters of the box, as every face does (0236).**

## Why

**The nozzle did not read as water.** 0595 drew a brass nozzle throwing a jet that curled over and fell in
three drops. On the sheet it reads as a thin hook. The nozzle takes up a corner of the face, and the jet is
too thin to fill the rest. A face is read at pickup size in the middle of a fight, so it has to be one shape.

**A drop is the one teardrop among the faces.** All eleven faces were photographed side by side before this
was drawn (`scripts/shot-sheet.mjs pickupBomb … pickupNova`). The bomb and the candle are long bodies, the
missile a chevron. The dance, nova, void and seeker are round. The arc is a bolt, the shuriken a star,
the shield a crest.
None of them has a point on a round body, so a drop collides with none of them.

**It says *water* and not *cannon*, and that is accepted.** The face names what the special is made of,
as the candle and the nova do. The jet itself says how it behaves the first time it fires.

**The outline is one curve.** `x = a·sin t·sin(t/2)`, `y = −b·cos t` has its only corner at the point,
so the round and the tip are the same line and the hull is one closed path for `seal`.

**The glint is 0.1 of the glyph radius and not 0.06.** At 0.06 it was 1.8 px across on a 1280×720
screen, and `tests/accents.test.ts` refused it: a mark under 2.5 px is not drawn at all. The guard was
right, so the glint was enlarged and the guard was left alone.

## Rejected

- **The nozzle made thicker.** It would still be two objects in a small circle, and the curl would still
  be the part that reads.

## Rollback

Nothing irreversible: no key, no save field, no cache prefix.

## What guards it

The suites that already walk every face: `tests/accents.test.ts` (the hull, the marks on it and their
size), `tests/duck.test.ts` (the face's ink is `water`), `tests/faces.test.ts`, `tests/pickups.test.ts`.
No new guard, so no probe.

## Owed

- **A look at the shipped camera**, on a place's backdrop, mid-fight.
