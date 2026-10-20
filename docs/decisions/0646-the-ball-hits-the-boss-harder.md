# 0646 — The ball hits the boss harder

**Accepted 2026-10-20.** Amends [0617](0617-the-dance-burns.md)'s 1.9, on the end bosses only.

## The ask

From a play of the Hamster Ball:

> *"needs more boss damage, don't change miniboss damage. I think it needs 40-75% more boss damage as you
> constantly have to back off the boss, more heat isn't the answer, more damage I think is needed."*

## What was wrong

Every number the ram's boss damage was set to ([0593](0593-the-hamster-ball-rolls.md),
[0609](0609-the-ball-takes-its-knocks.md), [0617](0617-the-dance-burns.md)) was solved on
`scripts/weigh-boss.mjs`'s held flight: the ball against the hull for the whole fight. No ball can fly that.
Each landing on a boss adds 0.11 heat and the ball lands about five times a second, so the gauge is full in
under two seconds. Cooling waits half a second, then drains for about another two. A player who never wants
to burn a shield is in contact about two fifths of the time, and the play says so: *"you constantly have to
back off the boss."*

## The rule

**The ram is worth 3.04 on an end boss, six tenths more than 1.9. Every mid-boss keeps 1.9 on its own row.**

- `bossWeight` on the ram's row is 3.04. The serpent's own entry goes from 1.5 to 2.4 and the jellyfish's
  from 2.4 to 3.84, the same share. The middle of the asked 40–75%.
- **The seven mid-bosses each author `ram: 1.9`**, so the row's new number never reaches them: *"don't
  change miniboss damage."* Their fights are exactly as they were.
- **0260's floor no longer flies the ram** (`tests/boss-floor.ts`, the serpent's floor too). The floor holds
  a gun where it fights from for the whole fight, which for the ram is pinned to the hull. Held there at 3.04
  the end bosses take 20–32 s (from 32–52 s), under the forty-second floor. But no player holds there, and
  the floor was the reason every earlier number was too low.

## Measured

`weigh-boss`, the ram from against the hull, on the boss's lane, Savior:

| | serpent | fish | pterodactyl | gyre | frost ship | hydra | jellyfish |
|---|---|---|---|---|---|---|---|
| at 1.9 (and 1.5, 2.4) | 32 s | 42 s | 41 s | 42 s | 50 s | 52 s | 44 s |
| at 3.04 (and 2.4, 3.84) | 20 s | 27 s | 25 s | 26 s | 31 s | 32 s | 25 s |

A player who backs off to cool takes longer, by however long they wait.

**A model of backing off was built and refused.** It flew the ball until the gauge was nearly full, then
backed off thirty units until it cooled. Where it waited decided everything. On the fish, the kites and
minnows heated it while it waited, so it was in contact a sixth of the time and never finished. On the
jellyfish it rammed her tentacles from where it waited and never cooled. Where to wait is the player's
choice, and a number that depends on it is a play's to set, not this instrument's.

## What guards it

The mid-bosses' fights are unchanged, and `tests/level.test.ts`'s mid-boss window guards hold them.
`tests/medusa.test.ts` still flies the ram held against the jellyfish on Savior and Burn, so she can still
be finished. The 0476, 0526 and 0595 probes anchored on the serpent's and the jellyfish's rows and are
re-anchored on the new numbers.

## Not held by any guard

- **Whether +60% is right.** The ask was 40–75%. The play decides.
- **The fish and the jellyfish with the ball.** The refused model's result there is a play question: their
  adds keep the ball hot while it waits, and that may be what *"constantly back off"* is really about.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): content only.
