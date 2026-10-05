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
| **Fly leads** | `leads: true` on the title's row: the chrome marks its first action and the stylesheet stands it on a row of its own, over the quiet row with the chip first |
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
  stood before this change; 27 % at 667x375 and more elsewhere. **CI wrapped it anyway**, at 480x320,
  and Settings went under the fold. So the quiet row's buttons may now shrink to nothing and cut their
  words short rather than wrap — the music room's answer ([0210](0210-the-title-plays-the-music.md)):
  a row that holds by a margin of fonts is not a rule. Measured with every letter spaced 0.08 em wider,
  the row is one line at every size and nothing scrolls.
- **The faces.** CI also cut the fourth face at 1024x768, where the plate's sides had come out of the
  faces' track and left it 10 % spare. The names under the faces are what grow with a font, so they and
  the gaps between the cards gave: 36 % spare there, 28 % with the letters spaced wider.
- **The cuts.** A clip path takes what is drawn round a box with it, and the first build put Settings'
  focus ring in the plate's bottom-right cut and the faces' in its top-left on every phone. The cut is
  half as deep on a phone. That is the one new guard.

## The walk, which did not change

The first build split the walk too: *Fly* a row of its own, the quiet row under it. That needed two more
repairs — a sideways push on a row of one stepped round to itself, a dead axis, and the title opened on
the quiet row's chip — and three probes. **The probe that took the split away stayed green.** Inside a
row of buttons the boxes already decide where a push lands ([0214](0214-a-grid-is-not-a-list.md)), so
with the actions left as one row down from *Fly* is the button under its middle, up from the quiet row is
*Fly*, right off *Fly* steps along the row, and the title opens on *Fly* because it is the row's first.
The split and both repairs were taken out again, and the walk is as it was. The re-recorded 0458 walk in
`tests/menu.browser.test.ts` holds what the player presses through.

## Raised, and answered by the picture

**The flyer.** The pilot's ship crosses at 88 % of the height. On a desktop and a tablet that is under
both plates; on a phone it crosses under the table's plate and behind the rows' corner, where the plate's
glass keeps the words over it. It stays where it was.

## What guards it

`tests/layout.browser.test.ts`: the plates' cuts, with each control grown by the cursor's ring read off
the stylesheet; the phone's one-row rule, amended to the quiet row with *Fly* above it.
`tests/menu.browser.test.ts`: the 0458 walk re-recorded down from *Fly* into the quiet row and back up.
`tests/intro.browser.test.ts`: a first tap on a face says what that pilot flies, where it said their bio.
Probes in `scripts/probes/0538-the-title-is-composed.mjs`; 0063's, 0415's and 0513's re-anchored.

`scripts/shot-menus.mjs` takes `--sizes=guard` for the six sizes, `--only=title` and `--bare` for the
title with no table — the set this was handed over with.

## Owed

- A play of the title on the branch preview, at a desktop and a phone.
