# The uncoil needed a gap, the eye had no picture, and the boss is white 65% of a fight

**Given 2026-08-16**, having flown [0150](../docs/decisions/0150-the-uncoil-and-the-eye.md) on the
branch preview. Three items, in the player's own words —
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).

## 1. The uncoil — ⚠️ ANSWERED BY [0151](../docs/decisions/0151-the-gap-you-have-to-reach.md)

> *"Needs a gap, also needs to fire off at every 10% damage reduction below 50%. It was good, but
> needed a way to dodge it and also needed to happen more than once per boss."*

⚠️ **BOTH HALVES OVERTURN A DESIGN 0150 ARGUED FOR AT LENGTH, AND 0150 NAMED THIS AS THE RISK.** Its
own *what to watch for* said: *"it is the first thing in the game the player cannot dodge… that is the
half most likely to come back as a bug report."* It did, within a day. The unavoidability was the
premise the whole *"sized against the shield pool"* argument rested on, and with it gone the
once-per-fight bound goes too — a dodgeable attack can repeat.

### ⚠️ AND THE FIRST ANSWER TO IT WAS WRONG, AND WAS CAUGHT BEFORE IT SHIPPED

The first draft opened the hole **near the ship**, on a measurement that said a fixed hole could not
be reached. Reported the same day, against the design rather than a build:

> *"The flip side of making the hole be created near the ship is that it's too easy. A static hole in
> the wall is a pattern the player needs to learn, a variable hole that spawns close to the ship
> negates the entire difficulty of the obstacle… there is an audible phase change cue and then a
> static wall with a hole in it means the player needs to be ready for the challenge. Whereas a
> changing hole that's easy to find means there's not really a point in that 'wall' challenge at
> all."*

⚠️ **THE MEASUREMENT WAS RIGHT AND THE CONCLUSION DRAWN FROM IT WAS NOT.** It compared the curtain's
flight time against crossing the **whole lane** — and a fixed hole is never a whole lane away. It is
at most `max(at, ACROSS_SPAN − at)`, which for anything near the middle is about half that. What the
number actually bounds is **where a static hole may be authored**, not whether one can exist.

| | |
|---|---|
| curtain in the air, chorus | 58–75 steps depending on tier |
| curtain in the air, axis | **39**–51 steps |
| the ship covers, standing start, in the worst window (axis at `burn`) | **59.5 units** |

So the chorus's slow bullet buys it a hole hard over to one side (**26**) and the axis's fast one
forces its hole near the middle (**58**). `tests/level.test.ts` parks the ship at the far wall and
drives it at the real inertia for exactly the curtain's flight.

### ⚠️ AND THE REPORT CAME WITH THE PROJECT'S FIRST STATED RULE FOR DIFFICULTY

> *"The game is supposed to be hard and gets harder with each level. It's a short game so the
> replayability comes from the difficulty. Management of difficulty is **'is this unfair' OR 'is this
> a learnable strategy'**?"*

**This outranks the item it arrived with.** It is the test to put a difficulty proposal to from now on,
and it is what decides which half of a hard mechanism is allowed to stay hard: a wall whose hole never
moves is *learnable*; a hole nobody can reach from where the fight put them is *unfair*; a hole that
comes to the player is neither, because there is nothing to learn.

⚠️ **AND IT NAMES SOMETHING 0151 DOES NOT DELIVER**: *"an audible phase change cue and then a static
wall"*. The uncoil fires at fixed health fractions, not on a phase change, and **nothing on screen
says how much boss is left** — so the hole's position is learnable and its timing is not. 0151 records
that the answer is queue item 2's telegraph rather than a number.

## 2. The eye — ⚠️ NOT ACTED ON, AND THE CAUSE IS MEASURED

> *"There is no 'shedding' in the game… the only 'shedding' that happens is the boss/enemies blink
> white when they're hit, so this effect, while cool, just has the boss sitting there basically white
> all the time till it does."*

⚠️ **THE BOSS'S HULL IS LIT ON 65% OF THE STEPS OF A FIGHT AT THE DESIGN LOADOUT.** Driven, at three
weapon tiers, counting steps where `flashFor > 0`:

| weapon tier | hull lit |
|---|---|
| 0 (base) | 22% |
| 2 (**the design loadout**) | **65%** |
| 4 (max) | 62% |

`IMPACT_FLASH_STEPS` is 4 and the pulse fires every 6 steps at tier 2, so a hit refreshes the flash
before the previous one has expired. **The player's *"basically white all the time"* is literally
correct**, and nothing in this repository measured it.

⚠️ **THREE THINGS FOLLOW AND ONLY THE FIRST IS ABOUT 0150.**

1. **The bared window has no picture**, because 0150's debris trickle is drawn on a hull that is
   already white — which is 0036 unsatisfied by the very change that claimed to satisfy it.
2. **The impact flash carries no information during any boss fight**, at any loadout above the base
   one. [0035](../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md) says damage is
   legible on the body that took it; at a 10 Hz duty cycle of 65% it is a colour, not an event.
3. **It is not a boss problem.** Anything the player holds fire on for more than four steps saturates
   the same way, which is every enemy that survives one hit.

⚠️ **DELIBERATELY NOT FIXED IN 0151.** It is a change to how every body in the game reads, it is a
different subsystem from the attack this report's first item is about, and changing both at once makes
the next verdict unattributable —
[0109](../docs/decisions/0109-a-death-is-a-drum.md)'s standing rule. It is queued as its own item with
the measurement attached.

## 3. The ×3 window — ⚠️ DEFERRED BY THE PLAYER, AND THEY NAMED THE REPLACEMENT

> *"It's not really noticeable as a damage buff increase, but I like the idea. When I get around to
> tuning each boss individually, I think it'll be a case of increased boss health, but at 75%/50%/25%
> there's a vulnerable boss phase where you get 2secs of free shooting or something."*

⚠️ **THE PLAN NAMED HERE IS THREE WINDOWS AT FIXED FRACTIONS, NOT ONE AT THE END** — and *"2 secs of
free shooting"* is a **duration**, which is the first thing anyone has asked this project for that
[0040](../docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md)'s phase model cannot
express: a phase is keyed to remaining health precisely so that *"a heavier loadout shortens the fight
without trivialising it"*, and a window that lasts two seconds regardless is a clock.

⚠️ **That is not a reason to refuse it — it is a reason to have the argument once, deliberately, when
the boss tuning pass happens.** The same shape already exists in the codebase and works:
`BOSS_DEATH_STEPS` is a beat measured in steps. What 0040 protects is the *fight's* pacing, not every
number in it. Written down here so the next session does not rediscover the tension mid-pass.

⚠️ **AND NOTE THE UNCOIL NOW USES FIXED HEALTH FRACTIONS TOO** — *every 10% below 50%* — which is the
same shape as *75/50/25* and lands on the row rather than in the phase table. 0151's `Uncoil` is the
precedent to copy when that pass happens, not a thing to work around.

## ⚠️ A THIRD WALL-CLOCK GUARD GAVE WAY UNDER LOAD, AND IT IS ATTRIBUTED

Found while proving this work, and recorded because
[0044](../docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) says a rerun is
not evidence and *"flaky"* is not what an intermittent guard found.

| run | result |
|---|---|
| the branch, default concurrency, ×3 runs | 2–4 failed — `menu.browser`, `sound`, `links` |
| **`main`, same machine, same minute, default concurrency** | **4 failed** — `links`, 2× `menu.browser`, `sound` |
| the branch, `VITEST_MAX_THREADS=4` | 4 failed — **the env var does nothing** |
| `tests/sound.test.ts` on its own | **74/74 green**, 29.7 s |
| **the branch, `npx vitest run --maxWorkers=4`, ×2 runs** | **63/63 green, 1052 tests, both** |

⚠️ **`main` FAILS THE SAME TESTS AND MORE, WHICH IS THE ATTRIBUTION**, and **`--maxWorkers=4` IS THE
DIAGNOSIS.** The tree is not the cause and *"the machine was busy"* is not either: the suite is
**oversubscribing its own worker pool**. Vitest defaults to one worker per core, several of those
launch a chromium, one of them is a CPU-bound bake with a 30 s ceiling — and the pool has no idea the
others exist. Capping it at four makes the identical tree go green, every time.

⚠️ **EVERY FAILURE IS A WALL-CLOCK TIMEOUT** — `sound`'s place bake at 30 s, `menu.browser`'s hooks at
10 s, `links` at 5 s. Not one is a quantity the game computes, which is
[0044](../docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s definition of a
guard measuring the wrong thing.

⚠️ **THE ONLY LEVER THAT WORKS IS THE CLI FLAG, AND THE OBVIOUS ONE DOES NOT:**

```bash
npx vitest run --maxWorkers=4
```

⚠️ **`VITEST_MAX_THREADS=4` WAS WRITTEN INTO THIS REPORT AS THE WORKAROUND BEFORE IT WAS CHECKED, AND
IT IS WRONG.** It is a vitest 0.x/1.x variable and **vitest 4 ignores it**; it was "confirmed" against
a three-file run that could not oversubscribe in the first place. Verified afterwards on the full
suite: with the env var set, still four red. **A workaround that has only ever been seen to pass is
not known to work** — [0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md)'s rule applied to
a claim about the toolchain rather than to a guard.

⚠️ **SO `npm run prove` CANNOT BE CAPPED FROM OUTSIDE, AND THE FULL LOCAL GATE IS UNAVAILABLE ON A
LOADED MACHINE.** `runSuite` in `scripts/prove-guard.mjs` spawns
`vitest.mjs run <suites> --reporter=json` with no worker flag and no env passthrough, and `prove`
refuses to run at all when its baseline is red. **Capping it needs a repo change** — either
`vitest.config.ts` or that spawn — and which of those is right is the open question, not a thing to
decide inside a branch about a boss attack.

⚠️ **THIS IS 0044'S OWN CLASS, AND IT NOW HAS THREE MEMBERS**: the `offline.browser` cache sweep
already recorded as *open and unexplained*, `menu.browser`'s hooks, and the place bake — which
`docs/state-of-play.md` already notes *"sat at 88% of its 60 s on main"* before 0148 added six voices
to it. **A budget at 88% is a guard that reports the machine rather than the code**, and the third
sighting is what makes that a pattern rather than a bad afternoon.

⚠️ **DELIBERATELY NOT FIXED HERE, AND THE FIX IS NOT A WIDER TIMEOUT.** Capping the pool in
`vitest.config.ts` would make every one of these green on every machine — but it is a repo-wide change
to how the whole suite runs, on a day this branch is about a boss attack, and CI runs on a different
machine with a different core count. **Widening the timeouts is the move 0044 refuses outright.** The
open question is whether the cap belongs in the config or whether the place bake's 30 s is simply too
close to its own cost — `docs/state-of-play.md` already records that it *"sat at 88% of its 60 s"*
before 0148 added six voices to it, and 88% of a budget is a guard reporting the machine.

## ⚠️ What the shield is now for, which is open again


[`the-boss-vocabulary-is-one-fan`](the-boss-vocabulary-is-one-fan-2026-08-14.md)'s finding was that
0050's shield and 0053's bomb have no moment they are FOR, and 0150's answer was an attack the shield
was the only way to pay for. **A dodgeable curtain is not that**, so the finding is open again and
this report is not pretending otherwise. What the uncoil is now is a *movement* demand rather than a
*resource* demand — which is what the player asked for, and it is a different answer to a different
question.
