/**
 * The bullets stay on the screen — `docs/decisions/0259-the-bullets-stay-on-the-screen.md`.
 *
 * Reported from the alpha play: *"the bullet firing waves are still clustered together… there's
 * either a screen full of bullets or there's 30secs of no bullet to be seen at all… not necessarily
 * more bullets on screen, but more time for bullets overall to be on screen."*
 *
 * ⚠️ **Every assertion here is in the player's units** — seconds without a bullet on the screen, a
 * share of the level with one — over the walk `scripts/weigh-bullets.mjs` drives: the real frame,
 * the real spawner, the capped guns, a ship sweeping the lane. The walk is seeded and fixed-step,
 * so it is the same walk on every machine; nothing here reads a wall clock.
 */

import { describe, expect, it } from 'vitest';

import { ENTRY_VOLLEY, FIRE_GRID, SEEN_BEFORE_VOLLEY } from '../src/content/cadence.ts';
import { type DifficultyKind, fireGapFor } from '../src/content/difficulty.ts';
import { ENEMIES, shotsPerVolley } from '../src/content/enemies.ts';
import { LEVELS, LEVEL_KINDS, windowEnd } from '../src/content/levels.ts';
import { GameFrame } from '../src/app/frame.ts';
import { MAX_ALONG_SPAN, spawnAlong } from '../src/sim/camera.ts';
import { SCROLL_PER_STEP } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { weighLevel } from '../scripts/weigh-bullets.mjs';
import { NO_SECTIONS, playableWorld } from './world.ts';

/**
 * The longest a level may go without an enemy bullet on the screen, in seconds, outside the two
 * stretches a decision authored to be quiet.
 *
 * ⚠️ **A BUDGET, AND THE REPORT OWNS THE NUMBER** — 0192. *"30secs of no bullet"* is the complaint;
 * eight is what every level measures under after 0259, with the shoal — the level authored from
 * chargers and drifters for speed — the one that sets it, and the one whose stretch was converted.
 *
 * ── ⚠️ 8 → 9 AT 0338, AND THE BASIS MOVED RATHER THAN THE NUMBER GOING QUIET ────────────────────
 *
 * ⚠️ **THE EIGHT WAS FITTED TO A MEASUREMENT TAKEN WITH A BROKEN SPAWNER.** A flanker was first SEEN
 * two thirds of the way into the screen, so a gun-carrier authored to arrive somewhere arrived next
 * to the player and fired at once. 0338 puts the entry at the front of the screen, and the cost is
 * measured rather than argued:
 *
 * | level | worst held dry, before | after |
 * |---|---|---|
 * | coilward | 3.5s | 5.0s |
 * | **shoal** | **6.1s** | **8.4s** |
 * | gauntlet | 4.3s | 4.8s |
 * | approach, descent, batteries, eye | 13.5 / 5.7 / 3.0 / 5.6 | 13.5 / 5.7 / 2.8 / 5.3 |
 *
 * ⚠️ **AND THE PROOF REFUSED THE FIRST ATTEMPT AT THIS, WHICH IS WHY THE PROBE MOVED WITH IT.** At
 * nine, 0259's own probe stopped firing: its break — the turret line at 3865 back to a charger column
 * — now measures **8.4s**, which is the baseline, because 0338 moved what the baseline is. A budget
 * whose probe can no longer redden it is not a budget
 * (`docs/decisions/0019-a-probe-must-be-seen-to-apply.md`). The probe is **re-aimed** at the sower at
 * 3232, one of 0259's own conversions, which measures **13.9s** — and re-aiming is what that probe has
 * already had done to it once, by 0326, for the same reason.
 *
 * ⚠️ **THE AUTHORING WAY OUT WAS TRIED TWICE AND BOTH ATTEMPTS BROKE SOMETHING ELSE.** Flipping the
 * flanking sower at 3405 to lead moved the measurement by **nothing**; putting station-holders in the
 * two dry stretches closed them and made the shoal's mid-boss fight busier than the stretch before it,
 * which is `0267`'s guard. The level's coverage genuinely leans on flankers arriving close, and
 * re-authoring it is *"when it comes to bullets and enemies, stop assuming, present a plan"* —
 * **offered to the player, not taken here.** Nine, not fifteen: the next regression still argues.
 */
const DRY_BUDGET_SECONDS = 9;

/**
 * The share of the waves' time with a bullet on the screen a level must reach, at the capped
 * loadout.
 *
 * ⚠️ **THREE TENTHS SINCE 0326, FROM TWO FIFTHS, AND THE REPORT OWNS THE MOVE.** 0259 set it under
 * the lowest level (the shoal at 42%). `docs/decisions/0326-an-enemy-is-seen-before-it-fires.md`
 * makes every body wait half a second on the screen before its first volley, and at the capped
 * loadout that half second is the one the sweep spends killing it: the share fell ten to fifteen
 * points in every level, the shoal to 35%. The report chose recognition over the share in as many
 * words — *"enemies need to appear, be recognisable, then fire"* — and the floor is under the
 * lowest again. The stretches are still held at eight seconds; it is the share that was traded.
 */
const COVERED_FLOOR = 0.3;

/**
 * Where level one can first be carrying two tubes — the place its capped walk starts meaning anything.
 *
 * ⚠️ **LEVEL ONE CANNOT CARRY THE CAPPED LOADOUT BEFORE THIS, SO THE CAPPED WALK MEASURES NOTHING
 * REAL THERE** — 0326, on 0280's terms: a quantity is checked in the case it is applied to. Four rungs
 * and two tubes is what a player carries from the SECOND level on, which is what 0259 said the walk
 * was for.
 *
 * ⚠️ **THE TUBES ARE THE HALF OF THAT LEFT, SINCE 0441.** This was level one's second weapon, because
 * the gun was the ladder that was short there. Every ship opens on its whole gun now, so the gun half
 * has no subject; the tubes still climb, and level one offers one at 720 and can offer the second no
 * earlier than its mid-boss, whose drop cycles through a missile. Before that the walk is at the whole
 * gun and one tube; from it on, the capped walk.
 */
const secondTubeOf = (kind: (typeof LEVEL_KINDS)[number]): number =>
  kind === LEVEL_KINDS[0] ? LEVELS[kind].midBoss!.at : Number.NaN;

describe('0259 — the bullets stay on the screen', () => {
  const measured = new Map(LEVEL_KINDS.map((kind) => [kind, weighLevel(kind)] as const));
  const levelOneEarly = weighLevel(LEVEL_KINDS[0], { missileTier: 1 });

  it('THE REPORTED ONE: at the capped loadout, no level goes DRY_BUDGET_SECONDS without a bullet on the screen, outside the opening', () => {
    for (const kind of LEVEL_KINDS) {
      const level = LEVELS[kind];
      const r = measured.get(kind)!;
      expect(r.reachedBoss, `${kind} was never driven to its boss`).toBe(true);
      expect(r.sawBullet, `${kind} never put a bullet on the screen, so this measured nothing`).toBe(true);
      /*
        The opening is the level's own quiet — nothing before 300 (0043) and a view's crossing for the
        first firing body to arrive. Every other dry stretch is the report's.

        ⚠️ **LEVEL ONE'S RUN-UP WAS EXEMPT HERE TOO, AND 0441 TOOK ITS SUBJECT.** It was 0086's: a
        one-health band after the weapon that lifted the one-hit clamp, which by decision could not
        fire. The clamp went with the gun ladder, so nothing authors that stretch quiet any more and it
        is held like every other.
      */
      const opening = level.waves[0]!.at + MAX_ALONG_SPAN;
      /*
        ⚠️ **AND A MID-BOSS'S WINDOW IS A SECOND OPENING — 0502.** *"Leave the gap empty"*: nothing is
        put down for its window after the mid-boss is, so a walk that kills the hull at once — this one
        does — flies the rest of the window with nothing new to fire. It is held exactly as the
        opening is: from the mid-boss's put-down to its window's first wave plus a view's crossing.
        `tests/window.test.ts` holds that the window is no longer than its row says.
      */
      const midBoss = level.midBoss;
      const resumes = midBoss === null ? undefined : level.waves.find((w) => w.at > windowEnd(midBoss, SCROLL_PER_STEP * STEPS_PER_SECOND));
      const windowFrom = midBoss === null ? Number.POSITIVE_INFINITY : midBoss.at - spawnAlong(0);
      const windowTo = resumes === undefined ? Number.NEGATIVE_INFINITY : resumes.at + MAX_ALONG_SPAN;
      const lifts = secondTubeOf(kind);
      const authoredQuiet = (endsAt: number): boolean => endsAt <= opening || (endsAt > windowFrom && endsAt <= windowTo);
      // Level one before it can carry a second tube is the one-tube walk's — see `secondTubeOf`.
      const stretches = Number.isNaN(lifts)
        ? r.dryStretches
        : [...levelOneEarly.dryStretches.filter((s) => s.endsAt < lifts), ...r.dryStretches.filter((s) => s.endsAt >= lifts)];
      const held = stretches.filter((s) => !authoredQuiet(s.endsAt));
      const worst = held.reduce((a, b) => (b.seconds > a.seconds ? b : a), { seconds: 0, endsAt: 0 });
      expect(
        worst.seconds,
        `${kind} goes ${worst.seconds.toFixed(1)}s without a bullet on the screen, ending ${worst.endsAt} units in`,
      ).toBeLessThanOrEqual(DRY_BUDGET_SECONDS);
    }
  });

  it('and a bullet is on the screen for at least COVERED_FLOOR of the waves’ time in every level', () => {
    for (const kind of LEVEL_KINDS) {
      const r = measured.get(kind)!;
      expect(r.wavesCovered, `${kind} has a bullet on the screen ${(r.wavesCovered * 100).toFixed(0)}% of its waves' time`).toBeGreaterThanOrEqual(
        COVERED_FLOOR,
      );
    }
  });

  /**
   * One wave, the ship's guns off, driven until its first `count` volleys leave: when each hull first
   * counted as ENTERED by `entered`, and the step of every volley.
   *
   * ⚠️ **`shortCount` forces every body's reload to one step while it is still outside the view**, so
   * the walk carries a body that is *about to fire anyway* — the case 0259 let through and 0326 holds:
   * a count shorter than the window is pushed out to it, not kept.
   */
  const firstVolleys = (
    wave: (typeof LEVELS)[keyof typeof LEVELS]['waves'][number],
    entered: (e: { along: number; across: number; radius: number }, cameraAlong: number, alongSpan: number) => boolean,
    shortCount: boolean,
  ): { entries: number[]; fired: number[] } => {
    const { world } = playableWorld({
      waves: [wave],
      pickups: [],
      landmarks: [],
      bossAt: Number.POSITIVE_INFINITY,
      midBoss: null,
      sections: NO_SECTIONS,
      boss: 'sentinel',
      theme: 'approach',
    });
    const frame = new GameFrame(world);
    const entries = new Map<number, number>();
    const fired: number[] = [];
    let before = 0;
    for (let step = 0; step < STEPS_PER_SECOND * 30 && fired.length < wave.count; step++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      if (shortCount) {
        for (let i = 0; i < world.enemies.size; i++) {
          const e = world.enemies.at(i);
          if (!entered(e, world.cameraAlong, world.view.alongSpan)) e.fireIn = 1;
        }
      }
      frame.step();
      for (let i = 0; i < world.enemies.size; i++) {
        const e = world.enemies.at(i);
        if (!entries.has(i) && entered(e, world.cameraAlong, world.view.alongSpan)) entries.set(i, step);
      }
      if (world.enemyShots.size > before) fired.push(step);
      before = world.enemyShots.size;
    }
    return { entries: [...entries.values()], fired };
  };

  /** Seconds from the first hull's entry to the first volley — the number the player feels. */
  const seenFor = (r: { entries: number[]; fired: number[] }): number => (r.fired[0]! - Math.min(...r.entries)) / STEPS_PER_SECOND;

  /**
   * How long a body must be on the screen before it fires, in seconds — the number the play owns.
   *
   * ⚠️ **A LITERAL, AND NOT `SEEN_BEFORE_VOLLEY / STEPS_PER_SECOND`, WHICH IS WHAT IT WAS FOR ONE
   * PROBE RUN.** Written as the constant divided by the step rate, the lower bound below is defined in
   * terms of the thing it guards, and `npm run prove` said so: the window set to ZERO stayed green,
   * because zero is not less than zero. `docs/decisions/0027-measure-the-picture-not-the-model.md`
   * names this exactly — *a guard measuring a quantity defined in terms of the constant it guards
   * proves only that the code agrees with itself* — and this is the assertion in the player's units
   * that decision asks for. Half a second, from 0326; a hand that moves the window moves this with
   * it and says why.
   */
  const RECOGNISABLE_SECONDS = 0.5;
  /** The most a body may wait past the window: the entry gap plus its slot in the deal. */
  const LATEST_SECONDS = (SEEN_BEFORE_VOLLEY + 2 * ENTRY_VOLLEY) / STEPS_PER_SECOND;

  it('THE SEEN WINDOW: a body is on the screen for half a second before its first volley, however short its count, and never much longer', () => {
    /*
      ⚠️ **0326 — *"enemies need to appear, be recognisable, then fire."*** A wave of five turrets,
      spawned beyond the view as every leading wave is, every one of them forced to a one-step reload on
      the way in. The first volley leaves no sooner than `SEEN_BEFORE_VOLLEY` after the first hull
      crosses the leading edge — in seconds, because that is the unit the report is in — and no later
      than the window plus the entry gap and the deal, which is 0259's promise kept behind it.
    */
    const r = firstVolleys(
      { at: 400, enemy: 'turret', formation: 'line', count: 5, lane: 50 },
      (e, cameraAlong, alongSpan) => e.along - e.radius <= cameraAlong + alongSpan,
      true,
    );
    expect(r.entries.length, 'no turret ever entered the view').toBe(5);
    expect(r.fired.length, 'the wave never fired five volleys').toBe(5);
    const gap = seenFor(r);
    expect(gap, `the first volley came ${gap.toFixed(2)}s after the first hull entered the view — before it could be recognised`).toBeGreaterThanOrEqual(
      RECOGNISABLE_SECONDS,
    );
    expect(gap, `the first volley came ${gap.toFixed(2)}s after the first hull entered the view — the window is not a reload`).toBeLessThanOrEqual(
      LATEST_SECONDS,
    );
  });

  it('and a body arriving ACROSS the lane is seen for the same half second, measured from its hull entering the lane', () => {
    /*
      ⚠️ **0326's second edge.** 0259's entry was the leading edge along, and a flanker (0048) never
      crosses it inside the lane: `scripts/weigh-presence.mjs` measured level three's seventy
      side-entering lancers at 0.57 volleys a body with half of them silent while visible. A column of
      five lancers from the `acrossMinus` edge: the window runs from the hull entering the lane, and
      the same two bounds hold.
    */
    const r = firstVolleys(
      { at: 400, enemy: 'lancer', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
      (e) => e.across + e.radius >= 0,
      true,
    );
    expect(r.entries.length, 'no lancer ever entered the lane').toBe(5);
    expect(r.fired.length, 'the flanking wave never fired five volleys').toBe(5);
    const gap = seenFor(r);
    expect(gap, `a flanker's first volley came ${gap.toFixed(2)}s after its hull entered the lane`).toBeGreaterThanOrEqual(RECOGNISABLE_SECONDS);
    expect(gap, `a flanker's first volley came ${gap.toFixed(2)}s after its hull entered the lane — it never got an entry at all`).toBeLessThanOrEqual(
      LATEST_SECONDS,
    );
  });

  it('THE ENTRY VOLLEY: a formation still opens as a figure behind the window', () => {
    /*
      A wave of five turrets, spawned beyond the view as every leading wave is: the five do not fire on
      one step, because the deal sits behind the window exactly as it sat behind 0259's entry gap —
      three slots by index until 0499, the wave's turns since.
    */
    const { fired } = firstVolleys(
      { at: 400, enemy: 'turret', formation: 'line', count: 5, lane: 50 },
      (e, cameraAlong, alongSpan) => e.along - e.radius <= cameraAlong + alongSpan,
      false,
    );
    expect(fired.length, 'the wave never fired five volleys').toBe(5);
    expect(new Set(fired).size, `all five fired on ${new Set(fired).size} step(s) — a volley, not a figure`).toBeGreaterThan(1);
    expect(ENTRY_VOLLEY / FIRE_GRID, 'the entry gap has one slot, so a formation would fire in unison').toBeGreaterThanOrEqual(2);
    /*
      ⚠️ **THE DEAL WAS AS WIDE AS A RANK, AND THAT HALF OF THIS GUARD IS DELETED — 0499.** It held
      `ENTRY_SLOTS` at or above the widest rank a firing kind can stand in and the widest call a boss
      makes, because three slots by index could only keep three bodies apart. The deal is a member's
      turn now, taken at the entry from what of the wave has arrived, so ANY width is dealt one turn a
      member and there is no slot count left to hold against a width. What it can still do is put two
      neighbours on one step, when half a reload holds fewer grid slots than the wave has members —
      and that is not a defect: it is the hardest tier with a big wave, and a change that made it so
      would be correct. `docs/decisions/0192-a-guard-holds-an-invariant.md`: demoted in one edit, with
      the reason. The turns themselves are held by the guard below, in seconds.
    */
  });

  /**
   * The first volleys of one wave, flown through its entry with the ship's guns off: the step of every
   * volley, counted at the pool so that a shot culled on the same step cannot hide one.
   */
  const waveVolleys = (
    wave: (typeof LEVELS)[keyof typeof LEVELS]['waves'][number],
    difficulty: DifficultyKind,
  ): { volleys: number[]; reload: number } => {
    const { world } = playableWorld(
      {
        waves: [wave],
        pickups: [],
        landmarks: [],
        bossAt: Number.POSITIVE_INFINITY,
        midBoss: null,
        sections: NO_SECTIONS,
        boss: 'sentinel',
        theme: 'approach',
      },
      difficulty,
    );
    const frame = new GameFrame(world);
    const pool = world.enemyShots;
    const spawn = pool.spawn.bind(pool);
    let shots = 0;
    pool.spawn = () => {
      shots++;
      return spawn();
    };
    const perVolley = shotsPerVolley(ENEMIES[wave.enemy].attack);
    const volleys: number[] = [];
    for (let step = 0; step < STEPS_PER_SECOND * 20 && volleys.length < wave.count * 2; step++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      shots = 0;
      frame.step();
      for (let v = 0; v < shots / perVolley; v++) volleys.push(step);
    }
    return { volleys, reload: fireGapFor(ENEMIES[wave.enemy].fireEvery, world.difficulty) / STEPS_PER_SECOND };
  };

  /**
   * The share of its reload a wave's opening is spread across — **a literal, because the player
   * chose it**: *"spread a wave's members across about half of their reload… so the other half of
   * the reload stays quiet as the gap to move through"* (0499). Not `SWEEP_SHARE`, for 0027's reason
   * written above `RECOGNISABLE_SECONDS`: a bound defined by the constant it guards moves with it.
   */
  const HALF = 0.5;
  /** One grid slot in seconds — the rounding every turn is put through (0096). */
  const SLOT_SECONDS = FIRE_GRID / STEPS_PER_SECOND;

  it('THE WAVE TAKES TURNS: a wave opens fire one body at a time across about half its reload, and the other half is quiet', () => {
    /*
      ⚠️ **0499 — *"they all kind of create an undodgeable wall."*** At Savior, three fixtures, each
      for a reason:

      - **Three wardens abreast** — one rank, entering on one step, where every turn is the deal's and
        none is the formation's. Three slots by index opened it over a fifth of a second.
      - **Six wardens in a line** — the Mire's own wave, two ranks, the second arriving a third of a
        second behind the first. Its opening was already this wide by its geometry; it is here so the
        turns are seen not to stretch it past the half, which the first draft of 0499 did.
      - **Five turrets in a line** — a back pair that arrives past its turns, the case a deal dealt at
        the spawn put on one step.
      - **And six wardens at Legendary**, where the reload is long enough that the front rank's turns
        are still being taken when the back rank arrives: the back waits for them rather than landing
        on the front's last turn. The only fixture here that asks the wave about who went BEFORE.

      Held in seconds, in the player's units: each opening volley on a step of its own; the opening
      spread across at least the share its members' turns take, less a slot; and the wave's NEXT
      volley no sooner than the quiet half of the reload after the opening's last, less a slot.
    */
    for (const [wave, tier] of [
      [{ at: 400, enemy: 'warden', formation: 'line', count: 3, lane: 50 }, 'savior'],
      [{ at: 400, enemy: 'warden', formation: 'line', count: 6, lane: 50 }, 'savior'],
      [{ at: 400, enemy: 'turret', formation: 'line', count: 5, lane: 50 }, 'savior'],
      [{ at: 400, enemy: 'warden', formation: 'line', count: 6, lane: 50 }, 'legendary'],
    ] as const) {
      const name = `${wave.count} ${wave.enemy}s at ${tier}`;
      const { volleys, reload } = waveVolleys(wave, tier);
      expect(volleys.length, `${name} never fired ${wave.count + 1} volleys`).toBeGreaterThan(wave.count);
      const opening = volleys.slice(0, wave.count);
      expect(new Set(opening).size, `${name} opened fire on ${new Set(opening).size} step(s) for ${wave.count} bodies — a wall`).toBe(wave.count);
      const spread = (opening[wave.count - 1]! - opening[0]!) / STEPS_PER_SECOND;
      const turns = ((wave.count - 1) / wave.count) * HALF * reload;
      expect(spread, `${name} opened over ${spread.toFixed(2)}s against turns of ${turns.toFixed(2)}s on a ${reload.toFixed(2)}s reload`).toBeGreaterThanOrEqual(
        turns - SLOT_SECONDS,
      );
      const quiet = (volleys[wave.count]! - opening[wave.count - 1]!) / STEPS_PER_SECOND;
      expect(quiet, `${name} fired again ${quiet.toFixed(2)}s after its opening, inside the quiet half of a ${reload.toFixed(2)}s reload`).toBeGreaterThanOrEqual(
        (1 - HALF) * reload - SLOT_SECONDS,
      );
    }
  });
});
