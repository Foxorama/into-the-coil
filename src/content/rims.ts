/**
 * What a car's wheels wear — `docs/decisions/0527-the-wheels-turn.md`, item 7 of
 * [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
 *
 * Asked for: *"Each car authors its own set of rims"*, and after item 6, *"from Golf-Stars add the full
 * sick spinning wheels from The Mothership into Cosmo's for 1000 shards"* — the predecessor's mythic
 * saucer's landing-gear wheels, a dark tyre on a silver rim with a cross of spokes, turning.
 *
 * ⚠️ **A RIM IS A DRAWING INSIDE A TYRE, AND THE TYRE IS THE CAR'S.** Where a car's wheels stand and how
 * big they are is on its row (`wheels` in `src/content/ships.ts`); a rim is painted to whatever tyre it
 * is put in, so the Firebird's snowflakes fit the estate's smaller wheels and the spinners fit both.
 *
 * ⚠️ **A LOOK, NEVER A THING THE SIM READS** — `docs/game.md`'s *nothing that changes a run is for sale*
 * (0522). The frame turns a spinner's picture; nothing about the run depends on which rim is on.
 */

import type { ShipKind } from './ships.ts';
import type { SpriteKind } from './sprites.ts';

const TAU = Math.PI * 2;

/** One picture laid over a wheel, and the twin it wears while the car is hurt. */
export interface RimFrame {
  readonly base: SpriteKind;
  readonly hit: SpriteKind;
}

/**
 * How a rim's wheels move — `docs/decisions/0556-the-marmot-crackles.md`. A picture of its own stands over
 * each wheel the car's row names (`stepWheels` in the fight, `paintStand` on the pad), and this is what
 * it does there: the spinners roll; the lightning strikes, a new crack each flash, somewhere else.
 *
 * ⚠️ **EVERY ROW AUTHORS ITS OWN, AND `null` IS A RIM BAKED STILL** into the hull, as the snowflakes are.
 * What is shared is only how a row is read (`wheelFrame`, `wheelTurn`), so the frame and the pad agree.
 */
export interface RimWheel {
  /** The pictures shown in turn — one for a rim that only rolls. */
  readonly frames: readonly [RimFrame, ...RimFrame[]];
  /** Seconds each picture holds before the next, or `0` for one picture held for good. */
  readonly hold: number;
  /**
   * Seconds a turn, front wheel and back, or `null` for none. The Mothership's two turned at 0.7 s and
   * 0.8 s, so a pair never ticks round in step.
   */
  readonly turn: readonly [number, number] | null;
  /** Radians each new picture stands round from the last, so a strike never lands where one just did. */
  readonly jump: number;
}

/** Which of `wheel`'s pictures wheel `i` of a car shows `seconds` in: the back runs a picture behind the front. */
export function wheelFrame(wheel: RimWheel, i: number, seconds: number): number {
  if (wheel.hold <= 0) return 0;
  return (Math.floor(seconds / wheel.hold) + i) % wheel.frames.length;
}

/** How far wheel `i` of a car stands turned `seconds` in, in `[0, 2π)`: its roll and its strikes. */
export function wheelTurn(wheel: RimWheel, i: number, seconds: number): number {
  const roll = wheel.turn === null ? 0 : (TAU * seconds) / (i === 0 ? wheel.turn[0] : wheel.turn[1]);
  const strikes = wheel.hold <= 0 ? 0 : Math.floor(seconds / wheel.hold) + i;
  return (roll + strikes * wheel.jump) % TAU;
}

/** Every rim. Closed — a new one is a row here and a painter in `src/render/bake.ts`. */
export const RIM_KINDS = ['snowflake', 'whitewall', 'spinner', 'bolts'] as const;
export type RimKind = (typeof RIM_KINDS)[number];

export interface RimRow {
  /** What the hangar and the shop call it. */
  name: string;
  /** One line about it. */
  hint: string;
  /**
   * The car it comes on, or `null` for one only Cosmo's sells. A car's own rim is open on it from the
   * start and on the other car once both are won in — the dash's rule (0521).
   */
  from: ShipKind | null;
  /** What it costs at Cosmo's, in Star Shards, or `null` for one that comes on a car. */
  price: number | null;
  /** How its wheels move, or `null` for a rim baked still into the hull — 0527, 0556. */
  wheel: RimWheel | null;
}

export const RIMS: Record<RimKind, RimRow> = {
  // The Trans Am's — 0516: *"can we give it the golden spikes for the wheels as well?"*
  snowflake: { name: 'Gold snowflakes', hint: 'Ten gold spikes on a dark dish', from: 'firebird', price: null, wheel: null },
  // The estate's — 0461: a whitewall and a gilt hubcap with a chrome boss.
  whitewall: { name: 'Whitewalls', hint: 'A white band and a gilt hubcap', from: 'estate', price: null, wheel: null },
  /*
    The Mothership's. The top price, set by the player with the ask: four clears of the gentlest tier
    at one credit, where the thrusters are three and a dangle two.
  */
  spinner: {
    name: 'Mothership spinners',
    hint: 'Silver spokes that never stop turning',
    from: null,
    price: 1000,
    wheel: { frames: [{ base: 'spinnerWheel', hit: 'spinnerWheelHit' }], hold: 0, turn: [0.7, 0.8], jump: 0 },
  },
  /*
    The Thunderbolt's — 0545: the predecessor's chopper wore bright rims; these are its lightning. 0556:
    played, *"they just look like a teal bar, they don't even look like lightning"* — asked to *"crackle
    like lightning"*. Three cracks, each held a sixteenth of a second and struck at a new angle from the
    last, never rolling: lightning does not turn, it lands somewhere else.
  */
  bolts: {
    name: 'Lightning spokes',
    hint: 'Lightning crackling across a dark dish',
    from: 'thunderbolt',
    price: null,
    wheel: {
      frames: [
        { base: 'boltWheel0', hit: 'boltWheel0Hit' },
        { base: 'boltWheel1', hit: 'boltWheel1Hit' },
        { base: 'boltWheel2', hit: 'boltWheel2Hit' },
      ],
      hold: 1 / 16,
      turn: null,
      jump: 2.4,
    },
  },
};

/** The most pictures any rim's wheel shows in turn — the pad bakes this many of the fitted rim's. */
export const WHEEL_FRAMES = Math.max(...RIM_KINDS.map((kind) => RIMS[kind].wheel?.frames.length ?? 0));
