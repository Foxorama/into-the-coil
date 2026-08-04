# The drag gain was a per-step constant, and the whole suite agreed with it

**2026-08-05.** Second finding from the eyes-on instrument, six hours after
[the first](camera-judder-2026-08-04.md), in a different layer, found the same way.

## What was measured

A real swipe driven against `next.intothecoil.vulpecula.games` in an emulated phone — 844×390, DPR
3, `hasTouch` — with `scripts/trace-frame.mjs`'s blit hook reading where the ship was **actually
drawn**. 140 CSS pixels of finger, downward, in the steering area.

| | before | after |
|---|---|---|
| ship travel for a 140px swipe | **10.3px** | **224.0px** |
| predicted (`140 × DRAG_GAIN`) | — | 224px |
| finger travel to cross the dodge lane | **~5,300px** | ~250px |
| assertions green | **332 of 332** | 336 of 336 |

The upward swipe is the clean number: the downward one clamps at the edge of the player's box after
171.6px, which is `src/sim/flight.ts` doing its job.

## The bug

`DRAG_GAIN_PX = 90`, documented as *"90px of travel asks for full speed"*. True, and useless — a
full-deflection ask buys `SHIP_SPEED` world units **for one step**. Crossing the 100-unit lane takes
59 such steps, so 59 × 90px of thumb. Five metres.

## Why nothing caught it

**Every drag assertion measured an ask.** *"N pixels produce a deflection of 1"* is self-consistent
at any conversion factor, including an absurd one — the constant appears on both sides of the
assertion. Twelve tests, all green, all measuring the same wrong quantity.

The missing measurement is **distance**: drain the bank and add up the world units actually
delivered. That is what a thumb feels, and the only quantity that ties finger pixels to ship pixels.

⚠️ **The probes did not help either, and that is the sharper half.** Nineteen breaks, every one red.
A probe proves the guard fires on the bug it describes; it cannot notice that the guard measures the
wrong thing entirely. `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` closes one hole and this
is the other one.

## The fix

`DRAG_GAIN` is a ratio — ship pixels per finger pixel — converted through the view's `scale`. That
scale is the thing that was missing: a drag is a distance on glass, an `Intent` is a fraction of a
step's travel, and nothing converts one into the other without knowing how big a world unit currently
is on this screen. **A constant in pixels was that conversion guessed at.**

## What this says about 0027

[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) landed with inherited evidence and
one structural argument: *every quantity this repository counts is a model quantity.* It now has two
of its own, from two different layers, in one session:

| | model said | picture said |
|---|---|---|
| [camera judder](camera-judder-2026-08-04.md) | ship stationary, camera correct | 4.0px/s of judder on every entity |
| this | 90px of finger asks for full speed | 140px of finger moves the ship 10.3px |

Both were found in under an hour by an instrument that renders at the camera the game ships. Neither
was reachable from any assertion in the suite, before or after.

⚠️ **The generalisation worth carrying: a guard that measures a quantity defined in terms of the
constant it is guarding proves only that the code is self-consistent.** At least one assertion has to
be written in units the player experiences — pixels, seconds, a fraction of the lane — rather than in
the code's own vocabulary.
