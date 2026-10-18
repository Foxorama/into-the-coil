/**
 * The Aqua Duck paints — `docs/decisions/0595-the-aqua-duck-paints.md`, item 3 of
 * [`the-secret-pilots-planned`](../reports/the-secret-pilots-planned-2026-10-11.md).
 *
 * The page: *"Aqua duck for Space duck → bubble jets / water guns? → x customisations to unlock? → paint ball
 * gun weapon."* Answered while it was planned: *"hints for unlocks is good"*.
 *
 * ⚠️ **THROUGH THE REAL STEP, NEVER BY WRITING A SPLAT OR A JET INTO A POOL.** What is under test is a ball
 * leaving the marker and landing through the pairings that exist, the colour it carries to its splat, and
 * the jet landing along its own line — a fixture that laid a blast by hand could see none of it.
 *
 * ⚠️ **IN THE PLAYER'S UNITS WHERE THERE ARE ANY** — 0027: degrees off straight ahead, seconds the jet
 * plays, and which picture a ball and its splat are drawn as.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame, SPLAT_KIND, SPLAT_STEPS, canThrow, launchSpecial, respawn, wearHull, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { FLAMES } from '../src/content/flames.ts';
import { GOLFERS, pilotOpen } from '../src/content/golfers.ts';
import { LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { faceAt, stoneAt } from '../src/sim/corridor.ts';
import { PALETTES, DEFAULT_PALETTE } from '../src/content/palette.ts';
import { BOMB_KINDS, facesShut, weaponFor } from '../src/content/pickups.ts';
import { SHIPS, SHIP_KINDS, fitted, ownFit } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { JET_BOLT_KIND, SPECIALS } from '../src/content/specials.ts';
import { CUES } from '../src/content/cues.ts';
import { cueSeconds } from '../src/app/sound.ts';
import { THEMES, THEME_KINDS } from '../src/content/themes.ts';
import { sameInk } from './contrast.ts';
import { SPRITE, SPRITE_KINDS } from '../src/content/sprites.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { INK_OF, drawKind, withFlame } from '../src/render/bake.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLITS_PER_JET, PAINT_FADE_STEPS, STROKES_PER_JET, paintBolts } from '../src/render/scene.ts';
import { SPRAY_LAYERS } from '../src/render/canvas.ts';
import { BOLT_SPRAY, BOLT_WATER, screenX, screenY, type BoltLook, type BoltTone, type Surface } from '../src/render/surface.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { streamAcross, streamAlong, streamAngle, streamOldest, streamWidth, streamYoungest } from '../src/sim/stream.ts';
import { STEPS_PER_SECOND, lockHint } from '../src/state/screens.ts';
import { flameOpen, initialHangar, pilotRecord, waresBought } from '../src/state/slices/hangar.ts';
import { OWNABLE_KINDS, OWNABLES } from '../src/content/wares.ts';
import { tracingPen } from './paths.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const PAINT = WEAPONS.paintball.paint!;
const JET = SPECIALS.waterCannon.jet!;
/** How far the jet's water flies in a step — 0616. */
const SPEED = JET.length / JET.flight;

/**
 * The stream a jet link was laid on, in world units, finely: its middle and its half-width at each point, from
 * the youngest of its water to the oldest — 0616, off the one description the frame lands and the painter draws.
 */
function streamOf(link: Entity, fine = 4): { along: number; across: number; width: number; age: number }[] {
  const clock = link.spin;
  const points: { along: number; across: number; width: number; age: number }[] = [];
  const young = streamYoungest(clock, JET.steps);
  const old = streamOldest(clock, JET.flight);
  for (let i = 0; i <= (old - young) * fine; i++) {
    const age = young + i / fine;
    points.push({
      along: link.along + streamAlong(clock, age, JET.sweep, JET.period, SPEED),
      across: link.across + streamAcross(clock, age, JET.sweep, JET.period, SPEED),
      width: streamWidth(age, JET.flight, JET.width, JET.tipWidth, JET.flare),
      age,
    });
  }
  return points;
}

/** The jet link in the bolt pool, or `null`. */
function jetLink(world: World): Entity | null {
  for (let i = 0; i < world.bolts.size; i++) if (world.bolts.at(i).kind === JET_BOLT_KIND) return world.bolts.at(i);
  return null;
}

/** How far `(along, across)` is from the stream, past the width it lands at there: negative is inside it. */
function outside(points: ReturnType<typeof streamOf>, along: number, across: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const dA = b.along - a.along;
    const dC = b.across - a.across;
    const t = Math.max(0, Math.min(1, ((along - a.along) * dA + (across - a.across) * dC) / (dA * dA + dC * dC)));
    const off = Math.hypot(along - (a.along + t * dA), across - (a.across + t * dC)) - (a.width + (b.width - a.width) * t);
    if (off < best) best = off;
  }
  return best;
}

/** A world flying the Aqua Duck with its own marker, its tubes held off. */
function inTheDuck(level: LevelRow = NO_LEVEL): { world: World; frame: GameFrame } {
  const built = playableWorld(level);
  built.world.shipRow = fitted(SHIPS.duck, 'paintball');
  built.world.weapon = weaponFor(built.world.shipRow, []);
  built.world.missileIn = Number.MAX_SAFE_INTEGER;
  wearHull(built.world);
  return { world: built.world, frame: new GameFrame(built.world) };
}

/** A body `along` ahead of the ship and `across` off its line, riding the camera, holding its fire. */
function bodyAt(world: World, along: number, across: number, health: number): void {
  const enemy = world.enemies.spawn()!;
  reset(enemy, world.ship.along + along, world.ship.across + across, ENEMIES.drifter);
  enemy.health = health;
  enemy.fireIn = Number.MAX_SAFE_INTEGER;
  enemy.velAlong = world.scrollPerStep;
}

/** A hangar with `count` priced wares bought. */
function bought(count: number): typeof initialHangar {
  const priced = OWNABLE_KINDS.filter((kind) => OWNABLES[kind].price !== null).slice(0, count);
  const owned = { ...initialHangar.owned };
  for (const kind of priced) owned[kind] = true;
  return { ...initialHangar, owned };
}

describe('0595 — the ask: MMXXVI in the Aqua Duck, with a paintball gun', () => {
  it('MMXXVI flies the duck, the duck flies the marker, and the marker throws the Water Cannon', () => {
    expect(GOLFERS.mmxxvi.ship).toBe('duck');
    expect(GOLFERS.mmxxvi.figure).toBe('duck');
    expect(GOLFERS.mmxxvi.pronouns).toBe('they/them');
    expect(GOLFERS.mmxxvi.saved.length).toBe(5);
    expect(GOLFERS.mmxxvi.saving.length).toBe(5);
    expect(SHIPS.duck.weapon).toBe('paintball');
    expect(SHIPS.duck.view, 'the duck is drawn from the side, as the cars are').toBe('side');
    expect(WEAPONS.paintball.flight).toBe('splat');
    expect(WEAPONS.paintball.special).toBe('waterCannon');
    expect(SHIPS.duck.flame, 'the duck blows bubbles').toBe('bubbleJets');
    expect(FLAMES.bubbleJets.look).toBe('bubbles');
  });

  it('opens after five things bought at Cosmo’s, and the band counts them down', () => {
    expect(GOLFERS.mmxxvi.opens).toEqual({ after: [], crashes: 0, bought: 5 });
    expect(lockHint(GOLFERS.mmxxvi.opens, pilotRecord(initialHangar), 'MMXXVI')).toBe('Buy 5 more things at Cosmo’s to fly MMXXVI');
    expect(lockHint(GOLFERS.mmxxvi.opens, pilotRecord(bought(4)), 'MMXXVI')).toBe('Buy 1 more thing at Cosmo’s to fly MMXXVI');
    expect(waresBought(bought(5))).toBe(5);
    expect(pilotOpen('mmxxvi', pilotRecord(bought(4)))).toBe(false);
    expect(pilotOpen('mmxxvi', pilotRecord(bought(5)))).toBe(true);
  });
});

describe('0595 — the paintball marker fires a scattered string of paint', () => {
  it('one ball a volley, a little off straight ahead and never all the same way, in every colour in the hopper', () => {
    const { world, frame } = inTheDuck();
    const angles = new Set<string>();
    const pictures = new Set<number>();
    let widest = 0;
    for (let step = 0; step < 10 * STEPS_PER_SECOND; step++) {
      const before = world.playerShots.size;
      frame.step();
      for (let i = before; i < world.playerShots.size; i++) {
        const ball = world.playerShots.at(i);
        const angle = Math.atan2(ball.velAcross, ball.velAlong - world.scrollPerStep);
        widest = Math.max(widest, Math.abs(angle));
        angles.add(angle.toFixed(4));
        pictures.add(ball.sprite);
      }
      expect(world.playerShots.size - before, 'more than one ball left in a volley').toBeLessThanOrEqual(1);
    }
    expect(angles.size, 'every ball left the same way, so the string was not scattered').toBeGreaterThan(10);
    // The scatter in degrees, as the player sees it: a little, never more than the row's.
    expect((widest * 180) / Math.PI, 'a ball left further off straight ahead than the scatter').toBeLessThanOrEqual((PAINT.scatter * 180) / Math.PI + 0.01);
    expect((widest * 180) / Math.PI, 'the scatter is too slight to see').toBeGreaterThan(2);
    const place = world.level.theme;
    for (const colour of PAINT.colours) {
      expect(pictures.has(colour.ball), `${place}: ${colour.not.includes(place) ? 'a ball came out' : 'no ball came out'} ${colour.ink}`).toBe(!colour.not.includes(place));
    }
  });

  /*
    ⚠️ **IN EVERY PLACE, THE HOPPER HOLDS WHAT ITS ROW SAYS AND NOTHING ITS BULLETS WEAR** — the review of 0595. Which
    hues are a place's bullet's is argued on each colour's row (`not`); what is asked here is that the gun obeys it,
    and that no place is left with a hopper of one colour.
  */
  it('in every place, every colour its hopper holds and none it leaves out for the place’s own bullets', () => {
    for (const place of THEME_KINDS) {
      const { world, frame } = inTheDuck({ ...NO_LEVEL, theme: place });
      const pictures = new Set<number>();
      for (let step = 0; step < 6 * STEPS_PER_SECOND; step++) {
        const before = world.playerShots.size;
        frame.step();
        for (let i = before; i < world.playerShots.size; i++) pictures.add(world.playerShots.at(i).sprite);
      }
      const held = PAINT.colours.filter((colour) => !colour.not.includes(place));
      expect(held.length, `${place}'s hopper holds ${held.length} colour`).toBeGreaterThan(1);
      for (const colour of PAINT.colours) {
        expect(pictures.has(colour.ball), `${place}: ${colour.ink} ${colour.not.includes(place) ? 'came out where its bullets wear it' : 'never came out'}`).toBe(
          !colour.not.includes(place),
        );
      }
    }
  });

  it('0626 — no colour held in a place is the ink of a bullet that place fires', () => {
    /*
      Every place fires three inks since 0626, where 0595's review had one to weigh. A paintball of a bullet's colour
      beside the bullets is the thing `not` exists to refuse; measured here, so a bullet recoloured into a held paint
      is refused rather than left to a hand-kept list.
    */
    for (const place of THEME_KINDS) {
      const foe = THEMES[place].foe;
      const fired = [foe.shot!, ...Object.values(foe.shots ?? {})];
      for (const colour of PAINT.colours) {
        if (colour.not.includes(place)) continue;
        for (const ink of fired) expect(sameInk(colour.ink, ink), `${place} holds ${colour.ink} and fires ${ink}`).toBe(false);
      }
    }
  });

  it('a ball that lands splats there, in its own colour, and the splat lands on a body beside the one it hit', () => {
    const { world, frame } = inTheDuck();
    // A body straight ahead for the ball, and one tucked behind it inside the splat's reach.
    bodyAt(world, 30, 0, 1000);
    bodyAt(world, 32, SHOTS.splat.radius * 0.6, 1000);
    const beside = world.enemies.at(1);
    const besideHealth = beside.health;
    let splat = null;
    // One ball and then the gun held, so the splat that comes can only be that ball's.
    for (let step = 0; step < STEPS_PER_SECOND && world.playerShots.size === 0; step++) frame.step();
    expect(world.playerShots.size, 'the marker fired nothing').toBe(1);
    world.fireIn = Number.MAX_SAFE_INTEGER;
    const ball = world.playerShots.at(0).sprite;
    // 0610: the blast lands the splat and is gone the next step; what is left to see is the paint pool's.
    let landed = false;
    for (let step = 0; step < 4 * STEPS_PER_SECOND && splat === null; step++) {
      frame.step();
      for (let i = 0; i < world.blasts.size; i++) if (world.blasts.at(i).kind === SPLAT_KIND) landed = true;
      for (let i = 0; i < world.paint.size; i++) splat = world.paint.at(i);
    }
    expect(landed, 'no ball went off where it landed').toBe(true);
    expect(splat, 'no ball splatted where it landed').not.toBe(null);
    expect(splat!.radius).toBe(SHOTS.splat.radius);
    const wet = PAINT.colours.map((c) => c.splat);
    expect(wet, 'the splat is not wet paint').toContain(splat!.sprite);
    expect(splat!.sprite, 'the splat is not the colour of the ball that made it').toBe(PAINT.colours.find((c) => c.ball === ball)!.splat);
    expect(beside.health, 'the splat landed on nothing beside the body the ball hit').toBeLessThan(besideHealth);
    // And it dries flat before it goes, still holding where it landed.
    for (let i = 0; i < 20; i++) frame.step();
    expect(PAINT.colours.map((c) => c.dry), 'the splat never dried').toContain(splat!.sprite);
  });

  it('the hangar’s glyph is the marker, and every ball and splat is drawn in its own colour', () => {
    expect(PAINT.colours.map((c) => c.ball), 'the gun’s glyph is a ball, not the marker').not.toContain(WEAPONS.paintball.glyph);
    expect(PAINT.colours.map((c) => c.ball), 'the shot’s own picture is not a ball that flies').toContain(SHOTS.paintball.sprite);
    const palette = PALETTES[DEFAULT_PALETTE];
    // The ball and the wet splat in the ink itself; dried, the splat is that ink in shade.
    for (const colour of PAINT.colours) {
      for (const sprite of [colour.ball, colour.splat]) {
        const { pen, trace } = tracingPen();
        drawKind(pen, SPRITE_KINDS[sprite]!, palette, 200, 'approach');
        expect(trace.passes.some((pass) => pass.colour.toLowerCase() === colour.ink.toLowerCase()), `${SPRITE_KINDS[sprite]} is not drawn in ${colour.ink}`).toBe(true);
      }
    }
  });
});

describe('0595 — the Water Cannon sweeps a jet of water across the lane', () => {
  it('plays for two seconds from the gun, swinging both ways across the nose, and its last water flies on after it', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    expect(canThrow(world, 'waterCannon')).toBe(true);
    launchSpecial(world, 'waterCannon');
    expect(canThrow(world, 'waterCannon'), 'a second press while it plays was taken').toBe(false);
    let laid = 0;
    let up = false;
    let down = false;
    for (let step = 0; step < JET.steps + JET.flight + 30; step++) {
      frame.step();
      const link = jetLink(world);
      if (link === null) continue;
      laid++;
      const nozzle = streamAngle(link.spin, JET.sweep, JET.period);
      if (link.spin < JET.steps && nozzle > JET.sweep * 0.8) down = true;
      if (link.spin < JET.steps && nozzle < -JET.sweep * 0.8) up = true;
      // Laid at the muzzle, its oldest water as far out as it has flown — 0616: the length, once it has had a flight.
      expect(link.along - (world.ship.along + world.shipRow.muzzle.along), 'the jet does not leave the muzzle').toBeCloseTo(0, 5);
      expect(Math.hypot(link.fromAlong, link.fromAcross)).toBeCloseTo(SPEED * streamOldest(link.spin, JET.flight), 5);
    }
    // The nozzle plays for its two seconds, and what it fired last is in the air for a flight after.
    expect(laid, 'the jet did not play for its two seconds and its water’s flight').toBe(JET.steps + JET.flight);
    expect(up && down, 'the jet did not swing across both sides of the nose').toBe(true);
    expect(world.jetFor).toBe(0);
    expect(canThrow(world, 'waterCannon')).toBe(true);
  });

  it('lands on a body off to the side that the gun would never reach, on its own clock', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    // Forty units ahead and off to the side by most of the swing's reach there.
    const off = Math.sin(JET.sweep * 0.9) * 40;
    bodyAt(world, 40, off, 1000);
    const enemy = world.enemies.at(0);
    const health = enemy.health;
    launchSpecial(world, 'waterCannon');
    for (let step = 0; step < JET.steps; step++) frame.step();
    const took = health - enemy.health;
    expect(took, 'the jet never landed on a body it swept across').toBeGreaterThan(0);
    // No faster than its clock: one landing every `landGap`, a few owed at once (0391's bucket).
    expect(took / JET.damage, 'it landed faster than its own clock lets it').toBeLessThanOrEqual(JET.steps / JET.landGap + 4);
  });

  /*
    ⚠️ **AND AS WIDE AS IT IS DRAWN, AT ITS TIP AS AT ITS NOZZLE — 0610**, the other half of 0250's rule. The spray
    opens from the nozzle to its tip; one that opened in the picture and landed as the old column would be water
    the player watched pass over a body and do nothing to it. A body just inside the spray's edge near its tip,
    on the first step, when the spray points straight ahead.
  */
  it('lands as wide as it is drawn, out to the edge of its spray near the tip', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'waterCannon');
    // 0616: once its water has flown its length, so there is a tip to be near.
    for (let i = 0; i < JET.flight; i++) frame.step();
    // Where the stream will be on the next step, nine tenths of the way out, and just inside its edge there.
    const clock = JET.flight;
    const age = JET.flight * 0.9;
    const edge = streamWidth(age, JET.flight, JET.width, JET.tipWidth, JET.flare);
    const tA = streamAlong(clock, age + 0.5, JET.sweep, JET.period, SPEED) - streamAlong(clock, age - 0.5, JET.sweep, JET.period, SPEED);
    const tC = streamAcross(clock, age + 0.5, JET.sweep, JET.period, SPEED) - streamAcross(clock, age - 0.5, JET.sweep, JET.period, SPEED);
    const run = Math.hypot(tA, tC);
    const off = edge + ENEMIES.drifter.radius * 0.9;
    const muzzle = world.shipRow.muzzle;
    // Off the ship, which rides the camera on the next step as the body does.
    bodyAt(
      world,
      muzzle.along + streamAlong(clock, age, JET.sweep, JET.period, SPEED) + (-tC / run) * off,
      muzzle.across + streamAcross(clock, age, JET.sweep, JET.period, SPEED) + (tA / run) * off,
      1e6,
    );
    const enemy = world.enemies.at(0);
    expect(edge - JET.width, 'the spray does not open, so this asks nothing').toBeGreaterThan(1);
    frame.step();
    expect(enemy.health, 'the spray was drawn over a body at its edge and did not land on it').toBeLessThan(1e6);
  });

  /*
    ⚠️ **IN THE PLAYER'S UNITS: WHERE IT LANDS AGAINST WHERE IT IS DRAWN** — the review of 0595, on 0027 and 0036.
    The test above asks only that a landing happened; the sweep was moved on between laying the picture and
    landing it, so the jet landed one step further round than it was drawn — about four units at the tip, nearly
    twice its half-width. A body on the nose near the tip is where the sweep is quickest, so it is where the two
    come furthest apart.
  */
  it('lands only where it is drawn, every step of it, the last included', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    bodyAt(world, JET.length * 0.9, 0, 1e6);
    const enemy = world.enemies.at(0);
    launchSpecial(world, 'waterCannon');
    let landed = 0;
    for (let step = 0; step < JET.steps + JET.flight; step++) {
      const before = enemy.health;
      frame.step();
      if (before - enemy.health <= 0) continue;
      landed++;
      const link = jetLink(world);
      expect(link, `step ${step}: the jet landed with nothing drawn`).not.toBeNull();
      // 0616: the stream the link was laid on, bowed as it is drawn, and as wide as it is drawn along it.
      expect(link!.radius * link!.swell, 'the spray is drawn at a width other than the one it lands at').toBeCloseTo(JET.tipWidth, 9);
      const off = outside(streamOf(link!), enemy.along, enemy.across);
      expect(off, `step ${step}: it landed on a body ${off.toFixed(2)} units off the spray drawn that step`).toBeLessThanOrEqual(enemy.radius + 1e-6);
    }
    expect(landed, 'the jet never landed on the body it swept across').toBeGreaterThan(0);

    // And on its last step: a body on the last of its water in the air is landed on — 0616, after the nozzle has stopped.
    const { world: last, frame: lastFrame } = inTheDuck();
    last.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(last, 'waterCannon');
    const final = JET.steps + JET.flight - 2;
    for (let step = 0; step < final; step++) lastFrame.step();
    // The last two parcels in the air on that step, the oldest and the one after it.
    const age = JET.flight - 0.5;
    bodyAt(last, last.shipRow.muzzle.along + streamAlong(final, age, JET.sweep, JET.period, SPEED), last.shipRow.muzzle.across + streamAcross(final, age, JET.sweep, JET.period, SPEED), 1e6);
    const late = last.enemies.at(last.enemies.size - 1);
    const health = late.health;
    lastFrame.step();
    expect(health - late.health, 'the jet’s last water was drawn and landed nothing').toBeGreaterThan(0);
    lastFrame.step();
    expect(last.jetFor).toBe(0);
  });

  it('between steps, its root is drawn on the muzzle where the ship is drawn', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    // Flying across the lane, so the ship's last place and this one are apart.
    world.ship.velAcross = 0.8;
    launchSpecial(world, 'waterCannon');
    for (let i = 0; i < 6; i++) frame.step();
    let link: Entity | null = null;
    for (let i = 0; i < world.bolts.size; i++) if (world.bolts.at(i).kind === JET_BOLT_KIND) link = world.bolts.at(i);
    expect(link, 'no jet was drawn').not.toBeNull();
    expect(Math.abs(world.ship.across - world.ship.prevAcross), 'the ship did not move, so this asks nothing').toBeGreaterThan(0.1);
    // The painter's own interpolation, at the start of the step: the jet's root against the ship's muzzle there.
    // 0616: the link is laid at the root, so where it was is where the root was.
    const rootAcross = link!.prevAcross;
    const muzzleAcross = world.ship.prevAcross + world.shipRow.muzzle.across;
    expect(rootAcross, 'the jet’s root is drawn a step ahead of the muzzle it plays from').toBeCloseTo(muzzleAcross, 6);
  });

  it('ends with the ship that played it, at the wreck and not when the beat is over', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'waterCannon');
    frame.step();
    expect(world.jetFor).toBeGreaterThan(0);
    // The death beat, as the frame counts it: the ship is a wreck for these steps.
    world.dyingIn = 30;
    frame.step();
    expect(world.jetFor, 'the jet played on through the wreck').toBe(0);
    let laid = 0;
    for (let i = 0; i < world.bolts.size; i++) if (world.bolts.at(i).kind === JET_BOLT_KIND) laid++;
    expect(laid, 'a jet was drawn from the wreck').toBe(0);
  });

  /*
    ⚠️ **A SPRAY AND NOT A LASER, IN PIXELS — 0610**, on 0027. *"The watergun special looks kind of like a laser
    instead of a water spray."* It was one held column in a beam's stack of light. What is asked here is what the
    player sees: strands of water, laid over the frame rather than added to it, opening from the nozzle's width to
    the tip's — as wide as it lands at both ends and never wider (0250) — with drops and mist blitted off it.
  */
  it('is painted as a spray as wide as it lands, opening from the nozzle to its tip, with its drops and mist, at its stated cost', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'waterCannon');
    for (let i = 0; i < 20; i++) frame.step();
    const calls: { points: number[]; count: number; width: number; tone: BoltTone; look: BoltLook | undefined }[] = [];
    const blits: number[] = [];
    const surface: Surface = {
      clear(): void {},
      blit(sprite: number): void {
        blits.push(sprite);
      },
      bolt(points: Float32Array, count: number, width: number, _alpha: number, tone: BoltTone, look?: BoltLook): void {
        calls.push({ points: Array.from(points.subarray(0, count * 2)), count, width, tone, look });
      },
    };
    paintBolts(surface, world.view, world.bolts, world.cameraAlong, 1);
    expect(calls.length, 'the jet is not its stated number of strokes').toBe(STROKES_PER_JET);
    // 0616: at most its stated blits — a drop is drawn only off water that was fired, so none before the press.
    expect(blits.length, 'the jet is over its stated number of blits').toBeLessThanOrEqual(BLITS_PER_JET);
    for (const sprite of blits) expect([SPRITE.sprayDrop, SPRITE.sprayMist], 'the jet blitted something that is not its spray').toContain(sprite);
    expect(blits, 'the jet threw no drops').toContain(SPRITE.sprayDrop);
    expect(blits, 'the jet’s tip is not mist').toContain(SPRITE.sprayMist);
    for (const c of calls) {
      expect(c.tone, 'a stroke of the jet is not in the water’s inks').toBe(BOLT_WATER);
      expect(c.look, 'a stroke of the jet is a column of light, not water').toBe(BOLT_SPRAY);
    }
    // Water is laid over the frame: the body of a strand is not added to it as a laser's light is.
    const body = SPRAY_LAYERS.find((l) => l.width === 4);
    expect(body, 'no layer of a strand is the width it lands at — 0250').toBeDefined();
    expect(body!.additive, 'the spray’s body is light added to the frame').toBe(false);
    expect(Math.max(...SPRAY_LAYERS.map((l) => l.width)), 'a strand is drawn wider than it lands').toBe(4);
    /*
      In pixels: the half-width of the spray, measured off the strokes against the stream it was laid on — 0616,
      which bows, so each vertex is measured from the nearest of the stream's middle and against the width it
      lands at there.
    */
    const link = jetLink(world)!;
    const scale = world.view.scale;
    const middle = streamOf(link, 16).map((p) => ({ ...p, x: screenX(world.view, p.along - world.cameraAlong, p.across), y: screenY(world.view, p.along - world.cameraAlong, p.across) }));
    const tip = middle[middle.length - 1]!;
    expect(Math.hypot(tip.along - link.along, tip.across - link.across), 'the spray is not the length it lands to').toBeCloseTo(JET.length, 3);
    let atRoot = 0;
    let atTip = 0;
    for (const c of calls) {
      // A strand's body is four times the width it is handed, and its half is two.
      const half = c.width * 2;
      for (let v = 0; v < c.count; v++) {
        const px = c.points[v * 2]!;
        const py = c.points[v * 2 + 1]!;
        let nearest = middle[0]!;
        for (const p of middle) if (Math.hypot(px - p.x, py - p.y) < Math.hypot(px - nearest.x, py - nearest.y)) nearest = p;
        const side = Math.hypot(px - nearest.x, py - nearest.y) + half;
        // Within a sample's spacing of where the spray lands, which the sampling allows.
        const lands = nearest.width * scale + (SPEED / 16) * scale;
        expect(side, `a strand is drawn ${(side / scale).toFixed(2)} units off the stream where the spray lands ${(nearest.width).toFixed(2)}`).toBeLessThanOrEqual(lands + 1e-6);
        if (v === 0) atRoot = Math.max(atRoot, side);
        if (v === c.count - 1) atTip = Math.max(atTip, side);
      }
    }
    // To the screen buffer's own precision: its points are single floats.
    expect(atRoot / scale, 'the spray does not leave the nozzle at its width there').toBeCloseTo(JET.width, 4);
    expect(atTip / scale, 'the spray does not open toward its tip').toBeGreaterThan(JET.width * 2);
    expect(atTip / scale, 'the spray is drawn much narrower at its tip than it lands').toBeGreaterThan(JET.tipWidth * 0.75);
  });

  it('is drawn under every hostile shot, in the player’s water and never the other side’s frost', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'waterCannon');
    for (let i = 0; i < 5; i++) frame.step();
    // A hostile shot on the field, where the jet is playing.
    const shot = world.enemyShots.spawn()!;
    reset(shot, world.ship.along + 30, world.ship.across, SHOTS.spit);
    const order: string[] = [];
    world.surface = {
      clear(): void {},
      blit(sprite: number): void {
        order.push(sprite === shot.sprite ? 'bullet' : 'other');
      },
      bolt(_points: Float32Array, _count: number, _width: number, _alpha: number, tone: BoltTone): void {
        order.push(tone === BOLT_WATER ? 'water' : 'bolt');
      },
    };
    frame.draw(1);
    const firstBullet = order.indexOf('bullet');
    const lastWater = order.lastIndexOf('water');
    expect(firstBullet, 'the hostile shot was not drawn, so this measures nothing').toBeGreaterThanOrEqual(0);
    expect(lastWater, 'the jet was not drawn, so this measures nothing').toBeGreaterThanOrEqual(0);
    expect(lastWater, 'a stroke of the jet was drawn over a hostile shot').toBeLessThan(firstBullet);
    // 0081: the player's fire is never in the ink of what is trying to kill them.
    expect(INK_OF.pickupWater, 'the Water Cannon’s face is in the other side’s ink').toBe('water');
    const mount = readFileSync(resolve(fileURLToPath(new URL('..', import.meta.url)), 'src/app/mount.ts'), 'utf8');
    const calls = mount.match(/boltInks\([^;]*\);/g) ?? [];
    expect(calls.length, 'no call that hands the bolts their inks was found').toBeGreaterThan(0);
    for (const call of calls) expect(call, 'the jet is handed an ink other than the player’s water').toContain('colours.water, colours.impact));');
  });

  /*
    ── HEARD — `docs/decisions/0599-the-water-and-the-paint-are-heard.md` ───────────────────────────────────

    ⚠️ **IN SECONDS, BECAUSE THAT IS WHAT THE GAP WAS IN.** The cannon's cue was 0.6 s and its jet 2 s: three
    quarters of the jet was a column of water sweeping the lane in silence, which no table of cues could show.
  */
  it('is heard from the press to its last step, with no gap in it', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    const heard: [number, number][] = [];
    world.onCue = (kind): void => {
      if (kind === 'waterCannon' || kind === 'spray') heard.push([world.steps, cueSeconds(CUES[kind])]);
    };
    const start = world.steps;
    launchSpecial(world, 'waterCannon');
    for (let step = 0; step < JET.steps + 30; step++) frame.step();
    expect(heard.some(([, s]) => s === cueSeconds(CUES.waterCannon)), 'the cannon’s own cue was not heard').toBe(true);
    // Walk the jet's two seconds in hundredths: each must be inside some cue it played.
    const seconds = JET.steps / STEPS_PER_SECOND;
    let silent = 0;
    for (let t = 0; t < seconds; t += 0.01) {
      const covered = heard.some(([at, length]) => {
        const from = (at - start) / STEPS_PER_SECOND;
        return t >= from && t < from + length;
      });
      if (!covered) silent += 0.01;
    }
    expect(silent, `the jet played ${silent.toFixed(2)} s of its ${seconds} s in silence`).toBeLessThan(0.02);
    // And it stops with the jet: nothing struck after its last step.
    const last = Math.max(...heard.map(([at]) => at - start));
    expect(last / STEPS_PER_SECOND, 'the spray went on after the jet').toBeLessThan(seconds);
  });

  it('every body it lands on is heard, on every ship, and as the water rather than as the gun’s hit', () => {
    for (const ship of ['duck', 'firebird', 'estate', 'fighter'] as const) {
      const built = playableWorld(NO_LEVEL);
      const world = built.world;
      world.shipRow = fitted(SHIPS[ship], SHIPS[ship].weapon);
      world.weapon = weaponFor(world.shipRow, []);
      world.missileIn = Number.MAX_SAFE_INTEGER;
      world.fireIn = Number.MAX_SAFE_INTEGER;
      wearHull(world);
      const frame = new GameFrame(world);
      bodyAt(world, 40, 0, 1e6);
      const heard: string[] = [];
      world.onCue = (kind): void => {
        heard.push(kind);
      };
      launchSpecial(world, 'waterCannon');
      for (let step = 0; step < JET.steps; step++) frame.step();
      expect(world.enemies.at(0).health, `${ship}: the jet never landed, so this asks nothing`).toBeLessThan(1e6);
      expect(heard, `${ship}: the jet landed and was not heard`).toContain('douse');
      // Its gun held: no shot was in flight, so a `hit` could only be the jet's landing heard as the gun's.
      expect(heard, `${ship}: the jet's landing was heard as the gun's hit`).not.toContain('hit');
    }
  });

  it('a paintball that lands is heard splatting, where it lands', () => {
    const { world, frame } = inTheDuck();
    bodyAt(world, 30, 0, 1e6);
    const splats: number[] = [];
    world.onCue = (kind, across): void => {
      if (kind === 'splat') splats.push(across ?? Number.NaN);
    };
    for (let step = 0; step < STEPS_PER_SECOND; step++) frame.step();
    expect(splats.length, 'a ball landed and its splat was not heard').toBeGreaterThan(0);
    const enemy = world.enemies.at(0);
    for (const across of splats) expect(Math.abs(across - enemy.across), 'a splat was heard somewhere it did not land').toBeLessThan(enemy.radius + 2);
  });

  it('a life lost takes the jet with it', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'waterCannon');
    frame.step();
    expect(world.jetFor).toBeGreaterThan(0);
    // The shell's half of a lost life, on the step the next ship comes in — long before the jet would end.
    respawn(world);
    expect(world.jetFor, 'the jet outlived the ship that played it').toBe(0);
    frame.step();
    let laid = 0;
    for (let i = 0; i < world.bolts.size; i++) if (world.bolts.at(i).kind === JET_BOLT_KIND) laid++;
    expect(laid, 'the new ship came in still playing the last one’s jet').toBe(0);
  });

  it('is on the bomb pickup only once MMXXVI is open', () => {
    expect(SPECIALS.waterCannon.opensWith).toBe('mmxxvi');
    const face = BOMB_KINDS.indexOf('waterCannon');
    expect(face, 'the Water Cannon is no face of the bomb pickup').toBeGreaterThanOrEqual(0);
    expect(facesShut('bomb', pilotRecord(initialHangar))[face], 'a first-time player is offered the Water Cannon').toBe(true);
    expect(facesShut('bomb', pilotRecord(bought(5)))[face], 'MMXXVI is open and the Water Cannon is still shut').toBe(false);
  });
});

/*
  ⚠️ **THE WATER FLOWS — 0616**, in pixels on the screen the report was made on, off the strokes the painter lays:
  *"it's currently static and stiff and so doesn't feel like a water spray at all."* Four things a rod swung from
  the nozzle cannot do and water does: bow as it sweeps, run out from the nozzle when it opens, fly on off it when
  it stops, and carry its ripples out with it.
*/
describe('0622 — the Water Cannon’s end is wider and splashier', () => {
  it('bells out at its end, a third wider there than 0610’s cone, and as narrow as it was half way out', () => {
    /*
      Played: *"water gun special -> end needs to be a bit wider + splashier"*. In world units, which the painter
      draws and the frame lands on through one function (0250, held above): at its tip it opens past the 4 it
      opened to, and half way out it is within a tenth of the 2.7 it was, so the run of it is the stream it was.
    */
    expect(streamWidth(JET.flight, JET.flight, JET.width, JET.tipWidth, JET.flare), 'the end is no wider than 0610’s').toBeGreaterThanOrEqual(4 * 1.3);
    const half = streamWidth(JET.flight / 2, JET.flight, JET.width, JET.tipWidth, JET.flare);
    expect(Math.abs(half - 2.7), `half way out it is ${half.toFixed(2)} either side, where it was 2.7`).toBeLessThan(0.27);
  });

  it('throws a crown of splash off its tip, out to the sides and past it, in pixels', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'waterCannon');
    for (let i = 0; i < 20; i++) frame.step();
    const drops: { x: number; y: number }[] = [];
    const surface: Surface = {
      clear(): void {},
      blit(sprite: number, x: number, y: number): void {
        if (sprite === SPRITE.sprayDrop) drops.push({ x, y });
      },
      bolt(): void {},
    };
    paintBolts(surface, world.view, world.bolts, world.cameraAlong, 1);
    const link = jetLink(world)!;
    const middle = streamOf(link, 4);
    const tip = middle[middle.length - 1]!;
    const tipX = screenX(world.view, tip.along - world.cameraAlong, tip.across);
    const tipY = screenY(world.view, tip.along - world.cameraAlong, tip.across);
    const tipWidth = tip.width * world.view.scale;
    // A drop near the tip — within twice its width of it — and how many of those are out past the spray's own edge.
    const near = drops.filter((d) => Math.hypot(d.x - tipX, d.y - tipY) < tipWidth * 2.6);
    const flung = near.filter((d) => Math.hypot(d.x - tipX, d.y - tipY) > tipWidth * 0.5);
    expect(near.length, `${near.length} drops at the spray’s end`).toBeGreaterThanOrEqual(8);
    expect(flung.length, `${flung.length} drops thrown out from its end`).toBeGreaterThanOrEqual(4);
  });
});

describe('0616 — the Water Cannon’s water flows', () => {
  /** The strokes the painter lays for the jet after `steps` steps of it, at the end of the last. */
  function paintedAfter(steps: number) {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'waterCannon');
    for (let i = 0; i < steps; i++) frame.step();
    const strokes: number[][] = [];
    const surface: Surface = {
      clear(): void {},
      blit(): void {},
      bolt(points: Float32Array, count: number): void {
        strokes.push(Array.from(points.subarray(0, count * 2)));
      },
    };
    paintBolts(surface, world.view, world.bolts, world.cameraAlong, 1);
    const link = jetLink(world);
    const muzzleX = link === null ? 0 : screenX(world.view, link.along - world.cameraAlong, link.across);
    const muzzleY = link === null ? 0 : screenY(world.view, link.along - world.cameraAlong, link.across);
    return { world, link, strokes, muzzleX, muzzleY };
  }

  it('THE REPORTED ONE: it bows as the nozzle sweeps — its tip trails the nozzle round, in pixels', () => {
    // Laid at the middle of a swing, where the nozzle turns fastest and points straight ahead.
    const { world, link, strokes, muzzleX, muzzleY } = paintedAfter(JET.period + 1);
    expect(streamAngle(link!.spin, JET.sweep, JET.period), 'the nozzle is not at the middle of its swing').toBeCloseTo(0, 6);
    // The middle strand's far end, against the straight line the nozzle points along.
    const middle = strokes[(STROKES_PER_JET - 1) / 2]!;
    const tipX = middle[middle.length - 2]!;
    const tipY = middle[middle.length - 1]!;
    const aheadX = screenX(world.view, link!.along + 1 - world.cameraAlong, link!.across) - muzzleX;
    const aheadY = screenY(world.view, link!.along + 1 - world.cameraAlong, link!.across) - muzzleY;
    const run = Math.hypot(aheadX, aheadY);
    const off = Math.abs((tipX - muzzleX) * (aheadY / run) - (tipY - muzzleY) * (aheadX / run));
    expect(off, `the spray's tip is ${off.toFixed(0)} px off the line the nozzle points along: a rod, not water`).toBeGreaterThan(100);
  });

  it('runs out from the nozzle when it opens, at the water’s speed', () => {
    const lengths: number[] = [];
    for (const steps of [3, 6, 9]) {
      const { world, strokes, muzzleX, muzzleY } = paintedAfter(steps);
      const edge = strokes[0]!;
      lengths.push(Math.hypot(edge[edge.length - 2]! - muzzleX, edge[edge.length - 1]! - muzzleY) / world.view.scale);
    }
    // Three steps of flight between each — the water's speed, give or take the edge's own width.
    expect(lengths[1]! - lengths[0]!, `it ran out ${(lengths[1]! - lengths[0]!).toFixed(1)} units in three steps`).toBeGreaterThan(SPEED * 3 - JET.tipWidth);
    expect(lengths[2]! - lengths[1]!, `it ran out ${(lengths[2]! - lengths[1]!).toFixed(1)} units in three steps`).toBeGreaterThan(SPEED * 3 - JET.tipWidth);
    expect(lengths[2]!, 'it opened at its full length').toBeLessThan(JET.length * 0.8);
  });

  it('flies on off the nozzle when it stops: the last of its water leaves it, still drawn', () => {
    const gaps: number[] = [];
    for (const after of [2, 5, 8]) {
      const { world, link, strokes, muzzleX, muzzleY } = paintedAfter(JET.steps + after);
      expect(link, `${after} steps after the nozzle stopped, the water in the air is not drawn`).not.toBeNull();
      expect(strokes.length).toBe(STROKES_PER_JET);
      const edge = strokes[0]!;
      gaps.push(Math.hypot(edge[0]! - muzzleX, edge[1]! - muzzleY) / world.view.scale);
    }
    // The back of the stream leaves the nozzle at the water's speed, give or take its own width there.
    expect(gaps[0]!, 'the stream is still on the nozzle after the nozzle stopped').toBeGreaterThan(SPEED);
    expect(gaps[1]! - gaps[0]!, 'the back of the stream did not fly on').toBeGreaterThan(SPEED * 3 - JET.tipWidth);
    expect(gaps[2]! - gaps[1]!, 'the back of the stream did not fly on').toBeGreaterThan(SPEED * 3 - JET.tipWidth);
  });

  it('its ripples ride out with its water, and do not boil in place', () => {
    // An edge strand's dent in from the spray's edge, as a share of what it may be at that age, from one step to the next.
    function dents(steps: number): { age: number; dent: number }[] {
      const { world, link, strokes } = paintedAfter(steps);
      const middle = streamOf(link!, 16).map((p) => ({ ...p, x: screenX(world.view, p.along - world.cameraAlong, p.across), y: screenY(world.view, p.along - world.cameraAlong, p.across) }));
      const edge = strokes[0]!;
      const out: { age: number; dent: number }[] = [];
      for (let v = 0; v < edge.length / 2; v++) {
        let nearest = middle[0]!;
        for (const p of middle) if (Math.hypot(edge[v * 2]! - p.x, edge[v * 2 + 1]! - p.y) < Math.hypot(edge[v * 2]! - nearest.x, edge[v * 2 + 1]! - nearest.y)) nearest = p;
        const off = Math.hypot(edge[v * 2]! - nearest.x, edge[v * 2 + 1]! - nearest.y) / world.view.scale;
        if (nearest.age < 3) continue;
        out.push({ age: nearest.age, dent: (nearest.width - JET.width - off) / (nearest.age / JET.flight) });
      }
      return out;
    }
    const at = (list: { age: number; dent: number }[], age: number): number => {
      for (let i = 1; i < list.length; i++) {
        const a = list[i - 1]!;
        const b = list[i]!;
        if (age >= a.age && age <= b.age) return a.dent + ((b.dent - a.dent) * (age - a.age)) / (b.age - a.age);
      }
      return Number.NaN;
    };
    const now = dents(40);
    const next = dents(41);
    let carried = 0;
    let still = 0;
    let n = 0;
    for (const { age, dent } of now) {
      const rode = at(next, age + 1);
      const stayed = at(next, age);
      if (!Number.isFinite(rode) || !Number.isFinite(stayed)) continue;
      carried += Math.abs(rode - dent);
      still += Math.abs(stayed - dent);
      n++;
    }
    expect(n, 'too little of the strand to compare').toBeGreaterThan(6);
    expect(carried / n, `a ripple a step on is ${(carried / n).toFixed(3)} from where its water went, ${(still / n).toFixed(3)} from where it was`).toBeLessThan((still / n) * 0.5);
  });
});

describe('0595 — Bubble Jets', () => {
  it('the duck’s own, burned on another ship once both are won in, on the shells’ rule', () => {
    expect(ownFit('duck').flame).toBe('bubbleJets');
    expect(initialHangar.flame.duck).toBe('bubbleJets');
    expect(flameOpen(initialHangar, 'duck', 'bubbleJets')).toBe(true);
    for (const ship of SHIP_KINDS) if (ship !== 'duck') expect(flameOpen(initialHangar, ship, 'bubbleJets'), ship).toBe(false);
    const won = { ...initialHangar, won: { ...initialHangar.won, duck: true, fighter: true } };
    expect(flameOpen(won, 'fighter', 'bubbleJets')).toBe(true);
    expect(flameOpen(won, 'caddie', 'bubbleJets'), 'the caddie has not been won in').toBe(false);
  });

  it('are drawn as bubbles — rings — where every other flame is a tongue of fire', () => {
    const palette = PALETTES[DEFAULT_PALETTE];
    const traced = (flame: 'standard' | 'bubbleJets'): string => {
      const { pen, trace } = tracingPen();
      withFlame(flame, () => drawKind(pen, 'thrustBurn0', palette, 200, 'approach'));
      return JSON.stringify(trace.passes.map((p) => p.subpaths));
    };
    expect(traced('bubbleJets'), 'the bubbles are the standard flame drawn again').not.toBe(traced('standard'));
  });
});

/*
  ── THE PAINT STICKS — `docs/decisions/0610-the-paint-sticks.md` ─────────────────────────────────────────────

  *"The paint ball splats need to 'paint' the bosses and mini bosses, and hit walls and obstructions and fade away
  after 2-3 secs."* Through the real step: a ball the marker fired, landing through the pairings and the stone
  that exist. **In the player's units**: seconds the paint stays, where it is against the body it is on, and the
  order it is drawn in.
*/

/** A boss `along` ahead of the ship, on its line, that takes a string of paint and gives nothing back. */
function bossAhead(world: World, along: number): Entity {
  const boss = world.bossPool.spawn()!;
  reset(boss, world.ship.along + along, world.ship.across, BOSSES.sentinel);
  boss.health = 1e6;
  world.bossFullHealth = 1e6;
  boss.fireIn = Number.MAX_SAFE_INTEGER;
  return boss;
}

/** Fire until one ball is in the air, then hold the gun, so every splat after is that ball's. */
function oneBall(world: World, frame: GameFrame): Entity {
  for (let step = 0; step < STEPS_PER_SECOND && world.playerShots.size === 0; step++) frame.step();
  expect(world.playerShots.size, 'the marker fired nothing').toBe(1);
  world.fireIn = Number.MAX_SAFE_INTEGER;
  return world.playerShots.at(0);
}

describe('0610 — the paint sticks', () => {
  it('a splat on a boss is on the boss, in the ball’s colour, and rides it as it moves', () => {
    const { world, frame } = inTheDuck();
    const boss = bossAhead(world, 40);
    const ball = oneBall(world, frame).sprite;
    for (let step = 0; step < 2 * STEPS_PER_SECOND && world.paint.size === 0; step++) frame.step();
    expect(world.paint.size, 'the ball landed on the boss and left no paint').toBe(1);
    const mark = world.paint.at(0);
    const colour = PAINT.colours.find((c) => c.ball === ball)!;
    expect(mark.sprite, 'the paint is not the colour of the ball that made it').toBe(colour.splat);
    expect(mark.onBody, 'the paint is not on the boss').toBe(0);
    // On the animal: its centre inside the hull it hit, so the paint is drawn on it and not off its rim.
    const offAlong = mark.along - boss.along;
    const offAcross = mark.across - boss.across;
    expect(Math.hypot(offAlong, offAcross), 'the paint is off the boss’s body').toBeLessThanOrEqual(boss.radius);
    // The boss moves across the lane and down it; the paint goes with it, where it was on it.
    const from = { along: boss.along, across: boss.across };
    for (let step = 0; step < STEPS_PER_SECOND; step++) {
      boss.velAcross = 0.6;
      frame.step();
      expect(world.paint.size, 'the paint fell off the boss').toBe(1);
      expect(mark.along - boss.along, 'the paint slid down the boss').toBeCloseTo(offAlong, 9);
      expect(mark.across - boss.across, 'the paint slid across the boss').toBeCloseTo(offAcross, 9);
      // And between steps, where the painter draws it: from the boss's last place, not its own.
      expect(mark.prevAcross - boss.prevAcross, 'the paint is drawn a step behind the boss it is on').toBeCloseTo(offAcross, 9);
    }
    expect(Math.hypot(boss.along - from.along, boss.across - from.across), 'the boss never moved, so this asks nothing').toBeGreaterThan(20);
    expect(PAINT.colours.map((c) => c.dry), 'the paint on the boss never dried').toContain(mark.sprite);
  });

  it('and turns with a boss that turns', () => {
    const { world, frame } = inTheDuck();
    const boss = bossAhead(world, 40);
    oneBall(world, frame);
    for (let step = 0; step < 2 * STEPS_PER_SECOND && world.paint.size === 0; step++) frame.step();
    const mark = world.paint.at(0);
    const reach = Math.hypot(mark.along - boss.along, mark.across - boss.across);
    const was = Math.atan2(mark.across - boss.across, mark.along - boss.along);
    boss.turn = 0.9;
    boss.prevTurn = 0.9;
    frame.step();
    const now = Math.atan2(mark.across - boss.across, mark.along - boss.along);
    expect(Math.hypot(mark.along - boss.along, mark.across - boss.across), 'the paint moved on the boss as it turned').toBeCloseTo(reach, 9);
    expect(now - was, 'the paint did not turn with the boss').toBeCloseTo(0.9, 9);
    expect(mark.turn, 'the splat is not drawn turned with the boss').toBeCloseTo(0.9, 9);
  });

  it('is drawn over the boss it is on and under every hostile shot', () => {
    const { world, frame } = inTheDuck();
    const boss = bossAhead(world, 40);
    oneBall(world, frame);
    for (let step = 0; step < 2 * STEPS_PER_SECOND && world.paint.size === 0; step++) frame.step();
    expect(world.paint.size, 'no paint to draw, so this measures nothing').toBe(1);
    const shot = world.enemyShots.spawn()!;
    reset(shot, boss.along, boss.across, SHOTS.spit);
    const paint = world.paint.at(0).sprite;
    const order: string[] = [];
    world.surface = {
      clear(): void {},
      blit(sprite: number): void {
        order.push(sprite === shot.sprite ? 'bullet' : sprite === boss.sprite ? 'boss' : sprite === paint ? 'paint' : 'other');
      },
      bolt(): void {},
    };
    frame.draw(1);
    expect(order.indexOf('boss'), 'the boss was not drawn, so this measures nothing').toBeGreaterThanOrEqual(0);
    expect(order.indexOf('paint'), 'the paint on the boss was drawn under it').toBeGreaterThan(order.lastIndexOf('boss'));
    expect(order.lastIndexOf('paint'), 'the paint was drawn over a hostile shot').toBeLessThan(order.indexOf('bullet'));
  });

  /*
    ⚠️ **IN SECONDS, BECAUSE THAT IS WHAT WAS ASKED** — *"fade away after 2-3 secs."* Read off what the painter is
    handed each frame: the alpha the splat is blitted at, from the step it lands to the step it is gone.
  */
  it('stays whole for over a second, fades, and is gone between two and three seconds after it lands', () => {
    const { world, frame } = inTheDuck();
    bodyAt(world, 30, 0, 1e6);
    oneBall(world, frame);
    for (let step = 0; step < 2 * STEPS_PER_SECOND && world.paint.size === 0; step++) frame.step();
    expect(world.paint.size, 'the ball left no paint').toBe(1);
    const alphas: number[] = [];
    world.surface = {
      clear(): void {},
      blit(sprite: number, _x: number, _y: number, _scale: number, _turn?: number, alpha?: number): void {
        if (PAINT.colours.some((c) => c.splat === sprite || c.dry === sprite)) alphas.push(alpha ?? 1);
      },
      bolt(): void {},
    };
    let steps = 0;
    while (world.paint.size > 0 && steps < 10 * STEPS_PER_SECOND) {
      const before = alphas.length;
      frame.draw(1);
      expect(alphas.length - before, 'the paint was not drawn while it stayed').toBe(1);
      frame.step();
      steps++;
    }
    const gone = steps / STEPS_PER_SECOND;
    expect(gone, `the paint was gone after ${gone.toFixed(2)} s`).toBeGreaterThanOrEqual(2);
    expect(gone, `the paint stayed ${gone.toFixed(2)} s`).toBeLessThanOrEqual(3);
    expect(gone, 'the paint does not stay its stated time').toBeCloseTo(SPLAT_STEPS / STEPS_PER_SECOND, 1);
    const whole = alphas.findIndex((a) => a < 1) / STEPS_PER_SECOND;
    expect(whole, `the paint began to fade ${whole.toFixed(2)} s after it landed`).toBeGreaterThan(1);
    expect((SPLAT_STEPS - PAINT_FADE_STEPS) / STEPS_PER_SECOND, 'the fade is not where the painter says').toBeCloseTo(whole, 1);
    for (let i = 1; i < alphas.length; i++) expect(alphas[i]!, 'the paint came back as it faded').toBeLessThanOrEqual(alphas[i - 1]!);
    expect(alphas[alphas.length - 1]!, 'the paint was still nearly whole on its last frame').toBeLessThan(0.05);
  });

  it('a ball that reaches the stone splats on it, and the paint stays on the stone as the wall goes by', () => {
    const kind = LEVEL_KINDS.find((k) => LEVELS[k].corridor !== undefined && LEVELS[k].corridor!.bank === undefined)!;
    const { world, frame } = inTheDuck(LEVELS[kind]);
    const corridor = world.corridor!;
    expect(corridor, `${kind} has no stone, so this asks nothing`).not.toBeNull();
    // The camera brought to the corridor, with everything that rides it.
    const by = corridor.from + 200 - world.cameraAlong;
    world.cameraAlong += by;
    world.prevCameraAlong += by;
    world.ship.along += by;
    world.ship.prevAlong += by;
    world.ship.across = ACROSS_SPAN / 2;
    world.ship.prevAcross = ACROSS_SPAN / 2;
    const ball = oneBall(world, frame);
    // Thrown hard at the far wall: what it meets there is the stone, nothing else.
    ball.velAcross = 3;
    let splat: Entity | null = null;
    let went = false;
    for (let step = 0; step < 2 * STEPS_PER_SECOND && splat === null; step++) {
      world.ship.health = world.shipRow.health;
      frame.step();
      for (let i = 0; i < world.blasts.size; i++) {
        const blast = world.blasts.at(i);
        if (blast.kind !== SPLAT_KIND) continue;
        went = true;
        expect(stoneAt(corridor, blast.along, blast.across, 0), 'the splat went off inside the stone, where it can see nothing').toBe(0);
      }
      for (let i = 0; i < world.paint.size; i++) splat = world.paint.at(i);
    }
    expect(went, 'the ball reached the stone and did not go off').toBe(true);
    expect(splat, 'the ball reached the stone and left no paint on it').not.toBeNull();
    expect(world.playerShots.size, 'the ball went on through the stone').toBe(0);
    const face = faceAt(corridor, splat!.along, 1);
    expect(splat!.across, 'the paint is not on the stone').toBeGreaterThan(face);
    expect(splat!.across - face, 'the paint is not at the wall’s face').toBeLessThan(SHOTS.splat.radius);
    // It holds station in the world, as the stone does: the camera moves on and the paint stays on the wall.
    const at = splat!.along;
    const cameraFrom = world.cameraAlong;
    for (let step = 0; step < STEPS_PER_SECOND; step++) {
      world.ship.health = world.shipRow.health;
      frame.step();
    }
    expect(world.cameraAlong - cameraFrom, 'the camera never moved, so this asks nothing').toBeGreaterThan(5);
    expect(world.paint.size, 'the paint left the wall within a second').toBe(1);
    expect(splat!.along, 'the paint slid along the wall').toBe(at);
    expect(faceAt(corridor, splat!.along, 1), 'the paint left the wall it is on').toBe(face);
  });

  it('a string of paint leaves the blast pool to the bombs, and never fills its own', () => {
    const { world, frame } = inTheDuck();
    bodyAt(world, 30, 0, 1e9);
    let blasts = 0;
    let paint = 0;
    for (let step = 0; step < 6 * STEPS_PER_SECOND; step++) {
      frame.step();
      blasts = Math.max(blasts, world.blasts.size);
      paint = Math.max(paint, world.paint.size);
    }
    expect(paint, 'the string left no paint').toBeGreaterThan(10);
    expect(paint, 'the string filled the paint pool, so a splat was dropped').toBeLessThan(world.paint.capacity);
    // One ball lands a step at most, and its blast is gone the step after.
    expect(blasts, 'the string’s splats stood in the blast pool').toBeLessThanOrEqual(2);
  });

  it('a life lost takes the paint with the ship that threw it, and a boss gone takes what was on it', () => {
    const { world, frame } = inTheDuck();
    bossAhead(world, 40);
    oneBall(world, frame);
    for (let step = 0; step < 2 * STEPS_PER_SECOND && world.paint.size === 0; step++) frame.step();
    expect(world.paint.size).toBe(1);
    respawn(world);
    expect(world.paint.size, 'the paint outlived the ship that threw it').toBe(0);
    world.fireIn = 0;
    for (let step = 0; step < 2 * STEPS_PER_SECOND && world.paint.size === 0; step++) frame.step();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    expect(world.paint.size, 'nothing landed on the boss the second time, so this asks nothing').toBeGreaterThan(0);
    expect(world.paint.at(0).onBody, 'the second ball’s paint is not on the boss').toBe(0);
    world.bossPool.releaseAt(0);
    frame.step();
    for (let i = 0; i < world.paint.size; i++) expect(world.paint.at(i).onBody, 'paint hung where a boss was').toBe(-1);
  });
});
