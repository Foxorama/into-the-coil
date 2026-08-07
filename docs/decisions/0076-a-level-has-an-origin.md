# 0076 — A level has an origin

**Accepted 2026-08-08.** Makes a level boundary seamless by giving the script somewhere to be measured
from, instead of sending the camera back to zero. Removes the shell-carrying arithmetic
[0058](0058-a-level-boundary-keeps-the-shell.md) needed.

The last of [`medium-played`](../../reports/medium-played-2026-08-07.md)'s three confirmed defects.

## The rule

**A level boundary is a change of script, not a change of scene.**

## What was asked for

> *"There's a background scene reset between levels that's disjointing because it moves the player's
> ship, the level change needs to be seamless."*

## The camera reset was load-bearing, and that was an argument for something else

`resetScene` states its own reason, and it is correct:

> *"The camera reset is what makes two runs the same run. Distance travelled is the only clock a
> level has — a wave table places its content against `cameraAlong` — so a second run that started
> where the first one ended would be playing a different level with the same name."*

⚠️ **True, and it argues for the script being measured from SOMEWHERE — not for the camera going back
to zero.** `World.levelOrigin` is that somewhere. One line reads the script in level coordinates:

```
const horizon = spawnAlong(w.cameraAlong) - w.levelOrigin;
```

and the three comparisons under it are unchanged, because an authored `at` has always been a distance
from the level's own beginning. The two places that turn an authored position into a world one — a
leading wave, and the boss — add the origin back.

## What *seamless* turned out to mean

**The camera and the ship. Not the bodies.**

A first draft swept nothing at all, on the grounds that leaving the last level's enemies in the air
is *more* continuous. `tests/continue.test.ts` refused it, and it was right:
[0067](0067-a-new-run-opens-on-an-empty-field.md) says a pool that belongs to the level is emptied
when a level starts, and [0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) is what that
protects — **every level opens on an empty screen so the player can find the controls before anything
finds them.** The last level's enemies would fill exactly that stretch.

⚠️ **And sweeping costs nothing here.** By the time `onward` runs, a boss has died and three seconds
of respite ([0063](0063-a-level-break-is-a-respite.md)) have passed, so the field is already almost
empty. Nothing the player is watching jumps.

`debris` and the player's own pools are deliberately left alone: fragments retire themselves, the
thing most likely to be on screen at that moment is a boss coming apart, and the ship did not leave
so neither did what it fired.

## Two functions rather than a flag, and a flag that stopped existing

`startLevel(w, level)` sweeps the scene and puts the camera at zero. `advanceLevel(w, level)` changes
the script and touches nothing else. `enterLevel` picks one.

⚠️ **`keepShell` is gone.** It existed because the boundary called `resetScene`, which calls
`respawn`, which puts a bare hull back — so the shield count had to be read out and added back around
it. Nothing is reset at a boundary now, so nothing has to be carried: **0058's rule is true because
the ship never leaves**, rather than true because of arithmetic. That is
`docs/scaffold-plan.md`'s instruction ladder — remove the affordance — applied to a mechanism 0058 had
to build and no longer needs.

⚠️ **Two of 0058's four probes are deleted rather than reworded**, because the expression they broke
does not exist. Their guards stay in `tests/shields.test.ts`: *a partial shell arrives partial* and
*a full one does not overflow* are still facts about the boundary, and they are now facts nothing has
to compute. The same call [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) made
when it deleted a sprite guard rather than keep it green.

## What the harness found, and it was a real smell

⚠️ **Four probes belonging to 0062 and 0067 reported *"the probe's find appears 2 times — make it
unique."*** The sweep and the script reset had been written into both `resetScene` and
`advanceLevel`, so a line that had been one description was quietly two.

The fix is `beginScript(w)`, shared by both, rather than longer anchors — which would have been the
repository agreeing to carry the duplication.
[0029](0029-the-tracked-record-is-the-record.md)'s argument about prose, arriving in code, and
`npm run prove` noticing it before a reviewer did.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0076-seam.mjs`. **5 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the boundary respawning the ship, so the one thing the player is holding teleports | `THE REPORTED ONE: the ship is drawn in the same place across the boundary` |
| the camera sent back to zero at the boundary, so the sky snaps back under the ship | `and the sky does not jump either, which is the other half of the report` |
| the horizon read in run coordinates, so a level entered late plays itself instantly | `THE ONE resetScene WARNED ABOUT: a wave arrives at the same place relative to the level` |
| the boss placed in run coordinates, so it arrives on time and is nowhere near the player | `and the boss still arrives its authored distance into the level, not into the run` |
| the boundary sweeping nothing, so a level opens on the last one’s field | `and so does the next level, which is the same rule and the other caller` |

⚠️ **The two halves of the report have separate guards on purpose**, because a fix could plausibly do
one and not the other: the ship is checked as a **blit position** and the sky as **camera travel
across the boundary**, both in the units the player has.

⚠️ **A guard that measured the wrong thing was strengthened rather than kept.** The horizon probe came
back STILL GREEN against a test asserting only where the first wave was placed — reading the horizon
in run coordinates does not move a wave, it spawns the whole opening of the level on one step, each
one still exactly where the author put it. **The level is intact and already over.** The guard now
compares how much of the script has run as well as where its first wave went.

## What this leaves owed

**A look at it.** The claim is about continuity between two frames a second and a half apart, and no
guard can say whether it *reads* as seamless — only that nothing jumps. That is the last of the three
defects, and the play-test now has four changes waiting for it.
