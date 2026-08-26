# 0195 — A place has its own sky, and the old one was the same canvas seven times

**Accepted 2026-08-25.** The second of the three the art brief needs, and the largest change to what a
level looks like since [0107](0107-a-level-is-a-place.md) gave one a backdrop at all.

> *"For the enemies I want fun level specific art and a level specific backdrop instead of the same
> starry canvas and a slight hue change on each level."*

## ⚠️ The second half of that sentence was a description of the code

`makeRng('sky').stream(kind)` took **no theme.** So every level in the game drew **the same stars in
the same places**, and `THEMES` changed two hex values over the top of them —
`space` and `nebula`. *A slight hue change on each level* was not an impression. It was the
mechanism, exactly.

⚠️ **AND NOTHING IN THE REPOSITORY COULD HAVE TOLD YOU**, which is the transferable half. There are
guards on how big a sky mark may be ([0069](0069-the-sky-is-behind-the-game.md)), how thin
([0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)), how much screen it may paint, how faint
the near layer must be, and whether anything edgeless is huge enough to be allowed
([0112](0112-the-sky-has-weather.md)). **Not one of them had ever compared two places' skies**, because
until now there was only one.

## The rule

**`skyField` and `nebulaField` take the place, and the stream is keyed by it.** One string —
`` `${theme}/${kind}` `` — is most of this decision. Everything else is a number.

**A place states a `SkyStyle`: density, size, tilt, length, clouds, cloud size, cloud alpha.** Seven
rows, and each is an idea about what the place is made of rather than a tint.

**The atlas remembers its place and a boundary re-bakes it.** `Atlas.theme`, and `atlasIsStale`
returns true on a place change **with no tolerance band** — the resolution test forgives a quarter,
because a re-bake for a DPI wobble is churn for a picture nobody sees. A place is not a quantity: the
sky either belongs to this level or to the last one.

## ⚠️ A place may THIN its sky and may never thicken it, and a guard decided that

The first draft let a place scale the mark size past 1 — bigger marks for tumbling rock at Saurian
Belt. `tests/budget.test.ts` measured `skyNear` at **0.36 world units, 40% of a bullet**, and reddened.

⚠️ **SO THE CEILING STAYS A PROPERTY OF THE SHARED CONSTANTS AND `size` IS CLAMPED AT 1.** That is
what makes *every guard over the sky now runs seven times* a true sentence rather than a hope —
0069's bound is written on `SKY_MAX_STAR_UNITS`, and a place that could scale past it would be a
place six others are not held to.

⚠️ **AND THE AXES A PLACE ACTUALLY DIFFERS ON ARE THE OTHER SIX**, none of which makes a mark more
like a bullet. That is not a consolation: density, tilt and length are what change the *character* of
a field, and size was only ever going to change its loudness.

## What the seven are, measured

| place | marks (far/near) | rush streak | far-layer ink | clouds |
|---|---|---|---|---|
| **The Approach** — open space | 90 | 11.0 u | 58.0 | 7 @ 0.162 |
| **Ember Nebula** — cloud and little else | 45 | 14.5 u | 29.5 | **14 @ 0.217** |
| **Saurian Belt** — tumbling rock | 68, tilted **+0.45** | 4.1 u | 42.4 | 5 @ 0.140 |
| **The Coil Labyrinth** — long structure going past | 50 | **38.6 u** | 21.7 | **2 @ 0.097** |
| **Rime Shelf** — a field of ice shards | **108**, tilted **−0.85** | 12.4 u | **69.2** | 4 @ 0.136 |
| **The Toxic Mire** — dense fine motes | **153** | 3.9 u | 30.7 | 11 @ 0.200 |
| **The Black Heart** — nearly empty | **27** | 24.8 u | **13.1** | 4 @ 0.215 |

⚠️ **THE TILT IS A THIRD MARK FORM AND IT COST NO THIRD LIST**, which is the thing
[0097](0097-the-sky-has-layers-and-the-tubes-have-sides.md) predicted would be expensive. A dot is
`len: 0`; a streak lies along `+x`; a **shard** is the same capped line turned. `SkyStar` gains one
number, `tests/budget.test.ts` still walks one loop, and the property it measures — how big a mark is
— does not depend on which way the mark points.

## ⚠️ What it costs per boundary, measured rather than assumed

[0022](0022-frame-rate-is-a-feature.md) makes this the question that has to be answered before the
mechanism is allowed to exist:

| | |
|---|---|
| a full 58-bitmap atlas re-bake | **1.6 – 3.2 ms** |
| the nebula tile on top of it | **1.0 ms** |
| one frame | 16.7 ms |

**A quarter of one frame, once, at a level boundary** —
[0063](0063-a-level-break-is-a-respite.md) already puts a screen there, and
[0133](0133-the-place-is-baked-at-the-boundary.md) already established the boundary as where a place's
material is built for the other channel. **Nothing per-frame changes and the blit count is identical.**

## ⚠️ `npm run prove` caught this decision's own headline guard doing nothing

**The two most important probes came back STILL GREEN.**

The first fingerprint of a field included each mark's radius, length and tilt. Restoring the shared
stream **still passed**, because a place also scales the *count* — so two fields drawn from one
generator produced different strings, and the guard was satisfied by density alone. **It had never once
tested the thing it is named for.**

⚠️ **THE FIX IS THAT POSITION IS THE QUANTITY THE STREAM OWNS.** On a layer of dots, `x` and `y` are
`margin + rng.range(0, span)` and nothing in `SkyStyle` touches either — so two places sharing a
generator have the same marks in the same places and differ only in how many. The guard now compares
**positions only**, pairwise, as the **leading run two places agree on**, and the floor is zero.
Radius and length are excluded because a place is *allowed* to change them.

⚠️ **AND THE NUMBER THE FIXED PROBE PRINTS IS THE REPORT.** With the nebula stream shared, The
Approach and Ember Nebula agree on their **first seven clouds, in the same places.**
[0019](0019-a-probe-must-be-seen-to-apply.md) is the decision that exists for exactly this, and it has
now caught a guard written in the same hour as the mechanism it guards.

## And a probe was stranded on the way past

0069's *ceiling written as a fraction of the tile again* anchored on the line this decision added a
clamp to. Re-aimed, not relaxed — the break is unchanged. `npm run prove` refused to run anything
until it was fixed, which is [0019](0019-a-probe-must-be-seen-to-apply.md)'s other half.

## What is guarded, and what deliberately is not

⚠️ **NOTHING ABOUT WHETHER A SKY LOOKS GOOD** — [0192](0192-a-guard-holds-an-invariant.md). *Ice
shards read as ice* is a taste; a correct authoring change reddens any number put on it. What is held:

- no two places put their marks in the same places, in any layer, or share a cloud
- a place may thin its sky and never thicken it past the shared ceiling
- an atlas baked for one place is stale for another
- every place still has a parallax at all — The Black Heart's density is 0.3 and a place that took it
  to zero would have no sky, which is the whole of what a sky is for
- every axis is moved by at least one place, and no place is the base composition on all seven —
  [0162](0162-a-place-has-its-own-ladder.md) shipped a mechanism empty and
  [0172](0172-a-place-opens-with-its-own-four.md) had to go back and fill it

## What this does NOT do

⚠️ **No enemy or boss art moves.** Level-specific enemies are the third PR and need a `variant` this
does not build. The sky is the backdrop half of the brief.

⚠️ **The backdrop is still a starfield plus cloud.** A place differs in how many marks, how big, which
way they lie, how long they streak and how much cloud there is — **it does not yet draw a different
KIND of thing.** Structure at the Labyrinth, ash at Saurian Belt and actual shards at Rime Shelf are
new mark geometry, which is a second pass on the same mechanism and wants an eye on this one first.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix. The atlas is baked at load and at a boundary; nothing is persisted.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the sky stream keyed by the layer alone, so all seven places draw the same stars | `THE REPORTED ONE: no two places draw the same stars in the same places` |
| the ceiling clamp removed, so a place may draw scenery as thick as a bullet | `THE ONE THAT CANNOT BE RECOVERED FROM: a place may THIN its sky and may never thicken it` |
| the place dropped from the staleness test, so the atlas never re-bakes at a level boundary | `THE ONE THE BOUNDARY TURNS ON: an atlas baked for one place is STALE for another` |
| the nebula stream left shared, so every place has the same clouds in the same places | `and the nebula is a place’s too` |
