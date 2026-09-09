# 0288 — The skull is longer

**Accepted 2026-09-09**, from the first play of the long serpent —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"and the head itself needs to be slightly bigger and also slightly longer — I know this is going
> to need the whole eyes, teeth and tongue and horns etc rejigged, but the head looks just a bit
> weird at the moment."*

**Follows [0284](0284-the-head-is-a-serpents.md)**, which drew this skull, and
[0285](0285-the-mouth-is-alive.md), which gave it faces.

## The rules

**Bigger and longer are two numbers, because they are two halves of the sentence.** The extent scales
the whole drawing; the proportion is its own constant.

**A hurtbox is the size of the head that is drawn.** Not its shape — a disc never will be — its size.

**A transform at the point of drawing beats re-typing the art.**

## ⚠️ *Longer* could not come from a longer snout, and that was the first thing tried

The aura sits at 1.075 of the hull and `tests/accents.test.ts` stops a translucent mark at **1.16 of
the drawing radius**, where the next bitmap in the atlas begins. The snout is at 1.06, so the halo
already lands at 1.14.

⚠️ **THERE IS 1.8% OF ROOM IN FRONT OF THIS ANIMAL'S NOSE.** A sprite's box is square and its content
is measured from the centre, so *longer* inside that box can only be bought by giving up height.
`SKULL_LEAN` is 0.88: authored 1.96 long by 1.52 tall, the skull now draws 1.96 by 1.34 — a
length-to-height of **1.46** where it was 1.29. `SPRITE_EXTENT.boss8` goes 20 → 24 for the *bigger*,
and that scales every mark on the head with it because every one of them is a fraction of the drawing
radius.

## ⚠️ The lean is applied at the point of drawing, and it is applied LAST

Every mark on this head — two horns, a brow plate, a crown plane, a lit snout ridge, five scales, a
socket, an iris, a slit pupil, a catchlight, a nostril, four teeth, a tongue and the mouth's own
wedge — is a list of numbers. Squashing them by hand is about fifty edits and one typo, and the typo
is a mark half a pixel off a hull that no photograph will show.

⚠️ **AND IT IS AFTER THE JAW SWINGS, WHICH IS NOT THE SAME THING.** `hinged` rotates about the hinge.
A rotation performed in squashed space is a shear: the jaw would open along a different arc from the
one 0285 measured, and the teeth would leave their sockets. **Author, hinge, then lean.**

⚠️ **THE EYE'S CENTRE LEANS AND ITS RADIUS DOES NOT.** A disc's centre is a point on the head and
moves with it; its radius is not a point. Squashed, the eye would be an ellipse on a face whose every
other curve is one — and one round eye on a long head is what a snake has.

## ⚠️ What the resize costs the fight, measured rather than assumed

`radius` is the hurtbox and it is not the drawn skull. Left at 7 under a head drawn twenty per cent
larger, the head has edges a shot passes through — the picture says HIT and the model says miss, which
is [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) and whose own finding is that
this class gets reported as a collision bug that does not exist. So it goes to 8.4 with the skull.

⚠️ **AND 0260's FORTY-SECOND FLOOR CANNOT SEE THAT.** It computes time-to-kill as
`health × toughness / FASTEST` — **a model quantity with no hurtbox in it**. A bigger target catches
more of the fan and shortens the real fight, and that guard would have stayed green through any
amount of it. [0027](0027-measure-the-picture-not-the-model.md), exactly: a guard measuring the model
while the thing the player experiences moves.

So it was driven, at max weapons, with the pilot parked on the boss's lane and the trigger held:

| | fight |
|---|---|
| `radius: 7` | **66.0 s** |
| `radius: 8.4` | **59.0 s** |

**11% off a fight that lands 19 seconds above the floor.** The rig is a scratch script rather than a
tracked instrument, and that is a debt this decision owes rather than a claim it makes: if the next
change to this animal moves the fight again, the second thing to build is `scripts/weigh-boss.mjs` —
`scripts/weigh-fight.mjs` measures a mid-boss and splits the walk on `world.fight`, so it cannot
answer this question without a flag that changes what every number in it means (its own argument,
about its own sibling).

## What is held, and where

| Claim | Where |
|---|---|
| the hurtbox covers the skull across and does not exceed it along | `tests/accents.test.ts`, in world units |
| a head taller than it is long is a frog | `tests/accents.test.ts`, 0276's, unchanged |
| the skull is half again as long as it is tall | `tests/authored.ts`, `0288-lean` — advisory |

⚠️ **THE BOUND ON THE HURTBOX IS THE SKULL'S OWN TWO AXES**, so it travels when the art does and
nobody has to remember to move it. Both ends are numbers the picture supplies rather than ones
somebody tuned: a disc smaller than the head is tall has edges to shoot through, and one larger than
the head is long takes hits off its own nose.

⚠️ **AND *HOW MUCH* LONGER IS A TASTE.** *A head taller than it is long is a frog* is 0276's, has no
correct counter-example, and still fails hard at a ratio of 1. Half again as long is what the report
asked for, and a later pass that traded snout for jaw would redden it and be right —
[0192](0192-a-guard-holds-an-invariant.md)'s admission test.
