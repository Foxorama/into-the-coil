/**
 * What can be drawn, how big it is, and which index a painter blits it by.
 *
 * ⚠️ **This table moved down out of `src/render/bake.ts`, and the move is what makes the enemy and
 * shot tables possible at all.** A row in `src/content/` has to be able to say which sprite its kind
 * is drawn as, and `docs/decisions/0015-the-layer-ladder.md` gives `content/` no way to reach
 * `render/` — the arrow runs the other way. The drawing itself stays in `bake.ts`, which is the right
 * split on its own terms: *which* sprite an enemy uses is content, and *what that sprite looks like*
 * is art. See `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
 *
 * Closed, per `docs/decisions/0016-a-hub-enumerates-kinds.md` — `bakeAtlas` switches over this union
 * with a `never` arm, so a kind added here fails to build until it has been drawn.
 */

// The lane's width, so a sky tile is exactly as tall as the screen — `SPRITE_EXTENT` below says
// why. `docs/decisions/0015-the-layer-ladder.md` puts `sim` below `content`, so the arrow is right.
import { ACROSS_SPAN } from '../sim/camera.ts';

/**
 * Every sprite, in baking order — and **the single description of all three facts below**.
 *
 * ⚠️ **THIS LIST USED TO BE THREE LISTS, and the third one nearly shipped out of step.** There was a
 * hand-written union, a hand-written order, and a hand-written `Record` of indices, with a comment
 * on the order saying *"explicit, never derived from the table"*. Adding `debris` to the middle of
 * one and the end of another was a two-line edit that made **every entity in the game draw as
 * something else** — the atlas is filled by walking the order and every blit indexes it by the
 * `Record`, so an off-by-one between them mis-draws the whole screen. Nothing type-checked it,
 * because both were valid tables independently.
 *
 * The first fix was a test that the two agreed. That is the wrong tier: `docs/scaffold-plan.md`'s
 * instruction ladder puts **remove the affordance** above *write a rule about it*, and it is the only
 * tier that reliably works. So the order is now the source, the union is `(typeof …)[number]`, and
 * the indices are positions in it. There is nothing left to disagree.
 *
 * ⚠️ **A kind per enemy, not one `enemy` for all of them**, and it is a play-test finding rather
 * than a preference: `drifter` and `lancer` shipped as the same diamond, so the one that shoots back
 * and the one that cannot were indistinguishable.
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *colour never carries meaning
 * alone* in the unconditional tier, which makes silhouette the channel that has to carry it — and
 * the lancer's nose points at the player, so its shape says what it does.
 *
 * ⚠️ **Every kind that can take damage has a `…Hit` twin**, which is the same silhouette in the
 * `impact` ink. A hit that changes nothing on screen reads as a bug, and did.
 * [0035](../../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md).
 */
export const SPRITE_KINDS = [
  'ship',
  'shipHit',
  /*
    ── TWO MORE HULLS, BECAUSE AN UPGRADE HAS TO SHOW ─────────────────────────────────────────────

    Reported from play, as the last of five defects: *"additional autofire and missile upgrades don't
    change the look of the player's ship."* `docs/game.md` states it as a rule rather than a wish —
    *"every upgrade changes how the ship looks on screen"* — and the ship had exactly one silhouette
    from the first pickup to the last.
    `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md`.

    ⚠️ **The same wedge with more of it, and not three different ships.** What the player has to read
    is *I am further along than I was*, and a hull that changed KIND would say *I am flying something
    else* — the one thing that is not true. Each tier adds a pair of swept fins to the one before it,
    so the growth is legible at a glance and the ship is recognisably the same object.

    ⚠️ **Three tiers and not one per upgrade.** `weaponFor` already caps barrels, launchers and both
    fire rates, and past those an upgrade becomes weight — so a hull per upgrade would need an
    unbounded number of them. Three is what a player can tell apart at ship size.
  */
  'shipMk2',
  'shipMk2Hit',
  'shipMk3',
  'shipMk3Hit',
  'drifter',
  'drifterHit',
  'lancer',
  'lancerHit',
  /*
    ── THE THREE ADDED WITH THE FIRST AUTHORED LEVEL ───────────────────────────────────────────────

    ⚠️ **Chosen as PRIMITIVES that survive twenty pixels, not as interesting shapes.** The lancer's
    first silhouette was a five-sided arrowhead, reasoned to be obviously not a diamond, and it
    shipped as a small mushy lump the player read as a slightly smaller diamond —
    `reports/enemy-silhouettes-2026-08-05.md`. The lesson taken from that is that concavity and point
    count are what fail at size, so what separates these five is a **primitive and an axis**:

      drifter  diamond, symmetric        — points nowhere, does nothing
      lancer   wide triangle, nose −x    — points at you, shoots
      weaver   BAR, long ACROSS the lane — a line perpendicular to travel
      charger  NEEDLE, long ALONG it     — a line parallel to travel
      turret   half-disc, flat face −x   — the only round-backed thing in the game

    The pair worth watching is weaver against charger: both are essentially lines, told apart by
    which way they lie. That is a real risk and it is written down rather than assumed away —
    `scripts/shot.mjs` renders the shipping camera so it can be LOOKED at, which is
    `docs/decisions/0027-measure-the-picture-not-the-model.md`'s whole instruction.
  */
  'weaver',
  'weaverHit',
  'turret',
  'turretHit',
  'charger',
  'chargerHit',
  /*
    ⚠️ **A RING, and it is the last unused primitive.** The five before it are a diamond, a wide
    triangle, a bar, a needle and a half-disc — told apart by shape and by axis. What is left that
    survives twenty pixels is *round with a hole in it*, which is also the only silhouette in the
    game that reads as an aperture rather than as a body. It fires and it weaves, and the shape says
    the first half.

    ⚠️ Level two's enemy, and `docs/game.md` asks for one per level. What it is NOT is a sixth
    behaviour: it is the weave and the shot, both of which already exist, on one row —
    `docs/decisions/0042-a-run-is-a-sequence-of-levels.md` on why that is the right kind of new.
  */
  'warden',
  'wardenHit',
  /*
    ⚠️ **A CROSS and an open CHEVRON, and both were chosen against the six already here rather than
    for themselves.** `reports/enemy-silhouettes-2026-08-05.md` is the record of what happens when
    they are not: the lancer shipped as a five-sided arrowhead that read as *a slightly smaller
    diamond* at the size it actually blits, and the player reported the game as buggy.

      spinner  CROSS, four arms          — the only shape with a concave outline
      sower    CHEVRON, open back        — the only shape that is not closed

    The pair worth watching is the chevron against the lancer's triangle: both are wedges pointing
    −x, told apart by whether the back is filled in. `scripts/shot.mjs` is how that gets looked at
    rather than argued about.
  */
  'spinner',
  'spinnerHit',
  'sower',
  'sowerHit',
  /*
    ⚠️ **One boss silhouette, and the phases are NOT drawn.** Three sprites for three phases was the
    first plan and it is rejected: what a phase changes is what the boss DOES — its rate, its spread,
    how it moves — and that is legible in motion, at full frame rate, without a second art pass.
    `docs/game.md` describes the Jörmungandr model as *"phases keyed to remaining health"* and every
    one of those words is about behaviour.

    ⚠️ **This leaves a real gap: there is no readout of how much boss is left**, only three discrete
    changes in how it fights. Whether that is enough to feel progress is a question about the
    picture, so it is owed a play-test rather than a guess —
    `docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md` records it as the one thing
    that build exists to find out.
  */
  'boss',
  'bossHit',
  // The second boss. Its own silhouette, because `docs/game.md` says every boss is unique and a
  // shared hull would make two fights look like one with different numbers.
  'boss2',
  'boss2Hit',
  'boss3',
  'boss3Hit',
  'boss4',
  'boss4Hit',
  'boss5',
  'boss5Hit',
  'boss6',
  'boss6Hit',
  'boss7',
  'boss7Hit',
  'bullet',
  /*
    ── WHAT SHOOTS BACK, AND IT WAS THE SAME BITMAP AS WHAT THE PLAYER FIRES ───────────────────────

    Reported from play: *"it's now very hard for sighted users to differentiate between power ups,
    player/enemy fire, different types of enemies. When they're all the same colour and essentially
    the same size, they're all the same."*
    `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md`.

    ⚠️ **`spit` used `SPRITE.bullet`, so a threat and the player's own shot were ONE BITMAP** — the
    same disc, the same ink, the same 1.8 units. There was no channel at all separating the thing
    that kills you from the thing you kill with, which is the report's own sentence read literally.

    ⚠️ **A SQUARE, and it is the last primitive that survives fifteen pixels.** At 2.6 units on a
    16:9 desktop this is about nineteen pixels; the shapes already proved at that size are a disc, a
    diamond, a bar, a needle, a half-disc and a ring (`reports/enemy-silhouettes-2026-08-05.md`). A
    square against the pulse's disc is *corners against none*, which is the same distinction the
    turret already earns among the enemies — and it is not the drifter's diamond, because a diamond
    is a square turned 45° and the two would read alike the moment either was small.

    ⚠️ **Bigger than the pulse, on purpose.** Size is the cue that needs no learning: the thing the
    player must not touch is drawn larger than the thing they fire.
  */
  'spit',
  /*
    ── AND TWO MORE, BECAUSE ONE THREAT BITMAP WAS THE OTHER HALF OF A PLAY REPORT ─────────────────

    `docs/decisions/0098-a-wave-plays-a-figure.md`: *"all the enemy bullets are exactly the same."*
    They were — three shooting enemy kinds and seven bosses named one row.

    ⚠️ **A DASH and a SLAB, which are the two primitives left at this size.** The square is spoken
    for and so is the disc; what separates these three from each other is ASPECT and AREA, which
    `reports/enemy-silhouettes-2026-08-05.md` found survives twenty pixels where a notch does not.
    A dash is a bar lying along its own travel, a spit is a square, a slab is half again as wide as
    either — thin, medium, fat, which is a ladder a player reads without being taught it.

    ⚠️ **The weaver is also a bar and the charger is also a needle**, and the pair is a real risk
    written down rather than assumed away: both are enemy HULLS of five to nine units against
    bullets of two to three and a half, which is the size argument `spit` above already rests on.
    `scripts/shot.mjs` is how it gets looked at.
  */
  'lance',
  'flak',
  /*
    ⚠️ **A DART, AND THE ONLY THING IN THE GAME DRAWN LONG ALONG ITS OWN TRAVEL IN THE BULLET INK.**
    The pulse is a disc of 1.8 units; this is 2.8 and pointed, so the two are told apart by shape and
    by size before colour is involved at all — which matters more here than anywhere else, because
    they leave the same ship at the same time and the player has to read WHICH stream is landing.

    The charger is also a needle and is 6 units of enemy ink arriving from the other direction; the
    pair is a real risk and it is written down rather than assumed away, exactly as the weaver and
    the charger were. `scripts/shot.mjs` is how it gets looked at.
  */
  'missile',
  /*
    ⚠️ **A DISC WITH ITS TAIL CUT AWAY, and it is the only silhouette in the game that is asymmetric
    across its own travel.** The pulse is a small disc and the missile is a dart, so a bomb has to
    read as something LOBBED rather than as a bigger bullet — round at the front, notched behind.
  */
  'bomb',
  /*
    ⚠️ **A RING, drawn at exactly the radius that does the damage.** A blast whose picture is smaller
    than its reach kills things the player watched it miss; one whose picture is larger makes them
    dodge something that was never going to touch them. The two numbers live in different files —
    the extent here, the radius on the shot row — so `tests/bombs.test.ts` holds them to each other.
  */
  'blast',
  /*
    ── THE SAME RING AT THREE MORE SIZES, AND THE SIZE IS THE WHOLE MESSAGE ────────────────────────

    Asked for in play: *"an expanding ring based on number of bombs."*
    `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.

    ⚠️ **One drawing, four bitmaps, and it has to be four bitmaps.** `src/render/surface.ts` blits a
    baked bitmap at the extent the atlas recorded for it, so *the same sprite, bigger* is not a thing a
    caller can ask for — and it must not become one. A per-entity draw scale would let any body in the
    game be drawn at a size unrelated to its art, which is the affordance that makes
    `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md`'s *the picture is the hurtbox*
    unenforceable everywhere rather than just here.

    ⚠️ **They share the ring silhouette and the hazard ink deliberately.** A player who has learned
    that a wide ring at the far end of a bomb's flight is something to be outside of should read this
    the same way at a glance; it is the same event with a different cause.
  */
  'blastHalf',
  'blastWide',
  'blastWidest',
  /*
    ⚠️ **NOT A PICKUP ANY MORE, AND THE NAME SAYS SO** — `pickupLife` until
    `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` took the extra life off the field.
    The plus survives because the HUD still counts lives with it (`src/app/chrome.ts`), and a sprite
    named for a pickup nobody can pick up is the kind of stale name `src/content/levels.ts` records
    the cost of.
  */
  'lifeIcon',
  /*
    ⚠️ **THREE PICKUP SILHOUETTES, NOT ONE IN THREE COLOURS.**
    `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *colour never carries meaning
    alone* in the unconditional tier, and a pickup is the case where that is most tempting to break:
    they all do the same thing to the player (fly into it) and differ only in what happens after.

    They share an ink and differ in shape, which is the same division of labour every enemy uses —
    silhouette carries identity, colour carries role.

    ⚠️ **AND THEY NOW DIFFER IN SIZE AS WELL**, which is the half of
    `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md` that was
    deliberately left to this chunk. Reported from play: *"when they're all the same colour and
    essentially the same size, they're all the same."* 0081 answered it for the two bullets and the
    hull; the extents below answer it here.
  */
  'pickupWeapon',
  /*
    ⚠️ **THE MISSILE PICKUP, AND IT IS THE WEAPON'S SILHOUETTE ROTATED A QUARTER TURN.** 0083 split
    the missiles back out of `weapon`, and the two are the same *kind* of thing — a ladder of four
    tiers over one of the ship's two auto-weapons — so they read as a family rather than as strangers.
    The chevron points along the lane; this one points across it, which is also what a tube on a wing
    does.

    ⚠️ **Rotation is a legitimate distinction here and is NOT one for enemies.**
    `reports/enemy-silhouettes-2026-08-05.md` is the pass that cost this project an art round, and its
    finding was about CONCAVITY and point count failing at size — a rotation of a strongly asymmetric
    shape survives what a subtler outline does not. It also has size behind it: 5.5 against the
    weapon's 6.
  */
  'pickupMissile',
  /*
    ⚠️ **A HERALDIC SHIELD, and it is the one pickup whose meaning a player already owns.** The other
    three are arbitrary glyphs the game has to teach — a plus, a holed square, a hexagon — and the
    title screen's key is how it teaches them. This one does not need teaching, which is worth more
    than shape-family tidiness: flat across the top, tapering to a point.

    Against the three it has to be told apart from at four world units: the plus has four arms and a
    waist, the holed square has a hole, the hexagon is symmetric in every direction. Against the
    ENEMIES it shares no ink with, the nearest silhouette is the drifter's diamond — which has a
    point at the top where this has an edge.
  */
  'pickupShield',
  /*
    ── THE BOMB PICKUP WEARS THE BOMB'S OWN SILHOUETTE ─────────────────────────────────────────────

    ⚠️ **The same drawing as `bomb`, in the pickup ink and at the pickup's extent** — `src/render/bake.ts`
    shares the path between the two cases, which is the only place in this table two kinds do that
    outside the pyre's rungs. It is deliberate and it is the point: a player learns the notched disc
    from the trigger strip before they ever find one lying about, so *the thing on the ground is the
    thing on the button* needs no teaching at all.

    ⚠️ **The INK is what makes it a pickup rather than a thrown bomb**, and that is the one channel
    `docs/decisions/0024-the-accessibility-floor-is-settings.md` allows to carry role while shape
    carries identity. The two are never on screen in the same place: a thrown bomb is leaving the ship
    at speed and this holds station in the lane.

    ⚠️ **The four faces this replaces were a pair-with-inverted-fill scheme** — a holed square against
    a solid one, a solid hexagon against a holed one — and it lost its subject when 0082 merged the
    four upgrades into one. There is no *other face* of anything any more.
  */
  'pickupBomb',
  /*
    ⚠️ **A RING IN THE PLAYER'S OWN INK, and the ring is deliberately the warden's primitive.** The
    two are never confusable in play — one is 9.5 units of enemy at the leading edge and this is 3
    units of player ink orbiting the ship — and reusing the aperture shape says the right thing: a
    shell with a hole in it, which is what a shield that is about to pop looks like.

    The alternative was a small disc, and it is rejected for the reason the pickups are three shapes
    rather than three colours: a small disc is the BULLET, and *a dot near the ship* would then mean
    two opposite things told apart by colour alone —
    `docs/decisions/0024-the-accessibility-floor-is-settings.md`.
  */
  'shieldOrb',
  'debris',
  /*
    ── THE SKY, AND IT IS TWO SPRITES RATHER THAN A THOUSAND ENTITIES ─────────────────────────────

    Asked for in play: *"needs a starry background or a background of some kind."*
    `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.

    ⚠️ **A star is not an entity and must never become one.** `CAPACITY` in `src/app/mount.ts` already
    totals 0022's 500-entity worst case exactly, so a starfield made of bodies would either overrun
    the frame budget or come out of the pools that hold bullets. These are two TILES, baked once and
    blitted a fixed handful of times a frame — which is the pipeline 0022 already describes, used for
    something the size of the screen instead of something the size of a ship.
  */
  'skyFar',
  'skyNear',
  /*
    ⚠️ **THE THIRD TILE, AND IT IS THE ONLY ONE DRAWN AS STREAKS** —
    `docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md`. Reported from play:
    *"background starfield has lost it's multiple layers, there's only one starfield background and
    the background… moves too slow."*

    ⚠️ **It is a third bitmap `ACROSS_SPAN` units square, which is the real cost of this decision**
    — about four megabytes at `bakeOne`'s resolution ceiling, on top of the eight the other two
    already spend. Named here rather than discovered later: it buys the only lever that was left, and
    0088 said in as many words that the next answer was *a different sky* rather than another number.
  */
  'skyRush',
  /*
    ── AND A FOURTH LAYER THAT IS NOT MARKS AT ALL ─────────────────────────────────────────────────

    `docs/decisions/0112-the-sky-has-weather.md`. Reported from play: *"needs to be more than streaks
    and some weird colouration per level. Needs an actual space skyscape with nebulous clouds and such
    like."*

    ⚠️ **The three above are FIELDS OF MARKS and this is an AREA**, which is the first thing the sky
    has ever drawn that is not a dot or a line. What makes it safe is stated where it is bounded —
    `nebulaField` in `src/render/bake.ts` — and it is why
    `docs/decisions/0069-the-sky-is-behind-the-game.md`'s ceiling had to be amended rather than
    quietly stepped around.
  */
  'skyNebula',
  /*
    ── AND A FIFTH THAT IS OPAQUE, WHICH NOTHING IN THE SKY HAS EVER BEEN ──────────────────────────

    `docs/decisions/0221-a-planet-is-not-a-space.md`. Reported: *"the planets still have the starry
    space backdrop visible, ground features need be properly have nothing behind them."*

    ⚠️ **THE OTHER FOUR ARE TRANSPARENT BY CONSTRUCTION AND THIS ONE MUST NOT BE.** Every sky sprite
    up to here is marks or gas over whatever was drawn before it, and 0220 put a planet's ridges among
    them — so the ground was a translucent shape with the star fields, which are drawn AFTER it,
    shining through. *Nothing behind it* is not a tuning of that; it is the opposite of it.

    ⚠️ **AND IT IS THE ONLY SKY SPRITE DRAWN IN FRONT OF THE STAR FIELDS.** Order in `SKY` decides
    what covers what, and it is independent of `depth` — a mountain range is far away AND in front of
    the stars. `docs/decisions/0069-the-sky-is-behind-the-game.md` is untouched: it is still behind
    every body, every shot and the box.

    ⚠️ **ONE SLOT, THREE DRAWINGS, AND FOUR PLACES THAT DRAW NOTHING IN IT** — `landmark`'s own
    argument one entry down. A place in space bakes an empty tile and never blits it, because `SKY`
    is chosen per place rather than per game.
  */
  'skyGround',
  /*
    ── AND A SIXTH THAT IS NOT A FIELD AT ALL, BUT ONE OBJECT AT ONE PLACE ─────────────────────────

    `docs/decisions/0203-the-rule-was-never-about-size.md`. Reported from play: *"visually there's
    nothing interesting or different about the levels"*, and asked for: *"I want to see the eagle
    nebula in a scrolling background and when the massive pipe organ kicks in music wise we see the
    pillars of god going past."*

    ⚠️ **THE FOUR ABOVE ARE TILED AND HAVE NO POSITION.** `extent` is a repeat period, so a field
    cannot be anywhere in particular — and *"when the organ kicks in"* is a statement about a
    POSITION. A landmark is placed against the level's own distance axis, the one `waves`, `bossAt`
    and `sections` already use, which is what lets the Pillars arrive with the organ without the sky
    ever reading the audio clock (`docs/decisions/0160-the-music-free-runs.md`).

    ⚠️ **ONE SLOT, SEVEN COMPLETELY DIFFERENT DRAWINGS.** `drawKind` already takes the theme, so this
    is a role rather than a shape: *"none of those elements are transposable to a different level"*.
    Seven sprite kinds would bake seven large bitmaps at boot for the one level that uses each.
  */
  'landmark',
  /*
    ── THE EDGE OF THE PLAYER'S BOX, WHICH WAS A WALL WITH NOTHING DRAWN ON IT ─────────────────────

    Reported from play: *"the hard block on the player movement was a problem because there was no
    indication of it, and I got shot a couple of times because I tried to fly forward on the screen
    to avoid a bullet and couldn't."*
    `docs/decisions/0074-the-box-is-drawn.md`.

    ⚠️ **One DASH, tiled down the lane rather than one line the height of it.** A sprite
    `ACROSS_SPAN` tall would be a two-megabyte bitmap that is 99% empty, on the same argument
    `bakeOne` makes about the sky tile's resolution — and a dash is what makes it read as a limit
    rather than as a wall the enemies are ignoring.
  */
  'bound',
] as const;

/**
 * What can be drawn. Closed, per `docs/decisions/0016-a-hub-enumerates-kinds.md` — every `Record`
 * over it still fails to build until a new kind has been given a row, and `bakeAtlas` still switches
 * over it with a `never` arm.
 *
 * Derived from the list rather than written beside it, so a kind cannot exist in the union and be
 * missing from the atlas.
 */
export type SpriteKind = (typeof SPRITE_KINDS)[number];

/**
 * Positions in `SPRITE_KINDS`, which is what `bakeAtlas` fills the atlas in.
 *
 * ⚠️ **The one cast in this file, and it is what buys the single description.** TypeScript cannot
 * see that a loop over an exhaustive list fills every key of a `Record` over that same list, so the
 * accumulator is `Partial` until it is complete. The alternative is `Record<string, number>`, which
 * `docs/decisions/0016-a-hub-enumerates-kinds.md` bans outright and `tests/registry.test.ts`
 * enforces — every kind would be "present" and none could ever be reported missing.
 */
function blitIndices<K extends string>(kinds: readonly K[]): Record<K, number> {
  const out: Partial<Record<K, number>> = {};
  kinds.forEach((kind, index) => {
    out[kind] = index;
  });
  return out as Record<K, number>;
}

/** The index a painter blits by. A number, because this is read five hundred times a frame. */
export const SPRITE: Record<SpriteKind, number> = blitIndices(SPRITE_KINDS);

/**
 * How big each kind is, in WORLD units across — so its screen size falls out of the camera.
 *
 * ⚠️ **This is the DRAWN size and it is not the hurtbox.** A `Body.radius` in `src/sim/entity.ts` is
 * what the collision uses, and it is deliberately smaller than half the extent: a shooter whose
 * hurtbox is the whole sprite reads as unfair, because the wing the player thinks is decoration is
 * killing them. The two numbers must stay related, though — art far larger than its hurtbox is the
 * opposite complaint, a bullet that visibly hit and did nothing — so `tests/combat.test.ts` holds
 * the band between them rather than leaving the pair to drift.
 */
export const SPRITE_EXTENT: Record<SpriteKind, number> = {
  ship: 7,
  shipHit: 7,
  /*
    ⚠️ **The same extent at every tier, and the growth is in the DRAWING.** A bigger hull is a bigger
    hurtbox's worth of picture — `tests/combat.test.ts` holds the band between `radius` and extent —
    and a ship that got physically larger as it upgraded would be a ship that got easier to hit for
    picking things up, which is the opposite of a reward. What grows is how much of the box the
    silhouette fills. 0081.
  */
  shipMk2: 7,
  shipMk2Hit: 7,
  shipMk3: 7,
  shipMk3Hit: 7,
  drifter: 5.5,
  drifterHit: 5.5,
  /*
    ⚠️ **BIGGER THAN THE DRIFTER, and the size is carrying the toughness.** Shape says *which* enemy
    this is; size says *how much killing it takes*, and size is the one cue that needs no learning at
    all — every game the player has ever played taught it. The two shipped at the same extent with
    one dying to one shot and the other to two, and that read as the game being inconsistent rather
    than as two enemies.
  */
  lancer: 7,
  lancerHit: 7,
  // Smallest of the five: it is the one that never shoots and dies to a touch, and size is the cue
  // that needs no learning at all.
  weaver: 5,
  weaverHit: 5,
  /*
    ⚠️ **The biggest enemy, because it takes the most killing — and `tests/combat.test.ts` caught this
    at 6.5.** It shipped smaller than the lancer while surviving one more hit, and the guard's own
    words are the reason that is wrong: a player would have had to learn its toughness by dying to
    it. Size is the cue that needs no learning at all.
  */
  turret: 8.5,
  turretHit: 8.5,
  charger: 6,
  chargerHit: 6,
  // The toughest thing that is not a boss, so the biggest — size carries toughness, and
  // `tests/combat.test.ts` holds the ordering.
  warden: 9.5,
  wardenHit: 9.5,
  // Between the turret and the warden: three health, like a turret, and a shape that needs the room
  // its arms take up.
  spinner: 8,
  spinnerHit: 8,
  // Two health, so between the lancer's and the turret's.
  sower: 7.5,
  sowerHit: 7.5,
  /*
    ⚠️ **26, against a hard ceiling of 80.** `src/sim/camera.ts` puts `EDGE_MARGIN` at 40 and says in
    the same breath that it is *"the largest half-extent any entity may be authored at"* — so a boss
    may be 80 across, and at anything near that it is a wall rather than an enemy. 26 is about a
    quarter of the dodge lane: unmistakably the biggest thing in the game, with room left to fly past
    it on either side, which is what keeps the fight about position rather than about attrition.
  */
  boss: 26,
  bossHit: 26,
  // Bigger than the first, and still well under the 80 that `src/sim/camera.ts` calls the ceiling.
  boss2: 30,
  boss2Hit: 30,
  /*
    ⚠️ **Five more hulls, and every one of them a different SIZE as well as a different shape.**
    `docs/game.md`: every boss is unique. Two bosses that differ only in their numbers read as the
    same fight twice, and the cheapest half of *unique* is the silhouette — so the extents climb with
    the run rather than repeating a value already on this list.
  */
  boss3: 28,
  boss3Hit: 28,
  boss4: 32,
  boss4Hit: 32,
  boss5: 34,
  boss5Hit: 34,
  boss6: 30,
  boss6Hit: 30,
  boss7: 38,
  boss7Hit: 38,
  bullet: 1.8,
  /*
    ⚠️ **Bigger than the pulse and drawn in the ENEMY ink** — 0081. It is the only thing on screen the
    player must never touch that is smaller than a hull, so every channel it has is spent on saying
    so: shape (a square against a disc), size (2.6 against 1.8) and role (`enemy` against `bullet`).
    Its HURTBOX is unchanged at 0.9, so this is a legibility change and not a difficulty one — the
    band `tests/combat.test.ts` holds puts it at 0.35 of its own extent, well inside.
  */
  spit: 2.6,
  /*
    ⚠️ **The three enemy bullets are a SIZE LADDER as well as three silhouettes** — 0098. 1.9, 2.6
    and 3.4, which is thin-fast, medium and fat-slow: how much of the lane a shot takes says how long
    the player has to leave it, so the two channels agree instead of having to be learned separately.
    Each step is 0.7 units, which is the five screen pixels 0081 measured as the smallest size
    difference that survives a busy screen.

    ⚠️ **The lance is the one pair where SIZE does almost nothing**, and it is written down rather
    than hoped over: at 1.9 against the pulse's 1.8 it is barely the larger of the two, so what
    separates the player's own shot from the fastest thing being fired at them is shape and ink
    alone — a red dash lying along the lane against a cyan disc. 0081's *the bigger one is the one
    you must not touch* is satisfied by a hair and is not what is doing the work here.

    ⚠️ **All three keep the spit's 0.9 hurtbox**, so `tests/combat.test.ts`'s band is what these
    extents are really bounded by — 0.47 and 0.26 of their own drawing, both inside it.
  */
  lance: 1.9,
  flak: 3.4,
  // Longer than the pulse and pointed. A missile is the shot the player is meant to notice.
  missile: 3.4,
  // Heavier than the missile: the biggest thing that leaves the ship, and the one that is spent.
  bomb: 4.4,
  /*
    ⚠️ **Twice the blast's hurtbox radius, and `tests/bombs.test.ts` is what keeps it so.** It is the
    one extent in this table whose value is owed to another file — the number itself is on
    `SHOTS.blast`, because how far a blast reaches is a gameplay number rather than an art one.
  */
  blast: 68,
  /*
    ⚠️ **The same relationship as `blast`'s, three more times: twice the row's hurtbox radius.**
    `tests/death.test.ts` holds all four pairs, which is the guard `tests/bombs.test.ts` already
    wrote for one of them — a blast whose picture is smaller than its reach kills things the player
    watched it miss.

    ⚠️ **The widest one is 136 units against a 100-unit lane, and that is deliberate rather than
    unnoticed.** It is what a player who died carrying three unspent bombs gets, and covering the
    whole lane is the point of it. What it costs is atlas memory: the ceiling in
    `src/render/bake.ts` is a RESOLUTION, so this bakes at about 980px on a phone's pixel density
    rather than at its desktop 1360 — which is the only reason a ring this big is affordable at all.
  */
  blastHalf: 34,
  blastWide: 102,
  blastWidest: 136,
  // The HUD's lives counter, and nothing on the field. It keeps the size the pickups had when it was
  // one of them, because the thing it has to be legible against is a line of text.
  lifeIcon: 4.6,
  /*
    ── THREE PICKUPS, THREE SIZES, AND THEY WERE ALL 4.6 ──────────────────────────────────────────

    ⚠️ **Bigger than the smallest enemy, on purpose.** A pickup is the one thing on screen the player
    is supposed to fly TOWARDS, and at 3.5 it was smaller than everything it had to be picked out
    from. `tests/pickups.test.ts` holds a floor at 85% of the smallest enemy (the weaver, at 5) and a
    ceiling under the largest (the warden, at 9.5).

    ⚠️ **THE ORDER IS WHAT THE PLAYER SHOULD CROSS THE LANE FOR** —
    `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`. Six pickups a level instead of
    twenty makes each one a decision, and the weapon is the one the report calls *"the lynchpin"*, so
    it is the one that reads from furthest away.

    ⚠️ **The weapon at 6 is bigger than the drifter (5.5) and the weaver (5), which the old comment
    here said a pickup must never be.** That intent is kept and paid differently: what stops a pickup
    reading as a threat is the ink and the silhouette, not being small — and being small was exactly
    the complaint. It is still well under the turret and the warden.

    ⚠️ **Each is twice its row's `radius` in `src/content/pickups.ts`**, because
    `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` makes the picture the hurtbox.
    Growing one of these without growing its radius would draw a target the player can touch and not
    collect, which is the same lie with the sign reversed.
  */
  pickupWeapon: 6,
  pickupMissile: 5.5,
  pickupShield: 5,
  pickupBomb: 4.4,
  /*
    ⚠️ **Small enough to read as the ship's, not as a body of its own.** Three of these orbit a
    7-unit ship at a 5.6-unit radius; at enemy size they would be a formation flying with the player
    rather than a shell around it, and the whole point is that the player counts them at a glance
    without looking away from the lane.

    ⚠️ **It was 2.2 and that was too small, which is a thing only the picture could say.** At 640×360
    — a phone's worth of pixels — a 2.2-unit ring is about seven pixels of hairline and the shell
    read as three specks. `scripts/shot.mjs` at that size is what said so, which is
    `docs/decisions/0027-measure-the-picture-not-the-model.md` doing its job: every number in the
    model was correct at 2.2.
  */
  shieldOrb: 3,
  // Small: a fragment reads as a piece of something, and eight of them at enemy size is a wall.
  debris: 1.4,
  /*
    ⚠️ **`ACROSS_SPAN`, which makes one tile exactly as tall as the lane** — so the sky tiles along
    the scroll axis and along it only, and no seam ever runs across the short axis of the screen. It
    is also four times the largest thing in the game, which is why `bakeOne`'s resolution ceiling had
    to stop being a pixel count: `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
  */
  skyFar: ACROSS_SPAN,
  skyNear: ACROSS_SPAN,
  skyRush: ACROSS_SPAN,
  /*
    ⚠️ **TWICE the lane, and it is the one sky tile that is not square to it.** A cloud the size of
    the screen comes round every few seconds at any depth that reads as motion, and a repeat the
    player can see is worse than no cloud at all. At two hundred units it repeats once in about
    eleven seconds of camera — longer than anybody looks at one part of the sky.

    ⚠️ **It costs four times a star tile's bitmap and is baked once per LEVEL**, not per frame —
    `src/render/bake.ts`'s `bakeNebula`.
  */
  skyNebula: ACROSS_SPAN * 2,
  /*
    ⚠️ **THE SAME TWO HUNDRED UNITS AS THE WEATHER, AND FOR A DIFFERENT REASON.** The cloud tile is
    that wide so a player never sees the same cloud twice; the ground is that wide because a horizon
    that repeats every screen is a wallpaper, and the eye finds a repeat in a SKYLINE far faster than
    it finds one in a smudge. Eleven seconds of camera at 0.45 is about twenty-five seconds of
    flying, which is most of a section.

    ⚠️ **And it means tile y 0.25 to 0.75 is the lane here too**, which is the trap 0220 walked into
    three times: the tile is twice the lane and blitted centred, so half of it is off the screen.
  */
  skyGround: ACROSS_SPAN * 2,
  /*
    ⚠️ **THREE QUARTERS OF THE LANE, AND THE NUMBER IS A LEGIBILITY FLOOR RATHER THAN A TASTE** —
    `docs/decisions/0203-the-rule-was-never-about-size.md`. That decision replaces 0069's ceiling
    with a forbidden BAND: nothing the sky draws may sit between half the smallest thing that can
    kill the player (a `pulse`, 1.8 across) and twice the largest (a `warden`, 8) — so 0.9 to 16.

    A landmark has to clear 16 by enough that no drawing inside it can land back in the band, and 75
    is four and a half times the top of it. `tests/sky.test.ts` holds the band, not this number.
  */
  landmark: ACROSS_SPAN * 0.75,
  /*
    ⚠️ **The TILING PERIOD of the dash, exactly as a sky tile's extent is.** Ten units is a mark and
    a gap, so the boundary is ten dashes down a hundred-unit lane — legible as a line at a glance and
    obviously not solid on a second look.

    ⚠️ **It divides `ACROSS_SPAN` exactly, and that is worth keeping.** A period that did not would
    leave a part-dash at one end of the lane and not the other, which reads as the marker being
    slightly wrong rather than as the lane being a hundred units.
  */
  bound: 10,
};
