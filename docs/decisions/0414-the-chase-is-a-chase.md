# 0414 — The chase is a chase

**Accepted 2026-09-29.** Five notes on [0411](0411-the-chase-begins-at-the-port.md)'s intro, from watching
it: longer, a later and slower chaser, a wider shot in space, ships that jink rather than float, and
trails when they jet off.

## The ask

> *"I think the video needs to be slightly longer and the 'floaty motion of the spaceships in space'
> felt really weird"*

> *"I also know that you wouldn't have contour trails in space, but can we add some contour trails when
> they jet off at the end of the space bit?"*

> *"also needs to zoom out about 25% and have slightly more delay on the chase, the chaser should be
> slightly slower off the mark and slightly further behind in space"*

## What changed

- **Longer: 20.1 s, from 16.6.** The time goes where the notes asked for it — before the chaser moves,
  and in the dark outside. `BEATS` in `src/content/port.ts`.
- **More delay on the chase.** The bar's door opens at 5.5 s rather than 4.7, so the hangar stands
  empty with the alarm turning before anyone comes; the fighter spools longer on its pad; and it leaves
  **slower off the mark** — `BLUE_LAUNCH_ACCEL` is 0.05 against her 0.068, and it is still through the
  bay before the hangar fades.
- **The dark outside is framed 25% wider** — `OUTSIDE_ZOOM` 0.8: the ships, their flames, their trails
  and the station are drawn at four fifths of their size about the middle of the view. The stars are
  not scaled: a field at infinity is the same field at any width, and the dots stay crisp. The hangar is
  not zoomed; it is a room composed to fill the screen, and the notes were about the chase.
- **The fighter is further behind** — 40 along its lane where 0411 had 78, which the zoom makes about
  90 units of screen between them.
- ⚠️ **NO MORE FLOATING: THE VIPER JINKS, AND THE FIGHTER FLIES HER LINE.** 0411 had both ships
  bobbing on sine waves and swaying their noses to match, which is two ships drifting. A chase is one
  ship choosing and the other following, so she holds a line and breaks from it three times — each a
  quick move eased at both ends, then held (`JINKS`, `JINK_STEPS`) — and the fighter flies her track
  `TRACK_DELAY` steps late. A ship banks by how fast it is crossing the lane and is level on a held line:
  the move tilts it, and nothing sways.
- **Contrails when they jet off** — the licence the ask took knowingly. From the step each ship opens its
  throttle, two lengths of vapour stream from its wingtips: `TRAIL_SAMPLES` of its own past positions,
  fading with age. The painter is a pure function of the clock (0411), so where the ship was is a
  question it can ask; nothing is stored. A sample is faint where the ship was barely moving, so the
  standing start does not pile a blot on the tip.

## What it costs

At most 28 trail blits per wingtip, four wingtips, only after the throttle opens; no allocation
(`tests/budget.test.ts` holds the painter to the hot list).

## Guards

The ones 0411 wrote hold across the new timeline and the zoom — both ships through the bay and off the
widest screen before their fades, measured in pixels from the blits, so the zoom is inside the
measurement. `tests/intro.test.ts` adds:

- **she jinks and holds**: between breaks her line does not move, and a break is over in `JINK_STEPS`;
- **the fighter flies her line, late** — its line at a step is hers `TRACK_DELAY` earlier;
- **no trail before a ship jets off, and trails after**, off both wingtips;
- **the fighter leaves the pad slower than she did**, and **opens up further behind her**.

`HANDOVER_MS` is re-measured for the longer intro on [0245](0245-a-budget-is-sized-under-load.md)'s
terms: 61 s → 75 s, three times the worst handover measured while the whole suite ran (22.8–24.8 s).

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0414-the-chase-is-a-chase.mjs`.

## Owed

A look: the pacing, whether the jinks read as a chase, and whether the trails want to be brighter.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing persisted.
