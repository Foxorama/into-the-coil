/**
 * The finale: what plays when the last boss is beaten — the jellyfish melting off the heart, the heart
 * bursting, the Viper inside it, whoever was in it, and the two ships leaving together.
 * `docs/decisions/0418-the-heart-lets-go.md`.
 *
 * Asked for 2026-09-29: *"after the boss on level 7 is beaten it cuts to a video of the jellyfish
 * melting away and the heart exploding, inside is the viper ship and it's free'd and you can see inside
 * the ship and it's a random one of the characters that wasn't chosen, they have a speech bubble voice
 * line about being saved and then both ships fly off together into space."* Answered: the golfer in the
 * Viper was Venoma's captive all along, and the heart took her.
 *
 * ⚠️ **ON `src/content/port.ts`'s TERMS THROUGHOUT**: world units in the narrowest view any device can
 * have (213 along, `ACROSS_SPAN` across), every time in steps at 60Hz, and the painter a pure function
 * of one clock (`src/render/finale.ts`). Its atlas is the port's, then these kinds, then the game's —
 * the ships, flames and trails are the intro's, and the jellyfish, the heart and the sky are the last
 * place's own.
 */

/** The finale's own pieces, in the order its atlas holds them after the port's. Closed — 0016. */
export const FINALE_KINDS = ['drip', 'shard', 'heartGlow', 'savedClose', 'savingClose'] as const;

export type FinaleKind = (typeof FINALE_KINDS)[number];

/** Each piece's square box, in world units. The close-ups fill the height of the screen. */
export const FINALE_EXTENT: Record<FinaleKind, number> = {
  drip: 5,
  shard: 9,
  heartGlow: 90,
  savedClose: 124,
  savingClose: 124,
};

/**
 * Every moment the finale turns on, in steps from its first frame. Four shots: **the heart**, held
 * still as the jellyfish melts off it and it bursts; **the Viper's canopy**, close, with the golfer
 * who was in it; **the fighter's**, with the one who came for them; and **the two ships**, together,
 * leaving.
 */
export const FINALE_BEATS = {
  /** The heart comes up out of the backdrop. 0.4 s. */
  fadeIn: 24,
  /** The jellyfish begins to go. 0.5 s. */
  melt: 30,
  /** The heart's beat starts to quicken with nothing on it. 2.5 s. */
  quicken: 150,
  /** The jellyfish is gone. 3.5 s. */
  melted: 210,
  /** The heart bursts, and the Viper is where it was. 4.6 s. */
  burst: 276,
  /** Her engines light — whoever is in her. 5.5 s. */
  viperLit: 330,
  /** Into the backdrop, from 5.8 s. 6.2 s. */
  cutHeart: 372,
  /** The golfer in the Viper starts to speak. 6.8 s. */
  savedSays: 408,
  /** Into the backdrop. 11.0 s. */
  cutSaved: 660,
  /** The one who came for them answers. 11.6 s. */
  savingSays: 696,
  /** Into the backdrop. 15.8 s. */
  cutSaving: 948,
  /** The Viper opens her throttle, and they go. 18.0 s. */
  viperRuns: 1080,
  /** And the fighter with her — beside her this time. 18.6 s. */
  blueRuns: 1116,
  /** The picture fades into the backdrop the victory screen is drawn on. 20.6 s. */
  fadeOut: 1236,
  /** The finale is over. 21.2 s. */
  end: 1272,
} as const;

/** How long the finale runs, in steps — its screen's own countdown. */
export const OUTRO_STEPS = FINALE_BEATS.end;

/** A fade into or out of the backdrop across a cut, in steps — the intro's. */
export const FINALE_FADE = 24;

/**
 * How many steps a letter of a speech bubble takes to appear, and every how many letters a voice blips.
 * Two steps is thirty letters a second — quick enough that nobody waits on it, slow enough to be heard
 * as speech rather than a caption arriving.
 */
export const LETTER_STEPS = 2;
export const LETTERS_PER_BLIP = 2;

/**
 * The longest line a golfer may say here, in letters — what a line can type out in and still be read,
 * held, before its shot ends: `LETTER_STEPS` × 72 is 2.4 s of typing, and the shot gives it four.
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

/** Where the heart stands, and how big it and the jellyfish over it are drawn against their boxes. */
export const HEART = { along: 106, across: 66, grow: 1.7 } as const;
export const JELLY = { along: 106, across: 50, grow: 1.7 } as const;

/** How far the jellyfish sinks as it melts, in world units, and how its drips fall — units a step². */
export const MELT_SINK = 12;
export const DRIP_FALL = 0.018;
/** A drip every so many steps while she melts, and how long one lasts. */
export const DRIP_EVERY = 6;
export const DRIP_LIFE = 70;

/** The heart's burst: how many shards, how fast they leave in units a step, and how long they last. */
export const SHARDS = 18;
export const SHARD_SPEED = 1.3;
export const SHARD_LIFE = 120;

/**
 * The heart's beat, as a period in steps: the fight's own at first, quickening to a flutter as it has
 * nothing left to feed on.
 */
export const HEART_PERIOD = { from: 48, to: 12 } as const;

/**
 * Where each close-up stands, and where its speech bubble points from — the speaker's mouth. `edge` is
 * how far in from the side of the screen the cockpit stands: the Viper's from the near side and the
 * fighter's from the far one, so each hull runs off its own edge on the widest screen as on the
 * narrowest. ⚠️ The first photograph placed both in the narrowest view and the fighter's hull stopped
 * in mid-air on a wider one.
 */
export const SAVED_CLOSE = { edge: 52, across: 62, mouth: 70, mouthAcross: 60 } as const;
export const SAVING_CLOSE = { edge: 52, across: 62, mouth: 70, mouthAcross: 60 } as const;

/** Where along the view a close-up stands, and its speaker's mouth — from the near side, or the far. */
export function closeAlong(alongSpan: number, saving: boolean, inFrom: number): number {
  return saving ? alongSpan - inFrom : inFrom;
}

/**
 * The two ships at the end, flying together: along the lane and across it, drawn at the chase's framing
 * (`OUTSIDE_ZOOM`), and how hard each opens up when they go — the intro's own launch.
 */
export const TOGETHER = {
  viper: { along: 124, across: 48 },
  blue: { along: 98, across: 72 },
} as const;

/**
 * What the finale sounds like, and on which step — on `INTRO_CUES`' terms: each the twin of something
 * drawn on the same step. The golfers' voices are not here: what they say is picked when the finale
 * starts, so the shell plays a blip for every `LETTERS_PER_BLIP` letters of whatever line it is.
 */
export interface FinaleCue {
  at: number;
  cue: 'bossDown' | 'ignite' | 'launch';
}

export const FINALE_CUES: readonly FinaleCue[] = [
  { at: FINALE_BEATS.burst, cue: 'bossDown' },
  { at: FINALE_BEATS.viperLit, cue: 'ignite' },
  { at: FINALE_BEATS.viperRuns, cue: 'launch' },
  { at: FINALE_BEATS.blueRuns, cue: 'launch' },
];
