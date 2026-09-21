# 0347 — The belt is a jungle under a live volcano

**Accepted 2026-09-21.** Item 3 of [`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md),
built by the loop in [`how-the-places-get-painted`](../../reports/how-the-places-get-painted-2026-09-21.md).
**Builds the plan's mechanism 2** — a backdrop that moves — for the first time. **Amends
[0224](0224-the-mountain-is-awake.md)** (the swell goes, the volcano is redrawn and re-placed),
**[0221](0221-a-planet-is-not-a-space.md)** (a planet may have a far range, and its land may be lit)
and **[0346](0346-the-pillars-fill-the-sky.md)** (a landmark bakes at the size it is drawn).

## The ask

> *"The volcano is one pulsing graphic that doesn't touch the sky and isn't actually firing any rocks
> or anything, the closer layers and sky layers are a monotone blue with no detail to them, it doesn't
> scream jungle world at all."*

## What the player sees differently

A sky that deepens overhead and hazes at the horizon; misted mountains far off, a green canopy with
sun on its crowns and taller trees standing out of it, and dark fronds going past along the bottom;
and volcanoes whose smoke climbs out of the top of the screen while they throw glowing rock in arcs —
harder at each section, with the music.

## Everything that was on the screen, and what became of it

Photographed at 1080p before a line changed (the handover's rule, and
[0343](0343-the-stars-are-drawn-for-a-desk.md)'s *an item is the whole place*):

| on screen | verdict |
|---|---|
| flat `#16305a` sky | **graded** — `SkyStyle.daylight`: towards the land colour overhead, a soft blue haze at the horizon |
| clouds, near invisible | **kept**, now in that haze blue; they are weather, and faint is right under a fight |
| 21 dark specks, *"the belt"* | **removed** — at 1080p they read as dirt on the glass |
| three ridgelines: random walks, straight segments, one blue-black | **replaced** — a far range in its own layer, and a jungle in the ground's |
| **a vertical seam through the ridges at every tile join** | **fixed for every planet** — see below |
| volcano: a flat-topped plume clipped by its bitmap, straight lava, seven baked dots, a scale-swell | **redrawn** — smoke to the top of the screen, shaded cone, gullies, lava that glows; the swell and the dots go, and live rock replaces them |
| `skyRush` streaks | **kept, with a reason**: over a planet they are ash on the wind, and the only fast layer — 0221's argument that a sky needs a spread of rates |

## The rules

**A planet may state a far range** — `RANGE_OF` in `src/render/bake.ts`, a table over the places on
`GROUND_OF`'s terms, drawn in a new `skyRange` slot after the weather and before the ground at depth
0.2. `skyFor` gives a place with one `SKY_UNDER_A_RANGE`, which is `SKY_ON_A_PLANET` with the layer put
in, so the two cannot drift. Rime Shelf and The Toxic Mire state none and are unchanged. The opaque and
skyline guards that hold the ground now hold the range too.

**A planet's land may state the colours it is lit in** — `ThemeRow.land`, optional
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)). `ground` stays the darkest
thing on the screen; these go over it. **Every one is held to the gameplay floor**, because the bottom
third of the lane is land on a planet and the fight is read over it. That is why this jungle is a deep
one: `void` needs the backdrop under luminance 0.083, green is the channel luminance weighs most, and
the sunlit crowns sit at 0.065 — **1.15× the floor, spent on purpose**. Saturation makes them green
and is free.

**A sky may grade.** Deepening the top only darkens, so nothing counts it; the haze is light, has a
painter of its own outside `drawNebula`, and **`skyCover` counts it** row by row as a two-stop linear
gradient. The haze's colour is kept under `glow`'s luminance, so the loudest colour the floor charges
the sky at does not move — but the cover does, and that is a real cost, below.

**A landmark may throw rock** — mechanism 2. `LandmarkEntry.erupts` (count, period, rise, reach) is on
the ENTRY, so the three volcanoes escalate with `push`, `surge` and `approach`. The crater is
`coneOf` in `src/content/volcano.ts`, read by both the baker and the frame, because the frame may not
reach the baker and a crater computed twice is two craters. `VENT_OF` says which places have one.
**Rock `k` of a landmark is a pure function of the sim's step count and `k`**: which throw it is on is
hashed into side, reach, height and apex; nothing is pooled, remembered or drawn from a stream
([0021](0021-one-stream-per-concern.md)). **It rides the sim's clock and not the camera**, which is
the one time source in `src/render/scene.ts` that is not `cameraAlong` — the camera stops for a fight
and a volcano does not. One blit a rock, turned to its heading by `blit`'s own angle, cooling by
shrinking.

**Opaque sky tiles overlap by a pixel; translucent ones meet.** A tile lands on a fractional pixel and
the pixel it shares with its neighbour is covered partly from each side, so land showed a hairline of
sky at every join — on all three planets, since 0221. `SkyLayer.opaque` says which. The first version
overlapped every layer and the weather's deepened sky drew a dark line down the screen instead.

**A landmark bakes at the largest scale any entry of its place draws it at.** 0346 named this lever
and left it; at 1.4× a volcano was 40% softer than every other edge on the screen.

## What it costs

- **Memory.** `skyRange` is a bitmap the size of the ground's — 16MB at 1080p, in every atlas, as
  `skyGround` already is. Baking landmarks at their drawn size costs about 7MB more for Saurian Belt's
  three and about 13MB more for the Pillars'. Desktop is the target
  ([0153](0153-desktop-is-the-target.md)).
- **Draw calls.** Measured, walking the level five units at a time on three views: the worst frame is
  all three volcanoes and their 24 rocks, **27 blits**. `ERUPTION_BUDGET` is 40, owned here.
- **Contrast.** The canopy's lit crowns at 1.15× the floor. And the sky, measured with
  `scripts/weigh-sky.mjs`: cover 0.133 → **0.306**, worst room **1.46× → 1.18×** vivid and 1.47× →
  1.37× high contrast. ⚠️ **That is the model's worst case and it is kept conservative on purpose**:
  it charges the whole cover at `glow`, the gold, where the haze is drawn in the weather's dimmer
  blue; and most of the haze lies under the far range, which the model does not subtract. Refining
  either would buy the number back without changing a pixel, which is the wrong way round. Rime
  Shelf's 1.09× is still the tightest in the game.

## Considered, and owed a play

**A rock shares the lane with the player's orange shots and the foes' red ones.** What separates it: a
tail, an arc, a slow drift with the mountain, a head under the smallest shot
([0069](0069-the-sky-is-behind-the-game.md)'s band, held), and a body a third of the way to coal so
the brightest thing about it is a small core. The boss-fight photograph is what asked for the dimming.
Whether that is enough is a question for the preview, per
[0295](0295-a-ranking-guard-is-a-content-limiter.md) — **not answered by a threshold**. If it confuses,
the levers are fewer rocks, cooler inks, or throws kept above the lane's middle.

**Not done:** a comfort setting that switches the moving backdrop off
([0024](0024-the-accessibility-floor-is-settings.md) allows one; nothing has asked).

## The guards, and that each was seen to fail

`tests/jungle.test.ts`, in player units, each broken by `scripts/probes/0347-*.mjs`:

| guard | the break |
|---|---|
| every volcano's smoke leaves the top of the screen | the first volcano stood lower. ⚠️ The first probe shortened the plume and came back **STILL GREEN**: the guard measured the highest point drawn, and a plume that wide overruns its bitmap whatever it does. What the player sees stops at the bitmap's edge, so the guard now clamps to it |
| the crater is on the screen, above the land | the last volcano stood lower → *lane 53, behind the range at 53* |
| rock climbs out of the crater and comes down behind the land | the rock pinned to the crater |
| the camera stops and the volcano does not | the rock placed without the clock |
| a rock's head is under the smallest shot | head grown to 2.4 units |
| an eruption only where there is a vent | the vent removed |
| every land colour keeps every ink over the floor | a daylight green → `player` at 2.92 |
| the haze is counted | the haze left out of `skyCover` |
| opaque tiles overlap, translucent ones meet | each half broken separately |
| the landmarks' worst frame is inside its budget | forty rocks → 56 blits |

**Three guards changed, each for a reason:** 0211's *every place draws structure* allows a planet whose
structure is its land; 0346's *only the Pillars state a scale* is now the mechanism — an entry that
states none is drawn at 1 — because a list of which places may use a field is 0295's content limiter;
and 0224's *feet in the ground* now counts the entry's scale (a hole 0346 opened) and every layer of
land drawn over it, and folds its points rather than spreading several thousand into `Math.min`.

**Re-anchored**, each on only what it breaks: 0204, 0221 (three, and one added for the range), 0222
(the specks were the only compact marks left, so its break is a rock put back), 0224, 0225 (the old
break left three different cones and would have stayed green) and 0346.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
