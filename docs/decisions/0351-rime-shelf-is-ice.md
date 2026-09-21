# 0351 — Rime Shelf is ice

**Accepted 2026-09-21.** Item 5 of [`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md),
built by the loop in [`how-the-places-get-painted`](../../reports/how-the-places-get-painted-2026-09-21.md).
**Uses [0347](0347-the-belt-is-a-jungle-under-a-live-volcano.md)'s three mechanisms** — a far range in
its own layer, land lit in stated colours, and a sky that grades — for a second place. **Amends
[0221](0221-a-planet-is-not-a-space.md) and [0222](0222-the-background-is-not-black.md)**: the shelf
is redrawn and the blowing shards become snow.

## The ask

> *"Needs to be far far more icy — different whites and blues and aquas and teals etc."*

Answered on the handover: *"let's go with an off-white balanced colour for rime shelf, I'll see how it
plays out"* — no pure white, and neither the floor nor the foe inks moved.

## What the player sees differently

A line of faceted bergs standing out of a cold haze in the distance, and in front of them a cliff of
seracs along the bottom of the screen: aqua faces over a deep blue body, sunward facets in a pale
slate, a pale coping along the crest, thin crevasses with a thread of aqua down them, and a lower
shelf of broken floes. The sky deepens overhead and hazes towards the bergs, and what moves in it is
snow — fine specks and short spindrift — where there were long parallel strokes that read as rain.

## Everything that was on the screen, and what became of it

Photographed at 1080p before a line changed:

| on screen | verdict |
|---|---|
| flat steel-blue sky | **graded** — `SkyStyle.daylight`, deeper overhead and a haze towards the bergs |
| teal strokes a fifth of the screen long, all parallel | **replaced** — specks. Shortened to a fifth they still read as rain; crossed, as hash marks |
| long faint dark streaks (`skyRush`) | **kept, shortened** — `length` 0.55 → 0.18; spindrift rather than rain |
| clouds, near invisible | **kept** — weather, and faint is right under a fight |
| two flat dark terraces with two triangular ridges each | **replaced** — the bergs and the ice cliff |

## The white that cannot be

**The palest ice is as pale as the floor allows, and that is not white.** Every colour a planet's
land is lit in is held against every gameplay ink at 3:1 (0347). The darkest ink sets the ceiling:
`void`, a magenta at luminance 0.35, needs what it crosses under **0.083** on the vivid palette; on
high contrast `fire` sets it at **0.032**. A white is about 0.8. So *whites* here are the palest tones
the place holds rather than white ones, and they read as the light on the ice because everything
around them is darker:

| | vivid | worst ink | high contrast | worst ink |
|---|---|---|---|---|
| `lit` — the palest ice, facets and coping | `#3c5062` | 3.17:1 | `#1e2a36` | 3.41:1 |
| `canopy` — the aqua faces | `#0d5462` | 3.24:1 | `#0a2c36` | 3.44:1 |
| `far` — the bergs | `#1c4a60` | 3.63:1 | `#082634` | 3.67:1 |

**A real off-white is the player's lever, not this pass's**, and it is one of two: an ink change
(`void` and `fire` brighter, which is every place's picture) or the floor itself. Neither was taken,
as answered. The probe that states `lit` as `#dfeef2` puts `player` at **1.20:1** on it.

## The rules

**Rime Shelf states its land** — `ThemeRow.land`, the field 0347 made — and **everything the shelf and
the bergs paint is mixed down from those three**: shadows, crevasses, floes, gradient stops. A mix of
colours under the ceiling is under it, so 0347's guard over the three stated colours holds every
pixel of the land — and `tests/ice.test.ts` holds *that*, reading every colour both painters put down.

**The ice is faceted.** Crests are sampled at a fixed number of knots and drawn straight between
them; under each segment hangs a flat face down to a foot that varies knot to knot, so neighbours
share edges and the band reads as one cut face. Each face takes the light by its lean — rising to the
right is sunward, falling is shadow, nearly level is the face's own colour. Every profile is whole
cycles per tile, so it meets itself at the seam.

**The bergs are a far range** — `RANGE_OF.rime`, drawn in 0347's `skyRange` layer, slower than the
shelf. The opaque-mass and skyline guards that hold every planet's land hold it.

**The sky grades** — `daylight: { mid: 0.4, deep: 0.5, horizon: 0.6, haze: 0.15 }`.

## What it cost

- **The sky's room.** Measured with `scripts/weigh-sky.mjs`: the specks cut the counted cover from
  0.280 to **0.125**, and the haze spends most of it back, to **0.256**. Worst ink: vivid `void`
  **3.28 → 3.37:1** (room 1.09× → 1.12×), high contrast `fire` 3.81 → 3.89:1. A haze of 0.25 took it
  to 1.02×, below where the place started, and was refused.
- **The land's room** is the table above: the palest ice's worst ink is at 3.17:1, 1.06× the floor,
  on purpose — it is the *"as far as the floor allows"* of the answer.
- **Memory.** The `skyRange` bitmap, the size of the ground's, as 0347 measured for Saurian Belt.

## Considered, and owed a play

**The whites.** The answer was *"I'll see how it plays out"*, and what plays is the palest the floor
permits. If it does not read as icy enough, the levers are the two above, and they are the player's.

**The foes.** Rime's hulls are blue ice (`#5c9ad0`) over teal and aqua ice; `tests/foes.test.ts`
holds them against the backdrop and passes, but whether a body over the cliff reads at a glance is a
question for the preview, per [0295](0295-a-ranking-guard-is-a-content-limiter.md).

**Not done:** anything that moves in the sky beyond the snow — an aurora was considered and not built,
because the room it would spend is the room the haze already spent.

## The guards, and that each was seen to fail

`tests/ice.test.ts`, plus the existing guards Rime Shelf now falls under. Five breaks in
`scripts/probes/0351-*.mjs`, each red:

| guard | the break |
|---|---|
| nothing the ice paints is brighter than its palest stated colour | the crest coped in an off-white; the floes mixed up rather than down |
| every colour a planet's land is lit in keeps every ink (0347) | `lit` stated as an off-white — `player` at 1.20:1 |
| no compact structure mark is a bullet's size (0222) | the specks at the shards' old width — **1.8** units. ⚠️ The first draft of the snow reached 1.9, and this guard is what caught it |
| every ink clears the floor over everything the sky draws | the haze at 0.45 — `enemy` at 2.50:1 |

**Re-anchored:** 0221 (the ground's table line) and 0222 (the shards' width), both proved.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
