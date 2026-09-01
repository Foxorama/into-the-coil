# 0205 — The bench jumps to where the thing is

**Accepted 2026-09-01.** A second rig page, on
[0116](0116-the-rig-plays-the-level.md)'s terms and beside
[0126](0126-the-dashboard-is-the-instrument.md)'s sound dashboard.

> *"we'll need to review graphics, weapons, levels, sounds, music, basically everything and having to
> playthrough every time is going to be hard without an easy harness that we can use to jump around"*

## The cost it removes, measured rather than asserted

Across [0203](0203-the-rule-was-never-about-size.md) and
[0204](0204-a-landmark-is-lit-by-the-place-it-stands-in.md), **six defects reached a screenshot and
four of them were invisible to every guard in the repository**:

| | found by |
|---|---|
| the columns drawn sideways | a picture |
| the feet cut off in mid-air | a picture |
| a rectangle clipped around the gas | a picture |
| the Pillars grey, in the wrong ink entirely | a picture |
| an allocation on the spawn path | a guard |
| a second fill in a kind with no interior | a guard |

A picture is the only instrument that has caught anything in that arc. Until now each one cost a
temporary content edit, a rebuild, and — for anything past level one — a boss fight. **Every shot in
0203 and 0204 was taken by temporarily moving the landmark and the theme onto level one**, which is
why both decisions had to say so in their own text.

## The rule

**`rig/bench.html` is the picture rig: pick a level, scrub to a distance, hold the camera.** It is
dev-only and not in the build, exactly as the dashboard is —
[0003](0003-single-file-build.md)'s closed sidecar list is untouched.

**It plays the game and not a model of it** — 0116. `mount()` is the shell's own, `world` is the
field the player flies in, and a level is put on it with `advanceLevel`, the function a real level
boundary calls. The WAV rig drifted from the game twice by rebuilding it.

`Mounted` therefore gains a `rig` handle carrying the world, the store's dispatch and the lifecycle.
**The game itself must never read it**: `index.html` uses `canvas` and `stop`, and everything else is
reached only from `rig/`.

## ⚠️ Two things it found before its own decision was written

1. **The nebula tile's seam** — three reports old, never located, and green under every guard.
   [0206](0206-the-tile-wraps-round.md).
2. **The landmark's `at` was compared against the wrong origin.** `at` is level-LOCAL, the axis
   `waves` and `bossAt` use; `cameraAlong` runs across the whole run. 0203 compared them directly, so
   Ember Nebula's Pillars would have appeared at absolute 1299 — **in the middle of level one**.

⚠️ **AND THE SECOND ONE IS WHY THE TOOL HAD TO EXIST.** Every test of the Pillars passed, because
every one of them was run by moving the landmark onto **level one, whose origin is zero** — the one
level where local and absolute are the same number. The workaround for not having the tool is
precisely what hid the bug the tool then found in two minutes.

## What it does not do yet, said plainly

Weapons, tiers, enemy rosters, cue auditioning and palette switching are all listed in the ask and
none of them is here. This is the level select and the scrub bar, because that is what unblocks the
six unwritten backdrops and the boss starscapes. `hold` pins the camera and does **not** pause the
game: there is no pause screen in the shell, and adding one so that a tool could use it would be a
rig changing what it measures, which 0116 refuses.
