# 0301 — The whip throws fireballs, and a trail is a row's own

**Status:** accepted
**Supersedes the drawing and the numbers in:** [0249](0249-the-eagle-summons.md)
**Builds on:** [0227](0227-a-sprite-is-painted-not-filled.md),
[0295](0295-a-ranking-guard-is-a-content-limiter.md), [0300](0300-an-acid-bead-has-no-heading.md)

## The report, twice

> *"The eagle boss at the end of the ember nebula's fire whip attack is super tiny little dots that
> are almost impossible to see, they should be super cool fireballs with a trailing fire trail."*

and, after a play with everything else fixed:

> *"Flame — the flame attacks are still super small on screen and super fast […] the whip should be
> throwing fireballs with fire trails, the main fireball part should be a similar size to the void
> blast, then with a fire trail, but it should look like a ball of fire, not a perfect orange
> circle."*

## Why it could not be fixed until now

At 1.2 units the flame drew **8.6 px** — the smallest thing in the game. And it was *required* to be:
`tests/legibility.test.ts` held every hostile bullet more than five pixels from every other **and the
quicker one smaller**, and the flame is the fastest shot there is. A visible fireball was illegal by
arithmetic until [0295](0295-a-ranking-guard-is-a-content-limiter.md) deleted the ladder.

It is now **5 units — the void's own size**, which is what was asked for.

## A ball of fire, and a tongue was the same mistake the acid had

[0249](0249-the-eagle-summons.md) drew a flame's outline: pointed at the front, notched behind where
it licks, **leaning the way it flies**. The whip throws these on an arc — `src/app/boss.ts` spreads
them across `sweep` and marches the speed so the lash bows — so the lean pointed somewhere the bead
was not going, exactly as the acid's teardrop did one decision earlier
([0300](0300-an-acid-bead-has-no-heading.md)).

So: fourteen points on an alternating radius, the long ones licking further at no two the same, so
the edge is ragged the whole way round and there is **no dominant point to be wrong about**. Lit from
inside rather than filled — the ink lightened under a hot yellow heart — because *"not a perfect
orange circle"*. The randomness is a seeded stream, so the bake is identical everywhere
([0021](0021-one-stream-per-concern.md)).

## The trail cost no mechanism, because 0227 already built it

[0227](0227-a-sprite-is-painted-not-filled.md) made a death a **flare**: a debris entity walking a
short list of frames by its own `lifeFor`, in no collision pairing, on
[0022](0022-frame-rate-is-a-feature.md)'s unclaimed particle share. A trail is that, dropped
repeatedly along a path instead of once at a point. `DEBRIS_KINDS` gains `ember`; `flare` is the
spawner unchanged.

⚠️ **AND THE TRAIL HANGS OFF THE SHOT ROW, WHICH IS THE HALF THAT MATTERS BEYOND THIS BOSS.**
`trail?: DebrisKind` — optional, so the fallback is *no trail*, which is what every shot had.
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s DEFAULT shape. Asked for in
these words:

> *"Fire, frost, void, acid all are generic types as well and we can have different 'fire' attacks,
> but one 'fireball' attack. […] Like we have two different lightning attacks which are perfectly
> good — the player's blue lightning and the bosses red lightning. Lightning is the base 'it behaves
> in a way', then the attack modifies its style."*

A frost shot that wants to shed ice names its own debris kind on its own row and **nothing in the
frame changes**. That is the two lightnings' model — one base, the style on the instance — applied to
what a bullet leaves behind it.

## The hurtbox: what was asked for, and what the game survives

The drawing went up 4×, and `tests/combat.test.ts` holds every hurtbox between 0.25 and 0.55 of its
drawing — art far larger than its hitbox being the *"it visibly hit me and nothing happened"*
complaint. The flame already sat at **0.55, exactly the ceiling**, so no version of a void-sized
fireball keeps the old 0.66.

Offered as three options with the arithmetic in front of them, and **take it** was chosen — hold the
ratio, let the whip get dangerous. Then a guard said no:

> `hydra phase 5 at burn: for at least one step there was NO place on the lane both safe and
> reachable — a pilot flying to the safest place it could see had nowhere to go`

⚠️ **AND IT WAS THE HYDRA, WHICH NOBODY HAD ADDED UP.** Every option was reasoned about the eagle's
whip — five flames then seven, in a bowing lash. The hydra grows a flame head too
([0254](0254-the-hydra-grows-heads.md)), and its fifth phase is where the sums land. Measured across
the range:

| radius | ratio | hydra phase 5 at `burn` |
|---|---|---|
| 2.75 — the old ratio held | 0.55 | **unsurvivable** |
| 2.2 — the void's ratio | 0.44 | **unsurvivable** |
| 1.9 | 0.38 | **unsurvivable** |
| **1.75 — shipped** | **0.35** | survivable |
| 1.4 | 0.28 | survivable |
| 1.25 — the band's floor | 0.25 | survivable |

## And a first pass took 1.4 for margin, which was wrong, and was caught by being challenged

The number shipped at **1.4** for one draft, on [0245](0245-a-budget-is-sized-under-load.md)'s
instinct: 1.75 clears the cliff by under eight per cent, and a number that only just holds has not
been shown to hold.

Pushed back on — *"if I have to modify it because you borked the implementation by thinking the hydra
attack sequence was going to be difficult when it's not I'm going to be annoyed"* — and the pushback
was right. What settled it was flying the guard's own pilot with the ship's health left alone and
**counting what lands**, over twenty seconds of the phase at `burn`:

| radius | hits taken |
|---|---|
| 1.4 | 32 |
| 1.9 | 33 |
| 2.75 | 29 |

**Across a two-fold range of hurtbox, the damage taken does not move.** That phase is already
saturated by everything else the hydra throws; the flame is not what is hitting the player. So the
margin bought nothing and cost the thing that was asked for.

⚠️ **AND IT SHOWED WHAT THE GUARD IS ACTUALLY CATCHING, WHICH IS THE CHILL.** `widestReachableRun`
sizes *reachable* off `speedNow`, and the hydra slows the ship ([0253](0253-the-frost-ship-chills.md))
— so the cells the pilot can get to shrink, and a wider bullet closes the last of them. The failure is
real and it is about that interaction, not about this bullet's size.

⚠️ **THE LESSON IS 0027's AND IT WAS NEARLY MISSED IN THE DIRECTION NOBODY WATCHES.** *A model
quantity is not the picture* is usually cited when a guard is too permissive. Here a guard was doing
its job and its VERDICT was being read as a difficulty claim it never made — *there was no safe
reachable cell for one step* is not *this is too hard*, and the two were being treated as the same
sentence. The instrument that separated them took ten minutes and should have been built before the
number was chosen, not after.

**So it is 1.75: the most the standing invariant allows.** *Take it* was the ask; the only thing
between it and 2.75 is a guard, and that is a conversation about the guard rather than about balance.
The numbers to have it with are above.

## A guard the old wording would have forbidden

`tests/flares.test.ts` held *every frame of a flare is bigger than the last*. The two flares that
existed both expand — a death, and a spark spreading — so **grows** looked like what a flare *is*
rather than what those two happened to do. An ember cools and shrinks, and the shrinking is what says
which end of the trail is old.

0295's test, asked of the old wording: *name a change to the content that would redden this and be
correct.* There it was, in the next decision but one. What survives is the defect it was written for,
which was never about direction: **a frame that does not change size is a page turn nobody can see.**

## What is owed

- **A play-test on two bosses, not one.** The eagle is what was reported; the hydra is what the guard
  found. Both throw this now.
- **Nothing gives the ember a sound**, and a fireball that hisses is the obvious next ask.
- **The trail is fire-inked and cannot hurt.** A player may read a mote as a threat and dodge
  something harmless. Named because it is the honest risk of the choice, and because
  [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) is about the same gap pointed
  the other way.
