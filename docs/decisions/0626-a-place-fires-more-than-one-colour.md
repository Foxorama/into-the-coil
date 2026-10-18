# 0626 — A place fires more than one colour

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 16. Builds on
[0296](0296-a-bullet-belongs-to-its-place.md): a place still owns its raiders' fire, and now owns three inks of it.

## The ask

> *"Enemy Bullets — colour is too same across each level — different bullets need some variation in each level"*

## What was measured first

Two things were true, and the ask names both.

**Across the levels, five of the seven fired one family.** 0296 gave each place one bullet ink, `foe.shot`: The
Approach crimson `#ff2e4d`, Ember Nebula hot pink `#ff2f8f`, The Saurian Belt red-orange `#ff4d2e`, Rime Shelf
orange `#ff5a1e`, The Toxic Mire rose `#ff2e6b` — and The Labyrinth's gold and The Black Heart's green.

**Within a level, every bullet was that one ink.** Every place's raiders fire `spit`, `lance` and `flak` (counted off
the level scripts: 250 spits, 60 to 180 lances and 40 to 100 flak a level), and all three were drawn in `shot`; they
differed only by shape.

**And two of the seven were under the game's floor on their own sky** — The Saurian Belt's at 2.84:1, Rime Shelf's
at 2.85, against 3 — because `tests/sky.test.ts` held the palette's inks to the floor and never the inks a place
fires in their place. **The Labyrinth's gold was the hazard ink exactly**, the Catherine wheel's own embers.

## The rule

**A place's skin says an ink for each raider bullet it wants told apart** — `shots`, by shot kind, beside `shot`,
which stays the default for every kind it does not name (0282): the mid-bosses' and bosses' own place-inked shots
take it.

| place | spit (`shot`) | lance | flak |
|---|---|---|---|
| The Approach | crimson `#ff2e4d` | magenta `#ff3dd0` | green `#5aff6a` |
| Ember Nebula | green `#5aff6a` | hot pink `#ff2f8f` | lime `#e8ff40` |
| The Saurian Belt | magenta `#ff4fd8` | lime `#e8ff40` | pink-red `#ff6b8a` |
| The Labyrinth | red `#ff3b5c` | green `#5aff6a` | lime `#e8ff40` |
| Rime Shelf | lime `#e8ff40` | pink `#ff5ab0` | green `#6aff7a` |
| The Toxic Mire | rose `#ff2e6b` | magenta `#ff40d8` | pale pink `#ff9ac8` |
| The Black Heart | green `#5aff8c` | magenta `#ff4dd0` | lime `#e8ff40` |

## Why these, and the space they were chosen in

**The hostile inks live in five hues and no more**, and the table is what fits in them. Everything else on the
screen already means something: cyan, azure, lavender and mint are the player's (the ship, the water, the ally, a
pickup), amber is the player's missiles, gold is the Catherine wheel's embers, near-white is a flash; vermilion is
fire, lime-green is the serpent's acid, violet its void, teal frost — *things that are always themselves*, 0295. Left
over are red, pink, magenta, a yellow-lime between the gold and the acid, and a saturated green. Each place takes
three of those, the three apart from each other, and its main colour (`spit`'s) is never the place before it's.

**And none is the ship firing it.** 0296's own defect was The Approach's bullets the ink of its lit strips; The Toxic
Mire's raiders have lime lit strips, so it fires no lime, and The Labyrinth's have magenta ones, so it fires none.

**What "one colour" means is measured, in one place** — `sameInk` in `tests/contrast.ts`: two saturated inks within 20°
of hue and within 1.35:1 of each other, or two near-greys near in lightness. The 1.35 is 0296's own line: it judged
The Approach's crimson apart from its `#ff7286` lit strips, at 1.40. Ember Nebula's hot pink was one colour with The
Approach's crimson by it, and the two places are one after the other, so the pink moved to Ember Nebula's lance and
its raiders mostly fire green.

## What it cost the Aqua Duck

The paintball hopper leaves out a colour where the place's bullets wear it (the review of 0595). With three inks a
place, the pink is now held in The Labyrinth alone and the yellow in The Approach and The Toxic Mire; the blue and
the grape still go everywhere, so every place's hopper still holds at least two. It is said here because it is a
picture that changes for a pilot who was not in the ask. The alternative — leaving the bullets off the paint's hues —
would have given up two of the five hues the bullets have.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md). A bullet's colour was already its place's; this lets its shape
be its colour too. Every ink clears the floor on its own sky with everything the sky draws counted, the closest Rime
Shelf's pink at 3.10:1 and The Approach's crimson, unchanged, at 3.19.

## What guards it

`tests/foes.test.ts`, *0626*: read off the bake, every place's spit, lance and flak are the inks it authors and no two
are one colour; no place's main colour is the place before it's; no ink any place fires is its ship's hull, plate or
lit strips, nor the player's, the missiles', the water's, a pickup's, a flash's, the hazard's, fire's, acid's, void's or
frost's. `tests/sky.test.ts`: every ink a place fires clears the floor on its sky. `tests/duck.test.ts`, *0626*: no
paint held in a place is the colour of a bullet it fires. Probes in
`scripts/probes/0626-a-place-fires-more-than-one-colour.mjs`, all five seen red; 0228's three probes on the skins'
lines are re-anchored.

## Rollback

Nothing irreversible: inks in a table.

## Owed

A play through the seven places, for whether the three now read as three and whether any place's palette fights its
sky in motion. The sprite sheet was photographed for Rime Shelf only; the rest is the guards'.
