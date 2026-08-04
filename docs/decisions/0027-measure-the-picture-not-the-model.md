# 0027 — Measure the picture, not the model

**Accepted 2026-08-04.** The counterweight to
[0025](0025-the-frame-budget-is-counted-not-timed.md). 0025 makes the *model* countable and was right
to; nothing in this repository makes the *picture* checkable, and for this game the picture is the
product.

## The rule

**When a report survives a fix that measured green, stop improving the measurement of the model and
go measure the picture.**

Three clauses, each of which cost the predecessor a documented pass:

- **An eyes-on rig renders at the camera the game actually ships.** A rig honest about the model and
  wrong about the picture is worse than no rig, because it manufactures confidence.
- **When a fix removes a bug, ask what that bug was also doing.** A feature can be working *because*
  of something upstream that is broken.
- **A play-test verdict is data about the picture, not a bug report about the model.** "It doesn't
  feel right" is a measurement, taken with the only instrument that sees the whole pipeline.

## The evidence

The predecessor's ball bounce: eight passes over five weeks, seven of them wrong, **every one
measured green**.

| pass | what it added | dimension | what it measured |
|---|---|---|---|
| 1 | run-out time scale, draw boost | time, height | 87ms/8% → 868ms/31% ✅ |
| 2 | derived apex ratio | height | invisible bounces 18/40 → 4/40 ✅ |
| 3 | self-similar decay | height | invisible 6/40 → 3/40 ✅ |
| 4 | length term, visibility trim | length | planned == seen on all 40 ✅ |
| 5 | camera push-in at landing | scale | 0.33 → 4.90 px/frame ✅ |
| 6 | per-class hop counts | count | 0 of 40 outside the band ✅ |

Every number is real and was reproduced. Every one is a genuine improvement to the bounce **model**.
The report — *"they land and just stick"* — stood through all six.

**Every pass reasoned in the sim's own units.** The rigs measured the plan: how far a hop travels,
how high it peaks, how many there are. The plan was right the whole time. Two faults compounded it:
one rig drew its sheets at a hand-set 4.6 px/yd while the game drew 1.6, and a second printed the
number that explained the whole class of report on every run, where it was read as *"a uniform
stretch (harmless)"*.

The real cause was found by hooking the draw call in a real browser and recording position per frame:

```
3851ms  x=238.3  LIFT= 1.4px   ← touchdown
3901ms  x=226.3  LIFT=14.4px   ← hop 1
4284ms  x=196.2  LIFT= 0.0px   ← …and then motionless for 1.9 seconds
```

The bounces were there, at the sizes the model promised. **The ball never moved forward** — total
screen travel across the whole run-out was 2.6 pixels, so a skip that reads as a skip because it arcs
*forward* was left as a 14px vertical bob in place. And five passes earlier, a real fix to the ball's
arrival speed — wrong by a factor of 42 — had incidentally been the entire reason the bounce looked
good, because a hop's duration is distance ÷ speed.

**Compensating in the wrong dimension always produces a real measured gain.** Height, length, count,
time and scale all got bigger. The missing dimension was travel, and nothing was measuring it.

## Why this is a rule here rather than a story about golf

Because 0025 makes the same trade deliberately, and is right to. Draw calls and allocations are
deterministic and hardware-independent; a millisecond assertion in CI is calibrated against nothing.
That argument holds and is not reopened here.

But it means **every quantity this repository counts is a model quantity.** The budget guard is
satisfied by a scene that blits 500 entities at exactly the right positions and is unreadable to a
human. `tests/camera.test.ts` proves rotation parity in world units. `pool.test.ts` proves the
projection's handedness. None of them can see a hit-flash too short to register, an enemy entering
from off-screen with no lead time, or a bullet the eye loses against the background.

A shooter is *more* exposed than a golf game was. Sprite motion, hit-flash, screen-shake, parallax,
knockback and weapon feel are every one of them picture problems, and every one of them has a
plausible model quantity sitting next to it that will happily go green.

## What is owed, and when

**The frame-tracing instrument: hook the painter, record what was drawn where, per frame, in a real
browser.** The seam already exists — `src/render/surface.ts` is the painter seam, and
`tests/budget.test.ts` already counts through it, which is the same hook pointed at the model half.

It is **not** built in this decision, because there is nothing on screen yet whose motion a human
would argue about. The trigger is named instead of the date: **before the first tuning pass on
anything the player watches move.** Built after the seventh "it doesn't feel right" it is an
autopsy; built before the first it is an instrument.

That is a deferral with a named next step, not a gap — the same shape 0025 used for wiring the loop
into the page.

## Rejected: a numeric "readability" guard

The obvious next step is a threshold — a hit-flash lasts at least N ms, an entity travels at least N
px across its life. Rejected, and specifically because of
[0024's neighbouring failure](0024-the-accessibility-floor-is-settings.md) and the predecessor's
fourth case: **a guard built on an unvalidated threshold defends the bug.** One such test asserted a
drawn ratio stay *below* 0.55 on a guess that a tall hop reads as a pop-up, and for three passes it
made the one constant that would have fixed the complaint unraisable. The refutation was in the data
the whole time — a club drawn at 1.38 was on the play-test's *correct* list.

So a number may become a guard here only once it is traceable to a measurement of something a real
player called right or wrong. Until then the instrument prints it and nothing asserts on it.

## What has no guard, stated rather than assumed

All of it. This is a rule about where to point attention when a specific situation arises, and the
situation — a surviving report after a green fix — is not detectable by a test.

⚠️ **And the evidence is inherited, not ours.** Every number above is the predecessor's. No report of
this class has occurred in this project, because nothing has been tuned yet. What is ours, and what
justifies landing the rule before the failure, is structural and checkable by reading: the guards
this repository has all count model quantities, and the one that would count a picture quantity does
not exist.

---

## Confirmed, not assumed

**Added 2026-08-04**, when the instrument this decision owed was built and found a bug on its first
run. Declared in `scripts/probes/0027-picture.mjs`.

| broken on purpose | went red |
|---|---|
| the camera subtracted at its stepped value while entities interpolate — ~4px of judder on everything | `THE ONE: a ship asking for nothing is drawn in exactly the same place at every alpha` |
| the projection pinned, so a frozen scene satisfies every stability assertion above | `debris left behind DOES move, so this is not passing by drawing nothing` |

⚠️ **The evidence above is no longer inherited.** This file originally closed by flagging that every
number in it was the predecessor's. `reports/camera-judder-2026-08-04.md` is this project's own: a
ship holding station *exactly* in world units drew 4.0px of screen travel per second, every
assertion in the suite was green before the fix and after it, and the instrument reported 0.0px
afterwards. The model was right; only the picture was wrong.

---

## Enforcement

**Added 2026-08-04.** *"What has no guard"* above stands — the trigger for this rule is a human
noticing something, and no test detects that. It does not follow that this rule gets nothing.

[0001](0001-revertability-not-risk-rating.md) hit the identical problem and answered it: *"Prose is
the tier that fails. The question lives in `.github/PULL_REQUEST_TEMPLATE.md` … an affordance at the
point of use, not a rule in a document nobody re-reads."* The same file now carries a second
question, **does this change something the player watches move**, answerable only with pixels from
`npm run trace`.

It is not a guard and is not claimed as one: it can be deleted by the author, exactly like the
rollback note. What it changes is *when* the question gets asked — at the point of writing the
change, rather than after the report that the change did not work. That is the whole gap this
decision names, and the instrument now exists to answer it in one command.

⚠️ **`npm run trace` builds first, deliberately.** `scripts/trace-frame.mjs` traces `dist/index.html`
and exits 2 when it is missing, which is correct but leaves a trap: a stale `dist/` traces the
previous commit's picture and reports it as this one's, with no error anywhere. The npm script
removes the trap by making the build part of the invocation.
