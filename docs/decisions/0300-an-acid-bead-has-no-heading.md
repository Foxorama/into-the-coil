# 0300 — An acid bead has no heading

**Status:** accepted
**Supersedes the drawing in:** [0248](0248-the-serpent-strikes.md)
**Builds on:** [0290](0290-the-acid-is-serpentine.md), [0149](0149-a-hull-has-an-interior.md)

## The report

> *"Acid needs a better graphic, it's currently drops that look weird as hell because they wouldn't
> look like that as a 'spray' coming from a source."*

## The wrongness is the heading, not the draughtsmanship

[0248](0248-the-serpent-strikes.md) drew it round below and pointed above — *a disc with a tail, and
the tail survives fifteen pixels*. That is a good drawing of a **falling** drop.

This bead does not fall. [0290](0290-the-acid-is-serpentine.md) made the attack a serpentine spray,
and `src/app/boss.ts` throws every bead on its own heading:

```
angle = Math.PI + boss.firePhase + attack.sweep * Math.sin(t * attack.waves * TAU)
```

So a volley leaves on headings spread across a sine, and **every bead flies a different way**. `blit`
cannot rotate ([0022](0022-frame-rate-is-a-feature.md)), so the point stayed north while the thing
went west. Three of every four beads were drawn pointing somewhere they were not going.

⚠️ **WHICH IS WHY THE ANSWER IS NOT A BETTER DROP.** Any silhouette with a dominant point asserts a
direction the sprite cannot have. The fix is a shape with **no** heading to be wrong about.

## What it is now

An irregular blob — lumpy rather than round, because a perfect circle is the pulse's shape and reads
as a bead rather than as something thrown — with **two droplets thrown clear of it**, because a spray
is more than one thing.

⚠️ **CHOSEN FROM A PICTURE RATHER THAN FROM A DESCRIPTION.** Four candidates were baked through the
game's own atlas and drawn at four headings each, with a line through them showing the way that bead
was actually travelling. A fifth was rejected on sight and it is worth recording why: **a rounded
seven-lobed splat is the frost shard's six-pointed star at a different ink**, and near-identical
silhouettes in different colours is the one thing `tests/legibility.test.ts` still holds after
[0295](0295-a-ranking-guard-is-a-content-limiter.md).

## The guard moved the work, which is the point of having it

The first build painted the droplets **after `seal`**, in the hull's own ink, so they looked like part
of the body. `tests/accents.test.ts` failed it:

```
mark 2 on the acid at approach (#b4ff5a) comes within -4.74px of the outside of its hull
against a floor of 0 … a negative number means it is over the edge
```

[0149](0149-a-hull-has-an-interior.md)'s floor, doing exactly its job. A mark outside the sealed path
means **the silhouette the player reads is not the one the file draws**, and every extent and hurtbox
claim in the repository is measured against the sealed path.

[0192](0192-a-guard-holds-an-invariant.md): *a red guard is never answered by changing the work to
suit it.* So the blob shrank and the droplets moved inside the unit radius, into the **sealed path**
via `ring` — where they are the silhouette rather than marks on it.

⚠️ **AND *CLEAR OF THE BLOB* IS LOAD-BEARING TWICE.** `seal` fills `evenodd`, so a sub-path that
overlapped the body would be a **hole** — a crescent bitten out of it — rather than a fill. A droplet
that sits apart is genuinely two objects, which is what a spray is. The guard pushed the drawing
towards the thing that was asked for.

## What this deliberately does not do

- **The size, speed, hurtbox and ink are untouched.** This is a silhouette change only.
- **Every bead in a volley is still the same bitmap.** Real variety inside one spray needs two or
  three acid sprite kinds and a spawner that picks between them — a bigger job, named rather than
  slipped in. Nothing here forecloses it.
- **No new guard.** The shape is an authoring choice, and 0149's containment floor already holds the
  only thing that has to be true of it.
