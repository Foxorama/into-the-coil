# 0342 — The hulks come out

**Accepted 2026-09-21.** **Amends [0222](0222-the-background-is-not-black.md)** — its instrument, its
ink lift and its band over `STRUCTURE_OF` all stand; the one piece of content it added is removed and
the two guards that required that content go with it. **Applies
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)** to the sky, which it had not
been applied to. **Opens** [`the-places-are-painted`](../../reports/the-places-are-painted-2026-09-21.md),
which is the queue this is the first item of.

## The ask

> *"The backgrounds for each level are kind of basic and crappy. Can we remove the 'asteroid' layer as
> it's just a really bad layer that shows up on every level and then improve each level."*

## What it was

`hulks()` in `src/render/bake.ts`: a dark polygon of seven to eleven sides with a hairline rim in the
place's accent, twenty-odd units across, called from **five** of the seven rows of `STRUCTURE_OF` —
The Approach, Ember Nebula, Saurian Belt, The Labyrinth and The Black Heart — with a different count,
roughness and alpha each time.

Photographed at the shipped camera before anything was changed (`scripts/shot-place.mjs`, three points
a place): it reads as an empty outline drawn over the level. In The Approach and The Black Heart the
body is invisible and only the wire is left; in Saurian Belt it is a navy heptagon hanging in a
daytime sky; in The Labyrinth it sits across the corridor wall it was meant to be built from.

## The rule

**The hulks are deleted, from all five places, and nothing is put in their slot by this decision.**

0222 was right about the report it answered — *"a plain black background is a plain boring game"* —
and right that 0203's band leaves only specks and very large things. What it built was **one generator
with five parameter sets**, and [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)
names the tell: *a mechanism whose output is identical for every kind.* A different side count is not
a different drawing, and the player said so in the words *"shows up on every level"*. Five places
sharing a large object is five places reading as one, which is the exact failure
[0196](0196-the-backdrop-is-rounded-out.md) and [0211](0211-every-place-has-its-own-structure.md)
were written about.

**What goes at that scale in a place is that place's own drawing, on its own row, or nothing.** Ember
Nebula has the Pillars, Saurian Belt has its volcanoes, The Black Heart has the heart. The queue in the
report is where the rest get theirs, one place at a time, each judged in a photograph.

## Two guards are deleted, and [0192](0192-a-guard-holds-an-invariant.md) is why

`tests/places.test.ts` held two claims that only hulks satisfied:

| the guard | what it is, on 0192's question |
|---|---|
| *something is actually IN the far half of it* | It **requires content**: some place must draw a compact shape over sixteen units. *Name a change to the content that would redden this and be correct* — this one, asked for by the player in a sentence. It was never an invariant; it was 0222's art direction with a failing exit code. |
| *a hulk has an edge* | With no hulk left it iterates over nothing and cannot fail. A guard that cannot fire is deleted rather than kept for the day someone draws another — the lesson it carries (a dark mark on thin gas is invisible) is in 0220 and 0222 and does not need a loop to hold it. |

Their two probes in `scripts/probes/0222-the-background-is-not-black.mjs` go with them. **The band
itself stays**, with its probe: *no compact structure mark is the size of something that can kill
you* is about what a player can mistake for a threat, and removing content cannot redden it.

## What was checked, and by what

| claim | checked by |
|---|---|
| the hulks are gone from the picture in all five places | `scripts/shot-place.mjs` against the branch's own dev server, read as PNGs |
| nothing else anchored on the deleted text | every probe's `find` counted against the tree — 1,228 anchors, none stranded, and the same script reads 1,203 and none on `main` |
| the remaining sky guards still hold | `tests/places.test.ts`, `tests/sky.test.ts`, `tests/budget.test.ts`, `tests/themes.test.ts` |

## What is owed

**Every place is emptier than it was, on purpose, until its own item in the queue lands.** The
Approach is back to one limb and a star field, and The Black Heart to nine streaks. That is a worse
answer to *"a plain black background"* than 0222 gave, for as long as the queue takes — and the first
two items in it are exactly those two kinds of place.

No rollback note: nothing here touches a storage key, the save schema, the cache prefix or the origin.
