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
import { RUMBLE_KINDS } from '../content/rumble.ts';
import { TRAVEL_KINDS } from '../content/travel.ts';
import { INTRO_KINDS } from '../content/intro.ts';
import { HAND_KINDS, STEER_KINDS } from '../content/touch.ts';
import { CREDIT_KINDS } from '../content/credits.ts';
import { ACTION_NAMES, BINDABLE_PAD_BUTTONS, KEY_CODE, RESERVED_KEYS, SPECIAL_BINDINGS, type Action, type KeyBindings } from '../content/actions.ts';
import type { SettingsState } from '../state/slices/settings.ts';
import { type Lift, type Store, lifted } from './store.ts';

/** Where the settings live. Named once; `PRIVACY.md` names it too, and a test holds the two together. */
export const SETTINGS_KEY = 'itc_settings';

/** The shape's version. A change an old document cannot be read as bumps it. */
export const SETTINGS_VERSION = 1;

/** Every older version lifted to the next — 0643, on `HANGAR_LIFTS`'s terms. Empty at version 1. */
export const SETTINGS_LIFTS: readonly Lift[] = [];

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

/**
 * The keys a document binds, or `fallback` — 0664. All or nothing: every action one or two keys of a code's
 * shape, none reserved, and no key on two actions. A binding read half-right is a game some key does not work in,
 * and the defaults are a game every key does.
 */
function keysFrom(raw: unknown, fallback: KeyBindings): KeyBindings {
  if (typeof raw !== 'object' || raw === null) return fallback;
  const doc = raw as Partial<Record<Action, unknown>>;
  const keys = {} as Record<Action, readonly string[]>;
  const seen: string[] = [];
  for (const action of ACTION_NAMES) {
    const codes = doc[action];
    if (!Array.isArray(codes) || codes.length < 1 || codes.length > 2) return fallback;
    const read: string[] = [];
    for (const code of codes) {
      if (typeof code !== 'string' || !KEY_CODE.test(code) || RESERVED_KEYS.includes(code) || seen.includes(code)) return fallback;
      seen.push(code);
      read.push(code);
    }
    keys[action] = read;
  }
  return keys;
}

/** The pad buttons a document binds, or `fallback` — 0664, on `keysFrom`'s all-or-nothing terms. */
function padFrom(raw: unknown, fallback: readonly number[]): readonly number[] {
  if (!Array.isArray(raw) || raw.length !== SPECIAL_BINDINGS) return fallback;
  const read: number[] = [];
  for (const button of raw) {
    if (typeof button !== 'number' || !BINDABLE_PAD_BUTTONS.includes(button) || read.includes(button)) return fallback;
    read.push(button);
  }
  return read;
}

/** The fields of `settings` that are kept. */
export function keptOf(settings: SettingsState): KeptSettings {
  return {
    sound: settings.sound,
    rumble: settings.rumble,
    travel: settings.travel,
    // 0674: which flights play the intro.
    intro: settings.intro,
    difficulty: settings.difficulty,
    hand: settings.hand,
    steer: settings.steer,
    credits: settings.credits,
    // 0664: the bindings.
    keys: settings.keys,
    pad: settings.pad,
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
  const read = lifted(data, SETTINGS_VERSION, SETTINGS_LIFTS);
  if (read === null) return base;
  const doc = read as Partial<Record<keyof KeptSettings | 'v', unknown>>;
  return {
    sound: oneOf(SOUND_KINDS, doc.sound, base.sound),
    /*
      0613: whether a landing is felt — a new field on version 1, on 0512's per-field terms: a document written
      before it has none and reads as the default, and an older build reading one with it ignores the field.
    */
    rumble: oneOf(RUMBLE_KINDS, doc.rumble, base.rumble),
    travel: oneOf(TRAVEL_KINDS, doc.travel, base.travel),
    /*
      0674: which flights play the intro, on 0512's per-field terms: a document written before it has no field and
      reads as Every flight, 0635's rule it was flying under; an older build reading one with it ignores the field.
    */
    intro: oneOf(INTRO_KINDS, doc.intro, base.intro),
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
    /*
      0664: the bindings, on 0512's per-field terms — a document written before them reads as the defaults, and an
      older build reading one with them ignores the fields.
    */
    keys: keysFrom(doc.keys, base.keys),
    pad: padFrom(doc.pad, base.pad),
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
