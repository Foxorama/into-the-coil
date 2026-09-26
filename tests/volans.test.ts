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
import { GameFrame, wearHull } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { weaponFor } from '../src/content/pickups.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { BURST } from '../src/content/debris.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import type { ThemeKind } from '../src/content/themes.ts';
import { INK_OF, drawKind } from '../src/render/bake.ts';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { CUES } from '../src/content/cues.ts';
import { SAMPLE_RATE, cueSeconds, sampleCue } from '../src/app/sound.ts';
import { makeRng } from '../src/sim/rng.ts';
import { BANDS, centroid, spectrum } from './spectrum.ts';
import { inside, tracingPen, type Pass } from './paths.ts';
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
  // And the pulses still in flight, since 0373: an add spat out of a mouth that sits in the ship's
  // lane is spat into the stream the approach left in the air, and one of three died to it on the
  // step it appeared. What a test here counts is what the fish put on the field.
  world.playerShots.clear();
  return { world, frame };
}

describe('0249 — the eagle summons', () => {
  it('THE FIVE PHASES: darts, a whip, and then three that throw AND call — and it is Ember Nebula’s real boss', () => {
    const row = BOSSES.volans;
    const kinds = [1, 0.7, 0.45, 0.3, 0.1].map((f) => (phaseFor(row, row.health * f).attack ?? row.attack).kind);
    // A spray since 0258: the fish is the one end boss that stalks, and what reacts is where it is.
    // A rake since 0262: a fan of spines that sweeps, which a fan that sits was not — *"boring"*.
    /*
      ⚠️ **AND TWO OF THE FIVE STOPPED BEING SUMMONS IN 0314** — *"needs to be attack while the adds
      are coming in."* A summons is a volley that throws nothing, so a third of this fight was the fish
      not fighting. The kites and the shoal are `escort`s now, on clocks of their own, and the phases
      they belong to go on raking and whipping over the top of them. The last third keeps a summons AS
      WELL, which is what makes the two different things rather than two spellings of one.
    */
    /*
      ⚠️ **AND THE SECOND WHIP IS A BREAKER SINCE 0315** — *"needs multiple styles of attacks."* The
      table had the same lash twice with a wider arc; what it has now is four kinds across five phases,
      and the new one is the only attack in the game that does not leave the hull.
    */
    /*
      ⚠️ **AND 0317 BROUGHT THE BREAKER FORWARD TO SECOND**, where the whip was: it is the one attack
      that covers a place rather than a direction, and at a third of the bar a shuriken had ended the
      fight before it was ever thrown.
    */
    expect(kinds).toEqual(['rake', 'breaker', 'whip', 'rake', 'summon']);
    expect(new Set(kinds).size, 'the fish throws fewer than four kinds of thing across its five phases').toBe(4);
    expect(row.phases.filter((p) => p.escort !== undefined).length, 'no phase of the fish calls a horde while it fights').toBe(3);
    expect(LEVELS.descent.boss).toBe('volans');
    expect(LEVELS.descent.theme).toBe('nebula');
  });

  it('0262 — THE SPINE: the fish’s bullet is its own, raked across the lane, and no fan of it points the same way twice', () => {
    /*
      `docs/decisions/0262-the-eagle-throws-quills.md`. *"The bullets need to be feathered quills;
      the bullet attacks were boring."* The row's shot is its own — its own silhouette on the hostile
      ladder, in the enemy's ink, between the slab and the ring — and the whole phase's fan rakes: two
      volleys, two centres. Driven, and the picture asked for its bitmap.

      ⚠️ **A BARBED FIN-SPINE SINCE 0316, WHERE 0262 ASKED FOR A FEATHER.** Everything asserted below is
      0262's and did not move — the place on the ladder, the speed, the ink and the rake. What changed
      is the shape, because the animal stopped being a bird (0312).
    */
    const row = BOSSES.volans;
    expect(row.shot, 'the fish throws something other than its own bullet').toBe('spine');
    expect(SHOTS.spine.sprite, 'the spine shares the lance’s silhouette').not.toBe(SHOTS.lance.sprite);
    expect(INK_OF[SPRITE_KINDS[SHOTS.spine.sprite]!], 'a spine is not in the enemy’s ink').toBe('enemy');
    expect(SHOTS.spine.speed, 'a spine is no slower than a slab').toBeLessThan(SHOTS.flak.speed);
    expect(SHOTS.spine.speed, 'a spine is no quicker than a void ring').toBeGreaterThan(SHOTS.void.speed);
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
        expect(s.sprite, 'a shot of the opening fan is not a spine').toBe(SHOTS.spine.sprite);
        sum += Math.atan2(s.velAcross, s.velAlong - world.scrollPerStep);
      }
      centres.push(sum / world.enemyShots.size);
    }
    expect(Math.abs(centres[1]! - centres[0]!), 'the fan of spines does not rake — two volleys point the same way').toBeGreaterThan(0.1);
  });

  it('THE WHIP: one volley is a lash of flames along an arc, the tip faster than the root, in the fire ink', () => {
    /*
      *"Throws out whips of fire."* Driven: every shot of the volley is a flame; laid out by their
      own speed they climb from the root to the tip, and they span an arc rather than a line — the
      first and last leave in different directions across the lane.

      ⚠️ **THE BAND IS FOUND RATHER THAN TYPED SINCE 0317**, which moved the whip from second to third.
      A fraction written out here is a second description of where a phase begins, and it went stale
      the first time the table did.
    */
    const whipAt = BOSSES.volans.phases.findIndex((p) => (p.attack ?? BOSSES.volans.attack).kind === 'whip');
    const { world, frame } = volansAt((BOSSES.volans.phases[whipAt]!.upTo + (BOSSES.volans.phases[whipAt + 1]?.upTo ?? 0)) / 2);
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

  it('THE SUMMONS: a volley at the last sixth puts kites on the field, out of the mouth, and the next volley adds more', () => {
    /*
      *"Summons hordes of flying kites and raptors as adds at various points throughout the fight."*
      Driven: a volley throws no bullet and the enemy pool gains the phase's count of its kind,
      ahead of the ship and on the screen — where a wave arrives — and the next volley adds more.

      ⚠️ **ONE PHASE RATHER THAN TWO SINCE 0314, AND COUNTED BY KIND RATHER THAN BY POOL.** The
      half-health summons is an ESCORT now — the fish rakes while its kites arrive — so the volley that
      throws nothing is the last third's alone; and that phase has an escort running under it, so the
      pool holds minnows as well and *how many did the volley call* is a question about one kind.
      What the escort does on its own clock is `0314 — the escort` below.

      ⚠️ **AND OUT OF THE MOUTH SINCE 0373, WHERE 0262 HAD THEM FLANK.** *"Adds should fly out of its
      mouth."* Where a call starts is `0373 — the fish spits its adds` below; what this holds is that a
      summons is still a volley that throws nothing and calls a horde, twice.
    */
    for (const [fraction, enemy] of [[0.1, 'kite']] as const) {
      const { world, frame } = volansAt(fraction);
      const boss = world.bossPool.at(0);
      const called = (): number => {
        let n = 0;
        for (let i = 0; i < world.enemies.size; i++) if (world.enemies.at(i).kind === world.enemyKinds[enemy]) n++;
        return n;
      };
      // The player's fire held: a kite spat out of a mouth that is in the ship's lane (0258) is spat
      // into the pulse stream, and what is counted here is what the call PUT on the field.
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      boss.fireIn = 1;
      frame.step();
      const count = (phaseFor(BOSSES.volans, boss.health, world.bossFullHealth).attack as { count: number }).count;
      expect(called(), `the summons at ${fraction} put ${called()} ${enemy}s on the field`).toBe(count);
      expect(world.enemyShots.size, 'a summons threw bullets as well').toBe(0);
      const first = new Set<object>();
      let lean = 0;
      for (let i = 0; i < world.enemies.size; i++) {
        const add = world.enemies.at(i);
        if (add.kind !== world.enemyKinds[enemy]) continue;
        first.add(add);
        lean += (add.steerAcross !== 0 ? add.steerAcross : add.across) - boss.across;
        const inView = add.along - world.cameraAlong;
        expect(inView, 'an add arrived behind the ship').toBeGreaterThan(world.ship.along - world.cameraAlong);
        expect(inView, 'an add arrived beyond the screen').toBeLessThan(world.view.alongSpan);
      }
      // And again on the next volley: a horde is many calls, not one.
      boss.fireIn = 1;
      frame.step();
      expect(called(), 'the second volley called nobody').toBe(count * 2);
      /*
        ⚠️ **AND THE SECOND CALL LEANS THE OTHER WAY — 0262's alternation, on 0373's fan.** A spat
        fan is skewed half a spacing to the call's side, and `spin` flips a call; two calls that lean
        the same way are a horde that always comes out of one side of the mouth, which is the file
        0262 was written against. Read off the lanes the NEW members are steering for.
      */
      let second = 0;
      for (let i = 0; i < world.enemies.size; i++) {
        const add = world.enemies.at(i);
        if (add.kind !== world.enemyKinds[enemy] || first.has(add)) continue;
        second += (add.steerAcross !== 0 ? add.steerAcross : add.across) - boss.across;
      }
      expect(Math.sign(lean) * Math.sign(second), `two calls leaned ${lean.toFixed(0)} and ${second.toFixed(0)} from the mouth's lane — the same way`).toBe(-1);
    }
  });

  it('THE KITE: Ember Nebula’s horde is a small quick flier that bites once, and no level sends it', () => {
    const kite = ENEMIES.kite;
    expect(kite.health).toBe(1);
    // A gun since 0373 — *"adds should be firing"* — where 0249 held that a horde that shoots is a wall.
    expect(kite.fireEvery, 'a kite does not shoot, and the ask was that the adds fire').toBeGreaterThan(0);
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
    // Level on station, to within the yaw its tail beat gives it — 0374 writes that and nothing else does.
    expect(Math.abs(poses[poses.length - 1]!.turn), 'the fish stands on station still tilted from its entrance').toBeLessThanOrEqual(ROW.tail?.yaw ?? 1e-9);
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

/**
 * The shoal comes in while it fights — `docs/decisions/0314-the-shoal-comes-in-while-it-fights.md`.
 *
 * *"Needs to be attack while the adds are coming in"* and *"the adds need to be more interesting than
 * a boring line of fish and a boring line of space shrimp — there needs to be a reason for the player
 * to react and interact with them."* Two claims, and both are measured off a fight that was flown.
 */
describe('0314 — the escort', () => {
  /** The fish on station with an empty field, ready to be held in a phase. */
  function flown(fraction: number): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
    const { world } = playableWorld(VOLANS_ONLY);
    const frame = new GameFrame(world);
    for (let i = 0; i < 2400 && !(world.bossPool.size > 0 && world.bossEntering < 0); i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      frame.step();
    }
    expect(world.bossPool.size, 'the fish never arrived').toBe(1);
    world.bossPool.at(0).health = world.bossFullHealth * fraction;
    world.enemies.clear();
    world.enemyShots.clear();
    return { world, frame };
  }

  /** And held there for `steps`, with the ship alive and not firing. */
  function hold(fraction: number, steps: number): ReturnType<typeof playableWorld>['world'] {
    const { world, frame } = flown(fraction);
    for (let i = 0; i < steps; i++) {
      // Pinned every step, so the phase under test is the phase the whole run is in — `tests/crowd.ts`
      // makes the same argument: a phase keyed to health cannot otherwise be stood in.
      world.bossPool.at(0).health = world.bossFullHealth * fraction;
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      frame.step();
    }
    return world;
  }

  /** The middle of the band a phase owns, found rather than typed — 0317 moved every one of them. */
  const inside = (at: number): number => (BOSSES.volans.phases[at]!.upTo + (BOSSES.volans.phases[at + 1]?.upTo ?? 0)) / 2;

  const countOf = (world: ReturnType<typeof playableWorld>['world'], enemy: 'kite' | 'minnow'): number => {
    let n = 0;
    for (let i = 0; i < world.enemies.size; i++) if (world.enemies.at(i).kind === world.enemyKinds[enemy]) n++;
    return n;
  };

  it('THE ASKED-FOR ONE: the adds come in WHILE it is throwing, which a summons cannot do', () => {
    /*
      ⚠️ **THE CLAIM, AND IT IS ABOUT THE SAME STRETCH OF FIGHT RATHER THAN ABOUT TWO.** A `summon` is
      an arm of `BossAttack`, so the volley that calls a horde throws nothing — the adds ARE the attack.
      What is measured here is one phase over five seconds: bullets left the hull, adds arrived, and
      **neither stopped for the other.**
    */
    const row = BOSSES.volans;
    const phase = row.phases.findIndex((p) => p.escort !== undefined);
    expect(phase, 'no phase of the fish carries an escort').toBeGreaterThanOrEqual(0);
    const escort = row.phases[phase]!.escort!;
    expect((row.phases[phase]!.attack ?? row.attack).kind, 'the escorting phase is a summons, so this proves nothing').not.toBe('summon');
    // Inside the phase: its own `upTo` is its ceiling and the NEXT phase's is its floor.
    const world = hold((row.phases[phase]!.upTo + (row.phases[phase + 1]?.upTo ?? 0)) / 2, 300);
    expect(countOf(world, escort.enemy as 'kite'), 'nothing arrived in five seconds of an escorted phase').toBeGreaterThan(0);
    expect(world.enemyShots.size, 'the fish threw nothing while the escort was arriving — which is a summons again').toBeGreaterThan(0);
  });

  /*
    ⚠️ **THREE GUARDS OF 0314's WERE DELETED HERE WITH THE FEED THEY HELD — 0373.** *A minnow swims for
    the FISH*, *one that gets there is EATEN* and *feeding can never push it back into a phase it has
    left* were each true of a mechanism the play called *"pretty meaningless"* and then *"trash"*, and
    the mechanism is gone: the shoal is spat at the player now. A guard that outlives its subject is
    what 0192 calls a guard to delete, and a decision says why rather than a diff.
  */

  /** The mouth, as the guards below read it: the drawn radius ahead of the hull's centre, along its heading. */
  const mouthOf = (world: ReturnType<typeof playableWorld>['world']): { along: number; across: number; reach: number } => {
    const boss = world.bossPool.at(0);
    // The painter's radius is 0.42 of the tile (`drawKind`), and the snout is at −1 of it.
    const reach = SPRITE_EXTENT[SPRITE_KINDS[world.bossRow.sprite]!]! * 0.42;
    return { along: boss.along - Math.cos(boss.turn) * reach, across: boss.across - Math.sin(boss.turn) * reach, reach };
  };

  /** Fly a phase with the player's fire held until `enemy` first appears; the pool on that step, and what the fish wore. */
  function firstCall(fraction: number, enemy: 'kite' | 'minnow'): { world: ReturnType<typeof playableWorld>['world']; adds: { along: number; across: number; velAlong: number; velAcross: number; steerAcross: number }[]; gaped: boolean } {
    const { world, frame } = flown(fraction);
    const face = BOSSES.volans.face!;
    for (let i = 0; i < 600; i++) {
      world.bossPool.at(0).health = world.bossFullHealth * fraction;
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      const before = countOf(world, enemy);
      const gapedBefore = world.bossPool.at(0).spriteBase === face.gape || world.bossPool.at(0).spriteBase === (phaseFor(BOSSES.volans, world.bossPool.at(0).health, world.bossFullHealth).look?.face.gape ?? -1);
      frame.step();
      if (countOf(world, enemy) <= before) continue;
      const adds: { along: number; across: number; velAlong: number; velAcross: number; steerAcross: number }[] = [];
      for (let k = 0; k < world.enemies.size; k++) {
        const add = world.enemies.at(k);
        if (add.kind !== world.enemyKinds[enemy]) continue;
        adds.push({ along: add.along, across: add.across, velAlong: add.velAlong, velAcross: add.velAcross, steerAcross: add.steerAcross });
      }
      return { world, adds, gaped: gapedBefore };
    }
    throw new Error(`no ${enemy} was ever called at ${fraction} of the bar`);
  }

  it('0373 — THE ASKED-FOR ONE: every horde the fish calls comes OUT OF ITS MOUTH, thrown down the lane at the player', () => {
    /*
      ⚠️ **MEASURED ON THE STEP THE ADDS APPEAR, IN THE UNITS OF THE DRAWING.** *"Adds should fly out of
      its mouth to attack the player."* The mouth is where the painter put it — the drawn radius ahead
      of the hull's centre, along the heading it wears — and a body that came out of it is within a
      hurtbox of that point on its first step, ahead of the fish's centre, and moving DOWN the lane in
      the camera's frame. Every phase that calls anything is asked, escorts and the summons alike.

      ⚠️ **AND THE JAW WAS OPEN, ON THE STEP BEFORE.** A horde out of a shut mouth is a horde out of
      nowhere — 0036 — so what the fish wore as they came is asked beside where they came from.
    */
    const row = BOSSES.volans;
    let asked = 0;
    for (let index = 0; index < row.phases.length; index++) {
      const phase = row.phases[index]!;
      const called = phase.escort?.enemy ?? (phase.attack?.kind === 'summon' ? phase.attack.enemy : undefined);
      if (called === undefined) continue;
      expect(phase.escort?.from ?? 'mouth', `phase ${index + 1}'s escort does not come from the mouth`).toBe('mouth');
      if (phase.attack?.kind === 'summon') expect(phase.attack.from, `phase ${index + 1}'s summons does not come from the mouth`).toBe('mouth');
      const { world, adds, gaped } = firstCall(inside(index), called as 'kite' | 'minnow');
      const mouth = mouthOf(world);
      const boss = world.bossPool.at(0);
      expect(adds.length, `phase ${index + 1} called nobody`).toBeGreaterThan(0);
      for (const add of adds) {
        const off = Math.hypot(add.along - mouth.along, add.across - mouth.across);
        expect(off, `phase ${index + 1}: a ${called} appeared ${off.toFixed(1)} units from the mouth, which is not out of it`).toBeLessThan(boss.radius);
        expect(add.along, `phase ${index + 1}: a ${called} appeared behind the fish's centre`).toBeLessThan(boss.along - mouth.reach / 2);
        expect(add.velAlong - world.scrollPerStep, `phase ${index + 1}: a ${called} left the mouth flying UP the lane, away from the player`).toBeLessThan(0);
      }
      expect(gaped, `phase ${index + 1}: the fish's mouth was shut on the step its ${called}s came out of it`).toBe(true);
      asked++;
    }
    expect(asked, 'no phase of the fish calls a horde at all').toBeGreaterThanOrEqual(3);
  });

  it('0373 — and they FAN: one call takes lanes a ship’s width apart, so a horde is a spread and not a stream', () => {
    /*
      ⚠️ **IN LANE UNITS, ON THE STEP THEY LEAVE.** Each spat body is steering for a lane of its own;
      the spread of those lanes across one call is the fan the player sees open. Ten units is over
      two ship-widths — a call of two or three from one point that lands inside ten units is a clump
      the player answers as one target, which is the *"boring line"* 0314 was written against.
    */
    const row = BOSSES.volans;
    const kiteAt = inside(row.phases.findIndex((p) => p.escort?.enemy === 'kite'));
    const { adds } = firstCall(kiteAt, 'kite');
    expect(adds.length, 'the kites are called one at a time, so there is no fan to measure').toBeGreaterThan(1);
    const lanes = adds.map((add) => (add.steerAcross !== 0 ? add.steerAcross : add.across));
    const spread = Math.max(...lanes) - Math.min(...lanes);
    expect(spread, `one call of ${adds.length} kites left the mouth for lanes ${spread.toFixed(1)} units apart, which is a clump`).toBeGreaterThanOrEqual(10);
    for (const add of adds) {
      expect(add.steerAcross !== 0 || add.velAcross === 0, 'a spat kite is not steering for a lane').toBe(true);
    }
  });

  it('0373 — and the adds FIRE: a phase flown with the fish itself silenced still puts shots on the field', () => {
    /*
      ⚠️ **THE FISH'S OWN FAN IS HELD, SO EVERY SHOT COUNTED IS AN ADD'S.** *"Adds should be firing."*
      Both rows say so — `fireEvery` above zero — and this is the half a row cannot claim: that a horde
      spat in a fight, with the ship parked where it is, actually gets a shot away before it dies or
      passes. Eight seconds, which is over three calls.
    */
    expect(ENEMIES.minnow.fireEvery, 'the minnow has no gun').toBeGreaterThan(0);
    expect(ENEMIES.kite.fireEvery, 'the kite has no gun').toBeGreaterThan(0);
    const row = BOSSES.volans;
    for (const enemy of ['minnow', 'kite'] as const) {
      const at = inside(row.phases.findIndex((p) => p.escort?.enemy === enemy));
      const { world, frame } = flown(at);
      let shots = 0;
      for (let i = 0; i < 480; i++) {
        world.bossPool.at(0).health = world.bossFullHealth * at;
        world.bossPool.at(0).fireIn = 999;
        world.ship.health = world.shipRow.health;
        world.ship.invulnFor = 2;
        world.fireIn = Number.MAX_SAFE_INTEGER;
        world.missileIn = Number.MAX_SAFE_INTEGER;
        const before = world.enemyShots.size;
        frame.step();
        if (world.enemyShots.size > before) shots += world.enemyShots.size - before;
      }
      expect(shots, `eight seconds of ${enemy}s put no shot on the field — the adds are not firing`).toBeGreaterThan(0);
    }
  });

  it('0373 — and a spat add LIVES to leave the mouth: under the cap’s pulse on a parked ship, one is on the field for a fifth of a second', () => {
    /*
      ⚠️ **THE CASE THAT KILLED EVERY ADD THE FIRST DRAFT SPAT, MEASURED AS THE INSTRUMENT MEASURED
      IT.** The fish stalks the player's lane (0258), so its mouth sits in the player's own column of
      fire, and a body born there was born inside shots already in flight: one to nine steps, on every
      gun, whatever speed it left at. What is asked is the median lifetime of an add in a fight
      against the cap's pulse from a parked ship — in seconds, because that is what *nobody ever sees
      them* is a claim about. The floor is between what was traced (0.1 s) and the grace's own length.
    */
    const { world } = playableWorld(VOLANS_ONLY, 'savior');
    const frame = new GameFrame(world);
    world.weapon = weaponFor(world.shipRow, ['weapon', 'weapon', 'weapon', 'weapon'], 'pulse');
    wearHull(world);
    const born = new Map<object, number>();
    const lived: number[] = [];
    let start = -1;
    for (let step = 0; step < 6000; step++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      if (world.bossPool.size > 0 && world.bossEntering < 0) {
        const boss = world.bossPool.at(0);
        if (start < 0) start = step;
        world.ship.prevAcross = world.ship.across;
        world.ship.across = ACROSS_SPAN / 2;
        world.ship.prevAlong = world.ship.along;
        world.ship.along = boss.along - boss.radius - 60;
      }
      frame.step();
      if (start < 0) continue;
      const alive = new Set<object>();
      for (let i = 0; i < world.enemies.size; i++) {
        const e = world.enemies.at(i);
        alive.add(e);
        if (!born.has(e)) born.set(e, step);
      }
      for (const [e, at] of born) {
        if (alive.has(e)) continue;
        lived.push(step - at);
        born.delete(e);
      }
      if (world.bossPool.size === 0) break;
    }
    expect(lived.length, 'no add was ever spat and finished in a whole fight').toBeGreaterThan(10);
    const sorted = [...lived].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)]! / 60;
    expect(median, `a spat add lives ${median.toFixed(2)}s under the cap's pulse — dead before anyone saw it leave the mouth`).toBeGreaterThanOrEqual(0.2);
  });

  it('0373 — and no level sends a minnow or a kite, which are the fish’s to spit', () => {
    for (const level of Object.values(LEVELS)) {
      for (const wave of level.waves) {
        expect(wave.enemy, 'a level authors the minnow, which is the fish’s to call').not.toBe('minnow');
        expect(wave.enemy, 'a level authors the kite, which is the fish’s to call').not.toBe('kite');
      }
    }
  });
});

/**
 * The fish beats its tail — `docs/decisions/0374-the-fish-beats-its-tail.md`. *"Animation should be
 * better."*
 *
 * ⚠️ **EVERY CLAIM IS ABOUT THE PICTURE THE FRAME LAYS OUT, IN THE PLAYER'S UNITS** — 0027: where the
 * tail's body is put, how far its tip travels on the screen, what it wears when the fish is hit, and
 * what the two drawings reach. The row says there is a tail; the frame is what puts one on the animal.
 */
describe('0374 — the fish beats its tail', () => {
  const ROW = BOSSES.volans;
  /** The fish on station, its fire held, the ship alive and parked. */
  function onStation(): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
    const { world } = playableWorld(VOLANS_ONLY);
    const frame = new GameFrame(world);
    for (let i = 0; i < 2400 && !(world.bossPool.size > 0 && world.bossEntering < 0); i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      frame.step();
    }
    expect(world.bossPool.size, 'the fish never arrived').toBe(1);
    return { world, frame };
  }
  /** The tail's body this step, or `null`: the aura layer's entity wearing one of the tail's two faces. */
  function tailOf(world: ReturnType<typeof playableWorld>['world'], art: { sprite: number; spriteHit: number }): { along: number; across: number; turn: number; sprite: number } | null {
    for (let i = 0; i < world.bossAura.size; i++) {
      const e = world.bossAura.at(i);
      if (e.sprite === art.sprite || e.sprite === art.spriteHit) return { along: e.along, across: e.across, turn: e.turn, sprite: e.sprite };
    }
    return null;
  }
  /** The short way round between two headings. */
  const swingBetween = (a: number, b: number): number => Math.atan2(Math.sin(a - b), Math.cos(a - b));

  it('THE ASKED-FOR ONE: the tail is a body of its own behind the hull, rooted on the peduncle, and it BEATS', () => {
    const tail = ROW.tail;
    if (tail === null) throw new Error('the fish has no tail');
    const { world, frame } = onStation();
    const head = world.bossPool.at(0);
    const hold = (): void => {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      head.fireIn = 999;
      frame.step();
    };
    let most = -Infinity;
    let least = Infinity;
    let rootOff = 0;
    let seen = 0;
    for (let i = 0; i < tail.beat * 2; i++) {
      hold();
      const fin = tailOf(world, tail.art);
      if (fin === null) continue;
      seen++;
      // Rooted on the peduncle: `root` units from the hull's centre, along the hull's own heading.
      const want = { along: head.along + Math.cos(head.turn) * tail.root, across: head.across + Math.sin(head.turn) * tail.root };
      rootOff = Math.max(rootOff, Math.hypot(fin.along - want.along, fin.across - want.across));
      const relative = swingBetween(fin.turn, head.turn);
      most = Math.max(most, relative);
      least = Math.min(least, relative);
    }
    expect(seen, 'the tail was never on the field over two beats').toBe(tail.beat * 2);
    expect(rootOff, `the tail's root strayed ${rootOff.toFixed(2)} units from the peduncle`).toBeLessThan(0.05);
    /*
      ⚠️ **THE TIP'S TRAVEL, IN CSS PIXELS OF A 1280×720 SCREEN.** A sweep is a number on the row; what
      the player watches is the lobe moving. The lobes sit at 0.91 of the tail tile's drawing radius, so
      the tip is that far from the root, and the travel is the chord of the relative swing.
    */
    // The painter draws in a radius of 0.42 of the tile (`drawKind`), and the lobes sit at 0.91 of it.
    const tip = SPRITE_EXTENT[SPRITE_KINDS[tail.art.sprite]!]! * 0.42 * 0.91;
    const travel = tip * Math.abs(Math.sin(most) - Math.sin(least));
    const px = travel * viewOf(1280, 720).scale;
    expect(most, 'the tail never swung to one side').toBeGreaterThan(tail.sweep * 0.8);
    expect(least, 'the tail never swung to the other side').toBeLessThan(-tail.sweep * 0.8);
    expect(px, `the tail's tip travels ${px.toFixed(1)} CSS pixels a beat on a 1280×720 screen, which is not a beat anyone sees`).toBeGreaterThan(12);
  });

  it('and the hull yaws AGAINST it, a fraction of the sweep the other way, so the beat is a swim and not a flag', () => {
    const tail = ROW.tail;
    if (tail === null) throw new Error('the fish has no tail');
    const { world, frame } = onStation();
    const head = world.bossPool.at(0);
    let yawMost = 0;
    let against = 0;
    let with_ = 0;
    for (let i = 0; i < tail.beat * 2; i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      head.fireIn = 999;
      frame.step();
      const fin = tailOf(world, tail.art);
      if (fin === null) continue;
      yawMost = Math.max(yawMost, Math.abs(head.turn));
      const relative = swingBetween(fin.turn, head.turn);
      if (Math.abs(relative) < 0.05 || Math.abs(head.turn) < 0.005) continue;
      if (Math.sign(relative) === -Math.sign(head.turn)) against++;
      else with_++;
    }
    expect(yawMost, `the hull yawed ${yawMost.toFixed(3)} radians at most, and the row asks ${tail.yaw}`).toBeGreaterThan(tail.yaw * 0.8);
    expect(yawMost, 'the hull yaws as far as the tail sweeps, which is a flag on a pole').toBeLessThan(tail.sweep * 0.5);
    expect(against, 'the hull never turned against its tail').toBeGreaterThan(0);
    expect(with_, `the hull turned WITH its tail on ${with_} steps`).toBe(0);
  });

  it('and the tail wears the hull’s own hurt: a hit lights the fin with the flesh it is joined to', () => {
    const tail = ROW.tail;
    if (tail === null) throw new Error('the fish has no tail');
    const { world, frame } = onStation();
    const head = world.bossPool.at(0);
    const step = (): void => {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      head.fireIn = 999;
      frame.step();
    };
    step();
    expect(tailOf(world, tail.art)?.sprite, 'the tail is lit with nothing having hit the fish').toBe(tail.art.sprite);
    // A hit, as `strike` leaves it: the flash is on for its steps.
    head.flashFor = 4;
    step();
    expect(tailOf(world, tail.art)?.sprite, 'the fish is flashing and its tail is not').toBe(tail.art.spriteHit);
    for (let i = 0; i < 8; i++) step();
    expect(tailOf(world, tail.art)?.sprite, 'the flash is over and the tail is still lit').toBe(tail.art.sprite);
  });

  it('and the body has no tail of its own any more: the hull ends at a stump, and the tail’s own hull reaches past it from a root at its centre', () => {
    /*
      ⚠️ **READ OFF THE DRAWINGS, IN THE PAINTER'S OWN UNITS.** If the body still carried a caudal fin
      the animal would have two, and the beat would be a fin waving beside a fin. The stump ends short
      of where the tail root sits plus a hull's width of overlap; the tail's hull starts behind its own
      centre — the root — and reaches well aft of it.
    */
    const tail = ROW.tail;
    if (tail === null) throw new Error('the fish has no tail');
    const hullOf = (index: number): readonly (readonly [number, number])[] => {
      const kind = SPRITE_KINDS[index]!;
      const size = SPRITE_EXTENT[kind] * viewOf(1280, 720).scale;
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'nebula');
      return trace.passes[0]!.subpaths[0]!.map(([x, y]) => [(x - size / 2) / (size * 0.42), (y - size / 2) / (size * 0.42)] as const);
    };
    const bodyAft = Math.max(...hullOf(ROW.sprite).map(([x]) => x));
    expect(bodyAft, `the body reaches ${bodyAft.toFixed(2)} of its radius aft, which is a fin still on it`).toBeLessThan(0.9);
    const finXs = hullOf(tail.art.sprite).map(([x]) => x);
    expect(Math.min(...finXs), 'the tail’s hull does not reach back past its own root').toBeLessThan(-0.05);
    expect(Math.max(...finXs), 'the tail’s hull reaches nowhere aft of its root').toBeGreaterThan(0.35);
    // And the root's place on the hull is inside the stump's overlap: the body covers the join.
    const bodyRadius = SPRITE_EXTENT[SPRITE_KINDS[ROW.sprite]!]! * 0.42;
    expect(tail.root / bodyRadius, 'the tail is rooted past the body’s stump, so the join shows').toBeLessThan(bodyAft);
  });

  it('and it is laid LAST in the layer behind the hull, so it is drawn over the fire and under the flesh', () => {
    const tail = ROW.tail;
    const ablaze = phaseFor(ROW, ROW.health * 0.1, ROW.health).look;
    if (tail === null || ablaze === null || ablaze.aura === null) throw new Error('the fish has no tail or no fire');
    const { world, frame } = onStation();
    const head = world.bossPool.at(0);
    for (let i = 0; i < 12; i++) {
      head.health = world.bossFullHealth * 0.1;
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 2;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      world.missileIn = Number.MAX_SAFE_INTEGER;
      head.fireIn = 999;
      frame.step();
    }
    expect(world.bossAura.size, 'the burning fish has no flame or no tail behind it').toBe(2);
    const last = world.bossAura.at(world.bossAura.size - 1);
    const worn = ablaze.tail ?? tail.art;
    expect(last.sprite === worn.sprite || last.sprite === worn.spriteHit, 'the last body in the layer is not the tail, so the fire is drawn over the fin').toBe(true);
  });
});

/**
 * The breach has a body — `docs/decisions/0375-the-breach-has-a-body.md`. *"Intro sound is terrible."*
 *
 * ⚠️ **A TEST CANNOT HEAR, SO WHAT IS HELD IS THE SHAPE `scripts/weigh-cue.mjs` READS OFF THE ROW** —
 * the same bands and the same centroid, with the bound read off the two rows that bracket it: the
 * one the report was about, and the one that answered it.
 */
describe('0375 — the breach has a body', () => {
  it('THE ASKED-FOR ONE: the breach’s weight is below the middle of the spectrum, and its centre of gravity does not climb', () => {
    /*
      ⚠️ **MEASURED, BEFORE AND AFTER, AND THE BOUNDS SIT BETWEEN.** The row 0313 wrote weighed `low`
      0.15 and `lowmid` 0.25 against `hi` 1.00, and its centroid ROSE 6.8 dB from onset to tail — a
      hiss with a click on the front. The re-voice weighs 0.72 and 0.55 and falls 0.7 dB. The floors
      below are between the two rows on both axes, with the margin on the side of the fix, which is
      how 0140 and 0179 set theirs.
    */
    const row = CUES.bossBreach;
    const samples = sampleCue(row, SAMPLE_RATE, makeRng('cues').stream('bossBreach'));
    const shares = spectrum(samples, SAMPLE_RATE);
    const share = (name: string): number => shares[BANDS.findIndex(([, , band]) => band === name)]!;
    const body = share('low') + share('lowmid');
    expect(body, `the breach's low and low-mid bands share ${body.toFixed(2)} of its loudest, which is a hiss and not a body`).toBeGreaterThanOrEqual(0.8);
    const seconds = cueSeconds(row);
    const onset = centroid(samples, 0, Math.min(0.025, seconds / 3), SAMPLE_RATE);
    const tail = centroid(samples, (seconds * 2) / 3, seconds, SAMPLE_RATE);
    const climb = 20 * Math.log10(tail / onset);
    expect(climb, `the breach starts at ${onset.toFixed(0)}Hz and ends at ${tail.toFixed(0)}Hz, a climb of ${climb.toFixed(1)}dB — a body leaves its top behind`).toBeLessThanOrEqual(2);
  });

  it('and the spit is a tenth of a second with a picture, because it says WHERE and the bodies say WHAT', () => {
    const row = CUES.bossSpit;
    expect(row.twin, 'the spit has no picture').toBe('spit-appears');
    expect(cueSeconds(row), 'the spit is longer than a thing leaving a mouth').toBeLessThanOrEqual(0.25);
    expect(BURST.spit, 'the spray at the mouth is the size of a death, which nothing died for').toBeLessThan(BURST.enemy);
  });
});

/**
 * The fish throws a breaker — `docs/decisions/0315-the-fish-throws-a-breaker.md`.
 *
 * *"Needs multiple styles of attacks."* The one attack in the game that does not leave the hull: a
 * wave up off the near edge of the lane, over a span centred on the fish.
 */
describe('0315 — the breaker', () => {
  it('THE ASKED-FOR ONE: the wave comes up off the EDGE and not out of the hull, bowed, over the span the row authors', () => {
    const row = BOSSES.volans;
    const phase = row.phases.findIndex((p) => (p.attack ?? row.attack).kind === 'breaker');
    expect(phase, 'the fish throws no breaker').toBeGreaterThanOrEqual(0);
    const attack = row.phases[phase]!.attack!;
    if (attack.kind !== 'breaker') throw new Error('unreachable');
    const { world, frame } = volansAt((row.phases[phase]!.upTo + (row.phases[phase + 1]?.upTo ?? 0)) / 2);
    const hull = world.bossPool.at(0);
    const at = hull.along;
    world.enemyShots.clear();
    hull.fireIn = 1;
    frame.step();
    const wave = Array.from({ length: world.enemyShots.size }, (_, i) => world.enemyShots.at(i));
    expect(wave.length, 'the breaker threw nothing').toBeGreaterThan(2);
    /*
      ⚠️ **OFF THE EDGE, IN THE UNITS THE LANE IS MEASURED IN — 0027.** Every other attack leaves the
      muzzle, so what is asked here is where the shots WERE on the step they were thrown: past the near
      edge of the lane, every one of them, and rising into it.
    */
    for (const shot of wave) {
      expect(shot.prevAcross, `a shot of the wave started at ${shot.prevAcross.toFixed(0)} across, inside the lane`).toBeGreaterThanOrEqual(ACROSS_SPAN);
      expect(shot.velAcross, 'a shot of the wave is not rising into the lane').toBeLessThan(0);
      expect(Math.abs(shot.prevAlong - at), `a shot of the wave started ${Math.abs(shot.prevAlong - at).toFixed(0)} units from the hull, outside a span of ${attack.span}`).toBeLessThanOrEqual(attack.span / 2 + 0.001);
    }
    /*
      ⚠️ **AND EVERY SPINE POINTS THE WAY IT FLIES — 0316, which is 0262's own claim about this
      drawing.** *"The shaft points the way it flies"* is why the bullet is legible; every fan in the
      game is narrow enough that a sprite baked facing down the lane holds, and a breaker is the first
      attack that sends one **ninety degrees off**. The first photograph of it was a rank of little
      bars sliding up the screen edge-on, with every assertion about where they were staying green —
      0027 again, on a bullet this time.
    */
    for (const shot of wave) {
      const want = Math.atan2(shot.velAcross, shot.velAlong - world.scrollPerStep) - Math.PI;
      const swing = Math.abs(Math.atan2(Math.sin(shot.turn - want), Math.cos(shot.turn - want)));
      expect(swing, `a spine of the wave is drawn ${((swing * 180) / Math.PI).toFixed(0)}° away from the way it is flying`).toBeLessThan(0.2);
    }
    // AND IT BOWS: the middle of the line outruns its shoulders, which is what makes it a wave.
    const speeds = wave.map((s) => -s.velAcross).sort((a, b) => a - b);
    expect(speeds[speeds.length - 1]!, 'every shot of the wave rises at the same rate — a rank, not a breaker').toBeGreaterThan(speeds[0]! * 1.1);
    // And the crest is the MIDDLE of it, not an end: the fastest shot is nearest the hull's own along.
    let crest = wave[0]!;
    for (const shot of wave) if (-shot.velAcross > -crest.velAcross) crest = shot;
    expect(Math.abs(crest.prevAlong - at), 'the fastest shot of the wave is at one END of it, so the line bows sideways').toBeLessThan(attack.span / 4);
  });

  it('and the edge it came up through is drawn, and it sounds like the same edge the fish breached', () => {
    /*
      ⚠️ **0036, AND IT IS THE SAME EDGE AS 0313's.** A wave that appeared at the lane's boundary with
      nothing happening there is bullets from nowhere. One burst under the hull rather than one per
      shot — what the picture owes is *the edge broke HERE*.
    */
    const row = BOSSES.volans;
    const phase = row.phases.findIndex((p) => (p.attack ?? row.attack).kind === 'breaker');
    expect(row.phases[phase]!.cue, 'the breaker does not sound like the edge breaking').toBe('bossBreach');
    const { world, frame } = volansAt((row.phases[phase]!.upTo + (row.phases[phase + 1]?.upTo ?? 0)) / 2);
    const hull = world.bossPool.at(0);
    /*
      ⚠️ **ONE STEP FIRST, BECAUSE SETTING THE HEALTH IS A PHASE CHANGE AND A PHASE CHANGE SHEDS
      FOURTEEN FRAGMENTS** (0111). Measured before this line was here: 25 on the firing step, of which
      the breaker's own eleven were the smaller half — and the guard stayed green with the spray taken
      out entirely, which is exactly the vacuous guard 0019's probes exist to find.
    */
    hull.fireIn = 999;
    frame.step();
    world.enemyShots.clear();
    const before = world.debris.size;
    hull.fireIn = 1;
    frame.step();
    expect(world.debris.size - before, 'the wave came up through the edge and the edge said nothing').toBeGreaterThanOrEqual(BURST.breach);
  });
});

/**
 * The pressure comes forward — `docs/decisions/0317-the-pressure-comes-forward.md`.
 *
 * Reported, having read the fight flown: *"more forward pressure early and bring the breaker forward,
 * but we need to make sure there's variety in the pressure as well, a phase that lasts too long or
 * starts early and goes till end of the fight ends up being boring."*
 *
 * ⚠️ **BOTH CLAIMS ARE ABOUT THIS ROW AND NEITHER RANKS IT AGAINST ANOTHER BOSS** —
 * [0295](../docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md). *Does it make sense for THIS
 * THING to be hard?* is the question, and the answer for the fish is *yes, this is the shape its own
 * decision claims*; a rule about where every boss's attacks may sit would be the content limiter.
 */
describe('0317 — the pressure comes forward', () => {
  const row = BOSSES.volans;

  it('THE ASKED-FOR ONE: the breaker opens in the first half of the bar, where it used to wait for the last third', () => {
    /*
      ⚠️ **IT IS THE ONE ATTACK THAT COVERS A PLACE RATHER THAN A DIRECTION** — 0315 — so it is the one
      that makes a player move rather than lean. At a third of health a shuriken had already finished
      the fight before it was ever thrown: `scripts/weigh-threat.mjs` measured sixteen seconds and a
      parked ship hit **zero times**.
    */
    const at = row.phases.findIndex((p) => (p.attack ?? row.attack).kind === 'breaker');
    expect(at, 'the fish throws no breaker at all').toBeGreaterThanOrEqual(0);
    expect(row.phases[at]!.upTo, `the breaker waits until ${row.phases[at]!.upTo} of the bar`).toBeGreaterThan(0.5);
  });

  it('and the field EMPTIES between the two hordes, so neither runs from where it starts to the end', () => {
    /*
      ⚠️ **THE HALF OF THE ASK THAT IS ABOUT PACING RATHER THAN PRESSURE.** *"A phase that lasts too
      long or starts early and goes till end of the fight ends up being boring."* Both escorts used to
      run in consecutive phases to the last one, so from half health on there was always something in
      the way — and a horde that is always there is scenery. What makes the shoal read when it comes
      back is that it went away.
    */
    const escorted = row.phases.map((p) => p.escort !== undefined);
    expect(escorted.filter(Boolean).length, 'the fish calls no horde at all').toBeGreaterThan(1);
    const first = escorted.indexOf(true);
    const gaps = escorted.slice(first).filter((on) => !on).length;
    expect(gaps, 'every phase from the first horde to the last carries one, so the field never empties').toBeGreaterThan(0);
  });

  it('THE ONE THAT EXPLAINS THE REST: its fan sweeps ACROSS THE LANE and never round the circle', () => {
    /*
      ⚠️ **THE DEFECT UNDER EVERY OTHER NUMBER, AND ONLY THE INSTRUMENT FOUND IT.** `firePhase`
      accumulates without limit, so a `turn` of 0.5 walks the rake's centre through a **whole circle
      every thirteen volleys**: the fan spends most of its life pointing sideways and backwards, and
      *down the lane* comes up once in thirteen. It is why the fish landed 0.02 hits a second on a
      parked ship, and why neither more shots nor a tighter spread moved it — density cannot help a fan
      that is aimed at the wall.

      ⚠️ **DRIVEN OVER TWO FULL SWEEPS, AND MEASURED AS THE MEAN DIRECTION OF THE VOLLEY** rather than
      off `firePhase`, which is the model's own number. What the player sees is where the shots went.
    */
    const attack = row.attack;
    expect(attack.kind, 'the fish no longer rakes').toBe('rake');
    if (attack.kind !== 'rake') throw new Error('unreachable');
    expect(attack.arc, 'the fish rakes with no arc, so its fan walks round the circle').toBeDefined();
    const { world, frame } = volansAt(1);
    const hull = world.bossPool.at(0);
    let worst = 0;
    for (let volley = 0; volley < 30; volley++) {
      world.enemyShots.clear();
      hull.fireIn = 1;
      frame.step();
      /*
        ⚠️ **THE VECTORS ARE SUMMED AND NOT THE ANGLES, WHICH THE FIRST DRAFT GOT WRONG AND LOUDLY.**
        Down the lane is ±π and `atan2` hands it back either way, so a mean of the ANGLES over volleys
        that straddle the half-turn lands near zero — and the guard reported a fan pointing 155° off
        the lane for a fan that was pointing straight down it.
      */
      let along = 0;
      let across = 0;
      for (let i = 0; i < world.enemyShots.size; i++) {
        const s = world.enemyShots.at(i);
        along += s.velAlong - world.scrollPerStep;
        across += s.velAcross;
      }
      const off = Math.abs(Math.abs(Math.atan2(across, along)) - Math.PI);
      if (off > worst) worst = off;
    }
    expect(worst, `a volley pointed ${((worst * 180) / Math.PI).toFixed(0)}° off the lane, and the arc is ${(((attack.arc ?? 0) / 2 / Math.PI) * 180).toFixed(0)}°`).toBeLessThanOrEqual((attack.arc ?? 0) / 2 + 0.01);
  });
});

/**
 * ── THE FISH IS DRAWN — 0318 ───────────────────────────────────────────────────────────────────
 *
 * Asked: *"A fully great graphics pass over the fish … up to par with the serpent pass in style"*, and
 * then, having seen it: *"extend the wings to have longer finny trails coming off them and give it
 * overall a more nebulous astral look as well — the shape is good, just needs some extra flavour
 * enhancements."*
 *
 * ⚠️ **WHAT IS HELD HERE IS THE TWO THINGS THAT SENTENCE ASKED FOR, AND NOTHING ELSE ABOUT THE PAINT.**
 * How many rays a fin has and where the lateral line runs are taste, and taste has a file
 * ([0192](../docs/decisions/0192-a-guard-holds-an-invariant.md)). *The wings trail* and *the light is
 * behind the animal* are not: each is a claim a wrong drawing makes false, each was got wrong once
 * while this was built, and each is measured off the trace of the real drawing rather than off the
 * numbers beside it ([0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)).
 *
 * ⚠️ **AND *EVERY MARK STAYS ON THE HULL* IS NOT RE-ASSERTED HERE.** `tests/accents.test.ts` already
 * holds it over every body in the game, and it is what caught the eight marks this redraw had over the
 * edge — a fin ray reaching 0.74 across a fin that reaches 0.64, and both membrane washes overshooting
 * their own roots. A second copy of a guard is a second thing to drift
 * ([0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)).
 */
describe('0318 — the fish is drawn', () => {
  /** The fish traced at the size it is drawn on the screen every report was made on, in a place. */
  function fish(theme: ThemeKind = 'nebula'): { size: number; hull: Pass; paint: readonly Pass[] } {
    const size = SPRITE_EXTENT.boss9 * viewOf(1280, 720).scale;
    const { pen, trace } = tracingPen();
    drawKind(pen, 'boss9', PALETTES[DEFAULT_PALETTE], size, theme);
    const [hull, ...paint] = trace.passes;
    expect(hull, 'the fish draws nothing').toBeDefined();
    return { size, hull: hull!, paint };
  }

  /** A mark's furthest reach from the sprite's centre along the lane, in CSS pixels of that screen. */
  function reachOf(mark: Pass, size: number): number {
    return Math.max(...mark.subpaths.flat().map(([x]) => Math.abs(x - size / 2)));
  }

  /**
   * How far past the hull's own edge a mark's furthest point lies, in those same pixels — 0 if none is.
   *
   * ⚠️ **PAST THE HULL WHERE THE MARK IS, AND NOT PAST THE WHOLE ANIMAL.** The first draft of this
   * guard asked whether a streamer reached further down the lane than the tail did, and four of the
   * ten did — which says nothing, because a wing sits **forward of the tail** and a trail coming off
   * one is streaming past the fin it left, not past the furthest point of the body. A guard measuring
   * a quantity that is not the claim is 0027's own failure, one layer in.
   */
  function overhang(hull: Pass, mark: Pass): number {
    let worst = 0;
    for (const point of mark.subpaths.flat()) {
      if (inside(hull, point)) continue;
      let near = Infinity;
      for (const subpath of hull.subpaths)
        for (let i = 0; i < subpath.length; i++) {
          const [ax, ay] = subpath[i]!;
          const [bx, by] = subpath[(i + 1) % subpath.length]!;
          const dx = bx - ax;
          const dy = by - ay;
          const len = dx * dx + dy * dy;
          const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - ax) * dx + (point[1] - ay) * dy) / len));
          near = Math.min(near, Math.hypot(point[0] - (ax + t * dx), point[1] - (ay + t * dy)));
        }
      worst = Math.max(worst, near);
    }
    return worst;
  }

  it('THE ASKED-FOR ONE: the wings TRAIL — filaments that start on the fin and stream out past the hull, both sides', () => {
    /*
      ⚠️ **THE FIRST DRAFT PUT THEM IN THE SILHOUETTE AND THE PHOTOGRAPH REFUSED IT.** A trail drawn as
      hull gets the outline traced round it, so the gap between the streamer and the fin becomes a black
      wedge — at 4× the wing read as a hook with a bite out of it. *"The shape is good"* settles which
      half moves: the hull the ask approved is the hull that ships, and the trails are paint on it.

      ⚠️ **SO WHAT IS ASSERTED IS THE PAIR, AND NEITHER HALF ALONE IS THE ASK.** A mark that starts
      inside the hull and ends outside it is a trail; one wholly inside is a stripe, and one wholly
      outside is a cloud floating beside the animal. Both wrong drawings pass half of this.
    */
    const { size, hull, paint } = fish();
    const streamers = paint.filter((mark) => {
      if (mark.composite !== 'source-over' || mark.alpha >= 0.9) return false;
      const points = mark.subpaths.flat();
      return points.some((p) => inside(hull, p)) && points.some((p) => !inside(hull, p));
    });
    /*
      ⚠️ **EIGHT PIXELS, IN UNITS OF THE SCREEN EVERY REPORT IN `reports/` WAS GIVEN ON** — 0027's *at
      least one assertion written in what the player experiences*. It is
      [0106](../docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s floor three times
      over: a mark hanging less than that off the outline is a fringe ON it rather than something
      coming off the animal, and at 42 units wide on a 1280×720 screen there is room to tell.
    */
    const aft = streamers.filter((mark) => overhang(hull, mark) >= 8);
    expect(
      aft.length,
      `the fish paints ${streamers.length} marks that cross its own outline and ${aft.length} of them hang 8px or ` +
        'more off it — a mark that stays inside is a stripe and one that never touches the hull is a cloud beside ' +
        'the animal, and neither is a wing that trails',
    ).toBeGreaterThanOrEqual(6);
    // Both sides, because a fish with one wing trailing is a fish that has lost one.
    for (const side of [-1, 1]) {
      const mine = aft.filter((mark) => mark.subpaths.flat().some(([, y]) => (y - size / 2) * side > size * 0.1));
      expect(mine.length, `${mine.length} of the ${aft.length} streamers are on the ${side < 0 ? 'near' : 'far'} side`).toBeGreaterThanOrEqual(3);
    }
    // And the longest of them streams a real distance, rather than six marks each just clearing the bar.
    const furthest = Math.max(...aft.map((mark) => overhang(hull, mark)));
    expect(furthest, `the longest trail hangs ${furthest.toFixed(1)}px off the hull`).toBeGreaterThanOrEqual(24);
  });

  it('and the astral light is BEHIND the animal, brightest ring first, so the falloff stacks outward', () => {
    /*
      ⚠️ **0277 SHIPPED THIS THE OTHER WAY ROUND ONCE AND IT BAKED AS TWO FLAT SLABS WITH A HARD EDGE.**
      `destination-over` puts each new fill further back than the last, so a halo drawn brightest-first
      has its dim rings behind its bright one and fades outward; drawn dimmest-first, the bright ring
      is hidden behind the dim one and what is left is a step. It is one string and one ordering, and
      `tests/paths.ts` could not see either until this decision recorded the composite mode.
    */
    const { size, hull, paint } = fish();
    const skirt = Math.max(...hull.subpaths.flat().map(([x]) => Math.abs(x - size / 2)));
    /*
      ⚠️ **A RING IS A FILL IN A FLAT INK AND A GLOW IS A GRADIENT, WHICH THE HARNESS ALREADY TELLS
      APART** — 0227 put `colour` on a pass for exactly this kind of question. The fish also hangs one
      soft light behind itself, in the tail's own notch; it is not part of the halo and asking it to be
      fainter than the ring before it is asking the wrong thing of it.
    */
    const rings = paint.filter(
      (mark) => mark.composite === 'destination-over' && mark.colour !== 'gradient' && reachOf(mark, size) > skirt,
    );
    expect(
      rings.length,
      'the fish draws no ring wider than itself behind its own hull, so every light it has is ON it and it has no aura',
    ).toBeGreaterThanOrEqual(3);
    rings.forEach((ring, i) => {
      if (i === 0) return;
      const inner = rings[i - 1]!;
      expect(
        ring.alpha,
        `halo ring ${i + 1} is laid at ${ring.alpha} over ring ${i} at ${inner.alpha} — each ring goes BEHIND the ` +
          'one before it, so a ring that is not fainter than its neighbour is a slab and the edge between them is hard',
      ).toBeLessThan(inner.alpha);
      expect(
        reachOf(ring, size),
        `halo ring ${i + 1} reaches ${reachOf(ring, size).toFixed(1)}px where ring ${i} reaches ${reachOf(inner, size).toFixed(1)}px`,
      ).toBeGreaterThan(reachOf(inner, size));
    });
  });
});

/**
 * ── THE FISH HAS A FACE — 0319 ─────────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0319-the-fish-has-a-face.md`. The second creature in the game to wear 0285's six
 * frames, and the first one that is not a chain's head — which is the test that type had to pass.
 *
 * ⚠️ **WHAT IS HELD IS THE TWO THINGS A FACE IS FOR, AND NEITHER IS ABOUT THE ART.** The mouth's
 * three silhouettes have to be **three**, ordered so the snap and the tell are opposite throws; and
 * the animal has to answer THE PILOT rather than a clock, so two different players get two different
 * fish out of the same fight. How pretty any of it is belongs in `tests/authored.ts`
 * ([0192](../docs/decisions/0192-a-guard-holds-an-invariant.md)).
 */
describe('0319 — the fish has a face', () => {
  const face = BOSSES.volans.face;

  /**
   * How much fish there is on a line drawn across the snout, in CSS pixels of a 1280×720 screen.
   *
   * ⚠️ **A SCAN LINE AND NOT THE WHOLE AREA, WHICH IS THE MEASUREMENT 0027 IS ABOUT.** The serpent's
   * jaw swings a quarter of its skull, so the flesh its outline encloses is a fair reading of how far
   * the mouth is open. A fish seen from above opens ACROSS: the mandibles splay outward as the notch
   * cuts inward, and the two nearly cancel — measured, the three whole-hull areas differ by under
   * half a percent, which is a number no player will ever see. **What a player sees is how much
   * animal is in front of the eyes**, and that is this line.
   */
  const snoutAt = (index: number, along: number): number => {
    const kind = SPRITE_KINDS[index]!;
    const size = SPRITE_EXTENT[kind] * viewOf(1280, 720).scale;
    const { pen, trace } = tracingPen();
    drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'nebula');
    const hull = trace.passes[0]!.subpaths[0]!;
    const at = size / 2 + along * size * 0.42;
    const crossings: number[] = [];
    for (let i = 0; i < hull.length; i++) {
      const [ax, ay] = hull[i]!;
      const [bx, by] = hull[(i + 1) % hull.length]!;
      if (ax <= at === bx <= at) continue;
      crossings.push(ay + ((at - ax) / (bx - ax)) * (by - ay));
    }
    crossings.sort((a, b) => a - b);
    let flesh = 0;
    for (let i = 0; i + 1 < crossings.length; i += 2) flesh += crossings[i + 1]! - crossings[i]!;
    return flesh;
  };

  it('THE ASKED-FOR ONE: the mouth has three silhouettes, and the snap and the tell are OPPOSITE throws of it', () => {
    /*
      ⚠️ **A GAPE THAT DOES NOT MEAN *A VOLLEY IS COMING* IS A LIE THE FIGHT TELLS ONCE**, which is
      0285's own sentence and is why this is an invariant and not taste. `boss9Shut` goes on when the
      ship crosses in front of the fish and costs nothing to miss; `boss9Gape` goes on in the steps
      before a volley leaves and does not. If the two read alike the tell is not a tell, and no
      redrawing of this head makes a snap that opens the mouth correct.
    */
    if (face === null) throw new Error('the fish has no faces');
    // 0.9 of the drawing radius: across the jaw, in front of the eyes, behind the very tip.
    const gape = snoutAt(face.gape, -0.9);
    const rest = snoutAt(face.rest, -0.9);
    const shut = snoutAt(face.shut, -0.9);
    expect(
      gape < rest && rest < shut,
      `the fish's snout carries ${gape.toFixed(1)}px of flesh agape, ${rest.toFixed(1)}px at rest and ` +
        `${shut.toFixed(1)}px shut, so the snap and the tell are not opposite throws of the same mouth`,
    ).toBe(true);
    /*
      ⚠️ **AND EACH THROW CLEARS 0106's FLOOR, BECAUSE *DIFFERENT* IS A CLAIM ABOUT PIXELS.** A mark
      thinner than 2.5px on this screen is not drawn at all, so two faces that differ by less than
      that differ in the file and nowhere else.
    */
    expect(rest - gape, `the gape takes ${(rest - gape).toFixed(1)}px off the snout`).toBeGreaterThanOrEqual(2.5);
    expect(shut - rest, `the snap packs ${(shut - rest).toFixed(1)}px onto it`).toBeGreaterThanOrEqual(2.5);
    // And the hurt twins pair with their own silhouettes, or a hit flashes a different animal — 0035.
    expect(snoutAt(face.gapeHit, -0.9)).toBeCloseTo(gape, 1);
    expect(snoutAt(face.shutHit, -0.9)).toBeCloseTo(shut, 1);
    // `up` and `down` move the PUPIL, so they are the resting silhouette and share its hurt twin.
    expect(snoutAt(face.up, -0.9)).toBeCloseTo(rest, 1);
    expect(snoutAt(face.down, -0.9)).toBeCloseTo(rest, 1);
  });

  it('and it answers the PILOT and not a clock: one who cuts across it is snapped at, one who holds a lane is only watched', () => {
    /*
      ⚠️ **THIS IS 0282's TEST AND NOT AN ANIMATION CHECK.** *The mouth moves* is satisfied by a jaw
      worked on a timer, which is the same animation for every player and every run. What is measured
      is that two different pilots get two different fish: one who cuts across the head is bitten at,
      one who holds a lane never sees the snap and is watched instead. A boss on a clock cannot pass
      this at any amount of art — and the serpent's own version of this claim is
      `tests/serpent.test.ts`, which this deliberately mirrors rather than restates.
    */
    if (face === null) throw new Error('the fish has no faces');
    /**
     * Fly a pilot for four seconds beside the fish, and report every face it wore.
     *
     * ⚠️ **THE FIRST SECOND AND A HALF IS FLOWN AND NOT RECORDED.** A pilot has to reach the lane it
     * means to hold, and the trip there is itself a crossing — so a run recorded from the first step
     * reports a snap for every pilot, including the one whose whole point is not to cause one.
     */
    const flown = (fly: (step: number, world: ReturnType<typeof playableWorld>['world']) => number): Set<number> => {
      const { world, stick } = playableWorld(VOLANS_ONLY);
      const frame = new GameFrame(world);
      for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
        world.ship.health = world.shipRow.health;
        if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
        frame.step();
      }
      expect(world.bossPool.size, 'the fish never arrived').toBe(1);
      const worn = new Set<number>();
      for (let i = -90; i < 240; i++) {
        // The volley tell outranks the snap, so it is silenced: what is under test is the other one.
        world.bossPool.at(0).fireIn = 999;
        world.ship.health = world.shipRow.health;
        stick.across = fly(i, world);
        frame.step();
        if (i >= 0) worn.add(world.bossPool.at(0).spriteBase);
      }
      return worn;
    };

    /*
      ⚠️ **THE CROSSING PILOT FLIES FULL STICK AND REVERSES**, which is what a player dodging a boss
      does and is the only way to be sure the ship passes the head rather than drifting near it. The
      fish holds its own patrol across the lane while this happens, so the crossings are the two of
      them meeting rather than a number this test picked.
    */
    const crossing = flown((step) => (Math.floor((step + 90) / 40) % 2 === 0 ? 1 : -1));
    expect(
      crossing.has(face.shut),
      'a ship flown back and forth across the fish for four seconds was never snapped at — the mouth is not ' +
        'answering the player',
    ).toBe(true);
    /*
      ⚠️ **AND THE HOLDING PILOT SITS WHERE THE FISH IS NOT.** This is the half that fails if the jaw
      is on a timer, and it is the half 0285's report was about.
    */
    const holding = flown((_step, world) => {
      const gaze = world.ship.across - world.bossPool.at(0).across;
      return gaze > ACROSS_SPAN * 0.3 ? -1 : gaze < ACROSS_SPAN * 0.25 ? 1 : 0;
    });
    expect(
      holding.has(face.shut),
      'a ship that held its lane a third of the span away was snapped at anyway, so the jaw is on a clock and every ' +
        'player watches the same animal',
    ).toBe(false);
    /*
      ⚠️ **AND IT IS STILL WATCHED, WHICH IS WHY THIS IS NOT SIMPLY *NOTHING HAPPENED*.** A fish that
      wore one face for the whole four seconds would pass the line above and be exactly the wall the
      report named — and on THIS boss it matters most, because the fish is the one end boss that
      stalks onto the player's lane (0258) and so the one they spend the fight looking straight at.
    */
    expect(
      holding.has(face.up) || holding.has(face.down),
      'the fish never turned its eye on a ship parked off to one side of it, so nothing about it is watching',
    ).toBe(true);
  });

  it('and the GAPE is the volley’s own tell: every open mouth is followed by shots or by a horde, and the mouth is shut the rest of the time', () => {
    /*
      ⚠️ **THE HALF THE SERPENT'S SUITE NEVER ASKED, AND IT IS THE HALF THAT MAKES A TELL A TELL.** The
      guard above silences the gun to test the snap; this one lets it fire and asks the opposite
      question. A mouth that hangs open BETWEEN volleys is a mouth that means nothing when one comes —
      the fish would be *aggressively moving its mouth* and telling the player nothing, which is 0285's
      report answered in the letter and not in the substance.

      ⚠️ **AND IT IS MEASURED OFF THE SHOTS AND NOT OFF `fireIn`, WHICH THE FIRST DRAFT GOT WRONG.**
      `wearFace` gapes when `fireIn <= FACE_GAPE`, so a guard reading `fireIn` back asks whether the
      code agrees with itself and would stay green over any constant at all — the exact defect
      `docs/decisions/0027-measure-the-picture-not-the-model.md` names. What the PLAYER learns is *when
      that mouth opens, something comes out of it*, and what says so is the bullet pool.
    */
    if (face === null) throw new Error('the fish has no faces');
    const { world } = playableWorld(VOLANS_ONLY);
    const frame = new GameFrame(world);
    for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
      world.ship.health = world.shipRow.health;
      frame.step();
    }
    expect(world.bossPool.size, 'the fish never arrived').toBe(1);
    const gaped: number[] = [];
    const volleys: number[] = [];
    for (let i = 0; i < 900; i++) {
      world.ship.health = world.shipRow.health;
      const before = world.enemyShots.size;
      const standing = world.enemies.size;
      frame.step();
      if (world.bossPool.size === 0) break;
      // A VOLLEY is three or more at once: this boss throws five to seven, and an escort throws one.
      // And a horde leaving the mouth is a thing that came out of it too — 0373: the jaw opens for a
      // spit on the escort's clock, and what the player learns is the same sentence.
      if (world.enemyShots.size - before >= 3 || world.enemies.size > standing) volleys.push(i);
      if (world.bossPool.at(0).spriteBase === face.gape) gaped.push(i);
    }
    expect(gaped.length, 'the fish never opened its mouth in fifteen seconds of fighting, so the tell never fires').toBeGreaterThan(0);
    expect(volleys.length, 'the fish never threw a volley, so there is nothing for a tell to be about').toBeGreaterThan(0);
    /*
      ⚠️ **THE LAST HALF-SECOND OF THE RUN IS NOT ASKED, BECAUSE ITS ANSWER HAS NOT HAPPENED YET.** The
      first draft counted the thirteen steps at the end of the window as orphans: the mouth was open
      and correct, and the volley it was telling the player about landed seven steps after the fixture
      stopped watching. A guard that reddens because it stopped looking is measuring its own window.
    */
    const watched = gaped.filter((at) => at <= 900 - 25);
    const orphan = watched.filter((at) => !volleys.some((shot) => shot >= at && shot - at <= 25));
    expect(
      orphan.length,
      `${orphan.length} of ${watched.length} steps with the mouth open were not followed by a volley within ` +
        'half a second, so the fish opens its mouth for nothing',
    ).toBe(0);
    /*
      ⚠️ **AND THE MOUTH IS SHUT FOR MOST OF THE FIGHT, WHICH IS THE OTHER HALF OF BEING A TELL.** A
      face worn nearly always carries no information, however well it is drawn: what the player has to
      be able to read is the CHANGE.
    */
    const share = gaped.length / 900;
    expect(share, `the fish is agape for ${(share * 100).toFixed(0)}% of the fight`).toBeLessThan(0.4);
  });
});

/**
 * ── THE FISH KINDLES — 0320 ────────────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0320-the-fish-kindles.md`. Asked: *"We need the boss to change/morph between
 * phases."* [0305](../docs/decisions/0305-the-serpent-darkens.md) answered that sentence for the
 * serpent with grown horns and a dark aura; this is the same sentence in the fish's own terms, and
 * the fish is a creature of the Ember Nebula.
 *
 * ⚠️ **WHAT IS HELD IS THAT THE CHANGE HAPPENS, THAT IT HAPPENS IN STAGES, AND THAT IT IS STILL THE
 * SAME ANIMAL TO DODGE.** How pretty the fire is belongs in `tests/authored.ts`
 * ([0192](../docs/decisions/0192-a-guard-holds-an-invariant.md)); that a player who has learned where
 * this hull ends still knows after it morphs does not.
 */
describe('0320 — the fish kindles', () => {
  /** The fish on station, with its health where the caller puts it. */
  function standing(): ReturnType<typeof playableWorld>['world'] & { step: (at: number) => void } {
    const { world } = playableWorld(VOLANS_ONLY);
    const frame = new GameFrame(world);
    for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
      world.ship.health = world.shipRow.health;
      frame.step();
    }
    expect(world.bossPool.size, 'the fish never arrived').toBe(1);
    /*
      ⚠️ **THE HEALTH IS WALKED DOWN RATHER THAN SHOT OFF, AND THAT IS THE FIXTURE'S WHOLE POINT.** What
      is under test is *does the look change with the PHASE*, so the phase is the thing that has to
      move; a fixture that fought the boss honestly would take minutes and would also be measuring the
      player's weapon rather than the boss's ladder.
    */
    return Object.assign(world, {
      step: (at: number): void => {
        world.bossPool.at(0).health = Math.max(1, world.bossFullHealth * at);
        world.ship.health = world.shipRow.health;
        frame.step();
      },
    });
  }

  it('THE ASKED-FOR ONE: it is drawn three different ways down its own health bar, and it never goes back', () => {
    /*
      ⚠️ **THREE, AND IN ORDER.** A boss that changes once is a boss with a second costume; a boss that
      changes back is a boss on a clock. What the ask wanted is an ESCALATION the picture keeps saying —
      0036's own complaint, which 0111 answered for the burst and 0305 answered for the serpent: a burst
      says the phase changed once, and fire says it for as long as the phase lasts.

      ⚠️ **AND A *LOOK* IS THE PAIR AND NOT THE FACE.** The first stage of this morph changes only what
      burns AROUND the animal, so a guard that watched `spriteBase` alone would see two states and call
      the middle one missing. What the player sees is the body and the fire together.
    */
    const world = standing();
    const seen: string[] = [];
    for (let i = 0; i <= 40; i++) {
      world.step(1 - i / 40);
      if (world.bossPool.size === 0) break;
      const boss = world.bossPool.at(0);
      // A flame is an ember frame; the tail lives in the same layer since 0374 and is not fire.
      let burning = 'cold';
      for (let k = 0; k < world.bossAura.size; k++) if (SPRITE_KINDS[world.bossAura.at(k).sprite]!.startsWith('volansEmber')) burning = SPRITE_KINDS[world.bossAura.at(k).sprite]!;
      const body = SPRITE_KINDS[boss.spriteBase]!.startsWith('boss9Barbed') ? 'grown' : 'calm';
      // The ember cycles six frames, so what identifies a LOOK is that it is burning rather than which.
      const worn = `${body}/${burning === 'cold' ? 'cold' : 'lit'}`;
      if (seen[seen.length - 1] !== worn) seen.push(worn);
    }
    expect(
      seen.join(' → '),
      `the fish was drawn ${seen.length} ways down its bar: ${seen.join(' → ')}`,
    ).toBe('calm/cold → calm/lit → grown/lit');
  });

  it('and the fire is OFF for the first half, in the fish’s own inks and never the serpent’s', () => {
    /*
      ⚠️ **OFF FIRST IS HALF THE CLAIM AND IT IS THE HALF THAT FAILS QUIETLY.** An aura authored on every
      phase is a boss that is always burning, which says nothing about how hurt it is — the wallpaper
      0317 spent a whole decision taking out of the adds. The fish opens cold, and it catches at the
      rung where it starts throwing flame rather than at a rung near it.
    */
    const world = standing();
    const burning = (at: number): boolean => {
      world.step(at);
      // A flame is an ember frame; the tail lives in the same layer since 0374 and is not fire.
      for (let k = 0; k < world.bossAura.size; k++) if (SPRITE_KINDS[world.bossAura.at(k).sprite]!.startsWith('volansEmber')) return true;
      return false;
    };
    expect(burning(0.95), 'the fish is already on fire at full health, so the fire says nothing about the fight').toBe(false);
    expect(burning(0.8), 'the fish is burning in its second phase, which is before it throws any flame').toBe(false);
    expect(burning(0.45), 'the fish is not burning at the phase where its shot becomes FLAME').toBe(true);
    expect(burning(0.1), 'the fish is not burning at its last phase').toBe(true);
    /*
      ⚠️ **AND THE FRAMES ARE ITS OWN** — 0282. Sharing the serpent's would make two animals in two
      levels burn with one flame, and it is the kind of sharing nobody sees until somebody changes the
      serpent's aura and the fish's changes with it.
    */
    const full = BOSSES.volans.health;
    const serpent = SPRITE_KINDS.filter((k) => k.startsWith('serpentAura') || k.startsWith('serpentStorm'));
    for (const at of [0.45, 0.1]) {
      const aura = phaseFor(BOSSES.volans, full * at, full).look?.aura;
      expect(aura, `the phase at ${at} of the bar authors no aura`).toBeTruthy();
      for (const frame of aura!.frames) {
        expect(serpent.includes(SPRITE_KINDS[frame]!), `the fish burns with ${SPRITE_KINDS[frame]}, which is the serpent's fire`).toBe(false);
      }
    }
  });

  it('and the grown body is the same animal to DODGE: it rose aft, and the edge a player flies into never moved', () => {
    /*
      ⚠️ **A BOSS THAT GREW ITS OWN HURTBOX AT A HEALTH THRESHOLD WOULD TEACH THE PLAYER SOMETHING AND
      THEN TAKE IT BACK.** Four phases of learning where 42 units of fish ends, and then it ends
      somewhere else. So what rose on this one is FIN, drawn into the quarter behind each wing that was
      already inside the tile, and the leading edge has not moved by a pixel.
    */
    const face = BOSSES.volans.face;
    const ablaze = phaseFor(BOSSES.volans, BOSSES.volans.health * 0.1, BOSSES.volans.health).look;
    if (face === null || ablaze === null) throw new Error('the fish has no kindled look');
    expect(SPRITE_EXTENT[SPRITE_KINDS[ablaze.face.rest]!], 'the kindled fish is drawn in a different box').toBe(
      SPRITE_EXTENT[SPRITE_KINDS[face.rest]!],
    );
    /** One face's outline, in fractions of the drawing radius. */
    const hullOf = (index: number): readonly (readonly [number, number])[] => {
      const kind = SPRITE_KINDS[index]!;
      const size = SPRITE_EXTENT[kind] * viewOf(1280, 720).scale;
      const { pen, trace } = tracingPen();
      drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'nebula');
      return trace.passes[0]!.subpaths[0]!.map(
        ([x, y]) => [(x - size / 2) / (size * 0.42), (y - size / 2) / (size * 0.42)] as const,
      );
    };
    const calm = hullOf(face.rest);
    const grown = hullOf(ablaze.face.rest);
    /** How far across the hull reaches on a line drawn at `at` along it. */
    const spanAt = (hull: readonly (readonly [number, number])[], at: number): number => {
      let widest = 0;
      for (let i = 0; i < hull.length; i++) {
        const [ax, ay] = hull[i]!;
        const [bx, by] = hull[(i + 1) % hull.length]!;
        if (ax <= at === bx <= at) continue;
        widest = Math.max(widest, Math.abs(ay + ((at - ax) / (bx - ax)) * (by - ay)));
      }
      return widest;
    };
    // Twenty stations from the snout to the wing tip: the whole of the edge a player meets head-on.
    for (let i = 0; i <= 20; i++) {
      const at = -0.99 + (i / 20) * 1.0;
      expect(
        spanAt(grown, at),
        `the kindled fish is a different width at ${at.toFixed(2)} along, so the part of it a player flies INTO moved`,
      ).toBeCloseTo(spanAt(calm, at), 2);
    }
    /*
      And something did rise: further aft than the fish it grew from, or nothing grew at all.

      ⚠️ **READ OFF THE TAIL SINCE 0374, BECAUSE THE BODY NO LONGER HAS ONE.** The caudal fin is a
      bitmap of its own on both bodies, so what the grown body reaches aft is the grown TAIL's reach;
      the two bodies end at the same stump by construction and the guard above holds it.
    */
    const tail = BOSSES.volans.tail;
    if (tail === null || ablaze.tail === undefined) throw new Error('the fish has no tail to have grown');
    const back = (index: number): number => Math.max(...hullOf(index).map(([x]) => x));
    expect(back(ablaze.tail.sprite), 'the kindled fish’s tail reaches no further aft than the calm one’s').toBeGreaterThan(back(tail.art.sprite));
  });
});

/**
 * ── THE SHOAL IS DRAWN — 0321 ──────────────────────────────────────────────────────────────────
 *
 * `docs/decisions/0321-the-shoal-is-drawn.md`. The last of the four items in *"a fully great graphics
 * pass over the fish and the shoal and kites."*
 *
 * ⚠️ **AND THE INTERESTING PART IS WHAT DOES NOT SURVIVE THE SCALE.** The fish is 42 units and these
 * are 6.5 and 5, so 0106's 2.5px floor is 0.13 and 0.17 of their drawing radii where it is 0.02 of
 * the fish's. Fin rays, a lateral line, a dust of motes: none of them can exist here. What lifts is
 * the halo — translucent, so no floor applies — and the form-shade.
 */
describe('0321 — the shoal is drawn', () => {
  /** One body's hull pass and everything painted over it, at the size it is drawn on a 1280×720 screen. */
  function drawn(kind: 'kite' | 'minnow'): ReturnType<typeof tracingPen>['trace'] {
    const size = SPRITE_EXTENT[kind] * viewOf(1280, 720).scale;
    const { pen, trace } = tracingPen();
    drawKind(pen, kind, PALETTES[DEFAULT_PALETTE], size, 'nebula');
    return trace;
  }

  it('THE ASKED-FOR ONE: neither add is FLAT — each has a light behind it and a shade across it', () => {
    /*
      ⚠️ **THE BRIEF'S WORD IS *FLAT*, AND FLAT IS A CLAIM ABOUT SHADING.** What made the kite flat was
      not its outline: it was four marks in four flat tones on a cut-out. The two things from the
      fish's pass that survive at a twentieth of its size are a halo BEHIND the hull and a gradient
      ACROSS it — one gives the animal a place to be and the other gives it a back and a belly, and
      neither has a width that 0106 can take away.
    */
    for (const kind of ['kite', 'minnow'] as const) {
      const { passes } = drawn(kind);
      const behind = passes.filter((p) => p.composite === 'destination-over');
      expect(behind.length, `the ${kind} has nothing behind its own hull, so it is a cut-out on the void`).toBeGreaterThanOrEqual(2);
      // Fainter and wider as it goes back, which is the halo's own claim on the fish — 0277, 0318.
      expect(behind[1]!.alpha, `the ${kind}'s outer ring is not fainter than its inner one`).toBeLessThan(behind[0]!.alpha);
      const shade = passes.filter((p, i) => i > 0 && p.colour === 'gradient' && p.composite === 'source-over');
      expect(shade.length, `the ${kind} carries no gradient at all, so every tone on it is flat`).toBeGreaterThanOrEqual(1);
    }
  });

  it('and the two are not drawn the SAME way: one outline is a polygon and the other is a curve', () => {
    /*
      ⚠️ **THIS IS A CLAIM ABOUT THE PAIR AND NOT ABOUT EITHER ONE, WHICH IS WHAT MAKES IT AN
      INVARIANT.** 0314 separates these two on exactly two channels — *straight-edged and symmetrical
      about its long axis* against *curved, with a top and a bottom* — because the pair a player has
      to tell apart at twenty pixels is *the one coming for me* and *the one going somewhere else*.
      0321 drew the kite as a curve, photographed it, and put it back: handsome, and it spent one of
      the two channels. Which of them is the polygon is a drawing decision; that they are not BOTH is
      not.

      ⚠️ **MEASURED AS SAMPLES PER CORNER, ON THE TRACE OF THE REAL DRAWING.** A polygon is its own
      corners and needs no samples between them; a curve is nearly all samples. It is the picture and
      not the code: what a player sees at this size is whether the edges are straight.
    */
    const detail = (kind: 'kite' | 'minnow'): number => {
      const hull = drawn(kind).passes[0]!.subpaths[0]!;
      let corners = 0;
      for (let i = 0; i < hull.length; i++) {
        const [ax, ay] = hull[(i - 1 + hull.length) % hull.length]!;
        const [bx, by] = hull[i]!;
        const [cx, cy] = hull[(i + 1) % hull.length]!;
        let turn = Math.abs(Math.atan2(cy - by, cx - bx) - Math.atan2(by - ay, bx - ax));
        if (turn > Math.PI) turn = Math.PI * 2 - turn;
        if (turn > 0.25) corners += 1;
      }
      return hull.length / Math.max(1, corners);
    };
    const kite = detail('kite');
    const minnow = detail('minnow');
    const apart = Math.max(kite, minnow) / Math.min(kite, minnow);
    expect(
      apart,
      `the kite's outline carries ${kite.toFixed(1)} samples a corner and the minnow's ${minnow.toFixed(1)} — ` +
        'two hulls drawn the same way are separated only by their outlines, and 0314 spends both channels on purpose',
    ).toBeGreaterThanOrEqual(8);
  });
});
