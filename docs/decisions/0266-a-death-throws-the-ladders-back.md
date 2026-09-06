# 0266 — A death throws the ladders back

**Accepted 2026-09-06**, the same day as [0256](0256-a-pickup-keeps-the-count.md), which it reverses
in one rule. Reported from the play of the build that decision shipped in:

> *"Need a fix to the death and the powerup reduction — in addition to reducing the power up total it
> also stopped the power ups spawning from a death which drastically reduced the power ups in game.
> Need to change it to not reduce power up level on death and to have the powerups spawn from death
> as well, with the previous x2,3,4 etc for level of each power up."*

**Reverses [0256](0256-a-pickup-keeps-the-count.md)'s death rule**: a death costs no rung.
**Restores [0066](0066-a-death-scatters-what-it-took.md) and
[0243](0243-a-death-throws-back-one-piece-per-kind.md)**: the scatter, one piece per kind, and the
×N badge. **Restores [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s death half**: the
kinds go back to the ship's own and come back with the pieces. **0256's other four rules stand** —
a switch keeps the count, a level authors one weapon and one missile, a mid-boss's death drops a
weapon, a shield and a bomb, and the dial's level step is 4/3.

## ⚠️ Two rules landed on one quantity, and only one of them was asked for

0256 was built from *"a death reduces the power count by 1 (to a minimum of 1)"* — which is the
rung, and was asked for in as many words. It **also** deleted the scatter, on its own argument that
*"the rung IS the cost, and a mechanism that returns it is a death that costs a crossing under fire
instead."* That second half was reasoning, not an ask, and it did not travel alone: the same change
cut the authored pickups from nine a level to two.

Three reductions in one landing, and the play found the sum rather than any one of them. The rung is
the one that goes, because the scatter is the one the report names.

## The rules

**A death takes both ladders and both kinds.** `lifeLost` in `src/state/slices/run.ts` writes
`upgrades: []` and puts `weapon` and `missile` back to `SHIPS.proof`'s — 0039's *"back to the ship's
base weapon"*, which `weaponFor` resolves an empty list to, so the two of them between them are the
only description of what the ship shoots with nothing. `DEATH_KEEPS` and `afterDeath` are deleted
with the rung. `a death takes both ladders and the kinds` and `and a ladder of one goes too` in
`tests/run.test.ts`.

**Nothing it takes is lost: every rung is thrown where the ship died, one piece per kind, carrying
its count.** `scatterUpgrades` in `src/app/frame.ts`, called by the shell BEFORE the reducer,
because the reducer is what empties the list. A piece holds the face the death took and does not
cycle — *"a piece that came up showing the other gun would be offering a switch the player did not
ask for at the one moment they are trying to recover"* — and wears a ×2, ×3 or ×4 badge over its
corner (`paintStacks`, `STACK_BADGES`). Taking it is one event carrying the count, so the ladder's
clamp is asked once. `tests/stack.test.ts`, restored whole; the ordering is
`throws the upgrades out of the wreck at the end of the beat` in `tests/death.test.ts`.

**What a death costs is the crossing and the life.** Not a rung — the pieces are on the field, on a
short timer, in a lane the player has to fly back across under whatever was already shooting at
them. That was 0066's answer and 0256 called it *a death that costs a crossing under fire instead*,
as an objection; played against the alternative, it is the better cost, and the alpha list is the
evidence.

**The scatter and the mid-boss's drop share one arc and take a stream each.** `throwArc` is the ring,
the jitter, the speed and the flight, and its generator is the caller's: `scatterRng` for the death,
`dropRng` for the fight. They were one field for the day the scatter did not exist —
[0021](0021-one-stream-per-concern.md) counts concerns, and there was one. Two now, so two, and a
level whose mid-boss died deals the same scatter as one whose did not.
`a death's scatter is dealt from its own stream` in `tests/pickups.test.ts`.

## ⚠️ What was rejected

**Keeping the rung and adding the scatter back.** The literal reading of the report is two changes —
*"not reduce power up level on death"* **and** *"have the powerups spawn from death as well"* — and
a third reading is available where the ship keeps its ladders and the pieces are a bonus, which makes
dying profitable. Put to the author: the scatter IS how a level is not reduced, because everything it
takes is recoverable. A death that both kept the rungs and paid out would be the only event in the
game that rewards failing.

**Keeping `DEATH_KEEPS` as a floor under the scatter.** A ladder of one would keep its rung and the
scatter would be a piece short of what it took, with nothing in the picture to say so: a ×3 badge
reads the same whether it came off a ladder of three or of four. `and a ladder of one goes too` is
the guard, and `scripts/probes/0266-*.mjs` breaks the floor back in.

## What is owed

- **A play**, and it is the whole point: whether the field has enough on it again, and whether the
  crossing back through the fire reads as the cost of dying rather than as a second punishment.
- **Whether two pieces are still the right answer at four rungs a ladder.** 0243 cut eight pieces to
  two because *"it's too hard to grab all the different powerups with all the different sequencing
  in the middle of a hail of bullets."* That was measured before the mid-bosses, and a death during
  a mid-boss fight now throws its pieces into a fight that is still happening.
- **The authored counts are 0256's and are untouched here.** If the field still reads as thin after
  this, that is the third reduction and it is `THE BUDGET` in `tests/pickups.test.ts` that says so.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A reducer arm, a field on a pooled
entity, three sprites and a painter; nothing persisted, no storage key and no change to the save
schema — `upgrades` was always a list and is a list.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0266`:

| broken on purpose | went red |
|---|---|
| a death costing one rung and keeping the rest, which is what 0256 shipped | `a death takes both ladders and the kinds, and leaves the arsenal exactly where it was` |
| the floor put back, so a ladder of one keeps its rung and the scatter is short | `and a ladder of one goes too, because the scatter is what hands it back` |
| the scatter throwing nothing, so a death takes the ladders and hands back none of them | `throws the upgrades out of the wreck at the end of the beat` |
| the stack dropped from a thrown piece, so a full ladder comes back as one rung | `THE STACK: a death throws one piece per kind` |
| the scatter drawing on the drop's stream, so a fight's throw deals a death's | `a death's scatter is dealt from its own stream` |

⚠️ **And three of 0256's probes are deleted rather than re-aimed**, with the reason in
`scripts/probes/0256-a-pickup-keeps-the-count.mjs`: their breaks — *a death emptying the ladder*, *a
death putting the base gun back on the ship* — are what the code does now, and a probe cannot break
a thing into what it already is. 0243's four come back with `tests/stack.test.ts`, and its row in
`WITHOUT_PROBES` is deleted by the guard that refuses an exemption outliving its probes.
