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
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BEAM_BOLT_KIND, BOSSES, BOSS_KINDS, type BossAttack } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { SHOTS, type ShotKind } from '../src/content/shots.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';
import { NECK_SLOTS } from '../src/app/mount.ts';
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
      for (let i = 0; i < d.world.bossAura.size; i++) drawn.add(d.world.bossAura.at(i).sprite);
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
        for (let s = 0; s < 30 && d.world.enemyShots.size < 2; s++) d.frame.step();
        const a = d.world.enemyShots.at(0);
        const b = d.world.enemyShots.at(1);
        // Along, where the first shard was thrown; across, the pair's middle — the pair flew on meanwhile.
        at = { along: at!.along, across: (a.across + b.across) / 2 };
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
