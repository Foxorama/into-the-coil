import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import {
  UNITS_PER_SECOND,
  cueLines,
  layerSpans,
  loudestGain,
  marksOf,
  momentOf,
  moveOf,
  weaponAtTier,
} from '../rig/transport.ts';
import {
  AURA_LAYERS,
  BAR_SECONDS,
  LAYER_BARS,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  STEPS_PER_BEAT,
  type MusicLayer,
} from '../src/content/music.ts';
import { THEME_KINDS, mixOf } from '../src/content/themes.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { auraBuild, auraFor, levelWrites, musicLevelFor } from '../src/app/music.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { SHIPS } from '../src/content/ships.ts';
import { UPGRADE_TIERS, weaponFor } from '../src/content/pickups.ts';

/**
 * THE SOUND DASHBOARD, HELD TO THE GAME — `docs/decisions/0126-the-dashboard-is-the-instrument.md`.
 *
 * ── WHY THESE ARE ALL ASSERTIONS ABOUT VALUES ────────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0116-the-rig-plays-the-level.md` had to learn this the expensive way.** The
 * first guards written for the WAV rig asserted that a word appeared in its source —
 * `rig.includes('mixOf')` — and `npm run prove` reported STILL GREEN on two of three probes, because
 * deleting a call site leaves the import behind. **A spellcheck standing in for a property, and it
 * looked exactly like a guard.**
 *
 * ⚠️ **So what is held below is that the dashboard's ANSWERS EQUAL THE GAME'S**, layer by layer and
 * cadence by cadence, against the modules that own each quantity. A rig that has come apart from the
 * game is worse than no rig, because it still produces a number — and this repository has taken a
 * verdict from a drifted instrument twice (0104's missing bus shaper, 0114's two reference levels).
 *
 * ⚠️ **The two source scans at the bottom are the exception and they are about the IMPORT GRAPH**,
 * which is a fact rather than an intention — `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`
 * chose that shape deliberately, because it *"goes on working after everybody who remembers the
 * reason has gone."*
 */

const root = fileURLToPath(new URL('..', import.meta.url));

/** The fight the dashboard holds a boss for. Its own stated choice, restated here on purpose. */
const FIGHT = 45;

/** A handful of seconds spread over a level, including one inside the fight. */
const sampleSeconds = (kind: (typeof LEVEL_KINDS)[number]): number[] => {
  const total = LEVELS[kind].bossAt / UNITS_PER_SECOND + FIGHT;
  return [0, total * 0.15, total * 0.4, total * 0.55, total * 0.68, total * 0.8, total * 0.95];
};

describe('the dashboard answers the game’s questions', () => {
  it('THE RUNG IS THE GAME’S ANSWER, never a table the dashboard keeps', () => {
    for (const kind of LEVEL_KINDS) {
      const { bossAt } = LEVELS[kind];
      const toBoss = bossAt / UNITS_PER_SECOND;
      for (const second of sampleSeconds(kind)) {
        const inFight = second >= toBoss;
        const camera = inFight ? bossAt : second * UNITS_PER_SECOND;
        const health = inFight ? Math.max(0, 1 - (second - toBoss) / FIGHT) : 1;
        expect(
          momentOf(kind, second, FIGHT, 0).rung,
          `${kind} at ${second.toFixed(1)}s: the dashboard and musicLevelFor disagree about the rung`,
        ).toBe(musicLevelFor(camera, bossAt, inFight, health));
      }
    }
  });

  it('EVERY LAYER’S TARGET IS THE ONE `levelWrites` WOULD SCHEDULE, to the last decimal', () => {
    /*
      ⚠️ **THE STRONGEST GUARD HERE, because `levelWrites` is not a copy of what the mixer does — it
      IS what the mixer does.** `makeMusicOut.setLevel` does nothing but ask it and write the answers
      onto the gain nodes (0117), so a dashboard whose *target* column equals its output is a
      dashboard that cannot be showing a mix nobody hears. That is the failure 0116 is named for,
      asserted rather than hoped for.
    */
    for (const kind of LEVEL_KINDS) {
      for (const second of sampleSeconds(kind)) {
        const moment = momentOf(kind, second, FIGHT, 0.5);
        const writes = levelWrites(moment.rung, moment.theme, moment.aura, 0, 0, {});
        for (const { layer, target } of moment.layers) {
          const write = writes.find((w) => w.layer === layer);
          expect(write, `${kind} at ${second.toFixed(1)}s: no write for ${layer}`).toBeDefined();
          expect(target, `${kind} at ${second.toFixed(1)}s: ${layer}`).toBeCloseTo(write!.target, 10);
        }
      }
    }
  });

  it('THE PLACE IS IN IT: two themes do not produce the same gains', () => {
    // 0107's multiplier. No mode of `scripts/hear.mjs` applied one until 0116, so every file this
    // project listened to was level one's mix — including the ones used to judge *it doesn't change
    // per level*. A dashboard that dropped it would be the same defect with a slider on it.
    /*
      ⚠️ **THE AURA LAYERS ARE EXCLUDED AND `npm run prove` IS WHY.** The first version of this guard
      compared all twenty-three and reported STILL GREEN with the theme forced to level one's — because
      `eye`'s boss is 190 units further out, so its level build (0107) is at a different point at the
      same second and the two aura layers differ on distance alone. **A guard satisfied by the one pair
      of layers that has nothing to do with the theme**, which is
      `docs/decisions/0027-measure-the-picture-not-the-model.md` inside a test rather than inside a
      tuning pass.
    */
    const one = momentOf('approach', 60, FIGHT, 0).layers;
    const seven = momentOf('eye', 60, FIGHT, 0).layers;
    expect(one.find((l) => l.layer === 'sub')!.move, 'the two are not even on the same rung').toBe(
      seven.find((l) => l.layer === 'sub')!.move,
    );
    const differ = MUSIC_LAYERS.filter((layer) => AURA_LAYERS.includes(layer) === false).filter((layer) => {
      const a = one.find((l) => l.layer === layer)!.target;
      const b = seven.find((l) => l.layer === layer)!.target;
      return a !== b;
    });
    expect(differ, 'The Approach and The Core render identically — the theme is not being applied').not.toEqual([]);
  });

  it('THE AURA ARRIVES AS A CEILING and not as a gain', () => {
    // 0091: the aura's ladder row is what the layer may reach, multiplied by how near the boss is.
    // A dashboard reading it as a gain would sound the dread with no boss anywhere near — which is
    // exactly the break 0116's own probe used.
    const early = momentOf('approach', 5, FIGHT, 0);
    for (const layer of AURA_LAYERS) {
      expect(early.layers.find((l) => l.layer === layer)!.target, `${layer} sounds before the build starts`).toBe(0);
    }
    const late = momentOf('approach', 110, FIGHT, 0);
    const build = auraFor(auraBuild(late.camera, LEVELS.approach.bossAt), 0);
    expect(late.aura, 'the dashboard’s aura is not the mixer’s').toBeCloseTo(build, 10);
    expect(build, 'the level’s own build never rises').toBeGreaterThan(0);
  });
});

describe('an arrival is not a rise', () => {
  /*
    ⚠️ **`docs/decisions/0125-the-build-starts-sooner.md` IS WHY THIS IS A GUARD AND NOT A DETAIL.**
    Split by half, the game's four rung changes divide perfectly: +70 and +64 arriving notes are
    heard, +20 and +4 are not, whatever leaves alongside them. A readout that called *opened from
    nothing* and *got four percent louder* by the same word would hide the only distinction that has
    ever predicted the player's verdict.
  */
  it('a layer that was already playing is never reported as OPENING', () => {
    expect(moveOf(0, 0.8)).toBe('opening');
    expect(moveOf(0.7, 0.8)).toBe('louder');
    expect(moveOf(0.8, 0.7)).toBe('quieter');
    expect(moveOf(0.8, 0)).toBe('closing');
    expect(moveOf(0, 0)).toBe('silent');
    expect(moveOf(0.8, 0.8)).toBe('holding');
  });

  it('AND THE AURA IS NOT DESCRIBED AS EITHER, because it follows a distance rather than a section', () => {
    /*
      ⚠️ **THIS GUARD WROTE ITSELF BY GOING RED.** The first draft reported `auraSlow` as `opening`
      at the run → push boundary, because the level's own build (0107) crosses its onset partway
      through `run` — a true sentence about a gain and a false one about the music. 0117 leaves the
      aura unquantised for the same underlying reason, and an instrument that files it under
      *arrived* is teaching the reader that a section did something it did not do.
    */
    for (const second of [5, 60, 110, 150]) {
      for (const layer of AURA_LAYERS) {
        const now = momentOf('approach', second, FIGHT, 0.5).layers.find((l) => l.layer === layer)!;
        expect(['tracking', 'silent'], `${layer} at ${second}s is reported as ${now.move}`).toContain(now.move);
      }
    }
  });

  it('and the level’s own boundaries are described with it', () => {
    // The first rung change in level one, read the way the dashboard prints it.
    const push = marksOf('approach', FIGHT)[1]!;
    const moment = momentOf('approach', push.second + 0.5, FIGHT, 0);
    const opening = moment.layers.filter((l) => l.move === 'opening').map((l) => l.layer);
    expect(opening.length, 'run → push opens nothing, which is not what the ladder says').toBeGreaterThan(0);
    for (const layer of opening) {
      expect(
        MUSIC_LADDER.run[layer as MusicLayer],
        `${layer} is called opening at push and was already sounding at run`,
      ).toBe(0);
    }
  });
});

describe('how long a layer is open, against how long its own loop is', () => {
  it('a span’s bounds are the RUNG MARKS and its length is the content’s', () => {
    /*
      ⚠️ **`docs/decisions/0027-measure-the-picture-not-the-model.md` wants an assertion in units the
      player experiences, and *did that tune come round* is one.** What is held here is the
      arithmetic rather than the answer: the answer is a property of today's ladder and would be a
      copy of the content, which 0043's density floor is this project's own warning about.
    */
    const marks = marksOf('approach', FIGHT);
    const spans = layerSpans('approach', FIGHT);
    const bounds = new Set<number>([...marks.map((m) => m.second), marks[marks.length - 1]!.second + marks[marks.length - 1]!.lasts]);
    for (const span of spans) {
      expect(span.loopSeconds, `${span.layer}: the loop length is not LAYER_BARS × BAR_SECONDS`).toBe(
        LAYER_BARS[span.layer] * BAR_SECONDS,
      );
      expect(span.passes, `${span.layer}: passes is not the longest run over the loop`).toBeCloseTo(
        span.longest / span.loopSeconds,
        10,
      );
      expect(span.longest, `${span.layer}: the longest run exceeds the total`).toBeLessThanOrEqual(span.openFor + 1e-9);
      for (const [from, to] of span.spans) {
        expect(bounds.has(from), `${span.layer}: a span starts at ${from}s, which is not a rung boundary`).toBe(true);
        expect(bounds.has(to), `${span.layer}: a span ends at ${to}s, which is not a rung boundary`).toBe(true);
      }
    }
  });

  it('a layer the ladder never opens is reported as never open', () => {
    // `bass` and `beat` belong to the title's piece and are closed for the whole of every level —
    // 0095's TITLE_ONLY. An instrument that showed them sounding would be answering a question about
    // a screen the player is not on.
    for (const layer of ['bass', 'beat'] as const) {
      expect(layerSpans('approach', FIGHT).find((s) => s.layer === layer)!.openFor, `${layer} is open inside a level`).toBe(0);
    }
  });
});

describe('what plays over the top of it', () => {
  it('A TIER IS BOTH LADDERS, and it is the game’s own resolution of them', () => {
    for (let tier = 0; tier <= UPGRADE_TIERS; tier++) {
      const carried = Array.from({ length: tier }, () => ['weapon', 'missile'] as const).flat();
      expect(weaponAtTier(tier), `tier ${tier} is not what weaponFor resolves`).toEqual(weaponFor(SHIPS.proof, carried));
    }
  });

  it('the ship opens a run with no launcher, so the dashboard sounds no missile at tier zero', () => {
    // 0056: the missile is earned. A rig firing it from the first second would be laying the second
    // auto-weapon over a mix the player does not have one in.
    const missile = cueLines(0, 'run', 1.6).find((c) => c.kind === 'missile')!;
    expect(missile.sounds, 'the dashboard fires a missile the ship has not found yet').toBe(false);
    expect(cueLines(UPGRADE_TIERS, 'run', 1.6).find((c) => c.kind === 'missile')!.sounds).toBe(true);
  });

  it('THE GUN’S CADENCE IS THE SHIP’S, never a number typed into the rig', () => {
    for (let tier = 0; tier <= UPGRADE_TIERS; tier++) {
      const weapon = weaponAtTier(tier);
      const pulse = cueLines(tier, 'run', 1.6).find((c) => c.kind === 'pulse')!;
      expect(pulse.every, `tier ${tier}: the pulse is not on the ship's own fireEvery`).toBe(weapon.fireEvery);
      expect(pulse.perSecond, `tier ${tier}`).toBeCloseTo(STEPS_PER_SECOND / weapon.fireEvery, 10);
    }
  });

  it('the boss shoots only in the fight, and on a beat', () => {
    // 0096: everything that shoots at the player is on the sixteenth grid, and the boss's own
    // cadence is a whole number of beats. 0114 found a boss take rendered without it at all.
    expect(cueLines(2, 'surge', 1.6).find((c) => c.kind === 'bossShot')!.sounds).toBe(false);
    const inFight = cueLines(2, 'bossPeak', 1.6).find((c) => c.kind === 'bossShot')!;
    expect(inFight.sounds).toBe(true);
    expect(inFight.every! % STEPS_PER_BEAT, 'the boss fires off the beat').toBe(0);
  });

  it('a kill is scattered, because nothing in the game quantises one', () => {
    // 0094: the gun runs on an absolute multiple of the sim step and a kill lands on the step a
    // collision resolves. A dashboard that snapped them would show a tidier game than the one the
    // player is judging.
    for (const kind of ['kill', 'hit', 'threat'] as const) {
      expect(cueLines(2, 'run', 1.6).find((c) => c.kind === kind)!.every, `${kind} is on a grid`).toBeNull();
    }
  });
});

describe('0130 — a layer can be heard on its own', () => {
  /*
    `docs/decisions/0130-a-layer-can-be-heard-on-its-own.md`. Reported: *"the music dashboard needs
    to let me play music components as well as every sound in the game, so I can hear them
    individually without needing to have the main theme playing."*

    ⚠️ **WHAT IS HELD IS THE VALUE THE BUTTON PUTS IN THE FADER**, not that a button exists. The
    click, the DOM and the `AudioParam` write are `rig/dash.ts`'s and need a browser;
    `docs/decisions/0116-the-rig-plays-the-level.md` records what happens when a rig is guarded by
    looking for a word in its source instead.
  */
  it('an audition is the LOUDEST this place ever takes the layer, off the game’s own tables', () => {
    for (const theme of THEME_KINDS) {
      for (const layer of MUSIC_LAYERS) {
        /*
          ⚠️ **Composed here from `MUSIC_LADDER` and `mixOf` rather than from `targetGain`**, which
          is what `loudestGain` itself walks — a guard built out of the function's own helper would
          only prove the loop runs. The aura's pair are at a boss at arm's length, which is the one
          reading of *loudest* available for a gain that is a distance the player steers (0091).
        */
        const want = Math.max(...MUSIC_LEVELS.map((rung) => MUSIC_LADDER[rung][layer])) * mixOf(theme, layer);
        expect(loudestGain(theme, layer), `${theme}/${layer}`).toBeCloseTo(want, 10);
      }
    }
  });

  it('and NO LAYER IS UNREACHABLE — all twenty-three can be got at, in every place', () => {
    /*
      ⚠️ **THIS IS THE ASK, STATED AS A PROPERTY.** *"Whole sections of sound that have been produced
      that I've apparently never heard"* (0126) is a claim that some of this composition is
      effectively unreachable; a desk whose one-click audition could still hand back silence for a
      layer would be the same complaint with a button on it. It is also a live dead-layer check: a
      layer no rung ever opens would fail here rather than sit in the table unheard.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of MUSIC_LAYERS) {
        expect(loudestGain(theme, layer), `${theme}/${layer} cannot be heard on the desk at all`).toBeGreaterThan(0);
      }
    }
  });

  it('and it reaches PAST the rung, which is the whole reason it is not the ladder’s own value', () => {
    /*
      ⚠️ **0129 made the faders absolute so a closed layer could be dragged up; this is that in one
      click.** `solo` leaves the survivor at whatever the ladder says, and fourteen of the
      twenty-three are closed at any given rung — so an audition that used the rung's value would be
      silence for most of the table most of the time, which is exactly the state 0129 was reported
      against.
    */
    const closedDuringRun = MUSIC_LAYERS.filter((layer) => MUSIC_LADDER.run[layer] === 0);
    expect(closedDuringRun.length, 'the run rung closes nothing, so this guard is standing over nothing').toBeGreaterThan(
      8,
    );
    for (const layer of closedDuringRun) {
      expect(loudestGain('nebula', layer), `${layer} is closed at run and the audition cannot reach it`).toBeGreaterThan(
        0,
      );
    }
  });
});

describe('the rig is not in the game, and the game is not in the rig', () => {
  it('the walk is at the game’s own speed', () => {
    expect(UNITS_PER_SECOND).toBe(SCROLL_PER_STEP * STEPS_PER_SECOND);
  });

  it('NOTHING UNDER src/ CALLS `gainOf` OR `panOf` — the mix and the field are decided in one place', () => {
    /*
      ⚠️ **A parameter the shell could write is a second place the mix is decided from.** `gainOf`
      exists for `rig/` alone (0126); the moment a frame reaches for it, `docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md`'s
      single hand becomes two, and `levelWrites` stops being the whole story of what a layer is doing.
      Its own declaration in `src/app/music.ts` is the one permitted mention.

      ⚠️ **`panOf` IS HELD ON THE SAME TERMS AND THE ARGUMENT IS STRONGER, NOT WEAKER** — 0129. A
      layer's place is set once from `LAYER_PAN` at construction and the game never moves one, so a
      call site under `src/` would not be a second opinion about the field — it would be **the only
      one**, and `tests/music.test.ts`'s guard that the low end is centred would be measuring a table
      nobody obeys.
    */
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts') && path !== 'src/app/music.ts') {
          const source = readFileSync(resolve(root, path), 'utf8');
          if (/\b(gainOf|panOf)\s*\(/.test(source)) offenders.push(path);
        }
      }
    };
    walk('src');
    expect(offenders, `these reach into a layer's gain or place directly: ${offenders.join(', ')}`).toEqual([]);
  });

  it('NOTHING UNDER src/ IMPORTS FROM rig/ — the dashboard is not reachable from the shipped page', () => {
    /*
      ⚠️ **`docs/decisions/0003-single-file-build.md` closes the build's file list and
      `docs/decisions/0015-the-layer-ladder.md` closes what may import what.** `rig/` is outside both
      on purpose: it is dev tooling that imports the game, and the arrow must never turn round. One
      import from `src/` would put a dashboard into the shipped bundle without changing a single
      thing the sidecar test looks at.
    */
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts')) {
          if (/from\s*['"][^'"]*\brig\//.test(readFileSync(resolve(root, path), 'utf8'))) offenders.push(path);
        }
      }
    };
    walk('src');
    expect(offenders, `these import the dashboard: ${offenders.join(', ')}`).toEqual([]);
  });
});
