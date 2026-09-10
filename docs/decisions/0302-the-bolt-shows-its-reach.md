# 0302 — The bolt shows its reach, and a chain spends itself

**Status:** accepted
**Supersedes the numbers in:** [0297](0297-a-reach-is-measured-on-both-axes.md)
**Builds on:** [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md),
[0236](0236-the-guns-answer-the-first-play-test.md),
[0027](0027-measure-the-picture-not-the-model.md)

## The report

From [`the-bolt-played`](../../reports/the-bolt-played-2026-09-11.md), the first play of 0297:

> *"We changed chain lightning to have less reach, it changed the initial length of the weapon in a
> bad way. The initial length of the weapon was fun → but keep the thinner size when extending it
> again, because it looks more like lightning with the thinner graphics. But the additional jumps
> from the first hit and the reach it had on the first hit was wrong. The first hit should have the
> range displayed on screen, the additional jumps should then be based on decreasing distance."*

## What the previous pass actually cut

[0297](0297-a-reach-is-measured-on-both-axes.md) was right about the model: `reach` is a Euclidean
radius, the short axis of the lane is a fixed 100, and `[52, 61, 71, 84, 98]` covered the whole of it
from anywhere in it. It took the ladder to `[20, 24, 28, 33, 39]` and the report it answered has not
come back.

**What nobody looked at was the picture, which is the failure
[0027](0027-measure-the-picture-not-the-model.md) is named for.** A bolt with nothing in front of it
is drawn along the lane at a share of its reach:

```ts
/** How much of its reach a dry bolt shows. Less than all of it, so a miss does not look like a range. */
const DRY_BOLT_SHARE = 0.55;
```

So the length the player had been enjoying was never 98. It was **0.55 × the ladder — 28.6 to 53.9
units** — and a gun that fires itself with an empty lane in front of it draws that constantly, which
makes it the most-seen thing chain lightning does. 0297 cut the number by 60% and the picture came
with it: **the dry bolt fell to 11 units at the first rung.** That is the *"initial length… changed
in a bad way"*, exactly.

⚠️ **Two quantities were sharing one number and only one of them was wrong.** The reach that let a
player park in the centre and clear the screen was wrong. The length of the line, which is the only
thing the player can actually see the gun do, was fine — and it was cut by the same edit because
nothing separated them.

## What changes

**1 — The ladder is the length the player was already seeing.**

```ts
reach: [29, 34, 40, 47, 55]
```

That is 0.55 of the old ladder, nudged so every rung still buys the sixth
`tests/guns-played.test.ts` holds. The first rung draws 29 units where it used to draw 28.6; the cap
draws 55 where it used to draw 53.9. **The picture the report asked for is restored to within two
per cent, and the reach behind it is 55 rather than 98.**

**2 — The whole of it is drawn, so the range is on screen.** `DRY_BOLT_SHARE` is deleted. *"The
first hit should have the range displayed on screen"* is the opposite of the constant's own comment,
and the report is right: a gun that cannot miss is aimed by standing in the right place, so the one
number the player must judge by eye was the one number the picture refused to state. A miss looking
like a range is the point.

**3 — Each jump reaches `falloff` of the jump before it**, authored at **0.6** on the arc's row. At
the cap a volley reaches 55, then 33, then 19.8.

| | first hit | second | third | span of the whole chain |
|---|---|---|---|---|
| before 0297 | 98 | 98 | 98 | 294 |
| 0297 | 39 | 39 | 39 | 117 |
| **0302** | **55** | **33** | **19.8** | **108** |

**This is why the long first hit does not bring 0297's report back whole.** Two things carried that
auto-pilot and only one was the aimed hit: a chain of three, each jumping a full reach from wherever
the last body happened to stand, is a search of the entire screen. The falloff takes that half, and
what is left is one long aimed strike and a chain that visibly runs out of energy.

⚠️ **What is honestly still true: 55 crosses the lane's width from its centre** — `ACROSS_SPAN` is
100, so a player parked in the middle at the last rung can still reach either edge with the first
hit. That is one strike per volley rather than three, and it is now a length they can see rather
than an invisible radius. **If it still plays as auto-pilot, the ladder is what moves** — and the
thing to move it against is a play-test, not another 5%
([0297](0297-a-reach-is-measured-on-both-axes.md) is the record of three of those).

**4 — The twig gets the ceiling the jag already had.** *"Keep the thinner size when extending it
again, because it looks more like lightning with the thinner graphics."* Two things in
`src/render/scene.ts` scale with a link's length: the jag, which was already ceilinged at 3 lane
units — *"so a long link is not a wide one"* — and the twig, which was a bare fraction. At 0.3 of a
55-unit bolt the fork would have been 16 units: a branch, where the thing the player liked is a
filament. `TWIG_MAX` is **12**, which is the longest twig the short ladder could draw (0.3 × 39), so
**nothing on screen today moves and nothing gets wider as the bolts get longer.**

## What is deliberately not done

- **No guard on the twig's ceiling.** The figure a bolt cuts is a look, and every version of a hard
  rule for it that was drafted here was a threshold answering a question in advance —
  [0295](0295-a-ranking-guard-is-a-content-limiter.md) is the standing rule about exactly that, and
  the two candidate guards were also **intermittent by construction**: the widest excursion of a
  bolt is a hash draw, so a cross-tier comparison of maxima measures the seed as much as the
  ceiling ([0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)). What holds it is the
  constant, its comment, and a play-test.
- **`links` is untouched** at `[1, 2, 3, 3, 3]`, for the reason 0297 left it: how many jumps there
  are is the gun's identity.
- **`falloff` is a number and not a ladder.** A rung buys links, weight, rate and reach; the shape of
  the chain is the weapon's character rather than its tier. It sits on the row, so a second chaining
  weapon may author its own — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md).
- **0257 is untouched and is not made vacuous.** The nose at the front of its box sits 10.7 units
  from the leading edge on a 1280×720 screen, so every rung still reaches past it and the guard that
  refuses a link landing off-screen still has something to catch.

## Confirmed, not assumed

| | |
|---|---|
| the dry bolt is drawn at the whole reach | `THE RANGE, in pixels` — the drawn line against the place a body must stand, both in lane units off the surface |
| a jump reaches less than the hit before it | `THE FALLOFF` — a body inside the first hit's reach of the last strike and outside the jump's |
| a chaining row spends itself and a straight one has nothing to spend | the table guard in `tests/weapons.test.ts` |
| each of those goes red when it is broken | `scripts/probes/0302-the-bolt-shows-its-reach.mjs`, three breaks, each the previous behaviour put back |

The chain's own fixture now states the gap it puts each body at against the reach the link that
jumps it is given, so a ladder that moves under it fails there rather than quietly testing a chain
of one.

## What is owed

A play-test, on the branch preview. The question is not *is it weaker* — it is whether the length of
the line reads as the range, and whether a chain that shortens as it goes still reads as chain
lightning rather than as a gun running out.
