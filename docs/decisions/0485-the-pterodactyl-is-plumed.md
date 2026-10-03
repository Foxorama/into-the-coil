# 0485 — The pterodactyl is plumed

**Accepted 2026-10-04.** Item 7 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 3.1, after [0483](0483-the-pterodactyl-flies.md) taught it to fly. The plan's diagnosis: the body carries
ten rows of painted contour feathers ([0398](0398-the-pterodactyl-is-feathered.md)), and the wings do not.
Each wing was **one filled outline with eleven shafts stroked on it**, so the flight feathers were lines on
a sheet. The flap was eight frames of foreshortening on a step clock at 1.5–2.5 Hz, with no body motion.

## The rule

**The flight feathers are drawn as feathers, and the silhouette is their union.** Each primary and secondary
is its own shape, with a narrow outer vane, a wider inner one in shadow, a dark shaft and a lit edge. The wing's
outline walks out along one feather's leading edge to its tip, back down its trailing edge to where it
crosses the next feather, and out again. So **the slot between two primaries is a real gap of sky**, and
each feather is painted inside the silhouette it helped make. The coverts lie over their roots and the arm
keeps its lit leading edge.

Three things the first photographs showed, and what answered them:

| photographed | answer |
|---|---|
| the slots between six primaries closed by the outline stroked round them | **five primaries, emarginated**: each narrows to a finger over its outer third |
| that outline 2.9 units thick on a 72-unit tile, against the body's 1.8 | **the wings' outline in world units, 1.1**, on the frost ship's terms ([0399](0399-the-frost-is-crystal.md)) |
| a light along a raised wing's vanes, thicker than the foreshortened vane under it | the light **runs only where the vane can hold it**, so it shortens on the upstroke |

**The beat is twelve frames, and the downstroke is the quick part.** `strokeAt` in `src/content/sprites.ts` is
the one description of where in its stroke a wing is. The upstroke takes 0.6 of the beat and the downstroke
0.4, and the bake and the frame both ask it. The holds are 6/5/5/4 a stage, so one beat is
**1.2, 1.0, 1.0 and 0.8 s**, from 0.67, 0.53, 0.53 and 0.4. That is near the second the plan asked for, and it still
quickens as the animal is hurt. 0483's climb still runs it half as fast again on the climb.

**The body heaves.** `Aura.heave` is how far the body rises and falls with the beat: 1.5 units, up on the
downstroke. **The model's body moves, not the picture's** ([0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)).
The heave scales with the slide's share of top speed, so 0483's ease settles it out before a brace. It stops
entirely while braced, so a beam's roots stay on its guns. It never moves more than a sixth of its height in a
step, which covers a stage that opens with a beam before the ease has stopped the hull. 0483's lane guard allows
exactly the row's heave past the edge, and no more.

## Consider the screen

The hull rides up to 1.5 units off its slide, so a shot aimed at it lands up to that much off. That is a
twentieth of its 30-unit body, and it is what the plan asked for. Eight bitmaps more (four frames and their
hurt twins) at the 72-unit tile, inside the bake budget.

## Guards

`tests/quetzal.test.ts`:

- **THE ASKED-FOR ONE, IN PIXELS**: traced at a 1280×720 screen, a line across the primaries near their tips
  crosses **five fingers** on each wing. Every slot between them is wider than **the outline the bake actually
  stroked** plus 2.5 px. The outline width is read off the trace, never from the constant.
- **THE DOWNSTROKE DRIVES**: off the traced hull, the wing spreads from its most raised to its widest in fewer
  frames than it takes to rise again.
- **THE BODY HEAVES, IN UNITS**: sliding at speed, the hull rides at least a unit higher at the bottom of the
  downstroke than at the top of the recovery.

[0250](0250-the-quetzal-screams.md)'s *THE BRACE* holds the heave still through a beam.
`tests/accents.test.ts` holds every feather, shaft and light inside the silhouette on all twelve frames.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0485`:

| broken on purpose | went red |
|---|---|
| the wings' outline at the tile's share, thick enough to close the slots | `THE ASKED-FOR ONE, IN PIXELS` |
| the primaries not emarginated | `THE ASKED-FOR ONE, IN PIXELS` |
| the downstroke the slow half of the beat | `THE DOWNSTROKE DRIVES` |
| the heave the wrong way round | `THE BODY HEAVES, IN UNITS` |
| the heave going on while the hull braces | `THE BRACE` |

## Owed

- **A play of the Saurian Belt's boss**: whether the beat at a second reads as a bird this size, and whether the
  heave reads as flight or as a wobble. The knobs are the holds and `heave.by`, on the row.
- **The plan's 3.3, damage on the pterodactyl**: the wing ladder (primaries missing per stage) waits on
  whether 0480's feather shed says enough.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art, content and a world field reset with
the boss; nothing persisted.
