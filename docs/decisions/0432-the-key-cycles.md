# 0432 — The key cycles

⚠️ **SUPERSEDED BY [0575](0575-a-pickup-is-what-it-shows.md)**: a pickup no longer turns on the field,
so the key no longer turns — every face stands side by side. Its probes went with the turning.

**Accepted 2026-10-01.** The title screen's pickup key is one row per pickup, and each row turns
through its faces the way the pickup does on the field. It replaces 0233's *one row per face*, and
keeps the reason for it: every face is still named, and named by `faceOf`.

## The ask

> *"I also want to change the pickups on the title screen to condense them to match the pickups in
> game, but cycle through like they do in game and as they cycle, show the relevant info upgrade etc.
> It means players might miss info by not watching long enough, but it'll make the screen a lot better
> and give us way more title space."*

## The rule

| | |
|---|---|
| **rows** | one per `PICKUP_KINDS` entry — three, where there were six |
| **a row** | the glyph, the name and the hint of one face at a time, turning together |
| **the pace** | `PICKUP_CYCLE_STEPS`, the field's own — a face is up for as long as it is on a pickup in play |
| **the turn** | a CSS animation per face, offset by its share: no script and no timer. Each cell stacks its faces in one grid area, so it is as wide as its widest face and a turn moves nothing |
| **a reader** | the row is `role="img"` with every face in its label: a screen reader cannot wait for a picture to change (0024) |
| **reduced motion** | it still turns, since the turn is how a cycling pickup is told, and cuts instead of fading |

## What it costs

The one the ask names: **a player who looks away misses a face until it comes round again**, at most
`faces × PICKUP_CYCLE_STEPS` — nine seconds for the gun's three. Accepted in the ask, and it is also
the true picture of the field: a weapon pickup there offers one face at a time too, and the key now
teaches that rather than a list the field never shows.

## Held by

`tests/hud.browser.test.ts`, *0432 — one row per pickup*: the row count, every face present, one face
visible at a time, no two faces on the same clock, and the field's pace. Its probes, in
`scripts/probes/0432-the-key-cycles.mjs`, put every face on one clock and switch the turns off.

## Rollback

Nothing irreversible.
