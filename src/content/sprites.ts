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
  'bullet',
  'pickup',
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
  bullet: 1.8,
  pickup: 3.5,
  // Small: a fragment reads as a piece of something, and eight of them at enemy size is a wall.
  debris: 1.4,
};
