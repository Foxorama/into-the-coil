# 0366 — An end boss takes its fire with it

**Accepted 2026-09-25.** When an end boss dies, every hostile shot on the field is put out, each with a
one-fragment burst. The mid-boss's death is unchanged.

## The ask

> *"sometimes after you kill the boss on level 4, when the transition to the next level happens,
> there's a bullet wall generated before the boss dies, but it doesn't fire forward. the transition
> then rockets you forward into the stationary wall that didn't disappear on boss death and you just
> can't avoid it"*

## What was happening

A shot's velocity is written in the world when it is thrown, with the camera's scroll folded in at
that moment — [0023](0023-the-long-axis-is-the-scroll-axis.md). The gyre fights in a room
([0335](0335-the-fight-happens-in-a-room.md)) where the camera stands still, so its walls carry no
scroll at all. For as long as the room holds, that is the same thing on screen and in the world.

When the gyre dies with a wall still on the field, the room opens
([0337](0337-the-gyre-falls-out-of-the-wall.md)), the camera moves again and then the burn
([0340](0340-the-coil-is-a-route.md)) multiplies it. A wall standing still in the world is then a
wall coming at the ship at the camera's speed, from ahead, at a rate no dodge was ever sized against.
That is the *"stationary wall"* and the *"rockets you forward"* in one mechanism.

The same holds for anything any end boss leaves in the air when the burn starts. The gyre is the case
that happens, because it is the one whose fire was thrown at a scroll of nothing.

## The rule

**The fight is over, so its fire is too.** `cancelFire` runs on the step the end boss's death is
reported, before the wreck, the clear or anything else: every shot in `enemyShots` is released, and
each one leaves a `BURST.cancelled` fragment where it was.

- **A burst each** because a bullet that vanishes is what [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)
  is named for. **One fragment and not an enemy's eight**, because a wall is forty shots at once and
  the picture should be the fire going out, not a field of deaths. The debris pool is smaller than the
  shot pool, so the tail of a crowded field goes without one; `burst` drops what does not fit, which is
  the pool rule.
- **Not the mid-boss.** The level carries on after it at the rate its fire was thrown at, so nothing
  it left is wrong in the world, and a mid-boss that wiped the field would be a free clear in the middle
  of a level.
- **Not a change to how a shot moves.** Carrying every shot in the camera's frame would also have
  answered this, and would move every bullet in the game on every change of scroll — a far larger
  thing than a fight ending, and not what was asked.

## What is held

`tests/gyre.test.ts` — *a wall still on the field when the gyre dies does not wait for the ship*: a
wall planted across the lane ahead of the ship, standing still in the world, on the step before the
gyre dies, then flown with the ship parked mid-lane until the camera has moved for four seconds. With
the cancel removed, all sixty shots outlived the boss, and in a separate run with that assertion
loosened the ship was hit on 47 steps. Probe: *the end boss's fire left on the field*.

## What is owed

**Whether the fire going out reads.** It is a model fact and has not been photographed or played; a
one-fragment burst on a flak ball is the smallest event the debris makes.

**Live enemies at the end.** A wave body still alive when the end boss dies can go on firing into the
clear. None does on the gyre, whose room holds no waves; if a play reports it elsewhere, it is the same
question asked of the bodies rather than the shots.
