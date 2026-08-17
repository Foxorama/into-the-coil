/**
 * What is sounding, at every point of a level — the arithmetic, with no browser in it.
 *
 * `docs/decisions/0126-the-dashboard-is-the-instrument.md`.
 *
 * ── WHY THIS IS A MODULE AND NOT LINES INSIDE `rig/dash.ts` ─────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0116-the-rig-plays-the-level.md` settled this once already and the reason has
 * not changed.** The first guards written for the rig asserted that a WORD appeared in its source,
 * and `npm run prove` reported STILL GREEN on two of three, because deleting a call site leaves the
 * import behind. What an instrument has to be held to is that its answers equal the game's — a claim
 * about VALUES — so the values have to be reachable from a test. `rig/dash.ts` needs an
 * `AudioContext` and a DOM; nothing in here needs either.
 *
 * ⚠️ **EVERY QUANTITY IS IMPORTED AND NONE IS RESTATED**, which is 0116's rule and the reason it
 * exists: that rig drifted twice, and both times a verdict about the music was taken from a wrong
 * instrument. `scripts/timeline.mjs` already owns the level walk, so this asks it rather than
 * walking a second camera of its own.
 *
 * ── AND `sections` IS THREADED THROUGH EVERY ANSWER RATHER THAN READ FROM A MODULE ──────────────
 *
 * ⚠️ **`docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md`, as
 * `docs/decisions/0158-a-level-says-where-its-sections-open.md` leaves it.** Every function below
 * that has an opinion about where a section begins takes the level's SCRIPT as an argument. The
 * dashboard hands it whatever the strip has been dragged to; a caller that passes nothing gets
 * `LEVELS[kind].sections`, which is what almost all of `tests/dash.test.ts` wants to know.
 *
 * ⚠️ **THE DEFAULT IS THE LEVEL'S OWN AND NOT A SHARED SET, WHICH IS THE CHANGE.** It used to be
 * `SECTION_UNITS` — one answer for all seven levels — so a default could be written without knowing
 * which level was being asked about. Now it reads off `kind`, the parameter beside it.
 *
 * ⚠️ **IT IS STILL THE GAME'S ARITHMETIC AND NOT THE RIG'S** — `musicLevelFor` does the comparing,
 * here as everywhere. What is driveable is the SCRIPT it walks, and there is no branch in this file
 * that decides a rung.
 */

import {
  AURA_LAYERS,
  BAR_SECONDS,
  LAYER_BARS,
  LAYER_PAN,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  type MusicLayer,
  type MusicLevel,
  type LevelSections,
} from '../src/content/music.ts';
import { LEVELS, type LevelKind } from '../src/content/levels.ts';
import { VOLLEY_CYCLE } from '../src/content/cadence.ts';
import { THEME_KINDS, mixOf, rungOf, type ThemeKind } from '../src/content/themes.ts';
import { SHIPS } from '../src/content/ships.ts';
import { UPGRADE_TIERS, weaponFor, type UpgradeKind, type Weapon } from '../src/content/pickups.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import type { CueKind } from '../src/content/cues.ts';

/*
  ⚠️ **THE TYPES ARE DECLARED HERE AND THE VALUES ARE NOT.** `scripts/timeline.mjs` is plain ESM so
  that `.mjs` scripts can import it without a build step (`tsconfig.json` says why `checkJs` is off),
  which means TypeScript infers `any` for its parameters and cannot see the fields `rungMarks`
  assigns after the object is built. Naming the SHAPE here is a restatement of a type; naming a
  number here would be a restatement of a quantity, and 0116 is about the second one.
*/
import * as timeline from '../scripts/timeline.mjs';

/** Where a second lands in the music's own grid. */
export interface InBars {
  bars: number;
  beat: number;
  onBar: boolean;
}

/** One rung boundary: where the camera crosses it, and where the music actually moves. */
export interface RungMark {
  rung: MusicLevel;
  second: number;
  lasts: number;
  bars: number;
  beat: number;
  onBar: boolean;
  movesAt: number;
  moves: InBars;
}

const rungMarks = timeline.rungMarks as (
  kind: string,
  fightSeconds: number,
  sections?: LevelSections,
  step?: number,
) => RungMark[];
const rungAt = timeline.rungAt as (kind: string, second: number, fightSeconds: number, sections?: LevelSections) => MusicLevel;
const auraAt = timeline.auraAt as (kind: string, second: number, nearnessInFight: number) => number;
const inBars = timeline.inBars as (second: number) => InBars;
const targetGain = timeline.targetGain as (theme: ThemeKind, rung: MusicLevel, layer: MusicLayer, aura: number) => number;

/** World units a second, derived by `scripts/timeline.mjs` from the two constants that decide it. */
export const UNITS_PER_SECOND = timeline.UNITS_PER_SECOND as number;

/**
 * Every rung boundary in a level: where the camera crosses it, and where the music moves.
 *
 * ⚠️ **TWO INSTANTS AND NOT ONE, WHICH IS THE WHOLE OF 0117.** `second` is where a camera crossed a
 * distance and is mid-bar twenty-seven times out of twenty-eight; `movesAt` is the downbeat the ramp
 * actually starts on. A dashboard that drew only the first would be showing the defect after it was
 * fixed, which is the mistake `scripts/timeline.mjs` records itself avoiding.
 */
export function marksOf(kind: LevelKind, fightSeconds: number, sections: LevelSections = LEVELS[kind].sections): RungMark[] {
  return rungMarks(kind, fightSeconds, sections);
}

/**
 * What a layer is doing at this instant, relative to the rung before it.
 *
 * ⚠️ **`tracking` IS THE AURA AND IT IS NOT ONE OF THE OTHERS.** `auraSlow` and `auraFast` are
 * driven by a distance rather than by a section — 0091 — and 0117 leaves them unquantised for
 * exactly that reason: a dread that waited for the downbeat would report where the player was
 * rather than where they are. **The first draft of this file called them `opening` at the first
 * rung boundary after the level's build began**, which is a true sentence about a gain and a false
 * one about the music: nothing arrived, something that had been creeping up for thirty-five seconds
 * crossed a threshold. `tests/dash.test.ts` is what caught it.
 */
export type LayerMove = 'silent' | 'opening' | 'closing' | 'louder' | 'quieter' | 'holding' | 'tracking';

/** One layer, at one moment. */
export interface LayerNow {
  layer: MusicLayer;
  /** What the mixer is heading for — the ladder's rung, the theme's multiplier, the aura's ceiling. */
  target: number;
  /** What it was heading for on the rung before this one. */
  previous: number;
  move: LayerMove;
  /** How long this layer's own loop is, in seconds. */
  loopSeconds: number;
  pan: number;
  aura: boolean;
}

/** Everything true of one instant of one level. */
export interface Moment {
  second: number;
  /** Where the camera is, in world units. */
  camera: number;
  rung: MusicLevel;
  /** The rung before this one, or `null` at the start of the level. */
  previousRung: MusicLevel | null;
  theme: ThemeKind;
  /** The aura's multiplier: the level's own build, or how near the boss is, whichever is further on. */
  aura: number;
  bars: number;
  beat: number;
  onBar: boolean;
  /** Seconds until the next rung is reached, or `null` at the last one. */
  nextIn: number | null;
  nextRung: MusicLevel | null;
  layers: LayerNow[];
  /** How many of the twenty-three are above zero right now. */
  sounding: number;
}

/**
 * How the two targets compare, in the words the dashboard prints.
 *
 * ⚠️ **`opening` and `louder` are DIFFERENT ANSWERS and the difference is the whole subject of
 * `docs/decisions/0125-the-build-starts-sooner.md`.** An arrival is what a listener hears; a layer
 * that was already playing and got 4% louder is not one, and a readout that called both *louder*
 * would hide exactly the distinction six rounds of *"push and surge sound the same"* turned on.
 */
export function moveOf(previous: number, target: number): LayerMove {
  if (target <= 0) return previous > 0 ? 'closing' : 'silent';
  if (previous <= 0) return 'opening';
  if (target > previous) return 'louder';
  if (target < previous) return 'quieter';
  return 'holding';
}

/** Which mark a second falls inside, as an index into `marks`. */
function markAt(marks: readonly RungMark[], second: number): number {
  let at = 0;
  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    if (mark !== undefined && mark.second <= second) at = i;
  }
  return at;
}

/**
 * Everything true of `second` seconds into `kind` — the answer to *what should I be hearing*.
 *
 * ⚠️ **`gapUnits` is the boss's distance during the fight and it is a STATED CHOICE**, exactly as
 * `scripts/hear.mjs --level` states it: the aura's nearness is a distance the player steers (0091),
 * so no rig has an honest value for it. The dashboard puts it on a slider instead of pretending.
 */
/**
 * A solved arrangement's gains, per rung — what
 * `docs/decisions/0154-the-mix-is-authored-as-intent.md` produces.
 *
 * ⚠️ **THE SOLVE NEEDS BAKED AUDIO AND THIS FILE HAS NONE.** `rig/transport.ts` is the arithmetic of
 * *what is sounding when*, guarded by `tests/dash.test.ts` and deliberately free of DSP — so the
 * caller that owns the loops owns the solve, and this only ever chooses between two numbers.
 */
export type SolvedGains = Readonly<Partial<Record<MusicLevel, Readonly<Record<MusicLayer, number>>>>>;

/**
 * The loudest gain the game itself ever takes a layer to, over every place and every rung.
 *
 * ⚠️ **IT LIVES HERE RATHER THAN IN `rig/dash.ts` SO A GUARD CAN READ IT.** `dash.ts` needs a DOM and
 * cannot be imported by a test; this file is the rig's arithmetic and `tests/dash.test.ts` already
 * imports it. A constant a guard cannot reach is a constant that drifts — which is exactly what
 * happened to the desk's ceiling.
 */
export const LOUDEST_SHIPPED = MUSIC_LEVELS.reduce(
  (most, rung) =>
    THEME_KINDS.reduce(
      (m, theme) => MUSIC_LAYERS.reduce((n, layer) => Math.max(n, rungOf(theme, rung, layer) * mixOf(theme, layer)), m),
      most,
    ),
  0,
);

/**
 * The most a layer may be pushed to on the desk — **derived, because the typed number was below the
 * game's own gains and turned layers DOWN.**
 *
 * ── A FADER THAT CANNOT REACH WHAT THE MIXER ALREADY PLAYS ──────────────────────────────────────
 *
 * ⚠️ **Reported 2026-08-16, of Ember Nebula:** *"Listening with both arp sliders maxed, I can still
 * barely hear it."* `arp` ships at **1.66** at `push` in that place and the ceiling was a typed
 * **1.50** — so dragging the fader to its top **cut the layer by 0.9 dB** while the reader expected a
 * boost, and the conclusion drawn from it was about the music.
 *
 * ⚠️ **IT WAS NOT ONE LAYER: 125 layer-rungs shipped above 1.50**, the loudest 1.73× the fader's top.
 * The old comment claimed it sat *"above the ladder's own top, on purpose"* — true of `MUSIC_LADDER`
 * alone, and false from the moment `docs/decisions/0147-a-place-is-a-balance.md` gave every place a
 * multiplier. **Right when written, silently wrong afterwards, and guarded by nothing.**
 *
 * ⚠️ **TWICE THE LOUDEST, because a desk has to be able to ask *what if this were twice as loud*.**
 * That is the only question it is for, and a fader that cannot express what the game already does
 * cannot ask it.
 */
export const DESK_CEILING = 2 * LOUDEST_SHIPPED;

export function momentOf(
  kind: LevelKind,
  second: number,
  fightSeconds: number,
  nearnessInFight: number,
  sections: LevelSections = LEVELS[kind].sections,
  /*
    ⚠️ **A MIX HAS TO BE DRIVEN RATHER THAN DESCRIBED, WHICH IS WHAT THIS DASHBOARD IS FOR** —
    `docs/decisions/0126-the-dashboard-is-the-instrument.md`. 0154 solved a mix that could only be
    heard by rendering a file and opening it somewhere else, which is exactly the kind of instrument
    this project keeps having to replace. `null` is the shipped mix and is the default, so every
    existing caller is unchanged.

    ⚠️ **THE AURA IS NEVER TAKEN FROM IT** — its gain is a distance the player steers (0091, 0107),
    and the solve deliberately does not own it.
  */
  solved: SolvedGains | null = null,
): Moment {
  const level = LEVELS[kind];
  const theme = level.theme;
  const marks = rungMarks(kind, fightSeconds, sections);
  const here = markAt(marks, second);
  const before = here > 0 ? marks[here - 1] : undefined;
  const next = marks[here + 1];

  const rung = rungAt(kind, second, fightSeconds, sections);
  const aura = auraAt(kind, second, nearnessInFight);
  /*
    ⚠️ **The previous rung's targets are taken at the instant that rung STARTED, aura and all.** The
    aura is a continuous quantity, so asking for it at the previous rung's start is the only reading
    that makes `opening` mean *this arrived when the section changed* rather than *this has been
    creeping up for forty seconds*.
  */
  const auraBefore = before === undefined ? 0 : auraAt(kind, before.second, nearnessInFight);

  const toBoss = level.bossAt / UNITS_PER_SECOND;
  const camera = second >= toBoss ? level.bossAt : second * UNITS_PER_SECOND;

  const layers: LayerNow[] = [];
  let sounding = 0;
  for (const layer of MUSIC_LAYERS) {
    const follows = AURA_LAYERS.includes(layer);
    /*
      ⚠️ **THE SOLVED GAIN REPLACES THE SHIPPED ONE FOR EVERYTHING BUT THE AURA**, and the PREVIOUS
      rung is resolved the same way — a moment that took its target from the solve and its previous
      from the ladder would report every layer as *opening* or *quieter* for reasons that are an
      artefact of the comparison rather than of the music.
    */
    const gainAt = (r: MusicLevel, a: number): number => {
      const own = follows || solved === null ? undefined : solved[r]?.[layer];
      return own ?? targetGain(theme, r, layer, a);
    };
    const target = gainAt(rung, aura);
    const previous = before === undefined ? 0 : gainAt(before.rung, auraBefore);
    if (target > 0) sounding++;
    layers.push({
      layer,
      target,
      previous,
      move: follows ? (target > 0 ? 'tracking' : 'silent') : moveOf(previous, target),
      loopSeconds: LAYER_BARS[layer] * BAR_SECONDS,
      pan: LAYER_PAN[layer],
      aura: follows,
    });
  }

  return {
    second,
    camera,
    rung,
    previousRung: before?.rung ?? null,
    theme,
    aura,
    ...inBars(second),
    nextIn: next === undefined ? null : next.second - second,
    nextRung: next?.rung ?? null,
    layers,
    sounding,
  };
}

/**
 * How long each layer is open in one level, against how long its OWN loop is.
 *
 * ── THE MEASUREMENT THE PLAYER ASKED FOR, IN THE PLAYER'S OWN UNITS ─────────────────────────────
 *
 * ⚠️ **`docs/decisions/0027-measure-the-picture-not-the-model.md` wants at least one assertion in
 * units the player experiences, and *how many times did that tune come round* is one.** A layer open
 * for less than its own loop length has never stated itself: the listener hears a fragment of a
 * phrase and the section is over. Nothing in this repository measured it before, and it is a
 * different quantity from every gain, distance and note count the music has been tuned by.
 *
 * ⚠️ **The LONGEST unbroken span is what counts, not the total.** Two separated halves of a phrase
 * are not a phrase — `call` is open across `run` and `push` and closed at `surge`, and what a
 * listener can hold is the run of it, not the sum.
 */
export interface LayerSpan {
  layer: MusicLayer;
  loopSeconds: number;
  /** Every stretch the layer is above zero, as `[from, to]` in seconds. */
  spans: [number, number][];
  /** Seconds open in total. */
  openFor: number;
  /** The longest unbroken stretch, in seconds. */
  longest: number;
  /** `longest` divided by the layer's own loop length — how many times it comes round. */
  passes: number;
}

export function layerSpans(kind: LevelKind, fightSeconds: number, sections: LevelSections = LEVELS[kind].sections): LayerSpan[] {
  const marks = rungMarks(kind, fightSeconds, sections);
  const last = marks[marks.length - 1];
  const end = last === undefined ? 0 : last.second + last.lasts;
  const out: LayerSpan[] = [];
  for (const layer of MUSIC_LAYERS) {
    const spans: [number, number][] = [];
    let open: number | null = null;
    for (const mark of marks) {
      /*
        ⚠️ **The LADDER decides, not the balance and not the aura.** A theme multiplier scales a layer
        and cannot silence one (`MIX_FLOOR` in `src/content/themes.ts`), and the aura's ceiling is a
        distance the player steers rather than a property of the level — so *is this layer in this
        section at all* is a question about the rung.

        ⚠️ **AND THE RUNG IS THE PLACE'S OWN NOW** — `docs/decisions/0162-a-place-has-its-own-ladder.md`.
        `MUSIC_LADDER[rung][layer]` was the whole answer while every place shared one shape; a place
        may open a layer its neighbour closes, so a coverage table read off the shared row would
        describe a level nobody plays. **This is the measurement a drag is FOR** (0126), so it being
        about the wrong level is the one thing it cannot afford.
      */
      const on = rungOf(LEVELS[kind].theme, mark.rung, layer) > 0;
      if (on && open === null) open = mark.second;
      if (!on && open !== null) {
        spans.push([open, mark.second]);
        open = null;
      }
    }
    if (open !== null) spans.push([open, end]);
    const openFor = spans.reduce((a, [from, to]) => a + (to - from), 0);
    const longest = spans.reduce((a, [from, to]) => Math.max(a, to - from), 0);
    const loopSeconds = LAYER_BARS[layer] * BAR_SECONDS;
    out.push({ layer, loopSeconds, spans, openFor, longest, passes: longest / loopSeconds });
  }
  return out;
}

// ── WHAT THE DESK IS HOLDING, AND WHETHER IT CAN BE HEARD ON ITS OWN ────────────────────────────

/**
 * A layer the dashboard has taken off the mixer: whether it sounds at all, and where it sits.
 *
 * ⚠️ **`null` FOLLOWS THE MIXER AND A NUMBER IS ABSOLUTE** —
 * `docs/decisions/0129-the-desk-holds-a-value-not-a-multiplier.md`. A trim could not reach the
 * fourteen layers any given rung has closed, because `trim × 0` is 0, and those are exactly the ones
 * worth auditioning.
 */
export interface Held {
  /** The gain this layer is pinned at, or `null` to follow the mixer. */
  gain: number | null;
  /** The pan this layer is pinned at, or `null` to keep the place `LAYER_PAN` gave it. */
  pan: number | null;
}

/**
 * Whether the desk is the ONLY thing that would sound: every layer held, at least one above zero.
 *
 * ── THE CONDITION FOR PUTTING THE LOOPS BACK ON THE AIR WITH THE LEVEL STOPPED ──────────────────
 *
 * ⚠️ **`docs/decisions/0137-the-desk-sounds-while-the-level-stands-still.md`.** Reported: *"I need to
 * be able to pause the music and then play a particular sound… play sounds without affecting the
 * current run of the melody itself."*
 *
 * ⚠️ **IT IS NOT *SOMETHING IS HELD ABOVE ZERO*, AND THAT IS THE WHOLE OF THE ARGUMENT.** A layer
 * with no hold FOLLOWS the mixer, so a transport put back on the air for one dragged fader would
 * start the entire piece playing — the exact thing the report asked for the opposite of. An audition
 * holds all twenty-three (0130), so the reported gesture satisfies this in one click; `silence
 * everything` then a fader is the two-click route to the same state.
 *
 * ⚠️ **DERIVED FROM THE DESK RATHER THAN REMEMBERED**, on `aloneOn`'s own terms: a remembered *I am
 * listening* flag goes stale the instant a fader is dragged, and the page would then be making a
 * sound it had stopped describing.
 */
export function deskAlone(held: ReadonlyMap<MusicLayer, Held>): boolean {
  let audible = false;
  for (const layer of MUSIC_LAYERS) {
    const gain = held.get(layer)?.gain ?? null;
    if (gain === null) return false;
    if (gain > 0) audible = true;
  }
  return audible;
}

// ── DRAGGING A SECTION BOUNDARY ─────────────────────────────────────────────────────────────────

/*
  ⚠️ **`docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md`.** Reported: *"I'd love
  it if we could make the run section that has the push, surge, approach sections slideable so that I
  can drag them to start sooner or end sooner and see what effect that has… it sure would be good for
  helping with the timing of when to start/end the different sections."*

  ⚠️ **THE ARITHMETIC IS HERE AND THE POINTER IS NOT**, on 0126's own terms: `rig/dash.ts` needs a
  DOM and this needs nothing, so what a drag RESOLVES TO is reachable from `tests/dash.test.ts` while
  the drag itself is driven.
*/

/*
  ⚠️ **`SECTION_ORDER` IS GONE, AND SO IS THE BUG IT CAUSED** — 0158. It listed the three boundaries
  from the boss OUTWARDS, because that was the order the old clamp had to reason in: each distance
  was bounded by the one nearer the boss. `rig/dash.ts` then had to reverse it to draw a strip that
  reads left to right, and 0138 records the readout listing the three backwards until it was driven
  in a browser — *"obvious in the browser, invisible in the module."* A script is already in the
  order the strip draws it, so there is no second order to keep, and nothing left to reverse.
*/

/**
 * The shortest a section may be dragged, in world units: one bar of scroll.
 *
 * ⚠️ **A BAR, BECAUSE THAT IS WHAT A SECTION CHANGE IS QUANTISED TO** —
 * `docs/decisions/0117-a-section-change-lands-on-the-beat.md` starts the ramp on the next bar line
 * after the camera crosses. A section narrower than one bar can therefore be crossed and left again
 * before its own ramp has begun: the rung would turn over twice with nothing heard between, and the
 * strip would be showing a section that does not exist in the speakers. It is stated in the player's
 * units and derived from the two constants that decide it, never typed —
 * `docs/decisions/0027-measure-the-picture-not-the-model.md`.
 */
export const SECTION_FLOOR_UNITS = BAR_SECONDS * UNITS_PER_SECOND;

/**
 * Where entry `index` of a script lands when it is dragged to `units` into the level.
 *
 * ⚠️ **CLAMPED AGAINST ITS NEIGHBOURS RATHER THAN AGAINST A RANGE**, because a script is an ordering
 * and not a set of independent numbers: an entry dragged past the next one does not make a long
 * section, it makes one that never happens and a strip that has stopped describing the ladder.
 * `musicLevelFor` walks in order and breaks at the first entry the camera has not reached, so an
 * out-of-order script silently HIDES a section.
 *
 * ⚠️ **ENTRY `0` DOES NOT MOVE.** A level's music starts where the level starts; a first entry at
 * anything but `0` would leave the opening stretch with no section at all, and `musicLevelFor`'s
 * fallback would answer for it — which is the one thing 0158 took out of that function.
 *
 * ⚠️ **`bossAt` IS THE OUTER BOUND AND IT IS THE LEVEL'S.** The last section runs until the boss
 * arrives, and where that is is level design rather than a music number — 0138 refused a handle on
 * it and 0158 keeps it out of the script for the same reason.
 */
export function dragSection(
  sections: LevelSections,
  index: number,
  units: number,
  bossAt: number,
): LevelSections {
  if (index <= 0 || index >= sections.length) return sections;
  const floor = SECTION_FLOOR_UNITS;
  const low = sections[index - 1]!.at + floor;
  const high = (index + 1 < sections.length ? sections[index + 1]!.at : bossAt) - floor;
  /*
    ⚠️ **A SCRIPT CAN BE PACKED TIGHTER THAN THE FLOOR ALLOWS, AND THEN `low` EXCEEDS `high`.** Seven
    sections into a level that has room for five is a thing the panel can reach, and a clamp whose
    bounds have crossed must not send the handle to the far side of its neighbour. Taking `low` in
    that case pins the entry where it is being pushed FROM, which leaves the script ordered.
  */
  const landed = units < low ? low : units > high ? high : units;
  const at = high < low ? low : landed;
  return sections.map((entry, i) => (i === index ? { at, section: entry.section } : entry));
}

/**
 * The loudest this place ever takes a layer, over every rung of the ladder.
 *
 * ── WHAT A ONE-CLICK AUDITION HAS TO PUT IN THE FADER ───────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0130-a-layer-can-be-heard-on-its-own.md`.** Reported: *"the music dashboard
 * needs to let me play music components as well as every sound in the game, so I can hear them
 * individually without needing to have the main theme playing."* The desk could already do it in
 * three gestures — solo, then drag the fader up, because a soloed layer sits at whatever the LADDER
 * says and fourteen of the twenty-three are closed at any given rung (0129) — and *three gestures*
 * is the whole difference between a panel you use and one you read.
 *
 * ⚠️ **THE LOUDEST RATHER THAN THE CURRENT ONE, AND THAT IS THE QUESTION BEING ASKED.** *What does
 * this layer sound like* is a question about the material; *what is it doing right now* is what the
 * live column beside it already answers. Auditioning at the rung's own value would give silence for
 * every layer the rung has closed, which is exactly the state 0129 exists to reach past.
 *
 * ⚠️ **The aura's ceiling is taken at a boss at arm's length**, which is the only honest reading of
 * *loudest* for a pair of layers whose gain is a distance the player steers (0091).
 *
 * ⚠️ **It is a value from the game's own tables and not a listening level chosen here** — the rung,
 * the place's multiplier and the aura's ceiling, exactly as `targetGain` composes them. A flat 0.8
 * would have been simpler and would make every layer sound equally important, which is a lie about
 * a mix.
 */
export function loudestGain(theme: ThemeKind, layer: MusicLayer): number {
  let most = 0;
  for (const rung of MUSIC_LEVELS) {
    const at = targetGain(theme, rung, layer, 1);
    if (at > most) most = at;
  }
  return most;
}

/**
 * The ship at upgrade tier `tier`, on both ladders.
 *
 * ⚠️ **One description, shared with `scripts/hear.mjs --play`**, which built this list inline. Two
 * copies of *what is a tier-two ship* is how the dashboard and the WAV rig end up disagreeing about
 * the cadence they are both supposed to be showing —
 * `docs/decisions/0029-the-tracked-record-is-the-record.md`.
 */
export function weaponAtTier(tier: number): Weapon {
  const carried: UpgradeKind[] = [];
  const clamped = tier < 0 ? 0 : tier > UPGRADE_TIERS ? UPGRADE_TIERS : Math.floor(tier);
  for (let i = 0; i < clamped; i++) carried.push('weapon', 'missile');
  return weaponFor(SHIPS.proof, carried);
}

/** One thing the player will hear over the bed, and how often. */
export interface CueLine {
  kind: CueKind;
  /** Sim steps between soundings for anything on the grid, or `null` for something nothing quantises. */
  every: number | null;
  /** How many times a second it is expected to sound. */
  perSecond: number;
  /** Whether it sounds at all in the rung this was asked about. */
  sounds: boolean;
}

/**
 * What is firing over the bed at one moment, at the cadences the game itself uses.
 *
 * ⚠️ **THE GUN IS ON A GRID AND THE EXPLOSIONS ARE NOT, WHICH IS THE POINT** —
 * `docs/decisions/0094-in-time-is-not-in-phase.md`. `fireEvery` and `missileEvery` are absolute
 * multiples of the sim step; a kill lands on the step a collision resolves, and nothing snaps it. A
 * dashboard that quantised the kills would be showing a tidier game than the one being judged.
 *
 * ⚠️ **`bossShot` sounds only in the fight and IS quantised** (0096), which is why it is the one
 * scattered-looking cue with a cadence.
 *
 * @param bodiesPerSecond how fast things are dying — the quantity
 *        [`the-eleventh-play-test`](../reports/the-eleventh-play-test-2026-08-11.md) named as the
 *        counterpoint, and the one number here a hand has to choose.
 */
export function cueLines(tier: number, rung: MusicLevel, bodiesPerSecond: number): CueLine[] {
  const weapon = weaponAtTier(tier);
  const inFight = rung === 'boss' || rung === 'bossPeak';
  const per = (every: number): number => STEPS_PER_SECOND / every;
  return [
    { kind: 'pulse', every: weapon.fireEvery, perSecond: per(weapon.fireEvery), sounds: true },
    {
      kind: 'missile',
      every: weapon.launchers > 0 ? weapon.missileEvery : null,
      perSecond: weapon.launchers > 0 ? per(weapon.missileEvery) : 0,
      sounds: weapon.launchers > 0,
    },
    { kind: 'kill', every: null, perSecond: bodiesPerSecond, sounds: bodiesPerSecond > 0 },
    { kind: 'hit', every: null, perSecond: bodiesPerSecond, sounds: bodiesPerSecond > 0 },
    { kind: 'threat', every: null, perSecond: bodiesPerSecond, sounds: bodiesPerSecond > 0 },
    {
      kind: 'bossShot',
      every: inFight ? VOLLEY_CYCLE * 3 : null,
      perSecond: inFight ? per(VOLLEY_CYCLE * 3) : 0,
      sounds: inFight,
    },
  ];
}
