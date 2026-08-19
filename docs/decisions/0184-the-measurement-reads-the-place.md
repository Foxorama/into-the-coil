# 0184 — The measurement reads the place

**Accepted 2026-08-20.** One expression hoisted, one guard widened, six entries deleted from a
known-bad list. **No note is played differently.** Found while measuring Saurian Belt for a tuning
pass that has not started.

## The rule

**`tests/pace.ts` resolves a gain through `gainIn`, which routes through `rungOf`** — the place's own
ladder, not the shared row. There is one copy of that expression and the scan that guards it covers
the file it lives in.

## ⚠️ What was wrong

`heardAt` read `MUSIC_LADDER[rung][layer]` directly. It is the arithmetic under
[0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s role floor, `scripts/weigh-adrift.mjs` and
`scripts/weigh-heard.mjs` — **every mix decision since
[0162](0162-a-place-has-its-own-ladder.md)**, which is 0164, 0166, 0167, 0170, 0172, 0176, 0181 and
0183.

Measured, with six of seven places stating a ladder:

| | |
|---|---|
| place/rung/layer gains that differ from the shared row | **65** |
| layers a place OPENS that the shared row closes — **inaudible to the instrument** | **7** |
| layers a place CLOSES that the shared row opens — **phantom maskers** | **8** |
| known-adrift entries that were never adrift | **6 of 54** |

```
core/run/engine · labyrinth/push/drone · labyrinth/push/sub
labyrinth/run/sub · mire/run/sub · saurian/run/groove
```

⚠️ **EVERY ONE OF THE SIX IS AT `run` OR `push`, WHICH IS EXACTLY WHERE THE LADDERS ARE.** No entry
appeared that was hidden before; the error only ever invented work.

## ⚠️ How it was found, and it was not by looking

The Saurian pass this was meant to precede opened with `node scripts/weigh-adrift.mjs`, which reported
`saurian/run/groove` buried by **`chords`**. Saurian's own ladder closes `chords` at `run` — it is
[0172](0172-a-place-opens-with-its-own-four.md)'s headline authoring decision, *a floor opens with
hats and without a pad*. **The instrument was blaming a layer that does not sound there.**

⚠️ **THE NEXT EDIT WOULD HAVE BEEN A TUNING PASS AGAINST A PHANTOM**, which is
[0027](0027-measure-the-picture-not-the-model.md)'s subject reached from its worst side: not a model
that has drifted from the picture, but a model that was never describing this level.

## ⚠️ The line was written twice, and 0172 corrected one of them

This is the part worth transferring. `rungShape` and `heardAt` held the **same expression, character
for character**. 0172 found the defect, fixed the copy in `rungShape`, wrote a paragraph about it
there — *"the desk and this disagreed by 27 notes a bar at Ember Nebula's `run`"* — and did not look
for the other one.

⚠️ **SO THE FIX IS THE HOIST AND NOT THE ONE-LINE CORRECTION.** A defect that arrived because a line
was written twice is not repaired by making the copy agree. `rungOf`'s own header says this about the
game's eight readers — *"until now every one of them wrote `MUSIC_LADDER[rung][layer]` for itself"* —
and the file that measures those readers did not take its own lesson.

## ⚠️ And the scan walked where the game reads, never where the measurement does

`0162 — NOTHING UNDER src/ OR rig/ READS THE SHARED LADDER` walks `src` and `rig`. `tests/` was never
considered. Its own comment says a forgotten call site *"is an instrument reporting a mix nobody
hears — which [0116](0116-the-rig-plays-the-level.md) has now been paid for twice."* **This is the
third time**, and it is the instrument the sentence is about.

**`tests/pace.ts` is now scanned by name, not `tests/` as a directory.** The rest of that folder is
full of guards whose SUBJECT is the shared ladder — 0090's additive rule, the arrangement's coverage,
`rungIn`'s own fallback — and walking the directory would flag twenty correct lines to catch one wrong
one.

⚠️ **`scripts/` IS STILL UNSCANNED, AND THAT EXCLUSION IS NOW A DEBT RATHER THAN A DESIGN.** The
stated reason is real — `hear.mjs --music` writes the shared ladder at every rung and that is the
whole point of the mode, and its gun-over-bed mode bakes with no theme at all. But the same file also
had **one read that was simply wrong**: the solo mode resolves every gain through the place and then
counted what was sounding with the shared row, so a layer a place opens was written to disk and left
out of its own tally. **Fixed by hand, which is what an unscanned directory costs.**

## What is guarded

| | |
|---|---|
| `tests/pace.ts` does not read the shared ladder | ✅ the 0162 scan, widened |
| the measurement routes by the place it was ASKED about | ✅ 0164's floor, via the second probe |
| the known-adrift list is exactly what is adrift, both directions | ✅ unchanged, and six shorter |
| **`scripts/` reading the shared ladder** | ❌ named as a debt |

## ⚠️ Two probes, and the second exists because the scan cannot see the mistake it is for

**The first** puts `MUSIC_LADDER[rung][layer]` back and the **scan** goes red.

**The second** reads a place's ladder — just always level one's. It contains no `MUSIC_LADDER[` for a
scan to find, and it is precisely the mistake 0162 records making when it hard-coded
`THEMES.approach.ladder` and every value assertion stayed green. It lands on **0164's role floor**,
and the harness prints the six phantoms by name when it does.

⚠️ **`scripts/hear.mjs`'s CORRECTED READ HAS NO BREAK, AND [0019](0019-a-probe-must-be-seen-to-apply.md)
ASKS THAT BE WRITTEN DOWN.** Its solo mode prints a count; nothing asserts on that count, so a probe
there would redden nothing. The fix is right and it is not load-bearing.

## ⚠️ One difference found and deliberately not resolved

`loudestOf` applies the aura's ceiling at **every** rung, where `gainIn` applies it at none of `boss`
and `bossPeak`. So *the loudest this place ever takes `auraSlow` to* is measured against a proximity
the fight does not have — at Saurian Belt that is **6.9 dB** of understatement. It feeds the audition
guard, not the role floor. **Folding the two together would silently move what an audition is measured
against**, which is not a thing a decision about a different defect should do. Measured, named, handed
on.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, no origin. Nothing under `src/` changed at all: this is a test-side measurement, a
script, and a list. **`dist/` is byte-identical.**
