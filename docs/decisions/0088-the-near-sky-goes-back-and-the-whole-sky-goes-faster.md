# 0088 — The near sky goes back, and the whole sky goes faster

**Accepted 2026-08-09.** Two lines of one play-test, against the build carrying
[0069](0069-the-sky-is-behind-the-game.md), [0078](0078-the-sky-moves-a-third-faster.md) and
[0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md).

**Third pass over the near layer's prominence; second over the sky's speed.** Both previous answers
were right and neither went far enough.

## The rule

**The near starfield is pushed back on every axis that costs nothing — alpha, size, count — and both
layers move at twice the rate [0065](0065-the-sky-is-baked-and-blitted.md) shipped.**

## What was asked for

> *"The closer starfield needs to be much further backgrounded, still distracting."*

> *"And the background needs to move faster, still feels really slow."*

## The two halves pull against each other, and the hand that reported them chose

⚠️ **In a parallax model *further back* means SLOWER**, and the second line asks for faster. Put as an
explicit question with three options — dim it, slow it, or both and buy the speed from the far layer
— and the answer was **dim it**:

> *Keep its parallax depth (it's what makes the sky feel fast) but cut its visual weight hard.
> Distraction is contrast and size, not speed.*

⚠️ **So the two lines are compatible and the reason is worth writing down**: what makes a background
distracting is how much of the eye it takes, and what makes a game feel fast is how quickly things
cross it. They are different quantities and this decision moves them in opposite directions.

## The numbers, and every one of them is the same lever pulled harder

| | 0065 | 0069 / 0078 | now |
|---|---|---|---|
| far depth | 0.12 | 0.16 | **0.24** |
| near depth | 0.3 | 0.4 | **0.6** |
| near alpha | 1 | 0.4 | **0.18** |
| near star radius | 1.2 | 0.35 | **0.2** |
| near star count | 34 | 55 | **90** |

⚠️ **`4/3 × 3/2 = 2`.** 0078 took *"about 1/3 faster"* and this takes *"still feels really slow"* at
half as much again, and the two multiply out to exactly double what 0065 shipped.
`tests/budget.test.ts` holds it as the **product** rather than as a 2, because they are separate asks
from separate play-tests and a third one multiplies onto this rather than replacing it.

⚠️ **Both layers, by the same factor, for the third time.** 0078's rule: scaling one buys the speed
out of the depth cue, which is the one thing a two-layer sky is for. The ratio between the layers has
not moved since 0065.

⚠️ **In the units a hand can judge**: a near star now crosses the narrowest view in about **8
seconds** where it took twelve, and a far one in about twenty where it took thirty.

⚠️ **The near layer is at about 2% of the far layer's ink** — `alpha × Σπr²` — where it was around
half.

## More stars is what further away looks like, and that inverts 0069

⚠️ **`SKY_STARS` said the near layer must be SPARSER than the far one**, on a real argument:
fast-moving dots near the player's eye compete with a bullet, so the layer that moves gets fewer of
them. At a radius of 0.35 that was right.

**At 0.2 it runs the other way.** A near star is a third of a far star's radius, so ninety of them put
a ninth of the far layer's ink on the screen per dot before the alpha is counted — and *many small
faint points* is what a distant field looks like, which is the argument 0069 itself makes about size.
The two layers now carry the same count.

## The speed ceiling moved, and something paid for it

⚠️ **`tests/budget.test.ts` held every layer under a depth of 0.5 and now holds them under 2/3.** A
loosened bound with no argument behind it is a bound that will loosen again, so this one is tied to
what bought it: **the reason a depth ceiling exists at all is that a fast layer competes for the eye,
and a layer at 2% of the other's ink competes less.** The ink guard and the speed guard are one trade
and the test says so in both places — loosen the speed without the ink going with it and the argument
is gone while both tests stay green.

⚠️ **0065's *at 1 the sky moves with the world* is untouched** and is still the reason there is a
ceiling. What moved is where inside it the line sits.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0088-sky-back-and-faster.mjs`.

| broken on purpose | went red |
|---|---|
| the near layer's alpha returned, so the layer that moves fastest is loud again | `and the near layer is the quiet one, on every count that buys attention` |
| only the far layer sped up, so the parallax pays for the speed a second time | `scales BOTH by the same factor, so the depth cue is not what paid for the speed` |
| the near layer returned to the fewer-and-bigger dots it had before | `and the near layer is the quiet one, on every count that buys attention` |

⚠️ **The interesting break is the TRADE, not the number going back.** 0069 and 0078 already own *the
alpha returned* and *the depth returned* as breaks of their own rules; what only this decision can
break is the ink that the loosened speed ceiling was argued against.

⚠️ **Five probes across three decisions were re-anchored** — 0069 twice, 0078 twice and 0080 once —
and one of 0078's was **renamed** rather than re-anchored, because this decision retitled the guard it
names. `anchorFailures` reported the five in a second and could not see the sixth; only a whole-set
`npm run prove` can, which is the same gap 0085 hit yesterday.

## The ink bound was a fifth for one commit, and two of these three probes came back STILL GREEN

⚠️ **The reasoning written beside it was *a drift detector, not the measurement*, and a drift detector
that cannot detect the drift is not a guard.** Restoring the near layer's old alpha — the exact value
the player called distracting — left the ink at 4.4%, comfortably inside a 20% bound. So did restoring
the star size, at 15.1%.

⚠️ **A bound has to sit below the smallest break it must catch, and that is the only principle
available.** Anything looser is a rule the code can break with the suite green.

| | ink, as a share of the far layer |
|---|---|
| now | **2.0%** |
| the alpha alone put back | 4.4% |
| all three levers put back — 0069's layer | 8.3% |
| the size alone put back | 15.1% |

**A twenty-fifth** is under the first of those and twice the current value. It is a tighter guard than
this repository usually writes over a tuned number, and it earns it: the quantity is deterministic —
`skyField` bakes from a seeded generator — so there is no run-to-run margin to leave room for.

⚠️ **This is [0019](0019-a-probe-must-be-seen-to-apply.md) doing the job 0027 cannot.** The bound and
the decision agreed with each other perfectly; what they did not do was disagree with the build the
report is about.

## What this does not settle

**Whether it is enough this time.** Three passes have now been made at *the near layer is too
prominent* and two at *the sky is too slow*, and every one of them was a real change that the next
play-test asked to go further. The levers that are left are the alpha (which can go to nothing) and
the depth (which has a ceiling with an argument behind it), and after that the answer is not a number
— it is a different sky.

**Whether a still frame can judge any of it.** It cannot: half of what is being asked for is motion,
and `scripts/shot.mjs` renders one frame. This is the class of change
[0027](0027-measure-the-picture-not-the-model.md) is about and the class its instrument cannot see.
