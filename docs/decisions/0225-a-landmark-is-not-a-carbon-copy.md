# 0225 — A landmark is not a carbon copy

**Accepted 2026-09-04.** Asked for the moment [0224](0224-the-mountain-is-awake.md) reported the
problem, before it had shipped.

> *"lets go and add that seed to the landmarks and levels, it sounds like it's going to be needed to
> make the levels more interesting rather than carbon copies"*

## The rule

**A landmark has three castings.** They are baked from three seeds at a level boundary, and a
`LandmarkEntry` names one with `variant`.

## ⚠️ A seed on the entry cannot work, and that is the whole design

The obvious change is a seed on the entry. **The entry is read in the frame; the drawing happens once
per level, at bake time.** So a per-entry seed means baking per entry — and the atlas is a **fixed
array of bitmaps** ([0065](0065-the-sky-is-baked-and-blitted.md)) with no room for a variable number.

So the seed picks from a fixed set of pre-baked castings instead. It is the same trade `landmark`
itself made in [0203](0203-the-rule-was-never-about-size.md): *one slot, seven completely different
drawings*, chosen by the place rather than by the sprite table. This is that once more, one level down.

⚠️ **THREE, AND THE NUMBER IS A MEMORY BUDGET RATHER THAN A TASTE.** A landmark is 75 units square and
bakes at up to ten pixels a unit — **2.25MB each**, so this costs **4.5MB** on top of the sky's existing
44. Three is enough that a level placing three never repeats one, and cheap enough not to be an
argument. A fourth is available for the price of saying so.

## ⚠️ The seed has to shape the mountain, not only its smoke

The first version keyed only the RNG-driven details on it — the plume's jitter, where the lava
wandered, where the bombs landed. Two castings on screen together read as **the same mountain venting
differently**, which is the report with an extra step in it.

Height, base width, crater and **flank exponent** all move now. The last is the one that matters most:
it is what makes a cone a cone rather than a pyramid or a funnel, and 1.05 against 1.3 reads as two
mountains long before a change in height does.

## ⚠️ And every place that draws one has to use its seed, not only the place that places three

A drawing that ignores its seed produces three identical castings — silently, in whichever place nobody
is looking at. The Black Heart places one landmark today and is the obvious one to skip; it takes a
seeded lean instead, and the guard is the same for all three drawings. **The claim is about the
machinery, so it is held everywhere the machinery runs.**

## What is held

| claim | how |
|---|---|
| every casting of a landmark is a different drawing | `tests/places.test.ts`, by traced coordinates |
| a level placing more than one uses more than one | same |
| every `variant` names a real slot | same |

⚠️ **THE SECOND ONE IS THE CLAIM THE REPORT ACTUALLY MADE.** Three distinct castings are no use to a
level that names the same one three times, and `variant: 0` is what a copied line says. *Castings
exist* is the mechanism; *the levels are not carbon copies* is the ask.

## What is owed

- **Three castings is not infinite variety.** A level placing four landmarks would repeat one, and
  nothing stops it — the guard requires as many castings as entries, so such a level would redden
  rather than ship a copy, which is the right failure but is still a limit.
- **`lane`, `depth` and `beat` are still authored per entry and are the only other axes.** A casting
  varies the drawing; a level varies the placement. Nothing varies the SIZE, because
  `SPRITE_EXTENT.landmark` is one number and 0203's forbidden band is measured against it.
- **The Pillars and the heart now vary too, and nothing has looked at them.** Both places place one
  landmark, so only casting 0 is ever drawn — the other two are baked, guarded to be different, and
  unseen. That is deliberate (a drawing that ignores its seed is the defect), but the first level to
  place two Pillars will be the first time anybody sees casting 1.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0225`.
