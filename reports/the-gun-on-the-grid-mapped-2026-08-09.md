# The gun on the grid, mapped — and the one question that blocks it

**2026-08-09.** A map, not a decision. Written because the work was started, got far enough to run,
and turned up a consequence that is the player's to weigh rather than mine to guess at.

## What was asked for

> *"I did notice, we could almost make a rhythm style game if we change the player sounds a bit. The
> primary weapon fire was almost the right tempo and just need more of a deep bassy beat. The missile
> fire provided a great counter-beat. What can we do so that as you pick up or lose power ups the
> music speeds up, slows down etc and works in a beat to the rhythm of the fire? It's going to sound
> really really sick if we can do that well."*

Two design questions were put and answered:

| | |
|---|---|
| may the fire-rate ladder be re-cut to musical values | **yes** |
| how does *"speeds up"* work | **the gun subdivides faster against a steadier tempo** |

## Two things the play-test heard that are really there

⚠️ **The base gun is a sixteenth note at 100 BPM, exactly.** `fireEvery: 9` is 0.15 seconds and a
sixteenth at 100 BPM is 0.15 seconds. Auto-fire never stops
(`src/content/actions.ts` bans a fire action), so the gun is a **metronome the player cannot switch
off** — that is why it was *"almost the right tempo"*. What breaks it is the ladder: 9, 8, 7, 5, 4
against the music's 27-step beat, of which only the 9 divides anything.

⚠️ **The missile is already an exact 5:1 cross-rhythm against the gun**, at the base and at the cap —
5.00, 4.88, 4.71, 5.20, 5.00 pulses per missile across the tiers. Nobody chose it. Five against a beat
divided in two, three, four or six is a counter-beat by construction, which is precisely what was
heard.

## The grid, and it is forced

A beat of **36 sim steps** is 0.6s is **100 BPM**, and it is the only usable one. Its divisors give
exactly five rungs — enough for `UPGRADE_TIERS + 1` with the cap still landing on `FASTEST_FIRE`:

| tier | steps | per beat | shots/sec | was |
|---|---|---|---|---|
| 0 | 18 | 2 | 3.33 | 6.67 |
| 1 | 12 | 3 | 5.00 | 7.50 |
| 2 | **9** | 4 | 6.67 | 8.57 |
| 3 | 6 | 6 | 10.0 | 12.0 |
| 4 | 4 | 9 | 15.0 | 15.0 |

⚠️ **Tier 2 is exactly what the game ships with today**, so the ladder is not a nerf and a buff — it
is the old base placed in the middle with two rungs opened below it and the same cap above.

Other beats were checked and rejected: 27 divides only by 3 and 9; 32 gives three rungs; 24 and 48
give ladders whose base is slower still. **Missiles stay at exactly `5 × fireEvery`** — 90, 60, 45,
30, 20 — which makes the accident deliberate and keeps the cap where it is.

## THE BLOCKER: every DPS-preserving repair changes shots-to-kill

⚠️ **The grid forces the base cadence from 9 steps to 18, which halves the base damage per second.**
`tests/level.test.ts` reported it within the minute: *the boss survived three minutes of continuous
fire* — which is
[0040](../docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md)'s promise that a boss can
be fought with nothing but the base weapon.

**Damage per second is `rate × barrels × damage`.** If the rate halves, one of the other two must
double. And both of those are what *shots to kill* is made of:

| repair | restores DPS | costs |
|---|---|---|
| **two barrels at the base** | exactly, at tiers 0, 1 and 4 | a two-health enemy dies to **one volley** instead of two |
| **double the pulse's damage** | at the base | the same, and the cap doubles too unless `MAX_BARRELS` halves |

`tests/combat.test.ts` caught the first immediately: *the enemy took more connecting shots than it has
health — expected 1 to be 2*. That guard is
[0035](../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md)'s *the player can count
hits*, and **shots-to-kill is the exact currency
[0084](../docs/decisions/0084-the-dial-is-the-level-and-the-guns.md)'s difficulty dial spends** —
*"nothing takes more than one hit until the first level has offered two weapon pickups"*.

⚠️ **So this is not a sound change. It is a balance change to the core weapon**, landing on top of a
dial that was tuned three PRs ago and has never been played. That is why it stopped here.

## The question that unblocks it

**Is enemy health re-tuned alongside the gun, or does the gun stay off the grid?**

- **Re-tune together.** Halve the base rate, double the volley, and raise enemy health to match so
  shots-to-kill is preserved. Correct, and it touches `src/content/enemies.ts`, the dial, and every
  wave the levels author — a real balance pass, not a number.
- **Accept the new shots-to-kill.** Cheapest, and it silently makes the early game easier in exactly
  the place 0086 has just finished making it harder.
- **Leave the gun alone.** The rhythm idea becomes a loose groove: the gun is in tempo at the base and
  the cap and drifts off it in between, which is what shipped and what was reported as *almost*.

## What is left after that, and none of it is blocked

Three pieces, in dependency order, all of them cheap next to the question above:

1. **The phase lock.** The gun runs on the fixed-step clock and the music on the `AudioContext`
   clock, so even matched tempos slide about a sixteenth note over a three-minute level.
   [0090](../docs/decisions/0090-the-music-is-four-loops.md) refused a **note** scheduler because every
   note is an allocation; a **loop** scheduler is six nodes every four seconds — 1.5 allocations a
   second — and it lets the music re-phase to the sim clock every loop. **0090's argument does not
   reach it and the decision should say so.**
2. **The pulse re-voiced as a kick** — *"more of a deep bassy beat"*. Pure cue work, no balance in it,
   and it can land whatever the answer above is.
3. **Level music that is not the title's.** Reported: *"the non-boss background music makes kinda
   interesting title background music, but not great level background music."* The existing loops
   become `calm`; the level wants its own set.

## What landed anyway

**The mix.** *"The game sfx are too loud over the background music"* — the four loudest cues at once
reached 0.92 of full scale against the music's 0.52, a ratio of nearly two to one. `MASTER_GAIN` 0.55 →
0.45 and `MUSIC_GAIN` 0.34 → 0.44 puts it at 1.12, with the cues still ahead because
[0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md) makes every cue information and
the music is not.

**And a guard that was measuring phase.** `tests/music.test.ts`'s seam check used a 10ms window against
content whose lowest note is 80Hz — a 12ms period — so it was averaging part of a wave and reporting
where the window happened to land. The trial re-tempo made it fail with identical loops, identical
wraps and identical envelopes. It is 40ms now, which covers three cycles of the lowest thing there is.
**Second time in this project a guard has sampled one phase of a periodic quantity and reported the
phase** — [0087](../docs/decisions/0087-a-pickup-never-parks.md) has the first.
