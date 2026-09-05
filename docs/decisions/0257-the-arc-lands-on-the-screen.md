# 0257 — The arc lands on the screen

**Accepted 2026-09-06**, the same day as [0256](0256-a-pickup-keeps-the-count.md), from
[`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"chain lightning jumps too far, enemies don't even get a chance to get on screen."*

**Amends [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)**: a link's target is bounded by
the screen as well as by the reach. The reach ladder — cut back twice from play by
[0239](0239-the-guns-answer-the-third-play-test.md) and
[0241](0241-the-ship-wears-its-colours.md) — is untouched.

## The rule

**A link lands only on a body whose whole hull is on the screen.** `nearestFrom` in
`src/sim/collide.ts` takes the leading edge of the view and skips a body whose far side is past
it; `fireArc` in `src/app/frame.ts` passes `cameraAlong + view.alongSpan` — the view this player
has, on [0246](0246-a-seeker-hunts-on-the-screen.md)'s terms for the seeker, because the claim is
about what the player can see and a wider screen sees more. Measured on the hull rather than the
centre, so the first frame a body is struck on is a frame it is whole in.
`THE SCREEN` in `tests/weapons.test.ts` puts the ship at the front of its box at every rung and holds
that a body a unit inside the edge is struck and a body crossing it is not.

## Why the reach was never the quantity

The ladder's cap reaches a shade over half of the narrowest view — 98 units from the nose — and
0241's *"still being too strong, 5% reduction on the range"* had already trimmed it. But the reach
is measured from the ship, and the ship's box runs to 167 units ahead of the camera on a screen
that ends at 178: a player flying at the front of the box was landing bolts ninety units past the
leading edge, on bodies that had not arrived. Three reductions of the ladder would not have moved
that number, because the ladder was never it. The seeker had the same report a day earlier —
*"limit them to screen space only"* — and the same answer.

## The figures

| the ship at | the cap reaches to | the screen ends at | struck before 0257 | struck now |
|---|---|---|---|---|
| the back of its box (11) | 109 | 178 | on screen | the same |
| the middle (89) | 187 | 178 | 9 units past the edge | on screen only |
| the front (167) | 265 | 178 | 87 units past the edge | on screen only |

## ⚠️ What was rejected

**A fourth cut to the reach ladder.** It answers the middle row and not the front one, and it
takes the gun's one property — a chain that lands — away from a ship at the back of its box, where
the reach was never the problem.

**The widest view rather than the player's.** 0023 places spawns against the widest view so that a
threat is absolute; a bolt is the player's, and bounding it by a screen they do not have would
strike bodies a 16:9 player cannot see.

## What is owed

- **A play.** Whether a chain that waits for the hull reads as the gun the ask wanted, or as a gun
  that hesitates at the edge.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A parameter and a compare;
nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0257`:

| broken on purpose | went red |
|---|---|
| the screen bound taken off the chain, so a bolt lands on a body the player has not seen | `0257 — THE SCREEN: from the front of the box` |
| the bound measured on the body's centre, so a hull still crossing the edge is struck | `0257 — THE SCREEN: from the front of the box` |
| the chain bounded by the widest view any device has rather than the one the player has | `0257 — THE SCREEN: from the front of the box` |
