# 0686 — The menus are one game

**Accepted 2026-10-26.** From the play of 2026-10-26. Amends [0668](0668-the-band-arms.md) (the settings
family anchored at the top), [0458](0458-the-title-is-rows.md) (the tab strip as pills) and
[0213](0213-the-room-is-a-flythrough.md) (the music room's own backing).

## The ask

> *"The settings menu is at the top of the screen instead of centered like the main screen and the music room
> screen. The sizing of them all is a little out of whack as well, it looks a bit like screens from three
> different games, they're not quite consistent."*

## What was there

0668 pinned Settings, Controls, How to play and Save to the top with a fixed margin so the tab strip stood at
one height across the four — each tab's panel had centred on its own content and the strip moved under the
cursor. 0671 then stood them on the sky in the title's plate. So the plate was the title's and the music
room's, and it sat at the top while the other two sat in the middle. Its strip was four heading-sized pills
(0458); the hangar's strip is folder tabs on the plate's head (0539). The music room's panel was a rounded
backing of its own with no plate, and on a desktop the camera's HUD bar (0500) stood black across the top of
its flythrough.

## The rule

| | |
|---|---|
| **the settings family** | centred, by the auto margins every other panel has. The strip is still at one height: the four plates share a floor, `min(40rem, 88cqh)`, the tallest tab's, and the content fills down from the top. Under 460 px tall there is no floor and the plate stands at the top, where 0668 found it had to |
| **its strip** | the hangar's folder tabs: along the plate's head on a rule, the open one filled and standing on the rule, the others set back |
| **the music room** | its panel is the cut-corner plate the title's two plates and the hangar's wear. On a desktop the shell tells the room the bar's height (`setBar`), and the room lays the title's stars across it over the flythrough's own sky colour; a touch screen's bar is nought and gets nothing |

## What it cost, and the guards it moved

- **`tests/layout.browser.test.ts`**, 0668's *the strip stands at one height on every tab*: unchanged, and green
  on the floor at the guard's six sizes. Its probe in `scripts/probes/0668-the-band-arms.mjs` is re-anchored on
  the floor: taken out, each tab centres on its own content again.
- **`tests/menu.test.ts`**, 0210's *the music room gives its panel a backing of its own*: reads the plate rule
  whose selector list names the panel, where it read a rule of the panel's own.
- Measured on the built page: at 1280×720 the four strips stand at 60 px, at 1920×1080 at 237 px.

## What is owed

- A look: whether the How to play plate, the widest of the four, and the Settings plate, the narrowest, still
  read as one place side by side. Their widths are each tab's content's and were not touched.
- The music room's bar is stars over a sampled colour, not the flythrough drawn under it; a bar-less view for
  the room is the real answer and costs the atlas a second scale.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
