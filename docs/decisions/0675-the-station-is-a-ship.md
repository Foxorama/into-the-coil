# 0675 — The station outside is a ship

**Accepted 2026-10-25.** Item 1 of [`the-port-planned`](../../reports/the-port-planned-2026-10-24.md), from
[`the-port-is-a-cutout`](../../reports/the-port-is-a-cutout-2026-10-24.md), answered *"Agree with the suggested
answers"*: the station outside is a ship. It amends [0411](0411-the-chase-begins-at-the-port.md) (the station)
and [0414](0414-the-chase-is-a-chase.md) (the shot).

## The ask

> *The station outside is a ship.* — the Mothership of the fiction, since the clubhouse is aboard one.

The station was a flat slab with a gradient from top to bottom, windows scattered evenly across it, and a door
cut in its side: a cutout, not a ship.

## The rule

| | was | is |
|---|---|---|
| **The silhouette** | a box with two corners cut | a long hull running off the shot's left with a tapered prow; a superstructure along its back with a raked bridge and an antenna cluster (the mast and beacon, a shorter mast, a dish); two modules slung under it, the larger aft; a docking spar reaching out toward the camera with its collar end-on; and a ring round the hull just aft of the prow, which the bay hangs in, its far half behind the hull and its near half over it |
| **The windows** | a scatter, 45 % missing | strips along the decks, runs of three to nine panes with gaps between, about a fifth dark and a fifth warmer, from the same seeded stream (`makeRng('port').stream('windows')`, 0021); and one wide warm pane on the deck the bar is on, the Parrot's Perch looking out |
| **The hull's surface** | a grid | panel lines along the decks and across the frames, raked where the hull tapers, and five plates a shade lighter |
| **The light** | a gradient from above | from the bay. The hull is flat and dark, picked out by a rim light along its upper edges. The mouth is the brightest thing on it, inside a warm spill, with a floodlight over the door and one under it throwing cones back along the prow |
| **The sill** | — | the Viper's burn still hanging in the mouth as the shot opens, in her flame's colour, gone over the shot's first second (`sill`, a new kind) |
| **The planet** | — | the dock's planet (`planet`, `DOCK.planetGrow`), small and far behind in this shot too, falling behind at a tenth of the station's rate, so the chase and Hangin' Out are one sky |

The bay mouth stays where 0411 put it: `+42` along the station's centre and `+2` across. `BAY_MOUTH_ALONG`,
`BAY_MOUTH_ACROSS` and `STATION_ACROSS` in `src/render/port.ts` do not move, so the ships leave the hull where
they did. `PORT_EXTENT.station` grows from 110 to 130. The drawing is at the same scale; the larger box is so the
spill round the mouth, the mast's beacon and the spar's collar are not cut square at its edge, which the first
build's photograph showed at the mouth.

## What it cost and the guards it moved

- **The port's atlas**, measured in the browser with the pilot at the default:
  - At 1280×720 (6 px a unit) it went from 17.62 MB to 18.40 MB. The station is 1.74 MB to 2.43 MB of that, and
    the sill is 144 px square.
  - At 1920×1080 doubled (18 px a unit) it went from 48.89 MB to 51.04 MB, the station 4.84 MB to 6.76 MB.
  - The whole bake took 28–29 ms before and 29–34 ms after at 720p, and 51–78 ms before and 54–87 ms after at
    1080p doubled, three runs each on a cloud container: inside the runs' own spread.
- **Blits in the outside shot**: one more every frame (the planet), and one more in its first second (the
  sill). `tests/budget.test.ts` and `tests/intro.test.ts` are unchanged and green.
- **`tests/station.browser.test.ts`**, *0675*, new. It draws the intro 13 s in, off the painter and atlases the
  shell uses, on vite's dev server as `tests/place-drawn.browser.test.ts` does. It finds the station by its own
  blit and reads three patches' mean luminance in the canvas's pixels. Measured at landing: inside the mouth
  0.796, the hull aft of the ring 0.171, the sky over the back 0.052. It holds the mouth at more than three times
  the hull, and the hull at more than 0.05 off the sky.
- **The plan asked for the hull *darker than the sky above it*.** It is not, and it should not be: the sky
  over the station is space, at 0.05, and a hull darker than that would be a hole. What the plan's sentence was
  for, a hull that reads as a shape against the sky, is what the guard holds, in either direction.
- **The plan said to grep `tests/` for `station` first**, because 0417 names an intro guard it did not write.
  Nothing in `tests/` drew or read the station's picture before this one.
- **`scripts/shot-intro.mjs`**, the instrument this item owes: it shoots the built page, seeds the hangar as
  `shot-menus.mjs` does, presses *Fly*, and shoots a list of seconds after the press at the pair (or
  `--sizes=wide`). The seconds are the wall clock's; on a machine that draws the intro at a few frames a second
  a shot lands within a quarter of one.

Probed in `scripts/probes/0675-the-station-is-a-ship.mjs`: the mouth's light flattened to the hull's ink (it
read 0.40 against the hull's 0.17), and the hull painted the sky's colour.

**Not held by any guard:** the silhouette's parts, the strips' rhythm, the ring and the spar, the floodlights'
cones, the planet's place in the frame. These are the picture's, and a play says whether they read.

**Photographed** with `scripts/shot-intro.mjs` at 12.2 s, 12.4 s, 13 s, 13.5 s and 15 s, at 1280×720 and 844×390.

## What is owed

- A play of the chase's first seconds: whether the ring reads as a ring, and the spar as reaching out.
- The sill glow is the Viper's, as the plan asked, though the ship that has just left the bay is the pilot's;
  her burn is two seconds older. If a play reads it as the pilot's own exhaust, it is the pilot's flame's colour.
