# 0705 — The review is answered

**Accepted 2026-11-01.** The player's one review of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md) — asked for as
*"I'll review once it's all done and we can make changes then"* — came back as five items, and this is the five
answered in one change, on [0698](0698-the-fighter-is-finished.md)'s terms where they are art. Each item below
says what the review saw, what the picture showed when it was photographed, and what was done; the review
was given off a page of the game's own screenshots, and the same page now carries the after.

## 1. The fighter's tubes

> *"the missile tubes on the fighter look bad — it should just be a couple of rocket heads poking out from under
> the rear wings — something like a F14 would look like from above."*

**Photographed:** a 1.7-unit dart (`dart` look) at 1.76 across, where the wing is 0.9 of a unit deep: on the bench
at 2× most of each dart showed, its nose ahead of the wing and its fins behind, lying over the wing root; on the
pad, fitted, the same at four times the size.

**Done:** the fighter's tubes are the cars' `nose` look — the warhead alone — 1.2 units long (`FIGHTER_WARHEAD`),
at 1.5 across and −0.05 along on its row: the point stands 0.47 of a unit out ahead of the wing's leading edge
and the cone's base lies under the wing, its inner corner under the hull. The row already hung them `under`
(0662). *First placed at 1.9 across, a unit long: the cone's outer corner stood past the wingtip beside the
wingtip's lamp and was all that read; moved in and forward, and photographed again.* The places are the row's,
so where a missile leaves moved with the picture (0448), and four older probes that anchored on the old line
were re-anchored (0051, 0077, 0097, 0581).

## 2. The Hamster Ball's tubes

> *"the tubes on the hamster wheel also look pretty bad, should be closer to the tubes on the lil caddie or the
> same as the lil caddie so it's consistent."*

**Photographed:** a slate cradle on a stub of axle either side, the dart lying over it.

**Done:** the caddie's own pods, off the ball's sides where the cradles were. `podDetour` and `paintPod` take the
hull's radius and the pod's axis (the caddie's are their defaults) and `ballHull` cuts the pod's detour into the
ball's outline where the axle stub was, so the pod is silhouette as the caddie's is (0227). On the ball the pod's
pylon is its slate and runs 0.14 into the ball — the axle, seen through the plastic — because the ball's rounder
side left a pylon starting at the hull under 0106's floor (2.08 px). The ball's tube places are the pod's
warhead point, as the caddie's are. Consistent because it is the one drawing, which is what the ask said.

## 3. The ray's rings

> *"The four rings pulse from the lil caddie don't actually look like a pulse of four separate rings, it looks
> connected like a band of energy."*

**Photographed on the bench at 4×:** one lavender cone. The four rings stood 0.42 of the frame apart with the
biggest two 0.21 and 0.175 wide, so their edges touched, and 0588's dark field (a cone the length of the train)
and a glow across the whole train filled what was left between them.

**Done:** the train spread to the frame's ends (`RAY_RINGS`), each ring a sixth as wide as it is tall
(`RAY_RING_LEAN`) and never narrower than 0.1 of the frame, with its own small glow — and no field. Between the
rings is sky: 2.7 to 3 px of it at 1280×720. The field was the ray's hull, so the ray, its ripple and its swell join
the burst and the spark on `tests/accents.test.ts`'s hull-less list, with the reason beside them.

## 4. The caddie's ray gun

> *"I'm still not happy with the side or top down view of the ray gun for the lil caddie but I honestly don't
> know how to make it look better, it just doesn't look like part of the ship design at the moment at all."*

**Photographed:** from the side, a chrome saucer on a stub under the nose with a mouth bigger than itself — a thing
bolted on; from above, a chrome cap past the rim with a lavender lens. The sixth drawing of this gun (0461, 0463,
0467, 0493, 0587, 0683): every one a chrome object of its own, and *part of the ship* is what none of them was.

**Done, twice.** First the gun was made the hull's in the old shapes — the housing in the hull's ink from above,
a fairing on the belly from the side — and the player's word on that was *"the new ray gun if anything looks
worse. maybe make it a node with a purple ring glow or something?"*, with, on the Viper and the ray gun both,
*"the viper in play needs to match on the pad, same with weapons like the ray gun."* The fight draws the saucer
from above and the pad from the side, and every ray gun so far was two drawings, one a view.

So the gun is a **node**: a ball — the one shape that is the same drawing from any side — half sunk into the rim
at the nose, the hull's own deep shade, the rings' lavender lit in its heart, and a **ring of that light round it**
(`paintEmitter`, `paintNodeHalo`). From above (`paintRaygun`, before the disc, as 0493 asks) the ball's front
stands past the rim and the ring is painted over the rim so it is whole; from the side (`paintRaygunSide`,
`paintRaygunSideHalo`) it is the same ball sunk into the nose on the rim line — painted before the hull, which
covers its back half — and the same ring over it. *First hung under the nose, whole, with the ring reaching up to
the rim: "the side view is a hard no."* On the rim it rises its own radius above the rim line and no more, under
the dome and out of the pilot's line of sight, which is 0683's claim kept on a bead. Borrowed on another ship it
is the same node on that ship's mount, in slate. The row's muzzle moved to the node's front (0.88 of the box from
0.96) and the mounts guard moved with it.

Two guards went with the saucer: *A RING IN, A RING OUT* (0493: the mouth as tall as the first ring thrown — a
node has no mouth) and 0587's *wider than it is tall* — each replaced or deleted with its note in
`tests/mounts.test.ts`, their probes likewise. What holds now: from the side the node sits on the rim at the nose
and no higher than its own radius above it (0683's claim on a bead), **it is round, and it is the one node from
above and from the side** — the fight's as round as the pad's, and its ring reaching as far.

## 5. The Viper on the pad

> *"the unlocked venoma krait ship looks terrible compared to the intro title venoma krait ship, it doesn't have as
> much detail or style."*

**Photographed, side by side:** the port's racer (`paintViper`, the chase out of the port) has a dark green hull,
a bright accent along its lateral line with the scales as chevrons under it, a dorsal fin that is a tendril — a
stroke a fifteenth of the frame thick curling over and back on itself — an eye with a slit, a nostril, a mouth line
and two fangs. The pad's (`drawViper`, the fight's own bitmap at hangar size) was pale, its fin a blade a third of
the frame wide at the root, its chevrons dark on the pale hull, one fang.

**Done, in `drawViper`:** the fin is the tendril (`VIPER_FIN`, a tenth of the frame between its edges — four
pixels at the fight's camera), with its outer edge lit and the accent core down its middle; the lateral line and
the chevrons in the port's accent — the hull's green lifted toward the acid; a nostril; the second fang,
translucent, where two solid slender fangs were under 0106's floor. The far wing the port shows over the back is
still left out, because the launcher stands there (0666).

**And her body is the port's green.** The first pass washed the palette's pale mix darker (0.42) and the player's
word was *"the viper in play needs to match on the pad"* — the ship in play, on the pad and in the chase out of the
port are to be one ship. So `drawViper`'s body is `VIPER.body`, the port's own ink, lifted a quarter of the way
toward the palette's venom green (0666's mix), and the wash is a light one (0.15). 0666 refused the port's fixed
inks so a palette could answer the hull; a quarter of the palette's answer is kept, so the high-contrast palette
still lifts her, and the default palette shows the port's Viper. The port's own drawing (`paintViper`) is
unchanged: it is the one the player held up.

## What guards it

`tests/the-review-is-answered.test.ts`, two guards in world units with their pixels at 1280×720 beside them
(0027): **each of the fighter's warheads stands at least 2.5 px out ahead of the wing's leading edge at its span,
with its base under the wing** — read off `SHIP_HULL` and the row's `tubeLength` through `LOADED_NOSE_HULL`'s
proportions; and **between each of the ray's rings and the next is at least 2 px of sky**. Three probes in
`scripts/probes/0705-the-review-is-answered.mjs`: the warheads laid forward of the wing, the warheads inboard of
it, and the rings leaned back to 0588's quarter. And in `tests/mounts.test.ts`, on the node: **from the side every
mark of it is below the rim and it is round**, and **from above it is as round and its ring reaches as far** —
two more probes there: the node flattened to a lens, and the side view's node drawn smaller than the fight's.
The accents guard's hull-less list grew by three with its reason; the 0493 guard reads only solid marks as the
housing, since the ring of light is painted over the rim. Everything else here is held by what already held it —
the mounts guard, the pad's tubes, 0493's lip, 0227's containment and 0106's floor.

## Not held by any guard

Items 2, 4 and 5 are the player's eye. The numbers that move them, if the next word asks: the ball's pods are on
its `slate` and sunk `0.14`; the node is `0.2` of the box across with its ring at `1.35` of that and its glow at
`1.55`, hung `0.32` under the rim from the side; the Viper's body is the port's green lifted `0.25` toward the
palette's, her wash `0.15` and her accent `0.45` above that green lifted halfway to the acid.
