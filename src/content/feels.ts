/**
 * What a landing feels like in the hands — `docs/decisions/0613-the-dance-is-earned.md`.
 *
 * Asked for of the Hamster Ball: *"hamster ball needs some haptic feedback or something for when you hit a
 * ship or an enemy, but it can't be overwhelming because it's a lot."* The frame says which of these
 * happened (`onFeel`), and the shell plays it on the pad (`src/app/pad.ts`) — or does not, by the player's
 * own setting (`src/content/rumble.ts`), which this file must never import and the frame must never see.
 *
 * ⚠️ **A TABLE OF EVENTS, AND NOT THE SETTING.** The split is `src/content/cues.ts` against
 * `src/content/sound.ts` exactly: the frame names what happened, so it imports this; whether the hands feel
 * it is a comfort knob, and a step that could read a comfort knob could branch on it (0024).
 * `tests/ball.test.ts` holds that the frame cannot see the setting.
 *
 * ⚠️ **LIGHT, AND NEVER MORE THAN ONE PULSE A TENTH OF A SECOND.** A ball pressed into a wave lands a dozen
 * times a second; a pulse for each would be the overwhelming part. So a landing is the faintest pulse the
 * motors make, on the light motor alone; a kill or a landing on a boss is a little more; a shield burnt off
 * by the heat is the one strong pulse, because it is the one thing about the ram the player must not miss.
 * Inside `FEEL_GAP_MS` of a pulse only a stronger one is played, so a burst of landings is one pulse.
 */

/** Every feel, weakest first — the order is the rank a stronger feel overrides a weaker one by. Closed. */
export const FEEL_KINDS = ['knock', 'smash', 'ready', 'burn'] as const;

/** Derived from the list, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export type FeelKind = (typeof FEEL_KINDS)[number];

export interface FeelRow {
  /** The heavy motor, nought to one — the Gamepad API's `strongMagnitude`. */
  readonly strong: number;
  /** The light motor, nought to one — `weakMagnitude`. */
  readonly weak: number;
  /** How long the pulse runs, in milliseconds. */
  readonly ms: number;
  /** How long a phone buzzes for it, in milliseconds — `navigator.vibrate`, which has no magnitude. */
  readonly buzz: number;
}

/**
 * Every number a play number. The first three are under a quarter of the light motor's range and a few
 * hundredths of a second: felt as a tap, never as a hum.
 */
export const FEELS: Record<FeelKind, FeelRow> = {
  // The ball lands on a body: a tap on the light motor alone.
  knock: { strong: 0, weak: 0.2, ms: 35, buzz: 6 },
  // It kills what it landed on, or lands on a boss: a firmer tap, the heavy motor just turning.
  smash: { strong: 0.12, weak: 0.32, ms: 55, buzz: 12 },
  // The War Dance's bar is full: two motors briefly, so it is felt as news and not as a hit.
  ready: { strong: 0.08, weak: 0.4, ms: 90, buzz: 20 },
  // The heat burns a shield off: the one strong pulse.
  burn: { strong: 0.6, weak: 0.5, ms: 160, buzz: 45 },
};

/**
 * The least time between two pulses, in milliseconds — 0613. A feel inside it is played only if it is
 * stronger than the one before it, so a ball ramming a wave is felt as one tap a tenth of a second at most.
 */
export const FEEL_GAP_MS = 100;
