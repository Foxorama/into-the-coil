# 0239 — The guns answer the third play-test

**Accepted 2026-09-05**, the same day as [0238](0238-the-picture-answers-the-second-play-test.md),
from [`the-guns-played-again`](../../reports/the-guns-played-again-2026-09-05.md):

> *"shurikens need a slightly tighter spiral… lightning is a little bit long at max power, it's a
> bit OP - it also needs some bright white dots at the centre points of the joins… the missile
> pickups need to be different colours and have a much different appearance… weapon pickups need
> different colouration for each weapon as well"*

Four items, all answered. **Amends [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)**: the
faces of a cycling pickup are no longer all in the pickup ink. **Amends
[0236](0236-the-guns-answer-the-first-play-test.md)**: the arc's reach ladder is cut back at the
top, and a bolt's dots are at every other join.

## The rules

**The spiral is wound a quarter tighter.** The gap the report names is the spiral's pitch — what
a blade gains outward in one turn, `(half-width ÷ orbit) × (2π ÷ turn)`. Every rung of `orbit`
opens slower and `turn` is a shade quicker (0.12 from 0.11), which takes the pitch from 40 units at
the first rung to 31 and from 15 at the cap to 12. A blade lives longer for it and more are in the
air; `tests/blades.test.ts` still holds the pool at the cap and *more of a turn* at every rung.

**The arc's reach is cut back a tenth at the top.** `reach` is `[55, 64, 75, 88, 103]` from
`[55, 66, 79, 95, 114]`: the first rung is untouched, every rung still climbs by at least a sixth
(`THE REACH` in `tests/guns-played.test.ts`), and the cap reaches a shade under three fifths of the
narrowest view rather than two thirds. *"A bit OP"* is a balance verdict and a hand's; this is the
smallest cut that keeps the ladder's shape.

**A bolt has a bright dot at every other join, and lands on one.** `BOLT_DOT_EVERY` is 2 (from 3)
and `BOLT_DOT_WIDTH` 2.8 cores (from 1.9), so a link carries three points of light rather than two
thickenings; `STROKES_PER_LINK` counts the cost and `tests/weapons.test.ts` holds the picture to
it. The landing sprite (`arcNode`) is a round dot in the impact ink with a glow, not a four-pointed
star — the joins are where it is blitted, and the ask was for dots there.

**Every face of a cycling pickup wears its own ink, inside the one bubble.** `INK_OF` puts the
arc's face in the ship's ink (its bolt's colour), the shuriken's in steel (`blade`) and the
seeker's in the ally ink, which nothing else in the lane wears; the pulse's and the missile's —
the first face of each pickup — keep the pickup ink, so a pickup that has just appeared reads as
one before it reads as anything else. The bubble (0236) stays in the pickup ink on every face and
is what says *pickup*. `THE INKS` in `tests/weapons.test.ts` holds both halves.

**The seeker's face is a reticle.** A disc with a dark ring in it, four ticks across the ring and
a dot at the centre, in place of 0235's chevron-with-a-hole: *"a much different appearance"*, and a
target is what homing looks like before anybody is taught it.

## ⚠️ What was rejected

**A faster turn alone for the spiral.** It tightens the pitch but whips the rim: at 0.16 radians a
step a blade at the lane's edge covers eight units a step. Slower opening does most of the work,
and the turn takes a shade.

**Fewer links at the cap for the arc.** *"A little bit long"* names the reach, not the chain; the
chain is what the first play-test called *good*.

**A dot at every vertex.** Nine `bolt` calls a link where there were four; at four links and a
twig each that is a third again on the frame's draw calls for a picture the ask does not need.

**A new ink per face.** The palette has one for each thing a face offers already — the bolt's
colour, the blade's steel, the ally's — and every extra ink costs every palette forever
(`tests/palette.test.ts`'s own warning).

## What is owed

- **An eye on all four**, at the shipped camera, and a hand on the two balances — the arc's cap
  and a wider, longer-lived ring of blades.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content and art; nothing
persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0239`:

| broken on purpose | went red |
|---|---|
| the arc's face given the pickup ink again | `THE INKS: no two faces of one pickup` |
| the seeker's face given the pickup ink again | `THE INKS: no two faces of one pickup` |
| the first face of the weapon pickup given the pulse's ink | `THE INKS: no two faces of one pickup` |

And, re-run over the moved ladders: `0236` (the reach climbs) and `0237` (the spiral's rungs) —
every probe still red.
