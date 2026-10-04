/**
 * The jellyfish — `docs/decisions/0255-the-jellyfish-opens.md`, and the Black Heart's rework,
 * `0400` to `0404`.
 *
 * The Black Heart's real boss, from the brief: *"a giant space jellyfish where you can see the
 * black heart pulsating inside it, it'll have long tendrils that you have to dodge that pulse out
 * lightning blasts. lots of moon jelly adds that rain down onto the screen and player and then
 * final phase will be the jellyfish opening up and the black heart spewing forth a rain of void
 * blasts."* And the play-report that reworked it: a jellyfish and not a medusa head, hung over the
 * heart in a room with no walls, tentacles that pull out of the heart's arteries and wave and sting,
 * lasers from their tips in one jagged formation with a safe gap, a bell that actually opens on the
 * heart, and a rain that feeds it.
 *
 * What is held here is the fight in the sim's units and the lane's: the room, the seat, the
 * tentacles, the beams' roots, the opening and the feeding. The beam's own rules are
 * `tests/quetzal.test.ts`'s; the fall's, `tests/volcano.test.ts`'s; the vessels', `tests/heart.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { openBy, phaseFor } from '../src/app/boss.ts';
import { BEAM_BOLT_KIND, BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { HEART_ROSE, INK_OF, medusaSeal, mix } from '../src/render/bake.ts';
import { PALETTES } from '../src/content/palette.ts';
import { THEMES } from '../src/content/themes.ts';
import { GAMEPLAY_FLOOR, contrast } from './contrast.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { beamAcrossAt, beamDistance } from '../src/sim/jag.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';
import type { Surface } from '../src/render/surface.ts';
import { skyFor } from '../src/app/mount.ts';
import { WEAPON_KINDS } from '../src/content/weapons.ts';
import { flyFight } from '../scripts/weigh-boss.mjs';

/** The jellyfish alone, a short way in, with no mid-boss in front of it. */
const MEDUSA_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'medusa',
  theme: 'core',
};

type Driven = { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame };

/** The jellyfish on station at `fraction` of its health, its fan held, and an immortal ship out of the way. */
function medusaAt(fraction: number): Driven {
  const { world } = playableWorld(MEDUSA_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the jellyfish never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.enemies.clear();
  world.bolts.clear();
  return { world, frame };
}

/** One step with the fan held and the ship immortal, out of the way at `across`. */
function stepHeld(d: Driven, across: number = ACROSS_SPAN / 2): void {
  d.world.bossPool.at(0).fireIn = 999;
  d.world.ship.health = d.world.shipRow.health;
  d.world.ship.invulnFor = 0;
  d.world.ship.across = across;
  d.frame.step();
}

/** The moon jellies on the field. */
function jellies(d: Driven): { along: number; across: number; velAcross: number; steerAcross: number; turn: number; sprite: number }[] {
  const kind = d.world.enemyKinds.moonJelly;
  const out = [];
  for (let i = 0; i < d.world.enemies.size; i++) {
    const e = d.world.enemies.at(i);
    if (e.kind === kind) out.push({ along: e.along, across: e.across, velAcross: e.velAcross, steerAcross: e.steerAcross, turn: e.turn, sprite: e.spriteBase });
  }
  return out;
}

/** Put one moon jelly down at `along`, `across`, as the fall would have. */
function dropJelly(d: Driven, along: number, across: number): void {
  const kind = d.world.enemyKinds.moonJelly;
  const e = d.world.enemies.spawn()!;
  reset(e, along, across, ENEMIES.moonJelly, kind);
  e.velAlong = d.world.scrollPerStep;
}

const row = BOSSES.medusa;
const fall = row.fall!;
const tendrils = row.tendrils!;

describe('0255 — the jellyfish opens', () => {
  it('THE FIVE PHASES: a ring, the tendrils, a denser ring, the tendrils held longer, and an opening that keeps throwing void — with moon jellies falling from three quarters, and no curtain', () => {
    expect(row.uncoil, 'the jellyfish still throws the curtain that stood in for its tendrils').toBeNull();
    const at = (f: number) => phaseFor(row, row.health * f);
    expect((at(1).attack ?? row.attack).kind).toBe('ring');
    for (const f of [0.7, 0.4]) {
      const beams = at(f).attack!;
      expect(beams.kind, `no tendrils at ${f}`).toBe('beam');
      if (beams.kind !== 'beam') return;
      expect(beams.from.length, 'fewer than five tendrils').toBe(5);
      // Five tendrils, not one wearing five names: each from its own tentacle's tip — 0403.
      // A root is a point since 0452: the tip's across, at the tips' reach down the lane.
      expect(beams.from.map(([, across]) => across), 'a laser does not leave from a tentacle’s tip').toEqual([...tendrils.tips]);
      for (const [along] of beams.from) expect(along, 'a laser does not leave from the tips’ reach').toBe(tendrils.reach);
      expect(new Set(beams.from.map(([, across]) => across)).size, 'two lasers leave from one tip').toBe(beams.from.length);
      /*
        A pulse: on and off inside a second. 0.5 until 0403, which warns a zigzag for 0.4 s because it
        has to be read before it is dodged, as the pterodactyl's and the hydra's are.
      */
      expect((beams.warning + beams.hold) / STEPS_PER_SECOND).toBeLessThanOrEqual(1);
    }
    const first = at(0.7).attack!;
    const second = at(0.4).attack!;
    if (first.kind === 'beam' && second.kind === 'beam') {
      expect(second.hold, 'the second tendrils are not held longer').toBeGreaterThan(first.hold);
      expect(second.halfWidth, 'the second tendrils are not thicker').toBeGreaterThan(first.halfWidth);
    }
    expect((at(0.55).attack ?? row.attack).kind).toBe('ring');
    // The opening: not a bared window — it takes more AND keeps throwing, and what it throws is void.
    const last = at(0.1);
    expect(last.stance.kind, 'the last phase is not the opening').toBe('open');
    expect(openBy(last), 'the opened bell takes no more than a closed one').toBeGreaterThan(1);
    expect(last.shot, 'the heart does not spew void').toBe('void');
    expect((last.attack ?? row.attack).kind).toBe('ring');
    expect(row.phases.some((p) => p.stance.kind === 'bare'), 'the jellyfish bares itself as well as opening').toBe(false);
    // The rain: bodies, the moon jelly, from three quarters.
    expect(fall.kind).toBe('body');
    if (fall.kind !== 'body') return;
    expect(fall.enemy).toBe('moonJelly');
    expect(fall.from).toBeLessThan(1);
    expect(fall.from).toBeGreaterThanOrEqual(0.5);
    expect(fall.count).toBeGreaterThanOrEqual(2);
    expect(LEVELS.eye.boss).toBe('medusa');
    expect(LEVELS.eye.theme).toBe('core');
  });

  it('THE MOON JELLIES, DRIVEN: from three quarters they fall from the top edge inside the ship’s box, sink across the lane and leave it — and not before', () => {
    if (fall.kind !== 'body') return;
    // Whole: nothing falls, however long.
    const whole = medusaAt(1);
    for (let step = 1; step <= fall.every * 3; step++) stepHeld(whole);
    expect(jellies(whole).length, 'moon jellies fell while the bell was whole').toBe(0);
    // Hurt: they fall.
    const d = medusaAt(0.7);
    let arrived = -1;
    for (let step = 1; step <= fall.every * 3 && arrived < 0; step++) {
      stepHeld(d);
      if (jellies(d).length > 0) arrived = step;
    }
    expect(arrived, 'no moon jelly fell in three belches’ worth of steps').toBeGreaterThan(0);
    const fell = jellies(d);
    expect(fell.length, 'a belch was not the fall’s count').toBe(fall.count);
    for (const j of fell) {
      expect(j.across - j.velAcross, 'a moon jelly appeared inside the lane rather than over its edge').toBeLessThanOrEqual(0);
      const inView = j.along - d.world.cameraAlong;
      expect(inView).toBeGreaterThanOrEqual(PLAYER_ALONG_MARGIN - 1);
      expect(inView).toBeLessThanOrEqual(PLAYER_LEAD + 1);
      expect(j.velAcross, 'a moon jelly is not sinking').toBeGreaterThan(0);
      expect(j.steerAcross, 'a moon jelly is not steering for the bottom edge').toBeGreaterThanOrEqual(ACROSS_SPAN);
    }
    // No more belches: these sink the whole way across and out, in the seconds their speed says. Moved
    // well down the lane from the animal first, because one that drifts into a tentacle feeds it (0404).
    d.world.bossFallIn = 100000;
    for (let i = 0; i < d.world.enemies.size; i++) d.world.enemies.at(i).along = d.world.cameraAlong + PLAYER_ALONG_MARGIN + 5 + i * 6;
    const crossing = Math.ceil((ACROSS_SPAN + 2 * ENEMIES.moonJelly.radius) / ENEMIES.moonJelly.closing);
    expect(crossing / STEPS_PER_SECOND, 'a moon jelly crosses the lane too quickly to be a rain').toBeGreaterThan(4);
    let deepest = 0;
    let gone = -1;
    for (let step = 1; step <= crossing * 2 && gone < 0; step++) {
      stepHeld(d, 5);
      for (const j of jellies(d)) if (j.across > deepest) deepest = j.across;
      if (jellies(d).length === 0) gone = step;
    }
    expect(deepest, 'the moon jellies never reached the bottom of the lane').toBeGreaterThan(ACROSS_SPAN - 1);
    expect(gone, 'a moon jelly that has left the lane is still on the field').toBeGreaterThan(crossing / 2);
  });

  it('THE MOON JELLY: a body with a bell and no gun, the slowest thing that closes, in the enemy’s ink — and no level sends it', () => {
    const jelly = ENEMIES.moonJelly;
    expect(jelly.fireEvery, 'a moon jelly shoots, and a rain that shoots is a wall').toBe(0);
    expect(jelly.health).toBe(1);
    expect(jelly.closing).toBeGreaterThan(0);
    for (const kind of ENEMY_KINDS) {
      if (ENEMIES[kind].closing > 0) expect(jelly.closing, `the moon jelly closes faster than the ${kind}`).toBeLessThanOrEqual(ENEMIES[kind].closing);
    }
    expect(INK_OF[SPRITE_KINDS[jelly.sprite]!]).toBe('enemy');
    expect(INK_OF[SPRITE_KINDS[jelly.spriteHit]!]).toBe('impact');
    expect(SPRITE_KINDS[jelly.sprite], 'the moon jelly wears another body’s silhouette').toBe('moonJelly');
    for (const level of Object.values(LEVELS)) {
      for (const wave of level.waves) expect(wave.enemy, 'a level authors the moon jelly, which is the jellyfish’s to drop').not.toBe('moonJelly');
    }
    // Nobody else drops it, either.
    for (const kind of BOSS_KINDS) {
      const f = BOSSES[kind].fall;
      if (kind !== 'medusa' && f !== null && f.kind === 'body') expect(f.enemy).not.toBe('moonJelly');
    }
  });

  it('THE OPENING, DRIVEN: at the last fifth the bell takes twice as much and still throws — a volley of void round the hull', () => {
    const d = medusaAt(0.1);
    const boss = d.world.bossPool.at(0);
    const phase = phaseFor(row, boss.health, d.world.bossFullHealth);
    expect(openBy(phase)).toBeGreaterThanOrEqual(2);
    boss.fireIn = 1;
    d.world.ship.health = d.world.shipRow.health;
    d.frame.step();
    expect(d.world.enemyShots.size, 'the opened bell threw nothing, as a bared one would').toBeGreaterThanOrEqual(phase.shots);
    for (let i = 0; i < d.world.enemyShots.size; i++) expect(d.world.enemyShots.at(i).sprite, 'the heart spewed something other than void').toBe(SHOTS.void.sprite);
  });
});

describe('0400 — the heart is the room', () => {
  it('THE ASK: the fight stops the screen as the Labyrinth’s does, with no walls, and the heart is set into it with the jellyfish over it', () => {
    /*
      *"The boss fight needs to be similar to the labyrinth in that it's a stationary screen, no walls"*,
      *"the black heart needs to be set into the screen like the cog boss"*, and *"the jellyfish boss is
      positioned over the heart."*
    */
    expect(row.room, 'the jellyfish’s fight scrolls on').not.toBeNull();
    expect(row.room!.wall, 'the jellyfish’s room has walls').toBeNull();
    expect(row.move.kind, 'the jellyfish is not set into the place').toBe('socket');
    if (row.move.kind !== 'socket') return;
    expect(SPRITE_KINDS[row.move.seat], 'what the jellyfish is set over is not the heart').toBe('heart');
    expect(row.move.throb ?? 0, 'the heart it is set over does not beat').toBeGreaterThan(0);
    expect(row.drift, 'a thing hung over a heart set into the place drifts along it').toBe(0);
    const d = medusaAt(1);
    expect(d.world.room, 'a room with no walls laid walls for the painter').toBeNull();
    for (let i = 0; i < 30; i++) stepHeld(d);
    expect(d.world.scrollPerStep, 'the camera is still moving in the jellyfish’s room').toBe(0);
    const hull = d.world.bossPool.at(0);
    const seat = d.world.bossAura.at(0);
    expect(seat.sprite, 'the seat laid behind the hull is not the heart').toBe(SPRITE.heart);
    expect(seat.throb, 'the seat laid is not told to beat').toBe(row.move.throb);
    expect(Math.hypot(seat.along - hull.along, seat.across - hull.across), 'the jellyfish is not over its heart').toBeLessThan(1e-9);
  });

  it('and the heart is not in the level’s background before the fight — it is where the fight is', () => {
    expect(LEVELS.eye.landmarks, 'The Black Heart still flies past a heart in the background').toEqual([]);
  });
});

describe('0403 — the tentacles pull out of the heart', () => {
  it('THE TENTACLES, DRIVEN: five of eight lengths, harmless until the room is still and they are out, and stinging after', () => {
    const { world } = playableWorld(MEDUSA_ONLY);
    const frame = new GameFrame(world);
    const count = tendrils.roots.length * tendrils.nodes;
    let laid = -1;
    let rested = -1;
    for (let i = 0; i < 900 && rested < 0; i++) {
      world.ship.health = world.shipRow.health;
      world.ship.across = 5;
      if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
      frame.step();
      if (laid < 0 && world.bossBody.size === count) laid = i;
      if (world.tendrilsFrom >= 0 && rested < 0) rested = i;
      if (world.bossBody.size === count && world.tendrilsFrom < 0) {
        for (let k = 0; k < world.bossBody.size; k++) expect(world.bossBody.at(k).damage, 'a tentacle stings before it has pulled out').toBe(0);
      }
    }
    expect(laid, 'the tentacles were never laid').toBeGreaterThanOrEqual(0);
    expect(rested, 'the tentacles never began to pull out').toBeGreaterThanOrEqual(0);
    expect(world.scrollPerStep, 'the tentacles began to pull out before the room was still').toBe(0);
    for (let i = 0; i < tendrils.draw + 1; i++) {
      world.ship.health = world.shipRow.health;
      world.ship.across = 5;
      world.bossPool.at(0).fireIn = 999;
      frame.step();
    }
    for (let k = 0; k < world.bossBody.size; k++) expect(world.bossBody.at(k).damage, 'a tentacle that is out does not sting').toBeGreaterThan(0);
  });

  it('THE LASERS FROM THE TIPS, IN ONE ZIGZAG: every beam of a volley roots at its tentacle’s tip, and all five bend as one so the gaps hold', () => {
    const d = medusaAt(0.7);
    const boss = d.world.bossPool.at(0);
    d.world.ship.across = 5;
    boss.fireIn = 1;
    d.world.ship.health = d.world.shipRow.health;
    d.frame.step();
    const seeds = new Set<number>();
    const roots: number[] = [];
    for (let i = 0; i < d.world.bolts.size; i++) {
      const b = d.world.bolts.at(i);
      if (b.kind !== BEAM_BOLT_KIND) continue;
      roots.push(Math.round((b.across - boss.across) * 10) / 10);
      seeds.add(b.spin);
      expect(b.along + b.fromAlong - boss.along, 'a laser does not leave from the tips’ reach').toBeCloseTo(tendrils.reach, 6);
    }
    expect(roots.sort((a, b) => a - b), 'the lasers do not leave from the five tips').toEqual([...tendrils.tips].sort((a, b) => a - b));
    expect(seeds.size, 'the five lasers each took their own zigzag, so the gaps between them close').toBe(1);
    // And while it is held the tentacles straighten into their rest, so each tip is on its laser.
    for (let i = 0; i < tendrils.brace + 2; i++) stepHeld(d, 5);
    // The last length's centre is half a length short of the tip, on the straight line to it: no wave.
    const last = (tendrils.nodes - 0.5) / tendrils.nodes;
    for (let k = 0; k < tendrils.roots.length; k++) {
      const end = d.world.bossBody.at(k * tendrils.nodes + tendrils.nodes - 1);
      const root = tendrils.roots[k]!;
      const want = boss.across + root[1] + (tendrils.tips[k]! - root[1]) * last;
      expect(Math.abs(end.across - want), `tentacle ${k} still waves while its laser is held`).toBeLessThan(0.05);
    }
  });

  it('IN LANE UNITS: between every two neighbouring lasers there is room for a ship, at every along the ship can fly', () => {
    /*
      ⚠️ **MEASURED TO THE NEAREST LEG SINCE 0453, AND IT WAS NEVER TRUE UNTIL THEN.** This guard was the
      tips' spacing less two half-widths, which assumed five lasers bending as one stay their spacing apart.
      Across the lane they do; but a leg is steep, and the room a ship has beside a steep leg is the
      spacing times the cosine of its angle — measured against 0403's own twelve-knot zigzag, the room
      between two neighbours was less than a ship at the median along. So this flies volleys and asks the
      question the player asks: at this along, is there a place between these two that neither burns?
    */
    for (const f of [0.7, 0.4]) {
      const d = medusaAt(f);
      const boss = d.world.bossPool.at(0);
      const r = d.world.ship.radius * d.world.tuning.hurtbox;
      for (let v = 0; v < 12; v++) {
        d.world.bolts.clear();
        boss.fireIn = 1;
        d.world.ship.across = 5;
        d.world.ship.health = d.world.shipRow.health;
        d.frame.step();
        const fan: Entity[] = [];
        for (let i = 0; i < d.world.bolts.size; i++) if (d.world.bolts.at(i).kind === BEAM_BOLT_KIND) fan.push(d.world.bolts.at(i));
        fan.sort((a, b) => a.across - b.across);
        expect(fan.length, 'the jellyfish did not fire five').toBe(5);
        for (let along = d.world.cameraAlong + PLAYER_ALONG_MARGIN; along <= d.world.cameraAlong + PLAYER_LEAD; along += 2) {
          for (let k = 1; k < fan.length; k++) {
            const a = fan[k - 1]!;
            const b = fan[k]!;
            const from = beamAcrossAt(a, along);
            const to = beamAcrossAt(b, along);
            let room = -Infinity;
            for (let across = from; across <= to; across += 0.25) {
              const clear = Math.min(beamDistance(a, along, across) - a.radius, beamDistance(b, along, across) - b.radius) - r;
              if (clear > room) room = clear;
            }
            expect(room, `no room between lasers ${k - 1} and ${k} at ${(along - d.world.cameraAlong).toFixed(0)} up the screen, ${f} of the bar`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('THE ASK, IN LANE UNITS: five lasers are a fan — the middle straight, the inner two leaning out, the outer two further — on long legs', () => {
    /*
      0453: *"a fan pattern where the inner two are angled but more contained path and the other two have
      a more deeper jagged penetration on the outside."* At the far end, averaged over volleys: the zigzag
      is random either side, the lean is not.
    */
    const d = medusaAt(0.7);
    const boss = d.world.bossPool.at(0);
    const ends = [0, 0, 0, 0, 0];
    const deep = [0, 0, 0, 0, 0];
    const volleys = 30;
    for (let v = 0; v < volleys; v++) {
      d.world.bolts.clear();
      boss.fireIn = 1;
      d.world.ship.across = 5;
      d.world.ship.health = d.world.shipRow.health;
      d.frame.step();
      const fan: Entity[] = [];
      for (let i = 0; i < d.world.bolts.size; i++) if (d.world.bolts.at(i).kind === BEAM_BOLT_KIND) fan.push(d.world.bolts.at(i));
      fan.sort((a, b) => a.across - b.across);
      fan.forEach((b, i) => {
        ends[i]! += (beamAcrossAt(b, b.along) - b.across) / volleys;
        // How far outside its own leaning line it ever swings: its side's, for a beam off the middle.
        const side = i < 2 ? -1 : 1;
        for (let s = 0; s <= 1; s += 1 / 128) {
          const off = (beamAcrossAt(b, b.along + b.fromAlong * s) - b.across - b.lean * (1 - s)) * side;
          if (off > deep[i]!) deep[i] = off;
        }
        // The leg, as the ask's "spread out longer": the beam's length shared out between its knots.
        expect(Math.abs(b.fromAlong) / (b.knots + 1), 'the jellyfish’s lasers turn more often than once an eighth of a lane').toBeGreaterThanOrEqual(ACROSS_SPAN / 8);
      });
    }
    expect(Math.abs(ends[2]!), 'the middle laser leans').toBeLessThan(4);
    expect(-ends[1]!, 'the inner left laser does not lean out').toBeGreaterThan(5);
    expect(ends[3]!, 'the inner right laser does not lean out').toBeGreaterThan(5);
    // Ten and not nothing: an outer laser's deep outside swing alone stands its far end about five further
    // out on average (measured, the leans made equal), and that is the zigzag, not the fan.
    expect(-ends[0]! + ends[1]!, 'the outer left laser leans out no further than the inner').toBeGreaterThan(10);
    expect(ends[4]! - ends[3]!, 'the outer right laser leans out no further than the inner').toBeGreaterThan(10);
    expect(deep[0]!, 'the outer left laser swings no deeper outside than the inner').toBeGreaterThan(deep[1]! + 4);
    expect(deep[4]!, 'the outer right laser swings no deeper outside than the inner').toBeGreaterThan(deep[3]! + 4);
  });
});

describe('0402 — the jellyfish is glass, and it opens', () => {
  it('THE ASK: the last phase wears the bell open, in the same box, and a phase before it wears the bell shut', () => {
    const last = row.phases[row.phases.length - 1]!;
    expect(last.hull, 'the last phase opens nothing').toBeDefined();
    expect(SPRITE_KINDS[last.hull!.rest]).toBe('boss14Open');
    expect(SPRITE_EXTENT[SPRITE_KINDS[last.hull!.rest]!], 'the open bell is not the shut one’s size').toBe(SPRITE_EXTENT[SPRITE_KINDS[row.sprite]!]);
    const d = medusaAt(0.1);
    stepHeld(d, 5);
    expect(d.world.bossPool.at(0).spriteBase, 'the jellyfish at its last fifth is not drawn open').toBe(last.hull!.rest);
    d.world.bossPool.at(0).health = d.world.bossFullHealth * 0.4;
    stepHeld(d, 5);
    expect(d.world.bossPool.at(0).spriteBase, 'healed back over its last fifth, the jellyfish is still drawn open').toBe(row.sprite);
  });
});

describe('0459 — the Black Heart’s lightning and its jellyfish stand off it', () => {
  /*
    *"The lightning and jellyfish at the end of the black heart look almost exactly the same colours as the
    level background so they can hardly be seen at all."* Held as the picture composes them: the glass over
    the nebula as the canvas lays it, and a bolt's glow against the vessels' lit core as `bakeVeins` strokes it.
  */
  const nebula = THEMES.core.nebula.vivid;
  const vessel = mix(mix(nebula, HEART_ROSE, 0.6), '#ffffff', 0.35);

  it('THE JELLYFISH: its glass, laid over the place’s nebula, is over the gameplay floor against it', () => {
    const m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(medusaSeal(THEMES.core.lord));
    expect(m, 'the seal is not an rgba this can read').not.toBeNull();
    const [r, g, b, a] = [Number(m![1]), Number(m![2]), Number(m![3]), Number(m![4])];
    const under = [1, 3, 5].map((i) => parseInt(nebula.slice(i, i + 2), 16));
    const laid = `#${[r, g, b].map((c, i) => Math.round(under[i]! + (c - under[i]!) * a).toString(16).padStart(2, '0')).join('')}`;
    expect(contrast(laid, nebula), `the bell is ${laid} over ${nebula}`).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
    expect(a, 'the bell is no longer glass, and the heart behind it is lost').toBeLessThanOrEqual(0.6);
  });

  it('THE LIGHTNING: a hostile bolt here is not the enemy pink the vessels are lit in, and stands off them and the sky', () => {
    const bolt = THEMES.core.bolt;
    expect(bolt, 'the Black Heart strokes its bolts in the enemy ink, which is the colour of its light').not.toBeNull();
    expect(contrast(bolt!, vessel), `a bolt in ${bolt} against the vessels' lit core ${vessel}`).toBeGreaterThanOrEqual(2);
    expect(contrast(bolt!, vessel), 'the place’s bolt is no better than the enemy ink against its own vessels').toBeGreaterThan(
      contrast(PALETTES.vivid.enemy, vessel) * 1.5,
    );
    expect(contrast(bolt!, nebula), `a bolt in ${bolt} against the nebula ${nebula}`).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
  });
});

describe('0404 — the rain feeds it', () => {
  it('THE ASK: a moon jelly that drifts into the jellyfish is gone, and gives it back its share of its health', () => {
    if (fall.kind !== 'body') return;
    /*
      ⚠️ **THE SHARE IS THE ROW'S, AND IT WAS PINNED HERE AT A TWENTIETH UNTIL 0476** made it a fiftieth
      on a measurement: at a twentieth the fight did not finish from most places. What this holds is
      that a feed happens and is the row's; whether the fight can be won is `0476`'s guard below.
    */
    const share = fall.feeds ?? 0;
    expect(share, 'the jellyfish authors no feed').toBeGreaterThan(0);
    const d = medusaAt(0.5);
    // The ship's fire held while the feed is weighed: the fighter's four-barrel fan opens at the cap
    // since 0441, and from lane 5 its outer barrels reach the bell inside the five steps measured.
    d.world.fireIn = Number.MAX_SAFE_INTEGER;
    d.world.missileIn = Number.MAX_SAFE_INTEGER;
    d.world.playerShots.clear();
    d.world.missiles.clear();
    const boss = d.world.bossPool.at(0);
    const before = boss.health;
    dropJelly(d, boss.along, boss.across);
    stepHeld(d, 5);
    expect(jellies(d).length, 'the jelly that drifted into the jellyfish is still there').toBe(0);
    expect(boss.health - before, 'the jellyfish was not fed its share of its health').toBeCloseTo(row.health * share, 6);
  });

  it('and one that drifts into a tentacle feeds it too', () => {
    const d = medusaAt(0.5);
    // No rain of its own while this is measured: only the jelly put down here is on the field.
    d.world.bossFallIn = 100000;
    for (let i = 0; i < tendrils.draw + 2; i++) stepHeld(d, 5);
    const boss = d.world.bossPool.at(0);
    const before = boss.health;
    const node = d.world.bossBody.at(tendrils.nodes * 2 + tendrils.nodes - 1);
    dropJelly(d, node.along, node.across);
    stepHeld(d, 5);
    expect(jellies(d).length, 'the jelly that drifted into a tentacle is still there').toBe(0);
    expect(boss.health, 'a tentacle did not feed the jellyfish').toBeGreaterThan(before);
  });

  it('and a heal over the last fifth’s line shuts the bell: the phase before is the phase again', () => {
    // Half a feed under the line, so one feed carries it over — 0476 made a feed a fiftieth at Savior
    // and a share of the authored health, and the old 0.18 was a twentieth's worth under it.
    const line = row.phases[row.phases.length - 1]!.upTo;
    const d = medusaAt(line);
    const boss = d.world.bossPool.at(0);
    boss.health = line * d.world.bossFullHealth - ((fall.kind === 'body' ? (fall.feeds ?? 0) : 0) * row.health) / 2;
    expect(phaseFor(row, boss.health, d.world.bossFullHealth).stance.kind).toBe('open');
    dropJelly(d, boss.along, boss.across);
    stepHeld(d, 5);
    expect(phaseFor(row, boss.health, d.world.bossFullHealth).stance.kind, 'fed back over its last fifth, the bell stays open').toBe('volley');
  });

  it('THE RAIN, DRIVEN: every jelly falls crown up, in one of its glows, and a fall wears more than one', () => {
    if (fall.kind !== 'body') return;
    const tints = ENEMIES.moonJelly.tints!;
    expect(tints.length, 'the rain is one colour').toBeGreaterThanOrEqual(3);
    const d = medusaAt(0.7);
    // Which glows fell, and every bitmap they were drawn in — a glow pulses through its own cycle (0410).
    const seen = new Set<number>();
    const drawn = new Set<number>();
    for (let step = 1; step <= fall.every * 12; step++) {
      stepHeld(d, 5);
      for (const j of jellies(d)) {
        expect(j.turn, 'a moon jelly falls on its side').toBeCloseTo(Math.PI / 2, 9);
        const glow = tints.findIndex((t) => t.frames.includes(j.sprite) || t.hurt.includes(j.sprite));
        expect(glow, 'a moon jelly glows in no colour of its row').toBeGreaterThanOrEqual(0);
        seen.add(glow);
        drawn.add(j.sprite);
      }
    }
    expect(seen.size, 'a dozen belches all fell in one glow').toBeGreaterThanOrEqual(3);
    expect(drawn.has(row.sprite), 'a moon jelly is the jellyfish’s own colour').toBe(false);
  });
});

describe('0476 — the jellyfish can be finished, and opens', () => {
  /*
    Reported, 2026-10-04: *"the jellyfish never opens for the 'double damage' phase."* Measured: at a
    twentieth a feed, from fifteen held places and the bell's own lane, the fight did not finish for any
    gun at the median place and the ray never reached the open bell. Flown here through the real frame
    in the player's units — seconds, and whether the open phase was fought — from the bell's own lane at
    the two distances a pilot fights from, which is how a gun that fires straight is flown at a thing
    that does not move (`scripts/weigh-boss.mjs`). The ship held at rest is not one of them: at 190 the
    arc's reach does not get there, which is the arc's, not the fight's.
  */
  const CAP = 240;
  const OPEN = row.phases.length - 1;

  it('THE REPORTED ONE, at Savior: every gun finishes the fight from the bell’s lane, and fights the open bell', () => {
    for (const gun of WEAPON_KINDS) {
      for (const short of [60, 45]) {
        const fight = flyFight('medusa', gun, { lane: 'boss', short, cap: CAP, difficulty: 'savior' });
        expect(fight.seconds, `the ${gun} from ${short} short never finished the jellyfish in ${CAP} s`).not.toBeNull();
        expect(
          fight.phaseAt.some((p) => p.phase === OPEN),
          `the ${gun} from ${short} short finished the jellyfish without the bell ever opening`,
        ).toBe(true);
      }
    }
  });

  it('and on Burn, where the fight is longest: a feed is the same number of shots at every tier', () => {
    /*
      ⚠️ **A SHARE OF THE TIER'S FULL HEALTH NEVER FINISHED ON BURN, WITH ANY GUN.** Burn's fight is two
      and a half times as long, so it landed two and a half times the feeds, each worth as much of the
      fight as Savior's. A feed is a share of the AUTHORED health since 0476. Two guns, because the arc
      on Burn stalls in the open phase for a reason this does not touch — the decision says which.
    */
    for (const gun of ['pulse', 'shuriken'] as const) {
      const fight = flyFight('medusa', gun, { lane: 'boss', short: 45, cap: CAP, difficulty: 'burn' });
      expect(fight.seconds, `on Burn the ${gun} never finished the jellyfish in ${CAP} s`).not.toBeNull();
    }
  });

  it('IN LANE UNITS: the bell stands past the ship’s box, so nothing flies round behind it', () => {
    // *"You shouldn't be able to fly around it."* Its far rim at rest, nearest the drift allows, against
    // the furthest the ship can go.
    expect(row.station - row.drift + row.radius, 'the ship can fly behind the jellyfish').toBeGreaterThanOrEqual(PLAYER_LEAD);
  });
});

describe('0489 — the heart has a chamber', () => {
  /** A surface that keeps every blit's sprite and place, in the order they were drawn. */
  class Blits implements Surface {
    readonly blits: { sprite: number; x: number; y: number }[] = [];
    clear(): void {}
    blit(sprite: number, x: number, y: number): void {
      this.blits.push({ sprite, x, y });
    }
    bolt(): void {}
  }

  it('THE ASK, IN PIXELS: the heart is set in its chamber on the screen — the chamber drawn at the heart, under the heart and under the bell', () => {
    /*
      The plan: *"the cog sits in a housing bigger than it; the bell sits on a heart smaller than it, in an
      open room."* On the real frame at a 1280×720 screen, the chamber is blitted at the heart's own place to
      the pixel, and before the heart and the bell, so it is what they are set in.
    */
    const d = medusaAt(0.95);
    for (let i = 0; i < 30; i++) {
      d.world.ship.health = d.world.shipRow.health;
      d.frame.step();
    }
    const surface = new Blits();
    d.world.surface = surface;
    // The place's own sky, which carries the vessels the chamber is laid with; a fixture's is empty.
    d.world.sky = skyFor('core');
    d.frame.draw(1);
    const chamber = surface.blits.findIndex((b) => b.sprite === SPRITE.heartChamber);
    const heart = surface.blits.findIndex((b) => b.sprite === SPRITE.heart);
    const bell = surface.blits.findIndex((b) => b.sprite === BOSSES.medusa.sprite || b.sprite === BOSSES.medusa.spriteHit);
    expect(chamber, 'the chamber was not drawn').toBeGreaterThanOrEqual(0);
    expect(heart, 'the heart was not drawn').toBeGreaterThanOrEqual(0);
    expect(chamber, 'the chamber was drawn over the heart').toBeLessThan(heart);
    if (bell >= 0) expect(chamber, 'the chamber was drawn over the bell').toBeLessThan(bell);
    const off = Math.hypot(surface.blits[chamber]!.x - surface.blits[heart]!.x, surface.blits[chamber]!.y - surface.blits[heart]!.y);
    expect(off, `the chamber is drawn ${off.toFixed(1)}px from the heart it holds`).toBeLessThan(0.5);
  });
});
