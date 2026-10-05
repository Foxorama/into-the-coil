# 0541 — The looks are on the pad

**Accepted 2026-10-06.** Item 4 of [`the-menus-are-a-place`](../../reports/the-menus-are-a-place-2026-10-05.md):
*Paint & Parts* on the pad.

## The ask

> *"Good Cosmo's Cosmetics shop background with categories and items previewed properly."* The plan's
> item 4: the camera closer, the flame burning at idle, the five bands on the plate, and **every look
> photographed on the pad against `rig/looks.html`'s page**, so a look that reads at three times the
> fight's size on the rig reads on the pad too.

## What was already done

[0540](0540-the-hangar-is-the-port.md) put the camera closer on the pad for *Paint & Parts* and the flame
idling under the ship; [0539](0539-the-readout-stands-down.md) put the five bands on the plate. What this
item owed was the photographs, and what they found.

## What the photographs found

`scripts/shot-pad.mjs` stands every pilot's ship on the pad in each of its three looks, every rim it can
wear, five paints round the wheel and both flames — 57 pictures, cropped to the stand. Read against the rig:

- **The arts, the rims and the paints read on every ship but one**, at the pad's size, each as it reads on
  the rig: the fighter's chevron, mouth and stripes; the estate's crest and daisies; the Firebird's
  phoenix, flames and stripe; the Thunderbolt's tank, paw and pinstripes; every rim on the three cars.
- **The saucer was the one.** Its side view (`paintSaucer`, 0444) drew the factory's body and plain glass
  whatever was fitted, so the Little Green Caddie was still fitted blind — on the pad, which was the whole
  point of it. It reads the fit now: its paint is the body's ink, as the fight's top view's is, and its
  look is the dome's — the glass, the pilot under it, or the visor's gold.
- **The thrusters never reached the pad.** Choosing Ion Thrusters re-baked nothing: the port's ship pieces
  were re-baked when `sameFit` said the fit moved, and `sameFit` leaves the flame out because the game's
  atlas burns its flame apart (0530). The pad's check asks about the flame too.

## What guards it

`tests/pad.browser.test.ts`: the flame chosen burns on the pad, and the saucer's paint and visor reach its
side view — each read off the stand at the same point of the bob, against the stand standing still
(`tests/stand.ts`). Probes in `scripts/probes/0541-the-looks-are-on-the-pad.mjs`.

`scripts/shot-pad.mjs` is the page to look at when a look is added: one run, every ship, every look.

## Owed

- A play on the branch preview.
