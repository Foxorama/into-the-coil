/**
 * A weapon is a kind, and a pickup cycles —
 * `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`.
 *
 * Three things landed together and each has its guard here: the AXIS (a gun and a tube are kinds
 * with their own ladders, faces and hulls, and the run remembers which is fitted), the CYCLE (a
 * pickup turns between the kinds of its ladder and hands over the face it was showing), and the ARC
 * (chain lightning, the second gun, resolved on the step it fires and stroked rather than blitted).
 *
 * ⚠️ **Nothing here asserts on a VALUE**, on `src/content/shots.ts`'s terms. What is held is the
 * relationships that must be true at any tuning: every rung changes something, a chain runs from the
 * nose through each body, a bolt ends on the thing it struck in pixels.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, MUZZLE_ALONG, cueOfFlight, wearHull, type World } from '../src/app/frame.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { WEAPONS, WEAPON_KINDS, type WeaponKind } from '../src/content/weapons.ts';
import { MISSILES, MISSILE_KINDS } from '../src/content/missiles.ts';
import { SHIPS, hullFor } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import {
  FASTEST_FIRE,
  MAX_HULL_TIER,
  PICKUPS,
  PICKUP_CYCLE_STEPS,
  PICKUP_KINDS,
  PICKUP_REPEATS,
  UPGRADE_TIERS,
  effectOf,
  faceOf,
  tiersOf,
  weaponFor,
  type Loadout,
  type UpgradeKind,
} from '../src/content/pickups.ts';
import { CUES, TWIN_KINDS } from '../src/content/cues.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { DEFAULT_DIFFICULTY } from '../src/state/slices/run.ts';
import { reset } from '../src/sim/entity.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { STROKES_PER_LINK } from '../src/render/scene.ts';
import { INK_OF } from '../src/render/bake.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;

/** A world with `kind` fitted at `tier` rungs, nothing else in the air, and the gun about to fire. */
function armed(kind: WeaponKind, tier: number): { world: World; frame: GameFrame; cues: string[] } {
  const built = playableWorld(NO_LEVEL);
  const carried: UpgradeKind[] = [];
  for (let i = 0; i < tier; i++) carried.push('weapon');
  built.world.weapon = weaponFor(built.world.shipRow, carried, kind);
  wearHull(built.world);
  built.world.fireIn = 1;
  built.world.missileIn = NEVER;
  return { world: built.world, frame: new GameFrame(built.world), cues: built.cues };
}

/** A tough body that never fires, `ahead` of the ship and `aside` across it, holding its place. */
function target(world: World, ahead: number, aside = 0): { health: number; along: number; across: number } {
  const enemy = world.enemies.spawn();
  if (enemy === null) throw new Error('the enemy pool is full');
  reset(enemy, world.ship.along + ahead, world.ship.across + aside, { ...ENEMIES.turret, health: 99 }, world.enemyKinds.turret);
  enemy.fireIn = NEVER;
  enemy.velAlong = 0;
  return enemy;
}

/** A surface that keeps every stroke and every blit, so the picture can be asked where a bolt went. */
class Recorder implements Surface {
  readonly blits: { sprite: number; x: number; y: number }[] = [];
  readonly bolts: number[][] = [];
  clear(): void {
    this.blits.length = 0;
    this.bolts.length = 0;
  }
  blit(sprite: number, x: number, y: number): void {
    this.blits.push({ sprite, x, y });
  }
  bolt(points: Float32Array, count: number): void {
    this.bolts.push(Array.from(points.subarray(0, count * 2)));
  }
}

describe('0233 — a weapon is a kind', () => {
  it('every gun and every tube has a ladder per rung, in whole steps that never slow, and every rung changes the ship', () => {
    /*
      `docs/game.md`'s rule — every rung is worth taking — held over EVERY kind rather than over the
      two ladders `tests/missiles.test.ts` grew up with. A kind added with a rung that buys nothing
      is a pickup the level handed out that did not land.
    */
    for (const kind of WEAPON_KINDS) {
      const row = WEAPONS[kind];
      for (const ladder of [row.fireEvery, row.barrels, row.links, row.weight]) {
        expect(ladder.length, `${kind} has a ladder that is not one rung per tier`).toBe(UPGRADE_TIERS + 1);
      }
      for (let tier = 0; tier <= UPGRADE_TIERS; tier++) {
        const steps = row.fireEvery[tier]!;
        expect(Number.isInteger(steps) && steps > 0, `${kind} tier ${tier} fires every ${steps} steps`).toBe(true);
        expect(steps, `${kind} tier ${tier} outruns the impact flash`).toBeGreaterThanOrEqual(FASTEST_FIRE);
        if (tier > 0) expect(steps, `${kind} tier ${tier} is slower than tier ${tier - 1}`).toBeLessThanOrEqual(row.fireEvery[tier - 1]!);
      }
      const carried: UpgradeKind[] = [];
      let previous = gunOf(weaponFor(SHIPS.proof, carried, kind));
      for (let tier = 1; tier <= UPGRADE_TIERS; tier++) {
        carried.push('weapon');
        const now = gunOf(weaponFor(SHIPS.proof, carried, kind));
        expect(now, `tier ${tier} of the ${kind} changed nothing about the gun`).not.toBe(previous);
        previous = now;
      }
      const past = gunOf(weaponFor(SHIPS.proof, [...carried, 'weapon'], kind));
      expect(past, `a ${kind} past tier ${UPGRADE_TIERS} still changed the gun`).toBe(previous);
    }
    for (const kind of MISSILE_KINDS) {
      const row = MISSILES[kind];
      expect(row.missileEvery.length, `${kind} has a cadence ladder that is not one rung per tier`).toBe(UPGRADE_TIERS + 1);
      expect(row.launchers.length, `${kind} has a tube ladder that is not one rung per tier`).toBe(UPGRADE_TIERS + 1);
      const carried: UpgradeKind[] = [];
      let previous = tubesOf(weaponFor(SHIPS.proof, carried, SHIPS.proof.weapon, kind));
      for (let tier = 1; tier <= UPGRADE_TIERS; tier++) {
        carried.push('missile');
        const now = tubesOf(weaponFor(SHIPS.proof, carried, SHIPS.proof.weapon, kind));
        expect(now, `tier ${tier} of the ${kind} missile changed nothing about the tubes`).not.toBe(previous);
        previous = now;
      }
    }
  });

  /**
   * The gun's half of a resolved weapon and the tubes' half, WITHOUT the hull tier.
   *
   * ⚠️ **The hull climbs every two rungs whatever the ladder did**, so a comparison of the whole
   * resolved weapon is vacuous on half the rungs — a rung that bought nothing but a bigger hull
   * would pass it. `npm run prove` found exactly that: the arc's last rung authored to change
   * nothing stayed green until this was written.
   */
  function gunOf(w: ReturnType<typeof weaponFor>): string {
    return JSON.stringify([w.fireEvery, w.shots, w.spread, w.damage, w.links, w.reach, w.flight]);
  }
  function tubesOf(w: ReturnType<typeof weaponFor>): string {
    return JSON.stringify([w.missileEvery, w.launchers, w.missileDamage, w.guidance]);
  }

  it('a link is worth one pulse at weight one, and the weight ladder stops at its last rung', () => {
    // A relationship, not a number — the same shape 0051 gave the missile.
    expect(SHOTS[WEAPONS.arc.shot].damage, 'a link is no longer one pulse').toBe(SHOTS[WEAPONS.pulse.shot].damage);
    const capped: UpgradeKind[] = [];
    for (let i = 0; i < UPGRADE_TIERS; i++) capped.push('weapon');
    const absurd = [...capped, ...capped, ...capped];
    expect(weaponFor(SHIPS.proof, absurd, 'arc'), 'the arc keeps climbing past its tiers').toEqual(weaponFor(SHIPS.proof, capped, 'arc'));
    expect(weaponFor(SHIPS.proof, capped, 'pulse').damage, 'the pulse gains damage without a ceiling again').toBe(
      weaponFor(SHIPS.proof, [], 'pulse').damage,
    );
  });

  it('THE FACES: the weapon pickup offers every gun in the guns’ own order, and a row’s sprite is its first face', () => {
    expect(PICKUPS.weapon.faces, 'the weapon pickup does not offer the guns in their table order').toEqual(
      WEAPON_KINDS.map((k) => WEAPONS[k].pickup),
    );
    expect(PICKUPS.missile.faces, 'the missile pickup does not offer the tubes in their table order').toEqual(
      MISSILE_KINDS.map((k) => MISSILES[k].pickup),
    );
    const everyFace: number[] = [];
    for (const kind of PICKUP_KINDS) {
      const row = PICKUPS[kind];
      expect(row.faces.length, `${kind} has no face`).toBeGreaterThan(0);
      expect(row.faces[0], `${kind}'s sprite is not its first face, so it changes on the step after it appears`).toBe(row.sprite);
      expect(new Set(row.faces).size, `${kind} shows one face twice`).toBe(row.faces.length);
      everyFace.push(...row.faces);
    }
    expect(new Set(everyFace).size, 'two pickups share a face and can only be told apart by ink').toBe(everyFace.length);
    WEAPON_KINDS.forEach((kind, face) => {
      expect(faceOf('weapon', face).label, `face ${face} of the weapon pickup is not named for its gun`).toBe(WEAPONS[kind].label);
    });
  });

  it('THE INKS: no two faces of one pickup share an ink', () => {
    /*
      0239, from the third play-test: *"the missile pickups need to be different colours… weapon
      pickups need different colouration for each weapon as well, visually distinct atm but the same
      colour makes it hard."* 0081's rule is that what the player must tell apart is told apart by
      more than ink; the faces differed in shape alone, and the ask says shape alone was not enough
      at pickup size. So ink is a channel too.

      ⚠️ **0239 also held the first face to the pickup ink, and 0240 took that clause out**: the
      fourth play-test asked for the pulse's and the missile's faces in the projectiles' orange, and
      the bubble (0236) is what says *pickup* on every face. What is held is only that the faces of
      one pickup are told apart by ink.
    */
    for (const kind of PICKUP_KINDS) {
      const row = PICKUPS[kind];
      const inks = row.faces.map((face) => INK_OF[SPRITE_KINDS[face]!]);
      expect(new Set(inks).size, `${kind} shows two faces in one ink (${inks.join(', ')})`).toBe(inks.length);
    }
  });

  it('THE HULLS: every gun has its own three-tier hull ladder, with hit twins and widening boxes, shared with no other gun', () => {
    const extentOf = (sprite: number): number => SPRITE_EXTENT[SPRITE_KINDS[sprite]!];
    const bases = new Set<number>();
    for (const kind of WEAPON_KINDS) {
      for (let tier = 0; tier <= MAX_HULL_TIER; tier++) {
        const hull = hullFor(kind, tier);
        expect(hull.hit, `the ${kind} hull at tier ${tier} flashes as itself`).not.toBe(hull.base);
        expect(extentOf(hull.hit), `the ${kind} hull at tier ${tier} changes size when hit`).toBe(extentOf(hull.base));
        if (tier > 0) {
          expect(extentOf(hull.base), `the ${kind} hull at tier ${tier} has no more room than tier ${tier - 1}`).toBeGreaterThan(
            extentOf(hullFor(kind, tier - 1).base),
          );
        }
        bases.add(hull.base);
      }
    }
    expect(bases.size, 'two guns share a hull at some tier, so switching guns is invisible there').toBe(
      WEAPON_KINDS.length * (MAX_HULL_TIER + 1),
    );
    expect(hullFor(SHIPS.proof.weapon, 0).base, 'the base ship is not drawn as its own row says').toBe(SHIPS.proof.sprite);
  });

  it('and the ship wears the gun it is carrying, in the frame that blits it', () => {
    const { world, frame } = armed('arc', 0);
    expect(world.ship.spriteBase, 'a ship carrying the arc wears the pulse hull').toBe(hullFor('arc', 0).base);
    const recorder = new Recorder();
    world.surface = recorder;
    frame.draw(0);
    expect(recorder.blits.some((b) => b.sprite === hullFor('arc', 0).base), 'the arc hull was never drawn').toBe(true);
    expect(recorder.blits.some((b) => b.sprite === SPRITE.ship), 'the pulse hull is still drawn under the arc').toBe(false);
  });

  it('THE SWITCH: another gun is an upgrade even when the fitted gun is full, and taking it keeps the count', () => {
    /*
      Asked for: *"if they collect a different weapon upgrade power up, they start from level one with
      that weapon upgrade."* — and then, played with the mid-bosses in: *"picking up a new
      weapon/missile type doesn't reset your power count."*
      `docs/decisions/0256-a-pickup-keeps-the-count.md` amends 0233: the switch is kept, the missile
      ladder is untouched, and the ladder carries across the switch and across a death — the
      reducer's three halves now, held here and in `tests/run.test.ts`.
    */
    const full: UpgradeKind[] = [];
    for (let i = 0; i < UPGRADE_TIERS; i++) full.push('weapon');
    const loadout: Loadout = { upgrades: full, weapon: 'pulse', missile: SHIPS.proof.missile };
    expect(effectOf('weapon', WEAPON_KINDS.indexOf('pulse'), loadout), 'a full pulse is still filed as an upgrade').toBe('special');
    expect(effectOf('weapon', WEAPON_KINDS.indexOf('arc'), loadout), 'the other gun is refused by the fitted gun’s cap').toBe('upgrade');

    let state: State = reduce(initialState, { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY });
    for (let i = 0; i < UPGRADE_TIERS - 1; i++) state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'weapon', kind: 'pulse' });
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'missile', kind: SHIPS.proof.missile });
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'missile', kind: SHIPS.proof.missile });
    state = reduce(state, { slice: 'run', type: 'upgraded', upgrade: 'weapon', kind: 'arc' });
    expect(state.run.weapon, 'the run did not switch guns').toBe('arc');
    expect(tiersOf(state.run.upgrades, 'weapon'), 'a switched gun lost the count').toBe(UPGRADE_TIERS);
    expect(tiersOf(state.run.upgrades, 'missile'), 'switching guns touched the missile ladder').toBe(2);
    const fitted = weaponFor(SHIPS.proof, state.run.upgrades, state.run.weapon, state.run.missile);
    expect(fitted.kind).toBe('arc');
    expect(fitted.links, 'the switched gun is not resolved at the rung the count says').toBe(WEAPONS.arc.links[UPGRADE_TIERS]);
    state = reduce(state, { slice: 'run', type: 'lifeLost' });
    expect(state.run.weapon, 'a death took the switched gun off the ship').toBe('arc');
    expect(tiersOf(state.run.upgrades, 'weapon'), 'a death cost more than a rung').toBe(UPGRADE_TIERS - 1);
  });
});

describe('0233 — a pickup cycles', () => {
  function oneWeaponPickup(): ReturnType<typeof playableWorld> {
    return playableWorld({
      waves: [],
      pickups: [{ at: 200, kind: 'weapon', lane: ACROSS_SPAN / 2 }],
      landmarks: [],
      bossAt: Number.POSITIVE_INFINITY,
      midBoss: null,
      sections: NO_SECTIONS,
      boss: 'sentinel',
      theme: 'approach',
    });
  }

  /** Every step the pickup spent on the field: what it was drawn as, and how far into the view it was. */
  function watch(
    built: ReturnType<typeof playableWorld>,
    hold?: number,
  ): { sprites: number[]; inView: number[]; waiting: boolean[] } {
    const frame = new GameFrame(built.world);
    const sprites: number[] = [];
    const inView: number[] = [];
    // Whether it was wandering on that step — before it arrives it is approaching, and once its wait
    // is over a pickup is MEANT to fall back through the view and leave (0064); neither leg is the wander.
    const waiting: boolean[] = [];
    // No ship: the wander comes down to where the fixture parks it, and a parked ship would take
    // the pickup a third of the way through the wait being measured. The pool is the gate (0079).
    built.world.shipPool.clear();
    while (built.world.pickups.size === 0) frame.step();
    const item = built.world.pickups.at(0);
    // A wait set by hand, for a guard about the wander's SHAPE rather than its length — so a wait
    // cut short reddens the guard about the wait and not this one too (0115: one break, one guard).
    if (hold !== undefined) item.holdFor = hold;
    for (let i = 0; i < 4000 && built.world.pickups.size > 0; i++) {
      sprites.push(item.sprite);
      inView.push(item.along - built.world.cameraAlong);
      // Arrived (the heading is set on arrival) and still on its wait — the approach is not the wander.
      waiting.push(item.holdFor > 0 && item.spin !== 0);
      frame.step();
    }
    expect(sprites.length, 'the pickup never left, so the wait was never measured').toBeLessThan(4000);
    return { sprites, inView, waiting };
  }

  it('THE CYCLE, in the real frame: a weapon pickup turns every PICKUP_CYCLE_STEPS, and is only ever drawn as one of its faces', () => {
    const { sprites } = watch(oneWeaponPickup());
    const turns: number[] = [];
    for (let i = 1; i < sprites.length; i++) {
      expect(PICKUPS.weapon.faces, 'the pickup was drawn as something that is not one of its faces').toContain(sprites[i]);
      if (sprites[i] !== sprites[i - 1]) turns.push(i);
    }
    expect(turns.length, 'the pickup never turned').toBeGreaterThan(1);
    for (let t = 1; t < turns.length; t++) {
      expect(turns[t]! - turns[t - 1]!, `turn ${t} came a different number of steps after the last`).toBe(PICKUP_CYCLE_STEPS);
    }
    // In the guns' own order, round and round.
    const faces = PICKUPS.weapon.faces;
    for (const at of turns) {
      const before = faces.indexOf(sprites[at - 1]!);
      expect(sprites[at], 'the faces did not turn in table order').toBe(faces[(before + 1) % faces.length]);
    }
  });

  it('and it waits for at least PICKUP_REPEATS full turns of its faces, so the player sees every gun twice', () => {
    // Turns DURING THE WAIT. A pickup keeps turning on its way back out of the view once the wait
    // is over, and those turns are ones the player has already decided against.
    const { sprites, waiting } = watch(oneWeaponPickup());
    let turns = 0;
    for (let i = 1; i < sprites.length; i++) if (sprites[i] !== sprites[i - 1] && waiting[i]) turns++;
    expect(turns, 'the pickup left before every gun had been shown twice').toBeGreaterThanOrEqual(
      PICKUP_REPEATS * PICKUPS.weapon.faces.length - 1,
    );
  });

  it('and it wanders the whole box while it waits, turning at the back wall rather than leaving through it', () => {
    /*
      Asked for: *"bounce off all the screen walls."* The walls are the player's box (0100), so the
      pickup comes at least to the back of it, turns, and is never behind it — where the ship could
      not follow.
    */
    // Held long enough to cross the box and back twice, whatever the wait is tuned to.
    const { inView, waiting } = watch(oneWeaponPickup(), 3000);
    let low = Infinity;
    let lowAt = 0;
    for (let i = 0; i < inView.length; i++) {
      if (!waiting[i]) continue;
      if (inView[i]! < low) {
        low = inView[i]!;
        lowAt = i;
      }
    }
    expect(low, `the pickup came no nearer than ${low.toFixed(1)}, so it never reached the back wall`).toBeLessThanOrEqual(
      PLAYER_ALONG_MARGIN + ACROSS_SPAN / 10,
    );
    expect(low, `the pickup wandered to ${low.toFixed(1)}, behind the back of the box`).toBeGreaterThanOrEqual(
      PLAYER_ALONG_MARGIN - ACROSS_SPAN / 20,
    );
    let after = -Infinity;
    for (let i = lowAt; i < inView.length; i++) if (waiting[i]) after = Math.max(after, inView[i]!);
    expect(after - low, 'the pickup reached the back wall and never turned').toBeGreaterThan(ACROSS_SPAN / 5);
    // And the wait began at the FRONT wall — a wander that starts in the middle of the screen
    // spends the near half of the box on nothing.
    let high = -Infinity;
    for (let i = 0; i < inView.length; i++) if (waiting[i]) high = Math.max(high, inView[i]!);
    expect(high, `the wait began at ${high.toFixed(1)}, well inside the box`).toBeGreaterThanOrEqual(PLAYER_LEAD - ACROSS_SPAN / 5);
  });

  it('and hands over the face it was drawn as on the step it was taken, never the row', () => {
    /*
      ⚠️ **THE HARDEST THING 0052 HAD TO GET RIGHT, and the whole reason `Collected` logs a face.**
      A pickup drawn as one gun and collected as another is the failure the player reads as *the
      game took my choice away*. Driven through the real frame: the ship flies into the pickup on a
      step it is showing the arc, and the shell is handed the arc.
    */
    const built = oneWeaponPickup();
    const frame = new GameFrame(built.world);
    built.world.fireIn = NEVER;
    while (built.world.pickups.size === 0) frame.step();
    const item = built.world.pickups.at(0);
    const wanted = WEAPONS.arc.pickup;
    let steps = 0;
    while (built.world.pickups.size > 0 && steps < 4000) {
      if (item.sprite === wanted && item.along - built.world.cameraAlong < PLAYER_LEAD) {
        built.world.ship.across = item.across;
        built.world.ship.along = item.along;
      }
      frame.step();
      steps++;
    }
    expect(built.taken, 'the pickup was never taken').toEqual(['weapon']);
    expect(built.faces, 'the shell was handed a face other than the one drawn').toEqual([WEAPON_KINDS.indexOf('arc')]);
  });
});

describe('0233 — the arc is chain lightning', () => {
  it('THE CHAIN: a volley lands on the nearest bodies in reach, one link each, from the nose through each body in turn', () => {
    const { world, frame, cues } = armed('arc', 2);
    const links = world.weapon.links;
    expect(links, 'the fixture has no chain to test').toBeGreaterThanOrEqual(3);
    const near = [target(world, 20, 0), target(world, 32, 14), target(world, 44, -10)];
    const far = target(world, near[2]!.along - world.ship.along + world.weapon.reach + 40, 0);
    const nose = { along: world.ship.along + MUZZLE_ALONG, across: world.ship.across };
    frame.step();
    for (const body of near) expect(body.health, 'a body in reach was not struck').toBe(99 - world.weapon.damage);
    expect(far.health, 'a body beyond the chain’s reach was struck').toBe(99);
    expect(world.bolts.size, 'a link is missing from the picture').toBe(3);
    // Every link rides the camera by the same step, so the chain is compared after that step's scroll.
    const scrolled = world.scrollPerStep;
    const first = world.bolts.at(0);
    expect(first.along + first.fromAlong, 'the first link does not leave the nose').toBeCloseTo(nose.along + scrolled, 3);
    expect(first.across + first.fromAcross).toBeCloseTo(nose.across, 3);
    for (let i = 1; i < world.bolts.size; i++) {
      const link = world.bolts.at(i);
      const last = world.bolts.at(i - 1);
      expect(link.along + link.fromAlong, `link ${i} does not start where link ${i - 1} landed`).toBeCloseTo(last.along, 3);
      expect(link.across + link.fromAcross, `link ${i} does not start where link ${i - 1} landed`).toBeCloseTo(last.across, 3);
    }
    expect(cues, 'a volley that landed did not sound both its cues').toEqual(expect.arrayContaining(['arc', 'zap']));
  });

  it('and beyond its reach it fires dry: one link into nothing, the discharge without the strike', () => {
    const { world, frame, cues } = armed('arc', 2);
    const far = target(world, world.weapon.reach + 40, 0);
    frame.step();
    expect(far.health, 'a body beyond reach was struck').toBe(99);
    expect(world.bolts.size, 'a dry volley is not one link').toBe(1);
    expect(cues, 'a dry volley did not sound the discharge').toContain('arc');
    expect(cues, 'a dry volley sounded a strike that did not happen').not.toContain('zap');
  });

  it('0257 — THE SCREEN: from the front of the box, at every tier, a body whose hull is on the screen is struck and one crossing the leading edge is not', () => {
    /*
      `docs/decisions/0257-the-arc-lands-on-the-screen.md`. Reported from the alpha play: *"chain
      lightning jumps too far, enemies don't even get a chance to get on screen."* The ship is put
      at the very front of its box, where the cap's reach runs ninety units past the view; a body a
      unit inside the leading edge, hull and all, is struck, and a body whose hull crosses it is
      not — in the player's own units, the screen's edge, at every rung of the ladder.
    */
    for (let tier = 0; tier <= UPGRADE_TIERS; tier++) {
      const { world, frame } = armed('arc', tier);
      world.ship.along = world.cameraAlong + PLAYER_LEAD;
      world.ship.prevAlong = world.ship.along;
      const edge = world.cameraAlong + world.view.alongSpan;
      const radius = ENEMIES.turret.radius;
      const inside = target(world, edge - radius - 1 - world.ship.along, 6);
      const crossing = target(world, edge - radius + 2 - world.ship.along, -6);
      expect(edge - world.ship.along, 'the fixture put the ship somewhere the reach does not cross the edge').toBeLessThan(world.weapon.reach);
      frame.step();
      expect(inside.health, `at tier ${tier} a body whose whole hull is on the screen was not struck`).toBe(99 - world.weapon.damage);
      expect(crossing.health, `at tier ${tier} a body still crossing the leading edge was struck`).toBe(99);
    }
  });

  it('ON A BOSS ALONE, every link lands on the boss, each at a different point inside it', () => {
    /*
      Asked for: *"for single target bosses it needs to arc and bounce and jump around to hit
      different parts of the boss."* A boss is one body with one radius, so the parts are a picture:
      each link after the first lands somewhere else inside the disc, and each is a strike.
    */
    const { world, frame } = armed('arc', 2);
    const boss = world.bossPool.spawn();
    if (boss === null) throw new Error('no boss pool');
    reset(boss, world.ship.along + 30, world.ship.across, BOSSES.sentinel);
    boss.health = 500;
    world.bossFullHealth = 500;
    boss.fireIn = NEVER;
    frame.step();
    expect(boss.health, 'the boss did not take one strike per link').toBe(500 - world.weapon.links * world.weapon.damage);
    expect(world.bolts.size).toBe(world.weapon.links);
    const ends: [number, number][] = [];
    for (let i = 0; i < world.bolts.size; i++) {
      const link = world.bolts.at(i);
      const dAlong = link.along - boss.along;
      const dAcross = link.across - boss.across;
      expect(Math.sqrt(dAlong * dAlong + dAcross * dAcross), `link ${i} landed outside the boss`).toBeLessThanOrEqual(boss.radius);
      ends.push([link.along, link.across]);
    }
    for (let i = 1; i < ends.length; i++) {
      for (let j = i + 1; j < ends.length; j++) {
        const gap = Math.hypot(ends[i]![0] - ends[j]![0], ends[i]![1] - ends[j]![1]);
        expect(gap, `links ${i} and ${j} landed on the same point of the boss`).toBeGreaterThan(1);
      }
    }
  });

  it('THE PICTURE, in pixels: the stroked bolt leaves the nose and ends on the body it struck', () => {
    /*
      `docs/decisions/0027-measure-the-picture-not-the-model.md`: at least one assertion in the
      units the player experiences. The chain above is world units the model chose; this is what the
      surface was asked to stroke, against where it was asked to blit the body.
    */
    const { world, frame } = armed('arc', 1);
    const body = target(world, 24, 6);
    const recorder = new Recorder();
    world.surface = recorder;
    frame.step();
    frame.draw(1);
    const cameraAlong = world.cameraAlong;
    const at = (along: number, across: number): [number, number] => [
      screenX(world.view, along - cameraAlong, across),
      screenY(world.view, along - cameraAlong, across),
    ];
    const nose = at(world.ship.along + MUZZLE_ALONG, world.ship.across);
    // Flashing, because it was just struck (0035) — so it is drawn as its hurt twin.
    const struck = recorder.blits.find((b) => b.sprite === ENEMIES.turret.spriteHit);
    expect(struck, 'the body was never blitted').toBeDefined();
    const px = world.view.scale;
    const near = (a: number, b: number, c: number, d: number): boolean => Math.hypot(a - c, b - d) < 1.5 * px;
    const main = recorder.bolts.find((p) => near(p[0]!, p[1]!, nose[0], nose[1]));
    expect(main, `no stroke leaves the nose at ${nose.map((n) => n.toFixed(0)).join(',')}`).toBeDefined();
    const endX = main![main!.length - 2]!;
    const endY = main![main!.length - 1]!;
    expect(near(endX, endY, struck!.x, struck!.y), `the bolt ends ${Math.hypot(endX - struck!.x, endY - struck!.y).toFixed(1)}px from the body`).toBe(true);
    expect(body.health).toBe(99 - world.weapon.damage);
  });

  it('and at the cap the bolt pool never fills, and the picture is counted per link', () => {
    const { world, frame } = armed('arc', UPGRADE_TIERS);
    world.fireIn = world.weapon.fireEvery;
    let peak = 0;
    let strokes = 0;
    let checked = 0;
    const counting: Surface = {
      clear(): void {},
      blit(): void {},
      bolt(): void {
        strokes++;
      },
    };
    world.surface = counting;
    for (let i = 0; i < 900; i++) {
      // A lane that is never empty: six bodies in reach, put back the moment the arc takes one.
      while (world.enemies.size < 6) target(world, 15 + world.enemies.size * 7, (world.enemies.size - 3) * 6);
      frame.step();
      if (world.bolts.size > peak) peak = world.bolts.size;
      if (world.bolts.size > 0 && checked < 20) {
        strokes = 0;
        frame.draw(0.5);
        expect(strokes, 'a link is not stroked as its stated number of bolt calls').toBe(world.bolts.size * STROKES_PER_LINK);
        checked++;
      }
    }
    expect(peak, 'the arc never fired, so this measured nothing').toBeGreaterThan(0);
    expect(peak, `the cap puts ${peak} links in flight against a pool of ${CAPACITY.bolts}`).toBeLessThan(CAPACITY.bolts);
    expect(checked, 'the picture was never counted').toBeGreaterThan(0);
  });

  it('THE CUES: the arc discharges as its own cue and lands as its own, both in the table with twins', () => {
    expect(cueOfFlight('chain'), 'the arc fires with the pulse’s cue').toBe('arc');
    expect(cueOfFlight('straight')).toBe('pulse');
    expect(TWIN_KINDS, 'the discharge has no picture to be the twin of').toContain(CUES.arc.twin);
    expect(TWIN_KINDS).toContain(CUES.zap.twin);
    expect(CUES.arc.twin, 'the discharge claims a picture that is not the bolt').toBe('bolt-appears');
  });
});
