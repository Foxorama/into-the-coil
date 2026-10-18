# 0619 — Every flame is the largest

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 5.

## The ask

> *"all thrusters should be at the same size -> set to max current size"*

## What was measured first

**In the fight the flames were already one size.** Every ship burns the same bitmaps (`THRUST` in
`src/content/exhaust.ts`) at the same scale; the rows differ only in how many nozzles and where. So the size that
differed is the port's — the hangar pad and the intro — where a flame is baked inside its ship's box and blitted at
the ship's size, `intro` on its row. Every ship is drawn at 1 there except the saucer, at `1 / CADDIE_DISC` in the
hangar (1.39) and `0.8 / CADDIE_DISC` in the chase (1.11), so the saucer's flame was the largest by those factors.
Photographed on the pad before and after (`shot-pad-all`, a scratch rig over `dist/`): the caddie's flame was
visibly the longest of the seven, and after it every ship's matches it.

## The rule

**Every ship's flame in the port is baked `jetGrow(ship, view)` times its length, width and bloom** — the largest
`intro[view]` of any ship over its own — so on the screen every flame is the largest ship's. `view` is the hangar's
for the side-on set (`blueIdle`, `blueBurn`, `blueFlare`, `blueSurge`) and the chase's for the set seen from above
(`blueTopBurn`, `blueTopFlare`, `blueTopSurge`). The root does not move: it stays on the ship's own nozzle.

## What it does not make equal, and why

`blueBurn`, `blueFlare` and `blueSurge` are blitted both in the hangar and for the first moments of the chase, before
the tilt crosses to the set seen from above. One bitmap cannot be the largest at two sizes whose ratio differs by
ship — the saucer's 1.39 against 1.11 — so in those moments a side-on flame on any ship but the saucer is a quarter
longer than the saucer's. None is smaller than the largest anywhere, which is the ask's direction. A second side-on
set for the chase would close it, at three more pictures in the port's closed list; not built, because the moment
lasts until the tilt and the tilt is under a second.

The Viper's flames are hers and are not a pilot's ship; they are untouched.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): in the port nothing is dodged; the flame grows only behind
the ship's own tail. The flame box (`FLAME_BOX`, twice the ship's) still holds the longest flare with a radius to
spare — the cars' pipes at 1.12 of the box's radius are the furthest back, and a grown flare ends at 2.5 of the
4.8 the box allows.

## What guards it

`tests/intro.test.ts`, *0619*: on the pad and in the chase, every ship's flame — the scale it was blitted at times
its grow, in pixels of a 1080p screen — equals the saucer's, and is no smaller than the largest flame any ship drew
before. Probes in `scripts/probes/0619-every-flame-is-the-largest.mjs`, both seen red.

**Not held by any guard:** that the bake multiplies by the grow — the guard reads `jetGrow` and the blit, and the
photograph read the bake.

## Owed

A look at the pad and the intro on a deployed preview; whether the chase's first second needs the second set.
