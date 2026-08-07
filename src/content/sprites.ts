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
  'bullet',
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
    ⚠️ **THREE PICKUP SILHOUETTES, NOT ONE IN THREE COLOURS.**
    `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts *colour never carries meaning
    alone* in the unconditional tier, and a pickup is the case where that is most tempting to break:
    they all do the same thing to the player (fly into it) and differ only in what happens after.

    They share an ink and differ in shape, which is the same division of labour every enemy uses —
    silhouette carries identity, colour carries role.
  */
  'pickupLife',
  'pickupRapid',
  'pickupSpread',
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
    ── THE TWO MISSILE UPGRADES, AND THEY ARE THE OTHER FACE OF A SHAPE ────────────────────────────

    ⚠️ **Each is its partner's silhouette with the fill inverted**, which is a shape cue rather than
    a colour one — `docs/decisions/0024-the-accessibility-floor-is-settings.md` again. A holed square
    is *shoot faster* and a solid one is *missiles fire faster*; a solid hexagon is *another barrel*
    and a holed one is *another launcher*. The family says which weapon a pickup is about and the fill
    says which of the two it currently is.

    ⚠️ That pairing is not decoration: the next change in `docs/state-of-play.md` makes a pickup on
    the field CYCLE between the two faces, so a pair that reads as one object in two states is what
    that mechanic needs to be legible. It is authored as two ordinary pickups first, because a shape
    nobody can pick up cannot be judged.
  */
  'pickupMissileRate',
  'pickupMissileSpread',
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
  bullet: 1.8,
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
    ⚠️ **Bigger than the smallest enemy, on purpose.** A pickup is the one thing on screen the player
    is supposed to fly TOWARDS, and at 3.5 it was smaller than everything it had to be picked out
    from. It is still well under the drifter, so it never reads as a threat.
  */
  pickupLife: 4.6,
  pickupRapid: 4.6,
  pickupSpread: 4.6,
  pickupShield: 4.6,
  pickupMissileRate: 4.6,
  pickupMissileSpread: 4.6,
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
};
