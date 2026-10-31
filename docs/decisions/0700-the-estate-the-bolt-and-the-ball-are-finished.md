# 0700 — The estate, the Thunderbolt and the Hamster Ball are finished

**Accepted 2026-11-01.** Items 3, 4 and 5 of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md), landed as one batch
(the report's batch A) because the player asked for the rest of the queue in fewer PRs. On
[0698](0698-the-fighter-is-finished.md)'s terms and [0699](0699-the-firebird-is-finished.md)'s pattern: light and
material for the fight's camera, contours for the pad, everything added translucent, a rim light last.

## What the three were, photographed first

On the sheet at 4× (85 px box) from the tree before this change:

- **the estate** — the gilt under one roof-to-sill wash; the burl panelled and grained, framed in gilt; flat glass
  with one glare; a flat pale rack; chrome bumpers lit along their tops; the drum lit, the star flat; the lamps flat
  rectangles with no light; the tyres flat discs.
- **the Thunderbolt** — black lacquer under one wash; the tank's sheen; the jugs, the pipe, the fork and the bars in
  flat chrome; the seat a flat dark slab; the Marmot's suit flat brown, his helmet one wash.
- **the Hamster Ball** — a tinted disc with a rim band, one streak and one glint; Unity under it; the pack a slate
  block.

Each a cut-out with a lighter top, which is what the report measured as the *"blocky"* half of the ask.

## The rule

**Each is lit as its own thing under a room's light, and finished over its paint**, at its own numbers in its own
frame ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)):

| ship | part | what was added |
|---|---|---|
| **the estate** (`drawEstate`) | the burl | each panel catching the light along its top and in shadow over the sill; a horizon along the lacquer on the wood; the door's shut line a contour in the gilt's own deep shade |
| | the gilt | the strip under the glass polished metal — a bright band over a dark one |
| | the glass | paler under the roof, deep at the sill; each pane framed in a contour of the gilt's deep shade |
| | the rack | a rail lit along its top, in shadow under it, its cross-bars contours |
| | the drum | its lip catching the light; the steel star lit across its upper blades |
| | the bumpers | chrome as chrome is at this size: a dark band under the lit one, a glint along the top |
| | the tyres | each in its well — the arch in shadow, the rubber lit along its top, the dish lit from above over whichever rim is fitted, the hub glinting — and the underbody in shadow along the rocker |
| | the lamps | each a lens lit along its top, with its light round it |
| | the finish | the rim light (`rimLight`) in the gilt brightened |
| **the Thunderbolt** (`drawThunderbolt`) | the tank | a horizon along its top, its belly in shadow |
| | the jugs | finned — three contours across each in the chrome's own deep shade, raked with the jug |
| | the pipe, fork, bars | chrome: a glint along the top over a dark lower edge |
| | the seat, tyres, lamp | the leather lit along its crown; each tyre's rubber lit along its top with the hub glinting; the lamp a glint |
| | the ball | glass: a lit crescent along its upper edge |
| | the Marmot (`MARMOT_ASTRIDE`) | his suit lit across his shoulders and in shadow at the waist, the elbow's crease; the helmet's gloss as a streak round its crown and its lower rim in shadow |
| | the finish | the rim light inside every edge that faces up, the rider's with the bike's (it is one hull since 0612), in the chrome. `drawThunderboltRider`, which the port lays over the bare bike once he boards, lays the same rim over the same height so the two pictures agree |
| **the Hamster Ball** (`drawBall`) | the plastic | deep inside the rim on the side away from the light, where the wall is seen edge-on; a band of bounced light inside that; the room's window as a soft pane on the crown; the moulding seam round it. None of it turns with the ball in the War Dance, because it is the room's light on the ball and not a thing on it |
| | the pack | its casing lit along its upper edge, the nozzle's lip lit, a panel seam |
| | Unity | the light along the fur of their back |
| | the finish | the rim light in the plastic brightened |

**Nothing solid was added.** Every mark is under 0.9 alpha, so `tests/accents.test.ts` holds it inside the box and
not to [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s floor. The silhouettes, the hurtboxes, the
muzzles, the tubes, the cradles and the pods are untouched; the dance poses move every new mark with the body
because each is drawn through the ship's own `box`.

## What the item named that this does not draw

- **"The Duck aboard" the Thunderbolt.** No duck is drawn aboard it: `THUNDERBOLT_RIDERS.duck` is `null`, because
  only the Marmot flies the bike (0612), so there is no drawing to finish. MMXXVI's own ship is the Aqua Duck,
  item 6.
- **The estate's dice.** They are the HUD's walnut plate's dressing in `src/app/chrome.ts`, not the ship, and
  [0466](0466-the-dice-swing-once.md) already drew them as a plush cube with a lit top, a dark side and shaded
  pips — light per face, which is what this pass adds elsewhere. Left as they are.
- **The pods on the estate's rack and the Thunderbolt's fender, and the ball's cradles.** They are shared drawings
  (`paintTurrets`, `paintPylon`) and the queue's item 17, the missiles and tubes, finishes them for every ship at
  once.

## What it looks like, measured

| | sheet, 1080p (85 px box) | at the pad's 365 px |
|---|---|---|
| the estate | a lit roof and rack, glass with depth, the lower burl darker | the panels lit, the rack's bars, the chrome banded, the tyres in their wells, lenses on the lamps |
| the Thunderbolt | the helmet's crown and the bars lit, the rider found against the sky | the finned jugs, the chrome glints, the helmet's gloss, the suit's light |
| the Hamster Ball | the rim lit along its top, the pane on the crown | the plastic's deep side and bounce, the pane, the seam |

## The open calls, from the pictures

Recorded in the report's *answers* for the review at the end, and not asked now (the player asked for the queue at
full auto):

- **The Thunderbolt's rim is chrome.** On black lacquer a rim in the body's own shade is invisible; chrome reads as
  the bike's own metal catching the light. If it reads as a second outline, the one number is the `chrome` handed
  to `rimLight` at the end of `drawThunderbolt`.
- **The ball's window.** A soft pane on the crown is what says *clear plastic* at the pad; at the fight's camera it
  is a lighter smudge above Unity. If it reads as a smudge, it is the `pane` in `drawBall`.

## What guards it

0698's guard in `tests/accents.test.ts` walks the list of finished ships, and the three are on it: every sprite of
each that is not a hurt twin carries a `source-atop` gradient rim at least 2.5 px wide on 1280×720. Three probes in
`scripts/probes/0700-the-estate-the-bolt-and-the-ball-are-finished.mjs`, one a ship: its rim left off.

## Not held by any guard

Whether each reads as *polished* is the player's; the strengths are each ship's own numbers.
