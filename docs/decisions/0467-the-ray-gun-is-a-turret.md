# 0467 — The ray gun is a turret set into the rim

**Accepted 2026-10-03.** Item 3 of
[the chrome and the ships, reviewed](../../reports/the-chrome-and-the-ships-reviewed-2026-10-03.md),
a third play report on the Little Green Caddie's gun after [0461](0461-the-ships-are-jazzed.md) and
[0463](0463-the-ships-are-cooler.md):

> *"the ray gun on the lil caddie looks pretty terrible and needs to be scrapped and restarted."*

The review offered three directions and the player chose **A** — *"the ray gun — A"*.

## The rule

| | was | is |
|---|---|---|
| **the gun's shape** | a chamber on the disc's face, a chrome barrel through two chrome fins to an orb — a ray gun's side profile laid flat | an **emitter housing set into the rim** at the nose: a chrome ball half sunk in the disc, a lavender **lens** in its face with the rings it fires glowing in it about a white heart, a **short barrel** to a smaller orb |
| **the housing** | — | centre 0.6, radius 0.22 of the box's radius — half the dome |
| **the lens** | — | 0.145, its heart 0.055 |
| **the barrel** | 0.06 half-width, from the chamber | 0.08, from the housing to the orb |
| **the orb** | 0.095 at 1.035 | 0.08 at 1.05; **the tip stays at 1.13** |
| **the rim's hand-over** | solved against the first fin's swept edge | solved against the housing's ball (`housingSeat`) |

## Why three drawings failed and this one reads

**Each drew a profile, and from above a profile is a stick.** A ray gun is recognised by its side
view — a bulb, cooling fins, a tapered barrel, a muzzle ball — and 0461 and 0463 each drew that view
and laid it flat on a saucer that is seen from above. Seen from above, fins are a cone and a barrel
is a line; chrome has no edge against the void; and at the shipped camera the whole thing was thirteen
pixels of grey wedge and a lavender dot. The two pods beside it read at the same size, and they are
round things with a light in them. So the gun is one of those: a round housing in the rim with a
light in its face, which is *a glowing lens on the nose* at thirteen pixels and *a turret* at eight
times. The barrel and the orb keep the thing a gun rather than a lamp, and the orb is smaller than the
lens so the eye reads lens-then-muzzle rather than two equal balls.

**The tip did not move**, so the row's `muzzle` and `tests/mounts.test.ts` are unchanged; the housing
meets the rim where the two circles cross, solved rather than placed, so the hull is still one path
with no sliver between disc and gun (0194). The hangar's side view lays the same gun on its own
outline, as before; from the side the housing stands proud of the rim as a nub and has no seat in a
face to shadow, which is what the paint's `onDisc` turns off.

**The heart is 0.055 and not 0.05** because `tests/accents.test.ts` found the smaller at 2.37 px on
1280×720, under [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s floor for a solid mark.
Resized, not exempted.

## What guards it

Nothing new. Every change is a taste in [0192](0192-a-guard-holds-an-invariant.md)'s sense, and what
is invariant is already held: `tests/accents.test.ts` (every mark on its hull and thick enough to be
drawn), `tests/mounts.test.ts` (the shot leaves the orb's tip), `tests/intro.test.ts` (the saucer no
bigger than its row says in the hangar).

**Photographed** off the sheet at two and eight times, on the bench in The Approach at 1600×900, and
in the intro's hangar.

## What it does not do, and what the player may veto

- **Directions B and C were not drawn.** The player chose A from the review's description; B (a pair
  of emitters on the shoulders) changes the muzzle and the shot pattern, C (no gun, a lit rim) was the
  predecessor's *they come in peace*. Either is a sheet pass away if A does not land on play.
- **The housing's size and the lens's inks are a taste**, each one number.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
