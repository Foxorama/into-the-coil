# 0269 — A mid-boss is fought for as long as its level says

**Accepted 2026-09-06**, from the alpha play:

> *"Mid bosses need less health, and we'll need to go through and change all their attacks and stuff
> as well."*

> *"Cut the health and rewrite the phase tables to three phase tables for minibosses… slightly
> tougher at the start, but shorter fights and trim the harder end, because there's more additional
> adds increasing the difficulty already."*

> *"The minibosses should be short nasty fights, not long drawn out fights. If they take too long
> they bug out the level because of the level timers."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: three phases each, the ladder is in
seconds, and the health is derived. **Amends [0124](0124-the-boss-is-a-boss.md)** and
[0150](0150-the-uncoil-and-the-eye.md) in scope: their max-weapons floors are the end bosses', and a
mid-boss is held to both at the loadout it is met with.

## ⚠️ Health is not what makes a mid-boss hard

The ask names health, and health was the wrong lever — which the measurement said before anything was
changed. `scripts/weigh-fight.mjs` walks every level through the real frame at the loadout a mid-boss
is met with; with the waves removed, so they are not the cause:

| mid-boss | health | patrol rate | damage landed a second | fight |
|---|---|---|---|---|
| redoubt | 440 | **0.16** | **14.1** | 31 s |
| axis | 570 | — | 11.4 | 50 s |
| chorus | 490 | — | 7.4 | 67 s |
| harrow | 290 | 0.42 | 5.3 | 54 s |
| shoalMother | 390 | 0.62 | 4.9 | 79 s |
| sentinel | 240 | — | 3.8 | 63 s |
| lattice | 340 | 0.50 | **3.5** | 98 s |

**Damage actually landed varies four-fold and runs inversely to how fast the hull crosses the lane.**
A shot is fired where the ship is; a fast hull is somewhere else when it arrives. The redoubt carried
more health than the lattice and died in a third of the time. So 0247's roster — a health ladder from
240 to 570 — produced fights of 37 to 112 seconds **in no order at all**.

⚠️ **And cutting health alone could not fix it**, which is the finding that shaped the rest. The
health axis is what the phases, windows and curtain notches are *defined on*: the chorus's notches sit
every tenth of its health, so at 103 health a notch is about one shot and a single hit steps over one.
Its fight threw two curtains where its table says four. Phases at low health are not merely short,
they are **skippable**. So the tables had to be rewritten with the health, and were.

## The rules

**A mid-boss's fight length is authored and its health is derived.** `MID_BOSS_SECONDS` in
`src/content/levels.ts` is the ladder: 17 seconds at the Approach climbing to 23 at the Black Heart,
**in run order, which is the order a player meets them**. `scripts/solve-mid-health.mjs` measures each
fight through the real frame and prints the health that hits it; every mid-boss's `health` is that
output. `scripts/solve-hold.mjs` is the same pattern for the music's loudness, for the same reason.
⚠️ **Keyed by the LEVEL** — the first draft keyed it by mid-boss kind and had to be a
`Record<string, …>` to do it, since only seven of the fourteen bosses are mid-bosses;
`tests/registry.test.ts` refused that on [0016](0016-a-hub-enumerates-kinds.md)'s terms and was right
to. A level owns the number and the order alike.

**Every mid-boss is three phases, paced to the real boss of its own level.** `fireEvery` and
`patrolScale` come from that boss's rows — its 2nd, 4th and 5th where it has five, its last three
where it has fewer — so a mid-boss reads as a preview of what waits at the end of the level. The
thresholds are even thirds.

⚠️ **The FAN stays the creature's own.** `shots` and `spread` are a hull's silhouette in bullets
rather than its tempo: medusa fires ten at a spread of zero because it throws **rings**, and copying
that onto a boss with no ring is ten bullets in a line. So each mid-boss's own ramp is re-spread over
three phases and **started a third of the way up it** — *"slightly tougher at the start."* Stances,
shots and attacks stay the creature's for the same reason: `beam` roots are offsets on a particular
silhouette, `summon` names an enemy, and `open` is the jellyfish's bell.

**A mid-boss stays a speed bump at a full loadout: three to twelve seconds.** 0247's own sentence —
*"a mid-boss over in seven seconds at max weapons IS the miniboss… on purpose"* — held as a number for
the first time. It was not true when written: the fights measured 14 to 28 seconds at the cap.

**0124's and 0150's floors are the end bosses', and a mid-boss meets them at its own loadout.** A
phase must last three seconds and a bare window must outlast the death it runs into — asked at max
weapons of a boss the player arrives at fully armed, and at one rung of a boss met with one. 0247
began this by ruling the twelve-second fight floor *"the end bosses' floor and not the mid-bosses'"*;
these are the same claim about the same fight, so they scope the same way. `tests/midboss.test.ts`
holds both.

## The figures

| level | mid-boss | health | fight at one rung | at the cap |
|---|---|---|---|---|
| The Approach | sentinel | 240 → **83** | 74 s → 18 s | 14 s → 6 s |
| Ember Nebula | harrow | 290 → **65** | 60 s → 18 s | 19 s → 7 s |
| Saurian Belt | shoalMother | 390 → **61** | 91 s → 20 s | 25 s → 7 s |
| The Labyrinth | lattice | 340 → **38** | 112 s → 21 s | 28 s → 6 s |
| Rime Shelf | redoubt | 440 → **210** | 37 s → 20 s | 14 s → 9 s |
| The Toxic Mire | chorus | 490 → **94** | 81 s → 22 s | 23 s → 8 s |
| The Black Heart | axis | 570 → **208** | 64 s → 23 s | 18 s → 9 s |

Every level lands within a second of what it asks for; the seven average **20.3 seconds**, against a
spread of 37 to 112 before. ⚠️ **The redoubt keeps five times the lattice's health and is fought for
about as long** — the four-fold spread stated as two numbers, and why one factor across the table
could never have worked.

## ⚠️ Two fixtures were killing their own subjects

Not defects in the game, and worth recording because both reported as content failures. `fightAt` and
the station guard in `tests/level.test.ts` each fly a boss for sixteen seconds **under live fire**
before measuring it — harmless while a mid-boss carried hundreds of health, fatal once one carried
ninety. A dead boss leaves `bossPool.at(0)` reading a released slot, so one guard measured a hull that
had drifted 139 units out of frame and the other counted curtains nobody threw. Both hold their fire
now: they are about how a hull flies and what it throws, not about how long it lives.

## What is owed

- **A play.** Whether twenty seconds reads as *short and nasty* rather than as an interruption, and
  whether a mid-boss opening on its second step still teaches what it used to.
- **The waves during a fight, re-measured.** *"Still too many waves happening around minibosses, but
  the less health might sort that out."* A fight a third as long carries a third of the script over
  it, so [0267](0267-a-fight-thins-the-waves-over-it.md)'s one-in-three may now be too strong, too
  weak, or right. `scripts/weigh-fight.mjs` answers it; no number should move before it does.
- ⚠️ **The level timers are a bug of their own and this only makes it rarer.** *"If they take too
  long they bug out the level because of the level timers."* The camera never stops for a fight
  (0247), so a mid-boss that outlives its level's script runs the camera past `bossAt` and off the end
  of the authored level — measured at one rung before this change, two levels did exactly that. Short
  fights make it uncommon; **nothing bounds it**, and that wants its own decision.
- **The attacks.** *"Change all their attacks and stuff"* is answered here only as pacing and phase
  count. What each mid-boss actually throws is untouched, and is the piece to do after the alpha
  stack's boss branches land, so it is done once against a settled vocabulary.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Seven rows in a content table and a
constant beside them; nothing persisted, no storage key, no schema. A run saved mid-fight holds the
level and the loadout, never a boss's health or its phase.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0269`:

| broken on purpose | went red |
|---|---|
| the sentinel's health put back to what 0247 gave it, so its fight is four times what its level asks | `THE REPORTED ONE: a mid-boss fight lasts what its level asks` |
| the redoubt given the lattice's health, as though a hull's toughness were the number on it | `THE REPORTED ONE: a mid-boss fight lasts what its level asks` |
| the axis given a real boss's health, so the last mid-boss is still a fight at a full loadout | `and at a full loadout it is still a speed bump` |

⚠️ **No probe for *a red guard answered by moving the target*.** Editing `MID_BOSS_SECONDS` to match a
measurement makes `tests/midboss.test.ts` agree with itself and go **green**, which is the opposite of
what a probe does. Nothing mechanical catches it; what refuses it is
[0192](0192-a-guard-holds-an-invariant.md) and the note at the top of that file — the target is the
ask, and the health is the derived thing.
