# 0618 — The spinners run with the engines

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 4. Amends
[0527](0527-the-wheels-turn.md) and [0557](0557-the-marmot-crackles.md): a rim's wheels run on a clock of their own.

## The ask

> *"spinny wheels should be faster/slower like the thruster when moving"*

## What was true

A spinner turned on the run's clock alone (`wheelTurn(row, i, now)` in `stepWheels`): once round in 0.7 s at the
front and 0.8 s at the back, whatever the stick asked. The flame beside it has three states read off the ask since
[0230](0230-the-ship-flies.md) — a burn past half a push forward, an ease past half a pull back, an idle between —
so under a hard push the flame roared and the wheels did not notice.

## The rule

| | |
|---|---|
| **the state** | `thrustOf(warp, ask)` in `src/app/frame.ts` — the flame's own reading, moved out of `stepExhaust` so the flame and the wheels read one function and cannot disagree |
| **the pace** | `pace` on each rim's `wheel` row, per thrust state (0282: the row authors its own). The spinners: idle 1, burn 2.5, ease 0.35. The lightning: 1 at all three — lightning does not roll |
| **the clock** | `wheelClock` on the world, advanced each step by a step's seconds times `wheelPace`, which closes `WHEEL_PACE_EASE` (a tenth) of its gap to the pace asked for each step. The rim's own `wheelTurn` and `wheelFrame` read that clock where they read the run's |
| **the pad** | unchanged: nothing is asked of a parked car, so it shows the idle pace, which is 0527's |

## Why a clock and not a rate

A turn of `TAU × seconds × pace / turn` jumps the wheel round the moment the pace changes — to where a wheel that had
always run at the new pace would be. Advancing a clock by the pace a step keeps the angle continuous whatever the pace
does, so a wind-up is a wind-up. The probe that turns it back into a rate goes red on the guard's largest step.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): a spinner is inside the car's own outline and moves nothing
else. At 2.5 its front wheel turns 3.6 times a second — 21 steps a turn, slow enough that the four spokes do not alias
into a wheel turning backward at 60 Hz.

## What guards it

`tests/wheels.test.ts`, *0618*: held at each ask for a second after a second to wind, the front spinner goes round
1/0.7 times a second at rest, more than twice that under the burn, less than half under the brake and still forward;
no step turns further than a step at the burn's pace. And every rim that moves authors a pace for all three states.
Probes in `scripts/probes/0618-the-spinners-run-with-the-engines.mjs`, all three seen red. 0527's and 0557's probes on
these lines are re-anchored on the wheels' clock.

## Owed

A play on the Mothership spinners: whether 2.5 and 0.35 are the right ends, and whether the wind-up (a third of a
second) is quick enough. Both are numbers on the rim's row.
