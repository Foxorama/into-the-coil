# 0084 — The dial is the level plus the guns

**Accepted 2026-08-08.** Chunk 6 of
[`the-third-play-test`](../../reports/the-third-play-test-2026-08-08.md) — *"the mechanism the project
does not have"*, and the largest thing on that list.

**Second difficulty axis**, beside [0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)'s
tier. Neither replaces the other.

## The rule

**The difficulty dial is `1 + the level's index + the weapon pickups that level has already put on
the field`, clamped to 1–11. It rises through a level, drops at a boundary without dropping to where
the last level began, and reaches exactly 11 at the last boss.**

Its first and only consumer: **nothing takes more than one hit until the first level has offered two
weapon pickups.**

## What was asked for

> *"There should be progression of mission and difficulty from one level to the next. Level 2 starts
> harder than level one and increases difficulty etc. It's a dial that starts at 1 and should be at 11
> when the player is dealing with the last boss at the end of the last level."*

> *"Level 1 -> dial starts at 1, increases to 2 when the player gets their first weapon power up,
> increases again when they get their next, until they get to the boss which should be difficulty 4 or
> so on the dial. Level 2 starts by dialing it back 2 notches to give the player a breathing space and
> then dials it up per power up spawn so it should be around 5 at the end of the level. That pattern
> then repeats."*

> *"Balance comes from making sure that the player can reasonably be expected to deal with the
> difficulty dial."*

> *"At the start of the game there should be no multiple hit enemies until after the 2nd upgrade has
> been spawned - the difficulty curve currently has a massive spike at the start, then it also
> immediately scales out and then drops off to super easy based on buffs the player has."*

## The arithmetic, and the endpoint is exact

| | |
|---|---|
| `DIAL_MIN` | 1 — where a run opens |
| `DIAL_PER_LEVEL` | 1 — added at each boundary |
| `DIAL_PER_WEAPON` | 1 — added per weapon pickup the level has spawned |
| `DIAL_MAX` | 11 — where the last boss is fought |

Level *n* (from zero) runs from `1 + n` to `1 + n + 4`, because
[0083](0083-two-ladders-of-four.md) gives every level four weapon pickups. So:

| level | opens at | boss at |
|---|---|---|
| 1 | 1 | 5 |
| 2 | 2 | 6 |
| … | | |
| 7 | 7 | **11** |

⚠️ **The top is reached exactly, and that is arithmetic rather than a coincidence to be maintained by
hand.** `1 + 6 + 4 = 11`. `tests/dial.test.ts` recomputes it from `LEVELS` — so a level that gains a
fifth weapon pickup, or an eighth level, fails there rather than quietly pushing the last two levels
into the clamp and making the top of the dial somewhere nobody goes.

⚠️ **The ask says the first boss should be *"4 or so"* and this gives 5.** One notch, and it is the
overshoot [0083](0083-two-ladders-of-four.md) predicted when it set four weapon tiers: *"four notches
from 1 overshoots by one; three undershot."* The endpoint is pinned at 11 by the ask and the step is
pinned at 1 by wanting integers, so the middle is where the slack has to go. Worth a hand's verdict
before it is tuned — the whole curve is two constants.

## Offered, not held — and the ask says both

⚠️ **The dial counts what the LEVEL HAS SPAWNED, not what the player picked up.** The report uses both
words: *"increases to 2 when the player **gets** their first weapon power up"* and *"dials it up **per
power up spawn**."* They are different mechanisms and **only one of them can sawtooth.**

**Held cannot.** Upgrades cross a level boundary
([0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)), so a player entering level two with
four weapon tiers carries those four notches with them and the dial climbs monotonically to the end of
the run. There is no arrangement of per-level bases that fixes it: to drop two notches below a carried
total, the base would have to fall each level, and then the dial cannot also reach 11.

⚠️ **What that costs, stated rather than hidden:** a player who ignores every pickup still faces a
rising dial. The gap is small by construction — a pickup waits seven seconds
([0064](0064-a-pickup-waits-to-be-taken.md)), reaches 6% of the lane
([0056](0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md)), and a death now hands
everything back ([0083](0083-two-ladders-of-four.md)) — but it is real, and it is the first thing a
play-test should be allowed to disagree with. It is also the half of *"balance comes from making sure
that the player can reasonably be expected to deal with the difficulty dial"* that this decision does
not guarantee.

## What the dial spends, and it is deliberately one thing

⚠️ **`singleHitOnly` is the whole of it**, which is `docs/state-of-play.md`'s own instruction: *"it is
worth landing the mechanism with the smallest content on it and authoring against it afterwards."*
Chunks 7 and 8 are what the dial spends.

⚠️ **A clamp to one rather than a scale towards one.** A turret with three health in the opening
thirty seconds is the spike; two would be a smaller spike. The ask is a floor on *the number of shots*,
which is the thing the player counts.

⚠️ **It does not reach a boss.** Every boss sits far past the threshold, so folding the clamp into
`toughnessFor` would be dead code that only looked safe — and the day somebody authors a boss earlier,
a one-health boss is what it would produce. It is applied at the one spawn site that is an enemy in a
wave.

## The `levelIndex === 0` term, which a guard caught the absence of

⚠️ **The first draft was a plain dial threshold and it was wrong, and no threshold value fixes it.**
The sawtooth reuses low dial values by construction:

| | dial |
|---|---|
| level one, one weapon offered | **2** |
| level two, opening | **2** |

The clamp must be ON at the first and OFF at the second. Those are the same number. So a rule written
purely in dial units brings the clamp back at the opening of level two, and at the opening of level
three before its first pickup — most of the game's openings would have had no multi-hit enemies in
them.

⚠️ **The dial says *how hard*; it does not say *how far in*.** This rule is about the second, so it
reads the dial AND the level. Caught by `tests/dial.test.ts`'s *"level two is past it from its first
wave, so the clamp is an OPENING and not a mode"* — a guard written as the counterweight to the
reported defect, which turned out to be the thing that found the defect in the fix.

## The two axes do not commute, and that is a real fact about the three buttons

⚠️ **While the clamp is on, the hardest tier is no tougher than the easiest.** A floor on shots-to-kill
wins over a multiplier. `tests/difficulty.test.ts`'s fixture had to turn the dial past the clamp to go
on measuring the tier at all, and the note is written there.

**That is intended**: the report's complaint was a spike *at the start of the game*, and a spike is no
less of one for having been chosen on the title screen. But it is a thing the three buttons now do
that nothing else in the repository said, and a player picking *Let the Galaxy Burn* gets the same
opening thirty seconds as one picking *Legendary Pilot*.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0084-dial.mjs`.

| broken on purpose | went red |
|---|---|
| the offered count left standing at a level boundary, so the dial never comes back down | `resets what the level offered without resetting where the run has got to` |
| the level term dropped, so every level opens at the bottom of the dial | `THE SAWTOOTH: a level opens easier than the last one ended` |
| the LAST level given an extra weapon, so the run runs past the top of the dial | `THE ENDPOINT: the last boss is fought at exactly the top of the dial` |
| a MIDDLE level given an extra weapon, so two bosses are fought at the same difficulty | `THE CLIMB: every boss is fought harder than the last one` |
| the clamp dropped from the spawn, so the opening spike comes back | `and it reaches the FIELD, not just the table` |
| the clamp never lifting, so nothing in the game ever takes more than one hit | `and once the clamp lifts, a tough enemy is tough again` |
| the clamp keyed to the dial alone, so it returns at the opening of every early level | `and level two is past it from its first wave` |

⚠️ **Two of these are CONTENT edits, and they are the only probes in the repository for a claim that
lives in the multiplication of two files.** *The last boss is fought at 11* is written nowhere in
`src/content/levels.ts`; it falls out of seven levels times four weapons. A fifth weapon pickup is a
perfectly reasonable-looking content change with no visible connection to the dial at all.

⚠️ **AND THE SECOND OF THEM FOUND A GUARD THAT WAS MISSING.** The extra weapon was first put in level
SIX and the suite stayed green: `THE ENDPOINT` only looks at the last level, and `THE SAWTOOTH` only
compares a level's opening to the one before it. Level six's boss had quietly risen to **11** — level
seven's number — so the run's last two fights were the same difficulty and nothing complained. `THE
CLIMB` is what was missing, and *"there should be progression of mission and difficulty from one level
to the next"* is the sentence it holds.

⚠️ **One probe was named for the wrong guard, and the reason is a layer split.** *The offered count
left standing* reddens the frame test rather than `THE SAWTOOTH`, because the sawtooth's two halves
live in two layers: `dialFor` is a pure function and cannot see a reset that happens in `beginScript`.
Only the guard driven through the real frame can catch it.

⚠️ **The last one is a draft of this decision, kept as a probe.** It is the reading anybody would
reach for — *it is a dial rule, so read the dial* — and it is why the level term exists.

⚠️ **Two other decisions' probes were re-anchored**: 0047's tier-never-reaches-the-spawn now shares a
line with the clamp, and 0058's merged-paths break spans a line `w.levelIndex = 0` was inserted into.

## What this does not settle

**Whether the dial should ease off after a death.** It does not: the dial is a function of the level
and what the level offered, neither of which a death touches. The scatter (0083) is what covers a
death instead. If a play-test says a run spirals after two deaths, this is where to look.

**Whether one consumer is enough to call it a mechanism.** It is not, honestly — a dial with a single
reader is one refactor from being a number in a file, and `scripts/probes/0084-dial.mjs` says so at
the top. Chunks 7 and 8 are what give it more, and they are what it was built for.

**The first boss at 5 rather than 4.** See the arithmetic above; it is one notch and the whole curve
is two constants.
