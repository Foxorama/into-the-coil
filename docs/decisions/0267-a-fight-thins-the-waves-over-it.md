# 0267 — A fight thins the waves over it

**Accepted 2026-09-06**, from the play of the build [0256](0256-a-pickup-keeps-the-count.md) and
[0257](0257-the-arc-lands-on-the-screen.md) shipped in:

> *"We still need to adjust the waves — when the minibosses are on screen there are way too many
> waves in general happening and it's a lot. Need to spread the waves out so a few bullet firing
> waves happen before miniboss and some after miniboss and less during the miniboss — still need
> some during miniboss otherwise miniboss is too easy, but not as many."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**, which says *the waves keep coming
around it*: they keep coming, and the firing ones come at a third of the rate.

## ⚠️ No edit to the wave tables could have done this, and that is the whole decision

A wave's `at` is a **place** — `src/content/levels.ts` opens with why, and with what it cost to
learn. A fight's length is a **duration**, and the duration is the player's: the camera never stops
for a boss (`w.cameraAlong += w.scrollPerStep` runs every step), so the stretch of script that lands
on a fight is however far the camera got while they were killing it.

`scripts/weigh-fight.mjs` — the instrument, owed before the tuning pass
([0027](0027-measure-the-picture-not-the-model.md)) — walks every level through the real frame with
an immortal ship that sweeps the lane between fights and holds the boss's lane during one:

| loadout | the fight | firing waves the script puts on it |
|---|---|---|
| three rungs | 20–39 s | 5–12 |
| one rung — what a player carries at the mid-boss | 42–83 s | 14–25 |

The same authored script, twice the length and twice the waves, decided by the guns. **Move the
waves for one and the other gets a hole.** So this is a spawn rule.

## The rules

**While a mid-boss is on the field, one firing wave in `FIGHT_FIRING_IN` is put on the field and the
rest are skipped.** The spawn loop in `src/app/frame.ts`; the constant is in `src/content/levels.ts`
beside `MIX_RUN`, and `w.fightFiring` counts what the fight has been offered. Three, because *"not
as many"* and *"still need some"*: a third of 14–25 is 5–8, which is what the stretch before the
fight already carries. **A budget, and the play owns the number.**

**Skipped, never deferred.** The wave index advances either way. A wave held back would arrive
somewhere its author never put it, which is the defect the ⚠️ at the top of `src/content/levels.ts`
records — *"six seconds into a fresh run, `scripts/shot.mjs` showed a ship, its own bullets, and
empty space."*

**The firing ones only.** A quiet wave is pressure without bullets, and it is what keeps the fight
from being a duel in an empty lane. It is the bullets the report is about: a mid-boss fight already
runs at 84–100% of its steps with an enemy bullet on the screen, against 38–81% of the stretch
before it.

**A count, not a clock and not a roll.** One in three is the same answer on every machine and in
every run; a roll would want a stream of its own ([0021](0021-one-stream-per-concern.md)) and would
put the density beyond what a level author could reason about.

## The figures

Firing bodies crossing onto the screen per ten seconds, at one rung, measured by the instrument's
own walk — the level's own approach as the budget, which is what makes it a rate worth holding:

| level | before the fight | during, before | during, after |
|---|---|---|---|
| The Approach | 5.7 | **8.9** | 3.0 |
| Ember Nebula | 12.0 | **12.8** | 4.6 |
| Saurian Belt | 6.2 | 3.8 | 1.3 |
| The Labyrinth | 5.5 | 4.0 | 2.2 |
| Rime Shelf | 11.6 | **14.6** | 5.4 |
| The Toxic Mire | 10.8 | 6.6 | 2.4 |
| The Black Heart | 8.0 | **8.6** | 2.3 |

**Four of the seven were the wrong way round**: a fight was the busiest stretch of the level it sat
in, on top of a boss. All seven are now under their own approach, and none is at zero.

## ⚠️ Two instruments were wrong before this one was right

Recorded because both readings looked like findings about the game and were findings about the rig
— [0027](0027-measure-the-picture-not-the-model.md) is the rule and this is the third time today.

- **A sweeping ship measures a fight nobody fights.** `weigh-bullets`'s sinusoid is right for that
  script's question and wrong for this one: it has the boss in front of it a fraction of each cycle,
  so the first run reported an eighty-second fight at one rung that outlived the level. A player
  parks on the boss. The rig holds the boss's lane now.
- **Enemies ALIVE on the screen is confounded by the fight's length.** Thin harder, the boss dies
  sooner, and the average is dominated by whatever was on screen when the fight opened: the Black
  Heart went *up*, 7.4 to 8.2, as the thinning got stronger. A rate is neither, and *"way too many
  waves happening"* is a rate in the first place.

## What is owed

- **A play.** Whether a third is the right third, and whether the fight now reads as a fight rather
  than as the level's busiest minute.
- ~~⚠️ **"Some after the miniboss" is NOT delivered here and cannot be.**~~ **DELIVERED by
  [0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md), which is what it said was
  needed.** At one rung the Saurian Belt's and the Labyrinth's fights ran past the end of their own
  wave scripts, so there was no *after* to put anything in; at eighteen to twenty-three seconds every
  level has one, of sixty to eighty seconds, carrying 1.4 to 10.3 firing bodies per ten seconds.
- **Whether the quiet waves want thinning too.** *"Way too many waves in general"* is read here as
  being about the bullets, on the strength of the sentence that follows it. If the fight still reads
  as crowded with the firing waves at a third, the rule widens to every wave and the number moves.

## ⚠️ Re-measured after 0269, and the number stands for the opposite reason

Asked at the time — *"still too many waves happening around minibosses, but the less health might
sort that out"* — and this decision's own owed item said no number moves before the re-measure. It
was run against [0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md)'s shorter fights,
with the thinning switched off:

| level | its own approach | during, unthinned | during, one in two | during, one in three |
|---|---|---|---|---|
| The Approach | 5.7 | **8.7** | 4.6 | 2.8 |
| Ember Nebula | 12.0 | **13.8** | 8.4 | 6.5 |
| Saurian Belt | 6.2 | **9.3** | 5.4 | 5.6 |
| The Labyrinth | 5.5 | **7.1** | 3.8 | 5.2 |
| Rime Shelf | 11.6 | **13.9** | 9.2 | 5.4 |
| The Toxic Mire | 10.8 | **11.1** | 2.2 | 4.5 |
| The Black Heart | 8.0 | **12.2** | 6.0 | 4.4 |

**The shorter fights did not sort it out — they made it worse.** Unthinned, ALL SEVEN levels now send
firing bodies onto a fight faster than into their own approach, where before 0269 it was four of
seven. A long fight was diluted: forty-five waves spread over seventy-four seconds. A twenty-second
fight lands on whatever stretch of script it covers and takes the whole of it at once.

⚠️ **So the absolute load fell and the rate rose, and both are true.** Four to nine firing waves land
on a fight now, against twenty-six to forty-five. The rate is what *"way too many waves happening"*
measures, which is why this rule is **more** necessary after 0269 than it was before it.

**One in three stands**, and one in two would also clear the guard. Three is kept because the ask was
*less* during; because a fight already runs at 84–100% of its steps with a bullet on the screen from
the boss alone; and because the fight is now the shortest it has ever been, so there is least room to
absorb extra. ⚠️ **At four to nine waves a fight, one-in-N is a coarse instrument** — the Toxic Mire
reads 2.2 at one in two against 4.5 at one in three, which is sampling and not an inversion. No fine
distinction between single levels should be read off this table.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One branch in the spawn loop, one
counter on the world and one constant; nothing persisted, no storage key, no schema.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0267`:

| broken on purpose | went red |
|---|---|
| the thinning removed, so every firing wave the script offers lands on the fight | `THE REPORTED ONE: firing bodies arrive more slowly during a mid-boss fight than before it` |
| the thinning pointed at the end boss's fight, where a level has no waves left to thin | `THE REPORTED ONE: firing bodies arrive more slowly during a mid-boss fight than before it` |
| every firing wave skipped for the length of the fight, so the mid-boss is fought alone | `and they never stop, so the fight is not a duel in an empty lane` |

⚠️ **No probe for *the thinning defers instead of skipping*.** Not advancing `nextWave` leaves the
wave inside the horizon on the next step, so the `while` never terminates: the break hangs the suite
rather than reddening it. The type of `at` and the comment on it are what refuse that version.
