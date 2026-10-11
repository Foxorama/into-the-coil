# 0596 — The yellow submarine hangs

**Accepted 2026-10-11.** Item 4 of [`the-secret-pilots-planned`](../../reports/the-secret-pilots-planned-2026-10-11.md).

## The ask

From the handwritten page: *"Yellow submarine hangy"* — read as a yellow submarine to hang from the dash.

## The rule

**A yellow submarine is sold at Cosmo's to hang from the dash, as every dangle is (0523): 300 Star Shards, beside
the mirror ball and the bobblehead.**

| | |
|---|---|
| **the row** | `submarine` on `src/content/dangles.ts` |
| **the drawing** | `.itc-playing-hud-sub` in `src/app/chrome.ts`: a capsule hull in the hazard's yellow, its conning tower with the periscope turned to look ahead, three portholes lit in the light ink and rimmed in the void, and a brass propeller at the stern |
| **its inks** | `--itc-sub` and `--itc-sub-dark`, roles moved as every dangle's are, so the high-contrast palette answers them |

## Why it is built the way it is

**A dangle and nothing more, because the page says to hang it.** The dash already hangs what Cosmo's sells on
the one swing the frame drives (0466), and a dangle is a row and a drawing. **Priced with the dearer two**
(0589's 300) because it is drawn in as many parts as they are; a play number.

## Rollback

⚠️ **No key and no version move, and one thing a rollback costs** — [0001](0001-revertability-not-risk-rating.md).
`itc_hangar` gains `submarine` in `owned` and may name it in `hung`. An older build reads an ownable it does not
know as not owned, and a dash hung with it as hanging what the ship came with (`hangarFrom`), and drops both the
next time it writes — so **a player who bought it on this build and is rolled back loses it and its 300 shards.**
0589's four dangles carried the same cost. Undone only by shipping it again before that player's next save.

## What guards it

`tests/submarine.test.ts`, and `tests/cosmo.browser.test.ts`, which tries every dangle on the dash. Probes in
`scripts/probes/0596-the-yellow-submarine-hangs.mjs`.

## Looked at

At 1280×720, on Cosmo's shelf and hung from the readout's dash while it is tried: it reads as a yellow submarine —
the capsule hull, the tower, three lit portholes and the propeller. The periscope is the faintest part, dark on the
dark plate, and is a detail rather than the thing that says *submarine*.

## Owed

- **The swing**, which a still picture cannot show — a play of the branch preview.
