/**
 * The assist knobs — the settings that make the game easier, and the promise that they only ever do
 * that.
 *
 * See `docs/decisions/0024-the-accessibility-floor-is-settings.md`. The game has ONE vibrant default:
 * loud, fast, full of audio cues and warnings. Accessibility is reached by turning knobs over that
 * default, never by restraining it — so every field here starts at the value the default game has,
 * and `DEFAULT_ASSISTS` is literally "the game as designed".
 *
 * ── WHY THIS IS IN `sim/` ───────────────────────────────────────────────────────────────────────
 *
 * Because an assist changes the model. A slower pace, a smaller hurtbox and non-lethal terrain are
 * all inputs to `step`, which means they are part of what a seeded run reproduces: a replay taken
 * with assists on and played back with them off diverges on the first contact. Assists therefore
 * travel with the run, not with the device.
 *
 * ⚠️ **The cosmetic settings are NOT here, and that is the rule rather than an omission.** Palette,
 * reduced motion and flash intensity are presentation, they belong to `render/`, and none of them may
 * ever appear in `Assists` — a player who turns the flashing down must not thereby be playing an
 * easier game, and one who turns it up must not be playing a harder one. This is the same rule
 * `docs/decisions/0022-frame-rate-is-a-feature.md` applies to device scaling: anything that varies
 * for comfort must be incapable of changing the outcome. `tests/assist.test.ts` holds the ban list.
 *
 * ── THE PROPERTY THAT MAKES THE SET SAFE TO GROW ────────────────────────────────────────────────
 *
 * **Every knob is monotone: no combination of assists is harder than a less-assisted one.** That is
 * asserted exhaustively over the whole product of settings, not sampled — the space is 144 states
 * and comparing all of them costs nothing. It is what lets a knob be added later without anybody
 * re-reasoning about the interactions.
 */

/**
 * The knobs. A closed set of small ladders, each ordered least-assisted first, so "more assist" is a
 * position rather than a judgement.
 */
export interface Assists {
  /** How fast the world runs. The one knob that touches everything at once. */
  pace: 'full' | 'steady' | 'gentle';
  /** How much damage the player takes. `proof` is the end of the ladder: none. */
  resilience: 'standard' | 'hardy' | 'proof';
  /** How big the player's hurtbox is relative to the ship drawn around it. */
  hurtbox: 'exact' | 'forgiving';
  /** Whether scenery hurts, or merely stops. */
  terrain: 'lethal' | 'solid';
  /** Whether owned specials fire themselves the moment their cooldown is up. */
  specials: 'manual' | 'auto';
  /** Whether the ship holds its own `along` position, leaving the player only the dodge lane. */
  flight: 'manual' | 'assisted';
}

/** The game as designed. Every knob at its least-assisted position — this IS the vibrant default. */
export const DEFAULT_ASSISTS: Assists = {
  pace: 'full',
  resilience: 'standard',
  hurtbox: 'exact',
  terrain: 'lethal',
  specials: 'manual',
  flight: 'manual',
};

/**
 * Every knob, least-assisted first.
 *
 * An explicit list rather than anything derived, per
 * `docs/decisions/0016-a-hub-enumerates-kinds.md` — and it is what the monotonicity proof walks, so
 * a knob missing from here is a knob nobody checked.
 */
export const ASSIST_LADDER = {
  pace: ['full', 'steady', 'gentle'],
  resilience: ['standard', 'hardy', 'proof'],
  hurtbox: ['exact', 'forgiving'],
  terrain: ['lethal', 'solid'],
  specials: ['manual', 'auto'],
  flight: ['manual', 'assisted'],
} as const satisfies { [K in keyof Assists]: readonly Assists[K][] };

/** The knob names, closed and written out, so the table above cannot quietly lose a row. */
export const ASSIST_KNOBS: readonly (keyof Assists)[] = [
  'pace',
  'resilience',
  'hurtbox',
  'terrain',
  'specials',
  'flight',
];

/**
 * What the model reads.
 *
 * ⚠️ **Every field here is oriented so that LOWER IS NEVER HARDER.** That orientation is the whole
 * reason the monotonicity proof can be a single comparison over every field rather than a per-field
 * argument, so a new field must be phrased to fit it — `playerDamage`, not `playerToughness`.
 */
export interface Tuning {
  /** Sim seconds consumed per real second. */
  timeRate: number;
  /** Multiplier on damage dealt to the player. */
  playerDamage: number;
  /** Multiplier on the player's hurtbox radius. */
  hurtbox: number;
  /** Damage per contact with scenery. */
  terrainDamage: number;
}

/**
 * What the model grants.
 *
 * ⚠️ **Every field here is oriented so that TRUE IS NEVER HARDER**, for the same reason as above:
 * these are capabilities the player gains, never obligations they take on.
 */
export interface Granted {
  /** Owned specials fire on cooldown with no input. */
  autoSpecial: boolean;
  /** The ship keeps its `along` position by itself. */
  holdsAlong: boolean;
}

const PACE: Record<Assists['pace'], number> = { full: 1, steady: 0.85, gentle: 0.7 };
const RESILIENCE: Record<Assists['resilience'], number> = { standard: 1, hardy: 0.5, proof: 0 };
const HURTBOX: Record<Assists['hurtbox'], number> = { exact: 1, forgiving: 0.7 };
const TERRAIN: Record<Assists['terrain'], number> = { lethal: 1, solid: 0 };

/** The model's numbers under a given set of assists. Pure lookup — no branching to get wrong. */
export function tuningFor(assists: Assists): Tuning {
  return {
    timeRate: PACE[assists.pace],
    playerDamage: RESILIENCE[assists.resilience],
    hurtbox: HURTBOX[assists.hurtbox],
    terrainDamage: TERRAIN[assists.terrain] * RESILIENCE[assists.resilience],
  };
}

/** The capabilities a given set of assists hands the player. */
export function grantedBy(assists: Assists): Granted {
  return {
    autoSpecial: assists.specials === 'auto',
    holdsAlong: assists.flight === 'assisted',
  };
}
