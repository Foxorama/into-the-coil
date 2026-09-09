# 0286 — A serpent runs off the screen

**Accepted 2026-09-09**, from the second play of the chain —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"the body is short and squat, it should be long enough to stretch off the screen for a serpent →
> I mean add more segements, not stretch out the segments that are there."*

**Follows [0283](0283-the-serpent-is-a-chain.md)**, which built the body, and
[0285](0285-the-mouth-is-alive.md), which was the other half of the same report.

## The rules

**A boss may be longer than the screen, and its HULL is what has to stay on it.** What the on-screen
rule protects is that the part the player has to fight is reachable — not that the whole animal is
visible.

**A placed entity is not culled.** A pool member with no velocity of its own, written to a position
every step, cannot wander out of the world; a cull applied to it measures only how long the thing is.

**0022's worst case is argued against a desktop, and a boss with a body is a line on its list.**

## ⚠️ Why it read as short, which is not the same as being short

The body was 46 units long and the head stands at 119 on a screen that is 178 units wide at its
narrowest — so the tail stopped about twelve units short of the leading edge. **The animal was not
too short for the screen; it was exactly short enough to fit on it**, tapered tail and all, and a
serpent whose end you can see is a serpent with a length.

It is 133 units now, which puts the tail at 253 — off the leading edge of a 21:9 view as well as a
16:9 one. **The taper is still authored and is simply never on screen.**

⚠️ **AND THE SEGMENTS ARE THE SAME SEGMENTS.** *"Not stretch out the segments that are there"* is a
claim about two numbers, because a disc's spacing is `step × girth`: the widest girth is 11 as 0284
left it and `step` is 0.53 as 0283 left it. Fifteen more discs are spliced into the middle, where an
animal's body is the same thickness for most of its length. `tests/level.test.ts` holds both halves.

## ⚠️ The ceiling, which is the real cost of this and is not hidden in it

Eleven nodes was never an art decision. 0283 took eleven because eleven was what the particle share
could spare, and `src/content/bosses.ts` has said so in writing since: *"A longer, thinner serpent is
more nodes, and more nodes is pool the game does not have."* That paragraph is what this decision
answers, and it named the cost correctly.

**There was nothing left to shed.** The pools totalled EXACTLY 500 and
[`tests/flares.test.ts`](../../tests/flares.test.ts) prices the fullest moment the debris pool ever
sees at **148.9** against the 149 it is left — so `debris` is unchanged here, and the eleven it
already paid for are still the eleven it pays for.

⚠️ **THE OTHER FIFTEEN COME FROM RAISING 0022's WORST CASE TO 515, AND THAT NUMBER HAS BEEN STALE
SINCE 0153.** 500 was derived from ~10ms a frame on a Snapdragon 695;
[0153](0153-desktop-is-the-target.md) superseded **the sizing half of 0022** and says in as many
words that *the phone may not be cited as a reason to make something smaller, shorter or fewer.*
Nobody moved it, because until now nothing had been refused by it — and a quantity is checked in the
case it is applied to rather than the case it was measured in
([0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md)).

⚠️ **THIS IS NOT THE REOPENING 0022 WARNED ABOUT.** That one is danmaku density — Touhou and
DoDonPachi at 1,500+, *"a different game from the one in `docs/game.md`"*, and its conversation is
WebGL. This is one boss growing by fifteen discs on a target that was never the phone. **Every rule
0022 made about HOW to be fast is untouched**: fixed 60Hz with an interpolating renderer, art baked
and blitted, nothing allocating in the frame loop, cosmetics shed before fidelity, DPR capped at 2.
`tests/budget.test.ts` still counts draw calls and allocations rather than wall clock, for
[0025](0025-the-frame-budget-is-counted-not-timed.md)'s reason, which was never about the phone
either.

⚠️ **AND A BOSS WITH A BODY IS A NEW LINE ON THAT LIST RATHER THAN A BIGGER HELPING.** 0022's worst
case is itemised — ~150 enemy bullets, ~80 player projectiles, ~40 enemies, ~200 particles — and
every item is a thing there are MANY of, sized by how many can be in flight. One boss that is
twenty-six entities is a category the list did not have, which is why the answer is a new total and
not a re-slice of the old one.

## ⚠️ The defect the length exposed, and it could not have happened at eleven

**The serpent fought the whole fight one segment short and nothing said so.**

A chain's nodes have no velocity. `layChain` writes each one to `head.along + offset` every step —
they are a rig, not traffic. But they sat in a pool that `stepEntities` culls at the leading edge like
anything that flies, and **a serpent arrives from that edge**: during the approach the head is far
up-lane and the 133-unit tail is past the spawn margin, so the last node was released. `layChain`
re-lays only when the pool is EMPTY, so it never came back.

⚠️ **AT ELEVEN NODES IT COULD NOT HAPPEN**, which is why no guard had ever asked: the body was 46
units long and the margin is deeper than that. The node count was solved with the boss parked on
station and spent during its arrival — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s
fourth rule, *a boss fight has an arrival, phases, windows and a death, and a fixture that stands the
boss on station has flown one of them.*

The fix is that the body's leading cull is `Infinity`, and the reason is a property of what a node
IS rather than a number about how long this animal happens to be.

## ⚠️ And one guard was measuring the cull rather than the claim

*A hit anywhere on the body is a hit on the serpent* aimed at the last node. That node is 250 units
up-lane now, past `cullPlayerShotAlong` — which is *"you can shoot what you can see"* and is a
promise this change must not quietly break. The shot was released before it touched anything and the
guard reported the body as decoration. **Which node was never the point**, so the fixture asks for the
furthest one inside the player's reach rather than the furthest one there is.

## What is held, and where

| Claim | Where |
|---|---|
| the serpent is longer than the WIDEST screen the clamp allows | `tests/level.test.ts` |
| and its girths and spacing are the ones it already had | `tests/level.test.ts` |
| every boss's HULL stays on the narrowest screen | `tests/level.test.ts`, as before, now on `radius` |
| the body keeps every segment through the ARRIVAL, not only on station | `tests/serpent.test.ts`, driven |
| the pools do not exceed the worst case | `tests/budget.test.ts`, at 515 |

⚠️ **THE LENGTH CLAIM IS ABOUT `jormungandr` AND NOT ABOUT CHAINS.** *"A specific instruction about a
specific segment should never be generalised"* — a later boss may be authored as a short chain and be
right. A guard reading *every chain runs off the screen* would force this animal's character into
shared code, which is 0282 in the form that rule takes for a guard: every instance authors its own
length, and this instance's is long.

## What this does not do

The body still undulates on one wavelength and one sway, so a 133-unit animal shows about 1.7 waves
where it used to show half of one. That is more serpentine and it was not tuned for — the bend rule
is local and `tests/serpent.test.ts` holds it, but nobody has yet played a body this long and said
what the wave should be.
