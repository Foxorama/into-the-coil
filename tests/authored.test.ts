/**
 * THE ADVISORY CLAIMS, MEASURED — and the mechanism that keeps them from failing anything.
 *
 * `docs/decisions/0192-a-guard-holds-an-invariant.md`.
 *
 * ⚠️ **EVERY CLAIM IN HERE ARRIVED AS A HARD GUARD AND WAS DEMOTED**, each with the correct change
 * that would have reddened it written beside it in `tests/authored.ts`. Two of the four had already
 * bent the work: `0167-duck` refused the eurobeat breakdown twice
 * (`docs/decisions/0185-the-belt-gets-its-bottom.md`,
 * `docs/decisions/0189-a-place-is-what-it-does-not-play.md`), and the *places must differ* family is
 * what `docs/decisions/0191-a-place-sits-somewhere.md` records as having cost a level.
 *
 * ⚠️ **AND `0148-notes` IS MEASURED HERE AS THE CLAIM IT ALWAYS WANTED TO BE.** The hard version had
 * to be written over the two places that opted in, because *"a bound the design fails is not a
 * bound"* — its own comment said so. An advisory has no such problem: it states the whole claim,
 * reports the six places that still share the default, and blocks nothing. **That is the mechanism
 * paying for itself rather than merely costing less.**
 */

import { afterAll, describe, expect, it } from 'vitest';

import {
  AUTHORED,
  AUTHORED_IDS,
  type AuthoredId,
  observations,
  observe,
  pairKey,
  report,
  reset,
  unmet,
} from './authored.ts';
import { MUSIC_LAYERS, MUSIC_LEVELS, type MusicLayer, type MusicLevel } from '../src/content/music.ts';
import { THEMES, THEME_KINDS, holdOf, mixOf, rungOf, scaleOf, type ThemeKind } from '../src/content/themes.ts';
import { roleOf } from '../src/content/arrangement.ts';
import { DUCK_FLOOR_DB, carriedThrough, soundingAt } from './pace.ts';
import { AA_FLOOR, contrast } from './contrast.ts';
import { DECOR_INKS, PALETTES, type PaletteName } from '../src/content/palette.ts';
import { SPRITE_EXTENT } from '../src/content/sprites.ts';
import { bakeSize, cloudCover } from '../src/render/bake.ts';

/** sRGB blend, which is what a gradient over a backdrop produces — the same one `tests/sky.test.ts` uses. */
function over(base: string, top: string, alpha: number): string {
  const parse = (h: string): number[] => {
    const m = /^#(..)(..)(..)$/.exec(h);
    if (m === null) throw new Error(`not a hex colour: ${h}`);
    return [1, 2, 3].map((i) => parseInt(m[i]!, 16));
  };
  const [a, b] = [parse(base), parse(top)];
  return `#${a.map((v, i) => Math.round(v + (b[i]! - v) * alpha).toString(16).padStart(2, '0')).join('')}`;
}
import { loopsAt } from './bakes.ts';
import { SAMPLE_RATE } from '../src/app/sound.ts';
import { PICKUP_CYCLE_STEPS } from '../src/content/pickups.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';

/** The three changes a player crosses while flying the same stretch of level — 0167's own exclusion. */
const IN_LEVEL = [
  ['run', 'push'],
  ['push', 'surge'],
  ['surge', 'approach'],
] as const;

/** Every unordered pair of places, once. */
function pairs(): [ThemeKind, ThemeKind][] {
  const out: [ThemeKind, ThemeKind][] = [];
  for (let i = 0; i < THEME_KINDS.length; i++) {
    for (let j = i + 1; j < THEME_KINDS.length; j++) {
      const a = THEME_KINDS[i];
      const b = THEME_KINDS[j];
      if (a !== undefined && b !== undefined) out.push([a, b]);
    }
  }
  return out;
}

/** 0148 — stated over all seven, which the hard guard could not be. */
function measureNotes(): void {
  const key = (t: ThemeKind) => [...scaleOf(t)].sort((a, b) => a - b).join(',');
  const found = pairs()
    .filter(([a, b]) => key(a) === key(b))
    .map(([a, b]) => `${pairKey(a, b)} play the same notes${THEMES[a].scale === undefined ? ' (both on the default)' : ''}`);
  observe('0148-notes', found.length === 0, found);
}

/** 0155 — two places that track the same part at every rung are one arrangement. */
function measureLead(): void {
  const rungs = MUSIC_LEVELS.filter((r) => r !== 'calm' && r !== 'bossPeak');
  const lead = (t: ThemeKind, rung: MusicLevel): MusicLayer | undefined =>
    MUSIC_LAYERS.find((l) => roleOf(t, rung, l) === 'part');
  const found = pairs()
    .filter(([a, b]) => !rungs.some((rung) => lead(a, rung) !== lead(b, rung)))
    .map(([a, b]) => `${pairKey(a, b)} follow the same instrument at every rung`);
  observe('0155-lead', found.length === 0, found);
}

/** 0167 — a section change adds, and never pays for the arriving layers out of the sounding ones. */
function measureDuck(): void {
  const found: string[] = [];
  for (const theme of THEME_KINDS) {
    for (const [from, to] of IN_LEVEL) {
      const before = {} as Record<MusicLayer, number>;
      const after = {} as Record<MusicLayer, number>;
      for (const layer of MUSIC_LAYERS) {
        before[layer] = rungOf(theme, from, layer) * mixOf(theme, layer);
        after[layer] = rungOf(theme, to, layer) * mixOf(theme, layer);
      }
      // 0226: the hold lowers the whole rung; what is observed is a layer falling RELATIVE to its rung.
      const held = 20 * Math.log10(holdOf(theme, to) / holdOf(theme, from));
      for (const { layer, move } of carriedThrough(before, after)) {
        if (move - held <= DUCK_FLOOR_DB) found.push(`${theme} ${from}→${to}: ${layer} ${(move - held).toFixed(1)} dB`);
      }
    }
  }
  observe('0167-duck', found.length === 0, found);
}

/** 0172 — what a place opens on is the first thing a listener has to tell apart. */
function measureFour(): void {
  const top = new Map<ThemeKind, string>();
  for (const theme of THEME_KINDS) {
    const four = soundingAt(theme, 'run', loopsAt(SAMPLE_RATE, theme)).slice(0, 4);
    top.set(theme, [...four].sort().join(','));
  }
  const found = pairs()
    .filter(([a, b]) => top.get(a) === top.get(b))
    .map(([a, b]) => `${pairKey(a, b)} both open on ${top.get(a) ?? ''}`);
  observe('0172-four', found.length === 0, found);
}

/**
 * 0236 — a cycling pickup shows each face for three seconds. The player's number, from the guns'
 * first play-test: *"the rotation needs to be 1sec longer."* Nothing breaks at two, so it is a taste.
 */
function measureCycle(): void {
  const seconds = PICKUP_CYCLE_STEPS / STEPS_PER_SECOND;
  observe('0236-cycle', seconds >= 3, seconds >= 3 ? [] : [`a face is shown for ${seconds.toFixed(1)}s`]);
}

/**
 * 0237 — a blade is drawn as big as the ship. The player's number, from the blades' first play-test:
 * *"shuriken stars need to be a lot bigger."* Nothing breaks at half the size, so it is a taste.
 */
function measureBlade(): void {
  const share = SPRITE_EXTENT.shuriken / SPRITE_EXTENT.shipStar;
  observe('0237-blade', share >= 0.9, share >= 0.9 ? [] : [`a blade is ${(share * 100).toFixed(0)}% of the ship`]);
}

/**
 * 0198 — the three WCAG floors the accessibility pass will restore.
 *
 * ⚠️ **DEFERRED IS NOT UNMEASURED.** `docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md`
 * moves the pass after the game; the suites hold `GAMEPLAY_FLOOR` and these hold the AA bar, so what
 * the pass has to fix is a list that is already written rather than an audit it has to start.
 */
function measureAA(): void {
  const inks = (name: PaletteName): [string, string][] =>
    (Object.entries(PALETTES[name]) as [string, string][]).filter(
      ([ink]) => ink !== 'space' && ink !== 'sky' && !(DECOR_INKS as readonly string[]).includes(ink),
    );

  const space: string[] = [];
  const backdrop: string[] = [];
  const weather: string[] = [];
  const size = bakeSize(SPRITE_EXTENT.skyNebula, 6);

  for (const name of Object.keys(PALETTES) as PaletteName[]) {
    for (const [ink, colour] of inks(name)) {
      const r = contrast(colour, PALETTES[name].space);
      if (r < AA_FLOOR) space.push(`${name}/${ink} ${r.toFixed(2)}`);
    }
    for (const theme of THEME_KINDS) {
      const bare = THEMES[theme].space[name];
      const cover = cloudCover(size, theme);
      const withWeather = over(bare, THEMES[theme].nebula[name], cover);
      for (const [ink, colour] of inks(name)) {
        const b = contrast(colour, bare);
        if (b < AA_FLOOR) backdrop.push(`${theme}/${name}/${ink} ${b.toFixed(2)}`);
        const w = contrast(colour, withWeather);
        if (w < AA_FLOOR) weather.push(`${theme}/${name}/${ink} ${w.toFixed(2)}`);
      }
    }
  }
  observe('0198-aa-space', space.length === 0, space);
  observe('0198-aa-backdrop', backdrop.length === 0, backdrop);
  observe('0198-aa-clouds', weather.length === 0, weather);
}

function measureAll(): void {
  measureNotes();
  measureLead();
  measureDuck();
  measureFour();
  measureAA();
  measureCycle();
  measureBlade();
}

/**
 * ⚠️ **`0172-four` BAKES SEVEN PLACES' LOOPS**, which is the whole cost of this file — the other
 * three claims are table arithmetic and run in single-digit milliseconds. `loopsAt` caches per
 * process, so it is one cold bake per worker and every later `measureAll` is warm.
 *
 * ── THE NUMBER IS MEASURED, AND THE FIRST ONE WAS A COIN TOSS ────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`.** This was
 * `60_000` and it went red once in a full-suite run and green on its own — which is the shape 0044
 * refuses to let anybody call flaky. **Measured rather than rerun:** the cold bake is **28.3 s
 * alone** and **61.3 s under `npx vitest run`**, a load factor of 2.2 against an allowance that was
 * 1.2% under the observed figure.
 *
 * ⚠️ **AND IT IS NOT AN INTERMITTENCY IN THE CODE.** The bake is deterministic — `tests/bakes.ts`
 * says so and caches on it — so what varies is machine load and nothing else. **A timeout here is a
 * budget on a measurement, not a guard on the work**, which is
 * `docs/decisions/0192-a-guard-holds-an-invariant.md`'s own middle category: it fails hard and the
 * number belongs to somebody. Sized against the heavier load rather than the lighter one, because
 * `npm run prove` runs 149 copies in parallel and is heavier again than the suite that produced the
 * 61.3 s.
 */
const DSP_MS = 180_000;

/**
 * ⚠️ **THERE IS NO `beforeAll` HERE, AND THAT IS 0178's RULE RATHER THAN A STYLE CHOICE** —
 * `docs/decisions/0178-a-break-has-to-be-able-to-run.md`. Measuring in a hook put every claim through
 * `observe` before the first test ran, so the probe that makes `observe` throw killed the hook, no
 * test was collected, and the harness reported `NO SUCH GUARD` about a guard sitting exactly where it
 * said it was. **A break has to be able to run in the file it lands in** — so the one test that
 * proves `observe` cannot throw is the one test that never measures.
 */
describe('0192 — the authored claims are advisory, and the mechanism under them is not', () => {
  afterAll(() => {
    // Whatever the last measuring test left, which is the real four. Deliberately does NOT measure:
    // a hook that measures is a hook a probe can kill, which is the paragraph above.
    // eslint-disable-next-line no-console
    console.log(`\n${report()}\n`);
  });

  it('THE ONE THAT CANNOT BE RECOVERED FROM: an unmet claim does not throw and does not fail', () => {
    /*
      ⚠️ **THE WHOLE MECHANISM, STATED AS AN ASSERTION.** `observe` is the only path a taste takes
      into this suite, and *it never reds* is a property that has to be seen rather than asserted in
      prose — the same argument `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` makes from the
      other direction. A version of this file that threw would reintroduce exactly what
      `docs/decisions/0191-a-place-sits-somewhere.md` records: work bent to keep a suite green.
    */
    reset();
    expect(() => observe('0167-duck', false, ['a claim that is deliberately not met'])).not.toThrow();
    expect(unmet(), 'an unmet claim was recorded and the register does not know about it').toContain('0167-duck');
  });

  it('every registered claim is measured exactly once, so the register cannot hold a dead entry', () => {
    /*
      ⚠️ **THE 0016 RULE OVER A REGISTER OF OPINIONS.** An advisory nobody evaluates is worse than no
      advisory, because the printout reads as a clean bill of health for a claim nothing measured.
    */
    reset();
    measureAll();
    const counted = new Map<AuthoredId, number>();
    for (const o of observations()) counted.set(o.id, (counted.get(o.id) ?? 0) + 1);
    for (const id of AUTHORED_IDS) {
      expect(counted.get(id), `${id} is registered and measured ${counted.get(id) ?? 0} times`).toBe(1);
    }
  }, DSP_MS);

  it('and every claim names the change that would break it and be correct, which is the admission test', () => {
    /*
      ⚠️ **THIS IS WHAT KEEPS THE FILE FROM BECOMING A BIN.** 0192's rule is that a claim belongs here
      only if a correct authoring could redden it. An entry that cannot name one is an invariant that
      has been demoted to avoid fixing something, and that is the failure this mechanism could
      plausibly cause.
    */
    for (const id of AUTHORED_IDS) {
      expect(AUTHORED[id].correctly.length, `${id} does not say what would correctly break it`).toBeGreaterThan(30);
      expect(AUTHORED[id].decision, `${id} names no decision`).toMatch(/^\d{4}-/);
    }
  });

  it('and the report names every unmet claim and what it found, or it is a number nobody can act on', () => {
    reset();
    measureAll();
    const text = report();
    for (const id of unmet()) {
      expect(text, `${id} is unmet and the report does not name it`).toContain(id);
      const found = observations().find((o) => o.id === id)?.found ?? [];
      const first = found[0];
      if (first !== undefined) {
        expect(text, `${id} is unmet and the report does not say what it found`).toContain(first);
      }
    }
    expect(text, 'the report does not say that nothing in it can fail').toContain('cannot fail this suite');
  }, DSP_MS);
});
