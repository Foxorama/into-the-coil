# 0042 — A run is a sequence of levels, and the order is the list

**Accepted 2026-08-05.** Makes [0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md)'s *"a
second level is a table edit"* true by doing it, and answers the question that only appears once
there are two: what happens between them.

## The rule

| | |
|---|---|
| **the order** | `LEVEL_KINDS` — the list *is* the sequence; there is no second ordering table |
| **between levels** | the `cleared` screen, one control, straight on to the next |
| **after the last** | `victory` — a separate screen, because a run ending is not a level ending |
| **what crosses** | lives, upgrades and the arsenal. Everything the run is carrying |
| **what resets** | the camera, the wave index, the pickups, the boss, the ship |

Two levels exist: `approach` and `descent`. `descent` brings one new enemy, the `warden`, and a
second boss, the `harrow`.

## Why the order is the list

A `Record` keyed by level plus a hand-kept sequence beside it is two descriptions of one fact.
`src/content/sprites.ts` records what that cost here before: a hand-written union, a hand-written
order and a hand-written index table, where adding one kind to the middle of one and the end of
another made **every entity in the game draw as something else**, and nothing type-checked it.

So `LEVEL_KINDS` is the source, `LevelKind` is derived from it, and the run's level index reads
straight off it.

## Why the end-of-run rule is in the reducer and not in the shell

The first version asked `state.run.level < LEVEL_KINDS.length` inside `src/app/mount.ts` and
dispatched one screen or the other. Correct, and reachable only by mounting a canvas.

⚠️ **A level ending and a run ending are one comparison apart, and inverting it looks right in
review.** It now sits in `src/state/root.ts` as a second cross-slice agreement, beside the one that
turns a spent last life into a game over — so the shell dispatches `cleared` unconditionally and the
reducer decides whether that is the truth. [0015](0015-the-layer-ladder.md) gives `state` no
capabilities precisely so rules like this can be played out in a unit test.

## Why `victory` is a screen rather than `cleared` with different words

They are different events: one carries a run forward, the other ends it. Sharing a screen would mean
the *heading* carried the difference, and `src/state/screens.ts` has a `steps` field and a router row
that would then have to be conditional on something other than which screen it is.

⚠️ **The wording says only what is true.** `docs/game.md` puts eight levels and a final boss at the
end of a run; two exist. *"Coil cleared"* is the end of what has been authored, and it does not
pretend to be the end of the game.

## Why the warden is the right kind of new enemy

It weaves **and** fires. Every other enemy does exactly one thing: hold, close, weave, or shoot — so
this is the first that makes the player solve two problems with one answer, and **it needed no new
code at all.** Both behaviours already existed; it is a row.

That is [0016](0016-a-hub-enumerates-kinds.md)'s whole promise about behaviour riding the row, and it
is the test a new enemy should have to pass before it earns a sixth behaviour in the frame.

⚠️ Four health makes it the toughest thing that is not a boss, and therefore the biggest — size
carries toughness, and `tests/combat.test.ts` holds that ordering. It fires slower than a turret to
pay for the rest.

## Why the second boss is a different fight and not a bigger one

`docs/game.md`: **every boss is unique — its own attacks, its own effects, its own escalation.** The
harrow has more health, and that is the least interesting thing about it. What makes it a different
fight is that it **stands closer**, **moves faster than the player can comfortably track**, and
**opens with a spread rather than earning one**. The sentinel teaches a player to find a lane and
hold it; this one exists to take that lane away.

## This is not the chart

`docs/game.md` puts a **branching map of destinations** between levels, and this is a straight line
with a button on it.

That ordering is deliberate rather than a shortcut. A chart is a screen, a graph, a seeded draw and a
set of rules about what may follow what — and every one of those is a decision that wants to be made
against levels that exist and have been played, not against two that have not. What the line buys now
is the thing the chart also needs and cannot be tested without: **a run that survives a level
boundary**, carrying its lives and its loadout.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md).
`npm run prove 0042`:

| broken on purpose | went red |
|---|---|
| a level boundary that empties the arsenal, which is the death rule wearing the wrong name | `carries everything forward across a level boundary` |
| the last level cleared and the run carrying on into a level that is not there | `a level cleared past the last one IS the end of the run` |
| the run-finished agreement fired one level early | `a level cleared with more still to come is not the end of the run` |
| the second boss made an easier fight than the first at the same health | `every phase is reachable, and they only get harder` |
| the warden drawn no bigger than the enemy it outlives | `the enemy that takes more killing is drawn bigger` |
