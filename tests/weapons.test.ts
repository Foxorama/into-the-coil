/**
 * A weapon is a kind, and a pickup cycles —
 * `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`.
 *
 * Three things landed together and each has its guard here: the AXIS (a gun and a tube are kinds
 * with their own rows and faces), the CYCLE (a pickup turns between its faces and hands over the face
 * it was showing), and the ARC (chain lightning, resolved on the step it fires and stroked rather than
 * blitted).
 *
 * ⚠️ **SINCE 0441 A GUN IS ITS SHIP'S AND HAS NO LADDER** —
 * `docs/decisions/0441-a-pilot-flies-their-own-ship.md`. The weapon pickup is the bomb pickup, a hull
 * is a ship's at each tube stage, and every gun here is flown in the ship it is keyed to. The guards
 * whose subject was a gun's ladder are gone, each with a note where it stood.
 *
 * ⚠️ **Nothing here asserts on a VALUE**, on `src/content/shots.ts`'s terms. What is held is the
 * relationships that must be true at any tuning: every tube rung changes something, a chain runs from
 * the nose through each body, a bolt ends on the thing it struck in pixels.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame, cueOfFlight, wearHull, type World } from '../src/app/frame.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { WEAPONS, WEAPON_KINDS, type WeaponKind } from '../src/content/weapons.ts';
import { MISSILES, MISSILE_KINDS } from '../src/content/missiles.ts';
import { SHIPS, SHIP_KINDS, hullFor, shipCarrying } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS } from '../src/content/specials.ts';
import { SHIP_BOX, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import {
  BOMB_KINDS,
  FASTEST_FIRE,
  PICKUPS,
  PICKUP_CYCLE_STEPS,
  PICKUP_KINDS,
  PICKUP_REPEATS,
  UPGRADE_TIERS,
  faceOf,
  weaponFor,
  type UpgradeKind,
} from '../src/content/pickups.ts';
import { CUES, TWIN_KINDS } from '../src/content/cues.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { BOSSES, gunWeightOn } from '../src/content/bosses.ts';
import { reset } from '../src/sim/entity.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { STROKES_PER_LINK } from '../src/render/scene.ts';
import { INK_OF } from '../src/render/bake.ts';
import { NO_LEVEL, NO_SECTIONS, playableWorld } from './world.ts';

const NEVER = Number.MAX_SAFE_INTEGER;

/**
 * A world flying the ship `kind` is keyed to (0441), nothing else in the air, and the gun about to
 * fire. The gun has no rungs since 0441: it is what its ladder's cap was.
 */
function armed(kind: WeaponKind): { world: World; frame: GameFrame; cues: string[] } {
  const built = playableWorld(NO_LEVEL);
  built.world.shipRow = SHIPS[shipCarrying(kind)];
  built.world.weapon = weaponFor(built.world.shipRow, []);
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
  /*
    ⚠️ **THE GUN'S HALF OF `every rung changes the ship` WAS HERE** — a ladder per field, one rung
    per tier, in whole steps that never slow, each rung changing the gun, and the clamp past the cap.
    `docs/decisions/0441-a-pilot-flies-their-own-ship.md` deleted every gun's ladder: each field is
    the value its last rung was. What survives for a gun is what was true at ANY rung, held below on
    the one value; the tubes still climb and keep the whole of it.
  */
  it('every gun fires in whole steps no faster than the flash, and every tube has a ladder per rung that changes the tubes', () => {
    for (const kind of WEAPON_KINDS) {
      const row = WEAPONS[kind];
      /*
        0302 — a chain SPENDS itself, and a weapon that does not chain has nothing to spend. A
        `falloff` of 1 or more is the search-the-whole-screen chain
        `docs/decisions/0297-a-reach-is-measured-on-both-axes.md` was reported for, and one of 0 on a
        chaining weapon is a chain of one link wearing a ladder of three.
      */
      expect(
        row.falloff > 0 && row.falloff < 1,
        `${kind} authors a falloff of ${row.falloff} and ${row.flight === 'chain' ? 'chains' : 'does not chain'}`,
      ).toBe(row.flight === 'chain');
      const steps = row.fireEvery;
      expect(Number.isInteger(steps) && steps > 0, `${kind} fires every ${steps} steps`).toBe(true);
      expect(steps, `${kind} outruns the impact flash`).toBeGreaterThanOrEqual(FASTEST_FIRE);
      // And the gun a ship resolves to is its row's, whatever tubes it carries — 0441.
      const ship = SHIPS[shipCarrying(kind)];
      expect(weaponFor(ship, []).kind, `the ${kind}'s ship does not fly the ${kind}`).toBe(kind);
    }
    for (const kind of MISSILE_KINDS) {
      const row = MISSILES[kind];
      expect(row.missileEvery.length, `${kind} has a cadence ladder that is not one rung per tier`).toBe(UPGRADE_TIERS + 1);
      expect(row.launchers.length, `${kind} has a tube ladder that is not one rung per tier`).toBe(UPGRADE_TIERS + 1);
      const carried: UpgradeKind[] = [];
      let previous = tubesOf(weaponFor(SHIPS.fighter, carried, kind));
      for (let tier = 1; tier <= UPGRADE_TIERS; tier++) {
        carried.push('missile');
        const now = tubesOf(weaponFor(SHIPS.fighter, carried, kind));
        expect(now, `tier ${tier} of the ${kind} missile changed nothing about the tubes`).not.toBe(previous);
        previous = now;
      }
    }
  });

  /** The tubes' half of a resolved weapon. */
  function tubesOf(w: ReturnType<typeof weaponFor>): string {
    return JSON.stringify([w.missileEvery, w.launchers, w.missileDamage, w.guidance]);
  }

  /*
    ⚠️ **`the weight ladder stops at its last rung` WAS THE SECOND HALF OF THIS** — the arc clamped
    past its tiers and the pulse never gaining damage from its own. Both were about the gun's ladder,
    which 0441 deleted; the tubes' clamp is `tests/missiles.test.ts`'s *THE FLOORS*.
  */
  it('a link is worth one pulse at weight one', () => {
    // A relationship, not a number — the same shape 0051 gave the missile.
    expect(SHOTS[WEAPONS.arc.shot].damage, 'a link is no longer one pulse').toBe(SHOTS[WEAPONS.pulse.shot].damage);
  });

  it('THE FACES: the bomb pickup offers every gun special in the specials’ own order, and a row’s sprite is its first face', () => {
    /*
      ⚠️ **THE BOMB PICKUP, AND IT WAS THE WEAPON PICKUP OFFERING THE GUNS — 0441.** *"The pickup will
      still cycle, but a player can pick up any type and get a bomb of that type."* Its faces are the
      gun-side specials, and every gun's own special is one of them, so any ship can buy any gun's.
    */
    expect(PICKUPS.bomb.faces, 'the bomb pickup does not offer the gun specials in their table order').toEqual(
      BOMB_KINDS.map((k) => SPECIALS[k].face),
    );
    for (const gun of WEAPON_KINDS) {
      // A ward special is the shield pickup's face rather than the bomb's — 0447; `tests/surge.test.ts`.
      if (SPECIALS[WEAPONS[gun].special].side === 'ward') continue;
      expect(BOMB_KINDS, `the ${gun}'s own special is not a face of the bomb pickup`).toContain(WEAPONS[gun].special);
    }
    expect(PICKUPS.missile.faces, 'the missile pickup does not offer the tubes in their table order').toEqual(
      MISSILE_KINDS.map((k) => MISSILES[k].pickup),
    );
    /*
      ⚠️ **EXCEPT A ROW'S `bare`, WHICH IS THE SAME OFFER WITHOUT ITS FIRST FACE — 0447.** The ward
      pickup is the shield pickup's void and nova, and it is only ever thrown where the shield would
      have been and the tier can wear no shell — so the two are never on one field, and a ward face
      that differed from the shield's would be one special drawn two ways.
    */
    const everyFace: number[] = [];
    const bares = new Set(PICKUP_KINDS.map((kind) => PICKUPS[kind].bare).filter((bare) => bare !== null));
    for (const kind of PICKUP_KINDS) {
      const row = PICKUPS[kind];
      expect(row.faces.length, `${kind} has no face`).toBeGreaterThan(0);
      expect(row.faces[0], `${kind}'s sprite is not its first face, so it changes on the step after it appears`).toBe(row.sprite);
      expect(new Set(row.faces).size, `${kind} shows one face twice`).toBe(row.faces.length);
      if (bares.has(kind)) continue;
      everyFace.push(...row.faces);
    }
    for (const kind of PICKUP_KINDS) {
      const bare = PICKUPS[kind].bare;
      if (bare === null) continue;
      expect(PICKUPS[kind].faces.slice(1), `${bare} is not ${kind} without its first face`).toEqual(PICKUPS[bare].faces);
    }
    expect(new Set(everyFace).size, 'two pickups share a face and can only be told apart by ink').toBe(everyFace.length);
    BOMB_KINDS.forEach((kind, face) => {
      expect(faceOf('bomb', face).label, `face ${face} of the bomb pickup is not named for its special`).toBe(SPECIALS[kind].label);
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

  /*
    ⚠️ **`THE HULLS: every gun has its own three-tier hull ladder … widening boxes` WAS HERE.** 0441
    took the gun's tiers and the hull that climbed with them: a hull belongs to a SHIP now, at no tubes,
    one and two, all in one box — *"the same overall space needs to be taken up by them."* What a hull
    must be is held per ship below.
  */
  it('THE HULLS: every ship has a hull at each tube stage, with hit twins, in one box, shared with no other ship', () => {
    const extentOf = (sprite: number): number => SPRITE_EXTENT[SPRITE_KINDS[sprite]!];
    const bases = new Set<number>();
    for (const kind of SHIP_KINDS) {
      const ship = SHIPS[kind];
      expect(ship.hulls[0].base, `the ${kind} is not drawn as its own row says`).toBe(ship.sprite);
      expect(ship.hulls[0].hit, `the ${kind} does not flash as its own row says`).toBe(ship.spriteHit);
      for (let stage = 0; stage < ship.hulls.length; stage++) {
        const hull = ship.hulls[stage]!;
        expect(hull.hit, `the ${kind} at ${stage} tubes flashes as itself`).not.toBe(hull.base);
        expect(extentOf(hull.hit), `the ${kind} at ${stage} tubes changes size when hit`).toBe(extentOf(hull.base));
        // *"The same overall space"* — 0441: every hull of every ship in the one box.
        expect(extentOf(hull.base), `the ${kind} at ${stage} tubes is not in the one box`).toBe(SHIP_BOX);
        expect(hullFor(ship, stage), `the ${kind} with ${stage} tubes is not drawn as stage ${stage}`).toBe(hull);
        bases.add(hull.base);
      }
    }
    // Every stage differs from every other, so a tube taken changes the picture (0081) and no two
    // ships are the same drawing at any stage.
    expect(bases.size, 'two hulls are one drawing, so a tube or a ship is invisible there').toBe(SHIP_KINDS.length * 3);
  });

  it('and the ship wears its own hull, in the frame that blits it', () => {
    for (const gun of WEAPON_KINDS) {
      const { world, frame } = armed(gun);
      const own = hullFor(world.shipRow, 0).base;
      expect(world.ship.spriteBase, `the ship carrying the ${gun} wears another hull`).toBe(own);
      const recorder = new Recorder();
      world.surface = recorder;
      frame.draw(0);
      expect(recorder.blits.some((b) => b.sprite === own), `the ${gun}'s ship was never drawn`).toBe(true);
      for (const other of SHIP_KINDS) {
        if (SHIPS[other] === world.shipRow) continue;
        expect(recorder.blits.some((b) => b.sprite === SHIPS[other].sprite), `the ${other} is drawn under the ${gun}'s ship`).toBe(false);
      }
    }
  });

  /*
    ⚠️ **`THE SWITCH: another gun is an upgrade even when the fitted gun is full, and taking it keeps
    the count` WAS HERE** (0233, 0256, 0372). Its subject was a weapon pickup switching the gun, which
    `docs/decisions/0441-a-pilot-flies-their-own-ship.md` removed: a gun is keyed to its ship for the
    whole run, and the pickup in that place buys a special.
  */
});

describe('0233 — a pickup cycles', () => {
  // The bomb pickup since 0441 — the cycling pickup in the weapon's place.
  function oneBombPickup(): ReturnType<typeof playableWorld> {
    return playableWorld({
      waves: [],
      // Lane 50 — the middle, as a share of the lane since 0364 (`laneAcross`).
      pickups: [{ at: 200, kind: 'bomb', lane: 50 }],
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

  it('THE CYCLE, in the real frame: a bomb pickup turns every PICKUP_CYCLE_STEPS, and is only ever drawn as one of its faces', () => {
    const { sprites } = watch(oneBombPickup());
    const turns: number[] = [];
    for (let i = 1; i < sprites.length; i++) {
      expect(PICKUPS.bomb.faces, 'the pickup was drawn as something that is not one of its faces').toContain(sprites[i]);
      if (sprites[i] !== sprites[i - 1]) turns.push(i);
    }
    expect(turns.length, 'the pickup never turned').toBeGreaterThan(1);
    for (let t = 1; t < turns.length; t++) {
      expect(turns[t]! - turns[t - 1]!, `turn ${t} came a different number of steps after the last`).toBe(PICKUP_CYCLE_STEPS);
    }
    // In the specials' own order, round and round.
    const faces = PICKUPS.bomb.faces;
    for (const at of turns) {
      const before = faces.indexOf(sprites[at - 1]!);
      expect(sprites[at], 'the faces did not turn in table order').toBe(faces[(before + 1) % faces.length]);
    }
  });

  it('and it waits for at least PICKUP_REPEATS full turns of its faces, so the player sees every face twice', () => {
    // Turns DURING THE WAIT. A pickup keeps turning on its way back out of the view once the wait
    // is over, and those turns are ones the player has already decided against.
    const { sprites, waiting } = watch(oneBombPickup());
    let turns = 0;
    for (let i = 1; i < sprites.length; i++) if (sprites[i] !== sprites[i - 1] && waiting[i]) turns++;
    expect(turns, 'the pickup left before every face had been shown twice').toBeGreaterThanOrEqual(
      PICKUP_REPEATS * PICKUPS.bomb.faces.length - 1,
    );
  });

  it('0294 — and a blade’s two frames are ONE size, so a spinning star does not pulse', () => {
    /*
      ⚠️ **NOTHING IN THE SUITE COMPARED THEM, AND THE SIZE CHANGE FOUND THAT OUT.** `shuriken` and
      `shurikenTurn` are the two frames of one spinning blade — the same star an eighth of a turn
      apart, swapped every `BLADE_TURN_STEPS` — so they are not two sprites that happen to look
      alike, they are one object at two moments.

      ⚠️ **0294 SHRANK ONE AND LEFT THE OTHER AT 8 FOR A COMMIT**, which is a blade that grows and
      shrinks four times a second, and every guard in the repository was green about it. A pair that
      must agree and is never asked to is exactly the shape
      `docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md` names about hurt twins, and
      this is the same claim about a turn.
    */
    expect(SPRITE_EXTENT.shurikenTurn, 'the blade’s two frames are different sizes, so it pulses as it spins').toBe(
      SPRITE_EXTENT.shuriken,
    );
  });

  it('and it wanders the whole box while it waits, turning at the back wall rather than leaving through it', () => {
    /*
      Asked for: *"bounce off all the screen walls."* The walls are the player's box (0100), so the
      pickup comes at least to the back of it, turns, and is never behind it — where the ship could
      not follow.
    */
    // Held long enough to cross the box and back twice, whatever the wait is tuned to.
    const { inView, waiting } = watch(oneBombPickup(), 3000);
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
      step it is showing the storm — not its first face — and the shell is handed the storm.
    */
    const built = oneBombPickup();
    const frame = new GameFrame(built.world);
    built.world.fireIn = NEVER;
    while (built.world.pickups.size === 0) frame.step();
    const item = built.world.pickups.at(0);
    expect(BOMB_KINDS.indexOf('storm'), 'the storm is the bomb pickup’s first face, so this proves nothing').toBeGreaterThan(0);
    const wanted = SPECIALS.storm.face;
    let steps = 0;
    while (built.world.pickups.size > 0 && steps < 4000) {
      if (item.sprite === wanted && item.along - built.world.cameraAlong < PLAYER_LEAD) {
        built.world.ship.across = item.across;
        built.world.ship.along = item.along;
      }
      frame.step();
      steps++;
    }
    expect(built.taken, 'the pickup was never taken').toEqual(['bomb']);
    expect(built.faces, 'the shell was handed a face other than the one drawn').toEqual([BOMB_KINDS.indexOf('storm')]);
  });
});

describe('0233 — the arc is chain lightning', () => {
  it('THE CHAIN: a volley lands on the nearest bodies in reach, one link each, from the nose through each body in turn', () => {
    const { world, frame, cues } = armed('arc');
    const links = world.weapon.links;
    expect(links, 'the fixture has no chain to test').toBeGreaterThanOrEqual(3);
    /*
      ⚠️ **THE GAPS SHRINK, BECAUSE THE JUMPS DO — 0302.** Each jump reaches `falloff` of the one
      before it, so a chain walking a constant stride is not a chain this model can make and a
      fixture built on one is testing the model of two changes ago. Each body sits comfortably
      inside its own link's reach, measured from the body the link starts at.
    */
    const near = [target(world, 20, 0), target(world, 34, 8), target(world, 42, 2)];
    const far = target(world, near[2]!.along - world.ship.along + world.weapon.reach + 40, 0);
    const nose = { along: world.ship.along + world.shipRow.muzzle.along, across: world.ship.across + world.shipRow.muzzle.across };
    // And the fixture says so out loud, so a ladder that moves under it fails HERE rather than
    // quietly testing a chain of one — every gap inside the reach the link that jumps it is given.
    let from = nose;
    for (let i = 0; i < near.length; i++) {
      const gap = Math.hypot(near[i]!.along - from.along, near[i]!.across - from.across) - ENEMIES.turret.radius;
      expect(gap, `the fixture put body ${i} outside link ${i}'s own reach`).toBeLessThan(world.weapon.reach * world.weapon.falloff ** i);
      from = near[i]!;
    }
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
    const { world, frame, cues } = armed('arc');
    const far = target(world, world.weapon.reach + 40, 0);
    frame.step();
    expect(far.health, 'a body beyond reach was struck').toBe(99);
    expect(world.bolts.size, 'a dry volley is not one link').toBe(1);
    expect(cues, 'a dry volley did not sound the discharge').toContain('arc');
    expect(cues, 'a dry volley sounded a strike that did not happen').not.toContain('zap');
  });

  it('0302 — THE FALLOFF: a jump reaches less than the hit before it, so a body a first reach past the last strike is out of range', () => {
    /*
      `docs/decisions/0302-the-bolt-shows-its-reach.md`. *"The additional jumps should then be based
      on decreasing distance."* Held as the RELATIONSHIP: the second body stands a gap the first hit
      would have crossed and the jump cannot, whatever the ladder says either of them is.
    */
    const { world, frame } = armed('arc');
    expect(world.weapon.links, 'the fixture has no second link to shorten').toBeGreaterThanOrEqual(2);
    expect(world.weapon.falloff, 'the arc no longer spends its chain').toBeLessThan(1);
    const first = target(world, 20, 0);
    // Between the two: inside what the first hit crossed, outside what the jump is given.
    const gap = (world.weapon.reach + world.weapon.reach * world.weapon.falloff) / 2;
    const second = target(world, 20 + gap, 0);
    frame.step();
    expect(first.health, 'the first hit did not land').toBe(99 - world.weapon.damage);
    expect(second.health, 'the jump reached as far as the first hit did').toBe(99);
    expect(world.bolts.size, 'the picture kept a link the chain did not make').toBe(1);
  });

  it('0302 — THE RANGE, in pixels: a dry bolt is drawn exactly as far as the gun reaches, and a body at its tip is struck', () => {
    /*
      `docs/decisions/0027-measure-the-picture-not-the-model.md` asks for one assertion in the units
      the player experiences, and this is the whole of 0302 in them: the length of the line on the
      screen, against the place a body has to stand to be hit by it. The bolt drew 0.55 of its reach
      — *"so a miss does not look like a range"* — and the report is the other way round: *"the first
      hit should have the range displayed on screen."*
    */
    const { world, frame } = armed('arc');
    const recorder = new Recorder();
    world.surface = recorder;
    frame.step();
    frame.draw(1);
    const px = world.view.scale;
    const at = (along: number, across: number): [number, number] => [
      screenX(world.view, along - world.cameraAlong, across),
      screenY(world.view, along - world.cameraAlong, across),
    ];
    const nose = at(world.ship.along + world.shipRow.muzzle.along, world.ship.across + world.shipRow.muzzle.across);
    const tip = at(world.ship.along + world.shipRow.muzzle.along + world.weapon.reach, world.ship.across + world.shipRow.muzzle.across);
    expect(world.bolts.size, 'the fixture did not fire dry').toBe(1);
    const main = recorder.bolts.find((p) => Math.hypot(p[0]! - nose[0], p[1]! - nose[1]) < 1.5 * px);
    expect(main, `no stroke leaves the nose at ${nose.map((n) => n.toFixed(0)).join(',')}`).toBeDefined();
    const drawn = Math.hypot(main![main!.length - 2]! - nose[0], main![main!.length - 1]! - nose[1]) / px;
    const reached = Math.hypot(tip[0] - nose[0], tip[1] - nose[1]) / px;
    expect(drawn, `the dry bolt draws ${drawn.toFixed(1)} lane units where the gun reaches ${reached.toFixed(1)}`).toBeCloseTo(reached, 1);
    /*
      And the line is not a decoration: a body whose hull edge stands at that tip is struck and one
      two units past it is not. A fresh world each way, because at this tier the chain has links to
      spare and a body left standing beside another would be jumped to rather than missed.
    */
    const healthAt = (past: number): number => {
      const built = armed('arc');
      const muzzle = built.world.shipRow.muzzle;
      const body = target(built.world, muzzle.along + built.world.weapon.reach + ENEMIES.turret.radius + past, muzzle.across);
      built.frame.step();
      return body.health;
    };
    expect(healthAt(-0.5), 'a body half a unit inside the drawn tip was not struck').toBe(99 - world.weapon.damage);
    expect(healthAt(2), 'a body two units past the drawn tip was struck').toBe(99);
  });

  it('0257 — THE SCREEN: from the front of the box, a body whose hull is on the screen is struck and one crossing the leading edge is not', () => {
    /*
      `docs/decisions/0257-the-arc-lands-on-the-screen.md`. Reported from the alpha play: *"chain
      lightning jumps too far, enemies don't even get a chance to get on screen."* The ship is put
      at the very front of its box, where the reach runs past the view; a body a unit inside the
      leading edge, hull and all, is struck, and a body whose hull crosses it is not — in the
      player's own units, the screen's edge. It was walked over every rung of the ladder until 0441
      left the one; 0443's longer reach runs further past the edge, which is the case this holds.
    */
    const { world, frame } = armed('arc');
    world.ship.along = world.cameraAlong + PLAYER_LEAD;
    world.ship.prevAlong = world.ship.along;
    const edge = world.cameraAlong + world.view.alongSpan;
    const radius = ENEMIES.turret.radius;
    const inside = target(world, edge - radius - 1 - world.ship.along, 6);
    const crossing = target(world, edge - radius + 2 - world.ship.along, -6);
    expect(edge - world.ship.along, 'the fixture put the ship somewhere the reach does not cross the edge').toBeLessThan(world.weapon.reach);
    frame.step();
    expect(inside.health, 'a body whose whole hull is on the screen was not struck').toBe(99 - world.weapon.damage);
    expect(crossing.health, 'a body still crossing the leading edge was struck').toBe(99);
  });

  it('ON A BOSS ALONE, every link lands on the boss, each at a different point inside it', () => {
    /*
      Asked for: *"for single target bosses it needs to arc and bounce and jump around to hit
      different parts of the boss."* A boss is one body with one radius, so the parts are a picture:
      each link after the first lands somewhere else inside the disc, and each is a strike.
    */
    const { world, frame } = armed('arc');
    const boss = world.bossPool.spawn();
    if (boss === null) throw new Error('no boss pool');
    reset(boss, world.ship.along + 30, world.ship.across, BOSSES.sentinel);
    boss.health = 500;
    world.bossFullHealth = 500;
    boss.fireIn = NEVER;
    frame.step();
    // Each strike weighed by what the gun is worth on the fight's boss — 0372.
    expect(boss.health, 'the boss did not take one strike per link').toBeCloseTo(
      500 - world.weapon.links * world.weapon.damage * gunWeightOn(world.bossRow, 'arc'),
      9,
    );
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
    const { world, frame } = armed('arc');
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
    const nose = at(world.ship.along + world.shipRow.muzzle.along, world.ship.across + world.shipRow.muzzle.across);
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
    const { world, frame } = armed('arc');
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
    // And the ray's ring is not the pulse either — 0442.
    expect(cueOfFlight('burst'), 'the ray fires with another gun’s cue').toBe('ray');
    expect(TWIN_KINDS, 'the discharge has no picture to be the twin of').toContain(CUES.arc.twin);
    expect(TWIN_KINDS).toContain(CUES.zap.twin);
    expect(CUES.arc.twin, 'the discharge claims a picture that is not the bolt').toBe('bolt-appears');
  });
});
