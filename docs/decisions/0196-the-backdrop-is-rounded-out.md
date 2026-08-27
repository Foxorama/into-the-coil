# 0196 — The backdrop is rounded out, and the clouds were spending an accessibility floor nobody counted

**Accepted 2026-08-25.** [0195](0195-a-place-has-its-own-sky.md) gave each place its own field and
closed by naming what it did not do. This is the pass that does it — and the hole it found on the way.

> *"Let's start working on properly rounding out the backdrops, because the enemy variants will need
> to be visually distinct on their level."*

## ⚠️ The hole, and it is the reason this had to come before the enemies

`tests/themes.test.ts` holds every ink to WCAG AA **against a place's backdrop** — against
`THEMES[theme].space`, the **bare** colour. **The clouds are drawn on top of that and nothing had ever
counted them.**

⚠️ **AND THE CLOUDS OVERLAP, WHICH IS THE HALF NOBODY WOULD HAVE THOUGHT TO CHECK.** `NEBULA_ALPHA`
caps a single cloud at **0.22**; measured across a tile, the accumulated cover reaches **0.41** at
Ember Nebula.

| place | palette | cover | bare | with clouds | lost |
|---|---|---|---|---|---|
| Ember Nebula | vivid | 0.41 | 6.00 | 5.04 | **0.96** |
| The Toxic Mire | vivid | 0.27 | 5.92 | 5.05 | 0.87 |
| Ember Nebula | high-contrast | 0.41 | 5.20 | **4.87** | 0.33 |
| The Toxic Mire | high-contrast | 0.27 | 5.13 | **4.86** | 0.27 |

The floor is 4.5. **The worst cell had 0.36 of headroom, unguarded** — so the obvious way to round out
a backdrop, *richer clouds*, would have walked through
[0024](0024-the-accessibility-floor-is-settings.md) without a single test moving.

⚠️ **AND THE WORST INK IS `enemy` IN ALL FOURTEEN CELLS.** That is the answer to why this came first:
**a place's own enemy art has the least room exactly where its sky is thickest**, and Ember Nebula and
The Toxic Mire are where an enemy variant will be hardest to read.

## The rule

**`cloudCover(size, place)` is what a place's weather actually lays over its backdrop**, and every ink
clears the floor against `space` blended by it, in every palette, in every place.

⚠️ **THE FALLOFF IS MODELLED AS LINEAR IN DISTANCE, AND THE ASSUMPTION IS GUARDED RATHER THAN
TRUSTED.** That is what a canvas interpolates between a stop at 0 and a stop at 1 — so
`tests/sky.test.ts` asserts `drawNebula` still has exactly two stops, at 0 and 1, and that the inner
circle still has zero radius. **A third stop makes the model wrong in the direction that lets a
backdrop eat an ink**, and the contrast guard would go on passing.
[0027](0027-measure-the-picture-not-the-model.md) is the rule; naming what would invalidate a
measurement is the whole of it.

⚠️ **AND THE MODEL-FREE ALTERNATIVE WAS MEASURED AND REFUSED.** A bound giving every overlapping cloud
its **full** alpha needs no model at all — and reads **0.63** at Ember Nebula, putting the worst ink at
**4.43** and failing a floor the shipped game does not actually breach. It asks five cloud centres to
coincide. **A guard that correct content cannot satisfy is a guard that gets switched off.**

## What rounds the backdrop out, and every axis is free of that budget

Three axes, chosen because **none of them can move a contrast ratio**:

| axis | what it does | why it is free |
|---|---|---|
| **`clump`** | marks gather into knots and drifts | a statement about **position**. No ink, no alpha |
| **`dim`** | each mark takes less than its layer's alpha | a **reduction**; the layer alpha stays the ceiling |
| **`drift`** | a cloud's soft focus sits off its centre | moves **where** the peak is, not how high |

⚠️ **`drift` IS THE ONLY ASYMMETRIC EDGELESS SHAPE `Pen` CAN DRAW.** There is no transform in that
interface, so an ellipse is unavailable — but `createRadialGradient` takes two circles, and offsetting
the inner one gives weather that piles up on one side and trails off the other with no boundary
anywhere in it, which is the condition [0112](0112-the-sky-has-weather.md) puts on anything this size.

**Measured, on `skyFar`, as mean nearest-neighbour distance — lower is clumpier:**

| place | clump | dim | drift | nearest-neighbour |
|---|---|---|---|---|
| The Approach | 0 | 0.15 | 0 | 28.1 |
| Ember Nebula | 0.35 | 0.50 | 0.55 | 28.3 |
| **Saurian Belt** | **0.8** | 0.55 | 0.35 | **18.3** |
| The Coil Labyrinth | 0.1 | 0.65 | 0.2 | 38.8 |
| **Rime Shelf** | 0.6 | 0.20 | 0.15 | **18.8** |
| The Toxic Mire | 0.25 | 0.70 | **0.7** | 19.1 |
| The Black Heart | 0.45 | 0.40 | **0.85** | 42.4 |

## ⚠️ `npm run prove` reddened four times against this decision's own work

**This is the most a probe run has found in one PR, and every one of them was a guard that looked
right.**

**1 — a guard cannot see its own measurement understating.** The probe that made `cloudCover` take the
loudest single cloud instead of the pile came back **STILL GREEN**: under-counting cover makes the
backdrop look *cleaner*, so the contrast check passes with room to spare. The accumulation is now
asserted directly, against the only thing that distinguishes it — the cover at a piled place must
exceed its loudest single cloud.

**2 — and that new guard caught a flaw in the measurement itself.** It failed on The Approach at
**0.203 against a loudest cloud of 0.205**: a cloud's peak is exactly at its own centre and a grid at
any step can miss it. `cloudCover` reads every centre as well as the grid now. **The cover understated
the sky by under a percent, in the one direction that matters.**

**3 — `dim` was unguarded, twice.** The probe that turns it into a *lift* stayed green against
`tests/budget.test.ts` — first because no helper there could see per-mark alpha at all, and then, once
they could, because *the near layer is quieter than the far one* is a **comparison** and a lift moves
both sides of it. **A relative guard cannot see an absolute ceiling move.** The ink budgets count each
mark's own `dim` now, and the ceiling is asserted outright.

**4 — a probe of 0195's was stranded** on the line `cloudCover` grew a centre pass on. Re-aimed, not
relaxed.

## And a comment was corrected rather than shipped

A first draft claimed `clump: 0` left The Approach *"provably unchanged"*. It does not: drawing the
knots consumes fourteen values before the first mark, and each mark now draws its own `dim`, so
**every place's positions moved.** Nothing guards position stability and nothing should — what would
have been wrong is the sentence, which is the failure
[`two-weeks-on-one-channel`](../../reports/two-weeks-on-one-channel-2026-08-25.md) names about
reasoning that migrates into source headers and drifts there.

## What this does NOT do

⚠️ **A place still draws a dot or a capped line.** Structure, ash and an actual shard are new
geometry; what a place now varies is how many, how big, which way, how bright, how gathered, and what
shape its weather is. **That is the pass this decision is, and the next one is different marks.**

⚠️ **No enemy art moves.** But the table above is what the enemy pass has to be authored against.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the clouds turned up until a place eats an ink the player has to find | `THE HOLE: every ink clears WCAG AA against the backdrop WITH THE CLOUDS ON IT` |
| the cover taking the loudest single cloud rather than the pile | `and the cover COUNTS THE PILE, because a guard cannot see its own measurement understating` |
| a third colour stop, so the modelled falloff no longer matches the drawn one | `and the gradient is still two stops` |
| a mark lifted above its layer's alpha | `THE CEILING: a mark may be dimmer than its layer and never brighter` |
