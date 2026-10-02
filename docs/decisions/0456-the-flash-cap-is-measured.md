# 0456 — The flash cap is measured

**Accepted 2026-10-02.**
- `scripts/weigh-flashes.mjs` counts general flashes off the pixels the game draws. It reads every
  frame from the bench, steps a fake clock one display frame at a time, and applies WCAG's
  general-flash and red-flash definitions to every 16-pixel cell.
- It is seen to fail before it judges anything. Four strobes are painted over the bench's own frame
  and must read as painted. Six a second over the whole screen and over a seventh of it are over the
  cap. Two a second is seen and under it. Six a second over a twentieth of the screen is under the
  area.
- It found the gyre over the cap. No body's hit wash relights faster than three times a second now,
  whatever its size.

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
change in brightness over an area, wherever it came from, and that is how it found something no
prose had argued about.

## What it found

The first full run, at 1280×720 on the vivid palette, over six seconds per scenario:

| | worst second |
|---|---|
| every gun firing into a wave | 0 flashes |
| the bomb, thrown as fast as `canThrow` allows | 3 flashes (6 transitions), peak area 11.9%. The 0375 gap is doing its job, at the line |
| the storm, thrown as fast as allowed | 2 flashes, peak area 14.5% |
| the void, the nova, the whirlpool, both surges | 0 flashes |
| six of the seven end bosses, at 100%, 50% and 15% health | at most 2 flashes |
| **the gyre at 15%, under the arc** | **4 flashes (9 transitions) — OVER** |

**The gyre.** Its hull is about a seventh of the screen, and the arc lands on it constantly. 0334's
refractory gap is a duty: four steps lit, eight off. That relit the wash every twelve steps, five
times a second, which is ten transitions over 14% of the screen. On a lancer that duty is a flicker.
On the gyre it is a strobe.

**The fix is a floor under the duty, in the one place a wash is armed.** `FLASH_CAP_STEPS` in
`src/sim/collide.ts` is 20, so no body's wash relights within a third of a second of the last one.
After it, the gyre at 15% reads 2 flashes and at 50% reads 1. Damage is untouched: a landing inside
the floor still takes its health ([0334](0334-a-hit-is-an-event-again.md)), and only the picture
waits.

⚠️ **One constant for every body, and that is the subject earning it.** By
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md), a mechanism whose output is
the same for every kind is suspect. But how big a body may be is content, and how often it may flash
is safety, which the CLAUDE.md screen rule calls hard for that thing. Every body in the game washes
in the same near-white ink for the same reason ([0035](0035-damage-is-legible-on-the-body-that-took-it.md)),
and a size threshold would be a ranking of bodies on one channel, which 0295 deletes on sight.

**What it costs a small body:** a gun landing every four steps shows one wash in five landings instead
of one in three. 0334's own test, *"a body shot every single step"*, still holds. It is seen
more than half the time and lights more than ten times in four seconds.

## The bench handle

`rig/bench.ts` sets `window.__bench.throwSpecial(kind)`, which calls `canThrow` and then
`launchSpecial`. That is the same pair `onSpecial` calls once the run has spent the charge, so the
picture is the game's own and only the charge is not the run's.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A floor on a cosmetic timer, a
rig handle and a script.

## Confirmed, not assumed

The suite guard is `THE FLASH CAP ON A BODY` in `tests/combat.test.ts`. It drives a landing on every
step and asserts at least a third of a second between two washes beginning, in seconds, the
player's unit. Per [0005](0005-a-guard-must-be-seen-to-fail.md), declared in
`scripts/probes/0456-the-flash-cap-is-measured.mjs`:

| broken on purpose | went red |
|---|---|
| the floor taken out, the duty alone | `THE FLASH CAP ON A BODY` |
| the floor at fifteen steps, four washes a second | `THE FLASH CAP ON A BODY` |

The meter's own failure is its calibration, run before every judgement. A meter that cannot tell a
rate or an area exits 2 rather than reporting.

⚠️ **The meter is not a CI guard, and that is deliberate for now.** It is 40 scenarios at about five
seconds each in a real browser, and its verdict rests on a viewport and a viewing distance that
WCAG states and the player does not. It is the instrument for the loud pass that follows. Whether a
cut-down version should become a required check is for after that pass, when there is something
on the screen worth guarding.

## What this leaves owed

- **The loud pass itself**: the lightning, the void, the ray and the nova, the serpent's bubbles, and
  everything after them, each measured here before it lands.
- **The warning line and the *Flashing: Full / Reduced* setting.** Reduced is the stricter setting
  0024 already names, above the cap. There is nothing below it.
- **The bomb is at the line.** It reads six transitions in its worst second, with the seventh
  over. A louder explosion has to buy its brightness from its area or its rate, and this is where
  that will show.
