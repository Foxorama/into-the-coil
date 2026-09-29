# 0415 — The golfer is chosen, and the choice turns the sound on

**Accepted 2026-09-29.** The page opens on a splash that gives way, once the game behind it has
loaded, to the four *Far Carry* golfers; picking one plays the intro — with sound — with that golfer
running for the ship. *Pilot* on the menu changes golfer without going back through it. **Amends
[0411](0411-the-chase-begins-at-the-port.md)**, whose intro was the first thing on the page, and
**[0412](0412-the-port-is-heard.md)**, whose early-press rule moves to the splash.

## The ask

> *"alright suggestions on getting around the sound — let's have a splash title screen that fades
> into a character select screen with the Four Golfer's from the far carry as selectable characters,
> when you select a character you get the video and animation with the skip button. we also need a
> 'character select option' on the menu to change without having to reset to the title screen and it
> needs to accommodate mobile menu options and such as well"*

Asked, and answered: **the pick changes who they are, not the ship**, and **it is not remembered
between visits**.

## Why this is the answer to the sound

No browser plays anything until the person has touched the page, and nothing the page does for itself
counts (0412). Every way round that asks for a press, and a press that exists only to unlock audio is
a *press to start* screen, which the intro-as-loading-screen had been built to avoid. **A choice the
player makes anyway is a press that costs nothing.** So the golfers are the gate: the click that picks
one is the gesture, and the intro after it is heard from its first frame.

## What changed

- **The splash** (`SCREENS.splash`) is the name, large, fading up over the dark. **It leaves when the
  game has loaded and it has been up long enough to read** — `prewarmDone()` and `SPLASH_STEPS`, 1.5 s
  — never on a clock of its own. So the press that picks is never the press that pays for loading, and
  it never freezes. A press on the splash is 0412's early press: remembered, and its sound comes on the
  step loading finishes.
- **The golfers** (`SCREENS.select`) are four cards built by walking `GOLFER_KINDS` in
  `src/content/golfers.ts`: a portrait, the name, where they are from — Feather Fade of Nairobi,
  Huang-Woo Hook of Busan, Longshot Larry of Perth, Backspin Bo of Portland. The colours, hair and
  build are the predecessor's roster rows, read for this and nothing else; the pronouns ride the row.
  Picked at boot the intro plays; picked from the menu the menu comes back.
- **The intro's pilot is whoever was picked** — the port is baked with the golfer's row
  (`src/render/golfer-art.ts`: cap, polo, skin, hair by its cut, stubble, and build, which makes Larry
  a touch taller). 0412's `BO` row moved into the golfers.
- **The Skip is up for the whole intro**, because the intro only ever follows a load.
- **Escape goes to the menu from the splash or the golfers**, with whoever is chosen — Bo if nobody —
  and asks for no sound. It is also how the browser tests get past all of it.
- **The menu has *Pilot***, after *Music*, and it says who is flying under it (`setActionHint`).
- **Phones.** The golfers are always four across: the game is landscape only
  ([0031](0031-landscape-is-the-shipped-orientation.md)), so the scarce axis is height, and a
  two-by-two grid was tried first and refused by the layout guard — 33 px too tall on a 480×320 phone.
  The portraits are sized against the short axis with a floor. **On a phone, Pilot shares the menu's
  fourth column with Music**, the tiers spanning both halves of it. It went in first as a fifth card in
  [0370](0370-the-title-fits-the-hand.md)'s four-column row, and a fifth card wraps onto a row of
  its own: this machine's fonts fitted that row, CI's scrolled by 9 px, and the PR failed there.

## What it does not do

[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md) — said rather than renamed. **A golfer is not
yet a ship.** `docs/game.md` says every character owns a ship that differs on at least one axis the
player can feel; all four fly the one fighter until that is built, and the choice lives on the settings
slice rather than the run because it cannot change the game being played. The day it can, it moves.

## Guards

`tests/intro.browser.test.ts`, rewritten for the way in:

- **the page opens on the splash, and the golfers only after it**, each card with its face drawn;
- **a press on the splash is kept, its sound comes on when the game has loaded, and it never freezes**;
- **Escape goes to the menu from the splash and from the golfers, and builds no sound**;
- **a pick turns the sound on at once, never freezes, plays the intro's cues, and the title follows by
  itself**;
- **the golfer who was picked runs out of the bar** — counted in pixels of Feather's cap on the canvas,
  when she was picked and not when Bo was;
- **the intro's skip goes to the title and no further** on a click, the pad's confirm, Escape, Space and
  Enter;
- **Pilot opens the golfers, a pick comes straight back to the menu, and the menu says who is flying**.

The layout guard now covers both new screens and the fifth menu control on every device, and in
`tests/layout.browser.test.ts`:

- **the title is measured with the longest golfer's name under Pilot**, because the card is as wide as
  the name and the page opens on one golfer of four;
- **on every phone, the title's choices lie in one row** — held by shape, because the no-scrolling
  guard saw the wrapped row on CI's fonts and not on this machine's. A net that fires on one machine's
  fonts is measuring the headroom, not the layout.

Changed, with the reasons beside them: `tests/run.test.ts`, `tests/intro.test.ts` and
`tests/menu.test.ts` for the page opening on the splash and two screens that wait for a hand; the two
tools that photograph the game (`scripts/shot.mjs`, `scripts/trace-frame.mjs`), which were still
skipping with Shift — a request for sound since 0412, so they had been sitting through the intro.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0415-the-golfer-is-chosen.mjs`: the
golfers offered before the load; Feather whoever was picked; a pick from the menu playing the intro;
the menu naming the old golfer; Escape doing nothing on the splash; cards with no faces; Pilot as a
fifth card on a phone — which the no-scrolling guard stayed green over here, and the one-row guard
did not. 0412's probes
were re-pointed at the new tests and two were retired, because their subject — an intro that could
start before the load — is gone; its file says so. Two of 0411's were re-anchored.

## Owed

- A look at the four portraits and the four runners, and at the splash's timing.
- **The golfers' ships** — the next piece this makes room for.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing is persisted: the choice is
made each visit, as asked.
