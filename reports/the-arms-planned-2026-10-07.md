# The arms, planned — 2026-10-07

One ask, three changes, landed in order, each from `main`. This file holds the plan and the answers the
player gave while it was being made. What each change decided lives in its decision once it lands;
this is the queue.

## The ask

> *"Special weapon changes*
>
> *the Cockpit has special, missile, guard -> but the gamepad buttons are guard, special, missile ->
> it's weird and awkward that the display in game doesn't match the 3 buttons on the gamepad*
>
> *gameplay changes*
>
> - *no special hurts the player - lets make them all consistent*
> - *let's add the missile tubes are puchasable items from Cosmo's*
>   - *you can buy 1-2 of both homing and regular missiles and equip them how you want on a ship -> 1
>     homing, 1 regular, 2 homing, 2 regular etc*
> - *let's remove the missile upgrades, you either have full tier missiles or you don't.*
> - *if a player hasn't bought the missile tubes, then they need to collect the missile powerups in
>   game - the first two missile powerups lock in their tubes. any following missile powerups give
>   them the supercharge missile ability (the current in game one that already works)*
>
> *Specials and pickups*
>
> - *change all the ingame pickups to be a random pickup that doesn't rotate. The pickup spawns with a
>   random powerup that can be a shield/missile or special weapon. It doesn't rotate and can be picked
>   up as is*
>   - *burn doesn't get shields still*
>
> *Minibosses - cut 5 secs from the dead time after the miniboss, part of the time was to allow the
> player to let the pickups rotate, but if they don't rotate any more it's going to be solid dead time
> now that will feel weird."*

## The answers

| question | answer |
|---|---|
| How is a pickup's face drawn? | **A category first — shield-side, missile or gun special — then a face inside it; the mid-boss's three drops are always one of each category**, the face inside each drawn |
| What does a tube cost at Cosmo's? | **500 Star Shards each**, up to two straight and two homing |
| The window's 180 units | **The level is five seconds shorter**: everything past the window, end boss included, moves 180 units earlier |
| The ray's burst, a gun's, also hurt its ship | **"Yes, nothing of mine hurts me"** |

## The queue

### 1. Nothing of mine hurts me, and the strip stands as the pad does — [0574](../docs/decisions/0574-nothing-of-mine-hurts-me.md)

The player's blasts are paired with the ship no longer; the strip stands guard, special, missile.

### 2. A pickup is what it shows, and the window is twenty seconds

- **No pickup turns.** Each is spawned on one face, drawn on a stream of its own (0021), and keeps it.
- **The draw**: a category with a third each — the shield side (the plate, the void, the nova), the
  tubes (straight, homing), the gun specials (every `BOMB_KINDS` face) — then a face inside it with
  equal odds. **On Burn the shield side draws the void or the nova only** (*"burn doesn't get shields
  still"*), as the ward pickup is today.
- **Every pickup draws**: the level's authored slots and the mid-boss's three. The mid-boss's three are
  one of each category, faces drawn, so a fight's reward is never three of a kind.
- **A pickup waits** `PICKUP_LINGER_STEPS` (ten seconds) — the floor the cycle's repeats sat on.
- **How to play's key** shows every face standing still, each with its line.
- **The window is twenty seconds on every row**, and every level's script past it — the waves and the
  end boss — moves 180 units earlier; music boundaries authored past it move with it.
- Owed beside it: whether the mid-boss healths solved for 21–23 seconds want re-solving now that adds
  arrive at twenty. Measured before deciding, not assumed.

### 3. The tubes are bought, fitted and full

- **A ship has two tube slots**, each empty, straight or homing. A filled tube fires at the old ladder's
  top rate; **there is no ladder**. Two tubes of different kinds each fire their own missile.
- **Cosmo's sells tubes**: a first and a second straight, a first and a second homing, 500 each, the
  second of a kind on sale once the first is owned. Owned tubes are fitted per ship in the hangar, at
  most as many of a kind as are owned, on any ship.
- **A run opens with the fitted tubes.** A missile pickup fills the first empty slot with the kind its
  face shows; with no slot empty it is a charge of that kind's surge — overdrive or hunt — as a full
  ladder's pickup is today.
- **Kept across deaths** (0372) and gone at the run's end, as now.
- **The save**: new fields on `itc_hangar` version 1, a rollback note on the PR.
- The hull is drawn by tube count as now (`hullFor`); each tube's missile is its own kind's.
