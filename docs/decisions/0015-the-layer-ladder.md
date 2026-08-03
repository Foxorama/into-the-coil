# 0015 — The layer ladder: seven layers, a one-way arrow, and a capability per layer

**Accepted 2026-08-04**, the first of the three code conventions the constitution had been holding
open. Landed with [0016](0016-a-hub-enumerates-kinds.md) and [0017](0017-the-state-is-slices.md).

## The rule

`src/` is a **closed set of layers**. Each declares what it holds, which layers it may import, and
which capabilities it may reach for. A directory that belongs to no layer fails the build's test
run; so does a file loose at the root of `src/`.

| layer | holds | may import | may reach for |
|---|---|---|---|
| `brand.ts` | name, id, version, build | — | — |
| `sim/` | the model: state types, `step`, the seeded generator, the stage contract | brand | — |
| `content/` | the tables: enemies, waves, weapons, upgrades, stages | brand, sim | — |
| `state/` | screens, actions, the sliced reducer | brand, sim, content | — |
| `save/` | the persisted schema and its migration chain | brand, sim, content, state | storage |
| `render/` | painters: model and state in, pixels out | brand, sim, content, state | DOM |
| `app/` | the shell: boot, the rAF loop, input, audio, wiring | everything | everything |

The four capabilities are **DOM, clock, randomness and storage** — the things a module reaches for
that are not another module. Below `app/`, time and randomness are *arguments*: the shell owns the
one rAF loop and the one seed draw and passes both down.

`src/main.ts` is the composition root and counts as `app/`. It stays where it is because that path
is the build's entry, named by `index.html`; moving a shipped surface to make a table tidier is the
wrong trade.

The enforcement is `tests/layering.test.ts`.

## Why a graph and not a size limit

Because size was measured and it does not predict pain. Across all 822 commits of the predecessor,
`app.ts` was 4,588 lines and appeared in **35.2%** of commits; `render/constellations.ts` was 2,628
lines and appeared in **0.6%**. Same order of size, sixtyfold difference in cost.

**A line ceiling cannot tell those two apart.** Set at a thousand lines it flags both — and it flags
the healthy one *first*, because the healthy one is the file nobody is editing, so it is the easy
one to "fix". What separates them is direction: `app.ts` is where every arrow meets. So the property
held here is which way modules may point, and the size signal is left where it belongs — advisory,
in the weekly hotspots report, gating nothing so there is no incentive to game it.

## Why `mayImport` is a list and not a rank

`save/` and `render/` sit at the same height and neither may import the other. No linear ordering
can say that: a ladder has to put one beneath the other and thereby permits an edge that is wrong in
both directions. A painter that can read the save reads it mid-frame; a save layer that can reach a
painter persists a view. The list is a `Record` over the closed union, so a new layer fails to
compile until every question about it has been answered, and a separate assertion proves the
declared graph is acyclic.

## Why the capability bans matter more than the import rules

An import violation looks wrong in review. A capability reach does not: `Date.now()` in a painter
and `Math.random()` in the model are the most ordinary lines in the world, no compiler objects, and
what they cost is invisible until much later — a stage that stops replaying from its seed, a frame
that renders differently on a slow machine, a bug report that cannot be reproduced. The predecessor
kept this discipline by convention and it mostly held, with one instructive exception: its render
layer carried a **private copy of the PRNG**, deliberately, so scenery could never perturb the
stream that spawned the boss's volleys. That is the right instinct and it is what `allows: []` on
`render/` encodes — a painter gets a seeded generator handed to it, never `Math.random`.

## Rejected: folding `content/` into `sim/`

It is where the predecessor put its tables, and it would be one fewer layer. Rejected because the
measurement in [0016](0016-a-hub-enumerates-kinds.md) only reads if rows and logic are separable:
the coldest table took 0.4% of commits, the hottest 6.2%, and **the two hottest were the two that
held logic as well as rows**. A directory whose entry condition is "rows only" is a place that fact
can be checked. Inside `sim/` it is a naming convention nobody can test.

## Rejected: exempting type-only imports

`import type` creates no runtime edge, so a rule that ignored it would be cheaper to obey. Rejected
because the coupling that hurts is the *type* coupling — the predecessor's simulation layer is
unliftable precisely because `ShotDecision` carries `clubId` and `Hole` carries `par`, and every one
of those is a type. An arrow that only counts runtime edges would have called that layer clean.

## Rejected: enforcing the arrow with a linter

An import-boundary lint rule exists off the shelf. Rejected because it would be a second description
of the same fact, in a config file, with the reasoning nowhere — and because the capability bans have
no lint equivalent, so the scan has to exist regardless. One test holds both, and its failure message
can argue with you.

## What this deliberately does not decide

File naming, function size, comment style, where a helper goes inside a layer. Those wait, on the
same reasoning that kept these three open: writing them before there is code to write them about
means writing them twice.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md), every assertion was watched failing before it was
trusted. The layers were empty at the time, so each break was a planted file, removed afterwards.

| broken on purpose | went red |
|---|---|
| `src/sim/step.ts` importing `../render/hud.ts` | `no module imports a layer it was not given` |
| `Math.random()` in `src/sim/step.ts` | `no layer reaches for a capability it was not granted` |
| `performance.now()` in `src/render/hud.ts` | the same test, naming `clock` and the layer |
| `import { readFileSync } from 'node:fs'` in `src/sim/` | `src/ imports nothing from outside src/` |
| a planted `src/audio/` directory | `every directory under src/ is a declared layer` |
| a planted `src/loot.ts` | `every file at the root of src/ is declared` |
| `brand`'s `mayImport` set to `['app']` | `the arrow points one way — the declared graph has no cycle` |
| the `random` pattern typo'd to `Math\.randon` | `every capability pattern matches its own sample` |

⚠️ The last row is the one worth keeping. The first attempt to plant that typo was a `node -e`
one-liner whose escaping did not survive, so the file was never modified and the suite reported
green — **the guard looked proven and nothing had been changed**, which is failure #9 in
`NEXT-TIME.md` reproducing itself inside the session that was citing it. The edit was redone
directly and the test went red.
