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
| an intermittent guard is measuring the wrong thing | [0044](decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) |
| the class prefix rule, on the trigger 0017 named | [0017](decisions/0017-the-state-is-slices.md), [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) |

⚠️ **Flight is closed and content may now be authored against it.** `SHIP_SPEED`, `SCROLL_PER_STEP`,
`FLIGHT_RESPONSE` and `DRAG_GAIN` were each played on real hardware and three of the four were
deliberately left alone — [`drag-feel`](../reports/drag-feel-2026-08-05.md) has the ordering and
[`inertia-played`](../reports/inertia-played-2026-08-05.md) closes it.

⚠️ **`STARTING_LIVES` is NOT closed.** Three is a starting point placed by a hand, in the same
category [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) puts it in as the
flight constants before they were played. There are now two full levels to lose it in, and it has
still never been played.

## What the game currently is

**A two-level run, playable start to finish, and played.** A title screen with a key to the pickups,
three lives, six enemy kinds, two authored levels of about three minutes each, weapon upgrades and
extra lives lying about in them, a lives-and-shield readout while playing, a unique boss at the end
of each level, a screen between them, and a victory screen after the second.

Each level opens on an empty screen so the player can find the controls before anything finds them —
[0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md).

Nothing is *triggered*: the arsenal — the specials a player spends — is still a list with nothing in
it. Difficulty was last placed by a hand at *"intro to 50% of the first level"* —
[`ship-speed-settled`](../reports/ship-speed-settled-2026-08-05.md), which is now two levels out of
date and is exactly what a play-test is for.

## What the play-test still has to answer

Questions, not findings — each one a number nothing in the repository can settle.

⚠️ **The first pass has happened**, and the verdict was *"playing really good at the moment, excellent
baseline"*. Four things came back from it and all four are fixed:
[0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) has the weapon and the
opening; [0045](decisions/0045-the-player-can-see-what-they-are-carrying.md) has the readout and the
key. The questions below are the ones it did **not** answer.

- **Is the boss's progress readable at all?** Nothing says how much of it is left, by decision —
  [0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md) names this as the thing that
  build exists to find out.
- **Is three lives right**, and is twenty seconds the right ceiling on how long a death leaves the
  player unarmed? [0041](decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md) picked that
  number without having played it.
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

**1 — The arsenal: specials, and what a trigger spends.**

`src/content/specials.ts` has the union and the rows; nothing fires one. The input half has existed
since [0030](decisions/0030-input-is-actions-and-needs-no-new-layer.md) — `SPECIAL_BINDINGS` and
`Intent.specials` — and nothing consumes it either. The run slice already carries the arsenal as a
list, so this adds behaviour to a shape rather than changing one.

**2 — The chart, and more levels behind it.**

A level is a row in `LEVELS` and the sequence is that list —
[0042](decisions/0042-a-run-is-a-sequence-of-levels.md). What does *not* exist is the branching map
`docs/game.md` puts between levels, and 0042 says why a straight line came first: a chart is a
screen, a graph and a set of rules about what may follow what, and all three want deciding against
levels somebody has played.

Also still unlocked and still not done: **entry from the `across` edges.** Everything arrives at the
leading edge because that is the only spawn rule written, not because of any constraint —
[`enemy-silhouettes`](../reports/enemy-silhouettes-2026-08-05.md) has the argument, and names the one
real gap that comes with it (there is no `across` cull).

**3 — `save/`, and the first `itc_*` key.**

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
