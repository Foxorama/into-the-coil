# 0237 — The blades answer the first play-test

**Accepted 2026-09-05**, the same day as [0234](0234-a-blade-circles-the-ship.md), from
[`the-blades-played`](../../reports/the-blades-played-2026-09-05.md):

> *"shrukien stars need to be a lot bigger and spiral outwards from ship to edge of the screen and
> then disappear like a reverse whirlpool effect"*

Two items, both answered. **Amends [0234](0234-a-blade-circles-the-ship.md)**: a blade is no longer
spent by its own clock.

## The rules

**A blade is the size of the ship.** `SHOTS.shuriken.radius` is 3.5 and the star is drawn at 7
units — 0234's was 1.4 and 3.2, and played as *"a lot bigger"*. The hurtbox is the sweep, so a
bigger blade is a wider sweep too. A taste, observed in `tests/authored.ts` as `0237-blade` and
never failed on: nothing breaks at half the size, and a dozen of them at the cap may yet be judged
to bury the lane.

**A spiral ends at the edge of the screen, and nothing else ends it.** A blade has no clock
(`lifeFor` is zero); `steerBlades` retires it on the step its next place would be off the screen,
allowing it its own drawn half-size over the edge, so it is gone when the last of it is and never
while half of it still shows. The along edges are the view's own (`w.view.alongSpan`), the one
quantity here that varies by device — [0023](0023-the-long-axis-is-the-scroll-axis.md) — and it is
the screen the ask names. `THE WHIRLPOOL` in `tests/blades.test.ts` holds both halves in the
player's units: drawn on the screen on every step of its life, and last drawn within a ship's
length of an edge.

**A rung is more of a turn before the edge.** `orbit` on the weapon row is no longer a life; it is
how tightly the spiral is wound — steps to the lane's half-width, which is the nearest the edge can
be to a ship in the middle of the lane. Every spiral ends at the same place, so what an upgrade
buys is how much of a turn it makes getting there, which is what *"the arc lasts longer"* means
when the screen says how wide. Held as MORE at the cap than at the first rung, never as a count.
The shot row's `speed` is zero: how fast the spiral opens is the rung's, not the shot's.

## The figures, from a ship in the middle of the lane at its starting place

| rung | `orbit` | a blade lives | turns before the edge | blades in the air |
|---|---|---|---|---|
| 1 | 70 | 1.2 s | 1.2 | 3 |
| 2 | 100 | 1.4 s | 1.4 | 4 |
| 3 | 130 | 2.3 s | 2.4 | 7 |
| 4 | 160 | 2.3 s | 2.4 | 8 |
| 5 | 190 | 3.2 s | 3.4 | 13 |

⚠️ **The turns come in pairs, and that is the screen and not the ladder.** A blade leaves by the
edge behind the ship at about 45 units out or by the lane's sides at about 54, and which one it
meets depends on where in its turn it is when it gets that far — so rungs two and three, and four
and five, buy the same quarter-turn and differ in the cadence. Every rung still changes something
(`tests/weapons.test.ts`), and the balance is a hand's. At the rim a blade covers about six units
a step, more than its own hurtbox, which is what the swept collision is for.

## ⚠️ What was rejected

**A wider spiral by a faster opening.** The screen is the width; opening faster reaches it sooner
with less of a turn, which is the opposite of the ask's *"increasingly large arc"*.

**A spiral that keeps going once it is wider than the lane.** It leaves by one edge and comes
back in by another, which is a thing dropped and not a whirlpool. Off the screen is off the game.

**A guard on the size.** Nothing a blade does depends on it, so it is a taste and the number is
the player's — [0192](0192-a-guard-holds-an-invariant.md).

## What is owed

- **An eye on the whirlpool in motion**, at the shipped camera: whether thirteen ship-sized stars
  at the cap read as a spiral or as a wall, and whether the rim's speed reads as a whip.
- **The balance.** `BLADE_EDGE`, the ladder and the cadence are still starting points.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content and a clause in the
flight; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0237`:

| broken on purpose | went red |
|---|---|
| the edge of the screen no longer ending a blade | `THE WHIRLPOOL: a blade is on the screen` |
| the blade's own clock restored | `THE WHIRLPOOL: a blade is on the screen` |
| the spiral wound the same at every rung | `THE LADDER: a rung is more of a turn` |

And `node scripts/prove-guard.mjs 0234` over the rewritten suite: every probe still red.
