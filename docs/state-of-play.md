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
| the class prefix rule, on the trigger 0017 named | [0017](decisions/0017-the-state-is-slices.md), [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) |

⚠️ **Flight is closed and content may now be authored against it.** `SHIP_SPEED`, `SCROLL_PER_STEP`,
`FLIGHT_RESPONSE` and `DRAG_GAIN` were each played on real hardware and three of the four were
deliberately left alone — [`drag-feel`](../reports/drag-feel-2026-08-05.md) has the ordering and
[`inertia-played`](../reports/inertia-played-2026-08-05.md) closes it.

⚠️ **`STARTING_LIVES` is NOT closed.** Three is a starting point placed by a hand, in the same
category [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) puts it in as the
flight constants before they were played. It cannot be settled before there is a full level to lose
it in.

## What the game currently is

**One playable level, end to end, with no upgrades.** A title screen, three lives, five enemy kinds,
an authored wave script of about three minutes, and a boss with phases keyed to its health — then a
level-clear screen. Nothing is picked up and nothing is spent: the arsenal is a list with nothing in
it, which is what makes this a **baseline** rather than the game. Difficulty was last placed by a
hand at *"intro to 50% of the first level"* —
[`ship-speed-settled`](../reports/ship-speed-settled-2026-08-05.md).

## What the first play-test of level one has to answer

Questions, not findings — each one a number nothing in the repository can settle.

- **Is the boss's progress readable at all?** Nothing says how much of it is left, by decision —
  [0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md) names this as the thing that
  build exists to find out.
- **Is three lives right**, and is a level that empties the arsenal on death too punishing before
  there is anything to pick up?
- **Do the weaver and the charger read apart?** Both are essentially lines, told apart by which way
  they lie — `src/content/sprites.ts` writes that risk down rather than assuming it away.
- **Do enemy shots ever land?** [0034](decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)'s
  `spit` speed and the fire rates have never been felt by an attentive player, and the turret is the
  row that exists to test them —
  [`ship-speed-settled`](../reports/ship-speed-settled-2026-08-05.md) has the measurement they
  replace.

## What is next, and why in this order

**1 — Pickups: extra lives, and weapon upgrades.**

Owed by [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md), which made a level's
**pickup density load-bearing** by emptying the arsenal on a death — a constraint level one does not
yet answer. An extra life is the first pickup whose effect is on the **run** rather than on the ship,
which is a category `src/content/` has no shape for.

**2 — The arsenal: specials, and what a trigger spends.**

`src/content/specials.ts` has the union and the rows; nothing fires one. The input half has existed
since [0030](decisions/0030-input-is-actions-and-needs-no-new-layer.md) — `SPECIAL_BINDINGS` and
`Intent.specials` — and nothing consumes it either. The run slice already carries the arsenal as a
list, so this adds behaviour to a shape rather than changing one.

**3 — Level two, and therefore the chart.**

A second level is a row in `LEVELS` —
[0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md) made that a table edit. What it
is *not* yet is a destination: `docs/game.md` puts a branching chart between levels, and nothing
knows how to move from one to the next.

Also still unlocked and still not done: **entry from the `across` edges.** Everything arrives at the
leading edge because that is the only spawn rule written, not because of any constraint —
[`enemy-silhouettes`](../reports/enemy-silhouettes-2026-08-05.md) has the argument, and names the one
real gap that comes with it (there is no `across` cull).

**4 — `save/`, and the first `itc_*` key.**

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

**Theming level one to a biome.** `docs/game.md` themes levels on the fourteen *Far Carry* biomes and
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
