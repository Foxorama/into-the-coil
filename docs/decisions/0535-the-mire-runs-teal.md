# 0535 — The Mire runs teal

**Accepted 2026-10-05.** The Toxic Mire's pools grow along the bed and are joined into one body of acid
that runs green, green-and-teal and teal; the shore comes two lanes down towards them. **Amends
[0352](0352-the-mire-is-a-swamp.md)** (the pools' colour), **[0353](0353-the-acid-bubbles.md)** (the
pools' table) **and [0383](0383-the-mire-floor-is-a-wall.md)** (the shore's lanes), and reaches
**[0384](0384-the-hydra-stands-in-the-acid.md)**'s acid under the hydra, which is the same water.

## The ask

> *"make the toxic pools more toxic - they need to be larger and more interlinked and need more teal
> colouring and blending (like the water in Golf-Stars for the toxic environment) - they should be a mix
> blend of the current greens and bubbles and mix of blended green and teal and teal"*

> *"the ground level sits slightly too high above the pools, it needs to be down a little bit - the pools
> graphic is at a good distance, but the ground level is just a bit high"*

## The rule

**The acid's colour is a property of the water along the bed, not of a pool; every pool and channel is
laid in shared passes so overlapping bodies are one; the teal is a colour the place states, at its green's
light; the shore is two lanes lower and the pools are where they were.**

| | |
|---|---|
| **the pools** | `POOLS_OF.mire`: the upper row five pools of 34 to 43 lanes, where there were four of 19 to 36, each joined to the next by a channel whose surface stands a lane or so lower and overlaps both ends. Their surfaces stay at 116.9 to 118.1 — *"the pools graphic is at a good distance."* The lower row is four, still just off the screen |
| **the colour along** | `tints` on the row: ten stops round one drawing, 0 the place's `lit` green and 1 its `acid` teal. Green, teal, blended, green, and teal running back into green across the wrap; a channel carries one pool's colour into the next |
| **the colour down** | every body keeps its surface's colour for a lane, then goes teal and stays lit to its floor — the predecessor's *glows, not muddies* — instead of falling into the mud as it did |
| **the teal** | `acid` on `LandLight`, optional, stated on the Mire's row alone: `#07585a`, luminance 0.0776 against `lit`'s 0.0779; high-contrast `#052d2f`, 0.0211 against 0.0218 |
| **the blending onto the mud** | three faint widening rings of the water's colour mixed into the land, under every body, so a pool eases into the bank |
| **the lines** | each surface's lit skin and a ripple or two, in the glow — moved to teal over teal water by putting the glow's green into its blue. Lines, as 0352 has always kept them |
| **the shore** | every knot two lanes down: 108 to 115 where it was 106 to 113. The hills are the same hills |
| **the hydra's acid** | 0384's bands go green at the surface into teal under it, and stay lit further down; its lower ripple is in the teal glow |

## Why it is built the way it is

**The predecessor's toxic water was read for one reason and nothing was copied from it.**
`C:\Golf-Stars\src\render\style\hazards.ts`, its liquid family: a lime shore, a neon-green body deepening
through green-teal to a still-luminous teal core, every body's shore laid under every body so two that
touch have no seam, and a halo bled onto the land. Its colours are top-down and far brighter than this
game's floor allows over a lane where shots are read. What crossed is the three ideas — shared passes,
green into teal with depth, a halo — drawn side-on, in this file's terms, at the floor.

**Teal at the floor's ceiling is a dark teal, and that is the luminance floor holding.** The player
accepted floor-capped land colours; the vibrance is the hue and the saturation, as it was for the green.

**Stated on the row rather than mixed in the baker**, so the gameplay floor in `tests/jungle.test.ts`
(0347) holds the new colour against every ink without being told about it. That answers *what else shares
the screen* for the hostile shot: the Mire's `#ff2e6b` and every other ink keep at least the contrast they
keep over `lit`, because the teal is no lighter.

**Every blend is rounded down.** Green `#083008` to teal `#052d2f` rounded to the nearest gains a step of
blue before it loses one of green, and came out at 0.0220 over a ceiling of 0.0218 — the floor guard in
`tests/mire.test.ts` caught it on the first run. A blend whose every channel is between its ends, rounded
down, can be no lighter than the lighter end, because sRGB's curve bends upward. The canvas's own
interpolation between two stops is not something a guard can read, and it is the same blend.

**The bank shelves into a channel.** Banks straight down photographed as a row of boxes; the old lens,
pointed at its ends, left the joins as slivers. A hollow whose banks slope, overlapping the channel by a
few lanes, reads as mud shelving into a stream.

**Two lanes, not more**, because `tests/floor.test.ts` keeps a lane of bank over the highest pool and the
highest is drawn at about 116.4: the shore's lowest knot is 115.

## What it changes in play

**The pools are scenery and still nothing the simulation sees** — 0353, unchanged. What bites is the
shore, and the shore moved: the ship has two more lanes over the whole level. The box's floor is 114 and
the ship's hull reaches two lanes below its centre, one and four-tenths on the forgiving hurtbox, so the
shore at 115 still meets it at every knot. A wave authored above lane 90 is put down where it was written;
one lower is bent two lanes less. The hydra wades in the shore, so it stands two lanes lower.

## What guards it

No new guard. The teal is held by the two floors that already hold the green — 0347's in
`tests/jungle.test.ts` and 0352's in `tests/mire.test.ts` — and 0383's lane of bank over the pools holds
the shore. Probes in `scripts/probes/0535-the-mire-runs-teal.mjs` show both floors see the new colour and
the rounding; 0352's and 0383's probes are re-anchored on the lines this moved.

## Owed

- **A play**, on a deployed URL: whether *"larger"* is met by pools that grew along rather than up. The
  surfaces were kept where the ask said they were good, so on screen the acid is still the bottom three
  lanes; making it visibly taller would move the pools, which is a different ask and the player's call.
- High-contrast was not photographed.
- The mid-boss fight's length over a lower shore was not re-flown with `scripts/weigh-fight.mjs`; 0383
  measured rests from 80 to 96 as changing nothing.
