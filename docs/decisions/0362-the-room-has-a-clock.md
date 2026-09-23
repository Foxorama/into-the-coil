# 0362 — The room has a clock

**Accepted 2026-09-23.** Fixes a defect in the music room reported while the album's videos were being
cut. **Keeps [0213](0213-the-room-is-a-flythrough.md)'s rule** — everything in the room's picture is a
pure function of where the walk is — and **keeps [0347](0347-the-belt-is-a-jungle-under-a-live-volcano.md),
[0353](0353-the-acid-bubbles.md) and [0354](0354-the-heart-has-veins.md)'s** — a rock, a bubble and a
bead ride a step count and not the camera, because *the camera stops for a fight and a volcano does
not*. What was missing was a step count on a screen that has no steps.

## The report

> *"the volcanos for into the coil and saurian look really weird with the frozen lava rocks that just
> don't move at all"*

Said of a recording of the music room, which is the same picture the room shows a player.

## What was wrong

The music room is a screen `src/state/screens.ts` marks `steps: false`, so `world.steps` — **the sim's
own clock** ([0094](0094-in-time-is-not-in-phase.md)) — stands still there while the room's camera
walks the level. Every other thing in the picture rides `cameraAlong` and was alive. The three that
ride the step count were not:

| place | what stood still |
|---|---|
| Saurian Belt | the rock and embers a volcano throws — reported: hanging in the air |
| The Toxic Mire | the acid bubbles; none ever rose or popped |
| The Black Heart | the beads of light running the veins — **while the heart itself beat**, because a landmark's beat rides the camera |

The last row is the tell: two halves of one place, on one screen, disagreeing about whether time was
passing.

## The rule

**The picture's clock is not always the sim's, and the screen says which.** `World.pictureSteps` is
`null` on every screen a run is played on — the sim's own count is the picture's — and the music room
writes it from the walk. `src/app/frame.ts` picks between them once, where `paintScene` is called, so
what changes is the count of steps that has passed and never what is drawn from it.

**The walk's clock is its position, and `src/app/attract.ts` owns the arithmetic** beside the weave
and the motes, which is the file whose whole subject is that the room's picture is a pure function of
`cameraAlong`. `flythroughSteps(camera)` is `camera / SCROLL_PER_STEP`: the walk advances by that and
by nothing else, so its position **is** the number of steps it has taken. A seek therefore arrives at
the picture the walk would have arrived at, which is 0213's reason for existing.

**It is the constant and not `world.scrollPerStep`**, which is a term of the fight
([0335](0335-the-fight-happens-in-a-room.md)). A walk has no fight in it.

**And the room hands the clock back with the camera.** `releaseCamera` nulls it, so a run resumed
after a visit finds its volcano on the phase its own steps have counted.

## What was refused

- **Letting the room step.** 0210 and 0212 both refused it and `tests/room.browser.test.ts` asserts
  `SCREENS.music.steps === false`. A stepping room is a simulation nobody started, with collisions in
  it — 0213's *there is no code path in which anything here can touch anything else* is structural.
- **Driving `world.steps` from the room**, restoring it on the way out as the camera is. It is the
  phase the gun and the music are measured from (0094); a screen with no gun on it does not get to
  say where the beat is.
- **A free-running accumulator** — the obvious shape for a clock, and the one 0213 forbids: the room
  has a seek bar, and a picture that remembered its route would look different at 1:46 depending on
  how 1:46 was reached.
- **Deriving the clock from `!stepping` instead of from a field the room writes.** The run-over and
  cleared screens are `steps: false` too, with the camera stopped wherever the run left it; the
  volcano's rock would jump to a different phase on the frame the player died.

## What holds it

`tests/room.test.ts`, in the picture rather than the model: with the camera held still, **a second of
walking moves the rock exactly as far as a second of flying does**, read off a real `GameFrame.draw`
through a recording surface. `scripts/probes/0362-room-clock.mjs` breaks it three ways — the picture
back on the sim's clock, the walk's clock stopped, and the walk counting at the wrong rate — and each
was seen red before this landed.

**One guard for three places, on purpose**: the rock, the bubbles and the beads are one claim about
one `time` argument, and a guard apiece would be three copies of it
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).

⚠️ **AND WHAT HOLDS THE WIRING IS THE SHAPE OF THE CODE, NOT A GUARD.** That the room *writes* the
clock at all is one line in `placeFlythrough`, which no unit test can reach — nothing mounts the app
outside the browser tests — and the browser half cannot see it either: the pixel test of that shape
was tried twice and deleted twice, and `tests/room.browser.test.ts` ends with why (*"it passed, and
its green was luck"* — the walk moves 36 units a second between two captures, so the comparison is a
race). The line lives in the one function every one of the room's camera writes already passes
through, which is the same *shape of the code* argument that file names as the honest one available.

## What it costs

Nothing measurable: one `??` per frame, one division per step on a screen that draws no bodies.

## What is owed

**The album's videos are re-cut against this.** The masters of Saurian Belt, The Toxic Mire and The
Black Heart in `C:\itc-renders\video\` were recorded from the frozen room, along with the title
track's tour and the full-album video built from them.
