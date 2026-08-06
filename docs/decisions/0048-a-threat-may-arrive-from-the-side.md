# 0048 — A threat may arrive from the side, and a shot stops at the edge

**Accepted 2026-08-06.** Three things asked for after playing the two-level build, and one of them is
a bug report: *"in playtesting I didn't even see the boss monsters on screen because they died before
they even entered the visible play area."*

## The rule

| | |
|---|---|
| **a wave's origin** | `lead` (the default) · `acrossMinus` · `acrossPlus` — a field on the wave |
| **where a flanker appears** | `FLANK_ALONG` = `MAX_ALONG_SPAN / 2` ahead of the **camera**, always |
| **what it does** | crosses at a fixed rate to the authored lane, then straightens and closes |
| **the across cull** | `±EDGE_MARGIN` outside the lane. Anything past it is returned to its pool |
| **a player's shot** | culled at **`camera + view.alongSpan`** — the screen in front of the player |
| **a pickup** | drifts across the lane, and bounces off both edges |

## The bug: a shot that outlived the view

A pulse lives `PLAYER_SHOT_LIFE` = 80 steps at 2.6 units a step, which carries it about **248 units**
ahead of the camera. A 16:9 view is **178 units** wide.

So there was a 70-unit strip beyond the leading edge in which the player was killing things they
could not see. A boss spawns at its authored place — 280 units out — and closes on its station over
about six seconds, the first four of which it spends in exactly that strip. On a heavy loadout it
could be most of the way dead before it appeared.

⚠️ **Every number involved was correct.** `PLAYER_SHOT_LIFE` was measured and is written down with
its arithmetic; the cull was correct for content; the boss's approach was deliberate.
[0027](0027-measure-the-picture-not-the-model.md) is the rule that says the answer is to go and
measure the picture, and `tests/spawns.test.ts` now asserts the reach **in world units ahead of the
camera on the view the game ships**, at both ends of the aspect clamp.

### Why the shot's cull depends on the device and nothing else does

Every other spawn and cull rule uses `MAX_ALONG_SPAN` — the widest view any device can have — because
**content is authored once** and must be off-screen everywhere ([0023](0023-the-long-axis-is-the-scroll-axis.md)).

A shot is not content. It is the player's **reach**, and *you can shoot what you can see* is the rule
a player actually holds. Tying it to the widest device would leave a 16:9 player firing 70 units into
the dark to keep a 21:9 player's range honest.

⚠️ It does mean a wider screen shoots further. That is the same trade 0023 already made and clamped:
a wider screen also *sees* further, `across` — the difficulty axis — is a fixed 100 on every device,
and the clamp bounds the whole range to 150–240.

`PLAYER_SHOT_LIFE` stays, as a pool-safety backstop rather than as the range limit. It now retires
strictly fewer shots than the cull does, which is headroom rather than a second mechanism: the pool
arithmetic in `src/content/pickups.ts` was sized against the lifetime and is now conservative.

## Entry from the side, and the cap

Asked for: *"enemies coming in from top/bottom of screen — entry point should be capped at 50% from
the right side of the screen, the player has a 'safe spawn' zone from left side."*

⚠️ **"Half the screen" is not one distance.** `alongSpan` runs 150–240 world units by aspect, so a
fraction of *the* screen is a different place on every device — and the promise being made is about
safety, so it has to hold on the worst one.

`MAX_ALONG_SPAN / 2` = **120** is the only answer that keeps it everywhere: it is dead centre on the
widest view the clamp allows and 80% of the way across on the narrowest, so nothing ever appears
behind the player on any device. `tests/spawns.test.ts` asserts it as a *fraction of the screen* at
both ends, which is the unit the request was made in.

⚠️ **Measured from the CAMERA, not from the ship.** A spawn rule that followed the ship would let a
player flying forward drag their own ambushes in front of them.

⚠️ **A flanking wave's `at` decides WHEN and not where.** It is hidden by being outside the lane
rather than by being far ahead, so the authored distance would put it wherever the horizon happens to
be — 280 units out, behind nothing.

### The turn, and why it is the union's trigger

`src/content/enemies.ts` refuses a motion union on the grounds that a straight line is a weave of
amplitude zero — one member with a parameter — and names the trigger for one arriving: *something
that turns towards the player, or stops*. A flanker straightening out into its lane is exactly that,
so `WaveOrigin` is a closed union and the weave stays a parameter.

⚠️ **The turn tests the direction of travel, not a distance.** A body crossing at 0.9 units a step
will step *over* any tolerance band, so a *close enough to the target* test holds at one speed and
misses at another — and the wave then flies straight out the far side of the lane. *Have I passed it*
cannot miss. The probe for this break is in `scripts/probes/0048-spawns.mjs`.

⚠️ **A weaving enemy may not flank**, because the weave rewrites `velAcross` from its row every step
and would overwrite the turn. Held by a test over the authored script rather than left as a comment.

## The across cull, which had to land in the same change

[`enemy-silhouettes`](../../reports/enemy-silhouettes-2026-08-05.md) named this as the one real gap
that comes with entry from the lane's edges: **there is no `across` cull**, so anything that leaves
the lane is gone from the game and still holding a pool slot, forever. A pool slot held forever is a
wave later in the level that silently does not spawn.

Nothing could leave while everything arrived at the leading edge. A flanker that misses its turn
makes it a live path, so it closes here.

⚠️ **The ship cannot reach it.** `src/sim/flight.ts` clamps it to `PLAYER_MARGIN` inside both edges,
which is far inside the cull — so the one body whose release would end a run with no explanation is
structurally unable to get there. Asserted anyway, because the cull is new and the clamp is not.

## Pickups drift

Asked for: *"power ups and buffs should also have a drifting, moving flight rather than a static
straight line."*

They wander across the lane and bounce off both edges — the same shape `src/app/boss.ts` uses for the
boss's patrol, and for the same reason: there is nothing off the lane worth drifting to, and a pickup
that parked at the edge is one the player is asked to fly into a wall for.

⚠️ **The bounce is load-bearing rather than cosmetic.** Without it a pickup wanders out of the lane
and the *new* across cull deletes it — two halves of this decision meeting each other — which turns
[0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md)'s twenty-second rearm ceiling into a
promise the level cannot keep.

⚠️ **Which way it starts alternates by index rather than being rolled.** The spawn stream is
deliberately not consulted, for the reason `spawnWave` already gives: a level is authored, and a
pickup that drifted a different way every run could not be placed by a hand.

⚠️ **It cost a test fixture, correctly.** Three tests in `tests/pickups.test.ts` held the ship still
and waited to be flown into. A drifting pickup does not cross the centreline, so those fixtures now
steer — which is what a player does, and what those tests were always about.

## Confirmed, not assumed

`npm run prove 0048` — every guard broken on purpose and seen to fail.

| broken | what went red |
|---|---|
| the player's shots culled with the content again, so they kill things nobody can see | `and the boss is never hit before it can be seen` |
| shot range tied to the widest device rather than to the screen in front of the player | `never outlives the view it was fired into, on any device` |
| the across cull removed, so anything leaving the lane holds a pool slot forever | `retires a body that drifts off either across edge` |
| the entry cap set from a narrower view, so a flanker arrives level with the player | `appears no further back than halfway across the widest view there is` |
| the turn tested against a tolerance band rather than against the direction of travel | `turns down-lane and stops exactly where the wave was authored` |
| a drifting pickup that never turns at the lane edge, so it wanders out and is culled | `but stays inside the lane, so it is never unreachable` |

## What this does not do

- **No new enemy kinds, and no denser script.** *"More waves"* was asked for in the same breath and is
  a tuning pass against a play-test, not a shape change — and it is the pass
  [0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)'s middle tier is waiting on.
  Thirteen existing charger waves now arrive from the side; nothing was added.
- **No enemy that leaves the lane on purpose.** The cull makes it possible; nothing authored does it.
- **No flanking pickups or flanking bosses.** Both are one field away and neither was asked for.
