# 0333 — A wall arrives whole

**Accepted 2026-09-18.** **Amends [0332](0332-the-gyre-is-set-into-the-wall.md)** — the quickening
ladder gets a floor in steps. **Serves [0151](0151-the-gap-you-have-to-reach.md)** — *one hole, wide
enough, in the same place every time* is what this is for, and it had stopped being true.

## What was found

Asked, after 0332 shipped: *"how's the hit register on the boss? does the boss still show or is the
hit register too opaque with lots of bullets?"* Measuring *lots of bullets* is what found this.

**`throwCurtain` drops the shots a full pool cannot hold** — deliberately, on `src/sim/pool.ts`'s own
terms, and its comment says *the pool is fifteen times a curtain, so this is the rule rather than a
case*. That was never true: `enemyShots` holds **150** and the gyre's longest wall is **45**. And
after 0332 the gyre throws seventeen walls with the last pairs four percent of a health bar apart,
which a fast gun crosses in under a second.

Driven through the real frame, every gun at every tier (`scripts/weigh-walls.mjs`):

| | walls | arrived broken | wall shots that never reached the field |
|---|---|---|---|
| gyre, shuriken t4 | 17 in 10 s | **13** | **53%** |
| gyre, shuriken t1 | 18 in 14 s | 11 | 33% |
| gyre, pulse t4 | 18 in 30 s | 7 | 13% |
| gyre, pulse t1 | 18 in 118 s | 0 | 1% |

⚠️ **AND IT IS THE GYRE'S ALONE.** The chorus and the axis lose nothing at any gun or tier — their
walls are nine and five apart in health and there was never more than one in the air. **The
quickening is what did this**, and the same matrix run with 0332's ladder removed gives 16% at the
worst corner instead of 53%.

⚠️ **A WALL MISSING HALF ITS SHOTS IS THE THING 0151 EXISTS TO REFUSE.** *"A static hole in the wall
is a pattern the player needs to learn"* — a curtain the pool truncated has three or four openings
nobody authored, in places that change with whatever else is on the field. It is the fan 0151
rejected, arrived at by accident, and **every guard in the repository was green for it**: they all
drive one throw into an empty pool.

## The rule

**A row may state the fewest steps that stand between two of its curtains, and a wall the health has
earned is OWED rather than lost.** `Uncoil.apart`; `bossUncoilAt` counts walls THROWN and rises by
exactly one each time, with the notch the health has reached as its ceiling. Nothing is skipped and
nothing is re-ordered.

**0151's count stays keyed to health and the bared window still eats notches.** This never causes a
wall — a boss whose health is not falling throws nothing however long it waits — so it is a floor and
not the `fireEvery` 0151 refused. A boss standing open still owes nothing when it closes, or the
queue would empty itself into the player on the step the hull shut.

**The order is what protects 0332's tell.** The gyre's spike is aimed at the next wall's own edge, so
a skipped wall would be a cog that jumps three points and a spike that lies. Delay does not have that
problem and skipping does; that is why this is a queue.

## The figures

| row | apart | why |
|---|---|---|
| chorus | **0** | measured: four walls, all whole, under every gun. A two-second floor costs it three of them and buys nothing. |
| axis | **0** | the same, at two walls. |
| gyre | **150** (2.5 s) | the only value in {90, 120, 150, 180} with **zero walls short in all ten gun-by-tier cells**. 120 leaves one, 90 leaves three. |

⚠️ **WHAT A FAST GUN SEES NOW IS FEWER WALLS AND ALL OF THEM WHOLE.** Shuriken t4 goes from
seventeen walls of which thirteen were broken to three that are not. A ten-second fight cannot
contain seventeen walls, and [0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md) already says
a heavier loadout shortens a fight.

## ⚠️ What was rejected

**A bigger pool.** `CAPACITY.enemyShots` 150 → 220 would also have fixed it, and it is the wrong fix
twice: it spends [0022](0022-frame-rate-is-a-feature.md)'s worst case on a symptom, and it leaves
three walls in the air at once — which is a screen nobody can read even when every shot arrives.
Measured first, so the refusal is against a number: with the floor in place nothing is dropped, so
the pool was never the thing that was too small.

**A `fireEvery` for the walls.** 0151's own refusal, unchanged: it bills a base-weapon player three
times what it bills one at the design loadout.

**Skipping the walls a fast gun outruns.** One line shorter and it breaks the tell — see above.

## ⚠️ And the measurement had this same defect first

**`scripts/weigh-walls.mjs`'s first form counted a notch that MOVED as a wall that was THROWN**, and
reported the axis and the chorus losing 60% of their shots. They lose none: 0150's bared window eats
notches without throwing anything, and every eaten notch was being scored as a wall that arrived with
nothing in it. **Two bosses were nearly given a floor they did not need, on a number that was an
artefact of the instrument.** A throw is a count that moved *and* a pool that grew, and the guard
says so in as many words.

## What is owed

- **An eye on the new cadence.** Two and a half seconds is a floor read off a pool, not off a fight.
  Whether a wall every 2.5 s at the end of a gyre fight is the escalation 0332 asked for is a play
  question — [0027](0027-measure-the-picture-not-the-model.md).

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One field on a content type, one
counter on the world; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0333`:

| broken on purpose | went red |
|---|---|
| the gyre's floor authored away, so a fast gun stacks walls and the pool drops what will not fit | `EVERY WALL ARRIVES WHOLE` |
| the floor never read by the frame | `EVERY WALL ARRIVES WHOLE` |
| the owed walls skipped rather than queued, so the hull's spike names a wall that never comes | `a wall the health has earned is owed rather than lost` |
| the gap never counted down, so a fight throws one wall and then none | `a wall the health has earned is owed rather than lost` |

⚠️ **AND THE FIRST TWO OF THOSE STAYED GREEN ON THE GUARD'S FIRST FORM.** It took *the pool grew by
more than a fan can put in it* as the test for a throw — which skipped every wall that arrived with
fewer than ten shots in it, **which is exactly the walls the defect produces**. The boss's fan is
held now, so a throw is any growth at all. A guard that cannot see the worst case is
`docs/decisions/0005-a-guard-must-be-seen-to-fail.md`'s whole subject, and nothing but a probe finds
one.
