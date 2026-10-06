# 0562 — The plate grows

**Accepted 2026-10-07.** Item 3 of the queue in
[the hangar family, reviewed](../../reports/the-hangar-family-reviewed-2026-10-07.md), its §1.2 and
§1.5. Amends [0539](0539-the-readout-stands-down.md)'s balance in the stand's top corner and
[0458](0458-the-title-is-rows.md)'s band line under every band, on a stand.

## The ask

The review, measured: the plate's type was **20 px at 1280×720 and 20 px at 1920×1080**, so at full HD
more than half the plate was empty, and at 2560×1080 its options stretched to 340 px around one
word. What an option was, and why one was shut, was said in a 13 px line under each band that moved
as the cursor did. The balance stood in the stand's top corner, about 1200 px from *Buy* at full HD.

## The rule

| | |
|---|---|
| **the plate's type** | its em runs with the screen's short side past the laptop's cap: `max(the old clamp, 2.5cqh)`, to 2.2 rem. 1280×720 is unchanged, 1920×1080 is half as large again, and the tabs and the plate's padding are in its em, so the whole plate scales. Below 800 px tall nothing moves |
| **a very wide screen** | from 19:9 the plate stops at 40 em across and the stand takes the rest |
| **the focus card** | at the plate's foot: the band's name small, the option large, what it is, and what it is to the player — *Fitted*, how to fit it in the hand's words, what opens a shut one, or a ware's state at Cosmo's. It speaks for the band the cursor is on, and keeps speaking for it when the cursor goes to the actions. The aisle speaks for the shelf in view. A band of faces drops the name its line carries, since the card has just said it |
| **the bands' own lines** | not drawn on a stand. They are kept in the page for a reader, and the card says the same thing in one place |
| **the balance** | in the foot, on *Back*'s line beside it and *Buy*. On Cosmo's, while the ware in the window is one the balance covers, it says *After* and the balance after it |
| **the keys** | one small line under the balance and the actions, in the hand's words: *← → try · Enter fit · Esc back · Q E tabs*, a pad's glyphs, nothing on touch. Cosmo's says *pick*. It is not drawn on a phone |
| **the foot is one row** | the card on the left, the balance, the actions and the keys beside it. Stacked, card over balance over Back, it was three lines high, and on CI's wider letters it put Paint & Parts' plate three pixels past the others at 1280×720. Checked here with `* { letter-spacing: 0.05em }` laid over the page, which reproduces CI's widths |
| **Q and E** | step the tabs on a keyboard, as LB and RB do on a pad. The keyboard had no way across but the strip |
| **on a phone** | the card is the option and its state on two short lines. 0561's tick stands down, because a phone's band shows one option and its fill already says it is fitted |

0561's tick is a small badge on the fitted option's corner. Inside the label it crowded the
words at 1024×768.

## Why the card, rather than larger lines

A larger line under every band costs a line of height per band. That was what 0539 found the plate
short of, and the line jumped from band to band. One card in a fixed place costs one card's height
and frees every band's line. A garage screen says what the thing under the cursor is in one place,
and every reference the review names does.

## What the guards say

`tests/foot.browser.test.ts`: the gun band's type is at least 1.3× larger at 1920×1080 than at
1280×720. The card names the gun tried on, and then the special when the cursor goes down. The
balance is on the plate, on Back's line, to its left. Its two probes cap the type again and freeze the card.
`tests/layout.browser.test.ts` holds the six phone-to-laptop sizes. The key line was the four pixels
that made Cosmo's scroll at 480×320, and it stands down there.

## What is owed

A look at 1920×1080 and on an ultrawide, and a play with each hand.
