# 0665 — The tubes are missiles

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 4. Amends
[0581](0581-the-weapons-sit-right.md)'s loaded tube and [0629](0629-a-launcher-and-not-a-box.md), the last pass.

## The ask

> *"Missile tubes need to look way cooler."*

## What bounds it

A loaded tube is `LOADED_TUBE`, 1.7 units, nose to fins: nine pixels long and two and a half across at the fight's
camera. 0106's floor — a solid mark under 2.5 pixels is not drawn, held by `tests/accents.test.ts` — is what the body
already only just clears. A band, a ring or a stripe painted on it is under that floor, and was tried and refused by
the guard here, as 0581 found before. **So in a run the tube can change its silhouette and its light, and nothing
else**; the painted detail would show only on the hangar's pad, where a tube is a hand's width, and would be a picture
of something the game does not draw.

## The rule

- **The dart is shaped like a missile** — `LOADED_TUBE_HULL` in `src/render/bake.ts`: a pointed nose, small canards
  swept back behind the warhead, and swept tail fins either side of the nozzle, where it was a lozenge with a fin
  at each corner. The body keeps its width, so the lit warhead still clears the floor.
- **Its motor is lit** — a translucent glow in the hazard ink at the nozzle, which at nine pixels still reads as an
  engine where a mark would not be drawn.
- **A turret's warhead is lit at its tip** — the same glow in the impact ink, armed. The ring tried where the cone
  meets its turret was under the floor.

## What the picture did

The saucer on the hangar's pad with one of each, 1280×720 at device scale 2: before, a lozenge with a fin at each
corner; after, a missile — nose, canards, swept fins. The motor's glow is mostly behind the saucer from that side.
**Whether it is cool enough is the player's**, and it is owed the play: the next step past this is a bigger tube,
which is every ship's proportions and is a decision of its own.

## What guards it

`tests/pad-tubes.test.ts`, *0665*: both tubes' drawn hulls have canards wider than the body behind them and fins
swept back from it; the missile tube has a light at its tail. The probes in
`scripts/probes/0665-the-tubes-are-missiles.mjs` take a canard off and put the motor out.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
