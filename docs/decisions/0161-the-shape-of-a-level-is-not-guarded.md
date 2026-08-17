# 0161 — The shape of a level's music is not guarded

**Accepted 2026-08-17.** Four assertions removed and nothing put in their place. The smallest diff in
the music channel this week and the one most likely to change how the next seven levels sound.

> *"I like the theoretical style of the current format, music starts out, changes and intensifies,
> then shifts into the boss form music… but like the nebula is a good example, starts out with a
> chorus, escalates to organ music and loud pumping beats, shifts to a dante's inferno style boss
> fight. **don't lock that into a rule, it's a guideline if anything and if we lock it into a rule
> (which we have done already) then every level ends up sounding similar.**"*

## The rule

**How long a level's sections are, in what order, and how busy each one is, is an authoring judgement
with nothing asserting on it.** The only bound left on a section is that it outlasts the ramp that
opens it.

## What went, and what each was forcing

| removed | what it made true of all seven levels |
|---|---|
| the last section lasts 6–30 s | **every level ends with a short build before its boss** |
| every section lasts 10–90 s | no level may hold one intensity for more than a minute and a half |
| no rung is thinner than the level's opening | a level may only ever get **denser** |
| the boss is ≥1.5× as busy as the opening | **every boss is loud**, and none is sparse and menacing |

⚠️ **I ADDED TWO OF THESE FOUR TODAY**, in [0158](0158-a-level-says-where-its-sections-open.md) — the
PR whose own headline is *order, count and timing are free*. **The guard took back what the decision
granted**, in the same diff, and neither the decision nor the review noticed.

## ⚠️ The transferable finding is already in `CLAUDE.md`, about code

> ⚠️ **No counting guard.** Line ceilings, `case` ceilings and slice ceilings were each proposed and
> each measured against the predecessor before being set; **every one flagged its healthy file as
> loudly as its sick one.**

That reasoning was worked out, written down, and then **not transferred to music.** Every guard in the
table above is a counting guard wearing a musical name: a threshold that a healthy level trips exactly
as readily as a sick one, because *how long a section should be* has no answer that is true of seven
different places.

## ⚠️ And the density guard had been walked back twice already

It began as *every rung strikes more notes a bar than the one below* — a staircase.
[0123](0123-a-rung-changes-the-notes.md) demoted it to a floor plus a climb ratio. Both survivors were
still shape, and its probe records being **re-anchored four times in two days**, every time a mix pass
moved a row of twenty-three numbers.

⚠️ **THREE RETREATS AND AN EXPENSIVE ANCHOR ARE THE SIGNAL, AND WE READ THEM AS MAINTENANCE.** A guard
that keeps having to be relaxed to let the work through is not being refined; it is a guard that
should never have been a guard. Nobody was wrong at any individual step, which is why it survived
three chances to notice.

## The distinction I would use, stated as reasoning and not as a rule

**Floors — about whether sound works. Kept.**
Nothing clips. No layer a rung opens is inaudible ([0140](0140-no-layer-is-inaudible.md)). A loop is a
whole number of samples at every rate. A section outlasts its own gain ramp, so its arrival finishes
before it is over.

**Shape — a musical opinion from one round. Gone.**
How long a build is. How many times a level climbs. Whether a boss is busier than an opening. Whether
a rung may be thinner than the one before.

⚠️ **THIS IS DELIBERATELY NOT WRITTEN INTO `CLAUDE.md`.** A rule saying *do not write rules about
musical shape* would be the same mistake wearing a hat, and the principle it would restate already
exists: **a music rule is demotable rather than inherited** — *a rule that only exists because an
earlier round could not hear something is not evidence about this round.* What was missing was not the
principle. It was applying it to guards we had just written rather than only to ones we inherited.

## ⚠️ What the one surviving bound is, and why it is not shape

A gain ramp takes `RAMP_SECONDS`. A section shorter than one is a section whose own arrival never
completes, so the player hears a wobble instead of a change —
[0117](0117-a-section-change-lands-on-the-beat.md) is why, and
[0138](0138-a-section-boundary-is-a-distance-you-can-drag.md) derives the same bound for a dragged
boundary rather than a typed one. It constrains no musical choice: there is no arrangement anybody
wants that requires a section too short to be heard as one.

**There is deliberately no ceiling.**

## What this makes legal, measured

Four shapes that each failed at least one removed assertion, walked through `musicLevelFor` at a
level's real length:

| shape | now |
|---|---|
| opens at `surge` and holds it — one section, 118.6 s | **legal** (failed the 90 s ceiling) |
| loud, then drops away — `surge` 25 s → `run` 47 s → `push` 46 s | **legal** (failed the 6–30 s build rule) |
| no build at all — `run` 56 s → `surge` 63 s to the boss | **legal** (failed the 30 s build ceiling) |
| a two-minute arrival with a 1.9 s stab at the end | **legal** (failed the 6 s build floor) |

⚠️ **THE LAST ROW IS THE ONE WORTH LOOKING AT.** A 1.9-second final section is a stab rather than a
build, and it is now a thing a level may do. The old floor called that a defect.

## What is guarded

| | |
|---|---|
| every section a level names is one the game actually reaches, in order | ✅ `tests/music.test.ts` |
| every section outlasts the ramp that opens it | ✅ derived from `RAMP_SECONDS`, never typed |
| the last section runs to the boss — checked at both ends and the middle, not just its first unit | ✅ |
| where every section of every level opens, in seconds | ✅ 0158's table, unchanged |
| a script is ascending, opens at zero, ends before its boss | ✅ unchanged |
| **how long any of it lasts, and how busy** | ❌ **on purpose** |

⚠️ **ONE PROBE RETIRED AND TWO RE-AIMED.** 0102's density probe goes with its guard — *a level that
thins out on the way to its boss* is now a legal authoring choice, which is the whole point. 0090's
*approach cut to a sting* and 0102's *ladder collapsed to one rung* both still go red, on the two
claims that survive: 40 units is 1.1 s and under the ramp, and a level that never leaves its opening
reaches one section where its script names four.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix. **No number in the shipped game moves**: all seven levels pass the surviving bounds
unchanged, and `dist/` is byte-identical because nothing under `src/` changed at all.
