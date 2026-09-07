# The ice fills the screen — 2026-09-07

Played against `main` at [ea53a5b](https://github.com/Foxorama/into-the-coil/commit/ea53a5b), which is
0264 and everything before it — so with [0263](../docs/decisions/0263-the-frost-ship-shatters.md)'s
fission in, and one day after it landed.

## What was said

> *"The rime shelf and hydra boss ice attacks are way too hard to avoid on low and middle tier
> difficulties. They're very cool explodey ice attacks, but they end up having way too much screen
> space too fast. However tweaking them we need to be super careful, because if we reduce the effect
> too much, then the bosses will be too easy."*

And, when the first answer reached for the wall's spacing:

> *"It's not the wall and the gap in the wall, it's the explosions and the number of projectiles on
> screen after explosion, there's no space on the screen, or the pattern is too difficult to find.
> It's especially problematic with the rime shelf boss because the adds target the player, you can't
> find the safe spot in the pattern of the explosive ice shards because there is no safe spot with
> the other attacks."*

> *"Get over the wall being the problem, we've discussed walls before and you keep making the walls
> themselves too easy and ignoring everything else that's happening in conjunction."*

⚠️ **THE SECOND QUOTE IS THE REPORT AND THE FIRST ONE IS THE SYMPTOM.** The first pass measured the
`wall` attack's spacing — the gap between two frost centres against the ship's drawing — found a real
mismatch, and was about to spend a PR on it. It is written down here because the mismatch was real
and was still not the defect: a wall's gap is one attack in isolation, and every measurement that
followed the correction says the load is what several attacks do *at once*.

## What was measured

Two instruments, both new, both on the branch:

- **`rig/bench.html`'s boss scrub.** A phase is keyed to remaining health, so before this no
  phase-keyed attack in the game had ever been photographed — reaching one meant fighting to it.
  Every picture below is the bench at the camera the game ships.
- **The widest reachable safe run**, in `tests/crowd.test.ts`. Every hostile body projected forward
  to the ship's own lane position; a place counts only if the ship can also *be* there by then, at
  whatever speed the cold has left it. In world units, on a 100-unit lane, for a pilot that flies to
  the safest place it can reach on every step.

### The hydra

Hostile shots alive, by phase, at Legendary:

| phase | ≤100% | ≤80% | ≤60% | **≤40%** | ≤20% |
|---|---|---|---|---|---|
| before | 11 | 12 | 14 | **104** | 99 |
| after | 11 | 12 | 14 | **32** | 41 |

The step at ≤40% is the frost head arriving. Widest reachable safe run, worst over the phase:

| | Legendary | Savior | Burn |
|---|---|---|---|
| ≤40%, before | **0.0** (13% of the phase) | **0.0** (19%) | **0.0** (15%) |
| ≤20%, before | **0.0** (9%) | **0.0** (13%) | **0.0** (23%) |
| ≤40%, after | 11.0 | 6.0 | 3.5 |
| ≤20%, after | 7.0 | 4.0 | 1.0 |

A run of zero is *no place on the lane both safe and reachable* — damage that cannot be played
around, on the tier whose row says *"this should provide me no challenge"*.

### The frost ship

Adds standing, peak, over the summon phase — with a player who is dodging rather than clearing:

| | Legendary | Savior | Burn |
|---|---|---|---|
| before | 26 | 32 | **40** |
| after | 6 | 7 | 8 |

**40 is `CAPACITY.enemies`.** What bounded the horde was `src/sim/pool.ts` running out, which also
silently drops the volley after it — and since 0263 that volley may be a shattered add's snowflake.
At Burn the hostile pool reached **150 of 150** in the same phase.

## What it was

0263 states the rule — *"the volleys are counted in shards"* — and wrote it into one boss. The frost
ship's phases went to 1, 2, 2 and 3 because one shard is two bolts and then twelve flakes. **The
hydra's frost head was left reading the phase's own `shots`**, which is one number shared with four
heads that throw bullets spent by arriving, and is authored at 4 and 6 — so its frost volley was
eight shards and ninety-six flakes.

0263's guard says the same thing in a comment — *"the phases in `src/content/bosses.ts` are counted
in shards for exactly this reason"* — and drives `frostAt(0.15)`: one phase, of one boss. It never
saw the summon phase and it never saw the hydra.

## What is owed

- **The counts here are a first guess against a stated target, and a hand settles them.** `standing`
  is 6 for the frost ship's shards and 6 and 4 for the eagle's; `SHARD_VOLLEY` is 3, read off the
  widest volley 0263 itself settled by playing. The bench's boss scrub is what makes trying another
  number cost a minute.
- **`crowd` is three numbers and none of them has been PLAYED against**: 1, 1.15 and 1.2. Both
  departures from 1 were set by measurement rather than by a hand — 1.5 filled the hostile pool, and
  1.3 took `jormungandr`'s third phase at Burn from 20.5 units of reachable safe lane to 7.5. The
  measurement is in the row's own comment and in 0270's *What it moved*; what neither of them is, is
  a verdict about how the fight feels.
- **The axis reaches twelve fights this report was not about**, and that is written down rather than
  discovered later: `crowd` scales every boss's volley on the two harder tiers. At 1.2 the ten that
  lost room lose about half of what they lost at 1.3. Nothing reaches zero on any tier, which
  `tests/crowd.test.ts` now holds over all fourteen — but *inside the guard* is a different statement
  from *plays well*, and only the Rime Shelf and the hydra have been looked at.
- **Whether the frost ship's last phase at Burn is a fight or a wall.** It is the tightest thing left
  in either fight — a 2.0-unit window for a pilot flying to it — and it is inside the guard rather
  than outside it, which is a different statement from *it plays well*.
