# 0283 — The serpent is a chain

**Accepted 2026-09-09.** Reported twice, three PRs apart:

> *"it needs to actually move/undulate, it's a static image that bounces up and down now and like
> y'know looks a bit weird."* — [`the-serpent-has-menace`](0277-the-serpent-has-menace.md)
>
> *"our serpent boss on The Approach still looks like a worm, and it's not animated at all… there's
> no movement to the sprite itself, it's a flat static image that isn't alive."*
> *"the body needs to be longer."* — [`the-serpent-played`](../../reports/the-serpent-played-2026-09-08.md)

**Discharges the fork [0277](0277-the-serpent-has-menace.md) left open** — *phase frames against a
segment chain* — and answers the request it could not: *"we need to update the boss collision to no
longer be a disc if we can."*

**Built under [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)**, which landed
the day before after one wake was written for fourteen bosses.

## The rule

**A boss row may have a `chain`, and one does.** `Chain` is the animal's body: the bitmap its nodes
are drawn as, the girth at each node, where the neck starts, how far apart they stand, and the wave
that travels down them. `src/app/frame.ts` lays out whatever it is handed and knows nothing about
serpents; thirteen rows say `null`.

**The head is the hull and the body is the hurt shape.** `boss8` is a skull, twenty units; the eleven
nodes behind it are entities with their own places, their own girths and their own hurtboxes, and
whatever lands on one is spent on the head.

## ⚠️ Why a bitmap could never have done this, which is the whole of the fork

`src/render/scene.ts`: **"`blit` cannot rotate"**. A hull is one picture, drawn once at boot — so a
serpent painted mid-wave holds that wave for the entire fight, and *"a flat static image that isn't
alive"* is a correct description of every possible version of it. 0277 costed the two ways out and
this is the one that also answers the collision, the length and the coil.

⚠️ **AND THE BLIT BUDGET 0277 EXPECTED TO PAY FOR IS UNTOUCHED.** Its fork table reads *"blits ~14,
and `tests/budget.test.ts` asserts blits equal one per entity EXACTLY"* — true of drawing one entity
fourteen times, and not of what happened: **the nodes are entities**, so eleven of them cost eleven
blits, which is what eleven of anything costs. What the chain actually spends is **pool slots**, and
that bill is real.

## ⚠️ The nodes are placed, not followed, and the reason is the camera's frame

The obvious model is the garden one: each segment chases the one in front along the path it took.
**It collapses here.** A boss holds STATION, so in the camera's frame its head travels no distance
along the lane at all — the recorded path is a line swept back and forth across the lane, and a chain
placed along it folds into a flat zipper. Nothing about the art would have fixed that.

So the body is laid out in **along-space**, head-end first, and three things decide where each node
sits across the lane:

| | |
|---|---|
| **the travelling wave** | `sin(phase − offset / wavelength × 2π)`, with `phase` advancing every step — the crest moves tailward down a body that is otherwise still. That is what undulation IS |
| **the amplitude ramp** | nothing at the neck, the row's `sway` at the tip. An animal whose whole body swings by the same amount is a rope being shaken; one whose head holds a line while the wave grows is swimming |
| **the lag** | a node reads where the head's lane was `offset × lag` steps ago, so a turn flows down the body instead of arriving at it. Without it the body is a rigid offset and a boss changing lane drags it sideways like a plank |

⚠️ **AND BOTH THE WAVE AND THE LAG ARE READ IN WORLD UNITS ALONG THE BODY, NOT PER NODE.** Nodes are
spaced by their own girth, so a whip-thin tail packs three times as many of them into a unit of lane
as the midriff does — a wave counted per node ran three times faster there and kinked the tail while
the midriff stayed smooth. The bend guard caught both, at **0.44** and then **0.81** of the local
girth.

## ⚠️ Four things the guards found that no amount of looking would have

**Every one of these was a real defect, and three of them are invisible on a still.**

| | measured |
|---|---|
| the neck inside the skull | the body started at the head's own centre, so the first two points of the spine were the same point — a joint with no length, at **0.13 of its own girth** |
| the wave counted per node | the tail bent at **0.44**, on an animal whose midriff was perfectly smooth |
| `Math.round` on the lag | two adjacent tail nodes read the head's lane one whole step apart, and the head bobs at three quarters of a unit a step: a **twenty-four degree** corner out of nothing but the rounding |
| the thick part, not the tail | with all three fixed the worst place in the animal became the **midriff** — a bend radius is measured against girth, and the midriff has the most of it. 55 → 80 on the wavelength |

## ⚠️ And four things only the photograph found

[0027](0027-measure-the-picture-not-the-model.md). Every one of these passed every guard in the
repository.

1. **The body baked pink.** The head is a lord's hull and wears its place's skin; the body was on no
   list, so a venom-green skull towed a row of dusty-pink discs. The row names its body's sprite now,
   and `LORD_HULLS` reads it.
2. **A hard horizon across every node.** The belly band was a slice of the disc closed by a chord,
   and a chord is a straight line across a round thing.
3. **A stack of croissants.** `seal` outlines the whole disc, and a disc's outline is drawn over the
   flesh of the node beside it. Three more arrangements were photographed before the answer was *a
   node has no outline at all* — see below.
4. **A caterpillar.** Fifteen and a half units thick over fifty-five long is under four to one, and
   it read as a grub however it was painted. Eleven over fifty-five is five to one.

## ⚠️ A node has no outline, which took four photographs and is the one exception in the file

Every hull in `src/render/bake.ts` is **sealed** — filled and stroked — and a chain's node must not
be. It is a slice of one animal, and its rim is drawn over its neighbour's flesh. In order:

| drawn | came back as |
|---|---|
| `seal`, the whole disc | a stack of croissants — a dark arc ruled across the body eleven times |
| a 23° arc top and bottom | a row of stitches: two neighbours of different girth put their arcs at different heights and the ends did not meet |
| a long arc toward the head | dashes — that half is buried by the next node, so almost none of it showed |
| a long arc toward the tail | the croissants back, heavier |

**So the body is edged by its aura and its rim light**, which is what the reference does and what
[`the-vocabulary-is-the-ceiling`](../../reports/the-vocabulary-is-the-ceiling-2026-09-08.md)
describes: *the same stroke blown out and dimmed*. The head keeps its outline, because a head IS a
hull. `tests/accents.test.ts` asserts **zero** outlines on a node rather than exempting it, so the
croissants cannot come back quietly.

## ⚠️ The body's shape is the anatomy and the design sits on it

> *"The creature should have the functional body shape of a creature — the 'design' should then
> enhance and accompany it."*

`girth` is the animal's cross-section down its length and nothing else: **6 at the neck, 11 through
the midriff, 2 at the tip.** It rises before it falls, which is 0277's own finding — *a worm is
widest directly behind its head; a snake has a neck* — authored where the animal is rather than baked
into a drawing. The head is wider than the neck it joins, and that step is the single mark that says
*snake* before any paint is on it.

Everything else is paint over that shape: one light direction, a rim along the back, a turn-under
along the belly, a scale field, and an aura.

⚠️ **AND *SHARP ANGLES* IS AN INSTRUCTION ABOUT THE DESIGN, NOT ABOUT THE BODY, WHICH THIS FILE
GETS RIGHT ONLY BECAUSE IT WAS CORRECTED.** [`the-serpent-played`](../../reports/the-serpent-played-2026-09-08.md)
read *"no sense of… sharp angles"* as being in tension with 0277's *"a serpent would be more curved
because of the spine"* and flagged it as a contradiction. **It is not one.** Said plainly afterwards:
*"previous instructions about sharp angles were only related to body shape not aesthetic design."*
The bend rule governs the skeleton; how sharp the creature is allowed to LOOK is untouched by it, and
the report's reading was wrong.

## ⚠️ What the screen costs, which is now the ceiling instead of the sprite box

Two guards pull against each other and between them they cap the animal at about sixty units:

- [0061](0061-a-boss-keeps-flying.md) wants the whole hull on the **narrowest** screen — 177.8 units
  — and that is measured against the chain's own reach now, not the head's radius. Left as it was it
  would have gone on passing at **126** with the tail hanging off the leading edge.
- [0101](0101-the-sky-is-a-hurry-and-the-boss-holds-back.md) wants the near edge past **55%** of that
  screen, which is why the station came back from 128 to 114 rather than further.

**And the thinness is capped by the node count.** The body is overlapping discs, the screen fixes its
length, so the spacing is about `length / nodes`; much thinner and the discs stop overlapping and the
tube becomes a string of beads. **A longer, thinner serpent is more nodes, and more nodes is pool the
game does not have.**

⚠️ **ELEVEN NODES, AND THE OBVIOUS ARITHMETIC SAID NINETEEN.** `tests/budget.test.ts` prices a boss
and a ship coming apart at **140.1** fragments against a debris pool of 160. `tests/flares.test.ts`
prices the same moment *with the fireballs a beat lights beside its shards* at **148.9**. Fourteen was
taken on the first number and the second refused it — 0282's fourth rule catching this decision on
its way past, the day after it was written.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0283`:

| broken on purpose | went red |
|---|---|
| the body a rigid offset from the head, so it is a picture being carried rather than an animal | `THE REPORTED ONE: the body moves, and it moves differently from the head` |
| the body starting at the head's centre, so the neck is inside the skull | `no bend is tighter than the animal's own spine allows` |
| the undulation tightened, so the animal turns inside its own width | `no bend is tighter than the animal's own spine allows` |
| what lands on the body never reaching the animal | `the body is one animal: a hit anywhere on it is a hit on the serpent` |
| a node sealed like a hull, so its rim is drawn across the node beside it | `is more fills in the SAME bitmap, and not a second sprite over the first` |
| the body lengthened past the narrowest screen | `the whole hull stays on screen on the narrowest device` |
| the body added to the pools without taking the slots from anywhere | `never asks the frame to draw more entities than the budget was measured for` |

⚠️ **THE FIRST ASSERTION IS THE REPORT AND IT MEASURES THE SHAPE, NOT THE MOTION.** A body that only
slid about with its head would satisfy *the body moves* and would be exactly what was reported — a
rigid picture being carried around. What is measured is each node's offset across the lane **from the
head**, and that the offsets themselves change. No baked bitmap passes it at any amount of art.

⚠️ **AND `tests/accents.test.ts` LOST ITS SERPENT AND GAINED A BETTER ONE.** The bend rule was
measured there against a baked spine, because the whole animal was a drawing; it is measured in
`tests/serpent.test.ts` now, on the animal that is actually on the screen, in world units, driven
over three hundred steps. That is the same move 0027 asks for and the old home could not offer.

## What is owed

**A play.** The undulation cannot be judged from a still, and everything above is a model quantity
until the fight is flown — 0027.

**And the coil is not here.** 0277 expected the chain to bring it, and it can: nodes are drawn in
order, so a near one covers a far one and brings its own edge. What stops it today is length — a body
that crosses itself needs more of itself than sixty units and eleven nodes buy. **It is a node-count
question, and the node count is a pool question.**

**The other six bosses are untouched.** None of them has a chain and none of them should get one
because this one has — 0282. What a boss's body is, is a question per boss.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A pool, a row field, two sprites
and a layout pass; nothing persisted, no storage key, no save schema, no cache prefix, no origin.
