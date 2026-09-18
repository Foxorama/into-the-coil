# 0332 — The gyre is set into the wall

**Accepted 2026-09-18.** **Amends [0252](0252-the-gyre-spins.md)** — four stances become eight, and
*the hull drawn turning* stops being refused. **Amends [0151](0151-the-gap-you-have-to-reach.md)** —
the gap between two curtains is a ladder rather than a constant, still counted in health. **Builds
on [0306](0306-the-serpent-coils-in.md)** — a blit can rotate; **[0320](0320-the-fish-kindles.md)** —
a phase may change the body, inside the box the first phase taught.

## The ask

> *"For the labyrinth boss, let's do the following. 1) upscale the graphics and have it change as it
> gets more damaged. 2) when it appears on screen I want it 'locked' into the background like a cog
> set into an image. 3) for the section of it that looks pointed, I want the 'wall of bullets' to
> come from the direction that that is facing, when it fires a wall, it ticks around like a cog to
> point in the next direction — it currently has 8 points so it'll turn 1/8th every fire and the
> wall comes from that direction it's pointing when it next comes. 4) the walls and turns come
> faster as it gets more hurt."*

## The rules

**A cog is a compass, and its spike names the edge the next wall comes in over.**
`CURTAIN_STANCES` is eight and in compass order from the leading edge round toward the far one, and
`cogTurn(k)` is the turn that aims the hull's spike at the k-th stance's own edge. The hull is aimed
at `bossUncoilAt` — the wall that has **not** been thrown — so the spike spends the whole gap
between two walls saying where the next one is from. `swingTo` ticks it round an eighth at
`COG_TICK`, the short way, so the wrap from the eighth point back to the first reads like the seven
before it.

**Every wall spans a whole axis of the field, and the lean goes into the axis it travels along.**
Four of the eight are the pure walls the field allows: `across` at the hull going down the lane,
`astern` behind the camera coming up it, `alongNear` and `alongFar` lying along the lane outside one
edge and falling across it. The four corners are those tilted toward the corner named:
`slant`/`backslant` lean a whole lane's width because they are thrown down the lane and the leading
cull is 280 units out; `rakeNear`/`rakeFar` tilt 30 units into the margin because `EDGE_MARGIN` is
40 and a shot laid past the cull is retired on the step it is thrown.

**A wall from astern is laid as deep as the field has and comes on slower than any other.** 34
units behind the camera, at 0.45 of the bullet's own speed in the camera's frame.

**A boss may be set into the place, and then it does not move.** `BossMove` takes a `socket` arm:
it closes on `at` across the lane at the row's own `patrol`, stops there, and the phase does not
scale it. The row's `drift` is zero beside it, so it holds station along the lane too. `seat` is the
housing it is set into, drawn behind the hull in the layer the serpent's aura occupies — **a boss
has an aura or a seat and never both**, because one pool holds them.

**A curtain's gap may shrink as the bar falls, and it is still counted in health.** `Uncoil.quicken`
is `{ by, least }` — each gap is the last times `by`, floored at `least` — and `uncoilsBy` walks the
ladder. **`least` is what makes it terminate**: without a floor the series converges and the count
runs away short of the end of the bar.

**A phase may change the body.** `BossPhase.hull` names a bitmap and its hurt twin, inside the
extent the row's own sprite has.

## The gyre, then

| | before | after |
|---|---|---|
| extent / hurtbox | 36 / 14 | **52 / 20** — 0.385 of its extent against 0.389 |
| near end of its swing | 130 − 5 − 14 = 111 | 130 − 0 − 20 = **110**, 62% of the narrowest screen |
| how it flies | `patrol`, drift 5 | **`socket` at lane 50, drift 0**, in a 68-unit housing |
| stances | 4 | **8**, and the hull shows which is next |
| walls in a fight | 9, evenly spaced | **17**, the last pair 2.5× closer than the first |
| bodies | 1 | **3** — whole, chipped at 0.7, broken at 0.4 |

## ⚠️ What was rejected, and the geometry that rejected it

**A true 45° wall, per corner.** *"The wall comes from that direction it's pointing"* reads most
naturally as a line perpendicular to the spike, sweeping along it — and that is the draft 0252
already refused and this one measured again. A diagonal that covers the lane at one instant spans
200 units of `across` at its ends; `ACROSS_CULL` is `[−40, 140]`, so its two corners are retired on
the step they are thrown and the wall arrives with a hole at each end that nobody authored. **The
field supports exactly four pure walls**, one per axis-and-direction, and everything else is one of
those tilted. The tilt has to go into the axis the wall TRAVELS along — a tilt in the axis it SPANS
is the same lost corner in a different costume.

**The spike as a muzzle.** The other reading of the ask: the wall is *emitted* in the spike's
direction. It is incoherent for a third of the compass — a wall emitted up-lane from a hull that
already sits at the leading edge travels away from the player and does nothing at all, and the two
corners either side of it are nearly as bad. Read as *the edge it comes in over*, all eight
directions are live and the one that was impossible becomes the best of them. The two readings
differ by four notches and nothing else, so if play prefers the other it is `cogTurn`'s `+ π`.

**A wall from behind, refused by 0252 and taken here.** *"A curtain arriving from the trailing edge,
where nothing has ever come from."* That objection was about a wall with no warning; the cog is the
warning, and it has been aimed at that edge since the wall before. What the amendment owes is
reachability, and it is paid in the guard rather than in arithmetic: a live ship starting at the
back of its box on the far edge from the hole flies for it and is not caught, and the same ship
sitting still is.

**A `fireEvery` for the quickening.** *"Faster as it gets more hurt"* is a cadence in the player's
ear, and a cadence in steps is exactly what 0151 refused: it bills a base-weapon player three times
what it bills one at the design loadout, because they stand inside each phase three times as long. A
gap that shrinks in HEALTH shrinks in seconds too for anyone whose damage is roughly steady, and
charges nobody for owning a slower gun.

**Three silhouettes as a way of saying how much boss is left.** Still refused, and this is not it —
`src/content/bosses.ts`'s opening note is about inventing a costume change to stand in for a rate
and a spread. This is the player asking for the damage itself, which is 0305's and 0320's own
distinction.

## Three things the instruments sent back

⚠️ **THE SHEET SAID IT WAS A STAR.** The first upscale kept 0264's alternating 16-gon and simply
moved the numbers — points at 0.86, valleys at 0.66. Photographed at 4× on
[0193](0193-the-sheet-is-the-instrument.md)'s sheet it came back an **eight-pointed star** with two
arcs of shading and four bars laid across it, and the spike was indistinguishable from the eight
points either side of it — which is the one thing this fight cannot afford. A tooth is flat-topped
and a tenth of the radius deep, and the drawing is rings: a rim band, a web, a hub, and every mark
belonging to exactly one of them. **Every guard was green for both drawings** —
[0027](0027-measure-the-picture-not-the-model.md).

⚠️ **AND THEN IT SAID THE MOTIF WAS LIVERY ON A HULL AND NOISE ON A WHEEL.** `motif` steps a grid
over a belly's bounding box and drops any mark that does not fit; on an annulus that is wherever the
grid happens to intersect, and the ring came back with three labyrinth pads stuck to one side of it.
The cog carries no motif now, and what says which place this is on it is the skin — which is what
0228 actually put there.

⚠️ **AND A PROBE SAID THE REACH GUARD COULD NOT FAIL.** `ASTERN_SHARE` broken to 1 left
*the wall from astern can be beaten to its hole* **STILL GREEN**: at `legendary` the ship crosses to
the hole in about three quarters of a second and the wall takes forty-three hundredths, so the guard
was driving the one tier where the number does not matter. It is driven at `burn` now, where
`shotSpeed` is 1.3 and nothing the ship does is scaled. A fairness floor that only holds on the easy
tier is not one — and `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` is the only reason that
was found.

## What is owed

- **An eye on the eight at the shipped camera.** Every number here is a model quantity —
  [0027](0027-measure-the-picture-not-the-model.md) — and *does a 14° rake read as crooked* and
  *does a spike read at 52 units across a teal place* are pictures. The bench and the shot sheet are
  the instruments.
- **The fight flown.** Seventeen walls where there were nine, on a hull that no longer dodges, is a
  change in what the fight COSTS and no guard here measures that.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content rows, five bitmaps, one
arm of a union and one field on another; nothing persisted, no storage key, no save-schema change.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0332`:

| broken on purpose | went red |
|---|---|
| the cog turning a quarter of a turn a wall rather than an eighth | `THE SPIN: eight stances` |
| the hull aimed at the wall it just threw rather than the one coming | `and the wall comes from the edge the spike is aimed at` |
| the near and far edges swapped in the compass | `and the wall comes from the edge the spike is aimed at` |
| the wall from astern laid at the hull and thrown down the lane | `THE EIGHT WALLS, DRIVEN` |
| the wall from astern coming up the lane at the bullet's own speed | `and the wall from astern can be beaten to its hole` |
| the quickening never read, so the gap is flat for the whole fight | `THE WALLS QUICKEN` |
| the quickening's floor ignored, so the gaps converge | `THE WALLS QUICKEN` |
| the socket arm sliding across the lane rather than stopping on its seat | `SET INTO THE WALL` |
| the housing never laid behind the hull | `SET INTO THE WALL` |
| the phase's own body never worn | `and it wears its damage` |

`node scripts/prove-guard.mjs 0252` — all six of 0252's, re-anchored on the lines the eighth stance
moved, still red. 0151's five and 0260's one re-anchored on the `quicken` the row grew.
