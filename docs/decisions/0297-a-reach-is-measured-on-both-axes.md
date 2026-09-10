# 0297 — A reach is measured on both axes

**Status:** accepted
**Supersedes the numbers in:** [0236](0236-the-guns-answer-the-first-play-test.md),
[0239](0239-the-guns-answer-the-third-play-test.md), [0241](0241-the-ship-wears-its-colours.md)

## The report

> *"Chain-lightning player attack — jumps too far, you can almost auto-pilot just sitting in the
> center of the screen and kill everything before it gets a shot off."*

## It had been cut twice already, and that is the finding

The ladder was `[52, 61, 71, 84, 98]`.
[0239](0239-the-guns-answer-the-third-play-test.md) took a tenth off the top, from
`[55, 64, 75, 88, 103]`; [0241](0241-the-ship-wears-its-colours.md) took a twentieth off all of it —
*"the lightning… still being too strong. 5% reduction on the range and 1 less max hit."* Both also
cut a link at the cap. Then this report.

**Three passes shaving percentages off a quantity that was never wrong by a percentage.** It was
reasoned in one frame and applied in another, and the old comment said so in its own words:

> *"The cap reaches a shade over half of the narrowest view."*

That is the view's **long** axis — 177.8 units on a 1280×720 screen, and 98 is indeed a shade over
half of it. But a reach is a **Euclidean radius**: `nearestFrom` takes `sqrt(dAlong² + dAcross²)`, so
it spans the short axis too. The short axis is `ACROSS_SPAN`, a fixed **100**, which
[0023](0023-the-long-axis-is-the-scroll-axis.md) names as **the difficulty axis**.

So a number sized as *half the long axis* was, on the axis that carries the difficulty, **the whole
lane from anywhere in it**. That is not a gun that is slightly too strong. It is a gun with no
positioning in it at all, which is exactly what the report describes.

⚠️ **`CLAUDE.md` already has the rule this broke** —
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md): *a quantity solved from one case is
checked in every case it runs in.* The case it was solved in was the scroll axis. The case it runs in
is a circle. Nobody checked the second, three times over, and each time the answer was another five
per cent.

## What changes

```
reach: [20, 24, 28, 33, 39]
```

**The scale moves and the shape does not.** Every rung is about 0.4 of the old one and each still
buys at least the sixth `tests/guns-played.test.ts` holds, so an upgrade buys what it always bought.

In the player's own units — [0027](0027-measure-the-picture-not-the-model.md)'s requirement:

| | across covered from the centre of the lane |
|---|---|
| first rung, 20 | 30 → 70 |
| top rung, 39 | 11 → 89 |

Both edges of the lane are out of reach at every rung. Positioning is a decision again.

## What the first draft got wrong, kept because it is the rule working

The ladder was first written `[20, 24, 27, 32, 38]` — the old numbers times 0.385, rounded. It went
**red**: `the arc's reach at tier 2 is not a sixth further than tier 1: expected 27 to be greater
than or equal to 27.84`.

The guard was right and the work was wrong. A rung that buys an eighth is the rung
[0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md) already refuses — *every rung changes the
ship* — and the fix was the numbers that clear it, never the guard.
[0192](0192-a-guard-holds-an-invariant.md): *a red guard is never answered by changing the work to
suit it.* Written down because the tempting edit was one character in a test.

## What is deliberately not done

- **No new guard.** *The reach is under half the lane* would be a hard rule about a tuning number,
  and [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s test says no: there is no reason a
  future gun may not reach further on purpose. What holds this is the ladder's own climb, which is
  about upgrades rather than about a ceiling, and a play-test.
- **`links` is untouched** at `[1, 2, 3, 3, 3]`. The chain is the gun's identity; how far each jump
  travels is what was wrong, not how many there are.
- **0257 is untouched and is not made vacuous.** On a 1280×720 screen the nose at the front of its
  box sits **10.7** units from the leading edge, so even the first rung still reaches past it — a
  link can still try to land off-screen, and the guard that refuses it still has something to catch.

## What is owed

A play-test. Three previous passes were tuned by arithmetic and each produced another report; this
one changes what the number *means* rather than its size, so the thing to check is whether the gun
still feels like chain lightning rather than whether it is weaker.
