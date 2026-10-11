/**
 * The title track plays in the menu — `docs/decisions/0597-the-title-track-plays-in-the-menu.md`, item 5 of
 * [`the-secret-pilots-planned`](../reports/the-secret-pilots-planned-2026-10-11.md). The page: *"title → menu
 * music"*, read as the title track carried on into the menu.
 *
 * ⚠️ **THE MIXER IS DRIVEN THROUGH A CONTEXT THAT WRITES DOWN WHAT IT IS TOLD**, because a guard cannot reach a
 * closure over a real `AudioContext` from node (0117's reason `levelWrites` is exported). Every node records what
 * it is connected to and every parameter what is written on it, so the run's bus and the title's are FOUND by
 * following a title source down the graph — the test adds nothing to the mixer's surface to be able to ask.
 *
 * Which screens want it is `titleWanted`'s, asked here over every screen; that the built page bakes it on a menu and
 * plays it is `tests/sound.browser.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import {
  BAR_SECONDS,
  MUSIC_GAIN,
  MUSIC_LAYERS,
} from '../src/content/music.ts';
import { TITLE_BARS, TITLE_PARTS, TITLE_SCORE, titleLevelAt, titleMoves, type TitlePartName } from '../src/content/title-track.ts';
import {
  TITLE_HANDOVER_SECONDS,
  TITLE_PART_NAMES,
  TITLE_PASS_SECONDS,
  bakeTitlePart,
  makeMusicOut,
  titleWanted,
} from '../src/app/music.ts';
import { SCREENS, type Screen } from '../src/state/screens.ts';
import { SOUND_KINDS } from '../src/content/sound.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { THEME_KINDS, barsOf } from '../src/content/themes.ts';

/** One write on a parameter, as the fake context saw it. */
interface Write {
  kind: 'set' | 'ramp' | 'target' | 'cancel';
  value: number;
  at: number;
}

interface FakeNode {
  out: FakeNode[];
  connect(to: FakeNode): void;
}
interface FakeParam {
  value: number;
  writes: Write[];
}
interface FakeSource extends FakeNode {
  buffer: { length: number } | null;
  loop: boolean;
  started: number | null;
  stopped: number | null;
}

const param = (value = 1): FakeParam & Record<string, unknown> => {
  const p = {
    value,
    writes: [] as Write[],
    setValueAtTime(v: number, at: number) {
      p.writes.push({ kind: 'set', value: v, at });
    },
    linearRampToValueAtTime(v: number, at: number) {
      p.writes.push({ kind: 'ramp', value: v, at });
    },
    setTargetAtTime(v: number, at: number) {
      p.writes.push({ kind: 'target', value: v, at });
    },
    cancelScheduledValues(at: number) {
      p.writes.push({ kind: 'cancel', value: Number.NaN, at });
    },
  };
  return p;
};

function fakeContext(): { ctx: AudioContext; sources: FakeSource[]; buffers: number; now(t: number): void } {
  const sources: FakeSource[] = [];
  let buffers = 0;
  const node = <T extends object>(extra: T): T & FakeNode => {
    const n = {
      ...extra,
      out: [] as FakeNode[],
      connect(to: FakeNode) {
        n.out.push(to);
      },
    };
    return n;
  };
  const ctx = {
    currentTime: 0,
    sampleRate: SAMPLE_RATE,
    createGain: () => node({ gain: param() }),
    createStereoPanner: () => node({ pan: param(0) }),
    createWaveShaper: () => node({ curve: null, oversample: 'none' }),
    createDynamicsCompressor: () =>
      node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }),
    createBuffer: (_channels: number, length: number) => {
      buffers++;
      const data = new Float32Array(length);
      return { length, getChannelData: () => data };
    },
    createBufferSource: () => {
      const s = node({
        buffer: null as FakeSource['buffer'],
        loop: false,
        started: null as number | null,
        stopped: null as number | null,
        start(at: number) {
          s.started = at;
        },
        stop(at: number) {
          s.stopped = at;
        },
      });
      sources.push(s);
      return s;
    },
  };
  return {
    ctx: ctx as unknown as AudioContext,
    sources,
    get buffers() {
      return buffers;
    },
    now(t: number) {
      ctx.currentTime = t;
    },
  };
}

/** A loop of silence for every layer — the mixer copies them, and what is in them is not what is asked here. */
const silentLoops = (): Record<(typeof MUSIC_LAYERS)[number], Float32Array> =>
  Object.fromEntries(MUSIC_LAYERS.map((layer) => [layer, new Float32Array(64)])) as never;
const silentTitle = (): Record<TitlePartName, Float32Array> =>
  Object.fromEntries(TITLE_PART_NAMES.map((name) => [name, new Float32Array(32)])) as never;

/** The title sources, which are the ones whose buffer is one of the title's lengths. */
const titleSources = (sources: FakeSource[]): FakeSource[] => sources.filter((s) => s.buffer?.length === 32);
const runSources = (sources: FakeSource[]): FakeSource[] => sources.filter((s) => s.buffer?.length === 64);

/** The bus a source reaches: its gain, that gain's panner, the panner's bus. */
const busOf = (source: FakeSource): FakeParam => {
  const gain = source.out[0]!;
  const pan = gain.out[0]!;
  return (pan.out[0] as unknown as { gain: FakeParam }).gain;
};

/** The value a parameter's last write before `at` left it heading for. */
const headingAt = (p: FakeParam, at: number): number => {
  let value = p.value;
  for (const w of p.writes) if (w.kind !== 'cancel' && w.at <= at + 1e-9) value = w.value;
  return value;
};

describe('0597 — the title track plays in the menu', () => {
  it('reads the score as the album does: from silence the first time round, and from where it ended after that', () => {
    const drone = titleMoves('drone', false);
    expect(titleLevelAt(drone, 0), 'the first pass does not open from silence').toBe(0);
    expect(titleLevelAt(drone, 0.5), 'the drone does not rise across the first bar').toBeCloseTo(0.5, 9);
    expect(titleLevelAt(drone, 1)).toBe(1);
    // The riff lets the floor go over all eight bars of its section.
    expect(titleLevelAt(drone, 12), 'the drone does not take the riff’s eight-bar glide').toBeCloseTo(1 + (0.32 - 1) * 0.5, 9);
    const last = TITLE_SCORE[TITLE_SCORE.length - 1]!.parts;
    for (const name of TITLE_PART_NAMES) {
      const again = titleMoves(name, true);
      expect(titleLevelAt(again, 0), `${name} does not enter the second pass where the first left it`).toBe(last[name] ?? 0);
      expect(titleLevelAt(again, 1), `${name} is not at the opening's level a bar into the second pass`).toBe(TITLE_SCORE[0]!.parts[name] ?? 0);
    }
    expect(TITLE_BARS * BAR_SECONDS, 'a pass is not the score').toBe(TITLE_PASS_SECONDS);
  });

  it('bakes each part to its own level, in the decibels a listener hears', () => {
    for (const name of TITLE_PART_NAMES) {
      const buffer = bakeTitlePart(name, SAMPLE_RATE);
      expect(buffer.length, `${name} is not its own number of bars`).toBe(Math.round(TITLE_PARTS[name].bars * BAR_SECONDS * SAMPLE_RATE));
      let energy = 0;
      for (const v of buffer) energy += (v * MUSIC_GAIN) ** 2;
      const db = 10 * Math.log10(energy / buffer.length);
      expect(db, `${name} sits at ${db.toFixed(2)} dB on the bus, and its row says ${TITLE_PARTS[name].db}`).toBeCloseTo(TITLE_PARTS[name].db, 2);
    }
  }, 60_000);

  it('takes over from the run’s music at a bar, plays the score round, and hands back at a bar letting the title go', () => {
    const fake = fakeContext();
    const music = makeMusicOut(fake.ctx, { connect() {} } as unknown as AudioNode, silentLoops(), SAMPLE_RATE);
    music.title(true);
    expect(titleSources(fake.sources), 'the title played before the music had started').toHaveLength(0);
    music.start();
    const anchor = runSources(fake.sources)[0]!.started!;
    fake.now(0.3);
    music.title(true);
    expect(titleSources(fake.sources), 'the title played before it was baked').toHaveLength(0);

    music.setTitle(silentTitle());
    expect(music.hasTitle()).toBe(true);
    music.title(true);
    const first = titleSources(fake.sources);
    expect(first, 'not one source per part').toHaveLength(TITLE_PART_NAMES.length);
    const when = first[0]!.started!;
    expect(first.every((s) => s.started === when && s.loop), 'the parts did not start together, looping').toBe(true);
    const bars = (when - anchor) / BAR_SECONDS;
    expect(Math.abs(bars - Math.round(bars)), 'the title did not start on the run’s bar grid').toBeLessThan(1e-9);
    expect(when, 'the title started in the past').toBeGreaterThan(0.3);
    expect(when - 0.3, 'the title waited more than a bar to take over').toBeLessThanOrEqual(BAR_SECONDS + 0.1);

    const titleBus = busOf(first[0]!);
    const runBus = busOf(runSources(fake.sources)[0]!);
    expect(titleBus, 'the title and the run reach the same bus').not.toBe(runBus);
    expect(headingAt(titleBus, when), 'the title’s bus is not open when it starts').toBe(1);
    expect(headingAt(runBus, when + TITLE_HANDOVER_SECONDS), 'the run’s bed is still up under the title').toBe(0);

    // Half a pass gone: the next pass is written, from the end of this one, and this one stops there.
    fake.now(when + TITLE_PASS_SECONDS / 2 + 0.01);
    music.title(true);
    const second = titleSources(fake.sources).slice(TITLE_PART_NAMES.length);
    expect(second, 'the second pass was not written half way through the first').toHaveLength(TITLE_PART_NAMES.length);
    expect(second.every((s) => Math.abs(s.started! - (when + TITLE_PASS_SECONDS)) < 1e-9), 'the second pass does not begin where the first ends').toBe(true);
    expect(first.every((s) => Math.abs(s.stopped! - (when + TITLE_PASS_SECONDS)) < 1e-9), 'the first pass does not stop where the second begins').toBe(true);
    // And once, not every frame.
    music.title(true);
    expect(titleSources(fake.sources)).toHaveLength(TITLE_PART_NAMES.length * 2);

    // A run: the title hands back at a bar, over a bar, and lets its buffers go.
    const at = when + TITLE_PASS_SECONDS * 0.75;
    fake.now(at);
    music.title(false);
    expect(music.hasTitle(), 'a run still holds the title track').toBe(false);
    const until = second[0]!.stopped!;
    const handBars = (until - TITLE_HANDOVER_SECONDS - anchor) / BAR_SECONDS;
    expect(Math.abs(handBars - Math.round(handBars)), 'the hand-back did not begin on a bar').toBeLessThan(1e-9);
    expect(until - at, 'the hand-back took more than two bars').toBeLessThanOrEqual(BAR_SECONDS + TITLE_HANDOVER_SECONDS + 0.1);
    expect(second.every((s) => s.stopped === until), 'a title source played on into the run').toBe(true);
    expect(headingAt(runBus, until), 'the run’s music did not come back').toBe(1);
    expect(headingAt(titleBus, until), 'the title’s bus did not close').toBe(0);
    expect(music.titlePass()).toBeNull();
    // And it does not come back until it is baked again.
    music.title(true);
    expect(titleSources(fake.sources)).toHaveLength(TITLE_PART_NAMES.length * 2);
  });

  it('is silenced with the music, and starts again when the sound comes back on', () => {
    const fake = fakeContext();
    const music = makeMusicOut(fake.ctx, { connect() {} } as unknown as AudioNode, silentLoops(), SAMPLE_RATE);
    music.start();
    music.setTitle(silentTitle());
    music.title(true);
    expect(titleSources(fake.sources)).toHaveLength(TITLE_PART_NAMES.length);
    fake.now(1);
    music.setOn(false);
    expect(titleSources(fake.sources).every((s) => s.stopped !== null), 'off left the title playing').toBe(true);
    music.title(true);
    expect(titleSources(fake.sources), 'the title started with the sound off').toHaveLength(TITLE_PART_NAMES.length);
    music.setOn(true);
    music.title(true);
    expect(titleSources(fake.sources), 'the title did not come back with the sound').toHaveLength(TITLE_PART_NAMES.length * 2);
  });

  it('is wanted on every screen that is not part of a run, and on none that is, nor in the music room, nor with the sound off', () => {
    for (const screen of Object.keys(SCREENS) as Screen[]) {
      expect(titleWanted(screen, null, 'on'), `${screen}: the menu's title ${SCREENS[screen].inRun ? 'plays in a run' : 'does not play'}`).toBe(
        !SCREENS[screen].inRun,
      );
      expect(titleWanted(screen, 'nebula', 'on'), `${screen}: the title played over a place being auditioned`).toBe(false);
      for (const sound of SOUND_KINDS) {
        if (sound !== 'on') expect(titleWanted(screen, null, sound), `${screen}: the title is held with the sound ${sound}`).toBe(false);
      }
    }
    expect(Object.values(SCREENS).some((row) => !row.inRun), 'no screen is a menu, so this asked nothing').toBe(true);
    expect(Object.values(SCREENS).some((row) => row.inRun), 'no screen is part of a run, so this asked nothing').toBe(true);
  });

  it('BUDGET: is held only off a run, so what a run holds never has it beside it', () => {
    /*
      ⚠️ **THE 145 MB A PLACE MAY HOLD AT ITS PEAK IS `tests/sound.test.ts`'s, AND THIS IS THE TITLE'S SHARE OF IT.**
      The menu holds the title beside whatever place a run left loaded until the shared set is baked back — The Black
      Heart's 88.6 MB after the last level — so the title plus the largest set any place holds must sit under the
      line. In a run it is let go (above), which is what keeps it out of the 141 MB a boss fight already holds.
    */
    const MB = (bars: number): number => (bars * BAR_SECONDS * SAMPLE_RATE * 4) / 1e6;
    const title = MB(TITLE_PART_NAMES.reduce((sum, name) => sum + TITLE_PARTS[name].bars, 0));
    const largest = Math.max(...THEME_KINDS.map((place) => MB(MUSIC_LAYERS.reduce((sum, layer) => sum + barsOf(place, layer), 0))));
    expect(
      title + largest,
      `the menu holds ${title.toFixed(1)} MB of title beside a place's ${largest.toFixed(1)} MB, against a BUDGET of 145 MB — ` +
        'owned by whoever is willing to shorten a part or let the menu wait for its music',
    ).toBeLessThan(145);
  });
});
