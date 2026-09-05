/**
 * The hydra grows heads — `docs/decisions/0254-the-hydra-grows-heads.md`.
 *
 * The Toxic Mire's real boss, from the brief: *"toxic mire needs a hydra boss, at 80, 60, 40, 20%
 * it spawns an extra head, the first head fires acid blasts, the second head adds flame ball
 * attacks, the third head fires laser bolts, the 4th head fires frost attacks and the last head
 * fires out void blasts."* What is held here is that a head is a shot and an attack of its own,
 * that a phase grows one, that every head stays and the heads take turns a volley, and that the
 * laser head's beam leaves the side of the hull. What a boss IS is `tests/bosses.test.ts`'s and
 * `tests/level.test.ts`'s; the beam's own rules are `tests/quetzal.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BEAM_BOLT_KIND, BOSSES, BOSS_KINDS, type BossAttack } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS, type ShotKind } from '../src/content/shots.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The hydra alone, a short way in, with no mid-boss in front of it. */
const HYDRA_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'hydra',
  theme: 'mire',
};

type Driven = { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame };

/** The hydra on station at `fraction` of its health, its fan held, and an immortal ship out of the way. */
function hydraAt(fraction: number): Driven {
  const { world } = playableWorld(HYDRA_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the hydra never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.bolts.clear();
  return { world, frame };
}

/** One volley, thrown now, the field cleared first: which shot kinds it put in the air, and whether it lit a beam. */
function volley(d: Driven): { kinds: Set<ShotKind>; beams: number; beamAcross: number } {
  const { world, frame } = d;
  world.enemyShots.clear();
  world.bolts.clear();
  world.ship.health = world.shipRow.health;
  world.ship.across = 50;
  world.bossPool.at(0).fireIn = 1;
  frame.step();
  const kinds = new Set<ShotKind>();
  for (let i = 0; i < world.enemyShots.size; i++) {
    const sprite = world.enemyShots.at(i).sprite;
    for (const k of Object.keys(SHOTS) as ShotKind[]) if (SHOTS[k].sprite === sprite) kinds.add(k);
  }
  let beams = 0;
  let beamAcross = 0;
  for (let i = 0; i < world.bolts.size; i++) {
    const b = world.bolts.at(i);
    if (b.kind === BEAM_BOLT_KIND) {
      beams++;
      beamAcross = b.across;
    }
  }
  return { kinds, beams, beamAcross };
}

const HEADS: readonly ShotKind[] = ['acid', 'flame', 'lance', 'frost', 'void'];

describe('0254 — the hydra grows heads', () => {
  it('THE FIVE HEADS: a head a fifth, each its own shot and attack, every earlier head kept — and it is the Toxic Mire’s real boss', () => {
    const row = BOSSES.hydra;
    expect(row.phases.map((p) => p.upTo)).toEqual([1, 0.8, 0.6, 0.4, 0.2]);
    const whole = phaseFor(row, row.health);
    expect((whole.attack ?? row.attack).kind, 'the hydra does not open with one head’s spray').toBe('spray');
    expect(whole.shot ?? row.shot, 'the first head is not acid').toBe('acid');
    const kinds: BossAttack['kind'][] = ['spray', 'spray', 'beam', 'wall', 'ring'];
    for (let n = 2; n <= 5; n++) {
      const phase = phaseFor(row, row.health * (1 - (n - 1) * 0.2 - 0.05));
      const attack = phase.attack ?? row.attack;
      expect(attack.kind, `the phase with ${n} heads is not heads`).toBe('heads');
      if (attack.kind !== 'heads') return;
      expect(attack.heads.length, `the phase at ${n} heads has ${attack.heads.length}`).toBe(n);
      for (let i = 0; i < n; i++) {
        expect(attack.heads[i]!.shot, `head ${i + 1} throws the wrong shot`).toBe(HEADS[i]);
        expect(attack.heads[i]!.attack.kind, `head ${i + 1} throws the wrong attack`).toBe(kinds[i]);
      }
    }
    // A head is never a round of heads or a rake, anywhere in the table.
    for (const kind of BOSS_KINDS) {
      for (const phase of BOSSES[kind].phases) {
        const attack = phase.attack ?? BOSSES[kind].attack;
        if (attack.kind !== 'heads') continue;
        for (const head of attack.heads) expect(['heads', 'rake']).not.toContain(head.attack.kind);
      }
    }
    // In the player's units: with five heads in the round at the last phase's cadence, no head waits
    // more than five seconds for its turn.
    const last = row.phases[row.phases.length - 1]!;
    expect((5 * last.fireEvery) / STEPS_PER_SECOND).toBeLessThanOrEqual(5);
    expect(LEVELS.gauntlet.boss).toBe('hydra');
    expect(LEVELS.gauntlet.theme).toBe('mire');
  });

  it('THE HEADS TAKE TURNS, DRIVEN: at five heads, six volleys are acid, flame, the laser, frost, void and acid again — and at two, acid and flame alternate', () => {
    /*
      ⚠️ **The table is not the fight.** A frame that threw the phase's first head every volley
      would leave every line above green. Six volleys, each asked what it put in the air.
    */
    const d = hydraAt(0.15);
    const turns = [0, 1, 2, 3, 4, 5].map(() => volley(d));
    const expected: (ShotKind | 'beam')[] = ['acid', 'flame', 'beam', 'frost', 'void', 'acid'];
    turns.forEach((t, i) => {
      if (expected[i] === 'beam') {
        expect(t.beams, `volley ${i + 1} did not light the laser head’s beam`).toBeGreaterThan(0);
        expect(t.kinds.size, `volley ${i + 1} threw bullets beside the beam`).toBe(0);
      } else {
        expect([...t.kinds], `volley ${i + 1} threw ${[...t.kinds].join(', ') || 'nothing'} and should have thrown ${expected[i]}`).toEqual([expected[i]]);
        expect(t.beams, `volley ${i + 1} lit a beam`).toBe(0);
      }
    });
    const e = hydraAt(0.75);
    const pair = [0, 1, 2].map(() => [...volley(e).kinds]);
    expect(pair).toEqual([['acid'], ['flame'], ['acid']]);
  });

  it('THE LASER HEAD: its beam leaves the side of the hull, where the head is, and not the middle', () => {
    const d = hydraAt(0.55);
    volley(d);
    volley(d);
    const boss = d.world.bossPool.at(0);
    const third = volley(d);
    // Where the hull was when it threw: the step moved it by its own velocity after the throw.
    const hullAcross = boss.across - boss.velAcross;
    expect(third.beams, 'the third head lit no beam').toBe(1);
    const phase = phaseFor(BOSSES.hydra, boss.health, d.world.bossFullHealth).attack!;
    if (phase.kind !== 'heads') return;
    const laser = phase.heads[2]!.attack;
    if (laser.kind !== 'beam') return;
    expect(Math.abs(laser.from[0]!), 'the laser head sits in the middle of the hull').toBeGreaterThan(BOSSES.hydra.radius / 3);
    expect(third.beamAcross - hullAcross, 'the beam does not leave from the laser head').toBeCloseTo(laser.from[0]!, 3);
  });
});
