# 0617 — The dance burns, and a body knocks half as far

**Accepted 2026-10-18.** From a play of [0615](0615-the-ball-is-solid.md). **Amends 0615**: the knock off a body
that is not a boss or a mid-boss is half as far, and the War Dance's speed is its own. **Amends
[0609](0609-the-ball-takes-its-knocks.md)**: the ram's boss weight is 1.9, where it was 1.6.

## The ask

> *"hamster is much much better, kickback needs to be about half way it is on non-boss and non-miniboss enemies
> the speed of the flight of the wardance also needs some tweaking, it's too linear and the curve back to the
> boss isn't quite correct, if it's doing an abrupt turn back to the boss or monsters (or abrupt bounce back) it
> needs thrusters hard firing and a 'stop, speed, burn' type approach. The bouncing and direction are good now,
> but it being all the same consistent speed still makes it feel weird. It needs just a shade more damage
> against bosses as well for the base hamster ball damage, it's very close to where it needs to be, but i just
> slightly too slow."*

## The rule

| | |
|---|---|
| **the knock off a body** | `bodyKnock: 0.7` on the ram row: `knockRam` takes that share of `knock` and `give` when the deepest body was one of the enemies, and the whole of both off the boss's hull or body |
| **the dance's speed** | `danceSpeed` on the world, its own from the throw. `steerDance`: with its target more than `turnAt` (0.6 rad) off its nose it brakes by `brake` (1) a step to `slow` (1.2); inside that, it burns by `burn` (0.28) to `top` (5.4); past `top` off a bumper, or with nothing to dance at, it eases back by `ease` (0.06) of the gap |
| **the swing** | `pullDance` turns `pull` a step at `speed` and `pull × speed / danceSpeed` slower, so a braked dance swings round on the spot where a fast one arcs — a third of a radian a step at `slow` |
| **the bumper** | throws it at `kick` (1.5) times the speed it came at, up to `thrown` (6.8), past the burn's `top` |
| **the flame** | `plumeDance`: through a hard turn a retro-flame out of its front, and while it speeds up a jet out of its back — two embers a step fanned either side, and a puff of flame at the nozzle every fourth step |
| **the far side** | a dance found past a body's centre is put out on the side it was on the step before, not the side it is on now |
| **the ram on a boss** | `bossWeight: 1.9` on the ram row |

## Why it is built the way it is

### Half the distance, which is seven tenths of the speed

The knock is a speed and the player sees a distance. With the stick held into the body, half the speed came back
2.9 px against the boss's 12.8 — a quarter — because the stick wins sooner off a slower knock. Measured the way the
guard flies it, at 0.7 the ball comes back 6.4 px off a drifter and 14.7 off the Approach's end boss: 43%, the
ask's half. Let go of the stick, it is seven tenths as far.

### Stop, swing, burn — and the brake measured in what it costs

*"The curve back to the boss isn't quite correct."* At one speed and one turn rate, a dance thrown off the boss
went back down the lane on a circle 28 units in radius before it came at the boss again. Now the turn it needs decides
what it does: a target off its nose is a stop and a swing, and one ahead of it a burn. Measured on the fourteen
bosses alone, five or six dances each (the scratch flight 0615 used):

| | on the boss's half | landings a dance | a boss a dance |
|---|---|---|---|
| 0615, one speed | 81% | 11.0 | 10.5% |
| burn, bumper capped at `top` | 84% | 12.1 | 14.8% |
| bumper to 6.8, brake 0.56 | 77% | 11.5 | 14.9% |
| **bumper to 6.8, brake 1** | **84%** | **12.6** | **14.7%** |

A bumper capped at `top` did nothing at all: the dance arrives at a body already burning at `top`, so a cap there
was a kick of one, which the probe for *thrown off faster than it came* found by staying green. Past it, a soft
brake left the dance a third of the screen from the boss before it had stopped. One unit a step stops it in a tenth
of a second.

**A dance takes half again what 0615's did off a boss**, and the mid-bosses most — the shoal-mother 41% of its bar
in one dance, the lattice 37, the harrow 32, the sentinel 28. Of the 14.7%, 1.5 points are the heavier ram weight
(the dance on the ball lands at the ram's weight, 0595's review) and the rest is the dance reaching the boss more,
which is what the ask's *"curve back to the boss"* asked for. The landings are two thirds of it and the shockwaves a
third. **It is named here because a play may say it is too much**, and the levers are the dance's `damage` or its
wave's.

### The far side, because the burn made it possible

At `thrown` the dance steps 6.8 units, more than a drifter and the ball's reach are across together, so a step can
carry its centre past the body's; put out along the line between them, it came out of the far side — through.
`tests/solid.test.ts` throws it at a body at every half unit of a step's phase.

### A fifth more on a boss

0615's knock took a held ram on a boss from 6.6 landings a second to 5.3, and the ask is *"very close … just slightly
too slow"*. 1.9 puts a held ram's damage a second on the twelve bosses that take the ram's own weight up a fifth —
the sentinel 25.9 to 30.8 a second — and leaves the serpent and the jellyfish, whose rows weigh it themselves.

## What guards it

`tests/solid.test.ts`, *0617*: turned round at a body behind it, the dance brakes with flame out of its front, swings
and burns with flame out of its back, slowed under half its cruise and thrown over 1.4 times it, in pixels a second;
at its fastest never through a body however its step falls; off a body half as far as off a boss with the stick held.
And 0615's bumper guard now compares against the speed it came at, and asks that it came off the side it met.
Probes in `scripts/probes/0617-the-dance-burns.mjs`, all five seen red; 0615's two re-anchored.

## Owed

- **A play** of the burn and its flame, and of the mid-bosses under a dance that takes a third of one.
- **A sound for the burn**, which has none: it is seen and not heard.
- **The fight lengths** with the ball at 1.9, flown and not estimated.
