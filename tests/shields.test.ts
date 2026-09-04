import { describe, it, expect } from 'vitest';
import { ACROSS_SPAN, viewOf } from '../src/sim/camera.ts';
import { type Entity, makeEntity, reset } from '../src/sim/entity.ts';
import { Pool } from '../src/sim/pool.ts';
import { GameFrame, advanceLevel, respawn, startLevel, type World } from '../src/app/frame.ts';
import { MAX_SHIELDS, SHIPS, fullHealthFor, shieldsOf } from '../src/content/ships.ts';
import {
  PICKUPS,
  PICKUP_KINDS,
  UPGRADE_KINDS,
  UPGRADE_TIERS,
  effectOf,
  type Loadout,
  isUpgrade,
  type PickupKind,
  type UpgradeKind,
  weaponFor,
} from '../src/content/pickups.ts';
import { SHOTS } from '../src/content/shots.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { SPRITE, SPRITE_EXTENT } from '../src/content/sprites.ts';
import { CAPACITY } from '../src/app/mount.ts';
import { playableWorld, NO_LEVEL } from './world.ts';

/**
 * THE HULL IS ONE HIT, AND THE SHELL IS WHAT STANDS IN FRONT OF IT.
 *
 * `docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md`. Asked
 * for after playing the two-level build: *"one hit destroys it"*, and *"shields — a pickup, capped
 * at 3. Each absorbs one hit and is destroyed."*
 *
 * ⚠️ **The shell is a PICTURE of a number, and both halves are held here.** The number is the ship's
 * health above its hull; the picture is a mark per shield, orbiting. A guard over only the first
 * would pass while the ship wore three marks and could be killed by one bullet, which is exactly the
 * shape `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` is named for.
 *
 * ⚠️ **Nothing here asserts on a VALUE that a hand is meant to settle** — not `MAX_SHIELDS`, not the
 * orbit radius, not how fast the shell turns. What is held are the relationships that must be true
 * at any of them.
 */

/** Steps to run when the assertion is about something happening, not about how long it takes. */
const A_WHILE = 240;

/** A world with no level in it, so nothing arrives except what a test puts there. */
function quietWorld(): { world: World; frame: GameFrame } {
  const built = playableWorld(NO_LEVEL);
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** Put `count` shields on the ship, the way the shell does: health above the hull. */
function giveShields(world: World, count: number): void {
  world.ship.health = world.shipRow.health + count;
}

/** Fire one enemy bullet into the ship from point-blank, and step until it lands. */
function takeAHit(world: World, frame: GameFrame): void {
  const before = world.ship.health;
  for (let i = 0; i < A_WHILE; i++) {
    if (world.enemyShots.size === 0) {
      const shot = world.enemyShots.spawn()!;
      reset(shot, world.ship.along + 6, world.ship.across, SHOTS.spit);
      shot.velAlong = -SHOTS.spit.speed + world.scrollPerStep;
    }
    frame.step();
    if (world.ship.health < before) return;
  }
  throw new Error('the ship was never hit — the fixture is not measuring what it says it is');
}

describe('the hull is one hit', () => {
  it('dies to a single contact, whatever the ship is', () => {
    /*
      ⚠️ **Against the ROW rather than against the number 1**, so a later ship with a tougher hull
      fails this only if it stops dying to `health` hits — which is the rule — rather than because
      somebody wrote a different number in a table.
    */
    const { world, frame } = quietWorld();
    expect(shieldsOf(world.shipRow, world.ship.health), 'a run opens with a shell already on').toBe(0);

    /*
      ⚠️ **`onWreck` AND NOT `onDeath`, and the difference is a whole decision.** 0079 split a death
      into *the ship came apart* and *the life is spent*, `DEATH_STEPS` apart — and the subject here is
      the first one: the hull is one hit. `onDeath` would be true of this too and would be true
      four fifths of a second later, so a fixture that stops the instant the health moves would read
      zero and call the hull immortal.
    */
    let wrecked = 0;
    world.onWreck = (): void => {
      wrecked++;
    };
    takeAHit(world, frame);
    expect(world.ship.health, 'the hull survived a hit it should not have').toBeLessThanOrEqual(0);
    expect(wrecked, 'the ship reached zero and nothing was told').toBe(1);
  });

  it('survives exactly one more hit per shield, and no more', () => {
    for (let shields = 0; shields <= MAX_SHIELDS; shields++) {
      const { world, frame } = quietWorld();
      giveShields(world, shields);
      let wrecked = 0;
      world.onWreck = (): void => {
        wrecked++;
      };
      for (let hit = 0; hit < shields; hit++) {
        takeAHit(world, frame);
        expect(wrecked, `a ship with ${shields} shields died on hit ${hit + 1}`).toBe(0);
      }
      takeAHit(world, frame);
      expect(wrecked, `a ship with ${shields} shields survived ${shields + 1} hits`).toBe(1);
    }
  });

  it('cannot be handed a fourth shield', () => {
    // The cap is the readout's, not the balance's: the HUD draws a pip per shield and the ship wears
    // a mark per shield, so a fourth would have nowhere to be — `src/content/ships.ts`.
    const cap = fullHealthFor(SHIPS.proof);
    let health = SHIPS.proof.health;
    for (let i = 0; i < MAX_SHIELDS + 3; i++) health = Math.min(health + 1, cap);
    expect(shieldsOf(SHIPS.proof, health), 'the cap let a fourth shield on').toBe(MAX_SHIELDS);
  });
});

describe('the shell says how many shields there are', () => {
  it('wears one mark per shield, and loses one with each hit', () => {
    const { world, frame } = quietWorld();
    giveShields(world, MAX_SHIELDS);
    frame.step();
    expect(world.shieldOrbs.size, 'the shell does not match the shields').toBe(MAX_SHIELDS);

    for (let left = MAX_SHIELDS - 1; left >= 0; left--) {
      takeAHit(world, frame);
      expect(world.shieldOrbs.size, `the shell kept a mark the ship had already spent`).toBe(left);
    }
  });

  it('reports a change to the readout exactly when the ship’s health moves', () => {
    /*
      ⚠️ **THIS GUARD MOVED HERE FROM `tests/hud.browser.test.ts`, AND CI IS WHY.**
      `docs/decisions/0045-the-player-can-see-what-they-are-carrying.md` holds *a readout that renders
      once and never updates looks completely correct in a still image*, and its probe breaks the
      frame's `shownHealth` comparison so `onHealth` never fires. That probe was caught by a browser
      test which waited for the ship to lose a pip — and the one-hit hull deleted that event: a ship
      with no shell does not lose a pip when it is hit, it is destroyed. The suite went green with the
      break in place, which `npm run prove` reported and nothing else could have.

      The DOM half is still held next door — the pips render what `setHud` is given, and the lives
      count moving proves the call reaches the page. This is the half above it: that the FRAME says
      anything at all when the number moves.
    */
    const { world, frame } = quietWorld();
    giveShields(world, 2);
    const reported: number[] = [];
    world.onHealth = (health: number): void => {
      reported.push(health);
    };

    frame.step();
    expect(reported, 'the frame reported a change nothing made').toEqual([world.shipRow.health + 2]);

    reported.length = 0;
    for (let i = 0; i < 30; i++) frame.step();
    expect(reported, 'the frame reported a change on a step where nothing happened').toEqual([]);

    takeAHit(world, frame);
    expect(reported, 'a shield was spent and the readout was never told').toEqual([world.shipRow.health + 1]);
  });

  it('leaves a burst where a mark was, because absorbing a hit is an event', () => {
    /*
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`: three events the
      model resolved and the picture never mentioned were each reported as a collision bug that did
      not exist. A shield popping is the same shape of event — the ship is unharmed, the hit landed,
      and without this the only sign is a mark that is no longer there.
    */
    const { world, frame } = quietWorld();
    giveShields(world, 1);
    frame.step();
    const orb = world.shieldOrbs.at(0);
    const where = { along: orb.along, across: orb.across };
    world.debris.clear();

    takeAHit(world, frame);
    expect(world.debris.size, 'a shield popped and left nothing behind').toBeGreaterThan(0);
    let near = 0;
    for (let i = 0; i < world.debris.size; i++) {
      const piece = world.debris.at(i);
      const d = Math.hypot(piece.along - where.along, piece.across - where.across);
      if (d < SPRITE_EXTENT.shieldOrb * 2) near++;
    }
    expect(near, 'the burst was nowhere near the mark that was spent').toBeGreaterThan(0);
  });

  it('is gone the moment the ship is, and comes back empty', () => {
    const { world, frame } = quietWorld();
    giveShields(world, MAX_SHIELDS);
    frame.step();
    expect(world.shieldOrbs.size).toBe(MAX_SHIELDS);

    respawn(world);
    /*
      ⚠️ **Zero on the same step, not on the next one.** Left to the shell's own bookkeeping the
      marks would be released a step later — as three bursts, at the place the new ship is sitting.
      A player who had just lost a life would watch three shields pop off a ship that never wore them.
    */
    expect(world.shieldOrbs.size, 'the shell outlived the ship that wore it').toBe(0);
    world.debris.clear();
    frame.step();
    expect(world.debris.size, 'the respawn popped shields the new ship never had').toBe(0);
    expect(shieldsOf(world.shipRow, world.ship.health), 'the new ship came back already shielded').toBe(0);
  });
});

describe('the shell is drawn where the player is looking', () => {
  /*
    ── THE ASSERTION IN UNITS THE PLAYER EXPERIENCES ────────────────────────────────────────────────

    `docs/decisions/0027-measure-the-picture-not-the-model.md` asks for at least one, *"because a
    guard measuring a quantity defined in terms of the constant it guards proves only that the code
    agrees with itself"*. So the orbit is checked in PIXELS on the view the game ships: clear of the
    hull, inside a fraction of the lane, and — the part a still image cannot see — evenly spaced.
  */
  const view = viewOf(1280, 720);

  it('orbits clear of the hull and close enough to read as the ship’s, in pixels', () => {
    const { world, frame } = quietWorld();
    giveShields(world, MAX_SHIELDS);
    frame.step();

    const hullPixels = (SPRITE_EXTENT.ship / 2) * view.scale;
    const lanePixels = ACROSS_SPAN * view.scale;
    for (let i = 0; i < world.shieldOrbs.size; i++) {
      const orb = world.shieldOrbs.at(i);
      const pixels =
        Math.hypot(orb.along - world.ship.along, orb.across - world.ship.across) * view.scale;
      expect(pixels, 'a mark is inside the hull, where the ship hides it').toBeGreaterThan(hullPixels * 0.6);
      expect(pixels, 'the shell is flying in formation rather than being worn').toBeLessThan(lanePixels * 0.15);
    }
  });

  it('spaces its marks evenly, whatever it is carrying', () => {
    for (let shields = 1; shields <= MAX_SHIELDS; shields++) {
      const { world, frame } = quietWorld();
      giveShields(world, shields);
      frame.step();
      const angles: number[] = [];
      for (let i = 0; i < world.shieldOrbs.size; i++) {
        const orb = world.shieldOrbs.at(i);
        angles.push(Math.atan2(orb.across - world.ship.across, orb.along - world.ship.along));
      }
      expect(angles.length).toBe(shields);
      for (let i = 1; i < angles.length; i++) {
        // The gap between neighbours, wrapped into a turn. Every one of them must be the same.
        const gap = (angles[i]! - angles[i - 1]! + Math.PI * 4) % (Math.PI * 2);
        expect(gap, `${shields} marks are not evenly spaced`).toBeCloseTo((Math.PI * 2) / shields, 5);
      }
    }
  });

  it('turns as the camera travels, so it is a shape in the world rather than a wobble in time', () => {
    /*
      ⚠️ **The property, not the rate.** `src/content/enemies.ts` argues it for the weave: a shape
      authored against the world plays the same on every device and in a headless test, and a
      wall-clock wobble does not. What is asserted is that the shell moves with the camera and does
      not move when the camera is still.
    */
    const { world, frame } = quietWorld();
    giveShields(world, 1);
    frame.step();
    const first = world.shieldOrbs.at(0);
    const startAngle = Math.atan2(first.across - world.ship.across, first.along - world.ship.along);

    for (let i = 0; i < A_WHILE; i++) frame.step();
    const moved = world.shieldOrbs.at(0);
    const later = Math.atan2(moved.across - world.ship.across, moved.along - world.ship.along);
    expect(Math.abs(later - startAngle), 'the shell never turned').toBeGreaterThan(0.01);

    /*
      ⚠️ **THE HALF THAT SEPARATES THE TWO, AND `npm run prove` IS WHY IT IS WRITTEN THIS WAY.** The
      first version stopped the SIMULATION and asserted the shell held — which a step counter passes
      just as happily, because a frame that does not step does not turn anything either. The camera
      advances by a fixed amount every step, so *distance travelled* and *steps taken* are the same
      number until something separates them. This separates them: the world stops moving while the
      simulation keeps running.
    */
    const held = Math.atan2(moved.across - world.ship.across, moved.along - world.ship.along);
    world.scrollPerStep = 0;
    for (let i = 0; i < A_WHILE; i++) frame.step();
    const stillHeld = world.shieldOrbs.at(0);
    expect(
      Math.atan2(stillHeld.across - world.ship.across, stillHeld.along - world.ship.along),
      'the shell kept turning while the world stood still — it is reading a clock, not the camera',
    ).toBeCloseTo(held, 6);
  });
});

describe('the shell costs nothing the budget did not already have', () => {
  it('fits its own pool, which is exactly what the ship can carry', () => {
    expect(CAPACITY.shieldOrbs, 'the shell can run out of slots before the ship runs out of shields').toBe(
      MAX_SHIELDS,
    );
  });

  it('is in no collision pairing, so it can never hurt or be hurt', () => {
    // Belt and braces, exactly as `src/content/debris.ts` writes its own zeros out: the pairing is
    // the guard (0034), and a zero radius is what stops a later pairing being a live bug.
    const { world, frame } = quietWorld();
    giveShields(world, MAX_SHIELDS);
    frame.step();
    for (let i = 0; i < world.shieldOrbs.size; i++) {
      expect(world.shieldOrbs.at(i).radius, 'a mark has a hurtbox').toBe(0);
      expect(world.shieldOrbs.at(i).damage, 'a mark can hurt something').toBe(0);
      expect(world.shieldOrbs.at(i).sprite, 'a mark is drawn as something else').toBe(SPRITE.shieldOrb);
    }
  });

  it('an enemy that reaches a shielded ship still only takes one shield', () => {
    /*
      Contact damage is not consumed — an enemy the player flew into is still there — so a shielded
      ship parked inside one must not lose the whole shell in three steps. That is what `invulnFor`
      is for, and this is the one place in the game where the shell would make its absence obvious.
    */
    const { world, frame } = quietWorld();
    giveShields(world, MAX_SHIELDS);
    const enemy = world.enemies.spawn()!;
    reset(enemy, world.ship.along, world.ship.across, ENEMIES.drifter);
    enemy.velAlong = world.scrollPerStep;
    enemy.fireIn = Number.MAX_SAFE_INTEGER;
    frame.step();
    frame.step();
    expect(shieldsOf(world.shipRow, world.ship.health), 'a single contact took more than one shield').toBe(
      MAX_SHIELDS - 1,
    );
  });
});

/**
 * A LEVEL BOUNDARY KEEPS THE SHELL, AND A DEATH DOES NOT.
 *
 * `docs/decisions/0058-a-level-boundary-keeps-the-shell.md`. Reported from play: *"shields don't
 * carry forward between levels."*
 *
 * ⚠️ **The two paths run through the same function and must not agree.** `startLevel` calls
 * `resetScene`, which calls `respawn` — so the code that puts a fresh hull on the field after a death
 * is also the code that puts one there at the top of a level. The difference between a life ending
 * and a level ending is the whole of what these hold, and *"is gone the moment the ship is"* above is
 * the other half of it.
 */
describe('a level boundary keeps the shell, and a death does not', () => {
  it('carries every shield into the next level', () => {
    const { world } = quietWorld();
    giveShields(world, MAX_SHIELDS);
    advanceLevel(world, NO_LEVEL, 1);
    expect(shieldsOf(world.shipRow, world.ship.health), 'the level boundary took the shell').toBe(MAX_SHIELDS);
  });

  it('carries a partial shell too, so it is the count and not a flag', () => {
    /*
      One shield rather than a full shell, because *"health was restored to full"* and *"the shell
      crossed"* are the same picture at three and different pictures at one — and the first would be
      a shield pickup nobody has to find.
    */
    const { world } = quietWorld();
    giveShields(world, 1);
    advanceLevel(world, NO_LEVEL, 1);
    expect(shieldsOf(world.shipRow, world.ship.health), 'the boundary refilled the shell instead of keeping it').toBe(1);
  });

  it('puts the marks back on the ship, so the picture says so too', () => {
    // 0036: an event the model resolves and the picture never mentions is a bug report about
    // something else. A shell that survived as a number and not as marks is exactly that.
    const { world, frame } = quietWorld();
    giveShields(world, 2);
    advanceLevel(world, NO_LEVEL, 1);
    frame.step();
    expect(world.shieldOrbs.size, 'the ship crossed the boundary wearing nothing').toBe(2);
  });

  it('cannot carry one into a NEW run, because the caller has to say which it is', () => {
    /*
      ⚠️ **The half that could have leaked**, and the reason `keepShell` is an argument rather than an
      ordering. A shell carried out of the run that just ended is a player starting their next attempt
      already armoured — and the first version of this made that impossible by an ordering in
      `src/app/mount.ts` that no test could see. `npm run prove` reported the probe over it STILL
      GREEN, which is 0019 catching a guard that could not fire.
    */
    const { world } = quietWorld();
    giveShields(world, MAX_SHIELDS);
    startLevel(world, NO_LEVEL);
    expect(shieldsOf(world.shipRow, world.ship.health), 'a new run opened wearing the last run’s shell').toBe(0);
  });

  it('never carries more than the ship can wear', () => {
    // The cap is `fullHealthFor`, and a carry that added to a full ship would put a fourth mark in a
    // pool of three — `src/app/mount.ts` caps the pickup for the same reason.
    const { world } = quietWorld();
    giveShields(world, MAX_SHIELDS);
    advanceLevel(world, NO_LEVEL, 1);
    expect(world.ship.health, 'the boundary handed the ship more health than it has room for').toBeLessThanOrEqual(
      fullHealthFor(world.shipRow),
    );
  });
});

describe('a pickup says which field it lands in', () => {
  it('every upgrade-effect pickup is an upgrade kind, and every upgrade kind is one', () => {
    /*
      ⚠️ **The guard over the second description this change deleted.** `UpgradeKind` was a
      hand-written union beside a table that already carries `effect: 'upgrade'`, and the shell
      narrowed to it with `kind === 'rapid' ? 'rapid' : 'spread'` — so the third pickup would have
      been filed as a spread, silently, and the player would have got a barrel for a shield.
    */
    const byEffect = PICKUP_KINDS.filter((k) => PICKUPS[k].effect === 'upgrade');
    expect([...byEffect].sort(), 'the upgrade list and the table disagree').toEqual([...UPGRADE_KINDS].sort());
    for (const kind of PICKUP_KINDS) {
      expect(isUpgrade(kind), `${kind} is narrowed the wrong way`).toBe(PICKUPS[kind].effect === 'upgrade');
    }
  });

  it('the shield pickup is its own effect, on neither the run nor the upgrade list', () => {
    expect(PICKUPS.shield.effect, 'a shield landed in a field that survives a death').toBe('shield');
    const kinds: readonly PickupKind[] = PICKUP_KINDS;
    expect(kinds.includes('shield'), 'the shield is not in the table the key is built from').toBe(true);
  });

  it('an upgrade pickup taken at its cap becomes a bomb charge, so it is never a dead pickup', () => {
    /*
      ── THE HALF THAT PAYS FOR DELETING THE UNBOUNDED DAMAGE ───────────────────────────────────────

      `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md`. Reported from play: *"max speed
      auto-fire is way too strong for the current game - when you get max speed nothing is a
      challenge, bosses die in less a second and they are supposed to be tough."*

      `weaponFor` used to spend every upgrade past every cap on `damage`, with no ceiling anywhere —
      because `docs/game.md` says *"an upgrade that cannot change the outcome is worse than none"* and
      that was the only answer available. The cap plus the conversion holds **both** halves of that
      sentence: the curve flattens AND the pickup still does something.

      ⚠️ **PER LADDER since 0083, which is the assertion that changed.** A capped pulse must not turn
      a MISSILE pickup into a bomb — that would be one ladder's ceiling stealing the other's upgrades,
      and a player who spent four on the guns would find the missiles unupgradable.

      ⚠️ **Both directions, for both kinds, because either alone is a different bug.** An `effectOf`
      that always said `special` would make the weapons un-upgradable and still pass a test of *the
      last one is a bomb*.
    */
    /*
      ⚠️ **ON THE BASE KINDS' OWN FACE, since 0233.** `effectOf` takes the face the pickup was showing
      and the loadout it lands on; face 0 is the base gun and the base tube, so these are the
      questions this test always asked — a pickup of the FITTED kind at its cap. A pickup of another
      kind is never capped, and `tests/weapons.test.ts` holds that half.
    */
    const fitted = (upgrades: readonly UpgradeKind[]): Loadout => ({ upgrades, weapon: SHIPS.proof.weapon, missile: SHIPS.proof.missile });
    for (const kind of UPGRADE_KINDS) {
      expect(effectOf(kind, 0, fitted([])), `a ship with nothing on it was refused a ${kind}`).toBe('upgrade');

      const capped: UpgradeKind[] = [];
      for (let i = 0; i < UPGRADE_TIERS; i++) capped.push(kind);
      expect(effectOf(kind, 0, fitted(capped)), `a ${kind} at its cap is still filed as an upgrade`).toBe('special');

      /*
        ⚠️ **THE CROSS-CHECK: the OTHER ladder is untouched by this one being full.** This is the
        assertion 0083 exists for, and nothing before it could have made it.
      */
      for (const other of UPGRADE_KINDS) {
        if (other === kind) continue;
        expect(effectOf(other, 0, fitted(capped)), `a full ${kind} ladder turned a ${other} pickup into a bomb`).toBe('upgrade');
      }
    }

    /*
      ⚠️ **And the changeover is exactly where the ladder stops growing** — one upgrade either side,
      checked against `weaponFor` rather than against a rung number. A ladder that stopped at tier
      three while `effectOf` switched at tier five would leave two dead pickups, which is the defect
      wearing a smaller number.
    */
    for (const kind of UPGRADE_KINDS) {
      for (let n = 0; n < UPGRADE_TIERS + 3; n++) {
        const carried: UpgradeKind[] = [];
        for (let i = 0; i < n; i++) carried.push(kind);
        const now = weaponFor(SHIPS.proof, carried);
        const next = weaponFor(SHIPS.proof, [...carried, kind]);
        const grew = JSON.stringify(next) !== JSON.stringify(now);
        expect(
          effectOf(kind, 0, fitted(carried)),
          `at ${n} ${kind}s the next one ${grew ? 'does' : 'does not'} change the ship, and the effect disagrees`,
        ).toBe(grew ? 'upgrade' : 'special');
      }
    }
  });

  it('and the shell has no opinion of its own about which field a pickup lands in', () => {
    /*
      ⚠️ **The rule above lived in `src/app/mount.ts` first, and that is why this exists.** As a branch
      in the shell it was a content rule in the one layer no unit test reaches without a DOM — so the
      thing paying for the deleted `damage++` had nothing holding it, which is
      `docs/decisions/0005-a-guard-must-be-seen-to-fail.md`'s shape exactly.

      What is held is the property that made moving it worthwhile: **every effect a pickup can report
      is one the table already names**, so the shell's job is a routing table over `PickupEffect` and
      never a decision about what a pickup is worth.
    */
    const named = new Set<string>(PICKUP_KINDS.map((k) => PICKUPS[k].effect));
    const everything: UpgradeKind[] = [];
    for (let i = 0; i < UPGRADE_TIERS; i++) for (const k of UPGRADE_KINDS) everything.push(k);
    for (const kind of PICKUP_KINDS) {
      for (const carried of [[], everything]) {
        const loadout: Loadout = { upgrades: carried, weapon: SHIPS.proof.weapon, missile: SHIPS.proof.missile };
        expect(named.has(effectOf(kind, 0, loadout)), `${kind} can report an effect no row in the table names`).toBe(true);
      }
    }
  });
});

describe('the shell is drawn under the ship and above everything else', () => {
  it('sits directly beneath the ship in the layer order', () => {
    /*
      Draw order is a decision `src/app/frame.ts` states and nothing else enforces. The marks are the
      ship's, so nothing may come between them — a bullet drawn between a ship and its own shell
      reads as having got through.
    */
    const { world } = quietWorld();
    const layers = world.layers;
    expect(layers[layers.length - 1], 'the ship is not the last thing drawn').toBe(world.shipPool);
    expect(layers[layers.length - 2], 'something is drawn between the ship and its shell').toBe(world.shieldOrbs);
  });

  it('every pool the world holds is drawn, so nothing is simulated invisibly', () => {
    const { world } = quietWorld();
    const drawn = new Set<Pool<Entity>>(world.layers);
    for (const pool of [world.shipPool, world.shieldOrbs, world.enemies, world.playerShots, world.enemyShots, world.debris]) {
      expect(drawn.has(pool), 'a pool is stepped but never painted').toBe(true);
    }
    // The pool type is the one the painter walks; a fixture that built its own would prove nothing.
    expect(new Pool<Entity>(1, makeEntity).size).toBe(0);
  });
});
