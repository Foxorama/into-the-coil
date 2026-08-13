# 0144 — A chain of deaths is a cymbal streak, and the streak lives in the top

**Accepted 2026-08-13.** A play-through report that **reverses part of
[0109](0109-a-death-is-a-drum.md)** — and is only safe because it reverses it in a different band.

> *"Enemy death needs a sharper percussive beat where the sound lasts a bit longer so a chain of
> deaths sounds like a sharp cymbal streak."*

## The rule

**The kill's tail is spent in the band above 1.5 kHz and nowhere else.** Its longest layer is the
high-passed debris, not the body — so a chain of deaths overlaps as a streak of top end rather than as
the rumble 0109 measured and removed.

## ⚠️ Why *lasts a bit longer* is dangerous, and what makes it safe

0109 cut this cue from **0.46 s to 0.26** for a stated, measured reason: *at two a second the
explosions overlapped themselves continuously into a rumble.* Read naively, this report asks for that
back.

⚠️ **THE DIFFERENCE IS WHICH LAYER LENGTHENS.** The BODY — noise falling to 620 Hz, the part that
rumbled — keeps 0109's length exactly. The DEBRIS layer, high-passed at 1500 Hz, goes **0.24 → 0.36 s
and 0.06 → 0.15 gain**. Overlapping tops is what a cymbal streak *is*; overlapping bodies is mud.

⚠️ **AND IT IS STILL INSIDE THE BEAT.** 0.36 s against 0.4 s at 150 BPM, so 0109's *a punctuation mark
is shorter than the beat it lands on* is untouched and its guard still holds.

## Sharper is a faster fall, not more gain

*"A sharper percussive beat"* is a claim about the front edge. Raising the row's `gain` would have made
the body louder in the same proportion — which is the mistake 0109 records itself avoiding on this very
cue, when *"emphasise the regular enemy death… those notes"* was answered by raising the tuned voices
rather than the noise.

So the CRACK's lowpass opens **8200 → 11000 Hz**, its curve steepens 10 → 13 and its attack halves.
Brighter, and out of the way faster.

## What is guarded

| | |
|---|---|
| **the longest noise layer is not the body**, and is high-passed clear of it | ✅ `tests/sound.test.ts` |
| the cue is still shorter than the beat it lands on | ✅ 0109's guard, unchanged |
| it is still struck at more than one weight | ✅ 0104's, unchanged |
| the music's own fundamental is still not claimed by it | ✅ 0109's, unchanged |

⚠️ **The probe spends the extra length on the BODY instead**, which is the obvious way to answer the
report and restores exactly the rumble 0109 removed — while satisfying every other assertion about the
cue, including the length ceiling.

## What this does not settle

⚠️ **Whether a chain actually reads as a streak is an ear**, and this is the change that makes it
possible rather than the evidence that it worked. It lands with
[0143](0143-a-wave-is-spaced-by-the-body-it-is-made-of.md), which is what puts four deaths inside one
trigger pull for the first time — so the two want judging together, and neither alone.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Two layer rows in a table the game
synthesises at load. Nothing is persisted.
