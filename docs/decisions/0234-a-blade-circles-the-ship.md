# 0234 — A blade circles the ship

**Accepted 2026-09-05.** The second of the three new weapons asked for that day, and the first row
on [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s axis that is a row and not a mechanism:

> *"Second new weapon is a shuriken launcher. It fires shurikens that circle around the ship in an
> increasingly large arc and hits everything that it comes into contact with on that arc. Upgrades
> make the shuriken's arc last longer, so it ends up with a bigger spiral and increase the shuriken
> fire rate."*

**Amends [0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)'s collision** in one clause:
a shot is spent by arriving *one health at a time*, and a shot with more than one lands once per
impact flash.

## The rules

**The shuriken is a `WeaponKind` with the `orbit` flight.** Its row carries two ladders the other guns
have zeros for: `orbit`, the steps a blade lives, and `turn`, the radians it circles the ship per
step. A tier lengthens the spiral and quickens the throw; nothing else about a blade climbs.

**A blade is a shot in the pulse's pool that circles where the ship IS.** `steerBlades` sets each
blade's velocity toward its next place on its spiral — an angle that advances by `turn`, a radius
that opens by the shot row's `speed` — about the ship's current position, and `stepEntities`
integrates it. The turn and the growth are copied onto the blade when it is thrown, so a player who
switches guns keeps the blades in the air.

**A blade is spent by its own clock, not by arriving.** `collideInto` costs a shot one health per
arrival and releases it at zero; a pulse has one and is unchanged, a blade has `BLADE_EDGE` and goes
on to the next body. A shot with health to spare does not land on a body still flashing from the
last landing — the flash the picture reads (0035) is the same fact — so a blade lying across a body
lands once per `IMPACT_FLASH_STEPS`, which is the rate the pulse is held to.

**A blade spins by swapping its two turns.** The row's `sprite` and `spriteHit` are the star and the
star an eighth of a turn round; a blade never flashes, so the hurt slot is free, and the swap every
`BLADE_TURN_STEPS` is what a bitmap that cannot rotate does instead.

**Its landings have a spark and a sound.** The pulse's pairing takes the hits log only while the gun
is the blade, so the pulse's picture gains nothing; a bite sounds as `hit`, which the pool arithmetic
could not see for a shot that is not spent. The throw is its own cue, `throw`: a whoosh with a metal
ring on it, dry and shorter than its fastest cadence.

**The ship wears it**: a blade on each wingtip, and on each pod's outer edge once it has pods, with a
star on the keel.

## ⚠️ What was rejected

**A pool of its own.** Every pool comes out of 0022's five hundred, and the pulse's already gave up
twelve for the bolts; a ship carries one gun, so blades and pulses are never in the air together
except for the seconds after a switch. `BLADE_KIND` on the entity is what tells them apart.

**Writing the blade's position.** `prev` is what the painter interpolates and what the swept
collision compares; a position written over would leave a blade at the end of its spiral — four units
a step, more than its own hurtbox — stepping over the bodies it should cross.

**Reading the turn off the fitted weapon each step.** A switch mid-flight would freeze every blade in
its ring for two seconds. Copied at the throw, they finish what they started.

**A fin on the wing at every tier.** A fin and a pod share the wingtip's edge and would overlap
there; under `evenodd` the overlap cancels (0194). The fin moves to the pod's outer edge once there
is a pod.

## What is owed

- **An eye on the ring in motion**, at the shipped camera: whether eight blades read as a ring or as
  clutter, and whether the spin at four steps a turn reads as spinning.
- **An ear on `throw`.**
- **The balance.** A blade's worth is its sweep: `BLADE_EDGE`, the spiral's length and the throw's
  cadence are three starting points a hand settles against the pulse and the arc.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, a flight and a clause in
the collision; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0234`:

| broken on purpose | went red |
|---|---|
| the spiral no longer widening | `THE SPIRAL: a thrown blade` |
| an arrival spending the whole blade | `THE SWEEP: a blade lands` |
| a surviving shot landing on a body still flashing | `THE SWEEP: a blade lands` |
| the two turns never swapped | `THE SPIN: a blade shows` |
| the throw cue removed | `THE CUES: a throw sounds` |
| a bite no longer sounding as a hit | `THE CUES: a throw sounds` |
| the last rung of the spiral authored past what the pool can hold | `never fills with blades` |
| the shuriken's first hull made the pulse's | `THE HULLS: every gun has its own` |
| the shuriken's pickup face given the arc's bolt | `THE FACES: the weapon pickup offers every gun` |
