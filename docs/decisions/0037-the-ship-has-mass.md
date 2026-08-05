# 0037 — The ship has mass

**Accepted 2026-08-05.** Step 2 of the ordering in
[`reports/drag-feel-2026-08-05.md`](../../reports/drag-feel-2026-08-05.md), released by
[`reports/ship-speed-settled-2026-08-05.md`](../../reports/ship-speed-settled-2026-08-05.md).

**This reverses `src/sim/flight.ts` in as many words.** It used to say:

> *"Response is immediate. No acceleration, no smoothing: velocity is the ask, scaled. That is the
> arcade answer and it is a decision rather than an omission — R-Type and Raiden both move the ship
> the frame the stick does."*

## The rule

**Velocity approaches the ask instead of becoming it**, by a fixed fraction of the remaining gap each
step. `FLIGHT_RESPONSE` is that fraction; `1` is the old behaviour exactly.

Both halves of the feel come from that one number: the ship takes time to get going, and time to
stop. A player calls the first *turbo-lag* and the second *run-on*.

## Why it reverses, and why the reversal is not a change of mind

The arcade answer was correct **given what was known**. What changed is that three devices were
played and a hand separated two things that had been one:

| the difference between | is | which reads as |
|---|---|---|
| keyboard and gamepad | continuity — a stick pushes at any angle, a key at one of eight | *flying* |
| gamepad and touch | **mass** — the lag, the run-on | *flying in a real environment* |

⚠️ **And the mass already existed, on one device, by accident.** `src/app/touch.ts` banks movement a
finger asks for faster than the ship can deliver, so a flick arrives over several steps — which is
what [0032](0032-touch-is-relative-drag-and-not-a-stick.md) built it for, and the lag was a side
effect nobody chose. It was the best thing in the build and it reached exactly one device.

That is the actual argument: **0032's own rule is that a control scheme is a preference and never a
difficulty setting.** A touch player flying something with mass and a keyboard player flying
something without is two games from one build. The feel belongs to the *ship*, so it goes in
`flyShip`, where every device gets it identically.

## What it measures

`npm run trace -- --hold=acrossPlus --ms=250 --after=600`, 1280×720, against the shipped page.

| | `FLIGHT_RESPONSE` 1 (before) | **0.2** |
|---|---|---|
| time moving, same trip | 0.28s | **0.50s** |
| average while moving | 691 px/s | **392 px/s** |
| peak | 12.3 px/frame | 11.9 px/frame — **top speed is still reached** |
| **travel after the key comes up** | **6.8px over 15ms** | **50.8px over 398ms** |

The last row is the whole change. 6.8px over one frame is not a run-on, it is the last step before
the ship stopped dead.

⚠️ **Top speed is unchanged**, so nothing about `SHIP_SPEED` or the dodge ceiling moves — the ship
takes longer to *reach* it and longer to *shed* it. The difficulty a hand had just called *"a good
starting difficulty"* is preserved at the ceiling and softened in the transient, which is what was
wanted.

## The instrument could not see half of it

`scripts/trace-frame.mjs` stopped recording at key-up, which was correct while velocity was the ask:
the ship stopped on the same step and there was nothing after it. **The run-on is half of what mass
is, and it was invisible to the one instrument built to see the picture.** `--after` keeps recording
past the release and reports travel-after-release in pixels and milliseconds.

That is [0027](0027-measure-the-picture-not-the-model.md) applying to the instrument rather than to
the code: a rig that cannot see the quantity being tuned manufactures confidence about the half it
can see.

## `holdStation`, and the hazard that is real

A `reset` ship has zero velocity, which is **not** the same as at rest. From zero it spends about
five steps accelerating up to the scroll rate, and the ground it fails to cover in those steps is
ground it never gets back — velocity converges on the camera's *rate*, not on a *position*. The ship
would appear a couple of units further down-lane than it was placed, at every spawn and every
restart, permanently.

`holdStation(ship, scrollPerStep)` gives that fact a name and one home instead of
`ship.velAlong = SCROLL` copied at each site and omitted at the next.
`tests/interpolation.test.ts` is where it bites: it drifted 15px over ten seconds of
"station-keeping" until the hand-built world called it.

## ⚠️ A no-op that was written, argued for, and reverted

The first version split velocity into `scroll + departure` and lagged only the departure, with a
comment claiming that lagging the whole velocity would make the ship fall behind the camera
permanently, and a test named `THE ONE INERTIA MUST NOT BREAK` guarding the difference.

**There is no difference.** Exponential approach is affine, so `s + lag(v − s → T)` and
`lag(v → s + T)` are the same expression — verified to 4e-16 over a run that accelerates from zero
and releases. The comment was false, the code was two extra locals, and **the test passed under both
forms, which is the definition of proving nothing.**

It was caught by trying to write the probe for it: the break could not be expressed, because the
thing being guarded did not exist. That is worth recording as the mechanism rather than the
embarrassment — [0019](0019-a-probe-must-be-seen-to-apply.md) says a guard must be seen to fail, and
*a break you cannot write* is the same signal arriving one step earlier. The hazard the reasoning was
reaching for was real; it was `holdStation`, one function away.

## Rejected: matching the touch bank's shape

The bank is a **queue** — undelivered movement drains at a constant rate and then stops dead. This is
**mass** — velocity decays, so the ship eases to a halt. A hand liked the queue, so copying it is the
obvious move.

Rejected because they are different things wearing one description. A queue is a *command backlog*:
it belongs to an input device that can ask for more than the ship can do, which is true of a thumb
and false of a key and a stick. Mass is a property of the object. Modelling the ship as a backlog
would give a keyboard a queue it can never fill, and the constant-rate-then-stop-dead profile is
exactly the *"stops the frame the stick does"* character this decision exists to remove.

Named because the two are close enough that the next reader will wonder, and because the measured
numbers differ in the way the argument predicts: the bank ran on 98.5px over 267ms, the ship runs on
50.8px over 398ms — **less distance, longer tail.**

## What this owes, immediately

⚠️ **Touch now has mass twice**, which is exactly what
[`reports/drag-feel-2026-08-05.md`](../../reports/drag-feel-2026-08-05.md) predicted: *"it would
compound with the bank — touch would get inertia twice — so the touch numbers would need re-tuning
downward as part of it."*

`DRAG_GAIN` is step 3 and is now **due**, very likely upward. It is not done here because the numbers
to tune it against come from a thumb on glass, and this build has not been near one. Doing it blind
would be tuning against an argument.

## What this deliberately does not decide

**Keyboard continuity** — ramping the axis so a key can ask for angles between the eight. Independent
of this, keyboard-only, and it blocks nothing.

**Per-ship mass.** `FLIGHT_RESPONSE` is one constant for the one ship. `docs/game.md` lists handling
as an axis a ship *may* differ on and calls it the hardest of the four to make legible; the roster is
a table edit when it arrives, and inventing a per-ship column before there are ships is the shape of
mistake this project has already made once.

**An assist for it.** A more responsive ship is an easier ship, so any knob would have to be monotone
under [0024](0024-the-accessibility-floor-is-settings.md)'s proof. Nobody has asked, and adding a
knob nobody asked for is the failure 0024 names.

---

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0037-inertia.mjs`.

| broken on purpose | went red |
|---|---|
| the response set to 1, which is the arcade answer this decision reverses | `THE ONE: it does not arrive at full speed on the step it is asked` |
| the ship stopped dead the step the ask does, so there is no run-on | `it does not stop on the step the ask does` |
| the response overshooting, so the ship rings instead of settling | `settles rather than oscillating, which is what makes it mass and not a spring` |
| the scroll baseline dropped from the target, so a ship asking for nothing falls off the back | `a ship asking for nothing keeps the scroll rate exactly` |
| `holdStation` leaving a ship at zero velocity, which costs it ground it never recovers | `stays put across many steps, not just within one` |

## What has no guard

**Whether it feels right.** Every assertion above is shape — that the ship ramps, that it does not
ring, that top speed is unchanged, that station-keeping survives. None can see a ship that feels
soggy or one whose lag fights the hand. `FLIGHT_RESPONSE` is a starting point picked to land near a
run-on a hand has already called *"really good"* on another device, and nothing asserts its value.
That is [0027](0027-measure-the-picture-not-the-model.md)'s territory, and it needs the hand.
