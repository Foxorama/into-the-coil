/**
 * The serpent strikes — `docs/decisions/0248-the-serpent-strikes.md`.
 *
 * The Approach's real boss, from the brief: *"Jormungandr … with acid blast attacks, void blast
 * attacks and then a space lightning bolt attack that rains down from the top of the screen, it'll
 * need warning lines."* Three phases, three weapons: what is held here is that a phase can change
 * what a boss throws, that the two new shots are their own things, and that the lightning warns
 * before it lands. What a boss IS — the roster, the fights — is `tests/bosses.test.ts`'s and
 * `tests/level.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES, RAIN_BOLT_KIND } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { BOLT_STEPS } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The serpent alone, a short way in, with no mid-boss in front of it. */
const SERPENT_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'jormungandr',
  theme: 'approach',
};

/** A serpent on station at `fraction` of its health, its fan silenced until the test says, and an immortal ship. */
function serpentAt(fraction: number): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
  const { world } = playableWorld(SERPENT_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the serpent never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  return { world, frame };
}

/** A surface that keeps every bolt stroke's hostility, so the picture can be asked whose lightning it drew. */
class Recorder implements Surface {
  readonly strokes: { count: number; alpha: number; hostile: boolean }[] = [];
  clear(): void {}
  blit(): void {}
  bolt(_points: Float32Array, count: number, _width: number, alpha: number, hostile: boolean): void {
    this.strokes.push({ count, alpha, hostile });
  }
}

describe('0248 — the serpent strikes', () => {
  it('THE THREE WEAPONS: acid while whole, void once hurt, lightning at the last third — a phase says what it throws', () => {
    const row = BOSSES.jormungandr;
    const whole = phaseFor(row, row.health);
    const hurt = phaseFor(row, row.health * 0.6);
    const last = phaseFor(row, row.health * 0.3);
    expect(whole.shot ?? row.shot, 'the serpent does not open with acid').toBe('acid');
    expect(hurt.shot ?? row.shot, 'the serpent does not turn to void when hurt').toBe('void');
    expect((whole.attack ?? row.attack).kind).not.toBe((hurt.attack ?? row.attack).kind);
    expect((last.attack ?? row.attack).kind, 'the serpent’s last third is not the lightning').toBe('rain');
    // And it is the Approach's real boss.
    expect(LEVELS.approach.boss).toBe('jormungandr');
    /*
      ⚠️ **AND DRIVEN, because the table is not the fight.** The probe that ignored a phase's shot
      in the frame left every line above green: the rows say void and the frame threw acid. One
      volley at each phase, and what is in the air is asked for its bitmap.
    */
    for (const [fraction, sprite] of [
      [1, SHOTS.acid.sprite],
      [0.6, SHOTS.void.sprite],
    ] as const) {
      const { world, frame } = serpentAt(fraction);
      world.enemyShots.clear();
      world.bossPool.at(0).fireIn = 1;
      frame.step();
      expect(world.enemyShots.size, `no volley at ${fraction} of the serpent’s health`).toBeGreaterThan(0);
      for (let i = 0; i < world.enemyShots.size; i++) {
        expect(world.enemyShots.at(i).sprite, `a shot at ${fraction} of the serpent’s health is not the phase’s`).toBe(sprite);
      }
    }
  });

  it('THE ACID AND THE VOID: two shots of their own, in inks of their own, that are not the enemy’s bullet', () => {
    /*
      0098: a boss with three kinds of shot in one colour is one bullet wearing three shapes. The
      silhouettes being distinct from every other shot's is `tests/legibility.test.ts`'s; what is
      held here is the ink, and that an acid blast is fatter and slower than a void one.
    */
    const acid = INK_OF[SPRITE_KINDS[SHOTS.acid.sprite]!];
    const voidInk = INK_OF[SPRITE_KINDS[SHOTS.void.sprite]!];
    expect(acid, 'acid wears the enemy’s bullet ink').not.toBe('enemy');
    expect(voidInk, 'void wears the enemy’s bullet ink').not.toBe('enemy');
    expect(acid, 'acid and void are one ink').not.toBe(voidInk);
    expect(voidInk, 'void wears the player’s ally ink, which is the seeker’s').not.toBe('ally');
    expect(SHOTS.acid.radius, 'an acid blast is no fatter than a void one').toBeGreaterThan(SHOTS.void.radius);
    expect(SHOTS.acid.speed, 'an acid blast is no slower than a void one').toBeLessThan(SHOTS.void.speed);
    expect(SHOTS.void.damage, 'a void blast is worth no more than an acid one').toBeGreaterThan(SHOTS.acid.damage);
  });

  it('THE RAIN: a volley draws its warning lines first, inside the box the ship flies in, and nothing hurts until they have run', () => {
    /*
      *"it'll need warning lines."* Driven: the serpent at its last third throws one volley; every
      column is a bolt in the arc's pool carrying `RAIN_BOLT_KIND`, its along inside the player's
      box, its life the warning plus the strike. The ship is parked in the first column and is not
      hurt for as long as the row's warning says — in seconds, at least half a one — and IS hurt on
      the step the line becomes lightning.
    */
    const { world, frame } = serpentAt(0.3);
    const boss = world.bossPool.at(0);
    boss.fireIn = 1;
    world.ship.health = world.shipRow.health;
    frame.step();
    const columns: number[] = [];
    for (let i = 0; i < world.bolts.size; i++) {
      const b = world.bolts.at(i);
      if (b.kind === RAIN_BOLT_KIND) columns.push(b.along);
    }
    expect(columns.length, 'the volley threw no lightning').toBeGreaterThanOrEqual(2);
    for (const along of columns) {
      const inView = along - world.cameraAlong;
      expect(inView, `a column fell ${inView.toFixed(1)} into the view, behind the ship’s box`).toBeGreaterThanOrEqual(PLAYER_ALONG_MARGIN - 1);
      expect(inView, `a column fell ${inView.toFixed(1)} into the view, past the ship’s box`).toBeLessThanOrEqual(PLAYER_LEAD + 1);
    }
    // Park the ship in the first column and hold it there: every step, no other fire.
    const column = world.bolts.at(0);
    const before = world.ship.health;
    let hurtAt = -1;
    boss.fireIn = 999;
    for (let step = 1; step <= 200 && hurtAt < 0; step++) {
      world.ship.along = column.along;
      world.ship.velAlong = world.scrollPerStep;
      // Not still lit from an acid blast in the approach: the strike is the only thing that may hurt.
      world.ship.invulnFor = 0;
      world.enemyShots.clear();
      boss.fireIn = 999;
      frame.step();
      if (world.ship.health < before) hurtAt = step;
    }
    expect(hurtAt, 'the lightning never landed on a ship parked under it').toBeGreaterThan(0);
    expect(hurtAt / STEPS_PER_SECOND, `the strike landed ${(hurtAt / STEPS_PER_SECOND).toFixed(2)} s after its line was drawn`).toBeGreaterThanOrEqual(0.5);
    expect(hurtAt / STEPS_PER_SECOND, 'the warning outlasts the patience anyone has for one').toBeLessThan(2);
  });

  it('and a ship elsewhere on the lane is not touched by it, however close across', () => {
    const { world, frame } = serpentAt(0.3);
    const boss = world.bossPool.at(0);
    boss.fireIn = 1;
    world.ship.health = world.shipRow.health;
    frame.step();
    expect(world.bolts.at(0).kind).toBe(RAIN_BOLT_KIND);
    // Somewhere in the ship's box that is clear of EVERY column by a column's width and a hull —
    // a volley is three, and a spot beside the first is under the second often enough.
    const clear = (offset: number): boolean => {
      for (let i = 0; i < world.bolts.size; i++) {
        const b = world.bolts.at(i);
        if (Math.abs(world.cameraAlong + offset - b.along) <= b.radius + world.ship.radius + 3) return false;
      }
      return true;
    };
    let offset = -1;
    for (let o = PLAYER_ALONG_MARGIN; o <= PLAYER_LEAD && offset < 0; o += 1) if (clear(o)) offset = o;
    expect(offset, 'the volley left nowhere in the box clear of a column, which is a wall and not a rain').toBeGreaterThan(0);
    const before = world.ship.health;
    let struck = false;
    for (let step = 1; step <= 200; step++) {
      // Held at that spot in the camera's frame — the columns ride the camera too.
      world.ship.along = world.cameraAlong + offset;
      world.ship.velAlong = world.scrollPerStep;
      world.ship.across = ACROSS_SPAN / 2;
      world.ship.invulnFor = 0;
      world.enemyShots.clear();
      boss.fireIn = 999;
      frame.step();
      // Watched every step: a ship of one health that is struck dies and is put back whole by the
      // end of the beat, so the health at the end of the loop says nothing.
      if (world.ship.health < before || world.dyingIn > 0) struck = true;
    }
    expect(struck, 'a ship beside the column was struck').toBe(false);
  });

  it('THE PICTURE: the warning is drawn dim and the strike bright, both in the enemy’s hand', () => {
    /*
      0036: the model resolves a strike, and the picture must mention both halves of it — the line,
      then the bolt. The surface is asked whose ink it stroked in and how loud.
    */
    const { world, frame } = serpentAt(0.3);
    const recorder = new Recorder();
    world.surface = recorder;
    world.bossPool.at(0).fireIn = 1;
    frame.step();
    frame.draw(0);
    const warnings = recorder.strokes.filter((s) => s.hostile);
    expect(warnings.length, 'no hostile line was drawn on the step the volley was thrown').toBeGreaterThan(0);
    const dim = Math.max(...warnings.map((s) => s.alpha));
    expect(dim, 'the warning line is drawn as loud as a strike').toBeLessThan(0.7);
    // Let the warning run out, then look again.
    for (let i = 0; i < 60 && !world.bolts.size; i++) frame.step();
    const column = world.bolts.at(0);
    while (column.lifeFor > BOLT_STEPS) {
      world.bossPool.at(0).fireIn = 999;
      frame.step();
    }
    recorder.strokes.length = 0;
    frame.draw(0);
    const strikes = recorder.strokes.filter((s) => s.hostile);
    expect(strikes.length, 'the strike was not drawn').toBeGreaterThan(warnings.length);
    expect(Math.max(...strikes.map((s) => s.alpha)), 'the strike is no brighter than its warning').toBeGreaterThan(dim);
    expect(recorder.strokes.some((s) => !s.hostile), 'the serpent’s lightning was drawn in the player’s hand').toBe(false);
  });
});
