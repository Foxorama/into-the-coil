# The menus, reviewed again — 2026-10-24

**A review of every menu the game has, for a desktop first and a phone second**, asked for as:

> *"Do a thorough review of the in-game menus and provide a report we can use to improve them. It
> will need to cover both mobile and desktop improvements with the desktop improvements being the
> priority."*

It answers item 17 of [`the-notebook-pages`](the-notebook-pages-2026-10-24.md) — *"Menu nav just
sucks on gamepad overall … the menus suck pretty hard on desktop as well as mobile"* — which was owed
*a play naming where*. This is that, from the built page rather than a hand on a pad. It is a list of
findings and recommendations, highest value first. Nothing in it is built, and nothing in it is a rule:
anything taken from it becomes a plan with its own answers, the way
[the menus are a place](the-menus-are-a-place-2026-10-05.md) and
[the hangar family, reviewed](the-hangar-family-reviewed-2026-10-07.md) did.

## How it was looked at

- **Built from `main` at `82363bc`** (#654, Venoma), with `npx vite build`. Nothing was changed.
- **Shot with `scripts/shot-menus.mjs`** at its pair (1280×720, and an 844×390 touch context at two
  pixels a pixel) and at the layout guard's six sizes, so every ship was won in, the balance was
  1240 and two wares were owned. Then with a scratch copy of the same script at 1440×900, 1920×1080
  and 2560×1080; through the splash, *Press to begin* and the intro; into every Settings tab, the
  music room, a run, the pause, Settings from the pause, *Quit this run?* and the count-in; and
  through the hangar's cursor states, the Cockpit group, the Paint tab, three of Cosmo's shelves and
  the buy sheet.
- **A stubbed standard gamepad** (`navigator.getGamepads` replaced in an init script, buttons pressed
  for 120 ms) walked the title, the three hangar tabs by LB/RB, B back to the title, and on again.
  Every press is recorded below as a screenshot, not an impression.
- **Measured in the DOM** at 1280×720, 1920×1080, 2560×1080, 844×390 and 667×375: the plate's width
  and type, the tabs' height, an option's box, an arrow's box, the glyph line, the readout's type, the
  shards sheet, and the title's tier chips and *Fly*.
- **Not checked, and what would check it:** motion (the tab change, the fitting's hop, the balance
  counting), sound, rumble, a physical pad's stick, a physical phone's thumb, and the notch. Every
  shot is a still. A play on the devices, and a Playwright clip of each transition, would check them.

The pictures are in this session's scratch directory and not in the repository; the script above
makes the first set again, and the scratch script is the same seeds with the walks added.

---

## Summary — the ten things that matter most, desktop first

1. **On a pad, A on the pilot band starts a run.** B from the hangar puts the cursor back on
   *Hangin' Out* (0458's remembered cursor). Down from the quiet row comes round onto the pilot band
   (0607). A there flies that pilot (0513's `press: 'takes'`) — a twenty-second intro from a browse,
   recorded as *Huang-Woo* under the cursor and then the intro with the fighter on the pad. On a phone
   0513 already made a tap look first and a second tap fly, *because a thumb lands on the edge of what
   it aims at*; a pad browsing a band of faces is the same case and does not get the same rule.
2. **The hangar's plate is one width at every desktop size, and the type barely grows.** Measured:
   384 px wide at 1280×720, 1920×1080 and 2560×1080; its type 15.1 px, 16 px and 16 px; the tabs
   12.5 px at all three; the glyph line 9.4 px to 9.9 px. At 2560×1080 the plate is 15 % of the
   screen, and its lower third is empty on every tab. [0562](../docs/decisions/0562-the-plate-grows.md)
   is titled *the plate grows*, and it grows in height only.
3. **The ship is still not the hero.** On the pad at 1280×720 the car is about 205 px wide; at
   1920×1080 about 305 px. Each shopfront on the mezzanine is wider than the ship beneath it, and the
   cockpit monitor's frame is as tall. The 10-07 review asked for a third to two fifths of the
   screen's width and [0563](../docs/decisions/0563-the-ship-is-the-picture.md) brought the camera
   in; the dock ([0571](../docs/decisions/0571-the-dock.md)) then put three shops, a lift, a workshop
   and a planet in the same frame, and the ship went back to being one thing among seven.
4. **Hover makes a button darker.** The title's quiet row under the pointer (`-action:hover` in
   `src/app/chrome.ts`) sets its glass to 70 % void and its glow brighter; in the picture *Hangin'
   Out* under the mouse is darker than *Settings* beside it, which is what a disabled button looks
   like. Every action button on every screen shares the rule.
5. **Three cursors.** White corner brackets on a hangar option and on the title's pilot band
   ([0561](../docs/decisions/0561-the-cursor-tries-on.md)); a cyan ring on the title's buttons, the
   tier band and every Settings control; a dark outline on a hangar tab under a pad's cursor. The
   10-07 review asked for one look; two screens got it.
6. **Settings, Controls, How to play, Save, Paused and Quit are type on a black void**, while the
   title has its sky, the music room the flythrough and the hangar the dock. And the Settings tab
   strip moves between its tabs at one size: at 1280×720 it sits at 84 px on *How to play*, 92 px on
   *Save*, 189 px on *Controls* and 270 px (at 1080p) on *Settings*, because each panel is centred on
   its own content. Switching tabs makes the strip jump under the cursor.
7. **The Controls tab is bindings as a grid of twelve buttons**, with *Reset to defaults* and *Back*
   in the grid as if they were bindings, and the keyboard's and the pad's trigger bindings
   interleaved (*Gun trigger · keys*, *Missile trigger · keys*, *Ward trigger · keys*, *Gun trigger ·
   pad* …). A table of action × device, with the two reset-and-back actions in a foot, is what the
   genre does and what *How to play* already draws beside it.
8. **Cosmo's foot is three shapes and a defect.** *Buy · 575 ✦* wraps to three lines in a tall
   narrow button; *Back* is a short one; *Show owned* is a wide one whose hint runs straight on from
   its label — **"Show ownedPut what you own back on the shelves"** at every size. The cause: the
   action-hint rule at `src/app/chrome.ts` (`.itc-title-action-hint, .itc-music-action-hint,
   .itc-save-action-hint, .itc-controls-action-hint`) does not name the shop's, so the hint is an
   inline span with no break. The sub-tab strip (*Hanging Wheels Flames Shields Tubes*) is a band of
   chips with its own arrows under the three real tabs, and it truncates to *Tu* at 2560×1080 and to
   *Han… Whe… Flam… Shie…* at 667×375.
9. **The pause is a black screen.** The run vanishes behind *Paused* and comes back only on the
   count-in. A player who pauses to look at the field — the one reason to pause a shooter that is
   not *leave* — cannot. The field is frozen already ([0511](../docs/decisions/0511-the-run-can-be-paused.md)
   stops the sim and the clock); it is only not drawn.
10. **The phone's targets are under the platform floors, and its readout type is under the
    project's own.** Measured on an 844×390 touch context: hangar tabs 29 px tall, option chips
    39×42, arrows 26 px, the title's *Fly* 39 px tall, the tier chips 42 px; at 667×375 the tabs are
    25 px and the cockpit readout's counts 9 px. Apple's floor is 44 pt, Google's 48 dp, and
    [0566](../docs/decisions/0566-the-phone-pass.md) set the readout's floor at 14 px, which
    [0571](../docs/decisions/0571-the-dock.md) says it is under *(owed the player's word)*.

---

## What already works — keep it

- **The row model.** Up and down between rows, left and right along one, B and Escape back, the
  cursor remembered per screen, LB/RB tabs, LT/RT pilots ([0458](../docs/decisions/0458-the-title-is-rows.md),
  [0624](../docs/decisions/0624-the-triggers-step-the-pilot.md),
  [0637](../docs/decisions/0637-the-shoulders-step-the-pilot-on-the-title.md)). The stubbed walk never
  lost the cursor and never needed a flick per step. Item 1 is the one trap in it.
- **The title's composition.** Two plates in the sky, *Fly* alone, the quiet row at one size, the
  top five with the tier column ([0538](../docs/decisions/0538-the-title-is-composed.md),
  [0607](../docs/decisions/0607-the-menus-come-round.md)). It reads at 812×375 and at 2560×1080.
- **The try-on.** The cursor puts the option on the ship and only Enter fits it; the focus line says
  *Enter or a click fits it* against *Fitted* ([0561](../docs/decisions/0561-the-cursor-tries-on.md)).
  Correct, and the line is the right place to say it.
- **The buy sheet.** *Buy the Family photo?*, the ware drawn large, the price, *Star Shards 1240 →
  952*, *Buy* and *Not now* ([0564](../docs/decisions/0564-cosmos-sells-pictures.md)). The best screen
  in the family. The shards sheet's *AFTER 665* while a ware is in the window is right too.
- **Swatches for paint** ([0565](../docs/decisions/0565-paint-in-swatches.md)) and prices on the
  faces ([0542](../docs/decisions/0542-cosmos-counter.md)).
- **The keepers.** Three shopfronts with a face and a line each, the open one lit and the others
  under the night ([0550](../docs/decisions/0550-every-tab-has-a-keeper.md),
  [0571](../docs/decisions/0571-the-dock.md)). The lit-shop state is the one piece of state language
  in the family that needs no legend.
- **The glyph line on a pad** — *◀ ▶ try · Ⓐ fit · Ⓑ back · LB RB tabs · LT RT pilots* — says the
  right things, at the wrong size (item 2).

---

## 1. Desktop

### 1.1 The pad, recorded

| from | press | where the cursor went | note |
|---|---|---|---|
| title, cursor on *Fly* | up, up | tier band → pilot band | brackets on *Feather* |
| pilot band | right ×2 | *Huang-Woo* | the band comes round (0607) |
| pilot band | down ×3 | tier → *Fly* → quiet row | |
| quiet row, *Hangin' Out* | A | the hangar | |
| hangar | RB, RB | Paint & Parts, Cosmo's | the cursor arrives on the pilot band each time |
| Cosmo's | B | the title, cursor on *Hangin' Out* | remembered (0458) |
| quiet row | down | **the pilot band** | comes round past the bottom |
| pilot band | right | *Huang-Woo* | |
| pilot band | **A** | **the intro: Huang-Woo's fighter on the pad** | item 1 |
| intro | RB | nothing | correct |

**Recommend, item 1:** on the pilot band a pad's confirm *arms* the pilot the way a phone's first tap
does (0513's own rule), and the second confirm flies; or confirm on the band moves the cursor to
*Fly*. Either keeps *Fly* as the one press that starts a run, which is what
[0458](../docs/decisions/0458-the-title-is-rows.md) wanted *Launch* to be. The keyboard's Enter is
the same press and should get the same rule.

**And the wrap.** Coming round past the quiet row onto the pilot band is correct on a band and
surprising on a screen: the quiet row is the bottom of a list, and a list's bottom is where a thumb
rests. Consider: rows come round, as now, but *Fly* is the row the cursor lands on from either end,
so a thumb that overshoots lands on the primary and not on a choice that changes the run.

### 1.2 The plate at a desktop's size (items 2 and 3)

Measured, the hangar:

| | 1280×720 | 1440×900 | 1920×1080 | 2560×1080 |
|---|---|---|---|---|
| plate width | 384 px | 384 px | 384 px | 384 px |
| plate as a share of the width | 30 % | 27 % | 20 % | 15 % |
| option type | 15.1 px | — | 16 px | 16 px |
| tab type | 12.5 px | — | 12.5 px | 12.5 px |
| glyph line | 9.4 px | — | 9.9 px | 9.9 px |
| readout counts | 12.4 px | — | 13.6 px | 13.6 px |
| ship on the pad, about | 205 px | 230 px | 305 px | 305 px |
| empty plate under the last band | ≈ 60 px | ≈ 110 px | ≈ 170 px | ≈ 170 px |

[0571](../docs/decisions/0571-the-dock.md) keeps the column *at a size of its own* so the picture
gets the rest of a wide screen. That is right for the width and wrong for the type: a 16 px option
and a 9.9 px glyph line on a 2560 px monitor are a form from another screen, and the empty bottom
third says so. **Recommend:** the plate's em from the short side with a floor and a ceiling
(`clamp()` on the host's `cqmin`, as the strip already is sized —
[0465](../docs/decisions/0465-the-chrome-fits-the-phone.md)); the plate's width from the em rather
than a pixel count, capped so the stage keeps the rest; the glyph line never under 12 px. Then the
focus card can be two lines everywhere rather than one ([0572](../docs/decisions/0572-the-dock-is-dressed.md)
cut it to one below 900 px).

**The ship.** The dock's camera is a field on each tab's row (`StandCamera`,
[0540](../docs/decisions/0540-the-hangar-is-the-port.md)) and the room is held inside the screen
whatever is asked. Measured, the three tabs stand the camera in the same place: the ship is the same
205 px on all three at 1280×720. The plan ([the menus are a place](the-menus-are-a-place-2026-10-05.md))
had Paint & Parts closer and Cosmo's at the counter; the 10-07 review found the same and
[0563](../docs/decisions/0563-the-ship-is-the-picture.md) answered it once for all three. **Recommend:**
a stand per tab again, now that the dock exists — Hangin' Out as now; Paint & Parts low and close so
the wheels are 60–80 px across; Cosmo's at the mezzanine with the counter large and the ship beyond.
And a short dolly between them ([the-plays-owed](the-plays-owed-2026-10-19.md) already lists *should
there be a dolly between tabs?* against 0563). [The port is a cutout](the-port-is-a-cutout-2026-10-24.md)
says what the room needs for a closer camera to be worth standing.

### 1.3 The cursor, the hover and the states (items 4 and 5)

- **One cursor.** The corner brackets are the right one: they breathe, they survive a filled
  option, and they do not look like a chosen state. Put them on the title's buttons and bands, on
  the Settings bands and tabs, and on the hangar's tab strip in place of the dark outline.
- **Hover.** A hovered action should lift, not sink: keep the glass where it is and raise the rim's
  glow, or lighten the glass by a tenth. The option chips already do this right
  (`.itc-title-option:hover` lightens).
- **Chosen versus cursor on a band.** The tier band fills *Savior of the Galaxy* with the run's
  gradient and puts the ring on it too when the cursor is there; the two are told apart only by the
  ring. With the brackets as the cursor the fill is free to mean *chosen* alone.
- **A cut face.** The hangar's pilot band at 384 px shows six faces and the seventh cut in half at
  the plate's edge (behind the right arrow). Show whole faces only and let the band scroll.
- **Locked pilots** are black silhouettes with their names on a desktop and without them on a
  phone. On the title at 1280×720 the cursor was not walked onto one; the 10-07 review's ask that a
  locked thing is focusable with its unlock line in the focus card was built in the hangar
  ([0561](../docs/decisions/0561-the-cursor-tries-on.md)). Owed a check on the title.

### 1.4 Settings and its tabs (items 6 and 7)

- **A plate and a sky.** Give the Settings family the title's sky and the nav-plate frame the title's
  two plates wear ([0440](../docs/decisions/0440-every-screen-speaks-with-the-titles-voice.md) put
  every screen in the title's voice; these four are in its type but not its picture). The pause
  family too (§1.5).
- **The tab strip stays put.** Anchor the strip at one height from the top of the plate on every tab
  and let the content fill down from it. At 1280×720 the strip moved 105 px between *How to play* and
  *Controls*.
- **Controls as a table.** One row per action, a column per device, the bound key or button in the
  cell, Enter on a cell to rebind. *Reset to defaults* and *Back* in a foot, as the hangar's plate has
  one. *How to play*'s CONTROLS block already draws this table read-only; the two should be one
  component so they cannot disagree.
- **Two steps for a two-option band.** *Sound On/Off*, *Travel Scene/Brief*, *Hand Right/Left*,
  *Rumble On/Off* are each two chips with arrows either side, so a band is three stops wide on a
  keyboard for one bit. A toggle that flips on A, Enter, a click or either arrow is one stop; the
  band look can stay.
- **Rumble's hint** says *A pad or phone taps when the ball lands* — one ship's special named as if
  it were the rule. Either the hint says what rumble does across the game or the setting is the
  ball's.
- **Save's warning** (*Not protected: the browser may clear it to make room*) is the most important
  line on the screen and is set in the hint's weight. A line that says a save can be lost wants the
  sheet's weight, once.

### 1.5 The pause family (item 9)

- **Draw the frozen field under *Paused*, dimmed**, with the plate over it. The count-in already
  does this (*Ready · 2* over the field).
- **Quit asks once** (*Quit this run?* / *Keep playing* / *Quit*) — correct. Its screen is the same
  black; same fix.
- **The pause button in play** is a small plate between the readout and the score at 1280×720 and
  reads as part of the score. Fine on a desktop where Escape and P exist; on a phone it is the only
  way and it is 50 px from the score's digits (§2).

### 1.6 Cosmo's (item 8)

- **Fix the hint.** Name the shop's action hint in the rule at `src/app/chrome.ts:934`, or make
  *Show owned* a checkbox row with its hint under it as the bands have theirs.
- **One foot.** *Buy · 575 ✦* on one line at the foot's full width as the primary, *Back* beside
  it, *Show owned* as a small toggle at the head of the shelf (it is a filter on the shelf, not an
  action on the ware).
- **The sub-tabs** are a second tab strip drawn as a band, with the band's own heading *HANGING*
  under it repeating the open tab's name. Draw them as the folder tabs the plate's head uses, at the
  head's size, and drop the duplicate heading. On narrow plates let the strip scroll rather than
  truncate: *Tu* is not a shelf.
- **The glyph line says *Enter pick* on Cosmo's and *Enter fit* elsewhere.** Correct and
  invisible at 9 px; see §1.2.

### 1.7 Paint & Parts

- **The shield row cuts its third chip** (*Phoenix plu…*) at the plate's edge at 1280×720 with the
  cursor's bracket on the second. A band shows whole chips or scrolls.
- **A lone chip in a band** (*Flame: Standard*) still stands with no arrows in a row sized for
  three. The 10-07 review's *a tile with a "More at Cosmo's →" link beside it* was not built; it is
  still the honest way to show the cross-sell the hint line does in prose.
- **Art chips carry a thumbnail the size of a glyph** (*Phoenix*, *Hot-rod flames*, *Rally stripe*
  at about 24 px). A 96×48 render of the door with the art on it, from `drawPlayerShip`, is the same
  draw at a different box; the 10-07 review priced it and nobody measured it.

### 1.8 The title

- **The locked pilots' reason.** On the title the lock's line (*lockHint* in
  `src/state/screens.ts`) is on the focus card the hangar has and the title does not. The title's
  one line under the faces (*Backspin Bo · The Firebird · Catherine wheel*) could say the lock's
  line when a locked face is under the cursor.
- **Every flight plays the intro** ([0635](../docs/decisions/0635-every-flight-plays-the-intro.md)):
  Fly from the title is twenty seconds to the first enemy unless Escape is pressed. 0635 owes the
  question *whether an intro every run is welcome or wants a setting*; this review's vote is a
  setting under Travel (*Intro: Every flight / First flight*), since Travel already holds *Scene /
  Brief* for the same kind of choice.

---

## 2. Mobile — what to do differently, not just smaller

Measured on the 844×390 touch context (CSS px), and at 667×375:

| | 844×390 | 667×375 | floor |
|---|---|---|---|
| hangar tab height | 29 px | 25 px | 44 pt / 48 dp |
| option chip | 39×42 px | 33×36 px | 44 |
| band arrow | 26 px | 26 px | 44 (0607 grew its press up and down only) |
| title *Fly* height | 39 px | 39 px | 44 |
| tier chip height | 42 px | 41 px | 44 |
| cockpit readout counts | 11 px | 9 px | 14 px (0566) |
| shards sheet type | 12.8 px | 12.8 px | — |
| hint line | 13.2 px | 13.2 px | — |

- **Targets.** Every control in the table is under the floor; the tabs by a third. The hangar's
  plate has the room at 844×390 (its lower half is a focus card and air): the tabs can be 44 px tall
  and the chips 44 px, and the plate still fits. On the title *Fly* can take 44 px from the gap
  above the quiet row.
- **The cockpit strip under the ship** at 9 px on a 667×375 phone is a decoration, not a readout.
  [0571](../docs/decisions/0571-the-dock.md) said so and left it to the player. Either it is the
  readout and gets 14 px (two rows, over the deck's front where nothing stands), or it is not drawn
  on a phone and the shards sheet carries the one number a phone needs.
- **The phone's Settings** lays the bands in two columns and puts *Rumble*'s label beside its chips
  while the other four stand theirs above. One treatment.
- **Labels on the phone's Loadout** came back as small caps above each carousel
  ([0566](../docs/decisions/0566-the-phone-pass.md)) — good. The gun's chip still truncates
  (*Cath…* for *Catherine wheel*); the focus card under it says the whole name, so the chip could
  show the face alone and the card the name, as Cosmo's tiles do.
- **The pilot band on a phone** shows eight faces with no names and three black silhouettes. A
  name under the chosen face, at least.
- **The pause button in play** is 50 px from the score's digits at the top right, in the one place
  the score's streak badge animates. On a touch screen move it to the left of the score with a gap,
  or to the top-left strip beside the readout, away from the trigger discs
  ([the menus reviewed](the-menus-reviewed-2026-10-02.md) put it *where no trigger disc is*; it is,
  but it is where the eye is).
- **480×320 has no stage** — the plate takes the width and the ship is not drawn, as the 10-07
  review found. The phone pass ([0566](../docs/decisions/0566-the-phone-pass.md)) built the
  upright layout (ship on top, plate below); the smallest landscape still fits blind.
- **Portrait** was answered yes for the hangar family (10-07). Not shot here: the scratch script
  opened landscape contexts only. Owed.
- **Safe areas** were not testable here; owed on a device with a notch, as 0566 says.

---

## 3. Feel — owed a look in motion

Not judged from stills, listed so they are not lost: the tab change (a cut today); the fitting's hop
and two cues ([0567](../docs/decisions/0567-a-fitting-is-felt.md)); the balance counting on a buy;
the bubble's five-second hold; the breathing brackets; the flyer crossing behind the title's plates;
and whether the menu's press cue ([0659](../docs/decisions/0659-a-menu-press-is-heard.md)) fires on
a pad's A as it does on a click.

---

## Suggested order, if this becomes a plan

Grouped by what it unblocks; each item needs its own pressure-test and its decision.

1. **The two traps and the two defects**: A on the pilot band arms rather than flies (§1.1); the
   hover lifts (§1.3); the shop's hint breaks (§1.6); the Settings strip stays put (§1.4). Small,
   and each is a thing a player hit.
2. **One cursor everywhere** (§1.3).
3. **The plate's type and width from the short side, the glyph line at 12 px, the focus card two
   lines** (§1.2), which also gives the phone its 44 px targets (§2).
4. **The Settings family gets the sky and a plate; the pause draws the field** (§1.4, §1.5).
5. **Controls as a table; two-option bands as toggles** (§1.4).
6. **Cosmo's foot and sub-tabs; Paint & Parts' lone chips and art thumbnails** (§1.6, §1.7).
7. **A stand per tab and the dolly**, after [the port is a cutout](the-port-is-a-cutout-2026-10-24.md)
   has made the room worth standing closer to (§1.2).
8. **The phone's readout strip, the pause button, the pilot's name, and a portrait shoot** (§2).

Each from `main`, one open at a time, photographed with `scripts/shot-menus.mjs` at its pair and
the guard's six, and the pad walk re-run with the stub before it is handed over.

## The answers

Not yet asked. The questions this leaves to the player:

| question | recommendation |
|---|---|
| on a pad, does A on the pilot band arm the pilot, or move the cursor to *Fly*? | **arm**, as a phone's first tap does |
| does the intro play on every flight, or does Travel get an *Intro* band? | **a band** |
| is the cockpit strip on a phone a readout at 14 px, or not drawn? | **not drawn**; the shards sheet stays |
| do the tabs get a stand each, with a dolly between? | **yes**, after the room is dressed |
