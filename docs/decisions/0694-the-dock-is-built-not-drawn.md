# 0694 — The dock's outside is built, not drawn

**Accepted 2026-10-27.** From the play of 2026-10-27. Amends [0681](0681-the-dock-dressed.md)'s arm and
[0690](0690-the-spar-is-a-module.md)'s truss.

## The ask

> *"there were some newer additions to the graphics in the space outside the space [station] that look kinda
> dodgy"*

## What was there

0690 made the spar a module — a drum with its window band, dish and radiator — and 0681 reached the dock's arm
in from a wide screen's right. Both carried a truss, and both trusses were the same thing: two flat rectangles
of one grey with a zigzag stroked between them, ending in a flat rectangle. Next to a drum lit from above they
read as a drawing of a truss laid on a painting. The arm's head was a flat box with three dots on it.

## The rule

**A truss is boxed, and a collar is a drum.** `paintTruss` in `src/render/port-bake.ts` paints a back web
dim and a hair up, a bottom chord in shadow with a darker strip under it, a lit front web, a top chord with a
highlight along its edge and a shadow line under it, and a post every fourth bay; `paintCollar` paints an
upright drum lit on its left. The spar's truss and the arm's are both painted by them, so the two cannot
drift apart again. The arm ends in a docking head: a drum, a control pod with a lit window, two clamp jaws
open round a docking ring — a torus lit over its top — with four lights round it, and a beacon on a mast.

## What guards it

Nothing new: this is paint. `tests/intro.test.ts` still holds that every port kind is drawn on the stand or
in the intro, which is what keeps a repainted piece from being a piece nobody sees.

## Photographs

The stand at 1920x1080 and 2560x1080 off the built page with `scripts/shot-menus.mjs`'s seeds, and the intro
at two seconds (`scripts/shot-intro.mjs --at=2 --sizes=wide`), before and after. The arm is on the 2560 shot
only, as 0681 placed it.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
