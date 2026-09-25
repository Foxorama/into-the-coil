# 0375 — The bomb is a missile

**Accepted 2026-09-26.**
- The auto-gun's overflow buys the bomb, and the forward missiles' buys the golden surge. The golden
  surge now strengthens the missiles: three times the damage, and piercing like a blade.
- The bomb is drawn as a large forward-firing missile.
- It goes off as a filled explosion in three pictures: the burst, the fire rolling out, the smoke.
  That takes half a second, and its damage still lands on the first step.
- Its launch and its boom are rebuilt around the root of the key.
- A thrown special cannot leave the ship within a third of a second of the last, which keeps
  explosions under 0024's flash cap.

Inserted into the plan
([`the-arsenal-planned`](../../reports/the-arsenal-planned-2026-09-26.md)) on the play of
[0373](0373-a-special-is-the-guns-own.md), ahead of the void.

## The ask

> *"can we also update the default bombs graphics?"*
>
> *"my implementation of this is trash and should have been rejected tbh — having one bomb queue
> means that you might not even have the autofire gun equipped when you try to use that bomb … let's
> make the auto-gun pickup the regular bomb and change the autogun supercharge effect over to the
> regular forward firing missiles"*
>
> *"it should be a large forward firing missile like a h-bomb style thing, not a hand held thrown
> bomb, it doesn't make any sense for it to have the shape it does now. the sound is also pretty bad,
> it's not explosiony and it doesn't gel with the background music at all and it's still just
> basically a yellow circle instead of a large explosion"*
>
> *"why keep the middle open? it just looks like that area should not be affected?"*

## What 0373 got wrong, and what this does and does not fix

0373 wrote down that a surge strengthens whatever weapon is fitted when it goes off, not the one it
was earned from. It recorded that as a property when it was a flaw. With one stack behind one
trigger, an auto-gun surge could be thrown while the ship held the arc and do nothing at all. That
should have been raised before it was built; CLAUDE.md's quality rule is exactly that.

**This change moves the golden surge onto the forward missiles, and that does not remove the flaw.**
A golden surge can still be thrown through seekers. The fix is the rework the plan now queues: the
gun's specials on one trigger and the tubes' on the other, each throwing only its own.

## The rule

- **The swap.** The pulse's row authors `special: 'bomb'`, and the straight tube's authors
  `'overdrive'`. A surge's shape is the tubes alone now, `{ damage, fuse, pierce }`, because no
  surge touches the gun any more. Overdrive is `{ 3, 1, BLADE_EDGE }` and hunt is `{ 4, 2, 1 }`.
  `fireMissiles` gives a missile its `pierce` as health, so `collideInto` lands it as a blade: once
  per flash, one health each time. A piercing missile is not spent by arriving, so it is counted into
  the `hit` cue from the log, as the blades are. Overdrive's face on the trigger is the missile
  pickup's.
- **The missile.** The bomb is drawn along +x like everything that flies: an ogive warhead, a long
  lit casing with two dark bands, four fins (two seen) and a translucent burn behind. Its extent is 9
  where it was 4.4, and its radius follows to 2.5 to stay inside `tests/combat.test.ts`'s band. Its
  face on the readout and the button is its own sprite, so it follows.
- **The explosion is filled.** It was a ring with most of its middle taken out, so that it would not
  *"hide the thing the player is trying to fly away from."* That was never true: `blasts` is the
  first layer drawn, so the ship, every body and every bullet are drawn over it already. A filled
  explosion hides the sky. The hull is the whole disc, and its outline is exactly the damage radius.
  Fire is painted over it in the bright inks (the player's orange, the hazard gold, a white core);
  the flame ink is a deep red that photographed as mud.
- **Three pictures, only for what the player threw.** A thrown bomb's blast carries
  `EXPLOSION_KIND`, lives `EXPLOSION_STEPS` (30), and `stepExplosions` shows `blast`, `blastFire` and
  `blastSmoke` in turn. The pyre keeps its single picture and its 12 steps.
- **The sound, on the root.** The launch was a thump and a whistle rising to the fourth. It is now a
  kick's fast drop onto A, an ignition roar that opens upward, and a thinning burn. The boom was two
  sines gliding from F down to A over most of a second: a pitched line through every note between,
  over a score that holds its own mode. It is now a tenth of a second from A2 onto A1, with A1 and A0
  held under it. The crack, the slam, the three rolls and the debris are kept. Every pitch in both
  cues is the root. **Owed: the player's ear**, on the dashboard's cue buttons.
- **The flash cap.** 0024: *"no more than three general flashes per second,"* safety and not a
  setting. A filled explosion two thirds of the lane across is a general flash, and a stack of charges
  pressed as fast as a thumb goes would set off more. `THROW_GAP_STEPS` is 20. `canThrow` refuses a
  thrown special inside it, and the shell asks before it spends the charge, so a refused press costs
  nothing. A surge and a whirlpool are not flashes and are not held.

## What was photographed

`scripts/shot-sheet.mjs` against the worktree's dev server:
- The first explosion was a brown blob with a beige middle, because the flame ink is too deep under
  alpha. The bright inks replaced it.
- The rim was invisible under the fill, and a rim-last draw then failed 0227's paint-on-hull guard.
  The whole-disc hull fixed both.
- The missile's bands were 1.6px wide at game size, under the 2.5px floor, and its burn reached past
  its box. Both were caught by `tests/accents.test.ts`.

## Confirmed, not assumed

Every probe in `scripts/probes/0375-the-bomb-is-a-missile.mjs` was seen to turn its guard red under
`npm run prove 0375`:

| break | guard |
|---|---|
| the auto-gun overflowing to the golden surge again | the ask's own pairings, as 0375 swapped them |
| the explosion never stepped through its pictures | burns, rolls and smokes |
| the explosion on the pyre's short clock | the same |
| a frame of the explosion drawn off its damage radius | every picture of it is drawn at the radius that does the damage |
| the throw gap never set | never goes off more than three times a second |
| the throw gap never asked | the same |

Moved rather than deleted:
- 0373's two gun-surge probes now break the golden surge on the missiles.
- 0089's boom probe now replaces the new root sines.
- 0234's `bites` line is a `let`, because a piercing missile adds to it.
