# 0373 — A special is the gun's own

**Accepted 2026-09-26.** A full ladder buys its own face's special, not a generic bomb. The arsenal
is a stack of charges that every trigger throws newest-first. Two new specials are surges: timed
auras that make one of the ship's weapons stronger while they last. The pulse's is **overdrive**:
three times the damage, and each shot pierces like a blade. The seeker's is **hunt**: missiles do
four times the damage and seekers burn twice as long. The straight tube's is the bomb.

This is the second of four changes on one ask:
[`the-arsenal-planned`](../../reports/the-arsenal-planned-2026-09-26.md).
[0372](0372-a-death-keeps-the-ladders.md) was the first.

## The ask

> *"4.3 if you're at max power ups and you collect up a power up of the same type it increases your
> bomb count for that weapon/missile type"*
>
> *"5.1 forward missiles - give you a bomb like the current bomb"*
> *"5.2 homing missiles - gives the ship a glowing purple aura and supercharges the homing missiles
> for 10secs. They travel twice as far and do 4x as much damage as they currently do"*
> *"5.3 auto-gun - supercharges the auto-gun, gives the ship a golden aura and the auto-guns damage
> is increased by 3x and bullets penetrate like shurikens"*
>
> *"one trigger, fires the charges in descending order earnt from most recent pickup"*

## The rule

**Every weapon row and every missile row authors `special`**: pulse `overdrive`, seekers `hunt`,
straight missiles `bomb`. The arc and the shuriken author `bomb` until their own specials land,
which is the next change, and each row says so. `overflowOf` in `src/content/pickups.ts` reads the
face's row. An overflow only happens on a face that matches what is fitted (`effectOf`), so the
face's row and the fitted row are the same.

**`run.arsenal` is a stack of `SpecialKind`, one entry per press.**
- `took` pushes the row's `charges` onto the top.
- `spent` takes the top and nothing else.
- `startingArsenal()` is the bomb's two.
- `ArsenalEntry` is gone. Its one-entry-per-kind shape existed so that a trigger could be a position
  in the list, and there is one trigger now.

There is no save layer yet, so the shape changes with no migration and nothing irreversible.

**Every trigger throws the top.** `onSpecial` ignores the slot. The touch strip listens on one band
and draws one button, showing the face of the next charge and the count of the whole stack. The
readout does the same: its icon is swapped when the top changes kind, and its label reads
*"2 charges, next Bomb"*. `mines` is deleted from the specials. Nothing ever fired it; it only
existed so the arsenal could be shown holding two different things.

**A special is exactly one of two shapes**, and a guard holds that every row is one:
- **thrown**: a `shot` that `becomes` a blast;
- **worn**: a `surge`, which is `{ steps, aura, gun, tubes }`.

A surge throws nothing.
- **The timer.** `launchSpecial` starts it, and a second surge replaces the first.
- **The aura.** `stepSurge` keeps it on the ship, in a pool of one. It blinks for its last second
  and a half, twelve steps on and twelve off (2.5 Hz, under 0024's flash cap), so the end is seen
  coming. It is a faint halo with a translucent rim, **drawn under every shot**. The first bake was a
  solid twelve-unit disc drawn over the enemy fire: the rim had been laid on the path the glow left
  open. `scripts/shot-sheet.mjs` caught it before anything was played, and a guard and a probe now
  hold the order.
- **The effects.** They are applied where the shots are made:
  - `firePulse` multiplies a pulse's damage by `gun.damage` and gives it `gun.pierce` health.
    `collideInto` then lands it as it lands a blade: once per flash, one health per landing.
  - `fireMissiles` multiplies a missile's damage by `tubes.damage` and its fuse by `tubes.fuse`. A
    seeker flies until its fuse is out (0246), so twice the fuse is twice as far. A straight
    missile's fuse is zero, so it takes only the damage.
- **What a surge strengthens is the WEAPON, not its source.** A hunt taken and then a straight tube
  picked up still multiplies the straight missiles' damage.
- **It ends with the ship.** `stepSurge` stops it at the wreck, and `respawn` clears it.

**A piercing pulse logs its hits as a blade does.** The `hit` cue is counted from the shot pool
shrinking, and a shot that is not spent never shrinks it.

## Numbers that were not asked for

- **Overdrive lasts ten seconds.** 5.3 names no length; 5.2's ten seconds is the default until it is
  played.
- **A surge is one charge per overflow; a bomb stays two.** The bomb's two is 0053's and 0082's. A
  ten-second surge is a bigger thing to hand out twice.
- **Pierce is `BLADE_EDGE`, twelve landings**, which is what *"like shurikens"* means in this code.

## What it costs

- **A surge sounds like a shield.** It uses the `shield` cue, the other effect that appears around
  the ship. A cue of its own is made by ear, and that was not asked for here. **Owed.**
- **The entity budget is full at 560, so the aura's one slot comes from the pickups.** That pool
  was raised from eight to twelve for 0066's scatter, which 0372 deleted. It is eleven now; a level
  authors four at most and the mid-boss throws three.
- **Hunt puts back what 0246 took away, for ten seconds.** Seekers burning twice as long is more of
  them in the air, which is the *"15-20 on screen"* report 0246 answered. The surge's length is what
  bounds it.
- **A piercing pulse can skip a second body it reaches within four steps of the first.** The gate
  that stops it landing twice is kept per shot, not per body, exactly as a blade's is. That is
  *"like shurikens"*, and it is flagged here in case play says otherwise.
- **Nothing drives the shell's `onSpecial` reading the top.** The reducer's order is guarded; the
  one line in `src/app/mount.ts` that reads `arsenal[length - 1]` is not, because no unit test
  reaches the shell without a DOM.

## Confirmed, not assumed

Every probe in `scripts/probes/0373-a-special-is-the-guns-own.mjs` was seen to turn its guard red
under `npm run prove 0373`:

| break | guard |
|---|---|
| every overflow a bomb again | THE ASK: every gun and every tube stocks its row's special |
| the stack spent from the bottom | THE REPORTED ONE: the trigger throws the newest first |
| a surge sent down the thrown path | a surge throws nothing at all |
| the gun surge multiplies nothing | a pulse fired in the surge carries the row's damage and pierce |
| the gun surge never pierces | and a pierced body does not spend the shot |
| the tube surge multiplies nothing | a missile launched in the surge carries the row's damage and fuse |
| the tube surge leaves the fuse alone | the same |
| the aura never put on the ship | its aura is on the ship for as long as it lasts |
| the aura never blinks | … blinks at the end |
| the aura drawn over the shots | and is drawn under every shot |
| a surge outlives the ship | and it goes with the ship that wore it |

Re-aimed rather than deleted:
- 0053's *an empty special dropped* has no entries to drop from a stack. It now breaks the floor: a
  press on an empty stack that rebuilds the run.
- 0060's *a button per binding* is now *a button per charge*.

Re-anchored where the lines they hang on moved: 0050, 0229, 0230 and 0355.
