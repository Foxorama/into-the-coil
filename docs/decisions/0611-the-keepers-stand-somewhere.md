# 0611 — The keepers stand somewhere

**Accepted 2026-10-17.** Amends [0569](0569-the-keepers-move.md): the spot *at the ship* is gone, and a
keeper away from their counter stands whole on a floor, in a place of the dock's that holds one keeper at a
time.

## The ask

> *"the moving characters can appear on top of each other - and apparently kinda floating in mid air.
> random locations should be on the elevator, on the ground behind or in front of the vehicle or to the
> sides, or in their shops."*

The screenshot had Unity at their bench and MMXXVI and Cosmo both at the ship: two busts drawn over each
other above the parked ship's roof. Both defects were 0569's. Its draw was independent per keeper, so any two
could land on *at the ship*, and its two at-the-ship spots were twelve world units apart with busts fourteen
wide. And a bust has no feet: 0569 itself said the cut-off shoulders over the roof were *"the first thing to
judge in a look"*, and the look judged them floating.

## The rule

**The dock has places, and a place is the room's** (`DOCK_PLACES` in `src/content/keepers.ts`, a closed
union): where on what floor a keeper standing there has their soles, and how deep in the picture. **A keeper's
row says which places they go to and what they say there** (0282: the row authors its own); all three list
all five today, and a fourth keeper may list fewer.

| place | floor | where | drawn |
|---|---|---|---|
| **lift** | the hover-lift's platform | its middle, riding it up to the mezzanine and down | after the platform |
| **behind** | the deck, at the wall | 19.5 behind the ship's centre, by its tail | before the cradle — its slope and the ship stand in front |
| **front** | the deck, 14 down into it | 6 ahead of the ship's centre, under its nose | after the ship |
| **left** | the deck, 7 down | 34 behind the ship's centre, clear of the cradle | after the ship |
| **right** | the deck, 7 down | 27 ahead, clear of the cradle and of the bay's edge | after the ship |

| keeper | lift | behind | front | left | right |
|---|---|---|---|---|---|
| **Unity** | *"Just ducking up to the bench. Won't be a tick."* | *"Having a squiz round the back of her. She'll be right."* | *"Righto, she's all yours. I bring it all together."* | *"Just standing back for a look. She's coming together."* | *"Tightened a few things up. Bonza."* |
| **MMXXVI** | *"Going up for more colour. Mind the wet bits."* | *"Checking the finish. Hold still — it's nearly perfect."* (0569's) | *"Stand there. No — there. The light's better."* | *"Stepping back to see the whole of her. Art needs distance."* | *"From this side she really sings. We'll make it look good."* |
| **Cosmo** | *"Just heading up to the shop, friend — ride along?"* | *"Just admiring the lines on her. Shop's open — I'll be right there."* (0569's) | *"There you are! Fine machine. Finer still with a little something from the shop."* | *"Taking in the view, friend. Shop's open whenever you are."* | *"Lovely, lovely. Picture her in something new."* |

Each keeper also keeps 0569's **counter** (first, before any run) and **away**, which are their own and
never shared.

- **One keeper to a place.** After a run, `drawSpots` takes the keepers in an order the stream shuffles and
  each draws evenly from their spots that are not a place already taken. The counter and away are always
  free, so a keeper always has somewhere to be. Still the shell's own `keepers` stream (0021): the draw
  consumes nothing anything else reads.
- **Whole, on a floor.** Away from the counter a keeper is drawn whole: a new picture per keeper (`about` on
  the row, `KEEPER_ABOUT` in `src/render/keeper-art.ts`). Each wears its bust's own head — Cosmo's and the
  duck's helmet were split out of the bust painters the way 0554 split Unity's — on a small body: Cosmo in
  the shirt, waistcoat and bow tie with a hand up in a wave; MMXXVI in the white suit and splashed apron with
  a brush held up; Unity off the bench, square, a paw on the hip and the giant wrench over the shoulder. The
  painter is handed the row's `feet` line and stands the soles on it, so the picture and the place agree by
  construction; `tall` and `half` were measured off the bake (the alpha bounds of each baked figure).
- **The lift is ridden.** The keeper on it stands on the platform wherever it is in its round trip, so they
  go up to the mezzanine and come down again. The speech bubble points at the middle of the ride, which the
  layout reads once and the platform is always passing.
- **Unity's roof is gone.** 0569 stood Unity on the ship's roof. The ship hovers and bobs, and the ask's list
  of places does not have it; *on top of each other … floating* was said of the ship's spot. Cut rather than
  argued: it is one row to put back if the player wants it.

## Why the places are the room's and not each keeper's

Overlap is a property of two pictures, not of one keeper. 0569 gave each keeper their own offset at the ship
and they met. A place that only one keeper may hold makes *two in one spot* impossible by the draw, and a
table of places that do not meet makes *two pictures touching* a fact checked once over every draw rather
than a hope per keeper. What stays per keeper is everything that is a character: which places they use,
their line in each, their figure and its size (0282).

## What guards it

`tests/stand.test.ts`, suite **0611 — the keepers stand somewhere**, in pixels of the picture (0027):

- *stands every keeper with their soles on the deck or the lift's floor* — every keeper at every place, at
  four moments of the lift's trip: the soles (the blit's centre plus `feet` at its scale) within a pixel of
  the platform's top and on its ten units, or inside the deck tiles' own drawn band.
- *never draws two keepers whose pictures meet* — every draw the shell can make (each keeper at each spot,
  no place twice), at the same four moments; each keeper a box in pixels, a counter figure its whole baked
  box. No two boxes overlap.
- *draws every keeper a different place after every run* — `drawSpots` over 600 seeds of four runs: no
  place twice, every spot of every keeper reached, every place some keeper's.

0569's *draws each keeper where their spot says* now asks that a keeper away from the counter is drawn whole
and their counter figure is not. `tests/intro.test.ts`'s *draws every piece of the port it bakes* draws
every keeper at every spot, so the three whole figures are drawn somewhere.

Probes, `scripts/probes/0611-the-keepers-stand-somewhere.mjs`: a deck keeper at the ship's riding height
(the reported float), the lift rider a unit over the platform, the bust drawn at a deck place, the draw
forgetting taken places, and the front place moved beside the behind one. Each was applied and seen red,
and the filter of each seen green unbroken. 0569's, 0554's and 0550's probes still find their anchors and
still go red.

**Not guarded:** that the art reads. The photographs did that (each place, each keeper, the lift at the
deck and at the catwalk); whether the duck in the bubble reads at a fifth of the bust's size is the play's.

## Rollback

Nothing irreversible: no storage key, no save field. Spots are an index the shell holds in memory for a
visit. Reverting the change restores 0569.

## Owed

- A look on a deployed preview: every place, and especially **behind**, where the cradle covers half of
  whoever stands there by design — Unity, the smallest, shows from the waist up.
- The player's veto on cutting Unity's roof spot and on keeping *away*, which the ask's list does not name.
- On a phone (0566) the deck's front may sit under the plate; not checked beyond the guards still passing.
