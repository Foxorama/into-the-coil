/**
 * The sound setting: whether the game makes any noise at all.
 *
 * `docs/decisions/0072-a-cue-is-baked-and-played.md`, on the shape
 * `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md` landed: a named setting with a list
 * of options, a row in `SCREENS`, and a field on the settings slice.
 *
 * ── WHY THIS IS A SEPARATE FILE FROM THE CUE TABLE ──────────────────────────────────────────────
 *
 * ⚠️ **Because the ban has to be checkable, and one file could not carry both sides of it.**
 * `src/app/frame.ts` names cues — it is the file that knows a shot was fired — so it must be able to
 * import `src/content/cues.ts`. It must NEVER be able to see this file. 0024 closes the door on a
 * comfort setting reaching the model: *"a player who turns the flashing down must not thereby be
 * playing an easier game."* A step that could read whether sound is on is a step that could branch on
 * it, and `tests/sound.test.ts` scans for exactly that, the same way `tests/style.test.ts` scans for
 * the style table.
 *
 * With one file the scan would have to allow the import and check the *usage*, which is a claim about
 * intentions rather than a fact about the import graph — and 0070 chose the graph deliberately,
 * because it *"goes on working after everybody who remembers the reason has gone."*
 */

/** Every setting for sound, in the order the chooser offers them. Closed. */
export const SOUND_KINDS = ['on', 'off'] as const;

/** Derived from the list, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. */
export type SoundKind = (typeof SOUND_KINDS)[number];

export interface SoundRow {
  /** What the chooser calls it. */
  title: string;
  /**
   * One line under it — `docs/game.md`'s voice rule: what it is, never why it is good.
   *
   * ⚠️ On the row rather than in `src/app/chrome.ts`, for the reason `src/content/styles.ts` gives:
   * a second list of explanations goes on saying the old thing the day one of them changes.
   */
  hint: string;
}

export const SOUNDS: Record<SoundKind, SoundRow> = {
  on: { title: 'On', hint: 'Cues for everything that happens.' },
  off: { title: 'Off', hint: 'Silence.' },
};

/**
 * What a player who has chosen nothing gets.
 *
 * ⚠️ **On, because 0024 says there is one game and it is the loud one** — *"fast, bright, full of
 * audio cues and warnings. Nothing in this decision restrains it."* A default of silence would make
 * the whole of this a feature nobody finds, on the same argument `src/content/styles.ts` gives for
 * defaulting to the newer look.
 *
 * ⚠️ **It is not an autoplay problem, and that is worth knowing rather than worrying about.** Every
 * browser refuses to make a sound before the player has touched something, so the honest default is
 * *on* and the first press is what makes it true — `src/app/sound.ts` has the unlock.
 */
export const DEFAULT_SOUND: SoundKind = 'on';
