# 0074 — The box is drawn

**Accepted 2026-08-08.** Draws the leading edge of the player's movement box, and exports the one
number that both the clamp and the mark now read.

From [`medium-played`](../../reports/medium-played-2026-08-07.md), the second of its three confirmed
defects.

## The rule

**A rule the player can hit is a rule the player can see, and the picture of it reads the same
constant the rule does.**

## What was asked for

> *"The hard block on the player movement was a problem because there was no indication of it, and I
> got shot a couple of times because I tried to fly forward on the screen to avoid a bullet and
> couldn't."*

## The box is not the bug and must not be removed

`src/sim/flight.ts` clamps the ship to `camera + 6 … camera + 144`, and
[0023](0023-the-long-axis-is-the-scroll-axis.md) is why: `PLAYER_ALONG_SPAN` is
`ACROSS_SPAN × MIN_ASPECT`, the narrowest view any device gets, **so every player has the same box
and the wider screens spend their extra span on lookahead.** A box measured against the current view
would make retreat distance a property of the monitor.

What that leaves is a wall in a different place on every screen, with nothing drawn on it:

| screen | visible along | the ship may reach | unreachable visible playfield |
|---|---|---|---|
| 3:2, the narrowest | 150 | 144 | 6 |
| 16:9 | 177.8 | 144 | **34** |
| 21:9, the widest | 240 | 144 | **96** |

⚠️ **On a wide screen the ship is boxed into the back 60% of the picture.** That is the defect: not
the rule, but that the rule is invisible and varies.

## What it looks like, and why it is a dash

One baked mark, tiled ten times down the lane, in the **player's ink** at 35% alpha, drawn **behind
every body**.

⚠️ **The player's ink and not a neutral one, because the thing it marks is the player's box.**
Enemies, bullets and pickups all cross it freely — `flyShip` clamps the ship and only the ship — so a
line in the enemy ink or a wall colour would say *a barrier* when what is true is *your limit*. That
is [0024](0024-the-accessibility-floor-is-settings.md)'s *colour never carries meaning alone* pointed
at the opposite risk: the colour has to not say the wrong thing either.

⚠️ **Dashed rather than solid, for the same reason.** A solid line across the playfield reads as
scenery the enemies are ignoring; ten marks read as a measurement.

⚠️ **Behind every body, which is the one absolute in `src/render/scene.ts`'s draw order.** A row of
marks over the top of the lane sits at exactly the distance the player is most likely to be dodging
at, and would hide the bullets it exists to help them dodge.

⚠️ **The alpha is BAKED, never applied per blit.** [0025](0025-the-frame-budget-is-counted-not-timed.md)
counts state changes in the frame loop and [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)
refused to grow the painter a verb that hides work — so *faint* is a property of the bitmap, exactly
as `SKY_ALPHA` makes the near starfield dim.

## One constant, because there are now two readers

`PLAYER_LEAD` is exported from `src/sim/flight.ts` and is `PLAYER_ALONG_SPAN − PLAYER_MARGIN`. The
clamp reads it; `src/app/mount.ts` hands the same value to the painter.

⚠️ **A `PLAYER_ALONG_SPAN - PLAYER_MARGIN` at the call site would be a second copy of one
subtraction**, in a file with no way to know when either term moves — and the failure mode is a line
drawn *near* the wall rather than *at* it, which is **worse than no line at all**, because it teaches
the player something false. `src/content/sprites.ts` records what three hand-kept descriptions of one
fact cost the last time.

There is a probe for it, and it forgets exactly the term somebody would forget: the margin.

## The cost, in blits

Ten, fixed, on every device and at every camera position — `acrossSpan / extent`, and the lane is a
fixed hundred units whatever the screen is doing.

⚠️ **`paintBound` is never handed the camera, so a count that drifted with the scroll is not a
mistake that can be written there.** The affordance is absent rather than guarded, which is the tier
above a test. What *is* reachable is the sky's own line pasted in — the sky tiles along the scroll
axis — and that is what the probe does.

## What this deliberately does not do

**It does not make the box bigger.** The play-test also asked for more forward room, and at the
current device support **it is worth six world units and no more**: `MIN_ASPECT` guarantees every
device shows at least 150 along-units and the box already reaches 144, so anything wider puts the
ship off its own screen on a 3:2 tablet.

⚠️ **The lever exists and the trade is named rather than taken.** Raising the aspect floor to 16:9
exactly would buy a ~172-unit box — 28 more — and cost letterboxing on 16:10 laptops and 3:2 tablets,
which are gutter-free today. It is deferred because
[0073](0073-an-enemy-is-a-pilot.md) changed the question underneath it: the value of forward room
against something that hunts you is not the value it had against a wall you fly past.

**It does not mark the `across` edges.** The ship is clamped there too, at 6 and 94. Those bounds sit
against the lane the player can already see the edge of, and the reported failure was forward. A
second pair of marks is a row in the same mechanism if play asks for one.

**It does not react to being pressed against.** A glow on contact is the obvious next thing and it is
a picture question a hand should answer, not a guess: the line either explains the stop or it does
not, and that is a play-test away.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0074-bound.mjs`. **4 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the boundary never drawn, so the wall goes back to being invisible | `THE ONE: a ship held against the boundary stops within a hull of the mark, in pixels` |
| the mark placed a margin past the wall, which is the subtraction done twice | `THE ONE: a ship held against the boundary stops within a hull of the mark, in pixels` |
| the boundary drawn over the bodies rather than behind them | `and it is drawn BEHIND every body, so nothing is lost behind it` |
| the dash count taken from the scroll axis, so the line is a different length per device | `is a fixed number of blits that does not vary with the camera or the device` |

⚠️ **The load-bearing guard is in PIXELS, and it compares two numbers from two places.** A ship held
against the wall for four seconds is drawn by the real painter, through the real `screenX`, and the
mark is drawn by the same painter from what `mount` handed it. The tolerance is **one hull**, because
that is the largest gap a player could not perceive. Everything else in the suite is structure —
a count, an order — and structure is exactly what stays consistent while the line is in the wrong
place.

⚠️ **A probe that could not fire was replaced rather than kept.** The first version of the count guard
tried to make the dash count vary with the camera and came back STILL GREEN, because the camera is not
in scope. The test's comment now says that instead of implying a guard over it.

## And it was looked at

`node scripts/shot.mjs --ms=4000` renders the shipping camera, per
[0027](0027-measure-the-picture-not-the-model.md), and the line is there: dashed, subdued, at 81% of a
16:9 view — which is 144 of 178 units — with a drifter sitting well past it. **A guard can say the
mark is where the ship stops; only a picture can say it reads as a limit rather than as a wall**, and
that is the half a play-test still owns.

## What this leaves owed

**Whether 35% is right.** It has to be visible on a bright phone in daylight and ignorable while a
screen full of bullets is being read, and those pull opposite ways. Nothing asserts it.
