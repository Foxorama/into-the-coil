# 0630 — The guns are not blocks

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 3, its guns half. The
missiles half is [0629](0629-a-launcher-and-not-a-box.md). Amends [0545](0545-the-catherine-wheel.md)'s estate
launcher block, [0595](0595-the-aqua-duck-paints.md)'s marker and [0581](0581-the-weapons-sit-right.md)'s pulse
silhouette.

## The ask

> *"Ships: update boring blocky gun + missiles with nice art"*

## What was blocky, photographed first

At the sheet's zoom, in the fight on the bench, and on the hangar pad:

- the estate's own shuriken launcher: a slate square on the bonnet with the steel star in its face;
- the Aqua Duck's own marker: a dark trapezoid under its chin with a chrome barrel out of it;
- the fighter's own pulse: a chrome block of two barrels from its pad to its mouth.

The Firebird's spare wheel on its spindle, the caddie's ray gun, the Thunderbolt's lightning ball and the ball's ram
were already shapes and not blocks.

## The rule

Each change is to the gun's silhouette, in its ship's outline and its paint alike. At the fight's camera these guns
are two to five pixels, and only the outline reads there; every solid mark on them still clears 0106's 2.5 px.

| | |
|---|---|
| **the estate's launcher** | a drum about the star (`ESTATE_DRUM`, 1.8 units): lit along its top and dark under, a dark aperture round the star. A gilt collar where it met the bonnet was a pixel tall at the fight's camera, under 0106's floor, and went. The star and the muzzle are where they were |
| **the duck's marker** | its underside tapers in under the barrel, and a grip hangs under it (`DUCK_MARKER_BELOW`), so it reads as a paint marker. The hopper and the barrel are as they were |
| **the fighter's pulse** | a muzzle brake at its mouth (`PULSE_BRAKE`, 0.18 of the box's radius at the gun's scale; at 0.12 it was 1.7 px). It is wider than the barrels behind it and darker than they are, in the hull's outline (0581's silhouette) and in the paint |

Nothing a gun fires from moved: the rows' muzzles are where they were (`tests/mounts.test.ts`).

## What guards it

`tests/launchers.test.ts`, *0630*, at the fight's camera, in the ships' drawn silhouettes:

- the estate's drum crown is solid and the old block's top corners are sky;
- the duck's grip is solid and its old box's front-bottom corner is sky;
- the fighter's brake is solid a brake's width out, and over the bare barrels just behind it the same width is sky.

The fighter's point behind the brake was walked first: further back, the gun's pad and the nose are wider still.

Probes are in `scripts/probes/0630-the-guns-are-not-blocks.mjs`, all three seen red, each gun put back to its
block.

## Owed

- **A look in play** on all three, above all whether the drum and the grip read at the fight's size or only on the
  pad.
