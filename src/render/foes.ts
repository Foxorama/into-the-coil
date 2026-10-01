/*
  ══ THE SHARED BODIES, ONE PER PLACE — 0446 ═════════════════════════════════════════════════════════

  `docs/decisions/0446-each-place-has-its-own-faces.md`. Asked for: *"thematic sprites per level for
  the enemies so that we actually have interesting levels instead of the same model being used 7 times
  with a different colour. sprites should be thematic based on ship flight, bullet type, level and boss
  theme."*

  ⚠️ **EIGHT KINDS ARE SENT BY NEARLY EVERY LEVEL, AND UNTIL NOW THEY WERE EIGHT DRAWINGS.** 0228 gave
  each place a livery over them and 0232 a signature body of its own; what neither touched is that a
  Saurian Belt drifter and a Black Heart drifter were the same diamond in two inks. Here each place
  authors its own body for each of the eight: a creature or a machine native to the place, whose
  silhouette still says what the KIND does — 0081's *what the player must tell apart is told apart by
  more than ink*. A lancer is still a thing that points down the lane; a turret still has a flat gun
  face and a dome behind it; a weaver still lies across the lane it weaves along, and a charger along
  the lane it charges down; a warden is still an aperture with a hole in it.

  ⚠️ **NO NEW SPRITE, NO NEW ROW, NO NEW BEHAVIOUR.** The atlas is baked per place already (0195), and
  `drawKind` already takes the place; a body here is what the bake draws for an existing sprite index
  when the place is this one. The cycles, holds, hurtboxes and extents are the kind's, untouched.

  ⚠️ **THE TABLE IS A `Record<ThemeKind, FoeBody>` PER KIND, AND THAT IS THE GUARD** —
  [0016](../../docs/decisions/0016-a-hub-enumerates-kinds.md) and
  [0282](../../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md): every
  place AUTHORS its body, rather than a shared drawing being decorated per place, which is exactly the
  mechanism whose output is the same for every instance that the ask was about.

  ⚠️ **BUILT ON FIRST USE, BECAUSE THIS FILE AND `bake.ts` IMPORT EACH OTHER.** The helpers live in
  `bake.ts` and `bake.ts` asks this file for a body; module evaluation must therefore call nothing
  imported, and nothing here does until `bodyOf` is first asked.

  Coordinates are `bake.ts`'s: fractions of the drawing radius `r`, `−x` down the lane towards the
  ship, `+y` down the screen.
*/

import type { FoeSkin, ThemeKind } from '../content/themes.ts';
import {
  APPROACH_BODIES,
  bent,
  disc,
  eye,
  lit,
  motif,
  plate,
  poly,
  posed,
  ramp,
  sector,
  seam,
  shade,
  square,
  trace,
  type Frame,
  type Pen,
  type Pose,
  type Pt,
} from './bake.ts';

/** The eight kinds every level draws on — the ones a place reskins rather than replaces. */
export type SharedKind = 'drifter' | 'lancer' | 'weaver' | 'turret' | 'charger' | 'warden' | 'spinner' | 'sower';

export const SHARED_KINDS: readonly SharedKind[] = ['drifter', 'lancer', 'weaver', 'turret', 'charger', 'warden', 'spinner', 'sower'];

/**
 * One body: how its outline is traced in pose `n` (into the current path, sealed by the caller), and
 * what is painted on it once sealed. Three poses, 0 to 2, because every kind's cycle walks three
 * drawings — 0410.
 */
export interface FoeBody {
  readonly outline: (ctx: Pen, f: Frame, n: number) => void;
  readonly paint: (ctx: Pen, f: Frame, skin: FoeSkin, theme: ThemeKind, n: number) => void;
}

// ── Small geometry, cold: every call here runs once per bake. ─────────────────────────────────────

/**
 * The rest drawing — `bake.ts`'s `REST`, restated because a pose table is built when this module
 * is evaluated and `bake.ts`'s own constant does not exist yet then (see the head of the file).
 */
const STILL: Pose = (p) => p;

/** A point at angle `a` and radius `rad` about `(cx, cy)`. */
const polar = (a: number, rad: number, cx = 0, cy = 0): Pt => [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];

/** A circle as a polygon, for a hole an `evenodd` hull can carry. */
const circle = (rad: number, cx = 0, cy = 0, steps = 28): Pt[] =>
  Array.from({ length: steps }, (_, k) => polar((2 * Math.PI * k) / steps, rad, cx, cy));

/** Every point turned about the centre by `by` radians. */
const turned = (by: number): Pose => ([x, y]) => [x * Math.cos(by) - y * Math.sin(by), x * Math.sin(by) + y * Math.cos(by)];

/** The face bowed in or out at the middle, weighted to the face — the turret's breath, per body. */
const faceBows = (face: number, depth: number): Pose => ([x, y]) => [x + depth * (1 - y * y) * ramp(-x, -face - 0.25, -face + 0.05), y];

/** A half-disc turret's outline: a flat face at `face` and a dome of `radius(a)` behind it. */
function domeOf(face: number, radius: (a: number) => number, steps = 24): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k <= 8; k++) out.push([face, -1 + k / 4]);
  for (let k = 1; k < steps; k++) {
    const a = Math.PI / 2 - (Math.PI * k) / steps;
    const rad = radius(a);
    out.push([face + Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  return out.reverse();
}

/*
  ══ EMBER NEBULA — a furnace: embers, flame, cinder and slag ═══════════════════════════════════════

  The fish's place (Volans) and the moth's. Everything here is a thing that BURNS, and a thing that
  burns trails its flame behind it: so every flier's back edge is tongues of fire and every still
  thing is a coal or a vent. The flame is the hull's own orange, the slag is the plate, the white heat
  is the lit ink — the skin 0228 gave the place already says which is which.
*/

/** The cinder's seven licks: their tips, each its own length, so the coal is not a cog. */
const CINDER_TIPS = [0.86, 0.72, 0.84, 0.7, 0.86, 0.74, 0.8] as const;

/** A coal with flame licking off it all round: it holds station and never fires, so it has no front. */
function cinderHull(n: number): Pt[] {
  const out: Pt[] = [];
  const licks = CINDER_TIPS.length;
  for (let k = 0; k < licks; k++) {
    const a = (2 * Math.PI * k) / licks - Math.PI / 2;
    // Each lick flares and dies by its own phase, so the fire flickers rather than pulsing.
    const flick = n === 0 ? 0 : 0.17 * Math.sin(k * 2.3 + n * 2.1);
    const sway = n === 0 ? 0 : (n === 1 ? 0.12 : -0.1);
    out.push(polar(a - Math.PI / licks, 0.56));
    out.push(polar(a - 0.16, 0.7 + flick * 0.4));
    out.push(polar(a + 0.12 + sway, CINDER_TIPS[k]! + flick));
    out.push(polar(a + 0.26 + sway * 0.5, 0.64));
  }
  return out;
}

const EMBER_DRIFTER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, cinderHull(n)),
  paint: (ctx, f, skin, theme, n) => {
    // The slag crust in shadow under the coal, the white heat at its heart, and the eye in the heat.
    plate(ctx, f, skin, posed(circle(0.46, 0.03, 0.05, 20), ([x, y]) => [x, Math.max(y, 0.04)]));
    motif(ctx, f, skin, theme, circle(0.46, 0, 0, 12), `cinder${n}`);
    disc(ctx, f, skin.lit, -0.06, -0.02, 0.32);
    eye(ctx, f, skin, -0.1, -0.02, 0.17, [0, -1, 1][n]!);
  },
};

/** The comet-wasp: a dart whose back edge burns away into three tongues. */
const COMET_HULL: readonly Pt[] = [
  [-1, 0],
  [0.3, -0.8],
  [0.94, -0.94],
  [0.56, -0.46],
  [0.98, 0],
  [0.56, 0.46],
  [0.94, 0.94],
  [0.3, 0.8],
];

/** Its tongues flicker: the outer two flare and fold, the middle one licks out and in. */
const tonguesFlick = (spread: number, back: number, middle: number): Pose => ([x, y]) => {
  const t = ramp(x, 0.3, 0.95);
  const mid = 1 - ramp(Math.abs(y), 0.1, 0.4);
  return [x + back * t + middle * t * mid, y * (1 + (spread - 1) * t)];
};
const COMET_POSES: readonly Pose[] = [STILL, tonguesFlick(0.84, 0.1, -0.18), tonguesFlick(1.08, -0.06, 0.06)];

const EMBER_LANCER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(COMET_HULL, COMET_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = COMET_POSES[n]!;
    plate(ctx, f, skin, bent([
      [-0.84, 0.06],
      [0.5, 0.06],
      [0.5, 0.42],
      [0.3, 0.72],
    ], pose));
    lit(ctx, f, skin, bent([
      [-0.9, -0.03],
      [0.28, -0.76],
      [0.34, -0.6],
      [-0.66, -0.03],
    ], pose));
    // The white heat running back down the middle tongue: what the lance it fires is made of.
    lit(ctx, f, skin, bent([
      [0.14, -0.1],
      [0.88, 0],
      [0.14, 0.1],
    ], pose));
    motif(ctx, f, skin, theme, [
      [-0.3, -0.04],
      [0.4, -0.5],
      [0.4, -0.16],
    ], 'comet', pose);
    const [ex, ey] = pose([-0.44, 0]);
    eye(ctx, f, skin, ex, ey, 0.16);
  },
};

/** The fire-chain's three fireballs, at these places across the lane. */
const CHAIN_BEADS = [-0.64, 0, 0.64] as const;

/** A column of three fireballs, each trailing a tongue: it lies across the lane, which it weaves along. */
function chainHull(n: number): Pt[] {
  const front: Pt[] = [];
  const back: Pt[] = [];
  const steps = 48;
  const ripple = [0, 0.2, -0.2][n]!;
  for (let i = 0; i <= steps; i++) {
    const y = -0.98 + (1.96 * i) / steps;
    const bead = Math.cos(1.5 * Math.PI * y) ** 2;
    const end = Math.sqrt(Math.min(1, (1 - Math.abs(y)) / 0.2));
    const w = (0.12 + 0.22 * bead ** 1.5) * end;
    // The tongue is sharp, and it flickers: each bead's own length, one frame to the next.
    const k = y < -0.32 ? 0 : y < 0.32 ? 1 : 2;
    const flare = n === 0 ? 0 : 0.12 * Math.sin(k * 2.2 + n * 2.6);
    const tongue = (0.24 + flare) * bead ** 8 * end;
    const sway = ripple * Math.sin(Math.PI * y);
    front.push([-w + sway, y]);
    back.push([w + tongue + sway, y]);
  }
  return [...front, ...back.reverse()];
}

const EMBER_WEAVER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, chainHull(n)),
  paint: (ctx, f, skin, theme, n) => {
    const ripple = [0, 0.2, -0.2][n]!;
    const sway = (y: number): number => ripple * Math.sin(Math.PI * y);
    CHAIN_BEADS.forEach((y, k) => {
      plate(ctx, f, skin, posed(circle(0.2, 0.03, y + 0.03, 14), ([px, py]) => [Math.max(px, 0.0) + sway(py), py]));
      if (k !== 1) disc(ctx, f, skin.lit, -0.06 + sway(y), y - 0.03, 0.14);
    });
    motif(ctx, f, skin, theme, [
      [-0.08, -0.5],
      [0.08, -0.5],
      [0.08, 0.5],
      [-0.08, 0.5],
    ], `chain${n}`, ([x, y]) => [x + sway(y), y]);
    eye(ctx, f, skin, -0.02 + sway(0), 0, 0.17, [0, 1, -1][n]!);
  },
};

/** The vent's rocky crown: each block of basalt its own height, so the dome is slag and not a lid. */
const VENT_ROCK = [1, 0.86, 0.97, 0.84, 0.99, 0.88, 1, 0.85, 0.96, 0.86, 1, 0.87, 0.98] as const;
const VENT_FACE = -0.55;

function ventHull(): Pt[] {
  return domeOf(VENT_FACE, (a) => {
    const t = (a + Math.PI / 2) / Math.PI;
    const k = Math.min(VENT_ROCK.length - 1, Math.floor(t * VENT_ROCK.length));
    return VENT_ROCK[k]!;
  }, 26);
}

const VENT_POSES: readonly Pose[] = [STILL, faceBows(VENT_FACE, 0.16), faceBows(VENT_FACE, -0.1)];

const EMBER_TURRET: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, posed(ventHull(), VENT_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = VENT_POSES[n]!;
    plate(ctx, f, skin, bent([
      [-0.5, 0.06],
      [0.24, 0.06],
      [0.14, 0.46],
      [-0.08, 0.7],
      [-0.5, 0.78],
    ], pose));
    // Three cracks of lava running out of the mouth across the slag — the three shots of its spray.
    for (const a of [-0.62, 0, 0.62]) {
      seam(ctx, f, skin.lit, 0.13, [pose([-0.3, 0]), polar(a, 0.66, -0.36, 0)]);
    }
    // The mouth: molten along the whole face.
    lit(ctx, f, skin, bent([
      [-0.5, -0.88],
      [-0.33, -0.88],
      [-0.33, 0.88],
      [-0.5, 0.88],
    ], pose));
    motif(ctx, f, skin, theme, [
      [-0.2, -0.82],
      [0.2, -0.7],
      [0.38, -0.3],
      [0, -0.2],
    ], 'vent', pose);
    const [ex, ey] = pose([-0.2, 0]);
    eye(ctx, f, skin, ex, ey, 0.2);
  },
};

/** The meteor: a lump of slag at the front, and the fire it drags behind it down the lane. */
function meteorHull(): Pt[] {
  const head: Pt[] = [];
  const rock = [0.34, 0.3, 0.36, 0.31, 0.35, 0.3, 0.34] as const;
  // The rock's front half, from its top round the nose to its bottom.
  rock.forEach((rad, k) => head.push(polar(-Math.PI / 2 - (Math.PI * k) / (rock.length - 1), rad, -0.62, 0)));
  return [
    ...head,
    [-0.2, 0.26],
    [0.5, 0.26],
    [0.96, 0.32],
    [0.6, 0.1],
    [1, 0],
    [0.6, -0.1],
    [0.96, -0.32],
    [0.5, -0.26],
    [-0.2, -0.26],
  ];
}

/** The fire's tail flicks across the lane behind the rock, which holds on the ship. */
const tailFlicks = (from: number, across: number, flare: number): Pose => ([x, y]) => {
  const t = ramp(x, from, 1);
  return [x + flare * t, y + across * t * t];
};
const METEOR_POSES: readonly Pose[] = [STILL, tailFlicks(-0.2, 0.18, 0.04), tailFlicks(-0.2, -0.18, -0.06)];

const EMBER_CHARGER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(meteorHull(), METEOR_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = METEOR_POSES[n]!;
    // The white heat in the fire, from just behind the rock out along the middle tongue.
    lit(ctx, f, skin, bent([
      [-0.3, -0.12],
      [0.5, -0.1],
      [0.9, 0],
      [0.5, 0.1],
      [-0.3, 0.12],
    ], pose));
    // The rock: slag, with one lit crack across it where it is still burning.
    plate(ctx, f, skin, posed(circle(0.27, -0.62, 0, 16), pose));
    motif(ctx, f, skin, theme, circle(0.24, -0.62, 0, 10), 'meteor', pose);
    disc(ctx, f, skin.lit, -0.7, -0.04, 0.1);
  },
};

/** The corona: a ring of fire, its tongues all leaning one way as it turns. */
const CORONA_BORE: readonly number[] = [0.36, 0.27, 0.44];

/**
 * The prominences: where round the ring each flare stands, how wide it is at its root and how far it
 * reaches. Uneven on purpose — a ring of even teeth is a saw blade, and the first draft was one.
 */
const CORONA_FLARES: readonly (readonly [number, number, number])[] = [
  [0.3, 0.62, 1],
  [1.45, 0.5, 0.94],
  [2.5, 0.66, 1],
  [3.55, 0.44, 0.92],
  [4.5, 0.6, 0.99],
  [5.5, 0.46, 0.93],
];

function coronaOuter(n: number): Pt[] {
  const out: Pt[] = [];
  const steps = 96;
  // The flares lick round and back as the ring burns, each by its own amount.
  const turn = [0, 0.14, -0.1][n]!;
  for (let i = 0; i < steps; i++) {
    const a = (2 * Math.PI * i) / steps;
    let rad = 0.78;
    CORONA_FLARES.forEach(([at, wide, reach], k) => {
      const lean = turn * (1 + 0.4 * Math.sin(k * 1.7));
      let d = a - (at + lean);
      d = Math.atan2(Math.sin(d), Math.cos(d));
      // A flame leans: its leading side rises steeply, its trailing side falls away long.
      const u = d < 0 ? -d / (wide * 0.65) : d / (wide * 0.35);
      if (u < 1) rad = Math.max(rad, 0.78 + (reach - 0.78) * (1 - u) ** 1.6);
    });
    out.push(polar(a, rad));
  }
  return out;
}

const EMBER_WARDEN: FoeBody = {
  outline: (ctx, f, n) => {
    trace(ctx, f, coronaOuter(n));
    trace(ctx, f, circle(CORONA_BORE[n]!));
  },
  paint: (ctx, f, skin, theme, n) => {
    const bore = CORONA_BORE[n]!;
    const gaze = [0, 1, -1][n]!;
    plate(ctx, f, skin, sector(bore + 0.05, 0.7, 0.05, Math.PI - 0.05));
    // The inner rim is the hottest thing on it: white heat all the way round the front of the bore.
    lit(ctx, f, skin, sector(bore + 0.03, bore + 0.17, Math.PI * 0.6, Math.PI * 1.45, 16));
    motif(ctx, f, skin, theme, sector(bore + 0.2, 0.7, Math.PI * 1.5, Math.PI * 1.95, 10), 'corona');
    eye(ctx, f, skin, -0.6, 0, 0.11, gaze);
    eye(ctx, f, skin, -0.3, -0.52, 0.1, gaze);
    eye(ctx, f, skin, -0.3, 0.52, 0.1, gaze);
  },
};

/** The fire-wheel: a burning hub throwing four forked flames — a Catherine wheel. */
function wheelHull(): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (Math.PI / 2) * k;
    // A broad flame, its main tongue leaning into the turn and a lick off its trailing side.
    out.push(polar(a - Math.PI / 4, 0.4));
    out.push(polar(a - 0.36, 0.56));
    out.push(polar(a - 0.3, 0.8));
    out.push(polar(a - 0.12, 0.7));
    out.push(polar(a + 0.1, 0.99));
    out.push(polar(a + 0.24, 0.72));
    out.push(polar(a + 0.36, 0.52));
  }
  return out;
}

/** The wheel spins, so its flames trail: bent one way, then the other, the hub holding. */
const wheelTrails = (twist: number): Pose => ([x, y]) => {
  const rho = Math.hypot(x, y);
  return turned(twist * ramp(rho, 0.4, 1))([x, y]);
};
const WHEEL_POSES: readonly Pose[] = [STILL, wheelTrails(0.32), wheelTrails(-0.3)];

const EMBER_SPINNER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(wheelHull(), WHEEL_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = WHEEL_POSES[n]!;
    // The two arms away from the light in shadow, the two towards it lit along their cores.
    for (const a of [0, Math.PI / 2]) {
      plate(ctx, f, skin, bent([polar(a - 0.3, 0.42), polar(a - 0.26, 0.7), polar(a - 0.1, 0.64), polar(a + 0.08, 0.88), polar(a + 0.2, 0.66), polar(a + 0.3, 0.42)], pose, 3));
    }
    for (const a of [Math.PI, Math.PI * 1.5]) {
      lit(ctx, f, skin, bent([polar(a - 0.16, 0.42), polar(a + 0.07, 0.86), polar(a + 0.2, 0.42)], pose, 3));
    }
    motif(ctx, f, skin, theme, circle(0.34, 0, 0, 10), 'wheel');
    disc(ctx, f, skin.plate, 0, 0, 0.27);
    eye(ctx, f, skin, 0, 0, 0.19);
  },
};

/** The fire-bird: a chevron whose two wings burn out at their ends into three flame feathers each. */
const FIREBIRD_UPPER: readonly Pt[] = [
  [-1, 0],
  [-0.8, -0.14],
  [0.5, -0.94],
  [0.62, -0.74],
  [0.92, -0.86],
  [0.74, -0.6],
  [1, -0.52],
  [0.66, -0.4],
  [-0.12, 0],
];
const FIREBIRD_HULL: readonly Pt[] = [
  ...FIREBIRD_UPPER.slice(0, -1),
  [-0.12, 0],
  ...FIREBIRD_UPPER.slice(1, -1).reverse().map(([x, y]): Pt => [x, -y]),
];

const FIREBIRD_POSES: readonly Pose[] = [
  STILL,
  ([x, y]) => {
    const t = ramp(x, -0.2, 1);
    return [x + 0.1 * t, y * (1 - 0.2 * t)];
  },
  ([x, y]) => {
    const t = ramp(x, -0.2, 1);
    return [x - 0.05 * t, y * (1 + 0.08 * t)];
  },
];

const EMBER_SOWER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(FIREBIRD_HULL, FIREBIRD_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = FIREBIRD_POSES[n]!;
    plate(ctx, f, skin, bent([
      [-0.72, 0.1],
      [0.46, 0.84],
      [0.6, 0.62],
      [-0.04, 0.09],
    ], pose, 3));
    lit(ctx, f, skin, bent([
      [-0.9, -0.02],
      [-0.74, -0.14],
      [0.46, -0.86],
      [0.5, -0.72],
      [-0.6, -0.02],
    ], pose, 3));
    // Each wing's flame feathers burn white at their roots.
    for (const s of [-1, 1]) {
      lit(ctx, f, skin, bent([
        [0.56, 0.66 * s],
        [0.82, 0.58 * s],
        [0.62, 0.5 * s],
      ], pose, 3));
    }
    motif(ctx, f, skin, theme, [
      [0.1, -0.5],
      [0.5, -0.74],
      [0.56, -0.5],
      [0.1, -0.24],
    ], 'firebird', pose);
    const [ex, ey] = pose([-0.6, 0]);
    eye(ctx, f, skin, ex, ey, 0.14);
  },
};

/*
  ══ SAURIAN BELT — a jungle of reptiles and the sea they crawled out of ═══════════════════════════════

  Quetzal's place — a feathered pterosaur — and the shoal mother's, a fish; the raptor is its own.
  So what it sends is the deep past: a shell, a skull, a skeleton, a frill, a gar, a jaw, crossed bones
  and a pterosaur. The hull is the place's olive hide, the plate its shadow, and the lit ink is BONE —
  0228 already made it the bone-pale of the pterodactyl's crest, so here the paint is where the bone
  shows through.
*/

/** The ammonite's shell centre, and how its one whorl grows from the aperture round to the aperture. */
const AMMONITE: Pt = [0.1, -0.08];
const whorl = (phi: number): number => 0.56 + (0.3 * phi) / (2 * Math.PI);

/**
 * An ammonite: one coil of shell, opening down the lane, with a hood of tentacles in the step where the
 * whorl ends. It holds station and never fires, so it is the one body here with nothing to aim.
 */
function ammoniteHull(): Pt[] {
  const [cx, cy] = AMMONITE;
  const out: Pt[] = [];
  const steps = 40;
  // The whorl, from the inside of the aperture clockwise round to its outside.
  for (let i = 0; i <= steps; i++) {
    const phi = (2 * Math.PI * i) / steps;
    out.push(polar(Math.PI / 2 + phi, whorl(phi), cx, cy));
  }
  // The hood: three short arms reaching out of the mouth, down the lane.
  out.push([cx - 0.26, cy + 0.92], [cx - 0.64, cy + 0.94], [cx - 0.42, cy + 0.8]);
  out.push([cx - 0.84, cy + 0.74], [cx - 0.44, cy + 0.66]);
  out.push([cx - 0.66, cy + 0.54], [cx - 0.2, cy + 0.56]);
  return out;
}

/** Its arms reach and curl: down the lane and up across it, then back, the shell holding. */
const armsReach = (across: number, out: number): Pose => ([x, y]) => {
  const [cx, cy] = AMMONITE;
  const t = ramp(cx - x, 0.12, 0.8) * ramp(y - cy, 0.4, 0.6);
  return [x - out * t, y + across * t];
};
const AMMONITE_POSES: readonly Pose[] = [STILL, armsReach(-0.17, 0.06), armsReach(0.1, -0.08)];

const SAURIAN_DRIFTER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(ammoniteHull(), AMMONITE_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const [cx, cy] = AMMONITE;
    // The inner coils, in shadow, and the suture of the last whorl round them in bone.
    disc(ctx, f, skin.plate, cx + 0.02, cy - 0.02, 0.36);
    const suture: Pt[] = [];
    for (let i = 4; i <= 30; i++) {
      const phi = (2 * Math.PI * i) / 32;
      suture.push(polar(Math.PI / 2 + phi, whorl(phi) - 0.2, cx, cy));
    }
    seam(ctx, f, skin.lit, 0.2, suture);
    // The ribs across the whorl, in its own shadow.
    for (const phi of [1.4, 2.3, 3.2, 4.1, 5.0]) {
      seam(ctx, f, skin.plate, 0.2, [polar(Math.PI / 2 + phi, whorl(phi) - 0.13, cx, cy), polar(Math.PI / 2 + phi, whorl(phi) - 0.27, cx, cy)]);
    }
    motif(ctx, f, skin, theme, circle(0.28, cx + 0.02, cy - 0.02, 10), 'ammonite');
    const [ex, ey] = AMMONITE_POSES[n]!([cx - 0.12, cy + 0.72]);
    eye(ctx, f, skin, ex, ey, 0.15);
  },
};

/** The croc skull's upper half, snout to occiput — the lower is its mirror. Teeth stand out of the jaw line. */
const SKULL_UPPER: readonly Pt[] = [
  [-0.98, -0.08],
  [-0.84, -0.12],
  [-0.78, -0.24],
  [-0.68, -0.18],
  [-0.54, -0.25],
  [-0.46, -0.38],
  [-0.36, -0.32],
  [-0.2, -0.42],
  [-0.12, -0.56],
  [0.06, -0.54],
  [0.32, -0.94],
  [0.56, -0.86],
  [0.86, -0.62],
  [0.8, -0.24],
  [0.62, -0.1],
];

/**
 * A crocodilian skull, pointing down the lane. Its jaws are what move: shut, gaping wide with the
 * cheeks drawn in, then snapped with the cheeks thrown out. `gape` is how far back the notch between
 * the jaws runs; `flare` how far the cheeks swing.
 */
function skullHull(gape: number, flare: number): Pt[] {
  const half = SKULL_UPPER.map(([x, y]): Pt => {
    const jaw = ramp(-x, 0.2, 0.9);
    const cheek = ramp(x, 0, 0.5) * (1 - ramp(x, 0.6, 0.9));
    return [x, y - gape * 0.7 * jaw + flare * y * cheek];
  });
  return [[-0.96 + gape * 1.4, 0], ...half, [0.66, 0], ...half.slice().reverse().map(([x, y]): Pt => [x, -y])];
}
const SKULL_GAPE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.22, -0.08],
  [0.02, 0.1],
];

const SAURIAN_LANCER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, skullHull(...SKULL_GAPE[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const [gape, flare] = SKULL_GAPE[n]!;
    const swing = (y: number, x: number): number => y + flare * y * ramp(x, 0, 0.5) * (1 - ramp(x, 0.6, 0.9));
    // The skull is bone under the hide: the cranium inset from the outline in the lit ink, so the hide
    // is a rim round it, and the lower jaw's side of it in shadow.
    const centre: Pt = [0.1, 0];
    const inset = skullHull(gape, flare).map(([x, y]): Pt => [centre[0] + (x - centre[0]) * 0.76, y * 0.76]);
    lit(ctx, f, skin, inset);
    plate(ctx, f, skin, inset.filter(([, y]) => y >= 0).map(([x, y]): Pt => [x, Math.max(0.05, y * 0.92)]));
    motif(ctx, f, skin, theme, [
      [0.3, -0.22],
      [0.5, -0.22],
      [0.5, 0.22],
      [0.3, 0.22],
    ], 'skull');
    for (const s of [-1, 1]) {
      disc(ctx, f, shade(skin.plate, -0.5), 0.22, swing(0.4 * s, 0.22), 0.19);
      eye(ctx, f, skin, 0.2, swing(0.4 * s, 0.22), 0.12);
    }
  },
};

/** The fish skeleton's ribs, where along its spine each pair stands. */
const BONE_RIBS = [-0.36, 0, 0.36] as const;

/**
 * A fish's skeleton, lying across the lane it weaves along: a skull at one end, a forked tail at the
 * other and three pairs of ribs swept towards the tail. Symmetric about the spine, as a fishbone is.
 */
function fishboneHalf(): Pt[] {
  const half: Pt[] = [
    [-0.05, -1],
    [-0.27, -0.86],
    [-0.3, -0.64],
    [-0.1, -0.56],
  ];
  for (const y of BONE_RIBS) {
    half.push([-0.1, y - 0.1], [-0.44, y + 0.06], [-0.44, y + 0.2], [-0.1, y + 0.12]);
  }
  half.push([-0.1, 0.62], [-0.36, 0.98], [-0.12, 0.92], [-0.05, 0.8]);
  return half;
}

function fishboneHull(): Pt[] {
  const half = fishboneHalf();
  return [...half, ...half.slice().reverse().map(([x, y]): Pt => [-x, y])];
}

/** It swims across the lane, so it undulates as a fish does: an S down its length one way, then the other. */
const swims = (by: number): Pose => ([x, y]) => [x + by * Math.sin(Math.PI * (y + 0.1)), y];
const FISHBONE_POSES: readonly Pose[] = [STILL, swims(0.2), swims(-0.2)];

const SAURIAN_WEAVER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(fishboneHull(), FISHBONE_POSES[n]!, 4)),
  paint: (ctx, f, skin, _theme, n) => {
    const pose = FISHBONE_POSES[n]!;
    // The spine in bone down the middle, each rib's root in shadow on the far side.
    lit(ctx, f, skin, bent([
      [-0.1, -0.5],
      [0.1, -0.5],
      [0.1, 0.6],
      [-0.1, 0.6],
    ], pose, 8));
    for (const y of BONE_RIBS) {
      plate(ctx, f, skin, bent([
        [0.12, y - 0.06],
        [0.4, y + 0.08],
        [0.4, y + 0.18],
        [0.12, y + 0.1],
      ], pose, 2));
    }
    const [ex, ey] = pose([0, -0.74]);
    eye(ctx, f, skin, ex, ey, 0.17, [0, 1, -1][n]!);
  },
};

/** The frill's crown of knobs, and where on it the face stands. */
const FRILL_FACE = -0.45;

/**
 * A horned face and its frill, seen from above: the frill a scalloped half-disc, the face flat across
 * the lane with three horns pointing down it — the two brows and the nose, for its three-shot spray.
 */
function frillHull(): Pt[] {
  const dome = domeOf(FRILL_FACE, (a) => 0.88 + 0.1 * Math.abs(Math.cos(3.5 * (a + Math.PI / 2))), 42);
  // `domeOf` runs the face from the bottom up; the horns go in on it, the brows first and the nose between.
  const faceStart = dome.length - 9;
  const horns: Pt[] = [
    [FRILL_FACE, 0.62],
    [-0.96, 0.46],
    [FRILL_FACE, 0.3],
    [-0.8, 0.09],
    [-0.8, -0.09],
    [FRILL_FACE, -0.3],
    [-0.96, -0.46],
    [FRILL_FACE, -0.62],
  ];
  return [...dome.slice(0, faceStart), [FRILL_FACE, 1], ...horns, [FRILL_FACE, -1]];
}

const FRILL_POSES: readonly Pose[] = [
  STILL,
  // It tosses its head: the horns swing in, the frill holds.
  ([x, y]) => [x + 0.04 * ramp(-x, -FRILL_FACE - 0.05, 0.95), y * (1 - 0.3 * ramp(-x, -FRILL_FACE - 0.05, 0.95))],
  ([x, y]) => [x - 0.08 * ramp(-x, -FRILL_FACE - 0.05, 0.95), y * (1 + 0.1 * ramp(-x, -FRILL_FACE - 0.05, 0.95))],
];

const SAURIAN_TURRET: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(frillHull(), FRILL_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = FRILL_POSES[n]!;
    plate(ctx, f, skin, [
      [-0.4, 0.06],
      [0.26, 0.06],
      [0.18, 0.44],
      [-0.04, 0.66],
      [-0.4, 0.74],
    ]);
    // Two display spots on the frill, as the real animal wears.
    for (const s of [-1, 1]) {
      disc(ctx, f, skin.plate, 0.0, 0.42 * s, 0.17);
      disc(ctx, f, skin.lit, 0.0, 0.42 * s, 0.09);
    }
    // The horns are bone: lit from root to near the point.
    for (const [tip, root] of [[[-0.84, 0.46], 0.46], [[-0.84, -0.46], -0.46], [[-0.74, 0], 0]] as const) {
      lit(ctx, f, skin, bent([
        [FRILL_FACE + 0.05, root - 0.06],
        tip,
        [FRILL_FACE + 0.05, root + 0.06],
      ], pose, 1));
    }
    motif(ctx, f, skin, theme, [
      [0.12, -0.24],
      [0.42, -0.24],
      [0.42, 0.24],
      [0.12, 0.24],
    ], 'frill');
    const [ex, ey] = pose([-0.3, 0]);
    eye(ctx, f, skin, ex, ey, 0.13);
  },
};

/** A gar: a long toothed snout, a body behind it, a pair of fins and a forked tail. */
const GAR_UPPER: readonly Pt[] = [
  [-1, 0],
  [-0.62, -0.06],
  [-0.34, -0.15],
  [-0.12, -0.2],
  [-0.02, -0.38],
  [0.12, -0.21],
  [0.42, -0.16],
  [0.68, -0.08],
  [0.98, -0.34],
  [0.84, 0],
];

const GAR_HULL: readonly Pt[] = [...GAR_UPPER, ...GAR_UPPER.slice(1, -1).reverse().map(([x, y]): Pt => [x, -y])];

/** Its tail beats, and the body bends behind the head; the snout holds on the ship. */
const GAR_POSES: readonly Pose[] = [STILL, ([x, y]) => [x, y + 0.24 * ramp(x, -0.3, 1) ** 2], ([x, y]) => [x, y - 0.24 * ramp(x, -0.3, 1) ** 2]];

const SAURIAN_CHARGER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(GAR_HULL, GAR_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = GAR_POSES[n]!;
    // The bone-pale snout and back down the middle of it, the dark of its flanks either side.
    lit(ctx, f, skin, bent([
      [-0.66, -0.02],
      [-0.3, -0.115],
      [0.42, -0.12],
      [0.42, 0.075],
      [-0.3, 0.075],
      [-0.66, 0.02],
    ], pose, 3));
    motif(ctx, f, skin, theme, [
      [-0.1, -0.1],
      [0.4, -0.1],
      [0.4, 0.06],
      [-0.1, 0.06],
    ], 'gar', pose);
    disc(ctx, f, skin.eye, -0.34, -0.02, 0.09);
  },
};

/** The maw's bore per frame, measured to the tips of its teeth. */
const MAW_BORE: readonly number[] = [0.3, 0.2, 0.4];
const MAW_TEETH = 10;

/** The maw's rim: bone plates round its outside, each a rounded scallop. */
function mawOuter(): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < 80; i++) {
    const a = (2 * Math.PI * i) / 80;
    out.push(polar(a, 0.9 + 0.08 * Math.abs(Math.sin(4 * a))));
  }
  return out;
}

/** The maw's throat: a ring of teeth pointing in, which draw back into the gum as it opens. */
function mawInner(bore: number): Pt[] {
  const out: Pt[] = [];
  const gum = 0.54;
  for (let k = 0; k < MAW_TEETH; k++) {
    const a = (2 * Math.PI * k) / MAW_TEETH;
    out.push(polar(a - 0.31, gum));
    out.push(polar(a, bore));
  }
  return out;
}

const SAURIAN_WARDEN: FoeBody = {
  outline: (ctx, f, n) => {
    trace(ctx, f, mawOuter());
    trace(ctx, f, mawInner(MAW_BORE[n]!));
  },
  paint: (ctx, f, skin, theme, n) => {
    const gaze = [0, 1, -1][n]!;
    plate(ctx, f, skin, sector(0.6, 0.86, 0.05, Math.PI - 0.05));
    // The gum line in bone, where every tooth roots.
    lit(ctx, f, skin, sector(0.56, 0.66, Math.PI * 0.55, Math.PI * 1.5, 18));
    motif(ctx, f, skin, theme, sector(0.68, 0.86, Math.PI * 1.55, Math.PI * 1.95, 10), 'maw');
    eye(ctx, f, skin, -0.76, 0, 0.12, gaze);
    eye(ctx, f, skin, -0.38, -0.66, 0.11, gaze);
    eye(ctx, f, skin, -0.38, 0.66, 0.11, gaze);
  },
};

/** A long bone: a shaft, and a double knuckle at each end. Along +x, from the hub out. */
function boneArm(a: number): Pt[] {
  const arm: Pt[] = [
    [0.3, -0.15],
    [0.68, -0.15],
    [0.74, -0.32],
    [0.9, -0.34],
    [0.98, -0.18],
    [0.92, 0],
    [0.98, 0.18],
    [0.9, 0.34],
    [0.74, 0.32],
    [0.68, 0.15],
    [0.3, 0.15],
  ];
  return arm.map(turned(a));
}

/** Four bones crossed on a knot of cartilage, turning: the bones trail as it spins. */
function crossbonesHull(): Pt[] {
  return [0, 1, 2, 3].flatMap((k) => boneArm((Math.PI / 2) * k));
}

const CROSSBONES_POSES: readonly Pose[] = [STILL, wheelTrails(0.3), wheelTrails(-0.3)];

const SAURIAN_SPINNER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(crossbonesHull(), CROSSBONES_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = CROSSBONES_POSES[n]!;
    for (let k = 0; k < 4; k++) {
      const a = (Math.PI / 2) * k;
      // The shaft's bone along its upper side, the knuckles' shadow under.
      const shaft: readonly Pt[] = [[0.3, -0.13], [0.7, -0.13], [0.7, 0.02], [0.3, 0.02]];
      const knuckle: readonly Pt[] = [[0.76, 0.06], [0.92, 0.06], [0.88, 0.28], [0.76, 0.27]];
      lit(ctx, f, skin, bent(shaft.map(turned(a)), pose, 2));
      plate(ctx, f, skin, bent(knuckle.map(turned(a)), pose, 2));
    }
    disc(ctx, f, skin.plate, 0, 0, 0.32);
    motif(ctx, f, skin, theme, circle(0.3, 0, 0, 10), 'crossbones');
    eye(ctx, f, skin, 0, 0, 0.19);
  },
};

/** A pterosaur from above: a long beak down the lane, wings swept back into a chevron, a stub of tail. */
const PTERO_UPPER: readonly Pt[] = [
  [-1, 0],
  [-0.66, -0.08],
  [-0.5, -0.17],
  [-0.38, -0.2],
  [0.56, -0.98],
  [0.66, -0.86],
  [0.42, -0.6],
  [0.34, -0.42],
  [0.14, -0.26],
  [0.06, -0.08],
  [0.44, -0.04],
];
const PTERO_HULL: readonly Pt[] = [...PTERO_UPPER, [0.5, 0], ...PTERO_UPPER.slice(1).reverse().map(([x, y]): Pt => [x, -y])];

/** Its wings beat: drawn in and back, then flung forward and wide. */
const PTERO_POSES: readonly Pose[] = [
  STILL,
  ([x, y]) => {
    const t = ramp(Math.abs(y), 0.2, 1);
    return [x + 0.14 * t, y * (1 - 0.2 * t)];
  },
  ([x, y]) => {
    const t = ramp(Math.abs(y), 0.2, 1);
    return [x - 0.06 * t, y * (1 + 0.06 * t)];
  },
];

const SAURIAN_SOWER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(PTERO_HULL, PTERO_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = PTERO_POSES[n]!;
    // The lower wing in shadow, the wing finger's bone along each leading edge.
    plate(ctx, f, skin, bent([
      [-0.3, 0.2],
      [0.5, 0.86],
      [0.38, 0.56],
      [0.08, 0.24],
    ], pose, 3));
    for (const s of [-1, 1]) {
      lit(ctx, f, skin, bent([
        [-0.34, 0.2 * s],
        [0.54, 0.92 * s],
        [0.52, 0.78 * s],
        [-0.2, 0.2 * s],
      ], pose, 3));
    }
    // The beak in bone.
    lit(ctx, f, skin, bent([
      [-0.94, 0],
      [-0.62, -0.075],
      [-0.62, 0.075],
    ], pose, 1));
    motif(ctx, f, skin, theme, [
      [-0.3, -0.12],
      [0.3, -0.06],
      [0.3, 0.06],
      [-0.3, 0.12],
    ], 'ptero', pose);
    const [ex, ey] = pose([-0.44, 0]);
    eye(ctx, f, skin, ex, ey, 0.13);
  },
};

/*
  ══ THE TOXIC MIRE — a swamp that eats what lands in it ════════════════════════════════════════════

  The hydra's place and the chorus's, the spore its own. What it sends is what lives in poisoned
  water: a toad, a mosquito, a leech, a toadstool, a tadpole, a ring of spawn, a flytrap and a bat. The
  hull is the place's bruised violet and the lit ink is its acid — 0228's yellow-green — so what is
  lit here is what is poisonous: the spots, the stripes, the gills, the venom in a sting.
*/

/**
 * A limb as a band along a line of joints, out one side and back the other: spliced into an outline
 * where it leaves the body. `half` is its half-width at each joint. The side that comes first is the
 * one nearer `before`, the outline point the limb is reached from, so the walk never crosses itself.
 */
function limb(joints: readonly Pt[], half: readonly number[], before: Pt): Pt[] {
  const left: Pt[] = [];
  const right: Pt[] = [];
  joints.forEach(([x, y], i) => {
    const [ax, ay] = joints[Math.max(0, i - 1)]!;
    const [bx, by] = joints[Math.min(joints.length - 1, i + 1)]!;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const w = half[i]!;
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  });
  const near = (p: Pt): number => Math.hypot(p[0] - before[0], p[1] - before[1]);
  const [first, second] = near(left[0]!) <= near(right[0]!) ? [left, right] : [right, left];
  const tip = joints[joints.length - 1]!;
  const [px, py] = joints[joints.length - 2]!;
  const reach = Math.hypot(tip[0] - px, tip[1] - py) || 1;
  const w = half[half.length - 1]!;
  return [...first, [tip[0] + ((tip[0] - px) / reach) * w, tip[1] + ((tip[1] - py) / reach) * w], ...second.reverse()];
}

/** The toad's legs per frame: hind hip, knee, ankle, toe; then fore shoulder, elbow, hand. Upper side. */
const TOAD_LEGS: readonly { hind: readonly Pt[]; fore: readonly Pt[] }[] = [
  // Crouched: the hind legs folded up under it, knees forward, the feet behind.
  { hind: [[0.34, -0.36], [0.14, -0.72], [0.56, -0.82], [0.9, -0.74]], fore: [[-0.26, -0.38], [-0.34, -0.62], [-0.58, -0.72]] },
  // The kick: hind legs flung straight back, forelegs swept to its sides.
  { hind: [[0.34, -0.36], [0.6, -0.56], [0.8, -0.56], [0.97, -0.42]], fore: [[-0.26, -0.38], [-0.14, -0.64], [0.02, -0.74]] },
  // Drawing them back up.
  { hind: [[0.34, -0.36], [0.34, -0.74], [0.72, -0.78], [0.96, -0.6]], fore: [[-0.26, -0.38], [-0.26, -0.64], [-0.42, -0.78]] },
];

/** A toad from above, swimming: a squat body, two eyes standing up off its head, and its four legs. */
function toadHull(n: number): Pt[] {
  const { hind, fore } = TOAD_LEGS[n]!;
  const headSide: Pt = [-0.46, -0.42];
  const flank: Pt = [0.18, -0.52];
  const upper: Pt[] = [
    [-0.72, 0],
    [-0.7, -0.18],
    [-0.6, -0.36],
    headSide,
    ...limb(fore, [0.15, 0.12, 0.13], headSide),
    [-0.04, -0.52],
    flank,
    ...limb(hind, [0.19, 0.15, 0.12, 0.14], flank),
    [0.56, -0.3],
    [0.64, 0],
  ];
  return [...upper.slice(0, -1), [0.62, 0], ...upper.slice(1, -1).reverse().map(([x, y]): Pt => [x, -y])];
}

const MIRE_DRIFTER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, toadHull(n)),
  paint: (ctx, f, skin, theme, n) => {
    // The pale belly-shadow under it, the acid warts across its back, and the two eyes on their bumps.
    plate(ctx, f, skin, [
      [-0.5, 0.12],
      [0.48, 0.12],
      [0.48, 0.24],
      [0.2, 0.38],
      [-0.2, 0.38],
      [-0.46, 0.28],
    ]);
    // A pale stripe down its back, as a toad wears; the warts are the place's spots.
    lit(ctx, f, skin, [
      [-0.36, -0.1],
      [0.46, -0.09],
      [0.46, 0.09],
      [-0.36, 0.1],
    ]);
    motif(ctx, f, skin, theme, [
      [-0.16, -0.44],
      [0.4, -0.36],
      [0.4, -0.1],
      [-0.16, -0.12],
    ], 'toad');
    for (const s of [-1, 1]) eye(ctx, f, skin, -0.5, 0.2 * s, 0.15, [0, -1, 1][n]!);
  },
};

/** A mosquito: its sting down the lane, a small head and two broad wings back to the corners. */
const MOSQUITO_UPPER: readonly Pt[] = [
  [-1, 0],
  [-0.54, -0.05],
  [-0.46, -0.16],
  [-0.3, -0.18],
  [-0.18, -0.24],
  [0.42, -0.9],
  [0.72, -0.96],
  [0.86, -0.82],
  [0.7, -0.5],
  [0.56, -0.26],
  [0.98, -0.1],
];
const MOSQUITO_HULL: readonly Pt[] = [...MOSQUITO_UPPER, [1, 0], ...MOSQUITO_UPPER.slice(1).reverse().map(([x, y]): Pt => [x, -y])];

/** Its wings whirr: back and in, then forward and out. */
const MOSQUITO_POSES: readonly Pose[] = [
  STILL,
  ([x, y]) => {
    const t = ramp(Math.abs(y), 0.25, 1) * ramp(x, -0.3, 0.2);
    return [x + 0.16 * t, y * (1 - 0.18 * t)];
  },
  ([x, y]) => {
    const t = ramp(Math.abs(y), 0.25, 1) * ramp(x, -0.3, 0.2);
    return [x - 0.12 * t, y * (1 + 0.04 * t)];
  },
];

const MIRE_LANCER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(MOSQUITO_HULL, MOSQUITO_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = MOSQUITO_POSES[n]!;
    // The wings in shadow with one vein of acid down each, and the striped body between them.
    for (const s of [-1, 1]) {
      plate(ctx, f, skin, bent([
        [-0.04, 0.26 * s],
        [0.44, 0.82 * s],
        [0.68, 0.86 * s],
        [0.54, 0.42 * s],
        [0.3, 0.24 * s],
      ], pose, 3));
      lit(ctx, f, skin, bent([
        [0.02, 0.3 * s],
        [0.6, 0.86 * s],
        [0.62, 0.74 * s],
        [0.12, 0.28 * s],
      ], pose, 3));
    }
    for (const x of [0.26, 0.54, 0.8]) {
      lit(ctx, f, skin, bent([
        [x - 0.08, -0.12],
        [x + 0.08, -0.12],
        [x + 0.08, 0.12],
        [x - 0.08, 0.12],
      ], pose, 1));
    }
    motif(ctx, f, skin, theme, [
      [-0.16, -0.16],
      [0.2, -0.16],
      [0.2, 0.16],
      [-0.16, 0.16],
    ], 'mosquito', pose);
    const [ex, ey] = pose([-0.36, 0]);
    eye(ctx, f, skin, ex, ey, 0.13);
  },
};

/** A leech lying across the lane: fat in the middle, a small sucker at its head and a big one at its tail. */
function leechHull(): Pt[] {
  const front: Pt[] = [];
  const back: Pt[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const y = -0.96 + (1.92 * i) / steps;
    const body = 0.4 * Math.max(0, 1 - ((y - 0.05) / 0.98) ** 2);
    // The tail sucker is a disc of its own at the far end, the head's a smaller one at the near.
    const sucker = 0.22 * Math.sqrt(Math.max(0, 1 - ((y - 0.8) / 0.18) ** 2));
    const mouth = 0.21 * Math.sqrt(Math.max(0, 1 - ((y + 0.76) / 0.2) ** 2));
    // Its rings, standing just proud of the skin.
    const ring = 0.035 * Math.cos(10 * Math.PI * y) ** 2;
    const w = Math.max(body + ring, sucker, mouth, 0.04);
    front.push([-w, y]);
    back.push([w, y]);
  }
  return [...front, ...back.reverse()];
}

const LEECH_POSES: readonly Pose[] = [STILL, swims(0.22), swims(-0.22)];
const LEECH_BANDS = [-0.5, -0.1, 0.3] as const;

const MIRE_WEAVER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, posed(leechHull(), LEECH_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = LEECH_POSES[n]!;
    plate(ctx, f, skin, bent([
      [0.02, -0.5],
      [0.22, -0.46],
      [0.22, 0.5],
      [0.02, 0.55],
    ], pose, 8));
    // Bands of acid round it: what says this one is poison to touch.
    for (const y of LEECH_BANDS) {
      lit(ctx, f, skin, bent([
        [-0.2, y - 0.1],
        [0.18, y - 0.1],
        [0.18, y + 0.1],
        [-0.2, y + 0.1],
      ], pose, 4));
    }
    motif(ctx, f, skin, theme, [
      [-0.16, 0.42],
      [0.16, 0.42],
      [0.16, 0.6],
      [-0.16, 0.6],
    ], 'leech', pose);
    const [ex, ey] = pose([0, -0.74]);
    eye(ctx, f, skin, ex, ey, 0.17, [0, 1, -1][n]!);
  },
};

const TOADSTOOL_FACE = -0.5;

/** A toadstool's cap from above, cut flat at its gills: the gills face down the lane and spray spores. */
function toadstoolHull(): Pt[] {
  // The cap: lumpy with warts, and its rim curling down past the gills at both ends, as a cap does.
  const cap: Pt[] = [];
  const steps = 40;
  for (let k = 0; k <= steps; k++) {
    const a = -Math.PI / 2 + (Math.PI * k) / steps;
    const rad = 0.96 - 0.08 * Math.abs(Math.sin(5 * (a + Math.PI / 2)));
    const curl = 0.24 * Math.abs(Math.sin(a)) ** 10;
    cap.push([TOADSTOOL_FACE + Math.cos(a) * rad - curl, Math.sin(a) * rad]);
  }
  // The gills: a frill along the face, under the rim, each fold standing a little proud of it.
  const gills: Pt[] = [];
  for (let k = 1; k < 12; k++) {
    const y = 0.86 - (1.72 * k) / 12;
    gills.push([TOADSTOOL_FACE + 0.02 - (k % 2 === 1 ? 0.14 : 0), y]);
  }
  return [...cap, [TOADSTOOL_FACE + 0.02, 0.86], ...gills, [TOADSTOOL_FACE + 0.02, -0.86]];
}

const TOADSTOOL_POSES: readonly Pose[] = [STILL, faceBows(TOADSTOOL_FACE, 0.2), faceBows(TOADSTOOL_FACE, -0.12)];

const MIRE_TURRET: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(toadstoolHull(), TOADSTOOL_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = TOADSTOOL_POSES[n]!;
    plate(ctx, f, skin, bent([
      [-0.44, 0.06],
      [0.3, 0.06],
      [0.2, 0.46],
      [-0.04, 0.7],
      [-0.44, 0.76],
    ], pose));
    // The gills, lit with what they are about to spray.
    lit(ctx, f, skin, bent([
      [-0.46, -0.8],
      [-0.29, -0.8],
      [-0.29, 0.8],
      [-0.46, 0.8],
    ], pose));
    // A toadstool's warts: the poison is on the outside.
    for (const [x, y, rad] of [[0.0, -0.46, 0.14], [0.2, -0.1, 0.12], [0.08, 0.42, 0.13], [-0.16, -0.2, 0.1]] as const) {
      disc(ctx, f, skin.lit, x, y, rad);
    }
    motif(ctx, f, skin, theme, [
      [0.14, 0.12],
      [0.36, 0.12],
      [0.3, 0.34],
      [0.14, 0.3],
    ], 'toadstool', pose);
    const [ex, ey] = pose([-0.08, 0.12]);
    eye(ctx, f, skin, ex, ey, 0.16);
  },
};

/** A tadpole: a round head that leads, and a long finned tail behind it. */
function tadpoleHull(): Pt[] {
  const head: Pt[] = [];
  for (let k = 0; k <= 10; k++) head.push(polar(-Math.PI / 2 - (Math.PI * 1.2 * k) / 10 + 0.1 * Math.PI, 0.34, -0.6, 0));
  return [
    // `head` runs from above round the front to below; the tail goes back along the bottom and returns.
    ...head,
    [-0.2, 0.22],
    [0.2, 0.17],
    [0.56, 0.19],
    [0.86, 0.12],
    [1, 0],
    [0.86, -0.12],
    [0.56, -0.19],
    [0.2, -0.17],
    [-0.2, -0.22],
  ];
}

/** Its tail lashes in an S, the head holding on the ship. */
const lashes = (by: number): Pose => ([x, y]) => [x, y + by * Math.sin(Math.PI * 1.6 * (x + 0.3)) * ramp(x, -0.3, 1)];
const TADPOLE_POSES: readonly Pose[] = [STILL, lashes(0.18), lashes(-0.18)];

const MIRE_CHARGER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(tadpoleHull(), TADPOLE_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = TADPOLE_POSES[n]!;
    plate(ctx, f, skin, posed(circle(0.26, -0.56, 0.06, 14), ([x, y]) => [x, Math.max(y, 0.02)]));
    lit(ctx, f, skin, bent([
      [-0.2, -0.08],
      [0.6, -0.09],
      [0.84, 0],
      [0.6, 0.09],
      [-0.2, 0.1],
    ], pose, 4));
    motif(ctx, f, skin, theme, circle(0.2, -0.6, -0.06, 10), 'tadpole', pose);
    eye(ctx, f, skin, -0.72, -0.04, 0.14);
  },
};

/** The spawn's bore per frame, and how many eggs make its ring. */
const SPAWN_BORE: readonly number[] = [0.38, 0.28, 0.46];
const SPAWN_EGGS = 12;

/** A ring of frogspawn: eggs clustered round a hole, the outside and the inside both a string of beads. */
function spawnRing(bore: number): { outer: Pt[]; inner: Pt[]; eggs: Pt[] } {
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  const steps = 110;
  for (let i = 0; i < steps; i++) {
    const a = (2 * Math.PI * i) / steps;
    const bead = Math.sqrt(Math.abs(Math.cos((SPAWN_EGGS / 2) * a)));
    outer.push(polar(a, 0.82 + 0.16 * bead));
    inner.push(polar(a, bore + 0.1 * (1 - bead)));
  }
  const mid = (bore + 0.98) / 2;
  const eggs = Array.from({ length: SPAWN_EGGS }, (_, k): Pt => polar((2 * Math.PI * k) / SPAWN_EGGS, mid));
  return { outer, inner, eggs };
}

const MIRE_WARDEN: FoeBody = {
  outline: (ctx, f, n) => {
    const { outer, inner } = spawnRing(SPAWN_BORE[n]!);
    trace(ctx, f, outer);
    trace(ctx, f, inner);
  },
  paint: (ctx, f, skin, theme, n) => {
    const bore = SPAWN_BORE[n]!;
    const gaze = [0, 1, -1][n]!;
    const { eggs } = spawnRing(bore);
    plate(ctx, f, skin, sector(bore + 0.12, 0.8, 0.1, Math.PI - 0.1));
    motif(ctx, f, skin, theme, sector(bore + 0.12, 0.8, Math.PI * 1.55, Math.PI * 1.95, 10), 'spawn');
    // An embryo in every egg; the three that face down the lane have opened their eyes.
    eggs.forEach(([x, y], k) => {
      if (k >= 5 && k <= 7) eye(ctx, f, skin, x, y, 0.12, gaze);
      else disc(ctx, f, skin.lit, x, y, 0.1);
    });
  },
};

/** A flytrap's four lobes round a mouth, each fringed with teeth: it turns, and the lobes trail. */
function flytrapHull(): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (Math.PI / 2) * k;
    out.push(polar(a - Math.PI / 4, 0.36));
    // Out along one side of the lobe, its teeth standing off the rim, round the tip and back.
    const side: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const rad = 0.42 + 0.54 * t;
      const half = 0.36 * Math.sin(Math.PI * (0.25 + 0.75 * t));
      const tooth = i % 2 === 1 ? 0.1 : 0;
      side.push([rad, half + tooth]);
    }
    for (const [rad, h] of side) out.push(polar(a - Math.atan2(h, rad), Math.hypot(rad, h)));
    for (const [rad, h] of side.slice().reverse()) out.push(polar(a + Math.atan2(h, rad), Math.hypot(rad, h)));
  }
  return out;
}

const FLYTRAP_POSES: readonly Pose[] = [STILL, wheelTrails(0.28), wheelTrails(-0.28)];

const MIRE_SPINNER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(flytrapHull(), FLYTRAP_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = FLYTRAP_POSES[n]!;
    for (let k = 0; k < 4; k++) {
      const a = (Math.PI / 2) * k;
      // The inside of each lobe is the trap: lit, with its shadowed half on the side it trails.
      const lobe: readonly Pt[] = [[0.46, -0.12], [0.8, -0.16], [0.86, 0], [0.8, 0.16], [0.46, 0.12]];
      lit(ctx, f, skin, bent(lobe.map(turned(a)), pose, 2));
      const shadow: readonly Pt[] = [[0.46, 0.15], [0.78, 0.2], [0.7, 0.3], [0.46, 0.27]];
      plate(ctx, f, skin, bent(shadow.map(turned(a)), pose, 2));
    }
    disc(ctx, f, skin.plate, 0, 0, 0.3);
    motif(ctx, f, skin, theme, circle(0.28, 0, 0, 10), 'flytrap');
    eye(ctx, f, skin, 0, 0, 0.18);
  },
};

/** A bat: ears and a snout down the lane, and two wings swept back whose edges hang between the fingers. */
const BAT_UPPER: readonly Pt[] = [
  [-1, 0],
  [-0.86, -0.08],
  [-0.92, -0.2],
  [-0.7, -0.16],
  [-0.5, -0.2],
  [0.48, -0.98],
  [0.56, -0.74],
  [0.74, -0.78],
  [0.66, -0.52],
  [0.86, -0.5],
  [0.52, -0.3],
  [0.2, -0.14],
  [0.4, -0.06],
];
const BAT_HULL: readonly Pt[] = [...BAT_UPPER, [0.46, 0], ...BAT_UPPER.slice(1).reverse().map(([x, y]): Pt => [x, -y])];

const BAT_POSES: readonly Pose[] = [
  STILL,
  ([x, y]) => {
    const t = ramp(Math.abs(y), 0.2, 1);
    return [x + 0.14 * t, y * (1 - 0.22 * t)];
  },
  ([x, y]) => {
    const t = ramp(Math.abs(y), 0.2, 1);
    return [x - 0.06 * t, y * (1 + 0.06 * t)];
  },
];

const MIRE_SOWER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(BAT_HULL, BAT_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = BAT_POSES[n]!;
    plate(ctx, f, skin, bent([
      [-0.4, 0.22],
      [0.44, 0.88],
      [0.5, 0.7],
      [0.6, 0.6],
      [0.44, 0.34],
      [0.12, 0.17],
    ], pose, 3));
    // The finger bones of each wing, lit with venom.
    for (const s of [-1, 1]) {
      lit(ctx, f, skin, bent([
        [-0.44, 0.22 * s],
        [0.46, 0.92 * s],
        [0.44, 0.76 * s],
        [-0.3, 0.2 * s],
      ], pose, 3));
    }
    motif(ctx, f, skin, theme, [
      [-0.4, -0.12],
      [0.26, -0.1],
      [0.26, 0.1],
      [-0.4, 0.12],
    ], 'bat', pose);
    const [ex, ey] = pose([-0.66, 0]);
    eye(ctx, f, skin, ex, ey, 0.12);
  },
};

/*
  ══ THE LABYRINTH — a machine that built itself a maze ═════════════════════════════════════════════

  The gyre's place — a great toothed wheel — and the lattice's; the sentry is its own block. Nothing
  here is alive: what it sends is MADE, square-cornered and stepped, in the teal of its casings with
  its traces lit pink, which 0228 already gave its circuitry. A drone, a stepped delta, a chain of
  blocks, a battlement, a missile, a gear, a jack and a stepped chevron.
*/

/** The drone's rotors: how far out each pair sits and how big its guard is, per frame — it banks. */
const DRONE_TILT: readonly (readonly [number, number, number, number])[] = [
  // [along-lane pair out, its radius, across-lane pair out, its radius]
  [0.66, 0.27, 0.66, 0.27],
  [0.54, 0.22, 0.7, 0.3],
  [0.7, 0.3, 0.54, 0.22],
];

/** The farthest a ray at angle `a` gets through a disc of radius `rho` at `d` along angle `at`, or 0. */
function exitOf(a: number, at: number, d: number, rho: number): number {
  const delta = a - at;
  const off = d * Math.sin(delta);
  if (Math.abs(off) >= rho || Math.cos(delta) <= 0) return 0;
  return d * Math.cos(delta) + Math.sqrt(rho * rho - off * off);
}

/** A quadcopter: a diamond of a body, four struts and four guarded rotors. It hovers; it has no front. */
function droneHull(n: number): Pt[] {
  const [dx, rx, dy, ry] = DRONE_TILT[n]!;
  const out: Pt[] = [];
  const steps = 180;
  for (let i = 0; i < steps; i++) {
    const a = (2 * Math.PI * i) / steps;
    let rad = 0.38 / (Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)));
    for (let k = 0; k < 4; k++) {
      const at = (Math.PI / 2) * k;
      const [d, rho] = k % 2 === 0 ? [dx, rx] : [dy, ry];
      let delta = a - at;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      // The strut out to the rotor, then the rotor's guard.
      if (Math.abs(delta) < 0.11) rad = Math.max(rad, d);
      rad = Math.max(rad, exitOf(a, at, d, rho));
    }
    out.push(polar(a, rad));
  }
  return out;
}

const LABYRINTH_DRIFTER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, droneHull(n)),
  paint: (ctx, f, skin, theme, n) => {
    const [dx, rx, dy, ry] = DRONE_TILT[n]!;
    // Each rotor a dark well with a lit hub; the body's casing lit along its upper edges.
    for (let k = 0; k < 4; k++) {
      const [d, rho] = k % 2 === 0 ? [dx, rx] : [dy, ry];
      const [x, y] = polar((Math.PI / 2) * k, d);
      disc(ctx, f, skin.plate, x, y, rho * 0.7);
      disc(ctx, f, skin.lit, x, y, Math.max(0.1, rho * 0.36));
    }
    plate(ctx, f, skin, [
      [-0.3, 0.04],
      [0.3, 0.04],
      [0, 0.32],
    ]);
    motif(ctx, f, skin, theme, square(0.04, 0.04, 0.16), 'drone');
    eye(ctx, f, skin, -0.04, 0, 0.16, [0, -1, 1][n]!);
  },
};

/** A stepped delta: a triangle built of blocks, pointing down the lane, with two thrusters behind. */
function deltaHull(thrust: number): Pt[] {
  const upper: Pt[] = [
    [-1, -0.08],
    [-0.66, -0.08],
    [-0.66, -0.27],
    [-0.32, -0.27],
    [-0.32, -0.46],
    [0.02, -0.46],
    [0.02, -0.65],
    [0.36, -0.65],
    [0.36, -0.86],
    [0.76, -0.86],
    [0.76, -0.44],
    [0.8 + thrust, -0.44],
    [0.8 + thrust, -0.18],
    [0.76, -0.18],
    [0.76, 0],
  ];
  return [...upper, ...upper.slice(0, -1).reverse().map(([x, y]): Pt => [x, -y])];
}
const DELTA_THRUST = [0.12, 0.2, 0.06] as const;
const DELTA_POSES: readonly Pose[] = [STILL, aftWings(0.8, 0.12), aftWings(1.1, -0.06)];

/** What is aft and out — the wingtips of a stepped delta — folding in and back, or out and forward. */
function aftWings(spread: number, back: number): Pose {
  return ([x, y]) => {
    const t = ramp(x, -0.4, 0.4) * ramp(Math.abs(y), 0.3, 0.86);
    return [x + back * t, y * (1 + (spread - 1) * t)];
  };
}

const LABYRINTH_LANCER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, posed(deltaHull(DELTA_THRUST[n]!), DELTA_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = DELTA_POSES[n]!;
    plate(ctx, f, skin, posed([
      [-0.62, 0.06],
      [0.7, 0.06],
      [0.7, 0.8],
      [0.4, 0.8],
      [0.4, 0.6],
      [0.06, 0.6],
      [0.06, 0.4],
      [-0.28, 0.4],
      [-0.28, 0.22],
      [-0.62, 0.22],
    ], pose));
    // A lit trace down each step of its upper edge, and the thrusters glowing.
    lit(ctx, f, skin, posed([
      [-0.6, -0.08],
      [-0.6, -0.2],
      [-0.26, -0.2],
      [-0.26, -0.39],
      [0.08, -0.39],
      [0.08, -0.58],
      [0.42, -0.58],
      [0.42, -0.78],
      [0.56, -0.78],
      [0.56, -0.64],
      [0.22, -0.64],
      [0.22, -0.45],
      [-0.12, -0.45],
      [-0.12, -0.26],
      [-0.46, -0.26],
      [-0.46, -0.08],
    ], pose));
    for (const s of [-1, 1]) {
      lit(ctx, f, skin, [
        [0.66, 0.2 * s],
        [0.76 + DELTA_THRUST[n]!, 0.2 * s],
        [0.76 + DELTA_THRUST[n]!, 0.42 * s],
        [0.66, 0.42 * s],
      ]);
    }
    motif(ctx, f, skin, theme, [
      [0.1, -0.3],
      [0.6, -0.3],
      [0.6, 0.0],
      [0.1, 0.0],
    ], 'delta', pose);
    eye(ctx, f, skin, -0.5, 0, 0.15);
  },
};

/** The chain's five blocks across the lane, and how tall each one is. */
const CHAIN_BLOCKS = [-0.8, -0.4, 0, 0.4, 0.8] as const;
const BLOCK_HALF = 0.16;

/** How far each block of the chain stands off its spine, alternately: links that zig-zag, as a chain does. */
const BLOCK_STAGGER = [-0.08, 0.08, -0.08, 0.08, -0.08] as const;

/** A chain of blocks across the lane, joined by short links: the snake a machine makes. */
function blockChainHull(): Pt[] {
  const front: Pt[] = [];
  const back: Pt[] = [];
  CHAIN_BLOCKS.forEach((y, k) => {
    const s = BLOCK_STAGGER[k]!;
    const top = k === 0 ? y - BLOCK_HALF : y - BLOCK_HALF + 0.02;
    const bottom = k === CHAIN_BLOCKS.length - 1 ? y + BLOCK_HALF : y + BLOCK_HALF - 0.02;
    if (k > 0) {
      front.push([-0.05, y - BLOCK_HALF - 0.04]);
      back.push([0.05, y - BLOCK_HALF - 0.04]);
    }
    front.push([s - 0.27, top], [s - 0.27, bottom]);
    back.push([s + 0.27, top], [s + 0.27, bottom]);
    if (k < CHAIN_BLOCKS.length - 1) {
      front.push([-0.05, y + BLOCK_HALF + 0.04]);
      back.push([0.05, y + BLOCK_HALF + 0.04]);
    }
  });
  return [...front, ...back.reverse()];
}

const BLOCK_CHAIN_POSES: readonly Pose[] = [STILL, swims(0.2), swims(-0.2)];

const LABYRINTH_WEAVER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(blockChainHull(), BLOCK_CHAIN_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = BLOCK_CHAIN_POSES[n]!;
    CHAIN_BLOCKS.forEach((y, k) => {
      const s = BLOCK_STAGGER[k]!;
      plate(ctx, f, skin, bent([
        [s + 0.03, y - BLOCK_HALF + 0.04],
        [s + 0.24, y - BLOCK_HALF + 0.04],
        [s + 0.24, y + BLOCK_HALF - 0.04],
        [s + 0.03, y + BLOCK_HALF - 0.04],
      ], pose, 2));
      if (k !== 2) {
        lit(ctx, f, skin, bent([
          [s - 0.23, y - 0.1],
          [s - 0.03, y - 0.1],
          [s - 0.03, y + 0.1],
          [s - 0.23, y + 0.1],
        ], pose, 2));
      }
    });
    motif(ctx, f, skin, theme, [
      [-0.3, 0.68],
      [0.15, 0.68],
      [0.15, 0.92],
      [-0.3, 0.92],
    ], 'blocks', pose);
    const [ex, ey] = pose([BLOCK_STAGGER[2], 0]);
    eye(ctx, f, skin, ex, ey, 0.17, [0, 1, -1][n]!);
  },
};

const BATTLEMENT_FACE = -0.55;

/** A battlement: a half-disc tower whose dome is crenellated, square merlons all round it. */
function battlementHull(): Pt[] {
  // Seven merlons and the six gaps between them, so the dome meets the face on a merlon at both ends.
  const segments = 13;
  return domeOf(BATTLEMENT_FACE, (a) => {
    const t = Math.min(0.999, (a + Math.PI / 2) / Math.PI);
    return Math.floor(t * segments) % 2 === 0 ? 1 : 0.82;
  }, 117);
}

const BATTLEMENT_POSES: readonly Pose[] = [STILL, faceBows(BATTLEMENT_FACE, 0.16), faceBows(BATTLEMENT_FACE, -0.1)];

const LABYRINTH_TURRET: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, posed(battlementHull(), BATTLEMENT_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = BATTLEMENT_POSES[n]!;
    plate(ctx, f, skin, bent([
      [-0.5, 0.06],
      [0.22, 0.06],
      [0.14, 0.44],
      [-0.06, 0.66],
      [-0.5, 0.74],
    ], pose));
    lit(ctx, f, skin, bent([
      [-0.5, -0.76],
      [-0.34, -0.76],
      [-0.34, 0.76],
      [-0.5, 0.76],
    ], pose));
    // Three lit slits in the tower wall: the three guns of its spray.
    for (const a of [-0.62, 0, 0.62]) {
      const [x, y] = polar(a, 0.52, BATTLEMENT_FACE, 0);
      lit(ctx, f, skin, posed(square(x, y, 0.07), pose));
    }
    motif(ctx, f, skin, theme, [
      [-0.2, -0.64],
      [0.06, -0.54],
      [0.12, -0.3],
      [-0.1, -0.22],
    ], 'battlement', pose);
    const [ex, ey] = pose([-0.2, 0]);
    eye(ctx, f, skin, ex, ey, 0.19);
  },
};

/** A missile: a nose cone down the lane, a body, two swept fins and the nozzle. */
const MISSILE_UPPER: readonly Pt[] = [
  [-1, 0],
  [-0.8, -0.13],
  [-0.62, -0.18],
  [0.46, -0.18],
  [0.72, -0.44],
  [0.94, -0.44],
  [0.82, -0.18],
  [0.9, -0.12],
  [1, -0.12],
];
const MISSILE_HULL: readonly Pt[] = [...MISSILE_UPPER, ...MISSILE_UPPER.slice(1).reverse().map(([x, y]): Pt => [x, -y])];
const MISSILE_POSES: readonly Pose[] = [STILL, tailFlicks(-0.2, 0.16, 0), tailFlicks(-0.2, -0.16, 0)];

const LABYRINTH_CHARGER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(MISSILE_HULL, MISSILE_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = MISSILE_POSES[n]!;
    plate(ctx, f, skin, bent([
      [-0.6, 0.0],
      [0.44, 0.0],
      [0.44, 0.17],
      [-0.6, 0.17],
    ], pose, 3));
    // The warhead band, lit.
    lit(ctx, f, skin, bent([
      [-0.56, -0.17],
      [-0.38, -0.17],
      [-0.38, 0.17],
      [-0.56, 0.17],
    ], pose, 1));
    motif(ctx, f, skin, theme, [
      [-0.3, -0.17],
      [0.4, -0.17],
      [0.4, 0.0],
      [-0.3, 0.0],
    ], 'missile', pose);
    disc(ctx, f, skin.eye, -0.76, 0, 0.09);
  },
};

/** The gear's bore per frame, and its teeth. */
const GEAR_BORE: readonly number[] = [0.42, 0.32, 0.5];
const GEAR_TEETH = 10;

/** A gear: square teeth all round a ring, turning a notch each frame, the gyre's own small cousin. */
function gearOuter(n: number): Pt[] {
  const out: Pt[] = [];
  const turn = [0, 0.1, -0.1][n]!;
  const pitch = (2 * Math.PI) / GEAR_TEETH;
  for (let k = 0; k < GEAR_TEETH; k++) {
    const a = pitch * k + turn;
    out.push(polar(a - pitch * 0.5, 0.8), polar(a - pitch * 0.22, 0.8), polar(a - pitch * 0.18, 1), polar(a + pitch * 0.18, 1), polar(a + pitch * 0.22, 0.8));
  }
  return out;
}

const LABYRINTH_WARDEN: FoeBody = {
  outline: (ctx, f, n) => {
    trace(ctx, f, gearOuter(n));
    trace(ctx, f, circle(GEAR_BORE[n]!, 0, 0, 32));
  },
  paint: (ctx, f, skin, theme, n) => {
    const bore = GEAR_BORE[n]!;
    const gaze = [0, 1, -1][n]!;
    plate(ctx, f, skin, sector(bore + 0.05, 0.76, 0.05, Math.PI - 0.05));
    lit(ctx, f, skin, sector(bore + 0.04, bore + 0.16, Math.PI * 0.6, Math.PI * 1.45, 16));
    motif(ctx, f, skin, theme, sector(bore + 0.2, 0.76, Math.PI * 1.5, Math.PI * 1.95, 10), 'gear');
    eye(ctx, f, skin, -0.66, 0, 0.11, gaze);
    eye(ctx, f, skin, -0.33, -0.57, 0.1, gaze);
    eye(ctx, f, skin, -0.33, 0.57, 0.1, gaze);
  },
};

/** A jack: a cross of square arms, each capped across its end. */
function jackHull(): Pt[] {
  const arm: Pt[] = [
    [0.18, -0.18],
    [0.72, -0.18],
    [0.72, -0.44],
    [0.98, -0.44],
    [0.98, 0.44],
    [0.72, 0.44],
    [0.72, 0.18],
  ];
  return [0, 1, 2, 3].flatMap((k) => arm.map(turned((Math.PI / 2) * k)));
}

const JACK_POSES: readonly Pose[] = [STILL, wheelTrails(0.3), wheelTrails(-0.3)];

const LABYRINTH_SPINNER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(jackHull(), JACK_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = JACK_POSES[n]!;
    for (let k = 0; k < 4; k++) {
      const a = (Math.PI / 2) * k;
      const cap: readonly Pt[] = [[0.77, -0.38], [0.93, -0.38], [0.93, 0.38], [0.77, 0.38]];
      const wire: readonly Pt[] = [[0.3, -0.07], [0.66, -0.07], [0.66, 0.07], [0.3, 0.07]];
      (k < 2 ? plate : lit)(ctx, f, skin, bent(cap.map(turned(a)), pose, 3));
      lit(ctx, f, skin, bent(wire.map(turned(a)), pose, 2));
    }
    disc(ctx, f, skin.plate, 0, 0, 0.23);
    motif(ctx, f, skin, theme, square(0, 0, 0.16), 'jack');
    eye(ctx, f, skin, 0, 0, 0.17);
  },
};

/** A stepped chevron: two arms of blocks swept back from a square head, each ending in an emitter. */
const STEP_CHEVRON_UPPER: readonly Pt[] = [
  [-1, 0],
  [-1, -0.16],
  [-0.66, -0.16],
  [-0.66, -0.36],
  [-0.3, -0.36],
  [-0.3, -0.56],
  [0.06, -0.56],
  [0.06, -0.76],
  [0.48, -0.76],
  [0.48, -0.98],
  [0.96, -0.98],
  [0.96, -0.54],
  [0.6, -0.54],
  [0.6, -0.4],
  [0.24, -0.4],
  [0.24, -0.22],
  [-0.12, -0.22],
  [-0.12, 0],
];
const STEP_CHEVRON_HULL: readonly Pt[] = [...STEP_CHEVRON_UPPER, ...STEP_CHEVRON_UPPER.slice(1, -1).reverse().map(([x, y]): Pt => [x, -y])];
const STEP_CHEVRON_POSES: readonly Pose[] = [STILL, aftWings(0.84, 0.08), aftWings(1.05, -0.05)];

const LABYRINTH_SOWER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, posed(STEP_CHEVRON_HULL, STEP_CHEVRON_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = STEP_CHEVRON_POSES[n]!;
    // The lower arm's blocks in shadow, one per step.
    for (const [x0, x1, y0, y1] of [[-0.62, -0.34, 0.16, 0.31],[-0.27, 0.03, 0.36, 0.51], [0.09, 0.45, 0.46, 0.71]] as const) {
      plate(ctx, f, skin, posed([
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
      ], pose));
    }
    // The two emitters at the arm ends: the two lances of its wall.
    for (const s of [-1, 1]) {
      lit(ctx, f, skin, posed([
        [0.54, 0.6 * s],
        [0.9, 0.6 * s],
        [0.9, 0.92 * s],
        [0.54, 0.92 * s],
      ], pose));
    }
    motif(ctx, f, skin, theme, [
      [-0.26, -0.5],
      [0.04, -0.5],
      [0.04, -0.28],
      [-0.26, -0.28],
    ], 'stepped', pose);
    eye(ctx, f, skin, -0.74, 0, 0.13);
  },
};

/*
  ══ RIME SHELF — ice that grew teeth ══════════════════════════════════════════════════════════════

  Hoarfrost's place — a ship of ice grown spires — and the redoubt's; the shard is its own crystal.
  Nothing here bends: everything is cut, faceted and pointed, in the shelf's blue with its facets lit
  near-white. A crystal does not flap, so what moves in these is a crystal's motion — a turn, a roll,
  the light running across a face — and the spikes it grows.
*/

/** A snowflake's arm: a spoke with a pair of barbs, pointing out along +x from the hub. */
const FLAKE_ARM: readonly Pt[] = [
  [0.36, -0.13],
  [0.56, -0.13],
  [0.64, -0.3],
  [0.74, -0.24],
  [0.7, -0.1],
  [0.98, 0],
  [0.7, 0.1],
  [0.74, 0.24],
  [0.64, 0.3],
  [0.56, 0.13],
  [0.36, 0.13],
];

/** A snowflake: six barbed arms off a hexagonal heart. It hangs there and turns; it has no front. */
function flakeHull(turn: number): Pt[] {
  return [0, 1, 2, 3, 4, 5].flatMap((k) => FLAKE_ARM.map(turned((Math.PI / 3) * k + turn)));
}
const FLAKE_TURN = [0, 0.19, -0.17] as const;

const RIME_DRIFTER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, flakeHull(FLAKE_TURN[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const turn = FLAKE_TURN[n]!;
    // The arms facing the light lit along their spokes, the heart a cut hexagon.
    for (const k of [2, 3, 4]) {
      const spoke: readonly Pt[] = [[0.38, -0.1], [0.84, 0], [0.38, 0.1]];
      lit(ctx, f, skin, spoke.map(turned((Math.PI / 3) * k + turn)));
    }
    const heart = [0, 1, 2, 3, 4, 5].map((k) => polar((Math.PI / 3) * k + turn + Math.PI / 6, 0.36));
    plate(ctx, f, skin, heart);
    motif(ctx, f, skin, theme, heart, 'flake');
    eye(ctx, f, skin, 0, 0, 0.17, [0, -1, 1][n]!);
  },
};

/** A gem cut as a spearhead: a long point down the lane, the wide girdle, a short point behind. */
const GEM_HULL: readonly Pt[] = [
  [-1, 0],
  [0.2, -0.92],
  [0.44, -0.78],
  [0.86, 0],
  [0.44, 0.78],
  [0.2, 0.92],
];

/** It turns about its long axis as it comes, so its girdle narrows and the back point swings. */
const GEM_POSES: readonly Pose[] = [STILL, ([x, y]) => [x + 0.1 * ramp(x, 0.3, 0.86), y * 0.8], ([x, y]) => [x - 0.04 * ramp(x, 0.3, 0.86), y * 0.9 + 0.08 * ramp(x, 0, 0.86)]];

const RIME_LANCER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(GEM_HULL, GEM_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = GEM_POSES[n]!;
    // The table and the facets: the upper front lit, the lower back in shadow, a ridge between.
    lit(ctx, f, skin, bent([
      [-0.86, -0.02],
      [0.16, -0.82],
      [0.2, -0.56],
      [-0.4, -0.06],
    ], pose, 3));
    plate(ctx, f, skin, bent([
      [0.04, 0.06],
      [0.74, 0.04],
      [0.4, 0.68],
      [0.22, 0.76],
    ], pose, 3));
    motif(ctx, f, skin, theme, [
      [-0.1, -0.06],
      [0.5, -0.04],
      [0.4, -0.5],
      [0.2, -0.6],
    ], 'gem', pose);
    const [ex, ey] = pose([-0.36, 0.06]);
    eye(ctx, f, skin, ex, ey, 0.15);
  },
};

/** An ice needle across the lane: pointed at both ends, two pairs of barbs, as a snowflake's arm grows. */
const NEEDLE_HALF: readonly Pt[] = [
  [0, -1],
  [-0.24, -0.74],
  [-0.46, -0.62],
  [-0.3, -0.46],
  [-0.24, -0.28],
  [-0.24, 0.28],
  [-0.3, 0.46],
  [-0.46, 0.62],
  [-0.24, 0.74],
  [0, 1],
];
const NEEDLE_HULL: readonly Pt[] = [...NEEDLE_HALF, ...NEEDLE_HALF.slice(1, -1).reverse().map(([x, y]): Pt => [-x, y])];
/** A crystal does not ripple: it tilts on its long axis, one way and the other, as it weaves. */
const NEEDLE_POSES: readonly Pose[] = [STILL, turned(0.25), turned(-0.25)];

const RIME_WEAVER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, posed(NEEDLE_HULL, NEEDLE_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = NEEDLE_POSES[n]!;
    lit(ctx, f, skin, posed([
      [-0.22, -0.7],
      [-0.01, -0.9],
      [-0.01, 0.6],
      [-0.22, 0.6],
    ], pose));
    plate(ctx, f, skin, posed([
      [0.01, -0.6],
      [0.22, -0.6],
      [0.22, 0.7],
      [0.01, 0.9],
    ], pose));
    motif(ctx, f, skin, theme, [
      [-0.2, 0.2],
      [0.2, 0.2],
      [0.2, 0.5],
      [-0.2, 0.5],
    ], 'needle', pose);
    const [ex, ey] = pose([0, -0.04]);
    eye(ctx, f, skin, ex, ey, 0.17, [0, 1, -1][n]!);
  },
};

const ICEHOUSE_FACE = -0.5;

/** A dome of ice cut in flat facets, its face hung with icicles pointing down the lane: its guns. */
function icehouseHull(): Pt[] {
  const facets = 6;
  const dome: Pt[] = [];
  for (let k = 0; k <= facets; k++) {
    const a = -Math.PI / 2 + (Math.PI * k) / facets;
    dome.push([ICEHOUSE_FACE + Math.cos(a) * 1, Math.sin(a) * 1]);
  }
  const face: Pt[] = [];
  const icicles = [0.66, 0.22, -0.22, -0.66];
  face.push([ICEHOUSE_FACE, 1]);
  for (const y of icicles) face.push([ICEHOUSE_FACE, y + 0.16], [ICEHOUSE_FACE - 0.4, y], [ICEHOUSE_FACE, y - 0.16]);
  return [...dome, ...face];
}

/** It breathes cold: the icicles grow and shrink as it charges, the dome holding. */
const icicleGrows = (by: number): Pose => ([x, y]) => [x - by * ramp(-x, -ICEHOUSE_FACE + 0.02, -ICEHOUSE_FACE + 0.4), y];
const ICEHOUSE_POSES: readonly Pose[] = [STILL, icicleGrows(0.16), icicleGrows(-0.14)];

const RIME_TURRET: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(icehouseHull(), ICEHOUSE_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = ICEHOUSE_POSES[n]!;
    // Each facet of the dome its own tone: lit towards the light, in shadow away from it.
    const facet = (k: number): Pt[] => {
      const a0 = -Math.PI / 2 + (Math.PI * k) / 6;
      const a1 = a0 + Math.PI / 6;
      return [
        [ICEHOUSE_FACE + 0.06, 0],
        [ICEHOUSE_FACE + Math.cos(a0) * 0.9, Math.sin(a0) * 0.9],
        [ICEHOUSE_FACE + Math.cos(a1) * 0.9, Math.sin(a1) * 0.9],
      ];
    };
    lit(ctx, f, skin, facet(1));
    poly(ctx, f, shade(skin.hull, 0.3), facet(2));
    plate(ctx, f, skin, facet(4));
    plate(ctx, f, skin, facet(5));
    for (const y of [0.66, 0.22, -0.22, -0.66]) {
      lit(ctx, f, skin, posed([
        [ICEHOUSE_FACE + 0.02, y - 0.07],
        [ICEHOUSE_FACE - 0.26, y],
        [ICEHOUSE_FACE + 0.02, y + 0.07],
      ], pose));
    }
    motif(ctx, f, skin, theme, facet(3).map(([x, y]): Pt => [x * 0.9 + 0.02, y * 0.9]), 'icehouse');
    eye(ctx, f, skin, ICEHOUSE_FACE + 0.26, 0, 0.18);
  },
};

/** An icicle: a long faceted cone down the lane, and the crystals it broke off from still on its root. */
const ICICLE_UPPER: readonly Pt[] = [
  [-1, 0],
  [0.36, -0.2],
  [0.56, -0.38],
  [0.66, -0.2],
  [0.96, -0.3],
  [0.84, -0.06],
  [1, 0],
];
const ICICLE_HULL: readonly Pt[] = [...ICICLE_UPPER, ...ICICLE_UPPER.slice(1, -1).reverse().map(([x, y]): Pt => [x, -y])];
const ICICLE_POSES: readonly Pose[] = [STILL, tailFlicks(-0.2, 0.17, 0), tailFlicks(-0.2, -0.17, 0)];

const RIME_CHARGER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(ICICLE_HULL, ICICLE_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = ICICLE_POSES[n]!;
    lit(ctx, f, skin, bent([
      [-0.84, -0.01],
      [0.36, -0.18],
      [0.4, 0.0],
      [-0.6, 0.0],
    ], pose, 3));
    plate(ctx, f, skin, bent([
      [0.0, 0.02],
      [0.42, 0.02],
      [0.42, 0.2],
    ], pose, 3));
    motif(ctx, f, skin, theme, [
      [0.36, -0.16],
      [0.6, -0.16],
      [0.6, 0.16],
      [0.36, 0.16],
    ], 'icicle', pose);
    disc(ctx, f, skin.eye, 0.2, -0.02, 0.09);
  },
};

/** The ice ring's bore per frame. */
const HEX_BORE: readonly number[] = [0.4, 0.3, 0.48];

/** A hexagonal ring of ice, a crystal spike off each corner; it turns a little as its bore works. */
function hexRing(n: number): { outer: Pt[]; inner: Pt[] } {
  const turn = [0, 0.12, -0.1][n]!;
  const outer: Pt[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k + turn;
    outer.push(polar(a - 0.16, 0.8), polar(a, 1), polar(a + 0.16, 0.8), polar(a + Math.PI / 6, 0.74));
  }
  const inner = [0, 1, 2, 3, 4, 5].map((k) => polar((Math.PI / 3) * k + turn + Math.PI / 6, HEX_BORE[n]!));
  return { outer, inner };
}

const RIME_WARDEN: FoeBody = {
  outline: (ctx, f, n) => {
    const { outer, inner } = hexRing(n);
    trace(ctx, f, outer);
    trace(ctx, f, inner);
  },
  paint: (ctx, f, skin, theme, n) => {
    const bore = HEX_BORE[n]!;
    const gaze = [0, 1, -1][n]!;
    const turn = [0, 0.12, -0.1][n]!;
    // Each of the six faces between bore and rim its own tone of ice.
    for (let k = 0; k < 6; k++) {
      const a0 = (Math.PI / 3) * k + turn - Math.PI / 6;
      const a1 = a0 + Math.PI / 3;
      const face: Pt[] = [polar(a0 + 0.08, bore + 0.06), polar(a0 + 0.06, 0.66), polar(a1 - 0.06, 0.66), polar(a1 - 0.08, bore + 0.06)];
      const tone = [skin.plate, skin.plate, shade(skin.hull, 0.3), skin.lit, shade(skin.hull, 0.3), skin.plate][k]!;
      poly(ctx, f, tone, face);
    }
    motif(ctx, f, skin, theme, sector(bore + 0.14, 0.6, Math.PI * 1.55, Math.PI * 1.9, 8), 'hexring');
    eye(ctx, f, skin, ...polar(Math.PI + turn, 0.66), 0.11, gaze);
    eye(ctx, f, skin, ...polar(Math.PI * (2 / 3) + turn, 0.64), 0.1, gaze);
    eye(ctx, f, skin, ...polar(Math.PI * (4 / 3) + turn, 0.64), 0.1, gaze);
  },
};

/** Four long crystals crossed at their middles: a star of ice blades, turning. */
function iceStarHull(): Pt[] {
  const blade: Pt[] = [
    [0.3, -0.22],
    [0.6, -0.2],
    [1, 0],
    [0.6, 0.2],
    [0.3, 0.22],
  ];
  return [0, 1, 2, 3].flatMap((k) => blade.map(turned((Math.PI / 2) * k)));
}
const ICE_STAR_POSES: readonly Pose[] = [STILL, wheelTrails(0.26), wheelTrails(-0.26)];

const RIME_SPINNER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(iceStarHull(), ICE_STAR_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = ICE_STAR_POSES[n]!;
    for (let k = 0; k < 4; k++) {
      const a = (Math.PI / 2) * k;
      // Each blade's two faces: the one towards the light lit, the other in shadow.
      const upper: readonly Pt[] = [[0.34, -0.18], [0.6, -0.16], [0.92, 0], [0.34, 0]];
      const lower: readonly Pt[] = [[0.34, 0.02], [0.92, 0.02], [0.6, 0.17], [0.34, 0.18]];
      lit(ctx, f, skin, bent(upper.map(turned(a)), pose, 2));
      plate(ctx, f, skin, bent(lower.map(turned(a)), pose, 2));
    }
    const heart = [0, 1, 2, 3, 4, 5].map((k) => polar((Math.PI / 3) * k, 0.34));
    poly(ctx, f, shade(skin.hull, 0.3), heart);
    motif(ctx, f, skin, theme, heart, 'icestar');
    eye(ctx, f, skin, 0, 0, 0.19);
  },
};

/** A frost swallow: a chevron of two long crystals swept back from a cut head. */
const FROST_UPPER: readonly Pt[] = [
  [-1, 0],
  [-0.62, -0.2],
  [0.62, -0.98],
  [0.98, -0.62],
  [0.04, -0.12],
  [-0.08, 0],
];
const FROST_HULL: readonly Pt[] = [...FROST_UPPER.slice(0, -1), ...FROST_UPPER.slice(1, -1).reverse().map(([x, y]): Pt => [x, -y])];
const FROST_POSES: readonly Pose[] = [STILL, aftWings(0.82, 0.1), aftWings(1.06, -0.05)];

const RIME_SOWER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(FROST_HULL, FROST_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = FROST_POSES[n]!;
    for (const s of [-1, 1]) {
      // Each crystal's ridge: lit on its leading face, in shadow on its trailing one.
      lit(ctx, f, skin, bent([
        [-0.58, 0.18 * s],
        [0.6, 0.9 * s],
        [0.7, 0.82 * s],
        [-0.34, 0.1 * s],
      ], pose, 3));
      plate(ctx, f, skin, bent([
        [0.14, 0.21 * s],
        [0.8, 0.68 * s],
        [0.9, 0.64 * s],
        [0.12, 0.17 * s],
      ], pose, 3));
    }
    motif(ctx, f, skin, theme, [
      [0.1, -0.5],
      [0.5, -0.76],
      [0.6, -0.6],
      [0.2, -0.34],
    ], 'frost', pose);
    eye(ctx, f, skin, -0.62, 0, 0.13);
  },
};

/*
  ══ THE BLACK HEART — the inside of something enormous and alive ══════════════════════════════════

  The medusa's place — a glass jellyfish over a beating heart — and the axis's; the gaze is its own
  eye. What it sends is blood and what swims in it: a cell, a squid, a vessel with a knot of pulse in
  it, a jelly's bell, a stinging harpoon, a valve, a four-armed medusa and a forking artery. The hull
  is the place's blood, the lit ink the cold light 0228 gave the bell's rim, and the eyes are gold.
*/

/** A red cell: a disc with a dimple, tumbling as it drifts — edge-on, then flat again. */
const CELL_SQUASH: readonly (readonly [number, number])[] = [
  [1, 1],
  [1.06, 0.74],
  [0.84, 1.08],
];

const CORE_DRIFTER: FoeBody = {
  outline: (ctx, f, n) => {
    const [sx, sy] = CELL_SQUASH[n]!;
    trace(ctx, f, circle(0.88, 0, 0, 40).map(([x, y]): Pt => [x * sx, y * sy]));
  },
  paint: (ctx, f, skin, theme, n) => {
    const [sx, sy] = CELL_SQUASH[n]!;
    const squash = ([x, y]: Pt): Pt => [x * sx, y * sy];
    /*
      ⚠️ **NO EYE, AND A PALE DIMPLE RATHER THAN A DARK ONE.** The first draft put the drifter's eye
      in a dark dimple, and on the sheet it was the gaze — this place's own signature, a red lens with
      a gold pupil — at a smaller size. A cell's middle is thin, so it is the PALE part: the rim is
      the thick of it, in shadow round its far side and lit round its near.
    */
    plate(ctx, f, skin, sector(0.56, 0.8, Math.PI * 0.05, Math.PI * 0.95, 14).map(squash));
    lit(ctx, f, skin, sector(0.6, 0.8, Math.PI * 1.1, Math.PI * 1.6, 12).map(squash));
    poly(ctx, f, shade(skin.hull, 0.22), circle(0.46, 0.02, 0.02, 24).map(squash));
    motif(ctx, f, skin, theme, circle(0.3, 0.02, 0.02, 10), `cell${n}`, squash);
  },
};

/** A squid, mantle first down the lane as squid swim: fins at the point, eyes, and the arms trailing. */
const SQUID_UPPER: readonly Pt[] = [
  [-1, 0],
  [-0.62, -0.22],
  [-0.34, -0.66],
  [-0.14, -0.38],
  [0.3, -0.42],
  [0.9, -0.88],
  [0.98, -0.74],
  [0.62, -0.42],
  [0.98, -0.34],
  [0.98, -0.2],
  [0.62, -0.16],
];
const SQUID_HULL: readonly Pt[] = [...SQUID_UPPER, [0.62, 0], ...SQUID_UPPER.slice(1).reverse().map(([x, y]): Pt => [x, -y])];

/** It jets: the arms drawn together behind it, then flung wide. */
const armsJet = (spread: number, back: number): Pose => ([x, y]) => {
  const t = ramp(x, 0.3, 1);
  return [x + back * t, y * (1 + (spread - 1) * t)];
};
const SQUID_POSES: readonly Pose[] = [STILL, armsJet(0.62, 0.12), armsJet(1.1, -0.08)];

const CORE_LANCER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(SQUID_HULL, SQUID_POSES[n]!, 3)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = SQUID_POSES[n]!;
    // The lower fin and flank in shadow, the arms' undersides with it.
    plate(ctx, f, skin, bent([
      [-0.62, 0.06],
      [0.3, 0.06],
      [0.3, 0.36],
      [-0.14, 0.32],
      [-0.32, 0.56],
      [-0.5, 0.26],
    ], pose, 3));
    // The mantle's glow down its spine, as a deep thing lights itself.
    lit(ctx, f, skin, bent([
      [-0.88, -0.02],
      [0.2, -0.16],
      [0.2, 0.0],
      [-0.88, 0.02],
    ], pose, 3));
    motif(ctx, f, skin, theme, [
      [-0.4, -0.3],
      [0.2, -0.32],
      [0.2, -0.18],
      [-0.4, -0.12],
    ], 'squid', pose);
    for (const s of [-1, 1]) {
      const [ex, ey] = pose([0.38, 0.2 * s]);
      eye(ctx, f, skin, ex, ey, 0.13);
    }
  },
};

/** A length of vessel across the lane with a knot of pulse in the middle of it, and two stubs off it. */
function vesselHull(knot: number): Pt[] {
  const front: Pt[] = [];
  const back: Pt[] = [];
  const steps = 44;
  for (let i = 0; i <= steps; i++) {
    const y = -0.98 + (1.96 * i) / steps;
    const end = Math.sqrt(Math.min(1, (1 - Math.abs(y)) / 0.12));
    const tube = 0.21 * end;
    const bulge = knot * Math.max(0, 1 - (y / 0.36) ** 2);
    // Two cut branches on the far side, where the vessel forked once.
    const stub = 0.24 * Math.max(0, 1 - ((Math.abs(y) - 0.64) / 0.11) ** 2);
    front.push([-Math.max(tube, bulge), y]);
    back.push([Math.max(tube + stub, bulge), y]);
  }
  return [...front, ...back.reverse()];
}
const VESSEL_KNOT = [0.36, 0.46, 0.28] as const;
const VESSEL_POSES: readonly Pose[] = [STILL, swims(0.16), swims(-0.16)];

const CORE_WEAVER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, posed(vesselHull(VESSEL_KNOT[n]!), VESSEL_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = VESSEL_POSES[n]!;
    const knot = VESSEL_KNOT[n]!;
    // The vessel's wall lit down its near side; the knot dark and swollen, with the eye in it.
    for (const s of [-1, 1]) {
      lit(ctx, f, skin, bent([
        [-0.2, 0.4 * s],
        [0.0, 0.4 * s],
        [0.0, 0.84 * s],
        [-0.2, 0.84 * s],
      ], pose, 6));
    }
    // The knot's swollen middle, its shadow shaped to the swelling rather than a disc laid over it.
    plate(ctx, f, skin, posed(Array.from({ length: 24 }, (_, i): Pt => {
      const a = (2 * Math.PI * i) / 24;
      const y = 0.3 * Math.sin(a);
      return [0.04 + (knot - 0.1) * (1 - (y / 0.36) ** 2) * Math.cos(a), y];
    }), pose));
    motif(ctx, f, skin, theme, [
      [0.0, 0.4],
      [0.18, 0.4],
      [0.18, 0.84],
      [0.0, 0.84],
    ], 'vessel', pose);
    const [ex, ey] = pose([0, 0]);
    eye(ctx, f, skin, ex, ey, 0.18, [0, 1, -1][n]!);
  },
};

const BELL_FACE = -0.4;

/** A jelly's bell, cut flat across its mouth: lappets round the dome, and frilled arms out of the mouth. */
function bellHull(): Pt[] {
  const dome = domeOf(BELL_FACE, (a) => 0.9 + 0.08 * Math.abs(Math.cos(4.5 * (a + Math.PI / 2))), 48);
  const faceStart = dome.length - 9;
  const arms: Pt[] = [[BELL_FACE, 0.88]];
  for (const y of [0.56, 0, -0.56]) {
    arms.push([BELL_FACE, y + 0.2], [BELL_FACE - 0.3, y + 0.16], [BELL_FACE - 0.52, y + 0.04], [BELL_FACE - 0.36, y - 0.04], [BELL_FACE - 0.42, y - 0.16], [BELL_FACE, y - 0.2]);
  }
  arms.push([BELL_FACE, -0.88]);
  return [...dome.slice(0, faceStart), ...arms];
}

/** The bell pulses: the dome draws in and the arms are thrust out, then it relaxes wide. */
const bellPulses = (dome: number, arms: number): Pose => ([x, y]) => {
  if (x <= BELL_FACE + 0.001) return [x - arms * ramp(-x, -BELL_FACE, -BELL_FACE + 0.5), y];
  const dx = x - BELL_FACE;
  return [BELL_FACE + dx * dome, y * dome];
};
const BELL_POSES: readonly Pose[] = [STILL, bellPulses(0.88, 0.14), bellPulses(1.04, -0.08)];

const CORE_TURRET: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, posed(bellHull(), BELL_POSES[n]!)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = BELL_POSES[n]!;
    plate(ctx, f, skin, posed([
      [BELL_FACE + 0.05, 0.06],
      [0.4, 0.06],
      [0.3, 0.46],
      [0.04, 0.72],
      [BELL_FACE + 0.05, 0.8],
    ], pose));
    // The radial canals of a jelly's bell, in its cold light: the three its spray comes down.
    for (const a of [-0.62, 0, 0.62]) {
      seam(ctx, f, skin.lit, 0.12, [pose([BELL_FACE + 0.22, 0]), pose(polar(a, 0.74, BELL_FACE, 0))]);
    }
    motif(ctx, f, skin, theme, [
      [-0.1, -0.7],
      [0.2, -0.56],
      [0.3, -0.28],
      [0.0, -0.22],
    ], 'bell', pose);
    const [ex, ey] = pose([BELL_FACE + 0.22, 0]);
    eye(ctx, f, skin, ex, ey, 0.18);
  },
};

/** A stinging cell's harpoon: a barbed point down the lane on a shaft, the capsule it fired from behind. */
function harpoonHull(): Pt[] {
  const upper: Pt[] = [
    [-1, 0],
    [-0.62, -0.24],
    [-0.56, -0.1],
    [-0.1, -0.1],
    [0.08, -0.26],
    [0.16, -0.1],
    [0.42, -0.1],
  ];
  // The capsule: most of a disc behind, from where the shaft meets it above, round the back, to below.
  const capsule: Pt[] = [];
  for (let k = 0; k <= 12; k++) capsule.push(polar(Math.PI + 0.36 + ((2 * Math.PI - 0.72) * k) / 12, 0.28, 0.7, 0));
  return [...upper, ...capsule, ...upper.slice(1).reverse().map(([x, y]): Pt => [x, -y])];
}
const HARPOON_POSES: readonly Pose[] = [STILL, tailFlicks(-0.2, 0.16, 0), tailFlicks(-0.2, -0.16, 0)];

const CORE_CHARGER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(harpoonHull(), HARPOON_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = HARPOON_POSES[n]!;
    // The point and its barbs in the cold light; the capsule dark, with the coil of thread lit in it.
    lit(ctx, f, skin, bent([
      [-0.9, 0],
      [-0.64, -0.16],
      [-0.6, 0.0],
      [-0.64, 0.16],
    ], pose, 1));
    plate(ctx, f, skin, posed(circle(0.21, 0.7, 0, 16), pose));
    motif(ctx, f, skin, theme, circle(0.2, 0.7, 0, 8), 'harpoon', pose);
    const [ex, ey] = pose([0.7, 0]);
    disc(ctx, f, skin.eye, ex, ey, 0.09);
  },
};

/** The valve's bore per frame: its three leaflets meeting nearly shut, then thrown open. */
const VALVE_BORE: readonly number[] = [0.4, 0.3, 0.5];

/** A heart valve: a muscular ring, and three leaflets that close across its bore and open again. */
function valveInner(bore: number): Pt[] {
  const out: Pt[] = [];
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const a = (2 * Math.PI * i) / steps;
    // Each leaflet's free edge bellies into the bore at its middle; the commissures stay out at the rim.
    const cusp = Math.abs(Math.sin(1.5 * (a + Math.PI / 2)));
    out.push(polar(a, bore - 0.16 + 0.34 * (1 - cusp) ** 2));
  }
  return out;
}

function valveOuter(): Pt[] {
  return Array.from({ length: 72 }, (_, i): Pt => {
    const a = (2 * Math.PI * i) / 72;
    return polar(a, 0.92 + 0.06 * Math.cos(7 * a));
  });
}

const CORE_WARDEN: FoeBody = {
  outline: (ctx, f, n) => {
    trace(ctx, f, valveOuter());
    trace(ctx, f, valveInner(VALVE_BORE[n]!));
  },
  paint: (ctx, f, skin, theme, n) => {
    const bore = VALVE_BORE[n]!;
    const gaze = [0, 1, -1][n]!;
    plate(ctx, f, skin, sector(bore + 0.22, 0.84, 0.05, Math.PI - 0.05));
    lit(ctx, f, skin, sector(bore + 0.2, bore + 0.32, Math.PI * 0.62, Math.PI * 1.42, 16));
    motif(ctx, f, skin, theme, sector(bore + 0.34, 0.84, Math.PI * 1.5, Math.PI * 1.95, 10), 'valve');
    eye(ctx, f, skin, -0.7, 0, 0.12, gaze);
    eye(ctx, f, skin, -0.35, -0.61, 0.11, gaze);
    eye(ctx, f, skin, -0.35, 0.61, 0.11, gaze);
  },
};

/** A four-armed medusa: a round bell, and four arms off it, each waved along its length. */
function medusaHull(): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (Math.PI / 2) * k;
    out.push(polar(a - Math.PI / 4, 0.5));
    // Out along one edge of the arm and back along the other, the arm narrowing to its tip.
    const side = (s: 1 | -1): Pt[] =>
      [0.46, 0.62, 0.78, 0.92].map((rad, i): Pt => {
        const half = 0.2 - i * 0.035;
        const wave = 0.06 * Math.sin(i * 1.9);
        return [rad, s * half + wave];
      });
    for (const p of side(-1)) out.push(turned(a)(p));
    out.push(turned(a)([1, 0.06 * Math.sin(4 * 1.9)]));
    for (const p of side(1).reverse()) out.push(turned(a)(p));
  }
  return out;
}
const MEDUSA4_POSES: readonly Pose[] = [STILL, wheelTrails(0.28), wheelTrails(-0.26)];

const CORE_SPINNER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(medusaHull(), MEDUSA4_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = MEDUSA4_POSES[n]!;
    for (let k = 0; k < 4; k++) {
      const a = (Math.PI / 2) * k;
      const core: readonly Pt[] = [[0.5, -0.07], [0.82, -0.04], [0.82, 0.06], [0.5, 0.09]];
      (k % 2 === 0 ? lit : plate)(ctx, f, skin, bent(core.map(turned(a)), pose, 2));
    }
    disc(ctx, f, skin.plate, 0, 0, 0.42);
    // The four rings a moon jelly is known by, in its cold light, round the eye.
    for (let k = 0; k < 4; k++) {
      const [x, y] = polar((Math.PI / 2) * k + Math.PI / 4, 0.26);
      disc(ctx, f, skin.lit, x, y, 0.1);
    }
    motif(ctx, f, skin, theme, circle(0.36, 0, 0, 10), 'medusa');
    eye(ctx, f, skin, 0, 0, 0.17);
  },
};

/** An artery forking: a bulb of a head, two vessels swept back from it, each ending in a swelling. */
const FORK_HEAD: Pt = [-0.62, 0];
const FORK_END: Pt = [0.64, -0.7];
const FORK_HALF = 0.17;

/** The upper vessel's axis and its outward normal, as unit vectors. */
function forkAxis(): { u: Pt; out: Pt } {
  const dx = FORK_END[0] - FORK_HEAD[0];
  const dy = FORK_END[1] - FORK_HEAD[1];
  const len = Math.hypot(dx, dy);
  const u: Pt = [dx / len, dy / len];
  return { u, out: [u[1], -u[0]] };
}

function forkHull(): Pt[] {
  const { out } = forkAxis();
  const [hx, hy] = FORK_HEAD;
  const [ex, ey] = FORK_END;
  const outAngle = Math.atan2(out[1], out[0]);
  const upper: Pt[] = [];
  // The head bulb's front, from the axis round to where the upper vessel's outer wall leaves it.
  for (let k = 0; k <= 6; k++) upper.push(polar(Math.PI + ((outAngle + 2 * Math.PI - Math.PI) * k) / 6, 0.3, hx, hy));
  // The swelling at the vessel's end, round its far side from the outer wall to the inner.
  for (let k = 0; k <= 8; k++) upper.push(polar(outAngle + (Math.PI * k) / 8, 0.26, ex, ey));
  // The inner wall, back to the crotch.
  upper.push([ex - out[0] * FORK_HALF, ey - out[1] * FORK_HALF]);
  return [...upper, [-0.26, 0], ...upper.slice(1).reverse().map(([x, y]): Pt => [x, -y])];
}
const FORK_POSES: readonly Pose[] = [STILL, aftWings(0.8, 0.08), aftWings(1.06, -0.05)];

const CORE_SOWER: FoeBody = {
  outline: (ctx, f, n) => trace(ctx, f, bent(forkHull(), FORK_POSES[n]!, 2)),
  paint: (ctx, f, skin, theme, n) => {
    const pose = FORK_POSES[n]!;
    const { u, out } = forkAxis();
    const along = (t: number, off: number): Pt => [FORK_HEAD[0] + u[0] * t + out[0] * off, FORK_HEAD[1] + u[1] * t + out[1] * off];
    const reach = Math.hypot(FORK_END[0] - FORK_HEAD[0], FORK_END[1] - FORK_HEAD[1]);
    for (const s of [-1, 1]) {
      const side = ([x, y]: Pt): Pt => [x, s === -1 ? y : -y];
      // Each vessel's outer wall lit; each swelling dark, with a cold light at its heart — the lance it fires.
      lit(ctx, f, skin, bent([along(0.38, 0.05), along(reach - 0.28, 0.05), along(reach - 0.28, 0.18), along(0.38, 0.19)].map(side), pose, 3));
      plate(ctx, f, skin, posed(circle(0.18, FORK_END[0] + out[0] * 0.03, FORK_END[1] + out[1] * 0.03, 14).map(side), pose));
      disc(ctx, f, skin.lit, ...pose(side([FORK_END[0], FORK_END[1] + 0.04])), 0.08);
      plate(ctx, f, skin, bent([along(0.4, -0.02), along(reach - 0.3, -0.02), along(reach - 0.3, -0.12), along(0.5, -0.12)].map(side), pose, 3));
    }
    motif(ctx, f, skin, theme, circle(0.22, FORK_HEAD[0], 0, 8), 'fork', pose);
    const [ex, ey] = pose([FORK_HEAD[0] - 0.04, 0]);
    eye(ctx, f, skin, ex, ey, 0.17);
  },
};

// ══ THE TABLE ══════════════════════════════════════════════════════════════════════════════════════

/** A place's eight. A `Record` over the closed union, so a place cannot leave a kind undrawn. */
type Roster = Record<SharedKind, FoeBody>;

const EMBER: Roster = {
  drifter: EMBER_DRIFTER,
  lancer: EMBER_LANCER,
  weaver: EMBER_WEAVER,
  turret: EMBER_TURRET,
  charger: EMBER_CHARGER,
  warden: EMBER_WARDEN,
  spinner: EMBER_SPINNER,
  sower: EMBER_SOWER,
};

const SAURIAN: Roster = {
  drifter: SAURIAN_DRIFTER,
  lancer: SAURIAN_LANCER,
  weaver: SAURIAN_WEAVER,
  turret: SAURIAN_TURRET,
  charger: SAURIAN_CHARGER,
  warden: SAURIAN_WARDEN,
  spinner: SAURIAN_SPINNER,
  sower: SAURIAN_SOWER,
};

const MIRE: Roster = {
  drifter: MIRE_DRIFTER,
  lancer: MIRE_LANCER,
  weaver: MIRE_WEAVER,
  turret: MIRE_TURRET,
  charger: MIRE_CHARGER,
  warden: MIRE_WARDEN,
  spinner: MIRE_SPINNER,
  sower: MIRE_SOWER,
};

const LABYRINTH: Roster = {
  drifter: LABYRINTH_DRIFTER,
  lancer: LABYRINTH_LANCER,
  weaver: LABYRINTH_WEAVER,
  turret: LABYRINTH_TURRET,
  charger: LABYRINTH_CHARGER,
  warden: LABYRINTH_WARDEN,
  spinner: LABYRINTH_SPINNER,
  sower: LABYRINTH_SOWER,
};

const RIME: Roster = {
  drifter: RIME_DRIFTER,
  lancer: RIME_LANCER,
  weaver: RIME_WEAVER,
  turret: RIME_TURRET,
  charger: RIME_CHARGER,
  warden: RIME_WARDEN,
  spinner: RIME_SPINNER,
  sower: RIME_SOWER,
};

const CORE: Roster = {
  drifter: CORE_DRIFTER,
  lancer: CORE_LANCER,
  weaver: CORE_WEAVER,
  turret: CORE_TURRET,
  charger: CORE_CHARGER,
  warden: CORE_WARDEN,
  spinner: CORE_SPINNER,
  sower: CORE_SOWER,
};

let built: Record<ThemeKind, Roster> | null = null;

/**
 * Every place's roster. Built on first use, because The Approach's is `bake.ts`'s own and does not
 * exist yet while this module is being evaluated — see the head of the file.
 */
function build(): Record<ThemeKind, Roster> {
  const a = APPROACH_BODIES;
  return {
    approach: a,
    nebula: EMBER,
    saurian: SAURIAN,
    labyrinth: LABYRINTH,
    rime: RIME,
    mire: MIRE,
    core: CORE,
  };
}

/** A shared kind's body in a place. */
export function bodyOf(kind: SharedKind, theme: ThemeKind): FoeBody {
  built ??= build();
  return built[theme][kind];
}
