# 0473 — Each place has its own arms

**Accepted 2026-10-03.** Two items from one play report:

> *"enemies on each level need some unique level attacks and sprites as well — thematic for level and
> boss on that level. we did work on make the sprites different per level, but the attacks are all
> the same."*

> *"in the later stages a lot of the miniboss and level enemies attacks are very small and hard to
> see and dodge."*

Both reports are true of the code. Every place's enemy rows were one table, built once at mount from
`ENEMIES`, and [0446](0446-each-place-has-its-own-faces.md) said so in as many words: *"nothing but
the drawing moves."* So a turret in the Black Heart fanned the same three slabs as a turret at the
Approach. And the bullets in the last four places were the lance (1.9 units across, about eleven
pixels on a 1280×720 screen) and the spit (2.7), from raiders and from the Black Heart's mid-boss
alike.

## The rule

**Each place arms the five shared kinds that shoot with its own lord's ammunition, in patterns of
its own** — `ARMS` in `src/content/arms.ts`. It is 0446's roster one layer down: a
`Record<ArmedKind, Arms>` per place, required for every place and every kind, so a place that has not
said what its turret throws does not compile. The Approach's arms are the rows' own, as its faces are
the drawings every place used to share.

**The frame reads the place's rows.** `ROWS_OF` is every place's table, built once at import, and
`startLevel` and `advanceLevel` swap `w.enemyRows` to the place's. `fireEnemies` is unchanged: its
lookup is the array index it always was, and nothing is built in the loop.

**What a kind is does not move**, on [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)'s
and 0446's terms. A turret still fans three, a warden still walls with a hole where it is, a spinner
still turns a ring of three, and a sower still throws from both its emitters. A place changes what
comes out, how wide it fans, how fast it turns, and, where its body asks for it, whether the shot is
aimed or a string.

| | lancer | turret | warden | spinner | sower |
|---|---|---|---|---|---|
| **the Approach** | lance, down the lane | three slabs | spit wall | curl ring | four lances |
| **Ember Nebula** — the fish | a quill down the lane | three spines, wide | a wall of flame | a ring of flame | four quills |
| **Saurian Belt** — the pterodactyl | a tooth down the lane | three quills | a wall of teeth | a ring of teeth, quick | **two rocks** |
| **The Labyrinth** — the gyre | **a string of two cogs** | three cogs, tight | a wall of cogs, wide | a ring of slabs | **two flames** |
| **Rime Shelf** — the frost ship | hail at the ship | three hail, narrow | a wall of hail | a ring of ripples | **a string of two hail, at the ship** |
| **The Toxic Mire** — the hydra | a droplet at the ship | three droplets, wide | a wall of acid, wide | a ring of acid | four droplets |
| **The Black Heart** — the jellyfish | a clot at the ship | three clots | a wall of clots | a ring of clots, slow | **a string of two clots** |

Bold is fewer bullets a volley than the Approach's: a rock and a fireball are not lances.

**The Rime Shelf's shard throws hail too** (it threw the spit), and its spinner takes the ripple. Six
kinds shoot there in one ammunition, and they need six patterns where there are five.

**And four mid-bosses throw their place's**: the harrow quills, the shoal mother teeth, the lattice
cogs, the redoubt hail, the chorus droplets and the axis clots. The sentinel keeps the spit, because
the Approach's ammunition is the spit.

## Three new shots, and one new pattern

Three lords throw nothing a raider can carry. The frost ship's shard bursts twelve ways, the
jellyfish's void eats the player's fire, and the gyre's is the slab every place already has. So:

| shot | place | drawn | hurt | speed | ink |
|---|---|---|---|---|---|
| **cog** | the Labyrinth | 4.4 | 1.1 | 1.1 | its place's |
| **hail** | Rime Shelf | 4.8 | 1.2 | 0.9 | frost |
| **clot** | the Black Heart | 4.6 | 1.15 | 1.0 | its place's |

⚠️ **Drawn with no heading, because a blit cannot rotate.** That is the acid's lesson
([0300](0300-an-acid-bead-has-no-heading.md)): a pointed shot sprayed or aimed is drawn pointing somewhere it
is not going.

- The cog is eight square teeth round a holed hub, the gyre's gear at a bullet's size.
- The hailstone is a faceted lump lit on its upper face.
- The clot is seven shallow scallops round a dark, mottled middle.

⚠️ **More than twice as wide as the lance and the spit, and hurt hardly more.** Being seen is what was
asked for; a bigger hurtbox is a harder dodge, which was not. Each hurtbox is a hair over
`tests/combat.test.ts`'s floor of a quarter of its drawing.

**The stream** (`Attack`'s sixth kind) puts `shots` on one heading, each giving up `lag` of the speed
of the one before it. A volley arrives as a burst the player steps out of the line of once, rather
than threads. It is aimed at the ship or sent straight down the lane.

## ⚠️ What the picture changed

Every shot was looked at on `rig/sheet` at 8× through `scripts/shot-sheet.mjs`, and the re-armed
places were photographed mid-level on `rig/bench.html?proof`.

- **The first clot was a starfish.** Five lobes at 0.12 deep read as a rounded star at 8×: a pointed
  thing with a heading. Seven at 0.07 read as a knot.
- **It is gold in the Black Heart, not red.** A raider's bullet takes its place's colour
  ([0296](0296-a-bullet-belongs-to-its-place.md)), and the Black Heart's is gold against
  its red. The lobed outline and the dark middle are what keep it from that place's drifter, a smooth
  red cell that is pale where it is thin.
- **The shard was still the smallest square in the game**, in a sky of hail, which is why it moved.

## ⚠️ What the count on the screen changed

[0472](0472-the-fights-thin.md) had just measured every level down at Savior. A pass about what a
shot IS must not quietly undo a pass about how many there are, so `scripts/weigh-fight.mjs
--difficulty=savior --carried` was flown over this branch on top of 0472. Busiest two seconds of each
mid-boss fight, in live bullets on the screen:

| fight | 0472 | first draft | as built |
|---|---|---|---|
| the shoal mother | 21.8 | 35.7 | 23.7 |
| the chorus | 32.6 | 42.6 | 34.6 |
| the axis | 32.7 | 48.4 | 38.2 |

**A slow bullet is more bullets.** How long a shot stays on the screen goes as one over its speed. The
first drafts were the clot at 1, the droplet at 1, the spine at 0.95 and the hail at 0.9, where the
lance they replaced is 1.6 and the spit 1.4. They left the mid-boss fights half as busy again by count.
So:

- the clot and the droplet are 1.3;
- the hail is 1.1;
- the shoal mother throws the pterodactyl's quill (1.3), not its raiders' teeth;
- the axis's two firing phases fire at 66 and 48 steps, from 54 and 42, which is 1.6/1.3 apart.

The droplet's speed moves nothing else: a maw's burst sets its own.

**The axis is still a sixth over 0472's peak**, and that is its curtain: two dozen clots across the
lane, each a little slower and wider than the lance. Its average over the fight is 12.9 against 11.9.
It is the player's to say whether the last mid-boss's curtain is the fight.

Outside the fights, every level's busiest stretch is at or under what 0472 left: 18 to 30 live
bullets, the first three levels unchanged.

## Guards

`tests/arms.test.ts`:

- **THE REPORTED ONE**: no two places arm a shared kind with the same bullet in the same pattern.
  0446's faces guard, for what comes out rather than for the outline.
- the Approach's rows are its own, and every other place's come from its table;
- **THE FRAME SWAPS THEM, DRIVEN**: a world starts at the Approach and crosses into each place
  through `advanceLevel`, and its turret fires the new place's bullet. Driven through the game's own
  boundary, because `tests/world.ts` sets the level's rows itself and would pass either way;
- a stream leaves on one heading, each shot slower than the one before.

**Five guards that read the one table now read every place's**, because each is a claim about what a
place's raiders throw, and it was true only of the Approach:

- `tests/signature.test.ts` and `tests/legibility.test.ts`: no two kinds send one bullet in one
  pattern, in every place. **The first draft failed this**: the Saurian crocodile threw a tooth at
  the ship, which is the minnow's. It throws down the lane now.
- `tests/pilots.test.ts`:
  - no attack nothing throws;
  - most of what shoots is a pattern, and something aims, in every place;
  - a pattern is the same wherever the ship is;
  - a wall leaves a hole and leaves the hull;
  - a ring turns;
  - each body's volleys and bullets while on screen are bounded at the hardest tier.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0473`:

| broken on purpose | went red |
|---|---|
| the Rime Shelf turret armed with the slab every place threw | `THE REPORTED ONE: no two places arm a shared kind` |
| a level crossed into without its place's rows | `THE FRAME SWAPS THEM, DRIVEN` |
| a stream whose shots all leave at one speed | `and a stream is one heading, each shot slower` |
| the Saurian lancer throwing a spine at the ship, which is the minnow's | `and a firing signature sends a bullet-and-pattern no other kind sends` |

⚠️ **And CI's whole proof found a probe this change stranded.** 0151's *"the hole authored past what
the ship can cross from the far wall while the curtain closes"* moved the axis's curtain hole to 101,
out of the ship's reach in the lance's 39 steps in the air. The clot's curtain is in the air 58 steps
at the hardest tier, and the ship reaches 97.8, so 101 was inside its reach and the probe went STILL
GREEN. It now moves the hole to 114, the lane's last place for a hole of twelve, which is 10 short. The
axis's own hole at 70 is further inside the reach than before, which is the point of the guard.

## What it costs

Three sprites in every place's atlas, baked at load. `ROWS_OF` is seven arrays of twenty rows, built
once at import. In the frame: one assignment at a level boundary, and the stream's case, which
allocates nothing.

## Owed

- **A play of every place**, which is what all of this is for. Any of the thirty arms is the player's
  to veto; each is one row.
- **The Approach is unchanged**, so level one still throws the lance and the spit. It is the place
  whose ammunition those are.
- **The moth, the picket, the swift, the kite and the minnow are each one row everywhere.** They are
  sent by one place or one boss, so a place of their own was never the question.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Content and art baked at load;
nothing persisted.
