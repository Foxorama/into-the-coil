# 0458 — The title is rows

**Accepted 2026-10-02.** Item 1 of [the menus review](../../reports/the-menus-reviewed-2026-10-02.md),
asked for as *"the three difficulty buttons could be a single toggable band; the pilots could be
smaller with profile pics and be toggleable … the menu navigation with game pad is atrocious; music,
retro, brief/long nav vids could be in settings; the display for the pickups and bombs … could be a tab
in settings of 'How to Play' … the high scores … could just be the top 5."*

## The rule

| | was | is |
|---|---|---|
| **the title** | three tier buttons that each started a run, *Music*, *Pilot*, a key and the table taking turns in one column, and six setting chips | a **difficulty band** and a **pilot band** over **Launch** and **Settings**, beside the **top five** standing still |
| **a setting** | a strip of chips, one focus stop each, the hint in a tooltip | a **band**: one stop, moved along with left and right, the live option's hint written under it |
| **the pilot** | a screen of large cards, a press away | round portraits on a band; their name, ship and gun under it; the boot's cards are unchanged |
| **Settings** | — | a screen: Look, Sound and Travel as bands, *Music room*, *Back*; reached from the title |
| **How to play** | the title's key: what each face gives | a tab beside Settings: every pickup's faces turning, what each gives **and how it is taken**, and the controls on every device with the one in hand lit |
| **the pad** | one geometric guess over every control on the screen; no Back | **rows**: up and down between them, left and right along a band or a row of buttons; **B** is Back, **LB/RB** turn the tabs, a held direction repeats, the cursor is remembered per screen |
| **the keyboard** | Tab and Enter only | the arrows and WASD move the cursor as the pad does, Escape is Back, Enter or Space steps a band |
| **the table** | ten rows rolling at two seconds a row, duplicated to loop, cross-fading with the key | the best five, still; the device still keeps ten |

## Why each is built the way it is

**The pad walk was measured before it was fixed.** A stubbed standard gamepad was driven through the
title on `main` at `5391d51` and the focused element logged after each press — the table is in the
report. Down from the last tier went to the middle settings chip and wrapped, so *Music* and *Pilot*
could not be reached by pressing down; on a phone down only toggled between two controls; B did
nothing anywhere. **The class was a geometric guess over a layout the art pass is free to change**, and
the fix is the shape menus are actually authored in: rows. [0214](0214-a-grid-is-not-a-list.md) is
kept where it was right — inside a row of buttons, which is how the music room's tiles stay a grid.

**A band clamps at its ends and a press goes round.** A push past *Burn* that came round to
*Legendary* is a tier nobody asked for; a press on the band has no direction to be wrong about. The
step arrows are drawn dim at an end so the clamp is seen.

**The tier is a setting now, and [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) is
untouched.** It was the button pressed, and a button holds no state; once choosing and starting are two
presses the choice has to live somewhere between them. It is copied onto the run by `begin`, as before,
and the band opens on `TUNED`.

**Settings opens a door [0070](0070-a-style-is-a-setting-and-the-first-one.md) refused for one
setting.** Its reason was that a door hides the one thing a player might want before their first run;
the things on that door now are three comfort knobs, a guide and a jukebox, and the two choices made
every run stayed on the title. **Back from Settings goes to whoever opened it**, recorded on the screen
slice as it is entered, because a paused run will open it too.

**How to play is the key, given the half it never had.** [0045](0045-the-player-can-see-what-they-are-carrying.md)
and [0432](0432-the-key-cycles.md) said what each face is; nothing said that a pickup turns and the face
showing is the one taken, or where the charge goes. Each pickup row authors its own `how` line, and the
controls are read off `DEFAULT_BINDINGS`, `PAD_SPECIAL_BUTTONS` and a new `SIDE_LABELS`, so a binding
changed in its table is changed here. `docs/game.md`'s *no coaching* holds: it waits behind a tab and
was asked for from play.

**The tabs are the heading on a tabbed screen.** Settings said its name twice, and on a 480×320 phone
the second saying was the 24 pixels it scrolled by.

**Measured at the camera the game ships.** 1280×720 and three touch shapes (844×390, 480×320), with a
seeded and an empty table: no screen scrolls, no name is cut, and the pad walk is re-run and recorded
in the PR.

**What it does not do.** Settings are still not kept between visits — that is item 2, and its own PR
because it is the second `itc_*` key. There is still no pause — item 3. The boot's pilot cards are
unchanged: that screen is the sound's press ([0415](0415-the-golfer-is-chosen.md)).

## What the guards found

**0049's net caught two of this change's own defects**, both the same bug it was written for — the
title's name pushed off the top of a window too short to hold it, where nothing scrolls back:

- **`scrollIntoView` on the chosen pilot's face** scrolled every scrolling ancestor, and the overlay is
  one. It scrolls the band's own track now, sideways only.
- **Focusing *Launch* when the title appears** scrolled the overlay down to it, because Launch is below
  the bands where the first tier used to be the first thing. A screen appearing focuses without
  scrolling; a player's move still scrolls the ring into view.

**And one of this decision's own probes was STILL GREEN** on its first run: *the repeat clock surviving
a change of direction* loosened the wrong condition, which the reset on a new push undid. It breaks the
counter's reset now and goes red.

**Thirteen other decisions' probes were re-anchored**, each to the line that carries the same break
now and each with a note saying so. Four were re-pointed at a new guard because the thing they broke
moved: [0415](0415-the-golfer-is-chosen.md)'s menu pick is the pilot band's, its phone-row break is
Launch and Settings stacking, [0370](0370-the-title-fits-the-hand.md)'s tier lines are the band's hint,
and [0429](0429-the-table-is-kept.md)'s table-in-the-flow break is the whole table back where five
should be.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
