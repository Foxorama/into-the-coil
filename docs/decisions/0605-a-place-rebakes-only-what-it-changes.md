# 0605 — A place re-bakes only what it changes

**Accepted 2026-10-12.** **Extends [0604](0604-the-place-is-baked-on-the-way.md)**, which spread a
place change's bake across the break and the burn and named this as the next lever. Asked for straight
after: *"build the place-free bitmap reuse too."*

## What was measured

Every one of the atlas's 743 kinds was baked in all seven places, in both palettes, in both views and
at two resolutions, and the bitmaps compared byte for byte. **248 kinds differ somewhere; 495 come out
the same in every place.** The ones that differ are the place's own: the enemies and their tiers in
each place's skin, the bosses that wear a lord's skin, a handful of shots tinted by the place, and the
sky. The ones that do not include every ship, every pickup, the explosions and fireworks — and the
hydra's 30 neck, collar and head pieces, which were the worst single frames 0604 measured.

## The rule

**A place change bakes the kinds on `PLACE_DRAWN` and lends every other slot from the atlas on
screen.** `bakeAtlasStepwise` takes that atlas as `keep`, and lends only when it is the same view at
the same resolution; the one caller has one palette. Both place changes use it: the bake ahead of the
burn, and `applyPlace`'s own when there was nothing ahead to install.

⚠️ **A LIST, BECAUSE THE PLACE IS READ IN HUNDREDS OF PAINTERS.** A foe's skin, a lord's, a shot's
tint and a sky each read it somewhere inside `drawKind`, and no one line says whether a kind does. So
the measurement is written down as the list, and what makes the list safe is which way it fails:

- **A kind on it that stops reading the place** is re-baked for nothing — slower, never wrong.
- **A kind that starts reading the place and is not on it** would carry one place's picture into the
  next. That is what the guard is for, and its message says the answer: **add the kind to the list**,
  never make its drawing the same everywhere.

⚠️ **AND SOME SLOTS ARE NEVER LENT, WHATEVER THE LIST SAYS.** The place's gas, landmark, land and
banks (`bakeNebula`, `bakeLandmark`, `bakeGround`), the fitted ship's hulls and dance
(`bakeShipFit`) and the flame (`bakeFlame`) are painted into an atlas after its bake, so the atlas on
screen holds them as the last place or the last fit left them. `keptAcrossPlaces` re-bakes every one,
and a new writer into an atlas joins it.

## What it saves

On the bench at 7.2 pixels per unit, vivid:

| | whole atlas | lent | baked |
|---|---|---|---|
| Saurian Belt → The Labyrinth | 1,348 ms | **442 ms** | 366 of 743 |
| The Toxic Mire → The Black Heart | 1,990 ms | **347 ms** | 366 of 743 |
| Ember Nebula → Saurian Belt | 1,004 ms | **422 ms** | 366 of 743 |

And the burn itself, through `rig/bench.html?cross=3`, which raises it with no break in front:

| | 0604 | 0605 |
|---|---|---|
| desktop: the place ready at step | 232 (held past the 210 floor) | **110** — no hold |
| 4× throttle: the place ready at step | 967 | **672** |
| 4× throttle: worst frame while baking | 150–285 ms | **18–32 ms** |

⚠️ **THE THROTTLED RUN IS PESSIMISTIC IN A WAY THAT IS NOT THE GAME'S.** Headless at 4× it drew about
fourteen frames a second, and the bake gets one slice per frame — so it got a quarter of the slices a
machine holding sixty would. In the game, the six-second break comes first as well.

## Confirmed, not assumed

`tests/place-drawn.browser.test.ts` holds the outcome rather than the list: **at every boundary on the
route, in both palettes, the atlas built by lending from the place being left is, slot for slot and
pixel for pixel, the atlas a fresh bake of the next place draws** — with the place being left painted
as the screen has it first: its own sky, every ship fitted in another's kit, and a flame that is not
the standard one. And more than half the slots must actually be lent, because a carry-over that
never happens passes every comparison and saves nothing. It loads the painter off vite's dev server,
as `scripts/weigh-picture.mjs` does: the shipped page inlines it, and a copy here would be the second
description this exists to keep honest.

Probes in `scripts/probes/0605-a-place-rebakes-only-what-it-changes.mjs` — **seven, all seen red**:

| broken on purpose | went red |
|---|---|
| the drifter left off the place-drawn list, so it is carried from place to place | `and the atlas it lends into is the atlas a fresh bake of the next place draws` |
| the fitted ship's hulls lent, so the next place flies the last fit | the same |
| the fitted ship's dance lent, so it dances in the last fit | the same |
| the flame lent, so the next place burns the last flame | the same |
| the Mire's banks lent out of the Mire in its own land colours | the same |
| every slot lent whatever it draws | the same |
| nothing lent, so every place change bakes every bitmap again | the same |

⚠️ **ONE PROBE CAME BACK STILL GREEN, AND IT WAS RIGHT TO.** The first un-listed the gas from the
after-bake slots — and the gas differs by place, so `PLACE_DRAWN` re-bakes it anyway and the break broke
nothing. That is two mechanisms holding one slot, which is fine here because the second is the list
of writers and not a guess; the probes were re-pointed at the slots ONLY the writers' list protects.
And the guard's first version painted only the gas and landmark into the place being left, which
would have stayed green over all four of those: it paints every writer now.

## What this leaves owed

**Played on a phone**, which 0604 already owes.

**Memory**: the two atlases share the lent bitmaps, so a place change now holds about a third of a
second atlas while it bakes rather than a whole one. Not measured; it can only have gone down.
