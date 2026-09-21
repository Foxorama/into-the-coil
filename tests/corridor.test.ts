/**
 * The Labyrinth is walled — `docs/decisions/0348-the-labyrinth-is-walled.md`.
 *
 * Played: *"The end boss has some walls around it, but otherwise there's no labyrinth that the player
 * is actually flying through."* And answered, for the waves that come in across the walls: *"For the
 * flankers have the walls open with gaps."*
 *
 * ⚠️ **WHAT IS HELD IS THE PICTURE, IN PIXELS AND LANE UNITS** — 0027. That the walls stand where the
 * ship is already stopped, that they run all the way to the room, and that nothing is ever drawn
 * crossing stone. Whether it feels like a labyrinth is the player's.
 */

import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_MARGIN } from '../src/sim/flight.ts';
import { GameFrame, layRoom } from '../src/app/frame.ts';
import { paintScene } from '../src/render/scene.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { playableWorld } from './world.ts';

const walled = LEVEL_KINDS.filter((kind) => LEVELS[kind].corridor !== undefined);

interface Blit {
  sprite: number;
  x: number;
  y: number;
  scale: number;
}

class Recorder implements Surface {
  blits: Blit[] = [];
  clear(): void {}
  bolt(): void {}
  blit(sprite: number, x: number, y: number, scale: number): void {
    this.blits.push({ sprite, x, y, scale });
  }
}

describe('0348 — the labyrinth is walled', () => {
  it('some level is flown down a corridor, or this file holds nothing', () => {
    expect(walled.length).toBeGreaterThan(0);
  });

  it('THE CLAMP IS THE WALL, IN LANE UNITS: each face stands exactly where the ship is stopped', () => {
    /*
      *"Nothing new collides"* is the whole reason item 4 could land without a sim change: the faces
      are drawn at `PLAYER_MARGIN`, the line `src/sim/flight.ts` has clamped the ship to since 0074. Read
      off the painted tiles — the edge of the stone nearest the middle, in lane units — rather than off
      the numbers the corridor was built from.
    */
    for (const kind of walled) {
      const { world } = playableWorld(LEVELS[kind]);
      const corridor = world.corridor!;
      expect(corridor, `${kind} states a corridor and none was laid`).not.toBeNull();
      const surface = new Recorder();
      const camera = world.cameraAlong + 60;
      paintScene(surface, world.view, [], camera, 0, [], null, [], world.levelOrigin, null, 0, 0, corridor);
      const walls = surface.blits.filter((b) => b.sprite === corridor.sprite);
      expect(walls.length, `${kind}'s corridor drew no wall at all`).toBeGreaterThan(0);
      const origin = screenY(world.view, 0, 0);
      const half = (SPRITE_EXTENT[SPRITE_KINDS[corridor.sprite]!] * world.view.scale) / 2;
      const faces = new Set(
        walls.map((b) => {
          const centre = (b.y - origin) / world.view.scale;
          const inner = centre < ACROSS_SPAN / 2 ? centre + half / world.view.scale : centre - half / world.view.scale;
          return inner.toFixed(3);
        }),
      );
      expect([...faces].sort(), `${kind}'s walls do not stand on the ship's clamp`).toEqual(
        [PLAYER_MARGIN, ACROSS_SPAN - PLAYER_MARGIN].map((f) => f.toFixed(3)).sort(),
      );
    }
  });

  it('AND IT RUNS ALL THE WAY TO THE ROOM: the room’s side walls begin where the corridor’s end', () => {
    /*
      *"So the room at the end is where the corridor arrives rather than the first wall in the level."*
      Held as the one equality that makes it true: the corridor ends where `layRoom` starts the room,
      on the same stone and the same grid, so there is neither a gap nor a double at the joint.
    */
    for (const kind of walled) {
      const level = LEVELS[kind];
      if (BOSSES[level.boss].room === null) continue;
      const { world } = playableWorld(level);
      world.fight = 1;
      world.bossRow = BOSSES[level.boss];
      layRoom(world);
      expect(world.room, `${kind}'s boss has a room and none was laid`).not.toBeNull();
      expect(world.corridor!.to, `${kind}'s corridor stops short of its room, or runs on into it`).toBeCloseTo(world.room!.from, 6);
      expect(world.corridor!.sprite, `${kind}'s corridor is not the room's stone`).toBe(world.room!.sprite);
      // The same grid: the room starts a whole number of tiles along from the corridor's first tile.
      const tiles = (world.room!.from - world.corridor!.from) / world.corridor!.extent;
      expect(Math.abs(tiles - Math.round(tiles)), `${kind}'s room is off the corridor's grid by a fraction of a tile`).toBeLessThan(1e-6);
    }
  });

  it('AND THE ROOM’S WALLS ARE ON THE WORLD’S GRID, SO THEY SCROLL WITH IT', () => {
    /*
      0335 started its side walls at `camera − extent` once the camera was past the room's open side,
      which put every tile a fixed distance from the CAMERA: a band that did not move while the camera
      did. Invisible at rest; a corridor scrolling into it in the same stone would slide against it at
      the joint. Held in pixels: move the camera three units and every side-wall tile moves three
      units' worth across the screen.
    */
    const { world } = playableWorld(LEVELS[walled[0]!]);
    const view = world.view;
    const room = { sprite: world.corridor!.sprite, extent: world.corridor!.extent, from: 0, to: 2000, open: 0 };
    const sides = (camera: number): number[] => {
      const surface = new Recorder();
      paintScene(surface, view, [], camera, 0, [], null, [], 0, room);
      const edge = screenY(view, 0, 0) + (view.scale * room.extent) / 4;
      return surface.blits.filter((b) => b.y < edge).map((b) => b.x).sort((a, b) => a - b);
    };
    const before = sides(500);
    const after = sides(503);
    const moved = before.map((x) => x - 3 * view.scale);
    // Compare the tiles both frames drew — the one at each end may enter or leave between them.
    const common = after.filter((x) => moved.some((m) => Math.abs(m - x) < 0.01));
    expect(common.length, 'the room\'s side walls did not move with the camera').toBeGreaterThanOrEqual(after.length - 2);
  });

  it('THE REPORTED RISK, IN PIXELS: no body on the screen is ever drawn over the corridor’s stone', () => {
    /*
      *"A wall will kill the ship and block shots"* is 4b; what 4 owes is that nothing is SEEN passing
      through one. Flanking waves come in across the lane's edge — through the masonry — and each opens
      its own passage as it arrives. So the level is flown with the ship kept alive, and at every step
      the corridor is painted into a recorder and every body on the screen is held against every wall
      tile that was actually drawn, in CSS pixels.

      ⚠️ **ITS BODY, NOT ITS SPRITE.** A hull is what the player reads as the thing; the fins and glow
      a sprite carries past it are light, and a fin over the coping is not a body through a wall.
    */
    for (const kind of walled) {
      const { world } = playableWorld(LEVELS[kind]);
      const frame = new GameFrame(world);
      const view = world.view;
      const hits: string[] = [];
      let watched = 0;
      for (let step = 0; step < 60 * 150 && world.bossPool.size === 0; step++) {
        world.ship.health = world.shipRow.health;
        frame.step();
        const corridor = world.corridor!;
        // Only bodies inside the band a wall occupies and on the screen are candidates at all.
        const near: number[] = [];
        for (let i = 0; i < world.enemies.size; i++) {
          const e = world.enemies.at(i);
          const ahead = e.along - world.cameraAlong;
          if (ahead + e.radius < 0 || ahead - e.radius > view.alongSpan) continue;
          if (e.across - e.radius > PLAYER_MARGIN && e.across + e.radius < ACROSS_SPAN - PLAYER_MARGIN) continue;
          if (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN) continue;
          near.push(i);
        }
        if (near.length === 0) continue;
        const surface = new Recorder();
        paintScene(surface, view, [], world.cameraAlong, 0, [], null, [], world.levelOrigin, null, 0, 0, corridor);
        const half = (SPRITE_EXTENT[SPRITE_KINDS[corridor.sprite]!] * view.scale) / 2;
        for (const i of near) {
          const e = world.enemies.at(i);
          watched += 1;
          const ex = screenX(view, e.along - world.cameraAlong, e.across);
          const ey = screenY(view, e.along - world.cameraAlong, e.across);
          const er = e.radius * view.scale;
          for (const b of surface.blits) {
            // Overlapping by more than half a pixel: a hull resting ON the face is where a drifter
            // turns, and floating-point contact there is not a body drawn over stone.
            if (Math.abs(b.x - ex) < half + er - 0.5 && Math.abs(b.y - ey) < half + er - 0.5) {
              hits.push(`step ${step}: enemy kind ${e.kind} at along ${(e.along - world.levelOrigin).toFixed(0)}, across ${e.across.toFixed(1)}`);
              break;
            }
          }
        }
      }
      expect(watched, `${kind}: no body ever came near a wall, so this measured nothing`).toBeGreaterThan(0);
      expect(hits.slice(0, 5).join('\n'), `${kind}: ${hits.length} sightings of a body drawn over the corridor's stone`).toBe('');
    }
  }, 120_000);
});
