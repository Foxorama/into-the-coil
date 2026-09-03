# 0213 — The room is a flythrough, and the boot field was never meant to be watched

**Accepted 2026-09-03.** The same day as [0212](0212-the-room-walks-the-level.md), and caused by it:
a moving camera over a screen that does not dim showed something nobody had ever been able to see.

> *"the initial background screen has a bunch of enemies showing that scroll off-screen and then
> there's no enemies at all showing again. can do we something fun (not necessarily enemies, but
> something a bit fun and engaging for the background in addition to the screen scroll) and remove
> the enemies from that starting screen."*

## The rule

**The music room sweeps the field when it opens, and flies the level instead.** The ship weaves down
the lane at the camera's own station and a field of dust goes past it at a spread of depths. Both are
in `src/app/attract.ts`.

**Everything in the flythrough is a pure function of `cameraAlong`.** Nothing accumulates, nothing
integrates a velocity, and there is no clock but the camera.

**Nothing in it is simulated.** The room is `steps: false`, so `src/app/frame.ts` returns before
`stepEntities` and before `collide` ever run.

## ⚠️ What was on screen was `seedField`, and its whole job is to be seen once

`src/app/mount.ts` deals **twelve bodies** at boot *"so the first frame is not empty"* — a real need,
and [0134](0134-the-place-keeps-the-games-pace.md)'s browser test caught the blank canvas that
motivated it. Every screen in the game either **dims over that field** (the title, the run-over
screen) or **steps past it** (a run, which spawns waves). The music room does neither: 0212 gave it a
camera and 0212 made it the one panelled screen that does not paint over the scene.

So a listener opened the room, saw a dozen enemies, pressed a place, and watched them drift off over
about ten seconds into two minutes of nothing. **Nothing was broken.** Three correct decisions —
*seed the field*, *do not dim the room*, *move the camera* — met, and the combination had never
existed before.

⚠️ **THE SWEEP IS ON ENTERING THE SCREEN, NOT ON PRESSING A PLACE**, because the bodies were there
before anything was pressed. What the room opens on now is a still frame of the ship in an empty
lane; the walk is what brings it to life.

## Position is a function of the camera, and that is the seek bar's doing

⚠️ **A SHIP STEERED BY ADDING A VELOCITY EVERY STEP CANNOT ANSWER A SEEK.** 0212 gave the room a
draggable bar, so the picture has to be able to *arrive* at 1:46 without having travelled there —
and an accumulated weave would be at whatever position the accumulation happened to reach, which is
different every time and nowhere in particular.

Three things fall out of making it a function instead, and only the first was the goal:

1. **A place looks the same at 1:46 however you got there.**
2. **The renderer's interpolation comes for free.** `src/render/scene.ts` draws
   `prev + (now - prev) * alpha`, so the caller asks the same function twice — once at the camera's
   previous value, once at its current — rather than keeping a second, differently-shaped copy of the
   motion.
3. **It is testable without a browser.** `tests/attract.test.ts` walks every level end to end and
   checks the ship never leaves the lane and the field never empties, which no amount of screenshots
   would establish.

## ⚠️ The one constraint the ask came with is structural, not careful

> *"1 and 2 if we can do both without the ship getting hit by debris and exploding"*

**There is no code path in which it can happen.** The room is a screen `src/state/screens.ts` marks
`steps: false`; `src/app/frame.ts` calls `onIdle` and returns before any entity is stepped and before
`collide` runs at all. On top of that the motes are `DEBRIS` bodies, which carry radius `0` and
damage `0` by their own table.

That is worth stating as a **guarantee rather than an arrangement**: it does not depend on where
anything is put, and it cannot be broken by a mote being drawn somewhere unlucky. What would break it
is the room starting to step, which is what `tests/room.browser.test.ts` asserts first.

## What an entity can and cannot do for depth

⚠️ **`src/render/surface.ts`'s `blit` takes one scale for the whole frame**, so an entity cannot be
drawn smaller to read as further away — the sky gets its depth from tiled layers at different rates
and an entity has no such mechanism. What a mote *can* vary is **how much of the camera's travel it
carries**: one at 0.78 falls behind at a fifth of the world's rate and reads as distant, one at 0.12
rushes past. **The depth is a rate, not a size**, and that is a limit of the painter written down
rather than worked around.

## ⚠️ Four guards were written, passed, and were measuring furniture

`npm run prove` failed four probes on this decision, and every one of them was the same class of
mistake — **a quantity that looked like the subject and was not**.

| the guard said | it was actually measuring |
|---|---|
| the dust field has depth | whether motes happened to **wrap** in the sampled interval, which swamps a few units of parallax with a whole band |
| the lane is not empty | the **star field**, which is drawn whatever the room does |
| the lane is not empty (second try) | the **box edge** — 0074's dashed wall, drawn on every screen always |
| the D-pad reports an axis | two of its four branches, so breaking `left` alone changed nothing |

The first three are one lesson: **a count of lit pixels counts everything that is lit.** The fix for
the second was to turn the sky off with the Retro style — *the game before the sky*
([0070](0070-a-style-is-a-setting-and-the-first-one.md)) — so ink in the lane means an entity; the
fix for the third was to move the sample band off the wall.

⚠️ **NONE OF THE FOUR WAS FOUND BY READING, AND ALL FOUR PASSED.** That is precisely the state
[0005](0005-a-guard-must-be-seen-to-fail.md) exists to detect and the reason a probe is not optional
for a guard about a picture.

## And one guard was deleted rather than made to pass

**"The picture is the same however the camera reached this position"** has no honest guard. As a unit
test it reads `f(4321)` twice and compares — a tautology, which
[0192](0192-a-guard-holds-an-invariant.md) says is not a guard. As a browser test — seek away, seek
back, compare pixels — **it passed, and its green was luck**: the walk advances 36 units a second
between the two captures, so the comparison is a race that the slow parallax layers happen to win.
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) is explicit that a rerun is not
evidence.

**What holds the claim is the shape of the code** — `src/app/attract.ts` exports pure functions and
the room keeps no position but `auditionAlong`. That is weaker than a test and it is the honest thing
available.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0213`.

| broken on purpose | went red |
|---|---|
| the weave widened past the lane, so the ship flies through the wall at its extremes | `keeps the ship inside the lane for every position of every walk` |
| the dust no longer wrapped into the band, so the field empties out as the walk goes on | `never empties, at any point of any walk` |
| the weave down to one sine, so the ship flies the same twelve seconds for ever | `does not repeat itself inside a walk` |
| every mote on one depth, so the dust is a flat sheet rather than a field | `gives the field depth` |
| the room opening on the boot field again, so a dozen enemies drift off and nothing follows | `opens on an empty lane, and keeps something in it for a whole walk` |

## What is owed

**A look, and it is a taste rather than a defect.** Whether 48 motes is dust or drizzle, and whether
a twelve-second weave reads as flying or as drifting, are an eye's calls — `ATTRACT_MOTES` and the
two wavelengths in `src/app/attract.ts` are each one number, and none of them is asserted on.
