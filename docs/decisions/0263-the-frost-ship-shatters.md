# 0263 — The frost ship shatters

**Accepted 2026-09-06**, the same day as [0262](0262-the-eagle-throws-quills.md), from
[`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"Rime shelf → the frost attacks should explode into directional frost bullets, which explode
> into snowflake patterns. The adds weren't great."*

**Amends [0253](0253-the-frost-ship-chills.md)**: the blasts are what every shard becomes, and the
ring at the last fifth is gone. **Extends [0016](0016-a-hub-enumerates-kinds.md)**: a shot row says
what the shot becomes, and an enemy row says what its death throws. **Rides [0262](0262-the-eagle-throws-quills.md)'s
flank**: the adds come in from the sides.

## The rules

**A shot has a life after the muzzle, and the row says it.** `ShotRow.fission` is a list of stages,
required on every row and empty on every row but the frost's. A stage is a fuse in steps and what
the shot turns into when it burns down: a `fan` of the same shot about its own heading, a `ring` of
it, or `nothing` — a melt. The children are the same kind one stage on; the entity carries the
stage on `turnsLeft` and the fuse on `fireIn`, two fields every shot has and nothing else reads on
one. `fissionShots` in `src/app/frame.ts` runs after the shots have moved and before anything can
hit them, so a shard opens where it is drawn; the parent is released before its children are thrown,
so a burst costs the pool the children less one. The fuse is lit on the step the shot came to be —
by the pass for a shot from a muzzle, by `throwChild` for a child — so every stage is exactly its
`after` long whichever way the shot arrived.

**The frost is a shard, then two bolts, then two snowflakes, then nothing.** Three quarters of a
second out, a shard opens into two along its own heading, 0.6 of a radian apart; two thirds of a
second on, each opens into six evenly round, the first on the heading; a second and a half after
that, a flake melts. One shard is twelve flakes. **About the shot's own heading, never the ship's**:
a fan re-aimed at the ship on every burst is the aimed attack [0110](0110-an-attack-is-a-pattern.md)
removed, three times over; a fan about the heading is a pattern the player can read off the parent
before it opens. `THE FISSION, DRIVEN` in `tests/frost.test.ts` drives one wall through all three
stages, counts what is alive after each fuse, and holds in the player's units that the split is on
the screen and the snowflake opens in the near half of it.

**The volleys are counted in shards.** A wall of one either side of the hull while whole, a spray
of two once hurt, the adds at the lower half, and the widest spray of the fight — three — at the
last fifth. The ring of six 0253 threw there is gone: six shards that each open into twelve is a
screen nobody can read, and `the frost never fills the pool` drives the last phase at the capped
fan and holds what is alive at once under the pool less a volley, because `src/sim/pool.ts` drops
a volley that will not fit and the next thing it would drop is the adds' shatter.

**Every fission is drawn.** A burst of four at a split, of two at a melt — `BURST.fission` and
`BURST.melt` in `src/content/debris.ts`. A bullet that becomes two, or that vanishes, is exactly the
event [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) records being reported
as a bug three times.

**The adds come from the sides, and shatter.** The shards are called on 0262's flank —
`from: 'sides'`, one edge and then the other — and `EnemyRow.shatter`, required on every row and
`null` on every row but the shard's, throws a ring of six frost where a shard dies, at the shot's
last stage, so a shattered add is a snowflake that melts and never a shard that opens again. The
death log carries the body's `kind` for it; the boss keeps a log of its own, because its kind
indexes a different table and one log could not say which. `THE SHATTER, DRIVEN` kills one with a
pulse and counts.

## The figures

| what | value |
|---|---|
| the fan | after 45 steps; two, 0.6 rad apart about the heading |
| the snowflake | after 40 steps; six evenly round, the first on the heading |
| the melt | after 90 steps |
| one shard | 2 bolts, 12 flakes; alive for 175 steps at most |
| the phases | a wall of one a side; a spray of two; two shards from the sides; a spray of three |
| the shatter | six frost at the last stage, where the shard died |
| the pool | 150; the last phase driven for twelve seconds at the capped fan peaks at 75 alive, and the guard holds it under 126 — at twelve shards a volley it is 150, the pool |

## ⚠️ What was rejected

**A bolt and a flake as rows of their own.** Two more rungs on the hostile ladder, which
`tests/legibility.test.ts` holds at more than five pixels a rung and 0262 spent the last easy room
on. What tells a bolt from the shard it came from is that it is one of two flying apart, and a
flake is one of six.

**The children aimed at the ship.** 0110.

**The ring kept at the last fifth.** Seventy-two flakes a volley.

**The shatter on the death log's position alone.** The log did not say which row died, and a
shatter keyed on the sprite would be the frame switching on a picture.

## ⚠️ The boss's own death log silenced an enemy's kill cue

Giving the boss `bossDeaths` moved it out of `w.deaths`, and one line was still guarding against it
being there. [0072](0072-a-cue-is-baked-and-played.md) wrote
`if (w.deaths.count > 0 && !bossJustDied(w))` because the boss died into the same log, so the
ordinary kill cue fired for it and pushed its own `bossDown` past the voice cap — *the loudest event
in the game, announced twice and therefore at risk of not at all.*

With the logs split, that clause protects nothing — and it **silences a real enemy's kill cue on any
step an enemy dies alongside the boss**, which is the busiest step of the fight. The clause is gone;
the split is what holds 0072's invariant now.

⚠️ **`npm run prove` is the only thing that could have found it.** 0072's probe struck the clause out
and the suite stayed GREEN, because the double-cue it makes is not reachable through that line any
more. Its break is the split itself now — log the boss's death where every other death goes, and the
kill cue finds it there. **A guard that moves takes its probes with it**, which is the fourth time
this stack has said so.

## What is owed

- **An eye on the cascade at the shipped camera** — whether two bolts read as a split or as a
  bullet that jumped, and whether six flakes at forty-seven pixels read as a snowflake or a wall.
- **The fuses.** Model quantities until a hand flies them; the second one is what puts the
  snowflake in the player's half of the lane, and the ship is not always there.
- **The hydra's fourth head** throws frost, so its volleys open too. Nothing here decided that
  either way; a play of the hydra says whether it is a gift.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Two row fields, a pass in the
frame, a second death log; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0263`:

| broken on purpose | went red |
|---|---|
| the fission pass never run, so a shard is one bullet after all | `THE FISSION, DRIVEN` |
| the fan aimed at the ship rather than about the shard's own heading | `THE FISSION, DRIVEN` |
| a child's fuse not lit where it is thrown, so the snowflake opens a step late | `THE FISSION, DRIVEN` |
| the melt not drawn, so a flake simply vanishes | `THE FISSION, DRIVEN` |
| the frost given no stages, so nothing in the game has a life after the muzzle | `THE FISSION, DRIVEN` |
| the shard's shatter taken off its row, so no body in the game shatters | `THE SHATTER, DRIVEN` |
| the shatter thrown at the shot's first stage, so a dead add is seventy-two flakes | `THE SHATTER, DRIVEN` |
| the shards called at the leading edge again, in a vee down the lane | `THE ADDS AND THE BLASTS` |
| the last fifth throwing twelve shards a volley, which is a hundred and forty-four flakes | `the frost never fills the pool` |
