# 0698 — The fighter is finished

**Accepted 2026-10-31.** Item 1 of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md): the style
sample every other ship in the queue is vetoed against. Builds on [0697](0697-the-bitmap-has-a-budget.md),
which is what lets one drawing serve the fight and the pad; carries [0632](0632-the-enemies-are-finished.md)'s
finish from the enemies to a ship.

## The ask

> *"they're all pretty blocky and badly pixelated at the moment and I think we can add a lot more detail and
> polish to them"*

## What the fighter was, photographed first

On the sheet at 4× and on the Paint & Parts pad at 2560×1080 (365 px long), from the shipped build: a hull
in one ink under one diagonal wash ([0461](0461-the-ships-are-jazzed.md)), sealed in `space`; an
eight-cornered canopy in flat `glass` with a flat glint; two flat rectangles for nacelles and two flat
squares for cores; flat bands for the stripes and the wingtip lights; flat canards. Every mark a polygon in
one shade, and nothing on the ship with a light of its own. That is what the report measured as the
*"blocky"* half of the ask, and 0697 does not touch it.

## The rule

**The fighter is lit as a set of parts, and finished over its paint.** In order, in `src/render/bake.ts`:

| pass | what | how |
|---|---|---|
| the hull's wash | as 0461 had it | unchanged |
| **the parts lit** (`litFighterParts`) | the fuselage a cylinder: bright along its spine, falling off to both edges and deeper on the flank away from the light; each wing falling away from root to tip, the lower one deeper; the fuselage's shadow on the wing below it | translucent washes (`shaded`, alpha 0.6–0.75) and one shadow polygon at 0.3 |
| the livery | as 0241 and 0528 have it | unchanged, over the lit parts |
| **the canopy** (`paintShip`) | a smooth pane (`curveLoop`) paler at the front and deep at the back, the cockpit dark under it, the glint over both | the pane solid, the cockpit at 0.8 |
| **the nacelles** (`paintShip`) | cylinders, lit along the edge that faces up the screen | solid gradients in the flame ink |
| **the finish** (`finishFighter`) | the canards as forms, swept as they are; the stripes bevelled along the leading edge; the wingtip gold lit with a light round it; the core white-hot at its heart; contours in the body's deep shade — the fuselage's edge against each wing, a panel line across each wing, the canopy's frame; the glass's specular streak; the keel's lit edge; and **the rim light** inside every edge that faces up, hull and canards together (`rimLight`, 0632's, now a function of its own) | every one translucent |

**The light is from up the screen and ahead**, as 0461 set it, on every pass, so the parts agree.

**Everything added is translucent**, and that is the rule that makes it fit both cameras: `tests/accents.test.ts`
holds a translucent mark inside the sprite's box and a solid one on the hull and over
[0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s 2.5 px. A contour 0.03 of the hull's radius is
half a pixel at the fight's camera, where it fades to nothing, and four pixels on the pad, where it is a line.
The one solid thing added, the canopy's pane, is the canopy that was already there.

**The rim light reads its seal width before any seam.** `seam` sets the pen's width and leaves it; `finishBody`
reads the seal's width off the pen because nothing strokes between an enemy's seal and its finish, and the
fighter's paint does. So `rimLight` takes the width as an argument, and the fighter reads it at its seal.

## What it looks like, measured

| | sheet, 1080p (85 px box) | Paint & Parts, 2560×1080 (365 px) |
|---|---|---|
| before | a cut-out with a lighter corner | the same, four times larger |
| after | a spine, a glossy canopy, lit nacelles, a lit upper edge | the form: cylinder, shadow, bevels, contours, the glass with something behind it |

The fight's camera shows the lighting and the canopy; the pad shows all of it. That is the shape of every
item in the queue: **what the fight can show is light and material, and the contours are for the pad.**

## The two vetoes, from the pictures

- **The outline stays near black.** It is the one stroke in `space` the guard holds, and it is what finds the
  ship on a dark sky. The rim light inside it makes the lit edges read thinner without touching it. *A tinted
  outline is a change to the guard and to every body, and is the player's call.*
- **The wedge stays a wedge.** The hull's eleven points a side are unchanged (0449's wingtip, the hurtbox, every
  mount and tube on it); the canopy is the one curve. *Curves on the cowl and the wing roots move the
  silhouette, and are the player's call.*

## What guards it

`tests/accents.test.ts`, *0698*: the fighter's trace carries a rim light — a `source-atop` gradient stroke —
at least 2.5 px wide on a 1280×720 screen, as 0632's guard asks of every enemy. The 0227 and 0528 guards go
on holding every solid mark on the hull and over the floor, every translucent one inside the box, the hurt
twin one wash, and every look's marks on the hull. Two probes in `scripts/probes/0698-the-fighter-is-finished.mjs`:
the rim left off, and the rim laid over the hull rather than atop it.

## Not held by any guard

Whether it reads as *polished* is the player's; the pictures are in the handover. The strengths — every alpha
and shade in `litFighterParts` and `finishFighter` — are the fighter's own numbers, and the next ship authors
its own ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).
