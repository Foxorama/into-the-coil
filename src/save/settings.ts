/**
 * The settings, kept between visits — `docs/decisions/0510-the-settings-are-kept.md`.
 *
 * Asked for in `reports/the-menus-reviewed-2026-10-02.md`: *"a settings screen that forgets is not a
 * settings screen."* Until this, the look, the sound, the crossing and the difficulty band were back
 * at their defaults on every visit, and only the high-score table outlived the page.
 *
 * ⚠️ **THE SECOND `itc_*` KEY, ON THE FIRST ONE'S TERMS EXACTLY** — `src/save/scores.ts`: versioned
 * from 1, read defensively, never an error on the title. A value the game no longer has is that one
 * setting at its default; the others are still read. `PRIVACY.md` lists the key, and
 * `tests/privacy.test.ts` holds that both ways.
 *
 * ⚠️ **NOT THE PILOT.** The settings slice records it was asked for as *"pick each visit"*, and the
 * key is written without it rather than written and ignored — a field nobody reads is a field the
 * next reader assumes somebody does.
 */

import { DIFFICULTY_KINDS } from '../content/difficulty.ts';
import { SOUND_KINDS } from '../content/sound.ts';
import { STYLE_KINDS } from '../content/styles.ts';
import { TRAVEL_KINDS } from '../content/travel.ts';
import { HAND_KINDS, STEER_KINDS } from '../content/touch.ts';
import { CREDIT_KINDS } from '../content/credits.ts';
import type { SettingsState } from '../state/slices/settings.ts';
import type { Store } from './store.ts';

/** Where the settings live. Named once; `PRIVACY.md` names it too, and a test holds the two together. */
export const SETTINGS_KEY = 'itc_settings';

/** The shape's version. A change an old document cannot be read as bumps it. */
export const SETTINGS_VERSION = 1;

/**
 * What is kept: every setting but the pilot.
 *
 * ⚠️ **AN `Omit` OF THE SLICE, SO A NEW SETTING FAILS TO BUILD HERE** until somebody decides whether
 * it is kept — `keptOf` and `settingsFrom` below each spell the fields out, and a field added to the
 * slice is a field missing from both. *Kept* is a question per setting, and the pilot's answer is no.
 */
export type KeptSettings = Omit<SettingsState, 'pilot'>;

/** `raw` if it is one of `kinds`, or `fallback`. Narrows without a cast — 0016. */
function oneOf<K extends string>(kinds: readonly K[], raw: unknown, fallback: K): K {
  return kinds.find((k) => k === raw) ?? fallback;
}

/** The fields of `settings` that are kept. */
export function keptOf(settings: SettingsState): KeptSettings {
  return {
    style: settings.style,
    sound: settings.sound,
    travel: settings.travel,
    difficulty: settings.difficulty,
    hand: settings.hand,
    steer: settings.steer,
    credits: settings.credits,
  };
}

/**
 * `base` with whatever `text` holds that this version can trust laid over it. Never throws.
 *
 * ⚠️ **PER FIELD, NOT ALL OR NOTHING**, and that is where it parts from the table: a table row is one
 * run and half of one is not a run, but a setting is independent of its neighbours — a look the game
 * has dropped is no reason to forget that the sound was off.
 */
export function settingsFrom(text: string | null, base: SettingsState): SettingsState {
  if (text === null) return base;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return base;
  }
  if (typeof data !== 'object' || data === null) return base;
  const doc = data as Partial<Record<keyof KeptSettings | 'v', unknown>>;
  if (doc.v !== SETTINGS_VERSION) return base;
  return {
    style: oneOf(STYLE_KINDS, doc.style, base.style),
    sound: oneOf(SOUND_KINDS, doc.sound, base.sound),
    travel: oneOf(TRAVEL_KINDS, doc.travel, base.travel),
    difficulty: oneOf(DIFFICULTY_KINDS, doc.difficulty, base.difficulty),
    /*
      0512: the touch section's two. A version-1 document written before them has neither field, and
      reads as their defaults on the per-field rule above — so adding a kept setting is not a new version.
    */
    hand: oneOf(HAND_KINDS, doc.hand, base.hand),
    steer: oneOf(STEER_KINDS, doc.steer, base.steer),
    /*
      0517: the continues band — a player who chose Freeplay is on Freeplay next visit. A document
      written before it has no field and reads as no quarters, on 0512's per-field terms.
    */
    credits: oneOf(CREDIT_KINDS, doc.credits, base.credits),
    pilot: base.pilot,
  };
}

/** The settings as they are written. */
export function serialiseSettings(settings: SettingsState): string {
  return JSON.stringify({ v: SETTINGS_VERSION, ...keptOf(settings) });
}

/** The settings in `store` laid over `base`, or `base`. Never throws. */
export function readSettings(store: Store | null, base: SettingsState): SettingsState {
  if (store === null) return base;
  try {
    return settingsFrom(store.getItem(SETTINGS_KEY), base);
  } catch {
    return base;
  }
}

/**
 * `settings` written to `store`. A store that refuses the write (full, blocked) keeps what it had;
 * the setting still holds for the visit, and nothing else is owed.
 */
export function writeSettings(store: Store | null, settings: SettingsState): void {
  if (store === null) return;
  try {
    store.setItem(SETTINGS_KEY, serialiseSettings(settings));
  } catch {
    // Kept for the visit and not beyond it.
  }
}
