# 0699 — The Firebird is finished

**Accepted 2026-10-31.** Item 2 of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md), on
[0698](0698-the-fighter-is-finished.md)'s terms: light and material for the fight's camera, contours for the
pad, everything added translucent. Keeps every word of [0468](0468-the-firebird-is-black-and-gold.md) —
black lacquer found by its gold lines.

## What the Firebird was, photographed first

On the sheet at 4× and on the Paint & Parts pad at 2560×1080: the lacquer under one roof-to-sill wash with
one sheen down the roofline; flat gold glass with one glare; a tyre as a flat slate disc with a flat gold
snowflake on a flat dark dish; the lamps flat rectangles with a glow; the lip shaded, the spindle shaded,
and nothing else on the car with a light of its own. The 0468 drawing is good at what it does — the gold
lines find the car — and it is a cut-out.

## The rule

**The Firebird is lit as a car under a room's light, and finished over its paint**, in `drawFirebird`
(`src/render/bake.ts`), each at the Firebird's own numbers in its own ±20 frame:

| part | was | is |
|---|---|---|
| **the lacquer** | one wash | the wash, and a horizon reflected along the flank under the beltline (a light band fading down, alpha 0.3), the underbody in shadow along the rocker |
| **the tyres** | a disc | each in its well — the arch in shadow over it, the rubber lit along its top — the dish lit from above so the spokes have a top and a bottom, and the hub glinting. Over whichever rim is fitted ([0527](0527-the-wheels-turn.md)), because the well and the light are the car's |
| **the glass** | flat `gold` at −0.3, one glare | the glare, and the panes paler at the top and deep at the sill, the belt under them in shadow |
| **the lamps** | flat rectangles with a glow | the glow, and each a lens lit along its top |
| **the hood** | the wash | its crease caught by the light |
| **the finish** | — | the rim light inside every edge that faces up (`rimLight`, 0698's), in the lacquer's gold at 0.7: the roof, the hood and the deck catch the room as black lacquer does |

**Nothing solid was added.** Every mark here is under 0.9 alpha, so `tests/accents.test.ts` holds it inside
the box and not to [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s floor; the pinstripes, the
bird, the glass and the lamps are where 0468 and [0528](0528-the-noses-are-painted.md) put them. The
silhouette, the hurtbox, the spindle and both turrets are untouched, and the dance's tilt (0594) moves the
new marks with the body because they are drawn through the same `box`.

## What it looks like, measured

| | sheet, 1080p (85 px box) | Paint & Parts, 2560×1080 (365 px) |
|---|---|---|
| before | a black cut-out in gold lines | the same, larger |
| after | a lit roof, glass with depth, wheels with a top | the lacquer's horizon, the tyres in their wells, the spokes shaded, lenses on the lamps |

## The vetoes, from the pictures

The two 0698 asked stand for every ship and are not re-asked. One of the Firebird's own: **the rim light
is gold.** On a black car a lit edge in the body's own shade is invisible; in gold it reads as the Trans
Am's roof pinstripe catching the light. If it reads as a second pinstripe, the one number is the `lit` ink
handed to `rimLight` at the end of `drawFirebird`.

## What guards it

0698's guard in `tests/accents.test.ts` walks a list of finished ships, and the Firebird is on it: every
Firebird sprite that is not a hurt twin carries a `source-atop` gradient rim at least 2.5 px wide on
1280×720. One probe in `scripts/probes/0699-the-firebird-is-finished.mjs`: the rim left off the Firebird.
**A second — the Firebird dropped from the list — was written and seen STILL GREEN**: the guard then does not
look at the Firebird, so the list is the queue's progress and not an invariant
([0192](0192-a-guard-holds-an-invariant.md)), and the probe was deleted rather than a guard tightened round it.
The 0698 probes are re-anchored to the guard's new name.
