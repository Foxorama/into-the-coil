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

/** What can be drawn. */
export type SpriteKind = 'ship' | 'shipHit' | 'enemy' | 'bullet' | 'pickup';

/** Baking order, and therefore the blit index. Explicit, never derived from the table. */
export const SPRITE_KINDS: readonly SpriteKind[] = ['ship', 'shipHit', 'enemy', 'bullet', 'pickup'];

/** The index a painter blits by. A number, because this is read five hundred times a frame. */
export const SPRITE: Record<SpriteKind, number> = { ship: 0, shipHit: 1, enemy: 2, bullet: 3, pickup: 4 };

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
  enemy: 5.5,
  bullet: 1.8,
  pickup: 3.5,
};
