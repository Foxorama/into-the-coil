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

/**
 * Which way the flame leans — with the ship's sideways motion, or not at all. Closed, per 0016.
 *
 * ⚠️ **A LEAN AND NOT A SWAY, SINCE 0241.** 0230 hung the flame across the tail against the ship's
 * sideways velocity, and it played as a bug: *"the thrusters when you go up/down don't angle, they
 * move up and down on the ship."* A flame stays on its nozzle and ANGLES; a bitmap cannot rotate, so
 * each frame is baked three ways and `src/app/frame.ts` picks one off the across velocity.
 *
 *   **level**  the ship is holding its line across the lane
 *   **climb**  it is going up the screen, so the flame's tip trails below the tail
 *   **dive**   it is going down, so the tip trails above
 */
export const LEAN_KINDS = ['level', 'climb', 'dive'] as const;

export type LeanKind = (typeof LEAN_KINDS)[number];

export interface ThrustRow {
  /**
   * The bitmaps it alternates between, on the step clock — the pulse — one list per lean.
   *
   * ⚠️ **TWO FOR THE STATES THAT PULSE AND ONE FOR THE ONE THAT DOES NOT.** An idling ion engine
   * flickers and a burning one roars; a reverse burn is a dim wisp with nothing to alternate to.
   * Every lean has the same count, so the pulse's clock reads the same whichever way the ship goes.
   */
  frames: Record<LeanKind, readonly number[]>;
  /**
   * World units from the ship's centre back to the sprite's centre, so the flame's root meets the
   * tail. Longer for a longer flame, because the root is drawn at the sprite's forward edge.
   */
  trail: number;
}

export const THRUST: Record<ThrustKind, ThrustRow> = {
  idle: {
    frames: {
      level: [SPRITE.thrustIdle0, SPRITE.thrustIdle1],
      climb: [SPRITE.thrustIdle0Climb, SPRITE.thrustIdle1Climb],
      dive: [SPRITE.thrustIdle0Dive, SPRITE.thrustIdle1Dive],
    },
    trail: 3.6,
  },
  burn: {
    frames: {
      level: [SPRITE.thrustBurn0, SPRITE.thrustBurn1],
      climb: [SPRITE.thrustBurn0Climb, SPRITE.thrustBurn1Climb],
      dive: [SPRITE.thrustBurn0Dive, SPRITE.thrustBurn1Dive],
    },
    trail: 4.7,
  },
  ease: {
    frames: { level: [SPRITE.thrustEase], climb: [SPRITE.thrustEaseClimb], dive: [SPRITE.thrustEaseDive] },
    trail: 3.2,
  },
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
 * How fast the ship has to be moving across the lane, in world units a step, before the flame
 * leans — 0241. Below it the flame is level, so a hand resting on the stick does not flicker the
 * lean; above it the flame trails against the motion, on every step the ship keeps moving.
 *
 * ⚠️ **Replaces `SWAY`**, 0230's across offset of the flame's centre per unit of across velocity.
 * The flame's centre sits on the tail now on every step; what the velocity chooses is the bitmap.
 */
export const LEAN_AT = 0.12;
