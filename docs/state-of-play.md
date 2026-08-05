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

A proof scene in `src/app/frame.ts`, wrapped in a real run: a title screen, three lives, a death that
spends one, and a game over that ends it. Its own comment still says the scene is not the game — one
ship, two enemy kinds, one shot each way, one spawn rule. Difficulty was placed by a hand at *"intro
to 50% of the first level"* — [`ship-speed-settled`](../reports/ship-speed-settled-2026-08-05.md).

## What is next, and why in this order

**1 — Waves, and the first real level content.**

⚠️ **This is where the bullet threat model finally gets exercised, and it has never been felt.** Every
hit in every play-test so far has been *contact*; no enemy shot has ever landed on an attentive
player, because the dodge has roughly thirty times the room it needs. `spit`'s speed and the
lancer's fire rate are still the reasoned starting points 0034 shipped —
[`ship-speed-settled`](../reports/ship-speed-settled-2026-08-05.md) has the measurement. The honest
place to settle them is a wave that actually puts shots in the air.

Also unlocked here: **entry from the `across` edges.** Everything currently arrives at the leading
edge because there is one spawn rule, not because of any constraint —
[`enemy-silhouettes`](../reports/enemy-silhouettes-2026-08-05.md) has the argument, and names the one
real gap that comes with it (there is no `across` cull).

And owed by [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md): **a level's
pickup density is load-bearing** now that a death empties the arsenal, and **extra lives are
findable**, which is the first pickup whose effect is on the run rather than on the ship.

**2 — `save/`, and the first `itc_*` key.**

Requires the run slice, which now exists. Lands with `PRIVACY.md`'s storage-key table and a guard
cross-checking `src/` in both directions, which `docs/scaffold-plan.md` has been holding open since
the scaffold *"until the first one is real"*. Carries a rollback note —
[0001](decisions/0001-revertability-not-risk-rating.md). The schema it persists is decided:
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) says current lives, current
arsenal, and the level to resume at.

**3 — The arsenal: specials, and weapon upgrades.**

`src/content/specials.ts` has the union and the rows; nothing fires one. The input half has existed
since [0030](decisions/0030-input-is-actions-and-needs-no-new-layer.md) — `SPECIAL_BINDINGS` and
`Intent.specials` — and nothing consumes it either. The run slice already carries the arsenal as a
list, so this adds behaviour to a shape rather than changing one.

## Deliberately not next

**The character roster**, beyond what a wave table needs. `src/content/ships.ts` has one row and it is
deliberately not one of `docs/game.md`'s four golfers; authoring characters is expensive to redo and
it is downstream of everything above.

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
