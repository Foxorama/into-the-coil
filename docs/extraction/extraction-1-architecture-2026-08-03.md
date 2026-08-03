# Extraction audit 1 — architecture

**Source:** `Golf-Stars` / The Far Carry, at `main` (1.5.0, commit 5ae875d)
**Target:** *Into the Coil* — landscape, wave-based arcade shooter (R-Type / Contra idiom), same fictional universe
**Date:** 2026-08-03
**Scope:** read-only analysis. Nothing modified but this file.

Every claim below is marked **[verified]** (I opened the file and read the code) or **[assumed]**
(inferred from a name, a doc comment, or a doc file without reading the implementation).

---

## ONE-PAGE SUMMARY

### The five things most worth taking

**1. `battleFrame.ts` — the orientation-agnostic camera, and the rule underneath it.**
`src/render/battleFrame.ts` (124 lines, pure, DOM-free) fits a 1000×600 landscape design frame to any
container, rotating 90° CCW when rotating buys scale, and hands back a *separate always-upright HUD
frame* [verified]. The load-bearing idea is not the rotation — it is that **the fight never leaves
design space**: positions, hitboxes, speeds, spawn patterns and phase timings are all in design units,
and the frame is a camera applied at draw time only [verified, `applyWorld` at
`src/render/storyBattle.ts:410`]. Your new game inverts the polarity (composed landscape, rotate for a
portrait phone) but the module transfers essentially as-is. It is the single highest-value 124 lines in
this repo for you.

**2. `battleArms.ts` + `planMounts` — per-entity weapon mounts as a compile-forced table.**
`Record<ShipLook['kind'], ShipArms>` at `src/render/battleArms.ts:82` means a new hull silhouette *fails
to build* until its guns are decided [verified]. Hardpoints are hull-local normalised coords
(`along`/`across`, −1..+1), so a mount stays welded at any camera scale or orientation
[verified, `mountOffset` at :253]. `planMounts` (:225) mirrors a one-sided mount set when the camera
turns — a side elevation legitimately quotes each flank gun once; a plan view must not
[verified]. And the split it enforces is directly reusable doctrine: **the upgrade decides what a shot
DOES; the hull decides where it is born and how it reads** [verified, module header].

**3. The save layer's three-way classifier: `readSave` → `integrity` → read-only.**
`src/save/schema.ts:1067` returns `{ok:true}` / `{ok:false, why:'newer'}` / `{ok:false, why:'foreign'}`,
and `migrate()` (:1191) is a four-line wrapper over it [verified]. A fault latches a module singleton
(`src/save/integrity.ts:61`) that puts every writer into read-only (`writeSave` at
`src/save/storage.ts:60`) [verified]. This exists because itch.io serves every HTML5 game from one
shared CDN origin, so your key sits in a bucket with strangers' data — a fact that will be **exactly as
true for Into the Coil** [verified, `integrity.ts:14-17`]. This is ~200 lines of code that prevents a
whole class of data loss you would otherwise ship and discover from a player.

**4. `backIntent` — one pure back/Escape decision with a `never` exhaustiveness guard.**
`src/ui/back.ts:76-171`. A four-tier precedence walk (dismiss overlay → navigate to parent → swallow
forward-only beats → confirm-then-leave), and the `default:` arm assigns `screen` to `never`, so
**adding a screen to the union fails to compile until someone decides what back means on it**
[verified, :164-169]. Hardware back, desktop Escape, and on-screen back buttons all route through it, no
forks [verified, module header]. Costs you nothing to adopt on day one and is un-retrofittable cheaply
later.

**5. The accessibility trio: `focus.ts`, `announce.ts`, and the four-token type system.**
`src/app/focus.ts` runs ONE pass at the end of every render that makes whatever overlay is mounted a
real `role="dialog"` with `inert` backgrounding and selector-based focus restore — so **a new overlay
gets the behaviour by existing** [verified, :110-184]. `focusPlayStroke` (:210) puts the keyboard on the
primary action every time the decision changes, keyed on the *decision* not the render [verified].
`announce.ts` is pure sentence builders + a live region that lives OUTSIDE the re-rendered root
[verified, :14-17, :36-57]. And `--gs-font` / `--gs-uiscale` / `--gs-track` / `--gs-wordspace` are the
only way the app expresses type, enforced by a source scan [verified, `settings.ts:144-155`,
`viewportFit.ts:82-84`]. For a twitch shooter the *specific* a11y answers differ, but the
architecture — one post-render pass, pure sentence builders, four root tokens, one `reducedMotion()`
seam — transfers whole.

### The three things that look reusable and are traps

**Trap 1 — `src/sim/`. It reads as "the pure deterministic simulation layer". It is a golf engine.**
The public shape is genuinely excellent, and the *discipline* is the transferable part. But the code is
fused to the domain at the type level: `ShotDecision` carries `clubId` and `aim: 'attack'|'safe'|'auto'`
(`sim/rpg/play.ts:49-60`), `HolePlay` carries `putts`, `fairwayHit`, `pickedUp`
(:62-79), and the course contract's `Hole` has `par`, `tee`, `green`, `pin`, `greenSlope`,
`greenContour` [verified, `contract.ts:81-162`]. `round.ts` is 3,119 lines; `generate.ts` is 2,985.
**I cannot describe the sim's shot resolution without saying "club", "carry", "lie" and "green" — that
entanglement is the finding.** Take `rng.ts` (95 lines), take the *rules*, write your own sim.

**Trap 2 — the manifest, the service worker and the Android shell look like config. They are three
half-independent identity declarations, and one of them is already wrong in this repo.**
`public/manifest.webmanifest:9` says `"orientation": "portrait"` — an active hazard for a landscape
game [verified]. The SW cache prefix `far-carry-` is **one decision written in three files that cannot
share a constant** (`public/sw.js:22`, `public/sw.js:50`, `index.html:3363`) and index.html *deletes
every cache not carrying it*, so a disagreement makes the app nuke its own offline snapshot every boot
[verified, guarded only by `tests/brand.test.ts:81`]. And `android/app/src/main/res/values/strings.xml:3`
still reads **`Golf Stars`** — the launcher label under the icon never moved with the rename
[verified; no test covers `app_name` — I grepped `tests/` and `scripts/` and found nothing]. Copying
this tree forward without the table in §2 will ship a landscape shooter that installs as a portrait PWA
called Golf Stars.

**Trap 3 — `storyBattle.ts` is the boss fight you want, and it is 2,709 lines in one closure with a
hand-rolled RNG, its own DOM overlay, and no test that runs the fight.**
The fight loop, projectile pools, phases, hitstop, flinch spring, entrance, HUD and eleven painters all
live inside `mountStoryBattle()` [verified, `:161` to end]. It has a **private mulberry32 copy** at
`:118-127` rather than importing `sim/rng.ts` [verified] — because it is render-layer and the sim's
determinism contract deliberately does not extend to it. It creates its own `<div>`, canvas, skip button
and rAF loop [verified, :186-198]. Its extracted pure parts (`battleFrame`, `battleIntro`, `battleArms`)
are node-tested; **the loop itself is not** — the guards are `tests/battle-frame.test.ts`,
`battle-intro.test.ts`, `battle-arms.test.ts`, which test the three pure satellites [verified, file list].
For a game where the fight *is* the product, that inversion is fatal: you need the loop pure and tested,
which is a rebuild, not a port.

---

# SECTION 1 — SYSTEMS

## 1.1 The pure/deterministic simulation layer and its separation from rendering

**Files**
- `src/sim/` — 15 top-level modules + `course/` + `rpg/`. `round.ts` (3,119), `course/generate.ts` (2,985),
  `rpg/run.ts` (1,163), `shot.ts` (907), `flight.ts` (617) [verified, `wc -l`]
- `src/sim/course/contract.ts` — the frozen boundary [verified, read in full]
- `src/render/project.ts` — the one projector both renderers share [verified, read in full]
- `src/render/style.ts:1-21` — the scene-builder orchestrator's contract [verified]

**Pattern, in the abstract.** The world model is a set of pure, DOM-free, globals-free modules that
consume an injected PRNG and produce plain data. Rendering is a *consumer* of that data and never a
producer: `buildScene(model, projector) → Prim[]`, and two thin interpreters (`scenePrimsToSvg`,
`drawScenePrims`) turn the same `Prim[]` into either a static vector document or animated canvas calls
[verified, `style.ts:10-16`]. The dependency arrow is one-way and enforced socially plus by the fact
that sim modules import nothing from `render/`. The strongest structural expression of this is the
**frozen contract module** (§1.4): generation emits it, rendering consumes it, scoring reads it, and
either side can be rewritten wholesale behind it [verified, `contract.ts:1-11`].

**Transfer.** *With adaptation — the discipline directly, the code not at all.* A wave-based shooter has
the same three-way split available (wave/enemy/collision model → scene description → painter), and the
same payoff: you can simulate a whole stage headlessly in a test. But every concrete type here is golf.
The one file that lifts unchanged is `project.ts`'s **idea** — a pure `project`/`unproject`/`scale`
triple with a rotation convention baked in — not its implementation, which takes a `Hole` and rotates
tee→green up-screen [verified, `axes()` at :120-135].

**Entanglement risk.** **Fused.** `sim/round.ts` exports `HOLE_OUT_RADIUS`, `MAX_OVER_PAR`,
`layupTarget`, `manualPutt`, `onePutt`, `puttOutFrom`, `shotSpread`, `pinOf`, `backspinRoll`
[verified, import list at `sim/rpg/play.ts:14-42`]. There is no seam at which "the physics" is separable
from "golf".

**Guard.** The determinism contract is guarded by the whole seeded test suite — ~200 test files, most of
which assert on seeded runs [verified, `ls tests`]. `tests/rng.test.ts` pins the generator. The
sim↔render separation has no single mechanical guard that I found; it is a CLAUDE.md rule plus the fact
that a `Math.random` in a deterministic path is caught by `ball.test.ts` / `runout.test.ts` / the sim
suite [verified, listed in `tests/one-description.test.ts:41-49` as "already guarded elsewhere"].

**Port vs rebuild.** **Rebuild, cheaply.** Porting is not on the table (fused). Rebuilding the *shape* is
maybe a day: decide your model types, put them in `src/sim/`, ban DOM imports, thread an `Rng`. The
expensive thing you would be reproducing is the *habit*, and that is free if you start with it.
**Recommendation: rebuild, copying `contract.ts`'s structure as a template — a types file, geometry
helpers, and a `validate*(model): string[]` that generation calls and throws on.**

---

## 1.2 Seeded RNG discipline and the reproducibility contract

**Files**
- `src/sim/rng.ts` — 95 lines, the whole thing [verified, read in full]
- `src/app/ctx.ts:40` `freshRunSeed()` — the ONE sanctioned `Math.random` [verified, grep]
- `src/app.ts:185` `seedFromUrl() ?? freshRunSeed()` — `?seed=` pins a run [verified]
- `src/render/storyBattle.ts:118-127`, `:341` (`rng`), `:365` (`drng`) — the render layer's private copies

**Pattern, in the abstract.** One tiny fully-specified PRNG (mulberry32) wrapped in a class exposing
`float / range / int / bool / pick / gaussian / fork`, with the seed retained as a readonly field
[verified, `rng.ts:37-89`]. Strings hash to seeds via FNV-1a so a run can be seeded from a name or a
date [verified, :28-35]. `fork()` derives a child stream from the parent's next draw, which is how
sub-systems get independent streams without a global [verified, :86-88].

The contract on top of it is the interesting artifact, and it is stated as a rule rather than encoded:
**a new feature must consume ZERO extra draws on its default (feature-off) path, and must not reorder
existing draws** — so every pre-existing seeded test stays byte-identical [verified, CLAUDE.md
"non-negotiable contracts" §1; the codebase's comments repeatedly cite "byte-for-byte" as the acceptance
criterion, e.g. `contract.ts:141-145` on `greenContour` being drawn from a dedicated SIDE stream]. The
mechanism that makes this affordable is **named side streams**: anything additive draws from its own
`:rough:` / `:pin:` / `:approach:` sub-stream rather than the main one [verified, contract doc comments;
CLAUDE.md system index].

Separately: the render layer is **explicitly outside** the contract. `storyBattle.ts` and `style.ts`
each carry their own mulberry32 seeded off geometry or a fixed constant, because scene randomness must
be stable across camera moves but must never be able to perturb the sim [verified, `style.ts:9-13`,
`storyBattle.ts:341` vs `:365` — the fight's spawn stream and its *scenery* stream are deliberately
separate so adding decor cannot shift a volley].

**Transfer.** **Directly.** `rng.ts` is domain-free and copies verbatim. The zero-extra-draws contract
transfers with even more force to a shooter than to golf: a stage seed that reproduces an exact wave
pattern is how you make bug reports actionable and how you get replay/ghost/daily-run features for free.
The side-stream idea maps onto "spawn stream vs decor stream vs drop-table stream" with no translation.

**Entanglement risk.** **Clean.** `rng.ts` imports nothing.

**Guard.** `tests/rng.test.ts` pins the sequence [verified, file exists]. The *ban* on `Math.random` in
deterministic paths is a source scan living across `ball.test.ts` / `runout.test.ts` and the sim suite
[verified, `one-description.test.ts:41`]. Note the honest gap: the ban is enumerated as "already guarded
elsewhere" rather than centralised, and the register explicitly declines to move it
[verified, `one-description.test.ts:50-57`].

**Port vs rebuild.** **Port, verbatim, in the first commit.** ~0 cost, high leverage. Write the
zero-extra-draws rule into your CLAUDE.md on the same day, because it is unaffordable to adopt after
you have 40 seeded fixtures.

---

## 1.3 Keeping a headless simulation identical to the interactive one

**Files**
- `src/sim/round.ts` — `playHole` (headless) and `executeShot`/`resolveShot` (shared) [verified via
  imports at `sim/rpg/play.ts:14-42`]
- `src/sim/rpg/play.ts` — the interactive driver: `beginHole` (:81), `shotView` (:116), `previewShot`
  (:172), `autoDecision` (:238), `takeShot` (:259), `takePutt` (:525) [verified]
- `tests/play.test.ts:41` — `it('auto-play (autoDecision) matches the AI playHole exactly')` [verified]

**Pattern, in the abstract.** Two drivers over one resolver. The headless driver runs the model to
completion for tests, balance harnesses and AI-controlled entities; the interactive driver exposes a
per-step *decision* type and resolves it through the **same** function the headless path calls. The
invariant — stated as contract #2 in CLAUDE.md — is that both must resolve the same step identically,
including **the order of RNG draws** ("the player draw first in both") [verified, CLAUDE.md contract 2].
The guard is a driver-equivalence test: drive the interactive path with an auto-decider and assert the
result equals the headless path's, over many seeds [verified, `tests/play.test.ts:41-55`, loops
`seed = 0..79`].

Note the honest carve-out: `previewShot`/`autoAimTarget` are **interactive-only** and the headless path
keeps its own aim line, precisely so that adding aim assist cannot move a seeded number
[verified, CLAUDE.md GS-default-aim bullet; `play.ts:164` `resolveAimTarget` is shared between preview
and take, which is what keeps *those two* honest].

**Transfer.** **Directly, and it is worth more here than it is in golf.** A wave shooter has an
irresistible use for a headless driver: a balance harness that plays 10,000 stages and reports
death-rate/clear-rate per wave (the analogue of the death-spiral harness, §1.13). That harness is only
trustworthy if the AI-driven path resolves collisions and spawns identically to the played one. The
"one resolver, two drivers, one equivalence test" shape is exactly right.

⚠️ **The one thing you must not copy is the current battle's version of this.** `storyBattle.ts` has an
`interactive` flag that switches to an *autopilot* (`:875-887`: fire the first ready weapon every 800ms,
weave on two sines) and a separate `AUTO_DEADLINE_MS` that force-resolves the pre-computed gate verdict
after 9 seconds [verified, `:820-838`]. That is a **cinematic**, not a headless equivalent — it is
allowed to be, because the fight's *outcome* is decided by a pure function before the fight starts
(`finaleResult` at `sim/rpg/storyFinale.ts:56`) [verified]. In your game the fight IS the outcome, so
this pattern does not transfer.

**Entanglement risk.** **Fused** as code; **Clean** as pattern.

**Guard.** `tests/play.test.ts:41`. Also `tests/round.test.ts:16` (same seed → byte-identical play).

**Port vs rebuild.** **Rebuild.** Half a day to stand up the two-driver shape once your model exists.
**Recommendation: adopt on day one, and write the equivalence test before the second driver.**

---

## 1.4 The frozen contract between generation, rendering and scoring

**Files**
- `src/sim/course/contract.ts` — 285 lines [verified, read in full]
  - `Vec`/`Feature`/`Hole`/`Course` shapes: :13-199
  - shared geometry helpers `dist`/`pathLength`/`bearing`/`segDist`/`polylineDist`/`pointInPoly`: :203-256
  - `validateCourse(c): string[]`: :263-284
- `tests/contract.test.ts` [verified, file exists]

**Pattern, in the abstract.** A single small module declares the data shape that flows between the three
subsystems, plus the geometry primitives all three need, plus a **pure validator returning a list of
problems** that the generator calls and throws on. The comment is the policy: *"Do not bend the contract
to a renderer convenience or a generator shortcut — extend it deliberately"* [verified, :6-7]. Three
details worth stealing:

1. **Open-ended enums with a closed core.** `FeatureKind` is a union of known kinds `| (string & {})`,
   so new content slots in as data with a modifier row rather than an engine edit [verified, :23-31].
2. **Optional-for-back-compat fields carry their own doc explaining the fallback.** `pin?` falls back to
   the centroid; `greenSlope?` means flat; `greenContour?` absent means single-plane [verified, :86-147].
   This is what lets a generator version add a field without invalidating fixtures.
3. **Units are declared once, at the top, and they are the same units the content tables use**
   [verified, :9-10 — course space is yards to match club carries].

**Transfer.** **Directly, as a template.** For a shooter the contract is a *stage/wave descriptor*:
spawn table, timeline, arena bounds, terrain/obstacle polygons, boss handle. Same three consumers
(generator or authored data → renderer → collision/scoring). The `validate*` returning `string[]` rather
than throwing is the specific trick to copy: it lets tests enumerate every violation across thousands of
generated stages instead of stopping at the first.

**Entanglement risk.** **Fused** as written (every field is golf), **Clean** as a pattern file.

**Guard.** `generateCourse` throws on violation [verified, CLAUDE.md contract 3 + `contract.ts:258-262`
doc comment: "The generator and tests both call this so a malformed course can never silently reach the
renderer or the scorer"]. Plus `tests/contract.test.ts`.

**Port vs rebuild.** **Rebuild from the template.** ~2 hours. **Recommendation: write your stage
contract before your first generator, and make `validateStage` throw at generation time from the start.**

---

## 1.5 The boss-fight subsystem

This is the system you asked about most, so it gets the most detail. It is four modules, three of which
are clean and one of which is not.

### 1.5a Fight loop, phase/state handling

**Files**
- `src/render/storyBattle.ts` — 2,709 lines, one exported function `mountStoryBattle(opts)` at `:161`
  [verified, read `:1-420`, `:598-1015`, plus a full function outline via grep]
  - phase union: `:239` `'entry' | 'assault' | 'overwhelm' | 'aim' | 'climax-win' | 'climax-lose'`
  - mutable fight state: `:240-290` (~30 `let`s)
  - projectile pools: `:292-323` — `PlayerShot[]`, `Beam[]`, `Enemy[]` (a discriminated union of
    `Acid | Bolt | Void`), plus `Burst[]`, `Spark[]`, `DmgNum[]`, `Wave[]`, `Flash[]`
  - spawners: `spawnAcidFan` `:605`, `spawnBolt` `:626`, `spawnVoid` `:647`, `spawnVolley` `:663`
  - damage: `dressHit` `:735`, `landPlayerHit` `:762`, `shipHit` `:797`
  - `update(dt)` `:814-1012` — the whole fixed-order integration + collision pass
- `src/sim/rpg/storyFinale.ts` — 211 lines, the pure model [verified, read `:1-140`]
  - `FINALE_PHASES = [0.75, 0.5, 0.25, 0.05]` — phase thresholds as **remaining-health fractions**
  - `FINALE_WEAPON_CONFIG: Record<string, {...}>` — one row per weapon upgrade
  - `finaleResult(story)` `:56` — the deterministic gate verdict

**Pattern, in the abstract.** The fight is a **phase-scripted attrition loop keyed on the boss's
remaining health fraction**, with three orthogonal state kinds:

- **Phase** — a small string union advanced by a `while` loop that crosses each threshold exactly once
  [verified, `:772-785`: `while (phaseIdx < FINALE_PHASES.length-1 && hp <= hpMax*FINALE_PHASES[phaseIdx])`].
  Keying on health rather than time means *every* loadout plays every phase — an over-armed player
  shortens the fight but cannot skip the gauntlet [verified, `storyFinale.ts:20-24`].
- **Escalation content** — `spawnVolley()` (`:663`) is a flat `if/else if` over `phaseIdx` that composes
  the phase's attack shapes. Three shapes total: a **fan** of slow dodgeable projectiles, a
  **telegraphed line** (a warning drawn for `BOLT_TELEGRAPH_MS` = 1000ms before it becomes lethal for
  260ms), and a **fused heavy** that detonates into an expanding ring [verified, `:605-661`, constants
  at `:136-141`].
- **Spectacle** — hitstop, flinch, screen shake, damage numbers, chip bar, phase wash — held in separate
  fields and updated in the same `update()`, but structurally quarantined: `bossRoar()` is documented as
  *"Pure spectacle: it never spawns, damages, or changes what the next volley will be"* [verified, `:709-712`].

Two structural properties are worth naming as doctrine:

**The art clock is separate from the wall clock.** `animMs` is frozen by hitstop so the boss stops
mid-writhe with everything else [verified, `:273`]. This is what makes hitstop read as impact rather
than as a dropped frame.

**Scenery draws from a different RNG stream than the fight.** `rng` (`:341`) seeds volleys; `drng`
(`:365`) seeds debris, sparks and the far fleet, explicitly *"so adding scenery cannot shift a single
draw of the stream that spawns the boss's volleys"* [verified, `:363-364`]. That is the sim's
side-stream discipline applied inside the render layer, and it is the reason the fight's pattern is
stable across art passes.

**Transfer.** **With adaptation — the doctrine directly, the code not at all.** Everything above is
correct for a shooter; that is what it already is. But:
- The loop is one 2,700-line closure with ~30 mutable `let`s and no entity abstraction. Adding a second
  boss meant a `herald` boolean threaded through ~15 sites (`muzzlePos` `:598`, `spawnBolt` `:630`,
  `spawnVoid` `:648`, `phaseLabel` `:678`, `PHASE_WASH` `:702`, `bossRoar` `:715`, the captions at
  `:944-946`, …) [verified]. That is fine for two bosses and untenable for the eight-plus a
  stage-per-boss shooter needs.
- The whole thing assumes **one boss, one player, no ordinary enemies**. There is no wave concept, no
  enemy entity type, no spawn timeline — `spawnVolley` is the boss's own attack, not a wave.
- Everything is `render/`, so none of it is reachable from a node test.

**Entanglement risk.** **Tangled**, and specifically: it assumes (a) the outcome is pre-decided by a
pure gate and the fight is a *performance* of that verdict — `hpFloor` at `:246` makes an under-armed
boss literally unkillable and `HOPELESS_DEADLINE_MS` drives you off at 40s [verified, `:144`, `:246`,
`:836-842`]; (b) the player's ship art comes from a golf-RPG cosmetic catalogue; (c) the finisher is a
**golf swing** at a bared eye, with a sweeping reticle and a `CLEAN_ZONE`/`HIT_ZONE` tolerance
[verified, `:146-149`, `phase: 'aim'`]. (a) is the deepest: your fight must be won by playing it.

**Guard.** The three pure satellites are node-tested (`tests/battle-frame.test.ts`,
`battle-intro.test.ts`, `battle-arms.test.ts`) [verified, files exist]. The **loop is not tested** —
`tests/boss-scale.test.ts` and `tests/story-finale.test.ts` exist and, from their names and the sim
module they'd import, test `finaleResult`/`finaleLoadout`, i.e. the pure gate [assumed — I did not open
them]. A pure phase model (`FINALE_PHASES`, `FINALE_OVERWHELM_HITS`, `FINALE_PHASE_REGEN`) living in
`sim/` and being machine-checked for winnability is the transferable half [verified,
`storyFinale.ts:80-92` + the header's claim that it is "machine-checked"].

**Port vs rebuild.** **Rebuild — and this is the decision that most matters.**
- *Port cost:* deceptively low to start (one file, copy it, strip golf) and then very high: you would be
  extending a 2,700-line closure with waves, multiple enemy types, per-enemy AI and a hit-scan layer,
  none of which it has an abstraction for, with no test able to see inside it.
- *Rebuild cost:* 1–2 weeks for a loop with entity pools, a wave timeline, a boss phase script, and — the
  part that pays — **the loop in `src/sim/` as a pure `step(state, dt, input) → state`**, so a stage is
  simulable headlessly and a boss fight is reproducible from a seed.
- **Recommendation: rebuild the loop pure and headless; port the *rules* verbatim** — health-keyed
  phases, three attack shapes (fan / telegraphed line / fused heavy), telegraph-before-lethal, phase
  turn grants a breather resource, hitstop freezes the art clock, spectacle can never touch spawns,
  scenery on its own RNG stream.

### 1.5b Per-entity weapon mounts

**Files** — `src/render/battleArms.ts` (280 lines, pure, read in full) [verified];
consumer at `storyBattle.ts:206-210`, `:481-536`, `drawMuzzleFlashes` `:1472`.

**Pattern, in the abstract.** An armament is a **compile-forced table row keyed by the entity's
silhouette kind**: `Record<Kind, {name, mounts: Hardpoint[], fire: FirePattern, flash: MuzzleFlash,
trail: ShotTrail, flashR}>` [verified, :67-196]. Hardpoints are hull-local normalised (`along` −1 tail →
+1 nose, `across` −1 roof → +1 belly) so they survive any scale or orientation [verified, :38-41].
`FirePattern` is `'alternate' | 'salvo' | 'converge'` and `mountForShot(arms, pulls, k)` returns which
mount shot *k* of volley *pulls* leaves from, or `−1` meaning "use the centroid" [verified, :275-280].
Livery is resolved from the entity's own art row (`look.flame` / `look.glass`), so a new entity brings
its weapon palette for free [verified, `shipArmsFor` :239-243].

**Two rules stated as invariants, both worth adopting verbatim:**
- *"Mounts move where a projectile is BORN, never how many there are or what they do on arrival"* —
  because damage is applied per projectile, so one extra mount would silently be a balance change
  [verified, :25-27].
- *A muzzle flash is stored by **mount index**, never a world position* — it is welded to a moving hull,
  so the world point is re-derived every frame [verified, `storyBattle.ts:320-322`].

**Transfer.** **Directly.** This is the single most portable non-trivial module in the repo for you. A
shooter with a pilot roster and upgradeable weapons needs exactly this split: hull says *where and how
it reads*, upgrade says *what it does*.

**Entanglement risk.** **Clean** — it imports only `ShipLook` from `sim/rpg/ships` for the `kind` union
and the two colours [verified, :31]. Swap that import for your own entity-look type and the module is
domain-free. The only golf residue is one `'dimple'` trail value and a comment about golf balls
[verified, :60].

**Guard.** `tests/battle-arms.test.ts` [verified, file exists], plus — more importantly — the
`Record<ShipLook['kind'], ShipArms>` type itself, which **fails the build** when a kind is added
[verified, :81-82 states this explicitly]. `planMounts`'s mirroring rule is separately guarded
[verified, referenced at `battleArms.ts:220-224` and in `tests/ship-top-art.test.ts` per CLAUDE.md].

**Port vs rebuild.** **Port.** ~1 hour to retype the `kind` union and rewrite the 11 rows for your
craft. **Recommendation: port, and keep `planMounts` — you will need it the moment you have a top-down
and a side-on view, or a mirrored two-player sprite.**

### 1.5c Entrance choreography

**Files** — `src/render/battleIntro.ts` (79 lines, pure, read in full) [verified]; consumed at
`storyBattle.ts:90`, `:238-243`.

**Pattern, in the abstract.** The entrance is a **pure timeline function**: `entryBeat(elapsedMs) →
{loom, plate, plateAlpha, roar, hudIn, streak}`, every field a 0..1 dial, plus two exported constants
(`ENTRY_MS` = 2800, `ENTRY_ROAR_MS` = 1250) [verified, :33-79]. Three easing helpers — `smooth`
(smoothstep), `slam` (`1 − (1−t)^3.4`, "fast in, settling, lands hard and stops dead"), and `clamp01` —
and the whole beat is expressed as offset/duration arithmetic on `e` [verified, :53-78]. The doc comment
names the property that makes it safe: *"Monotone where it should be (`loom`, `hudIn` never go
backwards) and everything is clamped, so a dropped frame or a long stall can only ever land further
along the beat — never in an impossible state"* [verified, :65-68].

The boss's identity is a second pure function, `bossTitle(herald) → {name, epithet}`, and the comment
says *"A third boss would be a third row"* [verified, :26-30]. In practice a third boss is a third
branch of a ternary, not a row — see the port note.

**Transfer.** **Directly.** A stage-per-boss shooter wants exactly this: name plate, loom, roar, HUD
wipe, then the assault, all resolvable at any `t` from a pure function so it can be scrubbed, previewed,
skipped and tested. The "resolve every dial from elapsed time" shape also makes the entrance
frame-rate-independent for free.

**Entanglement risk.** **Clean.** Zero imports [verified].

**Guard.** `tests/battle-intro.test.ts` [verified, file exists]. Purity + no imports means it is
node-testable by construction.

**Port vs rebuild.** **Port the timeline, rebuild `bossTitle` as a real table.** ~30 minutes.
`bossTitle` is a two-arm ternary keyed on a boolean, which is the shape that does not scale — make it
`Record<BossId, BossTitle>` so it is compile-forced like `SHIP_ARMS`.

### 1.5d One loop, more than one boss

**Files** — `storyBattle.ts` `herald` flag (`:169-171`, `:183`); `render/sigilCeremony.ts` `paintSerpent`
+ `SerpentAnchors`; `render/wardenArk.ts` `paintWardenArk` + `arkBatteryPos` [verified, imports at
`storyBattle.ts:74-75`].

**Pattern, in the abstract.** **Both bosses' painters return the same anchor struct.** `SerpentAnchors`
= `{eyeX, eyeY, eyeR, browX, browY, headH, headAng}` [verified, `storyBattle.ts:326`], and the fight
reads *only* the anchors for targeting, muzzle position and the finisher target
[verified, `muzzlePos()` :598-601, `coreTarget()` :1349, `aimTarget()` :1354]. The three attack shapes
keep identical timings, speeds and counts; only the **weapon art** changes per boss (venom→flak,
called-lightning→fired-lance, void orb→torpedo) [verified, module header :12-19 and the spawners'
`herald ?` branches at :630-632, :648].

That is the reusable rule, and it is worth stating as doctrine: **a second boss is a new painter plus an
anchor implementation, never a forked fight loop.**

⚠️ The *implementation* of that rule is a boolean, not a polymorphic interface — `herald` is read in
roughly fifteen places [verified by grep of the file]. The rule is right; the mechanism is at its
capacity.

**Transfer.** **With adaptation.** Take the anchor contract (a boss exposes named attachment points and
a hurt-target; the loop reads nothing else about its geometry) and implement it as an interface —
`interface Boss { paint(ctx, t, frame): BossAnchors; muzzle(a): Vec; core(a): Circle; phases: PhaseRow[] }`
— rather than a flag.

**Entanglement risk.** **Tangled.** The anchors are named for a serpent's anatomy (`eyeX`, `browY`,
`headAng`) and the Ark implements them by analogy [verified]. A generic version needs neutral names.

**Guard.** None mechanical that I found for the anchor contract. The `Record`-based compile forcing is
used for ship kinds but **not** for bosses. This is a genuine gap in the source, and the fix in your
repo is a `Record<BossId, BossDef>`.

**Port vs rebuild.** **Rebuild as an interface, port the doctrine.** ~half a day.

---

## 1.6 Fitting a scene composed for one aspect ratio to arbitrary viewports

**Files**
- `src/render/battleFrame.ts` — 124 lines, read in full [verified]
- `src/render/project.ts:58-63` `fitFrame` — the same idea for the map [verified]
- `src/app/viewportFit.ts` — 167 lines, read in full [verified]
- `src/render/safeArea.ts` — 85 lines, read in full [verified]
- `src/render/pixelRatio.ts` — 47 lines, read in full [verified]
- `tests/battle-frame.test.ts`, `tests/map-frame.test.ts`, `tests/display-scale.test.ts`,
  `tests/portrait-frame.test.ts`, `tests/embed-scroll.test.ts` [verified, files exist]

**Pattern, in the abstract.** There are **three distinct answers** here and they are worth separating,
because it is easy to think there is one.

**(a) Rotate the camera, never the world** (`battleFrame`). Compute the meet-fit scale both flat and
turned; take whichever is larger; if turned wins, the world transform gains a `translate + rotate(-π/2)`
at draw time and *nothing else in the system knows* [verified, :70-91 and `applyWorld` at
`storyBattle.ts:410-421`]. Three supporting functions make it survivable:
- `toDesignPoint` / `toHudPoint` — the inverses, so input hit-testing works in both orientations
  [verified, :94-103].
- `designViewRect` — **the whole visible screen in design units.** Any full-frame wash must cover THIS,
  not the design box, or the letterbox bands read as a seam [verified, :105-118]. This is a
  non-obvious trap and it is called out explicitly.
- A **separate always-upright HUD frame** carried in the same struct. In landscape it *is* the arena box
  (identical numbers ⇒ byte-for-byte unchanged); turned, it spans the safe screen so the readouts get
  the letterbox bands instead of covering the playfield [verified, :81-90].

**(b) Grow the design frame instead of letterboxing** (`fitFrame`). Keep the meet scale the browser
would have picked, then grow the authored frame on the starved axis, so aspect matches exactly and the
reclaimed bands become content [verified, `project.ts:58-63`]. A container already at the design aspect
returns the design frame unchanged. This is the right answer when the scene has bleed to spare and the
wrong answer when it does not.

**(c) Scale the whole UI as a zoom, and fold that zoom into everything that measures**
(`viewportFit` + `pixelRatio`). `--gs-uiscale` = reader's scale × display scale, applied as `zoom` on
`<html>` [verified, `viewportFit.ts:82-84`, `settings.ts:152-154`]. Then the two consequences that cost
real bugs here:
- **Media queries are blind to `zoom`** — it shrinks the layout box but not the media-query viewport, so
  a breakpoint can never answer "too cramped at large text". The answer is intrinsic sizing first, and a
  `data-gs-fit="tight"` attribute computed in ONE module second [verified, `viewportFit.ts:1-24`,
  `:106-112`].
- **A canvas must not compute its own `devicePixelRatio`** — it must fold the root zoom in, or it
  renders at a fraction of its displayed resolution [verified, `pixelRatio.ts:1-19`, `canvasRatio()`
  at :43-46].

And **(d)** the safe-area problem, which is orthogonal and specific to canvas: `env(safe-area-inset-*)`
cannot reach anything painted inside a canvas, and cannot be read from JS directly. The portable trick
is a hidden fixed-position probe whose *padding* is the inset, then measure the box the browser produces
[verified, `safeArea.ts:31-58`]. Cached, invalidated on resize/orientationchange [verified, :65-84].
The battle uses it to keep a turned HUD clear of the notch [verified, `storyBattle.ts:400`].

**Transfer.** **Directly, and (a) is the headline.** Your game is composed landscape and will be played
on portrait phones — the exact mirror of this repo's problem. `battleFrame` inverts by swapping which
comparison wins; the HUD frame, the inverse transforms and `designViewRect` all apply unchanged.
`safeArea` and `pixelRatio` transfer verbatim. `fitFrame` (b) is situational. (c) transfers if you want
a reader-scale accessibility setting, which you should.

**Entanglement risk.** **Clean** across the board. `battleFrame` imports nothing. `safeArea` imports
nothing. `pixelRatio` imports nothing. `viewportFit` imports only `settings` [verified].

**Guard.** `tests/battle-frame.test.ts` (pure, node) [verified]. `tests/map-frame.test.ts` is a
**browser** test that drives the built artifact at specific viewports (the itch embed at 820×760 and a
320×568 phone) — CLAUDE.md is explicit that the pure test can only re-derive the rule from its inputs,
which is a second description, so *the browser test is the one that matters* [verified, CLAUDE.md
GS-decision-frame-carry]. `tests/display-scale.test.ts`, `portrait-frame.test.ts`, `embed-scroll.test.ts`
(which drives a real `scrolling="no"` iframe) [verified, file list + CLAUDE.md].

**Port vs rebuild.** **Port `battleFrame.ts`, `safeArea.ts`, `pixelRatio.ts` verbatim (~1 hour total,
inverting one comparison in `battleFrame`). Port `viewportFit.ts` if you want the reader-scale setting
(~2 hours).** This is the highest ratio of value-to-effort in the whole audit.

---

## 1.7 The audio layer and where its sounds come from

**Files**
- `src/render/audio.ts` — 604 lines. Read `:1-110`; outlined the rest [verified]
- `src/render/music.ts` — 581 lines. Read `:1-90` [verified]
- `src/render/weatherAudio.ts` — 443 lines [assumed from name + CLAUDE.md]
- `src/render/haptics.ts` [assumed]
- `tests/audio.test.ts` [verified, file exists]

**Pattern, in the abstract.** **Assetless synthesis, always.** Every cue is built from oscillators and
filtered noise at call time; there is no downloaded audio file anywhere in the game [verified,
`audio.ts:1-9`]. The consequences that make this a deliberate architecture rather than a shortcut:
- The bundle stays a single self-contained file (§2.1) and **nothing can 404 on a device** [verified,
  `audio.ts:3-5`].
- **One `AudioContext` for the whole app**, exposed by `sharedAudioContext()`, with two buses hanging
  off it (SFX gated on the `sound` setting, music on `music`), because a page gets few contexts and two
  would fight for the hardware [verified, :19-53].
- Lazy creation + resume-on-first-gesture, and **no context is ever created for a player with both
  toggles off** [verified, `resumeAudio()` :58-66].
- Everything is guarded — a browser without WebAudio makes no sound rather than throwing [verified].
- The noise generator uses a **deterministic pseudo-noise seed, not `Math.random`** [verified,
  :104-106].

Content is data + dispatch: `TREE_VOICES: Record<BiomeArchetype, TreeVoice>` (`:199`), a `sfx` object of
~20 named cues (`:293+`), strike voices keyed per club *family*, touchdown voices per surface [verified].
Music is the same shape at a larger scale: `MusicTrack` is a 20-field row (bpm, root, scale, chord loop,
pad/arp waveforms, densities, gain, plus optional timbre levers `lead`/`padDetune`/`padCut`/`sub`/
`pulse`/`pulseVoice`), one row per world archetype, on a **private xorshift stream that can never
perturb the sim or render streams** [verified, `music.ts:44-84`, `:11-14`].

**Transfer.** **Directly.** A shooter needs more simultaneous cues than a golf game (every projectile,
impact, pickup), so you will need a voice-stealing/pooling layer this does not have — but the
foundation (one context, two buses, gated + guarded, assetless, table-driven cues) is exactly right, and
"no asset can 404" matters more on itch than anywhere else. The generative-music engine is genuinely
reusable: a stage's track is a row, and the timbre levers give you per-stage identity without composing.

**Entanglement risk.** **Tangled but shallowly.** `audio.ts` imports `flightClassOf` from `sim/flight`
and `BiomeArchetype` from `sim/course/themes` — two type/dispatch keys [verified, :12-14]. `music.ts`
imports only `BiomeArchetype` and `settings` [verified, :19-21]. Replace the two keys with your own
enums and both modules are domain-free; the cue *bodies* (a golf strike, a sand splash) are of course
golf, but they are ~15 short functions.

**Guard.** `tests/audio.test.ts`. Coverage is machine-checked: CLAUDE.md states strike voices per club
family, touchdown per surface and tree hits per archetype have full-coverage tests, and that audio
modules must import clean in node [verified, CLAUDE.md audio bullet; the `Record<BiomeArchetype, …>` at
`audio.ts:199` is itself compile-forcing].

**Port vs rebuild.** **Port the engine scaffolding, rebuild the cues.** The context/bus/gating/guard
skeleton is ~120 lines and copies directly (~1 hour). `music.ts`'s `MusicTrack` table + player is ~580
lines and is worth porting nearly whole (~3 hours to retype the archetype key). The cue library is
domain content — rebuild (~1–2 days for a shooter's cue set, and add pooling).

---

## 1.8 Save / versioning / export-import / behaviour on unreadable data

**Files**
- `src/save/schema.ts` — 1,208 lines. `SAVE_VERSION = 34` at `:30`; the v1..v34 interface chain; the
  `readSave` classifier at `:1067-1180`; `migrate` at `:1191-1194` [verified, read `:1-120` and `:1040-1208`]
- `src/save/integrity.ts` — 127 lines, read in full [verified]
- `src/save/storage.ts` — 87 lines, read in full [verified]
- `src/save/legacyKeys.ts` — 41 lines, read in full [verified]
- `src/save/backup.ts` — `BACKUP_KIND` `:40`, `LEGACY_BACKUP_KIND` `:44`, `BACKUP_VERSION = 2` `:55`,
  `parseBackup` `:130` [verified, grep + read of key lines]
- `src/save/durability.ts` — `PROBE_KEY = 'fc_probe'` `:35` [verified, grep]
- `src/save/storyStore.ts` — `STORY_KEY = 'fc_story'` `:35`, a read-modify-write cache [verified, grep]
- `docs/decisions/save-integrity.md`, `save-transfer.md`, `save-slots.md` [verified, files exist]
- `tests/save-integrity.test.ts`, `save-integrity-browser.test.ts`, `save-backup.test.ts`,
  `save-transfer-browser.test.ts`, `save-durability.test.ts`, `save-key-migration.test.ts`,
  `save-slots.test.ts`, `save.test.ts` [verified, file list]

**Pattern, in the abstract.** Five layered ideas, each of which cost a real bug here.

1. **Versioned blob + one-step-at-a-time migration chain.** Every persisted blob carries a numeric
   `version`; migration is a linear sequence of `if (s.version === N) s = vNToVN1(s)` steps [verified,
   `:1077-1110` — 33 consecutive lines]. Adding a field is: bump the constant, add one interface, add one
   step. Each step's doc comment says what it carries and what an absent field means [verified, e.g.
   `v33ToV34` at `:1061-1065`].

2. **A three-way classifier, not a boolean.** `readSave(raw): {ok:true, save} | {ok:false, why:'newer',
   found} | {ok:false, why:'foreign'}` [verified, :1045-1050]. `'foreign'` fires on a non-object, on a
   missing/non-numeric `version`, **and** on a finite version at or below current that the chain has no
   step for [verified, :1068-1075, :1111-1115]. This is the load-bearing distinction: *"nothing here"*
   and *"something here I don't understand"* need opposite responses, and until they diverged the next
   ordinary persist destroyed the real save [verified, `storage.ts:21-28`].

3. **A fault puts the whole layer read-only.** `recordFault` latches a module singleton, first fault
   wins; `readOnly()` is the one predicate; `writeSave` returns `false` [verified, `integrity.ts:61-81`,
   `storage.ts:59-60`]. **Returning `false` rather than throwing costs nothing because every caller has
   handled `false` from the storage-unavailable case since v1** — the new mode rides an existing contract
   [verified, `storage.ts:51-58`]. The game stays fully playable; only persistence stops.

4. **The rescue path hands over the RAW STORED BYTES, never an export.** An export is built from
   `loadSave()`, which under a fault returns the empty default — so an export button would hand the
   player a file containing nothing while calling it a backup [verified, `unreadableSaveText()` at
   `storage.ts:74-76`, `saveIntegrity.raw` at `integrity.ts:61`, and the filename builder at
   `app/saveTransfer.ts:102`].

5. **A backup is a BUNDLE of every blob, with its own version, and parsing THROWS.** Progress lives in
   three blobs (`fc_save` + `fc_story` + `fc_settings`) and localStorage is per-origin, so export/import
   is the only bridge between the web build and the native shell [verified, `app/saveTransfer.ts:4`].
   `parseBackup` throws a typed `BackupError` rather than swallowing and returning a default — the
   swallow is right for boot and catastrophic for an import, where it would report success while wiping
   a real save [verified, `backup.ts:110-130` region + `storage.ts:78-86`, which documents deleting two
   helpers for exactly this reason]. Import is two steps by construction: the pick *parses and
   summarises*, a second tap writes [verified, CLAUDE.md + `backup.ts` header].

Plus a sixth, smaller one worth noting: **old keys are accepted on read, canonical on write**
(`legacyKeyFor` at `legacyKeys.ts:36-40`), and the module declares itself a one-way street that nothing
may be added to [verified, :18-21].

**Transfer.** **Directly.** Every reason this exists applies verbatim to Into the Coil: same platform
(itch shared origin), same storage (localStorage only), same native-shell-is-a-different-origin problem
if you ship to Play, same save-import requirement — *and you have named an extra one*, since the optional
save-import that reads the prior game's betrayal/character is **a cross-game read of a foreign blob**,
which is precisely the case `readSave`'s `'foreign'` arm was built to classify.

⚠️ One design note on that: reading `fc_save`/`fc_story` from Into the Coil only works **on the same
origin**. If Into the Coil ships at `intothecoil.vulpecula.games`, it cannot see The Far Carry's
localStorage at all [verified reasoning from `pages.yml:20-24` and `docs/decisions/process-and-deploy.md:356`].
The import must therefore go through the **backup bundle file** — which means Into the Coil needs a
reader for `kind: 'far-carry-backup'`, v1 and v2. That is a strong argument for porting `backup.ts`'s
parser rather than writing a new one.

**Entanglement risk.** **Clean → Tangled, by file.** `integrity.ts` is clean but imports `GAME_TITLE`
for its copy (:39) — trivially re-pointed. `storage.ts` is clean. `legacyKeys.ts` is clean. `schema.ts`
is **Tangled**: its structure is generic but every field is golf (`bestStableford`, `bagTierByCharacter`,
`strokePlayBest`, `serpentWins`, …) and it imports eight sim modules [verified, :9-28]. `backup.ts` is
mostly clean.

**Guard.** Eight test files, listed above. Two mechanisms are worth naming: `tests/save-integrity.test.ts`
asserts `migrate()`'s behaviour is **byte-for-behaviour identical for every possible input shape**, so a
tidy-up refactor of `readSave` that quietly moves one outcome goes red [verified, `schema.ts:1056-1060`
documents this]. And `tests/privacy.test.ts:74-80` scans `src/` for `'fc_*'` string literals and fails
if any is missing from `PRIVACY.md`'s table — **and vice versa**, so the table cannot document a deleted
key either [verified].

**Port vs rebuild.** **Port `integrity.ts` + `storage.ts` + `legacyKeys.ts` nearly verbatim (~2 hours).
Port `backup.ts`'s bundle format and parser, extended to also read a `far-carry-backup` (~half a day).
Rebuild `schema.ts` from the shape.** **Recommendation: adopt the three-way classifier and read-only
fault on day one.** It is the cheapest insurance in this repo and it is un-retrofittable after players
exist — you cannot un-destroy the saves you destroyed while it was missing.

---

## 1.9 The accessibility layer, in full

**Files**
- `src/app/focus.ts` — 321 lines, read in full [verified]
- `src/app/announce.ts` — 146 lines, read in full [verified]
- `src/settings.ts` — 156 lines, read in full [verified]
- `src/app/viewportFit.ts` — 167 lines, read in full [verified]
- `src/render/pixelRatio.ts`, `src/render/safeArea.ts` — read in full [verified]
- `docs/decisions/accessibility.md` [verified, file exists — not read]
- `tests/accessibility.test.ts`, `a11y-focus.test.ts`, `a11y-announce.test.ts`, `a11y-keyboard.test.ts`,
  `a11y-motion.test.ts`, `a11y-mobile-layout.test.ts` [verified, file list]

**Pattern, in the abstract.** Six distinct mechanisms. They are unusually complete and I would take
essentially all of them.

**(a) One post-render pass makes overlays into dialogs.** `applyOverlayFocus(app)` runs at the end of
every render: finds the topmost direct-child overlay, gives it `role="dialog"` + `aria-modal` + an
accessible name derived from its own heading, and sets `inert` on every *other* direct child
[verified, :110-184]. Rationale for `inert` over a hand-rolled tab trap: one attribute covers tab order,
the a11y tree and hit-testing, with no keydown handler to desync [verified, :18-21]. Three subtleties:
- Only a **direct child** of the app root may be treated as an overlay — inerting `<main>` around a
  nested overlay would inert the overlay itself and freeze the app [verified, :112-116].
- Focus moves in **only on the open transition**, so a surgical re-render doesn't yank the player to the
  top of the sheet [verified, :22-25, :170-180].
- Focus is restored **by selector, not element reference**, captured immediately *before* the innerHTML
  swap — after it, the node is detached and `activeElement` is `<body>` [verified, `captureFocusOrigin`
  :65-72, `selectorFor` :44-59].

**(b) The keyboard arrives on the primary action.** `focusPlayStroke(app, key)` focuses the commit
button as each *decision* mounts, keyed on the decision (`hole:shots:putts:lie`) rather than the render,
so a same-decision re-render leaves focus where the player put it [verified, :210-246]. It refuses while
a covering layer exists — and **asks the DOM, never a flag**, because the flag stayed true through a
render that drew no popup [verified, :216-221]. `preventScroll: true` always, because the frame is fixed
and the page is scrollable inside an iframe [verified, :239-241].

**(c) Non-native `role="button"` gets the real contract.** `wireRoleButtonKeys` adds a tab stop plus
Enter/Space, and **synthesises a `click`** so there is no second activation path to keep in step
[verified, :296-312].

**(d) A persistent live region + pure sentence builders.** `#gs-live` lives **outside** the re-rendered
root, because a live region rebuilt each render is not reliably announced [verified,
`announce.ts:12-17`]. `polite`, never `assertive` [verified, :19-21]. A repeat is blanked and re-set on
the next frame so two identical events both speak [verified, :43-49]. The builders (`shotSentence`,
`situationSentence`, `holeSentence`) are pure and read the same fields the visible card reads, so spoken
and drawn cannot drift [verified, :75-145].

**(e) The player owns their type — four root tokens, and nothing else may name a font.** `--gs-font`,
`--gs-uiscale`, `--gs-track`, `--gs-wordspace`, all written by `applyReaderSettings` onto `<html>`
[verified, `settings.ts:144-155`]. Defaults are inert so the untoggled game is byte-for-byte unchanged.
`UI_SCALES` is a **discrete ladder** `[1, 1.15, 1.3, 1.45]`, not a slider, because every rung has been
checked to keep the commit row on screen and an arbitrary value could not be [verified, :75-85]. And the
deliberate negative: **no dyslexia font ships**, because the letterform faces repeatedly fail to beat
plain Arial and the one positive result resolved to *spacing* [verified, CLAUDE.md; the setting buys
tracking/word-spacing/leading instead].

**(f) One reduced-motion answer.** `reducedMotion()` reads the *setting*, which is seeded from
`prefers-reduced-motion` on first run and is the player's own thereafter — strictly more informed than
the query in both directions [verified, `settings.ts:123-135`]. **No module outside `settings.ts` may
read `matchMedia` for reduced motion**, and that is machine-checked [verified,
`tests/a11y-motion.test.ts`, listed at `one-description.test.ts:42`]. It reaches CSS via a `.gs-reduced`
class collapsing every animation *duration* — not `animation: none`, because several entrances start at
`opacity: 0` and would never arrive [verified, CLAUDE.md GS-a11y-motion]. Camera shake is
**amplitude-gated, never branched around**, so all shake sites keep one code path [verified, CLAUDE.md].

Plus the deliberate refusal worth copying: **the putt meter is not touched by reduced motion**, because
slowing the sweep / widening the band are *balance* changes and must go through the balance harness
rather than ship under an accessibility banner [verified, CLAUDE.md GS-a11y-motion].

**Transfer.** **Directly for (a)–(f) as architecture; with adaptation for the specific answers.** A
twitch shooter's hardest a11y questions (can a blind player play at all? what does a live region say
during a bullet-hell?) are genuinely different and this repo does not answer them — golf is turn-based,
which is why per-shot narration works. What transfers unchanged: the one-pass overlay dialog treatment,
focus-by-selector, `wireRoleButtonKeys`, the persistent live region + pure builders, the four-token type
system, the discrete scale ladder, the single `reducedMotion()` seam, and the amplitude-gating rule
(which matters *more* in a shooter — screen shake per impact is your dominant motion source).

**Entanglement risk.** **Clean.** `focus.ts` imports nothing. `announce.ts` imports one label helper and
a `ShotLog` type [verified, :23-24]. `settings.ts` imports `AimMode` and `legacyKeyFor` [verified,
:13-14]. The only golf is `shotSentence`'s content.

**Guard.** Six test files. Notably the guards are largely **source scans**: a `font-family` that is not
the token, a raw viewport unit (`\d+(vh|dvh|svh|lvh)` in the stylesheet *and* in `src/**/*.ts`), a
locally-computed `devicePixelRatio`, and a `matchMedia` reduced-motion read are all banned by scan
[verified, `one-description.test.ts:41-45` + CLAUDE.md]. Plus browser layout tests at real viewports.

**Port vs rebuild.** **Port `focus.ts` (~1 hour, it is domain-free), port `announce.ts`'s scaffolding
and rebuild its sentences (~2 hours), port `settings.ts` wholesale and edit the fields (~1 hour), port
the four tokens + `.gs-reduced` rule (~1 hour).** **Recommendation: port all of it in week one.** The
accessibility layer is the thing teams always mean to add later and never do, and here it is ~500 lines
of already-debugged, mostly domain-free code.

---

## 1.10 Global input / navigation: hardware back, Escape, keyboard parity with pointer

**Files**
- `src/ui/back.ts` — 288 lines, read in full [verified]
- `src/ui/resumable.ts` — `resumeCost`, `abandonTarget`, `abandonCost` [verified via imports at
  `back.ts:31`]
- `tests/back.test.ts`, `tests/a11y-keyboard.test.ts` [verified, files exist]

**Pattern, in the abstract.** **One pure function answers "what does back mean right now."** Hardware
back (Android/Capacitor), desktop Escape and any on-screen back arrow all route through it — no forks
[verified, :4-8]. It is pure: no DOM, no Capacitor import, no dispatch, so the entire navigation policy
is unit-testable including its exhaustiveness [verified, :10-12].

Four tiers, walked in strict precedence [verified, `backIntent` :177-207]:
- **0 — dismiss the topmost layer**, innermost first. Confirms are listed first so **a second back press
  can never confirm a destructive action** [verified, :178-184 — and note the comment that this one
  "matters more than its twin", because cancelling one confirm merely keeps you in a round while the
  other would throw a round away].
- **1 — navigate to the parent, using the screen's own back action**, so back can never land somewhere
  the UI itself wouldn't [verified, :18-20].
- **2 — swallow** on forward-only beats. Deliberate: letting back skip a beat would let a player dodge a
  reward pick and desync persisted "seen" state. *"One dead press beats a corrupted campaign"*
  [verified, :21-23, and the swallow list at :143-162].
- **3 — confirm, then leave**, only inside a run [verified, :24-27].

Two structural details:
- **`title` is the ONE screen where back may exit the app** [verified, :28, :80-81].
- **`screenIntent` ends in a `never` assignment**, so adding a `Screen` fails to compile until back is
  decided for it. The comment explicitly rejects a `Record<Screen, …>` lookup as the alternative,
  because a Record is satisfied by a wrong-but-present entry and several screens need to read state
  [verified, :68-75, :164-169].
- **Side-effect-layer flags are passed IN** via a `BackContext` rather than the module reaching for the
  DOM — the settings sheet, club picker and star-map sheet are app-layer module state [verified, :55-66].

Related but separate: the promise copy lives here too — `resumePromise` (:218), `exitPrompt` (:233),
`abandonPrompt` (:261) — so the confirm card and the settings-menu row that offers the same action read
**the same sentence from the same source**, and a control cannot promise something milder than the write
[verified, :209-217, :243-249]. The rule stated there is worth keeping: *"the verb changes when the
thing changes"* [verified, :246-248].

Keyboard parity is a separate but adjacent mechanism: arrow keys mirror the pointer drag axes **through
the same setter the drag calls**, so the two inputs cannot drift, machine-checked; and the listener's
cleanup runs at the TOP of the wiring function, before every early return, or a naive per-render bind
stacks listeners and one press steps N times [verified, CLAUDE.md GS-a11y-keyboard; guarded by
`tests/a11y-keyboard.test.ts`].

**Transfer.** **Directly.** A shooter has fewer screens than this game but the same problem — pause
overlay, upgrade-pick screen (a forward-only beat, exactly tier 2), stage-select, hub. And the tier-2
insight is *sharper* for you: a roguelike upgrade pick is precisely the beat where a back press must not
be allowed to skip a choice. The `never` guard costs nothing and pays forever.

**Entanglement risk.** **Clean as structure, Tangled as content.** It imports only types plus
`abandonTarget`/`resumeCost` [verified, :30-31]. The `Screen` union and the copy are yours to write.

**Guard.** `tests/back.test.ts`, plus — the strongest one — the `never` fallthrough itself, which is
compile-time [verified]. CLAUDE.md also documents a test that parses a rendered back button's own
`data-action` out of the HTML, compares it to `backIntent`, and reduces it, failing if the action
returns the same state — because every navigation action is `screen`-guarded, so a button carrying a
neighbour screen's action is a **dead button**, not a wrong destination [verified, CLAUDE.md
GS-story-back-dead; guarded in `tests/story-campaign-picker.test.ts`]. That trap is real and generic.

**Port vs rebuild.** **Port the file, rewrite the switch.** ~2 hours. **Recommendation: adopt on day
one, with the `never` guard, before you have more than three screens.**

---

## 1.11 The screen/state reducer, and how a new screen is added

**Files**
- `src/ui/game.ts` — 2,818 lines. `reduce(state, action)` at `:403`, a switch of ~150 cases [verified,
  read `:1-80` + case listing]
- `src/ui/gameState.ts` — 724 lines. The `Screen` union at `:38-102`, `UiState` at `:104+`, the `Action`
  union [verified, read `:1-120`]
- `src/ui/gameCosmetics.ts`, `src/ui/gameUpdates.ts` — sibling modules that never import the barrel
  [verified, CLAUDE.md GS-refactor-split; confirmed `gameState.ts` header at :1-9]
- `src/app.ts` — 4,703 lines (boot, dispatch, render, play screen) [verified, `wc -l`]
- `src/app/*.ts` — ~34 per-screen modules [verified, `ls`]

**Pattern, in the abstract.** `(UiState, Action) → UiState`, pure, holding no DOM and no time, so the
whole interactive flow is unit-testable [verified, `game.ts:1-7`]. Persistence and rendering are
side-effects in the shell, not in the reducer [verified, same]. The type surface is split into a leaf
module (`gameState.ts`) that every reducer module can import without a cycle, and the barrel re-exports
everything so existing import sites are unchanged [verified, `gameState.ts:1-9`].

**Adding a screen is a documented four-step ritual** [verified, CLAUDE.md UI layer bullet + the code]:
1. Add to the `Screen` union in `gameState.ts`.
2. Decide back for it in `back.ts` — *forced*, the build fails otherwise.
3. Add a `src/app/<name>Screens.ts` module that reads `state` from `ctx.ts` and never dispatches or
   imports `app.ts`.
4. Give its chrome its **own CSS class prefix**.

That last one is not cosmetic advice. CSS classes and DOM ids are global, and the app is split across
modules that cannot see each other's names — a real regression (#353) came from `.gs-hud` being shared
between the play HUD and the journey HUD [verified, CLAUDE.md, cited twice].

Two more properties worth stealing: **surgical re-renders** (an in-sheet toggle swaps only that sheet's
innerHTML and re-wires, rather than a full render which re-mounts frames and replays entrance animations
as a flicker) [verified, CLAUDE.md GS-settings-flicker; `preservingFocus` at `focus.ts:265` exists to
serve exactly this]; and **`?screen=` deep-links** that mount any between-stop screen headlessly *through
the real reducer transitions*, so a render bug cannot hide behind the shortcut [verified,
`app.ts:224`, `jumpToScreen` at `:264`, and the doc comment at `:257-263`].

**Transfer.** **With adaptation.** The reducer shape is right and the screen ritual is right. But note
the honest scale mismatch: this reducer has ~60 screens and ~150 actions because it is an RPG with a
campaign, a shop, a clubhouse, a locker, a shipyard and a story mode. A wave shooter has maybe 10–15
screens. **Do not import the size; import the ritual.** Also note `app.ts` at 4,703 lines is
acknowledged in CLAUDE.md as "still the hottest file — extend a `src/app/*` module, don't grow it"
[verified] — that is a warning about what happens when the shell is not split early enough.

**Entanglement risk.** **Fused.** `game.ts` imports ~30 sim modules in its first 80 lines [verified,
:10-80]. `UiState` carries `run: Run`, `course: Course`, `played?: PlayedHole[]` [verified,
`gameState.ts:104-110`]. There is nothing to lift.

**Guard.** `tests/ui.test.ts` and ~40 flow tests [verified, file list]. The compile-forced guard is
`back.ts`'s `never`. Screen chrome gets browser layout smoke tests [verified, `tests/build.test.ts`
pattern + the `?screen=` deep-links].

**Port vs rebuild.** **Rebuild.** ~1 day for the reducer shape + 5 screens. **Recommendation: rebuild,
and adopt the four-step screen ritual verbatim from the start — especially the CSS prefix rule, which is
free before you have any CSS and expensive after.**

---

## 1.12 Content-as-data: adding an item / enemy / stage without an engine edit

**Files**
- `src/sim/rpg/ships.ts` — `ShipLook` at `:21-60`, `Ship` at `:62-80`, the `SHIPS` catalogue [verified,
  read `:1-80`]
- `src/render/battleArms.ts:82` — `Record<ShipLook['kind'], ShipArms>` [verified]
- `src/render/shipWeapons.ts:56` — `Record<ShipLook['kind'], Weapon>` [verified]
- `src/render/music.ts` — `MusicTrack` rows per archetype [verified]
- `src/render/audio.ts:199` — `Record<BiomeArchetype, TreeVoice>` [verified]
- `src/sim/course/themes.ts`, `biomes.ts` [assumed from names + CLAUDE.md]

**Pattern, in the abstract.** A content type is **a row in a table plus a `kind` discriminator**, and
every subsystem that must have an opinion about that content declares a
`Record<Discriminator, SubsystemRow>`. Because a `Record` over a closed union is exhaustive, **adding a
new discriminator value fails to compile until every subsystem has decided about it.** The serpent ship
comment states this outright: a bespoke kind "is compile-forced through every
`Record<ShipLook['kind'],…>` (guns, plan view, cabin)" [verified, `ships.ts:37-40`].

Three supporting conventions:
- **A row carries its own palette**, so downstream systems derive their livery from it rather than
  keeping a parallel table (`shipArmsFor` pulls `look.flame`/`look.glass`) [verified,
  `battleArms.ts:242`].
- **Optional fields default to the classic behaviour**, so an un-opted row is byte-for-byte the old one
  (`fly?: 'nose'|'hover'`, `bling?`, `flag?`; every `MusicTrack` timbre lever is optional) [verified,
  `ships.ts:41-60`, `music.ts:72-84`].
- **Reveal/unlock is a predicate on the row**, one per catalogue, not scattered conditionals
  (`unlockHoles?`, `secret?`) [verified, `ships.ts:71-78`].

The stated rule is "new world / item / golfer = a new row, not an engine edit" [verified, CLAUDE.md].
The honest caveat CLAUDE.md itself gives: this holds for *additive* rows; **re-cutting a taxonomy** (it
names the club list) fans out to defaults, thresholds, seeded fixtures and the balance harness
[verified, CLAUDE.md architecture bullet].

**Transfer.** **Directly, and it is the single most important habit for your game shape.** Enemy types,
weapons, upgrades, stages, pilots are all this. A `Record<EnemyKind, {ai, sprite, hitbox, sfx, drop}>`
per subsystem means a new enemy is a set of rows and the compiler enumerates what you owe.

**Entanglement risk.** **Clean as a pattern; the tables themselves are content.**

**Guard.** The `Record` type is the guard, and it is the strongest kind — it makes drift *not build*
[verified, stated as such at `one-description.test.ts:15-19` and `battleArms.ts:80-82`]. Backed by
coverage tests where a Record can't express it (`tests/biome-identity.test.ts` guards full archetype
coverage; `tests/audio.test.ts` the voice coverage) [verified, file list + CLAUDE.md].

**Port vs rebuild.** **Rebuild the tables; port the discipline.** Free. **Recommendation: make the first
enemy a `Record` row on day one, not the third.**

---

## 1.13 Things I found that you did not ask about but that are load-bearing

### 1.13a The balance harness, and the rule about what it is allowed to decide

**Files** — `scripts/death-spiral.ts`, `scripts/endless-ai-depth.ts`, `scripts/qualifier-balance.ts`,
`scripts/warp-scramble-depth.ts` [verified, `ls scripts`]; the contract is CLAUDE.md #4 [verified].

**Pattern.** A headless harness plays thousands of instances and asserts population-level bars (a
difficulty metric under a threshold, blow-ups under a percentage). Re-run after any change to physics,
dispersion, generation or hazards. **And then the rule that makes it survivable:** *the harness measures
the AI, and the AI is much weaker than a real player, so a harness number moving the wrong way is
evidence about the AI, never proof the physics is wrong. When honest physics and the fence disagree: set
the physics from reality, MOVE THE FENCE, and record both numbers in the commit* [verified, CLAUDE.md
GS-carry-roll-real]. The worked example is in the file: fixing an unrealistic split *improved* the
harness from 0.8740 to 0.5215 because the AI had been under-performing the whole time, and the bar it
was defending was partly an artefact of the bug it was gating.

**Transfer.** **Directly.** A shooter's version is clear-rate/death-rate/time-to-clear per wave, and a
headless loop (§1.3) is its prerequisite. The doctrine transfers exactly: **a regression fence is not a
design authority.**

**Guard / cost.** The harnesses are `scripts/`, not tests — they are run deliberately, not on every PR
[verified, they are not in `tests/`]. **Recommendation: build one as soon as the loop is pure. Rebuild
(~1 day). It is the only way to change feel numbers without guessing.**

### 1.13b The "one decision, one home" register

**Files** — `tests/one-description.test.ts` [verified, read `:1-120`]

**Pattern.** A test file holding a table of `{fact, home, answers, scan, pattern: RegExp, allowed, cost}`
rows, each of which **scans a whole source tree for the shape of a second description** and fails if one
appears outside the declared home [verified, :88-108 for the interface, :112+ for rows]. The header
ranks the three guard strengths — compile-forced > one seam + source scan > a test reading both copies —
and instructs you to always prefer the first [verified, :19-31].

Two self-checks keep it honest: **the register excludes itself** (it names every banned shape in its own
literals) [verified, :86-87], and **the admission rule**: a row earns its place only once a fact has two
or more callers, because extracting a seam for one caller is over-abstraction and banning a
re-derivation nobody performs is the same error wearing a guard's clothes [verified, :33-38]. And the
escalation rule: when a row cries wolf, make the pattern precise or add a *named* exception —
**never relax it**, because a guard everyone has learned to edit is worse than none [verified, :40-43].

**Transfer.** **Directly, and I would take it.** The stated cost history is: a deck boundary described
twice (seven separate bugs), a resume-state description twice (players lost parked runs), a Chromium
lookup in nine files (50 tests silently skipped in CI for months), and a save-shape discrimination
re-derived on the day the integrity work shipped [verified, :7-15].

**Entanglement risk.** **Clean.** ~100 lines of scaffolding + N domain rows.

**Port vs rebuild.** **Port the scaffolding (~1 hour), start with zero rows.** Add a row the second time
you find a fact described twice, per the admission rule.

### 1.13c The crash report as a *pure builder*, not an SDK

**Files** — `src/crashReport.ts` [verified, read `:1-60`]; `tests/crash-report.test.ts`,
`crash-toast-browser.test.ts` [verified, files exist]

**Pattern.** Because the sim is pure, deterministic and seeded, **a seed plus a build number IS the bug
report** — it replays the failing run in a test file, which is strictly more useful than a minified
stack trace from a collector [verified, :4-9]. So the report is *built* by a pure function (timestamp
passed in, not read from the clock, so it stays reproducible), *shown* to the player, and copied only if
they choose to send it. Capped at 1400 chars because the target is an itch comment box and a report
nobody can paste is a report nobody sends [verified, :12-14, :59-60]. Context is version + message +
`source:line:col` + run seed/hole/mode + device shape + a **repeat count** (a rAF-loop fault fires
60×/second; the count is the signal) [verified, :21-56].

**Transfer.** **Directly**, and it is a stronger argument for you than for golf: a shooter's crashes are
overwhelmingly mid-loop, where a seed + wave index + elapsed frame reproduces exactly. **Port (~1 hour).**

### 1.13d The boot watchdog

**Files** — `index.html:3300-3420` [verified, read in full]; guarded by `tests/build.test.ts` [verified]

**Pattern.** An inline classic (non-module) script before the module bundle that: polyfills `globalThis`
for older module-capable WebViews; paints an immediate visible "loading… (build X)" marker; installs
`window.onerror` (the only handler that yields `source:line:col`, which is what locates a throw inside a
single-line minified bundle), a capture-phase `error` listener (so resource 404s, which do not bubble,
are seen), and `unhandledrejection`; latches the FIRST error so a 5s timeout cannot clobber the real
cause; and after 5s reports boot stage, captured error, ES-module support, whether a test module ran,
and the UA [verified, :3313-3418].

**Why it is not optional:** *a throw during top-level evaluation of any imported module aborts the whole
bundle before the entry's own try/catch runs*, so only global handlers can catch that class
[verified, :3316-3322]. And it is a **deploy diagnostic**: if the watchdog reports `…/src/main.ts`,
that is a string a Vite *build* can never emit, so raw source is being served — the exact signature of
GitHub Pages set to "Deploy from a branch" [verified, CLAUDE.md deploy bullet].

**Transfer.** **Directly. Port verbatim (~30 min)**, minus the game-name strings. This is 80 lines that
converts "the game is a blank page and nobody knows why" into a readable answer.

### 1.13e The offscreen scene cache and the camera-settle rule

**Files** — `src/render/playView.ts:220` `CAMERA_SETTLE_PX = 0.05`, `:225` `CAMERA_SETTLE_ZOOM = 0.002`,
`drawStatic()` at `:687-715` [verified, read]; `tests/play-scene-cache.test.ts` [verified]

**Pattern.** While the projector is unchanged, the static world is painted ONCE into an offscreen canvas
and blitted; a *moving* camera skips the offscreen entirely, because painting it as well as the frame is
strictly more work [verified, :672-678, :687-715]. Two traps it documents:
- **The offscreen takes `canvas.width` directly, never a re-derived `width * dpr`** — the ratio folds in
  a fractional UI zoom, a canvas width attribute truncates, and a one-device-pixel disagreement
  resamples the whole world [verified, :681-686 comment + `:693-694` code].
- **The eased follow-cam must be able to ARRIVE.** An exponential ease with a fresh projector per frame
  changes the cache key every frame forever; under a *screen-pixel* threshold (not a world-unit one,
  which means something different at every zoom) it snaps and stops [verified, :809-825, :219-225].
- A no-second-context fallback repaints per-frame rather than dropping the world off screen
  [verified, :698-704].

**Transfer.** **With adaptation.** A scrolling shooter's background is *always* moving, so the
"projector unchanged ⇒ blit" trigger rarely fires — but the *technique* (pre-render static layers to an
offscreen, blit with an offset) is standard and the two traps are exactly the ones you will hit. The
guard is the transferable part: `tests/play-scene-cache.test.ts` is **a canvas-op census, confirmed to
fail at the old 97,477 ops — never a frame-rate assertion** [verified, CLAUDE.md GS-shot-lag]. Counting
draw calls is testable in CI; measuring FPS is not.

### 1.13f Eyes-on preview rigs, and the three ways they lied

**Files** — ~64 `scripts/*-preview.mjs` rigs; `scripts/chromium.mjs` (the one launcher) [verified,
`ls scripts` + read `:1-90`]

**Pattern.** For anything a pure test cannot see (art, layout, motion), a headless-Chromium rig renders
a contact sheet you look at. **`launchChromium` THROWS if no browser starts**, because a rig that cannot
show you the picture has failed at its only job and must exit non-zero [verified, `chromium.mjs:11-15`].
Before that, 65 copies of a Linux-only lookup meant every rig printed "no chromium, wrote /tmp/….html"
and **exited 0** on the author's Windows machine — every art preview silently rendered nothing while
reporting success [verified, :8-13]. A system browser deliberately **outranks** a cached Playwright
download, because the Windows download refuses to start on a box whose system Chrome runs fine
[verified, :85-90 region + CLAUDE.md GS-preview-chromium].

CLAUDE.md records three further ways rigs lied, and they generalise: a rig drew at a hand-set camera the
game does not use; a rig reasoned in the plan's units and could not see a camera cancelling the motion
it measured; and the guard for a bounce ratio was pinned against an unvalidated threshold, so it
*defended the bug* for three passes [verified, CLAUDE.md GS-runout-clock, GS-bounce-flat]. The stated
lesson: **when a report survives a fix that measured green, stop improving the measurement of the MODEL
and go measure the PICTURE.**

**Transfer.** **Directly, and more urgently.** Everything about a shooter's feel is motion. **Port
`chromium.mjs` verbatim (~15 min)** — it already handles Windows, which per your memory notes is where
the full Playwright Chromium fails. Build rigs that render at the **shipped camera constants**, not
hand-set ones.

### 1.13g The privacy guard as a build gate

**Files** — `tests/privacy.test.ts` [verified, read `:1-80`]; `PRIVACY.md` [verified, exists]

**Pattern.** Three scans over all of `src/`: no `fetch`/`XMLHttpRequest`/`sendBeacon`/`WebSocket`/
`EventSource` (:40); no `document.cookie`/`navigator.geolocation` (:51); no analytics-shaped
*dependency* in package.json, matched by name against a list of 13 vendors — *"analytics arrive as a
dependency long before they arrive as a `fetch`"*, so the conversation happens at `npm install` time
(:56-64). Then the bidirectional one: every `'fc_*'` literal in `src/` must appear in `PRIVACY.md`'s
table, **and vice versa** (:70-80).

The framing is the reusable part: *"the fix is NOT to relax the test — it is to decide whether the game
is still allowed to say it collects nothing, and update PRIVACY.md"* [verified, :38-40]. And the known
caveat: the **built** bundle does contain `fetch`/`document.cookie` (Vite's modulepreload polyfill,
Capacitor's unused shims), which is why the guard scans `src/` and the document *names* them rather than
claiming the bundle is clean [verified, CLAUDE.md opening block].

**Transfer.** **Directly. Port (~1 hour).** Same claim, same platform, same value on a store page.

---

# SECTION 2 — BUILD & DEPLOY

## 2.0 The actionable identity table

Every string of this project's identity that is baked into build, deploy, manifest, service worker,
native packaging or CI. **All line numbers verified by reading the file or by `grep -n`.**

| # | Decision | Current | → Into the Coil | Sites |
|---|---|---|---|---|
| 1 | **Storage key prefix** | `fc_` | `itc_` | `src/save/legacyKeys.ts:27` (`CURRENT_PREFIX`) · `src/save/storage.ts:11` (`fc_save`) · `src/save/storyStore.ts:35` (`fc_story`) · `src/settings.ts:48` (`fc_settings`) · `src/save/durability.ts:35` (`fc_probe`) · `src/app/titleScreens.ts:32` + `src/app.ts:3902` (`fc_installNudge`) · `src/app.ts:4523`,`:4694` (`fc_introSeen`, sessionStorage) · guard regex `tests/privacy.test.ts:74` · assertions `tests/brand.test.ts:29-32` · **and `PRIVACY.md`'s table**, which the guard reads |
| 2 | **Legacy storage prefix** | `gs_` | *delete entirely* | `src/save/legacyKeys.ts:24`. A new game has no legacy namespace — **do not port this module**; port the *idea* for your first rename only. `tests/brand.test.ts:71-75` asserts exactly two prefix constants exist |
| 3 | **SW cache prefix** ⚠️ **3 files, no shared constant** | `far-carry-` | `into-the-coil-` | `public/sw.js:22` (`var CACHE = 'far-carry-' + VERSION`) · `public/sw.js:50` (retire sweep, `k.indexOf('far-carry-') === 0`) · `index.html:3363` (**foreign-cache sweep — deletes every cache NOT carrying the prefix**) · comment at `index.html:3346` · guard `tests/brand.test.ts:81-90` |
| 4 | **SW version token** | `fc-pwa-%GS_VERSION%` | `itc-pwa-%ITC_VERSION%` | `public/sw.js:21` · substituted by the `gs-version-sw` plugin in `vite.config.ts` (`SW_VERSION_TOKEN`) · asserted `tests/brand.test.ts:93-108` |
| 5 | **HTML build placeholder** | `%GS_VERSION%` | `%ITC_VERSION%` | `index.html:3332` · `vite.config.ts` `transformIndexHtml` + `SW_VERSION_TOKEN` const |
| 6 | **Backup file `kind`** | `far-carry-backup` | `into-the-coil-backup` | `src/save/backup.ts:40` · legacy accepted value `:44` (`golf-stars-backup`) · comment `:110` · `tests/brand.test.ts:31`, `tests/save-integrity.test.ts:278`,`:290`. **⚠️ Into the Coil must ALSO accept `far-carry-backup` v1+v2 as a READ-ONLY import format** for the cross-game save-import feature |
| 7 | **Backup filename prefix** | `far-carry-save-…json`, `far-carry-unreadable-…json` | `into-the-coil-…` | `src/app/saveTransfer.ts:59` · `:102` |
| 8 | **Native app id** ⚠️ permanent | `com.foxorama.golfstars` | `com.foxorama.intothecoil` | `capacitor.config.ts:17` · `android/app/build.gradle:30` (`namespace`) · `:33` (`applicationId`) · `android/app/src/main/res/values/strings.xml:5` (`package_name`) · `:6` (`custom_url_scheme`) · **directory** `android/app/src/main/java/com/foxorama/golfstars/MainActivity.java` (path AND package declaration) |
| 9 | **Native app label** ⚠️ **already stale here** | `Golf Stars` | `Into the Coil` | `android/app/src/main/res/values/strings.xml:3` (`app_name`) · `:4` (`title_activity_main`). **This is the launcher label under the icon and it never moved with the rename.** No test covers it — I grepped `tests/` and `scripts/` for `app_name`/`strings.xml` and found nothing |
| 10 | **Capacitor `appName`** | `The Far Carry` | `Into the Coil` | `capacitor.config.ts:20` |
| 11 | **npm package name** | `golf-stars` | `into-the-coil` | `package.json:2` |
| 12 | **Package description** | *"A travelling space golf RPG…"* | your logline | `package.json:6` · `public/manifest.webmanifest:4` — **two copies, no shared source** |
| 13 | **Repo** | `github.com/Foxorama/Golf-Stars` | `Foxorama/into-the-coil` | git remote. Appears in prose in `README.md`, `CLAUDE.md`, `docs/decisions/*` |
| 14 | **Production origin** | `farcarry.vulpecula.games` | `intothecoil.vulpecula.games` | ⚠️ **Not in git at all** — no `CNAME` file exists (I searched the whole tree). It is GitHub Pages admin-UI config. Referenced in prose only: `docs/decisions/process-and-deploy.md:239,257,346,356,371` |
| 15 | **Staging origin** | `next.farcarry.vulpecula.games` | `next.intothecoil.vulpecula.games` | ⚠️ **Not in git** — Cloudflare Pages project config. Prose: `.github/workflows/pages.yml:11`, `docs/decisions/process-and-deploy.md:372` |
| 16 | **Preview origin** | `<branch>.next-far-carry.pages.dev` | `<branch>.next-into-the-coil.pages.dev` | ⚠️ **Not in git** — derived from the Cloudflare project name. Prose: `docs/decisions/process-and-deploy.md:373` |
| 17 | **itch target** | `vulpeculagames/the-far-carry:html5` | `vulpeculagames/into-the-coil:html5` | `.github/workflows/itch.yml:97` (`butler push`) · `:99` (`butler status`) · `:106` (summary URL `https://vulpeculagames.itch.io/the-far-carry`) |
| 18 | **PWA manifest identity** | name / short_name / description | yours | `public/manifest.webmanifest:2,3,4` |
| 19 | **PWA orientation** 🔴 | `"portrait"` | `"landscape"` *(or omit)* | `public/manifest.webmanifest:9`. **The single most actionable line in this table for a landscape game.** |
| 20 | **HTML titles** | `The Far Carry` / `Far Carry` | yours | `index.html:13` (`<title>`) · `:23` (`apple-mobile-web-app-title`) · `:26` (stylesheet comment) · `:3340` + `:3371` (**boot-watchdog literals — these CANNOT import `brand.ts`**, the watchdog runs before any module) |
| 21 | **Theme / background colour** | `#0b0d12` | yours | `public/manifest.webmanifest:10`,`:11` · `index.html:18` (`theme-color`) · `index.html` `--gs-bg` token · `capacitor.config.ts:25` · `android/app/src/main/res/values/colors.xml` (`gsSystemBar`, asserted at `tests/android-theme.test.ts:32` against the literal `#0b0d12`) — **five sites, one decision** |
| 22 | **CSS / DOM / flag prefix** | `gs-` / `_gs*` / `__gs*` | e.g. `itc-` / `_itc*` | Pervasive: every class in `index.html`'s stylesheet, every `data-gs-*` attribute, `--gs-*` tokens, `window._gs*` feel flags, `#gs-live`, `#gs-crash`, `data-gs-fit`, `data-gs-embed`, `data-gs-overlay`. Discovery regexes live at `tests/test-hub.test.ts:50-52` |
| 23 | **Vite define names** | `__APP_VERSION__`, `__BUILD_ID__` | keep (generic) | `vite.config.ts` `define` · `src/brand.ts:32`,`:73` |
| 24 | **Guide URL** | `https://vulpecula.games/guide` | `/coil-guide` or similar | `src/brand.ts:70`. Note the rule: it is a **permanent short redirect**, because it ships inside builds that can never be edited again [verified, :60-65] |
| 25 | **Pages subpath assumption** | `/golf-stars/` in comments | yours | `index.html:16`, `:3355` (comment only — `base` is `./` and relative, so this is prose, not behaviour) |

### The multi-site decisions, called out loudly

Four facts are written in more than one place and **cannot share a constant**. These are the ones that
break silently in a new repo:

1. 🔴 **SW cache prefix — THREE files** (`public/sw.js` ×2, `index.html:3363`). `index.html`'s sweep runs
   before any module and **deletes every cache not carrying the prefix**. If the three disagree, the app
   deletes its own offline snapshot on every boot while believing it is tidying up after a sibling app —
   **silently, and only visible offline** [verified, `index.html:3348-3354`, `public/sw.js:16-21`]. Only
   `tests/brand.test.ts:81-90` catches it.
2. 🔴 **Theme colour `#0b0d12` — FIVE files** (manifest ×2, index.html meta, capacitor config, android
   colors.xml). Guarded only for the Android half, and only against a hard-coded literal
   [verified, `tests/android-theme.test.ts:32`].
3. 🟠 **Product description — TWO files** (`package.json:6`, `manifest.webmanifest:4`), no guard found.
4. 🟠 **Product name — brand.ts plus four unreachable sites.** `src/brand.ts:35` is the single source for
   everything that can import, but **the boot watchdog cannot import** (it runs before the module
   bundle), so `index.html:3340` and `:3371` carry literals; `<title>` at `:13` and
   `apple-mobile-web-app-title` at `:23` are HTML; the manifest is JSON. `tests/brand.test.ts:159-166`
   guards only six *TypeScript* surfaces against a hard-coded name — the four non-TS sites are
   unguarded [verified].

---

## 2.1 Build config — `vite.config.ts`, `tsconfig.json`, `package.json`

**Files** — `vite.config.ts` (read in full), `tsconfig.json` (read in full), `package.json` (read in
full) [verified]

**What it does.** Vite + TypeScript. Three decisions that are load-bearing and non-obvious:

1. **`vite-plugin-singlefile` inlines the entire bundle into one `index.html`.** The stated reason:
   serving separate hashed assets on GitHub Pages kept failing (404 / CDN index-asset skew / SW
   interception) and white-screened the app. **With no external asset there is nothing to 404**
   [verified, `vite.config.ts` comment above `base`]. This is also what makes the assetless-audio and
   vector-art rules coherent — the whole game is one file plus five install assets.
2. **`build.target: 'es2017'`** — down-level modern syntax so the bundle *parses* on older
   module-capable engines (some mobile WebViews support ES modules but not 2020-era syntax). Leaving it
   raw made the whole module fail to parse → blank page [verified].
3. **Two single-file pages cannot build in one pass** — the plugin forces `inlineDynamicImports`, which
   Rollup forbids with multiple inputs, so `npm run build` runs vite **twice**, gating the entry on
   `VITE_HUB`, and the second pass sets `emptyOutDir: false` so it appends [verified].

Two more worth stealing: `buildId()` reads `GITHUB_SHA` / `CF_PAGES_COMMIT_SHA` / `VERCEL_GIT_COMMIT_SHA`,
falls back to `git rev-parse`, and labels anything else honestly as `dev` — because `APP_VERSION` from
package.json stood for fourteen merges and could not answer *"is this the build I just deployed"*
[verified]. And the `gs-version-sw` plugin **throws** if the placeholder is missing from the built
worker, rather than silently shipping an unstamped one [verified].

`tsconfig` is strict plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`,
`noUncheckedIndexedAccess` [verified]. `allowJs` is on solely so `tests/chromium.ts` can re-export the
plain-ESM `scripts/chromium.mjs` [verified, comment in tsconfig].

**Content-agnostic?** **Mostly yes.** `base` defaults to `'./'` (relative), so there is no hardcoded
path [verified]. Identity in it: the `%GS_VERSION%` token spelling (#5) and the `__APP_VERSION__` /
`__BUILD_ID__` define names (#23, generic enough to keep). **The `check` script is the important
convention to copy**: `npm run check` = `typecheck && test && build`, in CI's exact order, because
`vitest` transpiles with esbuild and **does not type-check** — a green suite says nothing about `tsc`
[verified, `package.json` + CLAUDE.md].

**Port vs rebuild.** **Port `vite.config.ts` nearly whole (~1 hour, renaming the token).** Rebuild
`package.json`. **Recommendation: keep the single-file build.** It is the reason this project does not
have an asset-serving failure mode, and it costs a 2.4MB HTML file.

⚠️ **One thing to reconsider:** the single-file inline is right for a vector/synth game. Into the Coil
is a shooter and may want sprite sheets and real audio. If so, the single-file decision inverts and you
inherit the asset-404 problem this repo designed itself out of — decide that **before** you copy the
config, not after.

## 2.2 CI — `.github/workflows/tests.yml`

**File** — read in full [verified]

**What it does.** `pull_request` + `workflow_dispatch` + `workflow_call`. Node 22, `npm ci`,
`npx playwright-core install --with-deps chromium`, then `typecheck` → `test` → `build`.

Three decisions with measured justifications:
- **One run per change, on the PR only.** The old `push: ['**']` + `pull_request` pair sat in different
  concurrency groups, so every commit on a branch with an open PR ran the ~7-minute suite twice —
  measured at **2,333 runs in 39 days, roughly half duplicates** [verified, header]. The PR run is kept
  because it tests the **merge commit**, which a branch push cannot.
- **The post-merge run on `main` is deliberately gone, and an admin-UI setting replaces it**: branch
  protection's *Require branches to be up to date before merging*. **This is not in git** [verified,
  header].
- **`permissions: contents: read` is declared** so a caller cannot lend the suite its own scopes — a
  called workflow inherits the caller's permissions, and `pages.yml` holds `pages: write` + `id-token:
  write` [verified].
- **`concurrency.group` includes `github.workflow`** because a tag starts *two* callers at once
  (`pages.yml` and `itch.yml`); on `github.ref` alone they share a group and `cancel-in-progress` makes
  the second cancel the first, whose deploy is then skipped — **a release that quietly half-ships**
  [verified].
- ⚠️ **No `paths-ignore` for docs, ever** — `privacy.test.ts` and the one-description register read
  prose as input, so a docs-only change can be genuinely red [verified].

**Content-agnostic?** **Yes, entirely.** No identity strings. The only project-specific thing is the
Chromium install step, which you also need.

**Port vs rebuild.** **Port verbatim (~10 min).** Every comment in it is a lesson you would otherwise
re-learn.

## 2.3 Deploy — `pages.yml`, `itch.yml`, and the staging model

**Files** — both read in full [verified]; `docs/decisions/process-and-deploy.md` [verified, grepped]

**The model** [verified, `process-and-deploy.md:371-373` + `pages.yml` header]:

| tier | where | trigger | audience |
|---|---|---|---|
| production | GitHub Pages, custom domain | **version tag `v*`** | installed PWAs, everyone |
| staging | Cloudflare Pages, `next.<domain>` | every push to `main` | the team |
| preview | Cloudflare Pages, `<branch>.<project>.pages.dev` | every branch | before merge |

**Why it is shaped this way, and it applies to you unchanged.** `pages.yml` used to fire on every push
to `main`, and the production origin is one **real players have installed as a PWA** — so every merge
went straight to their phones. One day shipped four passes at a feel mechanic that way, two of them
net-worse, each live within minutes and with no way to try it first [verified, `pages.yml:7-13`].

🔴 **The rule that will bite you if you ignore it: staging must be a separate ORIGIN, never a path.** A
PWA binds to its origin and `localStorage` is per-origin, so `/next/` would have staging and production
sharing the same save blobs — and a staging build with a bumped schema would write one production
correctly refuses to read, going read-only on a real player [verified, `pages.yml:20-24`]. Production
therefore also **cannot move**: every installed app is pinned to that origin [verified].

Both release workflows call `tests.yml` before shipping (`uses: ./.github/workflows/tests.yml`), because
a tag is not `main` — it is a commit plus whatever the release branch did to package.json
[verified, `pages.yml:38-42`, `itch.yml:42-46`]. `itch.yml` **asserts the tag matches package.json** and
fails loudly if not, because `APP_VERSION` comes from package.json and a mismatch tells the player a
version number nobody can trace [verified, `itch.yml:58-72`].

**Two out-of-git gotchas, both of which cost a failed release here:**
- 🔴 The `github-pages` **environment carries its own deployment-ref policy**, separate from the
  workflow trigger. It held a `main`-branch rule from the days when `main` was production, so the first
  tagged release built green and the deploy was **refused** — *"Tag v1.4.0 is not allowed to deploy to
  github-pages"* [verified, CLAUDE.md GS-staging]. Check
  `gh api repos/OWNER/REPO/environments/github-pages/deployment-branch-policies` in the new repo.
- 🔴 Pages **Source must be "GitHub Actions"**, not "Deploy from a branch". If it is a branch, Pages
  serves raw source whose dev entry `/src/main.ts` 404s → permanent blank page [verified, CLAUDE.md].
- 🟠 The first Cloudflare staging deploy went **green while serving the repo root** (output dir unset),
  so `/src/main.ts` returned 200 and the game was raw dev source — the same blank-page failure, caught
  by its own documented signature. **A green deployment is not a working one** [verified, CLAUDE.md].
- 🟠 itch: **always push to the same channel.** An itch HTML5 game is served from a per-upload path and
  localStorage is per-origin+path; replacing the upload by hand can hand players a fresh empty origin
  [verified, `itch.yml:20-26`]. `butler` patches rather than replaces, which is why it is used.
- The hub is stripped from the store build: `rm -f dist/test.html` [verified, `itch.yml:76`].

**Content-agnostic?** `pages.yml` — **yes**, no identity strings at all (the domain lives in admin UI +
prose). `itch.yml` — **no**, three sites carry the channel (#17).

**Port vs rebuild.** **Port both (~30 min, changing three lines in `itch.yml`).** **Recommendation:
adopt the tag-is-production / main-is-staging split from the first deploy.** It is far cheaper to set up
before players exist than to retrofit after you have shipped a bad build to installed PWAs.

## 2.4 PWA — manifest + service worker

**Files** — `public/manifest.webmanifest` (17 lines, read in full), `public/sw.js` (read in full),
`public/_headers` (read in full), `index.html:3343-3366` (foreign-cache sweep) [verified]

**Manifest.** 17 lines. **Line 9 is `"orientation": "portrait"`** — change it (#19). `id`/`start_url`/
`scope` are all `"./"` (relative), which is what lets the app live under a subpath [verified].

**Service worker.** **Network-first, never cache-first**, subpath-scoped by registering with a relative
URL, so it can only ever touch this game and cannot intercept a sibling app on a shared origin
[verified, `sw.js:11-14`]. Offline falls back to the cached copy and to the app shell for navigations
[verified, `:88-102`].

🔴 **The bug worth internalising: "network-first" is a claim about the WORKER, not about the NETWORK.**
`fetch(req)` inside a worker reads the browser's ordinary HTTP cache, and GitHub Pages serves index.html
with `Cache-Control: max-age=600` — **a header Pages gives you no way to set**. So for ten minutes after
any load, "always fetch fresh" answered navigations out of the HTTP cache without asking the server, and
an installed app relaunched in that window rendered the *previous* build [verified, `sw.js:62-79`]. Two
fixes: the shell is fetched with **`cache: 'no-cache'`** (a conditional request every launch — **not**
`no-store`, which would re-download the whole 2.4MB bundle on mobile data), and the registration passes
**`updateViaCache: 'none'`** (by default the browser asks its own cache whether `sw.js` changed, so a
worker whose bytes genuinely differed still never installed) [verified, `sw.js:70-79` + CLAUDE.md].
Diagnosed by reproducing it against a server sending Pages' real headers, and the control that settled
it was **removing the worker entirely and watching the staleness survive** [verified].

**`public/_headers`** sets `no-cache` on `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`. GitHub
Pages ignores the file entirely and itch serves a zip, so it only takes effect on Cloudflare staging —
and it is deliberately written to be correct on *any* host [verified].

**Content-agnostic?** **No.** The manifest is pure identity (#18, #19, #21). The worker carries the
cache prefix (#3) and the version token (#4). The `SHELL` precache list names the five install assets
[verified, `sw.js:26`].

**Port vs rebuild.** **Port `sw.js` and `_headers` (~30 min, renaming the prefix in all three sites).
Rewrite the manifest (~10 min).** **Recommendation: port the worker. Its 40 lines of comments are the
record of three separate blank-page/stale-serve hunts, and the `no-cache` + `updateViaCache` pair is not
something you would arrive at by reasoning.**

⚠️ Guard the three-site prefix **on day one**, with `tests/brand.test.ts:81-90` ported. It is the only
thing standing between you and an app that deletes its own offline cache every boot.

## 2.5 Native packaging — Capacitor + Android

**Files** — `capacitor.config.ts` (read in full), `android/app/build.gradle` (grepped),
`android/app/src/main/AndroidManifest.xml` (read in full), `strings.xml` (read in full),
`.github/workflows/android.yml` (read `:1-80`), `src/native.ts` (read in full),
`scripts/android-assets.mjs` (read `:1-30`), `tests/android-theme.test.ts` (read `:1-40`) [verified]

**What it does.** The same web build wrapped in Capacitor; `webDir: 'dist'`, so the native shell adds
**no game code** and the browser build is unaffected [verified].

🔴 **The one rule that must survive the port: the service worker MUST stay disabled in the native
shell.** Capacitor serves from `https://localhost`, which passes any protocol guard, so an un-gated
worker would cache already-local assets and resurrect the stale-serve bug **with no hard-refresh to
escape it** [verified, `capacitor.config.ts:7-11` + `src/native.ts:11-14` + `app.ts:4623-4625`].
`isNativeShell()` is the one predicate (`src/native.ts`), dependency-free so it is safe from a draw loop
and from a node import [verified].

**Other decisions worth keeping:**
- `androidScheme: 'https'` so WebAudio, Canvas2D and localStorage behave like the browser build
  [verified, `capacitor.config.ts:27-31`].
- **The sideload build is a RELEASE APK signed with the upload key, never `assembleDebug`** — a debug
  APK carries the runner's throwaway certificate and Android refuses to update a package whose signature
  changed [verified, CLAUDE.md android bullet]. Local debug / CI debug / release are three different
  signatures; pick one channel per device.
- **The keyless build stays LOUD**: warning + run summary + an artifact literally named
  `…-UNSIGNED-cannot-update-existing-install`, because a silent-green keyless build cost a play-test
  session [verified, CLAUDE.md].
- `android.yml` triggers on `branches: ['**']` + `paths`, deliberately with no `tags:` filter, because
  `workflow_dispatch` only shows a Run button once the file is on the default branch — useless for
  testing a wrapper before merge [verified, `android.yml:9-19`]. And `secrets` is **not available in a
  step-level `if:`** (it is a workflow syntax error, which GitHub rejects at startup as a zero-job
  "failure" with no logs) — hence surfacing the secret as job-level `env` [verified, `:37-42`].
- Launcher art has ONE source: `public/icon-512.png` → `scripts/android-assets.mjs` derives all five
  sizes, with the adaptive foreground inset to 60% because Android only guarantees the middle ~66% is
  visible [verified, `android-assets.mjs:11-20`].

🔴 **For a landscape game, `AndroidManifest.xml` is where you would add `android:screenOrientation`.** It
currently sets only `configChanges` (which includes `orientation|screenSize`, meaning the activity
handles rotation itself rather than restarting) [verified, `:12`]. There is no orientation lock — and
note the reason `battleFrame.ts` exists at all: **iOS Safari has no `screen.orientation.lock`, Android
Chrome honours it only in fullscreen, and the Capacitor shell needs a native plugin** [verified,
`battleFrame.ts:10-13`]. A lock that works on one of three targets is not a mechanic. **Plan on a
rotating camera, not an orientation lock.**

**Content-agnostic?** **No — this is the most identity-dense tree in the repo.** #8 (app id, five sites
plus a directory path), #9 (app label, **already wrong**), #10, #21 (theme colour).

**Port vs rebuild.** **Rebuild via `npx cap add android` in the new repo, then port the four
customisations** (systembar colours, the SW gate, the signing config, the asset script). ~half a day.
**Recommendation: do NOT copy the `android/` tree.** It is Capacitor-generated with the old package
baked into file paths and a Java package declaration; regenerating is faster and cannot leave a stale
`Golf Stars` behind.

## 2.6 Asset scripts

**Files** — `scripts/` (79 files) [verified, `ls`]. Three categories.

- **~64 `*-preview.mjs` eyes-on rigs** — §1.13f. Content-specific, but the *harness* (`chromium.mjs`) is
  generic and must be ported.
- **4 balance harnesses** (`death-spiral.ts`, `endless-ai-depth.ts`, `qualifier-balance.ts`,
  `warp-scramble-depth.ts`) — §1.13a. Content-specific; rebuild the shape.
- **Generators + packaging**: `gen-static-courses.mjs`, `gen-constellations.mjs`, `gen-sky-coords.mjs`
  (content, drop); `android-assets.mjs` (generic given a source PNG — **port**); `genicons.mjs`,
  `banner.mjs`, `cover-shot.mjs`, `screenshots.mjs`, `capture.mjs` (store-art tooling, likely
  adaptable) [assumed from names — I read only `android-assets.mjs`].

**Note** `scripts/` is **not type-checked** (`checkJs` off, and `tsconfig.include` is
`["src", "tests", "vite.config.ts"]`) but **is** scanned by the one-description register, explicitly
because *"it is the tree where nobody is watching, so a fact re-derived there rots for months"*
[verified, `tsconfig.json` comment + `one-description.test.ts:76-79`].

**Port vs rebuild.** **Port `chromium.mjs` and `android-assets.mjs` verbatim (~30 min). Rebuild the
rest.**

## 2.7 The test-hub sync guard (a build-adjacent pattern worth naming)

**Files** — `test.html`, `src/test/hub.ts`, `tests/test-hub.test.ts` (read `:1-60`),
`standards/TEST-HUB-STANDARD.md` + `standards/test-hub-guard.template.mjs` [verified]

**Pattern.** A demo/test hub page drives the *real built game* through its public hooks, re-implementing
zero game logic. The guard is **auto-discovering**: it scans the app source for two hook dimensions —
`window._gsX` live flags (excluding `__gs*` watchdog internals via a lookbehind) and
`new URLSearchParams(location.search).get('x')` params — and asserts the hub covers **exactly** that
set, **both directions** [verified, `:50-60`]. So adding a feel flag without a hub control reds the
build; there is no manual list to keep in step. It also asserts the hub **imports** the sim's content
tables rather than copying them, so those lists cannot fork [verified, `:20-22`].

There is a **portable fill-in-the-blanks template** already sitting in `standards/`
[verified, `:23`].

**Transfer.** **With adaptation.** A shooter has fewer live-tunable flags than a golf-feel game, but it
has more: enemy speed, spawn rate, hitbox debug, invincibility, wave skip. Those are exactly the things
that get added and then rot.

**Port vs rebuild.** **Port the template from `standards/` (~1 hour).** Value depends on whether you
build a hub at all — but the *auto-discovery* trick (scan the app for the hook shape, assert the driver
covers exactly that set) generalises to any two-sided registry.

---

## Appendix — the honest "no" list

Things I looked at and would **not** take:

- **`src/sim/` beyond `rng.ts`.** Fused. §1.1.
- **`src/save/schema.ts` as code.** 34 versions of golf. Take the *pattern*.
- **`src/ui/game.ts` / `src/app.ts`.** 7,500 lines of golf-RPG flow. §1.11.
- **`src/render/style*.ts` and the 13 `style/` painters.** ~6,000 lines of golf-course art. The
  *orchestration rule* (one seeded-stream owner, per-domain painters, painters never import the
  orchestrator) is worth a paragraph in your CLAUDE.md and nothing more.
- **`src/save/legacyKeys.ts`.** A new game has no legacy namespace. Porting it would be starting with
  the rename debt already accrued.
- **The `android/` tree.** Regenerate. §2.5.
- **`storyBattle.ts`'s 2,700-line loop.** §1.5a. Take the doctrine, the three pure satellites, and the
  constants table.
