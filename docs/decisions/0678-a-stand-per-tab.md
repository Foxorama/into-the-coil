# 0678 — A stand per tab, and the dolly

**Accepted 2026-10-25.** Item 8 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md), ordered after
the port's items 1–3 on the player's answer. It amends [0540](0540-the-hangar-is-the-port.md),
[0548](0548-the-hangar-holds-still.md), [0563](0563-the-ship-is-the-picture.md) and
[0568](0568-the-hangar-opens-out.md).

## The ask

`PORT_CAMERA` was one constant on all three tabs' rows. The field exists so each tab could stand somewhere (0540),
and none did: that is [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s tell. 0548 merged the
cameras because a change of tab jumped the room, and it said what would answer a missed close-up: *"a tab whose
camera is its own"*. Paint & Parts is where a rim is chosen, and at the shared camera a tyre was 38 pixels across on
a laptop.

## The rule

| | was | is |
|---|---|---|
| **The cameras** | `PORT_CAMERA` on every row | `HANGAR_CAMERA`, `PARTS_CAMERA` and `COSMO_CAMERA` in `src/state/screens.ts`, one per row. Hangin' Out is as it was. Paint & Parts is low and close on the cradle: 131 along, 78 across, zoom 2, its point at 0.8 of the column. Cosmo's is at the mezzanine: 144 along, 52 across, zoom 1.3, at 0.66 |
| **Where the point stands** | `STAND_PAD_AT` of the column, on every tab, whatever the row's `x` said | the row's `x` (`fitStand`). The hangar's row says `STAND_PAD_AT`, so the hangar does not move |
| **What a camera keeps** | the lift and every keeper's shopfront (0571, 0572) | what the row names, `StandCamera.keep` over the closed `STAND_KEEPS`, read with a `never` arm. `room` is the old rule and is the hangar's. `workshop` keeps the wall the cockpit monitor hangs on (0628), and is the other two's |
| **Both ends in the column** | the nose slid the room left, and the lift could go with it | the zoom is also held to what fits the kept edge and the nose in the column at once (`spans`). Where the room's height holds a `workshop` camera closer than that (a 4:3), the room is first slid right to keep the wall, then left for the nose |
| **A change of tab** | a cut | the dolly. The camera the screen shows is copied, and the stand eases to the new tab's fitted camera over `DOLLY_STEPS` (18, 0.3 s) on the stand's own clock, with a smoothstep. The step's camera is computed from the two cameras and the step count, so nothing accumulates. Each step writes the view and the marks again into scratch that already exists; `moveStandMarks` moves the monitor, the bubble and the doors without re-laying out the bands. A tab opened from off the stand is cut to |
| **How sharp the port is baked** | the tab's own zoom, so each tab would have re-baked it | the closest any row asks (`STAND_SHARP`, read off the rows), so the dolly never re-bakes |

Which of `fitStand`'s rules each camera meets, at 1280×720 (fitted zoom from `fitStand` with the column modelled
as `tests/stand.test.ts` does):

- **The hangar:** at its 1.15, held by nothing.
- **Paint & Parts:** asks 2 and gets 1.83, held by `spans`: the workshop wall's left post and the hull's nose in
  the column together. At 1920×1080 and 2560×1080 it gets its 2.
- **Cosmo's:** asks 1.3 and gets 1.3; its `x` is where the wall and 20 units of stars past the bay both fit.
- **On a 4:3** all three get the room's whole height, 1.33 at 1024×768, as before.

## Done differently from the plan, and not done

- **Paint & Parts' zoom is 2, not about 1.7, and its point is at 0.8, not 0.62.** The plan's numbers were measured
  here first. At 1.7 and 0.62 the keep held it to 1.49, and a tyre was 54 pixels across, under the plan's 60. The
  `spans` rule and the point further right are what reach 65.
- **No `counter` keep.** A third kind, Cosmo's own shopfront only, was built first. It let the camera put the
  workshop wall and the monitor on it under the plate; the first photograph read *OCKPIT*. The monitor hangs on
  every tab, so every camera closer than the room keeps its wall.
- **Paint & Parts does not show the open bay.** 0568's stars test asked the bay and 20 units of stars past it
  *"on every tab"*. A camera close on the cradle has the bay's edge on a wide screen and nothing past it on a 4:3.
  The test names Paint & Parts as its exception. The hangar and Cosmo's still show the bay.
- **The room keep does not slide.** Sliding the hangar right for its lift on a 4:3 put its bay out of the column,
  which 0568 holds first. `slidesFor` says which kinds slide.
- **The guard is not in `tests/hangar.browser.test.ts`.** That file is 0521's dash and pilot round trip. It is
  `tests/dolly.browser.test.ts`, which uses the plan's measures.
- **The dolly is photographed as frames, not a clip:** frames 0, 8, 16 and 24 of the page's paused clock, from
  Hangin' Out to Paint & Parts.

## What it cost and the guards it moved

- **The port's atlas**, baked for the stand, the default pilot, three runs each in the browser:
  - At 1280×720, at the hangar's 1.15 it was 28.32 MB and took 70–97 ms. At 2 it is 30.17 MB and took 48–64 ms.
  - At 1920×1080 doubled it is 57.81 MB either way, since the bake is already at its cap. It took 81–100 ms
    before and 66–178 ms after.
  - The bake times are within each other's spread.
- **Blits a frame:** none added. The dolly changes the view, not what is drawn.
- **On the dolly's steps**, eighteen per change of tab:
  - The view and the marks are written into existing scratch. `mount.ts` is on `tests/budget.test.ts`'s cold list,
    so that suite does not scan it.
  - `placeStand` writes the monitor's, the bubble's and the doors' places as style strings each step, as it already
    did on every framing. That is the one thing the dolly allocates, and only while it runs.
- **`tests/stand.test.ts`**:
  - *0678 — stands every tab somewhere of its own*, new: no two standing rows' cameras are one place.
  - *0568 — shows the end of the hangar…* skips Paint & Parts, by name and with the reason.
  - *keeps the room over every edge* gives its camera at the bar a `keep`.
- **`tests/dolly.browser.test.ts`**, new, in CSS pixels at 1280×720 off a shopfront door as a ruler:
  - The tyre is 38 px on Hangin' Out, 65 on Paint & Parts and 42 on Cosmo's. The floor is 60, on Paint & Parts.
  - Cosmo's door, read relative to the stand a frame at a time with the clock paused, stands between its two
    places on 16 of the frames after a tab change. The bound is half the dolly's steps.
  - Under the probe's one-step dolly it stood between on none.
- **`tests/stand.ts`** reads the ship's band in the room's own units, off a shopfront door: from 30 units
  behind the ship to 25 ahead, and never past the bay. It was a fifth of the stand either side of
  `STAND_PAD_AT`.
  - First pushed as the tab's own `x`. CI found that Paint & Parts' flame fell outside the band, so a flame
    chosen there read as nothing moving.
  - Widened by the zoom, the band reached the stars past the bay. The stand then never read as still, and
    `tests/wheels.browser.test.ts` ran out its 120 s.
  - The probes on the five suites that read it are red under the new band: 0527, 0528, 0529, 0540, 0541,
    0542 and 0582.
- **Re-anchored:** both of `scripts/probes/0568-the-hangar-opens-out.mjs`'s camera probes, onto `HANGAR_CAMERA`.
  `npm run prove` 0540, 0568 and 0628 are red under every probe after this change.

Probed in `scripts/probes/0678-a-stand-per-tab.mjs`:

- The hangar's camera on Paint & Parts, which reddens the unit test and the tyre's floor.
- A one-step dolly.

**Not held by any guard:** each camera's numbers, the ease's shape and length, and Cosmo's camera beyond keeping
the wall. They are the picture's.

**Photographed** with `scripts/shot-menus.mjs` at the pair, at the layout guard's six, and at 1920×1080 and
2560×1080; and the dolly as above.

## What is owed

- A play: whether Paint & Parts' close camera reads, whether the dolly is the right length, and whether Cosmo's at
  1.3 is close enough. The plan's *about 1.3* is kept because the open bay holds it there.
- **An intermittency, not yet established (0044).** Once, `npm run prove 0542` found one of its five suites red at
  baseline, before any probe. The run's filtered output did not say which. The same command was green and 7/7
  red when run again alone. `tests/wheels.browser.test.ts` takes 71 s alone against its 120 s, and is the first
  suspect. What would settle it: that suite's time under `npm run prove`'s three trees, and a budget of three
  times the worst, per 0245.
