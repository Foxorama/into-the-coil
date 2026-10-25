/**
 * The rumble setting: whether a landing is felt in the hands — `docs/decisions/0613-the-dance-is-earned.md`.
 *
 * ⚠️ **A COMFORT KNOB OVER THE HANDS, NOT OVER THE SIM** — 0024. It is read by the shell where a feel is
 * played (`src/app/mount.ts`) and nowhere else; the frame names what happened (`src/content/feels.ts`) and
 * must never be able to see this file, on `src/content/sound.ts`'s terms. `tests/ball.test.ts` scans for it.
 */

/** Every setting for rumble, in the order the chooser offers them. Closed. */
export const RUMBLE_KINDS = ['on', 'off'] as const;

/** Derived from the list, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export type RumbleKind = (typeof RUMBLE_KINDS)[number];

export interface RumbleRow {
  /** What the chooser calls it. */
  title: string;
  /** One line under it — `docs/game.md`'s voice rule: what it is, never why it is good. */
  hint: string;
  /** Whether a feel is played at all. */
  felt: boolean;
}

export const RUMBLES: Record<RumbleKind, RumbleRow> = {
  /*
    0672: the one thing it is felt for, named. The review read *"when the ball lands"* as one ship's special said as
    if it were the rule; the frame plays a feel only for the Hamster Ball's ram (`onFeel`: a landing, a kill, the
    dance's bar full, a shield burnt off), so the rule is the ball's, and the line says whose ball it is.
  */
  on: { title: 'On', hint: 'A pad or phone taps when the Hamster Ball lands.', felt: true },
  off: { title: 'Off', hint: 'Nothing in the hands.', felt: false },
};

/** On, because 0024 says there is one game and it is the loud one; the knob is for a player who asks. */
export const DEFAULT_RUMBLE: RumbleKind = 'on';
