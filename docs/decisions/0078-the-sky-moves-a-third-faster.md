# 0078 — The sky moves a third faster

**Accepted 2026-08-08.** The one number in
[`the-third-play-test`](../../reports/the-third-play-test-2026-08-08.md) given with its own magnitude.

## The rule

**Both sky layers scale together, because the ratio between them IS the parallax and the ask was
about speed.**

## What was asked for

> *"the background starfield layers both still need to be scrolling past about 1/3 faster - currently
> feels like i'm on a casual stroll and not a super fast spaceflight combat battle."*

⚠️ **It is the only unambiguous number in a report of about thirty findings**, which is why it lands
on its own rather than waiting for the rest of chunk 3. Everything else in that chunk — the
perspective zoom, the shape of the player's box, a separate mobile viewport — is a decision about
what the camera IS, and this is a decision about how fast something goes past it.

## The change

| | 0065 | now |
|---|---|---|
| far field | 0.12 | **0.16** |
| near field | 0.3 | **0.4** |

`× 4/3` each. `depth` is the fraction of the camera's own travel a layer moves at
([0065](0065-the-sky-is-baked-and-blitted.md)), so a third more depth is a third more apparent speed
and nothing else changes: the tiles, the bake, the draw count and the wrap are all untouched.

## Why both, and by the same factor

⚠️ **Scaling one of them would have bought the speed out of the depth cue.** Two layers at different
rates is the *only* thing that makes a flat starfield read as distance; their ratio is that cue, and
it is a quantity the ask does not mention. So the ratio is held by a guard of its own —
*"both layers a third faster"* is satisfied on the near one alone by anybody reading quickly, and
the picture that results is a background that has stopped being one.

## And the ceiling stays

⚠️ **There is no natural stopping point on *faster*, so 0065's is kept and tested.** At a depth of 1
the sky moves exactly with the world and reads as a field of objects going past at the rate of the
things that can kill the player — [0069](0069-the-sky-is-behind-the-game.md)'s subject from the other
side. At 0.4 the near field is still under half. The guard refuses anything at or above 0.5.

## What it cost, which was a second description nobody could see

`tests/budget.test.ts` restated the sky array under a comment saying it was
*"the real sky, built the way `src/app/mount.ts` builds it rather than restated."* It was a
restatement, and it had been one since 0065.

⚠️ **It survived because a depth cannot change a draw count.** Every assertion over that copy is
about blits and allocations, so the copy and the original could have disagreed about the parallax for
ever with the suite green — which is exactly the class `tests/one-description.test.ts` exists for and
exactly the reason it did not catch this one. `SKY` is now exported and the guard reads it.

⚠️ **This is the second time in one session that a guard was found measuring something adjacent to
what it named** — see [0077](0077-a-pickup-arrives-rather-than-stopping.md) on the bob guard that
stayed green with the bob switched off. Both were found by changing a number and asking what should
have gone red.

## What this does not settle

**Nothing about the zoom.** The same report says *"the closer starfield layer is still too close to
play view… I think it's actually the perspective zoom level is wrong"*, which is a claim about how
many world units the viewport shows and not about how fast they go past. It is the rest of chunk 3,
and it will change how this number feels — `docs/state-of-play.md` has the order and the reason.
