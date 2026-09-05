# 0242 — A blade coils ahead of the ship

**Accepted 2026-09-05**, the same day as [0241](0241-the-ship-wears-its-colours.md), from
[`the-coil-drawn`](../../reports/the-coil-drawn-2026-09-05.md):

> *"starting from the wing tips and circling forwards. the spiral whirlpool we have is cool, but it
> feels really weird and has a lot of hard to control gaps still"*

The player drew the path. **Supersedes the flight of
[0237](0237-the-blades-answer-the-first-play-test.md), [0239](0239-the-guns-answer-the-third-play-test.md)
and [0240](0240-the-blades-reach-the-boss.md)** — a blade no longer circles the ship, on any ring —
and keeps everything else 0234 built: the pool, the edge, the landing once per flash, the spin, the
cue, the hulls and the face.

## The rules

**A throw is a pair, one blade from each wingtip.** Each leaves a quarter-turn off the nose on its
own side and turns TOWARD the nose, so the two cross ahead of it and braid across the band's centre
line twice a loop — which is where a boss sits. `THE PAIR` in `tests/blades.test.ts` holds that a
throw is two, from opposite sides at the same distance, each visiting both sides, and that there is
a step ahead of the nose where the two are within a blade of each other.

**A blade circles a point that goes up the lane.** The loop's centre is the nose at the throw and
moves up the lane at the shot row's `speed` in the camera's frame; the blade circles it at the
weapon row's `coil` radius and `turn`. Its track is a chain of loops — a trochoid — the same width
everywhere on the screen, and it is thrown and gone: it does not follow the ship, so a ship that
moves across the lane after a throw leaves that pair's band where it was, and aiming is moving
across the lane, like the pulse. `THE COIL` reads the loops off the picture — the track crossing
the ship's line and back — and holds that each loop gains ground on the last and none is wider or
narrower than the first by much.

**The reach is the screen's, at every rung.** Nothing but the leading edge ends a blade; `THE EDGE`
holds it on the screen every step and at the leading edge on its last. A rung buys the band: `coil`
is `[7, 9, 12, 15, 18]`, a hull's height to two and a half, held by `THE LADDER` as *wider by half
at the cap* and never as the width.

**The whirlpool is gone, and so is what it gave.** A ring about the ship swept behind and beside it;
a coil is a forward weapon, and a lancer that has got past the ship is not swept. Taken on purpose:
the shuriken's worth is the sweep in front of it, and the coil makes it a wide slow band against the
pulse's narrow fast line, which is a clearer difference than the ring was.

**A landing is once per flash PER BLADE.** `landIn` on the shot (`src/sim/entity.ts`), written by
the landing and run down beside the flash, is what `src/sim/collide.ts` consults; 0234 consulted
the BODY's flash, which read as the same rule and was not: one landing per body per flash however
many blades were across it. Measured the moment the coil was built — a boss under sixteen blades
took thirteen a second, against the arc's forty-five — and it had been true of the whirlpool all
along. `THE SWEEP` in `tests/blades.test.ts` holds one blade's landings apart by more than a step.

**The loop's turn is not a divisor of any rung's cadence.** The first photograph showed two rows
that breathed: every pair turns at one rate from one starting phase, so at a turn of 0.21 the pairs
were exactly a turn apart at the first rung and half a turn at the cap, and every blade on the
screen was at the same point of its loop. At 0.23 the gap is a third of a turn at the cap and a
tenth at the first rung, and a screen of pairs shows every point of the loop at once — the braid.

## The figures, measured against a boss-sized body a hundred ahead in the band's centre

| rung | `coil` | a pair lives | landings per pair on the boss | sustained, once the coil arrives | blades in the air |
|---|---|---|---|---|---|
| 1 | 7 | 2.8 s | 22 | 44 a second | 12 |
| 2 | 9 | 2.6 s | 24 | 55 | 14 |
| 3 | 12 | 2.6 s | 24 | 63 | 14 |
| 4 | 15 | 2.6 s | 24 | 77 | 18 |
| 5 | 18 | 2.6 s | 24 | 92 | 22 |

Every blade spends its whole edge of twelve on a boss pass, so the cadence is the whole of the
ladder against a boss, and at the cap the coil sits with the straight missiles (90, both tubes)
above the pulse (60, every barrel hitting) and the arc (45, cannot miss) — on target only, which
is the trade the player named: *"you'll need to be on target to hit a boss without getting free
hits like you do now with the whirlpool."* The edge stays at twelve at that word, and it is the
lever if the cap is too strong: `BLADE_EDGE` in `src/content/shots.ts`.

## ⚠️ What was rejected

**Keeping the ring at low rungs and coiling at high ones.** Two flights for one gun is two guns
the player has to learn, and the whirlpool's fault — gaps that depend on where the ship is — was
not a rung's fault.

**A loop that follows the ship.** It would put the band back under the player's hand after the
throw, and it is the following that made the ring feel like *a thing it is towing*. A thrown blade
is thrown.

**A radius per blade of a pair, or a phase per rung.** One loop size and one turn per rung, the pair
symmetric: the drawing has one width and the braid's whole point is symmetry.

## What is owed

- **An eye on the coil in motion**, at the shipped camera: whether sixteen blades at the cap read as
  a braid or as a wall, and whether the crossing at the nose reads.
- **The balance**: a wide slow band that reaches the edge from every rung is a stronger gun at rung
  one than the ring was, and `BLADE_EDGE`, `coil` and the cadence are starting points.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content and a flight; nothing
persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0242`:

| broken on purpose | went red |
|---|---|
| a throw made one blade rather than a pair | `THE PAIR: a throw is two blades` |
| both blades of a pair turning the same way | `THE PAIR: a throw is two blades` |
| the pair thrown from the nose rather than the wingtips | `THE COIL: a blade leaves the wingtip` |
| the loop the same size at every rung | `THE LADDER: a rung is a wider band` |

⚠️ **Since [0244](0244-a-blade-rides-a-helix.md) the flight is a helix, not a chain of loops**, and
the second row above — *both blades turning the same way* — is retired: a sine advanced backwards
is the same sine, so there is nothing left to break. The other three rows are still re-run by
`node scripts/prove-guard.mjs 0242`, against `THE HELIX` where they named `THE COIL`.

And the blade probes before it, re-aimed for a coil: `0234` (the loop's centre standing still →
`THE EDGE`; a blade landing again before its own flash has run → `THE SWEEP`), `0237` (the clock
restored → `THE EDGE`; the ladder flat → `THE LADDER`). **Four probes are retired**: 0240's three,
whose lead and stretch no longer exist, and 0237's *the edge no longer ending a blade* — a coil
starts at the top of its loop, so the furthest across it ever gets is where it was thrown, and the
only edge it can meet is the leading one, which the pool's own cull holds as well.
