# 0241 — The ship wears its colours

**Accepted 2026-09-05**, the same day as [0240](0240-the-blades-reach-the-boss.md), from
[`the-ship-played`](../../reports/the-ship-played-2026-09-05.md):

> *"the lightning… still being too strong. 5% reduction on the range and 1 less max hit… blue
> homing missiles, blue lightning, blue ship, it all looks the same. missiles need to be a different
> colour and our ship needs to look a lot cooler with more colour variance… the thrusters when you go
> up/down don't angle, they move up and down on the ship which is a bug."*

Four items, all answered. **Amends [0230](0230-the-ship-flies.md)**: the flame leans instead of
swaying. **Amends [0194](0194-a-hull-has-a-livery.md)**: the hull carries marks in meaning inks.
**Amends [0238](0238-the-picture-answers-the-second-play-test.md)**: the seeker is not in the ship's
ink. **Amends [0236](0236-the-guns-answer-the-first-play-test.md) and
[0239](0239-the-guns-answer-the-third-play-test.md)**: the arc's ladders, again.

## The rules

**The arc reaches a twentieth less and lands one link fewer at the cap.** `reach` is
`[52, 61, 71, 84, 98]` — every rung five per cent under 0239's — and `links` is `[1, 2, 3, 3, 3]`.
Every rung still climbs by at least a sixth (`THE REACH` in `tests/guns-played.test.ts`) and every
rung still changes something (the last two buy weight and rate). A balance verdict, taken as
stated.

**The seeker wears the ally ink.** `INK_OF.seeker` is `ally` — the ink its own pickup face wears
(0239) and the one nothing else in the lane wears — so a seeker matches the face that offered it
and is off the bolt and off the hull. `THE TWO TUBES` in `tests/seekers.test.ts` holds that it is
neither the missile's ink nor the ship's.

**The hull carries the player's other colours.** A stripe of the pulse's orange down each wing's
leading edge, a light of the core's yellow at each wingtip, and the canopy's glint in the impact
ink — laid on every hull at every tier and under every gun's own marks. 0194 held every livery
ink DARKER than the hull so a decoration would not read as a thing; these are not decorations, they
are the colours the player already owns — the fire they shoot and the light they are hit in — on the
thing that shoots it. Inside the hull and above the accents floor, like every mark.

**The flame leans; it does not slide.** `SWAY` is gone. Every thrust state is baked three ways —
level, leaning for a climb, leaning for a dive — as a shear about the flame's root
(`THRUST_LEAN`, `paintThrust` in `src/render/bake.ts`), so the root stays on the nozzle and the tip
swings. `stepExhaust` puts the flame's centre on the tail on every step and picks the lean off the
across velocity past `LEAN_AT`. `tests/thrust.test.ts` holds the flame on the tail through a climb
and a dive, holds that the bitmap leans and rights itself, and holds that every lean is its own
bitmap. Ten more bakes, on 0233's terms: every picture that can be on screen is its own bitmap.

**And vitest's default per-test budget is a minute.** Three guards timed out under the proof's
baseline in one day — the prewarm, the sky's full bake, the music's grid walk — each 0044's case
exactly, each answered one guard at a time. `testTimeout: 60_000` in `vite.config.ts` is the class
fix; the reasoning is beside it.

## ⚠️ What was rejected

**Rotating the flame at draw time.** `blit` draws a bitmap upright, on purpose (0022); a rotating
blit is a second verb with a cost on every entity that does not need it.

**One leaning frame, mirrored.** A bitmap cannot be flipped either. Ten bakes cost nothing at
draw time and a few kilobytes of atlas.

**A new ink for the seeker.** The ally ink exists, is a meaning ink held to every floor, and is
already the seeker's face. Every ink added costs every palette forever.

**A different hull colour.** *"More colour variance"* is variance, and the `player` ink is what
the HUD, the bolt and the shell are keyed to.

## What is owed

- **An eye on the ship in motion**: whether the lean reads as an angle at the shipped camera,
  whether the livery reads as a livery or as clutter at seven units.
- **The arc's balance**, a third time.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, art, a flight and a test
budget; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0241`:

| broken on purpose | went red |
|---|---|
| the idle's climb frames given its level bitmaps | `every thrust row has frames and a trail` |
| the seeker drawn in the ship's ink again | `THE TWO TUBES: a seeker is told from a missile` |

And `0230` (the lean removed, re-aimed from the sway), `0238` (the seeker in the pulse's ink,
re-anchored) and `0236` (the reach ladder flat, re-anchored): every probe still red.
