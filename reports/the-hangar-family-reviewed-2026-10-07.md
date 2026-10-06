# The hangar family, reviewed — 2026-10-07

A UX review of **Hangin' Out**, **Paint & Parts** and **Cosmo's Cosmetics**, read the way a senior
games UX designer would read a garage screen, for desktop and phone. This file is a list of findings
and recommendations. It is not a plan, and nothing in it is built. Anything taken from it becomes a
plan with its own answers, the way
[the menus are a place](the-menus-are-a-place-2026-10-05.md) did.

## The ask

> *"Review the Hanging Out, Paint Shop and Cosmo's menu's and screens as if you were a senior UX
> designer with a penchant for video games and a good eye for quality and detail. they 'currently
> work' is about the best we can say for them. Give me a report on everything that could be better,
> including background screenshots and positioning of everything. The report should be targeted
> towards how we give our players the highest quality experience on both mobile and desktop."*

## How it was looked at

- Built from `a-run-ends-whole` at `d27544f0`, which is `main` plus the run-end work. Nothing in that
  branch touches these screens. Shot with `scripts/shot-menus.mjs`, so every ship was won in, the
  balance was 1240, and two wares were owned.
- **Sizes:** 1280×720 and 1920×1080 desktop, 2560×1080 ultrawide, an 1180×820 iPad landscape with
  touch, an 844×390 phone and a 667×375 phone with touch, plus the six layout-guard sizes (480×320
  through 1280×720). Portrait at 390×844 shows *"Turn your device sideways to play."* and goes no
  further, so these screens have no portrait layout.
- **Interaction states:** a scratch copy of the script drove the cursor with the keyboard and clicked
  wares at 1280×720 and 667×375. It covered arriving on each tab, the cursor on a locked item, a ware
  in the window, Buy, and the moment after buying.
- **Measured:** the type sizes in the DOM at four viewports.
- **Not checked, and what would check it:** motion, transitions, sound and haptics. Every shot is a
  still, and the browser pane freezes animation (`rAF`). A play on a phone, and a Playwright clip of
  each tab change and each purchase, would check them. The real-pad walk was not done either:
  `tests/menu.browser.test.ts` holds the walk itself, but not how the walk feels.

The pictures are in `shots/ux/`, which is gitignored and local to this machine. Run the script again
to make them.

---

## Summary — the ten things that matter most

1. **The ship is the product and it is the smallest thing on the screen.** At 1280×720 the ship on
   the pad is about 170 px wide in a 1280 px screen. The keeper's booth beside it is bigger. At
   1024×768 the plate covers the ship's nose. At 480×320 the stage is not drawn at all, so a
   phone-sized player paints and buys **blind**. This is the same complaint the last plan set out to
   fix. The pad is now there, but the camera never got closer.
2. **The camera is identical on all three tabs.** The plan gave each tab its own stand: the pad for
   Hangin' Out, close on the pad for Paint & Parts, the bar for Cosmo's. What shipped swaps the
   keeper's booth and leaves the camera where it was. The tabs read as one screen with three
   different lists.
3. **The plate is a fixed-size form pinned to the top right.** The type is the same size at
   1280×720 and 1920×1080, measured at 20 px options and 18.4 px tabs on both. On larger screens the
   plate's bottom half is therefore empty: about 40% of it at 1280×720, more than half at 1920×1080,
   and at 2560×1080 the option chips stretch to 340 px wide with three words in them. The *Back*
   button sits alone at the bottom of that space.
4. **Wares and parts are words in pills.** A shop with no pictures of its stock is the biggest
   single quality gap. "Mothership spinners · 1000 ✦" is a pill with a sentence in it. The try-on
   puts the real thing on the ship, but at 170 px, so a rim swap or a blue flame is a few pixels of
   difference.
5. **Each control has one visual state too few.** The *equipped* chip is filled with the
   violet→cyan gradient, and so is the *open tab*. The cursor is a cyan ring on a row, and a **black
   outline** on a tab. *Owned* is the word "· yours" in the label. *Locked* is a dashed outline,
   which also reads as "empty slot". *Can't afford* has no look at all that could be seen at a
   balance of 1240.
6. **The cursor equips as it moves, and it cannot reach a locked item.** Pressing → on the gun row
   moved Catherine wheel → Shuriken and **fitted it**. The cursor stopped before *Arc*: the arrow
   dims and the row ends, so the line saying how to unlock Arc is never shown to a keyboard or pad
   player. Locked items are the most motivating thing on a garage screen, and here they are the one
   thing the player cannot inspect.
7. **The phone loses labels, the keeper and the balance.** At 844×390 Hangin' Out drops the GUN,
   SPECIAL, DASH and HANGING labels and the keeper's line, and shows one option per row. Two rows
   read *Catherine wheel* and *Candle* with nothing to say which is the gun. At 480×320 the
   **balance is gone from the shop**. Truncation is everywhere on phones: "Backspin Bo ·…",
   "T…", "That one's yours already — fit it in Hangin' …".
8. **The dash readout sits on the floor at play-HUD scale.** At 1280×720 it floats bottom-left under
   the pad, with the dangle hanging off it into the deck. At 1024×768 and on phones it wraps onto
   two lines, leaving a lone "×0" on the second, and at 667×375 it gets a translucent amber box
   around it. Its gold-and-chequer frame is the run's HUD language and clashes with the
   violet/cyan plate. It is the right *content* (0521's real readout) in the wrong *place and
   scale*.
9. **Cosmo's shows three shelves on a desktop and lets the cursor into one.** The *Aisle* row picks
   which shelf the cursor works on. Meanwhile all three shelves are visible, the mouse can click
   any of them, and the keyboard reaches only the chosen one. So the aisle control looks like it
   does nothing on a desktop and is the whole navigation on a phone. Cosmo's arrival line
   (*"That one's yours already — fit it in Hangin' Out."*) answers a question nobody asked yet,
   because the first ware in the window happens to be owned.
10. **Buying has no ceremony.** One click spent 400 of 1240 shards: no confirm, no hold, no
    count-down on the balance (still shot, so motion unverified), and no *Fit it now*. The bought
    flame is then labelled "Yours — fit it in Paint & Parts", which sends the player to a different
    tab to do the obvious next thing.

---

## What already works — keep it

- **The stage idea is right.** Spending the art on a real port, with the pilot's real fitted ship
  on a lit pad and a keeper per tab, is what a garage screen should be. It needs more of itself,
  not less. *Unity's Trade & Repair*, the paint-dripped *MMXXVI* awning with the duck in a helmet,
  and Cosmo behind a striped counter each have character at a glance.
- **The try-on is live** for every ware kind I tried: the family photo hung from the dash, the
  Ion Thrusters burned blue on the pad, and the Thunderbolt's lightning wheels showed on the ship.
  Rule 0523, *see it before you spend*, holds.
- **Keepers speak to state.** *"Try it on, no charge for looking."* → *"Pleasure doing
  business. It suits you."* Good. It needs more lines, and the arrival line needs to be right.
- **The hint line under each row says the right thing**: *"Beat the jellyfish in the Thunderbolt
  to change its wheels, or buy a set at Cosmo's"* is a great unlock line. The problem is only that
  you see it after the cursor lands on the row, and never for a single locked item.
- **Price on the face and on Buy** (0542). *Buy · 250 ✦* is right.
- **The folder tabs joined to the plate** read as tabs, which the old pills did not.

---

## 1. The frame shared by all three tabs

### 1.1 Composition — where the eye goes

At 1280×720 the stage takes the left 40% and the plate takes the right 60%. Inside the stage, the
booth (≈210 px wide) and the ship (≈170 px) stand side by side at equal weight. The shards pill sits
top-left and the readout bottom-left. The eye has four places to land on the left, and none of them
is the hero.

**Recommend:**

- **Let the ship own the left half.** Bring the camera in on the pad on every tab, so the ship
  takes roughly a third to two-fifths of the screen's width. The ship is 2.5× its fight size now;
  4–6× is what a garage reads at. The ship is drawn from vectors (`drawPlayerShip`), so this costs
  bake memory, not fidelity, and the cost should be measured before anyone commits to it.
- **Push the keeper to the edge and give them a moment.** The booth should frame the ship, not
  compete with it: cropped at the left edge, half in shadow, lit when they speak. Today the bar's
  string lights and wall are cut off by the screen edge at every aspect ratio. It is cropped by
  accident. Crop it on purpose.
- **Three cameras, one room.** Hangin' Out is wide on the pad, with the ship and the whole loadout
  readable. Paint & Parts is tight and low on the ship's side, so the wheels, door art and paint
  fill the frame, and it could turn the ship side-on and three-quarter. Cosmo's sits at the counter
  with the ship beyond: a ware is shown large on the counter while the ship wears it on the pad. A
  short dolly between them on a tab change (≈250–350 ms, eased) makes the tabs feel like walking
  across the room. That is the fiction 0411 built the port for.
- **Light the subject.** The pad's cone of light is the right idea, but the overhead lamp beams fall
  on the empty wall behind and **cut through the Star Shards pill** (most visible on the iPad shot,
  where a lamp fixture draws across "SHARDS 1240"). Aim the key light on the ship and dim the
  background, so the plate and the ship separate from the wall.

### 1.2 The plate

- **Make the plate scale with the screen.** Its type and spacing should grow with the viewport's
  short side (`clamp()` on a `vmin`-based root em), so 1920×1080 is a larger 1280×720 and not a
  1280×720 form with a void under it. On ultrawide, cap the plate's width and give the extra to the
  stage. Chips 340 px wide holding "Hanging" are the opposite of what a wide screen is for.
- **Fill the bottom with a detail card, not air.** Every good garage (Forza, Rocket League, Need for
  Speed, Hades' Mirror) has a **focus card**: a large name, a short line of flavour, *what it
  changes*, *where it came from / how to unlock*, and the price or the *Equip* state. Today the
  one-line hint under each row does that job at 13 px and moves around as the cursor changes rows.
  Put it in one fixed place at the foot of the plate, beside *Back* and *Buy*, and make it the
  biggest text on the plate after the tab.
- **Anchor the actions.** *Back* (and *Buy*) at the bottom-right is right. Give them a consistent
  bar with the controller glyphs (B Back · A Buy · LB/RB tabs) on pad, the keys on keyboard, and
  nothing on touch. Today the only hint of LB/RB on the tabs comes from the code, not the screen.
  Glyph hints were not checked on a pad, so this is owed a pad look.

### 1.3 The state language

This needs designing once, for all three tabs:

| state | now | recommend |
|---|---|---|
| **equipped / chosen** | gradient fill | a fill *plus* a check or "EQUIPPED" tag, so it survives the cursor |
| **cursor** | cyan ring on the row; **black outline on a tab** | one cursor look everywhere: the cyan ring with a soft outer glow on the *item*, not the row |
| **open tab** | the same gradient as "equipped" | the tab joined to the plate, in the plate's colour, with a bright top rule. Not the selection gradient |
| **owned, not equipped** | the text "· yours" | a small owned badge on the tile |
| **locked** | a dashed outline, which reads as "empty" | a padlock glyph, a dimmed thumbnail, and the unlock condition in the focus card |
| **can't afford** | nothing could be seen at 1240 | the price in a warning colour, and Buy present but saying *"Need 160 more ✦"* |
| **new / never seen** | none | a dot on the tile and on the tab, cleared on first focus |

*New* matters more than it looks. When a run unlocks a ship's set, today nothing on the title or the
hangar says where to look.

### 1.4 The cursor model

- **The cursor reaches locked items.** Focusing a locked thing is how a player learns what to chase.
  Equipping it is refused with a sound and a shake, and the focus card says how to unlock it.
- **Browsing and equipping are separate in the hangar**, or at least made safe. Fitting on cursor
  is fine for a carousel, but here a pad player scrolling to *look at* Arc changes their gun on the
  way past. Two options. **(a)** The cursor previews on the ship and confirm equips; *Back* with a
  changed-but-unconfirmed fit reverts it. **(b)** Keep fit-on-move, but make the readout and ship
  change so visibly that it is obviously a fit. (a) is the genre standard; which one is the player's
  call.
- **Arrive on content, not on the tab.** On every tab the cursor arrives on the tab strip (measured:
  `itc-shop-tab … cursor` on arriving at Cosmo's). Arrive on the first row of content. The tabs are
  LB/RB, Q/E, or a tap.
- **The pilot band sits above the wares on Paint & Parts and Cosmo's.** Pressing ↓ then → in the
  shop **changed the pilot** from Backspin Bo to the Marmot, and with them the ship on the pad. On
  Hangin' Out the pilot band is the point. On the other two it should be a compact *"Fitting:
  Backspin Bo · The Firebird ⇄"* header that opens the picker, out of the cursor's main path.

### 1.5 The balance and the readout

- **The Star Shards pill belongs beside the money actions.** It sits top-left on the stage. *Buy*
  sits bottom-right on the plate, about 1200 px away at 1920×1080. Put the balance in the plate's
  head beside the tabs, or right beside *Buy*, and show the after-purchase balance while a ware is
  in the window (*1240 → 840*). It must never be hidden: at 480×320 it currently is.
- **The dash readout belongs under the ship, at the stage's scale, in the stage's light.** It is
  not a HUD on the floor. Draw it as the ship's actual dashboard plate, a bezel on the pad's front
  edge, so the dangle hangs from something physical and sways in the room. Don't let it wrap: the
  lone "×0" second line at 1024×768 and on phones is a bug in the picture. The amber translucent box
  at 667×375 looks like a debug overlay.

---

## 2. Hangin' Out

**Desktop (1280×720):** Unity's line sits on the left of the plate's head and the pilot's bio card
on the right. The two compete as headers. The bio is set at 13 px. LOADOUT (gun, special) and DASH
(dash, hanging) are full rows of five chips.

- **The pilot is the hero of this tab, so show them.** The faces are 40 px avatars in a carousel.
  Give the chosen pilot a portrait the size of the keeper's booth, standing by their ship on the
  pad, with name, pronouns and home under it. The bio is good writing at the smallest size on the
  screen.
- **Unity's line versus the pilot card.** Pick one header. The keeper's quip belongs in a speech
  bubble on the stage by the booth, not in the plate's first row, and that gives the plate a row
  back.
- **Gun and special want a stat line.** "A fire wheel on a tether — from the Firebird" is flavour.
  A garage screen tells you *what changes*. A short icon row — spread, rate, reach, or the
  special's charges and trigger side — makes a choice between guns a decision rather than a
  guess. This is the only place in the game the player picks a weapon out of a run, and today it
  reads like a settings list.
- **"Dash" under the heading "DASH" is confusing.** The group is the dashboard; the row is its
  plate style. Rename the row (*Plate*? *Fascia*?) or the group (*Cockpit*).
- **"Nothing" as the first hanging option** should read as an empty state: a tile with an empty
  hook. As a word chip it sits among wares as though it were one.
- **Phone (844×390):** it is two columns, LOADOUT | DASH, one option visible per row, with no row
  labels and no keeper. **Bring the row labels back** as small caps above each carousel, since
  there is room above each, and show a page dot strip under each one (● ○ ○ ○ ◌) so the player knows
  there are five guns and one is locked. "A fire wheel on a tether — from the Fir…" truncates. Let
  it wrap to two lines or move it to the focus card.

## 3. Paint & Parts

This is the tab where the picture matters most, and it is the one with the least picture.

- **Get the camera close.** Wheels, door art and colour are all *on the side of the ship*. Paint &
  Parts is where the ship should fill the stage side-on, so a rim is 60–80 px across and not 20.
  At today's framing, *Gold snowflakes* versus *Whitewalls* cannot be told apart on a 1280×720
  screen at arm's length.
- **Colour and tone are swatches, not words.** *Factory* is a 560 px wide pill with one word in it.
  Colour should be a row of paint chips (round swatches in the actual livery colours), and tone a
  three-step light-to-dark ramp of the chosen colour. Both are visual choices and both are set as
  text.
- **"Choose a colour first: the factory's paint has its own tone"** is correct, and at 844×390 it
  is the only thing left of the tone row: a row of nothing between two dim arrows. Hide the tone
  row until a colour is chosen, or show the three tones dimmed with that line in the focus card.
- **Single-option rows** (*Flame: Standard*, *Colour: Factory* for most ships) stretch a lone chip
  across the plate with ‹ › arrows that go nowhere. One option is a statement, not a choice. Show it
  as a tile with a *"More at Cosmo's →"* link tile beside it, which is also the honest way to show
  the cross-sell the hint line is doing in prose.
- **Art and livery want thumbnails**: a small side-on render of the ship's door with that art. The
  bake can draw a ship into any box (`drawPlayerShip`). A 96×48 thumbnail per option is the same
  call at a smaller box, and the cost should be measured before anyone commits to it.
- **Bugs in the picture:** at 667×375, *Gold snowflakes* overflows its pill and the › arrow sits
  on top of the text. At 844×390 and 667×375 the PARTS and PAINT columns drop their row labels, so
  *Standard* and *Factory* are unlabelled words.

## 4. Cosmo's Cosmetics

- **The store has no merchandise.** Wares need **tiles with art**: the dangle drawn large, a rim
  as a wheel, a flame as a flame, with the name and price under it. Cosmo's counter is right there
  on the stage. Put the focused ware *on the counter*, large and slowly turning, while the ship
  beyond wears it. That is where the 0523 try-on becomes a moment instead of a 12 px dangle under a
  HUD strip.
- **Make the aisle model honest.** Either:
  - **(a) Tabs inside the shop.** Hanging | Wheels | Flames as sub-tabs, one shelf shown at a time
    as a grid of tiles, the same on desktop and phone. This grows to ten categories as a scrolling
    tab strip. It matches the player's 2026-10-05 note *"it'll need space to grow"*, and it is how
    every live-service store solves it.
  - **(b) Every shelf is visible and reachable.** Drop the aisle row on desktop, let the cursor walk
    down through every shelf, and keep the aisle row only where one shelf fits (phone).
  (a) is the recommendation: (b) puts the desktop and phone on different navigation models, which
  is what is wrong today.
- **A shelf with one ware in it** (*Wheels*, *Flames*) is a 180 px pill and 600 px of empty row with
  a live › arrow pointing at nothing. As a grid, one tile is fine. As a carousel row, it looks broken.
- **The arrival line.** Cosmo greets the player on arrival (*"Welcome back — fresh stock on the
  Wheels shelf"*) and only comments on ownership once the cursor is on a ware. Write a small pool
  of lines per state (arrival, browsing, can't afford, bought, everything owned, nothing new) so a
  regular visitor doesn't hear the same sentence each time. Name the arrival state on Cosmo's row;
  don't derive it from whatever ware sits in the window.
- **Buying.**
  - A **hold-to-buy** (≈0.6 s ring fill on the button, or hold A) or a one-step confirm sheet that
    shows the tile, the price and *balance after*. Shards are earned over whole runs, and one
    misclick should not spend a third of them.
  - **The payoff:** a chime, the balance counting down, the tile flipping to *Owned*, Cosmo's line,
    a sparkle on the ship. Not verified in motion here, because only stills were taken.
  - **Then offer *Fit it now*** as the primary button instead of sending the player to another tab
    with "Yours — fit it in Paint & Parts". If the ware fits the current ship, equip it in place.
  - **Owned wares stay visible, with an Owned badge**, sorted after unowned ones. A shop that is all
    "· yours" should say so: *"You've cleaned me out. More coming."*
- **"Fit it in Hangin' Out" versus "hang it in the hangar"** both appear for the eucalyptus tree,
  one in Cosmo's line and one in the hint. Pick one name for the place.
- **Phone (667×375):** the shards pill, Cosmo's truncated line, the pilot band, the aisle, one
  shelf and Buy | Back all fit, and the wares wrap to two lines. "Family photo · 250 ✦" breaks
  after "250" with the ✦ alone on line two. Put the price on its own line under the name on every
  tile and the break goes away.

---

## 5. Mobile — what to do differently, not just smaller

- **Touch targets.** The tab strip is **31 px tall at 844×390** and 27 px at 480×320 (measured CSS
  px). Apple's and Google's floors are 44 pt and 48 dp. The ‹ › arrows are smaller still. On touch,
  swipe on a carousel row should step it, and the arrows become indicators.
- **Measured small text:** the readout's counts at **9.6 px**, the pronouns line at 10.9 px and
  the shards label at 12 px on an 844×390 phone. On a physical phone at arm's length, 9.6 CSS px is
  unreadable.
- **480×320 has no stage at all** (no ship, no keeper, no balance). Rather than dropping the
  picture, swap the split: a short ship strip across the top (the pad at a third of the height) and
  the plate below in a single column. The ship is the point of these screens on every device.
- **Safe areas.** A landscape phone with a notch or Dynamic Island loses about 44 px on one side.
  The plate runs to the right edge and the shards pill to the left. Check `env(safe-area-inset-*)`
  on a real device, since it was not testable here.
- **Portrait.** The game is landscape-only, which is fine for flying. A *shop* is a natural portrait
  screen, though. It is worth asking whether the hangar family could be the one place portrait is
  allowed (ship on top, plate below), since players often browse a store one-handed. That is a
  product call; nothing here assumes it.
- **Truncation.** The pilot summary line ("Backspin Bo · The Firebird · Catherine wheel") is cut at
  every size below 1920. The keeper's line is cut at 667×375. Let lines wrap, or shorten them on
  purpose for narrow screens; an ellipsis should never be the layout.

## 6. Desktop — what to do with the room

- **Scale the UI with the viewport** (§1.2), and on ultrawide **give the extra width to the stage**.
- **Mouse hover** should preview, the same way the cursor does, and a click should commit. A wheel
  scroll over a carousel row should step it. Hover states were not visible in the stills, so this is
  owed a check.
- **Keyboard:** Q/E or 1/2/3 for the tabs, Esc for back, and Enter/Space to buy, with the glyph bar
  showing them.
- **The empty bottom of the plate** is where the focus card goes (§1.2).

## 7. Feel — owed a look in motion

These could not be judged from stills and are listed so they are not forgotten:

- the tab change: a cut, a fade or a camera move;
- the sound per action (cursor move, equip, locked refuse, tab, buy, can't afford);
- whether the ship reacts to a fit: a hop on the pad, a rev of the flame, a spin of the wheels;
- the dangle's swing when a new one is hung;
- the balance counting on a purchase;
- the haptics on a pad and on a phone.

A garage lives on these. A fit that lands with a *clunk* and a ship that bobs on its pad feels like
a fit; a pill changing colour does not.

---

## Suggested order, if this becomes a plan

Grouped by what it unblocks, not by size, and each item needs its own pressure-test:

1. **The state language and the cursor model** (§1.3, §1.4): locked items focusable, one cursor
   look, arrive on content, browse-versus-equip decided. Everything after this uses them.
2. **The plate scales and gets its focus card** (§1.2), with the balance moved to it (§1.5). This
   fixes the empty-plate, tiny-hint and truncation problems on every tab at once.
3. **The cameras** (§1.1): per-tab stands, the ship big, the keeper on the edge, the readout on the
   pad. The bake cost is measured under the suite before any number is chosen.
4. **Cosmo's as tiles and sub-tabs** (§4), with the buy ceremony and *Fit it now*.
5. **Paint & Parts swatches and thumbnails** (§3).
6. **The phone pass** (§5): targets, small type, the 480×320 layout, safe areas, labels back.
7. **Feel** (§7), after a motion look.

## The answers

Given 2026-10-07, the same day:

| question | answer |
|---|---|
| browse-then-confirm, or fit-on-move made safe (§1.4)? | **fit-on-move made safe** — *"seeing how it immediately looks is good, but it shouldn't auto-equip when scrolling menus"*: the cursor puts the option on the ship, and only a confirm fits it |
| sub-tabs inside Cosmo's, or every shelf reachable (§4)? | **sub-tabs** — *"as we'll be expanding the range"* |
| hold-to-buy or a confirm sheet (§4)? | **a confirm sheet** |
| is portrait allowed in the hangar family (§5)? | **yes** |
| what is the "Dash" row's group called (§2)? | **Cockpit** |

And one more ask with them:

> *"the bio's for the pilots need to get rewritten to be more piloty and less golfy - the same flavour
> can run through them, but the current bios make no sense for a space shooting pilot."*

Then: *"crank out all the changes in the report, they all sound excellent. Go full auto with them."*

## The queue

Each a PR from `main`, one open at a time, each with its decision, photographed with
`scripts/shot-menus.mjs` before it is handed over:

1. **The bios fly.** Every pilot's bio rewritten as a pilot's, the flavour kept.
2. **The states and the cursor.** One cursor look; equipped, owned, locked, new as forms; locked
   options reachable with their unlock line; the cursor previews and a confirm fits, leaving a row
   puts the fitted one back; arrival on content; the pilot band off the path on the two fitting
   tabs; *Cockpit*; *Nothing* as an empty hook.
3. **The plate grows and gets its card.** Type from the short side, the focus card at its foot, the
   balance beside the actions with the after-purchase balance, the glyph bar.
4. **The cameras.** A stand per tab, the ship large, the keeper at the edge with their line by the
   booth, the readout on the pad, the light on the ship.
5. **Cosmo's sells pictures.** Sub-tabs, tiles with art, the ware on the counter, the confirm sheet,
   *Fit it now*, a pool of lines per state.
6. **Paint & Parts in swatches.** Colour and tone as swatches, art and livery as thumbnails, tone
   hidden until it can be chosen, a lone option as a tile.
7. **The phone pass and portrait.** Targets, type, the 480×320 layout, safe areas, labels back,
   no ellipsis as layout; and the hangar family laid out in portrait.
8. **Feel.** Sounds per action, the ship answering a fit, the balance counting — after a look in
   motion.
