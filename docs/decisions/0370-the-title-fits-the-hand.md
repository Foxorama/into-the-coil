# 0370 — The title fits the hand

**Accepted 2026-09-25.** Every tier says what it is and what it gives on every device, including a
line of facts read off its row. On a short screen the title is laid out as three rows across the long
axis rather than two columns down the short one. Extends [0049](0049-the-chrome-is-authored-against-the-short-axis.md)
and [0210](0210-the-title-plays-the-music.md), which put the title into two columns and then a 2×2 grid
to fit a phone.

## The ask

> *"can we update the menu screen on mobile as well, it's all squished in and has no explanations for
> the different difficulties … needs to be completely redesigned for mobile devices so it's a good
> mobile menu"*

## What a phone showed

Photographed at 844×390 and 667×375 before the change:

- **The tiers were bare names.** The short-screen rule hid the hints, which bought 40 px where 14 were
  needed. So a phone chose between *Legendary Pilot*, *Savior of the Galaxy* and *Let the Galaxy
  Burn* with nothing else to go on, and at 667 wide each name wrapped.
- **The pickup key took half the screen** as a seven-line column beside the buttons, and its hints
  wrapped.
- **The settings were small text buttons** under everything, sized for a pointer rather than a thumb.
- **Even where the hints showed, they did not explain.** *"The gentlest way in"* and *"It is not meant
  to be survived"* are moods. What differs between tiers is lives, shields, how hard and fast the
  enemies are, and how tight the corridors are.

## The rule

**A tier's button carries its name, a hint that says how it plays, and a facts line.**

- **The facts are said by `factsOf`, from the row**: *5 lives · 3 shields every level*, *3 lives ·
  shields to find*, *2 lives · no shields*. Typed beside `lives: 5`, the sentence would be a second
  description of the number, and the day a tier gained a life the button would go on saying the old one.
- **The hints were rewritten to say what is not a count**: *Slower enemies and bullets, wide
  corridors*, *What the game is tuned for* (kept, and `tests/level.test.ts` holds it), *Tougher, faster
  enemies, tight corridors*. Each follows the row's own multipliers and corridor numbers
  ([0356](0356-the-tuned-tier-is-savior.md), [0350](0350-the-corridor-turns.md)).
- **Both lines have a floor of `0.7rem`** (11.2 px). A card is a quarter of a phone's row, and at the
  panel's own size the smallest phone set them at eight.

**On a short screen (the existing `max-height: 460px` container query) the title is three rows:**

1. **The three tiers as cards side by side, with the music room beside them.** Card type is sized by
   the width as well as the height, so a 480-wide phone sets each name on at most two lines. The lines
   start at the top of each card, so the three names line up across the row.
2. **The pickup key as one row of seven**, each pickup a column of icon, name and what it does. It is
   quieter than the cards, because it is read once and the cards are what is chosen. The DOM is
   unchanged: the builder writes icon, name and hint as flat siblings, so a grid that flows down three
   rows and then across puts each pickup in its own column.
3. **The settings as a row of buttons tall enough for a thumb.** Their width shrinks with the screen
   rather than wrapping, because a second line is forty pixels of a 320-pixel phone.

The desktop keeps its two columns, and gains the facts line.

## What moved, and why each is not the work bending to a guard

**`tests/layout.browser.test.ts`'s reachability guard read "the last action" as "the lowest control on
the page".** That was true while the tiers and the music room were a column that ended the panel. The
phone layout puts the actions in the top row and the settings under everything, so the guard now finds
the control that is actually lowest and asks the same question about it: is the far end of the screen
one scroll away. Nothing it held was loosened.

**0047's probe that reverses the tiers is re-anchored** on the line that now carries `detail`.

**0049's probe that stacks the title down the short axis now expects the laptop's fit guard.** A short
screen is one column by design now, so stacking the body only changes the screens that still have two
columns. There it overflows the laptop and the tablet, and the fit guard on those devices is what
notices. The claim is the one it always made: the title stacked down the short axis does not fit.

## What is held

`tests/layout.browser.test.ts` — *every tier shows what it is and what it gives, readably, on every
device*. On all six devices the layout guard already checks (480×320 up to 1280×720), each tier's hint
and facts line is drawn, whole on the display, at 11 px or more. Seen red on the old code: at 480×320
only three lines existed and all three were hidden. Three probes: the lines hidden again, the floor
taken off, and the facts said by nothing.

The existing layout guards still hold: every screen fits every device with no scrolling, and the
0049 heading probe still fires.

## What is owed

**A play on a phone.** It has been photographed at 480×320, 667×375 and 844×390 and not held in a hand.
Whether the cards are big enough targets, and whether the key row reads at arm's length, is a thumb's
call.
