# The bolt played — 2026-09-11

The first play of [0297](../docs/decisions/0297-a-reach-is-measured-on-both-axes.md) — the reach cut
that answered *"chain lightning jumps too far, you can almost auto-pilot just sitting in the center
of the screen"* — given in chat, about the deployed build.

## What was said

> *"We changed chain lightning to have less reach, it changed the initial length of the weapon in a
> bad way.*
>
> > *chain lightning reach [52…98] → [20…39] — it had covered the whole lane*
>
> *The initial length of the weapon was fun → but keep the thinner size when extending it again,
> because it looks more like lightning with the thinner graphics.*
>
> *But the additional jumps from the first hit and the reach it had on the first hit was wrong.*
>
> *The first hit should have the range displayed on screen, the additional jumps should then be
> based on decreasing distance."*

## What it was read as, before anything was changed

Four separate asks, and the first one is the finding:

1. **The length on screen is not the reach.** A dry bolt was drawn at `DRY_BOLT_SHARE = 0.55` of the
   reach, so *"the initial length of the weapon"* had been 28.6 → 53.9 units, never 52 → 98. 0297
   cut the reach by 60% and took that picture with it without anybody looking at it, which is
   [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) happening again.
2. **The first hit should be long, and it should be the length that is drawn** — *"the range
   displayed on screen"*, which is the exact opposite of the constant's own comment (*"so a miss does
   not look like a range"*).
3. **The jumps after it should shorten**, which is a mechanism the gun did not have: every link
   searched a full reach from wherever the last body stood.
4. **The bolt keeps its current figure when it gets long again** — *"the thinner graphics"*.

Answered by [0302](../docs/decisions/0302-the-bolt-shows-its-reach.md).

## And the play of 0302 itself, the same day

0302 restored the drawn length to within two per cent of what was liked, left the cap at 55 rather
than 98, and said out loud that 55 still crosses the lane's width from the centre rather than
claiming the auto-pilot was gone. Played on the branch preview:

> *"Reach needs to be about 1 tier up and slightly further for the last tier."*

So the concern went the other way, on the only authority that settles it. Answered by
[0303](../docs/decisions/0303-the-reach-goes-up-a-rung.md): `[34, 40, 47, 55, 68]`, every rung the
one above it and the cap a fifth past the shift. **What is owed now is the next play, and the
question is the last rung rather than the gun.**
