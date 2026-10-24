# The menus, planned — 2026-10-24

**A plan for every finding in [the menus, reviewed again](the-menus-reviewed-again-2026-10-24.md),
written to be handed to an implementer with no other context.** The review holds the evidence and the
pictures; this file holds the queue, what each item changes and where, what guards it, how it is
photographed, and what each owes. The player's answers are given (*"Agree with the suggested
answers"*), so nothing here waits on a question. Each item becomes its own PR with its own decision;
this file is the plan and is not edited once the work starts — a decision supersedes it, and
`docs/state-of-play.md` says which have landed.

## Read first, in this order

1. `docs/machine.md` if it exists on the machine (gitignored; node's path and the branch-preview URL).
2. `CLAUDE.md` — the rules, every one naming its decision. The ones this plan leans on hardest:
   a branch starts at `main` and the next one waits ([0033](../docs/decisions/0033-a-branch-starts-at-main.md));
   a guard is seen to fail with a probe before it is trusted ([0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md),
   [0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md), `npm run prove`); source and
   docs are written with an editor, never a shell ([0200](../docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md));
   a PR that touches `itc_*` carries a rollback note ([0001](../docs/decisions/0001-revertability-not-risk-rating.md));
   a mechanism identical for every instance is a constant wearing a field's clothes
   ([0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).
3. `docs/game.md` — *The menu* row, and *Voice*.
4. `docs/state-of-play.md` — the first five minutes, and the notebook-pages heading this plan
   answers.
5. [the menus, reviewed again](the-menus-reviewed-again-2026-10-24.md) — the findings, with the
   measurements. Then [the hangar family, reviewed](the-hangar-family-reviewed-2026-10-07.md) and
   [the menus are a place](the-menus-are-a-place-2026-10-05.md), which are the two plans this
   family has already been through, and whose decisions this plan amends by number.
6. `.claude/skills/ship/SKILL.md` — the merge ritual, tracked
   ([0201](../docs/decisions/0201-the-ritual-is-tracked-or-it-is-not-followed.md)).
7. The decisions named under each item, before touching its code.

## How every item is proved and handed over

- **One PR at a time, from `main`**, with a decision in `docs/decisions/` numbered after the last on
  `main` at the time, and `docs/state-of-play.md`'s pointer updated in the same PR.
- **Prove the change's own decision before the push** (`npm run prove`,
  [0434](../docs/decisions/0434-the-whole-proof-is-cis.md)); CI runs the whole suite.
- **Photograph before handover**: `npx vite build`, then `node scripts/shot-menus.mjs` (1280×720 and
  the 844×390 touch context) and `node scripts/shot-menus.mjs --sizes=guard` (the layout guard's
  six). Items that touch the hangar family are also shot at 1920×1080 and 2560×1080; the review's
  scratch script did this with the same seeds and three more contexts, and item 1 lands that as a
  flag on the instrument so every later item has it.
- **The pad walk is re-run** with the stubbed standard gamepad the review used (an init script
  replacing `navigator.getGamepads` with one pad whose `buttons[i].pressed` is set for 120 ms per
  press). `scripts/shot-pad.mjs` already exists; read it, and extend it or the walk in
  `tests/menu.browser.test.ts` with the sequence recorded in the review's §1.1.
- **A guard is written in the player's units where it can be** — pixels, CSS px, a screenshot's
  luminance — not in the constant it guards
  ([0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)).
- **Nothing here touches the sim.** Item 7 touches `itc_settings` and carries the rollback note;
  no other item touches a shipped surface.

---

## The queue

### 1. The band arms, the hover lifts, the hint breaks, the strip stays

Four defects the review recorded, each one or two lines, in one PR with one decision.

**a. A on the pilot band arms the pilot; a second A flies.** The title's pilot choice is
`press: 'takes'` (`src/state/screens.ts`, the title's `choices`, about line 1040), and the shell
flies on it at `src/app/mount.ts` (search `c.press === 'takes'`, about line 2974).
[0513](../docs/decisions/0513-the-pilot-flies.md) built the phone's rule — *a tap looks first*: the
first tap on a card arms it (the card under the strip fills) and the second flies — and gave a pad's
and a keyboard's press the one-press rule. Make the pad's A and the keyboard's Enter on the band
take the phone's rule: first press arms (the same state the pointer uses; find it beside the `takes`
branch — 0513 says *after a run the card flown last is armed*), second press on the same pilot
flies. *Fly* is unchanged and stays the one press that always starts a run
([0458](../docs/decisions/0458-the-title-is-rows.md)). The armed state must be visible on the title
without the card: the pilot's one line under the faces gains the word the phone's card uses, or the
face's ring brightens; photograph it.
*Guard:* `tests/menu.browser.test.ts` — with the stubbed pad: title → *Hangin' Out* → B → down →
right → A leaves the title shown with the second pilot armed; A again shows the intro. Seen to fail
by a probe that restores the one-press rule.

**b. The hover lifts.** `src/app/chrome.ts` has two hover rules on every action button:
`${each('-action:hover')} { background: rgba(255, 255, 255, 0.12); }` (about line 978) and
`${each('-action:hover')}, .itc-intro-skip:hover { --itc-glass: color-mix(in srgb, var(--itc-void)
70%, …); box-shadow: … }` (about line 3523). The second wins and darkens the glass. Make the hovered
glass lighter than the resting glass (the option chips' hover at `.itc-title-chip
.itc-title-option:hover` is the pattern that reads right) and keep the brighter rim.
*Guard:* a browser test that hovers *Hangin' Out* on the title and reads the button's computed
background luminance against *Settings* beside it: hovered is not darker. Seen to fail by a probe
that puts the 70 % void back.

**c. The shop's hint breaks.** The action-hint rule at `src/app/chrome.ts` about line 934 names
`.itc-title-action-hint, .itc-music-action-hint, .itc-save-action-hint, .itc-controls-action-hint`
and not the shop's, so *Show owned*'s hint (`src/state/screens.ts` about line 1443) is an inline
span: *"Show ownedPut what you own back on the shelves"*. Use the `each('-action-hint')` helper so
every screen's hint is styled, or name the shop's and the hangar's. (Item 6 moves *Show owned* to
the shelf's head; the hint still has to break wherever it is.)
*Guard:* a style test walking `SCREENS` for every action with a non-empty hint and asserting the
stylesheet names that screen's `-action-hint`; and `tests/cosmo.browser.test.ts` reading the
button's two text runs on two lines.

**d. The Settings strip stays put.** `${each('-panel')} { margin: auto; … align-items: center }`
(about line 270) centres every panel on its own content, so the Settings tab strip sat at 84, 92,
189 and 270 px across its four tabs. For the settings family (`settings`, `controls`, `guide`,
`save`) anchor the panel to the top with a fixed offset (`margin-top: min(2rem, 6cqh)`) and let the
content fill down; the pause family and the title keep `auto`.
*Guard:* `tests/layout.browser.test.ts` — the tab strip's `top` is equal across the four tabs at
every guard size. Seen to fail by a probe restoring `auto` on one of them.

*Decision:* one, amending 0513 (the pad and keyboard press), and naming 0458 and
[0440](../docs/decisions/0440-every-screen-speaks-with-the-titles-voice.md) as what it keeps.
*Owed:* a pad in a hand on the title, since the stub presses and does not spring.

### 2. One cursor

The corner brackets (`--itc-bracket` and the eight-gradient background at `src/app/chrome.ts`
about lines 1824–1850, [0561](../docs/decisions/0561-the-cursor-tries-on.md)) become the cursor on
every screen: the title's buttons, bands and tier chips; every Settings band, tab and action; the
pause family; the music room's grid; the hangar's tab strip (which has a dark outline under a pad's
cursor today). The cyan ring rules on `-action-cursor` and `-option-cursor` go. The fill then means
*chosen* and nothing else (the tier band's chosen chip keeps its gradient; the cursor on it is the
brackets). The brackets breathe unless motion is reduced, as they do now.

Also here, since it is what the cursor shows: **the title says why a pilot is locked.** The lock's
line (`lockHint` in `src/state/screens.ts`) is on the hangar's focus card and nowhere on the title;
when the cursor is on a locked face the one line under the faces says it in place of the ship and
the gun.

*Guard:* a style test that every `-cursor` rule in the stylesheet draws the brackets (names
`--itc-bracket`) and none draws a ring (`box-shadow` on a cursor class); a browser test that the
title's line says the lock's line with the cursor on a locked pilot.
*Photograph:* every screen at the pair, with the cursor on a band, a button and a tab.
*Decision:* amends 0561 (the brackets everywhere) and
[0458](../docs/decisions/0458-the-title-is-rows.md) (the ring).

### 3. The plate from the short side, the glyph line at 12 px, the phone's targets

The hangar family's plate is `width: 384px`-shaped at every desktop size
(`.itc-hangar-plate, .itc-parts-plate, .itc-shop-plate` about lines 2140 and 2208) and its em
15.1–16 px. [0571](../docs/decisions/0571-the-dock.md) keeps the column *at a size of its own*; keep
the column, but size it from the em and the em from the short side:

- the plate's `font-size: clamp(0.95rem, 1.55cqmin, 1.4rem)` and its width in em (about 24em),
  capped at a third of the host's width so the stage keeps the rest; at 1280×720 nothing moves
  (measure: 15–16 px before and after); at 1920×1080 the em is about 19 px and at 2560×1080 about
  20 px with the plate at 24 % and 15 % of the width respectively;
- the glyph line (`.itc-hangar-glyphs` etc., `font-size: 0.62em`, about line 2199) never under
  12 px: `font-size: max(0.62em, 12px)`;
- the focus card two lines at and above 900 px tall, as [0572](../docs/decisions/0572-the-dock-is-dressed.md)
  has it, and the plate's foot no emptier than a band's height at 1920×1080;
- **on a touch screen** (the chrome already classes touch — see `itc-playing-hud-touch` and the
  `hasTouch` branches) every tab, option chip, band arrow and the title's *Fly* and tier chips at
  least 44 CSS px on their short side, keeping [0607](../docs/decisions/0607-the-menus-come-round.md)'s
  arrow geometry (1.25rem wide, its press grown up and down, a gap to its chip). The plate has the
  height for it at 844×390 (its lower half is a focus card and air); at 480×320 the plate scrolls
  by one band at the foot, as 0572 says the iPad already does;
- the hangar's pilot band shows whole faces only (the seventh is cut in half at 384 px today):
  the band clips to whole faces and scrolls the chosen one into view.

*Guard:* `tests/layout.browser.test.ts` gains 1920×1080 and 2560×1080 for the hangar family (the
guard's six stop at 1280×720), asserting the option em ≥ 18 px there and the plate's empty foot
under one band's height; at 844×390 and 667×375 with touch, every tab, chip, arrow and *Fly* ≥
44 CSS px; a face is never partly visible. Seen to fail by a probe that pins the em.
*Photograph:* the three tabs and the title at the pair, the guard's six, 1920×1080 and 2560×1080.
*Decision:* amends 0562 (the plate grows — in type now, not only height), 0571 (the column's
size) and 0566 (the targets).
*Owed:* a thumb on a phone, and the review's note that `0566`'s 14 px readout floor is still
unmet on a phone until item 9.

### 4. The Settings family gets the sky and a plate; the pause draws the field

- **Settings, Controls, How to play, Save** stand on the title's sky (`starSky()` in
  `src/app/chrome.ts` about line 152, [0437](../docs/decisions/0437-the-title-is-lit.md)) inside the
  nav-plate frame the title's two plates wear (`.itc-title-board, .itc-title-main, …` about line
  2056). The frame's width is the panel's; the strip is its head (item 1d anchored it).
- **Paused, Quit and the count-in** stand over the frozen field, dimmed, not over black.
  `dims: true` on their rows ([0511](../docs/decisions/0511-the-run-can-be-paused.md)) is right —
  the world is stopped and a countdown is owed — but the cover is opaque today. Read
  `src/app/frame.ts` for what happens to the canvas while `steps: false` (the count-in already shows
  the field, so the last frame is there to show); make the pause family's panel glass translucent
  (the void at about 70 %) over it. The music room keeps its flythrough.

*Guard:* a browser test that pauses a run and reads a canvas pixel under the pause panel: the
field, not the void. A style test that the four settings screens carry the sky class.
*Photograph:* each screen at the pair.
*Decision:* amends 0440 (the picture, not only the type) and 0511 (what *dims* draws).

### 5. Controls as a table; two-option bands as toggles; two hints

- **Controls** (`CONTROL_ROWS` and `controlLabel` in `src/state/screens.ts` about lines 720–740;
  `.itc-controls-choices` in `src/app/chrome.ts` about lines 482 and 2487, a four-column grid of
  twelve buttons) becomes a table: one row per action (Fly up, Fly down, Fly left, Fly right, Gun
  trigger, Missile trigger, Ward trigger), a column per device (Keys, Pad), the cell a button that
  rebinds exactly as [0664](../docs/decisions/0664-the-controls-are-bound.md) rebinds today; *Reset
  to defaults* and *Back* in a foot. *How to play*'s CONTROLS block draws the same table read-only
  (`buildGuide` about line 5437); build both from one function so they cannot disagree. The row
  model: up and down between rows, left and right between the two cells.
- **Two-option bands** (Sound, Travel, Hand, Rumble; the title's continues chip) flip on A, Enter or
  a click as well as on either arrow, so a band is one stop on a pad. Three-option bands (Steering,
  the tier) are unchanged.
- **Rumble's hint** (*A pad or phone taps when the ball lands*) says what rumble does across the
  game — read [0613](../docs/decisions/0613-the-dance-is-earned.md) and the rumble content
  (`src/content/rumble.ts`) and write the line from them. **Save's warning** (*Not protected: the
  browser may clear it to make room*) takes the sheet's weight, once.

*Guard:* the 0664 guards (grep `0664` in `tests/`) re-pointed at the table's cells; a menu browser
test that A on *Sound* flips it. Seen to fail by a probe that puts the grid back.
*Photograph:* Controls and How to play at the pair and the guard's six.
*Decision:* amends 0664 (the layout) and [0590](../docs/decisions/0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md)
(a band's press).

### 6. Cosmo's foot and sub-tabs; Paint & Parts' lone chips and art thumbnails

- **One foot.** `.itc-shop-foot` (about line 2431) becomes *Buy · 575 ✦* on one line at the foot's
  full width as the primary (the `leads` treatment the title's *Fly* has), *Back* beside it. *Show
  owned* leaves the actions (`src/state/screens.ts` about line 1443) for the shelf's head as a
  small toggle: it is a filter on the shelf, not an action on the ware. Its box stays the shell's.
- **The sub-tabs** (the `aisle` band, [0564](../docs/decisions/0564-cosmos-sells-pictures.md)) are
  drawn as the folder tabs the plate's head uses, under it, at the head's size; the group heading
  that repeats the open tab's name (*HANGING* under *Hanging*) goes. The strip scrolls when it does
  not fit (`overflow-x: auto`, the open tab scrolled into view) and never truncates.
- **A band shows whole chips.** The shield row cut its third chip at 1280×720; every band clips to
  whole chips and scrolls the cursor's into view, as the pilot band does in item 3.
- **A lone option is a tile with a link.** Where a band has one option (*Flame: Standard* on most
  ships), draw the one tile and beside it a *More at Cosmo's →* tile that opens Cosmo's on that
  shelf (set the shop's `aisle` choice when opening). The hint line already says this in prose.
- **Art thumbnails.** The art chips carry a glyph-sized face; draw a 96×48 render of the ship's
  door with the art on it from `drawPlayerShip` (`src/render/bake.ts`), cached per ship and art
  the way the ware art is (`WARE_ART_PIXELS`, about line 5348). Count the canvases and time the
  bake under the suite before a number is written ([0245](../docs/decisions/0245-a-budget-is-sized-under-load.md)).

*Guard:* `tests/cosmo.browser.test.ts` — the foot's three controls' boxes (Buy widest and on one
line; the toggle at the head); the sub-tab strip's text never ellipsised at the guard's six;
`tests/livery.browser.test.ts` or its neighbour reading the art chip's canvas size.
*Photograph:* Cosmo's three shelves and the buy sheet, Paint & Parts' two groups, at the pair and
the guard's six.
*Decision:* amends 0564 (the foot and the sub-tabs) and 0565 (the thumbnails).

### 7. Travel gets an *Intro* band ⚠️ rollback note

[0635](../docs/decisions/0635-every-flight-plays-the-intro.md) made every flight play the intro and
owed *whether an intro every run is welcome or wants a setting*. Answered: a setting. Under Travel
(`src/state/screens.ts`, the settings screen's choices; `SettingName` about line 108) a band
*Intro: Every flight / First flight*, kept with the settings
([0510](../docs/decisions/0510-the-settings-are-kept.md)). *First flight* is 0513's rule before 0635
reversed it: the first *Fly* of a visit plays the intro and later ones go straight to the run; the
title's *Fly* hint says which. The shell's branch is where 0635 changed it (grep `0635` in
`src/app/mount.ts`).

**This touches `itc_settings`**, so the PR carries the rollback note
([0001](../docs/decisions/0001-revertability-not-risk-rating.md)). Read `src/save/settings.ts`
first: [0664](../docs/decisions/0664-the-controls-are-bound.md) made the settings *read back whole or
not at all*, so say exactly what a save written with the new field does under the build before it
(dropped whole, or read with the field ignored), and what the new build does with a save that lacks
it (the default, *Every flight*). Bump the version only if the reader needs it; the note says
either way.

*Guard:* `tests/intro.browser.test.ts` has 0635's case (two flights, two intros); add the band's
(set *First flight*, two flights, one intro); `tests/style.test.ts`'s *every setting on exactly one
screen* gains the band.
*Decision:* amends 0635.

### 8. A stand per tab, and the dolly

`PORT_CAMERA` (`src/state/screens.ts` about line 558) is one constant on all three tabs' rows
(lines about 594, 614 and 1437): the field `StandCamera` exists so each tab could stand somewhere
([0540](../docs/decisions/0540-the-hangar-is-the-port.md)) and none does — 0282's tell. Author
three:

- *Hangin' Out* as now;
- *Paint & Parts* low and close on the cradle (`DOCK.ship` 131 along, about 78 across, zoom about
  1.7, the pad at 0.62 of the stage's width), so a rim reads at 60–80 px across at 1280×720;
- *Cosmo's* at the mezzanine (`DOCK.shops.cosmo` 144 along, about 50 across, zoom about 1.3), the
  counter large and the ship still in frame below.

`fitStand` (`src/render/port.ts` about line 465, [0563](../docs/decisions/0563-the-ship-is-the-picture.md))
draws a camera back when the keeper, their counter or the viewport would leave the screen's left;
read it before choosing the numbers, since it will refuse a camera that loses the keeper, and say
in the decision which of its three rules each tab's camera meets or amends.

**The dolly:** the stand's view is computed once per layout (`src/app/mount.ts` about lines 1665
and 1788, `standViewInto`). On a tab change, ease from the previous tab's camera to the new one
over about 18 steps (0.3 s) on the stand's own clock, re-fitting each step into a preallocated
scratch `StandCamera` — no allocation on the frame loop
([0022](../docs/decisions/0022-frame-rate-is-a-feature.md)), and nothing accumulates: the camera at
step *n* is a function of the two cameras and *n* ([0548](../docs/decisions/0548-the-hangar-holds-still.md)).
The stand's guards sample the picture a bob apart (`samePhase` in `tests/hangar.browser.test.ts`);
they must sample after the dolly has settled.

**Ordered after the port plan's items 1–3** ([the port, planned](the-port-planned-2026-10-24.md)),
on the player's answer: a closer camera on today's room shows more of the tile grid, and the dolly
is what makes the depth planes of that plan's item 5 visible.

*Guard:* `tests/hangar.browser.test.ts` — the ship's box on each tab in CSS px (Paint & Parts' wheels
≥ 60 px at 1280×720); `tests/budget.test.ts` for `port.ts` and the shell's dolly; a probe that
puts `PORT_CAMERA` back on two rows reddens a test that asserts the three cameras differ.
*Photograph:* the three tabs at the pair, the guard's six, 1920×1080 and 2560×1080, and a clip of
the dolly.
*Decision:* amends 0563 and 0540.

### 9. The phone pass: the cockpit strip, the pause button, the pilot's name, portrait

- **The cockpit strip is not drawn on a touch phone.** `.itc-hangar-dash` and its sisters under the
  touch and small-height media rules (`src/app/chrome.ts` about lines 3002–3010 and 3316–3322) are
  hidden on a touch screen under 480 px tall; the readout element is still re-parented into the
  dash cell ([0539](../docs/decisions/0539-the-readout-stands-down.md) via 0521) so every guard that
  reads it by class still finds it — check `tests/hangar.browser.test.ts` reads it hidden. The
  shards sheet stays and is never hidden (it was gone at 480×320 in the 10-07 review; confirm).
- **The pause button** on a touch screen moves to the left of the score with a gap of its own
  width, out of the streak badge's animation (`.itc-playing-pause`, about line 7508, and the
  strip's layout, [0439](../docs/decisions/0439-the-top-is-one-strip.md)).
- **The chosen pilot's name** under their face on the phone's pilot band (the desktop shows every
  name; the phone none).
- **Portrait is photographed.** `scripts/shot-menus.mjs` gains `--sizes=portrait` (390×844 and
  412×915 touch contexts) so the upright layout [0566](../docs/decisions/0566-the-phone-pass.md)
  built is in every handover from now on.
- **Safe areas** stay owed on a device with a notch; the script cannot see one.

*Guard:* `tests/layout.browser.test.ts` at the two portrait sizes (every screen drawn, no scrolling,
as the landscape six are held); the pause button's box at 844×390 touch clear of the score's by its
own width.
*Photograph:* the pair, the guard's six and the two portraits.
*Decision:* amends 0566 and 0571 (the strip).

---

## What the guards will say, across the queue

- `tests/layout.browser.test.ts` grows by three sizes (1920×1080, 2560×1080, and portrait) and by
  the target floors; its six landscape sizes are unchanged.
- `tests/menu.browser.test.ts` holds the pad walk; item 1a changes what A does on one band and the
  recorded walk is re-recorded there.
- `tests/style.test.ts`'s *every setting on exactly one screen* gains the Intro band (item 7); the
  cursor and the hint rules get a style test each (items 2 and 1c).
- `tests/hangar.browser.test.ts`, `tests/cosmo.browser.test.ts`, `tests/livery.browser.test.ts`
  read the readout by class and the picture a bob apart: unchanged by items 3, 6 and 9, which is the
  proof of them; item 8 moves when they sample.
- `tests/budget.test.ts`: `src/render/port.ts` and the dolly allocate nothing.
- `tests/intro.browser.test.ts`: item 7's band.

## Order, and why

1 first because each of its four is a player-visible defect with a one-line cause. 2 before 3
because 3's photographs should show the one cursor. 3 before 4–6 because every later screen is laid
out in the em 3 sets. 7 is independent and small, after 4 so the Travel band lands on a plated
Settings. 8 waits for the port plan's first three items, on the player's answer. 9 last, since it is
the one item whose verdict needs a phone in a hand.

## Owed, once it is all in

A play with a pad, a keyboard and a phone, and the pictures of each item beside the review's, so
the next review starts from a photograph and not from a memory.
