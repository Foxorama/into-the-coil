/**
 * The finale: what plays when the last boss is beaten — the heart, alone, racing and breaking open; the
 * Viper inside it; and the two ships flying home together, talking as they go.
 * `docs/decisions/0418-the-heart-lets-go.md`, reshaped by `docs/decisions/0426-the-finale-is-the-fight-going-on.md`.
 *
 * Played, 2026-09-30: *"it doesn't flow nicely"* — it cut from the fight to a veil and a heart staged
 * somewhere else, with the jellyfish that had just exploded back on it — and *"the dialog only works if
 * you played the first game a lot"*; asked for: *"a better heart explosion that flows more freely from
 * the end boss scene and then the ships are flying away and the speech bubbles come out of the ships as
 * they fly away rather than the weird cut to faces."*
 *
 * ⚠️ **THE FIRST FRAME IS THE FIGHT'S LAST.** Nothing here is placed on its own: the heart and the
 * fighter start where the fight left them (`FinaleFrom`), the sky goes on at the rate the fight was
 * scrolling, and everything the finale moves is moved FROM there. What IS authored is in the view's own
 * units — along from its near edge, across the fixed 100 — on `src/content/port.ts`'s terms, every
 * time in steps at 60Hz, and the painter a pure function of one clock (`src/render/finale.ts`).
 */

import { LAUNCH_ACCEL, PORT_EXTENT } from './port.ts';
import { SHIP_BOX } from './sprites.ts';

/** The finale's own pieces, in the order its atlas holds them after the game's and the port's. Closed — 0016. */
export const FINALE_KINDS = ['shard', 'heartGlow', 'ring'] as const;

export type FinaleKind = (typeof FINALE_KINDS)[number];

/** Each piece's square box, in world units. */
export const FINALE_EXTENT: Record<FinaleKind, number> = {
  shard: 6,
  heartGlow: 70,
  ring: 60,
};

/**
 * Where the fight left the two things the finale is about, in the view's units at the moment the last
 * boss's death beat ended: the heart's seat, and the player's ship. Written once by the shell, never
 * in a frame.
 */
export interface FinaleFrom {
  heartAlong: number;
  heartAcross: number;
  shipAlong: number;
  shipAcross: number;
}

/**
 * Every moment the finale turns on, in steps from its first frame — which is the step after the fight's
 * last. No cut anywhere in it: the heart races and bursts in the fight's own sky, the Viper comes out,
 * the fighter comes up beside her, and they fly, talking, until they open their throttles and go.
 */
export const FINALE_BEATS = {
  /** The heart, with nothing left on it, begins to race. 0.5 s. */
  quicken: 30,
  /** Fire starts breaking out of it. 1.2 s. */
  erupt: 72,
  /** It clenches, for the last time. 3.1 s. */
  squeeze: 186,
  /** It bursts, and the Viper is where it was. 3.5 s. */
  burst: 210,
  /** Her engines light — whoever is in her. 4.7 s. */
  viperLit: 282,
  /** The fighter comes up to fly beside her, and she comes round to meet it. 5.0 s. */
  formUp: 300,
  /** Side by side, and the sky is going past faster: they are leaving. 6.8 s. */
  formed: 408,
  /** The golfer in the Viper speaks, from the Viper. 7.0 s. */
  savedSays: 420,
  /** The one who came for them answers, from the fighter. 12.0 s. */
  savingSays: 720,
  /** The Viper opens her throttle. 17.0 s. */
  viperRuns: 1020,
  /** And the fighter with her. 17.3 s. */
  blueRuns: 1038,
  /**
   * The picture fades into the backdrop the victory screen is drawn on, once both are gone. 18.7 s.
   * 1120 from 1116 — 0441: every pilot's ship fills the one 9.4-unit box, wider than the fighter's
   * 7-unit hull, and at 1116 its edge was still five pixels on the widest screen.
   */
  fadeOut: 1120,
  /** The finale is over. 19.2 s. */
  end: 1152,
} as const;

/** How long the finale runs, in steps — its screen's own countdown. */
export const OUTRO_STEPS = FINALE_BEATS.end;

/** Steps between one bubble going and the next one coming, so two lines never read as one. */
export const BUBBLE_GAP = 24;

/** When each golfer's bubble is up, in steps: from when they start to speak to when it goes. */
export const SAVED_BUBBLE = { from: FINALE_BEATS.savedSays, to: FINALE_BEATS.savingSays - BUBBLE_GAP } as const;
export const SAVING_BUBBLE = { from: FINALE_BEATS.savingSays, to: FINALE_BEATS.viperRuns - BUBBLE_GAP / 2 } as const;

/**
 * How many steps a letter of a speech bubble takes to appear, and every how many letters a voice blips.
 * Two steps is thirty letters a second — quick enough that nobody waits on it, slow enough to be heard
 * as speech rather than a caption arriving.
 */
export const LETTER_STEPS = 2;
export const LETTERS_PER_BLIP = 2;

/**
 * The longest line a golfer may say here, in letters — what a line can type out in and still be read,
 * held, before its bubble goes: `LETTER_STEPS` × 72 is 2.4 s of typing, and a bubble is up for five.
 */
export const LINE_LETTERS = 72;

/**
 * How many letters of a line begun at step `from` have been said by step `t` — the first on the step it
 * begins, one more every `LETTER_STEPS`. Not capped at the line's length: the caller has the line.
 */
export function lettersSaid(t: number, from: number): number {
  return t < from ? 0 : Math.floor((t - from) / LETTER_STEPS) + 1;
}

/**
 * Whether the voice blips on step `t` of a line begun at `from`: on the step a letter lands that is the
 * first of each `LETTERS_PER_BLIP`, and not on a space — a blip is a syllable, and a gap is not one.
 */
export function blipsAt(line: string, t: number, from: number): boolean {
  const said = lettersSaid(t, from);
  if (said === 0 || said > line.length || said === lettersSaid(t - 1, from)) return false;
  if ((said - 1) % LETTERS_PER_BLIP !== 0) return false;
  return line[said - 1] !== ' ';
}

/** Smooth from 0 at `from` to 1 at `to`, and flat either side. */
export function ease(t: number, from: number, to: number): number {
  const u = Math.min(1, Math.max(0, (t - from) / (to - from)));
  return u * u * (3 - 2 * u);
}

/*
  ── THE HEART ──────────────────────────────────────────────────────────────────────────────────────
*/

/**
 * The heart's beat, as a period in steps: the fight's own as the finale opens, racing to a flutter by
 * the time it clenches.
 */
export const HEART_PERIOD = { from: 48, to: 8 } as const;

/**
 * How much bigger the heart swells as it races, and how far it clenches before it goes — against its
 * size in the fight, so the first frame is the fight's.
 */
export const HEART_SWELL = 0.16;
export const HEART_CLENCH = 0.8;

/** How far the heart shakes where it stands by the time it clenches, in world units either way. */
export const HEART_SHAKE = 1.6;

/**
 * The fire breaking out of it: this many fireballs between `erupt` and `burst`, closer together as it
 * goes, each somewhere on it within `ERUPT_REACH` of its middle.
 */
export const ERUPTIONS = 16;
export const ERUPT_REACH = 17;

/** The step the `k`th fireball breaks out on — spaced so they come faster and faster into the burst. */
export function eruptionAt(k: number): number {
  const u = k / ERUPTIONS;
  return Math.round(FINALE_BEATS.erupt + (FINALE_BEATS.burst - FINALE_BEATS.erupt) * (1 - (1 - u) * (1 - u)));
}

/**
 * The burst: shards of it, embers, a ring going out, and fire going on after it. How many of each, how
 * fast they leave in units a step, and how long they last. The shards and embers are thrown in the
 * WORLD, so as the ships leave and the sky speeds up, what is left of the heart streams away behind.
 */
export const SHARDS = 30;
export const SHARD_SPEED = 1.1;
export const SHARD_LIFE = 150;
export const EMBERS = 44;
export const EMBER_SPEED = 1.9;
export const EMBER_LIFE = 70;
export const RING_LIFE = 54;
export const RING_GROW = 4.2;
export const AFTER_FIRES = 10;
export const AFTER_FIRE_STEPS = 72;

/*
  ── THE SHIPS ──────────────────────────────────────────────────────────────────────────────────────
*/

/**
 * How big the Viper is drawn against the port's bitmap of her: at the game's scale, the pilot's ship's
 * own (`SHIP_BOX` is the port's `blue` in the fight, since 0441), and a touch bigger, because she is.
 */
export const VIPER_GROW = (SHIP_BOX / PORT_EXTENT.blue) * 1.2;

/** How far the Viper rolls as the heart throws her out, in radians, and how fast she rocks back. */
export const VIPER_TUMBLE = 0.9;
export const VIPER_ROCK = 0.09;

/**
 * Where the two fly together, against the heart the Viper came out of: the pair's middle is `back`
 * behind where it stood — but never nearer the near edge than `least` — across the lane's middle, the
 * Viper `apart` above it and the fighter `below` it and `trail` behind her.
 */
export const PAIR = { back: 24, least: 64, across: 50, apart: 12, below: 14, trail: 12 } as const;

/** How fast the pair gains on the view while they talk, in units a step, and how much they bob. */
export const PAIR_DRIFT = 0.03;
export const PAIR_BOB = { size: 1.4, period: 150 } as const;

/**
 * How much faster the sky goes past once they are together — world units a step, on top of the
 * fight's rate: they are leaving, and the camera goes with them.
 */
export const LEAVING_SCROLL = 0.55;

/**
 * How far the camera has come since the fight's last frame, at `t`, if it was going at `scroll` a step
 * then: the fight's rate throughout, plus `LEAVING_SCROLL` coming up linearly from `formUp` to
 * `formed` — the integral, so the sky never jumps.
 */
export function cameraAt(t: number, scroll: number): number {
  const a = FINALE_BEATS.formUp;
  const b = FINALE_BEATS.formed;
  let gone = scroll * t;
  if (t > a) gone += t <= b ? (LEAVING_SCROLL * (t - a) * (t - a)) / (2 * (b - a)) : (LEAVING_SCROLL * (b - a)) / 2 + LEAVING_SCROLL * (t - b);
  return gone;
}

/** How far a ship that opened her throttle at `go` has gone ahead of her station by `t` — the intro's launch. */
export function launched(t: number, go: number): number {
  if (t <= go) return 0;
  const d = t - go;
  return 0.5 * LAUNCH_ACCEL * d * d;
}

/** Where the pair's middle stands along the view, for a heart that stood at `heartAlong`. */
function pairAlong(heartAlong: number): number {
  return Math.max(PAIR.least, heartAlong - PAIR.back);
}

/** The pair's shared drift at `t`, and its bob across for a ship `phase` steps out of step. */
function drift(t: number): number {
  return PAIR_DRIFT * Math.max(0, t - FINALE_BEATS.formed);
}
function bob(t: number, phase: number): number {
  return PAIR_BOB.size * Math.sin(((t + phase) / PAIR_BOB.period) * Math.PI * 2) * ease(t, FINALE_BEATS.formUp, FINALE_BEATS.formed);
}

/**
 * Where the Viper is at `t`, in the view's units, into `out` — [along, across]. Where the heart was from
 * the burst, until she comes round to her place in the pair, and then with it. Before the burst she is
 * inside the heart and the painter does not draw her.
 */
export function viperAt(t: number, from: FinaleFrom, out: Float64Array): void {
  const come = ease(t, FINALE_BEATS.viperLit, FINALE_BEATS.formed);
  const along = pairAlong(from.heartAlong);
  const across = PAIR.across - PAIR.apart;
  out[0] = from.heartAlong + (along - from.heartAlong) * come + drift(t) + launched(t, FINALE_BEATS.viperRuns);
  out[1] = from.heartAcross + (across - from.heartAcross) * come + bob(t, 0);
}

/** How far the Viper is rolled at `t`: thrown by the burst, rocking back to level as her engines light. */
export function viperTurn(t: number): number {
  if (t < FINALE_BEATS.burst) return 0;
  const settle = 1 - ease(t, FINALE_BEATS.burst, FINALE_BEATS.formUp);
  return VIPER_TUMBLE * settle * Math.cos((t - FINALE_BEATS.burst) * VIPER_ROCK);
}

/**
 * Where the fighter is at `t`, into `out`: where the fight left it until it comes up beside her, and
 * then in the pair — below her and a little behind, so her bubble and its bubble each have sky.
 */
export function fighterAt(t: number, from: FinaleFrom, out: Float64Array): void {
  const come = ease(t, FINALE_BEATS.formUp, FINALE_BEATS.formed);
  const along = pairAlong(from.heartAlong) - PAIR.trail;
  const across = PAIR.across + PAIR.below;
  out[0] = from.shipAlong + (along - from.shipAlong) * come + drift(t) + launched(t, FINALE_BEATS.blueRuns);
  out[1] = from.shipAcross + (across - from.shipAcross) * come + bob(t, PAIR_BOB.period / 3);
}

/**
 * Where each speech bubble points from, against the ship it comes out of — a little ahead of its middle
 * and off its outer side — and which way it hangs: the Viper's over her, into the sky above the pair,
 * and the fighter's under it, into the sky below. ⚠️ The first photograph hung both above, and the
 * fighter's covered the Viper for the whole of its line.
 */
export const SAVED_MOUTH = { ahead: 2, across: -5, hang: 'above' } as const;
export const SAVING_MOUTH = { ahead: 2, across: 5, hang: 'below' } as const;

/**
 * What the finale sounds like, and on which step — on `INTRO_CUES`' terms: each the twin of something
 * drawn on the same step. The golfers' voices are not here: what they say is picked when the finale
 * starts, so the shell plays a blip for every `LETTERS_PER_BLIP` letters of whatever line it is.
 */
export interface FinaleCue {
  at: number;
  cue: 'kill' | 'bossDown' | 'ignite' | 'launch';
}

export const FINALE_CUES: readonly FinaleCue[] = [
  { at: eruptionAt(0), cue: 'kill' },
  { at: eruptionAt(5), cue: 'kill' },
  { at: eruptionAt(9), cue: 'kill' },
  { at: eruptionAt(12), cue: 'kill' },
  { at: eruptionAt(14), cue: 'kill' },
  { at: FINALE_BEATS.burst, cue: 'bossDown' },
  { at: FINALE_BEATS.viperLit, cue: 'ignite' },
  { at: FINALE_BEATS.viperRuns, cue: 'launch' },
  { at: FINALE_BEATS.blueRuns, cue: 'launch' },
];
