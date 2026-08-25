# 0193 — The sheet is the instrument, and the art channel gets one before its first tuning pass

**Accepted 2026-08-25.** The tool [0027](0027-measure-the-picture-not-the-model.md) owes the art
channel, on the terms [0126](0126-the-dashboard-is-the-instrument.md) set for the sound one.

> *"Bosses and enemies or art first?"* — and the answer, taken from the fortnight the music channel
> just spent: **the instrument first, before either.**

## Why this is the first art PR and not a silhouette

⚠️ **THE ART CHANNEL IS IN EXACTLY THE STATE THE SOUND CHANNEL WAS IN BEFORE `npm run dash`.**
`SPRITE_KINDS` holds **58 kinds**, `drawKind` is a **60-arm switch**, and the only way to look at any
of them was `scripts/shot.mjs` — which shoots the shipped page at a camera moment. That is the right
question *later* (**is this legible in play**) and useless while authoring.

⚠️ **AND THAT IS THE CONDITION `docs/state-of-play.md` RECORDS AS COSTING TWO WEEKS.** 0126 was built
after the third guess at the mix, and [0113](0113-there-is-one-composition-and-seven-levels.md)
records that building it late is what cost six rounds. `CLAUDE.md` already says the tracing instrument
is owed **before the first tuning pass on anything the player watches move** — this is that sentence,
paid on the other channel, before the pass rather than after it.

## The rule

**The sheet shows every bitmap `bakeAtlas` produces, at the resolution the game bakes it, on the
backdrop the place is found against.** `npm run sheet`.

**It bakes the game's own atlas.** `bakeAtlas(palette, 'side', viewOf(w, h).scale * dpr)` is
`src/app/mount.ts`'s own call with `src/app/mount.ts`'s own arithmetic. Nothing on the page draws a
sprite — 0116's rule, and the reason it exists: *the rig that came apart from the game had a verdict
taken from it twice.*

**The arithmetic is a module and the browser half is not.** `rig/sheet.ts` has no DOM; `rig/sheet-page.ts`
is the page. 0126's split, for the reason 0116 had to discover.

**Dev only, and not in the build.** `vite.config.ts` has one entry, so `vite build` never sees it and
[0003](0003-single-file-build.md)'s closed sidecar list is untouched. Same terms as the dashboard.

## ⚠️ What it measures that nothing here has measured before

**Whether a kind and its hurt twin are the same bitmap**, as a share of pixels.

[`where-the-art-ceiling-is`](../../reports/where-the-art-ceiling-is-2026-08-14.md) records the defect:
a boss and its hit sprite share a `case` arm, five of the seven baked as **the same bitmap twice**,
they had no hit interaction at all, and **every guard was green** because no guard could read a
bitmap.

⚠️ **AND THE FIRST RUN SAYS IT IS FIXED, WHICH IS A RESULT AND NOT A DISAPPOINTMENT.** Zero identical
pairs. All seven bosses differ from their hurt twins by **17.3% to 37.7%** of pixels. The instrument
confirms a repair rather than finding a bug — and it is now the thing that would notice the next one
the day it lands.

## ⚠️ Two findings from the first run, and the second is not the obvious one

**1 — `charger` has the weakest hit response in the game, by a factor of two.**

| kind | pixels that change when it is hit |
|---|---|
| `charger` | **5.4%** |
| `shipMk2` | 12.4% |
| `weaver` | 12.8% |
| `ship` | 15.4% |
| every boss | 17.3–37.7% |

[0035](0035-damage-is-legible-on-the-body-that-took-it.md) is the decision that bears on it. **Not
acted on here** — this PR is the instrument, and a verdict on a picture wants an eye rather than a
number. It is written down so the next art session starts from a diagnosis.

**2 — the binding legibility case is the narrow laptop, not the ultrawide.**

| viewport | along span | px/unit |
|---|---|---|
| 1280×800 · 16:10 | 178.0 (clamped from 160.0) | **7.19** |
| 1920×1080 · 16:9 | 178.0 | 10.79 |
| 2560×1080 · 21:9 | 237.0 | 10.80 |
| 3440×1440 · 21:9 | 238.9 | 14.40 |

⚠️ **A 16:10 SCREEN BAKES EVERY SPRITE A THIRD SMALLER THAN A 16:9 ONE, AND IT IS THE *TALLER*
SCREEN.** [0023](0023-the-long-axis-is-the-scroll-axis.md) clamps lookahead to 178–240 units, so a
16:10 view cannot show its natural 160 along and buys the extra span **out of scale**. That is the
opposite of what the aspect suggests, it is a property of a rule this project has held since level
one existed, and **nothing had ever printed it.** A 5-unit `weaver` is 36 device pixels there against
54 on 16:9.

⚠️ **SO AN INSTRUMENT OFFERING ONLY 16:9 AND WIDER WOULD ANSWER THE EASY QUESTION.** `tests/sheet.test.ts`
holds that the offered viewports span the clamp at both ends, and it is the finding above turned into
the one guard here that is about the world rather than about the page.

## What is guarded, and what is deliberately not

⚠️ **NOTHING ABOUT HOW A SPRITE LOOKS IS GUARDED** —
[0192](0192-a-guard-holds-an-invariant.md), the day after it landed. *Does this hull read as a raptor*
is a taste, a correct authoring change reddens it, and a guard over it is a specification nobody
wrote. **The page says so on the page**: *the verdict is your eye; nothing on this page is a guard.*

What is guarded is that **the instrument cannot lie about what it is showing**:

- every kind appears exactly once, so it cannot quietly show less than the whole atlas
- a hurt twin is derived from the union rather than paired by a table beside it
- *actual size* is `viewOf`'s scale, never a number typed into the rig
- the offered viewports span the clamp

⚠️ **AND THE SAMENESS READOUT IS NOT GUARDED HERE, WHICH IS NOT THE SAME AS UNGUARDED.** It reads
real pixels and needs a browser. The DOM-free form of the same claim already exists and is stronger
for a suite: `tests/accents.test.ts` over `tests/paths.ts` traces `drawKind` without one. **Two
instruments, one claim, neither a copy of the other** — which is
[0029](0029-the-tracked-record-is-the-record.md) applied to arithmetic.

## What this does NOT build

⚠️ **`variant`.** [`where-the-art-ceiling-is`](../../reports/where-the-art-ceiling-is-2026-08-14.md)
names it as the larger and later change and says why it must not ride along: it touches
`SPRITE_KINDS`, the atlas and [0016](0016-a-hub-enumerates-kinds.md)'s hub rules, and *"a verdict on
the picture and a refactor of the pipeline in one PR is unattributable."* **Fourteen kinds still stand
up for seven bosses.** This page is what makes that smell visible — the seven boss rows are the seven
that carry a second `SpriteKind` for their hurt state — and it is the next PR.

⚠️ **Any change to a silhouette, an ink or an accent.** `dist/index.html` is byte-identical.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A dev-only page, a DOM-free module,
guards, probes and documents. No storage key, no save field, no cache prefix, and `src/` is untouched.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the sheet skipping a family of kinds, so it reads as complete while showing less | `THE ONE THAT CANNOT BE RECOVERED FROM: every sprite kind appears exactly once` |
| a kind paired with somebody else’s hurt sprite, so the difference readout compares the wrong two | `and a hurt twin is DERIVED from the union, never a table beside it` |
| the sheet deriving its own pixels-per-unit instead of asking the camera | `ACTUAL SIZE IS THE GAME’S OWN SCALE, never a number typed into the rig` |
| the narrow viewport dropped, so the smallest bake in the game cannot be looked at | `AND THE OFFERED VIEWPORTS SPAN THE CLAMP, or the worst case is unreachable` |

## How to run it

```bash
npm run sheet
```

Vite serves `/rig/sheet.html`. No click needed — there is no audio on it.
