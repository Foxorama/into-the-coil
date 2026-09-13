# The fish flown — 2026-09-13

All seven real bosses put through `scripts/weigh-boss.mjs` after the level-two brief landed. It was owed
twice: [0307](../docs/decisions/0307-the-serpent-is-armoured.md) flew the serpent and wrote *"the other
six real bosses are owed the same measurement"* and did not act on it, and
[0311](../docs/decisions/0311-the-acid-and-the-void-come-as-one-ball.md) owed a run with the ball's
appetite in. Both are discharged here.

⚠️ **THIS IS A MEASUREMENT AND NOT A CHANGE.** Nothing below has been acted on. The numbers say
something about the health table that a decision has to answer, and the health table is
[0260](../docs/decisions/0260-a-boss-is-fought-to-the-end.md)'s.

## What was measured

`node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-boss.mjs <kind>` — savior
difficulty, upgrade tier 4, missiles silenced, ship unhittable. Seconds to kill, median over the lanes
the ship can hold.

| | health | pulse | arc | shuriken |
|---|---|---|---|---|
| jormungandr | 1000 | 153 | 50 | 122 |
| **volans** | **1520** | **42** | **60** | **16** |
| quetzal | 1640 | 103 | 68 | 36 |
| gyre | 1760 | 122 | 75 | 45 |
| hoarfrost | 1880 | 147 | 90 | 54 |
| hydra | 2000 | 104 | 75 | 37 |
| medusa | 2200 | 121 | 100 | **429** |

## The fish is the shortest fight in the game, and it is not close

⚠️ **SIXTEEN SECONDS ON THE SHURIKEN, AGAINST 0260's FORTY.** Every other end boss is 36–54 s on that
weapon and the medusa is off the scale the other way. The fish is also the only one under forty on
**any** weapon: 42 s on the pulse is the next-shortest number in the table and it belongs to the same
boss.

**What it costs is exactly what the brief just bought.** The fish has five phases: darts, a whip, a rake
with kites arriving under it, a breaker with the shoal arriving under it, and a volley of kites over the
shoal ([0313](../docs/decisions/0313-the-fish-breaches.md),
[0314](../docs/decisions/0314-the-shoal-comes-in-while-it-fights.md),
[0315](../docs/decisions/0315-the-fish-throws-a-breaker.md)). At sixteen seconds the instrument has its
phases beginning at **0, 4, 8, 10 and 13 seconds** — three seconds a phase. The escort's own clock is
150 steps, which is two and a half. **A player with a shuriken sees each new idea about once.**

⚠️ **AND `tests/level.test.ts` IS GREEN OVER ALL OF IT, WHICH IS THE INTERESTING HALF.** Its
forty-seconds-and-eight-volleys guard divides health by `dpsAt(UPGRADE_TIERS - 1)` — and `dpsAt` models
**the pulse and the missiles only**. The shuriken is a weapon KIND
([0233](../docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)), and no arithmetic in that
file knows it exists. 0307 already found the guard describing one boss wrongly and answered it for the
armoured case; this is the same gap on the other axis — **not a boss the arithmetic cannot describe, a
weapon it does not contain.**

## Two other things the run says

- **The medusa is nearly immune to the shuriken**: 429 s median, 228 s at best, and *never* on its worst
  lane. Whatever the jellyfish does to that weapon is worth a look on its own terms — a fight seven
  minutes long is the same defect as one sixteen seconds long.
- **The arc reads *never* on its worst lane for five of the seven.** There is a lane the ship can hold
  from which the arc can never finish the boss. [0257](../docs/decisions/0257-the-arc-lands-on-the-screen.md)
  made a link land only on a body whose whole hull is on the screen, which is probably where that comes
  from, and it is a fair outcome rather than a bug — but *never* is a strong word and nothing has ever
  looked at it.

## What this does not say

⚠️ **IT DOES NOT SAY THE FISH NEEDS MORE HEALTH.** It is the second boss in a run of seven and the
ladder is deliberately rising — 1520 up to 2200 — so a fight shorter than the fifth one's is the design.
What the numbers say is that **sixteen seconds is short in absolute terms against the rule 0260 wrote**,
and that the rule's own guard cannot see it. Three ways out, none of them taken here:

| | |
|---|---|
| raise the fish's health | the simplest, and it moves a number every phase-band guard in `tests/level.test.ts` is measured against |
| teach `dpsAt` the other weapon kinds | makes the guard see what the instrument sees — and would redden it for the fish today, which is the point of doing it |
| leave it and say so | a stalking boss sits in the player's fire by design (0258), and *the one that comes to you dies faster* is a real answer if it is a chosen one |

## What the table did NOT say, and the question that got it out

⚠️ **ASKED, AND IT WAS THE RIGHT QUESTION**: *"Is the measurement report based on the player sitting in
one spot and firing straight ahead? If it's a static player position, that possibly highlights the fish
has no direct forward facing attacks, whereas the other bosses keep blowing up the ship."*

It is, and the ship is unhittable besides — `weigh-boss` says so in its own header and gives the reason
(*"a death is a respawn and a lost rung, which would measure the pilot"*). So every number above is **how
fast a boss can die**, and none of them is **how hard it is to stand there.**

`scripts/weigh-threat.mjs` is the other half, built to answer it, and what it found is worse than the
sixteen seconds — hits a second on a parked ship, pulse then shuriken:

| | | |
|---|---|---|
| **volans** | **0.10 / 0.00** | never touched once in a whole fight |
| quetzal | 0.13 / 0.13 | |
| gyre | 0.15 / 0.26 | |
| hydra | 0.43 / 0.40 | |
| jormungandr | 0.33 / 0.43 | |
| hoarfrost | **1.11 / 0.97** | eleven times the fish |
| medusa | 0.11 / 0.74 | |

**And the cause was not the phase table.** It is in
[0317](../docs/decisions/0317-the-pressure-comes-forward.md): the rake's centre accumulates without
limit, so the fan walks a whole circle every thirteen volleys and points down the lane once in thirteen.
That decision has what the fight measures now, and what three tuning passes against the wrong quantity
cost before the cause was found.

**The play comes first either way.** None of the fish's six items has been played — the report they came
from is [`the-fish-asked`](the-fish-asked-2026-09-12.md), and `docs/state-of-play.md` lists what to look
at, in the order the fight shows it.
