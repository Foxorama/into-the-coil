# 0230 — The ship flies: the exhaust is an entity, and it answers the hand

**Accepted 2026-09-05.** The feel item from the 2026-09-04 play-test.

> *"Ship engines need to be pulsing ion thrusters that burn when you hard push to the right and
> that sway up, down, forward and reverse in response to movement, as it doesn't feel like I'm
> flying, it feels like I'm just moving a thing around."*

## ⚠️ Why a plume on the hull could never do this

[0227](0227-a-sprite-is-painted-not-filled.md) painted an exhaust onto the ship's bitmap, and a
bitmap is the same picture at every speed. Everything that moves in this game moves by a blit's
position or by a sprite swap ([0227](0227-a-sprite-is-painted-not-filled.md)'s flares,
[0035](0035-damage-is-legible-on-the-body-that-took-it.md)'s flash), and a flame that has to burn,
pulse and sway needs all three at once: a position of its own, a frame of its own, and a clock.

## The rules

**The exhaust is one entity in its own pool, placed at the tail every step.** `src/content/exhaust.ts`
is the table; `stepExhaust` in `src/app/frame.ts` carries it by hand exactly as the shell is carried
— nothing else steps the pool, and the renderer interpolates from `prevAlong`. It is lit while the
ship flies and out on the step the hull wrecks. Drawn under the shell and the ship, so the root of
the flame is behind the hull and [0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)'s
rule that nothing is drawn between a ship and its marks still holds — the first draft put the flame
between them, and that guard said so. The hull's baked plume is gone.

**What the engines are doing is the ASK; where the flame hangs is the VELOCITY.** A push past
`BURN_ASK` on the intent's along axis shows the burn frames; a pull past `EASE_ASK` the ease frame;
anything less idles. The ask and not the velocity, because the box clamps the velocity: a player
leaning on the stick against the front of the box is going nowhere and is, in every sense the picture
cares about, pushing. The flame's place across the lane trails against `velAcross` by `SWAY`, so a
climb hangs it below the tail and a stop swings it back — on the lag `FLIGHT_RESPONSE` already gives
the hull, which is what makes it read as mass.

**A pulsing state has two frames and alternates them every `PULSE_STEPS` steps.** Idle and burn
pulse; ease is a wisp with nothing to alternate to. The clock is the sim's own step count, so the
flicker is deterministic and the same on every machine.

**Five sprite kinds, each a flame with no hull.** Two per nacelle, roots at the sprite's forward edge
and tips at its back, so the extent is the flame's length and a burn is nearly twice an idle. Painted
in the palette's fire on the burst's own terms.

## What is held

`tests/thrust.test.ts`, with a hand on the stick: a flame while flying and none on a wreck, behind
the tail with its root reaching the hull; burn on a hard push and ease on a hard pull, off the ask,
and still burning pinned against the front of the box; the pulse alternating on the step clock and
holding each frame; the sway against the across velocity and its swing back; the draw order; and the
rows.

## What is owed

- **An eye on the feel.** Whether a third of a hull of sway and a twenty-a-second flicker read as
  flying is the play-test's, and `SWAY`, `PULSE_STEPS`, `BURN_ASK` and the two `trail`s are the knobs.
- **Banking is not in this decision.** A hull that tilts into a climb is the other half of *flying*,
  and it is a bitmap per tier per bank — six more kinds. It waits for the eye on this.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0230`:

| broken on purpose | went red |
|---|---|
| the exhaust left lit on a wreck | `THE REPORTED ONE: a flying ship has a flame behind its tail, and a wreck has none` |
| the state read off the velocity instead of the ask | `still burns with the ship pinned against the front of its box, because the ask is the state` |
| the pulse frozen on one frame | `pulses: a pulsing state alternates its frames on the step clock` |
| the sway removed, so the flame sits dead behind the tail | `sways: the flame hangs against the ship’s sideways velocity, and swings back when it stops` |
| the exhaust drawn over the ship | `is drawn under the shell and the ship and over every shot, and every thrust row has frames and a trail` |
