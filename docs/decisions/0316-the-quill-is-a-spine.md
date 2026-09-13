# 0316 — The quill is a spine

**Status:** accepted
**Amends:** [0262](0262-the-eagle-throws-quills.md) — the drawing, and nothing else about that decision
**Builds on:** [0312](0312-the-eagle-was-always-a-fish.md), [0315](0315-the-fish-throws-a-breaker.md)
**The brief:** [`the-fish-asked`](../../reports/the-fish-asked-2026-09-12.md)

## The ask

> *"Needs a high class good quality art and assets for the attacks."*

## What it is

The fish's own bullet is a **barbed fin-spine**, point first, where it was a feather. `quill` is `spine`
— the row, the sprite key, the painter and every sentence that described a vane.

**Every number is 0262's and did not move**: the place on the hostile ladder between the slab and the
void ring, the speed, the ink, the 4.2-unit drawing and the hurtbox at 0.26 of it. What changed is the
shape.

⚠️ **AND THIS IS THE ONE PLACE 0312 DELIBERATELY LEFT AN EAGLE.** Its own words: *renaming a thing in
the PR before the one that rebuilds it is churn that makes the rebuild's diff unreadable.* This is that
PR. A feather was the right drawing for the animal 0262 was written about, and *"the bullets need to be
feathered quills"* is still what was asked for then — [0249](0249-the-eagle-summons.md)'s and 0262's
prose is untouched, on 0029's terms.

## What separates it from the feather it replaces

A vane is a fine even comb down both sides, widest near the tail. This is **three barbs a side, each
bigger than the one in front of it, raked back off a needle point** — so the silhouette reads as a thing
that goes in and does not come out. Still not the lance's dash (a bar with no edge), not the acid's drop
(round at the back), not the missile's dart (pointed both ends).

⚠️ **THE POINT LEADS, WHICH THE SHAFT DID TOO, AND THAT HALF IS KEPT ON PURPOSE.** Both are drawn along
their own travel; it is what made a quill legible in the first place and it is the reason a bullet this
small reads as *aimed* rather than as a smudge.

## Three photographs and two guards decided the mark, not an opinion

⚠️ **[0027](0027-measure-the-picture-not-the-model.md), AND THE SHEET DID ALL THE WORK.** The first
draft kept 0262's shaft — a rectangle 0.12 wide. On a feather the vane was wide and that read as a
stripe inside it; on a needle it filled the hull edge to edge, and forty-two pixels of bright bar with
three pairs of spikes off it is a **fish bone**. The point was a blob.

| what the photograph said | what changed |
|---|---|
| the core fills the hull, so there is no taper | thinned to 0.08 — and `tests/accents.test.ts` refused it at **2.03 px against a floor of 2.5**: a mark too thin to be drawn is not a mark |
| so it keeps its width and gives up its front half | it runs only where the hull is thick; the needle is bare ink to the point |
| the point is a halo, not a needle | the glow moved off the tip, where 0262 had put it over the wide end of a vane |
| the point is too short to read at 42 px | the front barb moved back, so the needle is the front third of the drawing |

## And then the fight was photographed, and the spines were flying sideways

⚠️ **THE BREAKER IS THE FIRST ATTACK IN THE GAME THAT SENDS A BULLET NINETY DEGREES OFF ITS BAKE.**
Every sprite is baked facing down the lane, and every fan's angles are small enough that *"the shaft
points the way it flies"* holds without anybody doing anything. 0315's wave rises **across** the lane —
and the first in-game photograph of it is a rank of little bars sliding up the screen **edge-on**, with
every assertion about where they were staying green.

So a spine carries a `turn` now, the way 0313's hull and 0314's shoal do. That is not a change to the
breaker, it is a change to **this drawing**: a feather with no vane showing is still a feather, and a
barbed spine seen edge-on is a stick.

⚠️ **AND `turnFor` MOVED TO `src/sim/entity.ts` TO GET THERE.** 0306 put it in `src/app/frame.ts`, which
was the only caller; the spines are thrown by `src/app/boss.ts`, which cannot import the frame that
imports it. It goes where `turn` and `prevTurn` are declared — one description of what a turn means,
for the four things that now carry one.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0316`:

| broken on purpose | went red |
|---|---|
| the spines of a breaker not turned to their flight, so the wave rises edge-on | `THE ASKED-FOR ONE: the wave comes up off the EDGE` |

⚠️ **AND ONE PROBE IS THE WHOLE TABLE, WHICH IS THE HONEST SIZE OF IT.**
[0192](0192-a-guard-holds-an-invariant.md): *name a change to the content that would redden this and be
correct.* Every other claim worth holding about this bullet is already held and already probed — 0262's
*the fish throws its own bullet and not the lancer's lance*, its ink, its rung on the ladder and the
rake; `tests/accents.test.ts`'s containment and minimum mark; `tests/combat.test.ts`'s band between the
hurtbox and the drawing. **Two of 0262's probes were re-anchored** — the row and the guard's name both
moved with the drawing — and both still fire.

What is NOT guarded is *does it look like a spine*, and inventing a guard for that would be a content
limiter over a silhouette ([0295](0295-a-ranking-guard-is-a-content-limiter.md)). The sheet is the
evidence, and the morning's play is the verdict.

## What this deliberately does not do

- **The kite is still 0249's diamond.** The other half of the adds' art: 0314 drew the minnow as the
  place's own creature and left the kite alone, and nothing here changes that.
- **The flame is untouched.** Fire is generic across places by design (0296's ink rule), and the whip is
  a *fire* whip in a nebula — the one attack of this fish's whose material is the place rather than the
  animal.
