# 0472 — The fights thin at Savior

> ⚠️ **AMENDED 2026-10-04 by [0502](0502-the-window-is-the-fight.md).** `FIGHT_LEAD` is kept and now
> stops at the mid-boss's own place: the window after it is authored empty, and the waves past the
> window are adds that come as written. `tests/fight.test.ts`, named below, is deleted. The redoubt,
> chorus and axis are re-solved, because no wave over the fight soaks up its fire any more.

**Accepted 2026-10-03.** From the play report:

> *"we bunched up a bunch of shooters on every level and on saviour difficulty, there's some spots,
> especially around minibosses that it's too bullety"*

## The instrument first

[0027](0027-measure-the-picture-not-the-model.md). `scripts/weigh-fight.mjs` could say whether a
bullet was on the screen. Through every mid-boss fight that answer is near 100%, so it cannot tell a
busy fight from a crowded one. It now also counts:

- **how many** enemy bullets are on the screen: the mean, the worst step, and the worst two seconds;
- **the three busiest two-second windows** of the level, at least four seconds apart, with where the
  camera was. The end boss's fight is reported apart, because it is not what the report named.

Two flags:

- `--difficulty=` flies a tier, where it used to fly the content multiplied by nothing;
- `--carried` flies the tubes a player who took every pickup carries in.

A `census` hook hands each step's world to a scratch script, which is how the windows below were
broken down by shot kind and body.

## What it found, at Savior with the carried loadout

| | before | after |
|---|---|---|
| **mid-boss fights** | 24–57 s (the lattice 56) against the 17–23 asked | 17–24 s |
| **busiest 2 s inside a fight** | 15–30 live bullets on the first three levels, 28–47 on the last four | 15–22, and 25–33 |
| **busiest 2 s outside any fight** | up to 41.8 (Rime Shelf), 46.6 (the Mire), 35.5 (the Labyrinth) | at most 29.5, 27.4, 28.4 |

Three causes, in order of size.

### 1. The mid-boss fights were solved for a tier nobody plays

`scripts/solve-mid-health.mjs` and `tests/midboss.test.ts` flew the content multiplied by nothing,
AUTHORED. [0356](0356-the-tuned-tier-is-savior.md) made Savior the tier the game is tuned for, and
Savior's toughness is 1.6. So every fight the guard held at 17–23 s ran 24–57 s in the game. The camera
never stops for a fight, so a longer fight drags more of the script across itself, and the boss
throws more volleys.

This is [0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md)'s case exactly: a quantity checked
in the case it was measured in, not the case it is applied to. **Both now fly the tuned tier**, and
the seven healths are re-solved:

| mid-boss | was | is |
|---|---|---|
| sentinel | 262 | 153 |
| harrow | 277 | 168 |
| shoal mother | 229 | 132 |
| lattice | 187 | 101 |
| redoubt | 541 | 329 |
| chorus | 419 | 237 |
| axis | 699 | 414 |

Six are the solver's second pass. **The lattice did not converge**, because its fight steps with its
walls' clock: 97 fights for 16.5 s, 99 for 22.6, 101 for 19.4. It was scanned by hand.

On Legendary these fights are now short (×1.0 toughness), and on Burn ×2.56 / 1.6 longer than Savior.
That is the margin either side of the tuned tier, as 0356 intends.

### 2. The waves that flew in with the mid-boss were never thinned

[0267](0267-a-fight-thins-the-waves-over-it.md) thins one in three firing waves put down while the
mid-boss is in the pool. The mid-boss is put down on the same horizon as the waves, though, so every
firing wave authored just before it is already on the field and arrives with the hull. With the
thinning set to admit nothing, 1.3–4.6 firing bodies per ten seconds still arrived on each fight.

**`FIGHT_LEAD` in `src/content/levels.ts`**: a firing wave authored within 190 units of a mid-boss's
`at` counts as its fight's, and is thinned with it. 190 is two thirds of the widest view. A wave that
close is still crossing the screen when the hull settles. A budget, and the play owns it.

### 3. The back halves of the last four levels are turrets every five seconds

Broken down by shot, the busiest windows outside the fights were **flak**: a turret's three slow
shots, in waves of five and six, one every 170–220 units. The Labyrinth's were three sower waves in
four.

| level | change |
|---|---|
| **Rime Shelf** | every turret from 2485 on four, not five; 2945's turret is a weaver, so turret–shard–turret is no longer a run; 2888's shards three, not five, because each killed one opens into frost that splits again |
| **The Toxic Mire** | every turret from 2494 on four, not six |
| **The Black Heart** | every turret from 2654 on four, not six |
| **The Labyrinth** | the sowers at 3232, 3405 and 3463 four, not five and six |

**The first three levels are untouched**: their busiest windows were 18–22 live, and the shooters in
them are what make the climb.

## Guards

`tests/midboss.test.ts` holds every mid-boss fight to its level's seconds **at the tuned tier**, which
is the change in meaning. `tests/fight.test.ts` (0267's thinning against the level's own approach),
`tests/bullets.test.ts` (0259's eight dry seconds and two fifths covered), `tests/mix.test.ts`,
`tests/level.test.ts`, `tests/crowd.test.ts` and `tests/pilots.test.ts` are all green over the change.

No guard is added for the lead or for the wave counts. They are tuning numbers, and *"no window over N
live bullets"* would be a threshold answering the question before it is asked —
[0295](0295-a-ranking-guard-is-a-content-limiter.md). The instrument is how the next pass reads them.

## ⚠️ What CI found: the shorter fight ended in a turn

The first push went red on `tests/corridor.test.ts`. At Savior, the Labyrinth's three mid-boss pickups
were drawn inside the corridor's stone for one step. [0350](0350-the-corridor-turns.md) holds the
corridor straight for the lattice's fight, from 1270 to 1770. That stretch had been sized for the fight
at AUTHORED. Solved at the tuned tier, the hull now dies with the camera near 1880, and its drop is
thrown at about 2046, where the 1900 and 2080 swings put stone across the lane. Two changes, each
answering half of it:

- **The straight stretch runs to 2100.** That covers the fight at the tier it is tuned for, which is
  0350's own rule: a fight in a corridor that is also turning is two difficulties at once. The swings
  at 1900 and 2080 are gone; the turning resumes at 2260.
- **A drop is born beside the stone, not in it.** `stoneHoldsPickups` already puts a piece back every
  step, but it runs before the drop in the step's order. Burn's fight is longer than Savior's, so its
  drop can still land in a turn. `throwPiece` now puts a piece out of the stone as it is made. The new
  guard throws a drop from over the stone of a hard-turning corridor at every tier.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0472`:

| broken on purpose | went red |
|---|---|
| the lattice back at the health solved off the tuned tier | `THE REPORTED ONE: a mid-boss fight lasts what its level asks` |
| a drop born where the hull died, stone or not | `0472 — a drop thrown from over the stone is born beside it` |

## ⚠️ Measured and not changed

- **The gyre's fight peaks at 94.7 live bullets** over two seconds in this walk. It is the Labyrinth's
  end boss, which the report did not name, and the walk's ship holds the boss's lane, which may be the
  worst place to stand against flame wheels. It is the player's to say whether that is the fight.
- **The mid-bosses' own volleys** are most of what is on the screen in a fight: with no new firing
  waves at all, the fights still averaged 8–15 live. They are now shorter and are otherwise unchanged.

## Owed

- **A play of every level at Savior**, which is what all of this was asked from.
- **0473's attacks** change what each place's kinds throw, so the numbers above are re-measured after it.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Content numbers and a spawn rule;
nothing persisted.
