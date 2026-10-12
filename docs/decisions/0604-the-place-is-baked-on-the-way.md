# 0604 — The place is baked on the way, and the chart reads as an instrument

**Accepted 2026-10-12.** **Amends [0340](0340-the-coil-is-a-route.md)** (when the place is swapped
under the burn, and what the landing waits for) and **[0341](0341-the-crossing-reads-as-a-nav-plate.md)**
(where the plate sits, and how the chart is drawn). The burn's shape, its floors, its ceiling and its
one knob are untouched.

## The report

> *"The level transitions screen are a bit chuggy on mobile and probably some desktops. And the map
> display looks pretty dodgy and can be done better."*

Two halves, and both were measured before anything was changed.

## The chug was one frozen frame, at full burn

0340 swaps the place at full speed, *"because the streaks are what hide it"*. The swap re-baked the
whole atlas and the place's own sky — on the main thread, inside one fixed step. 0340 counted that as
fifty-eight bitmaps. **It is 743 now.**

Measured on the bench (`rig/bench.html?cross=N`), timing each frame's steps and draw:

| | before | after |
|---|---|---|
| the swap, 1280×720, this machine | **769 ms** in one step, nothing drawn | installed in under a millisecond |
| the same at the browser's 4× CPU throttle | about **3 s** | no frame over ~290 ms; the burn held at full until the bake was done |
| worst single frame while baking ahead | — | 40–60 ms: one hydra neck or collar bitmap |

A frozen frame at the moment the game shows its fastest motion is exactly what *chuggy* describes,
and a phone is where it is longest.

### The rule

**The place the burn will swap to is baked in slices from the moment it is known**, which is the
boss's death: the run's level moves on there, and `pictureComingFor` (beside `picturePlaceFor` in
`src/app/music.ts`) returns the place `picturePlaceFor` will answer after the swap, asked early. Each
slice spends at most **6 ms**, and there is at most one slice in any 16.7 ms of wall clock — so the
six-second level break (0428) does the work on a desktop before the burn has begun.

- **`bakeAtlas` is `bakeAtlasStepwise` drained.** One bake, not two descriptions of one; every boot
  runs the stepwise path. It writes each sprite to its own index of a full-length array, which keeps
  `map`'s guarantee that no sprite can slide down a slot, and refuses a slot left empty.
- **The place's own sky moved into `bakePlaceSky`**, which paints the atlas it is handed. Nothing in it
  changed; the same lines paint the atlas on screen at a boundary and the one baked ahead.
- **The swap waits for the bake, and the landing waits for the swap.** A burn that trailed off over the
  old place's sky would be the cut the streaks exist to hide. When it holds past the floor, the
  existing *Holding for a way in…* line says so.
- **The ceiling still ends it.** At 0340's twenty seconds the ship lands regardless and `applyPlace`
  finishes whatever is left on the spot — the old frozen frame, and never worse.

### ⚠️ The first version was per step, and the bench said so

A frame that falls behind runs up to five steps (`MAX_STEPS`), and five slices made it thirty
milliseconds long, so the next frame fell behind as well: **a burn of 32–37 ms frames end to end.**
The slice is bounded by wall clock now, and a catch-up step inside a frame that already had its slice
bakes nothing.

### Weighed and not done

- **A worker.** Off the thread is zero frames lost. It is also a second inlined copy of a
  22,000-line painter in the single page ([0003](0003-single-file-build.md)), drawn on an
  `OffscreenCanvas` it has never been drawn on. Slicing moves the same calls to other frames and
  changes nothing they draw.
- **Re-baking only what depends on the place.** Compared pixel for pixel across all seven places,
  **248 of 743 bitmaps differ in the vivid palette and 63 in high contrast** — and the hydra's pieces,
  the worst single frames above, are not among them. Keeping the rest from the atlas already on screen
  would cut the work by about two thirds. It needs a declared list and a browser guard that bakes every
  listed kind in two places and compares them; it is the next step if the phone is still heard to
  stutter, and is owed rather than built.

## The map was under the readout, and its route ahead was not there

Photographed at 1280×720 and 844×390, before:

1. **The plate was drawn behind the readout and the score.** Its top was a rem and a quarter down;
   the strip is three and a half of its own em. The `LEG 3 OF 6` kicker and the top of the chart were
   under the lives. **The readout cannot go** —
   [0063](0063-a-level-break-is-a-respite.md)'s argument, extended to the burn by 0428: the player can
   still spend a charge.
2. **The route ahead was invisible.** A leg not yet flown was the palette's sky ink at three tenths —
   an ink chosen to be *nowhere near anything the player has to find* — on a plate four fifths the
   void: **1.00 to 1.14 : 1** across the seven places and both palettes. The coil read as a few
   coloured arcs and some loose dots.

### What is built

| | |
|---|---|
| the plate | under the strip, by the strip's own numbers (`hudBar`'s): clear of it at every size |
| its padding | tighter above and below, so at 1280×720 it still ends inside the top third (32.8 %) |
| the route ahead | dashed, in the sky ink lifted 60 % towards white at 0.85: **3.39 : 1 at worst** (The Toxic Mire, vivid) |
| the route behind | lit: a wide faint stroke of its destination's light under a narrow bright line |
| a graticule | two rings inside the route and a bezel of ticks, so the coil visibly descends across them |
| the stops | a reached place wears a halo of its light; one ahead is still its own colour at about twice the strength it was |
| the canvas | 480 px, since the chart is shown up to 9 rem and a phone is 3× |
| the ship's marker | half as big again |

⚠️ **On a landscape phone the plate now ends at 37–40 % of the height**, against 32.8 % on the
desktop. There the readout already sits over the field, and the plate starts under it. The top-third
guard is the desktop's; [0153](0153-desktop-is-the-target.md) says the phone may not be cited as a
reason to make anything smaller, and the chart is not made smaller for it.

## Confirmed, not assumed

Probes in `scripts/probes/0604-the-place-is-baked-on-the-way.mjs` — **seven, all seen red**:

| broken on purpose | went red |
|---|---|
| the place is still baked ahead after it has been swapped in | `and bakes nothing once the swap has happened` |
| the break bakes the place after the one being flown to | `bakes, from the break, exactly the place the burn will swap to` |
| the route ahead in the unlifted sky ink | `and the route ahead can be seen on the plate` |
| the route ahead at its old three tenths | `and the route ahead can be seen on the plate` |
| the route ahead drawn in its places' colours | `and the drawing is one disc per level where the curve says` |
| the bezel drawn at 0.49, through the first place's ring | `and every stop is inside the canvas, ring and all` |
| the plate back at its old top margin, behind the readout | `sits under the readout and the score rather than behind them` |

⚠️ **THE NEW BEZEL GUARD CAUGHT ITS OWN FIRST VALUE.** 0.49 was written first and is inside the first
place's destination ring (0.4935); it is 0.497.

**Re-anchored**: 0204's landmark probe and two of 0340's, whose anchors were lines this moved. And
`tests/sky.test.ts`'s 0204 source scan looked for `bakeNebula(atlas`, which is `bakeNebula(target`
now — the pairing it holds is unchanged and the test says why.

⚠️ **NO GUARD HOLDS THE FRAME TIMES, OR THE SWAP WAITING FOR THE BAKE.** Frame time is a property of
the machine, and [0025](0025-the-frame-budget-is-counted-not-timed.md) counts rather than times. The
waiting is in `src/app/mount.ts`, which only a canvas can mount, and the shipped page cannot raise a
crossing without a boss fight — 0341's reason for its marker, word for word. What holds the half that
can be held is the rule that the place baked is the place swapped to. The rest was looked at on the
bench: swap and landing on the same step, the floor intact when the bake is already done.

## What this leaves owed

**Played on a phone.** The throttle is the browser's estimate of a slow CPU, not a phone, and nothing
here was measured on one. If the break or the burn is still heard to stutter there, the place-free
bitmaps above are the next lever.

**The chart has been photographed and not played**, as 0341's plate was.
