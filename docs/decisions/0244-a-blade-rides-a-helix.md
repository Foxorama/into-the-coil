# 0244 — A blade rides a helix

**Accepted 2026-09-05**, the same day as [0243](0243-a-death-throws-back-one-piece-per-kind.md),
from [`the-helix-asked`](../../reports/the-helix-asked-2026-09-05.md):

> *"ok this one is on me, the shurikens are feeling better but I didn't describe what I wanted
> properly. I want the two wingtips firing to form a helix pattern with the shurikens, and the
> shurikens need to be slightly faster than they are now."*
>
> *"also the shuriken graphics need to be a bit smaller, they take up a lot of visual screenspace
> and make it hard to see enemies and enemy fire"*

**Supersedes the flight of [0242](0242-a-blade-coils-ahead-of-the-ship.md)** — a blade no longer
circles a point going up the lane — and keeps everything else 0242 kept: the pair from the
wingtips, the crossing at the nose, the reach to the leading edge, the band a rung buys, the landing
once per flash per blade. **Amends [0238](0238-the-picture-answers-the-second-play-test.md)**: the
star is smaller again.

## The rules

**A blade goes up the lane and swings across it: a sine about an axis.** The axis is the nose at
the throw and moves up the lane at the shot row's `speed` in the camera's frame; the blade's along
is the axis's, and its across is the axis's plus `coil × sin(phase)`, the phase advancing `turn`
a step. A pair leaves a quarter-turn either side of the axis — each at its own crest, the two a
half-turn apart — so the strands cross at the band's centre line twice a turn: the two strands of a
helix, seen from above. Which way the phase runs makes no difference to a sine, so both run one way
and the sign 0242 gave each side is gone. `THE HELIX` in `tests/blades.test.ts` holds it off the
picture: the blade never loses ground (0242's loops came back on themselves), crosses the ship's
line at least four times before the edge, and every swing is the width of the first.

**The pitch is thirty-nine units.** `turn` is 0.16: a full swing every thirty-nine steps, which at
one unit a step is a pitch of thirty-nine — twice the helix's width at the cap and five times it at
the first rung, which is what reads as a helix rather than a zigzag. And, on 0242's own lesson, not
a divisor of any rung's cadence: successive pairs sit at least a quarter-turn apart in phase at
every rung (0.24, 0.34, 0.44, 0.46 and 0.38 of a turn), so a screen of pairs shows every point of
the strand and not two rows. `docs/decisions/0242-a-blade-coils-ahead-of-the-ship.md` has the
photograph that taught it.

**A blade is a quarter faster: one unit a step.** *"Slightly faster than they are now."* From the
ship to the leading edge of the widest screen is 2.3 s; at 0242's 0.8 it was 2.9. `THE PACE` holds
it under two and a half seconds, in the player's unit, as a budget (0192): the number is the
player's, and the speed that gives it is `src/content/shots.ts`'s.

**A blade is drawn a tenth of the lane wide, and its hurtbox four units.** *"A bit smaller."*
`SPRITE_EXTENT.shuriken` is 10, from 12; the row's `radius` is 4, from 4.8, in the same ratio, so
the hurtbox stays inside the star as `tests/combat.test.ts` holds. `THE SIZE` holds the box at or
under a tenth of the lane: sixteen blades at the cap are a sixth of the screen's area at most,
against a quarter at 0238's size.

## The figures, measured against a boss-sized body a hundred ahead in the band's centre

| rung | `coil` | a pair lives | landings per pair on the boss | sustained, once the helix arrives | blades in the air |
|---|---|---|---|---|---|
| 1 | 7 | 2.3 s | 16 | 32 a second | 10 |
| 2 | 9 | 2.3 s | 16 | 37 | 12 |
| 3 | 12 | 2.3 s | 16 | 43 | 14 |
| 4 | 15 | 2.3 s | 14 | 46 | 16 |
| 5 | 18 | 2.3 s | 12 | 48 | 20 |

⚠️ **Half the coil's worth against a boss, and that is the shape and not a tuning.** A loop kept a
blade on a boss for its whole edge of twelve; a strand crosses the boss once and is past it, so a
pair lands its sixteen on the way through and no more. At the cap the helix sits under the pulse
(60, every barrel hitting) and beside the arc (45, cannot miss), where 0242's coil sat with the
missiles at 92. Taken as the player left it — *"it's probably ok to leave as is because you'll need
to be on target"* — and the levers if it is too weak are the cadence and the row's `damage`;
`BLADE_EDGE` no longer bites, because a strand never spends its edge on one body.

## ⚠️ What was rejected

**A helix that follows the ship across the lane.** 0242 rejected it as *a thing it is towing*, and
nothing in this ask reopened that: the helix is aimed by where the ship sits when it throws.

**A turn per rung, so the helix tightens as it widens.** One pitch: the ask is a shape, and a shape
that changed with the ladder would be five shapes to learn. The band is what a rung buys.

**Keeping the loops at low rungs.** The play-test said the loops were never the ask.

## What is owed

- **An eye on the helix in motion** on the branch preview — whether twenty blades at the cap read as
  two strands, and whether the smaller star still reads as steel.
- **The balance**, above: 48 a second at the cap is the weakest cap in the game against a boss.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content and a flight; nothing
persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0244`:

| broken on purpose | went red |
|---|---|
| the blade's along swinging with its across, so its track is a chain of loops again | `THE HELIX: a blade leaves the wingtip` |
| the blade back at the speed the play-test called slow | `THE PACE: a blade crosses` |
| the star drawn at the size the play-test called too big | `THE SIZE: a blade is drawn` |

And the blade probes before it, on the helix: `0242` (one blade a throw → `THE PAIR`; the pair from
the nose → `THE HELIX`; the ladder flat → `THE LADDER`), `0237` (both), `0234` (all ten). **One
probe is retired**: 0242's *both blades of a pair turning the same way* — a sine advanced backwards
is the same sine, so which way a blade's phase runs no longer changes the picture and there is
nothing left to break; the pair's half-turn, which the crossing rides on, is what the nose probe
breaks.
