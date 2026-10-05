# 0513 — The pilot flies

**Accepted 2026-10-04.** Item 6 of [`the-chrome-and-the-ships-reviewed`](../../reports/the-chrome-and-the-ships-reviewed-2026-10-03.md),
answered 2026-10-03: *"the splash waits for the press to begin, get rid of the dupe pilot screen"*,
and *"on the menu, does a press on a pilot load that pilot into the game?"*, answered yes.

## The ask

> *"initial menu -> things like having the pilots to select from, but then have to click on an
> secondary launch button, surely we can have the pilot and then an info box with some background and
> stuff and then you click, tap on the pilot to select them and launch? unsure if that's good/bad on a
> mobile though."*

## The rule

**The splash waits for a press, and that press turns the sound on. The boot's golfer cards are gone.
The title is the one pilot screen: a strip of portrait cards, and under it a card that says who the
highlighted pilot is and what they fly. A press on the highlighted pilot, or *Fly*, flies them. The
first flight of a visit plays the intro with that pilot in it, and the intro ends in the run.**

| | |
|---|---|
| **the splash** | the name and the loading sweep; once loaded and read (`SPLASH_STEPS`, [0415](0415-the-golfer-is-chosen.md)), *Press to begin* in the sweep's place. A key, a click or a tap goes on with sound; one made while it loaded is remembered and goes on when it may. Escape goes on and asks for nothing ([0412](0412-the-port-is-heard.md)). ~~A pad's press does not go on: it grants the page no sound~~ — **amended by [0531](0531-the-pad-begins.md)**: a pad alone could then never leave the splash, so its press goes on and asks for the sound |
| **the pilot screen** | the title: the badge and name, the top five, the pilot band of cards (face and first name), the pilot card, the difficulty band, *Fly* and *Settings* |
| **the pilot card** | the ship drawn large from the sheet's own bake (`bakeGlyph`, twice the readout's icons), the full name, pronouns and home, the line about them (`bio`, moved from a code comment onto `GolferRow`), the craft, and the gun with its hint. All read off `GOLFERS`, `SHIPS` and `WEAPONS` |
| **flying** | *Fly*; A or Enter with the cursor on the pilot band (`press: 'takes'` on the choice); a click or tap on the highlighted card once a pointer has chosen on this screen or a run has been flown. A pointer's first landing on a card highlights it |
| **the intro** | the first flight of a visit. It runs out, or is skipped, into the run (`then: 'playing'`); the skip's key is spent there, so Space throws no special and Escape does not pause the run (0511) |

## Why a tap looks first

The report's table: on a desktop and a pad the highlight follows the cursor and the press is a
decision, so the cursor's press flies at once. On a phone *a thumb lands on the edge of what it aims
at* ([0358](0358-a-trigger-is-a-button.md)), and a single tap that launched would launch whatever the
thumb grazed. So the first tap on a card fills the card under the strip, and a second tap on the same
card flies. After a run the card flown last is armed, so a returning player is one tap from flying
again. At boot nothing is armed. The default pilot is highlighted, and a tap on them is still a look.

## Why the intro ends in the run

The boot's pick played the intro and the title followed. The pick is now the title's *Fly*, so an
intro that ended on the title would ask for the flight again. The chase already flies the first
level's sky ([0416](0416-the-viper-has-a-pilot.md)), so the picture runs on into the level.
`beginsRun` in `src/state/screens.ts` is the one rule: going into `playing` from a screen outside a
run begins one, and from inside a run it is the run going on. The pause's count-in (0511) also
expires into `playing`, and before the rule was written the first draft would have begun a new run
at the end of every pause.

## What it cost the title, and where the room came from

The card made the title 46 px too tall at 1280×720, 110 px at 844×390 and 151 px at 480×320, all
measured. The room came from things the card made redundant, and from one layout on phones:

- **The bands' labels went**, on every device. The faces are the pilots and the tier's line names
  the tier, and each band names itself to a reader.
- ***Fly* and *Settings* stand side by side** on every device, as they already did on a phone.
- **On a phone the title is two rows of two, then two across.** The table sits on the left, as wide
  as its one-line rows, with the faces and the card beside it. The tier spans both columns, where its
  three names fit a line each, and then the buttons. The main column stands aside (`display:
  contents`), so the DOM and the walk's order are untouched. The first version put the card under the
  table, and at 667 wide the table's names wrapped and doubled its height. A breakpoint only moves a
  problem to the width next to it, so the phone layout has none.
- **On a phone**, the names under the faces go (the card names the highlighted one), the bio is one
  line, and the run's reach leaves the table. **Below 360 px tall** the bio goes, and the tier, the
  buttons and the ship drop a size.

Measured with a full table at the sizes the layout guard holds: 55 px spare at 1280×720, 30 at
844×390, 23 at 667×375 and 20 at 480×320. That spare is margin for CI's wider fonts, which have
twice found a few pixels this machine's fonts did not (0512).

## What else changed

- **`select` is gone** from `SCREEN_KINDS`, with its CSS. The pause headings take its place in the
  banner-rule lists.
- **`onChoice` says whether a pointer pressed**, which is how the pilot band tells a look from a
  decision.
- **`tests/title.ts` has `fly()`**: Fly, and past the intro the first flight plays, skipped with
  Escape only once the Skip is up. Every browser test that starts a run goes through it.
- **The layout guard's *a control cannot be pressed where it is drawn* skips a hidden control.** The
  splash's prompt is hidden until the game has loaded, and a hidden control is not drawn.

## What guards it

- `tests/intro.browser.test.ts`, rewritten for the way in. The splash puts up its prompt only after
  its time, waits for a press, and builds the sound on it. An early press is kept. A pad's press does
  not go on. Escape goes on silently. The first flight plays the intro with that pilot's cap in it and
  hands over to the run. The skip goes into the run by click, pad, Escape, Space and Enter; Escape
  does not pause the run, and Space and Enter throw nothing in it. A tap on another card says who
  they are and a second flies them. The first tap on the boot's highlighted pilot is a look.
- `tests/intro.test.ts`: the intro running out begins a run, and the count-in running out does not.
- `tests/menu.browser.test.ts`: the walk in the new order, and A on the pilot band flies.
- `tests/layout.browser.test.ts`, unchanged, on the new title at every viewport, with a table and
  without one.

Probed in `scripts/probes/0513-the-pilot-flies.mjs`. The probes of 0063, 0411, 0412 and 0415 moved
with the lines and tests they break.

**Photographed** at 1280×720, 844×390, 667×375 and 480×320 with a full table, and the splash's prompt
at 1280×720.

**Owed:** a play on a phone. Whether *tap to see, tap again to fly* reads as intended there, and
whether the one-line bio is enough, are questions for a thumb.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name. The pilot is still not kept
([0510](0510-the-settings-are-kept.md)).
