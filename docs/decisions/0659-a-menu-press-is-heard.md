# 0659 — A menu press is heard

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 8.

## The ask

> *"Confirm noise on menus."*

## The rule

**A press on a menu's button plays `confirm`**, a short rising pair of blips on the chooser's twin
(`chooser-fill`) — in the action callback of `makeChrome` in `src/app/mount.ts`, the one place every menu button's
press arrives, whether it came from a click, a tap, Enter or a pad's A. A pilot taken on the title, which flies rather
than calling an action, plays it too.

- **A step along a band is not a press.** Moving the cursor is browsing, not confirming, and a sound on every step
  would be a sound on every key a player holds down. Only what takes something is heard.
- **Not on the splash**: the press there is the gesture that unlocks the audio, so there is nothing yet to play it on.
- **Only once the audio is up** (`audioOut.ready()`), as every other cue the shell plays.
- **Inside a beat and above the pulse** (gain 0.26 against the pulse's 0.24), so it needs no duck and is not buried —
  the constraints `tests/sound.test.ts` holds over every cue.

## What guards it

`tests/sound.browser.test.ts`, *0659 — THE ASK*: on the built page, a press on Cosmo's *Show owned* adds one cue
voice, and a step along a band adds none. The test counting the music's voices with the sound Off now subtracts the
cue voices it heard, since a menu press is now one of them. The probe in
`scripts/probes/0659-a-menu-press-is-heard.mjs` takes the line out.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
