# 0624 — The triggers step the pilot

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 1. Adds to
[0458](0458-the-title-is-rows.md)'s pad on the menus.

## The ask

> *"Menu → R + B buttons for pilots on all screens"*

## How it was read, and why — the player's to overturn

The handwriting is two letters joined by a plus. **Read as: a pair of pad buttons that step the pilot, on every screen
that shows the pilots** — the title, Hangin' Out, Paint & Parts and Cosmo's. Before this, the only way to change
pilot on a pad was to move the cursor up onto the band of faces and along it; on Paint & Parts and Cosmo's the cursor
opens below the band, so it was always a climb first.

**Which pair: the triggers, LT and RT.** The shoulders (LB, RB) have turned the tabs since 0458 and are drawn at the
tab strip's ends since 0548; B is Back. The triggers were read by nothing on a menu. Giving the pilots the shoulders
would have meant moving the tabs, which nobody asked for. *"R + B"* could also be read as RB alone, or RB with LB —
if that is what was meant, the change is the two indices in `MENU_PILOT_BUTTONS` and the tabs moved to the triggers
in `MENU_TAB_BUTTONS`, and it is said here so it is one edit.

## The rule

**On any screen with a pilot band, LT steps the pilot back and RT steps it on**, one press at a time, round the ends,
past any pilot still shut — the band's own step (`stepBand`), so it is exactly an arrow on the band. It never flies:
0513's *a press on the highlighted pilot flies them* is the cursor's, and a trigger moves off the highlighted pilot by
construction. It does not move the cursor. The plate's foot says so with a pad in hand: *LT RT pilots*.

| | |
|---|---|
| **the reader** | `MENU_PILOT_BUTTONS` in `src/app/menu.ts`, standard-mapping 6 and 7, an edge on the tabs' terms |
| **the chrome** | `pilot(delta)`: the shown screen's band named `pilot`, stepped |
| **the shell** | `world.onIdle` hands it on, as it hands on the tabs |

The keyboard is not given a pair: the ask is the pad's, and Q and E are already the tabs.

## What guards it

`tests/menu.test.ts`, *0624*: a held trigger asks once, each its own way, and is never a tab. `tests/menu.browser.test.ts`,
*0624*: on the shipped page with a stub pad, RT on the title marks a different pilot on the band and the title stays up,
LT marks the first again, and RT in Hangin' Out marks a different pilot and the tab stays. Probes in
`scripts/probes/0624-the-triggers-step-the-pilot.mjs`, both seen red.

## Owed

The player's word on the reading. A play with a pad on all four screens.
