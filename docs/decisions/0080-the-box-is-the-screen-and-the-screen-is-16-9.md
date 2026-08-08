# 0080 — The box is the screen, and the screen is 16:9

**Accepted 2026-08-08.** The rest of chunk 3 of
[`the-third-play-test`](../../reports/the-third-play-test-2026-08-08.md), after
[0078](0078-the-sky-moves-a-third-faster.md) took the sky's speed.

**Amends [0023](0023-the-long-axis-is-the-scroll-axis.md)** — its clamp, and its *rejected:
letterboxing to a single authored aspect*. **Takes the trade
[0074](0074-the-box-is-drawn.md) named and refused.**

## The rule

**The aspect a level is authored against is the aspect the player's box is sized to, and the box is
the view inset by one fraction on both axes.** A screen squarer than that is letterboxed.

## What was asked for

> *"the barrier line is just super bad - it solved the problem I was having, but it did not solve the
> problem the game has in that almost a quarter of the screen space is not playable by the player"*

> *"I've attached screenshots for desktop and for mobile… from what I can see we should be able to
> extend the desktop one, but change the player 'box' proportions to correctly be a rectangle, maybe
> that doesn't work on mobile though, in which case - **let's optimise for desktop and we'll add a
> different viewport for mobile.**"*

> *"On desktop, the closer starfield layer is still too close to play view, needs to be a bit more
> background. I think it's actually the perspective zoom level is wrong."*

## The floor

`MIN_ASPECT` was 1.5 and is now `REFERENCE_ASPECT` — 16:9, the aspect
[`src/content/levels.ts`](../../src/content/levels.ts) is already written against.

⚠️ **That one constant is the whole of the first complaint.** `PLAYER_ALONG_SPAN` is
`ACROSS_SPAN × MIN_ASPECT` — the narrowest view any device gets, so that every player has the same
box ([0023](0023-the-long-axis-is-the-scroll-axis.md)). At 1.5 the box was 150 units:

| screen | visible along | the ship could reach | unreachable |
|---|---|---|---|
| 16:9 | 177.8 | 144 | **19%** |
| 21:9 | 240 | 144 | **40%** |

⚠️ **0074 named this lever and refused it**, on the grounds that raising the floor letterboxes 16:10
laptops and 3:2 tablets. **The player has overruled that refusal in as many words**, and the refusal
was worth less than it looked — see *what the bars actually cost* below.

⚠️ **`REFERENCE_ASPECT` rather than `1.7778` written again**, because they are now one decision: the
aspect a designer authors against and the aspect the box is sized to stopped being two answers.

## The shape

⚠️ ***"Correctly be a rectangle"* is not about the box's dimensions — it is about the box being the
same rectangle as the thing it sits inside.** With a flat margin of 6 the ship reached 88% of the
lane across and, once the floor rose, 93% of the view along: a playable area that was a different
shape from the screen.

So the inset is a **fraction**, `PLAYER_INSET = 0.06`:

| | span | inset | reach |
|---|---|---|---|
| across | 100 | 6 | 88% |
| along | 177.8 | 10.7 | 88% |

⚠️ **0.06 is exactly what the across margin already was**, so nothing about the dodge lane moves —
`ACROSS_SPAN × 0.06` is the 6 that shipped, and it still reads as *half a ship, so it never
half-leaves the playfield*. What moved is the along axis, which insets by the same fraction rather
than by the same distance.

⚠️ **A fraction rather than two constants, because two is the shape that let them disagree.** The
complaint was that the axes gave up different shares of the screen; a pair of hand-kept numbers is
how that happens again.

⚠️ **The larger forward inset is load-bearing and not a rounding.** At a flat 6 the ship could fly to
within a hull of the place waves become visible — a player standing exactly where the level arrives.
At 10.7 there is a body's width of screen in front of them on the narrowest device the clamp allows.

## What the bars actually cost, which is less than 0074 assumed

⚠️ **The gutter is filled with the space colour, and the game's background is space.** Photographed
at 1680×1050 (16:10), the letterbox is two 52px bands of the same near-black the starfield sits on —
they read as nothing at all, because there is no border between *sky* and *bar* to see. 0023's
rejection of a single authored aspect was written about *"20% of its screen black"*, which is a real
cost on a game with a lit background and close to none on this one.

**Who is barred now**: 4:3 and 5:4 tablets, as before, plus 3:2 (1.50) and 16:10 (1.60) laptops.
**Who is not**: 16:9 exactly, 19.5:9, 20:9, 21:9 — every phone in the device table and every ordinary
monitor. `tests/camera.test.ts` asserts that list, so a third class joining it is a decision rather
than a constant edit.

⚠️ **It also improves parity.** Lookahead varied by a factor of 1.6 across devices and now varies by
1.35, which is 0023's own *"if play shows the widest screens are measurably easier, lower
`MAX_ASPECT`"* answered from the other end.

## The zoom, and the reading it rests on

⚠️ **The report's *"perspective zoom level"* is read as the STARFIELD'S perspective, not the
camera's, and that is an assumption the player can overrule.**

The camera's own zoom is `ACROSS_SPAN`, and moving it is one of two things, both bad:

- **Widen the lane in world units.** That is the difficulty axis 0023 fixes — *"nothing is permitted
  to move it"* — and everything from `SHIP_SPEED` to every shot speed is measured against it.
- **Shrink the art against a fixed lane.** That makes every silhouette smaller, which runs directly
  into the *next* chunk of the same report: *"it's now very hard for sighted users to differentiate
  between power ups, player/enemy fire, different types of enemies."*

What a flat layer has instead is **how big its dots are and how many of them there are**, and those
two together are exactly what reads as distance. So the near layer got smaller and denser:

| | 0069 | now |
|---|---|---|
| biggest star | 0.6 units | **0.35** |
| stars per tile | 34 | **55** |

`(0.35/0.6)² × (55/34)` is **55% of the ink it had**, over 60% more points. Less loud and further
away at once — which is the only combination that answers *"needs to be a bit more background"*
without taking back the speed [0078](0078-the-sky-moves-a-third-faster.md) had just given it, and
those two asks arrived in the same report.

⚠️ **The far layer is untouched, because nothing was reported about it.**

⚠️ **`SKY_MAX_STAR_UNITS` is per layer again**, which is what it was before
[0069](0069-the-sky-is-behind-the-game.md) collapsed it to one number — and the guard is unchanged:
`tests/budget.test.ts` measures the radii `skyField` actually produces against `SHOTS.pulse.radius`,
never the constant.

## What this costs, and it is named rather than discovered

⚠️ **A ship at its forward limit now has almost no shot range**, and that falls out of the box rather
than out of anything new. [0048](0048-a-threat-may-arrive-from-the-side.md) culls the player's shots
at the edge of the view they can actually see — *"you can shoot what you can see"* — so a player
pressed against a wall at 94% of the screen fires into the 6% in front of them. It was 30 units of
travel and is now 8.

**That is the trade the extra room buys**, and it is the ordinary shape of a horizontal shooter: the
front of the screen is where you see furthest and shoot least. It is written down here so that
*"my bullets vanish at the front"* is recognised as this decision rather than filed as a bug.

⚠️ **And a flanker may now enter further behind the player.** `FLANK_ALONG` is 120 from the camera
and the box reaches 167, so a player at the front can be flanked 47 units behind them, against 24
before. Unchanged in kind — 0048's *"safe spawn zone from the left side"* is relative to the camera —
and worth a play-test's attention rather than a pre-emptive number.

## What this deliberately does not do

**It does not give mobile its own viewport.** The ask is explicit that one is wanted — *"we'll add a
different viewport for mobile"* — and it is a second decision, not a clause of this one: a phone at
20:9 gets 217 units of view against a 177.8-unit box, which is this same complaint at 18% rather than
22%. Desktop was named as the thing to optimise for; this is that, and `docs/state-of-play.md`
carries the other half as owed.

**It does not remove the drawn boundary.** The line now sits at 94% of a 16:9 screen, which is a
marker near an edge rather than a wall across the playfield — the picture 0074 wanted, at a number
that no longer needs explaining.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0080-viewport.mjs`. **7 red, and every tree back to what it was copied
as.**

| broken on purpose | went red |
|---|---|
| the aspect floor returned to 1.5, so a fifth of the screen stops being playable again | `THE REPORTED ONE: the strip in front of the wall is a sliver, in pixels of a real screen` |
| the along inset left as a flat margin, so the box is not the shape of the screen | `insets by the same fraction on both axes` |
| the trailing edge left on the across margin, so the box is lopsided along the lane | `the box travels with the camera, so retreat distance never grows` |
| the forward inset left on the across margin, so the box is lopsided the other way | `and the trailing edge gives up the same share, because the box is the view's own shape` |
| the floor nudged past 16:9, so another class of screen is quietly letterboxed | `bars the two laptop classes the player traded away, and nothing else that was inside` |
| the gutter left unfloored, so a rounding error and a crop wear the same sign | `never crops, and never stretches` |
| the near layer's stars returned to the far layer's size, so the depth cue is size alone again | `and the near layer is the quiet one, on every count that buys attention` |

⚠️ **Two probes were re-aimed rather than kept, and both re-aimings are findings.**

- *The mark left behind the wall* was written against
  [0074](0074-the-box-is-drawn.md)'s pixel guard and came back **WRONG TEST**. It could not have gone
  red there: `PLAYER_LEAD` is the one description both the clamp and the painter read, so moving it
  moves the wall and the mark *together*. Nothing about the picture is wrong in that state — what is
  wrong is that the box's two ends stop agreeing, and only a guard over both ends can see it. 0074's
  own probe already covers the second-copy case, which is the one that does move the mark.
- *The near layer's stars returned to the far layer's size* came back **STILL GREEN**, because the
  existing quietness guard held alpha and count and said in as many words that *"size no longer
  separates them at all"*. That was true of 0069 and is what 0080 changes, so the guard gained the
  assertion the decision actually makes.

## And it made two OTHER decisions' guards stop working, which is the real cost

⚠️ **Raising a bound loosens every guard measured against it, and two of them stopped being
falsifiable.** Both were found by `npm run prove` over the whole set — not by the suite, which was
green — and neither is in a file this change had a reason to open.

**[0061](0061-a-boss-keeps-flying.md)'s drift guard: STILL GREEN.** *The whole hull stays on screen on
the narrowest device* is measured against `ACROSS_SPAN × MIN_ASPECT`, so it loosened by 28 units along
with the floor. Its probe widened the sentinel's drift from 14 to 40, which now sums to 173 against a
bound of 177.8 — a break that is genuinely no longer a break. The probe now uses 60.

**[0048](0048-a-threat-may-arrive-from-the-side.md)'s boss guard: WRONG TEST.** *The boss is never hit
before it can be seen* had a margin of 19 units. Measured with the bug restored, the first hit moved
from **168.7 to 175.0 against a bound of 177.8** — so it passed either way, by three units.

⚠️ **And the repair for that one is not a louder break, because the guard was measuring a
consequence.** *The boss's first hit* depends on when the fixture's ship happened to be alive: the
ship is killed by the boss it is shooting at, so flying it forward — the obvious fix — makes it die
sooner rather than reach further. The RULE is *you can shoot what you can see*, so the test now
measures the furthest ahead of the camera any live player shot ever gets, and keeps the first hit
below it as the consequence the player actually reported.

That is [0027](0027-measure-the-picture-not-the-model.md) in its second form — a guard measuring a
quantity adjacent to the one it names — and the third time this project has caught one. The first two
are in [0077](0077-a-pickup-arrives-rather-than-stopping.md) and
[0078](0078-the-sky-moves-a-third-faster.md), and both of those were found by changing a number and
asking what should have gone red. **This one was found by the harness**, which is the difference the
whole-set run buys.

## And it was looked at

`node scripts/shot.mjs`, per [0027](0027-measure-the-picture-not-the-model.md), at 1280×720 and at
1680×1050.

**The boundary is where the report wanted it.** At 1280×720 the dashes sit at x≈1202 of 1280 with a
sliver of playfield beyond them, against x≈1036 and a quarter of the screen before this change.

**The near starfield reads as background.** It was a scatter of soft blobs at roughly the size of a
bullet; it is now fine dots, and the parallax still reads because there are more of them.

**The 16:10 letterbox is invisible in practice**, which is the finding above and the one a still had
to produce: both bands are the same colour as the sky they sit beside.
