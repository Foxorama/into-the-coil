/**
 * The picture: a level rendered through the game's own audio graph, in the browser's own nodes.
 *
 * `docs/decisions/0226-the-level-holds-one-loudness.md`.
 *
 * ── WHY THIS EXISTS WHEN `tests/arc.ts` AND `tests/clean.ts` ALREADY MEASURE A LEVEL ────────────
 *
 * ⚠️ **FIVE ANSWERS TO ONE REPORT WERE EACH CORRECT ABOUT A MODEL.** 0215 measured a rate, 0218 an
 * evenness, 0219 a band — and every one of them was computed in node, over a model of the bus, and
 * the sixth report arrived anyway. `docs/decisions/0027-measure-the-picture-not-the-model.md` names
 * this failure and what answers it: an instrument that renders what the player gets. For sound that
 * means the browser's `DynamicsCompressorNode` — which `tests/compress.ts` says out loud it is *"not
 * the browser's implementation"* of — and the browser's `WaveShaperNode`, wired by `makeMusicOut`
 * itself rather than restated here.
 *
 * ⚠️ **AND IN THE UNIT A LISTENER USES.** Every earlier instrument reported unweighted RMS, which a
 * sub-bass layer dominates and an arriving lead barely moves. ITU-R BS.1770's K-weighting is the
 * standard loudness measure and is two biquads; `loud` below is that, in LUFS, over one-second
 * windows. `rms` is kept beside it so the two can be compared.
 *
 * ⚠️ **NOTHING HERE IS A MODEL OF THE MIXER.** `makeMusicOut` builds the graph; `auditionRung` and
 * `auditionAura` say what a run would ask of it; `setLevel` is called on the offline context's own
 * clock, at the same cadence the shell calls it. The only arithmetic added is the analysis.
 */
import {
  auditionAura,
  auditionLength,
  auditionRung,
  bakeLoops,
  levelOfPlace,
  makeMusicOut,
  UNITS_PER_SECOND,
} from '../src/app/music.ts';
import { CUE_LIMIT, MASTER_GAIN, SAMPLE_RATE, limit } from '../src/app/sound.ts';
import { MUSIC_COMPRESSOR, type MusicLevel } from '../src/content/music.ts';
import { THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';

/**
 * 48 kHz, because BS.1770 tabulates its filter coefficients at that rate and a device commonly runs
 * there. The loops are baked at `SAMPLE_RATE` and the browser resamples them, exactly as it does on
 * a real device whose context is not 44.1 kHz.
 */
const RATE = 48000;
/** The same resolution `src/app/sound.ts` samples its ceiling curve at. */
const CURVE_POINTS = 1025;

export interface PictureSecond {
  /** Seconds into the level. */
  second: number;
  /** The rung a run would be on at this second. */
  rung: MusicLevel;
  /** Unweighted RMS of what reaches the speaker, in dBFS. */
  rms: number;
  /** K-weighted loudness of the same second, in LUFS. */
  loud: number;
}

export interface CompressorPoint {
  /** A 1 kHz sine's level into the node, in dBFS. */
  inDb: number;
  /** Its level out, in dBFS, once the detector has settled. */
  outDb: number;
}

export interface Picture {
  theme: ThemeKind;
  seconds: PictureSecond[];
  /** The browser's own compressor, at `MUSIC_COMPRESSOR`, measured on a sine. */
  compressor: CompressorPoint[];
  error?: string;
}

declare global {
  interface Window {
    __picture?: Picture;
  }
}

/**
 * BS.1770-4's two-stage K-weighting at 48 kHz: a high shelf (+4 dB above ~1.5 kHz) then a high-pass
 * at ~38 Hz. The coefficients are the standard's own table, which is why `RATE` is not a knob.
 */
function kWeighted(x: Float32Array): Float32Array {
  const stages = [
    { b0: 1.53512485958697, b1: -2.69169618940638, b2: 1.19839281085285, a1: -1.69065929318241, a2: 0.73248077421585 },
    { b0: 1.0, b1: -2.0, b2: 1.0, a1: -1.99004745483398, a2: 0.99007225036621 },
  ];
  let input = x;
  for (const { b0, b1, b2, a1, a2 } of stages) {
    const y = new Float32Array(input.length);
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < input.length; i++) {
      const x0 = input[i]!;
      const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      y[i] = y0;
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
    input = y;
  }
  return input;
}

function meanSquareDb(buffer: Float32Array, from: number, to: number, offset: number): number {
  let sum = 0;
  let n = 0;
  for (let i = from; i < to && i < buffer.length; i++) {
    sum += buffer[i]! * buffer[i]!;
    n++;
  }
  return n === 0 || sum <= 0 ? -120 : offset + 10 * Math.log10(sum / n);
}

/** Render one level through the shipped graph and return what reaches the speaker. */
async function renderLevel(theme: ThemeKind, seconds: number, step: number): Promise<{ out: Float32Array; rungAt: (s: number) => MusicLevel }> {
  const level = levelOfPlace(theme);
  if (level === null) throw new Error(`${theme} is not a level's place`);
  const total = Math.min(seconds, auditionLength(level) / UNITS_PER_SECOND);
  const ctx = new OfflineAudioContext(1, Math.ceil(total * RATE), RATE);
  /*
    The chain past the music bus, as `src/app/sound.ts` wires it: `master` at `MASTER_GAIN`, then the
    ceiling shaper, then the speaker. The music's own bus — gains, compressor, shaper — is
    `makeMusicOut`'s and is not restated.
  */
  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  const ceiling = ctx.createWaveShaper();
  const curve = new Float32Array(CURVE_POINTS);
  for (let i = 0; i < CURVE_POINTS; i++) curve[i] = limit((i / (CURVE_POINTS - 1)) * 2 - 1, CUE_LIMIT);
  ceiling.curve = curve;
  master.connect(ceiling);
  ceiling.connect(ctx.destination);
  const loops = bakeLoops(SAMPLE_RATE, theme);
  const out = makeMusicOut(ctx as unknown as AudioContext, master, loops, SAMPLE_RATE);
  const drive = (): void => {
    const along = ctx.currentTime * UNITS_PER_SECOND;
    out.setLevel(auditionRung(level, along), auditionAura(level, theme, along), theme);
  };
  /*
    ⚠️ **THE SHELL'S CADENCE, ON THE CONTEXT'S OWN CLOCK.** `OfflineAudioContext.suspend` halts the
    render at a time and hands control back with `currentTime` at that instant, which is the only way
    `setLevel`'s `ctx.currentTime` reads mean anything offline. Every suspend is scheduled before the
    render starts, as the API requires.
  */
  const stops: Promise<void>[] = [];
  for (let t = step; t < total; t += step) {
    stops.push(
      ctx.suspend(t).then(() => {
        drive();
        void ctx.resume();
      }),
    );
  }
  out.start();
  drive();
  const rendered = await ctx.startRendering();
  await Promise.all(stops);
  return { out: rendered.getChannelData(0), rungAt: (s) => auditionRung(level, s * UNITS_PER_SECOND) };
}

/** The browser's compressor at the shipped settings, on a sine, at several input levels. */
async function measureCompressor(): Promise<CompressorPoint[]> {
  const points: CompressorPoint[] = [];
  for (const inDb of [-36, -30, -24, -18, -12, -6, 0]) {
    const ctx = new OfflineAudioContext(1, 2 * RATE, RATE);
    const osc = ctx.createOscillator();
    osc.frequency.value = 1000;
    const level = ctx.createGain();
    level.gain.value = Math.pow(10, inDb / 20);
    const squeeze = ctx.createDynamicsCompressor();
    squeeze.threshold.value = MUSIC_COMPRESSOR.threshold;
    squeeze.knee.value = MUSIC_COMPRESSOR.knee;
    squeeze.ratio.value = MUSIC_COMPRESSOR.ratio;
    squeeze.attack.value = MUSIC_COMPRESSOR.attack;
    squeeze.release.value = MUSIC_COMPRESSOR.release;
    osc.connect(level);
    level.connect(squeeze);
    squeeze.connect(ctx.destination);
    osc.start();
    const rendered = await ctx.startRendering();
    const data = rendered.getChannelData(0);
    // The last second, once the detector has settled; a sine's peak is its RMS times root two.
    const outDb = meanSquareDb(data, RATE, 2 * RATE, 10 * Math.log10(2));
    points.push({ inDb, outDb });
  }
  return points;
}

function analyse(out: Float32Array, rungAt: (s: number) => MusicLevel): PictureSecond[] {
  const weighted = kWeighted(out);
  const seconds: PictureSecond[] = [];
  const whole = Math.floor(out.length / RATE);
  for (let s = 0; s < whole; s++) {
    seconds.push({
      second: s,
      rung: rungAt(s + 0.5),
      rms: meanSquareDb(out, s * RATE, (s + 1) * RATE, 0),
      loud: meanSquareDb(weighted, s * RATE, (s + 1) * RATE, -0.691),
    });
  }
  return seconds;
}

function show(picture: Picture): void {
  const pre = document.getElementById('out');
  if (pre === null) return;
  const lines: string[] = [];
  lines.push(`the picture — ${picture.theme}, through the browser's own graph at ${RATE} Hz`);
  lines.push('');
  lines.push('  time   rung        rms dBFS    LUFS    step');
  let previous: number | null = null;
  for (const s of picture.seconds) {
    const step = previous === null ? 0 : s.loud - previous;
    previous = s.loud;
    const mm = String(Math.floor(s.second / 60));
    const ss = String(s.second % 60).padStart(2, '0');
    lines.push(
      `  ${mm}:${ss}   ${s.rung.padEnd(10)}  ${s.rms.toFixed(1).padStart(7)}  ${s.loud.toFixed(1).padStart(7)}  ${(step >= 0 ? '+' : '') + step.toFixed(1)}`,
    );
  }
  lines.push('');
  lines.push('the compressor, on a 1 kHz sine');
  for (const p of picture.compressor) lines.push(`  in ${p.inDb.toFixed(0).padStart(4)}  out ${p.outDb.toFixed(1).padStart(6)}  gain ${(p.outDb - p.inDb).toFixed(1)}`);
  pre.textContent = lines.join('\n');
  pre.classList.remove('dim');
}

async function main(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const theme = (params.get('level') ?? 'approach') as ThemeKind;
  const seconds = Number(params.get('seconds') ?? 90);
  const step = Number(params.get('step') ?? 0.2);
  if (!THEME_KINDS.includes(theme)) throw new Error(`no such place: ${theme}`);
  const compressor = await measureCompressor();
  const { out, rungAt } = await renderLevel(theme, seconds, step);
  const picture: Picture = { theme, seconds: analyse(out, rungAt), compressor };
  show(picture);
  window.__picture = picture;
}

main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  const pre = document.getElementById('out');
  if (pre !== null) pre.textContent = `failed: ${message}`;
  window.__picture = { theme: 'approach', seconds: [], compressor: [], error: message };
});
