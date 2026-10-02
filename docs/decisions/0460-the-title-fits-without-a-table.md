# 0460 — The title fits without a table

**Accepted 2026-10-02.** A play report on [0458](0458-the-title-is-rows.md), from a phone in
landscape with nothing kept yet: *"some bugs — mobile browser menu; also the right side of the menu on
all devices and desktops weirdly creeps in for a bit, resets then creeps back in."* The photograph had
the tier names stood four words tall with the step arrows drawn through *Legendary* and *Galaxy*, the
pilot faces cut at both ends, everything in the left third, and a darker band down the right edge.

## The rule

| | was | is |
|---|---|---|
| **the title with nothing kept, on a phone** | the rows in five sixteenths of the width, beside a column holding nothing | the rows alone in the middle, as on a desktop |
| **the faces' track** | centred, so a roster wider than it overflows before its start, where no scroll reaches | safe-centred: centred while it fits, started at the start once it does not |
| **the sky** | the two washes on the drifting element, resetting its stars | the washes on a layer of their own over it; the stars drift as [0437](0437-the-title-is-lit.md) built them |

## Why each was broken

**Three bugs, one picture, three causes.** None of them was a measurement the guards were taking.

- **The bare body lost to the phone block.** `.itc-title-body-bare` gave one column; the phone block,
  later in the file at the same weight, set `.itc-title-body` back to two. With a table the two
  columns are right, and that is the only title the layout guard ever loaded — 0429 seeded it so the
  returning player was measured, and nothing measured the first-time one. The bare rule names both
  classes now.
- **The arrows were not under the names by accident of the arrows.** In a fifth of a phone the tier
  names' longest words were wider than their track, and a track that may shrink below its content
  draws that content over its neighbours. Given the width, they sit on two lines between the steps.
- **The sky's creep was 0440's.** A `background` shorthand on `.itc-title-sky` reset the star rule's
  images and sizes, so the stars had not been drawn since 0440, and 0437's sixty-second drift slid the
  two washes left at the size of the screen, repeating: their seam was the edge creeping in from the
  right, and the loop's restart was the reset. Every device, as reported.

## What guards it

In [`tests/layout.browser.test.ts`](../../tests/layout.browser.test.ts), on every viewport in its list
and on the title **both with a full table and with nothing kept** — `open` takes which:

- **no band segment is drawn under a step**, as far as its track lets it be seen;
- **the chosen segment is drawn whole** inside its track;
- **a track that outgrows its segments shows the first from its first pixel when scrolled to its
  start** — the faces' track squeezed to one face for the measure, because four pilots fit today and
  the roster is going to grow;
- **every layer of the drifting sky is a tile in pixels**, because a layer drawn at its box's size is
  what turned the drift into a seam.

Each was seen red by [its probe](../../scripts/probes/0460-the-title-fits-without-a-table.mjs):

| broken on purpose | went red |
|---|---|
| the title with nothing kept giving its rows five sixteenths of a phone | `with nothing kept, on every device` |
| the washes on the drifting sky, so the stars go and the drift slides a seam across the title | `sizes every layer of the drifting background as a tile` |
| the faces centred past their track's start, so the first is cut and cannot be scrolled to | `on every device` |

**Photographed at the camera the game ships** — 826×330 with touch, the reported phone's shape, and
1280×720: the empty title centred with every name whole, the seeded one unchanged, and twelve seconds
of the sky with no edge moving in.

## What CI found

**The new guard found the same bug with a table, on CI's fonts.** At 480×320 beside the table the tier
track had four pixels over its three longest words on this machine, and CI's wider fonts put *Legendary
Pilot* and *Let the Galaxy Burn* under the steps — 0458's, never seen because nothing measured a
segment against an arrow. On the narrowest container the band's arrows, gaps and padding give the width
back instead of the words: the slack there is 55 px now, measured.

**And the pad walk's tap was ended by the wall clock.** Both of 0458's title walks failed on this PR as
they had on #475 and on three of 0458's own runs, each time with one tap walking the ring two or three
rows round — the menu's held-direction repeat. The tap was counted in frames and released by a second
message from the test, and the page kept stepping while that message travelled. With the release held
back half a second, twelve taps of twelve repeated; released in the page after the same frames, none
did. CPU throttling at 25× did not reproduce it, because a throttled page does not slow the round trip,
which is why it only ever showed on a loaded runner. The tap is pressed and released inside one
evaluate now ([0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md): the guard was
measuring the wrong quantity), and 0458's twelve probes still go red through it.

**What it does not do.** Stars now pass behind the hollow tier segments, as they always were meant to
and never did; they are dim points and 0437's backing was for the ship, which flies below the bands.
If that reads as noise on play, the segments take the void backing the buttons have.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
