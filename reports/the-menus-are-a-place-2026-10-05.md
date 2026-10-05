# The menus are a place, planned — 2026-10-05

One ask, five changes, landed in order, each from `main` and each photographed at the six sizes the
layout guard holds and played on its branch preview. This file holds the plan, what was measured
before it was written, and the questions it leaves to the player. What each change decided lives in its
decision once it lands; this is the queue.

## The ask

> *"give me a good plan to implement a good menu screen, good Hangin Out screen - spaceport, garage
> style with background, setting and ships etc.*
>
> *Good Cosmo's Cosmetics shop background with categories and items previewed properly. The tabs should
> be good fits as well, the dashboard display should be down in the shop and hanger section not the
> top left.*
>
> *The main menu is a pure mess at the moment with stuff everywhere. It's all quite unpleasant."*

## What was already true

Looked at on `main` at `52d9dd95`, from the built page, at 1280×720 and an 844×390 touch context,
with a seeded five-row table and a seeded hangar in which every ship has been won in, the balance is
1240 and two wares are owned — so every band shows its open state, not its first-visit one.

### The title

- **The right column is five things of five shapes, and the eye has no path through them.** A band
  of four faces; under it the pilot card — the ship at a thumbnail, the name, pronouns and home town,
  a two-line bio, the ship's name in caps and the gun's line; under that the tier band, three wide
  buttons and a hint line; and under that one row holding **four controls at three sizes**: the
  continues chip, a double-ringed *Fly* twice the height of its neighbours, and *Hangin’ Out* and
  *Settings* a step smaller. The bio is the heaviest text on the screen and says nothing about the run
  the player is about to fly.
- **The table stands on the left unframed**, a heading in gold and five bare rows, with no edge
  between it and the column beside it. Without a table the column stands alone in the middle, which
  is what every first visit sees.
- **On the phone it is five rows of furniture in 390 px**: the table, the faces, the card (its bio cut
  with an ellipsis), the tier across the width, and the four controls across the width.
- **The row model underneath is sound and guarded** — [0458](../docs/decisions/0458-the-title-is-rows.md):
  up and down between rows, left and right along one, the cursor remembered per screen, B is back.
  Nothing here reopens it. What is wrong is the composition laid over it.

### Hangin’ Out, Paint & Parts, Cosmo’s

- **Nothing says it is a place.** Each tab is bands on the void: the pilot band in a large outlined
  box, the same card again with the same bio, and the slots in a grid with uppercase labels, *Back*
  floating under them. The three tabs are heading-sized pills centred over everything, attached to
  nothing.
- **The dash is the readout in the play corner.** [0521](../docs/decisions/0521-the-hangar-opens.md)
  chose the real readout over a picture of it, which holds; but it stands where a run puts it, top
  left, saying ×0 ships, three shells and ×0 of each stack — the counts of a run that is not
  running — and a dangle swings off its bottom edge against the top of the screen. On Cosmo’s it is
  the only thing on the upper half of the page.
- **Paint & Parts has no preview worth the name.** The readout is not up (its row offers neither
  `plate` nor `ware`), so the only picture of the ship being painted is the card's thumbnail, about a
  hundred pixels wide. A rim, a nose art, a livery and a flame are all fitted blind.
- **Cosmo’s is one band.** Five wares — three dangles, a rim and a flame — in one shelf called *On
  the shelf*, with no category, the price only in the hint line, and the preview only for a dangle
  (on the corner readout). *Buy* is not on the screen when the ware in the window is owned, so the
  screen is then a band and *Back*.
- **The hangar already exists, drawn.** The intro's first shot
  ([0411](../docs/decisions/0411-the-chase-begins-at-the-port.md)) is a spaceport bay: a riveted
  back wall and a truss ceiling, two lamps throwing cones, a plank deck, **a bar** with a lit shelf
  of bottles, string lights, a neon bird and a sliding door, two landing pads with hazard stripes,
  the bay's edge with beacons, and the stars beyond. **The pilot's own ship stands on its pad at two
  and a half times the fight's size** (`HANGAR_SCALE` in `src/content/port.ts`), hovering on its
  pad's light, **already wearing the fit** — the borrowed gun since
  [0526](../docs/decisions/0526-the-gun-is-fitted.md), the livery since
  [0529](../docs/decisions/0529-the-livery-is-free.md), the flame since
  [0530](../docs/decisions/0530-the-ions-burn-blue.md). It is painted by `paintPort` in
  `src/render/port.ts` as a pure function of one clock, so a held clock is a still; it is on the
  frame loop's hot list, so it allocates nothing; its atlas is baked when the intro starts and
  **dropped when the intro ends** (10.7 MB of bitmaps at 720p, 29.7 at the cap). The bay's edge is
  placed *"a third of the narrowest view short of its edge, so every screen sees out"* — it is
  already laid out against every device the layout guard holds.
- **A ship can be drawn at any size without the atlas.** `drawPlayerShip` in `src/render/bake.ts`
  paints a ship into any box from its vectors with a gun, a rim, an art and a livery; `rig/looks.html`
  uses it to draw every look at three times the shipped size. The card's thumbnail is one such draw,
  cached per fit.
- **The strip is one element with one parent.** The readout, the boss bar and the score sit in
  `.itc-playing-strip` inside `.itc-playing-top`, a container sized to the host so the strip is typeset
  against the short axis ([0465](../docs/decisions/0465-the-chrome-fits-the-phone.md)). Every guard
  that reads the readout finds it by class, not by parent.

## Pressure-tested

- **The ask is sound, and it is a composition ask, not a model ask.** 0458's rows, 0521's real readout,
  0523's band-as-shelf and the slots' unlock rules all stand. What the player is describing is that
  the screens were each laid out as the bands they needed and never as a picture, which is true, and
  which [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) predicts: every one of
  them was proved by a guard counting its bands and none by looking.
- **A CSS backdrop would be the cheap mechanism that renames the ask**
  ([0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md)). A painted hangar
  behind the bands would give *background* and not *setting*: the ship in it would be the card's
  thumbnail still, so the wheels, the art, the livery and the flame would still be fitted blind. The
  port's stage gives the fitted ship at two and a half times the fight's size for the cost of keeping
  an atlas the game already knows how to bake. So the stage is the plan, and the backdrop is what it
  does not settle for.
- **The title stays in the sky.** [0437](../docs/decisions/0437-the-title-is-lit.md) chose a CSS sky
  and a CSS flyer because they touch nothing the game owns, and that reason holds. The fiction also
  reads better split: the title is outside, with the ship crossing the stars; *Hangin’ Out* is the
  room the pilot hangs out in. Putting the title inside the port would also put the bar — the busiest,
  brightest thing in the picture — under the table. Raised below as a question the player may answer
  the other way.
- **The stage costs memory while it is up, and a bake on the way in.** The intro's atlas is dropped
  when the intro ends, and the hangar's will be dropped at *Back*, on the same terms. What the open
  costs is a port bake at the fitted ship; 0411 measured it as unmeasurable in the time to the first
  frame at boot, and it is measured again here under the suite before a number is written
  ([0245](../docs/decisions/0245-a-budget-is-sized-under-load.md)). A slot change re-bakes the pilot's
  ship's few port sprites, not the room.
- **A mechanism per screen, not a constant** ([0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).
  Where the stage's camera stands is a fact about each tab — the pad for the hangar, closer on the pad
  for Paint & Parts, the bar for Cosmo’s — so it is a field on the screen's row, and a fourth tab
  authors its own.
- **Nothing here touches the sim, a save or a shipped key.** No rollback note is owed by any item; the
  hangar document is read and written as it is.

## The design

### The title — three plates in the sky

```
                      [badge]  Into the Coil

  ┌ HIGH SCORES ────────────┐   ┌──────────────────────────────────────────┐
  │ 1   1 579 750  Backspin  Clear │   │   (●)  (●)  (◉)  (●)                     │
  │ 2     826 877  Huang-Woo  L6   │   │   Backspin Bo · The Firebird · Shuriken   │
  │ 3     753 754  Longshot   L5   │   │                                          │
  │ 4     388 139  Feather    L4   │   │   ‹ Legendary · SAVIOR · Burn ›            │
  │ 5     241 893  Backspin   L3   │   │     Be the hero you want to be           │
  └─────────────────────────┘   │                                          │
                                 │   [              FLY               ]      │
                                 │   Hangin’ Out · No quarters given · Settings │
                                 └──────────────────────────────────────────┘
```

- **The pilot card leaves the title.** The faces stay, and one line under them says the name, the
  ship and the gun — what the run is. The pronouns, the home and the bio go to the hangar, where the
  pilot is hanging out and there is a place to read them. Vetoable, below.
- **Fly stands alone as the one primary**, full width of its plate, focused on arrival (0458). Under
  it the quiet row: *Hangin’ Out*, the continues chip and *Settings*, **at one size**. The row model
  does not change — the chip is the band it is now and the buttons are the actions they are now; what
  changes is that nothing in the quiet row competes with *Fly*.
- **Two plates, one treatment**: the table and the rows each in the cut-corner nav-plate frame the
  buttons already wear, with the title's violet-into-cyan rule
  ([0440](../docs/decisions/0440-every-screen-speaks-with-the-titles-voice.md)). The flyer crosses
  behind both plates, which carry the void backing the tier buttons already have. An empty table says
  nothing and its plate is not drawn; the rows stand centred, as now.
- **On a phone** the table's plate sits left and the rows' plate right, as now, and the card's row is
  gone — one row of height back on every phone, against the 30 px the layout guard found spare at
  844×390.

### The hangar family — one room, three stands

The three tabs share one picture and one layout. **Behind them is the port** as the intro leaves it:
the Viper gone and her pad empty, the beacons dark, the pilot's ship at idle on its own pad, hovering
on its light, the lamps on, the bar lit. `paintPort` gets a *stand* — a held clock with the Viper and
the alarm off — and the hangar's rows say `dims: false` with the port as their picture, as the intro's
does. The room is baked at the fitted ship when any of the three is opened and dropped at *Back*.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  truss · lamps · wall                                        ✦ 1 240 shards │
│                                   ┌ Hangin’ Out ┃ Paint & Parts ┃ Cosmo’s ┐  │
│   bar     [the ship, on its pad,  │  (●)(●)(◉)(●)  Backspin Bo             │
│  bottles   2.5× the fight's size, │  they/them · Portland                  │
│  neon      wearing the fit]       │  Spins it back on a string; …          │
│                                   │                                        │
│            ┌ the dash ─────────┐  │  LOADOUT   Gun      ‹ Shuriken ›       │
│            │ ⛟ ×3 ⛉⛉⛉ ✦×2 ✧×0 │  │            Special  ‹ Whirlpool ›      │
│            └──────┬────────────┘  │  DASH      Dash     ‹ Chequered flag › │
│                 (dice)            │            Hanging  ‹ Fuzzy dice ›     │
│  deck ─────── pad ──────────────  │                               [ Back ] │
└───────────────────────────────────────────────────────────────────────────┘
```

- **The ship on its pad is the preview**, on every tab. It is the port's own ship sprite at the
  hangar's scale, re-baked when a slot changes — the gun on its hardpoint, the rims, the art, the
  livery, and the flame burning at idle under it. The card's thumbnail goes.
- **The dash stands under the ship.** The real readout moves house: while a fitting screen is up, the
  strip's readout element is re-parented into the plate's dash cell, and it goes back into the strip
  when the screen is left. It keeps its classes, so every guard that reads it still does. **It shows
  what the run will open with** — three ships, the tier's shells, two of the fitted special, none of
  the missile — rather than ×0 of everything, because a dash that says *this is what you fly out with*
  is a preview and one that says ×0 is a bug report. The dangle swings off it as it does now (0466).
- **The plate is one column on the right**, over the wall and the bay, where the picture is darkest.
  Its head is the tab strip; under it the pilot — faces at a thumbnail, the name, and on this tab the
  pronouns, home and bio; then the bands grouped under two small headings, *Loadout* (Gun, Special)
  and *Dash* (Dash, Hanging); *Back* in its foot. The balance is a sheet in the top corner on every
  tab. Band labels are the group's, so each band's own label is for a reader.
- **The tabs are fitted to the plate**: a strip across its head in the plate's own type, the open tab
  filled and joined to the plate, the others set back — folder tabs rather than pills over the void.
  On a pad, LB and RB are marked at the strip's ends. The screen's heading *is* the open tab.
- **Paint & Parts** stands the camera closer on the pad, so the wheels and the nose are large, and its
  plate carries *Wheels*, *Art*, *Colour*, *Tone*, *Flame*. The flame burns on the pad as it is chosen.
- **Cosmo’s** stands the camera at the bar: the counter and its lit shelf fill the left, the ship
  stays in view on its pad beyond it, and **Cosmo stands behind the counter** — a face and a line, like
  the pilots', which the player names below. The plate carries **three shelves, one per table**:
  *Hanging*, *Wheels*, *Flames*, each a band of its wares with the price on the ware's face and a
  shut look on what is already owned, under a category band that steps the shelf in view; a desktop
  shows as many shelves as fit, a phone one — see *The answers* for how it grows. **A ware in the window is tried on where it goes** — a dangle
  on the dash, a rim on the ship's wheels, a flame in its exhaust — on the stage, before a shard is
  spent, which is 0523's rule extended from the dash to the pad. ***Buy* names the price** —
  *Buy · 250 ✦* — and on an owned ware it is replaced by *Yours — fit it in the hangar*, so there is
  never a button that does nothing (0523).
- **On a phone** the plate takes the right three fifths and the stage keeps the pad in the left two,
  the ship still at the hangar's scale; bands show one option at a time with the arrows stepping, as
  now ([0523](../docs/decisions/0523-cosmo-opens.md)). At 480×320 the plate takes the width and the
  stage dims under it, the ship still visible through it. Photographed at the six sizes the layout
  guard holds.

## Read, and decided without asking — each can be vetoed

- **The bio leaves the title for the hangar.** The title's one line is the run; the person is read
  where they are hanging out.
- **The title stays in the sky, and only the hangar family is in the port.** The reasons are in
  *Pressure-tested*; the player may want the room everywhere.
- **The dash shows the opening complement**, not zeros.
- **Cosmo is the alien whose family is in the gilt frame.** 0523 draws the family photo as *three of
  the alien's own*; a shopkeeper selling a picture of their own family is a character for the cost of
  one face. Who the alien is, is the player's.
- **The hangar's atlas is dropped at Back**, on the intro's terms, so the run's memory is what it was.
- **The three shelves are by table** — what hangs, what turns, what burns — because the tables are the
  categories (`src/content/wares.ts` already lists them in that order), and a fourth table is a fourth
  shelf by walking the list.

## Raised for the screen, not answered by a rule

- **The port's bake on opening the hangar**, measured under the suite before a budget is written, and
  whether a slot change's partial re-bake is quick enough to feel like a fitting rather than a load.
- **The flyer and the plates.** The title's ship crosses low every sixteen seconds; with two plates
  across the middle it crosses behind them. Whether it should cross above, below, or go, is a picture
  question.
- **The readout's type in the plate.** In the strip it is typeset in the host's short axis; in the
  plate it takes the plate's em. The dangle's swing is authored in the readout's em, so it scales with
  it; checked in the picture, not assumed.

## What the guards will say

- `tests/layout.browser.test.ts` — *every screen drawn, no scrolling, the best five standing still,
  the tier lines readable, the title's choices in one row on a phone*: every item is held to these,
  and the title's one-row rule is amended if the quiet row is the row it means.
- `tests/menu.browser.test.ts` — the 0458 and 0513 walks: the title's row order changes (Fly's row,
  then the quiet row), so the recorded walk is re-recorded, and the pad walk is re-run on every screen
  as the menus review did.
- `tests/style.test.ts` — *every setting on exactly one screen*, with the pilot's three named: unchanged.
- `tests/hangar.browser.test.ts`, `tests/cosmo.browser.test.ts`, `tests/livery.browser.test.ts` and
  the rest of the family read the readout by class: unchanged by its re-parenting, and they are the
  proof that it is.
- `tests/budget.test.ts` — `src/render/port.ts` is on the hot list: the stand allocates nothing.
- `tests/hud.browser.test.ts` — the strip in play is untouched: the readout is back in it before any
  run steps.

## The queue

1. **The title is composed.** The two plates, the card off the title and its one line under the
   faces, *Fly* alone and the quiet row at one size, the flyer's path answered. The cheapest and the
   most seen, so first.
2. **The readout stands down.** The plate for the hangar family — the fitted tab strip in its head,
   the balance in its corner, the groups, *Back* in its foot — and the dash cell with the readout
   re-parented into it, showing the opening complement. No stage yet: this is the layout the stage
   will stand behind, and it is proved on the void first so a picture question is never confused
   with a layout one.
3. **Hangin’ Out is the port.** The stand in `paintPort`, the port baked at the fit on opening and
   dropped at *Back*, the hangar's rows drawing it, the ship on its pad as the preview re-baked on a
   slot change, the camera a field on each row. The bake measured under the suite.
4. **Paint & Parts on the pad.** The camera closer; the flame burning at idle; the five bands on the
   plate. Every look photographed on the pad against `rig/looks.html`'s page, so a look that reads at
   three times the fight's size on the rig reads on the pad too.
5. **Cosmo’s counter.** The camera at the bar, Cosmo behind it with a line, three shelves by table,
   the price on the face and on *Buy*, the try-on on the stage for every kind of ware, and the owned
   state as a line rather than a dead button. The purchase sound 0523 owed waits for the ear.

Each PR from `main`, one open at a time, photographed at 480×320, 667×375, 812×375, 915×412,
1024×768 and 1280×720 before it is handed over, and played on its branch preview before the next.

## The answers

Given 2026-10-05, the same evening:

| question | answer |
|---|---|
| does the bio leave the title for the hangar? | **yes** |
| does the title stay in the sky, with only the hangar family in the port? | **yes** |
| who is Cosmo — the alien in the family photo, or someone else? | **yes**, the alien |
| the three shelves by table on a desktop, a category band on a phone — or tabs inside the shop? | **yes, so far** — *"there'll be more cosmetics added for lots of things so it'll need space to grow"* |
| does the dash in the hangar show what the run opens with, rather than zeros? | **yes** |

**The shop is built to grow, on the fourth answer.** The shelves are the ownable tables walked in
`src/content/wares.ts`'s order, so a new kind of cosmetic — a horn, a decal, a trail — is a table, a
line in that list, and a shelf, never a layout change. What the layout owes is the room: the plate
shows as many shelves as fit its height at the device's type and **the category band is always
there**, stepping the shelf in view, so a desktop with three shelves and a phone with one are the same
screen at different heights, and a sixth table scrolls the same way the first did. A shelf with more
wares than fit a row wraps, as the dangle band does today. Nothing about this is a cap: no shelf
count, no ware count, is a number anywhere.

## Owed

- A play of each change on its branch preview, and the pad walk re-recorded once item 1 lands.
- Item 1 on the player's word.
