/**
 * The eagle summons — `docs/decisions/0249-the-eagle-summons.md`.
 *
 * Ember Nebula's real boss, from the brief: *"some hell-spawned demon space eagle thing that throws
 * out whips of fire and summons hordes of flying kites and raptors as adds at various points
 * throughout the fight."* What is held here is the whip — a lash of flames that bows as it flies
 * — and the summons — adds put on the field by a volley — and the kite, the horde's own body. What
 * a boss IS is `tests/bosses.test.ts`'s and `tests/level.test.ts`'s; a phase throwing its own
 * shot is `tests/serpent.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { BURST } from '../src/content/debris.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The fish alone, a short way in, with no mid-boss in front of it. */
const VOLANS_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'volans',
  theme: 'nebula',
};

/** The fish on station at `fraction` of its health, its fan held until the test says, and an immortal ship. */
function volansAt(fraction: number): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
  const { world } = playableWorld(VOLANS_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the fish never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  world.enemyShots.clear();
  world.enemies.clear();
  return { world, frame };
}

describe('0249 — the eagle summons', () => {
  it('THE FIVE PHASES: darts, a whip, kites, a wider whip, raptors — and it is Ember Nebula’s real boss', () => {
    const row = BOSSES.volans;
    const kinds = [1, 0.7, 0.45, 0.3, 0.1].map((f) => (phaseFor(row, row.health * f).attack ?? row.attack).kind);
    // A spray since 0258: the fish is the one end boss that stalks, and what reacts is where it is.
    // A rake since 0262: a fan of quills that sweeps, which a fan that sits was not — *"boring"*.
    expect(kinds).toEqual(['rake', 'whip', 'summon', 'whip', 'summon']);
    expect(LEVELS.descent.boss).toBe('volans');
    expect(LEVELS.descent.theme).toBe('nebula');
  });

  it('0262 — THE QUILL: the fish’s bullet is a feather of its own, raked across the lane, and no fan of it points the same way twice', () => {
    /*
      `docs/decisions/0262-the-eagle-throws-quills.md`. *"The bullets need to be feathered quills;
      the bullet attacks were boring."* The row's shot is the quill — its own silhouette on the
      hostile ladder, in the enemy's ink, between the slab and the ring — and the whole phase's fan
      rakes: two volleys, two centres. Driven, and the picture asked for its bitmap.
    */
    const row = BOSSES.volans;
    expect(row.shot, 'the fish throws something other than quills').toBe('quill');
    expect(SHOTS.quill.sprite, 'the quill shares the lance’s silhouette').not.toBe(SHOTS.lance.sprite);
    expect(INK_OF[SPRITE_KINDS[SHOTS.quill.sprite]!], 'a quill is not in the enemy’s ink').toBe('enemy');
    expect(SHOTS.quill.speed, 'a quill is no slower than a slab').toBeLessThan(SHOTS.flak.speed);
    expect(SHOTS.quill.speed, 'a quill is no quicker than a void ring').toBeGreaterThan(SHOTS.void.speed);
    const { world, frame } = volansAt(1);
    const centres: number[] = [];
    for (let volley = 0; volley < 2; volley++) {
      world.enemyShots.clear();
      world.bossPool.at(0).fireIn = 1;
      frame.step();
      expect(world.enemyShots.size, 'the fish threw one dart, which is the fan that was boring').toBeGreaterThan(1);
      let sum = 0;
      for (let i = 0; i < world.enemyShots.size; i++) {
        const s = world.enemyShots.at(i);
        expect(s.sprite, 'a shot of the opening fan is not a quill').toBe(SHOTS.quill.sprite);
        sum += Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep);
      }
      centres.push(sum / world.enemyShots.size);
    }
    expect(Math.abs(centres[1]! - centres[0]!), 'the fan of quills does not rake — two volleys point the same way').toBeGreaterThan(0.1);
  });

  it('THE WHIP: one volley is a lash of flames along an arc, the tip faster than the root, in the fire ink', () => {
    /*
      *"Throws out whips of fire."* Driven: every shot of the volley is a flame; laid out by their
      own speed they climb from the root to the tip, and they span an arc rather than a line — the
      first and last leave in different directions across the lane.
    */
    const { world, frame } = volansAt(0.7);
    world.bossPool.at(0).fireIn = 1;
    frame.step();
    const n = world.enemyShots.size;
    expect(n, 'the whip threw nothing').toBeGreaterThanOrEqual(3);
    let lastSpeed = -1;
    let minAcross = Number.POSITIVE_INFINITY;
    let maxAcross = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      const s = world.enemyShots.at(i);
      expect(s.sprite, `shot ${i} of the whip is not a flame`).toBe(SHOTS.flame.sprite);
      const own = Math.hypot(s.velAlong - world.scrollPerStep, s.velAcross);
      expect(own, `flame ${i} is no faster than the one before it — a fan, not a lash`).toBeGreaterThan(lastSpeed);
      lastSpeed = own;
      minAcross = Math.min(minAcross, s.velAcross);
      maxAcross = Math.max(maxAcross, s.velAcross);
    }
    expect(maxAcross - minAcross, 'the whip is a line down the lane rather than an arc across it').toBeGreaterThan(1);
    expect(INK_OF[SPRITE_KINDS[SHOTS.flame.sprite]!], 'a flame wears the enemy’s bullet ink').toBe('fire');
    expect(INK_OF[SPRITE_KINDS[SHOTS.flame.sprite]!], 'a flame wears the player’s own bullet ink').not.toBe('bullet');
  });

  it('THE SUMMONS: a volley at half health puts kites on the field at the leading edge, and one at the end puts raptors', () => {
    /*
      *"Summons hordes of flying kites and raptors as adds at various points throughout the fight."*
      Driven: a volley throws no bullet and the enemy pool gains the phase's count of its kind,
      ahead of the ship and on the screen — where a wave arrives — and the next volley adds more.
    */
    for (const [fraction, enemy] of [
      [0.45, 'kite'],
      [0.1, 'raptor'],
    ] as const) {
      const { world, frame } = volansAt(fraction);
      const boss = world.bossPool.at(0);
      boss.fireIn = 1;
      frame.step();
      const count = (phaseFor(BOSSES.volans, boss.health, world.bossFullHealth).attack as { count: number }).count;
      expect(world.enemies.size, `the summons at ${fraction} put ${world.enemies.size} adds on the field`).toBe(count);
      expect(world.enemyShots.size, 'a summons threw bullets as well').toBe(0);
      /*
        ⚠️ **FROM THE SIDES SINCE 0262** — *"they marched in gently from the left side in a single
        file, they didn't swoop or dive bomb."* Every add of a call is outside the lane on the step
        it is called, on ONE side, steering for a lane inside it; the next call comes from the
        other side. Ahead of the ship still, and on the screen.
      */
      const sides = new Set<number>();
      for (let i = 0; i < world.enemies.size; i++) {
        const add = world.enemies.at(i);
        expect(add.kind, `an add at ${fraction} is not a ${enemy}`).toBe(world.enemyKinds[enemy]);
        const inView = add.along - world.cameraAlong;
        expect(inView, 'an add arrived behind the ship').toBeGreaterThan(world.ship.along - world.cameraAlong);
        expect(inView, 'an add arrived a whole view beyond the screen').toBeLessThan(world.view.alongSpan * 2);
        expect(add.across < 0 || add.across > ACROSS_SPAN, `an add at ${fraction} arrived inside the lane rather than from a side`).toBe(true);
        expect(add.steerAcross, 'an add from the side is not steering for a lane').toBeGreaterThan(0);
        expect(add.steerAcross).toBeLessThan(ACROSS_SPAN);
        sides.add(Math.sign(add.across));
      }
      expect(sides.size, 'one call came from both sides at once').toBe(1);
      const firstSide = [...sides][0]!;
      // And again on the next volley, from the other side: a horde is many calls, not one.
      boss.fireIn = 1;
      frame.step();
      expect(world.enemies.size, 'the second volley called nobody').toBe(count * 2);
      const latest = world.enemies.at(world.enemies.size - 1);
      expect(Math.sign(latest.across), 'the second call came from the same side as the first').toBe(-firstSide);
    }
  });

  it('THE KITE: Ember Nebula’s horde is a small quick flier that bites once, and no level sends it', () => {
    const kite = ENEMIES.kite;
    expect(kite.health).toBe(1);
    expect(kite.fireEvery, 'a kite shoots, and a horde that shoots is a wall').toBe(0);
    expect(kite.radius, 'a kite is no smaller than the raptor it is summoned with').toBeLessThan(ENEMIES.raptor.radius);
    expect(kite.closing, 'a kite is slower than the raptor').toBeGreaterThan(ENEMIES.raptor.closing);
    // And it dives — 0262: a hunt harder than any level's pilot, from the side the fish calls it on.
    expect(kite.motion.kind, 'a kite does not dive for the ship').toBe('hunt');
    if (kite.motion.kind === 'hunt') expect(kite.motion.agility, 'a kite dives no harder than the raptor hunts').toBeGreaterThan(ENEMIES.raptor.motion.kind === 'hunt' ? ENEMIES.raptor.motion.agility : 0);
    // Sent by the fish and by nothing authored: a summons is what it is for.
    for (const level of Object.values(LEVELS)) {
      for (const wave of level.waves) expect(wave.enemy, 'a level authors the kite, which is the fish’s to call').not.toBe('kite');
    }
  });
});

/**
 * The fish breaches — `docs/decisions/0313-the-fish-breaches.md`. *"Needs a flashy entrance."*
 *
 * ⚠️ **EVERY CLAIM HERE IS MEASURED OFF THE FLIGHT THE FRAME ACTUALLY FLEW, IN THE UNITS THE PLAYER'S
 * OWN LANE IS MEASURED IN** — 0027. What the row says is not evidence about what the animal does: the
 * path is read by two functions and handed over by a third, and 0306's own probe list has four entries
 * that are exactly the gap between the two.
 */
describe('0313 — the fish breaches', () => {
  const ROW = BOSSES.volans;
  /** Half the DRAWN extent, which is what has to be off the screen — not the hurtbox. */
  const HULL = SPRITE_EXTENT[SPRITE_KINDS[ROW.sprite]!]! / 2;

  type Leap = { along: number; across: number; turn: number; entering: number };

  /** The whole entrance flown, one pose a step, with the player's fire held and the ship kept alive. */
  function flyBreach(): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame; poses: Leap[] } {
    const { world } = playableWorld(VOLANS_ONLY);
    const frame = new GameFrame(world);
    const poses: Leap[] = [];
    for (let i = 0; i < 2400; i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      frame.step();
      if (world.bossPool.size === 0) continue;
      const hull = world.bossPool.at(0);
      poses.push({ along: hull.along - world.cameraAlong, across: hull.across, turn: hull.turn, entering: world.bossEntering });
      if (world.bossEntering < 0 && poses.length > 1) break;
    }
    return { world, frame, poses };
  }

  it('THE ASKED-FOR ONE: it comes up through the near edge, leaps three times and each leap goes higher than the last, and dives back out of sight', () => {
    const entrance = ROW.entrance!;
    expect(entrance, 'the fish makes no entrance').not.toBeNull();
    expect(entrance.kind, 'the fish does not breach').toBe('breach');
    if (entrance.kind !== 'breach') throw new Error('unreachable');
    const { poses } = flyBreach();
    const flying = poses.filter((p) => p.entering >= 0);
    expect(flying.length, 'the fish arrived without an entrance').toBeGreaterThan(60);
    /*
      ⚠️ **THE CRESTS ARE COUNTED OFF THE FLIGHT, NOT OFF THE ROW.** A crest is a step that is further
      past the edge than the step before it and the step after — so this counts what the animal did,
      and a path that quietly flew one long arc instead of three would be one crest, not three.
    */
    const height = flying.map((p) => entrance.surface - p.across);
    const crests: number[] = [];
    for (let i = 1; i + 1 < height.length; i++) if (height[i]! > height[i - 1]! && height[i]! >= height[i + 1]! && height[i]! > 1) crests.push(height[i]!);
    expect(crests.length, `it made ${crests.length} leaps and the row says ${entrance.leaps}`).toBe(entrance.leaps);
    // AND EACH ONE HIGHER THAN THE LAST, which is the escalation the flight is supposed to have.
    for (let i = 1; i < crests.length; i++) {
      expect(crests[i], `leap ${i + 1} crested ${crests[i]!.toFixed(1)} units up and leap ${i} crested ${crests[i - 1]!.toFixed(1)} — it is not building`).toBeGreaterThan(crests[i - 1]!);
    }
    /*
      ⚠️ **AND IT LEAVES THE WAY IT CAME: OFF THE SCREEN, WHICH IS WHAT MAKES THE HAND-OVER INVISIBLE.**
      The arrival puts the hull back at the leading edge; a jump anybody can see is a teleport, and the
      only place one is invisible is with the whole drawing past an edge. 0306's own third probe.
    */
    const last = flying[flying.length - 1]!;
    const widest = viewOf(2400, 1000).alongSpan;
    const clear = last.across - HULL >= ACROSS_SPAN || last.across + HULL <= 0 || last.along - HULL > widest || last.along + HULL < 0;
    expect(clear, `the fish was still on the screen — at ${last.along.toFixed(0)} along, ${last.across.toFixed(0)} across — when the arrival took over`).toBe(true);
  });

  it('and the far side of the lane is the place to be: a ship parked there is never touched, and the fish still sweeps past the middle', () => {
    const entrance = ROW.entrance!;
    if (entrance.kind !== 'breach') throw new Error('the fish does not breach');
    /*
      ⚠️ **ASKED AS THE PLAYER WOULD ASK IT, WHICH IS 0306's OWN GUARD AND NOT A GEOMETRY.** *"Players
      can learn the pattern to avoid the damage from being hit by it"* is a claim about a ship, so the
      guard is the pattern learned: a live ship, hurtbox and all, parked at the far side of the lane for
      the whole of a fully-live entrance. Where THAT is falls out of the tallest crest, which is the last
      one — and the band is read off the row rather than picked here, so a row that raised `rise` until
      there was no band left would redden this rather than quietly closing it.
    */
    const tallest = entrance.height * entrance.rise ** (entrance.leaps - 1);
    const band = entrance.surface - tallest - HULL;
    expect(band, `the tallest leap leaves ${band.toFixed(1)} units of lane, which is not a place to be`).toBeGreaterThan(ROW.radius / 2);
    {
      const parked = playableWorld(VOLANS_ONLY).world;
      const flown = new GameFrame(parked);
      let hits = 0;
      let seen = 0;
      for (let i = 0; i < 2400 && !(parked.bossPool.size > 0 && parked.bossEntering < 0); i++) {
        parked.fireIn = Number.MAX_SAFE_INTEGER;
        parked.missileIn = Number.MAX_SAFE_INTEGER;
        parked.ship.health = parked.shipRow.health;
        parked.ship.invulnFor = 0;
        parked.ship.across = band / 2;
        parked.ship.prevAcross = parked.ship.across;
        flown.step();
        if (parked.bossEntering > 0) seen++;
        if (parked.ship.health < parked.shipRow.health) hits++;
      }
      expect(seen, 'the parked ship never saw the entrance, so this measures nothing').toBeGreaterThan(60);
      expect(hits, 'a ship holding the far side of the lane was hit — there is no band to learn').toBe(0);
    }
    /*
      ⚠️ **AND THE REST OF THE LANE IS NOT SAFE, WHICH THE SAME MEASUREMENT HAS TO SHOW.** An entrance
      that is dodged by standing anywhere is scenery, and a guard that only asks *was the ship safe* is
      green for a fish that never left the edge at all.
    */
    const { poses } = flyBreach();
    const nearest = Math.min(...poses.filter((p) => p.entering >= 0).map((p) => p.across));
    expect(nearest, `the fish never came past ${nearest.toFixed(0)} across, so it never crossed the middle of the lane`).toBeLessThan(ACROSS_SPAN / 2);
  });

  it('and the hull noses into its arc, which is the first whole hull in the game that turns', () => {
    /*
      ⚠️ **0027'S SUBJECT, AND 0306 FOUND IT THE HARD WAY ON THE SERPENT'S HEAD.** A path that turns and
      a picture that does not is a fish flying its whole leap facing down-lane; every assertion about the
      MODEL stays green over that, so what is asked here is the angle the hull carries.
    */
    const { poses } = flyBreach();
    const flying = poses.filter((p) => p.entering >= 0);
    const turned = flying.filter((p) => Math.abs(p.turn) > 0.2);
    expect(turned.length, 'the hull flew its whole breach facing down the lane').toBeGreaterThan(flying.length / 4);
    // Nose UP on the way out of the edge and DOWN on the way back into it — the sign flips at a crest.
    const up = flying.filter((p) => p.turn > 0.2).length;
    const down = flying.filter((p) => p.turn < -0.2).length;
    expect(Math.min(up, down), `the hull turned one way only — ${up} steps up against ${down} down`).toBeGreaterThan(10);
    // And it is level again for the fight: the arrival clears the turn, so nothing patrols on its side.
    expect(Math.abs(poses[poses.length - 1]!.turn), 'the fish stands on station still tilted from its entrance').toBeLessThan(1e-9);
  });

  it('and every time it goes through the edge the screen says so: four crossings, four sprays of embers and four cracks', () => {
    const entrance = ROW.entrance!;
    if (entrance.kind !== 'breach') throw new Error('the fish does not breach');
    /*
      ⚠️ **0036, WITH NOTHING ELSE TO LEAN ON.** There is no surface drawn in this place
      (`src/content/themes.ts`: `ground: null`), so a crossing the picture does not mention is a fish
      sliding through an invisible line. A leap ends where the next begins, so `leaps` arcs cross the
      edge `leaps + 1` times: out, a skip per junction, and the dive.
    */
    const { world, cues } = playableWorld(VOLANS_ONLY);
    const frame = new GameFrame(world);
    let sprayed = 0;
    for (let i = 0; i < 2400 && !(world.bossPool.size > 0 && world.bossEntering < 0); i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      const before = world.debris.size;
      frame.step();
      if (world.bossEntering >= 0 && world.debris.size - before >= BURST.breach) sprayed++;
    }
    expect(sprayed, `the edge was broken ${sprayed} times and the flight crosses it ${entrance.leaps + 1}`).toBe(entrance.leaps + 1);
    expect(cues.filter((c) => c === 'bossBreach').length, 'the breach is silent').toBe(entrance.leaps + 1);
  });

  it('and the whole skip happens on the NARROWEST screen, because a flashy entrance nobody can see is not one', () => {
    const entrance = ROW.entrance!;
    if (entrance.kind !== 'breach') throw new Error('the fish does not breach');
    /*
      ⚠️ **0023: CONTENT IS AUTHORED AGAINST EVERY DEVICE AND NOT THE ONE IT WAS WRITTEN ON.** The leaps
      run from `from` down the lane, and a `from` past the narrowest view's leading edge puts the first
      crest off the screen for anyone on 16:9 — the aspect the whole box is sized to.
    */
    const narrowest = viewOf(1280, 720).alongSpan;
    expect(entrance.from, `the first leap starts ${entrance.from} ahead and the narrowest screen ends at ${narrowest.toFixed(0)}`).toBeLessThanOrEqual(narrowest);
    // And the last leap is done by the trailing edge, so no crest is spent behind the player.
    expect(entrance.from - entrance.leaps * entrance.span, 'the fish is still leaping past the trailing edge, where there is no screen left').toBeLessThan(entrance.span / 2);
  });
});
