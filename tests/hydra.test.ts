/**
 * The hydra grows heads — `docs/decisions/0254-the-hydra-grows-heads.md`.
 *
 * The Toxic Mire's real boss, from the brief: *"toxic mire needs a hydra boss, at 80, 60, 40, 20%
 * it spawns an extra head, the first head fires acid blasts, the second head adds flame ball
 * attacks, the third head fires laser bolts, the 4th head fires frost attacks and the last head
 * fires out void blasts."* What is held here is that a head is a shot and an attack of its own,
 * that a phase grows one, that every head stays and the heads take turns a volley — and since 0384,
 * that each head is on the screen on its own neck, rises out of the acid it stands in, throws from its
 * own mouth and is what the player shoots. What a boss IS is `tests/bosses.test.ts`'s and
 * `tests/level.test.ts`'s; the beam's own rules are `tests/quetzal.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameFrame } from '../src/app/frame.ts';
import { foldTurn, phaseFor } from '../src/app/boss.ts';
import { BEAM_BOLT_KIND, BOSSES, BOSS_KINDS, type BossAttack } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { SHOTS, type ShotKind } from '../src/content/shots.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';
import { CAPACITY, NECK_SLOTS } from '../src/app/mount.ts';
import { drawKind, hydraCollarOf } from '../src/render/bake.ts';
import { HYDRA_SKULL, hydraJointOf, hydraKnuckleOf, neckSpine } from '../src/content/necks.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { inside, tracingPen } from './paths.ts';
import { faceAt } from '../src/sim/corridor.ts';
import { reset } from '../src/sim/entity.ts';

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

  /*
    ── *THE LASER HEAD: its beam leaves the side of the hull* STOOD HERE, AND 0384 REPLACED IT ─────────

    It held `from: [-9]`, an offset that put the laser on the side of a hull whose five heads were drawn
    inside it. The heads stand on their own necks now and every attack leaves its own head's mouth — the
    laser's included — which `EVERY HEAD'S ATTACK LEAVES ITS OWN MOUTH` below holds for all five.
  */
});

/** The hydra's necks, off its row. */
const NECKS = BOSSES.hydra.necks!;

/** Where head `k`'s mouth is now, in world units: the head's centre, and its mouth ahead of it along its turn. */
function mouthOf(d: Driven, k: number): { along: number; across: number } {
  const head = d.world.bossBody.at(k);
  const reach = NECKS.necks[k]!.mouth;
  return { along: head.along - Math.cos(head.turn) * reach, across: head.across - Math.sin(head.turn) * reach };
}

/** Let the hydra stand in a phase until its newest neck has risen. */
function settle(d: Driven): void {
  for (let i = 0; i < NECKS.rise + 10; i++) {
    d.world.ship.health = d.world.shipRow.health;
    d.world.bossPool.at(0).fireIn = 999;
    d.frame.step();
  }
}

/** The Mire's own level with only the hydra in it — its floor under the fight. */
const HYDRA_IN_THE_MIRE: LevelRow = { ...HYDRA_ONLY, corridor: LEVELS.gauntlet.corridor };

describe('0384 — the hydra stands in the acid and grows its heads', () => {
  it('there are as many necks as phases, and room for every one', () => {
    expect(NECKS.necks.length, 'a phase with no neck to grow, or a neck no phase grows').toBe(BOSSES.hydra.phases.length);
    expect(NECKS.necks.length).toBeLessThanOrEqual(NECK_SLOTS);
  });

  it('THE ASK: a neck grows with every phase, and every neck carries its own head', () => {
    /*
      *"It starts with a single head… second stage, it actually grows a new head."* Driven to each
      phase in turn and let stand: the heads on the field are the phase's count, each is the head its
      neck names, and every neck is drawn behind the body with its own drawing.
    */
    [1, 0.75, 0.55, 0.35, 0.15].forEach((fraction, phase) => {
      const d = hydraAt(fraction);
      settle(d);
      expect(d.world.bossBody.size, `at ${fraction * 100}% the hydra has ${d.world.bossBody.size} heads`).toBe(phase + 1);
      const drawn = new Set<number>();
      // What each piece is, not what it wears: since 0486 a lit neck wears its hurt twin.
      for (let i = 0; i < d.world.bossAura.size; i++) drawn.add(d.world.bossAura.at(i).spriteBase);
      for (let k = 0; k <= phase; k++) {
        expect([NECKS.necks[k]!.head, NECKS.necks[k]!.headHit], `head ${k} is not its neck's own`).toContain(d.world.bossBody.at(k).sprite);
        expect(drawn.has(NECKS.necks[k]!.art), `neck ${k} is not drawn`).toBe(true);
      }
    });
  });

  it('AND A NEW HEAD RISES OUT OF THE ACID, IN LANE UNITS: it is born under the shore and stands in its place a rise later', () => {
    const { world } = playableWorld(HYDRA_IN_THE_MIRE);
    const frame = new GameFrame(world);
    const d = { world, frame };
    for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
      world.ship.health = world.shipRow.health;
      // The ship's fire held for the wait: every ship opens at the cap since 0441, and the fixture's
      // gun would otherwise take the hydra past the first head's threshold before the test puts it there.
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
      frame.step();
    }
    world.bossPool.at(0).health = world.bossFullHealth * 0.75;
    world.ship.health = world.shipRow.health;
    frame.step();
    const born = world.bossBody.at(1);
    const shore = faceAt(world.corridor!, born.along, 1);
    expect(born.across, `the fish's head was born at lane ${born.across.toFixed(1)}, above the shore at ${shore.toFixed(1)}`).toBeGreaterThan(shore);
    settle(d);
    const risen = world.bossBody.at(1);
    expect(risen.across, 'the fish never rose out of the acid').toBeLessThan(faceAt(world.corridor!, risen.along, 1) - 10);
  });

  it('EVERY HEAD’S ATTACK LEAVES ITS OWN MOUTH, IN WORLD UNITS — the laser’s too', () => {
    /*
      0036's class: a shot the picture gives no source for. Every volley at five heads, and for each, the
      first thing it put in the air is at the mouth of the head the round says is throwing, far from the
      hull's centre, and nearer that mouth than any other head's.
    */
    const d = hydraAt(0.15);
    settle(d);
    for (let k = 0; k < 5; k++) {
      const mouth = mouthOf(d, k);
      const got = volley(d);
      const boss = d.world.bossPool.at(0);
      let at: { along: number; across: number } | null = null;
      if (got.beams > 0) {
        for (let i = 0; i < d.world.bolts.size; i++) {
          const b = d.world.bolts.at(i);
          if (b.kind === BEAM_BOLT_KIND) at = { along: b.along + b.fromAlong, across: b.across };
        }
      } else {
        let best = Infinity;
        for (let i = 0; i < d.world.enemyShots.size; i++) {
          const s = d.world.enemyShots.at(i);
          const gap = Math.hypot(s.along - mouth.along, s.across - mouth.across);
          if (gap < best) {
            best = gap;
            at = { along: s.along, across: s.across };
          }
        }
      }
      expect(at, `volley ${k + 1} put nothing in the air`).not.toBeNull();
      /*
        ⚠️ **A WALL IS CENTRED ON THE MOUTH AND NO SHOT OF IT LEAVES THE MOUTH ITSELF** — its slots are a
        gap either side, thrown in 0371's order, nearest pair first. So for the ice's frost the stagger is
        let put down its first pair, and the pair's middle is what is measured.
      */
      const phase = phaseFor(BOSSES.hydra, boss.health, d.world.bossFullHealth).attack!;
      const thrown = phase.kind === 'heads' ? phase.heads[k]!.attack : phase;
      if (thrown.kind === 'wall') {
        /*
          ⚠️ **THE PAIR'S SHARDS, EACH WHERE IT WAS FIRST SEEN — 0482.** This waited for any two shots
          in the air, which were the pair while a shard took 38 steps to split; at 24 the first shard's
          bolts are in the air before its staggered twin is thrown. Each shard is read at the step it
          first appears, still a shard, so the middle is the pair's whatever has split since.
        */
        const firsts = new Set<object>();
        const seen: number[] = [];
        for (let s = 0; s < 60 && seen.length < 2; s++) {
          for (let i = 0; i < d.world.enemyShots.size; i++) {
            const shard = d.world.enemyShots.at(i);
            if (shard.turnsLeft !== 0 || firsts.has(shard)) continue;
            firsts.add(shard);
            seen.push(shard.across);
          }
          if (seen.length < 2) d.frame.step();
        }
        // Along, where the first shard was thrown; across, the pair's middle.
        at = { along: at!.along, across: (seen[0]! + seen[1]!) / 2 };
      }
      const gap = Math.hypot(at!.along - mouth.along, at!.across - mouth.across);
      expect(gap, `head ${k}'s attack left ${gap.toFixed(1)} units from its mouth`).toBeLessThan(5);
      expect(Math.hypot(at!.along - boss.along, at!.across - boss.across), `head ${k}'s attack left the hull's centre`).toBeGreaterThan(15);
      for (let j = 0; j < 5; j++) {
        if (j === k) continue;
        const other = mouthOf(d, j);
        expect(Math.hypot(at!.along - other.along, at!.across - other.across), `head ${k}'s attack left nearer head ${j}'s mouth`).toBeGreaterThan(gap);
      }
    }
  });

  it('A SHOT ON A HEAD HURTS THE HYDRA: the heads are what the player fights', () => {
    const d = hydraAt(1);
    settle(d);
    const boss = d.world.bossPool.at(0);
    const head = d.world.bossBody.at(0);
    const before = boss.health;
    const shot = d.world.playerShots.spawn()!;
    reset(shot, head.along, head.across, { sprite: 0, spriteHit: 0, radius: 1, health: 1, damage: 5 });
    boss.fireIn = 999;
    d.frame.step();
    expect(boss.health, 'a shot that landed on a head took nothing off the hydra').toBeLessThan(before);
  });

  it('IT STANDS IN THE ACID, IN LANE UNITS: its centre is held its sink above the shore under it, as the bank rolls by', () => {
    const { world } = playableWorld(HYDRA_IN_THE_MIRE);
    const frame = new GameFrame(world);
    const wade = BOSSES.hydra.move;
    if (wade.kind !== 'wade') throw new Error('the hydra does not wade');
    let watched = 0;
    for (let i = 0; i < 1600; i++) {
      world.ship.health = world.shipRow.health;
      if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
      frame.step();
      if (world.bossPool.size === 0 || i < 900) continue;
      const hull = world.bossPool.at(0);
      const shore = faceAt(world.corridor!, hull.along, 1);
      expect(Math.abs(hull.across - (shore - wade.sink)), `at step ${i} the hydra stands ${(shore - hull.across).toFixed(1)} above the shore`).toBeLessThanOrEqual(wade.heave + 0.5);
      // And the bank is acid where it stands.
      expect(world.corridor!.poolFrom, 'the acid it stands in does not reach its near side').toBeLessThanOrEqual(hull.along - wade.pool + 1e-9);
      expect(world.corridor!.poolTo, 'the acid it stands in does not reach its far side').toBeGreaterThanOrEqual(hull.along + wade.pool - 1e-9);
      watched++;
    }
    expect(watched, 'the hydra never stood in the fight, so this measured nothing').toBeGreaterThan(100);
  });

  it('AND THE CLOCKWORK HEAD BURNS FIRST: its aura is round it at the last phase, nowhere before, and alone while it rises', () => {
    /*
      ⚠️ **ALONE ONLY WHILE IT RISES SINCE 0389**, which set the whole animal alight once it has: the
      claim this held — *nowhere but the clockwork* — is now true for the rise and no longer after it.
      0389's own block holds the rest.
    */
    const burning = NECKS.necks[4]!.aura!.frames as readonly number[];
    const flamesAt = (fraction: number, steps: number): Driven & { flames: number } => {
      const d = hydraAt(fraction);
      for (let i = 0; i < steps; i++) {
        d.world.ship.health = d.world.shipRow.health;
        d.world.bossPool.at(0).fireIn = 999;
        d.frame.step();
      }
      let flames = 0;
      for (let i = 0; i < d.world.bossAura.size; i++) if (burning.includes(d.world.bossAura.at(i).sprite)) flames++;
      return { ...d, flames };
    };
    expect(flamesAt(0.35, NECKS.rise + 10).flames, 'something burns before the clockwork head has grown').toBe(0);
    const last = flamesAt(0.15, NECKS.rise - 10);
    expect(last.flames, 'the clockwork head does not burn').toBeGreaterThan(0);
    const head = last.world.bossBody.at(4);
    for (let i = 0; i < last.world.bossAura.size; i++) {
      const flame = last.world.bossAura.at(i);
      if (!burning.includes(flame.sprite)) continue;
      const gap = Math.hypot(flame.along - head.along, flame.across - head.across);
      expect(gap, 'a flame burns off somewhere other than the clockwork head and its neck').toBeLessThanOrEqual(NECKS.necks[4]!.reach);
    }
  });
});

/**
 * The hydra catches fire — `docs/decisions/0389-the-hydra-catches-fire.md`.
 *
 * Asked for: *"all the heads need to get their flaming aura when the last head emerges and the aura
 * needs to travel down the neck and merge into a combined aura that covers the whole body and tail as
 * well."*
 */
describe('0389 — the hydra catches fire', () => {
  const BLAZE = NECKS.blaze!;
  const FIRE = NECKS.necks[BLAZE.from]!.aura!.frames as readonly number[];

  /** The hydra at its last phase, `after` steps past the step the clockwork finished rising; its flames. */
  function burningAt(after: number): Driven & { flames: { along: number; across: number }[] } {
    const d = hydraAt(0.1);
    for (let i = 0; i <= NECKS.rise + after; i++) {
      d.world.ship.health = d.world.shipRow.health;
      d.world.bossPool.at(0).fireIn = 999;
      d.frame.step();
    }
    const flames = [];
    for (let i = 0; i < d.world.bossAura.size; i++) {
      const f = d.world.bossAura.at(i);
      if (FIRE.includes(f.sprite)) flames.push({ along: f.along, across: f.across });
    }
    return { ...d, flames };
  }
  const near = (flames: { along: number; across: number }[], along: number, across: number, within: number): boolean =>
    flames.some((f) => Math.hypot(f.along - along, f.across - across) <= within);
  const whole = BLAZE.travel + BLAZE.gap * BLAZE.spots.length;

  it('THE ASK, IN WORLD UNITS: once the last head has risen every head burns, every neck, and the body and the tail', () => {
    const d = burningAt(whole + 5);
    const hull = d.world.bossPool.at(0);
    for (let k = 0; k < NECKS.necks.length; k++) {
      const head = d.world.bossBody.at(k);
      expect(near(d.flames, head.along, head.across, 1), `head ${k} does not burn`).toBe(true);
      // And down its neck: a flame between the head and the root, off the head.
      const inward = d.flames.filter((f) => {
        const fromHead = Math.hypot(f.along - head.along, f.across - head.across);
        return fromHead > 5 && fromHead < NECKS.necks[k]!.reach * 0.75;
      });
      expect(inward.length, `the fire never ran down neck ${k}`).toBeGreaterThan(0);
    }
    for (const [i, spot] of BLAZE.spots.entries()) {
      expect(near(d.flames, hull.along + spot.along, hull.across + spot.across, 1), `place ${i} on the body or tail never caught`).toBe(true);
    }
    // All of it fits the aura's pool: flames, necks and the tail, none of them dropped.
    expect(d.world.bossAura.size, 'the aura pool could not hold the blaze, so something was not drawn').toBe(d.flames.length + NECKS.necks.length + 1);
  });

  it('IT TRAVELS, IN SECONDS: the heads catch first, the fire runs down the necks after, the body last', () => {
    /*
      *"Travel down the neck and merge"*: an order, and a time a player can watch it in. Every head
      burns the step the blaze lights and the body does not; half way the necks' outer flames are lit and
      their inner ones are not; the body catches only once every neck has; and the whole takes between
      half a second and three.
    */
    const heads = NECKS.necks.length;
    const start = burningAt(1);
    const clockwork = 3;
    expect(start.flames.length, 'the heads did not all catch together').toBe(clockwork + heads - 1);
    const half = burningAt(Math.ceil(BLAZE.travel / 2) + 1);
    expect(half.flames.length, 'half way, the fire is not on the necks’ outer flames').toBe(clockwork + (heads - 1) * 2);
    const necksDone = burningAt(BLAZE.travel + 1);
    expect(necksDone.flames.length, 'the fire has not reached the roots of the necks').toBe(heads * 3);
    const hull = necksDone.world.bossPool.at(0);
    const body = BLAZE.spots[0]!;
    expect(near(necksDone.flames, hull.along + body.along, hull.across + body.across, 1), 'the body caught before the necks had').toBe(false);
    expect(whole / STEPS_PER_SECOND, 'the fire takes the whole animal too fast to be seen travelling').toBeGreaterThanOrEqual(0.5);
    expect(whole / STEPS_PER_SECOND, 'the fire takes the whole animal too slowly to read as one blaze').toBeLessThanOrEqual(3);
  });
});

/**
 * The heads take a breath between them — `docs/decisions/0392-the-heads-take-a-breath.md`.
 *
 * Asked from play: *"the attacks from the different heads come too fast to each and merge together,
 * needs to be a slightly longer pause, maybe .4 sec for each heads attack, it's fine if they go out of
 * sync with each, but at the moment they're clustered together and it's too hard to dodge."*
 */
describe('0392 — the heads take a breath', () => {
  it('THE REPORTED ONE, IN SECONDS: on every tier and at every round of heads, no head throws within 0.8 s of the last one finishing', () => {
    /*
      Where the player meets it: the hydra in each phase that has a round, flown for twenty seconds on
      each tier. A head's attack is still going while the hull holds a beam or has a spray or a staggered
      wall left to throw; the moment neither is true it has finished, and the next head's volley — the
      round's count moving on — must come at least 0.8 s after that.

      ⚠️ **0.8 IS THE QUIET THE ROUND HAD, PLUS THE 0.4 ASKED FOR.** Measured before this, the quiet
      after a head was the phase's cadence: 0.5 s on Savior at five heads and 0.4 on Burn — so *at
      least 0.4 s* was already true, and the ask is 0.4 s MORE. The tightest round before was Burn's,
      at 0.4, so this is the floor that the round without the breath fails and the round with it keeps.
    */
    const floor = 0.8;
    for (const tier of DIFFICULTY_KINDS) for (const hold of [0.7, 0.5, 0.3, 0.1]) {
      const { world } = playableWorld(HYDRA_ONLY, tier);
      const frame = new GameFrame(world);
      for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
        world.ship.health = world.shipRow.health;
        frame.step();
      }
      const boss = world.bossPool.at(0);
      // The last step the previous head's attack was still going — the step it was thrown, for one
      // that is over at once — or −1 before the first volley has been seen.
      let lastBusy = -1;
      let lastCount = boss.headAt;
      let volleys = 0;
      let tightest = Number.POSITIVE_INFINITY;
      for (let step = 0; step < 20 * STEPS_PER_SECOND; step++) {
        boss.health = world.bossFullHealth * hold;
        world.ship.health = world.shipRow.health;
        world.ship.invulnFor = 999;
        frame.step();
        if (boss.headAt !== lastCount) {
          lastCount = boss.headAt;
          if (lastBusy >= 0) {
            volleys++;
            tightest = Math.min(tightest, step - lastBusy);
          }
          lastBusy = step;
        } else if (lastBusy >= 0 && (boss.holdFor > 0 || boss.sprayLeft > 0)) {
          lastBusy = step;
        }
      }
      expect(volleys, `${tier} at ${hold}: the round never came round, so this measured nothing`).toBeGreaterThan(5);
      expect(
        tightest / STEPS_PER_SECOND,
        `${tier} at ${hold}: a head threw ${(tightest / STEPS_PER_SECOND).toFixed(2)} s after the last one finished`,
      ).toBeGreaterThanOrEqual(floor);
    }
  });
});

describe('0459 — the hydra stands at the edge, and the screen stops for it', () => {
  it('THE ASK: the camera comes to rest for the fight, and the hull holds four fifths of the way across the narrowest screen or further', () => {
    /*
      *"Hydra needs to be closer to the right edge of the screen, it's too far in at the moment. Background
      also needs to stop scrolling for this boss fight."* In the player's units: the camera's own step, and
      where across the screen the hull stands for every step of a drift.
    */
    const row = BOSSES.hydra;
    expect(row.room, 'the hydra’s fight scrolls on').not.toBeNull();
    expect(row.room!.wall, 'the hydra’s room has walls, which nobody asked for').toBeNull();
    const d = hydraAt(1);
    const narrow = ACROSS_SPAN * (16 / 9);
    let nearest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 300; i++) {
      d.world.ship.health = d.world.shipRow.health;
      d.world.bossPool.at(0).fireIn = 999;
      d.frame.step();
      expect(d.world.scrollPerStep, `the camera is still moving on step ${i} of the hydra’s fight`).toBe(0);
      nearest = Math.min(nearest, d.world.bossPool.at(0).along - d.world.cameraAlong);
    }
    expect(nearest / narrow, `the hydra came ${nearest.toFixed(0)} units across a ${narrow.toFixed(0)}-unit screen`).toBeGreaterThanOrEqual(0.8);
  });
});

describe('0464 — the hydra is one beast', () => {
  it('every row’s necks fit the pool in front of the body', () => {
    for (const kind of BOSS_KINDS) {
      const necks = BOSSES[kind].necks;
      if (necks !== undefined) expect(necks.necks.length, `${kind} grows more necks than there are collars`).toBeLessThanOrEqual(CAPACITY.bossFront);
    }
  });

  it('THE ASK: every grown neck leaves the body IN FRONT of it — its collar drawn over the hull, at its own neck’s root and turn', () => {
    /*
      *"The extra heads don't really fit and blend into the body that well."* The body's outline crossed
      every neck where they met, because every neck was drawn behind the body and nothing of it in front.
      At each phase, stood: the layer the collars are in is drawn after the hull's, there is one for every
      neck, and each is exactly where its neck is — a collar anywhere else is a second neck.
    */
    // Off the game's own draw order, which is composed inside `mount` and read as `tests/flares.test.ts` reads it.
    const source = readFileSync(resolve(fileURLToPath(new URL('.', import.meta.url)), '../src/app/mount.ts'), 'utf8');
    const order = (/layers: \[([^\]]+)\]/.exec(source)?.[1] ?? '').split(',').map((s) => s.trim());
    expect(order.indexOf('bossPool'), 'mount.ts no longer draws the hull').toBeGreaterThanOrEqual(0);
    expect(order.indexOf('bossFront'), 'the collars are drawn under the body').toBeGreaterThan(order.indexOf('bossPool'));
    expect(order.indexOf('bossFront'), 'the collars are drawn over what flies').toBeLessThan(order.indexOf('enemies'));
    [1, 0.75, 0.55, 0.35, 0.15].forEach((fraction, phase) => {
      const d = hydraAt(fraction);
      settle(d);
      const { world } = d;
      expect(world.bossFront.size, `at ${fraction * 100}% the hydra has ${world.bossFront.size} collars for ${phase + 1} necks`).toBe(phase + 1);
      for (let k = 0; k <= phase; k++) {
        const row = NECKS.necks[k]!;
        // By what each piece IS, not what it wears this step: since 0486 a lit neck wears its hurt twin.
        let collar = null;
        for (let i = 0; i < world.bossFront.size; i++) if (world.bossFront.at(i).spriteBase === row.collar) collar = world.bossFront.at(i);
        let neck = null;
        for (let i = 0; i < world.bossAura.size; i++) if (world.bossAura.at(i).spriteBase === row.art) neck = world.bossAura.at(i);
        expect(collar, `neck ${k} has no collar of its own`).not.toBeNull();
        expect(neck, `neck ${k} is not drawn`).not.toBeNull();
        expect(Math.hypot(collar!.along - neck!.along, collar!.across - neck!.across), `neck ${k}'s collar stands off its root`).toBeLessThan(1e-9);
        expect(Math.abs(collar!.turn - neck!.turn), `neck ${k}'s collar is turned off its neck`).toBeLessThan(1e-9);
      }
    });
  });

  it('AND IT COVERS THE JOIN, IN WORLD UNITS: whole for a unit and a half past the body’s outline on every neck, and inside its own tile', () => {
    /*
      What a collar is FOR is the stretch of neck the body's outline crosses. Where its spine crosses the
      outline at rest, it must still be whole a unit and a half further out — the outline's outer half and
      the neck's sway at the join — or the line is back across the neck. And its drawing, to its cut, has
      to fit the tile it is baked into, or the bake cuts it off square.
    */
    for (let k = 0; k < NECKS.necks.length; k++) {
      const row = NECKS.necks[k]!;
      const r = SPRITE_EXTENT[SPRITE_KINDS[row.art]!] * 0.42;
      const spine = neckSpine(row.reach / r);
      const collar = hydraCollarOf(k);
      const whole = (spine[collar.out]![0] - collar.edge.at[0]) * r;
      expect(whole, `neck ${k}'s collar fades ${whole.toFixed(2)} units past the body's outline`).toBeGreaterThanOrEqual(1.5);
      const kind = SPRITE_KINDS[row.collar]!;
      const size = SPRITE_EXTENT[kind] * 10;
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'mire');
      for (const [x, y] of trace.passes[0]!.subpaths.flat()) {
        expect(Math.min(x, y, size - x, size - y), `${kind} is drawn off its tile`).toBeGreaterThan(0);
      }
    }
  });
});

describe('0486 — the neck bends', () => {
  /** Neck `k`'s lower neck as laid this step: the aura entity that IS it, whatever it wears. */
  const lowerOf = (d: Driven, k: number): ReturnType<Driven['world']['bossAura']['at']> | null => {
    for (let i = 0; i < d.world.bossAura.size; i++) if (d.world.bossAura.at(i).spriteBase === NECKS.necks[k]!.art) return d.world.bossAura.at(i);
    return null;
  };

  it('THE ASK, IN PIXELS: every head’s bitmap is one outline round the skull and its upper neck, and the neck in it runs back to its knuckle', () => {
    /*
      The plan's first seam: *"the head is its own sprite with its own closed outline, sat on a neck tip
      0.085 r wide."* Traced at a 1280×720 screen, the head's hull is ONE closed line, and the way back from
      the head's centre toward its knuckle — as the neck stands at rest — is inside it for most of the run.
    */
    const scale = 1280 / (ACROSS_SPAN * (16 / 9));
    for (let k = 0; k < NECKS.necks.length; k++) {
      const row = NECKS.necks[k]!;
      const kind = SPRITE_KINDS[row.head]!;
      const size = SPRITE_EXTENT[kind] * scale;
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'mire');
      const hull = trace.passes[0]!;
      expect(hull.subpaths.length, `head ${k} is ${hull.subpaths.length} outlines, not one round the skull and its neck`).toBe(1);
      const joint = hydraJointOf(k);
      // From the head's centre back to the knuckle, at rest: the upper run turned by the row's angle, reversed.
      const c = Math.cos(row.angle);
      const s = Math.sin(row.angle);
      const back = [-(joint.upper[0] * c - joint.upper[1] * s), -(joint.upper[0] * s + joint.upper[1] * c)];
      for (const share of [0.3, 0.55, 0.8]) {
        const at: [number, number] = [size / 2 + back[0]! * share * scale, size / 2 + back[1]! * share * scale];
        expect(inside(hull, at), `head ${k}'s bitmap has no neck ${(share * 100).toFixed(0)}% of the way back to its knuckle`).toBe(true);
      }
    }
  });

  it('THE HEAD TURNS WITH ITS NECK, DRIVEN: on every step, rising and risen, each head stands its upper run from its knuckle along its own turn, and bends no further from its lower neck than the row lets it', () => {
    /*
      The plan's guard: *"the head's turn equals the upper neck's turn on every step."* The upper neck is
      drawn into the head's bitmap at the row's rest angle, so a head turned `t` has its upper neck at
      `rest + t` — and its centre must be exactly there from the knuckle, or the bitmap's neck points
      somewhere the knuckle is not. Flown from the step every neck is born, so the rise is in it.
    */
    const d = hydraAt(0.15);
    let rising = 0;
    for (let step = 0; step < NECKS.rise + 120; step++) {
      d.world.ship.health = d.world.shipRow.health;
      d.world.bossPool.at(0).fireIn = 999;
      d.world.ship.across = 20 + ((step * 7) % 80);
      d.frame.step();
      for (let k = 0; k < d.world.bossBody.size; k++) {
        const row = NECKS.necks[k]!;
        const lower = lowerOf(d, k);
        expect(lower, `neck ${k} is not laid`).not.toBeNull();
        const head = d.world.bossBody.at(k);
        const joint = hydraJointOf(k);
        const c = Math.cos(lower!.turn);
        const s = Math.sin(lower!.turn);
        const knuckle = [lower!.along + joint.knuckle[0] * c - joint.knuckle[1] * s, lower!.across + joint.knuckle[0] * s + joint.knuckle[1] * c];
        const carried = row.angle + head.turn;
        const cc = Math.cos(carried);
        const cs = Math.sin(carried);
        const off = Math.hypot(head.along - (knuckle[0]! + joint.upper[0] * cc - joint.upper[1] * cs), head.across - (knuckle[1]! + joint.upper[0] * cs + joint.upper[1] * cc));
        expect(off, `step ${step}: head ${k} stands ${off.toFixed(3)} units off where its own turn carries its neck`).toBeLessThan(1e-6);
        const bent = Math.abs(foldTurn(head.turn - foldTurn(lower!.turn - row.angle)));
        expect(bent, `step ${step}: head ${k} is bent ${bent.toFixed(2)} rad from its lower neck`).toBeLessThanOrEqual(NECKS.bend + 1e-9);
        if (Math.abs(foldTurn(lower!.turn - row.angle)) > NECKS.bend) rising++;
      }
    }
    expect(rising, 'no neck was ever far enough from rest for the knuckle to bend it, so the rise was never flown').toBeGreaterThan(0);
  });

  it('IN WORLD UNITS: every neck bends where it has left the body, and far enough behind its head that a neck shows between them', () => {
    for (let k = 0; k < NECKS.necks.length; k++) {
      // `out` is the first knot wholly out of the body at every sway (0464).
      expect(hydraKnuckleOf(k), `neck ${k} bends inside the body`).toBeGreaterThanOrEqual(hydraCollarOf(k).out);
      // The skull's back is at most nine tenths of its drawing's radius from its centre; two units of neck past that.
      const { upper } = hydraJointOf(k);
      const run = Math.hypot(upper[0], upper[1]);
      expect(run, `neck ${k}'s knuckle is ${run.toFixed(1)} units from its head's centre, inside the skull`).toBeGreaterThanOrEqual(HYDRA_SKULL * 0.42 * 0.9 + 2);
    }
  });

  it('THE WHOLE ANIMAL FLASHES AS ONE: a hit on any head lights the body, every neck, every collar, every head and the tail — and every piece has a twin of its own', () => {
    /*
      The plan's third seam: *"head and body wear hurt twins, necks and collars have none, so on every hit a
      white head and a white body sit with coloured necks between."*
    */
    for (const row of NECKS.necks) {
      expect(row.artHit, 'a neck has no hurt twin of its own').not.toBe(row.art);
      expect(row.collarHit, 'a collar has no hurt twin of its own').not.toBe(row.collar);
      expect(row.headHit, 'a head has no hurt twin of its own').not.toBe(row.head);
    }
    const d = hydraAt(0.15);
    settle(d);
    const hull = d.world.bossPool.at(0);
    for (let k = 0; k < d.world.bossBody.size; k++) d.world.bossBody.at(k).flashFor = 0;
    hull.flashFor = 0;
    // One head hit, and nothing else.
    d.world.bossBody.at(2).flashFor = 4;
    d.world.bossPool.at(0).fireIn = 999;
    d.frame.step();
    expect(hull.sprite, 'a head was hit and the body was not lit').toBe(hull.spriteHit);
    for (let k = 0; k < d.world.bossBody.size; k++) {
      const row = NECKS.necks[k]!;
      expect(d.world.bossBody.at(k).sprite, `head ${k} was not lit with the rest`).toBe(row.headHit);
      expect(lowerOf(d, k)!.sprite, `neck ${k} was not lit with the rest`).toBe(row.artHit);
      let collar = null;
      for (let i = 0; i < d.world.bossFront.size; i++) if (d.world.bossFront.at(i).spriteBase === row.collar) collar = d.world.bossFront.at(i);
      expect(collar?.sprite, `collar ${k} was not lit with the rest`).toBe(row.collarHit);
    }
    const tail = BOSSES.hydra.tail!;
    let lit = false;
    for (let i = 0; i < d.world.bossAura.size; i++) if (d.world.bossAura.at(i).sprite === tail.art.spriteHit) lit = true;
    expect(lit, 'the tail was not lit with the rest').toBe(true);
  });

  it('BACK TO FRONT: the necks are laid most upright first, the same way on every step', () => {
    const d = hydraAt(0.15);
    settle(d);
    const depth = (k: number): number => Math.abs(foldTurn(NECKS.necks[k]!.angle + Math.PI / 2));
    const laid: number[] = [];
    for (let i = 0; i < d.world.bossAura.size; i++) {
      const k = NECKS.necks.findIndex((n) => n.art === d.world.bossAura.at(i).spriteBase);
      if (k >= 0) laid.push(k);
    }
    expect(laid.length, 'not every neck is laid').toBe(NECKS.necks.length);
    for (let i = 1; i < laid.length; i++) expect(depth(laid[i]!), `neck ${laid[i]} is laid over neck ${laid[i - 1]}, which reaches further forward`).toBeGreaterThanOrEqual(depth(laid[i - 1]!));
  });
});
