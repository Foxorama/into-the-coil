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

import { GameFrame, canThrow, launchSpecial, respawn, wearHull, type World } from '../src/app/frame.ts';
import { ENEMIES } from '../src/content/enemies.ts';
import { FLAMES } from '../src/content/flames.ts';
import { GOLFERS, pilotOpen } from '../src/content/golfers.ts';
import type { LevelRow } from '../src/content/levels.ts';
import { PALETTES, DEFAULT_PALETTE } from '../src/content/palette.ts';
import { BOMB_KINDS, facesShut, weaponFor } from '../src/content/pickups.ts';
import { SHIPS, SHIP_KINDS, fitted, ownFit } from '../src/content/ships.ts';
import { SHOTS } from '../src/content/shots.ts';
import { JET_BOLT_KIND, SPECIALS } from '../src/content/specials.ts';
import { CUES } from '../src/content/cues.ts';
import { cueSeconds } from '../src/app/sound.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { WEAPONS } from '../src/content/weapons.ts';
import { INK_OF, drawKind, withFlame } from '../src/render/bake.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STROKES_PER_JET, paintBolts } from '../src/render/scene.ts';
import { BOLT_BEAM, BOLT_WATER, type BoltLook, type BoltTone, type Surface } from '../src/render/surface.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { STEPS_PER_SECOND, lockHint } from '../src/state/screens.ts';
import { flameOpen, initialHangar, pilotRecord, waresBought } from '../src/state/slices/hangar.ts';
import { OWNABLE_KINDS, OWNABLES } from '../src/content/wares.ts';
import { tracingPen } from './paths.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

const PAINT = WEAPONS.paintball.paint!;
const JET = SPECIALS.waterCannon.jet!;

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
    for (let step = 0; step < 4 * STEPS_PER_SECOND && splat === null; step++) {
      frame.step();
      for (let i = 0; i < world.blasts.size; i++) splat = world.blasts.at(i);
    }
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
  it('plays for two seconds from the gun, swinging both ways across the nose, and stops', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    expect(canThrow(world, 'waterCannon')).toBe(true);
    launchSpecial(world, 'waterCannon');
    expect(canThrow(world, 'waterCannon'), 'a second press while it plays was taken').toBe(false);
    let laid = 0;
    let up = false;
    let down = false;
    for (let step = 0; step < JET.steps + 30; step++) {
      frame.step();
      for (let i = 0; i < world.bolts.size; i++) {
        const link = world.bolts.at(i);
        if (link.kind !== JET_BOLT_KIND) continue;
        laid++;
        const turn = Math.atan2(-link.fromAcross, -link.fromAlong);
        if (turn > JET.sweep * 0.8) down = true;
        if (turn < -JET.sweep * 0.8) up = true;
        // From the muzzle, as long as it reaches.
        expect(Math.hypot(link.fromAlong, link.fromAcross)).toBeCloseTo(JET.length, 5);
        expect(link.along - link.fromAlong * 0 + link.fromAlong - (world.ship.along + world.shipRow.muzzle.along), 'the jet does not leave the muzzle').toBeCloseTo(0, 5);
      }
    }
    expect(laid / STEPS_PER_SECOND, 'the jet did not play for its two seconds').toBeCloseTo(JET.steps / STEPS_PER_SECOND, 1);
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
    for (let step = 0; step < JET.steps; step++) {
      const before = enemy.health;
      frame.step();
      if (before - enemy.health <= 0) continue;
      landed++;
      let link: Entity | null = null;
      for (let i = 0; i < world.bolts.size; i++) if (world.bolts.at(i).kind === JET_BOLT_KIND) link = world.bolts.at(i);
      expect(link, `step ${step}: the jet landed with nothing drawn`).not.toBeNull();
      // The drawn column: from the muzzle (`along + from`) to its end (`along`).
      const ax = link!.along + link!.fromAlong;
      const ay = link!.across + link!.fromAcross;
      const dx = link!.along - ax;
      const dy = link!.across - ay;
      const t = Math.max(0, Math.min(1, ((enemy.along - ax) * dx + (enemy.across - ay) * dy) / (dx * dx + dy * dy)));
      const off = Math.hypot(enemy.along - (ax + t * dx), enemy.across - (ay + t * dy));
      expect(off, `step ${step}: it landed on a body ${off.toFixed(2)} units from the column drawn that step`).toBeLessThanOrEqual(
        JET.width + enemy.radius + 1e-6,
      );
    }
    expect(landed, 'the jet never landed on the body it swept across').toBeGreaterThan(0);

    // And on its last step: a body that arrives on the line the jet ends on is landed on.
    const { world: last, frame: lastFrame } = inTheDuck();
    last.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(last, 'waterCannon');
    for (let step = 0; step < JET.steps - 1; step++) lastFrame.step();
    const final = JET.sweep * Math.sin((Math.PI * 2 * (JET.steps - 1)) / JET.period);
    bodyAt(last, Math.cos(final) * JET.length * 0.6 + last.shipRow.muzzle.along, Math.sin(final) * JET.length * 0.6 + last.shipRow.muzzle.across, 1e6);
    const late = last.enemies.at(last.enemies.size - 1);
    const health = late.health;
    lastFrame.step();
    expect(last.jetFor).toBe(0);
    expect(health - late.health, 'the jet’s last step was drawn and landed nothing').toBeGreaterThan(0);
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
    const rootAcross = link!.prevAcross + link!.prevFromAcross;
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

  it('is painted as a held column of water as wide as it lands, with its drops, at its stated cost', () => {
    const { world, frame } = inTheDuck();
    world.fireIn = Number.MAX_SAFE_INTEGER;
    launchSpecial(world, 'waterCannon');
    for (let i = 0; i < 20; i++) frame.step();
    const calls: { count: number; width: number; tone: BoltTone; look: BoltLook | undefined }[] = [];
    const surface: Surface = {
      clear(): void {},
      blit(): void {},
      bolt(_points: Float32Array, count: number, width: number, _alpha: number, tone: BoltTone, look?: BoltLook): void {
        calls.push({ count, width, tone, look });
      },
    };
    paintBolts(surface, world.view, world.bolts, world.cameraAlong, 1);
    expect(calls.length, 'the jet is not its stated number of strokes').toBe(STROKES_PER_JET);
    for (const c of calls) expect(c.tone, 'a stroke of the jet is not in the water’s inks').toBe(BOLT_WATER);
    const columns = calls.filter((c) => c.look === BOLT_BEAM);
    expect(columns.length, 'the jet is not one held column').toBe(1);
    // A beam's body is four times the width it is handed, which is the width it lands at — 0250.
    expect(columns[0]!.width * 4).toBeCloseTo(2 * JET.width * world.view.scale, 6);
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
