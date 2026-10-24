# The port is a cutout — 2026-10-24

**A review of the spaceport as the player sees it: the intro's hangar, the chase's station outside,
and the dock behind Hangin' Out, Paint & Parts and Cosmo's**, asked for as:

> *"Also review the space station in hangin out and in the intro video and provide a report on how to
> make it look a lot cooler as well, cutouts very basic and it's pretty much the first thing a player
> see's in-game."*

It is a diagnosis and a list of recommendations, in the picture's terms
([0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)), and a cost beside each. Nothing
in it is built. Its sister is [the menus, reviewed again](the-menus-reviewed-again-2026-10-24.md),
written the same day from the same pictures.

## How it was looked at

- **Built from `main` at `82363bc`**, shot at 1280×720 and on an 844×390 touch context: the intro at
  nineteen moments from *Fly* to the title, and the dock on all three tabs at the layout guard's six
  sizes and at 1440×900, 1920×1080 and 2560×1080.
- **The painters read**: `paintPiece`, `paintStation`, `paintBar`, `paintCatwalk`, `paintCradle`,
  `paintPlanet`, `paintLift`, `paintViewport` in `src/render/port-bake.ts`; the composition in
  `paintRoom`, `paintHangar`, `paintOutside` and `paintStand` in `src/render/port.ts`; the tables
  `STAGE`, `DOCK`, `PORT_INK`, `BEATS` and `OUTSIDE_ZOOM` in `src/content/port.ts`.
- **Not checked:** motion. Every shot is a still, so the sky's drift through the bay, the planet's
  eight-minute pass, the bob, the beacon's sweep and the lift were read in the code and not seen. A
  clip would check them.

## What is there now

The whole port is drawn from one closed list of pieces (`PORT_KINDS`,
[0016](../docs/decisions/0016-a-hub-enumerates-kinds.md)), each baked once into an atlas at the
camera's resolution and blitted in world units on the frame loop's hot list — no allocation, blits
only ([0022](../docs/decisions/0022-frame-rate-is-a-feature.md)). That pipeline is sound and is not
what this report is about. What it draws is:

| piece | drawn as |
|---|---|
| the wall | one 20-unit tile: a flat panel, a lighter inset, a 0.5-unit dark seam top and left, a rivet dot at each corner, one conduit band across the lower third; every tile identical |
| the ceiling | one tile: two chords and a V brace, a lamp dot on the lower chord; every tile identical |
| the deck | one tile: a top-to-bottom gradient, a seam at the top, two leaning plank lines |
| the lamps | a hood, a bar of light, a flat cone (a linear gradient in a trapezoid) to the deck |
| the pads | a strip with hazard chevrons and two lights; a beam of fading rings above |
| the bay's edge | a bulkhead with a stripe, a scanned atmosphere field, two beacons |
| the bar | a plank facade, a lit shelf of five bottles, a neon parrot, string lights, a sliding door with a porthole |
| **the station outside** | **one trapezoid in a three-stop gradient, a 9×11-unit grid of 0.3-unit lines, random 1.6×0.9 window rectangles, a mast with a dish, a 10×28 bay mouth lit from inside, a red and a green running light** |
| the dock (0571, 0572) | the same wall, ceiling and deck tiles; a catwalk tile with a zig girder; three shopfronts of one size in a row; a lift shaft and car; a workshop wall with a pegboard and two benches; a cradle with two clamps and a field; a banded ringed planet and a cratered moon in the bay |

## Why it reads as a cutout

1. **One plane.** Everything in the room is on the wall's plane and the sky is directly behind the
   bay. There is no middle ground outside the bay (a gantry, a docking arm, traffic), no foreground
   (a rail, a hose, a crane hook nearer than the ship), and nothing overlaps anything. A room with
   one plane is a backdrop; the eye calls it a cutout because that is what it is.
2. **The light is painted on, not cast.** The lamp cone is a translucent trapezoid laid over the
   wall; the wall under it is the same colour as the wall beside it, the deck under it has no pool,
   and the ship on the pad is lit the same with or without a lamp over it. The pad's cyan field
   rises in rings and does not touch the ship's underside. The bar's spill lights the deck (one
   ellipse) and nothing else.
3. **The grid is the picture.** Twenty-unit tiles with a rivet at each corner, from floor to truss,
   wall to wall — thirty-two of them in the 1280×720 frame. Nothing is larger than a tile, so there
   is no scale: a hangar is read by its one big thing (a door, a crane, a span) and this room has
   none. The truss is the same V eight times.
4. **The deck is a darker wall.** A vertical gradient and two leaning lines per tile do not recede;
   there is no lip at the front, no grating, no reflection of the pad's light, no mark where a ship
   has stood. The shot's bottom fifth is the least convincing part of it.
5. **The exterior station is the weakest piece in the game**, and it is the establishing shot: the
   only time the player ever sees the place from outside, three seconds long (12.1 s to about 15 s),
   and at `OUTSIDE_ZOOM` 0.65 it fills seventy percent of the screen's height. It has no silhouette
   (a flat trapezoid), its windows are a random scatter of rectangles that read as a spreadsheet,
   its panel lines ignore its shape, and its bay mouth (10 × 28 units in a 110-unit flank) is not the
   room we just left (180 units long, a bay 85 units high). The gradient lights it from above while
   the hangar we were in was lit from inside. Nothing about it says *the Mothership* or
   *a clubhouse*; it says *building*.
6. **The room does nothing.** In eleven seconds of held shot the only motion is the two ships, the
   pilot, the door, a tenth-speed sky drift through the bay and the viewport, and two red dots that
   brighten and dim. No lamp flickers, no steam, no crew, no sparks, no hazard light turning, no
   fan, no neon buzz. A still room is a flat room: motion at different depths is what sells depth on
   one plane.
7. **Two identical pads.** The Viper's pad and the pilot's are the same strip with the same cyan
   light. Nothing marks hers as the prodigy's or the Coil's — no violet light, no crest on the wall,
   no cage — so the picture does not say who she is before she goes
   ([0416](../docs/decisions/0416-the-viper-has-a-pilot.md) gave her the livery and nothing else in
   the room answers it).
8. **The dock is dressed as a row of three boxes.** The mezzanine's shopfronts are one size, one
   shape and one height, side by side at equal spacing, which reads as a UI strip and not as three
   businesses that grew into a hangar. Right of the bay a 2560×1080 screen shows 45 % of its width
   as void with dots; the planet is the one object in it. The cyan vertical line at the bay's edge
   and the hazard-striped stubs top and bottom are not attached to anything the eye can name.
9. **A black bar across the top of the first thing the player sees.** At 1280×720 the intro, and
   the music room, play under the empty 75-px strip the HUD will later occupy
   ([0439](../docs/decisions/0439-the-top-is-one-strip.md)): the room is letterboxed under black
   while the title's sky and the dock both fill the frame. On the 844×390 phone the bar is not
   there.

## What a hangar looks like, and what this one is missing

The reference is the fiction's own: the clubhouse aboard the Mothership, a bay open to the stars on
one side and the Parrot's Perch on the other ([0411](../docs/decisions/0411-the-chase-begins-at-the-port.md)).
A hangar reads from five things, and the port has one and a half of them:

| what sells a hangar | here |
|---|---|
| one big form — a bay door, a crane, a span | none; the bay's edge is two bulkhead stubs |
| light with a source and a shadow | cones with no pool, a field with no up-light |
| three depths — far, the room, something nearer than the ship | the room and the stars |
| wear — scorch, oil, scuffs, tape, a dented panel | rivets |
| life — steam, sparks, a turning light, somebody working | the beacons, Unity leaning on a wrench (dock only) |

## Recommendations, in order of what each buys

Each is a change to the bake (`port-bake.ts`) or the composition (`port.ts`), on the pipeline's own
terms: a new piece is a kind in `PORT_KINDS` and a sprite in the atlas; a variant is a kind per
variant; anything that moves is a function of the clock and nothing else
([0548](../docs/decisions/0548-the-hangar-holds-still.md)); nothing allocates in the frame. The
atlas's size is the cost that is measured — the intro's was 10.7 MB at 720p and 29.7 MB at the cap
([the menus are a place](the-menus-are-a-place-2026-10-05.md)) — and the budget guard counts the
blits ([0025](../docs/decisions/0025-the-frame-budget-is-counted-not-timed.md)).

### A. Redraw the station outside (highest value, lowest cost: one sprite)

- **A silhouette first.** A central hull with the hangar's bay cut into its flank at the room's
  scale, a spine or ring the bay hangs off, two or three modules of different size, a docking spar
  reaching toward the camera, an antenna cluster where the mast is. The shape should be readable at
  the thumbnail the 844×390 phone gives it (about 170 px tall).
- **Windows in strips, not a scatter**: rows that follow the decks, a few dark, a few lit warmer,
  one big lit pane where the bar is. Panel lines that follow the hull's curve, a few plates a shade
  lighter.
- **Light it from the bay.** The bay mouth is the brightest thing on it: a warm spill on the hull
  round it, an exterior floodlight or two over the door, the Viper's exhaust glow still on the sill.
  The gradient becomes a rim light along the top edge from the planet or a star, not a top-to-bottom
  wash.
- **Tie it to the dock.** The ringed planet the dock hangs in the bay is in the same sky; put it
  behind the station in the chase shot, small and far, so the player who later opens Hangin' Out
  recognises the place.
- **Let it fall away with parallax**: the station at `OUTSIDE.station` already falls behind at one
  unit a step; a second far piece (the planet) at a tenth of that gives the shot depth for the cost
  of one blit.

### B. Cast the light (the biggest change to the room)

- **Lit and unlit wall tiles.** Two or three wall sprites — unlit, half-lit, lit — chosen per tile at
  bake time by distance to the nearest lamp (`STAGE.lamps`, `DOCK.lamps`), so the cone falls on the
  wall. A tile is a kind; the choice is an index, computed once, no frame cost.
- **A pool on the deck under each lamp** (an additive ellipse, as the bar's spill is), and a
  **pool under each pad** so the cyan field lights the floor it stands on.
- **Up-light on the ship**: a cyan additive glow sprite laid over the ship's lower half at the pad
  (the ships are drawn at `HANGAR_SCALE` in their own frame; a soft ellipse in the player's ink,
  blitted after the hull with `lighter`, the way [0470](../docs/decisions/0470-the-light-is-additive.md)
  adds a bolt's glow).
- **Occlusion**: a dark gradient in the corner where the wall meets the deck, under the catwalk,
  under the truss, and at the frame's far corners — one strip sprite stretched, three blits. This
  alone takes a flat room most of the way to a lit one.
- **The bar warms its corner.** Extend the spill up the wall beside the door and onto the deck in a
  longer pool, so the room has a warm side and a cold side.

### C. Big forms over the grid

- **A bay door.** The bay's edge becomes a real door run back into the wall: a heavy frame top and
  bottom with the hazard stripe on its lip, a track along the deck, a warning lamp that turns. One
  tall sprite each end in place of `bayTop` and `bayBottom`.
- **A gantry crane rail under the truss** with a hook and a chain hanging over the pilot's pad; the
  hook swings a few degrees on the clock.
- **A bulkhead door with a wheel** in the back wall between the bar and the viewport; a numbered
  bay sign (*BAY 02* — a numeral, not a word, on the fiction's own voice rule); conduit runs that go
  somewhere; a coiled fuel hose and two crates on the deck by the Viper's pad.
- **Tile variants.** Three or four wall tiles (plain, conduit, vent grille, patched) picked per tile
  from a seeded stream of the port's own ([0021](../docs/decisions/0021-one-stream-per-concern.md)),
  so the grid stops repeating. Same for the truss: one span with cross-bracing rather than eight Vs.

### D. The deck as a floor

- A **lip at the front** of the deck: a darker band with a hazard stripe and a shadow under it, so
  the floor ends toward the viewer instead of running off the frame.
- **Grating under the pads** and a **reflection of the pad's glow** (the beam's rings, flipped and
  faded, below the pad line).
- **Marks**: scorch under the Viper's pad after she goes (a sprite that fades in at `BEATS.viperGo`),
  tyre marks on the car's pad, an oil stain, tape on the deck.

### E. Depth: three planes

- **Outside the bay, a middle plane**: the station's own structure continuing past the bay (a spar,
  a lit module), traffic (a shuttle crossing far off once in the eleven seconds), the planet on the
  dock.
- **A foreground plane**: a dark rail or a cable crossing the frame's bottom at 1.1× the room's
  scale, a crane hook at the top. When the stand's camera moves between tabs (the dolly in
  [the menus, reviewed again](the-menus-reviewed-again-2026-10-24.md) §1.2) these planes move at
  different rates, which is the one thing that proves the room is not a flat painting.

### F. Life in the room

All as pure functions of the clock, on `paintStand`'s terms: a lamp's flicker (alpha from a hash of
the step), a steam vent that puffs on a seeded timer, sparks at Unity's bench while they work, the
neon parrot's buzz (one frame in sixty at half alpha), the string lights twinkling, a ceiling fan,
the beacon as a turning cone rather than a dot, a maintenance drone that crosses the truss once a
minute. Each is one or two sprites and a few blits. The planet already drifts
([0572](../docs/decisions/0572-the-dock-is-dressed.md)); it is the proof that motion at depth works
here.

### G. The intro's staging

- **Mark the Viper's pad as hers**: a violet field in place of the cyan, the Coil's crest on the
  wall above it, and a cage or a chain that drops as she lights.
- **The alarm sweeps**: a red additive wash that moves along the wall and the deck once a turn,
  instead of two dots brightening.
- **The field ripples** as a ship passes through the bay (the `field` sprite drawn twice, offset, for
  a dozen steps).
- **The camera breathes**: a slow push-in from zoom 1.0 to about 1.08 over the held eleven seconds,
  then a hold; `standViewInto` already takes a zoom. The held shot stops being a still.
- **Fill the strip**: draw the room under the empty top strip during the intro and the music room,
  as the dock already fills the frame. Finding 9 above.

### H. The dock, dressed as a place

- **Three shops of three shapes.** Unity's a workshop with a roller door and a hoist; MMXXVI's a
  spray booth with an extractor hood and paint drips down the front; Cosmo's a lit display with a
  glass counter. Different widths and heights, staggered a little in depth so one overlaps the next.
- **A wide screen's right side.** Past the bay, the station's own structure reaching out (a docking
  arm with a lit end, a window strip), so 2560×1080 is not half void. The planet stays far.
- **Signage that is signage**: a neon *HANGIN' OUT* over the mezzanine; the keepers' names as
  shop signs lit when open (they are already, and read well — keep them).
- **Attach the loose parts**: the cyan line at the bay becomes the bay door's track; the hazard
  stubs become the door's frame (C above).

### I. Polish on every tile

Rivet highlights (a light pixel above, a dark below), seam shadows, a grime gradient at the deck's
foot, scuffs on the deck, a dent in one panel. Cheap, and it is the difference between *vector* and
*cutout* on a tile that is on screen thirty-two times.

## What it costs, and what measures it

- **Atlas memory**: each new kind and each variant is a sprite at the camera's resolution. A tile
  is small; the station and a bay door are large. Measured by baking and reading the atlas's byte
  size before a number is written, as [0413](../docs/decisions/0413-the-prewarm-is-parallel.md)
  and [0563](../docs/decisions/0563-the-ship-is-the-picture.md) did.
- **Blits per frame**: `tests/budget.test.ts` counts them; lit-tile variants cost none, pools and
  occlusion strips a handful, a foreground plane one per tile it covers.
- **Bake time at the hangar's open** and at the intro's start: the pieces are baked once per
  palette and dropped at *Back*; more pieces is a longer bake, measured under the suite
  ([0245](../docs/decisions/0245-a-budget-is-sized-under-load.md)).
- **Nothing here touches the sim, a save or a shipped key.** No rollback note is owed.

## Suggested order

1. **A** — the station outside. One sprite, the worst picture, the first impression.
2. **B** — the light: lit tiles, pools, up-light, occlusion. The room stops being flat.
3. **C and D** — the bay door, the crane, the variants, the deck's lip and marks.
4. **G** — the intro's staging and the strip, since the intro is where B, C and D are first seen.
5. **E and F** — the three planes and the life, with the dolly from the menus report.
6. **H and I** — the dock's shops and the polish.

Each from `main`, one open at a time, photographed with `scripts/shot-menus.mjs` and with the intro
shot at its beats before it is handed over, against the pictures this report was written from — so a
verdict on the picture is never confused with a change to the pipeline.

## The answers

Not yet asked. Left to the player:

| question | recommendation |
|---|---|
| is the station outside the Mothership of the fiction (a ship) or a station (a ring, a spar)? | **a ship**: the Far Carry's clubhouse is aboard the Mothership, and a hull with a bay reads as one |
| does the Viper's pad get the Coil's violet, or stay the port's cyan? | **violet** |
| does the intro's camera push in, or hold? | **push in**, slowly |
| does a foreground plane (a rail, a hook) cross in front of the ship on the dock? | **yes**, at the frame's bottom only, clear of the plate |
