# 0370 — The title fits the hand

**Accepted 2026-09-25.** Every tier shows its line under its name on every device. On a short screen
the title is laid out as three rows across the long axis rather than two columns down the short one.
Extends [0049](0049-the-chrome-is-authored-against-the-short-axis.md) and
[0210](0210-the-title-plays-the-music.md), which put the title into two columns and then a 2×2 grid to
fit a phone.

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

## The lines, in the player's words

A first draft gave each tier a hint about how it plays, and a facts line read off the row (*5 lives · 3
shields every level*). The player's answer was **to drop the facts line** and give each tier a line of
voice instead:

| tier | line |
|---|---|
| Legendary Pilot | *Is that plot armour?* |
| Savior of the Galaxy | *Be the hero you want to be* |
| Let the Galaxy Burn | *Best of luck mate* |

Each line has a floor of `0.7rem` (11.2 px). A card is a quarter of a phone's row, and at the panel's
own size the smallest phone set it at eight.

`tests/level.test.ts` had held *which tier is the reference* by reading *"tuned for"* in Savior's hint.
The hint is the button's voice now, so that guard asks `TUNED`, the constant the derivation already
stands on ([0356](0356-the-tuned-tier-is-savior.md)).

## The layout

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

The desktop keeps its two columns and shows the new lines.

## What moved, and why each is not the work bending to a guard

**`tests/layout.browser.test.ts`'s reachability guard read "the last action" as "the lowest control on
the page".** That was true while the tiers and the music room were a column that ended the panel. The
phone layout puts the actions in the top row and the settings under everything, so the guard now finds
the control that is actually lowest and asks the same question about it: is the far end of the screen
one scroll away. Nothing it held was loosened.

**0049's probe that stacks the title down the short axis now expects the laptop's fit guard.** A short
screen is one column by design now, so stacking the body only changes the screens that still have two
columns. There it overflows the laptop and the tablet, and the fit guard on those devices is what
notices. The claim is the one it always made: the title stacked down the short axis does not fit.

## What is held

`tests/layout.browser.test.ts` — *every tier shows its line under its name, readably, on every device*.
On all six devices the layout guard already checks (480×320 up to 1280×720), each tier's line is drawn,
whole on the display, at 11 px or more. Seen red on the old code, where at 480×320 all three were
hidden. Two probes: the lines hidden on a short screen again, and the floor taken off.

The existing layout guards still hold: every screen fits every device with no scrolling, and the
0049 heading probe still fires.

## What is owed

**A play on a phone.** It has been photographed at 480×320, 667×375 and 844×390 and not held in a hand.
Whether the cards are big enough targets, and whether the key row reads at arm's length, is a thumb's
call.
