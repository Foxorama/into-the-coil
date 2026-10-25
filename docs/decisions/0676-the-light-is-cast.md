# 0676 — The light is cast

**Accepted 2026-10-25.** Item 2 of [`the-port-planned`](../../reports/the-port-planned-2026-10-24.md), from
[`the-port-is-a-cutout`](../../reports/the-port-is-a-cutout-2026-10-24.md). It lights what
[0411](0411-the-chase-begins-at-the-port.md) built (the intro's room) and what
[0571](0571-the-dock.md) built (the dock the hangar's tabs stand in).

## The ask

The room was lit evenly. The lamps hung from the truss with their cones drawn, but the wall under a lamp was the
same tile as the wall between lamps; nothing lit the deck under them; the ship on its pad was lit by nothing under
it; and the room had no shade where the light does not reach.

## The rule

| | was | is |
|---|---|---|
| **The wall** | one tile, `wall` | three: `wall`, `wallHalf` and `wallLit`, the same panel warmed toward its top and its upper edge catching the light. Which one a tile is comes from `tileLit` in `src/render/port.ts`, a pure function of where the tile stands: whole under a lamp and high on the wall, half under one but low or beside one but high, none between. The frame pays for an index |
| **The deck** | the planks | a pool of each lamp's light on the deck under it (`lampPool`), and each pad's field round its foot in the player's ink (`padPool`), in the intro for as long as its beam stands and in the dock under the cradle |
| **The ship on its pad** | lit by nothing under it | the pad's light up its underside (`padLight`), laid after the hull and before its tubes: in the dock always, in the intro until it lifts |
| **Shade** | none | a band of the void, at half and to nothing, under the truss and along the wall's foot in both rooms, and under the catwalk in the dock (`shade`, and `shadeFoot` for the foot's band rising the other way; five blits between the two). The first push laid the foot's band as `shade` turned over, which rotates the canvas every frame: 0558's `tests/run-ends.browser.test.ts` counts rotations on the stand and read 12 a second in CI. The foot's band is baked lying its own way, so nothing is turned |
| **The bar's corner** | its spill in the doorway | the spill reaching further (`PORT_EXTENT.spill` 36 to 46), and its light climbing the wall past the bar's end (`spillWall`), there through its window before the door opens and full once it is open. The room has a warm side and a cold side |

**The pools and the up-light are light**: added to what is under them, not laid over it. The plan asked for a
`putLit` beside `put` that passed the composite to the surface per call. The surface already reads it per sprite,
from the atlas's `light` marks (0520), so the port's atlas now carries marks of its own (`PORT_LIGHT_KINDS`), and
`withTheGame` keeps them ahead of the game's. What a kind is decides it, as it does for the game's lights, and no
call can forget to say so.

**Not done: the frame's two far corners.** The plan named them among the shade's places. The truss, the catwalk and
the wall's foot already darken the room's edges, and a corner each was two more full-screen blits for a shade the
photographs did not show missing. A play can ask for them.

## What it cost and the guards it moved

- **The port's atlas**, measured in the browser with the pilot at the default:
  - At 1280×720 it went from 18.40 MB to 19.41 MB.
  - At 1920×1080 doubled it went from 51.04 MB to 53.85 MB.
  - The whole bake took 29–34 ms before and 31–32 ms after at 720p, and 54–87 ms before and 59–78 ms after at
    1080p doubled, three runs each: inside the runs' own spread.
- **Blits a frame**: the intro's room eight more (two shades, two lamp pools, two pad pools, the warm wall, the
  up-light), the dock seven (three shades, two lamp pools, the cradle's pool, the up-light). `tests/budget.test.ts`
  holds no count for the port; its rules are unchanged and green, as are `tests/intro.test.ts` and
  `tests/stand.test.ts`.
- **`tests/light.browser.test.ts`**, *0676*, new, on `tests/station.browser.test.ts`'s terms. It draws the dock off
  the shell's painter and atlases and reads the wall's luminance high up, beside the first lamp's cone and on the
  tile furthest from both lamps. Measured at landing: 0.327 under the lamp and 0.174 between, 1.88 times. The room
  before this decision read 0.297 and 0.218 there, 1.36 times, because the lamp's own glow reaches the patch. The
  bound is 1.6 times, between the two. A first patch read under the cone, where the room before already passed
  any bound worth setting; it was moved beside it.
- **Four older probes were anchored on lines this changed** and are re-anchored on the lines as they stand, each
  proved again:
  - 0621, 0612 and 0540 named the dock's `paintBlue` call, which now passes the up-light.
  - 0520 named `withTheGame`'s light marks, which now keep the port's own.

Probed in `scripts/probes/0676-the-light-is-cast.mjs`: every tile the unlit one.

**Not held by any guard:** the pools' size and warmth, the up-light, the shade's depth, the warm wall. They are the
picture's, and a play says whether the room reads as lit.

**Photographed** with `scripts/shot-intro.mjs` at 1.2 s and 6 s, and the three tabs at 1280×720 and 844×390.

## What is owed

- A play: whether the warm side and the cold side read, and whether the shade under the truss is enough.
