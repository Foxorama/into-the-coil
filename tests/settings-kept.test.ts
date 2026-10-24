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
import { SOUND_KINDS } from '../src/content/sound.ts';
import { RUMBLE_KINDS } from '../src/content/rumble.ts';
import { TRAVEL_KINDS } from '../src/content/travel.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { GOLFER_KINDS } from '../src/content/golfers.ts';
import { HAND_KINDS, STEER_KINDS } from '../src/content/touch.ts';
import { CREDIT_KINDS } from '../src/content/credits.ts';
import { ACTION_NAMES, DEFAULT_BINDINGS, DEFAULT_PAD_BUTTONS, bindButton, bindKey } from '../src/content/actions.ts';

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
  sound: SOUND_KINDS.find((k) => k !== initialSettings.sound)!,
  rumble: RUMBLE_KINDS.find((k) => k !== initialSettings.rumble)!,
  travel: TRAVEL_KINDS.find((k) => k !== initialSettings.travel)!,
  difficulty: DIFFICULTY_KINDS.find((k) => k !== initialSettings.difficulty)!,
  pilot: GOLFER_KINDS.find((k) => k !== initialSettings.pilot)!,
  hand: HAND_KINDS.find((k) => k !== initialSettings.hand)!,
  steer: STEER_KINDS.find((k) => k !== initialSettings.steer)!,
  credits: CREDIT_KINDS.find((k) => k !== initialSettings.credits)!,
  // 0664: and the bindings — the first trigger on K and the third on the pad's RB.
  keys: bindKey(initialSettings.keys, 'special1', 'KeyK'),
  pad: bindButton(initialSettings.pad, 2, 5),
});

describe('0664 — the controls are kept', () => {
  it('THE ASK: *"make sure it saves properly"* — a key and a pad button rebound read back as they were left', () => {
    const store = memory();
    const chosen = moved();
    writeSettings(store, chosen);
    const back = readSettings(store, initialSettings);
    expect(back.keys.special1, 'the key was forgotten').toEqual(['KeyK']);
    expect(back.keys, 'the bindings read back other than they were written').toEqual(chosen.keys);
    expect(back.pad, 'the pad was forgotten').toEqual([0, 1, 5]);
  });

  it('a document from before the controls reads as the defaults', () => {
    const before = JSON.stringify({ v: SETTINGS_VERSION, sound: 'off' });
    const old = settingsFrom(before, initialSettings);
    expect(old.keys).toBe(DEFAULT_BINDINGS);
    expect(old.pad).toBe(DEFAULT_PAD_BUTTONS);
  });

  it('a forged or broken binding reads as the defaults, whole', () => {
    const doc = (keys: unknown, pad: unknown): string => JSON.stringify({ v: SETTINGS_VERSION, keys, pad });
    const good = { ...DEFAULT_BINDINGS };
    const cases: [string, unknown, unknown][] = [
      ['a key on two actions', { ...good, special1: ['KeyD'] }, DEFAULT_PAD_BUTTONS],
      ['a reserved key', { ...good, special1: ['Escape'] }, DEFAULT_PAD_BUTTONS],
      ['an action with no key', { ...good, special1: [] }, DEFAULT_PAD_BUTTONS],
      ['an action missing', { alongPlus: ['KeyD'] }, DEFAULT_PAD_BUTTONS],
      ['a code that is not one', { ...good, special1: ['<script>'] }, DEFAULT_PAD_BUTTONS],
    ];
    for (const [what, keys, pad] of cases) expect(settingsFrom(doc(keys, pad), initialSettings).keys, what).toBe(DEFAULT_BINDINGS);
    const pads: [string, unknown][] = [
      ['Start on a trigger', [9, 1, 2]],
      ['a button on two triggers', [0, 0, 2]],
      ['two triggers', [0, 1]],
      ['not a list', 'A'],
    ];
    for (const [what, pad] of pads) expect(settingsFrom(doc(good, pad), initialSettings).pad, what).toBe(DEFAULT_PAD_BUTTONS);
  });
});

describe('0664 — a binding never leaves a key on two actions or an action on none', () => {
  it('a key taken from another action leaves it what the rebound one had', () => {
    const keys = bindKey(DEFAULT_BINDINGS, 'special1', 'KeyD');
    expect(keys.special1).toEqual(['KeyD']);
    expect(keys.alongPlus, 'Forward kept D, or lost its arrow').toEqual(['ArrowRight']);
    const lone = bindKey(DEFAULT_BINDINGS, 'special2', 'Space');
    expect(lone.special2).toEqual(['Space']);
    expect(lone.special1, 'the first trigger was left with no key').toEqual(['ShiftLeft', 'ShiftRight']);
    for (const binding of [keys, lone]) {
      const all = ACTION_NAMES.flatMap((action) => binding[action]);
      expect(new Set(all).size, 'a key is on two actions').toBe(all.length);
      for (const action of ACTION_NAMES) expect(binding[action].length, `${action} has no key`).toBeGreaterThan(0);
    }
  });

  it('a pad button taken from another trigger swaps with it', () => {
    expect(bindButton(DEFAULT_PAD_BUTTONS, 0, 1)).toEqual([1, 0, 2]);
    expect(bindButton(DEFAULT_PAD_BUTTONS, 2, 5)).toEqual([0, 1, 5]);
  });
});

describe('0510 — the settings are kept', () => {
  it('THE ASK: the sound, the crossing and the tier read back as they were left', () => {
    const store = memory();
    const chosen = moved();
    writeSettings(store, chosen);
    const back = readSettings(store, initialSettings);
    expect(back.sound).toBe(chosen.sound);
    expect(back.travel).toBe(chosen.travel);
    expect(back.difficulty).toBe(chosen.difficulty);
  });

  it('0512: the touch section is kept too, and a document from before it reads as its defaults', () => {
    const store = memory();
    const chosen = moved();
    writeSettings(store, chosen);
    const back = readSettings(store, initialSettings);
    expect(back.hand, 'the hand was forgotten').toBe(chosen.hand);
    expect(back.steer, 'the steering was forgotten').toBe(chosen.steer);
    // Version 1 as 0510 wrote it, before there was a touch section: still version 1, still read.
    const before = JSON.stringify({ v: SETTINGS_VERSION, sound: chosen.sound, travel: chosen.travel, difficulty: chosen.difficulty });
    const old = settingsFrom(before, initialSettings);
    expect(old.sound, 'a document from before the touch section was thrown away').toBe(chosen.sound);
    expect(old.hand).toBe(initialSettings.hand);
    expect(old.steer).toBe(initialSettings.steer);
  });

  it('0613: the rumble is kept, and a document from before it reads as on', () => {
    const store = memory();
    const chosen = moved();
    writeSettings(store, chosen);
    expect(readSettings(store, initialSettings).rumble, 'the rumble was forgotten').toBe(chosen.rumble);
    const before = JSON.stringify({ v: SETTINGS_VERSION, sound: chosen.sound });
    expect(settingsFrom(before, initialSettings).rumble).toBe(initialSettings.rumble);
    expect(initialSettings.rumble, 'the hands are the loud game by default (0024)').toBe('on');
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
    const doc = { ...JSON.parse(serialiseSettings(chosen)), travel: 'a-crossing-since-dropped' };
    const back = settingsFrom(JSON.stringify(doc), initialSettings);
    expect(back.travel, 'an unknown crossing was trusted').toBe(initialSettings.travel);
    expect(back.sound, 'a bad crossing threw away the sound').toBe(chosen.sound);
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
