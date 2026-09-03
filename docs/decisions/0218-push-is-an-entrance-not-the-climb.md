# 0218 — `push` is an entrance, not the climb

**Accepted 2026-09-03.** The same forty-one seconds of The Approach as
[0215](0215-a-transition-is-a-shape-not-an-instant.md), reported again after that decision shipped —
and the second report is the one that says what it is.

> *"still kicks in too loudly at the 41-46 second range. it's background music up till that point and
> then at around that point it loudly increases too foreground music volume."*

## The rule

**A layer that continues past `push` arrives there at 70% of its `surge` value.** `ride` 0.68→0.48,
`hook` 0.74→0.52, `lead` 0.78→0.55. `arp` is untouched, because `surge` closes it — a layer that lives
only at `push` arriving quiet is arriving quiet for nothing.

## ⚠️ 0215 fixed the rate and the report was about the level

0215 measured the **one-bar rise** and took The Approach from +2.2 dB to +1.1. That was a real defect
and a real fix, and it is not what was being reported: *"background… then foreground"* is a statement
about where the music **sits**, not about how fast it gets there.

Measured through the shaper, which is what a listener gets:

| rung | dB | over `run` |
|---|---|---|
| calm | −16.3 | −2.6 |
| run | −13.7 | 0.0 |
| **push** | **−10.1** | **+3.6** |
| surge | −9.5 | +4.1 |
| approach | −10.8 | +2.9 |
| boss | −9.6 | +4.1 |

⚠️ **`push` CARRIED 3.6 dB OF A 4.1 dB CLIMB.** Eighty-eight per cent of everything the level ever
gains, in one boundary, at forty-one seconds — and then flat for two minutes. The ladder was not a
climb with a shape; it was a switch with three rungs of decoration after it.

⚠️ **AND 0136's ARC HAD QUIETLY STOPPED BEING TRUE.**
[0136](0136-the-place-has-a-room-and-an-arc.md) authored *"Up, Up, Up, drop, sharp Down"*. Measured,
it was **up, flat, slightly down, up**. The Approach now reads +2.9 at `push` and +4.1 at `surge`, so
`push → surge` is a real move for the first time rather than half a decibel.

⚠️ **THE NEW STEP IS THE SAME SIZE AS THE LEVEL'S OWN OPENING**, which is where this stopped rather
than at a rounder number: `calm → run` is +2.6 and `run → push` is now +2.9. **No boundary inside a
level is bigger than the one that starts it.**

## ⚠️ And 0217 had made this worse the day before

Halving `MUSIC_DRIVE` was measured as *boss-over-run +1.7 → +2.1 dB* and recorded as a gain. **The
same arithmetic applies to every contrast in the game**, and one of them was the thing being reported:
The Approach's `run → push` went **3.2 dB → 3.6** in the same change.

A shaper compresses the loud rung harder than the quiet one, so **less drive is more contrast
everywhere**. That is one sentence and it was not written down, because `tests/arc.ts` measures the
bus *before* the shaper and says so — *"a jump measured here is an upper bound"*, which is the safe
direction for a guard about loudness and the **wrong** direction for a guard about a gap between two
rungs. `DriveAt` now carries the through-shaper RMS so the quantity exists at all.

## What this does not fix

⚠️ **THREE PLACES CLIMB BY A ROUTE THIS CHANGE DOES NOT TOUCH.** `push` over `run`, after:

| place | before | after | and `surge` over `push` |
|---|---|---|---|
| The Approach | 3.6 | **2.9** | +1.2 |
| Rime Shelf | 3.5 | 2.8 | +1.2 |
| Ember Nebula | 1.5 | 1.4 | −0.2 |
| Saurian Belt | 0.2 | 0.2 | +0.5 |
| The Toxic Mire | 4.5 | **4.4** | +2.7 |
| The Black Heart | 5.4 | **5.2** | +0.9 |
| The Labyrinth | 5.6 | **5.2** | +3.9 |

The Toxic Mire, The Black Heart and The Labyrinth barely move, because **their climb is carried layers
being turned up, not parts arriving** — the same distinction 0215 found the hard way when scaling
arrival ramps did nothing to The Labyrinth. Those three are now the loudest jumps in the game and
none of them has been reported. Fixing them is a change to those places' own ladders, which is a
different edit and a different conversation about how loud a place should sit.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0218`.

| broken on purpose | went red |
|---|---|
| `push` back to arriving at its `surge` value, so one boundary is the whole climb | `no boundary inside a level is bigger than the one that opens it` |

## What is owed

**A listen, for the third time on the same six seconds.** Everything above is a model quantity, and
the two previous answers to this report were each correct about what they measured and each measured
something other than what was heard. If it still reads as foreground, the remaining lever is that the
`lead` and `hook` **parts** arrive at all — the roles whose whole job is *follow this*
([0154](0154-the-mix-is-authored-as-intent.md)) — and moving those is moving what `push` means rather
than how loud it is.
