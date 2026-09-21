# How the places get painted — a handover for the five that are left

**2026-09-21.** A companion to [`the-places-are-painted`](the-places-are-painted-2026-09-21.md), which
is the plan and holds the order, the asks and the *will see* sentences. **This file does not restate
any of that.** It is what three items taught about *how* — written because the session that did them is
handing the rest to another, and chat evaporates
([0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)).

Done: 0 ([0342](../docs/decisions/0342-the-hulks-come-out.md)), 1
([0343](../docs/decisions/0343-the-stars-are-drawn-for-a-desk.md)), 2
([0345](../docs/decisions/0345-ember-nebula-is-in-colour.md)), 3
([0347](../docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md) — mechanism 2 is built
there: `LandmarkEntry.erupts`, `paintEruption`, and the seam fix for every opaque layer), 4
([0348](../docs/decisions/0348-the-labyrinth-is-walled.md)). Left: 4b The Labyrinth, 5 Rime Shelf, 6
The Toxic Mire, 7 The Black Heart.

## The loop, per place

Every item so far went the same way, and the order matters more than any step in it.

1. **Photograph first, at the screen the sky is authored for.**
   `node scripts/shot-place.mjs <theme> --view=1920x1080 --port=<dev server> --out=<dir>`, three
   camera points, plus `--at=<along>` for a landmark. Read the PNGs. **1280×720 hides most of what is
   wrong** — Ember Nebula's dust read as *decent* there and as slabs at 1080p.
2. **List everything on the screen, not what was named.** The plan's rule since 0343: each thing is
   made good, removed, or left with a reason written in the decision. *Removed* is a real answer.
3. **Measure before spending.** `node scripts/weigh-sky.mjs` for contrast room per place (floor 3;
   the number that matters is the last column). `node scripts/weigh-stars.mjs` for stars in CSS pixels.
4. **Build, photograph, repeat** — the dev loop is seconds. Do not run suites between brushstrokes.
5. **Then run the sky suites**: `tests/sky.test.ts tests/places.test.ts tests/stars.test.ts
   tests/gases.test.ts tests/budget.test.ts tests/palette.test.ts tests/themes.test.ts`. A red guard is
   answered on [0192](../docs/decisions/0192-a-guard-holds-an-invariant.md)'s terms — and twice so far
   it was **right**: this queue's own guards caught a 3.6 px star core, a 17.7-unit bare stripe and a
   13.4° kink, each in the first draft of the decision that wrote them. Set the bound before measuring.
6. **New guards in player units, each with a probe**, then `node scripts/prove-guard.mjs <decision>`
   to watch them redden — a minute, not two hours.
7. **Anchors**: any edit to `src/render/bake.ts` can strand a probe elsewhere. The harness refuses to
   start if one is stranded or ambiguous, which is the cheap way to find out — run the filtered proof
   for every decision whose probes touch the code you changed (0196, 0211, 0222 and 0343 so far).
8. **Decision, report tick, `docs/state-of-play.md` pointer**, then `/ship`.

## What worked, as techniques

| for | do | not |
|---|---|---|
| anything that crosses the tile | **a sum of sines whose periods divide the tile** — periodic in height *and* slope | a random walk forced home: it kinks at the join, and at 1080p it is visibly straight pieces. `crossing` is deleted for this |
| a soft edge on a filled shape | draw it **three times**, scaled about its centre, at falling alpha (1.7/1.25/0.8 × at 0.16/0.2/0.3) | one flat fill — every flat fill in these skies reads as a sticker |
| light with no edge | stacked ribbons each nearly nothing (eight at 0.065), or a two-stop radial gradient | a third colour stop inside `drawNebula` — `cloudCover`'s arithmetic assumes two and a guard scans for it |
| a smooth outline through authored points | each point is the **control point** of a quadratic from the midpoint before to the midpoint after (`through` in `drawPillars`) | `lineTo` between them |
| colour | **saturation, not luminance.** The floor counts the loudest colour a place states (`loudest`, which now includes `gases`) | brightening to get vivid — it spends the room and reads no more colourful |
| per-place anything | an **optional field on the row**, absent meaning exactly what shipped ([0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)) — `SkyStyle.stars`, `SkyStyle.cloudCeiling`, `ThemeRow.gases` — plus a guard that a place stating nothing is unchanged | a shared constant, or a required field six places must fill in |
| stars | give the place its own `stars` row; **0343's seam guard will check it** | the shared field: grey coins 5–11 px across at 1080p. Still what The Labyrinth and The Black Heart draw; the three planets draw no star field at all ([0221](../docs/decisions/0221-a-planet-is-not-a-space.md)) |

## What bit, and will again

- **One proof at a time on this machine, and another session may be running one.** Two of three
  baselines timed out before that was understood. Check `gh pr list` and for a running
  `prove-guard` before starting; leave the machine alone while it runs.
- **After a proof exits 0, grep its log for `ReferenceError|TypeError|is not defined`.** A probe
  whose replacement text crashes is counted `red`. 0345 found its own that way and six more on `main`.
- **A squash-merge makes the held patch conflict with `main`** even when the content is identical.
  Verify `git diff <old base> origin/main` is empty, then take the patch's tree wholesale
  (`git checkout <wip> -- .`) and confirm `git write-tree` equals the patch's tree. Do not hand-merge.
- **Decision numbers collide across sessions** — 0343 was claimed twice in one day. Read
  `git ls-tree origin/main docs/decisions/` and the open PRs immediately before writing the file.
- **Tile `y` 0.25–0.75 is the lane.** The weather and ground tiles are twice the lane across. This has
  now caught five separate drafts.
- **Port 5199's bench may be another worktree's.** Start a server for the tree being painted
  (`.claude/launch.json` has `sky` on 5241 and `stars` on 5243, both machine-local) and check the
  process's command line before trusting a shot.

## Notes per remaining place

Starting points, not designs. Each is unverified until its own photographs say otherwise.

### 3 — Saurian Belt

`GROUND_OF.saurian` → `drawRidges`: three flat polygons. The sky is one hex (`space`). Three volcano
landmarks (`drawVolcano`, `LEVELS.*.landmarks` with `beat: 190`) whose only motion is
`BEAT_SWELL` in `src/render/scene.ts` — a scale pulse, *"one pulsing graphic"*.

- **Sky gradient**: `space` is the canvas clear colour, so a graded sky is a tile. The weather tile is
  the natural host (drawn first, depth 0.09) — a vertical linear gradient across the lane band.
- **Jungle**: ridges become layered — far mountains hazed towards the sky colour, a canopy line with
  tree crowns (sines plus seeded bumps), near foliage. Greens need `ThemeRow.ground` to stop being one
  hex: the same optional-row move as `gases`.
- **`tests/places.test.ts` — *land is DARKER than the sky over it*** will redden on a lit canopy. Its
  reason is that the bottom of the screen stays the darkest thing on it; argue it against the picture.
- **The volcano must touch the sky**: a smoke column to the top of the landmark tile (75 units — check
  it reaches the top of the view at `lane` 50–74; it may need the entry's `lane` moved, not a taller
  bitmap). Set `beat: 0`; a mountain does not breathe.
- **Mechanism 2 arrives here.** Design agreed in the plan: baked sprite(s), positions a pure function
  of `steps` and an index, blitted in `src/render/scene.ts` after the landmarks — a hot file, so no
  allocation, and the draw-call ceiling is a budget with a named owner. Ejecta are parabolas from the
  crater's world position; a bomb's phase is `(steps + index * stagger) % period`. Count the blits
  under `tests/budget.test.ts` before choosing a number. Comfort: 0024 — a setting may switch it off.

### 4 — The Labyrinth, then 4b

Flank answer is in the plan. `paintRoom` (0335) is the wall language and `roomWall` the sprite; author
the corridor as **a centreline and a gap along the level** so 4b only changes a constant to a curve.
Contrast room is **1.12×**, the second tightest: masonry should be dark with lit edges, which is what
is there now. **4b is a game change** — bring the plan's three questions to the player with a
recommendation before any geometry.

⚠️ **4 LANDED AS 0348, AND WHAT 4b INHERITS:** `LevelRow.corridor` (centre and width, both the box for
now), `corridorFor`, runtime passages a flank opens (`openPassage`, eight slots), and drifters that
turn at the wall's face on a walled level. **Enemies roam past the ship's clamp**, so *walls where the
clamp is, so nothing collides* was only ever true of the ship — the player chose *turn at the wall* for
drifters mid-build, and 4b's *explode on contact* would replace that. `tests/corridor.test.ts` flies
the level and holds *no body drawn over stone*; a corridor that turns needs that guard's wall
positions to follow the curve.

### 5 — Rime Shelf

⚠️ **The known collision, and the player has chosen** (answer 2 below): an **off-white, balanced**,
then a play-test. Room is **1.09×**, the tightest in the game, worst ink `void`, and whites are
luminance — so keep the brightest ice off the lane band where shots are read (crests low, aurora
high), take the off-white as far as `scripts/weigh-sky.mjs` allows, and say in the decision what it
cost. The other two options (darker foe inks, moving the floor) are held back unless the play-test asks.
`drawShelf` is two flat terraces; the blowing shards in `STRUCTURE_OF.rime` are flat strokes.

### 6 — The Toxic Mire

`drawEnclosure` draws canopy and pools; the canopy edge is at tile 0.4 = **lane 30**. Its comment says
it is banded *because `Pen` has no linear gradient*, which is no longer true. `tests/places.test.ts` —
*The Toxic Mire's corridor is tight* — is 0221's ask and this ask reverses it: change the guard and say
why. Bubbles are mechanism 2's second use with **its own** sprite and motion (rise, wobble, pop).
Headroom 1.48×, but glowing pools are lit area low in the lane, exactly where shots are read.
⚠️ **0347 hung mechanism 2 on a landmark's vent** (`paintEruption`, called from `paintLandmarks`), and
the Mire's pools are ground, not landmarks — so its bubbles need the pure-function-of-steps loop
lifted off the landmark rather than a pool faked as one. The ground scrolls at 0.45, so a bubble's
position rides that layer's offset.

### 7 — The Black Heart

Give it a `stars` row (dense, cold, its own tints) — the machinery is 0343's. The veins are crossing
marks: sines, branching by spawning a second sine off a parent at a seeded `t`. The pulse is mechanism
2's third use, beads following the vein function, timed to `beatAt` (the heart's two-thumps-and-a-rest
in `src/render/scene.ts`). 0211 made this place nearly empty on purpose; the player has asked for the
opposite and the newer report wins.

## The three questions, answered by the player on 2026-09-21

1. **Stars in front of landmarks — keep it.** *"The stars in front of the pillars is fine, it gives a
   sense of depth which is lovely."* The draw order stays
   ([0346](../docs/decisions/0346-the-pillars-fill-the-sky.md)), and the candidate planet for The
   Approach is no longer blocked by it.
2. **Rime Shelf — off-white, balanced, and then played.** *"Let's go with an off-white balanced colour
   for rime shelf, I'll see how it plays out."* So: no pure white, the brightest ice an off-white the
   floor can carry, measure with `scripts/weigh-sky.mjs`, ship it and let the play-test say. Do not
   darken the foe inks or move the floor pre-emptively.
3. **4b — walls are real.** *"A wall will kill the ship and block shots, waves need to spawn in the
   corridors and also explode if they hit a wall — this is the biggest change and can definitely be
   its own piece of work, but I want the labyrinth to definitely feel more like the labyrinth."* That
   is four sim rules — a wall kills the ship, stops a shot, kills an enemy that touches it, and bounds
   where a wave may be placed — and it is its own piece of work with its own plan: on bullets and
   enemies this project presents a plan before building. Item 4 (the straight, walled corridor with
   gaps for flanks) still lands first and is authored as a centreline and a gap so 4b moves it.
   ⚠️ **A wall that kills changes 4 too**: 4's walls stand where the ship's clamp already is, so they
   cannot be touched. The moment the corridor narrows or turns, the clamp and the wall part company —
   decide in 4b's plan whether the clamp goes in this level.

**Also played, of 0345:** *"pillars and ember look good"* — and the Pillars were made larger and more
vibrant in 0346. A landmark entry can state a `scale` now; the volcano and the heart may want one.
