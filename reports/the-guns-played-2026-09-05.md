# The guns played — 2026-09-05

The first play-test of [0233](../docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md), on
the branch preview, the same day it was built. Every item is answered in
[0236](../docs/decisions/0236-the-guns-answer-the-first-play-test.md); this file is the record of what
was said.

## The verdict

> *"lightning gun is cool and weapon rotation power ups are cool, but it adds a huge degree of
> difficulty now"*

## The items

**The cycle.**

> *"the rotation needs to be 1sec longer, it takes too long to fly to the pickup and it changes just
> before you grab it to the wrong weapon all the time"*

**The scatter.**

> *"on death, the power ups needs to scatter more to the 8 directions -> they just explode up and down
> now -> and they need to last as long as regular power ups. It's too punishing now on death with
> rotation and weapons"*

**The reach.**

> *"the reach of the lightning needs to be extended by about 20% per power up tier, the chain is good,
> but the initial hit requires you to be way too close to bosses and enemies. you can't effectively
> dodge"*

**The strike's sound.**

> *"need an impact/explosion sound when enemies get hit by lightning - currently there's no impact
> noise and it feels weird."*

**The discharge's sound.**

> *"the lightning noise needs to have an additional bit of bass on it, it sounds sparky, but not
> lightningy."*

**The bolt's picture.**

> *"the visual for the lightning also needs a bit more depth - it looks really good now, but it needs
> some bright points and a bit of a darker glow around it."*

**The pickups' picture.**

> *"and all the power ups need a glow or bubble/circle or something around them, they're hard to
> distinguish from enemies now"*

## What was found on the way

A dry first link — nothing in reach — was advancing the chain's origin by half a reach, so the second
link searched from there and found a body a reach and a half away. The longer reach made it visible;
`tests/weapons.test.ts` now fires dry at a body just past reach.
