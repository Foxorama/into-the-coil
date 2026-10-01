/**
 * A boss fires from its guns — `docs/decisions/0452-a-boss-fires-from-its-guns.md`.
 *
 * Played: *"the pteradactyl boss fires it lasers from the wrong spot, they don't fire from the end of the
 * cannons or from it's mouth"*, and *"I think it's pretty similar across a lot of bosses so do a full pass
 * and make sure that bullets and attacks fire from the right place."* It was: photographed, the serpent's
 * acid left its cheek, the fish's spines its belly, the mid-bosses' fans their middles, and the hydra's
 * lance ended beside the jaw it was drawn coming out of.
 *
 * ⚠️ **TWO HALVES, BECAUSE THE FACT HAS TWO OWNERS** — 0448's own shape. Where a gun is DRAWN is the
 * bake's (`BOSS_MUZZLES` in `src/render/bake.ts`), and where a shot LEAVES is the row's, which may not
 * import the bake. So the rows are held to the drawing here, and the frame is held to the rows, in pixels
 * on the screen the reports were made on. The pterodactyl's beam roots are `tests/quetzal.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { muzzleAcrossOf, muzzleAlongOf } from '../src/app/boss.ts';
import { BEAM_BOLT_KIND, BOSSES, BOSS_KINDS, type BossKind } from '../src/content/bosses.ts';
import { LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { BOSS_MUZZLES } from '../src/render/bake.ts';
import { viewOf } from '../src/sim/camera.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** A boss's drawing radius in world units: a sprite's frame puts it at 0.42 of the extent. */
const radiusOf = (kind: BossKind): number => SPRITE_EXTENT[SPRITE_KINDS[BOSSES[kind].sprite]!]! * 0.42;

/** World units to pixels on the 1280×720 screen the reports were made on. */
const PX = viewOf(1280, 720).scale;

type Driven = { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame };

/** `kind` alone in the place it is fought in, on station, its volleys held until the test says. */
function onStation(kind: BossKind, fraction = 1): Driven {
  const home = LEVEL_KINDS.find((k) => LEVELS[k].boss === kind || LEVELS[k].midBoss?.kind === kind)!;
  const level: LevelRow = { waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss: kind, theme: LEVELS[home].theme };
  const { world } = playableWorld(level);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    // Held whole on the way in: the parked ship's own fire takes a mid-boss apart before it is asked anything.
    if (world.bossPool.size > 0) {
      world.bossPool.at(0).fireIn = 999;
      world.bossPool.at(0).health = world.bossFullHealth * fraction;
    }
    frame.step();
  }
  expect(world.bossPool.size, `${kind} never arrived`).toBe(1);
  world.enemyShots.clear();
  world.bolts.clear();
  return { world, frame };
}

/** One step, the ship and the boss both held where the test put them — the ship's fire would otherwise move a phase. */
function hold(d: Driven, fraction: number): void {
  d.world.ship.health = d.world.shipRow.health;
  d.world.bossPool.at(0).health = d.world.bossFullHealth * fraction;
  d.frame.step();
}

describe('0452 — a boss fires from its guns', () => {
  it('THE ROWS ARE THE DRAWING: every boss’s muzzle is where its bake draws its gun, or both say it has none', () => {
    for (const kind of BOSS_KINDS) {
      const drawn = BOSS_MUZZLES[kind];
      const row = BOSSES[kind].muzzle;
      if (drawn === null) {
        expect(row, `${kind}: the row names a muzzle the drawing does not have`).toBeNull();
        continue;
      }
      expect(row, `${kind}: the drawing has a gun and the row fires from the centre`).not.toBeNull();
      const r = radiusOf(kind);
      const gap = Math.hypot(row!.along - drawn[0] * r, row!.across - drawn[1] * r);
      expect(gap * PX, `${kind}: the row's muzzle is ${(gap * PX).toFixed(1)} px from the gun drawn`).toBeLessThan(2);
      // Ahead of the centre: a hull with its face at one end fires from that end, toward the player.
      expect(row!.along, `${kind}: the muzzle is not on the player's side of the hull`).toBeLessThan(0);
    }
  });

  it('THE VOLLEY LEAVES IT, IN PIXELS: every boss with a gun throws its opening volley from the gun and not its middle', () => {
    let checked = 0;
    for (const kind of BOSS_KINDS) {
      const drawn = BOSS_MUZZLES[kind];
      if (drawn === null) continue;
      const d = onStation(kind);
      const boss = d.world.bossPool.at(0);
      d.world.ship.across = boss.across < 50 ? 85 : 15;
      boss.fireIn = 1;
      hold(d, 1);
      expect(d.world.enemyShots.size, `${kind}'s opening volley put nothing in the air`).toBeGreaterThan(0);
      // The gun as DRAWN, turned with the hull — the boss on the step it threw, which `prevAlong` keeps.
      const r = radiusOf(kind);
      const [x, y] = [drawn[0] * r, drawn[1] * r];
      const along = boss.prevAlong + x * Math.cos(boss.turn) - y * Math.sin(boss.turn);
      const across = boss.prevAcross + x * Math.sin(boss.turn) + y * Math.cos(boss.turn);
      const attack = BOSSES[kind].phases[0]!.attack ?? BOSSES[kind].attack;
      for (let i = 0; i < d.world.enemyShots.size; i++) {
        const s = d.world.enemyShots.at(i);
        // A wall is laid level with the gun and a gap either side of it; everything else leaves the gun itself.
        const off = attack.kind === 'wall' ? Math.abs(s.prevAlong - along) : Math.hypot(s.prevAlong - along, s.prevAcross - across);
        expect(off * PX, `${kind}: a shot left ${(off * PX).toFixed(1)} px from the gun drawn`).toBeLessThan(12);
        checked++;
      }
      // And not from the middle, which is where every one of these used to leave.
      const s = d.world.enemyShots.at(0);
      expect(Math.abs(s.prevAlong - boss.prevAlong) * PX, `${kind}: the volley left level with the hull's centre`).toBeGreaterThan(30);
    }
    expect(checked, 'no boss with a gun threw anything, so nothing was held').toBeGreaterThan(10);
  });

  it('THE MUZZLE TURNS WITH THE HEAD: the serpent reared still fires from its jaw', () => {
    /*
      The sprite is blitted turned by `turn`, so the mouth on the screen goes round the centre with it. A
      muzzle that stayed where it was unturned leaves the jaw by a third of the skull at the rear's angle.
    */
    const d = onStation('jormungandr');
    const boss = d.world.bossPool.at(0);
    const muzzle = BOSSES.jormungandr.muzzle!;
    for (const turn of [0, 0.4, -0.4, Math.PI / 2]) {
      boss.turn = turn;
      const along = muzzleAlongOf(boss, BOSSES.jormungandr, d.world.mouths) - boss.along;
      const across = muzzleAcrossOf(boss, BOSSES.jormungandr, d.world.mouths) - boss.across;
      // The same distance from the centre, and its bearing turned by exactly the hull's turn.
      expect(Math.hypot(along, across)).toBeCloseTo(Math.hypot(muzzle.along, muzzle.across), 6);
      const turned = Math.atan2(across, along) - Math.atan2(muzzle.across, muzzle.along);
      expect(Math.cos(turned), `at ${turn} the muzzle did not turn with the head`).toBeCloseTo(Math.cos(turn), 6);
      expect(Math.sin(turned), `at ${turn} the muzzle did not turn with the head`).toBeCloseTo(Math.sin(turn), 6);
    }
  });

  it('THE LANCE STAYS IN THE JAW: the hydra’s laser head holds its aim while its beam is on, however the ship moves', () => {
    const d = onStation('hydra', 0.15);
    const necks = BOSSES.hydra.necks!;
    // Let the newest neck rise, then throw round the heads until the laser's turn comes.
    for (let i = 0; i < necks.rise + 10; i++) {
      d.world.bossPool.at(0).fireIn = 999;
      hold(d, 0.15);
    }
    let lit = false;
    for (let v = 0; v < 6 && !lit; v++) {
      d.world.enemyShots.clear();
      d.world.bolts.clear();
      d.world.ship.across = 20;
      d.world.bossPool.at(0).fireIn = 1;
      hold(d, 0.15);
      for (let i = 0; i < d.world.bolts.size; i++) if (d.world.bolts.at(i).kind === BEAM_BOLT_KIND) lit = true;
    }
    expect(lit, 'no head lit a laser in six volleys').toBe(true);
    const boss = d.world.bossPool.at(0);
    const k = boss.muzzleAt;
    let held = 0;
    let worst = 0;
    // The ship crosses the whole lane while the beam is on: a head that followed it would swing its mouth.
    for (let i = 0; i < 80 && boss.holdFor > 0; i++) {
      d.world.ship.across = 20 + i;
      hold(d, 0.15);
      let beam = null;
      for (let j = 0; j < d.world.bolts.size; j++) if (d.world.bolts.at(j).kind === BEAM_BOLT_KIND) beam = d.world.bolts.at(j);
      if (beam === null) break;
      const head = d.world.bossBody.at(k);
      const reach = necks.necks[k]!.mouth;
      const mouthAcross = head.across - Math.sin(head.turn) * reach;
      worst = Math.max(worst, Math.abs(beam.across - mouthAcross));
      held++;
    }
    expect(held, 'the beam was not held long enough to ask').toBeGreaterThan(20);
    expect(worst * PX, `the lance's root wandered ${(worst * PX).toFixed(1)} px off the jaw it leaves`).toBeLessThan(6);
  });
});
