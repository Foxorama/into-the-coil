import { describe, expect, it } from 'vitest';
import { forgetShapes, sampleLayerInto, shapesBuilt } from '../src/app/sound.ts';
import { layerNotes } from '../src/app/music.ts';
import { MUSIC_LAYERS } from '../src/content/music.ts';
import type { CueLayer } from '../src/content/cues.ts';
import { makeRng } from '../src/sim/rng.ts';

/**
 * A SHAPE REUSED IS THE SHAPE BUILT FRESH — `docs/decisions/0425-a-note-shares-its-shape.md`.
 *
 * `sampleLayerInto` computes everything about a note but its pitch, gain and oscillator once per
 * SHAPE and hands it to every later note with the same key. So the one way the reuse can be wrong is
 * a key that leaves out something the shape is made of: two notes that differ only there would share
 * one envelope, sweep or vibrato, and the second would sound like the first. Every audio guard would
 * then measure that music, green.
 *
 * ⚠️ **HELD FIELD BY FIELD, NOT ONLY OVER TODAY'S MUSIC**, because today's music may not happen to hold
 * two voices that differ in exactly one field — and a key missing that field would pass over it. So
 * each field a shape depends on is varied on its own, the varied note sampled right after the first,
 * and compared with the same note sampled after the shapes were forgotten.
 */

const RATE = 44_100;
const bytes = (a: Float32Array): Buffer => Buffer.from(a.buffer, a.byteOffset, a.byteLength);

/** A note with every part of a shape switched on, so each can be varied alone. */
const NOTE: CueLayer = {
  wave: 'saw',
  from: 220,
  to: 330,
  seconds: 0.21,
  gain: 0.5,
  attack: 0.012,
  curve: 1.3,
  release: 0.04,
  lowFrom: 3000,
  lowTo: 1200,
  highFrom: 180,
  highTo: 420,
  q: 0.8,
  vibrato: 9,
  scoop: 40,
} as CueLayer;

/** `layer` sampled into a fresh buffer — after `before` if given, with the shapes forgotten first either way. */
function sampled(layer: CueLayer, wrap: boolean, before?: CueLayer): Float32Array {
  forgetShapes();
  if (before !== undefined) sampleLayerInto(before, RATE, makeRng('shapes').stream('before'), new Float32Array(RATE), 0, wrap);
  const out = new Float32Array(RATE);
  sampleLayerInto(layer, RATE, makeRng('shapes').stream('note'), out, 0, wrap);
  return out;
}

describe('0425 — a note shares its shape, and only with a note of the same shape', () => {
  const varied: [string, Partial<CueLayer>][] = [
    ['seconds', { seconds: 0.23 }],
    ['attack', { attack: 0.02 }],
    ['curve', { curve: 0.6 }],
    ['release', { release: 0.08 }],
    ['the glide', { to: 440 }],
    ['vibrato', { vibrato: 4 }],
    ['scoop', { scoop: 15 }],
    ['highFrom', { highFrom: 250 }],
    ['highTo', { highTo: 900 }],
    ['lowFrom', { lowFrom: 2400 }],
    ['lowTo', { lowTo: 800 }],
    ['q', { q: 1.4 }],
  ];

  it('THE KEY: a note that differs in any one part of its shape does not wear the shape before it', () => {
    const wrong: string[] = [];
    for (const wrap of [true, false]) {
      for (const [field, change] of varied) {
        const other = { ...NOTE, ...change } as CueLayer;
        if (Buffer.compare(bytes(sampled(other, wrap, NOTE)), bytes(sampled(other, wrap))) !== 0) {
          wrong.push(`${field}${wrap ? '' : ' (a cue)'}`);
        }
      }
    }
    expect(wrong, 'these parts of a shape are missing from its key, so a note wore the shape of the note before it').toEqual([]);
  });

  it('and a note that differs only in pitch and weight DOES share it, or there is nothing here to hold', () => {
    // Same shape, other pitch: the reuse must happen and must be exact — sampled after, and fresh.
    const other = { ...NOTE, from: 330, to: 495, gain: 0.3 } as CueLayer;
    const after = sampled(other, true, { ...NOTE, from: 110, to: 165 } as CueLayer);
    expect(shapesBuilt(), 'two notes of one shape built two shapes, so nothing is ever reused').toBe(1);
    expect(Buffer.compare(bytes(after), bytes(sampled(other, true)))).toBe(0);
  });

  it('OVER THE MUSIC ITSELF: every layer baked with its shapes reused is the layer baked forgetting them', () => {
    const wrong: string[] = [];
    for (const theme of [undefined, 'nebula'] as const) {
      for (const layer of MUSIC_LAYERS) {
        forgetShapes();
        const kept = layerNotes(layer, RATE, theme);
        for (const note of kept.notes) note();
        const fresh = layerNotes(layer, RATE, theme);
        for (const note of fresh.notes) {
          forgetShapes();
          note();
        }
        if (Buffer.compare(bytes(kept.buffer), bytes(fresh.buffer)) !== 0) wrong.push(`${theme ?? 'base'}/${layer}`);
      }
    }
    expect(wrong, 'layers whose notes sound different with their shapes reused').toEqual([]);
  }, 120_000);
});
