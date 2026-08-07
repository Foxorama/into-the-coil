# 0065 — The sky is baked and blitted, and it is not entities

**Accepted 2026-08-07.** Uses [0022](0022-frame-rate-is-a-feature.md)'s bake-and-blit pipeline for
something the size of the screen. Adds one ink to
[0024](0024-the-accessibility-floor-is-settings.md)'s palette and one exception to the contrast floor.

## The rule

**The sky is two baked tiles, blitted a fixed handful of times a frame.** Each tile is `ACROSS_SPAN`
units square, so it covers the short axis exactly and tiles along the scroll axis only. Each layer
moves at a fraction of the camera's rate — **strictly below 1**, or it is not a background.

**A star is never an entity.**

**`sky` is an ink, and it is the one ink held to the OPPOSITE of the legibility floor**: nearer the
void than anything that carries meaning.

## What was reported

> *"Needs a starry background or a background of some kind."*

## Why it is tiles and not particles

`CAPACITY` in `src/app/mount.ts` totals 0022's 500-entity worst case **exactly**. A starfield made of
bodies would therefore either overrun the frame budget or come out of the pools that hold bullets —
and a pool that refuses a spawn is a bullet that silently does not exist. `docs/state-of-play.md`
flagged this before the work started.

A tile is one bitmap and a handful of `drawImage` calls, which is the pipeline 0022 already describes.
Three or four blits per layer, on every device the clamp allows.

⚠️ **0022 names background parallax first in its list of what may legitimately differ by device**, so
this is also the one part of the frame that is allowed to shed under load. Nothing sheds it yet;
naming that the shed is available is the point.

## Two constants moved, and one of them was mislabelled

**The bake ceiling was a flat 256 pixels and it always meant a resolution.** 256px is a 26-unit boss at
ten pixels per unit — so the number was a resolution wearing a size's clothes, and it only looked like
a size while nothing in the game was bigger than a boss. A sky tile is four times that: under a flat
cap it bakes at a quarter of the detail and is blitted at three times its own resolution, and the
picture is wrong on the biggest thing on the screen and nowhere else. `bakeSize` is now exported and
pure so the property — *every kind is capped at the same pixels per unit* — can be stated without a
canvas.

**The near layer is sparser than the far one**, which is the wrong way round for depth and the right
way round for a shooter: the near layer moves fastest, and fast dots are the ones that compete with a
bullet. Size carries the depth instead.

## The ink, and the one inverted guard

`tests/palette.test.ts` holds that **every ink clears WCAG AA against `space`**. The sky must not:
a dot bright enough to clear that floor is a dot the player has to check is not a pickup.

⚠️ **So the floor is INVERTED for it rather than waived**, and the second half is the load-bearing
one: the sky has to sit nearer the void than **anything that carries meaning**. An ink can be dim and
still be closer to `pickup` than to the background, and that is the case that costs a life.

⚠️ **The high-contrast palette's sky is DARKER than the vivid one's**, not brighter. A high-contrast
palette maximises the separation between what matters and the background; a louder sky spends exactly
that separation on scenery.

## Confirmed, not assumed

Probes in `scripts/probes/0065-sky.mjs`. **5 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the sky brightened to where a star reads as something to fly into | `the SKY is the one ink held to the opposite rule` |
| the sky darkened until it is the void, so there is no parallax to read | `the SKY is the one ink held to the opposite rule` |
| the tiling count rounded rather than ceiled, so the widest device is a tile short | `covers the whole view, so no seam of empty space ever crosses the screen` |
| the tile straddling the trailing edge dropped, so a bar of empty sky crosses the screen | `covers the whole view, so no seam of empty space ever crosses the screen` |
| the bake ceiling returned to a flat pixel count, so the sky bakes blurry | `the bake ceiling is a RESOLUTION, so the biggest bitmap is not the blurriest` |

⚠️ **The coverage guard measures ONE LAYER AT A TIME, and measuring both at once hid the bug it
exists for.** The layers move at different rates, so at any camera one is nearly aligned with a tile
boundary and the other is not — and an instrument fed both records the luckier layer's edges. The
first version passed with a layer visibly a tile short, and `npm run prove` reported **STILL GREEN**
([0019](0019-a-probe-must-be-seen-to-apply.md)). A guard that aggregates the thing it is comparing is
not a guard.

⚠️ **The `ceil`-for-`round` break is invisible at 16:9**, where the span is 1.78 tiles and the two
agree. It is a whole missing tile at 21:9 and nowhere else, which is why the guard runs every view the
clamp allows.

⚠️ **Both breaks of the ink are probed, in opposite directions.** A background can fail by being too
loud and by not being there at all, and a guard against only the first would let the second land as a
tidy-up.

## What this leaves owed

**Nothing has been looked at.** Every number here — two depths, two star counts, two dot sizes, two
colours — is a starting point, and the thing that settles a background is a pair of eyes.
[0027](0027-measure-the-picture-not-the-model.md) is emphatic that this is exactly the class of change
whose guards can all be green while the picture is wrong, and `scripts/shot.mjs` renders the shipping
camera precisely so it can be looked at.

**The sky does not shed under load.** 0022 permits it and nothing does it; there is no load signal in
the game yet to shed against.

**Nothing themes it.** `docs/game.md` themes levels on biomes and names none of them, so a sky per
level is a table edit whenever that decision is made — the layers are already a per-scene value on the
world rather than a constant.
