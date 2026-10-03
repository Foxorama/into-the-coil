# 0465 — The chrome fits the phone

**Accepted 2026-10-03.** Item 1 of
[the chrome and the ships, reviewed](../../reports/the-chrome-and-the-ships-reviewed-2026-10-03.md),
asked for as *"the hud and side buttons are too big on mobile it looks weird"*, with *"focus is on
desktop with mobile as a secondary device — but people are playing on mobile so it needs to be good
as well."* Amends [0361](0361-the-readout-is-read-at-arms-length.md)'s clamp and
[0358](0358-a-trigger-is-a-button.md)'s table; [0049](0049-the-chrome-is-authored-against-the-short-axis.md)'s
rule, applied to the one screen it had not reached.

## The rule

| | was | is |
|---|---|---|
| **the strip's type** (readout, boss bar, score) | `clamp(0.95rem, 2.4vw, 1.3rem)` | `clamp(0.75rem, 2.9cqh, 1.3rem)`, against a query container the size of the glass |
| **the top strip** | a grid pinned to the top of the host, typeset in `vw` | a container the host's size, with the grid (`.itc-playing-strip`) inside it |
| **a trigger disc** | 0.17 of the short edge | 0.12 of it, held between **44 px** and **66 px** |
| **between two discs** | 0.05 of the short edge | 0.035 |
| **the disc's glass** | 55 % void | 35 %, so a body under it is seen |
| **the disc's label** | the container's `2.2vw` type | `clamp(0.7rem, 3cqmin, 1.1rem)` |

## What was measured

Off the built page at `85a6432`, with every box read off the DOM:

| camera | top strip | of the height | readout font | disc | the three discs' column |
|---|---|---|---|---|---|
| 1280×720 | 64 px | 8.9 % | 20.8 px | — | — |
| 844×390 touch | 63 px | **16.2 %** | 20.3 px | 66 px | **61 %** of the height |
| 812×375 touch | 60 px | 16.0 % | 19.5 px | 64 px | 61 % |
| 480×320 touch | 47 px | 14.7 % | 15.2 px | 54 px | 61 % |

**The strip was sized by the width, and a landscape phone has the width.** `2.4vw` of 844 is the
desktop's font to within half a pixel, on a screen half as tall; the strip is one height in ems
([0439](0439-the-top-is-one-strip.md)), so it was the desktop's strip at twice the share of the
picture. 0361 itself said the `2.4vw` arm *"has not been looked at with a thumb over it."*

**The discs were sized at two and played at three.** 0358 chose 0.17 for two discs and left the size
to the first play; [0447](0447-the-ward-is-a-third-trigger.md) made it three, and three at 0.17 plus
two gaps of 0.05 stack 61 % of the height up the leading edge — the edge every threat enters by
([0048](0048-a-threat-may-arrive-from-the-side.md)). In the 844×390 photograph the hostile shuriken
pass behind them.

## Why it is built the way it is

**A container, because the strip lives outside every overlay.** 0049 made each screen's overlay a
query container so its chrome is a share of *the box the player is looking at*, never the viewport.
The playing strip is not in an overlay — it is a sibling on the host — so a `cqh` on it would have
fallen back to the viewport, which is `vh` under another name. The trigger discs already answered
this ([0358](0358-a-trigger-is-a-button.md): *"its own container, exactly the host's size"*), and the
strip does the same: `.itc-playing-top` is now the container, inset to the host, and the grid moved
one element down. A container cannot query itself, which is why the grid is inside it rather than
on it.

**2.9 % of the height, because that is the desktop's number.** 2.9 % of 720 is 20.9 px; the strip
ends at 64.7 px where it ended at 64. [0153](0153-desktop-is-the-target.md): the desktop is the
target and may not be made smaller on the phone's account, and the guard holds it to the pixel.
**Declared once, on the strip, and inherited by the three plates** — they each carried the clamp
before, and a probe that shrank one of them was caught by 0439's one-line guard before this
decision's, which is the right verdict and the wrong test: three copies of a number can be sized
apart, one cannot.

**The floor is 0.75 rem, and it is the one number left to the play.** 0361 raised the floor to
0.95 rem for a monitor read at arm's length. A phone is read at a hand's length, at a device scale of
two — 12 CSS px is 24 device pixels — and every phone in the layout guard's list lands on the floor
(2.9 % of 412 is 11.9). The player chose 0.75 and a play; the strip is 9–10 % of the height on every
phone 375 px or taller and 11.6 % on the 320 px one, where the floor and not the share is what the
box gets.

**The disc is a share with a floor and a ceiling in pixels, because a thumb is the same size on
every phone.** 0.12 of 390 is 47 px; 0.12 of 320 would be 38, under 0358's own 44 px fingertip, so
the floor is the thumb; 0.12 of a tablet's 768 would be 92, so the ceiling is the 66 px the 390 px
phone had, which was played as big and never as small. The table carries all three
(`TRIGGER_BUTTON` in `src/app/touch.ts`), and `triggerRadius` and the stylesheet's `clamp()` are
the same arithmetic — the stylesheet's string is built once from the table and used both for the
disc's box and for each disc's place up the edge, so the picture and the hit test cannot round
apart ([0060](0060-a-trigger-is-a-place-on-the-glass.md)). The column is 43 % of the height on the
390 px phone and 48 % on the 320 px one.

**The hit reach is unchanged.** 1.3 of the drawn radius, so a 47 px disc hears 61 px; the thumb that
lands on the edge of what it aims at is 0358's argument and this does not touch it.

## What guards it

In [`tests/hud.browser.test.ts`](../../tests/hud.browser.test.ts), one press and the viewport resized
through the layout guard's five phones and 1280×720, in pixels of the glass against the glass:

- **the strip is under a tenth of the height** on every phone 375 px or taller, and under an eighth
  on the 320 px one, and **the desktop's strip ends within a pixel of where it ended** before this;
- **every disc is between 44 and 66 px**, and **the discs' column is under half the height**.

Each was seen red by [its probe](../../scripts/probes/0465-the-chrome-fits-the-phone.mjs):

| broken on purpose | went red |
|---|---|
| the readout's type sized by the width again | `THE ASK: the strip is under a tenth of a phone’s height` |
| the desktop's readout shrunk with the phone's (2.5 % of the height) | `and the desktop’s is what it was` |
| the disc put back at 0.17 of the short edge | `the column under half the height` |
| the thumb's floor taken off the disc | `44 to 66 px each` |

[0358](0358-a-trigger-is-a-button.md)'s guard that the disc is drawn where the hit test listens runs
unchanged against the new table, and its *wider than a fingertip* claim now holds on every phone
rather than on the one camera it was written at.

## What it does not do, and what the player may veto

- **The floor is played, not proven.** 0.75 rem on a phone was chosen from the report; a play that
  finds it small moves one number and this guard's eighth with it.
- **The desktop is untouched**: the same font, the same strip, the same absence of discs.
- **A tablet's discs are 66 px**, the ceiling, where they were 0.17 of 768 — 131 px. No tablet has
  been played.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
