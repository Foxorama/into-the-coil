# 0040 — A level is a script, and a boss is its clock

**Accepted 2026-08-05.** The first authored content in the game. Sits downstream of
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md), which built the run this fills.

## The rule

| | |
|---|---|
| **a level** | a row in `LEVELS`, carrying a wave script and one boss |
| **a wave** | `at` (a PLACE), an enemy kind, a formation, a count, a lane |
| **a formation** | a kind, and two functions returning numbers — never a list of positions |
| **a boss** | a row with phases keyed to remaining **health**, never to elapsed time |
| **clearing it** | the boss dies → the level ends → the run carries forward |

Five enemy kinds now exist: `drifter`, `lancer`, `weaver`, `turret`, `charger`. `src/content/` gains
`formations.ts`, `bosses.ts` and `levels.ts`; `src/app/` gains `boss.ts`.

## `at` is a place, and the first version made it a time

A wave is put on the field when its position comes inside the spawn horizon, and it is placed **at
the position it was authored at**. The first draft compared `at` to the camera and then placed every
wave at the horizon, which threw the authored position away.

⚠️ **The consequence was invisible to every test and obvious in one screenshot.** A run opened onto
empty space for about eight seconds, because nothing could be authored *in front of* the player —
the earliest a wave could exist was a full lookahead ahead of them.
[0027](0027-measure-the-picture-not-the-model.md) is the rule that says to go and look, and
`scripts/shot.mjs` is what it needed to exist for. Every number in the model was correct.

There was a guard for it — *has waves inside the opening spawn horizon* — and it is worth being
honest that the guard was written **after** the screenshot, not before it.

⚠️ **AMENDED by [0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md), which found that guard
pointing the wrong way.** Play asked for the first screen to be **empty**, so the player can find the
controls before anything finds them. Both complaints are real and neither is the other's opposite —
*nothing on the first screen, and not for long* — and the guard is now that pair. This section
records the half that was right: a level must not open onto nothing and stay that way.

## Density is a property of the view, not of the gap between waves

⚠️ **The first script put a wave every ~140 units and read as "one every four seconds", which is a
sensible-sounding number and the wrong one.** A wave takes about eight seconds to cross the view, so
what matters is how many are inside one lookahead at a time — and that was two. Forty seconds into a
level, the screen held two enemies.

So the guard counts what the player can see: it slides a window the width of the widest possible view
along the whole stage and fails if the population ever drops below eight. Waves now sit ~90 units
apart and carry four to six.

That guard measures the level in the player's terms rather than the table's, which is the second half
of [0027](0027-measure-the-picture-not-the-model.md) — *"a guard measuring a quantity defined in
terms of the constant it guards proves only that the code agrees with itself."*

## Why a formation is two functions and not a list of positions

`place(count): Position[]` is the obvious shape and it allocates an array and `count` objects every
time a wave spawns — in the frame loop, which [0022](0022-frame-rate-is-a-feature.md) bans outright.
Two calls returning plain numbers allocate nothing.

## Why a weave is two numbers and not a `motion` union

A closed union of motion kinds is what [0016](0016-a-hub-enumerates-kinds.md) reaches for, and it is
wrong here: **a straight line is a weave of amplitude zero.** The union would enumerate two members
that are one member with a parameter, and every consumer would carry a `switch` proving it.

The trigger for the union is named rather than left as a someday: **the first motion that is not a
parameterisation of this one** — something that turns towards the player, or stops.

⚠️ The path is a function of `along` rather than of elapsed time, so two weavers spawned a minute
apart trace the same curve through the same piece of level. That is what makes a formation of them
authorable at all rather than a coincidence of when they were created.

## The boss: phases are behaviour, and there is no health readout

Phases are keyed to remaining health, which is `docs/game.md`'s Jörmungandr model. Keyed to health
and not to time is the load-bearing half: a player who is doing well arrives at the hard phase
sooner, and a player who is struggling is not also being hurried.

**A phase changes what the boss does — rate, spread, patrol speed — and not what it looks like.**
Three silhouettes for three phases was the first plan and is rejected: behaviour is legible in
motion, at full frame rate, and costs no second art pass.

⚠️ **That leaves a real gap, and it is the single most important thing the first play-test should
answer.** Nothing on screen says how much boss is left. Three discrete changes in how it fights may
be enough to feel progress, or a 150-health boss may read as an unmoving wall. A health bar is the
obvious fix and it is deliberately **not** guessed at here — it would be new chrome, over the one
screen `src/state/screens.ts` currently says has none.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md).
`npm run prove 0040`:

| broken on purpose | went red |
|---|---|
| a wave authored out of order, which the spawner skips rather than delays | `lists its waves in ascending order of place` |
| a lane that lets a weaver's swing leave the dodge lane it can never return to | `never puts an enemy where it can leave the dodge lane` |
| ~~the opening waves pushed past the horizon~~ | superseded — see below |
| the formation spacing widened back out, thinning the level to its first draft | `keeps enough on screen at once to be a shooter` |
| a boss phase that eases off as it dies rather than escalating | `every phase is reachable, and they only get harder` |
| the boss parked in world coordinates instead of the camera's frame | `arrives, closes on its station, and then holds it` |
| the level cleared every step instead of once | `dies to the base weapon, and says so exactly once` |

## What the eyes-on rig found, including about itself

`scripts/shot.mjs` is new and is the sister of `scripts/trace-frame.mjs`: that one answers *how far
did it move*, this one answers *what does it look like*. It found three things in one sitting — the
empty opening, the density, and a defect in itself.

⚠️ **It photographed the canvas, and the screens are DOM over the canvas.** So a run that had already
ended photographed as a live one, with the game-over overlay cropped out and the frozen last frame
looking like play. Three shots were read as *"the boss never appears"* when what they showed was a
finished run. It now photographs the host element.

That is the same class of mistake as measuring the model instead of the picture, one level up — in
the instrument built to prevent it.
