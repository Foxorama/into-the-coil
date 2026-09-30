# 0431 — A pickup glows in what it offers

**Accepted 2026-10-01.** Item 10 of [the screens review](../../reports/the-screens-reviewed-2026-10-01.md),
brought forward into [0430](0430-the-readout-counts-ships-and-shields.md)'s change on the ask *"do the
floating pickups because that affects the current PR"*. It amends
[0236](0236-the-guns-answer-the-first-play-test.md)'s bubble and keeps its rule.

## What was wrong

At the shipped camera the bubble — one faint ring in the pickup ink over a mint glow — read as a
**dark grey disc with a hairline**: a button laid on the field, not a thing to fly into. The glyph
inside it had worn the ink of what it offers since [0239](0239-the-guns-answer-the-third-play-test.md);
the bubble round it was the same grey for every one.

## The rule

**The outer ring is the pickup ink, at full strength; inside it a second ring and the light are the
ink of the thing offered; and every floating pickup breathes.**

| | |
|---|---|
| **outer ring** | `palette.pickup`, 0.85 — the most a mark off the hull may carry before 0149's guard counts it as body — 0236's *this is a pickup*, which no enemy wears. Unchanged in meaning, made legible |
| **inner ring, glow** | the face's own ink (`INK_OF[kind]`): orange for the pulse and the missile, the ship's blue for the arc, steel for the blade, the ally violet for the seeker. The piece is lit the colour it gives the ship |
| **the breath** | `swell` from 1 to 1.07 and back every 90 steps, the whole field together — `PICKUP_BREATH` in `src/app/frame.ts` |

## Why the breath is safe

A pickup's picture is its hurtbox ([0035](0035-damage-is-legible-on-the-body-that-took-it.md)). The
breath only ever GROWS the picture from its rest size, so the player is never shown less than they can
touch, and at its top it is 7% over — inside `COLLECT_REACH`'s 1.8 many times, so the picture never
promises a touch the collection refuses. No enemy breathes, so it is a second cue beside the ring. It
costs nothing the frame counts: `swell` is a number the one blit already takes (0283), and a sine per
step for the whole field allocates nothing.

It is a clock and not the camera, unlike the shell's shimmer, on purpose: a pickup lying in a boss's
room, where the camera rests, should still look alive.

## Rollback

Nothing irreversible. Reverting restores the grey bubble and still pickups.
