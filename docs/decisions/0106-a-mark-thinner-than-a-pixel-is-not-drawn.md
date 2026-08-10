# 0106 — A hairline is not a mark, and the sky's bounds could not see one

**Accepted 2026-08-10.** Item 1 of
[the-eighth-play-test](../../reports/the-eighth-play-test-2026-08-10.md).

**The sixth pass over the sky's speed, and the first that changes what is measured rather than what is
set.** Five passes moved a rate. This one found that the layer carrying the whole sense of speed was
drawing marks **1.57 CSS pixels across** — and that not one of the six bounds over that layer could
have told anybody.

## The rule

**A sky mark is at least 2.5 CSS pixels across on the view the game is judged on.** It is the only
bound in `tests/budget.test.ts` stated in pixels rather than world units, and the reason is that
**visibility is not a world quantity**.

## What was asked for

> *"The game still feels slow, like the sense of flight and movement still feels like I'm walking
> instead of flying at fast speeds — which is a background thing, there are thin lines that are hardly
> visible, but the default background starfield is slow, not so much the starfield an issue, but the
> slow lines, I don't feel like I'm zooming through space."*

## The previous decision predicted the wrong next lever, in writing

⚠️ **[0103](0103-the-fast-layer-is-in-front.md) said the sky was out of road**: *"at 1.61 the streaks
already overtake a world that scrolls at 36 units a second. If *the background is slow* survives that,
it is *the game is slow* — and `SCROLL_PER_STEP` is where that lives."*

⚠️ **The report says otherwise in the player's own words — *"which is a background thing"* — and the
measurement agrees.** `SCROLL_PER_STEP` is untouched. Writing the prediction down is what made it
checkable; being wrong about it cost nothing because the next session did not act on it blind.

## What the sky was actually doing, measured on the reported view

On a 1280×720 desktop, 7.20 CSS pixels to a world unit:

| layer | marks | drawn width | length | alpha | crosses in | speed |
|---|---|---|---|---|---|---|
| `skyFar` | 90 | 8.5 px | — | 1.00 | 15.0s | 86 px/s |
| `skyNear` | 90 | 4.0 px | — | 0.34 | 6.0s | 214 px/s |
| **`skyRush`** | **10** | **1.57 px** | 152 px | 0.42 | 3.1s | **417 px/s** |

⚠️ **The sense of speed was present and nearly invisible.** That layer was already crossing the screen
five times faster than the starfield the player was watching instead. Twelve hairlines at 42% of
solid, two and a half times thinner than anything else the game draws.

## And every bound over it was green

The streak layer had **six** guards on it and passed all of them comfortably:

| bound | where it sat |
|---|---|
| no mark as big as a bullet | 12% of one |
| thinner than the layer behind it | a third of it |
| ink share ceiling (50%) | 36.8% |
| ink share **floor** (6.25%) | 36.8% |
| aspect ratio over 20:1 | 96:1 |
| depth clearance from the world's rate | 0.61 against 0.03 needed |

⚠️ **THE INK MEASURE IS AN AREA AND THE FAILURE WAS A WIDTH.** `ink` is
`alpha × Σ(πr² + 2r·len)`, so a hairline 152 pixels long and a visible mark 64 pixels long are **the
same number to it**. The layer sat mid-band in a bound that had nothing to say about the thing being
reported, and that bound had governed it for three passes.

⚠️ **The ink FLOOR is the one that stings**, because it was added by
[0097](0097-the-sky-has-layers-and-the-tubes-have-sides.md) for exactly this class of failure — *a
layer can be dimmed out of existence with the whole suite green* — and it still could not see this
one. A floor on area does not catch a mark that has area and no width.

## What moved

| | was | now |
|---|---|---|
| `SKY_MAX_STAR_UNITS.skyRush` | 0.11 | **0.24** — 3.4 px across, from 1.57 |
| `SKY_ALPHA.skyRush` | 0.42 | **0.46** |
| `SKY_STARS.skyRush` | 12 | **10** |
| `SKY.skyRush.depth` | 1.61 | **2.2** — crosses in 2.2s, at 570 px/s |

⚠️ **TWO LEVERS, AND THE REPORT IS WHY.** 0103 moved one per pass on purpose, and that is the rule
when a report names one quantity. This one names **two faults** — *hardly visible* and *slow* — so
answering half of it would buy a seventh report that could not distinguish them either.

⚠️ **The count comes DOWN as the thickness goes up**, because ink scales linearly in both: a mark that
can be seen costs 2.2× whatever else is held equal, and ten thick streaks are more of a sky than
twelve invisible ones.

## The ink ceiling is re-derived rather than relaxed

⚠️ **50% → 70%, on the derivation the 50% used.** The layer now sits at 54.4% with a mark that can be
seen; doubling its count from ten reaches **108.8%**, so the bound still catches the break
[0101](0101-the-sky-is-a-hurry-and-the-boss-holds-back.md) wrote it for and now sits above the state
that answers the report rather than below it.

⚠️ **The dot layers keep the quarter.** A dot competes with the bed and can be mistaken for an object;
a streak in front of the game is the thing the player is being asked to look at going past. The
curtain failure the ceiling used to carry alone now has 0103's own guard as well — one layer in front,
and it must be the streaks.

## Why the pixel bound is stated in pixels

⚠️ **Everything else in `tests/budget.test.ts` is authored in world units and that is correct** —
content must not be authored against a device, which is
[0023](0023-the-long-axis-is-the-scroll-axis.md)'s rule and the reason `spawnAlong` uses
`MAX_ALONG_SPAN`. **Visibility is not a world quantity.** It is a fact about a display, and a bound on
it that is written in world units is a bound that cannot state the thing it is for.

⚠️ **Against the DESKTOP view, with the phone stated rather than guarded.** A thickness fixed in world
units is thinner on a smaller screen — at 480 px the streaks are 0.65 px and this bound would be
unmeetable without making them fat on a monitor.
[0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md) made the game desktop-first; a sky that
reads on a phone is a separate change and wants its own decision.

⚠️ **2.5 pixels, and it sits above the state that was rejected.** The reported mark was 1.57 and was
called hardly visible; the far layer is 8.5 and the near one 4.0 and neither has ever been mentioned.

## What the proof found

⚠️ **Restoring the hairline reddens the new guard and NOTHING ELSE**, which is the claim of this whole
decision as a probe. It also moves the ink share from 54.4% down to 36.8% — **further inside its
ceiling and still above its floor** — so the measure that governed this layer for three passes reads
the restored bug as an improvement.

⚠️ **Eight existing probes were re-anchored**, five of which carried the old streak values on their
*replacement* side and would therefore have reverted this decision's mark as a side effect — breaking
two things at once and reddening the wrong guard.

## Rollback

⚠️ **No irreversible surface** — [0001](0001-revertability-not-risk-rating.md). No storage key, no save
field, no cache prefix, no origin. Four constants and a guard.

## What this does not settle

⚠️ **`SCROLL_PER_STEP` is still untouched and is still the lever after this one.** 0103's prediction
was wrong about *when*, not about *what*: if the game reads as slow with a foreground layer at 570
px/s that the player can actually see, the world's own rate is what is left.

⚠️ **The phone's sky is worse than it was**, in the sense that the gap between what a desktop shows
and what a 480-pixel screen shows has widened. Nobody has reported it and nothing measures it.
