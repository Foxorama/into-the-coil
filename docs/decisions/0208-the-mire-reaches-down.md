# 0208 — The Mire reaches down, and there are two seam rules now

**Accepted 2026-09-02.** The second place authored under
[0203](0203-the-rule-was-never-about-size.md), after Ember Nebula
([0207](0207-the-eagle-has-lanes.md)). Adds no rule about what a backdrop may contain; it adds one
about which seam rule a structure takes.

> *"move onto the toxic mire and get its background updated"*

## The place told me what to draw

`THEMES.mire` is not a colour scheme, it is a description, and it had the answer in it:

> *"⚠️ **HIGH, BECAUSE THE MIRE SEEPS.** The one place whose whole character is that it reaches you
> before you reach it."*
> *"…the picture is a thing singing from under the water."*

**Growth that hangs down into the lane** is that sentence as a shape. It is also the one thing it
could not have been if Ember Nebula had got there first: the Pillars **rise**, so a place whose
structure **descends** cannot be mistaken for it. *"None of those elements are transposable"* is
easier to keep when the fiction is read before the geometry rather than after.

## Density was not the problem here either

The Toxic Mire's row is `clouds: 1.5, cloudSize: 0.8, cloudAlpha: 1.35` — the second-thickest weather
in the game, and [0196](0196-the-backdrop-is-rounded-out.md) measured it beside Ember Nebula at about
a third of the contrast headroom the other five places have. Checked in the bench before anything was
changed: **green fog with blobs**, exactly as 0207 found plum fog with blobs.

That is now twice. **The finding is not about either place**: every axis `SkyStyle` has moves a blob,
and a pile of blobs has no structure at any setting. A place needs a *primitive*, not another slider.

## ⚠️ The rule this actually adds: which seam rule a structure takes

There are now two, and picking the wrong one is a seam nobody would trace back to its cause.

| | wrap at ±size | must arrive where it left |
|---|---|---|
| a cloud — a disc | **yes** | no — the copy carries its own shape |
| a dust lane — crosses the whole tile | yes | **yes** — 0207, or it steps at every join |
| **a frond — rooted, hangs a short way** | **yes** | **no**, and only while it stays LOCAL |

**A frond takes a cloud's rule, and that is a property of its size rather than of its kind.** A frond
whose sway grew until it wandered as wide as the tile would be a tile-crossing structure wearing a
local one's wrap, and would need 0207's periodicity without anything saying so. `tests/sky.test.ts`
holds the spread under half a tile, and the probe widens the sway constant — the most innocuous
number in the file — to show what that costs.

## Dark, and that is not a taste

0196's measurement is why. In the two places with the least headroom, a **bright** structure would
have had to argue with the gameplay floor that
[0198](0198-the-accessibility-pass-comes-after-the-game.md) explicitly did **not** defer. Dust and
growth in the space colour spend none of it and buy some back. Both authored places are dark
structure over light gas, and that is a constraint the remaining five inherit — not because it is
prettier, but because it is what the contrast budget allows where the weather is thickest.

## What is owed

**A third place promotes this to a table.** There are two theme-gated functions now — `dustLanes` and
`hangingFronds` — each returning `[]` for every place but its own. That is honest at two and becomes
a `Record<ThemeKind, …>` at three, which is
[0016](0016-a-hub-enumerates-kinds.md)'s shape. It is deliberately not built yet: the constitution's
own note says a convention waits for the code it is about, and at two entries a table is a guess
about the other five.

**A play-test verdict on both.** Everything here was judged in the bench
([0205](0205-the-bench-jumps-to-where-the-thing-is.md)) at three camera positions, which is a picture
and not a game. Whether The Toxic Mire now reads as somewhere is an ear-and-eye call on a run.
