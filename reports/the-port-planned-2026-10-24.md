# The port, planned — 2026-10-24

**A plan for every recommendation in [the port is a cutout](the-port-is-a-cutout-2026-10-24.md),
written to be handed to an implementer with no other context.** The review holds the diagnosis and
the pictures; this file holds the queue, what each item draws and where, what it costs, what guards
it, and how it is photographed. The player's answers are given (*"Agree with the suggested
answers"*): the station outside is a ship, the Viper's pad is violet, the intro's camera pushes in,
and a foreground rail crosses the dock's foot clear of the plate. Each item becomes its own PR with
its own decision; this file is not edited once the work starts.

## Read first, in this order

1. `docs/machine.md` if it exists (gitignored).
2. `CLAUDE.md` — above all: the frame loop allocates nothing and art is baked to bitmaps and
   blitted ([0022](../docs/decisions/0022-frame-rate-is-a-feature.md),
   [0025](../docs/decisions/0025-the-frame-budget-is-counted-not-timed.md)); a hub enumerates kinds
   ([0016](../docs/decisions/0016-a-hub-enumerates-kinds.md)); randomness is a seeded stream per
   concern ([0021](../docs/decisions/0021-one-stream-per-concern.md)); measure the picture
   ([0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)); a branch starts at `main`
   and the next waits ([0033](../docs/decisions/0033-a-branch-starts-at-main.md)); a guard is seen
   to fail ([0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md)); source is written with
   an editor ([0200](../docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md)).
3. `docs/game.md` — *The way in*, and *Voice* (a word on a wall is a word nobody asked for: the
   bar's neon is a parrot, not a name, for that reason).
4. [the port is a cutout](the-port-is-a-cutout-2026-10-24.md), then the decisions that built what is
   there: [0411](../docs/decisions/0411-the-chase-begins-at-the-port.md) (the room),
   [0414](../docs/decisions/0414-the-chase-is-a-chase.md) and
   [0416](../docs/decisions/0416-the-viper-has-a-pilot.md) (the chase and its zoom),
   [0444](../docs/decisions/0444-the-intro-is-the-pilots.md) (the tilt out of the bay),
   [0540](../docs/decisions/0540-the-hangar-is-the-port.md) and
   [0548](../docs/decisions/0548-the-hangar-holds-still.md) (the stand, pure in its clock),
   [0571](../docs/decisions/0571-the-dock.md) and [0572](../docs/decisions/0572-the-dock-is-dressed.md)
   (the dock), [0628](../docs/decisions/0628-the-monitor-hangs-on-a-wall.md) (the workshop),
   [0470](../docs/decisions/0470-the-light-is-additive.md) (how light is added to the frame),
   [0417](../docs/decisions/0417-a-place-is-baked-by-its-name.md) (the sky through the bay).
5. The code: `src/content/port.ts` (`PORT_KINDS`, `PORT_EXTENT`, `PORT_INK`, `STAGE`, `DOCK`,
   `BEATS`, `OUTSIDE`, `OUTSIDE_ZOOM`, `VIPER`), `src/render/port-bake.ts` (`bakePort`,
   `paintPiece`, every `paint*`), `src/render/port.ts` (`paintPort`, `paintHangar`, `paintOutside`,
   `paintStand`, `paintRoom`, `put`, `putOut`, `standViewInto`, `fitStand`), `src/render/canvas.ts`
   (the blit verbs; `light` sets `lighter`), and where they are driven: `src/app/frame.ts` (the
   `paintPort` and `paintStand` calls, about line 3306) and `src/app/mount.ts` (`barFor` about line
   1036, `standViewInto` about lines 1665 and 1788).
6. `.claude/skills/ship/SKILL.md` — the merge ritual.

## The pipeline's terms, which every item keeps

- **A piece is a kind.** `PORT_KINDS` is a closed list; `paintPiece`'s `switch` has a `never` arm;
  `PORT_EXTENT` gives each its box in world units; `bakePort` bakes each once per palette at the
  camera's pixels per unit. A new thing to draw is a new kind, and a variant is a kind per variant.
- **Nothing allocates in the frame.** `paintPort` and `paintStand` are on `tests/budget.test.ts`'s
  hot list: loops over constant tables, blits only. Anything that moves is a pure function of the
  clock `t` (`src/render/port.ts`'s header says why), with any per-frame scratch preallocated at
  module load under `// @setup:`.
- **Light is added.** `canvas.ts` blits `lighter` when asked (`light`); `put` and `putOut` in
  `port.ts` do not pass it today. Item 2 adds a `putLit` beside them.
- **Randomness is seeded.** A per-tile pick comes from `makeRng('port').stream('<concern>')` as
  the station's windows already do, so the room is the same room every visit.
- **The cost is measured, not guessed.** The atlas's byte size before and after
  (`bakePort`'s canvases; the intro's was 10.7 MB at 720p and 29.7 MB at the cap when
  [the menus are a place](the-menus-are-a-place-2026-10-05.md) measured it), the bake time under
  the suite ([0245](../docs/decisions/0245-a-budget-is-sized-under-load.md)), and the blits per
  frame `tests/budget.test.ts` counts. Each decision writes the numbers.
- **Photographed before handover.** `npx vite build`; `node scripts/shot-menus.mjs` and
  `--sizes=guard` for the dock; the intro at its beats with the instrument item 1 lands.
- **Nothing here touches the sim, a save or a shipped key.** No rollback note is owed by any item.
- **Consider the screen** ([0295](../docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md))
  applies to the stand as it does to a level: every new thing is argued per case for what it shares
  the frame with — the plate on the left, the cockpit monitor, the ship — and nothing here is a
  threshold.

---

## The queue

### 1. The station outside is a ship

`paintStation` in `src/render/port-bake.ts` (about line 1831) is redrawn, and the shot that
shows it (`paintOutside` in `src/render/port.ts`, about line 918) is dressed.

- **A silhouette first.** A hull — the Mothership of the fiction, since the clubhouse is aboard a
  ship — with the hangar's bay cut into its flank at the room's scale; a spine or a ring the bay
  hangs off; two or three modules of different size; a docking spar reaching toward the camera; an
  antenna cluster where the mast is. Readable at the 844×390 phone's size (about 170 px tall).
  `PORT_EXTENT.station` (110) may grow; `STATION_ACROSS`, `BAY_MOUTH_ALONG` and `BAY_MOUTH_ACROSS`
  (`port.ts` about lines 839–841) are where the ships leave the hull from — move the mouth and
  move them together, and the decision says the new numbers.
- **Windows in strips**, following the decks, a few dark, a few warmer, one wide lit pane where the
  bar is; panel lines that follow the hull; a few plates a shade lighter. The seeded stream stays
  (`makeRng('port').stream('windows')`).
- **Lit from the bay.** The bay mouth is the brightest thing on the hull: a warm spill round it, a
  floodlight or two over the door, the Viper's exhaust glow still on the sill, fading over the first
  second of the shot (a function of `s`). The top-to-bottom gradient becomes a rim light along the
  upper edge.
- **The planet, far behind.** The dock's `planet` kind (`DOCK.planetGrow` 0.45) is blitted small
  and far in this shot too, falling behind at a tenth of `OUTSIDE.station`'s rate, so the chase and
  Hangin' Out are one sky.

*Instrument:* land the review's scratch beat-shooter as `scripts/shot-intro.mjs` — build first,
seed as `shot-menus.mjs` does, press *Fly*, screenshot at a list of seconds, at the pair — so every
later item is photographed the same way. This PR owes it.
*Guard:* grep `tests/` for `station` first ([0417](../docs/decisions/0417-a-place-is-baked-by-its-name.md)
names an intro guard it did not write); a browser test that samples the chase shot at 13 s and
finds the hull's silhouette darker than the sky above it and the bay mouth brighter than the hull
beside it, in pixels. Seen to fail by a probe that flattens the mouth's light.
*Photograph:* 12.4 s, 13.5 s and 15 s at 1280×720 and 844×390.
*Decision:* amends 0411 (the station) and 0414 (the shot).

### 2. The light is cast

- **Lit tiles.** Kinds `wallLit` and `wallHalf` beside `wall`: the same tile with a brighter inset
  and a warm tint from `PORT_INK.lamp`. `paintRoom` (`port.ts` about line 590) and the dock's room
  loop in `paintStand` pick the tile per position by distance along from the nearest lamp
  (`STAGE.lamps`, `DOCK.lamps`) and by height (nearer the truss, brighter) — a pure function
  `tileLit(along, across): 0 | 1 | 2`, no frame cost beyond choosing an index.
- **Pools.** `lampPool` (an additive ellipse in the lamp's ink) under each lamp at `STAGE.deck`;
  `padPool` (the player's ink) under each pad and under the cradle, so the field lights the floor.
- **Up-light on the ship.** `padLight`: a soft ellipse in the player's ink blitted `lighter` over
  the ship's lower half at the pad, after the hull and before the tubes, in the ship's frame at
  `HANGAR_SCALE`. Add `putLit` to `port.ts` beside `put`, passing `light` to the surface as
  [0470](../docs/decisions/0470-the-light-is-additive.md) does for a bolt.
- **Occlusion.** One strip sprite, a vertical gradient from the void at half alpha to nothing,
  blitted (stretched by `grow`) at the wall's foot, under the catwalk, under the truss, and at the
  frame's two far corners. Three to five blits.
- **The bar warms its corner.** `spill` grows and a `spillWall` climbs the wall beside the door, so
  the room has a warm side and a cold side.

*Cost:* two tiles, five sprites; the atlas's bytes and the blits per frame written in the decision.
*Guard:* a browser test that reads the wall under a lamp and the wall between lamps at the stand
and finds the first brighter; `tests/budget.test.ts` unchanged in rule, re-run.
*Photograph:* the intro at 1.2 s and 6 s, the three tabs at the pair.
*Decision:* new, naming 0411 and 0571 as what it lights.

### 3. Big forms, and the deck as a floor

- **A bay door.** `bayDoor` top and bottom in place of `bayTop` and `bayBottom`: a heavy frame with
  the hazard stripe on its lip, a track along the deck, a warning lamp that turns (alpha on the
  clock). In the dock too, where the cyan line and the hazard stubs become its track and frame.
- **A crane.** `rail` under the truss over the pilot's pad and `hook` hanging from it, swinging a
  few degrees on the clock (`put`'s `turn`).
- **A bulkhead door with a wheel** in the back wall between the bar and the viewport (a new entry in
  `STAGE`), a numbered bay sign (`sign02`: a numeral, on the voice rule), a coiled `hose` and two
  `crates` on the deck by the Viper's pad.
- **Tile variants.** `wallVent`, `wallPatch`, `wallConduit` beside `wall`, picked per tile from
  `makeRng('port').stream('tiles')` so the grid stops repeating; the truss as one `trussSpan` with
  `trussBrace` between, rather than eight Vs.
- **The deck.** `deckLip` along the front edge (a darker band, a hazard stripe, a shadow under it);
  `grating` under the pads; `padReflection` (the beam's rings flipped and faded, below the pad
  line); `scorch` under the Viper's pad fading in from `BEATS.viperGo + 30`; tyre marks on the
  car's pad; an oil stain; tape.

*Cost:* about twelve kinds; the variants are tile-sized and cheap, the door and the span are the
large ones. Measured.
*Guard:* a style of the picture: a browser test that the room at the stand is not periodic at the
tile's pitch (sample a row of tiles and find two that differ), seen to fail by a probe that pins
every tile to `wall`.
*Photograph:* the intro at 1.2 s and 6 s, the three tabs at the pair and the guard's six.
*Decision:* new, amending 0571's room.

### 4. The intro's staging

- **The Viper's pad is hers.** `padViper` in the Viper's violet (`VIPER` in `src/content/port.ts`
  holds her inks), a `crest` on the wall above it (the Coil's — keep it a mark, not a word), and a
  chain or cage that drops as she lights (`BEATS.viperLit` to `viperLift`).
- **The alarm sweeps.** `alarmWash`: an additive red wash blitted along the wall and the deck,
  moving once a turn on `ALARM_PERIOD`, in place of the two dots brightening (the beacons stay as
  the source).
- **The field ripples.** `field` drawn twice, offset by a unit, for twelve steps after each ship's
  `along` crosses `STAGE.bay`.
- **The camera pushes in.** The intro's view is the shell's plain `view` (`src/app/mount.ts`,
  `measure()`); add `introViewInto(base, t, width, height, out)` beside `standViewInto` in
  `src/render/port.ts` that eases the zoom from 1.0 to about 1.08 between `BEATS.fadeIn` and
  `BEATS.cut` about the room's middle, into a preallocated `View`, called from the shell where the
  intro's view is set each frame. Pure in `t`.
- **Fill the strip.** `barFor` (`mount.ts` about line 1036) keeps a bar at the top for the HUD on a
  desktop and the intro and the music room play under it, letterboxed; the stand sets
  `barAcross = 0` and fills the frame. The intro's and the music room's views take no bar: the
  strip is empty while they are up.

*Guard:* `tests/intro.browser.test.ts` — a pixel in the top band during the room shot is the room,
not the void; the Viper's pad's light is violet and the pilot's cyan, in pixels.
*Photograph:* 0.4 s, 1.2 s, 2.6 s, 3.4 s, 6 s and 10.3 s at the pair.
*Decision:* amends 0416 (her pad), 0414 (the camera) and
[0439](../docs/decisions/0439-the-top-is-one-strip.md) (the bar during the intro).

### 5. Depth and life

- **A middle plane past the bay.** `spar`: the station's own structure continuing past the bay (a
  lit module, an arm), blitted at three times the sky's drift; `shuttle`: a far ship crossing the
  bay once a minute on the stand and once in the intro's held shot.
- **A foreground plane.** `rail` at the frame's bottom, clear of the plate (the plate stands left:
  the rail runs from its edge rightward along the deck's lip, under the cradle's line), at 1.1× the
  room's scale, blitted last, after the ship; the cockpit monitor and the dash stay clear of it —
  consider the screen per size, and say in the decision what the rail covers at 1280×720, 844×390
  and 480×320. The planes move at their own rates when the stand's camera moves (the dolly,
  [the menus, planned](the-menus-planned-2026-10-24.md) item 8), each `put` offset by its rate.
- **Life**, each a pure function of the clock: a lamp's flicker (alpha from an inline hash of the
  step, no allocation); `steam` puffing at a vent on a seeded timer; `sparks` at Unity's bench
  while Unity is at it (their spot is in `KEEPERS`, [0611](../docs/decisions/0611-the-keepers-stand-somewhere.md));
  the neon parrot's buzz (one frame in sixty at half alpha — the bar is one sprite, so bake
  `barDark` or a `neon` overlay); the string lights twinkling; a `fan` turning; the beacon as a
  turning `beaconCone` rather than a dot; a `drone` crossing the truss once a minute.

*Cost:* each one or two sprites and a few blits; the blit count is the number to write.
*Guard:* `tests/budget.test.ts`; `tests/hangar.browser.test.ts`'s `samePhase` sampling must still
hold — everything here is periodic in the bob's period or slower, or the guard samples with it off;
say which in the decision.
*Photograph:* a clip of the stand, and the intro at 1.2 s and 6 s.
*Decision:* new, amending 0548 (what idles on the stand).

### 6. The dock dressed as a place, and the polish

- **Three shops of three shapes.** `paintBench` (Unity: a workshop with a roller door and a hoist),
  `paintBooth` (MMXXVI: a spray booth with an extractor hood and the drips), `paintStall` (Cosmo: a
  lit glass display counter) redrawn at their own extents — `PORT_EXTENT.bench`, `.booth` and
  `.stall` are each their own number ([0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md))
  — and staggered a little in depth (`DOCK.shops` gains a per-shop grow and across offset) so one
  overlaps the next.
- **A wide screen's right side.** `dockArm` past the bay reaching out, with a lit end, inside
  `STAND_SKY`; the planet stays far.
- **A neon that is a picture, not a word.** Over the mezzanine, a neon pictogram (a wrench and a
  star, or the parrot's cousin), on the voice rule.
- **Polish on every tile**: rivet highlights (a light pixel above, a dark below), seam shadows, a
  grime gradient at the deck's foot, scuffs on the deck, one dented panel.

*Guard:* the keepers' spot guards ([0611](../docs/decisions/0611-the-keepers-stand-somewhere.md))
re-pointed at the new counters' boxes; the 0554–0556 keeper art guards unchanged.
*Photograph:* the three tabs at the pair, the guard's six, 1920×1080 and 2560×1080.
*Decision:* amends 0550 and 0572.

---

## Order, and why

1. **The station outside** — one sprite, the worst picture, the first impression, and it lands
   the intro's instrument.
2. **The light** — the room stops being flat, and every later piece is drawn into a lit room.
3. **Big forms and the deck** — the grid stops being the picture.
4. **The intro's staging** — the intro is where 2 and 3 are first seen; the push-in and the strip
   are the two changes that are not sprites.
5. **Depth and life**, with the menus plan's dolly after it.
6. **The dock's shops and the polish.**

The menus plan's item 8 (a stand per tab) waits for 1–3 here, on the player's answer.

## Owed, once it is all in

A look in motion at the shipped camera on a desktop and a phone; the atlas's byte size and the
bake time at each step written in its decision; and a photograph set beside the review's, so the
next pass on the port starts from a picture.
