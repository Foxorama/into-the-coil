/**
 * The Labyrinth is walled — `docs/decisions/0348-the-labyrinth-is-walled.md` — and its corridor turns,
 * per difficulty — `docs/decisions/0350-the-corridor-turns.md`.
 *
 * Played: *"The end boss has some walls around it, but otherwise there's no labyrinth that the player
 * is actually flying through."* And, of the straight corridor: *"the straight corridor to the boss is
 * not a labyrinth, it's a boring corridor."* Answered on the plan: *"do all 3 but per difficulty,
 * saviour is 44, burn is 34, legend is 56."*
 *
 * ⚠️ **WHAT IS HELD IS THE PICTURE, IN PIXELS AND LANE UNITS** — 0027. Where the walls stand, that
 * each tier's corridor reaches its own narrowest and never passes it or its slope, that the painter
 * puts the stone where the model says it is, that the corridor runs to the room, and — flying every
 * tier's level — that nothing is ever drawn crossing stone. Whether it feels like a labyrinth is the
 * player's.
 */

import { describe, expect, it } from 'vitest';

import { LEVELS, LEVEL_KINDS, type LevelRow } from '../src/content/levels.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { SPRITE_EXTENT, SPRITE_KINDS, WALL_RISES, WALL_RISE_MAX } from '../src/content/sprites.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { PLAYER_MARGIN } from '../src/sim/flight.ts';
import { GameFrame, layRoom } from '../src/app/frame.ts';
import { paintScene } from '../src/render/scene.ts';
import { screenX, screenY, type Surface } from '../src/render/surface.ts';
import { reset, type Entity } from '../src/sim/entity.ts';
import { bandAt, faceAt, stoneAt } from '../src/sim/corridor.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { SHOTS } from '../src/content/shots.ts';
import { DEBRIS_KIND } from '../src/content/debris.ts';
import { playableWorld } from './world.ts';

const walled = LEVEL_KINDS.filter((kind) => LEVELS[kind].corridor !== undefined);

/**
 * A corridor that turns as hard as a shape can ask, at its tier's slope, with waves flown through it
 * that each fit the box — measured wave by wave in an open level at these same places, because a
 * weave's swing depends on where it starts and a wave that leaves the box would be the content's
 * loss, not the corridor's. The one that does not, the turret flank, drifts: in a corridor it turns
 * at the face (0348) rather than meeting it. 0350.
 */
const TURN: LevelRow = {
  ...LEVELS[walled[0]!],
  waves: [
    { at: 320, enemy: 'charger', formation: 'line', count: 5, lane: 22 },
    { at: 380, enemy: 'weaver', formation: 'column', count: 5, lane: 60 },
    { at: 440, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },
    { at: 500, enemy: 'sower', formation: 'column', count: 5, lane: 45 },
    { at: 560, enemy: 'turret', formation: 'line', count: 5, lane: 55, origin: 'acrossPlus' },
    { at: 620, enemy: 'charger', formation: 'line', count: 5, lane: 78 },
    { at: 680, enemy: 'weaver', formation: 'column', count: 5, lane: 50 },
    { at: 740, enemy: 'charger', formation: 'column', count: 5, lane: 50, origin: 'acrossPlus' },
  ],
  pickups: [],
  corridor: {
    centre: ACROSS_SPAN / 2,
    width: ACROSS_SPAN - PLAYER_MARGIN * 2,
    wall: 'roomWall',
    passages: [],
    shape: [
      { at: 300, swing: 0, narrow: 0 },
      { at: 480, swing: 1, narrow: 1 },
      { at: 660, swing: -1, narrow: 1 },
      { at: 840, swing: 1, narrow: 0.6 },
      { at: 1020, swing: 0, narrow: 0 },
    ],
  },
};

interface Blit {
  sprite: number;
  x: number;
  y: number;
  scale: number;
  turn: number;
}

class Recorder implements Surface {
  blits: Blit[] = [];
  clear(): void {}
  bolt(): void {}
  blit(sprite: number, x: number, y: number, scale: number, turn = 0): void {
    this.blits.push({ sprite, x, y, scale, turn });
  }
}

/** Every knot's two faces, for one level at one tier, as the game lays them. */
function facesAt(kind: (typeof LEVEL_KINDS)[number], tier: (typeof DIFFICULTY_KINDS)[number]) {
  const { world } = playableWorld(LEVELS[kind], tier);
  return world.corridor!;
}

describe('0348 — the labyrinth is walled', () => {
  it('some level is flown down a corridor, or this file holds nothing', () => {
    expect(walled.length).toBeGreaterThan(0);
  });

  it('THE BOX IS THE LIMIT, IN LANE UNITS: no face ever leaves it, and the straight stretches stand on the clamp', () => {
    /*
      0348's walls stood exactly where `src/sim/flight.ts` clamps the ship; 0350's turn inside it. So
      the claim is now two: nothing is ever laid outside the box — a face past the clamp would be stone
      the ship could never reach and a turn it could never see the end of — and where the shape is at
      rest the faces are back on the clamp, which is what the fights are fought in.
    */
    for (const kind of walled) {
      for (const tier of DIFFICULTY_KINDS) {
        const corridor = facesAt(kind, tier);
        const knots = corridor.faces.length / 2;
        for (let k = 0; k < knots; k++) {
          const near = corridor.faces[k * 2]!;
          const far = corridor.faces[k * 2 + 1]!;
          expect(near, `${kind}/${tier}: the near face at knot ${k} is past the clamp`).toBeGreaterThanOrEqual(PLAYER_MARGIN);
          expect(far, `${kind}/${tier}: the far face at knot ${k} is past the clamp`).toBeLessThanOrEqual(ACROSS_SPAN - PLAYER_MARGIN);
        }
        // At rest — the very first knot and the last — it is the box.
        for (const k of [0, knots - 1]) {
          expect([corridor.faces[k * 2], corridor.faces[k * 2 + 1]], `${kind}/${tier}: at rest at knot ${k} and not on the clamp`).toEqual([
            PLAYER_MARGIN,
            ACROSS_SPAN - PLAYER_MARGIN,
          ]);
        }
      }
    }
  });

  it('THE PLAYER’S NUMBERS, PER TIER: each corridor reaches its tier’s narrowest and never passes it or its slope', () => {
    /*
      *"Saviour is 44, burn is 34, legend is 56."* Read off the faces as laid, in lane units. **Reached
      as well as respected** — a corridor that never came near its narrowest would pass the floor and
      be the straight corridor again, which is the report this answers. And every rise across a tile
      is one the painter has a cap for.
    */
    for (const kind of walled) {
      for (const tier of DIFFICULTY_KINDS) {
        const { narrowest, slope } = DIFFICULTIES[tier].corridor;
        const corridor = facesAt(kind, tier);
        const knots = corridor.faces.length / 2;
        let tightest = Infinity;
        let steepest = 0;
        for (let k = 0; k < knots; k++) {
          tightest = Math.min(tightest, corridor.faces[k * 2 + 1]! - corridor.faces[k * 2]!);
          if (k === 0) continue;
          for (const slot of [0, 1]) {
            const rise = Math.abs(corridor.faces[k * 2 + slot]! - corridor.faces[(k - 1) * 2 + slot]!);
            steepest = Math.max(steepest, rise / corridor.extent);
            expect(rise, `${kind}/${tier}: a rise of ${rise} across one tile has no cap`).toBeLessThanOrEqual(WALL_RISE_MAX);
          }
        }
        expect(tightest, `${kind}/${tier}: the corridor pinches to ${tightest}, under the tier's ${narrowest}`).toBeGreaterThanOrEqual(narrowest);
        expect(tightest, `${kind}/${tier}: the corridor never comes within two units of its tier's ${narrowest}`).toBeLessThanOrEqual(
          narrowest + 2,
        );
        expect(steepest, `${kind}/${tier}: a wall runs at ${steepest.toFixed(2)}, past the tier's ${slope}`).toBeLessThanOrEqual(slope);
        expect(steepest, `${kind}/${tier}: no wall turns at all`).toBeGreaterThan(0);
      }
    }
  });

  it('AND THE PAINTER PUTS THE STONE WHERE THE MODEL SAYS: every cap’s face is on its knots, in lane units', () => {
    /*
      A corridor laid in one place and drawn in another is 0036's report waiting to be filed: a body
      killed by stone that is not on the screen. Each cap is placed at the midpoint of its tile's face
      with the rise its knots differ by; read back off the recorder, the face at each end of the tile
      must be the knot's.
    */
    const kind = walled[0]!;
    const { world } = playableWorld(LEVELS[kind], 'burn');
    const corridor = world.corridor!;
    const view = world.view;
    // Somewhere in the first turning stretch, where the caps are not all level.
    const camera = corridor.from + 500;
    const surface = new Recorder();
    paintScene(surface, view, [], camera, 0, [], null, [], world.levelOrigin, null, 0, 0, corridor);
    const caps = surface.blits.filter((b) => (WALL_RISES as readonly number[]).includes(b.sprite));
    expect(caps.length, 'no caps were drawn').toBeGreaterThan(0);
    const origin = screenY(view, 0, 0);
    let checked = 0;
    let sloped = 0;
    for (const cap of caps) {
      const rise = (WALL_RISES as readonly number[]).indexOf(cap.sprite) - WALL_RISE_MAX;
      const middle = (cap.y - origin) / view.scale;
      const along = (cap.x - screenX(view, 0, 0)) / view.scale + camera;
      const k = Math.round((along - corridor.extent / 2 - corridor.from) / corridor.extent);
      const slot = cap.turn !== 0 ? 0 : 1;
      const a = corridor.faces[k * 2 + slot]!;
      const b = corridor.faces[(k + 1) * 2 + slot]!;
      expect(middle - rise / 2, `the cap at knot ${k} starts its face at ${(middle - rise / 2).toFixed(2)}, not ${a}`).toBeCloseTo(a, 6);
      expect(middle + rise / 2, `the cap at knot ${k} ends its face at ${(middle + rise / 2).toFixed(2)}, not ${b}`).toBeCloseTo(b, 6);
      checked++;
      if (rise !== 0) sloped++;
    }
    expect(checked).toBeGreaterThan(0);
    expect(sloped, 'every cap in the turning stretch was level, so this checked no turn').toBeGreaterThan(0);
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

  it('THE REPORTED RISK, IN PIXELS, ON EVERY TIER: no body on the screen is ever drawn over the corridor’s stone', () => {
    /*
      Nothing may be SEEN passing through stone: flanking waves come in through passages they open
      (0348), bodies ride the corridor as it bends (0350), and whatever still meets the stone is
      destroyed by it (0349). So each tier's level is flown with the ship kept alive, and at every step
      the corridor is painted into a recorder and every body on the screen is held against the stone
      that was actually drawn, in CSS pixels.

      ⚠️ **THE STONE UNDER A CAP IS ONLY THE STONE PAST ITS FACE.** A cap is a square tile with a
      sloped face through it; a body in the square's other half is in the air. Tiles behind the cap are
      stone to their edges.

      ⚠️ **THE WHOLE LEVEL — AND UNTIL 0350 IT WAS A THIRD OF IT.** The loop stopped the moment any
      boss was on the field, and the mid-boss arrives at 1519 of 4240: 0348's guard watched the opening
      stretch and nothing after it. It runs until the level's own boss now, past the mid-boss's fight.

      ⚠️ **ITS BODY, NOT ITS SPRITE.** A hull is what the player reads as the thing; the fins and glow
      a sprite carries past it are light.

      ⚠️ **AND A PICKUP IS A BODY.** It floated off the box's edges and nothing else, so in the turning
      corridor it drifted into the masonry — on the screen and out of reach, 0100's bug — and the
      first flight with pickups in this loop counted it on every tier.
    */
    for (const kind of walled) {
      for (const tier of DIFFICULTY_KINDS) {
        const { world } = playableWorld(LEVELS[kind], tier);
        const frame = new GameFrame(world);
        const view = world.view;
        const hits: string[] = [];
        let watched = 0;
        let reached = 0;
        for (let step = 0; step < 60 * 240; step++) {
          if (world.fight === 1 && world.bossPool.size > 0) break;
          world.ship.health = world.shipRow.health;
          frame.step();
          const corridor = world.corridor!;
          reached = world.cameraAlong - world.levelOrigin;
          const near: Entity[] = [];
          const what: string[] = [];
          for (const pool of [world.enemies, world.pickups]) {
            for (let i = 0; i < pool.size; i++) {
              const e = pool.at(i);
              const ahead = e.along - world.cameraAlong;
              if (ahead + e.radius < 0 || ahead - e.radius > view.alongSpan) continue;
              if (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN) continue;
              near.push(e);
              what.push(pool === world.enemies ? 'enemy' : 'pickup');
            }
          }
          if (near.length === 0) continue;
          const surface = new Recorder();
          paintScene(surface, view, [], world.cameraAlong, 0, [], null, [], world.levelOrigin, null, 0, 0, corridor);
          const half = (SPRITE_EXTENT[SPRITE_KINDS[corridor.sprite]!] * view.scale) / 2;
          for (let n = 0; n < near.length; n++) {
            const e = near[n]!;
            const ex = screenX(view, e.along - world.cameraAlong, e.across);
            const ey = screenY(view, e.along - world.cameraAlong, e.across);
            const er = e.radius * view.scale;
            for (const b of surface.blits) {
              if (Math.abs(b.x - ex) >= half + er - 0.5 || Math.abs(b.y - ey) >= half + er - 0.5) continue;
              const capAt = (WALL_RISES as readonly number[]).indexOf(b.sprite);
              if (capAt >= 0) {
                // The face under the body, and the stone on its far side of it: below for the far wall,
                // above for the near one, which is the same cap turned over.
                const rise = capAt - WALL_RISE_MAX;
                const x = Math.max(-half, Math.min(half, ex - b.x));
                const face = b.y + (x / (half * 2)) * rise * view.scale;
                const into = b.turn !== 0 ? face - (ey - er) : ey + er - face;
                if (into <= 0.5) continue;
              }
              watched += 1;
              hits.push(`${tier} step ${step}: ${what[n]} kind ${e.kind} at along ${(e.along - world.levelOrigin).toFixed(0)}, across ${e.across.toFixed(1)}`);
              break;
            }
          }
          watched += near.length;
        }
        expect(reached, `${kind}/${tier}: the flight stopped at ${reached.toFixed(0)}, short of the room`).toBeGreaterThan(LEVELS[kind].bossAt - 600);
        expect(watched, `${kind}/${tier}: no body was ever on the screen, so this measured nothing`).toBeGreaterThan(0);
        expect(hits.slice(0, 5).join('\n'), `${kind}/${tier}: ${hits.length} sightings of a body drawn over the corridor's stone`).toBe('');
      }
    }
  }, 600_000);

  it('A TURN IS NOT A MASSACRE: waves flown through a hard bend at burn are never destroyed by the stone', () => {
    /*
      The stone removes what meets it before it can be drawn there (0349), so a corridor that dashes
      its waves against the walls passes the guard above: nothing is ever SEEN in the stone. What the
      player sees instead is bodies bursting on masonry nobody shot. Flying the Labyrinth at burn before
      the fixes this names, the stone destroyed seventy-five bodies in one level.

      ⚠️ **ON A FIXTURE AND NOT ON THE LABYRINTH, SO IT HOLDS THE MECHANISMS AND NOT THE CONTENT.** A
      level that authored a weave out to the box's own edge would lose it to the stone, correctly —
      the Labyrinth has a handful — and a count over the real level would then be a limit on what may
      be authored. Here every wave fits the box, so every loss is the corridor's doing:
        — a wave put down where the corridor has moved (`inCorridor`),
        — a body not carried as the walls bend round it (`rideCorridor`),
        — a weave that kept the box's swing in a pinch (`squeezeAt`),
        — a flanker that outran its passage, forwards or backwards (`openPassage`).
    */
    const { world } = playableWorld(TURN, 'burn');
    const frame = new GameFrame(world);
    let inTurn = 0;
    for (let step = 0; step < 60 * 40; step++) {
      world.ship.health = world.shipRow.health;
      frame.step();
      for (let i = 0; i < world.enemies.size; i++) {
        const at = world.enemies.at(i).along - world.levelOrigin;
        if (at > 400 && at < 940) inTurn++;
      }
    }
    // The kills first: a break that kills also thins the waves, and the red it earns should name it.
    expect(world.corridor!.kills, 'bodies the stone destroyed on a fixture whose every wave fits the box').toBe(0);
    expect(inTurn, 'no wave was ever in the turning stretch, so this measured nothing').toBeGreaterThan(2000);
  });

  it('A COLUMN ARRIVES AS A COLUMN: every member of a wave stands at its own lane’s share of the corridor', () => {
    /*
      A column is spaced along the lane, five members fourteen units apart, and in a turning corridor
      the corridor under its tail is not the corridor under its head. Read at the head's along, a
      column of weavers at lane 50 was put down at 0.50, 0.39, 0.25, 0.10 and −0.04 of the band — a
      column smeared diagonally across the corridor, its last member against the stone. Held in the
      player's terms: on the step a wave appears, every member of a column stands at one share of the
      band its hull can occupy.
    */
    const { world } = playableWorld(TURN, 'burn');
    const frame = new GameFrame(world);
    const corridor = world.corridor!;
    let columns = 0;
    let seen = 0;
    const spread: string[] = [];
    for (let step = 0; step < 60 * 40; step++) {
      world.ship.health = world.shipRow.health;
      const before = world.nextWave;
      const already = new Set<Entity>();
      for (let i = 0; i < world.enemies.size; i++) already.add(world.enemies.at(i));
      frame.step();
      if (world.nextWave === before) continue;
      const wave = TURN.waves[before]!;
      if (wave.formation !== 'column' || wave.origin !== undefined) continue;
      columns++;
      const shares: number[] = [];
      for (let i = 0; i < world.enemies.size; i++) {
        const e = world.enemies.at(i);
        if (already.has(e)) continue;
        const low = bandAt(corridor, e.along, e.radius, -1);
        const high = bandAt(corridor, e.along, e.radius, 1);
        shares.push((e.across - low) / (high - low));
      }
      seen += shares.length;
      const wide = Math.max(...shares) - Math.min(...shares);
      if (wide > 0.02) spread.push(`the column at ${wave.at}: members at ${shares.map((s) => s.toFixed(2)).join(', ')} of the band`);
    }
    expect(columns, 'no column was flown, so this measured nothing').toBeGreaterThan(1);
    expect(seen).toBeGreaterThanOrEqual(columns * 5);
    expect(spread.join('\n'), 'a column smeared across the corridor as it appeared').toBe('');
  });

  it('AND WHERE A BODY IS CARRIED IS WHERE THE STONE SAYS IT IS CLEAR: a hull at its band’s edge never touches the wall', () => {
    /*
      `bandAt` is where the ride carries a body, where a wave puts one down and where a drifter turns;
      `stoneAt` is what destroys it. If the two disagree, the mechanisms above deliver a body to a place
      the stone kills it in. They read the wall differently — `stoneAt` tile by tile at the hull's
      nearest point in each, the band over the hull's length — so the agreement is held directly, at
      every knot and between them, on every tier's Labyrinth, for the smallest hull and the largest.
    */
    const radii = [2, 5];
    for (const kind of walled) {
      for (const tier of DIFFICULTY_KINDS) {
        const corridor = facesAt(kind, tier);
        let asked = 0;
        const touched: string[] = [];
        for (let along = corridor.from + 6; along < corridor.to - 6; along += 1.5) {
          for (const r of radii) {
            for (const side of [-1, 1]) {
              const edge = bandAt(corridor, along, r, side);
              asked++;
              if (stoneAt(corridor, along, edge, r) !== 0) touched.push(`${tier} along ${(along - corridor.from).toFixed(1)} r ${r} side ${side}`);
            }
          }
        }
        expect(asked).toBeGreaterThan(1000);
        expect(touched.slice(0, 5).join('\n'), `${kind}/${tier}: ${touched.length} places where a hull at its band's edge is in the stone`).toBe('');
      }
    }
  });

  it('A WALL OF SHOTS IS AS WIDE AS THE CORRIDOR IT IS FIRED IN: no slot is put down in the stone', () => {
    /*
      Photographed on the Labyrinth at burn: two rows of sparks in the masonry under every sentry that
      fired near a face. A `wall` attack lays its slots at the body's across ± gaps and skipped only
      those off the box, so the ones past a face were born inside the stone and broke there (0349) on
      the step they appeared.

      ⚠️ **HELD IN LANE UNITS, BY WHERE THE SPARKS ARE.** A shot that flies into the stone breaks
      within one step of the face; one born in it breaks wherever it was born. So no spark may stand
      further past the face than a shot travels in a step — and the sentry has to have fired, and to
      have had a slot in the stone to skip, or this measured nothing.
    */
    const { world } = playableWorld({ ...LEVELS[walled[0]!], waves: [], pickups: [], corridor: { centre: 50, width: 60, wall: 'roomWall', passages: [] } });
    const frame = new GameFrame(world);
    const corridor = world.corridor!;
    const sentry = world.enemies.spawn()!;
    const row = ENEMIES.sentry;
    reset(sentry, world.ship.along + 60, 24, row, ENEMY_KINDS.indexOf('sentry'));
    const attack = row.attack;
    expect(attack.kind, 'the sentry no longer fires a wall; point this at one that does').toBe('wall');
    const gap = attack.kind === 'wall' ? attack.gap : 0;
    expect(24 - gap, 'the sentry\'s nearest slot is not in the stone, so nothing here can be skipped').toBeLessThan(20);
    const speed = SHOTS[row.shot].speed * world.difficulty.shotSpeed + 1;
    let fired = 0;
    let deepest = 0;
    for (let step = 0; step < 600 && fired === 0; step++) {
      world.ship.health = world.shipRow.health;
      // Held against the near face, so the slot beside it is in the stone every time it fires.
      sentry.across = 24;
      frame.step();
      fired = world.enemyShots.size;
      for (let i = 0; i < world.debris.size; i++) {
        const spark = world.debris.at(i);
        if (spark.kind !== DEBRIS_KIND.spark) continue;
        const side = stoneAt(corridor, spark.along, spark.across, 0);
        if (side !== 0) deepest = Math.max(deepest, side * (spark.across - faceAt(corridor, spark.along, side)));
      }
    }
    expect(fired, 'the sentry never fired, so no wall was laid').toBeGreaterThan(0);
    expect(deepest, `a shot broke ${deepest.toFixed(1)} lane units inside the stone, where it was born`).toBeLessThanOrEqual(speed + 1e-9);
  });
});
