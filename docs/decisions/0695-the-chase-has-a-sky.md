# 0695 — The chase has a sky

**Accepted 2026-10-27.** From the play of 2026-10-27. Extends [0675](0675-the-station-is-a-ship.md).

## The ask

> *"the game intro movie start the planet now shows, but that whole scene could use a bit more pizazz if you
> know what I mean."*

## What was there

0675 put the bay's planet behind the chase so the dock and the chase were one sky. Past the planet the chase
was the star field, two ships and their trails: the camera gathered speed over `OUTSIDE.ramp` steps and
nothing in the picture said so, because nothing beside the ships was there to be passed.

## The rule

**The chase's sky has a sun, a lit planet, rocks and speed in it.** Four kinds join `PORT_KINDS` in
`src/content/port.ts`, and `paintOutside` in `src/render/port.ts` lays them:

- **`sun`**, far off the station's side and falling behind slowest of all — a white-hot core in a warm glow
  with four soft spikes.
- **`halo`**, the planet's air, lit round its limb — drawn under the planet in the chase *and on the stand*,
  so the bay's planet and the chase's are the one planet. The planet itself is a size up and brighter.
- **`rock`**, five of them between the planet and the ships at half the station's rate, each turning its own
  way, dark and lit from above left.
- **`streak`**, the nearest stars drawn out as the camera gathers speed: none under a quarter of the ramp,
  then longer and brighter with the square of the speed, on a span that wraps.

Every number is in `port.ts` beside the frame that reads it; the rocks' positions are two `@setup` arrays,
read every frame and never written, because `port.ts` is on the hot list and allocates nothing in a frame.

## What guards it

`tests/intro.test.ts`: every port kind is baked and seen, so each of the four is drawn somewhere or the suite
goes red. `tests/budget.test.ts`: `port.ts` still allocates nothing in a frame. Nothing new — where the sun
sits and how many rocks there are is a taste.

## Photographs

`scripts/shot-intro.mjs --at=15 --sizes=wide`, before and after, and the stand's planet at 1920x1080.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
