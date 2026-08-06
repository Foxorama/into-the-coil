# State of play

**Where the project is and what comes next.** Read it after `CLAUDE.md` and `docs/game.md`, before
proposing work.

⚠️ **This file holds POINTERS AND INTENTIONS, never findings.** Every conclusion below lives in a
decision or a report and is linked, not summarised —
[0029](decisions/0029-the-tracked-record-is-the-record.md) says a document restating another cites
the line, *"because a summary is a second copy, and one drifted here inside a single day."* If you
find yourself explaining a result here rather than linking it, it belongs somewhere else.

**Maintained**, unlike `reports/`. It is rewritten as things land; it is not a log.

---

## What is settled

| | |
|---|---|
| the scaffold, CI, release, staging, a live origin | [0011](decisions/0011-three-environments-and-a-separate-origin-for-staging.md), [0012](decisions/0012-a-release-is-a-tag-and-a-deploy-must-prove-itself.md) — v0.1.0 live |
| the layer ladder, hubs, slices, seeded rng | [0015](decisions/0015-the-layer-ladder.md), [0016](decisions/0016-a-hub-enumerates-kinds.md), [0017](decisions/0017-the-state-is-slices.md), [0021](decisions/0021-one-stream-per-concern.md) |
| the frame budget, and how it is enforced | [0022](decisions/0022-frame-rate-is-a-feature.md), [0025](decisions/0025-the-frame-budget-is-counted-not-timed.md) |
| landscape only, the long axis is the scroll axis | [0023](decisions/0023-the-long-axis-is-the-scroll-axis.md), [0031](decisions/0031-landscape-is-the-shipped-orientation.md) |
| three input devices, input is actions | [0030](decisions/0030-input-is-actions-and-needs-no-new-layer.md), [0032](decisions/0032-touch-is-relative-drag-and-not-a-stick.md) |
| bullets, contact, death | [0034](decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md) |
| damage is legible; a death is drawn | [0035](decisions/0035-damage-is-legible-on-the-body-that-took-it.md), [0036](decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md) |
| flight — all four constants have a hand behind them | [0037](decisions/0037-the-ship-has-mass.md), [`inertia-played`](../reports/inertia-played-2026-08-05.md) |
| **what a run is: three lives, and a death costs the arsenal** | [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) |
| **a level is a script; a boss is phases keyed to health** | [0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md) |
| **pickups: extra lives, and upgrades a death takes back** | [0041](decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md) |
| **a run is a sequence of levels; the order is the list** | [0042](decisions/0042-a-run-is-a-sequence-of-levels.md) |
| a weapon is a budget; a level opens empty | [0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) |
| lives and shield on screen; a key on the title | [0045](decisions/0045-the-player-can-see-what-they-are-carrying.md) |
| **a pad can press a button; a run-over screen expires** | [0046](decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md) |
| **difficulty is a tier, and the easy one is the content** | [0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md) |
| **a threat may arrive from the side; a shot stops at the edge** | [0048](decisions/0048-a-threat-may-arrive-from-the-side.md) |
| **the chrome is authored against the short axis** | [0049](decisions/0049-the-chrome-is-authored-against-the-short-axis.md) |
| **the ship is one hit; a shield is what stands in front of it** | [0050](decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md) |
| **a missile is the second auto-weapon; a launcher is a place on the ship** | [0051](decisions/0051-a-missile-is-the-second-auto-weapon.md) |
| **a pickup is two things, and the camera says which** | [0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md) |
| **the bomb is the first thing the player spends** | [0053](decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md) |
| **the missile is earned; a pickup reaches 6% of the lane** | [0056](decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md) |
| an intermittent guard is measuring the wrong thing | [0044](decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) |
| **a probe runs on a disposable copy, and copies run in parallel** | [0054](decisions/0054-the-proof-runs-beside-the-work-not-on-it.md) |
| **a press belongs to one screen; a released stick is not an ask** | [0055](decisions/0055-a-press-belongs-to-one-screen.md) |
| the class prefix rule, on the trigger 0017 named | [0017](decisions/0017-the-state-is-slices.md), [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) |

⚠️ **Flight is closed and content may now be authored against it.** `SHIP_SPEED`, `SCROLL_PER_STEP`,
`FLIGHT_RESPONSE` and `DRAG_GAIN` were each played on real hardware and three of the four were
deliberately left alone — [`drag-feel`](../reports/drag-feel-2026-08-05.md) has the ordering and
[`inertia-played`](../reports/inertia-played-2026-08-05.md) closes it.

⚠️ **How many lives a run starts with is NOT closed, and there are now three answers rather than
one.** `STARTING_LIVES` is gone as a constant — it is a column in `src/content/difficulty.ts` —
and [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) puts each of the three in
the same category as the flight constants before they were played. None of them has been.

## What the game currently is

**A two-level run, playable start to finish, and played.** A title screen that is the difficulty
choice and carries a key to the pickups, six enemy kinds, two authored levels of about three minutes
each, weapon upgrades and extra lives lying about in them, a lives-and-shield readout while playing,
a unique boss at the end of each level, a screen between them, and a victory screen after the second.
Keyboard, touch and gamepad all reach every screen; the run-over screen gives up after seven seconds.

Each level opens on an empty screen so the player can find the controls before anything finds them —
[0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md).

Nothing is *triggered*: the arsenal — the specials a player spends — is still a list with nothing in
it. Difficulty was last placed by a hand at *"intro to 50% of the first level"* — which is now the
easiest of three tiers as well as two levels out of date —
[`ship-speed-settled`](../reports/ship-speed-settled-2026-08-05.md), which is now two levels out of
date and is exactly what a play-test is for.

## What the play-test still has to answer

Questions, not findings — each one a number nothing in the repository can settle.

⚠️ **The first pass has happened** —
[`two-levels-played`](../reports/two-levels-played-2026-08-06.md) has the verdict, the four findings
and their measurements. All four are fixed:
[0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) and
[0045](decisions/0045-the-player-can-see-what-they-are-carrying.md). The questions below are the ones
it did **not** answer.

- **Is the boss's progress readable at all?** Nothing says how much of it is left, by decision —
  [0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md) names this as the thing that
  build exists to find out.
- **Is any of the three life counts right**, and is twenty seconds the right ceiling on how long a
  death leaves the player unarmed?
  [0041](decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md) picked that number without
  having played it, and item 4 below makes a death cost considerably more.
- **Are the two harder tiers anywhere near their targets?** *"Level four with challenge"* and
  *"maybe the end boss of level two"* are the numbers
  [0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md) was sized against,
  and only the easiest tier — the one that changes nothing — has ever been played.
- **Do the two upgrades read on screen?** `docs/game.md` says every upgrade changes how the ship
  looks, and neither of these does yet — they change what leaves it, and the title screen now says
  what they are ([0045](decisions/0045-the-player-can-see-what-they-are-carrying.md)).
- **Do the weaver and the charger read apart?** Both are essentially lines, told apart by which way
  they lie — `src/content/sprites.ts` writes that risk down rather than assuming it away.
- **Do enemy shots ever land?** [0034](decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)'s
  `spit` speed and the fire rates have never been felt by an attentive player; the turret and the
  warden are the rows that exist to test them —
  [`ship-speed-settled`](../reports/ship-speed-settled-2026-08-05.md) has the measurement they
  replace.
- **Is level two a different game or the same one denser?**
  [0042](decisions/0042-a-run-is-a-sequence-of-levels.md) claims the harrow takes away the lane the
  sentinel taught the player to hold. That is a claim about how a fight feels, and nothing in this
  repository can check it.
- **Does a run that survives a level boundary feel like one run?** Six minutes is longer than
  anything here has been played end to end.

## What is next, and why in this order

**The order below is the player's, given 2026-08-06.** It is not the order the dependencies would
have picked, and that is fine. **Three of the six have landed**; what is left is marked, and item 4
is the large one.

**1 — ✅ DONE. A gamepad can press a button; the run-over screen expires.**

[0046](decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md). The bug was architectural
rather than a binding, and 0030's claim survived with one distinction added: a menu is not the game,
so its confirm button is not `special1`.

**2 — ✅ DONE. Difficulty tiers, chosen before a run.**

[0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md). Three tiers on the
title screen, the easiest one multiplying nothing, and a tier that lives on the run rather than on
the assist ladder — which could not have held it.

⚠️ **The two harder tiers are guesses against a stated target and have never been played.** *"Level
four with challenge"* and *"maybe the end boss of level two"* are the numbers to measure the next
play-test against, and there are only two levels to do it in.

**3 — ✅ MOSTLY DONE. Where things come from, and where a shot stops.**

[0048](decisions/0048-a-threat-may-arrive-from-the-side.md) landed five of the six: entry from the
`across` edges and its cap, the `across` cull, the drifting pickups, the flanker's turn — the first
motion in the game that is not a function of `along` — and the reported shot-range bug.

**What remains is the density pass, and it is deliberately last.**

*"Increasing enemy waves"* is a tuning question, and the thing that answers it is a hand rather than a
guard. Two reasons to do it after item 4 rather than before:

- **The middle tier is waiting on it.** 0047's *"level four with challenge"* was sized against a ship
  with five health. Item 4 makes the ship one hit, which moves the answer more than any wave table
  will.
- **Density is a property of the VIEW, not of the gap between waves** —
  [0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md), which also records that its
  own density guard has been a sieve twice. Read that before touching a number.

⚠️ **Pool headroom is the constraint, not the authoring.** The pools total exactly
[0022](decisions/0022-frame-rate-is-a-feature.md)'s 500-entity worst case — see `CAPACITY` in
`src/app/mount.ts`, and `tests/budget.test.ts` now refuses a total above it. Item 4 has since spent
35 of those slots on the shell, the missiles and the bomb, all out of the particle share. More
enemies on screen at once is a budget question that has to be settled against what is left.

⚠️ **`tests/level.test.ts`'s density floor holds ≥ 8 in one lookahead and both levels sit not far
above it.** It is a floor, not a target, and raising it to match whatever the tuning pass settles on
would make it a copy of the content rather than a guard over it.

**4 — ✅ DONE. The ship is one hit, and it carries shields, missiles and bombs.**

⚠️ **Asked for as one list on 2026-08-06, and it is four changes that only make sense together** —
the ship becoming fragile is what the other three exist to answer. Written out here in the player's
own terms so a later session does not have to reconstruct the ask; every number in it is a starting
point, not a decision.

**ALL FOUR HAVE LANDED** —
[0050](decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md),
[0051](decisions/0051-a-missile-is-the-second-auto-weapon.md) and
[0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md). The hull is one hit, a
shield is a pickup capped at three, the HUD's pips are the shell, and the ship wears a ring per
shield; missiles fire themselves from one to three launchers; and every pickup on the field is two
things, flipping together with the camera. The special that was called `shield` is now `mines`, which
is what 0045 said would happen.

The bomb is the fourth: the first triggered special, the first consumer of the input half 0030
landed, and the first thing to put a number in 0039's arsenal —
[0053](decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md).

⚠️ **What 0050 leaves owed is the tiers.** 0047's two harder ones were sized against a five-health
ship and neither has been played since, and `resilience: hardy` is now a rung that does nothing.

*Cycling pickups — **done**, [0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md).*
The three pairs are the ones asked for, the phase is a distance rather than a duration, and a level
authors the pair with the camera picking the face.

⚠️ **It amends 0050's line about the opening shield**: what a player finds in the empty opening
stretch is now a shield *or* an extra life. Both answer the question a one-hit hull asks, and
`src/content/levels.ts` says so where the pickup is authored.

⚠️ **The title screen's key lists all six faces and does not say that a pickup alternates.**
`docs/game.md` puts hints *where play proves they are needed, never pre-emptively*, so whether that
reads as *six pickups* rather than *three that change* is a play-test question.

*Bombs — **done**, [0053](decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md).* Two
charges to start, one more per level cleared, thrown forward and detonating 80 world units ahead — the
ask's fraction of the screen, authored against the reference view because 0023 refuses screen space.
Six pulses of damage inside a third of the lane, landing once, on everything in it **including the
ship**.

⚠️ **What it left behind is a play-test question and a bug that is already fixed.** The question:
whether a blast that is dangerous only on the step it appears reads as fair, when the ring it leaves
stays on screen for a fifth of a second afterwards. The bug: the readout only refreshed when the
SCREEN changed, which nothing had noticed because lives and shields both moved at screen boundaries —
0053 has it, and `tests/hud.browser.test.ts` now drives a spent charge.

⚠️ **Pool headroom was the binding constraint and it held.** `CAPACITY` in `src/app/mount.ts` still
totals exactly [0022](decisions/0022-frame-rate-is-a-feature.md)'s 500-entity worst case:
`tests/budget.test.ts` refuses a total above it, and the shell (3), the missiles (24) and the bomb
with its blast (8) all came out of the particle share, which is the only share 0022 names as
sheddable.

**5 — The chart, and more levels behind it.**

A level is a row in `LEVELS` and the sequence is that list —
[0042](decisions/0042-a-run-is-a-sequence-of-levels.md). What does *not* exist is the branching map
`docs/game.md` puts between levels, and 0042 says why a straight line came first: a chart is a
screen, a graph and a set of rules about what may follow what, and all three want deciding against
levels somebody has played.

**6 — `save/`, and the first `itc_*` key.**

Requires the run slice, which now exists. Lands with `PRIVACY.md`'s storage-key table and a guard
cross-checking `src/` in both directions, which `docs/scaffold-plan.md` has been holding open since
the scaffold *"until the first one is real"*. Carries a rollback note —
[0001](decisions/0001-revertability-not-risk-rating.md). The schema it persists is decided:
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) says current lives, current
arsenal, and the level to resume at.

## Deliberately not next

**The character roster**, beyond what a wave table needs. `src/content/ships.ts` has one row and it is
deliberately not one of `docs/game.md`'s four golfers; authoring characters is expensive to redo and
it is downstream of everything above.

**Theming the levels to biomes.** `docs/game.md` themes levels on the fourteen *Far Carry* biomes and
names none of them, so picking one means going to the predecessor for material — which `CLAUDE.md`
allows only for a named file and a named reason. It is a one-line table edit whenever that reason
exists.

**Anything about flight.** It is settled. The keyboard's eight directions are inherent to binary keys
and are **not** a defect to be tuned away — [0037](decisions/0037-the-ship-has-mass.md) records why a
ramp cannot fix it, so a later session need not rediscover that.

**A pause screen and a settings screen.** Both are real and neither is urgent. They are also what
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) names as the trigger for the
back-intent switch [0017](decisions/0017-the-state-is-slices.md) still defers, so whichever lands
first carries it.

## Still open, and small

- **A cheat code, for testing the levels nobody can reach.** Asked for alongside the tiers: *"5, 6, 7
  I'd need to put in a code for invulnerability or something (doesn't currently exist)."* Half of it
  already does — `src/sim/assist.ts`'s `resilience: 'proof'` is exactly no damage taken, and nothing
  switches it on. ⚠️ It is an ASSIST, so
  [0024](decisions/0024-the-accessibility-floor-is-settings.md) already permits it and
  [0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md) keeps it off the
  tier axis; what is missing is a way to reach it and a decision about whether a run flown that way
  may finish.

- **itch**: `BUTLER_API_KEY`, the *played in the browser* flag, and the channel. `docs/scaffold-plan.md`
  has the list; none of it is code.
- **A hand measurement on a physical 2021-class Android**, once, to calibrate the frame budget's
  counts against milliseconds — owed by [0022](decisions/0022-frame-rate-is-a-feature.md) and
  restated by [0025](decisions/0025-the-frame-budget-is-counted-not-timed.md).
- **Audio.** Nothing exists. `docs/game.md` says synthesised either way.

## How to check the things this file cannot know

```bash
gh pr list
```

Open work is not recorded here on purpose — it is the fastest thing in the project to go stale, and
`gh` is the truth. Same for the build under test: `docs/machine.md` has the branch-preview URL format
and the byte-count check.
