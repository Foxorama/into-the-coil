# The wake played — 2026-09-08

The first play of [0281](../docs/decisions/0281-a-boss-guards-its-own-back.md) on the deployed
branch preview, given the same day it landed. Recorded in full, because the decision that answers it
is written against it — [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) — and
because the second half of it is not about the wake at all.

## What was said

> *"ehhh so much for good quality...."*
>
> *"that boss guarding it's back is problematic for a bunch of reasons"*
>
> *"it starts just firing from the screen before the boss even shows up"*
>
> *"it fires from a fixed point on the screen"*
>
> *"it's boss graphic style specific but otherwise it's just a spray of bullets behind the boss and
> it's the exact same spray for each boss and it also stops when the boss changes phases."*
>
> *"it's not at all what I thought we were implementing and it's the same ongoing issue in this
> project which is that this project continually treats each and every object as the same thing."*
>
> - *"level music can't be different or breaks a different music level"*
> - *"animation can't be done"*
> - *"attacks for the bosses are basically all exactly the same except for the very few I've called
>   out specifically."*
>
> *"which is frustrating because there's about 200+ different things to work on and improve and it's
> going to take forever because the established pattern of good quality doesn't exist."*
>
> *"why would you implement the exact same bad wake pattern for each boss, why would it fire from a
> fixed point on screen when a boss isn't even visible?"*

## ⚠️ Every one of the four is reproducible from the shipped source, and each has one cause

**Read off `main` at `a5daa7e`, not inferred from the report.**

### 1. It fires from a fixed point on the screen, before the boss is there

`src/app/boss.ts`, `throwTail`:

```
const limit = cameraAlong + PLAYER_LEAD - TAIL_STANDOFF;
const along = tail < limit ? tail : limit;
```

A boss is spawned at the leading edge (`spawnBoss`, `src/app/frame.ts`) and closes on its station at
`APPROACH_PER_STEP` — 0.45 units a step, which 0040 gives seven seconds of quiet for *so that the
arrival is something the player watches happen*. For the whole of that arrival `tail` is far up-lane,
so **the clamp binds and the wake is laid at a fixed distance from the CAMERA**, with no hull
attached to it.

⚠️ **THE STANDOFF WAS MEASURED WITH THE BOSS PARKED ON STATION AND APPLIED TO EVERY STEP OF THE
FIGHT.** That is [0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md)'s second
rule — *a quantity is checked in the case it is being applied to* — broken on a number that
**chose** an option rather than rejected one, in the one case that was never flown. 0281's guard
parks a ship at the wall and measures a fight already on station; **the arrival is not in it.**

### 2. It is the same spray on every boss

True, and deliberate. 0281's own words: *"It is not an attack arm and no row authors it: a hull that
is fighting has a wake."* Seven shots, 137°, one sweep, one speed, one cadence — fourteen hulls, one
mark.

### 3. It stops when the fight escalates

Two silent stops, both built in 0281 and neither said out loud on screen:

| | |
|---|---|
| `TAIL_YIELD` | the wake is skipped whenever more than 80 hostile shots are alive — which is exactly the later phases, so it stops *as the fight gets harder* |
| the `bare` gate | 0150's eye window stops the wake too, so it dies at the moment the fight opens up |

### 4. It is a spray of bullets behind the boss

Yes. It is the row's own bullet, slowed and fused. 0281's *what is owed* said so — *"that is legible
and it is not a wake"* — and shipped it anyway.

## ⚠️ And the half that is not about the wake

*"This project continually treats each and every object as the same thing."*

**The three examples given are three different subsystems**, which is what makes it a pattern rather
than three bugs. It is the finding this report exists for, and it is answered in a decision of its
own rather than here — [0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md).
