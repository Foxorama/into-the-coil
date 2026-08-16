# 0022 — Frame rate is a feature: a fixed sim, baked art, and a guard that counts work

**Accepted 2026-08-04**, before the render loop exists. Qualifies
[0017](0017-the-state-is-slices.md) in one specific place, named below.

## The target

⚠️ **SUPERSEDED BY [0153](0153-desktop-is-the-target.md), 2026-08-16 — THIS SECTION AND *The budget*
BELOW, AND NOTHING ELSE.** Desktop is now what every budget, ceiling and capacity is argued against,
and the phone is a port that has not started. **Every rule under *The rules* still holds unchanged**,
because not one of them is a phone concession: a fixed sim, baked art and a frame loop that does not
allocate are correct on any machine, and the first is correctness rather than speed. The sentence
this section already contained — *"desktop is the primary play target and is never the performance
constraint"* — is why 0153 reads as a correction to the sizing rather than a reversal of the design.

**A mid-range Android from 2021** — Snapdragon 695 / Dimensity 700 / Exynos 1280 class, 1080×2400.
Chosen over a 2023 device deliberately: it buys a five-year support span instead of two, and the two
generations are not far apart, because the binding constraint on both is **fill rate rather than
compute**.

Desktop is the primary play target and is never the performance constraint.

## The rules

**The simulation steps at a fixed 60Hz. The renderer draws at display rate and interpolates.**
A sim stepped by wall-clock delta teleports bullets through the player on a dropped frame — that is a
correctness bug wearing a performance costume — and it makes difficulty a property of the machine.
Fixed steps are also what the seeded run, the resume, the replays and the one-button clearability
proof all rest on.

⚠️ This does **not** cap smoothness. A 144Hz display gets 144 distinct interpolated frames; the sim
rate and the frame rate are independent numbers.

**Art is generated as code and baked into offscreen bitmaps at load, then blitted.** Every ship,
enemy, boss and effect is a pure function of `(kind, variant, palette, view)`. Per-frame path filling
is banned.

This is not a compromise between procedural art and sprites — it is both. No asset files, so
[0003](0003-single-file-build.md)'s single-file build survives; a blit per entity, so the frame cost
is a sprite's; and the art stays re-renderable at any size or palette, which is what makes the
high-contrast and colour-blind palettes fall out for free instead of being a second art pass.

**Nothing allocates in the frame loop.** Entities live in pre-allocated pools and are mutated in
place. GC pauses are the main source of jank in a browser game, and a shooter allocates hardest
exactly when it can least afford to.

⚠️ **This qualifies 0017, and the qualification is the whole point of writing it down.** "The state
is slices, and state is plain data" is true of the **reducer** state — screens, run, settings — and
stays true. The per-frame entity arrays inside `sim/` are mutable pools and are **not** reducer
state. Two different things wearing the same word; without this paragraph someone correctly applying
0017 makes five hundred bullets immutable at 60Hz.

**`devicePixelRatio` is capped at 2.** At DPR 3 a 1080p phone renders ~2.6M pixels a frame; the cap
drops it to ~1.15M for a difference invisible on baked bitmaps. It is the largest single lever on the
target device and it costs desktop nothing — DPR 2 *is* full quality on a Retina Mac or a 4K display
at 200%, and an ordinary monitor at DPR 1 never approaches the cap.

**Canvas2D first.** The painter takes model and state in and puts pixels out, so a WebGL backend
stays a swap rather than a rewrite. Starting on WebGL would spend weeks against a bottleneck nobody
has measured.

**Cosmetics shed before simulation fidelity.** Under load the game gets uglier, never unfair.

## The budget

**~10ms per frame for sim plus render**, not the full 16.67ms. Sustained performance on this SoC
class falls 30–40% once the phone is warm, and a budget that only holds for the first two minutes of
play is not a budget.

Worst-case scene, defined as data rather than as a feeling: **~500 drawn entities** — ~150 enemy
bullets, ~80 player projectiles, ~40 enemies, ~200 particles.

That ceiling is shared by every device, because **bullet count is difficulty, not decoration**. A
desktop that spawns denser waves is a desktop playing a different game, which is the thing the fixed
timestep exists to prevent.

⚠️ **500 is not a low ceiling for this genre.** R-Type and Raiden II both peak well below it. True
danmaku — Touhou, DoDonPachi — runs 1,500+, and that is a different game from the one in
`docs/game.md`. If that density is ever wanted, this is the decision to reopen, and the conversation
is WebGL rather than the phone.

**Where a device may legitimately differ:** background parallax depth, particle counts, debris
lifetime, screen-space effects. The rule is that **anything scaling by device must be incapable of
changing the outcome.**

## The guard counts work, not wall-clock

A millisecond assertion in CI is calibrated against nothing. The runner is not the phone, runner
hardware varies between jobs, and the result is a guard that fails on a busy afternoon and passes on
a broken commit.

So the guard asserts **draw calls, allocations per frame, and entity throughput** against the
worst-case scene above. Deterministic, independent of the hardware it runs on, and it catches the
regressions that actually happen: someone adds a per-frame allocation, someone doubles the draw
calls, someone makes a painter build a path again.

⚠️ **This is not the counting guard `CLAUDE.md` rejects, and the difference matters.** Those were
line ceilings, `case` ceilings and slice ceilings — counting **source** as a *proxy* for health, and
the measurement showed the proxy flagging the healthy file first, because the healthy file is the one
nobody is editing. This counts the thing that literally consumes the frame. A draw call is not a
proxy for cost; it is the cost.

**And a proxy still has to be calibrated against the real thing once.** A hand measurement on a
physical 2021-class device, recorded, and repeated whenever the entity budget moves — otherwise this
is a guard that has only ever been green, which [0005](0005-a-guard-must-be-seen-to-fail.md) exists
to refuse.

## Not guarded yet, and the trigger is named

There is no loop, no painter and no entity pool to assert against, so there is no confirmation table
here and no exemption owed. **The guard lands in the same commit as the rAF loop**, proved against a
deliberately over-populated scene before it is trusted — the same move
[0014](0014-the-privacy-guard-lands-before-the-first-key.md) made for the storage keys and
[0015](0015-the-layer-ladder.md) made for the layer rules.
