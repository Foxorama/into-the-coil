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
  'bullet',
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
  'debris',
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
  /*
    ⚠️ **26, against a hard ceiling of 80.** `src/sim/camera.ts` puts `EDGE_MARGIN` at 40 and says in
    the same breath that it is *"the largest half-extent any entity may be authored at"* — so a boss
    may be 80 across, and at anything near that it is a wall rather than an enemy. 26 is about a
    quarter of the dodge lane: unmistakably the biggest thing in the game, with room left to fly past
    it on either side, which is what keeps the fight about position rather than about attrition.
  */
  boss: 26,
  bossHit: 26,
  bullet: 1.8,
  /*
    ⚠️ **Bigger than the smallest enemy, on purpose.** A pickup is the one thing on screen the player
    is supposed to fly TOWARDS, and at 3.5 it was smaller than everything it had to be picked out
    from. It is still well under the drifter, so it never reads as a threat.
  */
  pickupLife: 4.6,
  pickupRapid: 4.6,
  pickupSpread: 4.6,
  // Small: a fragment reads as a piece of something, and eight of them at enemy size is a wall.
  debris: 1.4,
};
