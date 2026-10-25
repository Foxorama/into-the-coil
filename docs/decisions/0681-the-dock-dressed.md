# 0681 — The dock dressed as a place

**Accepted 2026-10-25.** Item 6 of [`the-port-planned`](../../reports/the-port-planned-2026-10-24.md), the last, from
[`the-port-is-a-cutout`](../../reports/the-port-is-a-cutout-2026-10-24.md). It amends:

- [0550](0550-every-tab-has-a-keeper.md): the keepers' shops.
- [0572](0572-the-dock-is-dressed.md): the dock's dressing.
- [0680](0680-depth-and-life.md): which keeper's work throws sparks now rides their row.

## The ask

The three shops were one shape three times: the same alcove at the same size side by side, told apart only by their
counters and signs. A wide screen's right side was sky. The mezzanine had no mark of what the dock was for. Every
wall tile was the same clean panel.

## The rule

| | was | is |
|---|---|---|
| **A shop's front** | the alcove alone | the alcove and the keeper's own front over it, named on their row (`KeeperRow.front`). Unity's workshop has a roller door rolled up into its drum, its guides striped at their foot, and a hoist out to the right with a chain and hook (`frontWorkshop`). MMXXVI's spray booth has an extractor hood with its duct up the wall, a strip light under it, and overspray on the posts (`frontBooth`). Cosmo's lit glass display has two shelves of wares glowing, a gilt frame, spotlights and the glass's sheen (`frontDisplay`). Each front is laid under the keeper and the counter, so it frames them and never covers a face |
| **Their sizes** | 0.78 for all three, at 48.3 across | each its own (`DOCK.shopGrow`, `DOCK.shopAcross`): MMXXVI's 0.76 and a unit back on the catwalk, Unity's 0.86 and Cosmo's 0.9 forward. Each counter's foot stays on the catwalk. They overlap: Unity's and Cosmo's frames stand over MMXXVI's, drawn farthest first (`SHOP_ORDER`). The marks, the doors and the bubbles read each shop's own size |
| **Over the mezzanine** | nothing | a neon of a wrench crossed with a star, the trade and the shine (`neonMark`): a picture and not a word, on the voice rule. The fan it displaced moved down under the catwalk by the bay |
| **A wide screen's right side** | sky past the spar | the dock's arm reaching in from the right to a lit docking collar (`dockArm`), past the spar and further off than it, at a third of the room's depth |
| **The tiles** | a clean panel | its rivets lit from above, a point of light over each and a dark one under, the seams' shadow inside the panel's top and left edges, and the conduit's shadow on the panel under it. On the deck, scuffs. Grime along the wall's foot in both rooms, a tile at a time (`grime`). One dented panel in each room (`wallDent`) |
| **What their work throws off** | `kind === 'unity'` in the frame | `KeeperRow.works`: its picture and where it flies from. 0680 named Unity in the painter, which a hub does not do (0016) |

## Done differently from the plan, and not done

- **The counters are as they were.** The plan had `paintBench`, `paintBooth` and `paintStall` redrawn at their own
  extents. The keepers stand on and behind those counters, and 0554–0556's guards hold where. Redrawing them would
  move every keeper's place against a counter the guards were written for. Each shop's shape is in its front instead,
  and the size and depth are in `shopGrow`, which the counters and keepers both take.
- **The stagger is size and a step back, not an across offset alone.** A counter moved across without changing its
  size floats over the catwalk or sinks into it. Each shop's across is its counter's foot on the catwalk at its size,
  with MMXXVI's a unit back, and a test holds that.
- **The grime is laid a tile at a time.** The wall's shade is one band stretched by a square's grow, and grime
  stretched that way across the room would have stood forty units tall.

## What it cost and the guards it moved

- **The port's atlas**, measured in the browser with the pilot at the default:
  - The seven new kinds are 2.40 MB of the intro's 29.52 MB and 2.05 MB of the stand's 34.56 MB at 1280×720.
  - They are 5.68 MB of 70.00 MB at 1920×1080 doubled.
  - The bakes took 90 ms and 51 ms at 720p, and 141 ms and 91 ms at 1080p doubled.
- **Blits a frame**, every one a blit of a baked bitmap:
  - On the stand, 14 more: three fronts, the neon, the arm, the dent, and eight tiles of grime.
  - In the intro, ten more: the dent and nine tiles of grime.
  - The polish is in the tiles' own pictures and costs no blit. `SHOP_ORDER` is sorted once at module load, under
    its `// @setup:`.
- **`tests/stand.test.ts`**, *0681*, new. Every row wears its own front, every shop has its own size, every
  counter's foot is on the catwalk or up to a unit and a half back on it, and the alcoves are drawn in order of size.
  - Probed in `scripts/probes/0681-the-dock-dressed.mjs`, 3/3 red:
    - Unity's front on MMXXVI's row too: *two shops wear one front*.
    - Cosmo's shop lifted three units: its counter's foot at 57, over the catwalk.
    - The shops drawn in the table's order: an alcove at 5.93 after one at 6.21.
- **The door read as a ruler.** `tests/stand.ts`, `tests/dolly.browser.test.ts` and
  `tests/workshop.browser.test.ts` read a world unit off a shopfront door. Each now reads it at that door's own
  shop's size; the one shared scale is gone.
- **Re-anchored:** `scripts/probes/0542-cosmos-counter.mjs`'s and `scripts/probes/0554-unity-leans-on-the-wrench.mjs`'s
  probes on the counter's line, which now stands at the shop's own across.

**Not held by any guard:** every front's drawing, the neon, the arm, the polish, and how much the shops overlap.
They are the picture's.

**Photographed** with `scripts/shot-menus.mjs` at the pair, the guard's six, 1920×1080 and 2560×1080, and the intro
at 1.2 s and 6 s. The arm shows only on a screen wide enough, as asked.

## What is owed

- A play: whether the three shops read as three trades, whether the stagger reads as depth or as misalignment,
  and whether the neon is the right size against the lamps' cones.
