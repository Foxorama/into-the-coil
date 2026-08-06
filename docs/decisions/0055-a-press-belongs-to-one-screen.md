# 0055 — A press belongs to one screen, and a released stick is not an ask

**Accepted 2026-08-06.** Extends [0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md), which
is not superseded — both reported bugs are in the seam it created, and neither is a binding problem.

## The rules

- **A screen change spends every input in flight, on every reader.** `InputSource.spend()` and
  `MenuSource.spend()`; `src/app/mount.ts` calls both the moment `screen` moves. Spending discards
  the *asks* and keeps the *holds*: a control still under a thumb has not been released, and the next
  press is the next time the player presses it.
- **A menu hears a stick by how far it is pushed, not only by which way.** Engaging and disengaging
  are different thresholds, and reversing a held direction costs more than starting from neutral.

## The two reports

> *"Gamepad input button on title menus is the same button as the bomb special weapon so starting a
> new game automatically fires a bomb."*

> *"Gamepad title menu is jerky with a quick flick stick — the stick resetting to center makes the
> menu move and it's jerky. happens about 50% of the time."*

## Why the first is not a binding clash

The obvious reading is that `MENU_CONFIRM_BUTTONS` and `PAD_SPECIAL_BUTTONS` both contain button 0,
so one of them should move. **That reading is wrong and acting on it would have made the game worse.**
0046 chose the bottom face button for confirm *because* it must not follow a rebound special —
*"a player who has rebound their arsenal can find themselves unable to leave the title screen"* — and
button 0 is equally the right default for the first special. Both tables are correct.

The defect is that **one press was read twice, by two readers, either side of a screen change.**
0046 split them deliberately: the menu reader runs while the simulation does not, and the device
combiner runs while it does. They swap over at exactly the transition, and nothing spent the press on
the way past. The game's reader took its first snapshot of the run with the button still down, and a
snapshot cannot tell *held since before you existed* from *just pressed* — it only ever says "down
now".

⚠️ **The keyboard has the identical bug and nobody reported it**, because `Space` activates a focused
`<button>` through the DOM *and* is bound to `special1`. Fixing only the device it was reported on
would have left the same defect under the other hand, which is why `spend` is on `InputSource`
rather than on the pad.

## Why `spend` is not `release`, and why that is a separate method

`release` detaches listeners and forgets what was held. On a pad, forgetting what was held is
**exactly the bug**: the next step sees the button down with no memory of it and calls that a press.
So the two point opposite ways on the one device where it matters, and one method with a comment
would have been a trap for whoever touched it next.

| | discards the ask | forgets the hold |
|---|---|---|
| `release` — the source is going away | yes | **yes** |
| `spend` — the screen changed under it | yes | **no** |

⚠️ **The pad's `spend` sets a flag rather than taking its own snapshot.**
`navigator.getGamepads()` allocates and there is no API that does not — 0046 and `src/app/pad.ts`
both record it. Deferring to the next `contribute`, which was going to take a snapshot anyway, costs
nothing.

## Why the flick is 50/50

**A released stick does not return to centre — it springs past it**, crosses zero and rings out on the
far side at a few tenths before settling. The old rule heard any direction that differed from the one
held, so the ring was a perfectly good reversal and the focus jumped back. Whether it cleared
`PAD_DEADZONE` depended on how hard the flick was, which is the reported *"about 50% of the time"*.

⚠️ **The obvious fix is the one this file already refuses.** Requiring a trip through the centre
would resurrect *"a stick rolled from up to down without passing centre stays held and the second
direction is never heard"*, which `tests/menu.test.ts` has held since 0046. A deliberate reversal and
a spring overshoot differ in **how far**, not in where they went — so the threshold is a magnitude,
`MENU_REVERSE`, and the D-pad is exempt by construction because a switch has no spring.

There is a **second mechanism under the same word**. Engaging and disengaging at one threshold means
a stick resting near it re-crosses on noise alone and the focus walks down the menu on its own —
and `src/app/pad.ts` already records that a worn stick rests at 0.15, against a floor of 0.18. So
neutral is reached at `MENU_RELEASE`, below the floor rather than at it.

⚠️ **Both constants are starting points on `PAD_DEADZONE`'s terms, not measurements**, and they are
the kind of number [0037](0037-the-ship-has-mass.md) says only a hand settles.

## The mistake this made, kept

Clearing the held direction whenever the stick reports *no direction* is the obvious-looking line and
it **silently undoes the whole release threshold**: a stick decaying through the deadzone reports
nothing while still a long way from centre, so the ring past centre then meets an already-neutral
reader and is heard as a first push. That is the reported bug again, with the fix in place. It was
written, and `tests/menu.test.ts`'s flick test caught it — which is the one thing that test is for,
and the reason it drives a spring rather than a step function.

## Confirmed, not assumed

Probes in `scripts/probes/0055-presses.mjs`. **6 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the spend flag ignored, so a held button is a fresh press | `THE BOMB: a button held through a screen change is not a fresh press` |
| the spend flag never cleared, so every later press is swallowed too | `spends only the step it was asked for` |
| the keyboard's counted presses left undrained | `THE BOMB: a press counted before a screen change is not delivered after it` |
| the combiner spending only its first source | `spends every source, not just the first` |
| the reversal threshold dropped to the deadzone | `moves the focus exactly once for one flick of the stick` |
| **the screen change no longer spending anything** | `starts a run without also throwing the bomb that button is bound to` |

⚠️ **The last one is the only probe that reaches the actual defect**, and it is a browser probe on
purpose. Both readers can be individually correct about their own snapshots and the bomb still goes,
because the seam is `src/app/mount.ts` — so the guard is the number on the HUD after a run is started
with the button held, which is [0027](0027-measure-the-picture-not-the-model.md)'s rule about
asserting in units the player experiences.

## What this leaves owed

**Whether `MENU_REVERSE` at 0.6 is right on a worn pad has not been played** — only that a spring
ringing to 0.5 no longer moves the focus, on the reading the test drives. The hand that settles it is
the same one 0037 describes.

**Touch has `spend` and no test for it**, because there is no reported case: a tap that dismisses a
screen is a `pointerup` and the tap zones are not the chrome's buttons. It is implemented for the
symmetry the interface now requires rather than for a bug, and this says so rather than leaving a
reader to assume it was verified.
