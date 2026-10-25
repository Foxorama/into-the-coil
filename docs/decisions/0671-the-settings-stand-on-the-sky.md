# 0671 — The settings stand on the sky, and the pause shows the field

**Accepted 2026-10-25.** Item 4 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md), from finding 6 and
the pause family's finding 9 of [`the-menus-reviewed-again`](../../reports/the-menus-reviewed-again-2026-10-24.md),
answered *"Agree with the suggested answers."* It amends [0440](0440-every-screen-speaks-with-the-titles-voice.md) (the
picture, not only the type) and [0511](0511-the-run-can-be-paused.md) (what *dims* draws inside a run).

## The ask

> *"Settings, Controls, How to play, Save, Paused and Quit are type on a black void, while the title has its sky, the
> music room the flythrough and the hangar the dock."* — and *"The pause is a black screen. The run vanishes behind
> Paused and comes back only on the count-in."*

## The rule

| | was | is |
|---|---|---|
| **Settings, Controls, How to play, Save** | type and bands on the void | on the title's sky — its three drifting layers of stars and its two washes, without the ship crossing it — inside the cut-corner plate the title's two plates and the hangar's wear, the tab strip at its head ([0668](0668-the-band-arms.md) stood it at one height) |
| **Paused, Quit this run?** | the void, opaque, over the stopped field | the void at 70 % over it: the field is frozen and still drawn, so a player who paused to look at it can |
| **the count-in** | the field, undimmed | unchanged |
| **Settings opened from a pause** | the void | the sky: it is the same screen as from the title, and outside the run's rows |

The screens that stand on the sky are read off the rows (`SKIED` in `src/app/chrome.ts`): the title, and the screens
that are tabs of one place and stand on no stand — the same set 0668 anchors at the top. What dims to 70 % is a row
that dims and is `inRun`; a row that dims outside a run still paints the void.

## What it cost and the guards it moved

- **`tests/pause.browser.test.ts`**, *0671*, in pixels: a run on Savior, paused, and the screen left of the pause's
  panel read off a screenshot — more than a fifth of it a colour other than the void's. The same for *Quit this run?*.
- **`tests/chrome.test.ts`**: each of Settings' tabs has a rule laying the stars (`-sky`, radial gradients) and a rule
  laying the plate (`-panel`, the cut corners' clip path).
- The layout guard, the settings, controls, save, hand and touch suites, the pause's and the menu's: unchanged and
  green on it.

Probed in `scripts/probes/0671-the-settings-stand-on-the-sky.mjs`: the pause painting the void again, the sky the
title's alone, and the tabs in no plate.

**Photographed** at the pair and the guard's six, and the pause and Quit over a run at the pair.

## What is owed

- A look in motion: the sky drifts behind the Settings plate as it does behind the title's, and the plate's glass is
  the title's, so whether a band reads over a passing star is a look, not a measurement.
- The music room keeps its flythrough; nothing here touches it.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
