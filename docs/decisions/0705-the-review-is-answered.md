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

**Done:** the gun is the hull's. `paintEmitter` takes a `skin`, the caddie's own hull ink: from above the housing
is painted in it, lit as the saucer's disc is, with the saucer's own dark rim band carried round it, so what shows
past the rim is the saucer's nose. From the side (`paintRaygunSide`) it is a **fairing**: a shallow blister
faired into the belly under the nose, in the hull's ink and the belly's shading, its top edge the rim line, the
rings' lavender running down its flank to a lens set in its front, the hover light under it. Every mark of it is
still below the rim and it is still far wider than tall, which is what 0587 and 0683 hold; the mouth is still an
edge-on ring as tall as the first ring the gun throws (0493's guard). A ray gun borrowed by another ship keeps its
chrome. *The player did not know what would look better; this is the answer offered, and the next word is theirs.*

## 5. The Viper on the pad

> *"the unlocked venoma krait ship looks terrible compared to the intro title venoma krait ship, it doesn't have as
> much detail or style."*

**Photographed, side by side:** the port's racer (`paintViper`, the chase out of the port) has a dark green hull,
a bright accent along its lateral line with the scales as chevrons under it, a dorsal fin that is a tendril — a
stroke a fifteenth of the frame thick curling over and back on itself — an eye with a slit, a nostril, a mouth line
and two fangs. The pad's (`drawViper`, the fight's own bitmap at hangar size) was pale, its fin a blade a third of
the frame wide at the root, its chevrons dark on the pale hull, one fang.

**Done, in `drawViper`:** the fin is the tendril (`VIPER_FIN`, a tenth of the frame between its edges — four
pixels at the fight's camera), with its outer edge lit and the accent core down its middle; a wash of the port's
dark green over the hull (0.42, under the canopy so the glass keeps its light); the lateral line and the chevrons
in the port's accent — the hull's green lifted toward the acid; a nostril; the second fang, translucent, where
two solid slender fangs were under 0106's floor. The far wing the port shows over the back is still left out,
because the launcher stands there (0666). The inks are still the palette's, not the port's fixed ones (0666).

## What guards it

`tests/the-review-is-answered.test.ts`, two guards in world units with their pixels at 1280×720 beside them
(0027): **each of the fighter's warheads stands at least 2.5 px out ahead of the wing's leading edge at its span,
with its base under the wing** — read off `SHIP_HULL` and the row's `tubeLength` through `LOADED_NOSE_HULL`'s
proportions; and **between each of the ray's rings and the next is at least 2 px of sky**. Three probes in
`scripts/probes/0705-the-review-is-answered.mjs`: the warheads laid forward of the wing, the warheads inboard of
it, and the rings leaned back to 0588's quarter. The accents guard's hull-less list grew by three with its
reason. Everything else here is held by what already held it — the mounts guard, the pad's tubes, 0493's mouth,
0587's side view, 0227's containment and 0106's floor.

## Not held by any guard

Items 2, 4 and 5 are the player's eye. The numbers that move them, if the next word asks: the ball's pods are on
its `slate` and sunk `0.14`; the fairing is `1.5` times the saucer's old drop deep and starts `0.75` of its old
radius back; the Viper's wash is `0.42` and its accent `0.45` above the hull's green lifted halfway to the acid.
