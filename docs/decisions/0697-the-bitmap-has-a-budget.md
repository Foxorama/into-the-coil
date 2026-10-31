# 0697 — The bitmap has a budget

**Accepted 2026-10-31.** Item 0 of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md).
Amends [0065](0065-the-sky-is-baked-and-blitted.md)'s bake ceiling, and keeps its reason.

## The ask

> *"can we do a pass over all the spaceships and weapons to make them look better? they're all pretty
> blocky and badly pixelated at the moment and I think we can add a lot more detail and polish to them
> to make them look better"*

## What was measured before anything was drawn

[0027](0027-measure-the-picture-not-the-model.md): the ships were photographed where the player sees
them, from the shipped build, before a line of art was touched.

| where | the ship is drawn | its bitmap was | so |
|---|---|---|---|
| the sheet, 1920×1080 | 85 px | 85 px | honest — at 9 px a unit nothing is capped |
| the fight, 2560×1440 | 113 px | 94 px | stretched 1.2× |
| Hangin' Out, 2560×1080 | ≈ 305 px | 240 px | stretched 1.3× |
| Paint & Parts, 2560×1080 | ≈ 365 px | 240 px | stretched 1.5× — every pinstripe a smear |
| its wheels on the pad, 2560×1080 | ≈ 90 px | 21 px | stretched 4× — the spokes are fog |
| Paint & Parts, 2560×1440 | ≈ 545 px | 240 px | stretched 2.3× |

**The cause is one constant applied to two different things.** 0065 made the bake ceiling a
*resolution* — ten pixels a world unit — because a flat pixel cap starved the sky tile, which is four
times a boss. That was right for the sky and was then applied to every bitmap the game bakes, including
the few the camera comes close on: `bakePiece` in `src/render/port-bake.ts` bakes the pilot's ship
*"as much sharper as the camera is closer"* ([0563](0563-the-ship-is-the-picture.md)) and hands the
product to `bakeSize`, which capped it at ten regardless; the wheels and lamps laid on the pad go
through `bakeGlyph` and the same cap, at a fifth of the ship's extent.

**And the cost that justified the cap is not where the ships are.** Every bitmap in `SPRITE_KINDS`
costs its pixels square, so the atlas is the big things:

| at | whole atlas | of which bosses | sky | ships | shots, pickups, the rest |
|---|---|---|---|---|---|
| 9 a unit (1080p) | 332 MB | 200 | 97 | 3 | 27 |
| 12 a unit (1440p), ceiling 10 | 410 MB | 246 | 119 | 3 | 33 |

## The rule

**The ceiling is the larger of two numbers: ten pixels a unit, and a bitmap budget of 480 pixels
square.** A kind whose bitmap at ten a unit is under the budget bakes at whatever resolution it is
blitted at, up to the budget; a kind over it — the sky, the bosses — is held at ten a unit exactly as
0065 held it. So nothing bakes smaller than it did, and the small things the player watches bake sharp
on every desktop.

**A caller that comes close on a few pieces says its own budget.** The port's sharp pieces — the
pilot's ship, its flames and rider, the keepers — pass `SHARP_BUDGET`, 768 px: the ship's box on the pad
is 24 units, and the Paint & Parts camera asks 545 px of it on a 1440p monitor and 680 on a Retina
laptop. A 4K monitor at one device pixel per CSS pixel asks 817 and is a sixteenth soft, which is the
price of two dozen pieces staying under sixty megabytes there.

| | was | is |
|---|---|---|
| `bakeSize(extent, ppu)` | `min(extent × 10, ⌈extent × ppu⌉)` | `min(max(extent × 10, budget), ⌈extent × ppu⌉)`, `budget` defaulting to `BITMAP_BUDGET` |
| the pad's ship at 2560×1080 | 240 px for 365 drawn | 408 px for 365 drawn |
| its wheels | 21 px for 90 | 90 px for 90 |
| the fight's ship at 2560×1440 | 94 px for 113 | 113 px for 113 |
| the sky tile, any screen | 1200 px | 1200 px |

## What it costs

The same table as above, with the budget: **+0 MB at nine a unit, +23 MB at twelve, +76 MB at
eighteen** (a 4K monitor at one device pixel per CSS pixel, or 1440p at a 150% scale). Measured over
`SPRITE_KINDS` with the script that produced the table, at four bytes a pixel.

## What was rejected

- **Lifting the ceiling itself**, to twenty or thirty a unit. +180 MB at twelve a unit and +920 MB at
  eighteen, nearly all of it bosses and sky that are soft by design ([0563](0563-the-ship-is-the-picture.md)
  leaves the room behind the ship soft on purpose). The ships are a hundredth of the atlas; a fix for
  them that costs the atlas is the wrong fix.
- **A flat pixel ceiling** in place of the resolution. 0065's defect back: the sky tile at a fraction of
  its detail, blitted at three times its own resolution. The probe plants exactly this and the 0065 guard
  goes red.
- **Only the port's pieces.** The fight at 1440p and on any Retina display was stretched too, and so
  were the HUD's glyphs and the pad's wheels, none of which go through `bakePiece`.

## What guards it

`tests/budget.test.ts`, *0697*, in pixels — at the stand's own product `view.scale × STAND_SHARP ×
DOCK.shipGrow` on 2560×1080 and 2560×1440, the bitmap under the ship has at least the pixels the pad
draws; on every desktop the sheet offers at `MAX_DPR`, the ship's box, the smallest shot and the wheel
bake at exactly their blit size; and the sky tile is still over the budget. The 0065 guard now walks the
kinds the resolution half decides, and insists the sky is one of them. Three probes in
`scripts/probes/0697-the-bitmap-has-a-budget.mjs`: the budget gone, the pad's budget sized for the
fight, and the budget made the ceiling.

## What this does not do

It adds no detail. The sheet at 1080p shows the picture honestly, and that picture is what the queue
report takes on, one ship and one weapon at a time: the art is painted in flat inks sealed in a heavy
outline, at eighty-five pixels, and what reads as *"blocky"* there is lighting and contour, not
resolution. Sharp first, because every mark the queue adds would otherwise be baked under this cap and
blurred away on the pad where the player fits the ship out.
