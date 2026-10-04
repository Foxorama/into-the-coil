/**
 * Whether a run that runs out can be continued — `docs/decisions/0517-no-quarters-given.md`.
 *
 * Asked for as a title-screen toggle: *"default is No quarters given, other option is Freeplay.
 * Freeplay works exactly like the game works now. No quarters given removes the continue button from
 * the continue screen; it changes into a game over screen that gives the score summary and stats about
 * that run and has a 'Main Menu' button."*
 *
 * ⚠️ **A RULE OF THE RUN, NOT A COMFORT KNOB**, and that is why it is copied onto the run by `begin`
 * the way the tier is (`src/state/slices/run.ts`): `src/state/root.ts` decides which screen a run that
 * ran out goes to, and it reads the run, never the settings — the settings slice takes part in no
 * agreement. It reaches nothing the frame reads; what it changes is which screen comes after the
 * last death.
 */

/** Every way a run may be credited, in the order the band offers them. Closed. */
export const CREDIT_KINDS = ['none', 'free'] as const;

/** Derived from the list, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export type CreditKind = (typeof CREDIT_KINDS)[number];

export interface CreditRow {
  /** What the band calls it. */
  title: string;
  /** One line under it — `docs/game.md`'s voice rule: what it is, never why it is good. */
  hint: string;
  /**
   * Whether a run that runs out is offered a continue. `false` ends it on the game-over screen, with
   * its account and a way back to the title; `true` is the run-over screen and its *Continue* (0068).
   */
  continues: boolean;
}

export const CREDITS: Record<CreditKind, CreditRow> = {
  none: { title: 'No quarters given', hint: 'One credit. When the lives are gone, the run is over.', continues: false },
  free: { title: 'Freeplay', hint: 'Continue where the run ended, as often as you like.', continues: true },
};

/**
 * What a player who has chosen nothing gets — one credit, as asked. The whole run is then one entry on
 * the table, which is what an arcade's high score is.
 */
export const DEFAULT_CREDIT: CreditKind = 'none';
