import { describe, expect, it } from 'vitest';
import {
  SETTINGS_KEY,
  SETTINGS_VERSION,
  readSettings,
  serialiseSettings,
  settingsFrom,
  writeSettings,
} from '../src/save/settings.ts';
import type { Store } from '../src/save/store.ts';
import { initialSettings, type SettingsState } from '../src/state/slices/settings.ts';
import { STYLE_KINDS } from '../src/content/styles.ts';
import { SOUND_KINDS } from '../src/content/sound.ts';
import { TRAVEL_KINDS } from '../src/content/travel.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { GOLFER_KINDS } from '../src/content/golfers.ts';
import { HAND_KINDS, STEER_KINDS } from '../src/content/touch.ts';

/**
 * THE SETTINGS ARE KEPT — `docs/decisions/0510-the-settings-are-kept.md`, and the second `itc_*` key.
 *
 * ⚠️ **What is held is what cannot be taken back once it ships**, on 0429's terms: settings a player
 * chose read back as the same settings, a document this version cannot trust reads as the defaults
 * rather than an error, one setting the game no longer has costs that setting and not its neighbours,
 * and the pilot is never kept — it was asked for as *"pick each visit"*.
 */

/** A store over a map, which can be told to refuse. */
function memory(refuse = false): Store & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (refuse) throw new Error('QuotaExceededError');
      data.set(key, value);
    },
  };
}

/** Every setting moved off its default — the first option of each table that is not it. */
const moved = (): SettingsState => ({
  style: STYLE_KINDS.find((k) => k !== initialSettings.style)!,
  sound: SOUND_KINDS.find((k) => k !== initialSettings.sound)!,
  travel: TRAVEL_KINDS.find((k) => k !== initialSettings.travel)!,
  difficulty: DIFFICULTY_KINDS.find((k) => k !== initialSettings.difficulty)!,
  pilot: GOLFER_KINDS.find((k) => k !== initialSettings.pilot)!,
  hand: HAND_KINDS.find((k) => k !== initialSettings.hand)!,
  steer: STEER_KINDS.find((k) => k !== initialSettings.steer)!,
});

describe('0510 — the settings are kept', () => {
  it('THE ASK: the look, the sound, the crossing and the tier read back as they were left', () => {
    const store = memory();
    const chosen = moved();
    writeSettings(store, chosen);
    const back = readSettings(store, initialSettings);
    expect(back.style).toBe(chosen.style);
    expect(back.sound).toBe(chosen.sound);
    expect(back.travel).toBe(chosen.travel);
    expect(back.difficulty).toBe(chosen.difficulty);
  });

  it('0512: the touch section is kept too, and a document from before it reads as its defaults', () => {
    const store = memory();
    const chosen = moved();
    writeSettings(store, chosen);
    const back = readSettings(store, initialSettings);
    expect(back.hand, 'the trigger side was forgotten').toBe(chosen.hand);
    expect(back.steer, 'the steering was forgotten').toBe(chosen.steer);
    // Version 1 as 0510 wrote it, before there was a touch section: still version 1, still read.
    const before = JSON.stringify({ v: SETTINGS_VERSION, style: chosen.style, sound: chosen.sound, travel: chosen.travel, difficulty: chosen.difficulty });
    const old = settingsFrom(before, initialSettings);
    expect(old.style, 'a document from before the touch section was thrown away').toBe(chosen.style);
    expect(old.hand).toBe(initialSettings.hand);
    expect(old.steer).toBe(initialSettings.steer);
  });

  it('the pilot is not kept — written without it, and read as whatever the visit starts with', () => {
    const store = memory();
    writeSettings(store, moved());
    const written: Record<string, unknown> = JSON.parse(store.data.get(SETTINGS_KEY)!);
    expect(Object.keys(written), 'the pilot was written to the key').not.toContain('pilot');
    // Even a document that names one is not believed.
    store.data.set(SETTINGS_KEY, JSON.stringify({ ...written, pilot: moved().pilot }));
    expect(readSettings(store, initialSettings).pilot).toBe(initialSettings.pilot);
  });

  it('one setting the game no longer has costs that setting and not its neighbours', () => {
    const chosen = moved();
    const doc = { ...JSON.parse(serialiseSettings(chosen)), style: 'a-look-since-dropped' };
    const back = settingsFrom(JSON.stringify(doc), initialSettings);
    expect(back.style, 'an unknown look was trusted').toBe(initialSettings.style);
    expect(back.sound, 'a bad look threw away the sound').toBe(chosen.sound);
    expect(back.difficulty).toBe(chosen.difficulty);
  });

  it('a document it cannot trust is the defaults — never an error', () => {
    const doc = JSON.parse(serialiseSettings(moved()));
    expect(settingsFrom(JSON.stringify({ ...doc, v: SETTINGS_VERSION + 1 }), initialSettings)).toBe(initialSettings);
    expect(settingsFrom('{not json', initialSettings)).toBe(initialSettings);
    expect(settingsFrom('null', initialSettings)).toBe(initialSettings);
    expect(settingsFrom(null, initialSettings)).toBe(initialSettings);
    const throwing: Store = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {},
    };
    expect(readSettings(throwing, initialSettings)).toBe(initialSettings);
    expect(readSettings(null, initialSettings)).toBe(initialSettings);
  });

  it('a store that refuses the write does not take the game down', () => {
    expect(() => writeSettings(memory(true), moved())).not.toThrow();
    expect(() => writeSettings(null, moved())).not.toThrow();
  });
});
