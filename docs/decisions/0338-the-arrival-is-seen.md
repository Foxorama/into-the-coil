# 0338 — The arrival is seen where it is placed

**Accepted 2026-09-19.** **Amends [0048](0048-a-threat-may-arrive-from-the-side.md)** — the entry's
floor is the view rather than a fraction of the widest device — **and
[0197](0197-a-wave-arrives-as-a-wave.md)**, whose fix was correct and incomplete.
**The instrument:** [`scripts/weigh-presence.mjs`](../../scripts/weigh-presence.mjs).

## The report, for the third time

> *"I keep reporting the enemies enter the screen halfway through or more and then barely get player
> interaction and it keeps happening, so I think there's a discordant issue somewhere there blocking
> things."*

⚠️ **IT HAS BEEN REPORTED FOUR TIMES AND FIXED TWICE.** 0048 took it as *"entry point should be capped
at 50% from the right side"*; 0197 took it as *"enemies still enter the screen space within 50% of the
left side… which gives the player no way to interact with them"*; and
[`the-first-three-levels-asked`](../../reports/the-first-three-levels-asked-2026-09-14.md) took it as
*"enter 1/2 to 3/4s of the way into the screen and barely shoot at all"*, which produced
[0326](0326-an-enemy-is-seen-before-it-fires.md). **A report that survives three fixes is a report
whose diagnosis is wrong**, and the player said so in the same sentence.

## What was measured, before anything was changed

`scripts/weigh-presence.mjs`, whose `first-seen` column is *mean units ahead of the camera at which a
body was first inside the view*, against the 1280×720 screen every report in `reports/` was given on —
a view **177.8 units** wide.

| origin | first-seen | of the screen |
|---|---|---|
| everything down the lane (`:lead`) | 178–181 | at the leading edge — **correct** |
| `charger:side` | **90** | **51%** |
| `weaver:side` | 101 | 57% |
| `swift:side` | 104 | 58% |
| `sower:side` | 110 | 62% |
| `lancer:side`, `turret:side` | 113–124 | 64–70% |

**Halfway through or more, in units.** And the consequence in the next column over: `charger:side`
visible 2.91 s, **0.00 volleys, 100% of them never firing while seen**.

## Two causes, and neither is the one the previous fixes moved

### 1. The floor is half of a device nobody is playing on

`FLANK_ALONG` is `MAX_ALONG_SPAN / 2` = **120**. Its own note says that is *"at or beyond the halfway
line of every view the clamp allows — dead centre on the widest, and 80% of the way across on the
narrowest"*.

⚠️ **120 OF 177.8 IS 68%, NOT 80%** — and 16:9 is not an edge case: it is `REFERENCE_ASPECT`, the
aspect the levels are authored to ([0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md)) and
the commonest monitor there is. Every arrival rule is written against the **widest** view; the play
happens on the **narrowest**. That is the discordance the report names.

⚠️ **AND `flankAlongFor` TOOK THE VIEW AS AN ARGUMENT AND IGNORED IT.** Its own doc comment says
*"three bounds, and each is a different promise"*, the third being *never past what this device can
show* — and the parameter was named `_alongSpan`. The bound was written as a ceiling of
`MAX_ALONG_SPAN`, which is what the widest device can show. **The sentence was true of a screen nobody
was on.**

### 2. The placement is not the sighting, and nothing has ever measured the sighting

⚠️ **A FLANKER IS PLACED OUTSIDE THE LANE, SO IT IS NOT ON THE SCREEN WHEN IT IS PLACED.** It becomes
visible only after crossing `FLANK_MARGIN` — and its `velAlong` is zero, so the camera runs out from
under it at **36 units a second** while it does, with its own `closing` on top of that. Measured: a
charger placed at 120 is first **seen** at 90.

⚠️ **THAT GAP IS WHY THE REPORT SURVIVED TWO FIXES.** 0048 moved the placement. 0197 moved the
placement. Every guard over either asserted the placement. The player sees the **sighting**, and the
two are different numbers — [0027](0027-measure-the-picture-not-the-model.md) is the rule, and this is
it on the spawner rather than on the paint.

⚠️ **AND THE MECHANISM ALREADY EXISTED IN THE FILE, TWENTY LINES AWAY.** The spawner that sends a body
down the lane's far edge writes `e.velAlong = w.scrollPerStep` with the reason spelled out: *"a
steering body is not driven by its motion until it arrives, so it must ride the camera on its own or
fall off the back of the world."* **The flanking spawners never got it.** This is not a new idea; it is
an existing idea applied where it was missed.

## What changes

- **The view is a floor on the entry**, alongside `FLANK_ALONG` and the ship's clear air.
  `MAX_ALONG_SPAN` stays the ceiling. On 16:9 the entry moves 120 → 177.8; on 21:9, 120 → 237. **Both
  are the same sentence — *at the front edge of your screen* — for the first time.**
- **A flanker keeps pace with the camera until it is in the lane**, and lets go the moment it arrives.
  ⚠️ **The hold is ADDED and SUBTRACTED rather than assigned**, because a wave's flanker arrives
  carrying its row's `closing` and a summoned one carries nothing: an assignment has to pick, and
  either pick is wrong somewhere — zero deletes a charger's closing speed, `-closing` hands a boss's
  adds a speed they have never had.

| origin | before | after |
|---|---|---|
| `charger:side` | 90 (51%) | **168 (94%)** |
| `weaver:side` | 101 | **176** |
| `swift:side` | 104 | **177** |
| `sower:side` | 110 | **179** |
| `lancer:side`, `turret:side` | 113–124 | **179–181** |

And the interaction moves with it: `swift:side` in coilward goes from 20% never-firing to **0%**, and
its volleys a body from 1.13 to 1.60.

## What it costs, which is measured and not argued

⚠️ **THREE LEVELS GO DRIER, BECAUSE A BODY THAT ARRIVES AT THE FRONT TAKES LONGER TO REACH THE PLAYER.**

| level | worst held dry, before | after |
|---|---|---|
| coilward | 3.5s | 5.0s |
| **shoal** | **6.1s** | **8.4s** |
| gauntlet | 4.3s | 4.8s |
| approach, descent, batteries, eye | 13.5 / 5.7 / 3.0 / 5.6 | 13.5 / 5.7 / 2.8 / 5.3 |

`DRY_BUDGET_SECONDS` moves **8 → 9**, because its basis moved rather than because it went quiet: eight
was fitted to a measurement taken with a spawner that sighted its flankers two thirds of the way into
the screen, so a gun authored to arrive somewhere arrived next to the player and fired at once.

⚠️ **AND THE FIRST ATTEMPT AT THAT WAS REFUSED BY THE PROOF, WHICH IS THE PART WORTH KEEPING.** At
nine, **0259's own probe stopped firing**: its break — the turret line at 3865 back to a charger column
— now measures 8.4s, *which is the baseline*, because 0338 moved what the baseline is. A budget whose
probe can no longer redden it is not a budget ([0019](0019-a-probe-must-be-seen-to-apply.md)). The
probe is **re-aimed** at the sower at 3232, one of 0259's own conversions and the one inside the worst
stretch, which measures **13.9s**. ⚠️ Re-aiming is what that probe has already had done to it once, by
0326, for this same class of reason — its own comment says so.

⚠️ **AND THE AUTHORING WAY OUT WAS TRIED TWICE AND BOTH ATTEMPTS BROKE SOMETHING ELSE.**

| attempt | what it did |
|---|---|
| the flanking sower at 3405 flipped to lead | **moved the measurement by nothing** — 8.4s before and after. The diagnosis behind it was wrong: that stretch already contains a LEAD sower at 3232 |
| station-holders put in both dry stretches | closed them, and made the shoal's mid-boss fight busier than the stretch before it — [0267](0267-a-fight-thins-the-waves-over-it.md)'s guard |

⚠️ **THE REAL CAUSE OF THE DRYNESS IS ONE 0326 ALREADY WROTE DOWN**: *"with the seen window in, a body
that closes dies at the edge before it fires."* Every gun-carrier in both stretches is a **closer** —
sowers, lancers — and putting the entry at the front leaves them in the player's gun for longer before
they can shoot. That is the fix working, not failing; what it costs is coverage in a level authored
around the old geometry. **Re-authoring it is the player's** — *"when it comes to bullets and enemies,
stop assuming, present a plan"* — and **no wave is moved here.** Nine, not fifteen: the next regression
still has to argue with it.

## A guard was rewritten, and one was written wrong first

⚠️ **`and 0048 is kept` ASSERTED THE CONSTANT RATHER THAN THE PROMISE.** It read
`flankAlongFor(back) === FLANK_ALONG` — so it could only ever hold the number that turned out to be
the defect. 0048's promise is that the entry does not FOLLOW a ship that drops back, and that is what
it asks now. [0192](0192-a-guard-holds-an-invariant.md): a red guard is answered by fixing the defect
or by changing the guard and saying why, never by changing the work to suit it.

⚠️ **AND THE RELEASE GUARD DID NOT FIRE ON ITS OWN BREAK.** Its first draft watched one flanker fall
back over half a second, and the one it caught was a charger — whose `closing` exceeds the camera's
own rate, so it falls back whether the hold is released or not. `npm run prove` said **STILL GREEN**.
The quantity that separates the two cases is the sign of `velAlong`, and it now reads that over every
flanker in every level: 82 of 118 with the break in.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0338`:

| broken on purpose | went red |
|---|---|
| the view dropped from the entry again, so the floor is half of a device nobody is playing on | `THE REPORTED ONE, FOR THE THIRD TIME: a body arriving from the side is first SEEN at the front of the screen` |
| the flanker no longer keeps pace with the camera while it crosses in | the same |
| the hold never released, so a flanker arrives correctly and then hangs at the front of the screen for ever | `it lets go of the screen once it is in the lane` |

⚠️ **THE TWO HALVES EACH REDDEN THE SIGHTING GUARD ALONE — 54% without the floor, 74% without the
hold — WHICH IS THE PROOF THAT BOTH WERE NEEDED.** Either one on its own leaves the report standing,
and a fix that moved only the placement is precisely what shipped twice.

## What this deliberately does not do

- **It does not touch `FLANK_ALONG` itself.** It is still the floor that stops a player at the back
  dragging their ambushes forward, and it is still 0048's. What changed is that it is no longer the
  only floor.
- **It does not re-author a single wave.** The dry stretches are content and the standing instruction
  covers them.
- **It does not change what a body does once it has arrived** — no speed, no cadence, no motion arm.
- **It has not been played.** Everything above is the instrument; whether the front of the screen is
  now where these things want to be is the screen's answer.
