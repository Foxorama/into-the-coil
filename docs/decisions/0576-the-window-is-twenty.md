# 0576 — The window is twenty seconds

**Accepted 2026-10-07.** Item 2 of [`the-arms-planned`](../../reports/the-arms-planned-2026-10-07.md),
its second half. **Amends [0502](0502-the-window-is-the-fight.md)**: every mid-boss's window is 20
seconds, and every level is 173 units shorter. Follows [0575](0575-a-pickup-is-what-it-shows.md).

## The ask

> *"Minibosses - cut 5 secs from the dead time after the miniboss, part of the time was to allow the
> player to let the pickups rotate, but if they don't rotate any more it's going to be solid dead time
> now that will feel weird."*

Asked whether the 180 units should come out of the level or be spread over its back half: *"Level 5 s
shorter."*

## The rule

**`windowSeconds` is 20 on every row, and everything a level authors after its mid-boss arrives moves
with it** — by one map, applied to every along-the-lane number a level's tables and row hold (its waves,
its pickup places, its sections, its landmarks, its corridor's turns and passages, and `bossAt`):

| where it was | where it is |
|---|---|
| at or before the mid-boss's `at` | unchanged |
| inside the old 25-second window | squeezed into the new one, in order |
| after the old window | **173 units sooner** |

So the script resumes 0.2 seconds after the window closes, inside 0502's second, and the back of every
level — its waves, its music's turns and its end boss — comes 4.8 seconds sooner.

## Why it is built the way it is

**4.8 seconds and not 5: three bars.** A bar is 1.6 seconds, 57.6 units. The Black Heart's sections were
dragged onto downbeats on the desk ([0331](0331-the-heart-beats-under-it.md)), and a cut of 180 would move
each of them 3.125 bars, off the beat it was put on. 173 moves every boundary three bars and leaves it
where it was in the bar.

**One map, and the window's inside squeezed rather than cut.** A flat 173 after the old window would fold
the Labyrinth's corridor back on itself: its turns begin inside the window, at 2149, ahead of the waves that
resume at 2309. The squeeze keeps every authored thing in its order and every turn ahead of the waves it
was ahead of. Nothing but the waves' own gap is in the window anywhere else.

**Moved by a scratch script, checked token by token.** 377 numbers in `src/content/levels.ts` were
rewritten by a script that touches only `at:` values in a level's own tables and row, `bossAt` and
`windowSeconds`; the word diff was read back to confirm every changed token is a number. That is
[0200](0200-the-tool-that-edits-must-not-lose-what-it-edits.md)'s concern — an edit losing what it edits —
answered by reading the result rather than by hand-typing 377 numbers.

## What it costs

- **Adds come five seconds sooner.** The mid-bosses' healths are still solved for the fight lengths their
  levels ask — 21 to 23 seconds ([0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md)) — so a
  player at the tuned loadout now meets one to three seconds of adds before the kill, where at 25 they met
  none. That is the ask's own *"increased difficulty with adds"* arriving sooner; whether the healths
  should come down to match is a play's question, not assumed here.
- **Nine probes re-anchored** onto the moved numbers, each breaking what it broke.

## Rollback

None needed — no storage key, save field or shipped surface is touched.

## What guards it

`tests/window.test.ts`: the ask's twenty as a literal, nothing put down inside any row's window however
soon its mid-boss dies, the script resuming inside a second of it closing, and every wave past it put
down over a mid-boss still alive. Every other level guard — order, density, dry spells, sections, the
landmarks on their boundaries — ran over the moved tables unchanged. Probes in
`scripts/probes/0502-the-window-is-the-fight.mjs`, re-anchored.

## Owed

- A play of each level's middle, and whether the mid-boss healths want re-solving for twenty.
