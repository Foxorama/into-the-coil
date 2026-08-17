# 0162 — A place has its own ladder

**Accepted 2026-08-17.** The mechanism behind *"the run feels almost exactly the same"*, which three
decisions of per-place writing could not reach.

## The rule

**A place may state its own value for any layer at any rung**, as a sparse override of
`MUSIC_LADDER`. `ThemeRow.ladder` is optional, sparse per rung and sparse per layer inside a rung, and
`rungOf(theme, rung, layer)` is the **one** thing that answers *how far open is this layer here.*

## ⚠️ Why `mix` could not do this, and why the reason it could not has expired

`mix` is a **multiplier**, and its own doc says why:

> *"A MULTIPLIER rather than a ladder, so a theme cannot break the ladder's shape. 0090's rule is that
> the ladder only ever opens layers and 0102's is that every rung adds something."*

**Both of those rules are gone.** [0120](0120-a-rung-may-close-a-layer.md) retired the first and
[0161](0161-the-shape-of-a-level-is-not-guarded.md) the second — yesterday. The multiplier was
protecting two rules that no longer exist.

⚠️ **AND A MULTIPLIER CANNOT OPEN WHAT THE LADDER CLOSED, WHICH IS THE DEFECT.** `MUSIC_LADDER`'s
`run` row:

```
arp: 0   ride: 0   hook: 0   drive: 0   counter: 0   lead: 0
```

Any multiple of zero is zero. **So every one of the seven places opens a level with the same six fast
layers shut** — whatever it says in `mix`, and whatever material it re-voices. Reported against exactly
that, and `docs/state-of-play.md` already recorded it as unanswerable:

> *"still slow and melodic… more appropriate for a cthulhu-ian investigative game"*
> *"the run feels almost exactly the same"*
> *"it is the SHARED ladder, and no amount of per-place writing can reach it."*

[0128](0128-a-place-plays-its-own-material.md), [0147](0147-a-place-is-a-balance.md) and
[0148](0148-a-place-has-its-own-notes.md) each gave a place something of its own — material, balance,
notes. **None of them could change which layers are playing**, which is the axis a listener notices
first.

## ⚠️ It lands empty, and that is measured

**No place states a ladder.** Every gain the mixer writes is byte-identical to `main` — **147 rows**:
all seven places × all seven rungs × three aura distances, read out of `levelWrites`, which is the
function `setLevel` does nothing but ask.

`mix` still applies over the top, and the two mean different things: **this is a place's SHAPE** —
which layers are open at which rung — and `mix` is its **BALANCE** (0147). A place may state both.

## ⚠️ The guards are deliberately thin, on 0161's terms

What is held: a stated rung and layer **exist** (a sparse override falls back on any key it does not
recognise, so `{ surge: { hooks: 0.8 } }` would be silence in a place that reads as authored), and a
value is one the desk can express — **zero included**, because closing a layer is a thing a rung may
do.

What is **not** held: whether a place climbs, holds or drops away. A guard over that would be the thing
0161 was written to remove, arriving one table over a day later.

## ⚠️ And a guard I wrote this hour was vacuous — the harness caught it, not me

The first version asserted `rungOf(theme, …) === rungIn(THEMES[theme].ladder, …)` for all seven places
at every rung. A probe replaced `THEMES[theme].ladder` with `THEMES.approach.ladder` — reading one
fixed place — and the suite **reported STILL GREEN.**

⚠️ **BECAUSE EVERY `ladder` IS ABSENT, READING THE WRONG PLACE'S TABLE GIVES THE RIGHT ANSWER FOR ALL
SEVEN.** The guard could not fail, and it had been written the same hour by somebody who had spent the
day removing guards for being wrong. [0019](0019-a-probe-must-be-seen-to-apply.md) earning its place
again, and the second time today.

**What replaces it is a source scan** — `rungOf` must pass `THEMES[theme].ladder` — which is the same
species as [0158](0158-a-level-says-where-its-sections-open.md)'s `.sections` argument check and exists
for the same reason: an expression is checkable when a number is not.

⚠️ **THE DEBT IS NAMED AND IT IS OWED BY THE FIRST AUTHORING CHANGE.** The moment one place states a
ladder, the honest version of that claim is a value comparison, and the scan should be **replaced** by
it rather than kept alongside.

## ⚠️ The cost of landing empty, stated once

This is the third neutral landing this session ([0158](0158-a-level-says-where-its-sections-open.md),
[0159](0159-the-two-clocks-come-apart.md), and this) and the discipline has been worth it every time —
a provable diff, and no musical judgement tangled up in a refactor. **This is the first time it has
cost something**: a mechanism no data exercises has a code path nothing can drive, and one of its
guards was vacuous as a direct result. Worth knowing rather than worth reversing — `rungIn` taking its
table as an argument is what makes the path reachable at all.

## What is guarded

| | |
|---|---|
| a place's own number wins; a layer or rung it does not mention falls back to the shared ladder | ✅ `tests/themes.test.ts`, driven with a synthetic place |
| **zero is a value a place may state** — `??` and not `\|\|` | ✅ and it is the one-character version of the whole decision |
| every rung and layer a place names is a real one | ✅ so a typo is a failure rather than silence |
| every value is inside what the mixer and the desk can both express | ✅ |
| **nothing under `src/` or `rig/` reads `MUSIC_LADDER` directly** | ✅ `tests/dash.test.ts` — `rig/` scanned too, unlike the other two scans |
| `rungOf` routes by the place it was asked about | ⚠️ a **source scan**, because a value cannot see it yet |
| whether a place climbs, holds or drops | ❌ **on purpose** — 0161 |

⚠️ **`node scripts/prove-guard.mjs 0162` IS 4 OF 4 RED**, and 0116's *theme multiplier dropped* was
re-anchored — the harness refused to run until it was, for the third time this session.

⚠️ **`scripts/` IS DELIBERATELY NOT SCANNED.** `scripts/hear.mjs --music` writes the shared ladder at
every rung with no place applied, which is that mode's whole subject. Forcing a themed read there would
make the tool answer a different question.

## What it costs

| | |
|---|---|
| `dist/index.html` | 253,039 → **253,177, 138 bytes** — `rungOf`, `rungIn`, and one optional field |
| the frame loop | one property lookup deeper per layer per rung change, which happens on a section boundary and not per frame |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix. `ThemeRow` is content and never enters the save
([0021](0021-one-stream-per-concern.md)).

## What this is for

The next change authors overrides, and it wants an ear rather than a hand: *"the nebula is a good
example, starts out with a chorus, escalates to organ music and loud pumping beats, shifts to a
dante's inferno style boss fight… don't lock that into a rule."* **This is the field that lets six
other places be as different from each other as Ember Nebula already is from the base** — and 0161 is
why nothing will assert what they should sound like.
