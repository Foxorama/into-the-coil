# 0340 — The Coil is a route, and the ship crosses it

**Accepted 2026-09-19.** **Answers [0042](0042-a-run-is-a-sequence-of-levels.md)**'s deferred chart
and `SCREENS.cleared`'s six-week-old note *"this is where the chart will eventually go"* — one screen
further on than that note expected. **Extends [0063](0063-a-level-break-is-a-respite.md)**, which is
untouched: the respite is still three seconds of a world that never stopped, and the crossing comes
after it. **Extends [0331](0331-the-heart-beats-under-it.md)** — the bake it starts is the thing the
crossing waits for. **Third entry under [0070](0070-a-style-is-a-setting-and-the-first-one.md)**'s
settings mechanism.

## The ask

> *"We'll need loading screens anyway for transitions and to represent moving through the galaxy."*

And, when it was described as a banner: **a full-screen scene**, not a line of text over the sky.

## What was built

A `travel` screen between two levels. The boss dies, the existing *Level clear* respite plays exactly
as 0063 made it, and then the chart: the Coil drawn as a spiral of seven places, the ship crossing the
leg the run is on, the next place's name, one line about it, and its backdrop already behind
everything.

| | |
|---|---|
| the picture | one baked bitmap and one blit — the spiral, the seven stops in their own colours, which legs are flown — plus the ship, blitted on the curve and turned along it |
| how long | at least four seconds, **and** until the next place's material is in the mixer's hands |
| the ceiling | twenty seconds, after which the run goes on and the music arrives when it arrives |
| a press | takes the floor away and not the wait |
| the knob | *Travel: Scene / Brief* — one number, the floor |

## The tension, named: this is the interruption two decisions were written to remove

⚠️ **[0063](0063-a-level-break-is-a-respite.md) EXISTS BECAUSE A HARD PAUSE BETWEEN LEVELS WAS
REPORTED AS BAD.** *"The current pause/level screen interrupts the flow"* — and, in the same breath,
*"a flowing continuation to the next run with a brief respite will feel better than the hard pause
interruption now."*

⚠️ **AND [0076](0076-a-level-has-an-origin.md) MADE THE BOUNDARY SEAMLESS FOR THE SAME REASON.** *"A
background scene reset between levels that's disjointing because it moves the player's ship."*

A full-screen scene between two levels is, on its face, both of those things coming back. Three
answers, in the order they matter:

1. **It is a CURTAIN, not a reset.** `steps: false`, so nothing behind it moves. The field, the camera
   and the ship are exactly where the player left them when it lifts; the only thing that changed is
   the script. 0076's complaint was about the ship being MOVED, and nothing here moves it — which is
   why `lifecycle.onward` still enters the level and the crossing goes between its two halves rather
   than in front of it.
2. **It is doing work.** 0331 bakes the next place from the approach precisely because The Black
   Heart's first movement is twenty-five seconds long and its material is thirty-five seconds of
   synthesis. Before this screen, a place whose bake had not landed simply started without its music.
   The crossing is where that wait goes.
3. **There is no choice on it.** 0063 recorded the play-test that scrapped the branching chart's
   *player choice*; what is left is a straight line, which is what 0042 said the chart would be until
   somebody had played the levels. A scene with nothing to decide is not the hard pause that was
   reported — the thing being interrupted by was a decision, not a picture.

⚠️ **AND IT IS FOUR SECONDS, WHICH HAS NOT BEEN PLAYED.** 0063 says the same of its own three, in the
same words and for the same reason: too short and the crossing is a flicker, too long and it is the
pause wearing a different coat. It is the number in this change most likely to be wrong and the first
one to take to a play-test.

## The shape: the chart answers the one thing the product definition asks of it

`docs/game.md`, under *Open*: *"The chart's shape. It must read as descent toward the centre, and must
not be a copy of the star map."*

So the route is a **spiral that loses radius as it goes and ends at the exact centre of the picture** —
where The Black Heart is, in the fiction and now in the drawing. `tests/travel.test.ts` holds the
first half as arithmetic over the curve; the second half is a judgement and is not a thing a test can
hold.

⚠️ **A STRAIGHT-LINE RADIUS WAS TRIED FIRST AND WAS WRONG, AND THE GUARD FOUND IT IN LANE UNITS.** With
the radius falling linearly while the angle advances at a constant rate, each turn of the coil is the
same distance narrower than the last and the inner legs die out: the last two places came out
**exactly seven lane units apart, which is exactly a stop's own diameter** — two tangent discs, with
the destination's ring cutting through the one before it. `CHART_TIGHTEN` is 0.6, which holds radius
longer and spends it near the middle, and gives the last leg about fourteen lane units.
[0027](0027-measure-the-picture-not-the-model.md)'s rule that an assertion be written in units the
player experiences is what made that visible; the curve itself was perfectly self-consistent.

## One bitmap, because a blit takes an index and not an ink

`Surface.blit` cannot tint, and every place on the chart is in its own colour. Seven sprites, one per
place, would be seven entries in `SPRITE_KINDS` differing only by a colour looked up from the same
table — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s mechanism whose
output is the same shape for every kind — and they would still need a line drawn between them.

So the whole route is **one sprite**, re-baked when the run reaches a new place exactly as the weather
is ([0133](0133-the-place-is-baked-at-the-boundary.md)). Progress is a property of the picture rather
than of a counter drawn over it: what changes between two bakes is which legs are drawn as flown, and
the frame loop is one blit either way and does not know how many places there are.

⚠️ **THE CURVE ITSELF LIVES IN `src/content/sprites.ts`, WHICH IS NOT WHERE IT LOOKS LIKE IT BELONGS.**
Two layers need it — the baker strokes the spiral, the painter puts the ship on it — and
`tests/budget.test.ts`'s *the frame cannot reach the baker* — which cites
[0022](0022-frame-rate-is-a-feature.md), *art is drawn once at load and blitted thereafter* — forbids
the second importing the first. `SERPENT_BODY_DIAMETER` is in that file for the identical
reason and says so. Two descriptions of one curve would put the ship beside the route rather than on
it.

## What the crossing waits on, and why it is not `bakingTheme`

0331 left three ways the next place's material can arrive: held in `ahead` and handed over on the step
the run gets there, landing from a bake that was still in flight, or baked from scratch because the
run outran its own lookahead. `bakingTheme` and `aheadTheme` between them say what has been **asked
for**, which is a different question and is true several seconds too early.

⚠️ **SO `handOverPlace` TAKES THE THEME AS AN ARGUMENT AND WRITES `loadedTheme`.** It is the one line
all three routes pass through, so it is the only honest answer to *what is the mixer actually
holding*.

⚠️ **AND *READY* IS TRUE WHEN NOBODY IS LISTENING.** `applyMusicLevel` returns immediately when there
is no `AudioContext`, so no bake is ever started for a player who has not pressed anything — waiting
on it would make the crossing a twenty-second pause for exactly the players who cannot be told why.
The sound setting counts as nobody too: *Off* keeps the context and mutes the speaker, so the bake
runs and there is still nothing arriving for them to wait for.

## The press is neither a dead control nor a lie

A press cannot make a bake land. A crossing that ended on one would arrive in silence; one where the
button did nothing on a place still baking would be a control the player has to be told about. So
*Onward* **takes the floor away and leaves the wait alone** — which for six of the seven places is the
next step, and for The Black Heart on a cold start is as soon as there is something to arrive to.

## The row that is two firsts

`travel` is the first screen with **`steps: false` and `dims: false` together**, and the first with no
`timeout` that is not waiting for a hand.

⚠️ **THE DIM IS REFUSED FOR THE OPPOSITE REASON TO `cleared`'S AND `music`'S.** Those two let the scene
show through. This one has no scene: `src/app/mount.ts` paints the chart **instead of** the world for
the frames it is up, so a dim would paint out the picture that replaced it. `tests/menu.test.ts` holds
a list with a reason per entry and stopped this change until the reason was written, which is the
guard working.

⚠️ **AND A TIMEOUT IS *n STEPS, THEN PRESS SOMETHING*.** This ends on a floor **and** on the place
being ready, which is two facts a `{ steps, then }` cannot carry. The rule is in `src/content/travel.ts`
as a pure function of four, so *does it leave before the music is ready* and *does a press skip the
floor* are answerable without booting a canvas — `src/app/lifecycle.ts` and `tests/continue.test.ts`
are the same pair for the same reason.

## A fourth way a run moves

`onward` used to end on the playing screen. The crossing goes between its two halves, so what was one
verb is now *enter the level* and *lift the curtain on it* — `arrive`.

⚠️ **IT IS A ROW IN `src/app/lifecycle.ts`'s TABLE THAT RESETS NOTHING, AND THAT IS WHY IT IS A ROW.**
It is the visible proof that a crossing cannot quietly become a second `onward` and advance the level
twice — which is [0339](0339-a-level-is-cleared-once.md), fixed one screen away four commits ago, and
the reason `tests/travel.test.ts` asserts *a crossing advances the level exactly once* through the real
verbs rather than assuming it from there.

## The knob, and why it is the smallest one 0024 allows

*Travel: Scene / Brief.* Both rows wait for the place; one waits for less of its own art.

⚠️ **A KNOB THAT ALSO DROPPED THE WAIT WOULD DECIDE WHETHER THE NEXT PLACE'S FIRST MOVEMENT IS HEARD**,
which is a content difference wearing a comfort setting's clothes —
[0024](0024-the-accessibility-floor-is-settings.md) forbids exactly that. And neither row is zero: a
crossing shortened to nothing is not a shorter crossing, it is a flicker between two levels. Only a
press takes the floor to zero, because a press is a player saying *now*.

⚠️ **THE BAN IS HELD OVER THE IMPORT GRAPH, AND `src/render/scene.ts` IS ON THE LIST**, which neither
`tests/style.test.ts` nor `tests/sound.test.ts` needs. The painter draws the crossing, so it is one
import away from the table that says how long the crossing lasts — and `src/app/frame.ts` imports the
painter. A transitive route to a comfort setting is a route.

## Confirmed, not assumed

Probes in `scripts/probes/0340-the-coil-is-a-route.mjs`.

⚠️ **AND THE PICTURE WAS LOOKED AT, WHICH IS WHERE TWO OF THE FOUR DEFECTS CAME FROM** — 0027.
`rig/bench.ts` takes `?cross=N`, which raises the chart through the game's own two verbs, and
`scripts/shot-travel.mjs` photographs three moments of it. Of the four things wrong with the first
version: the tangent stops and the destination ring running off the tile were found by guards in this
change's own test file; **the ship being a fifth the size of the things it flies between, and
therefore invisible behind the place name for the middle of a crossing, was found by looking at it**.
The fourth — that the crossing ends by itself and hands back to the game — was confirmed end to end in
the real shell rather than argued from the rule.

## What this leaves owed

**Four seconds has not been played**, and neither has *Brief*. The first play-test of this feature is
about one number.

**The crossing is silent apart from whatever rung the music is on.** Everything outside a run plays
`calm`, so what a player hears is the next place's own bed arriving under its own chart — which is
right by construction rather than by design, and nobody has listened to it.

**The chart draws no sky.** The place's backdrop colour is behind it and nothing else is, which reads
as space and was chosen for that; a star field behind the route is the obvious next thing to try and
costs a sky argument the painter does not currently take.

**A branching chart is still not built**, and `docs/game.md` still describes one. What is here is the
straight line 0042 recorded as a deliberate first step, made into something a player can look at.
