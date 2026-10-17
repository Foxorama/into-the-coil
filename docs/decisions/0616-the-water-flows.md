# 0616 — The water flows

**Accepted 2026-10-17.** From the same play as [0615](0615-the-ball-is-solid.md). **Amends
[0595](0595-the-aqua-duck-paints.md)** and [0610](0610-the-paint-sticks.md): the Water Cannon is a stream of
water, where it was one line at the nozzle's angle.

## The ask

> *"with the aqua duck's waterspray, it also needs more liquid physics on it to make it resemble water, it's
> currently static and stiff and so doesn't feel like a water spray at all."*

## The rule

**Every step's water leaves the nozzle on the heading the nozzle has that step and keeps it, flying `length` in
the row's `flight` steps. The stream is where all of it is now: it bows as the nozzle sweeps, its front runs out
from the press, and the last of it flies on for a flight after the nozzle stops — landing all the way, because it
is still there. It is drawn down that same stream, and every ripple in it rides out with the water it is in.**

| | |
|---|---|
| **the stream** | `src/sim/stream.ts`: the parcel `age` steps old sits `age × length / flight` out on `streamAngle(clock − age)`. The youngest and oldest ages at a clock are `streamYoungest` and `streamOldest`, and the half-width at an age is 0610's cone, `streamWidth` |
| **the row** | `flight: 10` on the jet (`Jet`, `src/content/specials.ts`); `steps` is how long the nozzle plays, and the jet lasts `steps + flight` |
| **the landing** | `landJet` lays the stream's points and widths and `streamInto` (`src/sim/collide.ts`) lands along them — the nearest segment, once per body, on the blades' clock; a segment that crosses stone ends it |
| **the link** | laid at the muzzle, carrying the jet's clock (`spin`) and whose jet it is (`face`); `from` is where the oldest water is, for whatever asks for one line |
| **the picture** | `paintBolts` draws the five strands down the stream at the clock between two steps, so the sweep is drawn moving; each strand's wobble is hashed on the step its water was fired, so it travels outward at the stream's speed; the inner strands fray short of the end (`JET_RAGGED`, 0.28); fourteen drops leave the stream a third of the way out and fly on at the water's speed past the tip, only off water that was fired; the mist is at the front |
| **the cost** | five strokes as before; at most fourteen drops and three mists, seventeen blits where it was eleven |

## Why it is built the way it is

### From the nozzle where it is now, which is not an approximation

A parcel of water leaves with the ship's velocity as well as its own, so whatever the ship has done since a parcel
left is in the parcel and in the nozzle both, and cancels: the stream, relative to the nozzle, is only a function
of how the nozzle swung. That is what lets the frame and the painter each derive the whole stream from the root, the
clock and the row (0233's *its shape is this frame's*), with nothing stored per parcel and nothing drawn from a
stream of randomness (0021).

### Ten steps of flight, photographed

At twelve — a fifth of a swing — the tip trails the nozzle by up to two thirds of a radian, and photographed at the
ends of the swing the spray curled round like a whip. At ten it trails by 0.55 of a radian and bows as a hose
does. It reaches its length a sixth of a second after the press and flies on for a sixth after the stop. A play
number.

### Ripples hashed on the firing step, which is the whole of *"static"*

0610's churn was a hash of the vertex and of the step, every other step: the spray boiled, but in place, on a
rod. Hashed on the step the water there was fired, a wobble is a property of the water and goes where it goes.
`tests/duck.test.ts` reads an edge strand's dent a step apart and holds that it matches the dent one parcel
further out better than half as badly as the dent where it was.

### Once per body along a bent line

`tetherInto` over each segment would land a body across a bend twice. `streamInto` finds the nearest segment and
lands once, which is the straight line's own count.

## Guards changed, and why

Every one of 0595's and 0610's jet guards described a straight line: from the muzzle at the angle of this step, its
length every step, its width at a share of that line. Each now asks the same thing of the stream:
- *plays for two seconds … and stops* → **and its last water flies on after it**: the nozzle's two seconds and a
  flight more, laid at the muzzle, as long as its oldest water has flown.
- *lands as wide as it is drawn … near the tip*: once it has had a flight to reach its tip, against the stream's
  normal there.
- *lands only where it is drawn, every step of it, the last included*: against the stream the link was laid on;
  the last is the last of its water in the air.
- *between steps, its root is drawn on the muzzle*: the link's own `prev`, since it is laid at the root.
- *is painted as a spray as wide as it lands*: each vertex against the nearest of the stream's middle, and at
  most its stated blits, since drops are drawn only off water that was fired.
- Re-anchored probes in `0595`, `0598`, `0599` and `0610` — each breaks the same thing it broke.

## What guards it

`tests/duck.test.ts`, *0616 — the Water Cannon's water flows*, in pixels off the painted strokes: it bows (the tip
over 100 px off the nozzle's line at the middle of a swing), runs out from the press at the water's speed, flies off
the nozzle when it stops, and its ripples ride out with it. Probes in `scripts/probes/0616-the-water-flows.mjs`,
all five seen red.

## Owed

- **A play**, and the eyes: whether a bow of half a radian reads as water or as a hose being waved, and whether
  the spray now feels like one.
- **`scripts/weigh-flashes.mjs` over the cannon**, which this did not run: seventeen blits of spray where there were
  eleven.
