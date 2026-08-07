# 0059 — The lane is the player's box, not the enemies'

**Accepted 2026-08-07.** Extends [0048](0048-a-threat-may-arrive-from-the-side.md), which decided
where a threat comes FROM. This is about what it does after it gets there. Does not touch
[0023](0023-the-long-axis-is-the-scroll-axis.md): `across` is still a fixed 100 and still the
difficulty axis.

## The rule

**A threat may occupy the dodge lane plus the margin it entered from, and turns round there.** That
band is `ROAM_MIN`/`ROAM_MAX` in `src/sim/camera.ts` — `FLANK_MARGIN` outside the lane at each end,
which is half the cull. The **ship cannot follow**: flight clamps the player inside the lane.

**A body that is entirely off the screen does not fire.**

Two mechanisms, and no row carries both:

| | |
|---|---|
| **weave** | a shape in the world — `across₀ + A·sin(k·along)`. Requires the body to travel along |
| **roam** | a rate across, turning round at the band. Works for a body that does not travel at all |

## What was reported

> *"Once on screen the enemies are in a very narrow tunnel and it makes the feel very restrictive and
> not like you're in a large area. They should fly off the `across` edges and back on."*

## Why the weave could not answer it on its own

The weave is `velAcross = A·k·cos(k·along)·velAlong`, and **it is identically zero for a body whose
`velAlong` is zero**. The drifter and the turret both have `closing: 0` — they hold station in the
world and let the camera come to them, which is exactly what makes a turret's time on screen
authorable. So the two rows that sit stillest in the game were *structurally unable* to move sideways,
and they are the middle of what the report is describing.

`src/content/enemies.ts` already said this, in the field's own comment, as a fact about the weaver.
It was never read as a gap.

⚠️ **So the roam is a rate and not a shape**, which this project argues against elsewhere. The
argument it seems to break is *a shape in the world can be authored against and a wobble in time
cannot* — and what that protects is a **formation being a picture** rather than a coincidence of when
its members were created. A roam has no phase to get wrong: every member starts at a known `across`
with a known direction, the step is fixed ([0022](0022-frame-rate-is-a-feature.md)), and a seeded test
compares equal. The direction alternates by `(wave index + member index)`, never by a draw — the same
argument `spawnPickup` already makes for not consulting the spawn stream.

## What the band is, and why it is not a fourth number

`ROAM_MIN`/`ROAM_MAX` are `FLANK_MARGIN` outside the lane, because that is the same fact read the
other way round: 0048 already says a threat may *enter* from there. Two constants for one edge would
drift the first time either moved.

They are strictly inside `ACROSS_CULL_MIN`/`MAX`, which is what keeps the cull meaning *this has left
the game* rather than becoming a wall things bounce off — one guarantee, one mechanism.

⚠️ **The asymmetry with the ship is the feature.** `PLAYER_MARGIN` keeps the player inside the lane,
so the roam band is somewhere threats go and the player cannot follow. That is what makes the space
read as larger than the box being flown in, and it costs no difficulty:
[0023](0023-the-long-axis-is-the-scroll-axis.md)'s dodge lane is untouched.

## Three things this changed that were not asked for

**A body off the screen does not shoot.** The roam makes that reachable for the first time, and a shot
arriving from somewhere the player cannot see is a hit with no cause on the picture —
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) records that exact shape being
reported three separate times as a collision fault that did not exist. Its clock keeps running, so it
skips its turn rather than saving up a volley. The test is the hull's **edge**, so something half on
screen still fires.

**The flanker's turn runs BEFORE the weave**, where it used to run after. `tests/spawns.test.ts` held
a rule saying *no flanking wave may use a weaving enemy*, because the weave overwrote the turn — a
constraint on the level author standing in for a fix. It is gone, and the guard now drives a weaving
flanker instead of forbidding one.

**`steerAcross === 0` is now a sentinel meaning *nothing to steer to*.** It used to be `velAcross !== 0`
on `src/sim/entity.ts`'s argument that *not currently crossing* is a fact about the body rather than a
magic number — and that stopped being true the moment anything else wrote `velAcross` after arrival. A
roaming body is always crossing. `tests/level.test.ts` holds that no authored lane is zero, so the
sentinel is a value the content cannot collide with.

## The one row that says no

**The charger keeps `roam: 0`.** *"Comes straight at you, fast"* is the whole of what it is: it is the
only thing in the game faster than a reaction, and what makes that fair is that its line is readable
the instant it appears. A charger that also wandered would be unreadable at exactly the speed nothing
can be read twice at.

## Confirmed, not assumed

Probes in `scripts/probes/0059-roam.mjs`. **6 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the roam never started, so anything holding station holds it forever | `takes something that holds station clear off the edge of the screen` |
| the turn dropped, so a roaming body walks out of the band and is culled | `never leaves the roam band, so nothing that wandered off is culled` |
| the roam turning round at the LANE edges rather than outside them | `takes something that holds station clear off the edge of the screen` |
| the weave put back in front of the flanker's turn, so a weaving flanker never arrives | `a WEAVING row can arrive from the side now` |
| a body that has wandered off the screen still shooting from out there | `something that has wandered off the screen does not shoot from there` |
| a weave widened past what the authored lanes leave room for | `never puts an enemy where it can leave the ROAM band and be culled` |

⚠️ **The second probe is the tidy-looking one.** Turning round at the lane edges is what everything
else that bounces in this game does — `driftPickups` and the boss's patrol both do exactly that — so
it is what somebody would write, and it produces a tunnel one lane wide with the enemies pressed
against its walls. The guard is *did it leave the screen*, in the units the player experiences it in
([0027](0027-measure-the-picture-not-the-model.md)), and not a comparison against the constant.

⚠️ **The weaver's amplitude was found by the guard rather than chosen.** 18 put the outermost member
of two authored waves past the band; 16 is the widest the shipped script leaves room for. That is
`tests/level.test.ts` doing the arithmetic nobody should be doing by hand.

## What this leaves owed

**Every one of the five rates is a starting point and none has been played.** They are in the same
category as `SHIP_SPEED` — [0037](0037-the-ship-has-mass.md) — and the guards hold relationships
rather than values, deliberately.

**Density was sized against enemies that stayed put.** `docs/state-of-play.md` has the density pass
still outstanding, and a roaming population covers more of the screen with the same wave table, so
whatever number that pass settles on is now a different number.

**The turret's time on screen is no longer only a function of `along`.** A formation authored around
*"a turret is there for N seconds"* is still true; *"a turret is in front of you for N seconds"* is
not. Named rather than guarded, because the only honest guard is a hand on the controls.
