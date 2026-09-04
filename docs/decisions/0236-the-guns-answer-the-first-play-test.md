# 0236 — The guns answer the first play-test

**Accepted 2026-09-05**, the same day as [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md), from
[`the-guns-played`](../../reports/the-guns-played-2026-09-05.md):

> *"lightning gun is cool and weapon rotation power ups are cool, but it adds a huge degree of
> difficulty now"*

Seven items, every one answered, and one defect found on the way. **Amends
[0066](0066-a-death-scatters-what-it-took.md)**: the short timer on a scattered piece is gone.

## The rules

**A face is shown for three seconds.** `PICKUP_CYCLE_STEPS` is 180, and it is a taste — observed in
`tests/authored.ts` as `0236-cycle`, never failed on. *"It changes just before you grab it"* is a
face that outlasts reading it and not reaching it.

**A scattered piece flies its throw, then waits like any other.** The along half of a throw used to
be eased away inside a second, which the eye read as a fan up and down the lane. A piece now flies
`SCATTER_FLIGHT` steps, bouncing off the box's ends and the lane's walls, and then carries the same
wait an authored pickup does and leaves the same way. 0066's short timer is retired with its probe
re-aimed; `tests/guns-played.test.ts` holds pieces on every side of the wreck.

**The arc's reach is a ladder, a fifth further at every rung.** `reach` on the weapon row, held as
*climbs at every rung by at least a sixth*, never as the numbers. **And a dry link stops the chain**:
a first link that found nothing was advancing the chain's origin by half a reach, so the second link
searched from there — invisible at 55 units, and at 114 it found bodies a reach and a half away.

**A strike is an explosion.** `zap` is built on the kill's recipe — a crack, a body of noise under a
falling filter, a thump to the root and the octave under it — a fifth of a second long, and held to
everything an explosion is held to (`EXPLOSIONS` in `tests/sound.test.ts`). It was eighty
milliseconds under a discharge on the same step, and the ear folded it in.

**The arc has thunder under the coil.** A low rumble of noise held under 200 Hz and the sub twice as
loud, still inside the arc's fastest cadence; the arc is now heavier at the bottom than the pulse,
which is the guard.

**A bolt has a dark halo and bright points.** `bolt` strokes three times — the space colour at half
alpha and twice the glow's width, then the glow, then the core — and a dot at every third inner
vertex. `STROKES_PER_LINK` says what a link costs and the counting guard counts it.

**Every pickup has a bubble.** A soft glow and a thin ring in the pickup ink, painted behind the
glyph with `destination-over`, in a box a third wider than the glyph; the glyph is drawn at three
quarters of the box, exactly its old size. Translucent, so it is not a solid mark outside the hull.
No enemy has one, and it does not change while the faces turn.

## ⚠️ What was rejected

**Scaling the pen for the bubble.** `tests/accents.test.ts` records the pen's calls and reads the
first sealed pass as the hull; a transform would have hidden the glyph's true size from it and a
bubble painted first would have become the hull. The arms draw in a smaller frame and paint the
bubble second, behind.

**A guard on the cycle's length.** Two seconds and three both satisfy every invariant the pickup has;
the difference is the player's preference, stated in seconds, and 0192 puts that in the register.

**A new strike cue.** The impact the report could not hear was there; making it audible was a
matter of size and shape, not of a fifteenth kind.

## What is owed

- **Another play**, on the branch preview: the seven answers are each a model quantity except the
  pictures shot off the sheet and the bench.
- **The homing missiles and the shuriken inherit the bubble** on their faces when they land.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0236`:

| broken on purpose | went red |
|---|---|
| the arc's reach authored flat across the ladder | `THE REACH: the arc reaches further` |
| the throw given no flight | `THE SCATTER: a death throws in every direction` |
| the strike's body cut back to a tick | `THE STRIKE: a bolt landing is an explosion` |
| the bubble left off the shield | `THE BUBBLE: every face` |
| the bolt's bright points dropped | `the picture is counted per link` |
| the thunder taken from under the coil | `the PLAYER'S OWN WEAPONS have a bottom` |
| a dry link moving the chain's origin | `beyond its reach it fires dry` |
