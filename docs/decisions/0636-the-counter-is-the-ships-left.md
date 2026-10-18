# 0636 — The counter is the ships left

**Accepted 2026-10-18.** From [`the-run-resets`](../../reports/the-run-resets-2026-10-18.md), item 5. Amends
[0430](0430-the-readout-counts-ships-and-shields.md)'s count.

## The ask

> *"life counter isn't correct, it should show remaining lives not total lives. ie, start at 2, 1, 0 not 3, 2, 1"*

## What was true

The readout is the ship being flown, then `×N` (0430). `N` was `state.run.lives`: every life, the one in the air
included. A three-life tier opened at ×3, and the last ship flew at ×1. The stand's preview in the hangar (0539)
showed the same count.

## The rule

**The count is the ships left behind the one flown: `lives − 1`, never under nought.** A three-life tier reads ×2,
×1, ×0. The run's own count is unchanged, and so is when a run ends. Only what is drawn moves, so the preview on
the stand says ×2 for a run that will open at ×2.

The readout's label says the same: *lives left: 2*, then the gun and the tubes as before.

## What guards it

- `tests/stand.browser.test.ts`: the stand's preview counts the tier's lives less one.
- `tests/continue.browser.test.ts`: a continue restocks to the tier's lives less one.
- `tests/hud.browser.test.ts`: the readout is labelled *lives left*.

The probe in `scripts/probes/0636-the-counter-is-the-ships-left.mjs` draws every life again; seen red.

## Owed

- **The counter through a run's deaths**: ×2, ×1, ×0, and the run over on the death at ×0.
