# 0538 — The title is composed

**Accepted 2026-10-05.** Item 1 of [`the-menus-are-a-place`](../../reports/the-menus-are-a-place-2026-10-05.md).
Lays a picture over [0458](0458-the-title-is-rows.md)'s rows and [0513](0513-the-pilot-flies.md)'s pilot
screen; changes neither model.

## The ask

> *"The main menu is a pure mess at the moment with stuff everywhere. It's all quite unpleasant."*

Answered by the player the same evening: the bio leaves the title for the hangar, and the title stays
in the sky ([the answers](../../reports/the-menus-are-a-place-2026-10-05.md#the-answers)).

## The rule

**The title is two plates in the sky: the table in one, and in the other the faces, one line saying the
run, the tier, *Fly* alone across the plate, and the quiet row under it — the continues chip, *Hangin'
Out* and *Settings* at one size.**

| | |
|---|---|
| **the line** | `card: 'line'` on the title's pilot band (`src/state/screens.ts`): the name, the craft and the fitted gun on one line. The hangar's bands say `card: 'whole'` and keep 0513's card. A line is its own element, not the card with parts hidden — a hidden bio is still in the tree, and one rule showing it again puts it back without anyone deciding to |
| **Fly leads** | `leads: true` on the title's row: its first action stands on a row of its own. The walk reads it (`walkOf` in `src/app/chrome.ts`), so the cursor's rows are the rows drawn: the bands, *Fly*, then the quiet row with the chip first |
| **the plates** | the crossing's cut-corner frame ([0341](0341-the-crossing-reads-as-a-nav-plate.md)) with the title's run of inks for a rim ([0440](0440-every-screen-speaks-with-the-titles-voice.md)) — violet at the top-left cut, cyan at the bottom-right. An empty table draws no plate |
| **on a phone** | the two plates side by side, as the columns were; the rows' plate is a box rather than the body's cells (0513 stood it aside), because a plate cannot be drawn round cells that belong to its parent |

## What the picture cost, measured

Every number here is from the built page with a full table, at the layout guard's six sizes, before CI's
wider fonts.

- **Height.** The card's row went and *Fly*'s came, and the tier's names, which ran across the whole body
  on a phone, now stand in a column beside the table and take two lines. At 667x375 the first build
  scrolled by 20 px and 480x320 by 14. Given back from padding and type above their floors: the faces a
  little smaller, *Fly* a thumb tall, the tier's names a step down. 19 px spare at 480x320, 29 at the rest.
- **Width.** The quiet row's three one-line buttons had **1 %** of their row spare at 667x375 and 3 % at
  480x320. CI sets a row about a quarter wider (0521's own note), so it would have wrapped there first.
  On every phone the table's place numbers go — the five stand best first and say their order by
  standing in it — its heading is spaced closer, and the quiet row is set a step down; on the narrowest,
  the panel's and the plates' own sides give theirs. 22 % spare at 480x320, which is where the row
  stood before this change and where CI has passed it; 27 % at 667x375 and more elsewhere.
- **The cuts.** A clip path takes what is drawn round a box with it, and the first build put Settings'
  focus ring in the plate's bottom-right cut and the faces' in its top-left on every phone. The cut is
  half as deep on a phone. That is the one new guard.

## The walk

*Fly* alone on a row is a row of one, and a sideways push along a row of one stepped round to itself: a
dead axis, which [0214](0214-a-grid-is-not-a-list.md)'s fallback exists to prevent and its own guard caught. A push along a row of one
goes on to the next row, right down and left up, the way the reading order runs. The title still opens
on *Fly* — the cursor now looks for the first action rather than the last row's first stop, which was
the same place only while the actions were one row.

## Raised, and answered by the picture

**The flyer.** The pilot's ship crosses at 88 % of the height. On a desktop and a tablet that is under
both plates; on a phone it crosses under the table's plate and behind the rows' corner, where the plate's
glass keeps the words over it. It stays where it was.

## What guards it

`tests/layout.browser.test.ts`: the plates' cuts, with each control grown by the cursor's ring read off
the stylesheet; the phone's one-row rule, amended to the quiet row with *Fly* above it.
`tests/menu.browser.test.ts`: the 0458 walk re-recorded through *Fly*'s row and the quiet row.
`tests/intro.browser.test.ts`: a first tap on a face says what that pilot flies, where it said their bio.
Probes in `scripts/probes/0538-the-title-is-composed.mjs`; 0063's, 0415's and 0513's re-anchored.

`scripts/shot-menus.mjs` takes `--sizes=guard` for the six sizes, `--only=title` and `--bare` for the
title with no table — the set this was handed over with.

## Owed

- A play of the title on the branch preview, at a desktop and a phone.
