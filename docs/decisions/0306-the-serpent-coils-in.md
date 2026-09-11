# 0306 — The serpent coils in

**Status:** accepted
**Amends:** [0022](0022-frame-rate-is-a-feature.md) and [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md) on what `blit` can do; [0283](0283-the-serpent-is-a-chain.md) on when a chain is placed
**Builds on:** [0286](0286-a-serpent-runs-off-the-screen.md), [0304](0304-the-serpent-sprays.md), [0305](0305-the-serpent-darkens.md)
**The brief:** [`the-serpent-asked`](../../reports/the-serpent-asked-2026-09-11.md)

## The ask

> *"can we make it fly onto screen, do a coil, fly off and then enter where it is now?"*

Asked back whether the entrance is part of the fight:

> *"Not-shootable, fully live - there's needs to be a gap in the center of the screen. Players can
> learn the pattern to avoid the damage from being hit by it and there's a music tone to alert of
> it's arrival."*

## What it is

A boss row may author an `Entrance`: a coil's centre, its radius, how many turns, and a speed. The
serpent's is a ring of 24 round the middle of a 16:9 screen, a turn and a quarter at 1.5 units a step.

1. It comes in from where the boss is put on the field, along the coil's top edge.
2. It goes round the coil from the top toward the player, and the body closes into a near-ring behind it.
3. It peels off along the tangent, straight down and off the bottom of the screen.
4. Once the tail is clear, the head is put back where it came on and the arrival every boss has takes
   over: *"then enter where it is now."*

While it flies it throws nothing, nothing the player sends touches it (every pairing is skipped, and
the arc and the seekers will not pick it as a target), and a ship that touches it is hit.

## Why this needed the renderer to turn a bitmap

⚠️ **`blit` COULD NOT ROTATE, AND THIS IS THE FIRST ASK THAT MADE THAT A DEFECT RATHER THAN A
CONSTRAINT.** Every hull is baked facing down the lane. A coil flies the head every way, so a head
that cannot turn flies half the ring backwards into its own neck. There were two ways to answer it:

- **Bake the head at N headings.** At 16 headings it clicks round a loop at 7 frames a second, and
  at 32 it is 64 more bakes of the largest boss sprite in the game.
- **Let `blit` take an angle — chosen.** It is still one draw of one baked bitmap, so it hides no work
  behind the count 0025 exists to protect. It costs a `save`/`rotate`/`restore` only for the few
  entities whose turn is not zero; every other blit takes the old code path. A world angle is a
  screen angle in both orientations, because each maps the lane onto the screen by a proper rotation.

`turn` rides the entity beside `prevTurn` and is interpolated the short way round, like a position.

⚠️ **AND THE BODY TURNS TOO, IN THE FIGHT AS WELL AS THE ENTRANCE.** A node is a disc so that it could
be laid at any angle without turning, but its paint is not round: a rim of light along the back and
a turn-under along the belly (0283). In a coil those would stack into the *croissants* 0283 photographed.
Every node now faces from itself toward the next node nearer the head, in both modes. That is one
description of which way a node faces; in the fight it tilts the rim light with the wave, by at most
about thirty degrees.

## Why the body follows here and is placed everywhere else

0283 places a chain because a boss holds station: the path its head records is a line swept back and
forth, and a body following it folds into a zipper. An entrance is the one stretch where that is
false — the head travels. So during the entrance a node is where the head was a body-length ago.
The path is a function of distance along it (`entranceAt`), and the body reads the same function, so
there is no trail to record or run out of, and the coil is exactly the one the row authors.

## Three things the entrance could have broken, each held

- **A released boss.** The entrance flies the whole animal off the bottom of the screen, through the
  `across` cull. `stepEntities` takes that cull as an argument now, for 0286's reason: a PLACED
  entity is not culled. The body never is, and the head is not while it enters.
- **A visible jump.** The hand-over moves the animal from off one edge of the screen to off another,
  so the entrance lasts until the TAIL is clear, and on that step the body is laid rather than
  moved (`bossSettle`) so nothing is drawn across the corner in between.
- **A gap nobody can use.** The first guard held the hole to a third of the lane. That was a number
  chosen here rather than asked for, which is 0295's *threshold that answers the question before it is
  asked*, and the ring's own hurtboxes measured 31 against 33. The guard became the claim itself: a
  live ship parked in the middle of the coil for the whole of a fully-live entrance is never hit.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0306`:

| broken on purpose | went red |
|---|---|
| half a turn and away, so it swoops rather than coils | `coils ROUND the middle of the screen leaving the centre open` |
| the coil too tight to leave its middle open, so the ship sitting there is hit | `coils ROUND the middle of the screen leaving the centre open` |
| the entrance handed over when the head is off the screen and the body is not | `coils ROUND the middle of the screen leaving the centre open` |
| the body moved to the arrival rather than laid there, so it is drawn sliding across the screen | `coils ROUND the middle of the screen leaving the centre open` |
| the player’s fire landing on the serpent during its entrance | `and nothing it throws, and nothing that hits it, until the fight begins` |
| the head culled across the lane during the entrance, so the boss is released off the bottom | `coils ROUND the middle of the screen leaving the centre open` |
| the serpent’s body harmless to a ship during its entrance | `and nothing it throws, and nothing that hits it, until the fight begins` |
| the head never turned to the path, so it flies half the coil backwards | `and its head faces where it flies` |
| the painter dropping the turn, so the model turns and the picture does not | `and its head faces where it flies` |

The last row is 0027's subject: every assertion about `head.turn` stays green over it, so the guard
also asks the painter what turn it was handed.

**And photographed** — the running game at 1280×720. The serpent comes in along the top, closes into
a ring round the middle of the screen with the centre open, and goes off the bottom. Its head faces
its path and the body's rim light follows the curve. The player's fire goes through it, and the
arrival afterwards is the fight as it was.

## What this deliberately does not do

- **At the bottom of the loop the head is upside down**, jaw up, which is what a side-on loop-the-loop
  looks like. The alternative is to MIRROR the head while it flies away from the player, so the jaw
  stays down: a second flag on `blit` or a mirrored bake. That is a matter of taste, to be settled by
  playing it rather than here.
- **No sway during the entrance.** The body lies exactly on the coil; the travelling wave is the
  fight's. A wave on top of a ring of 24 would bend the midriff tighter than 1.5 of its girth.
- **The arrival is untouched**, so the whole entrance is about six seconds of coil and then the five
  of the arrival. *"Then enter where it is now"* was taken at its word.
