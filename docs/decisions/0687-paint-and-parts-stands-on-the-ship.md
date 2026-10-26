# 0687 — Paint & Parts stands on the ship, and the monitor keeps its size

**Accepted 2026-10-26.** From the play of 2026-10-26. Amends [0678](0678-a-stand-per-tab.md)'s Paint & Parts
camera and [0628](0628-the-monitor-hangs-on-a-wall.md)'s monitor width.

## The ask

> *"the desktop zoom in for paint and parts zooms into the workbench for some reason and it completely changes
> the cockpit sizing display on the workbench."*

## What was there

0678 stood Paint & Parts low and close on the cradle at a zoom of 2, its point at 0.8 of the column, so a rim
read at sixty pixels. At that camera the workshop wall and its benches filled the left of the picture, and the
cockpit monitor — hung at the wall's width (0628) — came out twice its size with its readout re-wrapped to one
row. The player saw a close-up of the workbench with a different cockpit on it, and no reason for either.

## The rule

| | |
|---|---|
| **the camera** | on the ship: 128 along, 70 across, zoom 1.4, its point at 0.6 of the column, keeping the workshop wall as before. A step closer than Hangin' Out's 1.15 and no more |
| **the monitor** | the hangar tab's size on every tab. `standMarksInto` takes the scale the monitor's width is sized at (`hangScale`); the shell fits Hangin' Out's camera to the same column on every framing and hands over that scale, so a closer camera draws a bigger room round a monitor that does not change. It still hangs centred on the wall, on the line under its hangers |

## What it cost, and the guards it moved

- **`tests/dolly.browser.test.ts`**: the tyre's floor at 1280×720 comes down from 0678's sixty pixels to
  forty-four — half as big again as the hangar's thirty-eight — and a new assertion reads the monitor's width on
  Paint & Parts against Hangin' Out's, within two pixels. Probed in
  `scripts/probes/0687-paint-and-parts-stands-on-the-ship.mjs`: the hangar's scale not handed over.
- 0678's probes are unchanged: the camera is still the tab's own, and the dolly still eases to it.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
