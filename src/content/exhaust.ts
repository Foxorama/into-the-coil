/**
 * The ship's exhaust: what it is drawn as, and when — `docs/decisions/0230-the-ship-flies.md`.
 *
 * ⚠️ **AN ENTITY THAT FOLLOWS THE SHIP, NOT A MARK ON THE HULL.** Asked for: *"ship engines need to
 * be pulsing ion thrusters that burn when you hard push to the right and that sway up, down, forward
 * and reverse in response to movement, as it doesn't feel like I'm flying, it feels like I'm just
 * moving a thing around."* A plume baked into the ship's bitmap is the same plume at every speed;
 * this is one entity in its own pool, placed at the tail every step by `src/app/frame.ts`, whose
 * bitmap is chosen by what the player is asking for and whose place across the lane trails against
 * the ship's own sideways velocity.
 *
 * ⚠️ **IT IS IN NO PAIRING AND HAS NO REACH**, exactly as the shell and the debris are: cosmetic in
 * fact rather than by intention — `src/sim/collide.ts` only meets the pools a caller names.
 */

import type { Body } from '../sim/entity.ts';
import { SPRITE } from './sprites.ts';

/** What the engines are doing. Closed, per 0016. */
export const THRUST_KINDS = ['idle', 'burn', 'ease'] as const;

export type ThrustKind = (typeof THRUST_KINDS)[number];

export interface ThrustRow {
  /**
   * The bitmaps it alternates between, on the step clock — the pulse.
   *
   * ⚠️ **TWO FOR THE STATES THAT PULSE AND ONE FOR THE ONE THAT DOES NOT.** An idling ion engine
   * flickers and a burning one roars; a reverse burn is a dim wisp with nothing to alternate to.
   */
  frames: readonly number[];
  /**
   * World units from the ship's centre back to the sprite's centre, so the flame's root meets the
   * tail. Longer for a longer flame, because the root is drawn at the sprite's forward edge.
   */
  trail: number;
}

export const THRUST: Record<ThrustKind, ThrustRow> = {
  idle: { frames: [SPRITE.thrustIdle0, SPRITE.thrustIdle1], trail: 3.6 },
  burn: { frames: [SPRITE.thrustBurn0, SPRITE.thrustBurn1], trail: 4.7 },
  ease: { frames: [SPRITE.thrustEase], trail: 3.2 },
};

/** The flame as a body: the first idle frame, no reach, no health worth taking. */
export const EXHAUST: Body = {
  sprite: SPRITE.thrustIdle0,
  spriteHit: SPRITE.thrustIdle0,
  radius: 0,
  health: 1,
  damage: 0,
};

/**
 * How hard the player has to be asking forward, −1…1 on the intent, before the engines burn — and
 * how hard back before they ease.
 *
 * ⚠️ **READ OFF THE ASK AND NOT THE VELOCITY**, because the ship's box clamps the velocity: a player
 * holding forward against the front of the box is going nowhere and is still, in every sense the
 * picture cares about, pushing. Half deflection, so a stick nudged forward still idles.
 */
export const BURN_ASK = 0.5;
export const EASE_ASK = -0.5;

/** Steps each frame of a pulsing state holds. Three is twenty a second, which reads as a flicker. */
export const PULSE_STEPS = 3;

/**
 * World units the flame's centre trails ACROSS the lane per unit of the ship's across velocity —
 * the sway. Moving up the screen, the flame hangs below the tail; stopping, it swings back.
 *
 * At `SHIP_SPEED` it is about two units, a third of the hull, which is a lean and not a detachment.
 */
export const SWAY = 1.2;
