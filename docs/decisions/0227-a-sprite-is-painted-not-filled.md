# 0227 — A sprite is painted, not filled; and a death is a fireball

**Accepted 2026-09-04.** The first of the art pass asked for on 2026-09-04, and the pipeline the rest
of it stands on.

> *"Let's do a good pass on the graphics as well, the basic stuff that is being held by accessibility
> requirements needs to go, I want detailed sprites for each level, the player ship, weapon fire,
> missiles, missile explosions, enemies, enemies exploding etc. Time to actually put a real skin on
> the game."*

## ⚠️ What was in the way, and it was the function

`drawKind` set **one** `fillStyle`, ended every arm at one fill and one stroke, and then read a table.
[0149](0149-a-hull-has-an-interior.md) put marks in `space` in that table;
[0194](0194-a-hull-has-a-livery.md) let a mark name one of three more inks. Two decisions, one table,
and a sprite was still **a silhouette with a stencil over it** — a shape could not have an underside
in shadow, a lit nose, a halo, a plume, or a colour the palette did not name. The report calls that
*"the basic stuff"*, and it was: not a choice about these shapes but the only picture the function
could produce.

[0198](0198-the-accessibility-pass-comes-after-the-game.md) already moved the floors that shaped
0194 — the decorative inks held apart from the meaningful ones, the void on the high-contrast palette
— after the game. What it did not move was the mechanism, and the mechanism was the ceiling.

## The rules

**A sprite is a drawing.** An arm builds the hull as a path, seals it — one fill in the kind's ink,
one outline in `space` — and then paints whatever it likes on top through the helpers under THE PAINT
in `src/render/bake.ts`: `poly`, `disc`, `band`, `glow`, `carve`. **A colour is a palette ink or a
`shade` of one**, never a hex in an arm, so the high-contrast palette still gets the same drawing in
its own terms and its decorative inks still collapse to the void.

**What was held is still held, over the trace rather than over a table.** `tests/accents.test.ts`
reads every fill through `tests/paths.ts`, which now records the colour and the alpha of each, and
asks of every body:

| claim | of what |
|---|---|
| a **solid** mark is inside the hull | alpha ≥ 0.9; in `space`, with 0149's 2.5 px to spare |
| a **translucent** mark stays inside the sprite's box | alpha < 0.9; a plume, a halo |
| no solid mark is under 2.5 CSS pixels on a 1280×720 screen | [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md) |
| a hurt twin is the hull, flat, in its flash ink, with nothing painted on it | [0035](0035-damage-is-legible-on-the-body-that-took-it.md) |
| no two boss hulls are one drawing, and every boss is painted | [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) |

`ACCENT_OF`, `AccentShape` and the ink-order loop are gone. The seven boss interiors are the same
seven lists of marks, painted by their own arms through `carve` — bit-for-bit the same picture.

**A death is a fireball as well as shards, and a missile lands with a spark.** Six new sprite kinds —
`burst0..3`, `spark0..1` — and a `DebrisRow` per debris kind in `src/content/debris.ts`: the body it
spawns as, its frames, and how many steps each is held. `src/app/frame.ts` lights one at every enemy
death, at the ship's wreck and at every pulse of a boss or a ship coming apart, and one spark wherever
a missile lands; `turnFlares` walks each through its frames off its own `lifeFor`. A debris entity's
`kind` is which row it is — the same opaque index every enemy carries, pointing into a list content
owns.

**The eyes are `scripts/shot-sheet.mjs`.** It drives the sheet
([0193](0193-the-sheet-is-the-instrument.md)) headless and writes one PNG per named kind at a zoom,
on a place's backdrop. Every drawing in this decision was judged on it, and two were changed by it.

## ⚠️ Why the guard reads the trace and not a table

A guard over `ACCENT_OF` proved that `ACCENT_OF` was well-formed. It could not see a mark an arm
drew outside the table, and every mark in this decision is one — which is
[0027](0027-measure-the-picture-not-the-model.md) on the art channel: the instrument has to read what
the player gets. `tests/paths.ts` was already that instrument for the hulls; it now records enough
about a fill to hold the same three claims over paint.

⚠️ **THE OFFSET AT EACH END OF A FLARE'S WALK IS THE TRACE'S KIND OF FINDING, IN THE OTHER FILE.** The
first `turnFlares` was correct arithmetic over a row, and `tests/flares.test.ts` — which steps a real
world and reads the sprite every step — showed the first frame held for five steps and the last for
three. A flare is lit after the pools have stepped, so it is drawn once before its clock runs; and its
last step of life is the one that releases it, before it is drawn. Every table was green.

## ⚠️ What the picture said that no guard could

- **The wingtip pods were 2.7 px tall.** The containment guard passed them; the thickness guard
  failed their stripe at 1.69 px and the sheet showed a pod that was a line. They are 3.8 px now.
- **The blast's inner rim was grey.** The impact ink at a third of its alpha over the void is grey;
  it is a pale hazard now, so the shockwave has a hot front and not a dull one.
- **The smoke lumps on the second burst frame were mud.** Smaller and fainter, so the ring reads
  through them.

## What is deliberately not in this decision

- **The enemies and the bosses.** They arrive at the seal in one flat ink exactly as before, and the
  next decision paints them per place. A pipeline change and a visual change on the same surface in
  one PR is the thing 0193's survey warned against.
- **A change to any silhouette a guard reads.** Every extent, every hurtbox, every shape-and-size
  claim in `tests/legibility.test.ts` is where it was. The ship has wings now and is still a wedge
  with a concave tail.
- **A change to the accessibility architecture.** Colour still never carries meaning alone; the
  high-contrast palette is still the flat game. What went is the last of the *numbers* 0198 deferred
  standing in the way of a drawing.

## What is owed

- **An eye on the game, not the sheet.** The fireball is judged on the sheet and in a stepped world;
  whether sixteen steps reads as a bang or a blink is a play-test question, and `hold` in
  `src/content/debris.ts` is the knob.
- **The debris pool is one number and now feeds two kinds.** A burst that will not fit is dropped,
  which is the same rule as before; `tests/flares.test.ts` holds the arithmetic for a boss and a ship
  going up together, with the flares counted.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix. The atlas is baked at load.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0227`, and the re-aimed `0149` and `0194`:

| broken on purpose | went red |
|---|---|
| the ship's exhaust plume drawn solid | `THE 0149 ONE: every solid mark on a body is inside its hull` |
| the pulse's halo drawn out to the edge of its own bitmap | `and a translucent mark — a plume, a halo — stays inside the sprite's own box` |
| the ship's paint drawn onto its hurt twin | `and a hurt twin is the hull flat in its flash ink` |
| a flare that never turns a page | `turns every page in order, holds each for its whole count, and goes out on the last` |
| the missile pairing run without its hits log | `and a missile landing on something that survives it sparks where it hit` |
| a burst frame listed twice | `every frame of a flare is a different bitmap, and each is bigger than the last` |
| an enemy death throwing shards and no fireball | `THE REPORTED ONE: an enemy dying lights a burst where it died` |
| a boss's eye moved out through its lobe (0149) | `THE 0149 ONE: every solid mark on a body is inside its hull` |
| a boss's mark laid across one of its holes (0149) | same |
| a boss painted with nothing (0149) | `and every boss is painted, and no two wear the same paint` |
| a hurt boss painted differently from its hull (0149) | `and a hurt twin is the hull flat in its flash ink` |
| a boss's node made too small to bake (0149) | `and no solid mark on a body is too thin to be drawn at all` |
| a boss given another boss's hull (0149) | `THE 0081 ONE: no two boss hulls are the same drawing once the paint is taken off` |
| a livery mark run out past the hull (0194) | `THE 0149 ONE: every solid mark on a body is inside its hull` |
