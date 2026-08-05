/**
 * What the player flies.
 *
 * ⚠️ **One row, and it is deliberately not a character.** `docs/game.md` names the roster — four
 * *Far Carry* golfers in the prologue, nine caddies in the unlock pool — and says every ship must
 * differ on at least one axis the player can feel. Authoring one of them here, in a PR whose subject
 * is whether the ship can be killed, would be inventing product to satisfy a shape: the roster is a
 * table edit against this file, and it is owed a hand on the controls rather than a guess.
 *
 * What IS real here is the shape: a `Record` over a closed union per
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`, with the base weapon on the row, so a second ship
 * changes no type and no code.
 *
 * ⚠️ **Auto-fire is on the row and has no trigger, anywhere.** `src/content/actions.ts` says it: there
 * is no `fire` action and there must never be one. The base weapon fires itself; the arsenal — which
 * is a list and not a slot — is what the player spends. Nothing in this file is that arsenal yet.
 */

import type { Body } from '../sim/entity.ts';
import type { ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/** Every flyable ship. Closed, and one entry long until the roster is played rather than designed. */
export type ShipKind = 'proof';

export interface ShipRow extends Body {
  /** Steps between auto-fire shots. */
  fireEvery: number;
  /** The base weapon. */
  shot: ShotKind;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const SHIP_KINDS: readonly ShipKind[] = ['proof'];

export const SHIPS: Record<ShipKind, ShipRow> = {
  /**
   * The proof scene's ship. `health` is hits, not a bar: five is enough that a player learns what
   * killed them, and few enough that they find out inside one sitting.
   */
  proof: { sprite: SPRITE.ship, radius: 2, health: 5, damage: 0, fireEvery: 9, shot: 'pulse' },
};

/**
 * Steps of invulnerability after a hit lands — 0.75s at 60Hz.
 *
 * ⚠️ **Not a comfort setting and not on the assist ladder.** Without it `health` is a count of STEPS
 * rather than of hits: an overlapping volley bills the player sixty times a second and five health is
 * gone in a twelfth of a second, which reads as dying at full health.
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` keeps the ladder closed; this is part
 * of the one game, at the same value for everybody.
 */
export const INVULN_STEPS = 45;
