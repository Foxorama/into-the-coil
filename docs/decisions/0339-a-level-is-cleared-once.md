# 0339 — A level is cleared once

**Accepted 2026-09-19.** **Fixes [0335](0335-the-fight-happens-in-a-room.md)** — the room's arming
condition fires repeatedly. **Amends [0062](0062-a-boss-dies-loudly.md)** — `bossBeaten` is no longer
the latch on its own.

## The report

> *"We've somehow lost the ice level, game goes from labyrinth to toxic mire to black heart now, no
> rime shelf."*

⚠️ **THE LEVEL IS NOT MISSING AND `LEVEL_KINDS` IS INTACT.** `batteries`, whose theme is `rime`, is
still fifth. It is **skipped**, and it is skipped by the level counter being advanced twice.

## What was measured

Driven through the real frame: the gyre killed, then the world stepped as `SCREENS.cleared` steps it
while the banner is up.

| step | what happened |
|---|---|
| 295 | `onCleared` — the wreck settles (60), the room opens (90), the beat runs (96) |
| 391 | `onCleared` **again** |
| 487, 583, 679, 775, 871, 967, 1063, 1159 | and again, every 96 steps, for as long as anyone looks |

**Nine clears in twenty seconds.** `mount.ts` dispatches `levelCleared` once per report and the
reducer does `level: state.level + 1`, so the run walks forward one level per extra firing. Only a
boss with a `room` does it — the **gyre**, which is Shoal's — so Shoal hands the run to Gauntlet and
the Rime Shelf is never played.

## The cause: one path arms on an EVENT and the other on a CONDITION

`stepBossDeath` fires `onCleared` when `clearedIn` counts down to zero, and carried the note
*"`bossBeaten` already latched, so this happens once."* ⚠️ **That was true while the only thing that
armed `clearedIn` was the death itself**, which happens once because `bossBeaten` latches.

0335 added a second armer:

```ts
if (w.roomOpen >= room.opens && w.clearedIn <= 0) w.clearedIn = BOSS_DEATH_STEPS;
```

⚠️ **THAT IS A CONDITION, NOT AN EVENT** — *the way out is open and the countdown is not running* — and
it is true again one step after every countdown ends. Nothing about it is wrong except that it has no
latch, and the sentence twenty lines away said a latch was already being kept.

## The fix, and what it is not

**A latch of its own**, `clearedReported`, set where `onCleared` fires and reset beside `clearedIn`'s
own reset at the level boundary.

⚠️ **NOT A RE-ORDERED CONDITION AND NOT A SECOND READING OF `bossBeaten`.** *Has this level been
reported* and *is the boss dead* are two facts. [0334](0334-a-hit-is-an-event-again.md) paid for
storing two meanings on one field eight days ago — `flashFor` was *what is flashing* and *what the arc
has already struck*, and the two agreed until one of them moved. This is the same shape, and the same
answer.

## What the bug was also doing — 0027's question, asked

⚠️ **`levelCleared` ALSO GRANTS EVERY OWNED SPECIAL A CHARGE**: *"gains one per level cleared"*, stated
as a rule about the arsenal. Nine reports is **nine free bomb and shield charges** on top of the
skipped level, every time a room boss died. The skipped level is what was visible; this is what was
not, and it is exactly the second effect
[0027](0027-measure-the-picture-not-the-model.md) says to go looking for.

## A guard was rewritten, and the reason is that it asserted the defect

⚠️ **0337's *the room opens even if the wreck is gone* ENDED WITH `expect(world.clearedIn).toBeGreaterThan(0)`
TWENTY-FIVE SECONDS IN.** That can only be true while a countdown is running — which, with the latch in,
it never is by then. It was passing **because of** the re-arm. What the sentence means is *the level
reported itself cleared*, so it asks the report counter now.
[0192](0192-a-guard-holds-an-invariant.md): change the guard and say why.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0339`:

| broken on purpose | went red |
|---|---|
| the latch dropped from the room's arming condition, so the clear re-arms itself for ever | `THE REPORTED ONE: a boss with a room clears its level exactly once` |
| the report latch kept across a level boundary, so the second level can never be cleared at all | `the NEXT level can still be cleared` |

⚠️ **THE FIRST GUARD'S WINDOW WAS FOUR DEATH-LENGTHS AND THE BUG NEEDS FIVE.** The first `onCleared`
lands at step 295 and the second at 391; four is 384, so the fixture stopped **six steps** short and
reported a green game. It is twelve now.

⚠️ **AND THE SECOND BREAK NEEDED A SECOND GUARD, WHICH THE PROOF FOUND.** A latch that is never let go
is the same defect with its sign flipped — one level ships and the run is sealed in the next — and a
fixture that plays one level is perfectly happy with it. `npm run prove` reported STILL GREEN; the
guard that plays two levels is what answers it.

⚠️ **AND 0062's OWN PROBE WAS RE-ANCHORED**, because the latch's reset sits on the line after the one
it aimed at. Its break is unchanged and it still fires.

## What this deliberately does not do

- **It does not touch 0335's room, 0337's wreck, or the timings of either.** The room opens when it
  opened and the wreck falls as it fell.
- **It does not change what a clear is worth.** The charge grant is 0053's and is correct once.
- **It has not been played.** The measurement is the frame; that the Rime Shelf is reachable again is a
  thing to see on the deployed build.
