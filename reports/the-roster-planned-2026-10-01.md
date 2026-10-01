# The roster, planned — 2026-10-01

One ask, two changes, landed in order, each from `main` and each played on its own branch preview.
This file holds the plan and the answers the player gave while it was being made. What each change
decided lives in its decision once it lands; this is the queue.

## The ask

> *"ok time to add some new ships, the same overall space needs to be taken up by them in square
> screen space of size, but within that box they can be any shape. We might change this in future as
> well, but for now we'll go with this.*
>
> *Ships from the Far Carry (Golf-Stars) to add — the little green caddie, the firebird, the gilded
> estate.*
>
> *current ship is the default and will be piloted by Huang-woo Hook, with the autofire gun. Little
> green caddie will be piloted by Feather Fade and gets a new weapon, which is a ray gun that fires
> for concentric purple energy rings that explode on impact with as small energy explosion. the
> firebird will be piloted by Backspin Bo and has the shuriken cannon. the gilded estate is piloted by
> Longshot Larry and has the lightning gun. We also need to make the lightning gun have a longer
> initial jump and do just slightly more damage as when we zoomed out the screen we didn't make the
> lightning gun proportionally longer and so we accidentally stealth nerfed it.*
>
> *each pilot has their own ship and a weapon will be keyed to that ship only. the ships need to be
> side view or top down, depending on which looks better as the side scroller and they'll need to have
> weapons equipped to them.*
>
> *each ship will start with max weapons, so we're effectively removing the weapon tier from each
> default weapon and that means we'll need to buff the 1st level miniboss and end boss health a bit to
> account for the upgraded weapons the player has at that level.*
>
> *missiles have no change currently, a player doesn't start with any and will still need to get those
> pickups.*
>
> *the floating pickups will be: for missiles -> no change; for shields -> instead of void bombs at
> shield cap, the void bomb will be on rotation with the shield on that pickup so a player can choose
> to pick up a void bomb or a shield. the void bomb will need to have it's own unique button as well
> because it can be used strategically to avoid enemy fire etc. weapon pickups will instead be bomb
> pickups. a game starts with two bombs and we'll remove the first weapon pick up from each level so
> that the player doesn't end up with too many bombs. the pickup will still cycle, but a player can
> pick up any type and get a bomb of that type.*
>
> *in Burn difficulty, when a miniboss dies it'll spit out a void bomb pickup in place of the shield
> pickup that we removed to give them some measure of strategy against the bullet hell of that level.
> let's also let them start with 1 void bomb as well.*
>
> *the void bomb also needs updated graphics to make it look cooler, some kind of animation and
> swirl.*
>
> *when adding all the new stuff, after creating it, review it as if you were a senior designer to
> make sure it aesthetically fits the game, looks good and fits properly."*

## What was already true

- **The hull is drawn from above**, not in side profile, whatever `SpriteView`'s name says:
  `src/render/bake.ts` mirrors one wing across the centreline. All three *Far Carry* ships have
  top-down art in the predecessor (`C:\Golf-Stars\src\render\shipTopArt.ts`), so top-down is the
  answer to *"side view or top down"*, and it is the one the fighter already flies in.
- **The lightning was nerfed by 0364**, which took `ACROSS_SPAN` from 100 to 120 and scaled
  everything the player watches except the arc's `reach` — the decision never mentions it. Its
  ratio is 1.2.
- **A run already starts with two bombs** (`startingArsenal`), and the missile ladder already starts
  at no tubes.
- **The dial's only consumer is the one-hit opening rule** (`singleHitOnly`), which exists because
  the opening gun was weak.
- **The mid-boss health solver already reads the loadout the run carries in** (`carriedAt` in
  `scripts/weigh-fight.mjs`), so the level-one buff is a re-solve, not a guess; the serpent is
  weighed by `scripts/weigh-boss.mjs` at the tier it is met at.

## The answers

| question | answer |
|---|---|
| what is the ray gun's special? | the **nova ring**: a huge purple ring bursting out from the ship across the screen, popping what it passes |
| — and since it pops bullets? | *"at burn difficulty seems like it's going to be the default choice if it pops bullets. It should probably share the shield/void cycle instead of the regular weapon cycle"* — so it is a defensive special, cycled with the shield and the void, thrown on the void's button |
| who starts with a void? | Burn only — *"and if the player starts as feather with the nova ring that pops bullets, they don't get a bonus void bomb on top"* |
| which key throws the void? | E and X; the third face button; a third touch band |
| the level-one one-hit rule? | deleted; the dial counts levels only |

## Read, and decided without asking

- **One box for every ship.** *"The same overall space … in square screen space"* is the default
  fighter's capped box, 9.4 units square, and every ship is drawn to fill it; the hurtbox stays the
  fighter's for all four, so no ship is easier to hit or to thread.
- **A shield taken at a full shell still becomes a void**, as it does today — the cycle is the
  choice, and a shield face taken with nowhere to go should not be a dead pickup.
- **A bomb pickup is one charge of the face taken**, whichever ship takes it; a ship opens with two
  of its own gun's special — the fighter two bombs, the estate two storms, the Firebird two
  whirlpools, and the caddie two novas on the third button.
- **The missiles still show on the hull.** Each ship is drawn at no tubes, one and two, so
  *"every upgrade changes how the ship looks"* survives the guns no longer having tiers.
- **Every special can be thrown from every ship.** None reads the gun that is fitted.

## The queue

1. **The roster** — four ships, each keyed to its pilot and its gun at the top of its ladder; the
   ray gun; the three *Far Carry* hulls drawn top-down in the one box, wearing their tubes, in the
   port, the finale, the title sky and the lives readout; the weapon pickup becomes the bomb pickup,
   cycling the gun specials, and each level loses its first; the arc's first jump × 1.2 and a little
   more damage; the dial counts levels only; the level-one mid-boss and serpent re-solved against the
   capped guns. One PR, because the ray gun alone would need a ladder this PR deletes.
2. **The defensive trigger** — a third button for the void and the nova; the shield pickup cycles
   shield, void and nova; on Burn the mid-boss throws a void/nova pickup where the shield was, and a
   run opens with one void unless it is the caddie's; the nova ring itself; the void redrawn with a
   swirl and an animation.

A senior-design pass is owed on each before it is handed over: the art photographed at the
camera the game ships, against every place's palette, beside the enemies it shares the screen with.

## Owed

- A play of each on its branch preview, before the next is built.
- The ray gun's and the nova's sounds, and the ear on them.
