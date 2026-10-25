/**
 * The intro setting: which flights play the intro — `docs/decisions/0674-the-intro-is-a-setting.md`.
 *
 * 0635 made every flight play it and owed *"whether an intro every run is welcome or wants a setting"*.
 * Answered: a setting, under Travel.
 *
 * ⚠️ **A COMFORT KNOB OVER WHICH SCREEN A FLIGHT OPENS ON, NOT OVER THE SIM** — 0024. It is read by the
 * shell's `fly` (`src/app/mount.ts`) and nowhere else; the intro does not step the world, so there is no
 * arithmetic behind it for the setting to move, and `src/app/frame.ts` must never be able to see this file,
 * on `src/content/sound.ts`'s terms. `tests/settings.test.ts` scans for it.
 */

/** Every setting for the intro, in the order the chooser offers them. Closed. */
export const INTRO_KINDS = ['every', 'first'] as const;

/** Derived from the list, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export type IntroKind = (typeof INTRO_KINDS)[number];

export interface IntroRow {
  /** What the chooser calls it. */
  title: string;
  /** One line under it — `docs/game.md`'s voice rule: what it is, never why it is good. */
  hint: string;
  /**
   * Whether a flight after the visit's first plays the intro. The first flight of a visit plays it on either
   * row: *First flight* is 0513's rule, the one 0635 reversed.
   */
  everyFlight: boolean;
}

export const INTROS: Record<IntroKind, IntroRow> = {
  every: { title: 'Every flight', hint: 'The intro plays each time you fly.', everyFlight: true },
  first: { title: 'First flight', hint: 'The intro plays once a visit; after that, Fly goes straight in.', everyFlight: false },
};

/** Every flight, 0635's rule, because a save written before the setting existed was flying under it. */
export const DEFAULT_INTRO: IntroKind = 'every';
