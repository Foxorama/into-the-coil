# 0367 — A wall leaves the hull

**Accepted 2026-09-25.** A `wall` attack's shots leave the body that fired it and fan out to their
slots; they no longer appear in them. The formed wall, its hole and its speed down the lane are
unchanged.

## The ask

> *"the < shaped ships don't actually fire from the graphically object, they just spawn bullets in mid
> air"*

The `<` is the sower — a chevron with an open back. Its wall is two shots either side at 13 units,
from a hull 7.5 across, so every shot of it appeared 10 to 23 units past a wingtip. The warden (one
either side at 10) and the sentry (two at 15) lay the same attack and had the same fault.
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) is the class: bullets the picture
gives no source for.

Three ways were put back to the player — fan out and then fly straight, a V that goes on diverging,
or wider art — and the answer was **fan out, then fly straight**.

## The rule

**Every shot of a wall is put down on the hull, flies down the lane at the wall's own speed and
sideways at the same speed, and stops on its slot.** `spreadShots` does the stopping, after the shots
have moved, and puts it on the slot exactly, so the hole is the authored width rather than that give
or take a step of travel.

- **The rank is flat the whole way.** Every shot has the same speed down the lane from the step it is
  thrown, so the front of the wall is one line while it opens and after.
- **Sideways at the shot's own speed**: 45° in the camera's frame. It scales with the tier's shot
  speed and with each row's bullet, so the three walls open at three rates with no number for any of
  them ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)). The sower's outer
  shots reach their slots about a quarter of a second after the volley.
- **The slot is `steerAcross`**, the field a missile and a flanker already steer to, with nought for
  *not steering*. `rideCorridor` rescales it with the band, so a slot moves with a narrowing corridor
  as a flanker's lane does.
- **A shot on a path waits.** `bendShots` leaves a wall's shot alone until it is on its slot, so a
  wall of bending shots forms first and then bends as one. No wall-thrower fires a bending shot today.
- **What decides a slot is unchanged**: one outside the lane, or in the corridor's stone, is skipped
  as before ([0350](0350-the-corridor-turns.md)).

## What is held

`tests/pilots.test.ts` — *a wall leaves the hull that fired it, and fans out to its slots*, for every
row whose attack is a wall. On the step it is fired, every shot is within the body's radius plus two
steps of its own diagonal travel. Once formed, every shot is within a unit of an authored slot. Seen
red on the old code: the warden's wall appeared 10.3 units from a hull of radius 4.

The existing *a wall leaves a hole where the body is* now measures the formed wall. On the step of
firing, the whole wall is at the hull and there is no hole yet, so the step of firing is no longer
the thing measured.

Probes: *the wall put down in its slots again*, and *a wall's shot never stopped on its slot*.

**0350's guard on the corridor was re-aimed, and running 0350's probes is what found it.** *A wall of shots
is as wide as the corridor it is fired in* measured how deep inside the stone a spark stood, which told
a slot born in the stone from a skipped one. Every shot is born on the hull now, so an unskipped slot
is a shot flying into the face and breaking on it, a step deep either way — and 0350's probe went
STILL GREEN. The guard now counts any spark in the stone from the volley until the wall has formed, and
must count none.

## What is owed

**The picture.** A fan opening from a chevron has been measured and not photographed or played.
