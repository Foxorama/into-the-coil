# Three devices, one sitting, and the ordering is finished

**2026-08-05.** The play-test on [0037](../docs/decisions/0037-the-ship-has-mass.md), and the last
item in the sequence [`drag-feel-2026-08-05.md`](drag-feel-2026-08-05.md) opened.

## The verdict

> *"55 feels really good, tested on gamepad→desktop, mobile→thumb-touch, desktop→WASD.*
>
> *The WASD/arrow keys don't feel great, but it's more the directionality, and I'm happy with the
> other two where they are to not try and tweak the keyboard keys."*

## The ordering is fully discharged

`drag-feel-2026-08-05.md` deferred four things onto one trigger and sequenced them. All four are now
closed, and **three of the four closed with no change at all**:

| | | outcome |
|---|---|---|
| 1 | `SHIP_SPEED` + the scroll rate | **no change** — [`ship-speed-settled`](ship-speed-settled-2026-08-05.md) |
| 2 | ship inertia | **built** — 0037, `FLIGHT_RESPONSE` 0.2 |
| 3 | keyboard continuity | **closed as superseded**, see below |
| 4 | `DRAG_GAIN` and the bank | **no change** — the prediction behind it was wrong |

⚠️ **That the answer to three of four was "leave it" is not the ordering failing.** It is the
ordering working: each was a *preference* until something could kill the player, and each became a
measurement that could be taken and come back negative. The alternative — tuning them when they were
still preferences — is the predecessor's eight-pass bounce, and the cost of the discipline was one
play-test per item.

## The refuted prediction, recorded rather than dropped

Both `drag-feel` and 0037 itself said `DRAG_GAIN` would be **due, very likely upward**, because
touch would carry the bank *and* the ship's mass — inertia twice.

**A thumb says no.** Touch was played with both and came back *"really good"* alongside the other two
devices.

The arithmetic behind the prediction was correct: the two lags do add. The conclusion drawn from it —
that the sum would be too much — was not. **Two mechanisms compounding is a different claim from
their sum being wrong**, and nothing but a hand separates those. Worth keeping as the shape of the
mistake: a real mechanism, correctly identified, with an unearned consequence attached.

## The keyboard: closed, not deferred, and the reason is the useful part

The player named it precisely — *"it's more the directionality"* — and declined the change. Both
halves are right, and the second is right for a reason worth writing down so nobody spends an
afternoon on it later.

0032 proposed *keyboard continuity* — ramp each axis instead of snapping to ±1 — as the **cheap
alternative** to inertia, for use if the missing ingredient turned out to be continuity rather than
mass. Inertia was built. So:

- **The ramp's purpose was smoothing, and the ship now smooths every device.** The keyboard already
  received what the ramp was for.
- **A ramp cannot add a ninth direction.** Two axes ramping at the same rate still resolve to the
  same eight in the steady state; angles exist only during transitions. 0032 half-admits this —
  *"reached by timing rather than by aiming"* — and timing a tap to modulate an angle is a workaround.
- ⚠️ **It would now cost what it did not before.** A keyboard-only ramp makes a key slower to reach
  full deflection than a stick slammed to its gate. Before inertia every device snapped and the
  asymmetry *was* the feature; afterwards it is a device-specific delay on top of a shared one, which
  is the shape `docs/game.md` forbids when it says no device may be faster than another.

**Eight directions is what a binary key is.** A stick and a thumb aim better than a keyboard, which
0032 already called *"correct and not a defect"*.

## What this means for everything after it

**Flight is settled.** `SHIP_SPEED`, `SCROLL_PER_STEP`, `FLIGHT_RESPONSE` and `DRAG_GAIN` all now
have a hand behind them, and content authored from here sits on constants that are not going to move.

That was the entire purpose of building something that could kill the player, and it is done.

⚠️ **One thing named in `ship-speed-settled` is still true and still unaddressed**: every hit in that
session was *contact*, and no enemy shot has ever landed on an attentive player. The bullet half of
the threat model remains unfelt, and it is a **content** question — volume, cadence, placement — for
the first real wave rather than another pass over a constant.
