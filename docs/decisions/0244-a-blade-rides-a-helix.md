# 0244 — A blade rides a helix

**Accepted 2026-09-05**, the same day as [0243](0243-a-death-throws-back-one-piece-per-kind.md),
from [`the-helix-asked`](../../reports/the-helix-asked-2026-09-05.md):

> *"ok this one is on me, the shurikens are feeling better but I didn't describe what I wanted
> properly. I want the two wingtips firing to form a helix pattern with the shurikens, and the
> shurikens need to be slightly faster than they are now."*
>
> *"also the shuriken graphics need to be a bit smaller, they take up a lot of visual screenspace
> and make it hard to see enemies and enemy fire"*

And, on the first draft's photograph:

> *"I think it needs to be a tighter helix, starting from the wingtips, whereas there's a big gap
> between helix start and wingtips in the preview image"* — *"also needs slightly smaller shuriken"*

**Supersedes the flight of [0242](0242-a-blade-coils-ahead-of-the-ship.md)** — a blade no longer
circles a point going up the lane — and keeps everything else 0242 kept: the pair from the
wingtips, the crossing at the nose, the reach to the leading edge, the band a rung buys, the landing
once per flash per blade. **Amends [0238](0238-the-picture-answers-the-second-play-test.md)**: the
star is smaller than the ship again.

## The rules

**A blade goes up the lane and swings across it: a sine about an axis.** The axis is the nose at
the throw and moves up the lane at the shot row's `speed` in the camera's frame; the blade's along
is the axis's, and its across is the axis's plus `coil × sin(phase)`, the phase advancing `turn`
a step. The two blades of a pair are a half-turn apart, so the strands cross at the band's centre
line twice a turn: the two strands of a helix, seen from above. Which way the phase runs makes no
difference to a sine, so both run one way and the sign 0242 gave each side is gone. `THE HELIX` in
`tests/blades.test.ts` holds it off the picture: the blade never loses ground (0242's loops came
back on themselves), crosses the ship's line at least four times before the edge, and every swing
is the width of the first.

**A strand leaves from the wingtip itself, heading out.** The wingtip is half the drawn width of
the hull the ship is wearing — whichever rung's hull, read off `SPRITE_EXTENT` at the throw — and
the phase at the throw is the one at which a sine of `coil` passes that width on its way out, so
the blade leaves the wing, swings wider, and comes back across the nose. The first draft threw
each blade at its crest, `coil` out, which at the cap put the helix's start eighteen units from a
wingtip four out: *"a big gap between helix start and wingtips."* `THE HELIX` holds the throw
within half a blade of the wingtip and the swing wider than it.

**The pitch is thirty units, and the cadence goes with it.** `turn` is 0.21: a full swing every
thirty steps, half a second, which at one unit a step is a pitch of thirty — under twice the width
at the cap and four times it at the first rung. ⚠️ **The pitch cannot be set alone.** Every pair
advances from the same phase, so where the next pair sits on the strand is `turn × fireEvery`, and
a rung where that is a whole number of turns puts every blade at the same point of its swing — two
rows that breathe, 0242's first photograph. The cadence runs over an octave, so for the gap to be a
fifth of a turn or more at every rung the pitch has to be more than the slowest spacing and less
than five times the quickest: over 0242's `[30, 26, 22, 18, 15]` no pitch under thirty-seven
cleared every rung, which is why the first draft sat at thirty-nine and read as a lazy wave.
`fireEvery` is `[24, 21, 18, 15, 12]` — a fifth quicker — and the gaps are 0.20, 0.30, 0.40, 0.50
and 0.40 of a turn. The quicker cadence is the helix's pitch, not a balance change; the figures
below say what it costs.

**A blade is a quarter faster: one unit a step.** *"Slightly faster than they are now."* From the
ship to the leading edge of the widest screen is 2.3 s; at 0242's 0.8 it was 2.9. `THE PACE` holds
it under two and a half seconds, in the player's unit, as a budget (0192): the number is the
player's, and the speed that gives it is `src/content/shots.ts`'s.

**A blade is drawn a twelfth of the lane wide, and its hurtbox 3.2 units.** *"A bit smaller"*, then
*"slightly smaller"* again at a tenth. `SPRITE_EXTENT.shuriken` is 8, from 12; the row's `radius`
is 3.2, from 4.8, in the same ratio, so the hurtbox stays inside the star as `tests/combat.test.ts`
holds. `THE SIZE` holds the box at or under a twelfth of the lane: two dozen blades at the cap are
a seventh of the screen's area at most, against a quarter for sixteen at 0238's size.

## The figures, measured against a boss-sized body a hundred ahead in the band's centre

| rung | `coil` | thrown from | a pair lives | landings per pair on the boss | sustained, once the helix arrives | blades in the air |
|---|---|---|---|---|---|---|
| 1 | 7 | 3.8 out | 2.3 s | 16 | 40 a second | 12 |
| 2 | 9 | 3.8 | 2.3 s | 16 | 45 | 14 |
| 3 | 12 | 4.5 | 2.3 s | 14 | 46 | 16 |
| 4 | 15 | 4.5 | 2.3 s | 12 | 48 | 20 |
| 5 | 18 | 5.0 | 2.3 s | 10 | 50 | 24 |

⚠️ **Half the coil's worth against a boss, and that is the shape and not a tuning.** A loop kept a
blade on a boss for its whole edge of twelve; a strand crosses the boss once and is past it, so a
pair lands on the way through and no more — fewer at the wider rungs, whose strands spend less of
their length on the centre line. The quicker cadence and the smaller hurtbox about cancel: the cap
was 48 a second at the first draft's cadence and size, and is 50. At the cap the helix sits under
the pulse (60, every barrel hitting) and beside the arc (45, cannot miss), where 0242's coil sat
with the missiles at 92. Taken as the player left it — *"it's probably ok to leave as is because
you'll need to be on target"* — and the levers if it is too weak are the row's `damage` and
`BLADE_EDGE` is not one of them: a strand never spends its edge on one body.

## ⚠️ What was rejected

**A helix that follows the ship across the lane.** 0242 rejected it as *a thing it is towing*, and
nothing in this ask reopened that: the helix is aimed by where the ship sits when it throws.

**A turn per rung, so the helix tightens as it widens.** One pitch: the ask is a shape, and a shape
that changed with the ladder would be five shapes to learn. The band is what a rung buys.

**A tighter pitch over the old cadence.** Every pitch under thirty-seven locked some rung into two
rows, and the photograph that taught 0242 is not one to take twice. Tighter meant quicker.

**A phase per throw, to fill a locked rung's strand.** Every blade of every throw lies on the same
two curves only because every throw starts at the same phase; a throw that started elsewhere would
draw a third strand, and a helix has two.

**Keeping the loops at low rungs.** The play-test said the loops were never the ask.

## What is owed

- **An eye on the helix in motion** on the branch preview — whether two dozen blades at the cap
  read as two strands from the wingtips, and whether a star at a twelfth still reads as steel.
- **The balance**, above: 50 a second at the cap is the weakest cap in the game against a boss.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content and a flight; nothing
persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0244`:

| broken on purpose | went red |
|---|---|
| the blade's along swinging with its across, so its track is a chain of loops again | `THE HELIX: a blade leaves the wingtip` |
| the pair thrown from its crests, a coil out, rather than from the wingtips | `THE HELIX: a blade leaves the wingtip` |
| the blade back at the speed the play-test called slow | `THE PACE: a blade crosses` |
| the star drawn at the size the play-test called too big | `THE SIZE: a blade is drawn` |

And the blade probes before it, on the helix: `0242` (one blade a throw → `THE PAIR`; the pair from
the nose → `THE HELIX`; the ladder flat → `THE LADDER`), `0237` (both), `0234` (all ten). **One
probe is retired**: 0242's *both blades of a pair turning the same way* — a sine advanced backwards
is the same sine, so which way a blade's phase runs no longer changes the picture and there is
nothing left to break; the pair's half-turn, which the crossing rides on, is what the nose probe
breaks.
