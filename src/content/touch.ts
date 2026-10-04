/**
 * The touch section's two settings: which side the trigger discs stand on, and how far the ship goes
 * for a finger's travel — `docs/decisions/0512-the-touch-is-yours.md`.
 *
 * Item 4 of `reports/the-menus-reviewed-2026-10-02.md`, and the answer to *trigger side, sensitivity,
 * both, neither?* was **both**.
 *
 * ⚠️ **COMFORT KNOBS OVER INPUT, NOT OVER THE SIM** — 0024: *no comfort setting may touch the sim*. A
 * hand chooses where a tap is read as a trigger, and a steer chooses how many pixels of drag ask for
 * a full step's travel. Both are answered in `src/app/touch.ts`, which turns a finger into an
 * `Intent`; the frame is handed the same `Intent` it was always handed, and the ship's top speed is
 * the ship's. `tests/touch.test.ts` holds that `src/app/frame.ts` cannot see this table, on
 * `tests/travel.test.ts`'s terms.
 */

/** Which side of the glass the trigger discs stand on. Closed. */
export const HAND_KINDS = ['right', 'left'] as const;

/** Derived from the list, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export type HandKind = (typeof HAND_KINDS)[number];

export interface HandRow {
  /** What the chooser calls it. */
  title: string;
  /** One line under it — `docs/game.md`'s voice rule: what it is, never why it is good. */
  hint: string;
}

export const HANDS: Record<HandKind, HandRow> = {
  right: { title: 'Right', hint: 'Triggers up the right edge, under a right thumb.' },
  left: { title: 'Left', hint: 'Triggers up the left edge, under a left thumb.' },
};

/** Where the discs stood before there was a choice — 0358's leading-low corner. */
export const DEFAULT_HAND: HandKind = 'right';

/** How quick the steering is. Closed, and in the order the band offers them: slowest first. */
export const STEER_KINDS = ['gentle', 'standard', 'quick'] as const;

export type SteerKind = (typeof STEER_KINDS)[number];

export interface SteerRow {
  title: string;
  hint: string;
  /**
   * How much further the ship goes for the same drag, against the gain `reports/touch-gain-2026-08-05.md`
   * measured (`DRAG_GAIN` in `src/app/touch.ts`). One is that measurement, unchanged.
   *
   * ⚠️ **A RATIO AND NOT A GAIN, SO THE MEASUREMENT STAYS WHERE IT WAS MADE.** The gain is a number
   * with a report behind it; a table of three gains would be three numbers, one of which happens to
   * equal it today and drifts the day the report is re-run.
   *
   * ⚠️ **PLAY NUMBERS.** The two ends are a step of 1.4 either side, so *Gentle* and *Quick* are the
   * same distance from the tuned feel in opposite directions.
   */
  ratio: number;
}

export const STEERS: Record<SteerKind, SteerRow> = {
  gentle: { title: 'Gentle', hint: 'More finger for the same move.', ratio: 1 / 1.4 },
  standard: { title: 'Standard', hint: 'The tuned feel.', ratio: 1 },
  quick: { title: 'Quick', hint: 'Less finger for the same move.', ratio: 1.4 },
};

export const DEFAULT_STEER: SteerKind = 'standard';
