# 0582 — The pad wears its tubes

**Accepted 2026-10-08.** Item 4 of [`the-loadout-planned`](../../reports/the-loadout-planned-2026-10-07.md),
the last. Builds on [0581](0581-the-weapons-sit-right.md)'s loaded tubes and [0540](0540-the-hangar-is-the-port.md)'s
pad, which re-bakes the pilot's ship whenever its fit changes.

## The ask

> *"[the tubes] need to be shown in the hangar when equipped."*

The ship on the pad was baked bare whatever its rack (0578's *Owed*).

## The rule

**The hangar's fit carries the rack's tubes, and the pad's ship is drawn at that many tubes with each loaded
in its kind's ink at its place — the frame's own placing (0581), painted into the pad's bitmap.**

| | |
|---|---|
| **the fit** | `Fit.tubes`, the kinds in the order fitted — none as a ship comes (`ownFit`), the rack the hangar fitted or the one tried on (`fitOf`, through 0561's `seen`) |
| **the re-bake** | `sameFit` compares the tubes, in order, so fitting or trying on a rack bakes the pad again as a rim or a look does |
| **the picture** | `paintBlue` draws the fight's ship at that many tubes and `paintLoadedTubes` lays each on it — a dart or a warhead, the row's `tubeLook`, at the row's place and `tubeLength`, in the ink of its kind's picture. The saucer side-on (0444) leans its places in toward the rim as the picture leans |

## Why it is built the way it is

**Painted, not laid on.** In a run the frame lays each tube on the ship as a picture of its own, because the
kind arrives mid-run (0581). The pad is a bitmap baked whenever the fit changes, so the tubes are known when
it is baked and cost nothing to paint into it. `paintLoadedTubes` reads the same row fields and the same
picture's ink the frame's sprites are baked in, so the pad and the run cannot disagree about where a tube is
or what colour it is.

**The intro flies it too.** The intro's port draws the same pieces under the run's fit, so the ship that lifts
off the pad carries the rack it was fitted with.

## Rollback

None needed: no key, no save field, nothing shipped changes shape.

## What guards it

`tests/pad-tubes.test.ts`: a fit comes with no tubes and one with other tubes, or the same in the other order,
is another picture; every ship wears each tube of a rack at its place in its kind's ink and no other kind's.
`tests/pad-tubes.browser.test.ts`, in the page: one of each fitted on Hangin' Out moves the ship on the pad by
more than three times what the stand moves standing still. Probes in
`scripts/probes/0582-the-pad-wears-its-tubes.mjs`.

## Owed

- A look at the saucer side-on with tubes: its pods are drawn only from above, so in the hangar its darts
  stand at the rim without them.
