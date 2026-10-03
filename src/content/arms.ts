/**
 * What each place's raiders throw — `docs/decisions/0473-each-place-has-its-own-arms.md`.
 *
 * Reported: *"enemies on each level need some unique level attacks and sprites as well — thematic for
 * level and boss on that level. we did work on make the sprites different per level, but the attacks
 * are all the same."* And: *"in the later stages a lot of the miniboss and level enemies attacks are
 * very small and hard to see and dodge."*
 *
 * ── THE ROSTER'S TWIN, ONE LAYER DOWN ────────────────────────────────────────────────────────────
 *
 * 0446 gave every place its own body for each of the eight kinds the levels share, in a
 * `Record<SharedKind, FoeBody>` per place so a place that has not said what its drifter is does not
 * compile. This is the same table for what the five that shoot THROW: a `Record<ArmedKind, Arms>` per
 * place, and the frame reads the place's rows (`ROWS_OF`) in place of the one set every place shared.
 * The Approach's arms are the rows' own in `src/content/enemies.ts`, as its faces are the drawings
 * every place used to share.
 *
 * ⚠️ **THE PLACE'S LORD'S OWN AMMUNITION**, which is what *thematic for level and boss* reads as: the
 * fish's quills and spines and fire in Ember Nebula, the pterodactyl's quills and rocks in the Saurian
 * Belt, the gyre's gears and slabs and fire in the Labyrinth, the hydra's acid in the Mire. Three places'
 * lords throw nothing a raider can carry — a shard that bursts twelve ways, a void that eats the
 * player's fire — so the cog, the hailstone and the clot are new, in `src/content/shots.ts`.
 *
 * ⚠️ **WHAT A KIND IS DOES NOT MOVE** (0081, 0446's *a silhouette still says what its kind does*). A
 * turret still fans three, a warden still walls two with a hole where it is, a spinner still turns a
 * ring of three, a sower still throws from both its emitters. What a place changes is what comes out,
 * how wide, how fast it turns — and, where its body asks for it, whether it is aimed or a string.
 *
 * ⚠️ **NO MORE BULLETS A VOLLEY THAN THE APPROACH'S**, and fewer where a heavy shot is thrown: 0472 had
 * just measured the last four levels down to what they can carry, and a pass about what a shot IS
 * must not quietly undo a pass about how many there are. The Saurian and Labyrinth sowers throw two
 * where the Approach's throw four, because a rock and a fireball are not lances.
 */

import { ENEMIES, ENEMY_KINDS, type Attack, type EnemyKind, type EnemyRow } from './enemies.ts';
import type { ShotKind } from './shots.ts';
import type { ThemeKind } from './themes.ts';

/** The five shared kinds that shoot — 0473. The other three of 0446's eight never fire anywhere. */
export const ARMED_KINDS = ['lancer', 'turret', 'warden', 'spinner', 'sower'] as const;
export type ArmedKind = (typeof ARMED_KINDS)[number];

/** What one kind throws in one place: the three fields of a row that make its fire. */
export interface Arms {
  shot: ShotKind;
  attack: Attack;
  /** Steps between volleys, before the tier's own gap — the row's own field, per place. */
  fireEvery: number;
}

type Arsenal = Record<ArmedKind, Arms>;

/** The six places that are not the Approach, whose arms are the rows' own. */
type Armed = Exclude<ThemeKind, 'approach'>;

/**
 * Every place's arsenal. ⚠️ **REQUIRED FOR EVERY PLACE AND EVERY KIND**, on 0016's terms: a seventh
 * place, or a sixth kind that shoots, does not compile until it says what it throws.
 */
export const ARMS: Record<Armed, Arsenal> = {
  /*
    EMBER NEBULA — the fish's: quills, spines and fire. The cinder-wasp throws a quill down the lane;
    the slag vent spews a wide fan of spines; the ring of fire walls in flame; the fire-wheel turns a
    ring of flame; the fire-bird drops quills from both wings.
  */
  nebula: {
    lancer: { shot: 'quill', attack: { kind: 'spray', shots: 1, spread: 0 }, fireEvery: 102 },
    turret: { shot: 'spine', attack: { kind: 'spray', shots: 3, spread: 1.1 }, fireEvery: 72 },
    warden: { shot: 'flame', attack: { kind: 'wall', shots: 1, gap: 10 }, fireEvery: 84 },
    spinner: { shot: 'flame', attack: { kind: 'spiral', shots: 3, turn: 0.42 }, fireEvery: 84 },
    sower: { shot: 'quill', attack: { kind: 'wall', shots: 2, gap: 13 }, fireEvery: 96 },
  },
  /*
    THE SAURIAN BELT — the pterodactyl's quills and rocks, and teeth. The crocodile's skull spits a
    tooth down the lane; the horned frill fans three quills; the jaw walls in teeth; the crossed bones
    whirl a ring of them, quicker than any other spinner; the pterosaur drops a rock from each wing.
    ⚠️ The tooth goes down the lane and not at the ship because a spine thrown at the ship is the
    minnow's (`tests/signature.test.ts` said so first).
  */
  saurian: {
    lancer: { shot: 'spine', attack: { kind: 'spray', shots: 1, spread: 0 }, fireEvery: 102 },
    turret: { shot: 'quill', attack: { kind: 'spray', shots: 3, spread: 0.85 }, fireEvery: 72 },
    warden: { shot: 'spine', attack: { kind: 'wall', shots: 1, gap: 10 }, fireEvery: 84 },
    spinner: { shot: 'spine', attack: { kind: 'spiral', shots: 3, turn: 0.7 }, fireEvery: 84 },
    sower: { shot: 'rock', attack: { kind: 'wall', shots: 1, gap: 13 }, fireEvery: 96 },
  },
  /*
    THE LABYRINTH — the gyre's gears, its slabs and its flame wheels. The stepped delta fires a burst
    of two cogs down the lane, a little slower each, so the second rides behind the first; the tower
    fans three through its slits, tight; the gear walls cogs, wide; the jack turns a ring of slabs;
    the stepped chevron throws a flame from each emitter.
  */
  labyrinth: {
    lancer: { shot: 'cog', attack: { kind: 'stream', shots: 2, lag: 0.2, aimed: false }, fireEvery: 120 },
    turret: { shot: 'cog', attack: { kind: 'spray', shots: 3, spread: 0.5 }, fireEvery: 72 },
    warden: { shot: 'cog', attack: { kind: 'wall', shots: 1, gap: 14 }, fireEvery: 84 },
    spinner: { shot: 'flak', attack: { kind: 'spiral', shots: 3, turn: 0.42 }, fireEvery: 84 },
    sower: { shot: 'flame', attack: { kind: 'wall', shots: 1, gap: 13 }, fireEvery: 96 },
  },
  /*
    THE RIME SHELF — ice, which is the frost ship's: hailstones, which do not burst. The gem fires one
    at the ship; the dome fans three, narrow; the hexagon walls them; the frost swallow throws its two
    crystals at the ship as a string. The ice blades throw a ring of ripples that snake as they turn:
    ⚠️ **NOT HAIL, BECAUSE THE SHARD HAS IT** — the place's own crystal turns a ring of hail, and six
    kinds that shoot in one ammunition need six patterns where there are five. The spinner is three
    waves of the level and the shard ten.
  */
  rime: {
    lancer: { shot: 'hail', attack: { kind: 'aimed' }, fireEvery: 102 },
    turret: { shot: 'hail', attack: { kind: 'spray', shots: 3, spread: 0.6 }, fireEvery: 72 },
    warden: { shot: 'hail', attack: { kind: 'wall', shots: 1, gap: 10 }, fireEvery: 84 },
    spinner: { shot: 'ripple', attack: { kind: 'spiral', shots: 3, turn: 0.2 }, fireEvery: 84 },
    sower: { shot: 'hail', attack: { kind: 'stream', shots: 2, lag: 0.2, aimed: true }, fireEvery: 96 },
  },
  /*
    THE TOXIC MIRE — the hydra's acid. The mosquito's sting flicks a droplet at the ship; the
    toadstool's gills spray three wide; the frogspawn walls in acid, wide; the flytrap turns a ring of
    it; the bat drops droplets from both wings.
  */
  mire: {
    lancer: { shot: 'droplet', attack: { kind: 'aimed' }, fireEvery: 102 },
    turret: { shot: 'droplet', attack: { kind: 'spray', shots: 3, spread: 1.2 }, fireEvery: 72 },
    warden: { shot: 'acid', attack: { kind: 'wall', shots: 1, gap: 12 }, fireEvery: 84 },
    spinner: { shot: 'acid', attack: { kind: 'spiral', shots: 3, turn: 0.42 }, fireEvery: 84 },
    sower: { shot: 'droplet', attack: { kind: 'wall', shots: 2, gap: 13 }, fireEvery: 96 },
  },
  /*
    THE BLACK HEART — blood. The squid jets a clot at the ship; the jelly's bell fans three; the valve
    walls them; the medusa turns a ring of them slowly; the artery pumps two down the lane as a string.
  */
  core: {
    lancer: { shot: 'clot', attack: { kind: 'aimed' }, fireEvery: 102 },
    turret: { shot: 'clot', attack: { kind: 'spray', shots: 3, spread: 0.95 }, fireEvery: 72 },
    warden: { shot: 'clot', attack: { kind: 'wall', shots: 1, gap: 10 }, fireEvery: 84 },
    spinner: { shot: 'clot', attack: { kind: 'spiral', shots: 3, turn: 0.25 }, fireEvery: 84 },
    sower: { shot: 'clot', attack: { kind: 'stream', shots: 2, lag: 0.2, aimed: false }, fireEvery: 96 },
  },
};

const armed = (kind: EnemyKind): kind is ArmedKind => (ARMED_KINDS as readonly EnemyKind[]).includes(kind);

/** `kind`'s row in `theme`: the shared row with the place's arms on it, or the row itself. */
export function rowIn(kind: EnemyKind, theme: ThemeKind): EnemyRow {
  const row = ENEMIES[kind];
  if (theme === 'approach' || !armed(kind)) return row;
  return { ...row, ...ARMS[theme][kind] };
}

/**
 * Every place's rows, by index in `ENEMY_KINDS` — what the frame reads as `enemyRows` — 0473.
 *
 * ⚠️ **BUILT ONCE, AT IMPORT, AND SWAPPED AT A LEVEL BOUNDARY**, so the frame's per-step lookup is the
 * array index it always was and nothing is built in the loop. A kind no place re-arms is the same
 * object in every place's list.
 */
const rowsIn = (theme: ThemeKind): readonly EnemyRow[] => ENEMY_KINDS.map((kind) => rowIn(kind, theme));
export const ROWS_OF: Record<ThemeKind, readonly EnemyRow[]> = {
  approach: rowsIn('approach'),
  nebula: rowsIn('nebula'),
  saurian: rowsIn('saurian'),
  labyrinth: rowsIn('labyrinth'),
  rime: rowsIn('rime'),
  mire: rowsIn('mire'),
  core: rowsIn('core'),
};
