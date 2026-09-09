# 0293 — A pickup floats

**Accepted 2026-09-09**, from the overnight queue —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"The floating powerups — I wasn't clear enough in my original prompt, I wanted them to float
> around the screen and bounce randomly when hitting the edge of the screen. What we've got in game
> is random speed and direction weirdly on the power ups and makes picking them up feel really weird
> and wonky."*

**Replaces the motion in [0077](0077-a-pickup-arrives-rather-than-stopping.md),
[0087](0087-a-pickup-never-parks.md) and [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md).**
Every rule those three made about *where* a pickup may be still holds.

## The rule

**A waiting pickup floats: one speed, one heading, and it turns only where it hits a wall.**

## ⚠️ Three motions pretending to be one, and each of them was right

The along axis eased `velAlong` toward

    scrollPerStep + spin × PICKUP_WANDER + PICKUP_BOB_SPEED × sin(cameraAlong / PICKUP_BOB_UNITS)

— a wander whose heading flipped at soft walls (0233), **plus** a sine on a fourteen-unit period
(0087), **plus** a first-order lag at 0.06 that caught neither (0077). Meanwhile `across` ran a flat
constant that reflected off the lane.

⚠️ **SO THE TWO AXES OBEYED DIFFERENT LAWS AND THE ALONG SPEED WAS NEVER STEADY FOR TWO FRAMES.**
That is what *"random speed and direction weirdly"* describes, and it is why the report says *"I
wasn't clear enough in my original prompt"* rather than *this is broken*: *nothing here was built
wrong.* Each of the three was added for a real reported defect and each is correct on its own. **The
sum was not a thing that reads as an object**, and no guard could see that because every guard was
written about one of the three.

⚠️ **THE ANSWER IS MOSTLY DELETION.** `PICKUP_WANDER`, `PICKUP_BOB_SPEED` and `PICKUP_BOB_UNITS` are
gone. What is left is a velocity with a magnitude of `PICKUP_FLOAT` and a heading that changes only
at a wall.

## ⚠️ What this gives up, stated rather than buried

0087 bought a real affordance and this spends it. **A player who did nothing had the pickup delivered
to their own `along`** — `PICKUP_SLOW_AT` was derived so that a pickup nobody touches arrives at the
ship's place on the step its wait ends, and that decision's own note calls it *"one axis of the
decision made easier"*.

⚠️ **A FLOATING PICKUP GOES WHERE IT IS GOING.** Standing still no longer brings it to you. What
survives is the thing that matters more: **it is always inside the box the ship can fly in**, because
the walls are `PLAYER_ALONG_MARGIN` to `PLAYER_LEAD` and the lane — never the screen's edge, which is
[0100](0100-a-level-places-its-pickups-too.md)'s report about a power-up *"visible but the player
cannot get to them"*.

That is the trade the report asked for, and it is the one thing here worth a second opinion after a
play.

## ⚠️ The handover is where the old wall came back, and a guard caught it

A pickup arrives crossing the screen at the camera's whole rate and has to end at a third of it.
Setting that in one step is a change of about **0.6 units on one frame** — and `tests/pickups.test.ts`
calls that an impact, correctly: it is 0077's own reported defect (*"power ups hit a wall when they
get to the centre of the screen"*) rebuilt by the decision that was removing it.

⚠️ **SO THE HEADING IS EXACT AND ONLY THE SPEED LAGS.** The direction a pickup arrives on is the
direction it floats on; `PICKUP_EASE` bleeds the excess away over about three quarters of a second.
**A bounce changes direction and not speed**, so the wall never goes through that path at all.

⚠️ **AND `spin` IS *HAS IT ARRIVED*, WHICH IT ALREADY MEANT.** Arrival happens once, so a floating
pickup that drifts back above `PICKUP_SLOW_AT` cannot be taken by the approach branch again.

⚠️ **THAT LATCH IS DEFENCE AND NOT A CLAIM, AND THE HARNESS IS WHY IT IS SAID THAT WAY.** It was added
against a real 182-unit overshoot — a floating pickup dragged past `PLAYER_LEAD` and out of reach —
**but that overshoot belonged to a draft that no longer exists**, one where the approach eased onto the
float's own speed and so crossed the view three times slower. The shipped approach eases to the
camera's rate and nothing in the fixture reaches the band any more: the probe that removed the latch
came back **STILL GREEN**. A scattered piece thrown up-lane could still get there, so the latch stays —
but nothing measures it, and writing a probe that reddened something else in order to have one would be
0019's failure wearing a tick.

## ⚠️ *Randomly* is the word in the report, and without it a bounce is a loop

Two parallel walls reflect a straight line onto itself. A pickup that entered flat would run one lane
for its whole wait, and two that entered together would stay in step for ever. Each bounce turns the
outgoing heading by up to `PICKUP_BOUNCE_KICK` — about ten degrees, from its own named stream (0021).

⚠️ **AND A KICK THAT POINTS BACK INTO THE WALL IS REFUSED.** Without that a pickup rolled the wrong
way in a corner sticks to it: the reflection fires every step and the roll keeps undoing it, which is
a pickup vibrating on a line — the exact reading this decision exists to remove.

## What is held, and where

| Claim | Where |
|---|---|
| it turns where it hits a wall and nowhere else | `tests/pickups.test.ts`, driven — replaces the bob's rhythm |
| it never stops dead | `tests/pickups.test.ts`, on the SPEED rather than the along rate |
| it stops running away, and stays on screen for seconds | `tests/pickups.test.ts`, 0064's, unchanged |
| it waits somewhere the ship can actually fly to | `tests/pickups.test.ts`, 0087's, unchanged |

⚠️ **THE *never stops dead* GUARD NOW MEASURES SPEED, AND THE OLD READING WOULD FAIL ON THE FEATURE.**
It watched the along rate alone, so a reflection off a wall looked like an impact at 0.46 units a step
and a pickup crossing the lane sideways looked *stopped*. What the claim always was is *it does not
arrive in one step* — a statement about how fast, not about which way — so `Math.hypot` holds the
walls harmless by construction rather than by an exception.

## ⚠️ Seven probes across five decisions, and two of them guarded a mechanism that is gone

`npm run check` refused the tree until every one was re-aimed. Five re-anchored onto the float. The
two that restored **bob** bugs — 0087's phase-off-a-drifting-field and 0234's bob-authored-as-a-shiver
— had nothing left to restore.

⚠️ **BOTH WERE RE-AIMED AT THE THING THAT REPLACED WHAT THEY WERE ABOUT, NOT DELETED.** The bob existed
to stop a waiting pickup holding one line; the float's answer to that problem is the bounce kick, and
0234's ceiling — *a pickup that turns every few steps is a shiver* — is still exactly what must not
happen and can still happen, if the walls are close enough together. Same claims, this decision's
mechanism.

⚠️ **AND ONE RE-AIMED PROBE CAME BACK `WRONG TEST`.** Deleting the `floatAt` call reddened *and it
never stops dead* before the guard it named, because the wall bounce then snapped a 0.9-unit approach
to 0.28 on one frame. **A probe that reddens two guards has not shown which one holds what** — so the
break is the float's speed instead, which touches nothing else.
