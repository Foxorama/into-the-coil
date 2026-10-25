# 0677 — Big forms, and the deck as a floor

**Accepted 2026-10-25.** Item 3 of [`the-port-planned`](../../reports/the-port-planned-2026-10-24.md), from
[`the-port-is-a-cutout`](../../reports/the-port-is-a-cutout-2026-10-24.md). It amends
[0571](0571-the-dock.md)'s room, and [0411](0411-the-chase-begins-at-the-port.md)'s, which the dock was drawn from.

## The ask

The room was a grid: one wall tile at the tile's pitch from the bar to the bay, a truss of the same V eight times,
and a deck that was planks to the screen's foot with nothing on it but the pads.

## The rule

| | was | is |
|---|---|---|
| **The wall** | one panel, repeated | the panel, with a vent, a patch or a conduit laid over about two tiles in five (`wallVent`, `wallPatch`, `wallConduit`). Which tile has which is drawn once from the port's own stream (`makeRng('port').stream('tiles')`, 0021) at module load, so the room is the same room every visit and a frame pays for an index. The overlays lie over whichever lit tile 0676 put there, so the light and the variety do not multiply into nine tiles |
| **The truss** | a V a tile | its chords a tile, and a brace with its post at every other seam (`trussBrace`): spans, not a pattern |
| **The bay's edge** | a bulkhead and a stripe | the same frame with a heavier slab, bolts down it and a second rib; and a warning lamp on it, amber, turning on the alarm's period (`doorLamp`, light) — in both rooms |
| **Over the pilot's pad** | the truss | a crane's rail under the truss with its trolley, and its hook hanging on a cable, swinging a few hundredths of a radian on the clock (`craneRail`, `craneHook`) |
| **The back wall** | tiles | a bulkhead door with its locking wheel and its panel, between the pads (`bulkhead`, `STAGE.bulkhead`); the bay's number over it, a numeral on the voice rule (`sign02`) |
| **The deck** | planks | its front edge, a dark band with a hazard stripe and its shadow (`deckLip`); a grating under each pad, and under the dock's cradle (`grating`); each beam's rings in the deck under its pad, faint (the beam turned over); the Viper's scorch where she stood, coming up over the second after the first half-second of her burn (`scorch`); the car's tyre marks on its pad (`tyres`); an oil stain, a coiled hose and two crates past the Viper's pad (`oil`, `hose`, `crates`) |

## Done differently from the plan, and not done

- **`bayDoor` is the old `bayTop` and `bayBottom`, redrawn.** New kinds for the same two pieces of frame would have
  left the old names as dead rows. The dock's edge uses the same pieces, so it has the heavier door too. Its *"cyan
  line and hazard stubs become its track"* is not done: they are the bay's field and the frame's stripe, and the
  photographs read them as a door frame already.
- **The truss is its tiles and its braces**, not one `trussSpan` stretched: the chords were already a tile, and a
  span stretched over the room would have blurred its rivets.
- **The pad's reflection is the beam turned over and faded**, not a `padReflection` kind: it is the same picture.
- **The crane, the scorch, the tyre marks, the oil, the hose and the crates are the intro's.** The dock's crane
  would hang in front of the shopfronts on the catwalk, and the dock's ship stands on a cradle, not on a pad that
  was driven onto or burnt.
- **No tape on the deck.** The deck has its lip's stripe and the pads' stripes; tape beside them was a third.

## What it cost and the guards it moved

- **The port's atlas**, measured in the browser with the pilot at the default:
  - At 1280×720 it went from 19.41 MB to 20.78 MB.
  - At 1920×1080 doubled it went from 53.85 MB to 57.65 MB.
  - The whole bake took 31–32 ms before and 34–38 ms after at 720p, and 59–78 ms before and 62–88 ms after at
    1080p doubled, three runs each.
  - Both figures were taken before 0676's `shadeFoot` landed. It is one 20-unit tile, 0.06 MB at 720p and 0.52 MB
    at 1080p doubled, in the before and the after alike.
- **Blits a frame**, every one a blit of a baked bitmap:
  - The intro's room is up to 47 more. The 20 overlays its 52 tiles carry, 4 braces, the crane's 2, the bulkhead
    and its number, 9 of lip, 2 gratings, the tyre marks, the oil, 2 reflections, the hose, the crates, the door
    lamp, and the scorch once the Viper has gone.
  - The dock is 31 more: the 18 overlays its 48 tiles carry, 3 braces, 8 of lip, a grating and the door lamp.
  - `tests/budget.test.ts` holds no count for the port. Its rule that no hot file allocates found the overlay
    picks' loop, which runs once at module load, without its `// @setup:` line; it has one now.
- **`tests/forms.browser.test.ts`**, *0677*, new, a style of the picture held as one. It draws the dock off the
  shell's painter and atlases and reads two pairs of wall tiles that stand in the same light, the first two columns
  in two rows. It passes when either pair is not the same picture. Measured at landing: 0.0002 apart in the upper
  row (the picks left both bare) and 0.0244 in the lower. The wall before this decision read 0.0002 and 0.0000.
  The bound is 0.01.

Probed in `scripts/probes/0677-big-forms.mjs`: every tile pinned to the bare panel.

**Not held by any guard:** every form's drawing, where each stands, the hook's swing and the scorch's timing.
They are the picture's.

**Photographed** with `scripts/shot-intro.mjs` at 1.2 s and 6 s; the three tabs at 1280×720 and 844×390 and at the
layout guard's six. The first build's deck lip ran past the bay into space in both rooms. The photographs found it,
and it stops at the bay.

## What is owed

- A play: whether the room reads as a working bay, and whether the hook's swing is seen.
