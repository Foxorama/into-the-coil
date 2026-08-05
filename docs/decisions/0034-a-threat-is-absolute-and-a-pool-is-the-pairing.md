# 0034 — A threat is absolute, and a pool is the pairing

**Accepted 2026-08-05.** Lands bullets, contact and death — the build
[`reports/drag-feel-2026-08-05.md`](../../reports/drag-feel-2026-08-05.md) names as the trigger that
re-opens `SHIP_SPEED`, the scroll rate and `DRAG_GAIN`: *"the first build with bullets and
collisions. Not a date. Until an entity can kill the player, every one of these is a preference;
after it, each is a difficulty measurement."*

It decides nothing about what those constants should be. It decides the shape they will be tuned in,
and it corrects one thing the report got wrong.

## The rules

| | |
|---|---|
| a threat constant | **absolute world units per step, never a multiple of `SHIP_SPEED`** |
| a speed | **in the CAMERA's frame** — the frame `flyShip` already flies the ship in |
| who can hit whom | **an argument, not a field.** Separate pools; the caller names the two sides |
| what an entity knows | **its own numbers**, copied from a row at spawn. `sim/` cannot read `content/` |
| collision | **swept over the step**, so no shot speed has a ceiling |
| `SCROLL_PER_STEP` | lives in `src/sim/flight.ts` beside `SHIP_SPEED`, and the two are **one knob with two halves** |

## The correction to the report's ordering

The report lists three deferrals waiting on this trigger — the scroll rate, `DRAG_GAIN`, and ship
inertia — and then gives an ordering for **two** of them. The scroll rate is not in it.

It cannot be left out. The scroll rate is the player's *time* budget and `SHIP_SPEED` is their
*distance* budget, and the dodge margin is a function of both: at the values as written, a 16:9 view
is about 4.9 seconds of lookahead and the ship crosses the 100-unit lane in about one. Settling
`SHIP_SPEED` against a scroll rate that then moves is the predecessor's eight-pass bounce arrived at
from a third direction — and the scroll rate has *already* had a play-test verdict against it
(*"slightly too fast"*, 2026-08-04).

**So step 1 is both, tuned together.** Steps 2 and 3 — ship inertia, then `DRAG_GAIN` — are
unchanged. Moving `SCROLL_PER_STEP` out of `src/app/mount.ts` is what makes that possible to do in
one place: a difficulty quantity in the shell is one the model cannot be tuned against and a level
cannot be authored against.

## A threat is absolute, and the guard is a dependency rather than an arithmetic

The report says bullet speed, enemy approach and the dodge window are *"all relative to how fast the
player can get out of the way."* That is a statement about the **order** they get tuned in. It reads
exactly like an instruction to write them as **ratios**, and that reading would have quietly voided
step 1: with `bulletSpeed = k × SHIP_SPEED`, the dodge margin is invariant under the knob, and
`SHIP_SPEED` stops being the distance budget and becomes a global tempo control.

An arithmetic ratio cannot be detected by a test. **A dependency can, and it is the same thing** — a
table that tracks the ship's speed has to name the ship's speed. So no file under `src/content/` may
mention `SHIP_SPEED` or `SCROLL_PER_STEP`, and `tests/combat.test.ts` scans for it with comments
stripped, because the rule is explained by name in the file it applies to.

⚠️ This is a guard for a trap rather than for a bug that happened. It is cheap, it is exact, and the
trap is one sentence away in a document this project will read again the moment tuning starts.

## Several pools, and the cost that no guard here could have seen

The obvious shape is one pool, a `team` field, and a double loop that skips same-side pairs. At
0022's worst case of 500 entities that is ~125,000 pair tests every step — 7.5 million a second, on a
2021 mid-range Android.

**Nothing in this repository could see it.** [0025](0025-the-frame-budget-is-counted-not-timed.md)
counts draw calls and allocations, and both stay *exactly correct* while the step does a hundred
times the work it needs. That is [0027](0027-measure-the-picture-not-the-model.md)'s failure with the
sign reversed: a green guard over a quantity nobody is measuring.

The fix is structural rather than a broad phase. Separate pools mean the caller writes out which two
sides can meet, and the count collapses to the products that matter — ~80 shots × ~40 enemies, ~150
shots × one ship. The pairing is then *readable*, which a `team` field never is.

**Costs, named.** `paintScene` grows past one pool, so draw order becomes an explicit decision (the
ship is drawn last, because a player must be able to find their own ship among 150 bullets); the
budget guard's draw-call half had to learn that four layers still cost one clear; and the ship lives
in a pool of capacity one, so death is a release and a respawn rather than a special case.

## An entity carries its own numbers

[0015](0015-the-layer-ladder.md) gives `sim/` exactly one import, `brand`. So neither `collide.ts`
nor `entity.ts` can read the enemy and shot tables — which is right, and it is worth saying why
rather than working around it: the model moves bodies and resolves contacts, and what an enemy
*decides* belongs to content.

The numbers a collision needs therefore travel **on** the entity, copied from a row at spawn by
`src/app/frame.ts`, which is `app/` and may import everything. `Body` is declared in `sim/` and
implemented by the rows in `content/`, so the model states the contract and the content satisfies it.

One thing had to move for that to work at all: `SpriteKind`, `SPRITE` and `SPRITE_EXTENT` were in
`src/render/bake.ts`, and a content row cannot name a sprite that lives in `render/`. They are now
`src/content/sprites.ts`. The drawing stayed behind, which is the right split on its own terms —
*which* sprite an enemy uses is content; *what that sprite looks like* is art.

⚠️ **The tempting fix, when this bites, is to widen the layer arrow.** That is the move 0015 exists to
refuse, and it is the move that fused the predecessor's simulation layer to golf.

## The collision sweeps, and it is a ceiling removed rather than a bug fixed

Testing the two current positions is a line shorter and wrong at speed: a shot that travels further
in one step than the two radii sum to steps clean over its target between frames.

That is not merely a bug — it is a **ceiling on every speed in the game**, and the ceiling includes
`SHIP_SPEED`, because a player flying into a bullet closes at the sum of the two. At the numbers as
written, `spit + SHIP_SPEED` was already within 7% of failing. A guard on that ceiling would have
been an unvalidated threshold standing directly in front of the one constant the next pass exists to
raise, which is the exact shape 0027 refuses: *"a guard built on an unvalidated threshold defends the
bug."*

So the step is swept — closest approach between two straight paths, clamped to the step, using the
`prev` positions the renderer already carries. At `t = 1` it is exactly the old test. **Sweeping
deletes the ceiling instead of policing it**, and the tuning pass inherits no constraint from the
collision code at all.

## The frame everything is measured in, which cost this change its one real bug

An enemy aimed at the ship in world coordinates leaves for where the ship is and arrives where the
ship **was**. The ship holds station in the camera's frame, so it drifts a full `scrollPerStep`
up-lane for every step the shot is in the air — 48 units of lead nobody applied over an eighty-step
flight.

Straight down the lane it still connected, which is why it hid. Off the lane it missed by a margin
that grew with range, so **every enemy in the game was harmless in proportion to how far away it
was** — on a build whose entire purpose is that something can kill the player.

⚠️ **Nothing was wrong with the aim, the collision, or the picture. Each was correct in a different
frame.** No assertion in this repository had a chance of catching it, and none did. It was found by
tracing eight seconds of the built page with `npm run trace` and noticing the player never died —
[0027](0027-measure-the-picture-not-the-model.md)'s instrument, on its third catch, in a third layer.

The fix is that a shot's `speed` is relative to the camera, which is the frame `flyShip` already
works in: it takes `scrollPerStep` as the ship's baseline and treats the player's ask as a departure
from it. Now a table's `speed` means what the player sees, and the two halves of the game measure
motion the same way. It leads the drift **everyone** shares and nothing else — the player's own dodge
is not predicted, because the dodge is the skill.

## The same assumption, in two places, both of which would have lied

`scripts/trace-frame.mjs` said in its own comment:

> The SHIP is the first blit of each frame, because it lives in pool slot 0 … if the ship ever stops
> being drawn first, this script reports the wrong entity and says nothing.

It stopped being true in this change. `tests/interpolation.test.ts` had the identical assumption as
`blits[0]`, and only its *other* half — the `World` shape — failed to compile; the ship-finding would
have gone on passing while measuring an enemy.

Both now identify the ship the same way, and both **check** rather than assume. The test finds it by
sprite and asserts there is exactly one. The tracer, which cannot import anything, finds the smallest
set of atlas bitmaps that contributes exactly one blit to *every* frame — a real property of the game
rather than of the draw order, since there is one ship and it is never absent, and a set rather than
a single bitmap because the ship swaps sprites while it is flashing. If no such set exists, or more
than one does, it exits non-zero.

⚠️ **This is [0019](0019-a-probe-must-be-seen-to-apply.md)'s hole again**: nineteen probes stood over
that tracer and every one went red on demand, because a probe proves a guard fires on the bug it
describes and cannot notice that the guard is pointed at the wrong object.

The tracer learned a second thing in the same change. The ship can now die, and a restart moves it
across the lane in one frame — 316.8px against a real top speed of 12.3px per frame. Folded into the
totals it inflated `px/s` by half and became the reported `peak`. Jumps are now excluded from the
averages and **counted and printed**, because a run with a jump in it is a run where the player died.

## Collision is the first thing that ever read the assists

`src/sim/assist.ts` has had `hurtbox`, `playerDamage` and `terrainDamage` since
[0024](0024-the-accessibility-floor-is-settings.md), and nothing consumed them.
`tests/assist.test.ts` proves the lookup **table** is monotone over all 144 states, which until now
was a proof about arithmetic and not about the game.

It is a claim about code from here on, and it nearly landed false. The obvious `collideIntoOne`
damages on the first overlap it finds and stops — and shrinking a hurtbox *removes* overlaps, so the
first one found can become a heavier threat than the one a larger hurtbox met. Turning an assist on
would have dealt more damage. Taking the **worst of the overlap set** makes the result a function of
a set that only ever shrinks, so monotonicity holds by construction rather than by every shot kind
happening to carry the same damage today.

⚠️ The test for this was *also* wrong first: it placed both threats deep inside both circles, where
first-found and worst-of-set score identically. It proved nothing and it was green. The placement is
now the whole point of the fixture and says so.

`pace` and `terrainDamage` are still unconsumed — `pace` is a loop-level concern and there is no
terrain. Stated rather than left to be discovered.

## What this deliberately does not decide

**`src/state/`, and therefore a game-over screen.** Death restarts the scene in place: the pools
clear and the ship returns to the start of its box. A run, a score and a game-over screen need the
state layer, whose creation is its own decision under 0015, and landing it here would put three
decisions in one PR.

**Ship inertia and `DRAG_GAIN`.** Steps 2 and 3, unchanged, and both wait on step 1 —
[0032](0032-touch-is-relative-drag-and-not-a-stick.md) already says building inertia before
`SHIP_SPEED` is settled means shipping an untuned mass constant over a touch feel that was just
called *"really good"*.

**Waves, levels and the roster.** `src/content/ships.ts` has one row and it is deliberately not a
character: `docs/game.md` owns the roster, and authoring one of its four golfers in a PR about
whether the ship can be killed would be inventing product to satisfy a shape.

**Any tuning value.** Nothing in the suite asserts one, which is what keeps the next pass cheap.

## Rejected: a bound on shot speed instead of a swept collision

One line in a test rather than fifteen in the model, and it is what the first draft of
`src/content/shots.ts` documented. Rejected on the arithmetic above: the bound lands on
`SHIP_SPEED`, which is the constant the pass this decision exists to enable is going to raise.

## Rejected: one pool with a `team` field

Above. Worth keeping for the reason rather than the conclusion: it was rejected on a cost **that no
guard in this repository can measure**, which is the same discovery 0027 made about the picture,
arriving from the direction of the model.

## Rejected: the painter deciding what to draw while the ship is flashing

A branch in `paintScene` on an `invulnFor` field. Rejected because
[0015](0015-the-layer-ladder.md) gives the painter one job — *"it draws what it is handed"* — and
skipping a blit is choosing what exists. The hit flash is a second baked sprite of the same
silhouette in a different ink, selected by the sim. `src/render/bake.ts` gained one row and one
`case`, and the painter did not change at all.

---

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0034-combat.mjs`. Fourteen breaks; the suite went 347 → 369 assertions.

| broken on purpose | went red |
|---|---|
| the collision walking targets FORWARDS, so a release swaps an untested one into a slot already passed | `every target is tested, not merely the last one released` |
| contact damaging on the FIRST overlap found rather than the worst, so shrinking a hurtbox can hurt more | `turning any knob up never increases the damage taken` |
| a content table expressing a threat as a multiple of SHIP_SPEED, which the layer ladder permits | `no content table names the ship constants` |
| the leading cull removed, so a player shot outruns the camera and is never retired | `a player shot does not live forever ahead of the level` |
| the leading cull pulled INSIDE the spawn line, so every wave is retired on the step it is created | `a wave placed at the spawn line survives the step it arrives on` |
| the collision testing two current positions instead of sweeping the step — a fast shot tunnels | `THE SWEEP: a shot that crosses the whole target in one step still hits it` |
| the sweep reporting contact whenever the two paths approach at all, however wide | `a shot that passes WIDE still misses` |
| invulnerability never set, so an overlapping threat bills the player sixty times a second | `a ship parked inside a volley loses one health, not one per step` |
| a body consumed by being flown into, which makes ramming the cheapest way to clear the screen | `a body is not consumed by being flown into` |
| an enemy aiming in WORLD coordinates, so its shot arrives where the ship was rather than where it is | `a shot from off the ship` |
| the painter walking its layers backwards, which buries the ship under everything else on screen | `a later layer is blitted after an earlier one` |
| the frame wiped once per LAYER instead of once per frame — four full-canvas fills, invisible in a screenshot | `costs the same split across layers as it does in one pool` |
| an allocation planted in the collision loop, which is on the hot list for the first time in this change | `no hot file allocates` |
| the ship slowed until it cannot cross its own hurtbox before an aimed shot arrives | `the same shot misses a ship that moved` |

⚠️ **Two of those break the same line in opposite directions**, because the leading cull has two
failure modes and fixing one is how you cause the other: no cull and the pool fills with bullets that
left the screen seconds ago; a cull at the spawn line and every wave dies on the step it is born,
with the level playing as an empty field and nothing anywhere reporting an error. The same pairing
0032 needed for gesture suppression.

⚠️ **One probe breaks a tuning constant, which nothing is allowed to assert the value of.** That is
not a contradiction. The guard says the dodge is possible **at all**, in pixels and milliseconds, and
the probe proves it notices when it stops being. 0027 forbids a threshold on taste, not an assertion
that the game is playable.

⚠️ **And one probe was written against an assertion message rather than a test title, and the harness
said WRONG TEST.** It went red on exactly the right line. That is `prove-guard.mjs` catching a probe
that would have looked correct in the table above and proved something slightly different — the
failure mode 0019 was built for, in its cheapest form.

## What has no guard

**Whether any of it is any good.** Everything above is structure: that a shot arrives, that a hurtbox
shrinks, that a wave survives its own spawn, that the dodge is geometrically possible. None of it can
see a game that is boring, unreadable or unfair. That is [0027](0027-measure-the-picture-not-the-model.md)'s
territory and it needs a hand — which is the point, because the whole reason this build exists is to
turn three deferred preferences into difficulty measurements a player can take.
