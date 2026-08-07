# 0071 — Five more levels, and one idea each

**Accepted 2026-08-07.** Content, under
[0042](0042-a-run-is-a-sequence-of-levels.md) (a run is a sequence and the order is the list) and
[0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md) (a level is a script). Adds no new rule
to the code; adds one property to the roster.

## The rule

**A level has one idea, and its boss is that idea turned on the player.** Seven levels, seven bosses,
no repeats and no shared hulls — held by `tests/level.test.ts`, because *every boss is unique* is
mostly a claim about how a fight feels and those two halves of it are checkable.

## What was asked for

> *"Add in the rest of the levels from 3–7 and I'll give it a big play test later."*

## One idea each, which is the only thing that makes seven levels different from one repeated

| | idea | the boss it produces |
|---|---|---|
| 3 `coilward` | **where things come from.** A third of its waves enter across the lane; the flank cadence tightens from every fourth wave to every second | `lattice` — furthest station, widest swing: the safe lane becomes a thing that moves |
| 4 `shoal` | **speed.** The charger opens the level and never leaves | `shoalMother` — fastest patrol, shortest wavelength, fires little: the threat is where it IS |
| 5 `batteries` | **things that cannot be outrun.** Turrets and wardens hold station, so the lane fills with bodies that stay | `redoubt` — slowest, heaviest, fires constantly: a damage race rather than a dance |
| 6 `gauntlet` | **density.** 85 units between waves against 90–95, every wave mixed, a flank every second one | `chorus` — five phases, each moving *and* widening: no stretch rewards the same answer twice |
| 7 `eye` | **all of it.** Every kind, 82 units, the largest counts | `axis` — biggest hull, closest station, longest bar: the whole run's escalation in order |

⚠️ **The bosses are not a difficulty ramp and deliberately do not read as one.** `redoubt` fires
faster than `axis` and `shoalMother` moves faster; what the last one does is refuse to be either. A
roster where each row is the one before it with bigger numbers is one boss with six names, which is
what `docs/game.md`'s *every boss is unique* is written against.

⚠️ **Level six is where the density question gets answered.** `docs/state-of-play.md` has had
*"increasing enemy waves"* open since the second play-test list, and
[0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) records that its own density guard has
been a sieve twice. Level six is authored deliberately past the others so there is something to
compare against rather than a number to argue about.

## The guards found three real mistakes before this ran once

Worth writing down, because it is the clearest evidence so far that the content guards are doing
what [0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md) and
[0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md) claimed they would:

| what was authored | what the guard said |
|---|---|
| six-wide weaver formations at lanes 32 and 68 | *`eye` weaver at 5958 reaches 12.5 ± 34.2* — a weaver's threat is where it WILL be, so the guard adds twice its amplitude to the formation's offsets, and a six-wide vee reaches past the cull from any lane. Weavers are now five wide and near the middle |
| `lattice` at station 130 with a 16-unit drift | *drifts 7.5 units off the narrowest screen.* The comment beside it said the overhang was deliberate. It was written up as deliberate and measured as wrong — [0061](0061-a-boss-keeps-flying.md) |
| pickups laid out by eye | *`coilward` goes 23s without an upgrade.* [0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md)'s floor, exactly as intended: a player who died at the start of that stretch flies all of it with the base weapon |

⚠️ **All three are the same class of error — a number that looks fine written down and is wrong
measured** — and none of them would have survived to a play-test. That is what these guards are for,
and it is the argument for authoring the next level against them rather than around them.

## A fourth mistake, caught by the harness rather than by a test

⚠️ **The lane fix was written as a search over the whole file and it rewrote levels one and two.**
Those two have been played and tuned; the edit was meant for the five new ones. Nothing in the test
suite could see it — every guard the two old levels pass, they went on passing at the new lanes — and
what caught it was `npm run prove`: **seven probes belonging to 0040, 0043 and 0061 quote those
exact lines**, and all seven came back `PROBE FAILED — the code moved and the probe did not`.

That is a use the probe harness was not designed for and is worth writing down: **a probe's `find`
string is an assertion that a line has not silently changed.** 0019 built the exactness to stop a
probe from quietly doing nothing; the same exactness turns the probe set into a tripwire over the
content it happens to quote.

⚠️ **One probe of 0061's had to move anyway, and for the honest reason**: `drift: 14` stopped being
unique the moment the roster grew, so the harness refused it as ambiguous rather than applying it to
whichever row came first.

## What is new enough to guard

Two things, both about the **roster** rather than about a level:

- **No boss is fought twice in one run.** A seventh level pointed at the sentinel builds, runs and
  plays as a repeat of level one with different waves in front of it. It is also the cheapest way to
  add a level, which is exactly why it needs a guard.
- **No two bosses wear the same hull.** The silhouette is the first thing a player learns about a
  boss and the last thing they forget; two rows sharing a sprite is one fight with two names.

## Confirmed, not assumed

Probes in `scripts/probes/0071-roster.mjs`. **2 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the last level pointed at the first level's boss, so a run fights it twice | `no boss is fought twice in one run` |
| two bosses given the same hull, so one fight wears two names | `and no two bosses wear the same hull` |

**Everything else in this decision is held by guards that already existed and are already proven** —
0040's phase ladder, 0041's pickup floor, 0043's density floor and opening, 0048's lane band, 0061's
on-screen boss. No probe is added for them, because the break and the red are already recorded
against the decisions that landed them.

## What this leaves owed, and the first item is the big one

⚠️ **THE FIVE NEW HULLS HAVE NOT BEEN LOOKED AT.** They bake, they are geometrically sound, and no
screenshot exists of any of them: `scripts/shot.mjs` flies nothing, so it dies in level one and
cannot reach level three.
[0027](0027-measure-the-picture-not-the-model.md) is explicit that this is the class of thing that
ships wrong — *"a silhouette reasoned to be obviously not a diamond, which shipped as a diamond"* —
so this is named rather than assumed. The play-test this content was asked for is the eyes-on, and
the five silhouettes are the first thing to look at in it.

**Every number in five levels is unplayed.** Health, station, drift, phase table, wave spacing,
counts and pickup placement — 4,000-odd authored units per level, none of it felt. `docs/game.md`
calls ~3 minutes of stage per level; these are 2:50 to 3:00 by the same arithmetic level one uses.

**The run is now about twenty-one minutes end to end**, against `docs/game.md`'s *"15–30 minutes,
prologue to final boss"*. That is inside the target for the first time, and it is also the first
build where a single sitting can reach the end — which makes
[0068](0068-a-run-over-is-a-continue.md)'s free continue considerably more load-bearing than it was
when it landed an hour earlier.

**The eighth level and its final boss are still not authored.** `docs/game.md` puts eight levels and
a final boss at the end of a run; `axis` is the end of what exists, and the wording of the victory
screen already says only what is true.
