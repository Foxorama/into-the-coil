/**
 * The finale — `docs/decisions/0418-the-heart-lets-go.md`, reshaped by
 * `docs/decisions/0426-the-finale-is-the-fight-going-on.md`.
 *
 * ⚠️ **THE PICTURE, IN PIXELS, ON `tests/intro.test.ts`'s TERMS.** The painter is a pure function of one
 * clock (`src/render/finale.ts`), so it is drawn into a surface that writes down every blit and asked
 * where things landed — and what the golfers say is asked in seconds, which is what a player reads in.
 * The one thing asked of the sim is the one thing 0426 is about: that the heart is still there, where
 * the fight had it, when the finale takes it.
 */

import { describe, expect, it } from 'vitest';
import { BOSS_DEATH_STEPS, GameFrame, advanceLevel, holdFinale } from '../src/app/frame.ts';
import { SKY } from '../src/app/mount.ts';
import { musicPlaceFor, placeFor } from '../src/app/music.ts';
import { THRUST } from '../src/content/exhaust.ts';
import {
  FINALE_BEATS,
  FINALE_CUES,
  FINALE_KINDS,
  LETTER_STEPS,
  LINE_LETTERS,
  OUTRO_STEPS,
  SAVED_BUBBLE,
  SAVED_MOUTH,
  SAVING_BUBBLE,
  SAVING_MOUTH,
  VIPER_GROW,
  blipsAt,
  fighterAt,
  lettersSaid,
  viperAt,
  type FinaleFrom,
  type FinaleKind,
} from '../src/content/finale.ts';
import { GOLFERS, GOLFER_KINDS, rescuable } from '../src/content/golfers.ts';
import { LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { PORT_EXTENT, PORT_SPRITE, type PortKind } from '../src/content/port.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { SHIP_BOX, SPRITE } from '../src/content/sprites.ts';
import { FINALE_BASE, PORT_BASE, makeFinaleScene, paintFinale, type FinaleScene } from '../src/render/finale.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { MAX_ASPECT, viewOf, type View } from '../src/sim/camera.ts';
import { SCREENS, SCREEN_KINDS, STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

interface Blit {
  sprite: number;
  x: number;
  y: number;
  scale: number;
  alpha: number;
}

class RecordingSurface implements Surface {
  blits: Blit[] = [];
  clear(): void {
    this.blits = [];
  }
  blit(sprite: number, x: number, y: number, scale: number, _turn = 0, alpha = 1): void {
    this.blits.push({ sprite, x, y, scale, alpha });
  }
  bolt(): void {}
}

/** The widest screen any device is given, and a 16:9 one — the narrowest. */
const WIDE = { width: Math.round(1000 * MAX_ASPECT), height: 1000 };
const NARROW = { width: 1920, height: 1080 };

/** Where fights can leave the heart and the fighter: the no-seat stand-in, and a spread either side of it. */
const FROMS: readonly FinaleFrom[] = [
  makeFinaleScene().from,
  { heartAlong: 100, heartAcross: 44, shipAlong: 30, shipAcross: 70 },
  { heartAlong: 190, heartAcross: 56, shipAlong: 60, shipAcross: 20 },
];

function sceneFor(from: FinaleFrom, ship: number): FinaleScene {
  const scene = makeFinaleScene();
  scene.sky = SKY;
  scene.throb = 0.07;
  scene.from = from;
  // The pilot's own ship — 0441. The scene opens on the fighter, and a run writes the one it flew.
  scene.ship = ship;
  return scene;
}

function drawAt(t: number, size = NARROW, from: FinaleFrom = FROMS[0]!, ship: number = SPRITE.fighter): { blits: Blit[]; view: View } {
  const view = viewOf(size.width, size.height);
  const surface = new RecordingSurface();
  paintFinale(surface, view, t, sceneFor(from, ship));
  return { blits: surface.blits, view };
}

const own = (kind: FinaleKind): number => FINALE_BASE + FINALE_KINDS.indexOf(kind);
const port = (kind: PortKind): number => PORT_BASE + PORT_SPRITE[kind];
const drawn = (t: number, sprite: number, size = NARROW, from?: FinaleFrom): Blit | undefined => drawAt(t, size, from).blits.find((b) => b.sprite === sprite);
const FIRE = [SPRITE.burst0, SPRITE.burst1, SPRITE.burst2, SPRITE.burst3];
const AT = new Float64Array(2);

describe('the finale is the run ending, and it ends on the victory screen', () => {
  it('has no panel, steps nothing, skips, and expires into the victory screen', () => {
    const row = SCREENS.outro;
    expect(row.heading, 'the finale grew words').toBe('');
    expect(row.actions, 'the finale grew a button').toEqual([]);
    expect(row.steps, 'the sim runs under a picture').toBe(false);
    expect(row.skips, 'the finale cannot be skipped').toBe(true);
    expect(row.timeout).toEqual({ steps: OUTRO_STEPS, then: 'victory' });
  });

  it('runs its beats in the order they are written', () => {
    const times = Object.values(FINALE_BEATS);
    for (let i = 1; i < times.length; i++) {
      expect(times[i]!, `${Object.keys(FINALE_BEATS)[i]} comes before the beat above it`).toBeGreaterThan(times[i - 1]!);
    }
    expect(FINALE_BEATS.end).toBe(OUTRO_STEPS);
  });
});

describe('the finale goes on from the fight — 0426', () => {
  /*
    Played: *"it doesn't flow nicely."* The jellyfish's death cleared the heart on its first step, and the
    finale faded up out of the backdrop on a heart staged somewhere else, with her back on it.
  */
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

  it('keeps the heart where she left it, holding station, through her whole death beat — and hands it over from there', () => {
    const { world } = playableWorld(MEDUSA_ONLY);
    const frame = new GameFrame(world);
    for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
      world.ship.health = world.shipRow.health;
      world.ship.invulnFor = 999;
      frame.step();
    }
    expect(world.bossPool.size, 'the jellyfish never arrived').toBe(1);
    expect(world.bossAura.size, 'the jellyfish has no heart under her').toBeGreaterThan(0);
    const seat = (): { along: number; across: number } => ({ along: world.bossAura.at(0).along - world.cameraAlong, across: world.bossAura.at(0).across });
    const was = seat();
    world.bossPool.clear();
    let cleared = false;
    world.onCleared = (): void => {
      cleared = true;
    };
    for (let i = 0; i < BOSS_DEATH_STEPS + 2 && !cleared; i++) {
      world.ship.health = world.shipRow.health;
      frame.step();
      expect(world.bossAura.size, `the heart went with her, ${i} steps into her death`).toBe(1);
      expect(Math.abs(seat().along - was.along), 'the heart drifted off its place in the view as she died').toBeLessThan(1e-6);
    }
    expect(cleared, 'her death beat never ended').toBe(true);
    holdFinale(world);
    expect(world.finale.from.heartAlong, 'the finale was handed a heart somewhere else').toBeCloseTo(was.along, 6);
    expect(world.finale.from.heartAcross).toBeCloseTo(was.across, 6);
    expect(world.finale.from.shipAlong).toBeCloseTo(world.ship.along - world.cameraAlong, 6);
    expect(world.finale.camera).toBe(world.cameraAlong);
    // And it is the place's, not the next one's: a new level takes it.
    advanceLevel(world, LEVELS[LEVEL_KINDS[0]!], 0);
    frame.step();
    expect(world.bossAura.size, 'the heart outlived its level').toBe(0);
  });

  it('opens on the fight’s last frame: no backdrop over it, the heart and the fighter exactly where the fight had them', () => {
    for (const size of [NARROW, WIDE]) {
      for (const from of FROMS) {
        const { blits, view } = drawAt(0, size, from);
        expect(blits.some((b) => b.sprite === port('veil')), 'the finale opens out of the backdrop, which is a cut').toBe(false);
        const heart = blits.find((b) => b.sprite === SPRITE.heart)!;
        expect(heart, 'no heart on the finale’s first frame').toBeDefined();
        expect(Math.hypot(heart.x - screenX(view, from.heartAlong, from.heartAcross), heart.y - screenY(view, from.heartAlong, from.heartAcross)), 'the heart jumped on the first frame').toBeLessThan(0.5);
        expect(heart.scale / view.scale, 'the heart changed size on the first frame').toBeLessThanOrEqual(1.08);
        const ship = blits.find((b) => b.sprite === SPRITE.fighter)!;
        expect(ship, 'no fighter on the finale’s first frame').toBeDefined();
        expect(Math.hypot(ship.x - screenX(view, from.shipAlong, from.shipAcross), ship.y - screenY(view, from.shipAlong, from.shipAcross)), 'the fighter jumped on the first frame').toBeLessThan(0.5);
      }
    }
  });

  it('races the heart, sets it on fire, and bursts it — with the Viper where it was', () => {
    expect(FIRE.some((s) => drawn(FINALE_BEATS.burst - 20, s) !== undefined), 'the heart bursts without fire breaking out of it first').toBe(true);
    expect(drawn(FINALE_BEATS.burst - 1, SPRITE.heart), 'no heart before it bursts').toBeDefined();
    expect(drawn(FINALE_BEATS.burst, SPRITE.heart), 'the heart outlasts its burst').toBeUndefined();
    expect(drawn(FINALE_BEATS.burst + 10, own('shard')), 'the heart bursts into nothing').toBeDefined();
    expect(drawn(FINALE_BEATS.burst + 10, own('ring')), 'the burst sends nothing out').toBeDefined();
    expect(drawn(FINALE_BEATS.burst - 1, port('viper')), 'the Viper is seen before the heart gives her up').toBeUndefined();
    const { blits, view } = drawAt(FINALE_BEATS.burst);
    const freed = blits.find((b) => b.sprite === port('viper'));
    const from = FROMS[0]!;
    expect(freed, 'the Viper is not there when the heart bursts').toBeDefined();
    expect(Math.hypot(freed!.x - screenX(view, from.heartAlong, from.heartAcross), freed!.y - screenY(view, from.heartAlong, from.heartAcross)), 'the Viper is not where the heart was').toBeLessThan(1);
  });

  it('has both ships leave the widest screen before the picture goes, and goes into the backdrop at the end', () => {
    // Every pilot's ship, in the one box every ship is drawn in — 0441. It was the fighter's 7-unit
    // hull; the box is the whole picture each ship may fill, so the box is what must be off the screen.
    for (const kind of SHIP_KINDS) {
      for (const from of FROMS) {
        const { blits, view } = drawAt(FINALE_BEATS.fadeOut, WIDE, from, SHIPS[kind].sprite);
        const viper = blits.find((b) => b.sprite === port('viper'))!;
        const fighter = blits.find((b) => b.sprite === SHIPS[kind].sprite)!;
        expect(fighter, `the ${kind} was not drawn, so this measures nothing`).toBeDefined();
        expect(viper.x - 0.42 * PORT_EXTENT.viper * viper.scale, 'the Viper is still on the screen as the picture goes').toBeGreaterThan(WIDE.width);
        expect(fighter.x - 0.5 * SHIP_BOX * view.scale, `the ${kind} is still on the screen as the picture goes`).toBeGreaterThan(WIDE.width);
      }
    }
    expect(drawAt(OUTRO_STEPS - 0.001).blits.at(-1)!.sprite).toBe(port('veil'));
    expect(drawAt(OUTRO_STEPS - 0.001).blits.at(-1)!.alpha).toBeGreaterThan(0.99);
  });
});

describe('who was in the Viper, and what the two of them say — 0418, 0426', () => {
  it('is any golfer but the one flying, whoever is flying, and fits every golfer the table grows', () => {
    /*
      *"the random rescued character slot needs to fit for other characters as well when we add more
      playable characters."* Walked over every golfer, so a fifth is held the moment it is a row.
    */
    for (const chosen of GOLFER_KINDS) {
      const pool = rescuable(chosen);
      expect(pool, `${chosen} could be found in the Viper while flying the fighter`).not.toContain(chosen);
      expect([...pool].sort(), `a golfer who was not chosen could never be the one found`).toEqual(GOLFER_KINDS.filter((k) => k !== chosen).sort());
    }
  });

  it('gives every golfer lines of their own to say either way, each short enough to be read before its bubble goes', () => {
    // In SECONDS: a line types out at `LETTER_STEPS` a letter and must then stay up a second and a half.
    const heldFor = (bubble: { from: number; to: number }, line: string): number => (bubble.to - (bubble.from + line.length * LETTER_STEPS)) / STEPS_PER_SECOND;
    for (const kind of GOLFER_KINDS) {
      const row = GOLFERS[kind];
      expect(row.saved.length, `${row.name} has nothing to say when found`).toBeGreaterThanOrEqual(3);
      expect(row.saving.length, `${row.name} has nothing to say as the rescuer`).toBeGreaterThanOrEqual(3);
      for (const line of [...row.saved, ...row.saving]) {
        expect(line.length, `${row.name}: "${line}" is longer than a bubble holds`).toBeLessThanOrEqual(LINE_LETTERS);
        expect(line.trim(), `${row.name} has an empty line`).not.toBe('');
      }
      for (const line of row.saved) expect(heldFor(SAVED_BUBBLE, line), `${row.name}: "${line}" is gone before it can be read`).toBeGreaterThanOrEqual(1.5);
      for (const line of row.saving) expect(heldFor(SAVING_BUBBLE, line), `${row.name}: "${line}" is gone before it can be read`).toBeGreaterThanOrEqual(1.5);
    }
  });

  it('gives every golfer a voice of their own', () => {
    const voices = GOLFER_KINDS.map((kind) => GOLFERS[kind].voice);
    expect(new Set(voices).size, 'two golfers talk in the same voice').toBe(voices.length);
  });

  it('blips on the letters of a line and never on its spaces, and once in every word or so', () => {
    for (const kind of GOLFER_KINDS) {
      for (const line of GOLFERS[kind].saved) {
        let blips = 0;
        for (let t = 0; t < line.length * LETTER_STEPS + 10; t++) {
          if (!blipsAt(line, t, 0)) continue;
          blips++;
          expect(line[lettersSaid(t, 0) - 1], `a blip on a space in "${line}"`).not.toBe(' ');
        }
        const words = line.split(' ').length;
        expect(blips, `"${line}" is said with too few blips to be heard as speech`).toBeGreaterThanOrEqual(words);
      }
    }
  });

  it('says each line from its own ship, on the screen, with the other ship clear of the bubble — in pixels', () => {
    /*
      *"the speech bubbles come out of the ships as they fly away."* Every step a bubble is up: the ship it
      comes out of is on the screen and within a hull's length of its tail, and the other ship is on the
      far side of the tail from the way the bubble hangs. ⚠️ The first photograph hung both bubbles above,
      and the fighter's covered the Viper for the whole of its line.
    */
    for (const size of [NARROW, WIDE]) {
      for (const from of FROMS) {
        for (const [bubble, mouth, speaker] of [
          [SAVED_BUBBLE, SAVED_MOUTH, 'viper'],
          [SAVING_BUBBLE, SAVING_MOUTH, 'fighter'],
        ] as const) {
          for (let t = bubble.from; t < bubble.to; t += 6) {
            const { blits, view } = drawAt(t, size, from);
            const viper = blits.find((b) => b.sprite === port('viper'))!;
            const fighter = blits.find((b) => b.sprite === SPRITE.fighter)!;
            const own = speaker === 'viper' ? viper : fighter;
            const other = speaker === 'viper' ? fighter : viper;
            (speaker === 'viper' ? viperAt : fighterAt)(t, from, AT);
            const x = screenX(view, AT[0]! + mouth.ahead, AT[1]! + mouth.across);
            const y = screenY(view, AT[0]! + mouth.ahead, AT[1]! + mouth.across);
            const where = `${speaker} at step ${t}, ${size.width}px, heart at ${from.heartAlong}`;
            expect(own.x >= 0 && own.x <= size.width && own.y >= 0 && own.y <= size.height, `the ${where} is speaking off the screen`).toBe(true);
            expect(Math.hypot(own.x - x, own.y - y) / view.scale, `the bubble of the ${where} is not on its ship`).toBeLessThan(8);
            const otherHalf = speaker === 'viper' ? 5 : 0.42 * PORT_EXTENT.viper * VIPER_GROW;
            if (mouth.hang === 'above') expect(other.y - otherHalf * view.scale, `the bubble of the ${where} hangs over the other ship`).toBeGreaterThan(y);
            else expect(other.y + otherHalf * view.scale, `the bubble of the ${where} hangs over the other ship`).toBeLessThan(y);
          }
        }
      }
    }
  });
});

describe('the finale is heard where it is seen — 0418', () => {
  const TWINS: Record<(typeof FINALE_CUES)[number]['cue'], readonly number[]> = {
    kill: FIRE,
    bossDown: [own('shard'), own('ring'), port('flash')],
    ignite: [port('viperIdle')],
    launch: [port('viperSurge'), ...THRUST.burn.frames.level],
  };

  it('plays every cue on a step that draws its twin', () => {
    for (const row of FINALE_CUES) {
      const sprites = new Set(drawAt(row.at + 1).blits.map((b) => b.sprite));
      expect(TWINS[row.cue].some((s) => sprites.has(s)), `${row.cue} at step ${row.at} sounds over a picture that does not show it`).toBe(true);
    }
  });
});

describe('the music leaves the run when the run is over — 0418', () => {
  it('plays the title’s music on every screen off a run, and the run’s on every screen in one', () => {
    /*
      Reported: *"the last level music doesn't stop till you start a new run or go to the music
      settings."* Asked where it happened: a run finished, so `run.level` is past the roster.
    */
    const finished = LEVEL_KINDS.length;
    for (const screen of SCREEN_KINDS) {
      const place = musicPlaceFor(screen, null, finished);
      if (SCREENS[screen].inRun) expect(place, `${screen} does not play the run's place`).toBe(placeFor(finished));
      else expect(place, `${screen} goes on playing the last level after the run is over`).toBe('approach');
    }
    expect(musicPlaceFor('title', null, finished), 'the title plays the last level after a win').toBe('approach');
    expect(musicPlaceFor('victory', null, finished), 'the victory screen plays the last level').toBe('approach');
    expect(musicPlaceFor('outro', null, finished), 'the finale is not in the place the boss died in').toBe(placeFor(finished));
    expect(musicPlaceFor('title', 'mire', finished), 'the room’s audition lost to the title').toBe('mire');
  });
});
