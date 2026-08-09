# 0100 — A level places its pickups too, and a scatter stays inside the box

**Accepted 2026-08-10.** Two items of
[the-sixth-play-test](../../reports/the-sixth-play-test-2026-08-10.md).

**Two defects, and the first one is the most serious thing this project has shipped.** Neither is a
tuning question and neither has an argument on the other side.

## The rules

**An authored place is a LEVEL coordinate, and every spawner adds the origin.** Waves, the boss and
now pickups.

**A scattered pickup bounces off the player's box on the along axis**, exactly as every pickup already
bounces off the lane on the across axis.

## What was asked for

> *"Also our tests and guards seem to not be doing a great job because I didn't get a single power up
> after level 1."*

> *"And on player death the powerups can go to section on the left side of the screen, where they are
> visible but the player cannot get to them."*

## The first one is true of every level from two to seven, and it is measured

⚠️ **`spawnWave` places a wave at `wave.at + w.levelOrigin`. `spawnBoss` places a boss at `bossAt +
w.levelOrigin`. `spawnPickup` placed a pickup at `entry.at`.**
[0076](0076-a-level-has-an-origin.md) added the term to two of the three call sites.

⚠️ **Driven through a real boundary, before anything was changed:**

```
at the boundary: camera 1800, levelOrigin 1800
  pickup 1: along=260,  camera=1801, inView=-1541
  pickup 2: along=950,  camera=2470, inView=-1520
  pickup 3: along=1750, camera=3271, inView=-1521
pickups spawned in level two: 9 — steps any were on screen: 0
```

**Nine of nine, about fifteen hundred units behind the camera, culled on the step they spawned. Not
one frame on screen.** Level one's origin is zero, which is the only reason it has ever worked.

## AND IT IS A DIFFICULTY DEFECT AS WELL, WHICH NOBODY COULD HAVE SEEN

⚠️ **The scheduling side was always right, and that is what made it silent.** `stepSpawns` asks
`pickups[next].at <= spawnAlong(camera) - levelOrigin`, which is in level coordinates and correct — so
`nextPickup` advanced normally and the model believed it had offered nine pickups.

⚠️ **So did the dial.** `weaponsOffered` increments where a pickup is *placed*, and
[0084](0084-the-dial-is-the-level-and-the-guns.md)'s dial is `1 + levelIndex + weaponsOffered`. **From
level two onward the game has been raising its own difficulty on schedule for weapons the player was
never shown.** Four a level, exactly as authored, every one of them invisible.

⚠️ **Levels two to seven have therefore never been played as authored.** Any impression of their
pacing is an impression of a game with no pickups in it and a difficulty dial running ahead of itself.

## Why no guard caught it, which is the question the report actually asked

⚠️ **Every pickup guard in the repository runs level one.** At an origin of zero the missing term is
invisible, and zero is the only origin anything had ever tested.

⚠️ **The level boundary is driven by the SHELL**, so a `GameFrame` fixture never crosses one.
`advanceLevel` is exported and no test had ever called it. Reproducing this took a hand-written call.

⚠️ **And the guards that exist are about the TABLE.** `tests/level.test.ts` holds that a level's waves
ascend, that nothing leaves the roam band, that the boss comes last — all true of the content and all
blind to where the content is put.

**So the new guard drives every one of the seven levels as a SECOND level** — a non-zero origin — and
measures where each pickup is placed relative to the camera at the instant it spawns. It fails with
the exact numbers: *approach as a second level placed 9 of its 9 pickups BEHIND the camera — the
furthest by 1541 units*.

⚠️ **At the instant of spawn, because that is the only moment a pickup has an identity a test can
hold**: its `along` changes every step and the pool recycles slots. Where it was PUT is the whole
question.

⚠️ **Both ends are held.** *Not behind the camera* alone would pass the mirror-image mistake — adding
the origin at the scheduling too, which places every pickup a whole level ahead. It is a probe.

## The second one: the view and the player's box are not the same band

⚠️ **The view begins at the camera. The ship's clamp begins at `PLAYER_ALONG_MARGIN`** — about eleven
world units in — **and ends at `PLAYER_LEAD`** (`src/sim/flight.ts`, [0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md)).
Everything below the margin is on the screen and out of reach, which is the report word for word.

⚠️ **`scatterRing` throws a full circle and the along half is spent over about eleven units**, so a
ship that died in the back eleven units of its box — where a player who has just been shot usually is
— put pieces there.

⚠️ **`driftPickups` already bounces a pickup off the LANE on the across axis and had no rule at all on
the along one.** The fix is the same mechanism on the other axis, which is why it is two lines.

⚠️ **A bounce and not a clamp.** A clamp parks the piece on the wall while the ease is still driving
it outward, which reads as a pickup stuck on a line — and it would leave the whole scatter stacked,
deleting the picture [0066](0066-a-death-scatters-what-it-took.md) exists for. Reversing the
*departure* from the scroll rate sends it back under its own momentum. It is a probe, and it is the
fix a hand writes first.

⚠️ **Scattered pieces only.** An authored pickup whose wait has run out is MEANT to fall back through
the view and leave ([0064](0064-a-pickup-waits-to-be-taken.md)); bouncing it would make every pickup
in the game immortal.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0100-pickups-cross-the-boundary.mjs`.

| broken on purpose | went red |
|---|---|
| the level origin dropped from a pickup's placement, which is how it shipped | `0100 — THE REPORTED ONE: every authored pickup reaches the screen, at a non-zero origin` |
| the origin added at the scheduling as well, so every pickup is placed a level ahead | the same |
| the along bounce removed, so a scatter strands pieces below the player's box | `0100 — THE REPORTED ONE: a scatter never leaves a piece where the ship cannot reach it` |
| the bounce written as a clamp, so the whole scatter stacks on the wall | `0100 — and the piece is still THROWN` |

⚠️ **The first and third are the code as it shipped**, which no probe in this repository has been
before. Every other break here restores something that was once a deliberate choice.

## What this does not settle

**What levels two to seven are actually like.** They have never been played with their pickups in
them, and the dial has never been what it was supposed to be. The next play-test is the first
observation of the game as authored, and any earlier verdict on those levels is about a different
game.

**Whether the dial's arithmetic still lands.** 0084 sizes the curve so the last boss sits at exactly
`DIAL_MAX` — seven levels times four weapon pickups. That arithmetic was always right in the model and
has never once run against a player who could take the pickups.

**Whether a bounced piece is where the player wants it.** The rule keeps it reachable; it says nothing
about whether the back of the box is a good place to have to fly to while respawning.

## Rollback

**None.** No storage key, no save field, no service-worker cache prefix, no origin — one term and one
bounce. [0001](0001-revertability-not-risk-rating.md).
