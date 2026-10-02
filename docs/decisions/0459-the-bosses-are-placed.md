# 0459 — The bosses are placed

**Accepted 2026-10-02.**
- The serpent fights in a room walled in the world tree's roots. The camera comes to rest, and the
  roots frame the far side of the screen: along the top and bottom from a hundred units in, and down
  the far edge, where its body runs off into them. They part on its death.
- The hydra fights in a room with no walls, the jellyfish's, and stands 28 units further forward.
- A boss's laser is drawn under the animal that fires it.
- The frost ship's cold is a fifth larger at rest and pulses out to most of the screen every ten
  seconds, then flickers out and starts again.
- In the Black Heart, a hostile bolt glows in the place's plasma yellow, and the jellyfish's glass is
  its own cold light rather than a violet.

## The ask

> *"for the serpent on level one, we need the world tree's roots framing that side of the screen
> around to indicate it's lurking in the world tree's roots - the background needs to stop scrolling
> there as well."*
>
> *"for the pteradactyl, the lazers are firing above the graphic sprites instead of below it so it
> still doesn't look like it's properly firing the lazers"*
>
> *"the slowing aura on the rime shelf boss needs to be 20% larger as a base and it needs to slowly
> increase in a pulse every 10 secs so that it takes up most of the screen, then flickers out and
> restarts out. It's pretty at the moment but has no game affect at all as it's too small."*
>
> *"hydra needs to be closer to the right edge of the screen, it's too far in at the moment.
> background also needs to stop scrolling for this boss fight."*
>
> *"the lightning and jellyfish at the end of the black heart look almost exactly the same colours
> as the level background so they can hardly be seen at all."*

## The two rooms

*Stop scrolling* is [0335](0335-the-fight-happens-in-a-room.md)'s room: the camera settles over
`settle` steps to rest `stand` units short of the fight. Both rows take the gyre's and the
jellyfish's numbers. The hydra's room has no walls, as the jellyfish's has none
([0400](0400-the-heart-is-the-room.md)). The Mire's bank has no end
([0383](0383-the-mire-floor-is-a-wall.md)), and the acid pool is laid round the hull every step, so
both stop with the camera and stay under the hydra.

The serpent's room is walled in `rootWall`, a new tile on `roomWall`'s terms. It is a tangle of roots
that tiles every way, so one tile serves as the top, the bottom and the far wall. Each root is a
periodic line: it climbs one tile for every tile it crosses, and its wander is a sine whose period is
the tile. So the tile has no seam in either axis. The tile is drawn past its own edges and the
bitmap's edge is the clip, so no clip had to be added to `Pen`.

⚠️ **`mouth` may be negative.** Negative means the open side is in front of the resting camera, so
the side walls start part of the way across the screen. That is what *"framing that side of the
screen"* asks: at −100, the near half of the screen is still open sky. A corridor reads `mouth` too,
but only in a level that has one, and the Approach has none.

⚠️ **A boss in a room still keeps time.** The serpent's bob ran on `scrollPerStep` and its drift on
`cameraAlong`. Both were the camera, and in a room the camera stops, so the serpent froze mid-coil.
`tests/serpent.test.ts` caught it, and so did `tests/bob.test.ts`. The bob now runs on the level's
`scrollRate`, and the drift on `cameraAlong + restedBy`, where `restedBy` is how far a room has held the
camera back this level. Outside a room both are the numbers they always were, so
[0061](0061-a-boss-keeps-flying.md)'s *a boss keeps flying* holds in a room too. The serpent's ball
fixtures had put a ball down still and let the camera bring it in. They now throw it at its row's
speed, as the game does.

⚠️ **A walled room with no wreck parts on the death.** [0337](0337-the-gyre-falls-out-of-the-wall.md)
opened the far wall only after a wreck had landed, and `stepWreck` returned at once with no wreck. A
room with walls and nothing to fall out of them would have kept its far wall shut while `scrollFor`
brought the camera back up, and the wall would have scrolled into the ship. It now opens over `opens`
steps from the death, while the level's clear runs.

## The hydra's station

154 → 178. Its heads reach back down the lane from the shoulders, so the mound and the tail move
toward the leading edge and the heads stay in the fight. The hull's front is 178 + 5 + 21 = 204,
against the narrowest screen's 213, and `tests/level.test.ts` holds that bound for every boss.

⚠️ **The first draft was 182, and the music said no.** The aura is the boss's own sound and fades
with the gap ([0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md)). At 182, a player backed
into the rear of the box heard 0.086 of it, under the tenth `tests/music.test.ts` holds as
*attenuated, not muted*. At 178 it is 0.104. Coming further forward means retuning the aura's range
for every boss, which nobody asked for.

## The beams

The roots of the beams were already on the barrels and the throat
([0452](0452-a-boss-fires-from-its-guns.md)), and the geometry was checked against the bake again.
What read as *"above the sprite"* was the draw order. `paintBolts` ran after `paintScene`, so the
stroke and its glow (four times the stroke, with round caps) lay over the hull, the barrels and the
beak. `paintBolts` now takes which half to draw. `paintScene` strokes the beams just before the boss's
body layer, and the frame strokes everything else afterwards, as [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)
asked for the lightning.

The cost is unchanged: the same strokes, in a different order. This applies to every boss's beam,
and that is the intent. Every boss fires from its guns, so every laser leaves from under the gun.

## The cold

The row authors `radius` (at rest, 38 × 1.2 = 46), `reach` (108), `pulse` (600 steps), `flicker`
(48) and `blink` (12). `chillRadiusAt` is the one function that gives the radius on a step. It
smoothsteps from `radius` to `reach` over the pulse less its flicker, then alternates lit and dark.
`pulseChill` runs once a step, before `chillShip` and `layAura`, and both of those read the
`chillRadius` it writes. That makes the slow and the drawing one edge on every step, and the test is
that they are equal on every step of a pulse.

At its top, the cold reaches both edges of the lane wherever the hull patrols. It covers everything
down-lane of 44 units at the near end of its drift, which is more than three quarters of a 16:9
screen. The strip behind that is the answer to the cold: *fall back*.

⚠️ **108 and not 120, because a ship starts at 40.** The first draft reached 120, and its top covered
the place a life begins. `tests/crowd.test.ts`'s pilot holds its lane rather than retreating, so it was
frozen under a volley with no safe place it could reach. That is the guard doing its job: a respawn
into a freeze is damage the player cannot play around. The frost test now holds that the start line
is clear of the cold's top. The pilot also reads the step's radius now, not the row's.

⚠️ **The strobe is 12 steps lit and 12 dark, because of [0024](0024-the-accessibility-floor-is-settings.md).**
The first draft blinked every 5 steps. Four fifths of the screen changing at six a second is a
general flash by any reading, and the cap is three a second. Twelve and twelve gives two and a half,
for four halves, and then the cold is out. `tests/frost.test.ts` holds the arithmetic.
[0457](0457-the-flash-cap-is-measured.md)'s meter is the instrument that can say whether the haze
moves the screen's luminance far enough to count at all. It has not been run on this, so the cap is
assumed to apply.

## The Black Heart

Measured against the place, the beam's glow is the `enemy` pink `#ff7286`. The arteries' lit core
is about `#d48598` and the heart's glow is rose `#ff5c7a`, so the glow sits at about 1.05 to 1
against the vessels. The jellyfish's glass was its lord's red lifted toward its ice, a violet, at a
fifth. Over the mauve nebula that comes out about 1.3 to 1.

- **The bolt.** A place now authors `bolt`, the glow a hostile bolt wears there, or `null` for the
  `enemy` ink. Only the Black Heart authors one. It is `#ffe84a`, the plasma its bullets already are,
  for the same reason (`foe.shot`: *"the one place a red bullet would be invisible"*). The mount sets
  it when the place changes. The serpent's lightning in the Approach is untouched.
- **The jellyfish.** Its glass is now its lord's cold light paled toward white, at half. That light
  was already the bell's: the rim and the lamp inside it. Composited over the nebula, the bell is
  about 3.2 to 1, over [`tests/contrast.ts`](../../tests/contrast.ts)'s gameplay floor of three. At
  two fifths, the first draft, it was 2.6. The tentacles are drawn in the glass,
  so they move with it, and their seam is whiter so it still reads. The heart still shows through
  the bell.

## Rejected

- **A new painter for the roots.** It would be a second room with a second set of world positions.
  The room already stands at world positions, scrolls in, stops with the camera and parts. What the
  serpent needed was a different tile and an open side in front of the camera.
- **Every place's bolt in its `foe.shot`.** It is plausible, but it changes six places nobody asked
  about. This is per place and defaults to the ink every bolt had.
- **Roots drawn over the serpent's body**, so that it reads as *in* them rather than *over* them.
  The body is hurt node by node, and [0335](0335-the-fight-happens-in-a-room.md)'s one absolute is that
  nothing the player has to see is behind scenery.

## Confirmed, not assumed

| claim | measured | held by |
|---|---|---|
| the serpent's camera stops, and the roots frame the far side | at rest, the roots run from 0.47 to 0.95 of the narrowest screen | `tests/serpent.test.ts`, *the screen stops, and the roots frame its far side* |
| the serpent still bobs and rears at rest | across swing over its amplitude, along swing over its rear | *the animal keeps moving while the screen is still* |
| the far roots part on the death | `room.open` reaches 1 inside `opens` + 30 steps, and the camera moves | *when it dies the far roots part* |
| the hydra's camera stops, and it stands at the edge | nearest at 0.8 of the narrowest screen or further | `tests/hydra.test.ts`, *the camera comes to rest for the fight* |
| a level flown from its start lands its room | the Approach and the Mire, flown with the mid-boss killed: camera at rest exactly at `bossAt − 60` | a scratch run, not kept: the guards above stand a boss with no mid-boss |
| a beam is under its gun | every hostile beam stroke before the hull's blit | `tests/quetzal.test.ts`, *every beam is stroked before the hull is blitted* |
| the cold pulses, and the slow is the drawing | equal on every step of a pulse; rest, top, strobe, out, rest | `tests/frost.test.ts`, *THE PULSE, DRIVEN* and *THE EFFECT* |
| the jellyfish and the lightning stand off the place | glass 3.2 : 1 over the nebula; the bolt 2.2 : 1 against the vessels' lit core, against the pink's 1.05 | `tests/medusa.test.ts`, *THE JELLYFISH* and *THE LIGHTNING* |
| the picture | each boss photographed on the bench at 1280×720 through its own controls | eyes on, not a guard |

`node scripts/prove-guard.mjs 0459`: thirteen probes, all red. **Re-anchored**, each on what it
breaks: 0061's two drift probes (the paced camera), 0253's slow (the step's radius), 0337's far wall
(now unique against the no-wreck branch), 0383's acid (the beams' arguments), 0399's field (the step's
radius) and 0400's room (the hydra has the same one). And 0289's unlocked lunge, which CI's whole
proof caught: run off the camera, a rear in a room froze outright and reddened the size guards before
the lock guard. It now runs off the paced camera, so only the lock breaks.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing persisted moves.

## Owed

- **A play of all five fights.** The frost ship's pulse above all: it is the first time the cold costs
  anything, and a freeze at the top of the pulse may be too much. `slow`, `freezeAfter` and `reach` are
  the row's to turn.
- **The roots on a wide screen.** The far wall stands at the edge of the player's box, as the
  Labyrinth's does, so on anything wider than 16:9 there is sky past it.
- **The flakes at the top of the pulse.** They are baked at 76 units and drawn up to 216, so they are
  soft there. A bigger bake is a cost the atlas pays at every size.
- **The bolt's glow is set by the mount on a change of place.** That was seen on the bench, but no
  guard drives the mount.
