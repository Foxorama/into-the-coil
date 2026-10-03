# The chrome and the ships, reviewed — 2026-10-03

**A design pass over the way in, the in-game chrome on a phone, and the four ships**, asked for as:

> *"Do a deep dive analysis on the buttons icons, displays, huds etc, initial menu -> things like
> having the pilots to select from, but then have to click on an secondary launch button, surely we can
> have the pilot and then an info box with some background and stuff and then you click, tap on the
> pilot to select them and launch? unsure if that's good/bad on a mobile though. but the hud and side
> buttons are too big on mobile it looks weird. the individual spaceship design could be a lot better as
> well - the wingtips on the Huang-woo spaceship still look weird, the firebird has gone too far away
> from the black and gold trans am, the ray gun on the lil caddie looks pretty terrible and needs to be
> scrapped and restarted."*

Looked at on `main` at `85a6432` (0463 merged), from the built page, at 1280×720 and three touch
shapes — 844×390, 812×375 and 480×320 at a device scale of 2 — with every box measured off the DOM
and the ships photographed off the sheet at eight times
([0193](../docs/decisions/0193-the-sheet-is-the-instrument.md)) and on the field at the shipped
camera ([0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)). **A queue, and the
answers it needs**; each change's decision holds what it decided once it lands. Nothing here is
built.

## 1 — The way in: the pilot is asked twice, and never introduced

### What is there

```
boot:   splash → CHOOSE YOUR PILOT (four cards; the press is the sound's)
        → the intro, 16 s, Skip
        → the title: difficulty band · pilot band (already set to the pick) · LAUNCH · Settings
after:  the title → LAUNCH
```

- **The pilot is chosen twice on the first visit.** The boot's cards choose a golfer, and the title
  then shows the same golfer on a band of faces beside a Launch button. The second asking is the one
  that starts the run. The band came from [0458](../docs/decisions/0458-the-title-is-rows.md) and did
  what it was asked — *"the pilots could be smaller with profile pics"* — and the report is right that
  the result is a choice, a screen, and then the same choice again next to the real button.
- **Nothing anywhere says who a pilot is.** A card is a face, a name, and *Little Green Caddie · Ray*.
  The row in `src/content/golfers.ts` already holds a home, pronouns, a voice and ten lines of
  dialogue, and each golfer's one-line biography is there too — as a code comment nobody can see
  (*"Reads wind off kites over the Ngong Hills, a feather in her cap"*). The ship is never shown on
  either screen: the one picture that would say what the choice means is on the sheet at eight times
  and on the field at 85 pixels.
- **The band's faces are too small to carry anything.** 2.1–2.8 rem on a phone, 3.5 rem on a
  desktop; room for a face and a ring and nothing else, which is why the information lives nowhere.
- **The boot cards wrap unevenly on a phone.** At 844×390 *Huang-Woo Hook* breaks onto two lines and
  two of the four hints break onto two, so the four cards' baselines sit at three heights.
- **The desktop boot screen is three quarters void**: four cards 222 px tall in 720, nothing above
  or below them. There is room for the information.

### The design: one pilot screen, where a press on a pilot is the launch

**One screen does both jobs** — the boot's, where the first press turns the sound on, and the
title's, where a run is started — because they are the same decision made in the same place.

```
  INTO THE COIL                      ┌─ Feather Fade · she/her · Nairobi ───────────┐
                                     │  [portrait]  Reads wind off kites over the   │
  HIGH SCORES                        │              Ngong Hills; a controlled fade  │
  1. 900000 Feather                  │              on every shot.                  │
  2. 826877 Huang-Woo                │  [the Little Green Caddie, drawn at 3–4×]    │
  3. 753754 Longshot                 │  RAY  one ring a volley; bursts where it     │
  4. 680631 Backspin                 │       lands                                  │
  5. 607508 Feather                  │  SPECIAL  nova ring                          │
                                     │  ‹ Legendary · SAVIOR · Burn ›               │
  (●)  (●)  (●)  (●)   …             │  [ FLY AS FEATHER ]                          │
  Feather  Woo  Larry  Bo            └──────────────────────────────────────────────┘
                                                                        [ Settings ]
```

- **The roster is a strip of portrait cards** (a face and a name), the same strip at four pilots or
  sixteen — `docs/game.md`'s unlock pool is nine caddies, three golfers and new faces. Past what
  fits it scrolls, as the band does today ([0460](../docs/decisions/0460-the-title-fits-without-a-table.md)).
- **The panel is the highlighted pilot**: name, pronouns, home, the biography (moved from the comment
  onto the row as `bio`, one table edit), their ship at three or four times the field's size — the
  sheet's own bake, so it is the ship the run draws — the gun's name and one line, the special's name,
  and the difficulty band. Every line is read off a row (`GOLFERS`, `SHIPS`, `WEAPONS`,
  `SPECIALS`), so a fifth pilot is a row and the panel knows them.
- **Highlighting and launching are two different gestures, and which gesture is which depends on the
  device.** This is the answer to *"unsure if that's good/bad on a mobile"*:

  | device | highlight (fills the panel) | launch |
  |---|---|---|
  | mouse | hover, or a click on a card | a click on the highlighted card, or **Fly** |
  | pad / keyboard | the cursor on a card | **A** / Enter on it |
  | thumb | the **first tap** on a card | a **second tap** on the same card, or **Fly** |

  A single tap that launches is bad on a phone: a thumb lands on the edge of what it aims at
  ([0358](../docs/decisions/0358-a-trigger-is-a-button.md)), and until the pause lands
  ([the menus queue](the-menus-reviewed-2026-10-02.md), item 3) a mis-launched run can only be left
  by dying. *Tap to see, tap again to fly* is the standard shape of this control on a phone, and the
  panel's button says it under the thumb. On a desktop and a pad it is **one press** for a returning
  player, because the card they flew last is already highlighted; on a phone it is one tap after a
  run and two the first time.
- **Difficulty rides the panel**, because it is a run choice and belongs beside the thing that starts
  the run. It defaults to Savior and is kept once settings persist (the menus queue, item 2).
- **The title keeps the badge, the name, the top five and Settings.** The pilot band and the Launch
  button go; the boot's card screen goes; `Choose your pilot` is this screen's heading at boot and
  the pilot's name is its heading after.

**The one thing this changes that is not chrome.** At boot the press on a pilot is today the
sound's press ([0415](../docs/decisions/0415-the-golfer-is-chosen.md)) — *the sound's press* below
says why that duty moves to the splash — and plays the intro
([0411](../docs/decisions/0411-the-chase-begins-at-the-port.md)), which ends at the title. If the
press is also the launch, the intro has to end in the run: the chase already flies the first level's
sky at its own rate ([0416](../docs/decisions/0416-the-viper-has-a-pilot.md)), so the picture is
continuous, but 0411's *"the title comes up when they are gone"* becomes *"the level opens when they
are gone"*, and Skip skips into level one. That is the first question at the foot of this file.

**Cost.** One PR, the largest in this file: the screen, its rows for the pad walk, the layout guard
on the six devices with a full table and an empty one, and the pad walk re-run and recorded as 0458's
was. A design pass first: the panel photographed at 1280×720 and 844×390 before the pilot band is
touched.

## 2 — The chrome on a phone is sized by the width, and a phone has the width

### Measured

| camera | top strip | of the height | readout font | disc | the three discs' column | of the height |
|---|---|---|---|---|---|---|
| 1280×720 | 64 px | **8.9 %** | 20.8 px | — | — | — |
| 844×390 touch | 63 px | **16.2 %** | 20.3 px | 66 px | 237 px | **61 %** |
| 812×375 touch | 60 px | 16.0 % | 19.5 px | 64 px | 229 px | 61 % |
| 480×320 touch | 47 px | 14.7 % | 15.2 px | 54 px | 194 px | 61 % |

- **The readout's type is `clamp(0.95rem, 2.4vw, 1.3rem)`**
  ([0361](../docs/decisions/0361-the-readout-is-read-at-arms-length.md)), so an 844-wide phone gets
  the 1280-wide desktop's font to within half a pixel — on a screen half as tall. The strip is one
  height in ems ([0439](../docs/decisions/0439-the-top-is-one-strip.md)), so it is the desktop's strip
  on the phone, and it is twice the share of the picture. The ship in the readout is 45 px tall on a
  390 px phone, nearly the ship on the field. **This is the bug
  [0049](../docs/decisions/0049-the-chrome-is-authored-against-the-short-axis.md) was written for** —
  *"every size on a screen is a fraction of that box"* — one screen over: the title and its
  sub-screens were brought under it and the playing strip never was. 0361 itself says the `2.4vw`
  arm *"has not been looked at with a thumb over it."*
- **The discs are 0.17 of the short edge** ([0358](../docs/decisions/0358-a-trigger-is-a-button.md)),
  sized when there were two of them; the ward made it three
  ([0447](../docs/decisions/0447-the-ward-is-a-third-trigger.md)), and three at 0.17 plus two gaps of
  0.05 is 61 % of the screen's height stacked up the **leading** edge — the edge every threat enters
  by ([0048](../docs/decisions/0048-a-threat-may-arrive-from-the-side.md)). In the 844×390 photograph
  the hostile shuriken pass behind the discs. 0358 said *"the size has been measured and not played
  … the first play on a phone says whether it is too small"*; the play says too big.

### The design

- **The playing strip is sized against the short axis, as every other screen is.** The readout's and
  the score's type become `clamp(<floor>, ~2.9cqh, 1.3rem)` on the host's own container, which
  leaves 1280×720 at the pixel it is now (2.9 % of 720 is 20.9) — the desktop is the target and
  does not move ([0153](../docs/decisions/0153-desktop-is-the-target.md)) — and brings the 844×390
  strip to about 10 % of the height. **The floor is the one number to play**: 0361 raised it to
  0.95 rem for a monitor read at arm's length; a phone is read at a hand's length and at a device
  scale of 2, so 0.75 rem (24 device pixels) is where to start, and the play says.
- **The discs come down to the thumb's floor and the gap with them**: 0.12 of the short edge (47 px
  on 390, above 0358's 44 px floor) and a gap of 0.035, which is a column of 44 % of the height
  where it is 61 %; the hit reach stays 1.3. The disc's glass drops from 55 % void to about 35 %, so
  a body under it is seen. One table (`TRIGGER_BUTTON`), because the picture and the hit test read
  it together ([0060](../docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md)).
- **A guard in the player's units**, in the layout suite: on every touch device in the list, the top
  strip is at most a tenth of the height and every disc is at least 44 px, and on 1280×720 the strip
  is what it is today to the pixel.

**Cost.** One small PR: two clamps, four numbers in a table, one guard with a probe. The two floors
are the player's to move after a play on a phone.

## 3 — The ships

The sheet at eight times is the ground truth for what follows; the field at 85 px per box is what
the player sees. Everything below is a taste in 0192's sense, which is why it is a plan and not a
guard.

### The fighter: the pods flare the wrong way

**The wingtip pods are trapezoids that are wider at the tip than at the root** — 0.82 of the radius
across at the outer edge against 0.40 where they meet the wing (`SHIP_POD_MK3`), with square
corners and the muzzle light in the back corner. At eight times they read as two flared bells hung
off the wings; at 85 px, as two flaps. That is the *weird*: a pod on a wingtip is a cigar — longest
along the line of flight, widest in its middle, tapering to both ends, with its light at the front
where a forward gun fires. [0449](../docs/decisions/0449-the-wings-are-trimmed.md) pulled the span in
and did not touch the shape.

**The design.** A pod 1.1 radii long and 0.34 wide at its waist, its nose ahead of the wing's leading
edge, its tail tapering behind the trailing edge, the glow at the nose, shaded along its length as the
pods already are ([0463](../docs/decisions/0463-the-ships-are-cooler.md)). The span falls from 1.31
radii to about 1.12 for free, which is the direction 0449 was asked for. The tubes at the pod roots
(`TUBES_ON.fighter`) and the canards are unchanged. One PR, art only; `tests/accents.test.ts` holds
the marks, and the sheet and the field are photographed before and after.

### The Firebird: it is a blue-and-gold car, and the Trans Am is a black car with gold edges

What the sheet shows at eight times, against the reference the ask names (the 1977 Trans Am SE: jet
black lacquer, **gold pinstriping along every body line**, gold snowflake wheels, gold glass, a gold
shaker scoop, the gold bird on the hood):

| on the car now | why it reads wrong |
|---|---|
| the body is `space` mixed a fifth toward the player's cyan, lit +0.2 along the roof | it is navy, and the roof reads blue-grey; a black car on a navy void was lifted to be seen, and the lift is the wrong hue |
| the player's cyan is the beltline pinstripe | the Trans Am's pinstripe is gold; the one line that says *Trans Am* is in the wrong ink |
| the phoenix is gold with a tail in the shot's orange, the length of the flank | it is bigger than the car's door and it is two colours; the hood bird is gold and it is a decal, not a paint job |
| a chrome side pipe along the sill | the brightest band on the car, and not on the reference |
| a slate block on the hood with the star | a grey box; the reference's hood carries a shaker scoop |

**The design: black, read by its gold edges.** A black car on a dark void is not found by lifting the
black; it is found by what the Bandit was found by on the road at night, the gold lines round every
panel.

- **The body near black**, `space` lifted a tenth toward a warm grey (not toward cyan), with one warm
  highlight along the roof.
- **Every body line a gold pinstripe inside the outline**: the beltline, the rocker, both wheel
  arches, the ducktail, the nose — a stroke at the pinstripe width 0463 already uses, which clears
  the floor ([0106](../docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)).
- **The bird small, gold and in one colour**, on the front fender ahead of the door: a third of the
  flank at most, wings up, no orange.
- **The side pipe gone**; the gold rocker line takes its place.
- **The launcher as the shaker scoop**: black with a gold lip, the steel star set in its face. The
  blades leave from the same point (`FIREBIRD_STAR`), so the row's `muzzle` and
  `tests/mounts.test.ts` do not move ([0448](../docs/decisions/0448-each-ship-fires-from-its-own-guns.md)).
- **The player's cyan stays, as light and not as paint**
  ([0441](../docs/decisions/0441-a-pilot-flies-their-own-ship.md)): the T-top bar's glint and the
  headlamp, enough to find the ship and not enough to colour it. The neon stays off.
- **Gold wheels, gold glass, the gold turret bands** as they are.

One PR, art only, photographed at eight times and on the field; the HUD's checker plate
([0451](../docs/decisions/0451-the-readout-wears-the-ship.md)) is already black and gold and does not
move.

### The caddie's ray gun: three attempts have drawn a profile, and from above a profile is a stick

At the shipped camera the gun is about **13 px long and 5 px tall**: a grey wedge and a lavender dot.
At eight times it is a chrome stalk through two grey fins to a ball. 0461 drew a spool, 0463 turned
it round; each drew what a ray gun looks like **from the side** and laid it flat, and seen from above
the fins are a cone and the barrel is a line. The chrome has no contrast against the void, so the fins
vanish and the purple line is all that is left. The pods beside it, by contrast, read: they are
*wide* things with a light in them.

**Restart, as asked, and choose from a sheet rather than a fourth blind draw.** Three directions,
built side by side on `rig/sheet.html` and shown at one, four and eight times before any PR
(a driveable choice beats a PR cycle):

- **A — a turret set into the rim** (recommended): a round emitter housing half-sunk in the nose,
  chrome-ringed, the size of half the dome; a lavender lens with concentric rings glowing in it (the
  rings it fires); a short fat barrel, a quarter of the radius long and a fifth wide, to the orb.
  At 13 px it is *a glowing lens on the nose*, which is a thing that reads. The tip stays where the
  row's `muzzle` is.
- **B — two emitters on the shoulders**, at ±45° off the nose, stubby, each a smaller A; a volley
  leaves them in turn. Changes the muzzle, the mounts guard and the shot pattern, so it is a design
  change and not only art.
- **C — no gun; the nose rim is the lens**: the saucer's own rim glows lavender at the nose and the
  rings leave it. A saucer with nothing bolted on, which is the predecessor's *"they come in peace"*.

**Cost.** The sheet pass is an afternoon and no PR. The chosen one is one PR, art and (for B) the
caddie's row.

### The estate

Reads as what it is at eight times and on the field: the woody, the whitewalls, the rod. Nothing is
asked and nothing is proposed.

## Asked for after the review

> *"focus is on desktop with mobile as a secondary device - but people are playing on mobile so it
> needs to be good as well. the initial pilot selection is because the browser doesn't play sound
> until it's interacted with, so it's a way of triggering sound before intro movie, I'm open to any
> and all suggestions on how to make that better. additionally, the dice on the hud need to look a bit
> cooler, and they should start to sway on a forward burst or hard break, but it should trigger an
> uninterruptable sway, at the moment they jerk around all over the place because the player is
> constantly going back and forth."*

### The sound's press: the splash already is one, so the pilot screen need not be

A browser lets a page make sound only inside a gesture it heard — a key, a click or a tap; **a pad
button is not one** (`docs/state-of-play.md`, the pad's silent game). That is why the boot's card is a
press ([0415](../docs/decisions/0415-the-golfer-is-chosen.md)): the pick was the first gesture the
page could be sure of, and the intro after it is heard from its first frame.

But the page already has an earlier press. **The splash remembers one** — 0415 moved 0412's early
press onto it: a press on the splash is kept, and its sound comes on the moment the game behind it has
loaded. Today the splash does not wait for it; it leaves by itself when the load is done, so the
cards are the first screen that *must* be pressed. The suggestion:

- **The splash waits for a press**, and says so: the name, the sweeping line while it loads, and
  then *Press to begin* — a tap on a phone, any key on a desktop. It is the first screen of nearly
  every game for exactly this reason, and a player expects it. That press is the gesture; the sound
  comes on at once if the game has loaded and on the step it does if not, which is 0412's rule
  unchanged.
- **The pilot screen of §1 is then free of the duty.** Its press is the launch and nothing else, so
  the one screen serves boot and title identically, and the intro is heard because the splash was
  pressed before it, not because a card was.
- **The press count does not rise.** Today: the card, then Launch — two. Proposed: the splash, then
  Fly — two, and the second is the one the player wanted to make. After a run it is one.
- **A player who presses nothing** — the pad-only player — sits on the splash, which is the honest
  state: that player's page cannot make sound until a key or a tap, and a screen that waits says so
  where a silent run does not. The splash's hint names the key, so a pad player presses one once.

Three other ways round were weighed and are not proposed: an **attract mode** that plays the intro
silently on the splash and lets the press land anywhere in it (a second route into the intro to
keep working, and the player misses the first cues); **starting the sound on the title's Launch** and
playing the intro after it (the first-visit player would see the chase after choosing a difficulty,
which reads as the run starting twice); and **hoping for a stored gesture** across visits, which no
browser grants.

### The dice: they jerk because every reversal is a lurch and every lurch restarts the swing

Two causes, both in the code, and the second is the one that shows:

- **The frame fires on a reversal.** `stepJolt` (`src/app/frame.ts`) raises a jolt when the speed
  along the lane changes by 0.2 in a step *in a different direction from the last jolt*. A reversal
  changes it by 0.68, so a player going back and forth fires back, fore, back, fore, as fast as the
  stick turns — and the note beside it already says a stop on the heels of a push swings at once.
- **The chrome restarts the swing from zero.** `swayDice` (`src/app/chrome.ts`) removes the running
  class and adds the other, which starts the animation again at its first keyframe —
  `transform: none`. Dice at thirty degrees snap to straight and swing out again. **That snap is the
  jerk.**

**The design: one swing, started by a burst or a brake, and never interrupted.**

- **A lurch is a burst or a brake, not a flick.** The frame raises a jolt when the speed along the
  lane, in the camera's frame, *crosses* a mark: up past 0.6 of the ship's top speed from below (a
  burst — the dice swing back) or down past 0.2 from above 0.6 (a brake — forward). A stick wagged
  about the middle crosses neither; a full push from rest and a hard stop cross one each. The burn
  between places stays a burst, as 0461 made it.
- **A swing holds the floor until it has settled.** The chrome keeps the time its swing began and
  refuses any jolt until 1.8 s has passed — the swing's own length — so nothing can restart it
  mid-arc. Uninterruptable, as asked; the next lurch after it settles swings again.
- **The frame keeps the same mechanism**: an `onJolt` on the step, read by the chrome, nothing per
  frame ([0461](../docs/decisions/0461-the-ships-are-jazzed.md)'s argument). The holding-off is one
  timestamp in the chrome.

**Cooler.** The dice are two flat squares of the light ink with gradient pips, on two hairline
strands, at 1.1 em — a token at the shipped camera. Fuzzy dice are plush, and plush at 20 px is a
soft edge and a colour: each die drawn as a **cube seen from a corner** (a top face and a front face,
two tones of one colour, so it reads as a solid rather than a tile), **a fur halo** — a soft glow in
the die's own colour, a shade wider than the die, which is what *fuzzy* looks like small — and the
**pips embossed** (a dark pip with a light rim below it). The colour is the estate's: the die in the
gilt lifted toward white, the fur in the gilt, the pips in the void. The strands stay, slightly
thicker (0.1 em) so they survive the floor. Still CSS on the plate, still painted under the counts.

**Cost.** One small PR, art and two conditions; `tests/dice.test.ts` is re-pointed at the crossings
and gains *a second lurch inside a swing moves nothing* and *a stick wagged about the middle moves
nothing*, each seen red.

### The focus

Desktop is the target and the phone is a port that has to be good
([0153](../docs/decisions/0153-desktop-is-the-target.md)). Nothing in this file makes the desktop
smaller: §2 leaves 1280×720 at the pixel it is, and §1's one-press launch is a desktop improvement
first.

## The queue

One PR at a time, each from `main`, each photographed before it is handed over.

1. **BUILT — [0465](../docs/decisions/0465-the-chrome-fits-the-phone.md).** **The chrome on a phone** (§2) — the smallest, the clearest defect, and measured.
2. **BUILT — [0466](../docs/decisions/0466-the-dice-swing-once.md).** **The dice** — one swing per lurch, started by a burst or a brake; the cube and the fur. Asked for while it was built: *"the red dice need to be visible on ember nebula and the dark heart against those reddish backdrops"* — a light rim and a void halo, photographed in both.
3. **The ray gun's sheet of three** (§3) — no PR; a picture for the player to choose from, then its PR.
4. **The Firebird** (§3).
5. **The fighter's pods** (§3).
6. **The splash waits for a press, and the pilot screen launches** (§1 and above) — the largest, and
   it waits on the first answer below.

## The answers

Answered 2026-10-03.

| question | answer |
|---|---|
| the splash waits for *Press to begin*, and the boot's pilot screen goes? | **yes** — *"the splash waits for the press to begin, get rid of the dupe pilot screen"* |
| on the menu, does a press on a pilot load that pilot into the game? | **yes**, asked as *"or is that poor UX?"* — it is good UX on a desktop and a pad, where the panel fills on hover or the cursor and the press is deliberate; on a phone the first tap fills the panel and the second on the same card flies, because a thumb's first landing is not a decision |
| the ray gun | **A** — the turret set into the rim; the sheet of three is still shot first so A is chosen against B and C at the camera |
| the readout's floor on a phone | **yes** — 0.75 rem, played |
| the dice's marks and the hold | **yes** |
| the dice's colour | **the classic red fur** |
