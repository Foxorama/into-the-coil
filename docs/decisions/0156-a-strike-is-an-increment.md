# 0156 — A strike is an increment, and the guard was reading a peak

**Accepted 2026-08-17.** [0108](0108-the-bed-is-felt-and-the-boss-arrives.md) gave a pitched note a
weight and wrote the guard that proves the weight survives the bake. That guard stopped seeing its
subject the moment the notes it measures began to overlap, and
[0019](0019-a-probe-must-be-seen-to-apply.md) is what noticed.

> `0108  a pitched note's weight dropped on the way to the bake` — **the suite stayed GREEN. The
> guard does not fire on the thing it exists to catch.**

## The rules

**A note's weight is measured as what its onset ADDED, not as the loudest sample near it.** The
window is only the strike's own while the previous note has finished. Once a layer rings longer than
its own step, a peak is a sum of two notes and the accent is invisible in it.

**An estimate made from one strike is made from every strike the loop has.** Two notes of the same
pitch at different phases cancel by up to 15% one at a time; over 256 sixteenths that averages out to
within 0.024 of the table's own numbers.

**A measurement is asserted against the authored number, not against a threshold.** `< 0.95` is a
direction; `|measured − 0.76| < 0.1` is a measurement, and it is the difference between a guard that
would have gone on passing at 0.85 and one that could not.

## What happened

[PR #199](https://github.com/Foxorama/into-the-coil/pull/199) repairs `hook`'s envelope — the last of
the seven material passes. `seconds` goes from `0.19×BEAT` to `0.55×BEAT` and `curve` from 6.5 to
2.0, which is a ring of roughly **12 ms → 110 ms** against a sixteenth of **100 ms**.

`tests/music.test.ts` → *"and a PITCHED note has a weight too"* baked `hook`, took the loudest sample
in the 40 ms beginning at sixteenth 0 and at sixteenth 2, and required the second to be under 0.95 of
the first. The material is written `0, _, 0, 0` at accents `[1, 1, 0.76, 0.82]`, so sixteenth 2 is
the leaned-on one.

**Sixteenth 0's tail now rings through sixteenth 2's window.** Measured on the branch:

| | sixteenth 0 | sixteenth 2 | ratio | the table |
|---|---|---|---|---|
| shipped accents | 0.3137 | 0.2230 | **0.71** | 0.76 |
| every accent flattened to 1 (the probe) | 0.3366 | 0.2855 | **0.85** | 1 |

Both are under 0.95, so the assertion passed either way. The probe did exactly what it says it does
and the guard could not tell.

## ⚠️ The obvious fix does not work, and that is the finding

*"Measure the increment at the onset rather than the absolute peak"* is what the handover on `main`
proposed, and one sixteenth at a time it is **not enough**: the same two windows read **0.587** and
**0.732**, still both under 0.95.

**Because two notes of the same pitch do not add — they interfere.** With the probe applied, the
strike at sixteenth 2 is the same event as the strike at sixteenth 0, and its window peaks at
**0.2855** where the note alone reaches **0.3366**: the tail it lands on is 15% out of phase with it
and takes the sum *down*. A single strike is not a reliable sample of its own weight.

**Averaging the increment over the whole loop is what makes it one.** 256 sixteenths, grouped by
position in the four-entry accent cycle:

| pos | authored | measured, shipped | measured, probe applied |
|---|---|---|---|
| 0 | 1 | (the reference) | (the reference) |
| 2 | 0.76 | **0.745** | **1.076** |
| 3 | 0.82 | **0.844** | **1.059** |

Worst error against the table: **0.024**. The probe moves it to **0.32**. The tolerance is 0.1, which
is four times the observed bias and a third of the break.

## What it is measured with

- `peakIn(onset, 40 ms) − peakIn(onset − 8 ms, 8 ms)`, per struck sixteenth, meaned per accent slot.
- 40 ms is past the 2 ms attack and short of the next sixteenth at 100. 8 ms is about a cycle of the
  ring, which is what a peak needs to see the level it is subtracting.
- Both windows were swept before being chosen — 4/8/12/20 ms behind, 24/40/60 ms ahead. 8 ms is the
  one with the smallest worst-case error across both accented positions; 12 ms is more accurate at
  sixteenth 2 (0.759 against 0.76) and worse at sixteenth 3 (0.868 against 0.82).

## ⚠️ The class, and why it is written down rather than fixed quietly

**This is the third time in one session that a probe's break stopped breaking** —
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s *wrong quantity in the guard*
branch. The other two were caught locally and re-cut; **this one only CI saw**, because the local
suite was being starved by a dev server and its browser tests were failing first.

⚠️ **The pattern is a guard whose measurement is valid only inside a range the material is free to
leave.** 0108's window was correct arithmetic about a 12 ms note. Nothing in it said *this assumes
the note has stopped*, and nothing checks that it still has —
[0027](0027-measure-the-picture-not-the-model.md)'s *a guard measuring a quantity defined in terms of
the constant it guards* seen from the other side: here the guard's own validity was defined in terms
of a constant somewhere else entirely.

⚠️ **AND THE MATERIAL CHANGE WAS RIGHT THE WHOLE TIME.** The temptation on a red probe is to look at
what moved most recently and back it out. `hook`'s envelope repair takes its solved multiplier from
7.85× to 2.33×, improves 0108's own chest-band guard from 0.2115 to 0.2790, and is *why* the note
rings long enough to break the measurement. **The reading was wrong; the sound was not.**

## ⚠️ And the new assertion has its own probe, aimed at what the threshold could never see

`scripts/probes/0156-a-strike-is-an-increment.mjs` square-roots the accent on its way to the note —
the standard "perceptual" correction, a one-token change, and wrong here because `accents` is
documented as how hard a note is **struck** and the mix is solved against those numbers.

| | old guard, `< 0.95` | 0156's guard, against the table |
|---|---|---|
| `Math.sqrt(accent)` | 0.777 — **green** | 0.894 and 0.944 against 0.76 and 0.82 — **red** |

**0108's probe and this one are different failures.** That one throws the accent away entirely and is
the extreme case; this one is a weight arriving at the wrong **size**, which `< 0.95` passes for any
accent under about 0.95 whatever the material is doing. Halving the accent's depth rather than
square-rooting it reads 0.782 on the old guard and is red on the new one too — measured, not assumed.

## Confirmed, not assumed

- `node scripts/prove-guard.mjs 0108` — **7 of 7 red**, including *a pitched note's weight dropped on
  the way to the bake*, which is the one that did not fire before.
- `node scripts/prove-guard.mjs 0156` — red on the guard it names.
- Both bakes verified byte-identical across runs, so the statistic is deterministic and not sampled.
- The window sweep above is measured rather than reasoned — six pairs, printed side by side.

## Rollback

A test and a comment. No storage key, save schema, SW cache prefix or origin —
[0001](0001-revertability-not-risk-rating.md).
