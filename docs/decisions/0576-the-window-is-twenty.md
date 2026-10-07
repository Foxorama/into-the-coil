# 0576 — The window is twenty seconds

**Accepted 2026-10-07.** Item 2 of [`the-arms-planned`](../../reports/the-arms-planned-2026-10-07.md),
its second half. **Amends [0502](0502-the-window-is-the-fight.md)**: every mid-boss's window is 20
seconds, and six levels are 180 units — five seconds — shorter. Follows
[0575](0575-a-pickup-is-what-it-shows.md).

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
| after the old window | **180 units sooner** |

So the script resumes as the window closes, and the back of six levels — their waves, their music's
turns and their end bosses — comes five seconds sooner.

**The Black Heart is the exception, and keeps its length.** Its window is twenty seconds like the others,
but its sections, its landmark and its end boss stay where they are, and its waves past the window are
spread back into the five seconds, the last one fixed.

## Why it is built the way it is

**The Black Heart's length is its music's.** [0503](0503-the-levels-close-up.md) closed the other six up
by a tenth and left this one, because its four movements are each on a phrase — the lament to bar 16,
the same song faster to bar 36, a ballad turned to land there, the acceptance from bar 72 — *"every one of
them asked for in seconds across 0331's listens"*, and *"it is the player's to choose, with the ear."*
Five seconds off it is three bars and a fraction off every phrase. So it takes the other answer the
player was offered, and the choice of cutting it is still theirs.

**180, and not three bars.** A bar is 1.6 seconds, 57.6 units, and 180 is three bars and 7.2 units. A
section change lands on the next downbeat after its boundary is crossed
([0117](0117-a-section-change-lands-on-the-beat.md)), so a boundary authored a unit short of its bar and
moved 180 sooner lands 8.2 units short of the bar three earlier — and turns there. Three bars exactly,
173, was the first build, and it put the Labyrinth's room off its corridor's twelve-unit tiles by five
units: 180 is fifteen of them, and the ask's own five seconds.

**One map, and the window's inside squeezed rather than cut.** A flat 180 after the old window would fold
the Labyrinth's corridor back on itself: its turns begin inside the window, at 2149, ahead of the waves
that resumed at 2309. The squeeze keeps every authored thing in its order and every turn ahead of the
waves it was ahead of.

**Moved by a scratch script, checked token by token.** The numbers in `src/content/levels.ts` were
rewritten by a script that touches only `at:` values in a level's own tables and row, `bossAt` and
`windowSeconds`; the word diff was read back to confirm every changed token is a number. That is
[0200](0200-the-tool-that-edits-must-not-lose-what-it-edits.md)'s concern — an edit losing what it edits —
answered by reading the result rather than by hand-typing hundreds of numbers.

## What it costs

- **Adds come five seconds sooner.** The mid-bosses' healths are solved for the fight lengths their levels
  ask, 17 to 23 seconds ([0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md)), and the
  solver reads the same seconds over the moved tables as over the old ones: every fight is inside 0269's
  three. A fight that runs past twenty now meets the adds the ask promised a slow kill, where it used to
  meet them at twenty-five.
- **The music's turns in six levels are five seconds sooner**, each still on a downbeat; the table of
  them in `tests/music.test.ts` was pasted back, as 0158 says to.
- **Nine probes re-anchored** onto the moved numbers, each breaking what it broke, all seen red again.

## Rollback

None needed — no storage key, save field or shipped surface is touched.

## What guards it

`tests/window.test.ts`: the ask's twenty as a literal, nothing put down inside any row's window however
soon its mid-boss dies, the script resuming inside a second of it closing, and every wave past it put
down over a mid-boss still alive. Every other level guard — order, density, dry spells, sections, the
landmarks on their boundaries, the corridor reaching the room on its grid — ran over the moved tables.
Probes in `scripts/probes/0502-the-window-is-the-fight.mjs`, re-anchored.

## Owed

- A play of each level's middle.
- The Black Heart's length, if the player wants it five seconds shorter too — by ear.
