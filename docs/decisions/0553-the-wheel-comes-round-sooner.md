# 0553 — The wheel comes round sooner

**Accepted 2026-10-06.** The Firebird's Catherine wheel, [0551](0551-the-wheel-is-held-closer.md), played
again. Supersedes 0551's throw and life, and three of its boss weights; the rest of 0551 stands.

## The ask

> *"let's take another .4sec off the catherine wheel fire rate and decay*
>
> *overall feeling really good now, just slightly too slow on the refire"*

## The rule

**The wheel is thrown every five beats (2 s) and lives 2.27 s: each 0.4 s sooner than 0551. Its burn-down
keeps its 0.4 s, so the tether lets go at 1.87 s.**

| | |
|---|---|
| **the clock** | `fireEvery` 144 → 120, `life` 160 → 136; `fade` 24 and `TETHER_FADE_STEPS` 8 unchanged |
| **the bosses** | the Catherine wheel's `gunWeights` on the quetzal 1.05 → 0.98, the gyre 0.42 → 0.4, the frost ship 0.9 → 0.82 |

## Why it is built the way it is

**The same 0.4 s off both, and nothing off the burn-down.** *"Fire rate and decay"* is the throw and the
wheel's life; 0551's ask was that the gaps between the moments of the wheel keep their shape, and this one
says the rest *"feels really good"*. Taking the same time off the throw and the life leaves both gaps as
they were, to the step: the tether lets go 0.13 s before the next throw, and the last wheel burns for
0.27 s beside the new one. Shortening the burn-down as well would have moved the let-go nearer the throw.

**0.4 s is one beat**, 24 steps, so the gun stays on the beat grid (0094) without rounding — five beats
where 0551 had six.

## The bosses

Flown on `scripts/weigh-boss.mjs`'s places, the Catherine wheel alone, the quickest of held lanes and on its
lane. A wheel a fifth more often is a fifth more embers and more tether time on a boss, but the floor
guards move less than that, because the wheel's damage against a boss comes mostly from the one best place:

| boss | at 0551's weight | 0553 weight | 0553 |
|---|---|---|---|
| jormungandr | 39.9 | unchanged (the gun's 0.6) | 39.9 — its own floor, `tests/serpent.test.ts`, is met |
| volans | 42.2 | unchanged, 0.45 | 42.2 |
| quetzal | 40.1 on its lane | 0.98 | 41.4 on its lane |
| gyre | 41.2 | 0.4 | 43.2 |
| hoarfrost | 40.4 | 0.82 | 45.9 |
| hydra | 41.8 on its lane | unchanged, 0.57 | 41.8 |
| medusa | 44.0 | unchanged, 0.5 | 44.0 |

The frost ship at 0.85 was 44.2 s in the Firebird, but its third phase got 7.9 volleys away against the
estate and the Thunderbolt borrowing the wheel, where 0260 asks eight; at 0.82 every ship is over.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). The gun's numbers are content.

## What guards it

`tests/wheel.test.ts`: 0551's clock less 0.4 s, to the step, with the burn-down unchanged; the tether lets go
at 1.87 s; every throw after the first finds the last wheel burning down. The boss floors, in every ship.
Probes in `scripts/probes/0553-the-wheel-comes-round-sooner.mjs`; 0549's re-anchored on the line this moved.

## Owed

- **A play** on the Firebird: whether two seconds is the refire wanted.
