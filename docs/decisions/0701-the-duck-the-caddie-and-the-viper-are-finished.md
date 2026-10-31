# 0701 — The Aqua Duck, the little caddie and the Viper are finished

**Accepted 2026-11-01.** Items 6, 7 and 8 of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md) — the report's batch B,
landed at full auto at the player's asking. On [0698](0698-the-fighter-is-finished.md)'s terms and
[0700](0700-the-estate-the-bolt-and-the-ball-are-finished.md)'s pattern: light and material for the fight's camera,
contours for the pad, everything added translucent, a rim light last. **With these three every ship is finished**, so
0698's guard walks `SHIP_KINDS` and not a list.

## What the three were, photographed first

On the sheet at 4× and drawn at the pad's 365 px from the tree before this change: the duck a yellow cut-out under one
wash, its keel band, a flat wing, a flat porthole, a flat marker; the caddie lit as a disc (0461) with a lit lip and a
glinting dome, and nothing else with a light of its own; the Viper under one back-to-belly wash, its chevrons, a flat
canopy and a lit eye. Edge-on on the pad, the saucer (`paintSaucer`) had its face and belly washes and a glinting dome.

## The rule

| ship | part | what was added |
|---|---|---|
| **the Aqua Duck** (`drawDuck`) | the rubber | light as a bath toy has it, broad and soft and never a hard glint: a sheen along the back; the head a ball, its crown catching the room and its underside in shadow at the neck; the wing's shadow on the flank under it and two feathers as contours in the body's own deep shade; the waterline's light along the top of the keel band |
| | the porthole | the glass deep at its bottom, the brass ring lit along its top |
| | the bill | the upper bill lit along its ridge, the lower in shadow under the closing line |
| | the periscope | chrome: a glint down its lit side and round its elbow |
| | the marker, the hopper | the body lit along its top; the barrel chrome, a glint over a dark lower edge; the hopper a clear shell with a crescent of light on its upper edge |
| | the finish | the rim light in the yellow brightened |
| **the little caddie** (`drawCaddie`) | the disc | bounced light inside the rim's dark band on the side away from the light; the inner ring's lip lit along its upper edge; the dome's shadow on the face, down and behind it. None of it turns with the War Dance's spin, because it is light and not a part |
| | the dome | the room's window on the glass ahead of the glint, as on the ball's plastic; the glass deep on the side away from the light; its frame a contour in the body's deep shade |
| | the finish | the rim light over the disc, the pods and the gun together (one hull) |
| **the saucer edge-on** (`paintSaucer`, `port-bake.ts`) | the lens | the upper face picking up the room, brightest at its crown; the rim's near edge chrome with a glint; a line of bounced light along the belly |
| | the dome | the window and the deep base the top view's dome has |
| | the finish | the rim light inside the lens's upper edge, and inside the dome's once it is drawn, at every lean of the intro's tilt — `rimLight` exported for it |
| **the Viper** (`drawViper`) | the scales | a horizon along the upper flank; the belly's broad plates as contours across the dark band |
| | the fin, the wing, the head | the fin's leading edge lit and two ribs down its membrane; the wing's root a contour against the hull; the brow over the eye lit |
| | the canopy | paler under its crown, deep at its sill, a streak along it, its frame a contour |
| | the nozzle, the finish | the nozzle's lip lit; the rim light in the venom green brightened |
| **the port's Viper** (`paintViper`, `port-bake.ts`, the intro's and the finale's racer) | the same pass in its own inks | a horizon along the upper flank, the belly's plates as contours, the fin's leading edge lit, the canopy deep at its sill, and the rim light — its hull's path on a pen of its own (`hullOn`) so `rimLight` can lay it lowered |

**Nothing solid was added.** Every mark is under 0.9 alpha, so `tests/accents.test.ts` holds it inside the box and not
to [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s floor — the duck's bill marks were drawn first a unit
further out and the guard measured them past the box in the dabbling pose, so they stop shorter of the tip. The
silhouettes, the hurtboxes, the muzzles, the tubes and the pods are untouched.

## What the item named that this does not draw

- **The pods** are item 17's (`paintTurrets`), finished for every ship at once.
- The port's racer keeps [0666](0666-venoma-flies-the-viper.md)'s drawing in the Wyrm-Ship's fixed inks; it gains the
  finish and nothing of its shape or colour.

## What it looks like, measured

| | sheet, 1080p (85 px box) | at the pad's 365 px |
|---|---|---|
| the Aqua Duck | the lit edge round the head and back | the soft sheen on the back, the head's shadow at the neck, the lit porthole ring, the bill's ridge |
| the little caddie | the lit rim; the dome's shadow on the face | the bounce in the dark band, the window on the dome; edge-on, the chrome rim and the lit dome |
| the Viper | a lit back and fin | the belly plates, the fin's ribs, the canopy's glass |

## The open calls, from the pictures

Recorded in the report's *answers* for the one review at the end:

- **The duck's feathers.** Two contours across the wing read as feathers on the pad and as nothing in the fight; if
  they read as cracks, they are the two `seam`s after the wing's shadow in `drawDuck`.
- **The port's Viper** keeps its own dark Wyrm-Ship inks and gains the finish; if the intro's racer should look like
  the fight's venom-green one, that is a change of its colours, which this pass does not make.

## What guards it

0698's guard in `tests/accents.test.ts` now walks every ship in `SHIP_KINDS`: every sprite of every ship that is not a
hurt twin carries a `source-atop` gradient rim at least 2.5 px wide on 1280×720 — so a ship added to the union without
its finish fails there. Three probes in `scripts/probes/0701-the-duck-the-caddie-and-the-viper-are-finished.mjs`, one a
ship: its rim left off. [0493](0493-the-ray-gun-hangs-under-the-lip.md)'s probe is re-anchored, because the caddie's
last line now has the rim light after it.

## Not held by any guard

The saucer edge-on and the port's racer are drawn for the pad and the intro, not the game's atlas, so no sprite guard
reaches them; the photographs on the pad and of the port's atlas are their check. Whether each ship reads as *polished* is the player's.
