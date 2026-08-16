# 0151 — the gap you have to reach

**The uncoil gets a hole, and throws again and again as the boss's health falls.** It moves off the
phase stance and onto the boss row, because a trigger at fixed fractions of a health bar is not
something a phase can say.

## What was reported

Flown against [0150](0150-the-uncoil-and-the-eye.md), 2026-08-16:

> *"Needs a gap, also needs to fire off at every 10% damage reduction below 50%. It was good, but
> needed a way to dodge it and also needed to happen more than once per boss."*

[`the-uncoil-needed-a-gap`](../../reports/the-uncoil-needed-a-gap-2026-08-16.md) has the whole report,
including two items this decision does **not** act on.

⚠️ **0150 NAMED THIS EXACT RISK AND SHIPPED ANYWAY, WHICH WAS THE RIGHT CALL AND IS WORTH SAYING.**
Its *what to watch for* read: *"it is the first thing in the game the player cannot dodge… that is the
half most likely to come back as a bug report."* A question about how an attack FEELS is not one a
guard can answer ([0027](0027-measure-the-picture-not-the-model.md)), so it went out to be flown, was
flown inside a day, and the answer arrived. That is the loop working.

## ⚠️ THE HOLE IS STATIC, AND A DRAFT THAT MADE IT FOLLOW THE SHIP WAS BUILT AND REFUSED

The first attempt at this decision opened the hole near the ship, on a measurement that said a fixed
hole could not be reached. **That was the right measurement and the wrong conclusion**, and the
play-test caught it before it shipped:

> *"The flip side of making the hole be created near the ship is that it's too easy. A static hole in
> the wall is a pattern the player needs to learn, a variable hole that spawns close to the ship
> negates the entire difficulty of the obstacle… there is an audible phase change cue and then a
> static wall with a hole in it means the player needs to be ready for the challenge. Whereas a
> changing hole that's easy to find means there's not really a point in that 'wall' challenge at
> all."*

⚠️ **AND IT CAME WITH THE PROJECT'S FIRST STATED RULE FOR MANAGING DIFFICULTY, which is worth more
than this decision is:**

> *"The game is supposed to be hard and gets harder with each level. It's a short game so the
> replayability comes from the difficulty. Management of difficulty is **'is this unfair' OR 'is this
> a learnable strategy'**?"*

That is the line every number below is written against, and it is now the thing to test a difficulty
proposal against rather than *does it feel fair*.

### Where the first measurement went wrong

| | |
|---|---|
| the curtain is in the air, chorus | 58–75 steps depending on tier |
| the curtain is in the air, axis | **39**–51 steps |
| the ship crosses the **whole lane** | ~59 steps |
| the ship covers, from a standing start, in the **worst** window (axis at `burn`) | **59.5 units** |

The first draft compared the flight time against crossing the **whole lane** and concluded a fixed
hole was unreachable. **A fixed hole is never a whole lane away** — it is at most
`max(at, ACROSS_SPAN − at)` away, which for anything near the middle is about half that. The
measurement was sound; the distance it was applied to was not.

**So the hole is at a fixed `at`, and what the measurement actually bounds is WHERE it may be
authored.** `tests/level.test.ts` parks the ship against the far wall, holds the stick over for
exactly as long as a real curtain is in the air, at the hardest tier, and asks whether it reached the
hole's near edge. Arithmetic could not do that half: the ship has mass
([0037](0037-the-ship-has-mass.md)), so `distance / SHIP_SPEED` is an answer about a ship this game
does not have.

| boss | bullet | flight at `burn` | hole | why there |
|---|---|---|---|---|
| chorus | `spit`, slow | 58 steps | **26** | its slow bullet buys the whole lane, so its hole sits hard over to one side |
| axis | `lance`, fast | **39 steps** | **58** | 39 steps buys 59.5 units, so the last boss's hole has the least room to be anywhere |

⚠️ **THE FAIRNESS FLOOR IS THE ONLY THING THE STATIC DESIGN IS STILL HELD TO**, and it is the player's
own line: a wall whose hole never moves is a *learnable strategy*; a hole the ship physically cannot
get to from where the fight put it is the *unfair* one, and no amount of learning changes that.

## ⚠️ Why it left `BossStance` for the row

*"Every 10% damage reduction below 50%"* is a trigger at fixed fractions of a health bar. 0150 hung
the curtain on a phase transition, and **every way of expressing that in the phase table merges the
four escalating fans underneath it into one long phase** — which is the escalation the table exists to
carry, and which [0111](0111-a-boss-has-one-idea.md) and 0124's phase-length guard are both about.

So `BossStance` drops to two arms (`volley`, `bare`) and the boss row gains `uncoil: Uncoil | null`.
`uncoilsBy` counts the notches off health exactly as `phaseFor` derives the phase, and
`w.bossUncoilAt` remembers the last one acted on — the same event-from-a-derived-quantity shape, for
the same reason.

⚠️ **A notch the bared window swallows is SPENT, not saved.** The window is the boss having thrown
everything it has; a curtain out of an open hull would contradict the one thing the picture is trying
hardest to say. So the two bosses that have an uncoil throw **four** curtains, not five, and
`tests/level.test.ts` refuses a window that starts above `from` — which would eat the whole mechanism
silently.

## ⚠️ WHAT THE PROBE FOUND, AND IT CHANGED THE CODE — FOR THE SECOND DECISION RUNNING

The following-hole draft placed the hole with a `holeAt(shipAcross, uncoil)` that ended in a clamp
keeping it inside the lane. **The probe that deleted the clamp left the suite GREEN**: the placement
rule already bounded the answer, so the clamp was a second description of *the hole is in the lane*
that no break could distinguish from the first.

`holeAt` is gone entirely now — a static hole is the number the row authors — but the finding stands
and is why there is no clamp anywhere in this mechanism.

⚠️ **THIS IS THE SAME FINDING 0150's PROBE SET PRODUCED, ONE LAYER DOWN**, where a bare phase's zeroed
fan and `stepBoss`'s early return were two descriptions of *it stops shooting*. Twice in two decisions,
[0019](0019-a-probe-must-be-seen-to-apply.md) has caught a redundancy that reads as defensive
programming and is actually an untestable second answer. **That is now a pattern rather than an
incident**, and it is worth expecting on the next mechanism that has a bound in it.

⚠️ **AND ONE MEASUREMENT WAS WRONG BEFORE IT WAS RIGHT, WHICH IS ITS OWN LESSON.** The travel figures
were first taken with a fixture that never dodges and a one-hit hull, so the ship died mid-run and
respawned at the middle of the lane — and the distance it appeared to cover was the respawn rather
than the flight. **The tell was that it read as travelling FURTHER at a harder tier**, which is
impossible, and it is the only reason the number was re-taken. A measurement that moves the wrong way
is the cheapest bug in this project to catch and the easiest to write down and believe.

## What is guarded

Eight probes, all seen red — `node scripts/prove-guard.mjs 0151`:

| broken on purpose | went red |
|---|---|
| **the hole made to follow the ship** — the refused draft, restored | **the wall does not move, so it is a pattern to learn** |
| the hole authored past what the ship can cross from the far wall | it can be REACHED from the far wall |
| the hole narrowed to less than the ship | an uncoil has exactly one hole, and the ship fits through it |
| the curtain spaced wide enough for a forgiving ship to slip through | an uncoil has exactly one hole, and the ship fits through it |
| the uncoil stopped reaching the field | a real fight throws real curtains, each with one hole in it |
| the hole stopped being cut out of the curtain | a real fight throws real curtains, each with one hole in it |
| the uncoil spaced so wide it fires once a fight | it is thrown again and again |
| the hole authored half off the edge of the lane | the whole hole is inside the lane |

⚠️ **THE FIRST ONE IS THE POINT OF THE SET.** A hole that follows the ship passes *every other*
assertion here — the row still names a position, the curtain still leaves exactly one opening, it is
still wide enough and still reachable. What it stops being is a challenge, and the only way to ask
that of the model is to throw two curtains from two ship positions and compare where the hole landed.

⚠️ **TWO OF 0150's PROBES WERE RETIRED AND THEIR SUBJECTS ARE HERE.** Both were about `overwhelm`; one
of them defended *no ship can pass this curtain*, which is the claim this decision inverts.
`scripts/probes/0150-the-uncoil-and-the-eye.mjs` says where they went, so a reader of that file is not
left wondering what was quietly dropped.

⚠️ **Three assertions are in the player's own units**: the hole against the ship's own width, its
position against how far the ship actually travels under inertia from the far wall while the curtain
closes, and the curtain's spacing against what a `forgiving` hurtbox slips through.

## ⚠️ What this does NOT do

- **The bared window's picture.** The same report measured that a boss's hull is lit on **65% of the
  steps** of a fight at the design loadout, so 0150's debris trickle is drawn on a hull that is
  already white — *"the boss sitting there basically white all the time."* That is a change to how
  **every body in the game** reads, in a different subsystem from this attack, and
  [0109](0109-a-death-is-a-drum.md)'s standing rule is that two verdicts changed together are
  unattributable. It is queued as its own item with the measurement attached.
- **The ×3 multiplier**, which the player deferred by name to the per-boss tuning pass and sketched a
  replacement for: three windows at 75/50/25 of *"2secs of free shooting"*. ⚠️ **That is a DURATION**,
  and the report records why it argues with 0040 and why that argument should be had once, on purpose,
  rather than mid-pass.
- **The other five bosses.** Still two rows, still a demonstration rather than a re-authoring, and the
  boss-vocabulary report's item 4 is still where the re-authoring lives.

## ⚠️ And what it re-opens

[`the-boss-vocabulary-is-one-fan`](../../reports/the-boss-vocabulary-is-one-fan-2026-08-14.md)'s
finding was that **0050's shield and 0053's bomb have no moment they are FOR**, and 0150's answer was
an attack the shield was the only way to pay for. **A dodgeable curtain is not that**, so the finding
is open again. What the uncoil now is, is a *positioning* demand rather than a *resource* demand —
which is what was asked for, and is a different answer to a different question. It is not pretended
otherwise here or in `docs/state-of-play.md`.

## ⚠️ The thing this decision does NOT yet give the player, and it is named in their own report

> *"There is an audible phase change cue and then a static wall with a hole in it means the player
> needs to be ready for the challenge."*

**The uncoil does not fire on a phase change**, and it has no cue in front of it — it sounds
`bossShot` on the step it is thrown, which is the attack rather than a warning. It fires at every 10%
of health below half, and **nothing on screen says how much boss is left**
(`src/content/sprites.ts` records that gap deliberately). So the *pattern* is learnable — the hole is
always in the same place — but *when it is coming* is not, and a player who is against the far wall
when it lands has only the flight to react in. That is exactly the margin the reachability guard now
holds, and it holds it at the limit rather than comfortably.

**A telegraph would turn the margin into a choice**, and it is already queue item 2 —
`lance`, *"the telegraphed lock-on, the first attack the player is warned about"*. Written down here
rather than built, because a warning is a new drawing primitive and
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) governs it. **If the next
play-test says the uncoil arrives without warning, the answer is that item and not a number in this
one.**

## The rollback note

**Nothing irreversible.** No `itc_*` storage key, no save-schema field, no service-worker cache prefix,
no origin. `bossUncoilAt` is per-frame world state and not reducer state
([0017](0017-the-state-is-slices.md)), so it is never serialised; a save stores the level reached and
never a boss's health ([0021](0021-one-stream-per-concern.md)). Reverting restores 0150's
`overwhelm` stance exactly, along with the two probes retired from its set.
