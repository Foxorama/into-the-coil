# 0282 — A mechanism for every instance makes them one instance

**Accepted 2026-09-08**, after a miss, from
[`the-wake-played`](../../reports/the-wake-played-2026-09-08.md):

> *"it's the exact same spray for each boss… it's the same ongoing issue in this project which is
> that this project continually treats each and every object as the same thing."*
>
> *"level music can't be different or breaks a different music level / animation can't be done /
> attacks for the bosses are basically all exactly the same except for the very few I've called out
> specifically."*
>
> *"there's about 200+ different things to work on and improve and it's going to take forever
> because the established pattern of good quality doesn't exist."*

**Amends [0028](0028-quality-is-the-constraint.md)**, whose clause 3 requires this file to exist, and
**widens [0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md)**, whose second rule was too
narrow to catch the defect below.

**Supersedes [0281](0281-a-boss-guards-its-own-back.md)**, which is the instance.

## The rules

1. ***"No row can forget it"* is an argument for a DEFAULT, never for a CONSTANT.** If a behaviour is
   worth every instance having, the row still says what ITS version is; what shared code may hold is
   the fallback, not the value.
2. **A change is finished when the thing it added can differ per instance.** Not when it works on
   one, and not when it works identically on all of them.
3. **A guard written as *every instance does Y* forces Y into shared code.** Write *every instance
   AUTHORS its Y* instead, and the same coverage lands on the rows.
4. **A quantity solved from one case is checked in every case it runs in.** For a boss that means the
   arrival, every phase, the windows and the death — not the parked fight it was measured in.

## ⚠️ Why this is not *don't share code*, which is the reading that would do damage

[0016](0016-a-hub-enumerates-kinds.md) already has the right shape and says so: *behaviour rides the
row*. This project's tables are good. **What went wrong is not that a mechanism was shared — it is
that the CHOICES were made in the shared half.**

`throwTail` is fine as a function. Seven shots, 137° of spread, a 0.42-radian sweep, 0.22 units a
step, one lash every 54 steps and a 30-step linger are **six authored decisions about what a boss is
like**, and all six were written as `const` in `src/app/boss.ts`. Move them onto `BossRow` and the
same function draws fourteen different animals; leave them where they were and it draws one animal
fourteen times.

⚠️ **THE TELL IS A MECHANISM WHOSE OUTPUT IS IDENTICAL FOR EVERY KIND.** Not *shared code* — shared
output. If two rows cannot produce two different pictures from it, it is not a feature of fourteen
bosses, it is a feature of the file.

## ⚠️ And the reason the wrong instinct won, which is the part worth keeping

**Safety beat variety, and it did it with a sentence that sounds like rigour.** 0281's own words:

> *"It is not an attack arm and no row authors it: a hull that is fighting has a wake."*

and

> *"a rule in `src/app/boss.ts` cannot be forgotten by a row that does not mention it."*

Both are true. Both are *good* arguments — they are 0270's own argument, which is cited in 0281 for
exactly this move, and 0270 was right to make it. The difference nobody drew:

| 0270 | 0281 |
|---|---|
| a **ceiling** — the most shards a volley may open with | a **value** — what a wake IS |
| a row that forgets it produces a **defect**: a full pool, dropped volleys | a row that forgets it produces a **different boss**, which is the point of having fourteen |

⚠️ **A CEILING BELONGS IN SHARED CODE AND A CHARACTER DOES NOT.** *Nobody can forget it* is the right
argument for the first and is the exact wrong argument for the second, and it reads identically in
both cases. That is why this is a decision and not a note.

## ⚠️ And a guard can cause this on its own, which is the mechanism worth naming

0281's guard is *THE REPORTED ONE: a ship parked against the up-lane wall is found there, in every
bullet-throwing phase of every fight.* Read it as an instruction to an implementer: **the cheapest
thing that satisfies "every fight" is one mechanism in shared code**, and every per-boss answer costs
fourteen times as much to write and to keep green.

**So the guard chose the implementation, and it chose sameness.** The shape that does not:

> *every boss's row authors what happens behind it, and no two are the same.*

That is the shape `tests/level.test.ts` already uses for flight and fan — *no pair of flight and fan
repeats across all fourteen* — and it is why those fourteen bosses do differ. The guard that exists
for variety already exists in this repository; it was simply not the one reached for.

## ⚠️ Why 0280 did not catch the fixed-point defect, and what widens it

0280's second rule is *a quantity that **rejects** an option is checked in the case it is applied to*.
`TAIL_STANDOFF` did not reject anything: it **chose** one, and it was measured against a boss parked
on its station.

**A boss is not on its station for the first several seconds of its fight.** It is spawned at the
leading edge and closes at `APPROACH_PER_STEP`, which
[0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md) leaves seven seconds of quiet in front of *so that the
arrival is something the player watches happen*. Through all of it the standoff's clamp binds, and
the wake is laid **at a fixed distance from the camera with no hull attached to it** — the reported
defect, exactly.

⚠️ **AND EVERY GUARD IN `tests/back.test.ts` FLIES PAST IT.** Each one steps the fight until the boss
has arrived and only then starts measuring — the gate was added deliberately, because the ship flying
up-lane past the hull was polluting the fair-warning number. **The fixture skipped the arrival for a
good reason and the guard then had nothing to say about it.**

**So rule 4:** a boss fight has an arrival, a phase table, its windows and a death, and a fixture
that stands the boss on station has flown one of them.

## What was done about the instance

**The wake is removed.** `throwTail`, its seven constants, `Entity.tailAt`, `Entity.tailIn`, the melt
in `fissionShots`, `tests/back.test.ts` and `scripts/probes/0281-*.mjs` are gone. 0281 is marked
superseded rather than edited — [`README`](README.md): *a decision file is not maintained*.

⚠️ **TWO THINGS IT FOUND ARE KEPT, BECAUSE THEY ARE TRUE WITHOUT IT:**

- **`tests/world.ts`'s stick.** `src/app/frame.ts` zeroes the intent at the top of every step, so a
  fixture writing `world.intent` between steps never reaches `flyShip` — and `tests/crowd.test.ts`
  spent 0270 believing it had a pilot. It has one now.
- **`tests/level.test.ts`'s volley reading.** Unrelated to the wake once the wake is gone, and the
  loop that stops at the first hostile shot is left as it was.

**And the original report is unanswered again**, which is stated rather than quietly dropped:
*"you can fly behind it… and just basically sit their nuking it."* It goes back on the list as a
question **per boss** — what is behind a serpent is not what is behind a spinning wall — and the
measurement that motivated it stands:
[`the-serpent-played`](../../reports/the-serpent-played-2026-09-08.md) has the geometry.

## ⚠️ Why no guard, and the honest statement is different for each rule

[0192](0192-a-guard-holds-an-invariant.md) asks *name a change to the content that would redden this
and be CORRECT*, and for three of the four rules the answer is *any of them*.

1. **The default-versus-constant rule** cannot be linted, because a constant that is genuinely a
   ceiling and one that is genuinely a character are the same TypeScript. The difference is what a
   row forgetting it produces, and that is a judgement about the game.
2. **"Finished when it can differ per instance"** is about a deliverable, and the deliverable lives
   in chat — the same gap [0028](0028-quality-is-the-constraint.md) records for clause 1 and 0280
   records for its rename.
3. **The guard-shape rule is the one that could be held, and it is held by EXAMPLE rather than by a
   test.** `tests/level.test.ts`'s *no pair of flight and fan repeats across all fourteen* is the
   shape; a lint that demanded it of every new guard would fire on every ceiling in the repository,
   which is the majority of them and correctly so.
4. **Rule 4 is the one worth a guard and it does not have one yet.** *A fixture that stands the boss
   on station has flown one part of the fight* is checkable in principle — a fixture that never
   measures during the approach could be spotted — and it is not written today because the honest
   version needs a way to say **which** fixtures are about the whole fight and which are deliberately
   about one phase. That distinction is content, and inventing it here would be a mechanism for every
   instance in the file that says not to.

⚠️ **SO THIS IS A RULE AND NOT A MECHANISM, WHICH 0028 CLAUSE 3 PERMITS AND WHICH SHOULD BE HELD
AGAINST IT.** There is no `scripts/probes/0282` and there is nothing for one to break. What it buys
is that the next session that reaches for *so no row can forget it* has the failure written down in
the form it takes — which is not *I hard-coded something* but *I made fourteen things safe by making
them one thing.*

## ⚠️ What this costs, said plainly

**Fourteen rows of authorship where there was one constant, every time this rule applies.** That is
the price of fourteen bosses rather than one, and the report is a statement that the price is worth
paying: *"about 200+ different things to work on… the established pattern of good quality doesn't
exist."*

It also means **a feature may land on one boss and not on the others**, and that is now allowed. The
alternative — hold every feature until all fourteen have it — is the thing that produced one wake
fourteen times.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A decision, a rule in `CLAUDE.md`,
and the removal of code added the same day; nothing persisted, no storage key, no save schema, no
cache prefix, no origin.
