/**
 * The veins a place's sky carries, and the pulse that runs along them —
 * `docs/decisions/0354-the-heart-has-veins.md`.
 *
 * Asked for: *"Needs veins pulsing throughout the level and a beautiful starry backdrop."*
 *
 * ⚠️ **AUTHORED, AND READ BY BOTH SIDES**, on the pools' own terms (`src/content/pools.ts`): the veins
 * are baked into the weather tile (`STRUCTURE_OF`, `src/render/bake.ts`) and the pulse is blitted
 * along them every frame (`src/render/scene.ts`). A vein described twice is two veins.
 *
 * ⚠️ **EVERY TRUNK CROSSES THE TILE AND MEETS ITSELF**: its height is a base plus whole cycles of sine
 * per tile, so it is the same at both edges in height and in slope — 0206's seam, which a vessel
 * running the length of the level crosses at every tile.
 */

import { BAR_SECONDS, BEAT_SECONDS, type MusicLayer, type MusicLevel } from './music.ts';
import { barsOf, voicesOf, type ThemeKind } from './themes.ts';

/**
 * How far the weather layer moves per unit of camera travel — the layer the veins ride.
 *
 * ⚠️ **HERE RATHER THAN ONLY IN THE SKY'S TABLE, BECAUSE THE FIGHT NEEDS IT TOO — 0400.** A vessel into
 * the heart leaves a trunk where that trunk is on the screen THIS frame, and where a trunk is on the
 * screen is its tile's parallax; the tentacles pull out of the same vessels on the sim's side. The sky's
 * own table (`SKY`, `src/app/mount.ts`) reads this number, so the three agree by construction.
 */
export const WEATHER_DEPTH = 0.09;

/** One wave of a trunk's course: whole cycles per tile, its height in tile fractions, its phase. */
export type VeinWave = readonly [cycles: number, amp: number, phase: number];

/** A vessel that crosses the tile, in fractions of it. */
export interface Trunk {
  readonly base: number;
  readonly waves: readonly VeinWave[];
  /** Its thickness, in tile fractions. */
  readonly width: number;
}

/** A vessel leaving a trunk: which one, where along it, how far it reaches and which way it bends. */
export interface Branch {
  readonly trunk: number;
  readonly at: number;
  readonly reach: number;
  /** The angle it leaves at, in radians from the trunk's own direction; its sign is its side. */
  readonly angle: number;
  /** How much it curls as it goes, in radians over its whole length. */
  readonly curl: number;
}

/** The light that travels along the trunks. */
export interface Pulse {
  /** Beads on each trunk at once, evenly spaced. */
  readonly beads: number;
  /** Steps a bead takes to cross one tile. */
  readonly period: number;
}

/**
 * A heart the player hears, and how strongly the vessels beat to it at each rung of the music — 0401.
 *
 * ⚠️ **THE VOICE THE MUSIC PLAYS, NOT A COPY OF ITS RHYTHM.** `layer` and `voice` name one voice of the
 * place's own arrangement (`voicesOf`), and the beat is read off that voice's `steps` against the loop
 * the layer plays over (`barsOf`) — so a heart that is moved in the music moves in the picture, and there
 * is no second table of when it beats to drift from the first. A rung the entry names no strength for is
 * a rung that heart is not heard in.
 */
export interface HeartVoice {
  readonly layer: MusicLayer;
  readonly voice: number;
  readonly strength: Partial<Record<MusicLevel, number>>;
}

/**
 * A vessel from the place's own into the heart — 0400: it leaves trunk `trunk` `back` world units down
 * the lane from the heart, and meets the heart at `into` (`[along, across]` from its centre), `width`
 * lane units thick there and a trunk's thickness where it leaves.
 */
export interface Artery {
  readonly trunk: number;
  readonly back: number;
  readonly into: readonly [number, number];
  readonly width: number;
}

export interface Veins {
  readonly trunks: readonly Trunk[];
  readonly branches: readonly Branch[];
  readonly pulse: Pulse;
  /** The hearts the vessels beat to, one per stretch of the music — 0401. */
  readonly hearts: readonly HeartVoice[];
  /** The vessels into the heart the last fight is set over — 0400. In the order the tentacles lie in them. */
  readonly arteries: readonly Artery[];
}

/** How long a beat's light takes to fall to a third, in seconds — about a lub's own ring. */
const HEART_DECAY = 0.16;
/** How far back a beat is looked for: past this the light has gone. */
const HEART_LOOKBACK = 0.8;

/**
 * How strongly the heart is beating at `seconds` into the music's loops, at rung `rung` — `0` between
 * beats, the rung's strength on a lub, less on a dub, falling away in between — 0401.
 *
 * ⚠️ **`seconds` IS THE MUSIC'S CLOCK — THE LOOPS' OWN ORIGIN — AND THE CALLER SAYS WHERE IT CAME FROM.**
 * A layer's buffer is its voices laid once from its start and looped at its own length (`layerNotes`,
 * `src/app/music.ts`), so a voice's `i`-th step sounds at `i` steps into every loop and nowhere past its
 * last. Nothing here allocates: the painter asks once a frame.
 */
export function heartAt(theme: ThemeKind, veins: Veins, rung: MusicLevel, seconds: number): number {
  let best = 0;
  for (let h = 0; h < veins.hearts.length; h++) {
    const heart = veins.hearts[h]!;
    const strength = heart.strength[rung];
    if (strength === undefined) continue;
    const voice = voicesOf(theme, heart.layer)[heart.voice];
    if (voice === undefined) continue;
    const loop = BAR_SECONDS * barsOf(theme, heart.layer);
    const step = BEAT_SECONDS / voice.perBeat;
    const perLoop = Math.round(loop / step);
    const into = ((seconds % loop) + loop) % loop;
    const now = Math.floor(into / step);
    for (let k = 0; k * step <= HEART_LOOKBACK; k++) {
      const index = (((now - k) % perLoop) + perLoop) % perLoop;
      const value = index < voice.steps.length ? voice.steps[index] : null;
      if (value === null || value === undefined) continue;
      const since = into - (now - k) * step;
      best = Math.max(best, strength * value * Math.exp(-since / HEART_DECAY));
      break;
    }
  }
  return best;
}

/**
 * Where trunk `trunk` crosses the screen at `inView` world units from the camera's trailing edge, in
 * lane units — the same arithmetic `paintSky` tiles the weather by, so a vessel that leaves a trunk
 * leaves it where it is drawn — 0400.
 */
export function trunkAcross(trunk: Trunk, inView: number, cameraAlong: number, span: number, acrossSpan: number): number {
  const offset = (((cameraAlong * WEATHER_DEPTH) % span) + span) % span;
  const x = (((inView + offset) / span) % 1 + 1) % 1;
  return acrossSpan / 2 + (trunkAt(trunk, x) - 0.5) * span;
}

/**
 * A point `t` of the way along artery `a` into a heart at `heartAlong`, `heartAcross` (world), with the
 * camera at `cameraAlong` — written into `out` as `[along, across]` in world units, because a point
 * returned would be an allocation per length of vessel per frame.
 *
 * ⚠️ **A CUBIC FROM THE TRUNK TO THE HEART**: it leaves along the trunk's own heading, so the join is a
 * branch rather than a kink, and arrives pointing at the heart's middle.
 */
export function arteryAt(
  a: Artery,
  veins: Veins,
  t: number,
  heartAlong: number,
  heartAcross: number,
  cameraAlong: number,
  span: number,
  acrossSpan: number,
  out: Float64Array,
): void {
  const trunk = veins.trunks[a.trunk]!;
  const x0 = heartAlong - a.back;
  const y0 = trunkAcross(trunk, x0 - cameraAlong, cameraAlong, span, acrossSpan);
  const slope = (trunkAcross(trunk, x0 - cameraAlong + 1, cameraAlong, span, acrossSpan) - y0) / 1;
  const x3 = heartAlong + a.into[0];
  const y3 = heartAcross + a.into[1];
  const reach = Math.hypot(x3 - x0, y3 - y0) / 3;
  const norm = Math.hypot(1, slope);
  const x1 = x0 + (reach * 1) / norm;
  const y1 = y0 + (reach * slope) / norm;
  const inward = Math.hypot(a.into[0], a.into[1]) || 1;
  const x2 = x3 + (reach * a.into[0]) / inward;
  const y2 = y3 + (reach * a.into[1]) / inward;
  const u = 1 - t;
  out[0] = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
  out[1] = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
}

/** Where a trunk is at `x` along the tile, both in tile fractions. */
export function trunkAt(trunk: Trunk, x: number): number {
  let y = trunk.base;
  // Indexed: the scene asks this per bead per frame, and an iterator is an allocation.
  for (let i = 0; i < trunk.waves.length; i++) {
    const wave = trunk.waves[i]!;
    y += wave[1] * Math.sin(2 * Math.PI * wave[0] * x + wave[2]);
  }
  return y;
}

/**
 * Which places' skies carry veins — `null` for six of the seven.
 *
 * ⚠️ **FOUR TRUNKS ACROSS THE LANE**, which is tile 0.25 to 0.75: enough that the screen is always
 * threaded with them and few enough that each reads as a vessel rather than a texture.
 */
export const VEINS_OF: Record<ThemeKind, Veins | null> = {
  approach: null,
  nebula: null,
  saurian: null,
  labyrinth: null,
  rime: null,
  mire: null,
  core: {
    trunks: [
      { base: 0.31, waves: [[1, 0.03, 0.4], [3, 0.012, 2.1], [7, 0.004, 0.9]], width: 0.009 },
      { base: 0.44, waves: [[2, 0.028, 1.7], [5, 0.01, 0.3]], width: 0.012 },
      { base: 0.57, waves: [[1, 0.035, 2.8], [4, 0.012, 1.2], [9, 0.003, 2.6]], width: 0.008 },
      { base: 0.69, waves: [[2, 0.022, 0.2], [3, 0.014, 2.9]], width: 0.01 },
    ],
    branches: [
      { trunk: 0, at: 0.12, reach: 0.09, angle: 0.8, curl: 0.5 },
      { trunk: 0, at: 0.48, reach: 0.07, angle: -0.7, curl: -0.4 },
      { trunk: 0, at: 0.81, reach: 0.11, angle: 0.9, curl: 0.3 },
      { trunk: 1, at: 0.27, reach: 0.1, angle: -0.8, curl: -0.6 },
      { trunk: 1, at: 0.63, reach: 0.08, angle: 0.7, curl: 0.4 },
      { trunk: 2, at: 0.05, reach: 0.08, angle: -0.9, curl: 0.5 },
      { trunk: 2, at: 0.4, reach: 0.12, angle: 0.75, curl: -0.3 },
      { trunk: 2, at: 0.72, reach: 0.07, angle: -0.6, curl: -0.5 },
      { trunk: 3, at: 0.2, reach: 0.09, angle: 0.85, curl: 0.4 },
      { trunk: 3, at: 0.56, reach: 0.1, angle: -0.8, curl: 0.5 },
      { trunk: 3, at: 0.9, reach: 0.06, angle: 0.7, curl: -0.4 },
    ],
    pulse: { beads: 3, period: 540 },
    /*
      ⚠️ **ONE HEART A MOVEMENT, AS THE MUSIC HAS IT — 0401.** *"The background arteries for the level
      need to pulse in time with the heartbeat to the music to really sell the 'heartbeat' effect."*
      0331 gave this place five hearts at five speeds, each a voice of its own layer and each placed so
      no two beat together: the distant one in the opening, the second movement's, the ballad's, the
      acceptance's, and the fight's double kick. The strengths climb with them — *"subtle at first and
      then a noticeable heartbeat at the end"* was said of the sound, and the picture says it too.
    */
    hearts: [
      { layer: 'ownC', voice: 0, strength: { run: 0.45 } },
      { layer: 'ownD', voice: 0, strength: { push: 0.6 } },
      { layer: 'crash', voice: 0, strength: { surge: 0.75 } },
      { layer: 'ownB', voice: 0, strength: { approach: 0.9 } },
      { layer: 'sub', voice: 1, strength: { boss: 1, bossPeak: 1 } },
    ],
    /*
      ⚠️ **FIVE VESSELS INTO THE HEART, ONE PER TENTACLE — 0400, 0403.** Two off the upper trunks, one
      from far back on the second so it comes in level, and two off the lower: each meets the heart's
      near side, top to bottom in the order the tentacles hang, because the tentacles lie in them before
      they pull out.
    */
    arteries: [
      { trunk: 0, back: 62, into: [-4, -10], width: 3.4 },
      { trunk: 1, back: 42, into: [-9, -5], width: 3.8 },
      { trunk: 1, back: 88, into: [-11, 0], width: 4.2 },
      { trunk: 2, back: 48, into: [-9, 5], width: 3.8 },
      { trunk: 3, back: 66, into: [-4, 10], width: 3.4 },
    ],
  },
};
