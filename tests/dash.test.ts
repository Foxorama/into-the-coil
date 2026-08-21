import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import {
  DESK_CEILING,
  LOUDEST_SHIPPED,
  SECTION_FLOOR_UNITS,
  UNITS_PER_SECOND,
  cueLines,
  deskSounds,
  deskTarget,
  addSectionAfter,
  dragSection,
  removeSection,
  retypeSection,
  layerSpans,
  loudestGain,
  marksOf,
  momentOf,
  moveOf,
  weaponAtTier,
  type Held,
} from '../rig/transport.ts';
import {
  OWN_LAYERS,
  AURA_LAYERS,
  BAR_SECONDS,
  LAYER_BARS,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  SECTION_NAMES,
  type LevelSections,
  type MusicLayer,
} from '../src/content/music.ts';
import { VOLLEY_CYCLE } from '../src/content/cadence.ts';
import { voicesOf, THEME_KINDS, mixOf, rungIn, rungOf } from '../src/content/themes.ts';
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
        ).toBe(musicLevelFor(camera, inFight, LEVELS[kind].sections, health));
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

  it('0163 — AN EDITED LADDER REACHES THE MIXER, because the readout and the write are one function', () => {
    /*
      ⚠️ **THIS IS WHAT STANDS IN FOR THE `live` COLUMN, AND IT IS STRONGER THAN ONE.** A live reading
      is one layer at one second; this is every layer at seven seconds of seven levels, and it holds
      the two things that must agree BY CONSTRUCTION rather than by comparison. `setLevel` does
      nothing but write `levelWrites`' answers onto the gain nodes (0117), so a `momentOf` that equals
      `levelWrites` **cannot** be showing a mix nobody hears.

      ⚠️ **THE DRIVEN LADDER HAS TO GO THROUGH BOTH OR IT PROVES NOTHING.** 0154's solved-mix toggle
      is the recorded instance of getting this wrong: it handed the solve to `momentOf` and not to
      `setLevel`, so it changed *the readout and not one sample of audio*. The same mistake was
      available here and this is the guard against it.

      ⚠️ **`arp` AT `run` IS THE CASE 0162 EXISTS FOR** — zero in the shared ladder, and unreachable by
      any multiplier — so an edit that opens it is the one a broken thread would silently drop.
    */
    const edited = { run: { arp: 0.7 }, surge: { counter: 0 } } as const;
    for (const kind of LEVEL_KINDS) {
      const theme = LEVELS[kind].theme;
      for (const second of sampleSeconds(kind)) {
        const moment = momentOf(kind, second, FIGHT, 0.5, LEVELS[kind].sections, null, edited);
        const writes = levelWrites(moment.rung, theme, moment.aura, 0, 0, {}, edited);
        for (const { layer, target } of moment.layers) {
          const write = writes.find((w) => w.layer === layer);
          expect(write, `${kind} at ${second.toFixed(1)}s: no write for ${layer}`).toBeDefined();
          expect(target, `${kind} at ${second.toFixed(1)}s: ${layer} — readout and mixer disagree`).toBeCloseTo(
            write!.target,
            10,
          );
        }
      }
    }
    /*
      ⚠️ **AND THE EDIT ACTUALLY MOVES SOMETHING**, or the assertions above are two identical wrong
      answers agreeing. `arp` opens where the shared ladder closes it, and `counter` closes where it
      opens — both directions, because `??` and `||` differ only on the second one.
    */
    const at = (rung: 'run' | 'surge', layer: 'arp' | 'counter', ladder?: typeof edited): number =>
      levelWrites(rung, 'approach', 0, 0, 0, {}, ladder).find((w) => w.layer === layer)!.target;
    expect(at('run', 'arp'), 'the shared ladder already opens arp at run, so this proves nothing').toBe(0);
    expect(at('run', 'arp', edited), 'an edit could not OPEN a layer the shared ladder closes').toBeGreaterThan(0);
    expect(at('surge', 'counter'), 'the shared ladder already closes counter at surge').toBeGreaterThan(0);
    expect(at('surge', 'counter', edited), 'an edit could not CLOSE a layer the shared ladder opens').toBe(0);
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
    const build = auraFor(auraBuild(late.camera, LEVELS.approach.bossAt, LEVELS.approach.theme), 0);
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
    expect(inFight.every! % VOLLEY_CYCLE, 'the boss fires off the beat').toBe(0);
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
        /*
          ⚠️ **THROUGH `rungOf` SINCE A PLACE STATES ITS OWN RUNGS** —
          `docs/decisions/0172-a-place-opens-with-its-own-four.md`. `MUSIC_LADDER[rung][layer]` was a
          faithful copy of what the desk does while every ladder was absent, and became a second
          opinion the moment one was not. It is still composed from the TABLES rather than from
          `targetGain`, which is what the paragraph above is about and is untouched by this.
        */
        /*
          ⚠️ **AND A PLACE MAY CLOSE A LAYER AT EVERY RUNG, WHICH MAKES *the loudest this place takes
          it* ZERO** — `docs/decisions/0189-a-place-is-what-it-does-not-play.md`. Saurian Belt closes
          six. The audition then hands back silence for exactly the layers a session working on that
          place needs to hear, which is 0129's own defect — *"trim × 0 is 0, so the layers the ladder
          has closed were unreachable, and those are exactly the ones worth auditioning"* — one table
          later. `loudestGain` falls back to the SHARED ladder at this place's colour, and this is
          that rule written out rather than the function's own arithmetic repeated.

          ⚠️ **THE TWO BRANCHES ARE BOTH DRIVEN BY REAL DATA**, which is what keeps this a guard: six
          places reach the first and Saurian Belt's six closed layers reach the second.
          `node scripts/prove-guard.mjs 0189-audition` deletes the fallback and watches this go red.
        */
        const own = Math.max(...MUSIC_LEVELS.map((rung) => rungOf(theme, rung, layer)));
        const shared = Math.max(...MUSIC_LEVELS.map((rung) => rungIn(undefined, rung, layer)));
        const want = (own > 0 ? own : shared) * mixOf(theme, layer);
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
      /*
        ⚠️ **AN OWN SLOT THIS PLACE HAS NOT FILLED IS NOT A LAYER** —
        `docs/decisions/0188-a-place-owns-four-slots.md`. The four carry no instrument until a place
        states one, so *every layer is reachable* means every layer that exists HERE. A place that
        does fill one is held exactly like the other nineteen, which is what makes this a skip rather
        than a hole: `voicesOf` is the test, so the moment Saurian Belt states `ownA` the desk has
        to reach it.
      */
      if (OWN_LAYERS.includes(layer) && voicesOf(theme, layer).length === 0) continue;
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
      /*
        ⚠️ **AN OWN SLOT EMBER NEBULA HAS NOT FILLED IS NOT A LAYER IT CAN AUDITION** —
        `docs/decisions/0188-a-place-owns-four-slots.md`. The four are closed at every rung of the
        shared ladder, so they land in `closedDuringRun` like the other fourteen — but a place that
        states no voices for one has nothing to hear. `voicesOf` is the test, so the day this place
        fills a slot the desk has to reach it.
      */
      if (OWN_LAYERS.includes(layer) && voicesOf('nebula', layer).length === 0) continue;
      expect(loudestGain('nebula', layer), `${layer} is closed at run and the audition cannot reach it`).toBeGreaterThan(
        0,
      );
    }
  });
});

describe('0137 — the desk sounds while the level stands still', () => {
  /*
    `docs/decisions/0137-the-desk-sounds-while-the-level-stands-still.md`. Reported: *"I need to be
    able to pause the music and then play a particular sound to be able to identify what's
    playing/not playing in the soundtrack… play sounds without affecting the current run of the
    melody itself."*

    ⚠️ **WHAT IS HELD IS THE CONDITION, NOT THE CLICK.** Whether the loops actually go back on the
    air is `music.setOn` in a browser; what a test can reach is the question the dashboard asks
    before calling it, which is the part that was wrong for a reason rather than by omission.
  */
  const following = new Map<MusicLayer, Held>();
  const desk = (gains: Partial<Record<MusicLayer, number>>): Map<MusicLayer, Held> => {
    const map = new Map<MusicLayer, Held>();
    for (const [layer, gain] of Object.entries(gains)) map.set(layer as MusicLayer, { gain, pan: null });
    return map;
  };

  it('EVERY ONE-CLICK AUDITION IS AUDIBLE WITH THE TRANSPORT STOPPED — all twenty-three, in all seven places', () => {
    /*
      ⚠️ **THE END-TO-END CLAIM, BUILT THE WAY `auditionOnly` BUILDS IT.** One layer at the loudest
      this place takes it and the other twenty-two pinned at zero is exactly the desk a click leaves
      behind (0130), and this asserts that state satisfies the condition for putting the loops on the
      air. The reported gesture is *click drive, sub or whatever* with the music stopped; a version
      of this feature that needed a second gesture for some layer or some level would be 0130's own
      *three gestures is what was wrong with it*, arriving again.
    */
    for (const theme of THEME_KINDS) {
      for (const only of MUSIC_LAYERS) {
        /*
          ⚠️ **AN OWN SLOT THIS PLACE HAS NOT FILLED IS NOT A LAYER IT CAN AUDITION** —
          `docs/decisions/0188-a-place-owns-four-slots.md`. The four carry no instrument until a
          place states one, so *all twenty-three, in all seven places* means every layer that exists
          HERE. `voicesOf` is the test, so the moment a place fills a slot the desk has to reach it
          exactly like the other nineteen.
        */
        if (OWN_LAYERS.includes(only) && voicesOf(theme, only).length === 0) continue;
        const held = new Map<MusicLayer, Held>();
        for (const layer of MUSIC_LAYERS) {
          held.set(layer, { gain: layer === only ? loudestGain(theme, layer) : 0, pan: null });
        }
        expect(deskSounds(held), `${theme}/${only} is auditioned and would still be silent`).toBe(true);
      }
    }
  });

  it('0165 — AND SO IS ONE FADER ON ITS OWN, which is the assertion this guard used to make backwards', () => {
    /*
      ⚠️ **THIS ASSERTION WAS `toBe(false)` AND ITS COMMENT WAS RIGHT ABOUT THE WRONG THING** —
      `docs/decisions/0165-the-desk-sounds-what-you-raise.md`. It read: *"A layer with no hold follows
      the ladder, so a transport restarted for one dragged fader plays the whole piece."* True of the
      code as it stood, and an argument against **layers following while stopped** rather than against
      putting the loops on the air — which is what `deskTarget` below now settles.

      ⚠️ **AND THE COST OF HAVING IT BACKWARDS WAS THE MOST COMMON GESTURE ON A MIXER.** Driven in a
      browser: stopped, one fader up, `GainNode` reading 1.55, sources stopped, nothing audible and a
      readout saying otherwise. Reported as *"upping the gain does nothing to make it play"*.
    */
    expect(deskSounds(desk({ drive: 0.9 })), 'one fader dragged up is a thing to hear').toBe(true);
  });

  it('and a desk holding nothing, or holding everything at zero, is silence rather than air', () => {
    expect(deskSounds(following), 'nothing is held, so there is nothing the desk would sound').toBe(false);
    const silent = new Map<MusicLayer, Held>();
    for (const layer of MUSIC_LAYERS) silent.set(layer, { gain: 0, pan: null });
    expect(deskSounds(silent), 'every layer is pinned at zero — there is nothing to hear').toBe(false);
  });

  it('0165 — NOTHING FOLLOWS THE LEVEL WHILE THE LEVEL STANDS STILL, which is what makes the above safe', () => {
    /*
      ⚠️ **THE HALF THAT REPLACES 0137's REFUSAL.** `deskSounds` may only be *something is held above
      zero* if an unheld layer is silent while stopped; otherwise 0137's objection stands and one
      dragged fader starts the whole piece. The two assertions are one rule and are deliberately in
      one test — splitting them would let a later change satisfy either alone.
    */
    const loud = { gain: 1.2, pan: null };
    const free = { gain: null, pan: null };
    expect(deskTarget(free, 0.86, true), 'walking, unheld: the level owns it').toBe(0.86);
    expect(deskTarget(free, 0.86, false), 'stopped, unheld: the level is not playing').toBe(0);
    expect(deskTarget(loud, 0.86, false), 'stopped, held: the desk owns it').toBe(1.2);
    expect(deskTarget(loud, 0.86, true), 'walking, held: the desk still outranks the level — 0129').toBe(1.2);
    // Zero is a value a desk may hold, and it is not the same as following.
    expect(deskTarget({ gain: 0, pan: null }, 0.86, true), 'walking, pinned at zero: silent, not 0.86').toBe(0);
  });
});

describe('0138 — a section boundary is a distance you can drag', () => {
  /*
    `docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md`. Reported: *"I'd love it if
    we could make the run section that has the push, surge, approach sections slideable so that I can
    drag them to start sooner or end sooner and see what effect that has."*
  */
  it('PASSING NOTHING IS THE SHIPPED LEVEL, so every other guard here is still about the game', () => {
    /*
      ⚠️ **THE FIRST THING TO HOLD, BECAUSE EVERYTHING ELSE IN THIS FILE DEPENDS ON IT.** Nine
      assertions above call `momentOf` and `marksOf` with four arguments and mean *the game as
      shipped*; a default that had drifted would make all of them quietly about something else.

      ⚠️ **AND THE DEFAULT IS THE LEVEL'S OWN NOW, WHICH IS WHY THIS RUNS OVER ALL SEVEN** — 0158.
      It used to be `SECTION_UNITS`, one answer for every level, so a single comparison stood for the
      lot; a script is per level, so a default that read the wrong level's would be invisible to any
      one of them.
    */
    for (const kind of LEVEL_KINDS) {
      expect(marksOf(kind, FIGHT), `${kind}`).toEqual(marksOf(kind, FIGHT, LEVELS[kind].sections));
    }
  });

  it('A DRAGGED BOUNDARY IS WHERE THE LADDER TURNS OVER, to the second the camera crosses it', () => {
    /*
      ⚠️ **STATED IN SECONDS, WHICH IS WHAT THE PLAYER IS LOOKING AT** —
      `docs/decisions/0027-measure-the-picture-not-the-model.md` wants at least one assertion in the
      units the thing is experienced in, and a strip is read in seconds. The whole feature is the
      claim that dropping the handle at a place makes the section start there; anything less is a
      slider that moves a number nobody can hear.

      ⚠️ **AND THE ANSWER IS ASKED OF `musicLevelFor` RATHER THAN OF THE RIG**, so this cannot pass
      by the dashboard agreeing with itself — the guard `THE RUNG IS THE GAME'S ANSWER` has stood
      over that since 0126 and this is its dragged twin.
    */
    const kind = 'approach';
    const { bossAt, sections } = LEVELS[kind];
    /*
      ⚠️ **INDEX 2 IS `surge` AND THE DISTANCE IS NOW *INTO THE LEVEL* RATHER THAN *BACK FROM THE
      BOSS*** — 0158. Each value below is a legal place for it: between `push` and `approach`, a bar
      clear of both. Dragging it PAST a neighbour is a different claim and `NO DRAG CAN REORDER A
      SCRIPT` is where that is held; here the boundary is asked to land where it was put.
    */
    for (const surge of [1400, 2000, 2534, 3400]) {
      const at = dragSection(sections, 2, surge, bossAt);
      expect(at[2]!.at, `surge asked for ${surge} was clamped, so this is not testing a landing`).toBe(surge);
      const crossesAt = surge / UNITS_PER_SECOND;
      const mark = marksOf(kind, FIGHT, at).find((m) => m.rung === 'surge');
      expect(mark, `surge at ${surge} units never happens`).toBeDefined();
      // The camera is walked at a sixty-fourth of a second, so the mark is the first sample past it.
      expect(mark!.second, `surge dragged to ${surge} units`).toBeCloseTo(crossesAt, 1);
      expect(momentOf(kind, crossesAt + 0.5, FIGHT, 0, at).rung).toBe('surge');
      expect(momentOf(kind, crossesAt - 0.5, FIGHT, 0, at).rung).toBe('push');
    }
  });

  it('and the coverage table follows the drag, because a shorter section is a layer that says less of itself', () => {
    /*
      ⚠️ **THE MEASUREMENT 0126 BUILT IS THE ONE A DRAG IS FOR.** *`surge` lasts 16.0 seconds and the
      layer it opens takes 25.6 to say itself* is why `passes` exists; a strip that moved the
      boundary while the passes table went on describing the shipped one would be answering the
      question with the old number still on screen.
    */
    const { bossAt, sections } = LEVELS.approach;
    // Earlier into the level is a LONGER surge now: the section runs from here to `approach`.
    const wide = layerSpans('approach', FIGHT, dragSection(sections, 2, 1400, bossAt)).find((s) => s.layer === 'counter')!;
    const narrow = layerSpans('approach', FIGHT, dragSection(sections, 2, 3400, bossAt)).find((s) => s.layer === 'counter')!;
    expect(narrow.longest, 'a surge dragged later gives counter less room, and the table has to say so').toBeLessThan(
      wide.longest,
    );
  });

  it('NO DRAG CAN REORDER A SCRIPT, move entry zero, or make a section shorter than its own ramp', () => {
    /*
      ⚠️ **A SCRIPT IS AN ORDERING AND NOT A SET OF NUMBERS.** `musicLevelFor` walks it and breaks at
      the first entry the camera has not reached, so an entry dragged past the next one does not make
      a long section — it deletes the next one from the level silently, and the strip would go on
      drawing a section the ladder no longer reaches.

      ⚠️ **AND THE FLOOR IS ONE BAR, IN THE PLAYER'S UNITS.** 0117 starts the ramp on the next bar
      line after the crossing, so a section narrower than a bar can be entered and left before its
      own ramp begins: two rung changes, nothing heard between them.

      ⚠️ **ENTRY `0` IS THE THIRD CLAIM AND IT IS NEW** — 0158. A level's music starts where the
      level starts, and a first entry dragged off `0` would leave the opening stretch answered by
      `musicLevelFor`'s fallback rather than by the level's own script.
    */
    const { bossAt, sections } = LEVELS.approach;
    for (let index = 0; index < sections.length; index++) {
      for (const units of [-9000, -1, 0, 40, 700, 1700, 3000, 4300, 6000, 99999]) {
        const at = dragSection(sections, index, units, bossAt);
        // A bar of scroll is 57.6 units and binary floating point subtracts it to 57.59999999999991.
        const floor = SECTION_FLOOR_UNITS - 1e-6;
        const why = `entry ${index} → ${units}`;
        expect(at.length, `${why} changed how many sections there are`).toBe(sections.length);
        expect(at[0]!.at, `${why} moved the opening section off zero`).toBe(0);
        for (let i = 1; i < at.length; i++) {
          expect(at[i]!.at - at[i - 1]!.at, `${why}: entry ${i} sits on top of the one before it`).toBeGreaterThanOrEqual(
            floor,
          );
        }
        expect(at[at.length - 1]!.at, `${why}: the last section runs past the whole level`).toBeLessThanOrEqual(
          bossAt - SECTION_FLOOR_UNITS + 1e-6,
        );
        // Every entry it was not asked to move is left exactly where it was, name and all.
        at.forEach((entry, i) => {
          expect(entry.section, `${why} renamed entry ${i}`).toBe(sections[i]!.section);
          if (i !== index) expect(entry.at, `${why} moved entry ${i}`).toBe(sections[i]!.at);
        });
      }
    }
  });

  it('and the floor is a BAR of scroll, derived rather than typed', () => {
    expect(SECTION_FLOOR_UNITS).toBeCloseTo(BAR_SECONDS * SCROLL_PER_STEP * STEPS_PER_SECOND, 10);
  });

  it('0163 — A RENAME MOVES NOTHING, and entry zero may be renamed because that is the whole feature', () => {
    /*
      ⚠️ **`docs/decisions/0163-the-script-is-edited-here.md`.** *"Some levels kick right into a
      surge"* is a change of WHICH SECTION IS FIRST, which no drag can express — so a rename has to
      reach entry 0, the one entry every other operation refuses to touch.

      ⚠️ **AND IT NEEDS NO CLAMP**, which is worth asserting rather than assuming: the distances are
      untouched, and 0158 freed the names of order entirely. A script may name `surge` first, twice,
      or never.
    */
    const { sections } = LEVELS.approach;
    for (let index = 0; index < sections.length; index++) {
      for (const name of SECTION_NAMES) {
        const out = retypeSection(sections, index, name);
        expect(out[index]!.section, `entry ${index} did not become ${name}`).toBe(name);
        expect(
          out.map((e) => e.at),
          `renaming entry ${index} to ${name} moved a distance`,
        ).toEqual(sections.map((e) => e.at));
        out.forEach((entry, i) => {
          if (i !== index) expect(entry.section, `renaming entry ${index} changed entry ${i}`).toBe(sections[i]!.section);
        });
      }
    }
    // The opening section is renameable — a level that opens at its loudest is the point of 0163.
    expect(retypeSection(sections, 0, 'surge')[0]!.section, 'a level cannot be made to open at surge').toBe('surge');
  });

  it('0163 — AN ADD LANDS MIDWAY AND REFUSES RATHER THAN SQUEEZING when there is no room', () => {
    /*
      ⚠️ **REFUSING IS THE DESIGNED ANSWER AND NOT A MISSING FEATURE.** The alternative to refusing is
      shuffling the neighbours, which moves boundaries the author did not ask to move — silently, to
      make room for one they did. **An unchanged script is what lets the panel grey the button out.**
    */
    const { bossAt, sections } = LEVELS.approach;
    for (let index = 0; index < sections.length; index++) {
      const out = addSectionAfter(sections, index, bossAt);
      const next = index + 1 < sections.length ? sections[index + 1]!.at : bossAt;
      const room = next - sections[index]!.at >= SECTION_FLOOR_UNITS * 2;
      if (!room) {
        expect(out, `entry ${index} had no room and the script changed anyway`).toEqual(sections);
        continue;
      }
      expect(out.length, `entry ${index} did not gain a section`).toBe(sections.length + 1);
      const added = out[index + 1]!;
      expect(added.at, `the new entry is not between ${sections[index]!.at} and ${next}`).toBeGreaterThan(
        sections[index]!.at,
      );
      expect(added.at, `the new entry is not between ${sections[index]!.at} and ${next}`).toBeLessThan(next);
      // Ascending, and every gap still at least a floor — the same property a drag is held to.
      for (let i = 1; i < out.length; i++) {
        expect(out[i]!.at - out[i - 1]!.at, `adding after ${index} left entries ${i - 1} and ${i} too close`).toBeGreaterThanOrEqual(
          SECTION_FLOOR_UNITS - 1e-6,
        );
      }
    }
    // A gap of exactly one floor has nowhere legal inside it, so the add is refused.
    const tight = [{ at: 0, section: 'run' }, { at: SECTION_FLOOR_UNITS, section: 'push' }] as const;
    expect(addSectionAfter(tight, 0, 4270), 'a one-floor gap was split anyway').toEqual(tight);
  });

  it('0163 — A REMOVE REFUSES ENTRY ZERO, because something has to answer for the opening stretch', () => {
    /*
      ⚠️ **OTHERWISE `musicLevelFor`'s FALLBACK ANSWERS**, which is the one thing 0158 took out of that
      function. Every other entry may go, including the last — a level with one section is a level that
      holds one arrangement, and `docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md` is why
      nothing objects to that.
    */
    const { sections } = LEVELS.approach;
    expect(removeSection(sections, 0), 'the opening section was removed').toEqual(sections);
    for (let index = 1; index < sections.length; index++) {
      const out = removeSection(sections, index);
      expect(out.length, `entry ${index} did not go`).toBe(sections.length - 1);
      expect(out[0]!.at, 'the script no longer opens at zero').toBe(0);
      expect(
        out.map((e) => `${e.section}@${e.at}`),
        `removing ${index} changed something else`,
      ).toEqual(sections.filter((_, i) => i !== index).map((e) => `${e.section}@${e.at}`));
    }
    // Down to one entry, which is legal, and then it stops.
    let down: LevelSections = sections;
    while (down.length > 1) down = removeSection(down, down.length - 1);
    expect(down.length, 'a script could not be reduced to a single section').toBe(1);
    expect(removeSection(down, 0), 'the last section was removed, leaving nothing to answer').toEqual(down);
  });

  it('EVERY CALL UNDER src/ PASSES THE LEVEL’S OWN SCRIPT — the shape of a level is decided in one place', () => {
    /*
      ⚠️ **HELD ON `gainOf`'s OWN TERMS** (0126), AND IT IS 0138's GUARD INVERTED RATHER THAN
      DROPPED. While the three distances were shared and `musicLevelFor` defaulted them, the claim
      could be *nobody under `src/` passes a fifth argument at all* — so this counted arguments.
      0158 makes the script a required argument that every call site must supply, so counting proves
      nothing and the EXPRESSION is what carries the claim: a shipped caller that built its own list
      would make where a section begins a thing decided in two places, and `src/content/levels.ts`
      would stop being the whole story of a level's shape.

      ⚠️ **IT READS THE ARGUMENT RATHER THAN LOOKING FOR A WORD**, which is the distinction 0116 paid
      for: a scan that only checked `sections` appeared somewhere in the file would be green over one
      that imported it and passed something else.

      ⚠️ **AND IT IS A STRICTER CLAIM THAN THE ONE IT REPLACES.** *At most four arguments* was
      satisfied by any call that stayed short; this names the only expression allowed, so a literal,
      a local, or another level's row all fail.
    */
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts')) {
          const source = readFileSync(resolve(root, path), 'utf8');
          for (const args of callArgsOf(source, 'musicLevelFor')) {
            // Its own declaration reads as four named parameters; a call site names three or four.
            if (path === 'src/app/music.ts') continue;
            const script = args[2]?.trim() ?? '';
            if (!/^[A-Za-z_$][\w$.]*\.sections$/.test(script)) {
              offenders.push(`${path} (passes \`${script}\`)`);
            }
          }
        }
      }
    };
    walk('src');
    expect(offenders, `these decide where a section begins for themselves: ${offenders.join(', ')}`).toEqual([]);
  });
});

/**
 * The source with comments and string literals blanked out.
 *
 * ⚠️ **A COMMA INSIDE A COMMENT IS NOT AN ARGUMENT, AND THIS FILE'S SUBJECT IS FULL OF THEM.**
 * `src/app/mount.ts` explains its fourth argument to `musicLevelFor` in an eight-line block comment
 * between two of them; a splitter that counted its commas read that call as eight arguments. Found
 * by the guard below going red on its first run, which is the direction a source scan should fail in.
 */
function bare(source: string): string {
  let out = '';
  let at = 0;
  while (at < source.length) {
    const two = source.slice(at, at + 2);
    if (two === '//') {
      const end = source.indexOf('\n', at);
      at = end === -1 ? source.length : end;
      continue;
    }
    if (two === '/*') {
      const end = source.indexOf('*/', at + 2);
      at = end === -1 ? source.length : end + 2;
      continue;
    }
    const ch = source[at]!;
    if (ch === '"' || ch === "'" || ch === '`') {
      for (at++; at < source.length && source[at] !== ch; ) at += source[at] === '\\' ? 2 : 1;
      at++;
      continue;
    }
    out += ch;
    at++;
  }
  return out;
}

/** The argument lists of every call to `name` in `source`, split at bracket depth zero. */
function callArgsOf(text: string, name: string): string[][] {
  const source = bare(text);
  const out: string[][] = [];
  const pattern = new RegExp(`\\b${name}\\s*\\(`, 'g');
  for (let hit = pattern.exec(source); hit !== null; hit = pattern.exec(source)) {
    let depth = 1;
    let at = hit.index + hit[0].length;
    let current = '';
    const args: string[] = [];
    for (; at < source.length && depth > 0; at++) {
      const ch = source[at]!;
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
      if (depth === 0) break;
      if (ch === ',' && depth === 1) {
        args.push(current.trim());
        current = '';
      } else current += ch;
    }
    if (current.trim() !== '') args.push(current.trim());
    out.push(args);
  }
  return out;
}

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

  it('0162 — NOTHING UNDER src/ OR rig/ READS THE SHARED LADDER, because a place may differ from it', () => {
    /*
      ⚠️ **HELD ON `gainOf`'s OWN TERMS** — 0126, and it is the third scan in this file for the same
      reason. Eight things need *what is this layer doing at this rung of this level*, and every one of
      them used to write `MUSIC_LADDER[rung][layer]` for itself. **That was safe while the answer was
      the same everywhere.** `docs/decisions/0162-a-place-has-its-own-ladder.md` makes it per place, so
      a call site that forgot is an instrument reporting a mix nobody hears — which
      `docs/decisions/0116-the-rig-plays-the-level.md` has now been paid for twice.

      ⚠️ **`rig/` IS SCANNED AS WELL AS `src/`, WHICH THE OTHER TWO SCANS DO NOT DO.** The mix and the
      field are the shell's business and the dashboard is allowed its own opinion about a fader; *what
      the ladder says* is not an opinion, and a coverage table read off the shared row would describe a
      level nobody plays.

      ⚠️ **AND `tests/pace.ts` IS SCANNED NOW, BECAUSE IT WAS THE ONE THAT MATTERED** —
      `docs/decisions/0184-the-measurement-reads-the-place.md`. This scan walked where the GAME reads
      the ladder and never where the MEASUREMENT does, and `heardAt` — the arithmetic under 0164's
      role floor, `weigh-adrift` and `weigh-heard` — read the shared row for four days. **It is
      named as one file rather than as a directory**: the rest of `tests/` is full of guards whose
      SUBJECT is the shared ladder (0090's additive rule, the arrangement's coverage, `rungIn`'s own
      fallback), and scanning the directory would flag twenty correct lines to catch one wrong one.

      ⚠️ **`scripts/` IS STILL NOT SCANNED, AND THAT EXCLUSION IS NOW A DEBT RATHER THAN A DESIGN.**
      `scripts/hear.mjs` has modes whose SUBJECT is the base composition — `--music` writes the
      shared ladder at every rung with no place applied, which is the whole point of that mode — and it
      also had **one read that was simply wrong**, in a mode that resolves every gain through the place
      and then counted with the shared row. 0184 fixed it **by hand**, which is what an unscanned
      directory costs.
    */
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts')) {
          // `rungOf`'s own declaration is the one permitted read, and it lives in this file.
          if (path === 'src/content/themes.ts') continue;
          // Comments blanked first — 0138's own lesson, and this file's subject is prose full of it.
          if (/MUSIC_LADDER\s*\[/.test(bare(readFileSync(resolve(root, path), 'utf8')))) offenders.push(path);
        }
      }
    };
    walk('src');
    walk('rig');
    /*
      ⚠️ **ONE FILE FROM `tests/`, AND `walk` CANNOT EXPRESS THAT** — 0184. It takes a directory and
      recurses; the claim here is about a single shared measurement library, so it is checked
      directly. A guard that had to grow a directory-walker to say *this one file* would be a guard
      built for a rule nobody stated.
    */
    const MEASUREMENT = 'tests/pace.ts';
    if (/MUSIC_LADDER\s*\[/.test(bare(readFileSync(resolve(root, MEASUREMENT), 'utf8')))) offenders.push(MEASUREMENT);
    expect(
      offenders,
      `these read the shared ladder rather than the place's: ${offenders.join(', ')} — use rungOf`,
    ).toEqual([]);

    /*
      ⚠️ **AND `rungOf` ROUTES BY THE PLACE IT WAS ASKED ABOUT, HELD AS A SCAN BECAUSE A VALUE CANNOT
      SEE IT YET.** `node scripts/prove-guard.mjs 0162` replaced `THEMES[theme].ladder` with
      `THEMES.approach.ladder` and every value-level assertion stayed GREEN — with all seven `ladder`
      fields absent, reading the wrong place's table gives the right answer for all of them.

      ⚠️ **IT IS THIN AND IT IS THE ONLY THING AVAILABLE, WHICH 0162 RECORDS AS A DEBT.** The moment
      one place states a ladder, the honest version of this is a value comparison and this scan should
      be replaced by it rather than kept alongside. Same species as 0158's `.sections` argument scan,
      and it exists for the same reason: an expression is checkable when a number is not.
    */
    /*
      ⚠️ **RE-AIMED BY 0163 AT THE DEFAULT PARAMETER, WHICH IS WHERE THE ROUTING CLAIM MOVED.**
      `rungOf` took the ladder as an argument so the desk could drive one, so the body is now
      `rungIn(ladder, …)` and the *which place* decision is the default: `= THEMES[theme].ladder`.
      Same claim, one line over — and it is still a scan for the same reason 0162 recorded, that with
      every shipped `ladder` absent a value comparison cannot tell the wrong place from the right one.
    */
    /*
      ⚠️ **AND THE PATTERN DOES NOT MENTION THE PARAMETER'S TYPE, BECAUSE `bare` BLANKS IT.** The
      declaration reads `ladder: ThemeRow['ladder'] = THEMES[theme].ladder`, and the blanking that
      makes this scan safe against comments also empties that string literal — so a pattern spelling
      the type out fails on a completely correct file. **The load-bearing half is the default**, and
      that is all this matches. Found by the guard going red on its own subject, which is the
      direction 0138 says a source scan should fail in.
    */
    const themes = bare(readFileSync(resolve(root, 'src/content/themes.ts'), 'utf8'));
    expect(
      /=\s*THEMES\[theme\]\.ladder\s*,/.test(themes),
      '`rungOf` does not default to `THEMES[theme].ladder` — it is reading a place it was not asked about',
    ).toBe(true);
  });

  it('THE FADER REACHES WHAT THE MIXER ALREADY PLAYS, or maxing it turns the layer DOWN', () => {
    /*
      ⚠️ **THE REPORTED ONE.** Said of Ember Nebula, 2026-08-16: *"Listening with both arp sliders
      maxed, I can still barely hear it."* `arp` ships at **1.66** at `push` there and the desk's
      ceiling was a typed **1.50** — so dragging the fader to its top **cut the layer by 0.9 dB**
      while the reader expected a boost, and the conclusion drawn from it was about the music.

      ⚠️ **125 LAYER-RUNGS SHIPPED ABOVE IT**, the loudest 1.73× the fader's top. The constant's own
      comment claimed it sat *"above the ladder's own top, on purpose"* — true of `MUSIC_LADDER`
      alone, and false from the moment 0147 gave every place a multiplier. **It was right when it was
      written and silently wrong afterwards, which is the failure 0126 exists against and the reason
      this guard reads the constant out of the file rather than trusting a second copy of it.**

      ⚠️ **THE FLOOR IS *reaches*, NOT *doubles*.** `rig/dash.ts` derives twice the loudest gain
      because a desk has to be able to ask *what if this were twice as loud*; what must never be true
      again is a fader that cannot express what the game already does.
    */
    let loudest = 0;
    let who = '';
    for (const rung of MUSIC_LEVELS) {
      for (const theme of THEME_KINDS) {
        for (const layer of MUSIC_LAYERS) {
          const gain = rungOf(theme, rung, layer) * mixOf(theme, layer);
          if (gain > loudest) {
            loudest = gain;
            who = `${theme}/${rung}/${layer}`;
          }
        }
      }
    }
    expect(loudest, 'no layer reaches anything, so this measured nothing').toBeGreaterThan(0);
    /*
      ⚠️ **THE CONSTANT IS IMPORTED, NOT RE-DERIVED.** A guard that recomputed the ceiling the way the
      rig computes it would pass on any pair of matching formulas, including two that are both wrong —
      which is `docs/decisions/0116-the-rig-plays-the-level.md`'s own finding about asserting on a
      rig's source rather than its values. This walks the CONTENT tables and holds the rig's number
      against them.
    */
    expect(
      DESK_CEILING,
      `the desk tops out at ${DESK_CEILING.toFixed(2)} and ${who} ships at ${loudest.toFixed(2)} — maxing that fader turns the layer DOWN`,
    ).toBeGreaterThanOrEqual(loudest);
    expect(LOUDEST_SHIPPED, 'the rig disagrees with the tables about the loudest gain').toBeCloseTo(loudest, 6);
  });
});
