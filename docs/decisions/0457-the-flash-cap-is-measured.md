# 0457 — The flash cap is measured

**Accepted 2026-10-02.**
- `scripts/weigh-flashes.mjs` counts general flashes off the pixels the game draws. It reads every
  frame from the bench, steps a fake clock one display frame at a time, and applies WCAG's
  general-flash and red-flash definitions to every 4-pixel cell.
- It is seen to fail before it judges anything. Four strobes are painted over the bench's own frame
  and must read as painted. Six a second over the whole screen and over a seventh of it are over the
  cap. Two a second is seen and under it. Six a second over a twentieth of the screen is under the
  area.
- `main` as it stands is under the cap in every scenario it flies. The one reading over it came from
  cells too coarse to see what was flashing, and the change it prompted was taken back.

## The ask

> *"if we add a warning splash screen at the start of the game and adding a setting to turn them off,
> can we make the game flashy and vibrant?"* … *"yeah crank them out, let's make the game as pretty
> as we can"*

The answer given was yes to vibrant and no to the trade.
[0024](0024-the-accessibility-floor-is-settings.md)'s cap is the one item in the floor that is not
a setting, and a warning screen does not change that. A warning protects only the players who
already know. What makes the trade unnecessary is how narrow the cap is: it counts a brightness swing
over a large area more than three times a second. A thin bolt, a saturated colour, a glow, or a hue
that turns at steady brightness is not a flash. So the louder pass goes up to the line, and this is
the instrument that says where the line is.

[0024](0024-the-accessibility-floor-is-settings.md) said the cap *"lands with the painter, counted
like 0022's draw calls rather than watched."* Nothing landed it. [0374](0374-the-storm-and-the-whirlpool.md)
argued the storm under the cap in prose, and [0375](0375-the-bomb-is-a-missile.md) set the bomb's
throw gap from the definition. Neither was measured.
[0027](0027-measure-the-picture-not-the-model.md) owes the instrument before the first tuning pass
on anything the player watches, and this is the instrument.

## How it counts

The thresholds are WCAG 2.x's, at the stricter of the published areas:

| | |
|---|---|
| a transition | relative luminance moves 0.1 between a local maximum and minimum, the darker below 0.8 |
| a red transition | a saturated red (R/(R+G+B) ≥ 0.8) moves (R−G−B)×320 by 20 |
| a flash | a pair of opposing transitions |
| general | the area changing together is at least 341×256 of a 1024×768 screen, which is 11.1% |
| the cap | three flashes in any one second, so a seventh transition in sixty frames is over |

Each cell is tracked over time with a hysteresis of 0.1, so a slow ramp counts as one transition and
not sixty. **The area changing together** is every cell that turned the same way within four frames
and has not turned back since. The first version summed the frames' shares instead. It read the
storm's generations of bolts as one flash a tenth of the screen wide, though each generation is a
different few per cent of the screen and is lit for one frame. That area was never lit at the same
time.

⚠️ **The meter sees the picture and not the model**
([0027](0027-measure-the-picture-not-the-model.md)). It knows nothing about bombs. A flash is a
change in brightness over an area, wherever it came from.

## ⚠️ The cell is four pixels, and sixteen manufactured a finding

The first meter tracked 16-pixel cells, and a cell counts whole when its average moves. At that size
it read **the gyre at 15% under the arc at 4 flashes (9 transitions), over the cap**. A floor went in
under 0334's wash duty to answer it: no body's wash relighting within a third of a second.

**The reading did not survive a finer instrument.** The same gyre with the same code, the floor taken
out, read:

| cell | worst second |
|---|---|
| 16 px | 4 flashes (9 transitions) — over |
| 8 px | 2 flashes (4 transitions) |
| 4 px | 0 flashes (1 transition) |

A coarse cell takes a thin bright mark for the whole cell. A ten-pixel line through a sixteen-pixel
cell counts as sixteen pixels, so detail on a hull, or a jagged bolt, reads two to three times its own
area. WCAG's area is the area that changes. At four pixels, about three at the 1024×768 reference,
a mark counts close to its own width.

So the floor was taken out again before this landed. 0334 set the wash's duty for legibility,
*"seen two thirds of the time under any gun"*, and a duty set for the player is not traded for a
reading from an instrument that was wrong about the area. CLAUDE.md's *a quantity that rejects an
option is checked in the case it is applied to* is the rule, applied here to the instrument.

## What it found

`main` at 1280×720 on the vivid palette, 4-pixel cells, six seconds a scenario:

| | worst second |
|---|---|
| every gun firing into a wave | 0 flashes |
| the bomb, thrown as fast as `canThrow` allows | 1 flash (2 transitions), peak area 11.2% |
| the void, thrown as fast as allowed | 1 flash (2 transitions), peak area 11.4% |
| the storm, the nova, the whirlpool, both surges | 0 flashes |
| all seven end bosses, at 100%, 50% and 15% health, under the arc | 0 flashes |

The gather window matters as much as the cell. The same scenarios at one or two frames read lower
still. Four frames is kept because a ring sweeping outward crosses its threshold cell by cell, and a
shorter gather would count a real sweep as a few small changes. The verdict is the strict one.

## The bench handle

`rig/bench.ts` sets `window.__bench.throwSpecial(kind)`, which calls `canThrow` and then
`launchSpecial`. That is the same pair `onSpecial` calls once the run has spent the charge, so the
picture is the game's own and only the charge is not the run's.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A rig handle and a script.

## How the meter is seen to fail, and why no probe

The meter's failure is its calibration, run before every judgement. A meter that cannot tell a rate
or an area exits 2 rather than reporting, per [0005](0005-a-guard-must-be-seen-to-fail.md) in the
form a script can take. Nothing in the suite changes, so no probe is owed.

⚠️ **The meter is not a CI guard, and that is deliberate for now.** It is 33 scenarios at about five
seconds each in a real browser, and its verdict rests on a cell, a gather and a viewport that WCAG
states only approximately. It is the instrument for the loud pass that follows. Whether a cut-down
version should become a required check is for after that pass, when there is something on the screen
worth guarding.

## What this leaves owed

- **The loud pass itself**: the lightning, the void, the ray and the nova, the serpent's bubbles, and
  everything after them, each measured here before it lands.
- **The warning line and the *Flashing: Full / Reduced* setting.** Reduced is the stricter setting
  0024 already names, above the cap. There is nothing below it.
