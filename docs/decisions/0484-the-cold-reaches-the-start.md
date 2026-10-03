# 0484 — The cold reaches the start

**Accepted 2026-10-04**, on the player's word, answering what [0481](0481-the-cold-grows.md) left open:

> *"for the frost aura as long as the player has safe space at the top left and bottom left of the
> screen, it can overlap the 'starting' space - the point is to make the player have to avoid it,
> otherwise it's a pure non-event and does nothing in the fight."*

## What it was

[0459](0459-the-bosses-are-placed.md) held the frost ship's cold at a reach of 108, so its top stayed clear of
where a ship is put on the field (along 40). That kept the whole left of the screen clear with it: a
ship that never moved from where it started was never in the cold at all. The plan's 150
([`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md), its 9) was refused by
0481 for that reason.

## The rule

**The cold may cover the start. The back corners are what the player is owed.** The cold is a circle on
the hull, so the corners behind the ship's box are where it is furthest. **Reach 130**, solved for a
pocket a fifteenth of the lane in from each back corner that stays outside the cold by the ship's
hurtbox. The binding case is the hull at the top of its patrol and the nearest of its drift, which
crowds the top-left corner.

**The plan's 150 is wrong here as well**, for a different reason: with the hull at the top of the lane, it covers
the top-left corner.

At 130 the cold's top reaches along 22 at its nearest, so the start (40) is inside it. A strip about
eleven units deep stays clear along the whole back of the box, and the corners have the most room.
The answer to the cold is *fall back*, as 0459 said, and now the player has to.

## Guards

`tests/frost.test.ts`, *THE ASKED-FOR ONE, IN NUMBERS*, moved. 0459's *the start is clear* and *a
strip of fifteen* are replaced by:
- **the cold at its top covers where a ship starts**, so a ship that never moves is in it;
- **a pocket a fifteenth of the lane in from each back corner is outside it by the hurtbox**, with the hull
  at either end of its patrol or the middle.

`tests/crowd.test.ts`'s pilot **falls back in a fight with a cold**. It held the along it started at, which
was a player who never answered the cold. At 130 that player sits in the cold and slows, and the
guard reported *nowhere to go* about a fight with an eleven-unit strip behind it. This is changing the guard,
and the reason is that it measured the fixture's hands
([0192](0192-a-guard-holds-an-invariant.md)). The pilot flies the answer the fight asks for, and every other fight is
flown as before.

0459's probe *the cold reaching 120 at its top* is retired: what it broke is now allowed. Its *at rest
at 38* probe is re-anchored on 130.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0484`:

| broken on purpose | went red |
|---|---|
| the cold back at 108, clear of the start | `THE ASKED-FOR ONE, IN NUMBERS` |
| the cold at the plan's 150, over a back corner | `THE ASKED-FOR ONE, IN NUMBERS` |
| the crowd pilot never falling back from the cold | `THE REPORTED ONE: in every phase of every fight in the game` |

## Owed

- **A play of the Rime Shelf's boss**: whether falling back to the corners reads as the fight, and whether a
  life that begins inside the cold at its top is fair. A respawn mid-pulse now starts slowed.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). One number on a row.
