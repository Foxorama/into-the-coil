# 0670 — The plate from the short side

**Accepted 2026-10-24.** Item 3 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md), from findings 2
and 10 of [`the-menus-reviewed-again`](../../reports/the-menus-reviewed-again-2026-10-24.md), answered *"Agree with the
suggested answers."* It amends [0562](0562-the-plate-grows.md) (the plate grows — in type now, not only in height),
[0571](0571-the-dock.md) and [0568](0568-the-hangar-opens-out.md) (the column's size) and [0566](0566-the-phone-pass.md)
(the targets: drawn at a thumb's floor, not only pressed there).

## The ask

Measured in the review: the hangar family's plate 384 px wide at 1280×720, 1920×1080 and 2560×1080 alike; its type
15.1 px, 16 and 16; the keys' line 9.4 px to 9.9; the bottom third of the plate empty at 1080; and the seventh face on
the pilot band cut in half at the plate's edge. On an 844×390 phone the tabs 29 px tall, the chips 30 (39×42 in the
review's seed), the arrows 26, *Fly* 39 — under Apple's 44 pt and Google's 48 dp.

## The rule

| | was | is |
|---|---|---|
| **the plate's em** (a desktop, 461 px tall and up) | `clamp(0.78rem, 2.1cqh, 1rem)`: 15.1 px at 720, 16 at 1080 | `clamp(0.78rem, 0.5rem + 0.97cqh, 1.4rem)`: 15.0 px at 720, 15.4 at 768, 16.7 at 900, 18.5 at 1080 |
| **the plate's width** | 24 rem, 384 px everywhere | 25.4 of its em, never more than a third of the screen nor less than the 24 rem it was: 381 px at 1280×720, 384 at 1024×768, 425 at 1440×900, 469 at 1920×1080 (24 %) and 2560×1080 (18 %) |
| **the tabs** | 0.78 rem | 0.82 of the plate's em: 12.3 px at 720, 15.2 at 1080 |
| **the keys' line** | 0.62 em, 9.4 px at 720 | never under 12 px |
| **a tab with fewer bands** | its bands at the plate's top over an empty foot (230 px on Paint & Parts at 1080) | the head (faces, whose they are, the sub-tabs) stays together; the groups' row takes what is left, and the group in view stretches its bands down it: 121 px under Paint & Parts' last band at 1080, against its tallest band's 185 |
| **a band of faces** | the seventh face cut in half behind the arrow at 384 px | whole faces only: a face the track only partly shows is put away until a scroll brings all of it in |
| **a touch phone** | tabs 29 px, chips 30, arrows 26, *Fly* 39 | every tab, chip and *Fly* at least 44 px on its short side, an arrow 44 tall at 0607's width, the tier's chips 44 tall |

**The numbers are a fit, not the plan's.** The plan suggested `clamp(0.95rem, 1.55cqmin, 1.4rem)`, which is 15.2 px at
720 and 16.7 at 1080 — not the 19 the plan expected there. A straight line through 15 px at 720 and 19 at 1080 ran
Hangin' Out's four bands 13 px past its plate at 1080, so the line goes through 18.5: 16 px of plate spare under
Hangin' Out's last band there. The plan's floor of 0.95 rem would have moved a 1024×768 and nothing else.

## What it does not do

- **Cosmo's plate is still mostly empty at 1080.** It shows one shelf at a time, and at 1080 that is a band 215 px
  tall over 544 px of plate. What fills it is a layout of the shelf — more of it in view, or the shelf's tiles
  larger — and that is not this change's to invent: the plan's item 6 rebuilds the shop's foot and sub-tabs.
- **The focus card two lines at and above 900 px tall** is 0572's rule and unchanged; at 1080 it already was.
- **480×320** is not asked to fit at 44 px: Hangin' Out has 4 px spare there, and a plate that runs out scrolls by a
  band at the foot (0572).

## What it cost and the guards it moved

`tests/layout.browser.test.ts`, *0670*, in CSS px on the built page:

- at 1920×1080 and 2560×1080, on each of the three tabs: the plate's type at least 18 px, the plate at most a third
  of the width, the keys' line at least 12 px, and — on Hangin' Out and Paint & Parts — the plate empty under the
  last band by less than the tallest band's height;
- at 844×390 and 667×375 with touch: *Fly* and the tier's chips, and on each tab every tab, chip and live arrow, at
  least 44 px (an arrow by its height);
- at the guard's six and 1920×1080: no face on the hangar's pilot band drawn in part.

The guard's existing six landscape sizes are unchanged, and the whole layout suite is green on them.

Probed in `scripts/probes/0670-the-plate-from-the-short-side.mjs`: the em pinned at a rem again, the width with no cap,
the keys' line with no floor, the groups' row given no share of what is left (233 px empty), the tabs and *Fly* under
a thumb, and a face drawn in part. A first draft also set the groups' own rows `space-between`; the proof found the
break that took it out green — with one group in view there is nothing for it to spread — and it is gone.

**[0568](0568-the-hangar-opens-out.md)'s guard is changed, and says why**: it held the plate to one width at 1280×720
and 1920×1080. The plate is its type's width now, so it may be wider at 1080 rows by the type's own ratio (18.5 over
15) and no more, and still under a quarter of a 1920 screen. Its probe is re-anchored on the new column.

**Photographed** at the pair, the guard's six, 1920×1080 and 2560×1080.

## What is owed

- A thumb on a phone, and the review's note that [0566](0566-the-phone-pass.md)'s 14 px readout floor is still unmet
  on a phone until the plan's item 9, which takes the cockpit strip off a phone.
- A look at 1440×900, the one size between the two the guard holds, where Hangin' Out has 77 px spare.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
