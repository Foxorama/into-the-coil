# The ships and weapons, polished — 2026-10-31

One ask, a queue of changes, each landed from `main` and each played on its own branch preview. This
file holds the plan, what was measured before it was made, and the answers the player gives while it
runs. What each change decided lives in its decision once it lands; this is the queue.

## The ask

> *"can we do a pass over all the spaceships and weapons to make them look better? they're all pretty
> blocky and badly pixelated at the moment and I think we can add a lot more detail and polish to them
> to make them look better"*

## What was photographed first

[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md): the picture, from the shipped
build, before anything was drawn. `node scripts/shot-sheet.mjs --port=5199 --zoom=4` for every ship
at every tube stage and every shot a weapon fires; `scripts/shot.mjs` at 1280×720 and 2560×1440 for the
fight; `scripts/shot-menus.mjs --sizes=wide` for the pad. Then each ship cropped out of the fight and
the pad at four to eight times, nearest-neighbour, so a stretched bitmap and a sharp one could be told
apart.

### Half of "pixelated" was a resolution cap, and it is fixed

The game bakes every bitmap at no more than ten pixels a world unit — the sky's number, from
[0065](../docs/decisions/0065-the-sky-is-baked-and-blitted.md) — and applied it to the pilot's ship on
the hangar pad, which the camera draws at seventeen a unit on a 2560×1080 monitor and twenty-three on a
1440p one. The car on the Paint & Parts pad was a 240 px bitmap stretched to 365; its wheels, baked as
glyphs at the fight's cap, were 21 px stretched to ninety. **Built as
[0697](../docs/decisions/0697-the-bitmap-has-a-budget.md)**, item 0 below: a bitmap under 480 pixels
square bakes at whatever resolution it is drawn at, the pad's pieces at up to 768, and the sky and the
bosses keep the ceiling that holds the atlas's memory. The decision has the before-and-after in pixels.

### The other half is the drawing, and resolution does not touch it

At the sheet's honest 1080p picture a ship's box is 85 px and its hull about 63. What the pictures show
at that size, ship by ship, is the same vocabulary everywhere — the one
[0227](../docs/decisions/0227-a-sprite-is-painted-not-filled.md) took from *The Far Carry*: *"a body, a
windscreen, an exhaust and a trim stripe, with a dark outline round the lot."*

| what every ship is made of today | what it reads as at 63 px |
|---|---|
| a hull filled in one ink and sealed in `space` at `size × 0.04` — 3.4 px at 1080p, 2.2 at 720p | a heavy black contour round a paper cutout; at 720p the outline is a third of a wing's chord |
| one top-to-bottom wash over the whole hull (`shaded`, since [0461](../docs/decisions/0461-the-ships-are-jazzed.md)) | a flat plate with a lighter top; no part has its own light, so a wing and the fuselage under it are one surface |
| every mark a hard-edged polygon, in a flat shade — a rectangle for a lamp, a square for a vent, a band for a stripe | *blocky*: what the player called it. The fighter's gold wingtips are two rectangles; the Thunderbolt's tank a box |
| straight edges between authored points — the fighter is eleven points a side; the cars are polygons; only the Viper, the duck and the saucer's dome curve | corners where a cowl, a canopy or a nacelle should round |
| a canopy as one flat ellipse or trapezoid of `glass` | a sticker, not a window — no reflection, no depth behind it |

And the weapons: the pulse is an orange disc in a glow (which a bullet may be); the missile and the
seeker are flat polygons with one lighter band; the paintball a ball with a dot; the ray a stack of
rings; the catherine wheel and the shuriken are the two that already read as things. The mounts were
answered once already as silhouettes ([0630](../docs/decisions/0630-the-guns-are-not-blocks.md),
*"boring blocky gun + missiles"*) and are still flat inks.

**None of this is a count of parts.** [0106](../docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)
holds every solid mark at 2.5 px on 1280×720, which is 0.42 world units, which on the fighter's hull is
0.12 of its radius: a rivet, a panel line in a solid ink, a third stripe are each under the floor and
would be refused by `tests/accents.test.ts`. More detail at this size is **light, material and contour**,
and the floor does not apply to a translucent mark (alpha under 0.9) — a highlight, a shadow, a sheen —
which only has to stay inside the sprite's box.

## The direction, to be vetoed from a picture and not from this page

Each ship authors its own ([0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md));
what is shared is the vocabulary in `src/render/bake.ts` under THE PAINT, which grows where an item
needs it. The first item draws one ship in it and hands over the sheet, the fight and the pad, so the
player vetoes the look there — [0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md):
a drawing is argued from the drawing.

1. **Light per part, not per hull.** Each part — fuselage, wing, nacelle, canopy, cowl, turret — gets its
   own wash: a lit edge toward the light and a deep edge away from it, and a translucent shadow where it
   sits on the part under it. The light is from above and ahead, as 0461 set it, on every ship.
2. **Material.** Glass gets a specular streak and a reflection band and a darker interior; lacquer and
   metal a sheen band along their length and a hotspot; a lamp its glow (which exists) and a lens; rubber
   stays matt. A chrome part is a bright band between two dark ones, which is what chrome is at this
   size.
3. **Contour in the body's own shade.** Panel seams, the line between a wing and the fuselage, the edge
   of a cowl: `seam` in a deep shade of the body at low alpha, never `space`. The outline stays —
   it is what finds the ship against a dark sky, and the one thing the *Far Carry* recipe got right —
   but is tinted to the body's deepest shade and thinned where a part meets another part rather than
   the sky. **This is the first veto**: whether the contour stays near black.
4. **Curves where the thing is curved.** `curveLoop` exists since [0276](../docs/decisions/0276-the-kit-draws-a-creature.md)
   and the ships never got it: the fighter's cowl and wing roots, the cars' roofs and arches, the
   saucer's rim. Angular stays angular; the fighter is a wedge and reads as one.
5. **Judged at both cameras, from the same drawing.** The fight at 85 px and the pad at 365, since 0697
   one bitmap serves neither badly. Every item is photographed at the sheet, in the fight and on the pad
   before it is handed over, and the hand-over names the one thing the picture could not settle.

What is **not** on the list: a second drawing per ship for the pad (the saucer has one, edge-on, and
keeps it); bitmaps from files ([0003](../docs/decisions/0003-single-file-build.md)); any change to a
hull's silhouette that moves a hurtbox, a muzzle or a tube (`tests/mounts.test.ts`,
`tests/launchers.test.ts` hold where every shot leaves).

## What the guards will say, on every item

- `tests/accents.test.ts` — every solid mark inside its hull and over 0106's floor, every translucent one
  inside the box, the hurt twin one wash ([0278](../docs/decisions/0278-the-flash-is-a-wash.md)), every
  look's marks on the hull ([0528](../docs/decisions/0528-the-noses-are-painted.md)).
- `tests/launchers.test.ts`, `tests/mounts.test.ts`, `tests/lamps.test.ts` — the guns are not blocks,
  the muzzles are where they were, the lights lie on the ship.
- `tests/sheet.test.ts` — a hurt twin differs from its base and no two kinds bake the same bitmap.
- `tests/art.test.ts`, `tests/livery.test.ts` and their browser twins — every nose art, livery, rim and
  flame still fits and still reads on the pad.

A red one is answered by the drawing or by the guard with a reason, never by the work bending to it —
[0192](../docs/decisions/0192-a-guard-holds-an-invariant.md).

## The queue

Each a decision and a PR from `main`, one open at a time, each played on its branch preview. The
fighter first because it is the sample the rest are vetoed against; the Firebird second because it is
the ship the photographs were taken of and the one on the pad in every menu picture.

| # | item | what it covers | status |
|---|---|---|---|
| 0 | **the bitmap has a budget** | `bakeSize` honours the blit resolution under a pixel budget; the pad's pieces and glyphs sharp | **built — [0697](../docs/decisions/0697-the-bitmap-has-a-budget.md)** |
| 1 | **the fighter** — the style sample | the hull, wings, canards, canopy, nacelles and lamps; its three tube stages, hurt twin and dance poses; its three nose arts; its pylons. The same drawing stands on the pad | next |
| 2 | **the Firebird** | lacquer, glass, the bird and the flames, the snowflakes and every rim, the shaker, the lamps; the tilt poses | |
| 3 | **the estate** | the woody's panels, the roof rack and drum, the glass, every rim, the dice | |
| 4 | **the Thunderbolt** | tank, forks, pipes, the lightning ball, the Marmot and the Duck aboard | |
| 5 | **the Hamster Ball** | the sphere's reflection and refraction, the cradle, Unity inside | |
| 6 | **the Aqua Duck** | the bath-duck's rubber, the marker, the hopper, the periscope | |
| 7 | **the little caddie** | the disc's rim and dome from above; its edge-on drawing for the pad (`paintSaucer`) is the one second drawing in the game and gets the same pass | |
| 8 | **the Viper** | the fight's drawing and the port's own pieces for the intro and the finale | |
| 9 | **the pulse** | the mount on every ship it fits, the bullet, its impact | |
| 10 | **the arc** | the mount, the node, the bolt's inks ([0470](../docs/decisions/0470-the-light-is-additive.md) stays) | |
| 11 | **the shuriken** | the mount and drum, the blade in flight and turning | |
| 12 | **the ray gun** | the saucer's turret and the mount elsewhere, the ring, its ripple, swell, burst and fade | |
| 13 | **the Catherine wheel** | the spindle, the wheel and its fade, the tether's rope | |
| 14 | **the ram** | the nose, its heat and glow stack | |
| 15 | **the paintball** | the marker, the four balls, the splats wet and dry, the spray | |
| 16 | **the acid** | the Viper's fangs, the spit, the void, the splat | |
| 17 | **the missiles and tubes** | the missile and the seeker in flight; the loaded tube, the warhead nose; the pods and turrets each ship carries them in; the bomb | |
| 18 | **the specials' pictures** | the candle's star, the storm and void balls, the dance's flares and wave, the nova's arc, the two auras | |
| 19 | **the pickups' faces** | the twelve glyphs in their bubbles, and the readout's bare copies of them | |

## The player's answers

Collected here as the queue runs, each dated.

- **The contour** (direction 3): *open — vetoed from item 1's pictures.*
- **Curves on the fighter** (direction 4): *open — vetoed from item 1's pictures.*
- **The order past the Firebird**: *open — the table's order until told otherwise.*
