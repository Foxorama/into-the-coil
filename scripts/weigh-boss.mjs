// How long a real boss's fight lasts, in SECONDS, flown through the real frame with each gun.
//
// Usage:
//   node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-boss.mjs
//        [bossKind …] [--difficulty=savior] [--tier=4] [--health=N]
//
// ⚠️ IT WAS OWED BY TWO DECISIONS BEFORE IT EXISTED. docs/decisions/0288-the-skull-is-longer.md
// drove the serpent's fight with a scratch script and wrote *"if the next change to this animal moves
// the fight again, the second thing to build is `scripts/weigh-boss.mjs`"*; 0298 said *"a boss figure
// needs a fixture that stands the boss on station and flies the fight."* 0307 is the change that
// moved it, and the report it answers — *"the lightning gun and auto-fire gun only hit the head so
// they take forever to kill the boss"* — is a claim about a clock that nothing in the repository
// could read. docs/decisions/0027-measure-the-picture-not-the-model.md: the instrument first.
//
// ⚠️ THE MODEL IT REPLACES WAS WRONG BY A FACTOR OF THREE ON THE BOSS IT WAS WRITTEN FOR. 0260's floor
// computes a fight as `health × toughness / FASTEST`, where FASTEST is every shot of the fullest
// loadout landing. Flown against the serpent, the pulse landed about a third of that and the
// shuriken, whose blades ride up a body 133 units long, about all of it — so the model said one
// number for three fights that differed four-fold. What reaches a boss is where the ship stands,
// what the boss throws in the way, and how big the thing being hit is, and only the frame knows.
//
// WHAT IT PRINTS, per boss and per gun
//
//   held lanes       the fight flown from fifteen fixed places — five lanes across, at rest and held
//                    60 and 45 units short of the hull — as median, best and worst. A player does
//                    not stand still, so no one of these is THE fight; the spread is the answer.
//   on its lane      the ship kept on the boss's own lane at the same three distances, which is
//                    how a gun that fires straight is flown at something that moves.
//   phases           the best place's fight, split at the boss's own phase boundaries.
//
// ⚠️ THE SHIP CANNOT BE HIT AND THE MISSILES ARE SILENCED, both on purpose: a death is a respawn
// and a lost rung, which would measure the pilot, and a seeker is a second gun that every loadout
// has, so it would narrow every difference this exists to show. A fight that never finishes is
// reported as `never` rather than as its cap, and the script exits non-zero if a boss is never
// fought at all — an instrument that measured nothing must not report success
// (docs/decisions/0199-a-verdict-is-an-exit-code.md).

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { WEAPON_KINDS } from '../src/content/weapons.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from '../tests/world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;
/** Ten minutes. A fight longer than this is reported as never finishing, which is what it is. */
const CAP_SECONDS = 600;
/** Five lanes across the fixed 100 — 0023 — and never the edges, which no pilot fights from. */
export const LANES = [20, 35, 50, 65, 80];
/** At rest, then held this many units short of the hull's near edge. */
export const DISTANCES = [null, 60, 45];

/** The boss alone at the end of a short level in its own place, with nothing in front of it. */
function arena(kind) {
  const home = LEVEL_KINDS.find((level) => LEVELS[level].boss === kind);
  if (home === undefined) throw new Error(`${kind} is no level's end boss`);
  return { waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: kind, theme: LEVELS[home].theme };
}

/**
 * One fight, flown to the end or to the cap.
 *
 * `lane` is a place across the lane or `'boss'` for the boss's own; `short` is how far short of the
 * hull the ship is held along the lane, or `null` to leave it where it rests. Returns the seconds
 * from the first step the boss could be hurt — its entrance is not the fight (0306) — or `null` if
 * it outlived `cap`, and each phase the fight entered with the second it entered it.
 *
 * @param {import('../src/content/bosses.ts').BossKind} kind
 * @param {import('../src/content/weapons.ts').WeaponKind} gun
 * @param {{ tier?: number, difficulty?: import('../src/content/difficulty.ts').DifficultyKind,
 *   lane?: number | 'boss', short?: number | null, cap?: number }} [options]
 * @returns {{ seconds: number | null, phaseAt: { phase: number, at: number }[] }}
 */
export function flyFight(kind, gun, { tier = 4, difficulty = 'savior', lane = 50, short = null, cap = CAP_SECONDS } = {}) {
  const { world, wrecks } = playableWorld(arena(kind), difficulty);
  const frame = new GameFrame(world);
  const carried = [];
  for (let i = 0; i < tier; i++) carried.push('weapon');
  world.weapon = weaponFor(world.shipRow, carried, gun);
  wearHull(world);
  const row = BOSSES[kind];
  let start = -1;
  let phase = -1;
  const phaseAt = [];
  // The entrance is not the fight, and on the serpent it is about a thousand steps of it — 0306.
  for (let step = 0; step < cap * STEPS_PER_SECOND + 3000; step++) {
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = NEVER;
    world.missileIn = NEVER;
    if (world.bossPool.size > 0 && world.bossEntering < 0) {
      const boss = world.bossPool.at(0);
      if (start < 0) start = step;
      if (step - start > cap * STEPS_PER_SECOND) break;
      const now = row.phases.indexOf(phaseFor(row, boss.health, world.bossFullHealth));
      if (now !== phase) {
        phase = now;
        phaseAt.push({ phase: now, at: (step - start) / STEPS_PER_SECOND });
      }
      world.ship.prevAcross = world.ship.across;
      world.ship.across = lane === 'boss' ? boss.across : lane;
      if (short !== null) {
        world.ship.prevAlong = world.ship.along;
        world.ship.along = boss.along - boss.radius - short;
      }
    }
    frame.step();
    if (wrecks.count > 0) throw new Error(`${kind}, ${gun}: the ship died, so this measured a respawn`);
    if (world.weapon.kind !== gun) throw new Error(`${kind}, ${gun}: the gun changed to ${world.weapon.kind}`);
    if (start >= 0 && world.bossPool.size === 0) return { seconds: (step - start) / STEPS_PER_SECOND, phaseAt };
  }
  if (start < 0) throw new Error(`${kind} never came on to be fought`);
  return { seconds: null, phaseAt };
}

const isMain = process.argv[1] !== undefined && /weigh-boss\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (name, fallback) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit === undefined ? fallback : hit.slice(name.length + 3);
  };
  const named = args.filter((a) => !a.startsWith('--'));
  const kinds = named.length > 0 ? named : LEVEL_KINDS.map((level) => LEVELS[level].boss);
  const difficulty = flag('difficulty', 'savior');
  const tier = Number(flag('tier', 4));
  const health = flag('health', null);
  const secs = (s) => (s === null ? 'never' : `${s.toFixed(0)}s`);
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  let fought = 0;
  for (const kind of kinds) {
    // ⚠️ A WHAT-IF, NOT A SETTING: the row is patched in this process only, so a candidate number
    // can be flown before anybody types it into `src/content/bosses.ts`.
    if (health !== null) BOSSES[kind].health = Number(health);
    console.log(`\n${kind} — health ${BOSSES[kind].health}, ${difficulty}, tier ${tier}, missiles silenced, ship unhittable`);
    for (const gun of WEAPON_KINDS) {
      const held = [];
      let best = null;
      for (const lane of LANES) {
        for (const short of DISTANCES) {
          const fight = flyFight(kind, gun, { tier, difficulty, lane, short });
          held.push(fight.seconds ?? Number.POSITIVE_INFINITY);
          if (fight.seconds !== null && (best === null || fight.seconds < best.seconds)) best = fight;
        }
      }
      const onLane = DISTANCES.map((short) => secs(flyFight(kind, gun, { tier, difficulty, lane: 'boss', short }).seconds));
      const finite = (s) => (Number.isFinite(s) ? s : null);
      const phases = best === null ? '' : `   phases begin at ${best.phaseAt.map((p) => `${p.at.toFixed(0)}s`).join(', ')}`;
      console.log(
        `  ${gun.padEnd(9)} held lanes: median ${secs(finite(median(held))).padStart(5)}  best ${secs(finite(Math.min(...held))).padStart(5)}  ` +
          `worst ${secs(finite(Math.max(...held))).padStart(5)}   on its lane at rest/60/45: ${onLane.join(' / ')}${phases}`,
      );
      fought++;
    }
  }
  if (fought === 0) {
    console.error('no fight was flown, so this measured nothing');
    process.exit(1);
  }
}
