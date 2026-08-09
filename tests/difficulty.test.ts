import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import {
  DIFFICULTIES,
  DIFFICULTY_KINDS,
  MULTI_HIT_DIAL,
  type DifficultyKind,
  fireGapFor,
  toughnessFor,
} from '../src/content/difficulty.ts';
import { FIRE_GRID, STEPS_PER_BEAT, nextOnGrid } from '../src/content/music.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { phaseFor } from '../src/app/boss.ts';
import { SCREENS, STEPS_PER_SECOND } from '../src/state/screens.ts';
import { ASSIST_KNOBS } from '../src/sim/assist.ts';
import { initialState, reduce, type Action, type State } from '../src/state/root.ts';
import { livesFor } from '../src/state/slices/run.ts';
import { GameFrame } from '../src/app/frame.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { playableWorld } from './world.ts';

/**
 * DIFFICULTY IS A TIER, AND THE EASY ONE IS THE CONTENT.
 *
 * `docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md`. Asked for: three
 * tiers, with *"the current flow as Easy"* and the middle one tuned so an average player reaches
 * level four and no further.
 *
 * ⚠️ **Nothing here asserts on a VALUE.** Every number in `src/content/difficulty.ts` is a play-test
 * number on the same terms as `SHIP_SPEED` and the boss health — placed by a hand, settled by
 * playing. What is held below are the relationships that have to be true whatever those numbers turn
 * out to be, plus the one identity the request itself states: the easiest tier changes nothing.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

/** Consecutive pairs, easiest first. The list IS the ordering — there is no second table. */
const PAIRS: [DifficultyKind, DifficultyKind][] = DIFFICULTY_KINDS.slice(0, -1).map((kind, i) => [
  kind,
  DIFFICULTY_KINDS[i + 1]!,
]);

describe('0096 — everything that shoots at the player plays along', () => {
  /*
    `docs/decisions/0096-the-enemies-play-along.md`. Asked for in play: *"it's going to be tricky, but
    if we can balance the enemies and enemy fire into the rhythm as well that'd be sick."*

    ⚠️ **0093 put the PLAYER's gun on the grid and this is the other side of the field.** The
    difference is that a ship's cadence is a ladder of note values a hand chose, and an enemy's is a
    tuned number a level designer reached by feel — `src/content/shots.ts` says nothing may assert on
    those — so what is guarded here is that they land on the grid, never what they are.
  */
  it('THE ASK: every authored cadence is a whole number of grid units', () => {
    for (const kind of ENEMY_KINDS) {
      const gap = ENEMIES[kind].fireEvery;
      // ⚠️ Zero is a row that does not shoot, which `src/content/enemies.ts` says is a row and not a
      // second entity type. It is not off the grid; it is not on it.
      if (gap === 0) continue;
      expect(gap % FIRE_GRID, `${kind} fires every ${gap} steps, which is off the grid`).toBe(0);
    }
    for (const kind of BOSS_KINDS) {
      for (const [i, phase] of BOSSES[kind].phases.entries()) {
        expect(
          phase.fireEvery % FIRE_GRID,
          `${kind} phase ${i} fires every ${phase.fireEvery} steps, which is off the grid`,
        ).toBe(0);
      }
    }
  });

  it('and the DIFFICULTY MULTIPLIER cannot take them off it, which is the step that would', () => {
    /*
      ⚠️ **THE WHOLE DECISION TURNS ON THIS ONE LINE.** Every cadence in the content tables is on the
      grid and every one of them is multiplied before it is used — and 0.7 of a grid value is not a
      grid value. A tier would silently take content that was carefully in time and put all of it back
      off the beat, with the guard above still green.
    */
    for (const tier of DIFFICULTY_KINDS) {
      for (const kind of ENEMY_KINDS) {
        if (ENEMIES[kind].fireEvery === 0) continue;
        const gap = fireGapFor(ENEMIES[kind].fireEvery, DIFFICULTIES[tier]);
        expect(gap % FIRE_GRID, `${kind} on ${tier} fires every ${gap} steps, off the grid`).toBe(0);
        expect(gap, `${kind} on ${tier} fires faster than the grid allows`).toBeGreaterThanOrEqual(FIRE_GRID);
      }
      for (const kind of BOSS_KINDS) {
        for (const phase of BOSSES[kind].phases) {
          const gap = fireGapFor(phase.fireEvery, DIFFICULTIES[tier]);
          expect(gap % FIRE_GRID, `${kind} on ${tier} fires every ${gap} steps, off the grid`).toBe(0);
        }
      }
    }
  });

  it('and a body FIRST fires on the grid too, because a period on it is not a shot on it', () => {
    /*
      ⚠️ **0094's lesson arriving at the other end of the field.** Snapping a cadence makes a body keep
      a musical tempo; where its shots land still depends on the step it spawned on, and a dozen
      bodies at correct periods and arbitrary offsets is a smear rather than a rhythm.

      ⚠️ **Driven over every spawn step in a whole bar**, because the failure this catches is exactly
      the one that only shows at some offsets — a body that spawns on a grid position was always going
      to be fine, which is how a spot check would miss it.
    */
    for (const gap of [FIRE_GRID, 48, 66, 78]) {
      for (let steps = 0; steps < STEPS_PER_BEAT * 4; steps++) {
        const fires = steps + nextOnGrid(steps, gap);
        expect(fires % FIRE_GRID, `a body spawned at step ${steps} with a gap of ${gap} fires at ${fires}`).toBe(0);
      }
    }
  });

  it('and a body never waits LONGER than its own cadence to open fire', () => {
    /*
      ⚠️ **The alignment is a nudge and must not become a delay.** Quantising forward is the obvious
      way to write this and it would make every body on the field open fire up to a grid unit LATE —
      a change to how quickly a wave becomes dangerous, which is a balance number nobody asked to
      move. It nudges earlier instead, by less than one sixteenth.

      ⚠️ **THIS IS ABOUT THE SHARE OF ZERO, AND 0098 IS WHY THE DISTINCTION EXISTS** —
      `docs/decisions/0098-a-wave-plays-a-figure.md`. A body's place in its own cadence is what stops
      a formation firing as one volley, and N bodies at one cadence **cannot** be at N phases while
      every one of them waits within a grid unit of it. The two rules are incompatible; what survives
      is the direction. The test below is the half that still holds absolutely.
    */
    for (const gap of [FIRE_GRID, 48, 66, 78]) {
      for (let steps = 0; steps < STEPS_PER_BEAT * 4; steps++) {
        const wait = nextOnGrid(steps, gap);
        expect(wait, `a body with a gap of ${gap} waits ${wait} steps at spawn, which is longer`).toBeLessThanOrEqual(
          gap,
        );
        expect(wait, `a body with a gap of ${gap} waits ${wait} steps, which is more than a grid early`).toBeGreaterThan(
          gap - FIRE_GRID,
        );
      }
    }
  });

  it('0098 — and a SHARE only ever delays a body, so nothing becomes dangerous sooner than it was', () => {
    /*
      ⚠️ **The half of the rule above that survives a spread, and it is the half that was load-bearing.**
      0096's argument was never *within one grid unit* for its own sake — it was *no body opens fire
      sooner than it used to*, because that is the balance number. A share moves a body LATER, by
      whole grid units, and never past one more cadence.

      ⚠️ **Driven over every share a wave of up to eight can produce**, not over a handful: the shares
      are `(i + index) / count`, so a wave of seven produces sevenths and a wave of five fifths, and
      the floor inside `nextOnGrid` is where an off-by-one would live.
    */
    for (const gap of [FIRE_GRID, 48, 66, 78]) {
      for (let steps = 0; steps < STEPS_PER_BEAT * 4; steps += 5) {
        const zero = nextOnGrid(steps, gap);
        for (let count = 1; count <= 8; count++) {
          for (let i = 0; i < count; i++) {
            const wait = nextOnGrid(steps, gap, i / count);
            expect(
              wait,
              `a body at share ${i}/${count} with a gap of ${gap} opens fire ${zero - wait} steps SOONER than it used to`,
            ).toBeGreaterThanOrEqual(zero);
            expect(
              wait,
              `a body at share ${i}/${count} with a gap of ${gap} waits ${wait} steps, over a whole extra cadence`,
            ).toBeLessThanOrEqual(zero + gap - FIRE_GRID);
            expect((steps + wait) % FIRE_GRID, `a body at share ${i}/${count} fires off the grid`).toBe(0);
          }
        }
      }
    }
  });

  it('0098 — and a wave of members at different shares does not fire as one volley', () => {
    /*
      ⚠️ **THE DEFECT, stated over the arithmetic.** *"The enemies all fire at exactly the same time
      when they appear"* — reported against the build 0096 landed in, where `nextOnGrid` was handed
      the same `steps` and the same `gap` for every member of a formation and so returned the same
      answer. This is the assertion that would have gone red on the day 0096 shipped.

      ⚠️ **Distinct PHASES, not merely distinct waits.** Two bodies whose first shots are a whole
      cadence apart are in unison for ever afterwards, which is the failure wearing a fix: what has to
      differ is the wait MODULO the cadence.

      ⚠️ **Up to as many members as there are slots**, and no further: a turret's 48-step cadence is
      eight sixteenths, so a wave of ten must double up somewhere and it is not a defect that it does.
    */
    for (const gap of [48, 66, 78]) {
      const slots = gap / FIRE_GRID;
      for (const count of [2, 3, 4, 5]) {
        const phases = new Set<number>();
        for (let i = 0; i < count; i++) phases.add(nextOnGrid(100, gap, i / count) % gap);
        expect(
          phases.size,
          `a wave of ${count} with a gap of ${gap} (${slots} slots) opens fire at ${phases.size} distinct phases`,
        ).toBe(Math.min(count, slots));
      }
    }
  });

  it('and a boss still escalates on every tier, which the grid compresses at the fast end', () => {
    /*
      ⚠️ **STRICTLY FASTER AT THE BASE TIER, NEVER SLOWER AT ANY.** The grid is 100ms and a boss's late
      phases are thirty steps apart before scaling, so at `burn` two of them can land on the same grid
      position — 0096 takes that trade knowingly rather than discovering it. What must never happen is
      a phase that fires SLOWER than the one before it, which would be an escalation running backwards.
    */
    for (const kind of BOSS_KINDS) {
      const base = BOSSES[kind].phases.map((p) => fireGapFor(p.fireEvery, DIFFICULTIES[DIFFICULTY_KINDS[0]!]));
      for (let i = 1; i < base.length; i++) {
        expect(base[i], `${kind} phase ${i} does not fire faster than phase ${i - 1} at the base tier`).toBeLessThan(
          base[i - 1]!,
        );
      }
      for (const tier of DIFFICULTY_KINDS) {
        const gaps = BOSSES[kind].phases.map((p) => fireGapFor(p.fireEvery, DIFFICULTIES[tier]));
        for (let i = 1; i < gaps.length; i++) {
          expect(gaps[i], `${kind} phase ${i} fires SLOWER than phase ${i - 1} on ${tier}`).toBeLessThanOrEqual(
            gaps[i - 1]!,
          );
        }
        expect(gaps[gaps.length - 1], `${kind} does not escalate at all on ${tier}`).toBeLessThan(gaps[0]!);
      }
    }
  });
});

describe('the easiest tier is the content, exactly as authored', () => {
  it('multiplies nothing at all', () => {
    /*
      Asked for in play: *"keep the current flow as Easy."*

      ⚠️ **This is why it is a rule and not a coincidence.** A level author, a play-test report and
      every number in `src/content/levels.ts` are read against one baseline, and the two harder tiers
      are stated as departures from it. If the baseline were the middle tier, *"the level is too
      thin"* would be a sentence with three possible meanings and no way to tell them apart.
    */
    const easiest = DIFFICULTIES[DIFFICULTY_KINDS[0]!];
    expect(easiest.toughness, 'the easiest tier changes how much killing things take').toBe(1);
    expect(easiest.fireGap, 'the easiest tier changes how often things shoot').toBe(1);
    expect(easiest.closing, 'the easiest tier changes how fast things arrive').toBe(1);
    expect(easiest.shotSpeed, 'the easiest tier changes how fast bullets travel').toBe(1);
    // 0073: 'straightforward dog-fighting depending on difficulty' is the play report's own phrase for
    // what the easiest tier gets — the reactive motions at exactly the rate the enemy table authors.
    expect(easiest.aggression, 'the easiest tier changes how hard things chase').toBe(1);
  });

  it('and leaves every body it touches at the numbers its own row states', () => {
    // The identity above, seen through the two helpers rather than through the fields — so a helper
    // that quietly added a constant would fail here even with the table untouched.
    const easiest = DIFFICULTIES[DIFFICULTY_KINDS[0]!];
    for (const kind of ENEMY_KINDS) {
      const row = ENEMIES[kind];
      expect(toughnessFor(row.health, easiest), `${kind} is not its own health on the easiest tier`).toBe(row.health);
      if (row.fireEvery > 0) {
        expect(fireGapFor(row.fireEvery, easiest), `${kind} does not fire at its own rate`).toBe(row.fireEvery);
      }
    }
  });
});

describe('every tier is harder than the one before it', () => {
  it('on every axis at once, and never softer on any of them', () => {
    /*
      ⚠️ **The mirror of `tests/assist.test.ts`'s monotonicity proof, pointing the other way.** The
      assist ladder is proved *never harder*; this is proved *never easier*. Two axes, two
      directions, and neither of them may be expressed in the other's table —
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`.
    */
    for (const [easier, harder] of PAIRS) {
      const a = DIFFICULTIES[easier];
      const b = DIFFICULTIES[harder];
      expect(b.toughness, `${harder} is softer than ${easier}`).toBeGreaterThanOrEqual(a.toughness);
      // Inverted: the field is a GAP between shots, so smaller is faster and therefore harder.
      expect(b.fireGap, `${harder} shoots slower than ${easier}`).toBeLessThanOrEqual(a.fireGap);
      expect(b.closing, `${harder} closes slower than ${easier}`).toBeGreaterThanOrEqual(a.closing);
      expect(b.shotSpeed, `${harder} throws slower bullets than ${easier}`).toBeGreaterThanOrEqual(a.shotSpeed);
      expect(b.aggression, `${harder} chases less than ${easier}`).toBeGreaterThanOrEqual(a.aggression);
      expect(b.lives, `${harder} is more forgiving than ${easier}`).toBeLessThanOrEqual(a.lives);
    }
  });

  it('and differs from it somewhere, so no two tiers are the same game', () => {
    // A tier that changed nothing would be a third button that lies, which is worse than two
    // buttons — `docs/game.md`: an upgrade that cannot change the outcome is worse than none, and
    // the same is true of a choice.
    for (const [easier, harder] of PAIRS) {
      const a = DIFFICULTIES[easier];
      const b = DIFFICULTIES[harder];
      const moved =
        b.toughness !== a.toughness ||
        b.fireGap !== a.fireGap ||
        b.closing !== a.closing ||
        b.shotSpeed !== a.shotSpeed ||
        b.aggression !== a.aggression ||
        b.lives !== a.lives;
      expect(moved, `${harder} plays exactly like ${easier}`).toBe(true);
    }
  });
});

describe('the two helpers cannot produce a body that does not work', () => {
  it('never rounds a living thing down to nothing', () => {
    // A one-health drifter on a tier with toughness below one would be a body with zero health,
    // which dies to nothing at all and reads as a collision bug.
    for (const kind of DIFFICULTY_KINDS) {
      expect(toughnessFor(1, DIFFICULTIES[kind])).toBeGreaterThanOrEqual(1);
      expect(fireGapFor(1, DIFFICULTIES[kind])).toBeGreaterThanOrEqual(1);
    }
  });

  it('makes everything that can be shot take strictly more hits on a tougher tier', () => {
    /*
      ⚠️ **ROUNDING IS WHERE THIS BREAKS SILENTLY, and the first version of this test could not see
      it.** That version asserted *never fewer*, which `Math.floor` satisfies — and under `floor` at
      a toughness of 1.6 the drifter, the weaver and the charger are all unchanged while the warden
      goes from four hits to six. Half the enemies in the game would be identical on a tier that had
      doubled the other half, and nothing would have said so.

      `npm run prove 0047` caught exactly that: the probe swapped `ceil` for `floor` and the suite
      stayed green. Strictly-more is the property that has teeth, and it is true by construction for
      any integer health and any toughness above one.
    */
    for (const [easier, harder] of PAIRS) {
      if (DIFFICULTIES[harder].toughness <= DIFFICULTIES[easier].toughness) continue;
      for (const kind of ENEMY_KINDS) {
        const base = ENEMIES[kind].health;
        expect(
          toughnessFor(base, DIFFICULTIES[harder]),
          `a ${kind} takes the same number of hits on ${harder} as on ${easier}`,
        ).toBeGreaterThan(toughnessFor(base, DIFFICULTIES[easier]));
      }
    }
  });

  it('and never makes something take fewer, whatever the tiers turn out to be', () => {
    /*
      The weaker property, kept alongside the stronger one because it is the one that must hold even
      between two tiers with the SAME toughness — the bosses are walked here and the enemies above.
    */
    for (const [easier, harder] of PAIRS) {
      for (const kind of ENEMY_KINDS) {
        const base = ENEMIES[kind].health;
        expect(
          toughnessFor(base, DIFFICULTIES[harder]),
          `a ${kind} takes fewer hits on ${harder} than on ${easier}`,
        ).toBeGreaterThanOrEqual(toughnessFor(base, DIFFICULTIES[easier]));
      }
      for (const kind of BOSS_KINDS) {
        expect(toughnessFor(BOSSES[kind].health, DIFFICULTIES[harder])).toBeGreaterThanOrEqual(
          toughnessFor(BOSSES[kind].health, DIFFICULTIES[easier]),
        );
      }
    }
  });
});

describe('a boss still opens in its first phase, however tough the tier made it', () => {
  it('reaches every phase at the same fraction of the fight on every tier', () => {
    /*
      ⚠️ **THE BUG THIS TEST EXISTS FOR, and it looked exactly like a longer fight.** A phase is a
      fraction of remaining health, and it used to be a fraction of the ROW's health — so a boss
      scaled to 2.2× read as being at 2.2 of its own health when it spawned, matched no threshold at
      all, and sat in its opening phase for the whole of the health the tier had added. It would then
      escalate normally through the last 150. Half a minute of a boss firing one readable shot every
      one and a half seconds is a picture of a slow fight rather than of a broken one.

      ⚠️ **The first version of this guard asserted only that the boss OPENS in phase one, and
      `npm run prove 0047` showed it stayed green** — because the buggy fraction is *above* every
      `upTo` rather than below it, so the lookup falls through to its default, which is phase one.
      Correct answer, wrong reason, and the whole middle of the fight unmeasured. What is walked now
      is every threshold in the table.
    */
    for (const tier of DIFFICULTY_KINDS) {
      for (const kind of BOSS_KINDS) {
        const row = BOSSES[kind];
        const full = toughnessFor(row.health, DIFFICULTIES[tier]);
        row.phases.forEach((phase, index) => {
          // Just inside this phase's threshold, in health the boss actually has. The phase there is
          // this one, on every tier, because a tier changes how long a fight is and never its shape.
          const health = full * phase.upTo - 0.5;
          if (health <= 0) return;
          expect(phaseFor(row, health, full), `${kind} is not in phase ${index} at ${phase.upTo} on ${tier}`).toBe(
            phase,
          );
        });
        expect(phaseFor(row, full, full), `${kind} does not open in its first phase on ${tier}`).toBe(row.phases[0]);
      }
    }
  });

  it('and still reaches its last phase before it dies', () => {
    for (const tier of DIFFICULTY_KINDS) {
      for (const kind of BOSS_KINDS) {
        const row = BOSSES[kind];
        const full = toughnessFor(row.health, DIFFICULTIES[tier]);
        const last = row.phases[row.phases.length - 1]!;
        expect(phaseFor(row, 1, full), `${kind} never reaches its last phase on ${tier}`).toBe(last);
      }
    }
  });
});

describe('a tier is a property of the run, and never an assist', () => {
  it('is not a knob on the assist ladder', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md` closes that ladder with **no
      assist may ever make the game harder**, and `tests/assist.test.ts` proves the whole product of
      settings monotone against it. Two of these three tiers are unrepresentable there, and the
      tempting mistake is to add a fourth `pace`-like knob that runs the other way — which would
      quietly invalidate that proof for everything already on the ladder.
    */
    for (const knob of ASSIST_KNOBS) {
      expect(String(knob).toLowerCase(), 'a difficulty tier appeared on the assist ladder').not.toContain('difficult');
    }
    const assists = readFileSync(resolve(root, 'src/sim/assist.ts'), 'utf8');
    expect(assists.toLowerCase(), 'the assist ladder has learned about difficulty tiers').not.toContain('difficult');
    for (const kind of DIFFICULTY_KINDS) {
      expect(assists, `the assist ladder names the ${kind} tier`).not.toContain(kind);
    }
  });

  it('travels with a run and survives everything that happens during one', () => {
    /*
      ⚠️ **A run resumed at a different tier would be a different run**, and `docs/game.md` is
      emphatic that the save is an interruption hedge rather than a second chance. Every action a run
      can take is walked, so a new one that forgets to carry the field fails here.
    */
    const during: Action[] = [
      { slice: 'run', type: 'upgraded', upgrade: 'weapon' },
      // ⚠️ `gainedLife` was here and 0082 deleted the action — nothing grants a life any more.
      // `src/state/slices/run.ts` has why, and what it leaves owed to 0039.
      { slice: 'run', type: 'took', special: 'bomb' },
      { slice: 'run', type: 'spent', slot: 0 },
      { slice: 'run', type: 'levelCleared' },
      { slice: 'run', type: 'lifeLost' },
    ];
    for (const tier of DIFFICULTY_KINDS) {
      let state: State = reduce(initialState, { slice: 'run', type: 'begin', difficulty: tier });
      expect(state.run.difficulty, 'a run did not begin on the tier it was given').toBe(tier);
      expect(state.run.lives, 'a run did not start on its tier\'s lives').toBe(livesFor(tier));
      for (const action of during) {
        state = reduce(state, action);
        expect(state.run.difficulty, `${action.type} lost the tier`).toBe(tier);
      }
    }
  });
});

describe('the tier reaches the field, and not only the table', () => {
  /*
    ⚠️ **The real frame, driven — because everything above this point is arithmetic.** A tier that
    resolved perfectly and was never read at the spawn would pass every test written so far, and the
    game would play identically on all three buttons. That is exactly the failure
    `docs/decisions/0027-measure-the-picture-not-the-model.md` is about, one layer down: a model that
    agrees with itself.
  */
  const ONE_WAVE: LevelRow = {
    waves: [{ at: 300, enemy: 'turret', formation: 'line', count: 3, lane: 50 }],
    pickups: [],
    bossAt: Number.POSITIVE_INFINITY,
    boss: 'sentinel',
  };

  /** Drive until the wave is on the field, then report what actually arrived. */
  function firstWave(tier: DifficultyKind): { health: number; closing: number; shotSpeed: number } {
    const { world } = playableWorld(ONE_WAVE, tier);
    /*
      ⚠️ **PAST THE OPENING CLAMP, and this fixture went red the day the dial landed.**
      `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md` holds every enemy to one hit until
      the first level has offered two weapon pickups, so a turret spawned at dial 1 arrives at one
      health **on every tier** — which is the dial working and this test measuring nothing.

      ⚠️ **The two axes deliberately do not commute, and that is the finding rather than the fix.**
      The clamp is a floor on *shots to kill* and it wins over the tier's multiplier while it is on, so
      **the hardest tier is no tougher than the easiest for the opening of level one.** That is
      intended — the report's complaint was a spike *at the start of the game*, and a spike is no less
      of one for having been chosen on the title screen — but it is a real thing about what the three
      buttons do, and nothing else in the repository says it.

      The subject here is the tier, so the fixture turns the dial past the clamp rather than the clamp
      being weakened to suit it. `tests/dial.test.ts` owns the other direction.
    */
    world.weaponsOffered = MULTI_HIT_DIAL;
    const frame = new GameFrame(world);
    // Long enough for the wave to spawn and for a turret to have fired at least once on any tier.
    for (let step = 0; step < 400; step++) frame.step();
    const enemy = world.enemies.at(0);
    const shot = world.enemyShots.size > 0 ? world.enemyShots.at(0) : null;
    // The shot's speed in the CAMERA's frame, which is the one the player watches — `src/app/frame.ts`
    // adds the scroll rate on the way out, so it comes off again here.
    const across = shot === null ? 0 : shot.velAcross;
    const along = shot === null ? 0 : shot.velAlong - world.scrollPerStep;
    return { health: enemy.health, closing: -enemy.velAlong, shotSpeed: Math.sqrt(along * along + across * across) };
  }

  it('spawns tougher, faster bodies that throw faster shots on a harder tier', () => {
    for (const [easier, harder] of PAIRS) {
      const a = firstWave(easier);
      const b = firstWave(harder);
      expect(b.health, `a turret on ${harder} takes no more shots than on ${easier}`).toBeGreaterThan(a.health);
      expect(b.shotSpeed, `a shot on ${harder} is no faster than on ${easier}`).toBeGreaterThan(a.shotSpeed);
      // The turret holds its ground (`closing: 0`), so its closing speed is zero on every tier and a
      // multiplier cannot show. Asserted as *not slower*, which is the property that must hold.
      expect(b.closing, `a turret on ${harder} arrives slower than on ${easier}`).toBeGreaterThanOrEqual(a.closing);
    }
  });

  it('and the easiest tier puts exactly the authored row on the field', () => {
    // The identity, seen through the whole spawner rather than through the helper.
    const easiest = firstWave(DIFFICULTY_KINDS[0]!);
    expect(easiest.health, 'the easiest tier changed the turret the level authored').toBe(ENEMIES.turret.health);
    expect(easiest.shotSpeed).toBeCloseTo(SHOTS[ENEMIES.turret.shot].speed, 5);
  });

  it('makes the boss fight measurably longer, in seconds the player sits through', () => {
    /*
      ⚠️ **The one assertion here written in units the PLAYER experiences** — steps of the fixed
      clock, which is time — rather than in the multipliers the code already agrees about.
      `docs/decisions/0027-measure-the-picture-not-the-model.md` asks for exactly one of these,
      because a guard measuring a quantity defined in terms of the constant it guards proves only
      that the code agrees with itself.

      ⚠️ **The BOSS and not a wave, and the first version was a wave.** A wave leaves the field when
      the camera passes it, so both tiers "cleared" it on the identical step and the assertion was
      measuring the cull. A boss holds station in the camera's frame until it is dead, which makes
      *how long it took* a fact about the fight rather than about the scroll rate.

      The ship holds station and its auto-fire does the rest, so this is the same fight met by the
      same pilot doing the same thing, and the only difference is the tier.
    */
    const bossOnly: LevelRow = { waves: [], pickups: [], bossAt: 300, boss: 'sentinel' };
    const killedAt = (tier: DifficultyKind): number => {
      const { world } = playableWorld(bossOnly, tier);
      const frame = new GameFrame(world);
      for (let step = 0; step < 20_000; step++) {
        frame.step();
        if (world.bossSpawned && world.bossPool.size === 0) return step;
      }
      return Number.POSITIVE_INFINITY;
    };
    const easiest = killedAt(DIFFICULTY_KINDS[0]!);
    const hardest = killedAt(DIFFICULTY_KINDS[DIFFICULTY_KINDS.length - 1]!);
    expect(easiest, 'the boss never died even on the easiest tier').toBeLessThan(20_000);
    expect(hardest, 'the hardest tier killed the boss no slower than the easiest').toBeGreaterThan(easiest);
    // Stated as a duration as well, because *steps* is the unit the code thinks in and *seconds* is
    // the one the player does — and a fight that got one step longer is not a difficulty tier.
    expect((hardest - easiest) / STEPS_PER_SECOND, 'a harder tier bought under a second').toBeGreaterThan(1);
  });
});

describe('the title screen is the choice', () => {
  it('offers every tier, in the table order, easiest first', () => {
    /*
      Built by walking `DIFFICULTY_KINDS` in `src/state/screens.ts`, so a tier added to the table
      appears on the screen without anybody remembering to add it — the same argument
      `src/app/chrome.ts` makes for the pickup key. This is the guard over that walk.

      ⚠️ **The ORDER is asserted, not just the membership.** The names do not sort themselves: *Let
      the Galaxy Burn* is the most attractive of the three and the hardest, so a screen that listed
      them in any other order would mislead a player who reasonably reads top-to-bottom as gentlest-
      to-worst.
    */
    expect(SCREENS.title.actions.map((a) => a.label)).toEqual(DIFFICULTY_KINDS.map((k) => DIFFICULTIES[k].title));
  });

  it('and says which is which, because the titles do not', () => {
    for (const kind of DIFFICULTY_KINDS) {
      const row = DIFFICULTIES[kind];
      expect(row.title.length, `${kind} has no name`).toBeGreaterThan(0);
      expect(row.hint.length, `${kind} does not say what it is`).toBeGreaterThan(0);
    }
    const labels = new Set(DIFFICULTY_KINDS.map((k) => DIFFICULTIES[k].title));
    expect(labels.size, 'two tiers share a name').toBe(DIFFICULTY_KINDS.length);
  });
});
