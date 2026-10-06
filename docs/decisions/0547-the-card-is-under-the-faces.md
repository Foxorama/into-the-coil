# 0547 — The card is under the faces

**Accepted 2026-10-06.** A fix to [0539](0539-the-readout-stands-down.md)'s pilots' head, on a phone.

## The ask

> At 667x375 the hangar's first tab, *Hangin' Out*, draws the pilot card past the right edge of the
> plate: only "Bac" and "they/" show, to the right of the faces. At 1280x720 it sits beside them. Fix it
> so the card is whole or deliberately dropped at phone sizes, check it with CI's wider letters at all six
> guard sizes, and make a control clipped by its plate fail a guard.

## What was wrong, measured

0539 put the card **beside the faces on a laptop and a phone**, in a grid of `max-content` (the faces)
and the rest (the card). The faces are as wide as the roster, about 340 px on every phone, so the card had
what the plate had left over:

| | the head | the faces | the card had | its widest line needed |
|---|---|---|---|---|
| 667x375 | 389 px | 337 px | **39 px** | 147 px (*Huang-Woo Hook*) |
| 812x375 | 479 px | 337 px | 126 px | 127 px (*he/him · The 19th Hole*), 132 px with every letter 0.08 em wider |
| 915x412 | 547 px | 354 px | 178 px | 160 px with the wider letters |

The words never shrank to the card, so its own `overflow: hidden` cut them, which is the "Bac". At 812 the
reported pilot fit and the Marmot's home did not, under CI's letters.

## What was built

- **On a phone the card is under the faces, across the plate, one line**: the name and who they are side
  by side, wrapping only if a name ever outgrows the plate. The tablet already had it there (0539).
- **One layout at every phone width, not a breakpoint between beside and under.** A wrap that kept the
  card beside the faces where it fit was built first and worked; it put the line between the two layouts at
  a width set by the fonts, which is the margin 0513 found moves a cut to the width next to it.
- **The name and the line lose their ellipsis.** A name cut to "B…" is a pilot the player cannot name, and
  the plate's width is there to give them. It also means a card too narrow again is cut by its own edge,
  which the guard sees, rather than shortened, which it would have to accept.
- Where 0523 drops the card (shorter than 360) it is still dropped; 480x320 is unchanged.

Under the faces costs one line of height. Every phone in the guard keeps at least 29 px above and below
the plate with the wider letters, and nothing scrolls.

## What guards it

`tests/layout.browser.test.ts`, *0547 — the hangar's plates hold what is on them, whole*: at the six
sizes, on each tab that stands (read off the rows), with each pilot's name and line written into the
card in turn, every leaf and control drawn on the plate is **inside the plate's edges** and **not
part-hidden by a box inside the plate that clips**. A scroller is not a cut, and neither is a line that
declares an ellipsis: the bands' lines (0523) and Paint & Parts' pilot line (0538) are cut short on
purpose. An invariant, in pixels: no change that put half a word or half a button on a plate would be
correct.

The fit guard above it could not see this. It counts what a clipping box hides as not drawn, and the plate
cuts with a clip path rather than an overflow.

Probes in `scripts/probes/0547-the-card-is-under-the-faces.mjs`: the card back beside the faces (the
reported picture), and the tabs at their desktop width on a phone (0539's first build, past the plate).
Both go red, and the guard is also red against the stylesheet as it stood at #561.

## Checked, with CI's wider letters

Every size, every pilot, `* { letter-spacing: 0.08em !important }` injected: the card whole, nothing
scrolled, Back inside the plate. The whole layout suite run the same way turned up one thing this change
does not touch: *How to Play* scrolls by 2 px at 480x320.

## Owed

- A look on the branch preview at 667x375 and 844x390, the card under the faces.
- The 2 px on *How to Play* at 480x320 with the wider letters.
