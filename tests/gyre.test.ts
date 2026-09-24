/**
 * The gyre spins — `docs/decisions/0252-the-gyre-spins.md` — and is **set into the wall**,
 * `docs/decisions/0332-the-gyre-is-set-into-the-wall.md`.
 *
 * The Labyrinth's real boss. 0252's brief: *"an upgraded version of the current end boss of saurian
 * belt — the upgrades are that it will spin and that the bullet walls will have the bullets closer
 * together — the spaceship gaps will be the same size, but the bullet gaps will be close so you
 * can't fit through them. it'll spin and create diagonal, vertical and horizontal gaps to fly
 * through."* 0332's, which is the fight this file now drives:
 *
 * > *"1) upscale the graphics and have it change as it gets more damaged 2) when it appears on
 * > screen I want it 'locked' into the background like a cog set into an image 3) for the section of
 * > it that looks pointed, I want the 'wall of bullets' to come from the direction that that is
 * > facing, when it fires a wall, it ticks around like a cog to point in the next direction — it
 * > currently has 8 points so it'll turn 1/8th every fire and the wall comes from that direction
 * > it's pointing when it next comes. 4) the walls and turns come faster as it gets more hurt."*
 *
 * ⚠️ **EVERY WALL HERE IS CAUGHT OFF A FIGHT THAT WAS FLOWN, NOT OFF A HEALTH THIS FILE COMPUTED.**
 * The gap between two curtains is a ladder now (`Uncoil.quicken`), and a test that worked out where
 * the k-th notch falls would be `uncoilsBy`'s arithmetic agreeing with itself — the failure
 * `docs/decisions/0027-measure-the-picture-not-the-model.md` names. `walls()` bleeds the hull at a
 * steady rate and keeps whatever comes out, in the order it came out.
 *
 * ⚠️ **AND THE DIRECTION IS HELD IN THE BOX THE SHIP FLIES IN**, which is the one unit the player
 * has: where on the edge of their own box a wall first threatens them, against where the cog's
 * spike was aimed while it was coming.
 */

import { describe, expect, it } from 'vitest';
import { advanceLevel, BOSS_DEATH_STEPS, GameFrame } from '../src/app/frame.ts';
import { cogTurn, curtainSpacing, curtainStance, uncoilsBy } from '../src/app/boss.ts';
import { BOSSES, BOSS_KINDS, CURTAIN_STANCES } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHIPS } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS, type DifficultyKind } from '../src/content/difficulty.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD, PLAYER_MARGIN } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { reset } from '../src/sim/entity.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { bodyOf } from './bodies.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The gyre alone, a short way in, with no mid-boss in front of it. */
const GYRE_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'gyre',
  theme: 'labyrinth',
};

type Driven = {
  world: ReturnType<typeof playableWorld>['world'];
  frame: GameFrame;
  /** How many times the level reported itself cleared — 0339. A fixture that never looks counts nothing. */
  cleared: { count: number };
};

/** The gyre on station and whole, its fan held, and an untouchable ship out of the way. */
function gyreOnStation(tier: DifficultyKind = DIFFICULTY_KINDS[0]!): Driven {
  const { world, cleared } = playableWorld(GYRE_ONLY, tier);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the gyre never arrived').toBe(1);
  world.enemyShots.clear();
  return { world, frame, cleared };
}

interface Shot {
  along: number;
  across: number;
  velAlong: number;
  velAcross: number;
}

interface Wall {
  /** Which curtain of the fight this was, counted from zero. */
  k: number;
  shots: Shot[];
  hullAlong: number;
  cameraAlong: number;
  /** The turn the hull was wearing on the step before this wall left — the spike's own aim. */
  aimed: number;
  scroll: number;
}

const gyre = BOSSES.gyre.uncoil!;
const spacing = curtainSpacing(gyre.gap);
const flak = SHOTS[BOSSES.gyre.shot];

/**
 * The first `n` curtains of a fight that was actually flown.
 *
 * The hull is bled at a steady rate with its fan held, so what lands in `enemyShots` is a curtain
 * and nothing else; the ship is held untouchable and parked, because several of these walls cross
 * the whole box and a dying ship ends the drive.
 */
function walls(n: number): Wall[] {
  const { world, frame } = gyreOnStation();
  const boss = world.bossPool.at(0);
  const out: Wall[] = [];
  // Slow enough that two notches never fall on one step, at any rung of the quickening ladder.
  const bleed = world.bossFullHealth / 4000;
  for (let step = 0; step < 6000 && out.length < n && world.bossPool.size > 0; step++) {
    world.enemyShots.clear();
    world.ship.along = world.cameraAlong + PLAYER_LEAD;
    world.ship.across = ACROSS_SPAN / 2;
    world.ship.invulnFor = 999;
    world.ship.health = world.shipRow.health;
    boss.fireIn = 999;
    boss.health = Math.max(1, boss.health - bleed);
    const aimed = boss.turn;
    frame.step();
    if (world.enemyShots.size <= 10) continue;
    // Where the hull and the camera were when the curtain left: the camera had already advanced this
    // step when the boss threw, and the hull had not yet moved.
    const shots: Shot[] = [];
    for (let i = 0; i < world.enemyShots.size; i++) {
      const s = world.enemyShots.at(i);
      // Where it was thrown, not where it is: one step of its own travel undone.
      shots.push({ along: s.along - s.velAlong, across: s.across - s.velAcross, velAlong: s.velAlong, velAcross: s.velAcross });
    }
    out.push({
      k: out.length,
      shots,
      hullAlong: boss.along - boss.velAlong,
      cameraAlong: world.cameraAlong,
      aimed,
      scroll: world.scrollPerStep,
    });
  }
  expect(out.length, `the gyre threw ${out.length} of the ${n} walls asked for`).toBe(n);
  return out;
}

/** The box the ship may fly in, in the camera's frame. */
const BOX = {
  minAlong: PLAYER_ALONG_MARGIN,
  maxAlong: PLAYER_LEAD,
  minAcross: PLAYER_MARGIN,
  maxAcross: ACROSS_SPAN - PLAYER_MARGIN,
};

/**
 * The step at which a shot first enters the player's box, or `null` for one that never does.
 *
 * Camera-relative and analytic: every curtain shot flies a straight line at a constant rate in the
 * camera's frame, so this is one slab intersection per axis and no simulation.
 */
function entersBoxAt(shot: Shot, cameraAlong: number, scroll: number): number | null {
  const slab = (p: number, v: number, lo: number, hi: number): [number, number] | null => {
    if (Math.abs(v) < 1e-9) return p >= lo && p <= hi ? [0, Number.POSITIVE_INFINITY] : null;
    const a = (lo - p) / v;
    const b = (hi - p) / v;
    return a < b ? [a, b] : [b, a];
  };
  const along = slab(shot.along - cameraAlong, shot.velAlong - scroll, BOX.minAlong, BOX.maxAlong);
  const across = slab(shot.across, shot.velAcross, BOX.minAcross, BOX.maxAcross);
  if (along === null || across === null) return null;
  const enter = Math.max(along[0], across[0], 0);
  const leave = Math.min(along[1], across[1]);
  return enter <= leave ? enter : null;
}

describe('0252/0332 — the gyre spins, and is set into the wall', () => {
  it('THE SPIN: eight stances, an eighth of a turn apart, the hull aimed at the next one — and no other wall turns', () => {
    expect(gyre.spin, 'the gyre does not spin').toBe(true);
    expect(CURTAIN_STANCES.length, 'the cog has eight points and the wall does not').toBe(8);
    for (const kind of BOSS_KINDS) {
      const u = BOSSES[kind].uncoil;
      if (u === null || kind === 'gyre') continue;
      expect(u.spin, `${kind}'s wall turns, and the spin is the gyre's upgrade`).toBe(false);
      expect(curtainStance(u.spin, 3), `${kind}'s fourth wall is not across the lane`).toBe('across');
    }
    // Round and round, and round again after that.
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => curtainStance(true, k))).toEqual([
      ...CURTAIN_STANCES,
      CURTAIN_STANCES[0],
      CURTAIN_STANCES[1],
    ]);
    expect(CURTAIN_STANCES[0], 'the first curtain of a fight is not across the lane').toBe('across');
    /*
      ⚠️ **AN EIGHTH OF A TURN A STANCE, AND THE WRAP IS AN EIGHTH TOO.** *"It'll turn 1/8th every
      fire."* Held as the angle BETWEEN consecutive aims rather than as the aims themselves, folded
      the short way — which is the one form in which the wrap from the last point back to the first
      is the same claim as the seven before it.
    */
    const eighth = Math.PI / 4;
    for (let k = 0; k < 16; k++) {
      let delta = cogTurn(k + 1) - cogTurn(k);
      if (delta > Math.PI) delta -= Math.PI * 2;
      else if (delta < -Math.PI) delta += Math.PI * 2;
      expect(delta, `the cog turns ${((delta / Math.PI) * 180).toFixed(1)}° between wall ${k} and wall ${k + 1}`).toBeCloseTo(eighth, 6);
    }
    // *"The bullet gaps will be close so you can't fit through them"*: the room between two
    // neighbouring bullets is under the ship's own width, at the standard hurtbox.
    const room = spacing - 2 * flak.radius;
    expect(room, `a ship ${2 * SHIPS.proof.radius} wide fits between bullets ${room.toFixed(2)} apart`).toBeLessThan(2 * SHIPS.proof.radius);
    // *"The spaceship gaps will be the same size"*: no other wall's hole is wider than this one.
    for (const kind of BOSS_KINDS) {
      const u = BOSSES[kind].uncoil;
      if (u !== null) expect(gyre.hole, `${kind}'s hole is wider than the gyre's`).toBeGreaterThanOrEqual(u.hole);
    }
    expect(LEVELS.shoal.boss).toBe('gyre');
    expect(LEVELS.shoal.theme).toBe('labyrinth');
  });

  it('THE EIGHT WALLS, DRIVEN: each one line with one hole at the same share of it, each spanning a whole axis of the field', () => {
    for (const wall of walls(8)) {
      const { k, shots, hullAlong, cameraAlong, scroll } = wall;
      const stance = curtainStance(gyre.spin, k);
      expect(shots.length, `curtain ${k} (${stance}) was not thrown`).toBeGreaterThan(10);
      // Which way it stands and which way it goes, in the player's units.
      const alongSpan = Math.max(...shots.map((s) => s.along)) - Math.min(...shots.map((s) => s.along));
      const acrossSpan = Math.max(...shots.map((s) => s.across)) - Math.min(...shots.map((s) => s.across));
      const span = hullAlong - cameraAlong;
      switch (stance) {
        case 'across':
          expect(alongSpan, 'the wall across the lane leans').toBeLessThan(0.01);
          expect(acrossSpan, 'the wall across the lane does not span it').toBeGreaterThan(ACROSS_SPAN - spacing - 0.01);
          for (const s of shots) {
            expect(s.velAcross, 'the wall across the lane drifts across it').toBe(0);
            expect(s.velAlong - scroll, 'the wall across the lane does not come down it').toBeLessThan(0);
          }
          break;
        case 'astern':
          /*
            ⚠️ **THE ONE WALL IN THE GAME THAT COMES FROM BEHIND — 0332.** Laid behind the camera's
            trailing edge, so it is off the screen on the step it is thrown, and coming UP the lane
            slower than any other wall: `and the wall from astern can be beaten to its hole` is where
            the *slower* is held in seconds and a ship.
          */
          expect(alongSpan, 'the wall from astern leans').toBeLessThan(0.01);
          expect(acrossSpan, 'the wall from astern does not span the lane').toBeGreaterThan(ACROSS_SPAN - spacing - 0.01);
          for (const s of shots) {
            expect(s.along, 'the wall from astern starts on the screen').toBeLessThan(cameraAlong);
            expect(s.velAlong - scroll, 'the wall from astern does not come up the lane').toBeGreaterThan(0);
            expect(s.velAcross, 'the wall from astern drifts across the lane').toBe(0);
          }
          break;
        case 'slant':
        case 'backslant': {
          expect(acrossSpan, `the ${stance} does not span the lane`).toBeGreaterThan(ACROSS_SPAN - spacing - 0.01);
          expect(alongSpan, `the ${stance} does not lean a lane's width along it`).toBeGreaterThan(ACROSS_SPAN - spacing - 0.01);
          // Corner to corner: along rises with across for the slant, falls for the backslant, from the hull.
          const sign = stance === 'slant' ? 1 : -1;
          for (const s of shots) {
            const expected = hullAlong + sign * (s.across - (stance === 'slant' ? 0 : ACROSS_SPAN));
            expect(s.along, `a shot of the ${stance} is off its line`).toBeCloseTo(expected, 3);
            expect(s.velAcross, `the ${stance} drifts across the lane`).toBe(0);
          }
          break;
        }
        case 'alongNear':
        case 'alongFar':
          expect(alongSpan, `the ${stance} does not run from the camera’s edge to the hull`).toBeGreaterThan(span - spacing - 0.01);
          expect(acrossSpan, `the ${stance} leans`).toBeLessThan(0.01);
          for (const s of shots) {
            const outside = stance === 'alongNear' ? s.across <= 0 : s.across >= ACROSS_SPAN;
            expect(outside, `the ${stance} starts inside the lane`).toBe(true);
            expect(Math.sign(s.velAcross), `the ${stance} does not fall across the lane`).toBe(stance === 'alongNear' ? 1 : -1);
            expect(s.velAlong, `the ${stance} slides along the lane`).toBeCloseTo(scroll, 6);
          }
          break;
        case 'rakeNear':
        case 'rakeFar': {
          /*
            ⚠️ **A RAKE IS THE EDGE WALL TILTED INTO THE MARGIN**, so its trailing end crosses the
            lane's edge before its leading one and the wall sweeps up the lane as it falls. Held as
            *it leans* and *the shallow end is the trailing one* — the second is what makes it a
            corner rather than a second copy of the edge wall beside it.
          */
          expect(alongSpan, `the ${stance} does not run from the camera’s edge to the hull`).toBeGreaterThan(span - spacing - 0.01);
          expect(acrossSpan, `the ${stance} does not tilt into the margin`).toBeGreaterThan(20);
          const near = stance === 'rakeNear';
          const depthOf = (s: Shot): number => (near ? -s.across : s.across - ACROSS_SPAN);
          const byAlong = [...shots].sort((a, b) => a.along - b.along);
          expect(
            depthOf(byAlong[0]!),
            `the ${stance}'s trailing end is the deep one, so it crosses the lane last`,
          ).toBeLessThan(depthOf(byAlong[byAlong.length - 1]!));
          for (const s of shots) {
            expect(Math.sign(s.velAcross), `the ${stance} does not fall across the lane`).toBe(near ? 1 : -1);
            expect(s.velAlong, `the ${stance} slides along the lane`).toBeCloseTo(scroll, 6);
          }
          break;
        }
        default: {
          const never: never = stance;
          throw new Error(never);
        }
      }
      /*
        One line: measured from its own foot, every neighbour is `spacing` apart but one — the hole,
        of the authored width, at the authored share of the line's length. The foot is whichever end
        the switch in `src/app/boss.ts` laid first, which is the one the shots are nearest to.
      */
      const foot = shots.reduce((a, b) => (a.along < b.along || (a.along === b.along && a.across < b.across) ? a : b));
      const far = shots.reduce((a, b) => (Math.hypot(a.along - foot.along, a.across - foot.across) > Math.hypot(b.along - foot.along, b.across - foot.across) ? a : b));
      const length = Math.hypot(far.along - foot.along, far.across - foot.across);
      const s = shots.map((x) => Math.hypot(x.along - foot.along, x.across - foot.across)).sort((a, b) => a - b);
      let holes = 0;
      let centre = 0;
      let width = 0;
      for (let i = 1; i < s.length; i++) {
        const gap = s[i]! - s[i - 1]!;
        if (gap <= spacing + 0.001) continue;
        holes++;
        centre = (s[i]! + s[i - 1]!) / 2;
        width = gap;
      }
      expect(holes, `curtain ${k} (${stance}) has ${holes} holes in it`).toBe(1);
      expect(width, `curtain ${k}'s hole is ${width.toFixed(1)} wide against the ${gyre.hole} authored`).toBeGreaterThanOrEqual(gyre.hole - spacing);
      /*
        ⚠️ **THE SAME SHARE OF THE LINE EVERY TIME, WHICH IS WHAT MAKES ONE PATTERN OUT OF EIGHT
        WALLS.** The line is measured end to end here rather than taken from the row, so the share is
        read off the curtain the fight threw; `length` is a shot short of the whole line at each end,
        which is what the spacing in the tolerance pays for.
      */
      const expected = (gyre.at / ACROSS_SPAN) * (length + spacing);
      expect(
        Math.abs(centre - expected),
        `curtain ${k} (${stance})'s hole sits ${centre.toFixed(1)} along a line of ${length.toFixed(1)} and the row's share puts it at ${expected.toFixed(1)}`,
      ).toBeLessThan(spacing * 2);
    }
  });

  it('and the wall comes from the edge the spike is aimed at, measured on the box the ship flies in', () => {
    /*
      ⚠️ **THE ASK, AND THE ONE CLAIM THE WHOLE FIGHT IS READ OFF:** *"I want the wall of bullets to
      come from the direction that that is facing… the wall comes from that direction it's pointing
      when it next comes."*

      ⚠️ **HELD WHERE THE PLAYER IS RATHER THAN WHERE THE SHOTS ARE SPAWNED —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`.** A spawn point is a model quantity
      and a wall laid off the screen has several; what the player experiences is which SIDE OF THEIR
      OWN BOX the thing arrives over. So: find the moment each shot first enters the box, take those
      that arrive in the first tenth of a second of it, and hold that the mean of where they enter is
      on the side of the box's middle that the cog's spike was aimed at.

      ⚠️ **A GUARD THAT COULD NOT FAIL WOULD BE THE COMMON DEFECT HERE**, so it is stated as a
      signed projection rather than as a set of cases: swap any two of the eight stances and the sign
      goes the wrong way for both of them.
    */
    const centreAlong = (BOX.minAlong + BOX.maxAlong) / 2;
    const centreAcross = (BOX.minAcross + BOX.maxAcross) / 2;
    for (const wall of walls(8)) {
      const { k, shots, cameraAlong, aimed, scroll } = wall;
      const stance = curtainStance(gyre.spin, k);
      // The spike's own direction, in world units: the turn the hull was wearing, undone.
      const spikeAlong = Math.cos(aimed);
      const spikeAcross = Math.sin(aimed);
      expect(
        Math.abs(aimed - cogTurn(k)),
        `the hull was aimed at ${aimed.toFixed(2)} when wall ${k} (${stance}) left and its stance is aimed at ${cogTurn(k).toFixed(2)}`,
      ).toBeLessThan(0.02);
      let first = Number.POSITIVE_INFINITY;
      const times: (number | null)[] = shots.map((s) => entersBoxAt(s, cameraAlong, scroll));
      for (const t of times) if (t !== null && t < first) first = t;
      expect(Number.isFinite(first), `no shot of curtain ${k} (${stance}) ever reaches the player's box`).toBe(true);
      let sumAlong = 0;
      let sumAcross = 0;
      let count = 0;
      for (let i = 0; i < shots.length; i++) {
        const t = times[i]!;
        if (t === null || t > first + STEPS_PER_SECOND / 10) continue;
        const s = shots[i]!;
        sumAlong += s.along - cameraAlong + (s.velAlong - scroll) * t;
        sumAcross += s.across + s.velAcross * t;
        count++;
      }
      expect(count, `curtain ${k} (${stance}) arrives one shot at a time`).toBeGreaterThan(0);
      const reach = ((sumAlong / count - centreAlong) * spikeAlong + (sumAcross / count - centreAcross) * spikeAcross);
      expect(
        reach,
        `curtain ${k} (${stance}) first threatens the box ${reach.toFixed(1)} units on the WRONG side of the spike, which ` +
          `was aimed at (${spikeAlong.toFixed(2)}, ${spikeAcross.toFixed(2)})`,
      ).toBeGreaterThan(0);
    }
  });

  it('and the wall from astern can be beaten to its hole, from the worst corner of the box', () => {
    /*
      ⚠️ **THE ONE WALL THE PLAYER CANNOT SEE COMING, SO IT IS THE ONE THAT HAS TO BE DRIVEN.** 0252
      refused a wall from behind on the grounds that nothing had ever come from there; 0332 takes it
      because the cog has been aimed at that edge since the wall before, and what the ask buys is a
      tell rather than a shorter wall. **The debt that comes with it is reachability**, and it is paid
      here rather than in arithmetic: a live ship starts at the back of its box on the far edge from
      the hole, flies flat out, and is not caught.

      ⚠️ **AND THE SAME SHIP STANDING STILL IS CAUGHT**, or this would be a guard about a wall that
      is not a wall.

      ⚠️ **DRIVEN AT `burn` AND NOT AT THE TIER THE CONTENT IS AUTHORED ON, AND A PROBE IS WHY.** At
      `legendary` the ship crosses to the hole in about three quarters of a second and the wall
      would take forty-three hundredths even at the bullet's own speed — so the first form of this
      stayed GREEN with `ASTERN_SHARE` broken to 1, which is a guard that cannot fail. `burn` scales
      `shotSpeed` by 1.3 and scales nothing the ship does; it is the tier where the number is
      load-bearing, and a fairness floor that only holds on the easy tier is not one.
    */
    expect(DIFFICULTIES.burn.shotSpeed, 'burn is not the fastest tier, so this drives the wrong one').toBe(
      Math.max(...DIFFICULTY_KINDS.map((k) => DIFFICULTIES[k].shotSpeed)),
    );
    const run = (fly: boolean): { hit: boolean; at: number; across: number } => {
      const { world, frame } = gyreOnStation('burn');
      const boss = world.bossPool.at(0);
      const bleed = world.bossFullHealth / 4000;
      let thrown = -1;
      // The hole's across on a wall that stands across the lane is the row's own `at`, and the far
      // corner from it is whichever lane edge is further away.
      const start = gyre.at < ACROSS_SPAN / 2 ? ACROSS_SPAN - PLAYER_MARGIN : PLAYER_MARGIN;
      /*
        Flat out for the hole and then held there, through the same seam a device drives — the
        ship's own inertia and the ship's own top speed, never a position written each step.

        ⚠️ **IT EASES OFF NEAR THE HOLE RATHER THAN HOLDING THE STICK OVER.** A first draft pushed
        one direction until the wall arrived, crossed the lane in ninety steps — comfortably in
        time — and flew straight past the opening into the far edge, where it was hit. That is a
        test flying badly rather than a wall being unfair, and the distinction is the whole of what
        this guard is for.
      */
      world.input = {
        contribute: (intent) => {
          intent.along = 0;
          const err = gyre.at - world.ship.across;
          intent.across = !fly ? 0 : err > 6 ? 1 : err < -6 ? -1 : err / 6;
        },
        spend: () => {},
        release: () => {},
      };
      for (let step = 0; step < 6000 && world.bossPool.size > 0; step++) {
        if (thrown < 0) {
          // Up to the astern wall: the ship is parked in its corner and cannot be touched.
          world.ship.along = world.cameraAlong + PLAYER_ALONG_MARGIN;
          world.ship.across = start;
          world.ship.velAcross = 0;
          world.ship.invulnFor = 999;
          world.ship.health = world.shipRow.health;
          world.enemyShots.clear();
          boss.fireIn = 999;
          boss.health = Math.max(1, boss.health - bleed);
          frame.step();
          const k = world.bossUncoilAt - 1;
          if (k >= 0 && curtainStance(gyre.spin, k) === 'astern' && world.enemyShots.size > 10) thrown = step;
          continue;
        }
        // And then it is on its own: live, mortal, and flying for the hole as hard as it can.
        world.ship.invulnFor = 0;
        boss.fireIn = 999;
        const before = world.ship.health;
        frame.step();
        if (world.ship.health < before || world.dyingIn > 0) {
          return { hit: true, at: step - thrown, across: world.ship.across };
        }
        if (step > thrown + 8 * STEPS_PER_SECOND) return { hit: false, at: step - thrown, across: world.ship.across };
      }
      throw new Error('the gyre never threw the wall from astern');
    };
    const still = run(false);
    expect(still.hit, `a ship that sat still at ${still.across.toFixed(1)} was missed by the wall from astern, so it is not a wall`).toBe(true);
    const flown = run(true);
    expect(
      flown.hit,
      `a ship flying flat out from the worst corner of its box was caught ${(flown.at / STEPS_PER_SECOND).toFixed(2)} s after the ` +
        `wall from astern was thrown, at ${flown.across.toFixed(1)} across against a hole at ${gyre.at}`,
    ).toBe(false);
  });

  it('and the wall along the lane is a wall: a ship holding its hole’s along is passed over, one a hole’s width away is hit', () => {
    /*
      *"Vertical gaps to fly through."* Driven twice on the near edge's wall, which lies along the
      lane and falls across it: a ship holding the hole's along on the screen is not touched as it
      passes, and one holding a hole's width further along is, before the wall has crossed the lane.
    */
    const alongWall = walls(7)[6]!;
    expect(curtainStance(gyre.spin, alongWall.k), 'the seventh wall is not the one along the near edge').toBe('alongNear');
    const along = alongWall.shots.map((s) => s.along).sort((a, b) => a - b);
    let holeAlong = -1;
    for (let i = 1; i < along.length; i++) {
      if (along[i]! - along[i - 1]! > spacing + 0.001) holeAlong = (along[i]! + along[i - 1]!) / 2;
    }
    expect(holeAlong, 'the wall along the lane has no hole').toBeGreaterThan(0);
    const offsetInView = holeAlong - alongWall.cameraAlong;

    const run = (offsetFromHole: number): number => {
      const { world, frame } = gyreOnStation();
      const boss = world.bossPool.at(0);
      const bleed = world.bossFullHealth / 4000;
      let thrown = -1;
      for (let step = 0; step < 6000 && world.bossPool.size > 0; step++) {
        world.ship.along = world.cameraAlong + offsetInView + offsetFromHole;
        world.ship.velAlong = world.scrollPerStep;
        world.ship.across = ACROSS_SPAN / 2;
        world.ship.velAcross = 0;
        world.ship.health = world.shipRow.health;
        boss.fireIn = 999;
        if (thrown < 0) {
          world.ship.invulnFor = 999;
          world.enemyShots.clear();
          boss.health = Math.max(1, boss.health - bleed);
          frame.step();
          const k = world.bossUncoilAt - 1;
          if (k >= 0 && curtainStance(gyre.spin, k) === 'alongNear' && world.enemyShots.size > 10) thrown = step;
          continue;
        }
        world.ship.invulnFor = 0;
        const before = world.ship.health;
        frame.step();
        if (world.ship.health < before || world.dyingIn > 0) return step - thrown;
        if (step > thrown + 300) return -1;
      }
      return -1;
    };
    expect(run(0), 'a ship holding the hole’s along was hit by the wall along the lane').toBe(-1);
    const hitAt = run(gyre.hole);
    expect(hitAt, 'a ship beside the hole was not hit by the wall along the lane, so it is not a wall').toBeGreaterThan(0);
    const crossing = ACROSS_SPAN / 2 / flak.speed / STEPS_PER_SECOND;
    expect(hitAt / STEPS_PER_SECOND, `the wall reached mid-lane ${(hitAt / STEPS_PER_SECOND).toFixed(1)} s after it was thrown`).toBeLessThan(crossing + 1);
  });

  it('THE WALLS QUICKEN: each gap is smaller than the last down to the row’s floor, and the cog goes round twice', () => {
    /*
      ⚠️ **ASKED FOR**: *"the walls and turns come faster as it gets more hurt."*

      ⚠️ **HELD AS A LADDER OF GAPS IN HEALTH, READ OFF `uncoilsBy` RATHER THAN OFF THE ROW.** The
      row says `by` and `least`; what the fight does with them is the notch counter, and this walks
      the bar from full to empty and records where the count steps up. A gap that did not shrink, or
      a floor that was not honoured, or a ladder that ran away, all show here.
    */
    const quicken = gyre.quicken;
    if (quicken === null) throw new Error('the gyre’s wall does not quicken');
    const full = BOSSES.gyre.health;
    const at: number[] = [];
    let last = uncoilsBy(gyre, full, full);
    for (let i = 1; i <= 20000; i++) {
      const health = full * (1 - i / 20000);
      const now = uncoilsBy(gyre, health, full);
      if (now > last) at.push(1 - health / full);
      last = now;
    }
    expect(at.length, `the gyre throws ${at.length} walls over a whole bar`).toBeGreaterThanOrEqual(16);
    const gaps = at.slice(1).map((d, i) => d - at[i]!);
    expect(gaps.length, 'there is nothing to compare').toBeGreaterThan(4);
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i]!, `gap ${i} is wider than gap ${i - 1}, so the walls are slowing down`).toBeLessThanOrEqual(gaps[i - 1]! + 1e-3);
    }
    expect(Math.min(...gaps), 'a gap fell below the floor the row authored').toBeGreaterThan(quicken.least - 1e-3);
    expect(
      gaps[gaps.length - 1]! * 2,
      `the last gap is ${gaps[gaps.length - 1]!.toFixed(3)} of the bar against the first's ${gaps[0]!.toFixed(3)} — that is not faster`,
    ).toBeLessThan(gaps[0]!);
    /*
      ⚠️ **AND THE OTHER TWO WALLS IN THE GAME ARE UNTOUCHED**, which is what makes this the gyre's
      escalation rather than every uncoiler's: a flat ladder is still flat.
    */
    for (const kind of BOSS_KINDS) {
      const u = BOSSES[kind].uncoil;
      if (u === null || kind === 'gyre') continue;
      expect(u.quicken, `${kind}'s wall quickens, and that is the gyre's upgrade`).toBeNull();
      const flat = BOSSES[kind].health;
      expect(uncoilsBy(u, flat * (u.from - u.every * 3 - 0.001), flat), `${kind}'s flat ladder moved`).toBe(4);
    }
  });

  it('SET INTO THE WALL: the hull takes its seat and then holds it, and the housing is drawn behind it', () => {
    /*
      ⚠️ **ASKED FOR**: *"when it appears on screen I want it 'locked' into the background like a cog
      set into an image."* Driven for half a minute of the real fight: it reaches the lane's centre,
      and after that it does not move across the lane at all — not by a patrol, not by a phase, not
      by a drift along it.

      ⚠️ **AND THE HOUSING IS AN ENTITY IN THE LAYER BEHIND THE HULL, AT THE HULL'S OWN PLACE.** A
      seat drawn anywhere else is a ring the cog is not in, which is the whole of what the ask is
      about.
    */
    const move = BOSSES.gyre.move;
    if (move.kind !== 'socket') throw new Error('the gyre is not set into anything');
    expect(BOSSES.gyre.drift, 'the gyre drifts along the lane, so it is not set into anything').toBe(0);
    const { world, frame } = gyreOnStation();
    const boss = world.bossPool.at(0);
    /*
      ⚠️ **SHOVED OFF ITS SEAT FIRST, OR THE ARM IS NEVER DRIVEN.** A boss arrives at the lane's
      centre, which is where this one's seat is, so a fight flown from the start would hold *it did
      not move* about a hull that was never asked to. Displaced to the near edge, what is measured is
      the arm doing its job: closing at the row's rate and stopping dead on the number.
    */
    boss.across = 10;
    let seated = -1;
    let wander = 0;
    let stationSwing = 0;
    let firstAlong = Number.NaN;
    for (let i = 0; i < 60 * 30 && world.bossPool.size > 0; i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 999;
      frame.step();
      if (world.bossPool.size === 0) break;
      if (seated < 0 && Math.abs(boss.across - move.at) < 0.01) {
        seated = i;
        firstAlong = boss.along - world.cameraAlong;
      }
      if (seated >= 0) {
        wander = Math.max(wander, Math.abs(boss.across - move.at));
        stationSwing = Math.max(stationSwing, Math.abs(boss.along - world.cameraAlong - firstAlong));
      }
    }
    expect(seated, 'the gyre never reached its seat').toBeGreaterThan(0);
    expect(seated / STEPS_PER_SECOND, `the gyre took ${(seated / STEPS_PER_SECOND).toFixed(1)} s to settle into its seat`).toBeLessThan(6);
    expect(wander, `the gyre moved ${wander.toFixed(2)} units across the lane after taking its seat`).toBeLessThan(0.01);
    expect(stationSwing, `the gyre slid ${stationSwing.toFixed(2)} units along the lane after taking its seat`).toBeLessThan(0.5);
    // The housing: one entity, behind the hull, wearing the row's own bitmap and standing where the hull stands.
    expect(world.bossAura.size, 'the gyre has no housing behind it').toBe(1);
    const seat = world.bossAura.at(0);
    expect(seat.sprite, 'the housing is not the bitmap the row names').toBe(move.seat);
    expect(seat.along, 'the housing is not where the hull is').toBeCloseTo(boss.along, 6);
    expect(seat.across, 'the housing is not where the hull is').toBeCloseTo(boss.across, 6);
    expect(world.layers.indexOf(world.bossAura), 'the housing is drawn in front of the hull').toBeLessThan(
      world.layers.indexOf(world.bossPool),
    );
    // Bigger than the cog, or there is no mounting to see round it.
    expect(SPRITE_EXTENT[SPRITE_KINDS[move.seat]!], 'the housing is no bigger than the cog in it').toBeGreaterThan(
      SPRITE_EXTENT[SPRITE_KINDS[BOSSES.gyre.sprite]!]!,
    );
    /*
      ⚠️ **ONE POOL, SO ONE THING IN IT.** `layAura` draws a serpent's flames and a gyre's housing
      out of the same layer, which is right — they are the same question — and is only safe while no
      row authors both. A row that did would lose one of them silently, and the picture would be the
      only place that said so.
    */
    for (const kind of BOSS_KINDS) {
      if (BOSSES[kind].move.kind !== 'socket') continue;
      for (const phase of BOSSES[kind].phases) {
        expect(phase.look?.aura ?? null, `${kind} is set into the wall AND burns, and one layer holds both`).toBeNull();
      }
    }
  });

  it('THE ROOM: the world comes to rest for the fight, and starts again when it is won', () => {
    /*
      ⚠️ **ASKED FOR**: *"I want the cog to be part of the wall and stationary on arrival, and the
      background map to have walls on the top, bottom and right side to represent labyrinth walls, and
      the background map to stop moving — you've found the boss and are fighting it in a specific
      room."* — `docs/decisions/0335-the-fight-happens-in-a-room.md`.

      ⚠️ **HELD AS *THE CAMERA*, BECAUSE THE CAMERA IS THE WORLD.** Everything the player watches
      holds station in the camera's frame (0034), so *the background map stops moving* and *the camera
      comes to rest* are one claim — and the camera is the one of the two a guard can read. What is
      driven is a real fight from a real level, not a fixture: the walk in, the stop, the whole fight,
      and the start again.
    */
    const room = BOSSES.gyre.room;
    if (room === null) throw new Error('the gyre is not fought in a room');
    /*
      ⚠️ **THE FILE'S OWN LEVEL AND NOT `LEVELS.shoal`, WHICH IS A COST RATHER THAN A CHOICE.** The
      shoal puts its fight four thousand units in — two minutes of scrolling before the first
      assertion could be made, and a mid-boss to get past first. `GYRE_ONLY` is the same frame, the
      same spawner and the same row, with the fight a few seconds in.
    */
    const { world } = playableWorld(GYRE_ONLY);
    const frame = new GameFrame(world);
    const rest = GYRE_ONLY.bossAt - room.stand;
    let moving = 0;
    let stopped = 0;
    let stoppedAt = -1;
    let restarted = -1;
    let killedAt = -1;
    // Where it came to rest, caught on the step it stopped — the camera moves again afterwards.
    let restedAt = Number.NaN;
    for (let step = 0; step < 60 * STEPS_PER_SECOND; step++) {
      world.ship.health = 1e6;
      world.ship.invulnFor = 999;
      // The mid-boss is not what this is about; it is put down so the fight under test arrives.
      if (world.bossPool.size > 0 && world.fight === 0) world.bossPool.at(0).health = 1;
      // And the gyre is killed once the world has been still for a while, so the other half is driven.
      if (stopped > 4 * STEPS_PER_SECOND && world.fight === 1 && world.bossPool.size > 0 && killedAt < 0) {
        world.bossPool.at(0).health = 1;
        killedAt = step;
      }
      frame.step();
      if (world.scrollPerStep > 0) moving++;
      else {
        stopped++;
        if (stoppedAt < 0) {
          stoppedAt = step;
          restedAt = world.cameraAlong - world.levelOrigin;
        }
      }
      if (killedAt >= 0 && world.scrollPerStep > 0 && restarted < 0 && step > killedAt + 2) restarted = step;
    }
    expect(stoppedAt, 'the world never came to rest').toBeGreaterThan(0);
    /*
      ⚠️ **AND IT RESTS WHERE THE ROW SAYS, WITHIN A STEP OF IT.** `stand` is the whole of what the
      author controls, so a room that stopped somewhere else would be a number that means nothing. The
      tolerance is one step of the ramp's own arithmetic: a half-cosine summed over whole steps lands
      a fraction short of the distance the integral gives.
    */
    expect(
      Math.abs(restedAt - rest),
      `the camera came to rest ${restedAt.toFixed(1)} into the level and the row puts the room at ${rest}`,
    ).toBeLessThan(1);
    expect(stopped / STEPS_PER_SECOND, 'the world barely stopped').toBeGreaterThan(3);
    expect(moving, 'the world never moved, so this measured a level that never started').toBeGreaterThan(60);
    // The hull is in the room with it: stationary along the lane as well as across it.
    expect(world.bossPool.size > 0 || killedAt >= 0, 'the gyre never arrived').toBe(true);
    /*
      ⚠️ **AND THE ROOM IS SOMETHING THE PLAYER LEAVES.** A camera that stayed stopped after the
      fight would hold the level at its boss for ever; one that snapped back to full rate would move
      the whole sky a step in a frame. `restarted` is the step it began again, which must exist.
    */
    expect(killedAt, 'the gyre was never put down, so the second half of this is undriven').toBeGreaterThan(0);
    expect(restarted, 'the world never started again after the fight was won').toBeGreaterThan(killedAt);
  });

  it('and the room has walls on three sides, outside everywhere the ship can fly', () => {
    /*
      ⚠️ **ASKED FOR**: *"walls on the top, bottom and right side to represent labyrinth walls."*

      ⚠️ **HELD AGAINST THE BOX THE SHIP FLIES IN, WHICH IS WHY THE PLAYER CANNOT REACH THEM.** A wall
      the ship could touch would be a second rule about where the player may go, and it would disagree
      with `src/sim/flight.ts`'s somewhere. What this checks is that the three walls stand outside the
      three edges of that box — so the room is the picture of a bound that has been there since 0074.
    */
    const room = BOSSES.gyre.room;
    if (room === null) throw new Error('the gyre is not fought in a room');
    const { world } = playableWorld(GYRE_ONLY);
    expect(world.room, 'the level laid no room').not.toBeNull();
    const laid = world.room!;
    const rest = world.levelOrigin + GYRE_ONLY.bossAt - room.stand;
    // The far wall is the forward edge of the player's box, so the ship stops exactly short of it.
    expect(laid.to - rest, 'the far wall is not the forward edge of the box the ship flies in').toBeCloseTo(PLAYER_LEAD, 6);
    // And the mouth is behind the resting camera, so the way in is off the trailing edge.
    expect(laid.from, 'the room’s open side is not behind the camera that rests in it').toBeLessThan(rest);
    // The sides: outside the lane, and the lane is already outside the player's box by its margin.
    expect(PLAYER_MARGIN, 'the ship can reach the lane’s own edge, so it can reach a wall on it').toBeGreaterThan(0);
    expect(laid.extent, 'the wall has no tiling period, so nothing is drawn').toBeGreaterThan(0);
    expect(SPRITE_KINDS[laid.sprite], 'the room is not tiled from the wall the row names').toBe(SPRITE_KINDS[room.wall]);
  });

  it('THE WHEEL: it rises out of its seat at each of the asked health shares, sprays all the way round, and sits back down', () => {
    /*
      ⚠️ **ASKED FOR**: *"at 75%, 50%, 25% health the cog pops out and spins in a circle like the
      fireworks on fence posts spraying fire in a pinwheel style over 360° for a second or two"*, and
      the pop is *"the cog coming out of the screen towards the actual player as a turret popping up,
      spraying, sitting back down again."* — `docs/decisions/0336-the-wheel-comes-off-its-post.md`.

      ⚠️ **THE THREE SHARES ARE HELD AS THE ROW'S OWN PHASE BOUNDARIES**, because that is what the ask
      was turned into: three health shares and three phase rungs are one ladder or they are two that
      drift. If a phase moves and nobody moves the wheel with it, this is what says so.
    */
    const wheels = BOSSES.gyre.phases.map((p) => p.wheel);
    expect(
      BOSSES.gyre.phases.map((p) => p.upTo),
      'the gyre’s phases are not the health shares the pinwheel was asked for',
    ).toEqual([1, 0.75, 0.5, 0.25]);
    expect(wheels[0], 'the fight opens with a pinwheel, which is the boss’s loudest thing before the player has read anything').toBeUndefined();
    for (let i = 1; i < wheels.length; i++) expect(wheels[i], `the phase at ${BOSSES.gyre.phases[i]!.upTo} opens with no pinwheel`).toBeDefined();

    const d = gyreOnStation();
    const { world, frame } = d;
    const boss = world.bossPool.at(0);
    const wheel = wheels[1]!;
    // Into the second phase, which is the step the first wheel is set off.
    let rose = 0;
    let peakSwell = 1;
    let peakRadius = 0;
    const headings: number[] = [];
    let spun = 0;
    let before = boss.turn;
    world.enemyShots.clear();
    for (let step = 0; step < wheel.rise + wheel.spray + wheel.sink + 30; step++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 999;
      boss.fireIn = 999;
      boss.health = world.bossFullHealth * (wheel === wheels[1] ? 0.74 : 0.49);
      const was = world.enemyShots.size;
      frame.step();
      if (world.bossWheelIn > 0) rose++;
      peakSwell = Math.max(peakSwell, boss.swell);
      peakRadius = Math.max(peakRadius, boss.radius);
      let turned = boss.turn - before;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      spun += Math.abs(turned);
      before = boss.turn;
      for (let i = was; i < world.enemyShots.size; i++) {
        const s = world.enemyShots.at(i);
        headings.push(Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep));
      }
    }
    expect(rose, 'the gyre never rose out of its seat').toBeGreaterThan(wheel.spray);
    /*
      ⚠️ **IT COMES OUT OF THE SCREEN, AND THE HURTBOX COMES WITH IT.** A body drawn a quarter larger
      than it collides is 0036's own defect, so the two are held as ONE claim: whatever `swell` the
      picture reached, the radius reached the row's own radius times exactly that.
    */
    expect(peakSwell, `the hull only ever reached ${peakSwell.toFixed(2)} of its size against the ${wheel.swell} authored`).toBeCloseTo(wheel.swell, 6);
    expect(
      peakRadius,
      `the hull was drawn ${peakSwell.toFixed(2)} times its size and collided as ${(peakRadius / BOSSES.gyre.radius).toFixed(2)} — a body ` +
        'bigger in the picture than in the model hits the player from a place the picture calls empty',
    ).toBeCloseTo(BOSSES.gyre.radius * wheel.swell, 6);
    // And it goes back: nothing carries a swell out of the wheel and into the rest of the fight.
    expect(boss.swell, 'the hull stayed swollen after the wheel finished').toBe(1);
    expect(boss.radius, 'the hurtbox stayed swollen after the wheel finished').toBe(BOSSES.gyre.radius);
    // It spins: at least the turns the row authors, which is what makes it a wheel rather than a ring.
    expect(spun / (Math.PI * 2), `the hull turned ${(spun / (Math.PI * 2)).toFixed(2)} times while the wheel was up`).toBeGreaterThan(1);
    /*
      ⚠️ **AND THE SPRAY COVERS THE WHOLE CIRCLE — *over 360°*, held in the player's own terms.** The
      headings the shots left on are bucketed into twelve sectors of the compass and every one of them
      has to be used: a spoke that swept less than a full turn, or a ring that went out all at once,
      both fail this and they fail it differently.
    */
    expect(headings.length, 'the wheel threw nothing').toBeGreaterThan(20);
    const sectors = new Set(headings.map((h) => Math.floor((((h / (Math.PI * 2)) % 1) + 1) % 1 * 12)));
    expect(sectors.size, `the spray covered ${sectors.size} of the twelve sectors of the compass`).toBe(12);
  });

  it('and no wall leaves while the hull is spinning, because for that second the spike names nothing', () => {
    /*
      ⚠️ **THE CLAIM A PROBE FOUND NOBODY WAS MAKING.** 0332's compass is the fight's spine: the spike
      names the edge the next wall comes in over, and a wall that arrived while the hull was
      free-spinning would come from an edge the player had never been told about. `and the wall comes
      from the edge the spike is aimed at` cannot catch it — it collects the first eight walls off a
      steady bleed, and whether one of them happens to land inside a hundred-step wheel is luck. **It
      stayed GREEN with the gate broken**, which is the guard that cannot fail
      (`docs/decisions/0005-a-guard-must-be-seen-to-fail.md`).

      ⚠️ **SO IT IS DRIVEN AS AN INVARIANT OVER A WHOLE FIGHT**: bleed the hull from full to empty,
      and on no step does the wall count move while the wheel is up. Both halves have to happen for
      this to mean anything, so both are asserted.
    */
    const { world, frame } = gyreOnStation();
    const boss = world.bossPool.at(0);
    const bleed = world.bossFullHealth / 2200;
    let last = world.bossUncoilAt;
    let spinning = 0;
    let walls = 0;
    let duringWheel = 0;
    for (let step = 0; step < 4000 && world.bossPool.size > 0; step++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 999;
      boss.fireIn = 999;
      boss.health = Math.max(1, boss.health - bleed);
      const up = world.bossWheelIn > 0;
      frame.step();
      if (world.bossPool.size === 0) break;
      if (up) spinning++;
      if (world.bossUncoilAt > last) {
        walls++;
        if (up) duringWheel++;
        last = world.bossUncoilAt;
      }
    }
    expect(spinning, 'the wheel never ran, so this measured nothing').toBeGreaterThan(100);
    expect(walls, 'no wall was ever thrown, so this measured nothing').toBeGreaterThan(2);
    expect(
      duringWheel,
      `${duringWheel} walls left while the hull was spinning — each one came in over an edge the spike had not named`,
    ).toBe(0);
  });

  it('and it catches fire as it is hurt, behind the hull and beside the housing', () => {
    /*
      ⚠️ **ASKED FOR**: *"updated damage graphics for it as it gets hurt and set on fire."*

      ⚠️ **THE COUNT IS THE ESCALATION, WHICH IS WHAT *AS IT GETS HURT* MEANS** — a fire that switched
      on at a threshold would be a state, and what was asked for is something taking hold. Held as:
      nothing while it is whole, some when it catches, more when the bar is nearly out.

      ⚠️ **AND THE HOUSING IS STILL THERE.** 0335 said a boss has an aura or a seat and never both;
      this is the row that needs both, and the seat keeps the first slot so the mounting is drawn
      under the flames and the flames under the cog.
    */
    const burn = BOSSES.gyre.burn;
    if (burn === null) throw new Error('the gyre does not burn');
    const move = BOSSES.gyre.move;
    if (move.kind !== 'socket') throw new Error('the gyre is not set into anything');
    const at = (share: number): number => {
      const { world, frame } = gyreOnStation();
      const boss = world.bossPool.at(0);
      for (let i = 0; i < 4; i++) {
        world.ship.health = world.shipRow.health;
        world.ship.invulnFor = 999;
        boss.fireIn = 999;
        boss.health = world.bossFullHealth * share;
        frame.step();
      }
      // The seat is always the first slot; everything after it is fire.
      expect(world.bossAura.at(0).sprite, 'the housing lost its place to the fire').toBe(move.seat);
      for (let i = 1; i < world.bossAura.size; i++) {
        expect(
          burn.frames.includes(world.bossAura.at(i).sprite),
          'something that is not a flame is standing in the fire’s slots',
        ).toBe(true);
      }
      return world.bossAura.size - 1;
    };
    expect(at(1), 'the gyre is on fire while it is whole').toBe(0);
    expect(at(burn.from - 0.01), `the gyre is not alight at ${burn.from} of its health`).toBeGreaterThanOrEqual(burn.least);
    expect(at(0.02), 'the fire never grows, so it is a state rather than something taking hold').toBeGreaterThan(at(burn.from - 0.01));
    expect(at(0.02), 'the fire grew past what the row authors').toBeLessThanOrEqual(burn.most);
  });

  it('THE WRECK: it falls out of the wall, crashes into the floor, and the way on opens after it', () => {
    /*
      ⚠️ **ASKED FOR**: *"when it dies, instead of exploding, have it fall out of the wall and crash
      down into the floor, and then the far right wall opens so the player can fly onwards."* —
      `docs/decisions/0337-the-gyre-falls-out-of-the-wall.md`.

      ⚠️ **DRIVEN AS FOUR BEATS IN THE ORDER THEY HAPPEN**, because the order is the whole of it: a
      wall that opened while the hull was still falling would carry the player away from the thing
      they had just killed, and a level that cleared before the wall moved would never let them
      through it. Each beat is held against the one before.
    */
    const wreck = BOSSES.gyre.wreck;
    const room = BOSSES.gyre.room;
    if (wreck === null || room === null) throw new Error('the gyre has no wreck or no room');
    const { world, frame } = gyreOnStation();
    world.bossPool.at(0).health = 1;
    let fell = 0;
    let landedAt = -1;
    let openedAt = -1;
    let clearedAt = -1;
    let lowest = -1;
    let scrollWhileFalling = 0;
    let turnedWhileFalling = 0;
    let before = world.bossPool.at(0).turn;
    for (let step = 0; step < 20 * STEPS_PER_SECOND; step++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 999;
      frame.step();
      if (world.bossPool.size > 0) {
        const body = world.bossPool.at(0);
        lowest = Math.max(lowest, body.across);
        if (world.bossBeaten && !world.wreckDown) {
          fell++;
          scrollWhileFalling = Math.max(scrollWhileFalling, world.scrollPerStep);
          let turned = body.turn - before;
          if (turned > Math.PI) turned -= Math.PI * 2;
          else if (turned < -Math.PI) turned += Math.PI * 2;
          turnedWhileFalling += Math.abs(turned);
        }
        before = body.turn;
      }
      if (world.wreckDown && landedAt < 0) landedAt = step;
      if (world.roomOpen > 0 && openedAt < 0) openedAt = step;
      if (world.clearedIn > 0 && clearedAt < 0) clearedAt = step;
    }
    // It did not vanish: the hull is still there after it died, which is what *instead of exploding* means.
    expect(fell, 'the gyre never fell — it went the way every other boss goes').toBeGreaterThan(30);
    expect(landedAt, 'the wreck never reached the floor').toBeGreaterThan(0);
    /*
      ⚠️ **THE FLOOR IS THE FAR WALL'S OWN FACE**, which is the number 0335 stands the wall on. A
      wreck resting anywhere else is lying in the air or inside the masonry, and both are visible.
    */
    expect(
      lowest + BOSSES.gyre.radius,
      `the wreck came to rest with its rim at ${(lowest + BOSSES.gyre.radius).toFixed(1)} and the room's floor is at ${ACROSS_SPAN - PLAYER_MARGIN}`,
    ).toBeCloseTo(ACROSS_SPAN - PLAYER_MARGIN, 6);
    // It tumbles on the way down: half a turn or more, so it is out of control rather than sliding.
    expect(turnedWhileFalling, `the wreck turned ${turnedWhileFalling.toFixed(2)} radians on its way down`).toBeGreaterThan(Math.PI / 2);
    // And the world holds still to watch it: nothing carries the player away mid-fall.
    expect(scrollWhileFalling, 'the world started moving again while the wreck was still falling').toBe(0);
    // Then, in order: the wall parts, and only then is the level cleared.
    expect(openedAt, 'the room never opened, so the player is sealed in with a corpse').toBeGreaterThan(landedAt);
    expect(openedAt - landedAt, 'the wall began to part on the step it landed, so the crash has no beat of its own').toBeGreaterThanOrEqual(wreck.settle);
    expect(clearedAt, 'the level cleared before the way out was open').toBeGreaterThanOrEqual(openedAt);
    // And the way out is a gap in the middle of the far wall, wide enough to be one.
    expect(world.room?.open, 'the far wall never finished opening').toBe(1);
    expect(world.scrollPerStep, 'the world never started again, so the player cannot fly onwards').toBeGreaterThan(0);
  });

  it('and nothing may shoot a wreck, because it is a corpse and not a target', () => {
    /*
      ⚠️ **FOUND BY PHOTOGRAPHING IT — 0337, and 0027 is the rule.** The wreck is the same hull in the
      same pool, so `playerShots` × `bossPool` went on pairing all the way down: the player's fire was
      swallowed by a dead thing, which flashed white for each one and cued `hit`. On the bench, where
      the scrub pins the boss's health, it was worse than untidy — the pairing killed the wreck a
      second time and it vanished mid-fall. `shootable` is gated on `bossBeaten` now.

      Driven by parking a shot on the wreck every step of the fall: if the pairing is live the pool
      eats them, and if it is not they fly through.
    */
    const { world, frame } = gyreOnStation();
    world.bossPool.at(0).health = 1;
    let parked = 0;
    let eaten = 0;
    let flashed = 0;
    for (let step = 0; step < 20 * STEPS_PER_SECOND && !world.wreckDown; step++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 999;
      if (world.bossBeaten && world.bossPool.size > 0) {
        const body = world.bossPool.at(0);
        world.playerShots.clear();
        const shot = world.playerShots.spawn();
        if (shot !== null) {
          reset(shot, body.along, body.across, bodyOf(SPRITE.bullet, 0.9, 1, 1));
          parked++;
        }
      }
      frame.step();
      if (world.bossBeaten && world.bossPool.size > 0) {
        if (world.playerShots.size === 0 && parked > 0) eaten++;
        if (world.bossPool.at(0).flashFor > 0) flashed++;
      }
    }
    expect(parked, 'no shot was ever parked on the wreck, so this guard drove nothing').toBeGreaterThan(20);
    expect(eaten, `${eaten} of ${parked} shots were swallowed by the wreck`).toBe(0);
    expect(flashed, 'the wreck flashed as though it had been hit').toBe(0);
    expect(world.bossPool.size, 'the wreck was shot out of existence on its way down').toBe(1);
  });

  it('and a wreck does nothing back: flying into the corpse costs nothing', () => {
    /*
      Played: *"the 4th floor boss will kill you with its corpse."* `layWreck` put the hull back in
      the pool the ship collides with and promised it did nothing back; the ship × `bossPool` pairing
      was not gated, so the wreck killed on contact where it landed on the box's edge and again as the
      room opened and it slid back through the box.

      Driven by parking the ship on the wreck every step from the death until the room is open.
    */
    const { world, frame } = gyreOnStation();
    world.bossPool.at(0).health = 1;
    const full = world.ship.health;
    let parked = 0;
    let hurt = 0;
    for (let step = 0; step < 25 * STEPS_PER_SECOND && (world.room?.open ?? 0) < 1; step++) {
      world.enemyShots.clear();
      world.ship.invulnFor = 0;
      if (world.bossBeaten && world.bossPool.size > 0) {
        const body = world.bossPool.at(0);
        world.ship.along = body.along;
        world.ship.across = body.across;
        world.ship.prevAlong = body.along;
        world.ship.prevAcross = body.across;
        parked++;
      }
      frame.step();
      if (world.ship.health < full) {
        hurt++;
        world.ship.health = full;
      }
    }
    expect(parked, 'the ship was never parked on the wreck, so this guard drove nothing').toBeGreaterThan(60);
    expect(hurt, `the wreck hurt the ship on ${hurt} of ${parked} steps`).toBe(0);
  });

  it('and the room opens even if the wreck is gone, because a sealed room is a dead run', () => {
    /*
      ⚠️ **THE ROOM OPENING IS THE INVARIANT AND THE FALL IS THE DECORATION — 0337.** The way out is
      spent by the wreck landing, so for as long as `stepWreck` needed a body in the pool, ANY path
      that emptied it left the player sealed in a finished room with no wall that would ever part and
      no way to lose either. The gate above closes the one path that was real; this holds the floor
      under every path, which is what `docs/decisions/0192-a-guard-holds-an-invariant.md` asks of a
      guard that could be answered with a second gate instead.
    */
    const room = BOSSES.gyre.room;
    if (room === null) throw new Error('the gyre has no room');
    const { world, frame, cleared } = gyreOnStation();
    world.bossPool.at(0).health = 1;
    let robbed = false;
    for (let step = 0; step < 25 * STEPS_PER_SECOND; step++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 999;
      // The moment it is a wreck, take it away — the case no gate is allowed to be the only answer to.
      if (world.bossBeaten && world.bossPool.size > 0 && !robbed) {
        world.bossPool.clear();
        robbed = true;
      }
      frame.step();
    }
    expect(robbed, 'the gyre never died, so nothing was taken away').toBe(true);
    expect(world.roomOpen, 'the wreck was taken away and the room never opened — the run is sealed').toBeGreaterThanOrEqual(room.opens);
    /*
      ⚠️ **THIS READ `clearedIn > 0` AND THAT WAS A SYMPTOM OF 0339 RATHER THAN THE CLAIM — 0192.** A
      countdown is *running* twenty-five seconds after the room opened only because the room path was
      re-arming it every ninety-six steps, which is the defect. What the guard means is **the level
      reported itself cleared**, and with the latch in, `clearedIn` is back at zero by then and always
      will be. Asking the counter asks the thing the sentence says.
    */
    expect(cleared.count, 'the way out opened and the level still never cleared').toBe(1);
    expect(world.scrollPerStep, 'the world never started again, so the player cannot fly onwards').toBeGreaterThan(0);
  });

  it('and it wears its damage: a body a phase, every one of them the same size', () => {
    /*
      ⚠️ **ASKED FOR**: *"upscale the graphics and have it change as it gets more damaged."* Driven
      through the real frame at each phase's own health rather than read off the table, because what
      is claimed is that the hull the player is looking at changes — `wearFace` is where that happens
      and nothing else in this file goes near it.

      ⚠️ **AND THE BOX DOES NOT CHANGE**, which is 0320's finding on the fish: a boss that grew its
      own extent at a health threshold hands back what the first phase taught about where its edge is.
    */
    const row = BOSSES.gyre;
    expect(SPRITE_EXTENT[SPRITE_KINDS[row.sprite]!], 'the gyre was not upscaled').toBeGreaterThan(44);
    const worn: number[] = [];
    for (const phase of row.phases) {
      const { world, frame } = gyreOnStation();
      const boss = world.bossPool.at(0);
      for (let i = 0; i < 4; i++) {
        world.ship.health = world.shipRow.health;
        world.ship.invulnFor = 999;
        boss.fireIn = 999;
        boss.health = world.bossFullHealth * (phase.upTo - 0.01);
        boss.flashFor = 0;
        frame.step();
      }
      worn.push(boss.sprite);
    }
    expect(new Set(worn).size, `the gyre wears ${new Set(worn).size} bodies over ${row.phases.length} phases`).toBe(row.phases.length);
    for (const sprite of worn) {
      expect(SPRITE_EXTENT[SPRITE_KINDS[sprite]!], 'a worn body is a different size from the whole one').toBe(
        SPRITE_EXTENT[SPRITE_KINDS[row.sprite]!],
      );
    }
    // And the hurt twin of each is its own, or a hit in the last phase shows the whole cog.
    for (const phase of row.phases) {
      if (phase.hull === undefined) continue;
      expect(phase.hull.hit, 'a worn body shares the row’s hurt twin').not.toBe(row.spriteHit);
      expect(SPRITE_EXTENT[SPRITE_KINDS[phase.hull.hit]!], 'a worn body’s hurt twin is a different size').toBe(
        SPRITE_EXTENT[SPRITE_KINDS[row.sprite]!],
      );
    }
  });
});

/**
 * ── A LEVEL IS CLEARED ONCE — 0339 ─────────────────────────────────────────────────────────────
 *
 * Reported: *"we've somehow lost the ice level, game goes from labyrinth to toxic mire to black heart
 * now, no rime shelf."*
 *
 * ⚠️ **`LEVEL_KINDS` IS INTACT AND THE LEVEL IS NOT MISSING — IT IS SKIPPED, ONE RUNG AT A TIME.**
 * `stepBossDeath` fires `onCleared` when `clearedIn` counts down to zero; the room path added by
 * [0335](../docs/decisions/0335-the-fight-happens-in-a-room.md) re-arms `clearedIn` **every time it is
 * at or below zero while the way out is open**, so the countdown runs again and `onCleared` fires
 * again. `SCREENS.cleared` has `steps: true`, so the world goes on stepping under the banner and
 * `mount.ts` dispatches `levelCleared` once per firing — and the reducer adds one to the level each
 * time. Only a boss with a `room` does it, which is the **gyre**, which is Shoal's: so Shoal hands the
 * run to Gauntlet and the Rime Shelf is never played.
 *
 * ⚠️ **AND THE NO-ROOM PATH HAS ALWAYS LATCHED**, on `bossBeaten`, with its own note saying so. This
 * is one path missing the latch the other one has.
 */
describe('0339 — a level is cleared once', () => {
  it('THE REPORTED ONE: a boss with a room clears its level exactly once, however long the banner is left up', () => {
    /*
      ⚠️ **THE WINDOW IS TWELVE DEATH-LENGTHS AND THE FIRST DRAFT USED FOUR, WHICH PASSED.** Measured:
      the wreck settles (60), the room opens (90) and the clear counts down (96), so the FIRST
      `onCleared` lands at step **295** — and the re-arm puts the second at **391**. Four death-lengths
      is 384, so the fixture stopped six steps short of the bug and reported a green game. `SCREENS.cleared`
      steps the world while the banner is up, so this is what the real screen does; the only question is
      how long the player looks at it, and the answer is *longer than that*.
    */
    const { world, cleared } = playableWorld(GYRE_ONLY);
    const frame = new GameFrame(world);
    for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
      world.ship.health = world.shipRow.health;
      frame.step();
    }
    expect(world.bossPool.size, 'the gyre never arrived').toBe(1);
    // Killed outright rather than fought, so this measures the CLEAR and not the fight.
    world.bossPool.at(0).health = 0;
    for (let i = 0; i < BOSS_DEATH_STEPS * 12; i++) {
      world.ship.health = world.shipRow.health;
      frame.step();
    }
    expect(cleared.count, 'the level never cleared at all, so this measured nothing').toBeGreaterThan(0);
    expect(
      cleared.count,
      `the gyre cleared its level ${cleared.count} times — every one past the first is a level the run ` +
        'skips, and the one after Shoal is the Rime Shelf',
    ).toBe(1);
  });

  it('and the NEXT level can still be cleared, which is the same bug with its sign flipped', () => {
    /*
      ⚠️ **A LATCH THAT IS NEVER LET GO IS THE OTHER HALF OF THIS DEFECT AND IT IS WORSE.** One level
      ships and the run is sealed in the second: the room opens, the arming condition is true, and the
      latch says the clear has already been reported. The reset sits beside `clearedIn`'s own for
      exactly that reason, and this is the guard that makes it load-bearing rather than tidy.

      ⚠️ **TWO LEVELS THROUGH THE REAL FRAME, BECAUSE ONE CANNOT SEE IT.** The first guard above plays
      a single level and is perfectly happy with a latch that is never cleared — `npm run prove` said
      so, reporting STILL GREEN on the probe that removes the reset.
    */
    const { world, frame, cleared } = gyreOnStation();
    world.bossPool.at(0).health = 0;
    for (let i = 0; i < BOSS_DEATH_STEPS * 6; i++) {
      world.ship.health = world.shipRow.health;
      frame.step();
    }
    expect(cleared.count, 'the first level never cleared, so this measures nothing').toBe(1);
    // The level boundary, as the shell takes it.
    advanceLevel(world, GYRE_ONLY, 1);
    const second = new GameFrame(world);
    for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
      world.ship.health = world.shipRow.health;
      second.step();
    }
    expect(world.bossPool.size, 'the gyre never arrived in the second level').toBe(1);
    world.bossPool.at(0).health = 0;
    for (let i = 0; i < BOSS_DEATH_STEPS * 6; i++) {
      world.ship.health = world.shipRow.health;
      second.step();
    }
    expect(
      cleared.count,
      'the second level never reported itself cleared — the run is sealed in it, which is what a latch ' +
        'that is never let go does',
    ).toBe(2);
  });
});
