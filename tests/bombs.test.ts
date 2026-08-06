import { describe, it, expect } from 'vitest';
import { reset } from '../src/sim/entity.ts';
import { ACROSS_SPAN, REFERENCE_ASPECT } from '../src/sim/camera.ts';
import { GameFrame, launchSpecial, respawn, type World } from '../src/app/frame.ts';
import { SPECIALS, SPECIAL_KINDS } from '../src/content/specials.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { MAX_SHIELDS, shieldsOf } from '../src/content/ships.ts';
import { initialState, reduce, type State } from '../src/state/root.ts';
import { DEFAULT_DIFFICULTY, startingArsenal } from '../src/state/slices/run.ts';
import { playableWorld, NO_LEVEL } from './world.ts';

/**
 * THE FIRST TRIGGERED SPECIAL.
 *
 * `docs/decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md`. Asked for after playing the
 * two-level build: *"bombs — the first triggered special. The player starts with 2 and gains one per
 * level cleared. A bomb launches forward and detonates a set distance ahead of the ship, doing 6× a
 * pulse's damage in a wide blast — and the blast hurts the player, which is the skill in it."*
 *
 * ⚠️ **The blast hurting the player is the assertion that matters most**, because it is the one a
 * reasonable person would remove by accident: every other collision in the game is a threat meeting
 * the ship, and this is the ship's own weapon doing it.
 */

/** Long enough for a fuse and a blast at any numbers anybody would author. */
const A_WHILE = 200;

function quietWorld(): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** Step an already-thrown bomb until it goes off. */
function throwAndWaitFor(world: World, frame: GameFrame): void {
  for (let step = 0; step < A_WHILE; step++) {
    frame.step();
    if (world.blasts.size > 0) return;
  }
  throw new Error('the bomb never went off — the fixture is not measuring what it says it is');
}

/** Throw a bomb and step until it has gone off. Returns the step it detonated on. */
function throwAndWait(world: World, frame: GameFrame): number {
  launchSpecial(world, 'bomb');
  for (let step = 0; step < A_WHILE; step++) {
    frame.step();
    if (world.blasts.size > 0) return step;
  }
  throw new Error('the bomb never went off — the fixture is not measuring what it says it is');
}

describe('a bomb is thrown, and goes off where it was aimed', () => {
  it('travels ahead of the ship and detonates about a reach away', () => {
    /*
      ⚠️ **Measured in WORLD UNITS against the reference view**, which is where the ask's *"a fraction
      of the screen"* had to land: `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md` refuses
      screen-space authoring, because `alongSpan` runs 150 to 240 by device and a screen-relative
      bomb would be a longer weapon on a wider monitor.

      ⚠️ **And measured against where the ship IS when it goes off, not against where it was thrown
      from.** The ship holds station in the camera's frame and the world moves past it, so a distance
      taken from a fixed world position would include everything the camera travelled during the
      fuse — 21 units of it here — and the number would depend on the scroll rate rather than on the
      weapon. *Ahead of the ship* is a statement in the frame the player is watching.
    */
    const { world, frame } = quietWorld();
    throwAndWait(world, frame);
    const blast = world.blasts.at(0);
    const reached = blast.along - world.ship.along;
    expect(reached, 'the bomb went off behind the ship').toBeGreaterThan(0);
    // Within one step of travel of the reach the row states — the fuse is whole steps.
    expect(Math.abs(reached - SPECIALS.bomb.reach)).toBeLessThan(SHOTS.bomb.speed * 2);
    // And it is a real fraction of the reference view rather than of whatever this fixture can see.
    expect(SPECIALS.bomb.reach, 'the reach is most of the reference screen').toBeLessThan(
      ACROSS_SPAN * REFERENCE_ASPECT,
    );
  });

  it('hurts nothing on its way there', () => {
    /*
      ⚠️ **A bomb that detonated on contact would be a missile with a bigger number.** Choosing the
      PLACE is the whole of what makes it a skill, so the thrown body is in no collision pairing at
      all — it passes through whatever it is aimed at.
    */
    const { world, frame } = quietWorld();
    const enemy = world.enemies.spawn()!;
    reset(enemy, world.ship.along + 20, world.ship.across, ENEMIES.turret);
    enemy.fireIn = Number.MAX_SAFE_INTEGER;
    enemy.velAlong = 0;
    const health = enemy.health;
    // The ship's own auto-fire held off, or what lands on this enemy is a pulse and the assertion is
    // measuring the wrong weapon — which is exactly what it did the first time it was run.
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'bomb');
    // Far short of the fuse: the bomb is level with the enemy and nothing has gone off yet.
    for (let i = 0; i < 12; i++) frame.step();
    expect(world.blasts.size, 'the bomb went off on contact').toBe(0);
    expect(enemy.health, 'the bomb damaged something it flew through').toBe(health);
    /*
      ⚠️ **AND IT IS STILL IN THE AIR, which is the half a damage assertion cannot see.** A bomb put
      into a collision pairing is CONSUMED by the first thing it touches — it deals nothing, because
      its row says nothing, and it simply never arrives. The enemy is unharmed either way; what
      separates the two is whether the weapon the player spent ever went off at all.
    */
    expect(world.bombs.size, 'the bomb was eaten by something it should have passed through').toBe(1);
    throwAndWaitFor(world, frame);
    expect(enemy.health, 'the bomb damaged what it flew past on its way to going off').toBe(health);
  });

  it('leaves a blast drawn at exactly the radius that does the damage', () => {
    /*
      ⚠️ **Everywhere else in this game the hurtbox is smaller than the art** — a shooter whose
      hurtbox is the whole sprite reads as unfair (`src/content/sprites.ts`). A blast is the one body
      where that would be a lie, because the player is inside it too and is being asked to judge the
      edge. The two numbers live in different files, so this is what holds them together.
    */
    expect(SPRITE_EXTENT.blast, 'the blast is drawn at a different size from the one it damages at').toBe(
      SHOTS.blast.radius * 2,
    );
    const { world, frame } = quietWorld();
    throwAndWait(world, frame);
    expect(world.blasts.at(0).radius).toBe(SHOTS.blast.radius);
    expect(world.blasts.at(0).sprite).toBe(SPRITE.blast);
  });
});

describe('a blast is an area, and it lands once', () => {
  it('takes six pulses off everything inside it, in one step', () => {
    const { world, frame } = quietWorld();
    launchSpecial(world, 'bomb');
    const bomb = world.bombs.at(0);
    // Three enemies clustered where the bomb is going, all well inside the blast.
    const health: number[] = [];
    for (const offset of [-10, 0, 10]) {
      const enemy = world.enemies.spawn()!;
      reset(enemy, bomb.along + SPECIALS.bomb.reach, world.ship.across + offset, { ...ENEMIES.turret, health: 99 });
      enemy.fireIn = Number.MAX_SAFE_INTEGER;
      enemy.velAlong = 0;
      health.push(enemy.health);
    }
    // Nothing else may fire, or the pulses land on the same enemies and the count is not the blast's.
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < A_WHILE; i++) frame.step();
    expect(world.enemies.size, 'the blast hit nothing at all').toBe(3);
    for (let i = 0; i < world.enemies.size; i++) {
      const taken = health[0]! - world.enemies.at(i).health;
      expect(taken, 'a body inside the blast took a different amount from its neighbour').toBe(SHOTS.blast.damage);
      expect(taken, 'the blast is not worth six pulses').toBe(SHOTS.pulse.damage * 6);
    }
  });

  it('bills nothing twice, however long the picture lasts', () => {
    /*
      ⚠️ **THE BUG THIS SHAPE INVITES.** The blast stays on screen after it has done its work, and a
      pairing that ran every step would charge every body inside it once a step — ten times the row,
      invisibly, and only on the frames the screen is fullest.
    */
    const { world, frame } = quietWorld();
    launchSpecial(world, 'bomb');
    const bomb = world.bombs.at(0);
    const enemy = world.enemies.spawn()!;
    reset(enemy, bomb.along + SPECIALS.bomb.reach, world.ship.across, { ...ENEMIES.turret, health: 999 });
    enemy.fireIn = Number.MAX_SAFE_INTEGER;
    enemy.velAlong = 0;
    world.fireIn = Number.MAX_SAFE_INTEGER;
    world.missileIn = Number.MAX_SAFE_INTEGER;
    const before = enemy.health;

    for (let i = 0; i < A_WHILE; i++) frame.step();
    expect(before - enemy.health, 'the blast landed more than once').toBe(SHOTS.blast.damage);
  });

  it('hurts the player, and costs exactly what any other hit costs', () => {
    /*
      ⚠️ **THE ASK'S OWN SENTENCE**: *"and the blast hurts the player, which is the skill in it."*
      Driven by flying the ship into its own blast — the bomb is thrown, the ship keeps going, and
      the fixture asserts what it cost. One shield, not two, because a hit is a hit (0050).
    */
    /*
      ⚠️ **THE PLAYER HAS TO BE INSIDE IT WHEN IT GOES OFF, which is the rule as well as the fixture.**
      A blast lands once, on the step it appears; what stays on screen afterwards is the ring it left.
      So the way to be hurt by your own bomb is to chase it — which is what this does, by flying the
      ship along with the thrown body until the fuse runs out.
    */
    const { world, frame } = quietWorld();
    world.ship.health = world.shipRow.health + MAX_SHIELDS;
    const shieldsBefore = shieldsOf(world.shipRow, world.ship.health);
    launchSpecial(world, 'bomb');
    const bomb = world.bombs.at(0);
    for (let i = 0; i < A_WHILE; i++) {
      // Chasing it: the ship keeps pace with its own bomb, which is the mistake being modelled.
      world.ship.along = bomb.along;
      world.ship.prevAlong = world.ship.along;
      world.ship.across = bomb.across;
      world.ship.prevAcross = world.ship.across;
      frame.step();
      if (world.blasts.size > 0) break;
    }
    const shieldsAfter = shieldsOf(world.shipRow, world.ship.health);
    expect(shieldsAfter, 'the player flew into their own blast and it did nothing').toBeLessThan(shieldsBefore);
    expect(shieldsBefore - shieldsAfter, 'the player’s own blast cost more than one hit').toBe(1);
  });
});

describe('what a run may spend', () => {
  const begin = (): State =>
    reduce(initialState, { slice: 'run', type: 'begin', difficulty: DEFAULT_DIFFICULTY });

  it('starts with the ship’s own kit and no more', () => {
    expect(begin().run.arsenal).toEqual(startingArsenal());
    expect(startingArsenal()[0]!.charges, 'a run does not start with what the ask says').toBe(SPECIALS.bomb.charges);
  });

  it('spends one charge per press, and stops at empty', () => {
    let state = begin();
    const charges = state.run.arsenal[0]!.charges;
    for (let i = 0; i < charges; i++) state = reduce(state, { slice: 'run', type: 'spent', slot: 0 });
    expect(state.run.arsenal[0]!.charges, 'the arsenal went past empty').toBe(0);

    const empty = reduce(state, { slice: 'run', type: 'spent', slot: 0 });
    expect(empty, 'spending an empty slot changed the run').toBe(state);
    expect(empty.run.arsenal.length, 'an empty weapon stopped being owned, so its trigger moved').toBe(
      state.run.arsenal.length,
    );
  });

  it('gains one per level cleared, for every special owned', () => {
    // Stated over the arsenal rather than over the bomb: a second special inherits it without
    // anybody remembering to, which is the whole reason the arsenal is a list.
    const before = begin();
    const after = reduce(before, { slice: 'run', type: 'levelCleared' });
    expect(after.run.arsenal.map((e) => e.charges)).toEqual(before.run.arsenal.map((e) => e.charges + 1));
  });

  it('a death costs what was earned and never the starting kit', () => {
    let state = begin();
    state = reduce(state, { slice: 'run', type: 'levelCleared' });
    state = reduce(state, { slice: 'run', type: 'levelCleared' });
    expect(state.run.arsenal[0]!.charges).toBeGreaterThan(startingArsenal()[0]!.charges);
    const dead = reduce(state, { slice: 'run', type: 'lifeLost' });
    expect(dead.run.arsenal, 'a death did not go back to the ship’s own kit').toEqual(startingArsenal());
  });

  it('a special already owned gains charges rather than a second trigger', () => {
    let state = begin();
    state = reduce(state, { slice: 'run', type: 'took', special: 'bomb' });
    expect(state.run.arsenal.length, 'the same weapon landed on two triggers').toBe(1);
    expect(state.run.arsenal[0]!.charges).toBe(SPECIALS.bomb.charges * 2);
  });
});

describe('the trigger reaches the arsenal and nothing else', () => {
  it('throws nothing for a slot the run does not own', () => {
    const { world, frame } = quietWorld();
    let asked = 0;
    world.onSpecial = (): void => {
      asked++;
    };
    world.intent.specials[0] = 1;
    frame.step();
    expect(asked, 'a press was not reported').toBe(1);
    expect(world.bombs.size, 'the frame threw something the run never granted').toBe(0);
  });

  it('reports every press in a step, because presses are counted rather than latched', () => {
    // `src/sim/intent.ts` counts presses because several can land between two steps on a slow frame;
    // dropping the extras here would make the arsenal lossy exactly when the game is struggling.
    const { world, frame } = quietWorld();
    let asked = 0;
    world.onSpecial = (): void => {
      asked++;
    };
    world.intent.specials[0] = 3;
    frame.step();
    expect(asked).toBe(3);
  });

  it('a special with nothing behind it throws nothing at all', () => {
    /*
      `mines` is owned vocabulary with no weapon behind it, and its row says so with a null. The
      alternative was inventing a second weapon in the same change as the first, which is the
      *product to satisfy a shape* `src/content/ships.ts` refuses for the roster.
    */
    const { world } = quietWorld();
    launchSpecial(world, 'mines');
    expect(world.bombs.size, 'a special with no shot on its row threw something').toBe(0);
    for (const kind of SPECIAL_KINDS) {
      const row = SPECIALS[kind];
      expect(
        (row.shot === null) === (row.becomes === null),
        `${kind} has half a weapon on its row — one of shot and becomes is null and the other is not`,
      ).toBe(true);
    }
  });

  it('loses a bomb in the air with the ship that threw it', () => {
    const { world, frame } = quietWorld();
    launchSpecial(world, 'bomb');
    frame.step();
    expect(world.bombs.size).toBe(1);
    respawn(world);
    expect(world.bombs.size, 'a bomb outlived the ship that threw it').toBe(0);
    expect(world.blasts.size).toBe(0);
  });
});
