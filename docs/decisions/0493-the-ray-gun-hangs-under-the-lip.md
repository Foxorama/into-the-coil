# 0493 — The ray gun hangs under the lip

**Accepted 2026-10-04.** Item 11 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 14. Played: *"on the little caddie the raygun sits above the ship instead of under it, and it's weird that it
has a small pointed end, but fires a large circular projectile."* [0467](0467-the-ray-gun-is-a-turret.md) set the
emitter as a chrome ball half sunk in the disc at the nose, with a barrel to a small orb, painted over the dome. From
above it read as a thing sitting on the saucer. The orb was a point, and the gun fires rings.

## The rule

**The gun is painted before the disc**, straight after the hull's silhouette is sealed. The disc's face then covers
the housing to the rim. What shows past the rim is the housing's front, shaded dark where it comes out from under the
rim and lit toward the muzzle, then a short barrel, then the muzzle. The lens in the housing's face is not drawn on top,
where the disc hides it. The hangar's side view (`paintSaucer`) still shows it, because there the housing hangs below
the rim's edge.

**The muzzle is a ring**: an open dish with a chrome lip round a mouth deep in the rings' lavender and a ring of their
light lit in it. There is no orb and no white point. Its radius is the ray's smallest ring, 0.44 world units, which is
0.112 of the saucer's box. The front of the dish is the tip, still at 1.13 of the box, so the row's `muzzle` (4.46
along) and 0448's mounts guard do not move.

**The plan's number was wrong once, and the guard caught it.** The dish was first sized off the ray's half-extent, at
0.134. The ray's frame radius is 0.42 of its 4.4-unit extent, not half of it, so the smallest ring is 0.44 units and
not 0.53. The guard reads both off the bakes' own traces and went red at 1.21. The constant is now what the picture
measured.

## Consider the screen

The gun is smaller on screen than 0467's: the housing that stood on the dome is now mostly under it. That is the ask.
What remains is a dark stub and a lavender ring about four pixels across at the shipped camera. The rings leave from
the same point they did, so nothing about where the shot goes has changed.

## Guards

`tests/mounts.test.ts`, *0493 — the ray gun hangs under the lip*, both read off the bake's trace in world units:

- **UNDER THE LIP**: every mark of the emitter housing that reaches past the rim is painted before the disc's face.
- **A RING IN, A RING OUT**: the dish at the muzzle has the radius of the ray's smallest ring, within 15%, measured off
  the ray's own bake.

0448's mounts guards and the accents' containment guards re-run unchanged.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0493`:

| broken on purpose | went red |
|---|---|
| the ray gun painted once more after the dome, over the disc | `UNDER THE LIP` |
| the muzzle back to the small orb it was | `A RING IN, A RING OUT` |

## Owed

- **A play with the caddie**: does the gun read as under the saucer, and does the ring read as where the rings come
  from? The plan asked for a sketch from the player, since this is the fourth drawing of this gun.
- **A look at the hangar.** Its side view takes the same dish and was not photographed. Before-and-after photographs
  are off the sheet, ×8.

## Rollback

⚠️ **None owed**: [0001](0001-revertability-not-risk-rating.md). Art; nothing persisted.
