# 0252 — The gyre spins

**Accepted 2026-09-06**, the night after [0251](0251-the-volcanoes-belch.md), the fourth of the
real bosses' own decisions, from [`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"The labyrinth will an upgraded version of the current end boss of saurian belt - the upgrades
> are that it will spin and that the bullet walls will have the bullets closer together - the
> spaceship gaps will be the same size, but the bullet gaps will be close so you can't fit through
> them. it'll spin and create diagonal, vertical and horizontal gaps to fly through."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the gyre's row is the fight the
brief described, and the rake stops being the spin's stand-in. **Amends
[0151](0151-the-gap-you-have-to-reach.md)**: a curtain has a stance; everything 0151 says about the
hole still holds, read along the line.

## The rules

**A curtain has one of four stances, and a spinning wall takes them in turn.** `CURTAIN_STANCES`
is closed — `across`, `slant`, `along`, `backslant` — and `Uncoil.spin` is whether the row goes
round it: `false` on every wall but the gyre's. The k-th curtain of a spinning fight takes the k-th
stance, round and round; the first curtain of every fight stands across the lane, which is what
keeps every guard in `tests/level.test.ts` that reads a curtain by its `across` honest: they all
drive the first notch. `across` is every curtain before this decision, exactly.

**A slanted wall travels down the lane; a wall along the lane falls across it.** The `slant`
leans corner to corner — its foot at the hull on the near edge, its head a lane's width ahead on
the far edge, √2 lanes long — and is thrown down the lane like the wall across it, so it sweeps
the lane one row at a time as the leaning line passes; the `backslant` leans the other way. The
`along` wall lies just over the top edge from the camera's trailing edge to the hull and falls
across the lane at the bullet's speed. No wall comes from behind, because nothing in this table
travels up the lane. `THE FOUR WALLS, DRIVEN` in `tests/gyre.test.ts` throws the first four curtains
and holds, for each, which way it stands and spans in the player's units, that its shots are one
line, that the line has one hole of the authored width at the authored share, and that nothing
travels up the lane; `and the wall along the lane is a wall` parks a ship at that curtain's hole
and one hole's width along, and holds that the second is hit within the seconds the wall takes to
fall and the first is not.

**The hole is the same share of the line every time.** `at` is a share of the lane; along a line
of any length it is the same share of that length, cut `hole` wide, so a player who has learned
where the gap is in the wall across the lane knows where it is in the wall along it.

**The bullets stand too close to slip between, and the ship's gap is no narrower than any
other wall's.** Both were already true of the gyre's row since 0247 — gap 3 against a flak of 0.9
leaves 1.2 units between bullets for a ship four wide — and `THE SPIN` says so in the brief's
words, so the upgrade is held as the two halves it was asked for.

## The figures

| stance | the line | thrown |
|---|---|---|
| across | the lane's width at the hull, 35 shots | down the lane |
| slant | hull on the near edge to a lane ahead on the far edge, 49 shots | down the lane |
| along | camera's edge to the hull, just over the top edge, ~44 shots | across the lane, falling |
| backslant | hull on the far edge to a lane ahead on the near edge, 49 shots | down the lane |

## ⚠️ What was rejected

**An angle, swept along its own normal.** The first draft was `spin` in radians, the line turned
by `k × spin` and thrown along its normal so that it arrived everywhere at once. A wall that
arrives everywhere at once must start entirely outside the field, and a diagonal that does so has
one end as far above the lane as it is slanted — sixty-five units, against an across cull of forty.
It lost its top third on the step it was thrown, and the third it lost was the one that would have
walled the trailing edge. The lane has edges; four stances the edges allow are honest, and an
angle they do not is not.

**The hull drawn turning.** A sprite is baked and blits at one orientation (0022); a gyre that
visibly rotated is a second atlas frame per stance. The rake already turns its fan, and the walls
turning is what the brief asked to see.

**A wall from behind.** The half-turn of the first draft was the wall across the lane again,
travelling up it — a curtain arriving from the trailing edge, where nothing has ever come from.
The four stances have nothing that travels up the lane.

## What is owed

- **An eye on the slant at the shipped camera**: forty-nine bullets corner to corner, the longest
  line in the game, passing over ten seconds — whether it reads as one wall crossing the screen or
  as a field of flak is a picture.
- **The far-wall reach for the turned walls.** 0151's reach guard drives the first, across
  curtain; the wall along the lane takes a hundred steps to fall and its hole is a third of the way
  up the field, which the ship covers in under a second, but that is arithmetic and not a drive.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A closed list, a field on
`Uncoil`, two arguments on `throwCurtain`, one function; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0252`:

| broken on purpose | went red |
|---|---|
| the spin never read, so every curtain stands across the lane | `THE FOUR WALLS, DRIVEN` |
| the wall along the lane thrown down it, so it never falls | `and the wall along the lane is a wall` |
| the hole read as a place across the lane, so it moves as the wall turns | `THE FOUR WALLS, DRIVEN` |
| the stances not taken round, so the fourth wall is the first again | `THE SPIN` |
| the slant not leaning, so it is the wall across the lane again | `THE FOUR WALLS, DRIVEN` |
| the gyre's spin authored away | `THE SPIN` |

0151's three probes on the curtain re-anchored on the lines the stance moved.
