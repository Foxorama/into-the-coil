# 0385 — The hydra is bigger, and sprays harder

**Accepted 2026-09-27.** The Toxic Mire's hydra ([0384](0384-the-hydra-stands-in-the-acid.md)) is drawn
1.3 times the size, and every phase's spray is denser, wider and faster. **Amends 0384's row and
sizes**; nothing about how it moves, grows or throws changes.

## The ask

> can we make the hydra bigger? and have the attacks spray more to make it harder?

Asked of the hydra as 0384 left it, whose own decision had found the fight easier than before it:
thrown from mouths low in the lane rather than from a hull in its middle.

## What changed

**Bigger, all of it together.** Every length on the row — the hull's hurtbox, each neck's root, reach,
head hurtbox and mouth, the tail's root, the aura's head, the pool it stands in and its bob — and every
baked extent in `src/content/sprites.ts` is 1.3 times 0384's. Together because a neck is drawn from its
reach over its extent: a head grown on its own would stand off the end of its neck. The heads now stand
across lanes 35 to 85 where they stood across 50 to 85.

**Harder, in the spray.** Each phase's `shots`, `spread` and `fireEvery`, the five numbers every head's
fan reads (0254):

| phase | shots | spread | fire every |
|---|---|---|---|
| 100% | 3 → 5 | 0.6 → 1.0 | 72 |
| 80% | 3 → 6 | 0.6 → 1.2 | 66 → 60 |
| 60% | 4 → 7 | 0.8 → 1.3 | 60 → 54 |
| 40% | 4 → 7 | 0.8 → 1.4 | 54 → 48 |
| 20% | 6 → 8 | 1.0 → 1.5 | 48 → 42 |

Cadences stay on [0096](0096-the-enemies-play-along.md)'s grid of six.

## How much harder, measured

`tests/crowd.test.ts`'s pilot ([0270](0270-a-shattering-volley-is-counted-in-shards.md)), flying to the
widest safe place it can reach over the hydra's own floor, for ten seconds of each phase. The narrowest
place it ever had, in world units of the 120 across — before 0384, and now:

| phase | Legendary | Savior | Burn |
|---|---|---|---|
| 100% | 26.5 → 21.5 | 26 → 11.5 | 14 → 7.5 |
| 80% | 15 → 6.5 | 12.5 → 6.5 | 14 → 5 |
| 60% | 17 → 10 | 10.5 → 4 | 6.5 → 4.5 |
| 40% | 12.5 → 11 | 11.5 → 3.5 | 6 → 5.5 |
| 20% | 14.5 → 9.5 | 11 → 7.5 | 4.5 → 3.5 |

**The target was the fight before 0384**, which is the one the player had, and every cell is at or under
it. The mean room over the same ten seconds sits within a few units of that fight's, above it in some
phases: the spray closes the lane more often in its worst moments than on average.

The size does part of it. Scaled and with 0384's sprays, the narrowest places came to between 4.5 and 34.5
units: every one of them under 0384's, and ten of the fifteen still over the fight before it.

## What it costs

- **The fight's length.** Each head's hurtbox grew with it, from 9 to 11.5, so every head is easier to
  hit; health is unchanged at 2000. **Not re-tuned, and owed a play** — with 0384's owed play of the same
  thing, now one question.
- **Sprites:** the same count, baked larger. Nothing added to the entity budget.

## Not held by any guard

**That the hydra is bigger, and that it is harder.** The first is a picture, photographed on the bench
at every phase. The second is a comparison with a fight that no longer exists, and a guard that held one
boss's room under a number would be [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s content
limiter with one row in it. `tests/crowd.test.ts`'s *somewhere to be* still holds the floor under it: every
phase on every tier leaves a place the pilot can reach.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
