# 0204 — A landmark is lit by the place it stands in

**Accepted 2026-09-01.** Completes [0203](0203-the-rule-was-never-about-size.md), which opened the
band and placed the Pillars but left them **grey**. Applies
[0133](0133-the-place-is-baked-at-the-boundary.md)'s mechanism to the landmark, on exactly the terms
[0112](0112-the-sky-has-weather.md) already applies it to the weather.

> *"let's get the level 2 backdrop looking good"*

## Why they were grey, which no number in the repository would ever have said

**A palette is per STYLE, not per place.** `PALETTES.vivid.sky` is `#2a2c44` — a cold blue-grey — and
`bakeAtlas` gives every sprite that ink. A place's own colour arrives separately:
`THEMES[theme].nebula[palette]`, written over the weather bitmap by `bakeNebula` at a level boundary.

0203 baked the landmark once, with the atlas, and never re-coloured it. So the Pillars stood in
Ember Nebula's `#5c2a4a` plum wearing `#2a2c44`, and read as **cold rock rather than dust in gas** —
the single most wrong thing about the picture, invisible to every guard, and obvious in one shot.

## The rule

**A landmark is re-baked in the place's own gas colour at the level boundary**, by `bakeLandmark`,
called beside `bakeNebula` with the same colour. One place, one colour: the pillars are lit by the
nebula they stand in.

## ⚠️ The columns are punched OUT of the gas, and the first version had it backwards

The Eagle Nebula's signature is **dark dust silhouetted against bright gas**. The pillars are holes
in the light, not objects in front of it.

The first drawing filled them in sky ink over Ember Nebula's maroon, so they came out **lighter than
the field behind them** — which is the relationship inverted. They are now filled in `space`, the
background colour, with a single lit rim on the windward edge in the gas colour. Against bare space
a column is invisible, and that is correct: a pillar with no gas behind it is not visible in the real
object either.

## Three defects, all found by the rig and none by a guard

[0027](0027-measure-the-picture-not-the-model.md) says an eyes-on rig renders at the camera the game
ships. Every one of these passed `npm run check`:

1. **The columns were sideways.** The game is a horizontal scroller, so pillars grown towards `+x`
   lay flat and arrived as three grey banners sliding in edge-on. *(0203)*
2. **The feet stopped in mid-air**, on a hard horizontal cut two thirds down the screen, because the
   sprite spanned lane −7.5 to 67.5. *(0203)*
3. **The gas ended on a straight vertical line in open space.** A radial gradient fades to
   transparent at its radius, but `fillRect` clips it at the tile's edge — so a lobe wider than its
   own distance from that edge draws a faint rectangle around the nebula. The rule is
   `r <= min(x, 1 - x)`, and it is written next to the numbers.

⚠️ **NONE OF THE THREE IS GUARDED, AND THAT IS DELIBERATE.**
[0192](0192-a-guard-holds-an-invariant.md) asks what content change would redden a guard and be
correct. For *is this recognisably the Pillars of Creation*, every answer is a taste — and
[0161](0161-the-shape-of-a-level-is-not-guarded.md) already refused to assert the shape of a level's
music for the same reason. What holds this is the rig and an eye, which is what
[0196](0196-the-backdrop-is-rounded-out.md) is the cost of not using.

## The gas is nearly opaque, and that is a choice with a reason

The lobes run to `0.95` alpha. That is far above the weather's per-cloud ceiling, and it is not
governed by it: the nebula field tiles across the whole sky every few seconds, while a landmark is
one object, passing once, occupying part of one screen for about a minute.

⚠️ **`0.95` OF `#5c2a4a` IS STILL A DARK COLOUR.** The ceiling that matters is the gameplay one — the
enemies and bullets in the same frame stay plainly readable, which is
[0198](0198-the-accessibility-pass-comes-after-the-game.md)'s *gameplay legibility is NOT deferred*.
If a play-test says it competes, the number to move is the first lobe's alpha.

## What is owed

**The remaining six places, and a way to look at them.** Ember Nebula is level two, so seeing it
means beating a boss; every shot in this decision was taken by temporarily moving the landmark and
the theme onto level one. That is fine for one place and does not scale to six plus the boss
backdrops — the next piece of work is the ability to open a level directly, and it was asked for in
the same breath as this one.
