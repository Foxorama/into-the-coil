# 0583 — A bake ahead takes one worker

**Accepted 2026-10-08.** Amends [0331](0331-the-heart-beats-under-it.md)'s bake of the next place, which
starts at `approach`, and how it uses [0331](0331-the-heart-beats-under-it.md)'s worker pool.

## The ask

> *"There's a lot of crackle, pop and hiss on mobile when playing with my earbuds in, particularly around
> the later parts of ember nebula"*

> *"Try fix 1"* — this change, out of the two proposed.

## What was measured first

- **The music alone is clean.** Ember Nebula (`descent`) rendered whole with `scripts/hear.mjs --level=descent`,
  start to boss death: it peaks at 0.33 of full scale and never goes above 0.95. Above 6 kHz it sits between
  −67 and −55 dB. The largest jump from one sample to the next is 0.098. The later sections are no worse than
  the opening. So the crackle is not in the samples.
- **The cue bus cannot clip**, by [0183](0183-a-cue-is-limited-rather-than-refused.md)'s limiter, and the music
  goes through the same limiter.
- **What happens late in the level is a bake.** At `approach`, about 91 s into Ember Nebula, `bakePlaceAhead`
  sends all of Saurian Belt's layers to the pool at once: 25 layers, 58 MB, 3.4 s of synthesis on the
  container this was measured on. The pool has `min(4, cores − 2)` workers, so a phone with eight cores runs
  four of them flat out under the approach and the fight. A phone has only a few fast cores, and its audio
  is mixed on one of them.

| place baked ahead | layers | synthesis | resident |
|---|---|---|---|
| Ember Nebula | 21 | 3.9 s | 47 MB |
| Saurian Belt | 25 | 3.4 s | 58 MB |
| The Black Heart | 27 | 13.3 s | 89 MB |

## The rule

**A bake ahead keeps `AHEAD_IN_FLIGHT` (one) layer on the pool at a time. A bake for the place the run is in
is sent whole, as before.** When the run reaches a place whose bake ahead is still in flight, `hurry` sends
everything the bake is still holding back, all at once.

`bakePlace` returns a `PlaceBake` handle, `{ stop, hurry }`, in place of a bare stop function. A stopped
bake also stops feeding the pool, so a cancelled bake ahead wastes at most the one layer it has out.

## Why one, and why it costs nothing it did not already cost

The place baked ahead is not needed until the boss dies. 0331 sized the window as the approach plus the
fight, never less than forty-five seconds. On one worker the synthesis is the same total spread across that
window, not four cores in a burst. The worst case is a boss that dies before the bake lands, and that pays
what every bake ahead used to pay, only at that moment, because the boundary's `bakeIncomingPlace` calls
`hurry`.

**Rejected: fewer workers in the pool.** The prewarm and the incoming bake are owed immediately, and
[0413](0413-the-prewarm-is-parallel.md) needs the pool's width for them. What changes is how much of the
pool a bake that is not owed yet may take, which is a property of the caller.

**Rejected: a larger audio buffer (`latencyHint: 'playback'`).** It was the second proposal. It trades
cue latency for robustness, and it was not asked for.

## ⚠️ What this does not establish

**That this was the crackle.** Nothing here ran on a phone. The bake is the only measured load that arrives
at "the later parts" of a level, and it fits. But a burst of synthesis lasting a few seconds does not by
itself explain crackle across the whole fight. Load from the fight itself is the other candidate, and it is
unmeasured. The check is on the phone: open DevTools' WebAudio panel over `chrome://inspect` and watch
**Render Capacity** through Ember Nebula's approach and fight. If it stays low while the crackle is heard,
the cause is elsewhere.

## What is guarded

| | |
|---|---|
| a bake ahead never has more than one layer on the pool, and sends the next as one comes back | ✅ `tests/sound.test.ts` |
| `hurry` sends everything still held back | ✅ |
| a bake for the place the run is in is still sent whole | ✅ |
| a stopped bake sends nothing more | ✅ |
| **`bakeIncomingPlace` calls `hurry` when the run outruns its bake ahead** | ❌ it is inside `mount`'s closure, which no headless test reaches. Getting it wrong costs a longer crossing (0340 waits on the place), not wrong music |

Probes in `scripts/probes/0583-a-bake-ahead-takes-one-worker.mjs`.

## Rollback

None owed — [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no service-worker
cache prefix.
