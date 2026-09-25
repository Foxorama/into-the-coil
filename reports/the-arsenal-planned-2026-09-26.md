# The arsenal, planned — 2026-09-26

One ask, four changes, landed in order, each from `main` and each played on its own branch preview.
This file holds the plan and the answers the player gave while it was being made. What each change
decided lives in its decision once it lands; this is the queue.

## The ask

> *"ok need to change the way power ups and weapons work, we can probably put a few of these in one PR*
>
> *1. you don't lose power ups on death or continue, you keep the level you had.*
> *2. lightning needs to do a bit more damage on bosses, it's currently too slow and the other two
> weapons are a fun damage level at the moment.*
> *3. remove the bomb power up*
> *4. when collecting a powerup, it now does the following*
> *4.1 increases your weapon/missile tier if not at max tier*
> *4.2 changes your weapon/missiles to the power up type if it's different to your current weapon/missile*
> *4.3 if you're at max power ups and you collect up a power up of the same type it increases your
> bomb count for that weapon/missile type*
> *5. add new 'bomb' types … they'll all have their own unique effects.*
> *5.1 forward missiles - give you a bomb like the current bomb (also increase it's damage so it does
> 5% of max boss health damage*
> *5.2 homing missiles - gives the ship a glowing purple aura and supercharges the homing missiles for
> 10secs. They travel twice as far and do 4x as much damage as they currently do*
> *5.3 auto-gun - supercharges the auto-gun, gives the ship a golden aura and the auto-guns damage is
> increased by 3x and bullets penetrate like shurikens*
> *5.4 lightning-gun - fires a glowing lightning flickering projectile forward that explodes into a
> massive lightning blast that sends lightning flickering all across the screen and chains twice for
> each hit*
> *5.5 shuriken cannon - fires a huge shuriken in a whirlpool shape that gets progressively bigger,
> the radius needs to be large enough that it lasts until every part of the whirlpool arc will no
> longer be on screen, it can hit bosses multiple times as it whirlpools around*
> *5.6 shields - if you cap shields, you get a void missile -> it flies forward and creates a massive
> void zone that negates everything but your ship and bosses (does 10% max boss health damage) will
> also negate bullets and chunks of the labyrinth wall, basically everything, lasers fired by enemies
> will disappear into etc."*

## What was already true

**4.1 and 4.2 are the game since [0256](../docs/decisions/0256-a-pickup-keeps-the-count.md)**: a
pickup of another kind switches and climbs the same ladder, and at a full ladder it only switches.
What is new in 4 is 4.3's *for that weapon/missile type* — the overflow is a bomb for every kind.

## The answers

| question | answer |
|---|---|
| with six kinds of charge, what does the trigger fire? | *"one trigger, fires the charges in descending order earnt from most recent pickup"* — a stack, newest first; both keys fire it |
| what does a continue do to the charges? | *"keep them all, remove the level clear of +1, it should be more than balanced by the fact that you're keeping them all on continues"* |
| how does the void treat Labyrinth stone? | carve it permanently |
| one PR or several? | four, in the order below |
| the arc at 1.5 kills the serpent under its floor at the tier a player can carry there | the serpent authors the arc at 1 on its own row |

## The queue

1. **The rules** — [0372](../docs/decisions/0372-a-death-keeps-the-ladders.md). Items 1, 2, 3 and
   5.1's damage.
2. **The typed arsenal** — item 4.3 and the trigger answer above; the run starts with two forward
   bombs. The homing supercharge (5.2) and the auto-gun supercharge (5.3) land with it, on one timed
   aura mechanism whose colour, length and effects are each row's. 5.3 names no length; ten seconds,
   5.2's, is the default until played. A kind whose special has not landed yet overflows to a
   forward bomb, and says so on its row.
3. **The lightning blast (5.4) and the whirlpool (5.5).**
   - The lightning's flicker sits under the flash-intensity cap
     ([0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md)): many thin bolts, never
     a full-screen luminance change.
   - The whirlpool is blade sprites on expanding spiral arms, not one screen-sized bitmap
     ([0022](../docs/decisions/0022-frame-rate-is-a-feature.md)).
   - Neither item names a damage figure, so both are measured with `scripts/weigh-boss.mjs` before a
     number is chosen.
4. **The void missile (5.6)** — a shield taken at the tier's `shellCap`. On Legendary almost every
   shield is one; on Burn there are no shields and so no void. The zone negates everything but the
   ship and the boss — enemies, shots, the serpent's lightning columns — lands a tenth of a boss, and
   carves the stone it covers for good.

## Owed

- A play of each on its branch preview, before the next is built.
- 4.3's *"max power ups"* read as per ladder, as the overflow always has been; flagged in case it
  meant both ladders full.
