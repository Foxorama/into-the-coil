# 0178 — A break has to be able to run

**Accepted 2026-08-19.** The first thing [0177](0177-a-red-is-a-verdict.md) found once probe messages
were on the record, and the reason it was worth putting them there.

## The rule

**A probe's break is written out of what its target file has IN SCOPE.** A break naming an identifier
the file cannot see does not change behaviour — it makes the module throw, the test dies on that, and
`red` is reported without the guard ever asserting.

## ⚠️ 0019's pre-flight cannot see this, and that is not a gap it can be widened to cover

`anchorFailures` asks whether the `find` still appears. That is a question about the file as it stands
and it is answerable by reading. **Whether what `replace` puts there can RUN is a question about the
file after the edit**, and answering it statically means resolving scope — which is a typechecker.

⚠️ **`tsc` per probe was considered and refused on cost.** 687 probes at ten-plus seconds each is
[0115](0115-a-probe-runs-its-own-guard.md)'s arithmetic in reverse — the run is filtered to one test
precisely because whole-suite work per probe was the thing that made `prove` unaffordable. And it
would still be the wrong instrument: `vite build` in `tests/globalSetup.ts` is esbuild, which strips
types without checking them, so a probe that typechecks can still throw.

⚠️ **AND A CHEAP STATIC APPROXIMATION WAS TRIED ON PAPER AND FAILS.** *Every identifier `replace`
introduces must appear somewhere in the target file* catches `PHRASE_SECONDS` and `MUSIC_LADDER` and
**misses `bossAt`**, which appears five times in `src/app/music.ts` — in prose, in a parameter of a
different function, and in a comment recording its own removal. A check that catches two of three
buys false confidence, which is worse than none.

## ⚠️ What the 687 reds actually are, counted

Off the run that produced this decision — the whole point of
[0177](0177-a-red-is-a-verdict.md) being that this can now be counted at all:

| what the red was | how many | what it means |
|---|---|---|
| `AssertionError` | **673** | the guard fired |
| a fixture refusing — *"the ship never died"* | 3 | the suite reached a verdict |
| a stated wait expiring — `page.waitForSelector: Timeout 15000ms exceeded` | 5 | the wait IS the claim |
| **`ReferenceError` / `TypeError`** | **6** | **the guard never asserted** |

## ⚠️ Three of the six could never have run, and each was orphaned differently

| probe | named | why it was not there |
|---|---|---|
| 0090 | `bossAt` | [0158](0158-a-level-says-where-its-sections-open.md) took it out of `musicLevelFor`'s signature. The guard's own comment says so — *"AND THAT IS WHY `bossAt` IS NO LONGER AN ARGUMENT AT ALL"* — while the probe beside it went on naming it |
| 0126 | `MUSIC_LADDER` | exported by `src/content/music.ts`, never imported by `rig/transport.ts` |
| 0135 | `PHRASE_SECONDS` | exported by `src/content/music.ts`, never imported by `src/app/music.ts` |

**All three are re-aimed and now fail on their own assertions**, each written out of symbols the file
already has: `Math.max(...MUSIC_LAYERS.map(secondsOfLayer))` for the phrase (25.6 s, equal to the
constant — checked), the last section's `at` for the distance, and `rungOf` for the ladder.

| probe | what it said before | what it says now |
|---|---|---|
| 0090 | `ReferenceError: bossAt is not defined` | `expected 'run' to be 'boss'` |
| 0126 | `ReferenceError: MUSIC_LADDER is not defined` | `approach at 0.0s: drone: expected 0.34 to be close to 0.508538` |
| 0135 | `ReferenceError: PHRASE_SECONDS is not defined` | `a place 0s into the phrase waits 25.60s, which is longer than a bar` |

⚠️ **0135's is the number 0135 was written about.** Its report is *"the start of level 2 sounded a bit
like the default start"*, and the decision's own figure is **25.6 seconds against 1.6**. The probe has
existed since that decision and had never once produced it.

⚠️ **AND INDEXING A LADDER BY HAND CRASHED ON THE FIRST TRY, WHICH IS THIS RULE ARRIVING TWICE IN ONE
SITTING.** `ThemeRow.ladder` is optional — [0162](0162-a-place-has-its-own-ladder.md) gives a place
its own ladder and not every place has one — so `THEMES[theme].ladder[r]` is a `TypeError`. `rungOf`
defaults that argument, and using the reader the file already imports is the whole of the rule above.

## ⚠️ The other three are a different thing, and they are left

`0053` twice (`Cannot read properties of undefined (reading 'charges')`) and `0072`
(`baked[indexOf(...)][0].slice is not a function`) **apply correctly**. The break runs; the code then
crashes downstream, which is a fair description of what the defect does. They are still a red the
guard did not produce, and still prove less than their tables claim — but re-aiming them means
choosing a *smaller* break, and whether a smaller break is still the defect is a question per probe
rather than a rule.

## ⚠️ The guard that closes this cannot be added yet, and that is the next step

**A probe's red should be an `AssertionError`, a fixture's own refusal, or a stated wait expiring —
never a `ReferenceError` or a `TypeError`.** That is one comparison in `verdictOf`, it would have
caught all six, and it is not added here **because three of the six are still live**: a guard added
today would be red on arrival, which is the one thing
[0005](0005-a-guard-must-be-seen-to-fail.md) will not have. Re-aim those three and the arm becomes a
two-line change that closes the class for good.

## What this is not

**Not a claim that the six guards are wrong.** Each still holds on `main`; what was missing is
evidence that it fires on the thing it exists to catch.

**Not a new mechanism.** No code moves in `scripts/prove-guard.mjs` — 0177 already prints what makes
this findable. This is three probes rewritten and the reason written down.

## Rollback

Nothing shipped moves: no storage key, no save field, no service-worker cache prefix, no origin, and
no file under `src/`. Three probe files. Reverting restores three breaks that report `red` without
asking their guards.
