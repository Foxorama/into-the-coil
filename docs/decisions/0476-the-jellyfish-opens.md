# 0476 — The jellyfish opens

**Accepted 2026-10-04.** Item 2 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md)
(its 7.2 and 7.5), from the play of the same day:

> *"the jellyfish never opens for the 'double damage' phase."*
>
> *"it should be set a bit further back in the screen for the fight, you shouldn't be able to fly
> around it."*

## What it was

**The feeding, at a rate nothing had been measured against.** From three quarters of its health two
moon jellies fall every 75 steps, and each that touches the bell or a tentacle gave back **a twentieth of
its full health** ([0404](0404-the-rain-feeds-it.md)). [0386](0386-every-phase-is-fought-for-as-long.md)
had banded the phases the day before the feeding existed. `scripts/weigh-boss.mjs medusa` at Savior:
the median held place finished for no gun, and the ray's best fight never reached the open bell.

**And the instrument was hiding part of it.** `flyFight` read a kill off the pool's first slot, and one
of its signs was *more health than last step — no hull is healed*. Every feed read as the jellyfish's
death, so the phases stopped being counted at the first jelly it ate. It reads `bossBeaten` now, which
is what 0475 made the end of a fight.

## The rule

- **A feed is 0.032 of the authored health** — a fiftieth of Savior's full health, where it was a
  twentieth. **It is a share of the authored health, not the tier's** (`feedBoss`), so a jelly gives
  back the same number of shots at every tier. At a share of the tier's, Burn — whose fight is two and a
  half times as long — landed two and a half times the feeds and **finished from nowhere, with any gun.**
- **Tentacles still feed it.** The plan proposed *"the bell eats, the arms do not"*; 0404 quotes the
  player asking for the opposite — *"this includes if they hit a tentacle"* — so it was not done. The
  rate alone fixes the fight, measured below.
- **A heal over the open line still shuts the bell**, as 0404 decided: *"the bell closes again."*
- **Station 190, from 152.** The bell's far rim is at 207, past the ship's box at 202.7, so nothing flies
  round behind it — the hydra's answer at [0459](0459-the-bosses-are-placed.md). Beside it stays
  possible; the tentacles hang to 150.
- **The aura is heard from the tentacles** (`reachDownLane`). Measured to the bell at 190, a player at
  the back of the box heard 0.04 of it, under the tenth [0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md)
  holds as *attenuated, not muted*. Its body hangs forty units toward the ship; measured to that it is
  about 0.14 (it was 0.25 at 152). Every other boss has no tendrils, and its gap is its hull as before.
  Retuning the curve would have moved every boss's mix.
- **The phases are re-solved** by `scripts/solve-phase-bands.mjs medusa`, on 0386's rule, now that the
  feeding is in the fight: the lines move from 0.81 / 0.6 / 0.4 / 0.21 to **0.82 / 0.63 / 0.47 / 0.31**.
  The open bell has the widest band because a feed closes it.
- **The arc's weight on it is 1.4**, from the arc's 1.5: the doubled damage over a wider open band let
  the arc finish in 38.5 s against [0260](0260-a-boss-is-fought-to-the-end.md)'s forty. The pterodactyl's
  and the gyre's remedy ([0441](0441-a-pilot-flies-their-own-ship.md), [0475](0475-the-wreck-can-be-killed.md)).

## Measured

From the bell's own lane, held 60 and 45 short, seconds to the kill and seconds in each of the five
phases. **Before** (a twentieth of the tier's health, 152, the old bands), Savior: the pulse and the
shuriken never finished from here, and the median held place never finished for any gun.

| | 60 short | 45 short |
|---|---|---|
| **Savior** pulse | 64 s [9, 10, 15, 16, 15] | 64 s [9, 10, 15, 15, 16] |
| arc | 39 s [7, 8, 7, 7, 9] (41.3 s quickest at 1.4) | 39 s [7, 8, 8, 7, 10] |
| shuriken | 63 s [9, 10, 15, 16, 13] | 60 s [9, 10, 15, 15, 12] |
| ray | 50 s [8, 9, 13, 11, 10] | 49 s [8, 9, 13, 11, 9] |
| **Legend** | 29–34 s, every gun | |
| **Burn** pulse / shuriken | 150–187 s / 109–116 s | |
| **Burn** ray | about 300 s | |
| **Burn** arc | **never**: it stalls in the open phase | |

**Before, on Burn, nothing finished from anywhere.**

## Guards

`tests/medusa.test.ts`:

- **THE REPORTED ONE, at Savior**: every gun, from the bell's lane at 60 and at 45, finishes inside 240 s
  and fights the open bell. Seconds and whether the phase was seen — the player's units
  ([0027](0027-measure-the-picture-not-the-model.md)).
- **And on Burn**: the pulse and the shuriken finish inside 240 s.
- **IN LANE UNITS**: the bell's far rim at rest is past the ship's box.

Moved: the feed guard reads the row's share of the authored health, where it pinned `0.05`; *a heal over
the last fifth's line* starts half a feed under the line, wherever the line is; *the five phases* and the
open bell's picture read shares inside the new bands. `tests/music.test.ts`'s gap is `reachDownLane`, as
the shell's is. And **0260's eight volleys a phase sums a phase's time over every time it is entered**
(`tests/level.test.ts`): a fed jellyfish re-enters a phase, and each stretch read as a phase of its own.

Re-anchored: 0150's probe on the open line at 0.31; 0404's on the authored-health feed.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0476`:

| broken on purpose | went red |
|---|---|
| a feed worth a twentieth of the fight again | `THE REPORTED ONE, at Savior` |
| a feed as a share of the tier's full health | `and on Burn, where the fight is longest` |
| the jellyfish back at 152 | `IN LANE UNITS: the bell stands past the ship's box` |
| the jellyfish heard from its bell and not its tentacles | `a player who backs off to dodge is still inside the aura` |
| the jellyfish without its weight on the arc | `0260 — … the arc` |

## What it costs

Nothing in the frame: one multiplication reads a different number, and the aura's gap reads one field.

## Owed

- **A play of the fight**, above all whether it now opens and whether the rain still matters.
- **The arc on Burn never finishes**: from its lane it stalls in the open phase for minutes, as it did
  before this change. **The cause is not checked.** The likeliest is that the open bell throws void,
  void swallows the player's fire ([0291](0291-the-void-has-an-appetite.md)), and Burn throws more of it;
  what would check it is the same flight with the void's appetite set to nothing.
- **The player's word on the tentacles**: the plan's *"the bell eats, the arms do not"* was not built,
  because 0404 has the player asking for the opposite.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Content and sim; nothing persisted.
