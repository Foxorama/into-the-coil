# 0469 — The pods are cigars

**Accepted 2026-10-03.** Item 5 of
[the chrome and the ships, reviewed](../../reports/the-chrome-and-the-ships-reviewed-2026-10-03.md),
a play report on the fighter after [0449](0449-the-wings-are-trimmed.md): *"the wingtips on the
Huang-woo spaceship still look weird."*

## The rule

| | was | is |
|---|---|---|
| **the wingtip pod** (`SHIP_POD_MK3`) | a trapezoid 0.40 of the hull's radius wide at the wing and 0.82 at its outer edge, square-cornered, from 0.14 ahead of the chord's front to 0.96 behind it | a **cigar** on the wingtip's chord: from 0.1 ahead of the chord's front to 1.0 behind it, 0.35 wide at its waist, tapering to a round nose and a tail |
| **the span** | 1.31 of the hull's radius | **1.13** |
| **the muzzle light** | in the pod's back outer corner | at its **nose**, and the glow with it |
| **the dark band** | across the pod | along its length at the waist, 0.15 wide |
| **the second tier's smaller pod** (`SHIP_POD`) | declared, drawn by nothing since 0441 | deleted |
| the row's `wingtip` | 3.85 | unchanged, a hair inside the cigar's waist |

## Why it was weird, and why this is not

**The pod flared the wrong way.** It was wider at its tip than at its root, with square corners, so
each read as a bell hung off the wing — a megaphone — and at 85 pixels as a flap. 0449 pulled the
span in and did not touch the shape, and the shape was the complaint. A pod on a wingtip — a fuel
tank, a gun pod — is a cigar: longest along the line of flight, widest in its middle, tapering to
both ends, with its light at the front where a forward gun fires. This one is that, lying on the
wingtip's chord so it shares that edge with the hull and no area (0194's `evenodd` trap, as before),
with its nose ahead of the leading edge and its tail behind the trailing edge, which is where a pod
sits on a swept wing.

**The span fell without being asked**, from 1.31 radii to 1.13: the cigar's waist stands less far
out than the bell's lip did. That is the direction 0449 was asked for — *"they jut out a bit too much
and make the ship just a bit too big to get through a few holes"* — and the hurtbox did not move
then and does not now.

**Every mark on the pod clears the floor.** The hull's radius is about 17.6 CSS pixels at 1280×720,
so 0106's 2.5 px is 0.145 of it; the band and the muzzle are 0.15 across, and
`tests/accents.test.ts` holds both on the hull.

## What guards it

Nothing new; a shape is a taste in [0192](0192-a-guard-holds-an-invariant.md)'s sense. The existing
guards ran against it: `tests/accents.test.ts` (every mark on its hull and above the floor),
`tests/mounts.test.ts`, `tests/intro.test.ts` (the fighter no bigger than it was beside the bar door).

**Photographed** off the sheet at two and eight times and on the bench in The Approach at 1600×900.

## What it does not do, and what the player may veto

- **The cigar's length and waist are a taste**, thirteen points in one polygon.
- **The contrail's `wingtip` stays at 3.85**, a hair inside the waist; if the intro's trails look to
  leave the air beside the pod, it moves to 3.95.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
