/**
 * The finale — `docs/decisions/0418-the-heart-lets-go.md`.
 *
 * ⚠️ **THE PICTURE, IN PIXELS, ON `tests/intro.test.ts`'s TERMS.** The painter is a pure function of one
 * clock (`src/render/finale.ts`), so it is drawn into a surface that writes down every blit and asked
 * where things landed — and what the golfers say is asked in seconds, which is what a player reads in.
 */

import { describe, expect, it } from 'vitest';
import {
  FINALE_BEATS,
  FINALE_CUES,
  FINALE_FADE,
  FINALE_KINDS,
  LETTER_STEPS,
  LINE_LETTERS,
  OUTRO_STEPS,
  SAVED_CLOSE,
  SAVING_CLOSE,
  blipsAt,
  closeAlong,
  lettersSaid,
  type FinaleKind,
} from '../src/content/finale.ts';
import { GOLFERS, GOLFER_KINDS, rescuable } from '../src/content/golfers.ts';
import { PORT_EXTENT, PORT_SPRITE, type PortKind } from '../src/content/port.ts';
import { SPRITE } from '../src/content/sprites.ts';
import { LEVEL_KINDS } from '../src/content/levels.ts';
import { SKY } from '../src/app/mount.ts';
import { musicPlaceFor, placeFor } from '../src/app/music.ts';
import { FINALE_BASE, GAME_BASE, paintFinale } from '../src/render/finale.ts';
import type { Surface } from '../src/render/surface.ts';
import { MAX_ASPECT, viewOf, type View } from '../src/sim/camera.ts';
import { SCREENS, SCREEN_KINDS, STEPS_PER_SECOND } from '../src/state/screens.ts';

interface Blit {
  sprite: number;
  x: number;
  scale: number;
  alpha: number;
}

class RecordingSurface implements Surface {
  blits: Blit[] = [];
  clear(): void {
    this.blits = [];
  }
  blit(sprite: number, x: number, _y: number, scale: number, _turn = 0, alpha = 1): void {
    this.blits.push({ sprite, x, scale, alpha });
  }
  bolt(): void {}
}

/** The widest screen any device is given, and a 16:9 one — the narrowest. */
const WIDE = { width: Math.round(1000 * MAX_ASPECT), height: 1000 };
const NARROW = { width: 1920, height: 1080 };

function drawAt(t: number, size = NARROW): { blits: Blit[]; view: View } {
  const view = viewOf(size.width, size.height);
  const surface = new RecordingSurface();
  paintFinale(surface, view, t, SKY);
  return { blits: surface.blits, view };
}

const own = (kind: FinaleKind): number => FINALE_BASE + FINALE_KINDS.indexOf(kind);
const port = (kind: PortKind): number => PORT_SPRITE[kind];
const drawn = (t: number, sprite: number, size = NARROW): Blit | undefined => drawAt(t, size).blits.find((b) => b.sprite === sprite);

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

describe('who was in the Viper — 0418', () => {
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

  it('gives every golfer lines of their own to say either way, each short enough to be read before its shot ends', () => {
    /*
      In SECONDS, which is what a player reads in: a line types out at `LETTER_STEPS` a letter and must
      then stay up at least a second and a half before its bubble goes with the shot.
    */
    const heldFor = (says: number, cut: number, line: string): number =>
      (cut - FINALE_FADE - (says + line.length * LETTER_STEPS)) / STEPS_PER_SECOND;
    for (const kind of GOLFER_KINDS) {
      const row = GOLFERS[kind];
      expect(row.saved.length, `${row.name} has nothing to say when found`).toBeGreaterThanOrEqual(3);
      expect(row.saving.length, `${row.name} has nothing to say as the rescuer`).toBeGreaterThanOrEqual(3);
      for (const line of [...row.saved, ...row.saving]) {
        expect(line.length, `${row.name}: "${line}" is longer than a bubble holds`).toBeLessThanOrEqual(LINE_LETTERS);
        expect(line.trim(), `${row.name} has an empty line`).not.toBe('');
      }
      for (const line of row.saved) {
        expect(heldFor(FINALE_BEATS.savedSays, FINALE_BEATS.cutSaved, line), `${row.name}: "${line}" is gone before it can be read`).toBeGreaterThanOrEqual(1.5);
      }
      for (const line of row.saving) {
        expect(heldFor(FINALE_BEATS.savingSays, FINALE_BEATS.cutSaving, line), `${row.name}: "${line}" is gone before it can be read`).toBeGreaterThanOrEqual(1.5);
      }
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
});

describe('the picture — 0418', () => {
  it('melts the jellyfish off the heart, bursts the heart, and has the Viper where it was', () => {
    const jelly = GAME_BASE + SPRITE.boss14Open;
    const heart = GAME_BASE + SPRITE.heart;
    expect(drawn(FINALE_BEATS.melt, jelly), 'no jellyfish on the heart as the finale opens').toBeDefined();
    const going = drawn((FINALE_BEATS.melt + FINALE_BEATS.melted) / 2, jelly)!;
    expect(going.alpha, 'the jellyfish is not going as she melts').toBeLessThan(0.9);
    expect(drawn(FINALE_BEATS.melted + 1, jelly), 'the jellyfish outlasts her melt').toBeUndefined();
    expect(drawn(FINALE_BEATS.melt + 30, own('drip')), 'she melts without a drop').toBeDefined();
    expect(drawn(FINALE_BEATS.burst - 1, heart), 'no heart before it bursts').toBeDefined();
    expect(drawn(FINALE_BEATS.burst, heart), 'the heart outlasts its burst').toBeUndefined();
    expect(drawn(FINALE_BEATS.burst + 10, own('shard')), 'the heart bursts into nothing').toBeDefined();
    expect(drawn(FINALE_BEATS.burst - 1, port('viper')), 'the Viper is seen before the heart gives her up').toBeUndefined();
    const freed = drawn(FINALE_BEATS.burst, port('viper'));
    const was = drawn(FINALE_BEATS.burst - 1, heart);
    expect(freed, 'the Viper is not there when the heart bursts').toBeDefined();
    expect(Math.abs(freed!.x - was!.x), 'the Viper is not where the heart was').toBeLessThan(1);
  });

  it('shows each cockpit close, with its hull running off its own edge of the screen on every screen', () => {
    /*
      In pixels: a close-up's box is `FINALE_EXTENT` wide, and its hull reaches the box's outer side.
      The first photograph had the fighter's placed for the narrowest screen and stopping in mid-air.
    */
    for (const size of [NARROW, WIDE]) {
      const saved = drawn(FINALE_BEATS.savedSays, own('savedClose'), size);
      const saving = drawn(FINALE_BEATS.savingSays, own('savingClose'), size);
      expect(saved, 'no close-up of the Viper while its golfer speaks').toBeDefined();
      expect(saving, 'no close-up of the fighter while its golfer speaks').toBeDefined();
      const half = (b: Blit): number => (b.scale * 124) / 2;
      expect(saved!.x - half(saved!), `the Viper's hull stops short of the screen's near side at ${size.width}px`).toBeLessThanOrEqual(0);
      expect(saving!.x + half(saving!), `the fighter's hull stops short of the screen's far side at ${size.width}px`).toBeGreaterThanOrEqual(size.width);
      const { view } = drawAt(0, size);
      expect(closeAlong(view.alongSpan, true, SAVING_CLOSE.edge)).toBeGreaterThan(closeAlong(view.alongSpan, false, SAVED_CLOSE.edge));
    }
  });

  it('has both ships leave the widest screen before the picture goes', () => {
    const { blits } = drawAt(FINALE_BEATS.fadeOut, WIDE);
    for (const kind of ['viper', 'blue'] as const) {
      const ship = blits.find((b) => b.sprite === port(kind));
      if (ship !== undefined) {
        const tail = ship.x - 0.42 * PORT_EXTENT[kind] * ship.scale;
        expect(tail, `${kind} is still on the screen as the picture goes`).toBeGreaterThan(WIDE.width);
      }
    }
  });

  it('opens out of the backdrop and ends in it', () => {
    expect(drawAt(0).blits.at(-1)!.sprite).toBe(port('veil'));
    expect(drawAt(OUTRO_STEPS - 0.001).blits.at(-1)!.alpha).toBeGreaterThan(0.99);
    expect(drawAt(OUTRO_STEPS - 0.001).blits.at(-1)!.sprite).toBe(port('veil'));
  });
});

describe('the finale is heard where it is seen — 0418', () => {
  const TWINS: Record<(typeof FINALE_CUES)[number]['cue'], readonly number[]> = {
    bossDown: [own('shard'), port('flash')],
    ignite: [port('viperIdle')],
    launch: [port('viperSurge'), port('blueSurge')],
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
