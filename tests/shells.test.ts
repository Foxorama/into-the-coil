/**
 * THE SHIELDS ARE WORN — `docs/decisions/0584-the-shields-are-worn.md`.
 *
 * *"Shields need to be swappable cosmetics like the other ship items. Need a couple of different cosmetic
 * shields to buy."* What is held: the slot's rule (the wheels' — a ship's own, another's on the dash's rule,
 * a bought one on any ship), the trade, what is kept, the run wearing the shell fitted, and every shell drawn
 * at every place round the ship — in world units about it, which is what the player sees.
 */

import { describe, expect, it } from 'vitest';
import { SHELLS, SHELL_KINDS, shieldPlateOf, type ShellKind } from '../src/content/shells.ts';
import { MAX_SHIELDS, SHIELD_ANGLES, SHIPS, SHIP_KINDS, ownFit, shellOrbit, shelled, type ShipKind } from '../src/content/ships.ts';
import { OWNABLES, SHELF_KINDS, SHELVES, WARES } from '../src/content/wares.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { priced } from '../src/content/prices.ts';
import { initialState, reduce, type Action, type State } from '../src/state/root.ts';
import { initialHangar, shellOpen } from '../src/state/slices/hangar.ts';
import { SCREENS, optionWhy, shellWhy } from '../src/state/screens.ts';
import { hangarFrom, serialiseHangar } from '../src/save/hangar.ts';
import { drawKind } from '../src/render/bake.ts';
import { GameFrame } from '../src/app/frame.ts';
import { makeLifecycle } from '../src/app/lifecycle.ts';
import { tracingPen } from './paths.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/** The state with `shards` held and `ships` won in. */
function holding(shards: number, ...ships: ShipKind[]): State {
  const won = { ...initialState.hangar.won };
  for (const ship of ships) won[ship] = true;
  return { ...initialState, hangar: { ...initialState.hangar, shards, won } };
}

const SOLD = SHELL_KINDS.filter((kind) => SHELLS[kind].from === null);

describe('the shells', () => {
  it('THE ASK: every ship’s own shell is its row’s, and Cosmo’s sells a couple more on a shelf of their own', () => {
    for (const ship of SHIP_KINDS) {
      const own = SHELL_KINDS.filter((kind) => SHELLS[kind].from === ship);
      expect(own, `${ship} does not come with exactly one shell`).toHaveLength(1);
      expect(SHIPS[ship].shield, `${ship}'s row does not wear its own shell`).toBe(SHELLS[own[0]!].shell);
      expect(initialHangar.shell[ship], `${ship} does not open in its own shell`).toBe(own[0]);
    }
    expect(SOLD.length, '*"a couple of different cosmetic shields to buy"*').toBeGreaterThanOrEqual(2);
    expect(SHELVES.shields.wares).toEqual(SOLD);
    expect(SHELF_KINDS.at(-1), 'the tubes are no longer the last shelf').toBe('tubes');
    for (const kind of SOLD) {
      expect(WARES, `${kind} is not for sale`).toContain(kind);
      expect(OWNABLES[kind].price, `${kind} has no price`).not.toBe(null);
      expect(initialHangar.owned[kind], `${kind} was owned before it was bought`).toBe(false);
    }
  });

  it('every shell is its own sprites at every place, and its own look', () => {
    const seen = new Set<number>();
    for (const kind of SHELL_KINDS) {
      const shell = SHELLS[kind].shell;
      expect(shell.look, `${kind} is drawn as another shell`).toBe(kind);
      shell.places.forEach((frames, place) =>
        frames.forEach((sprite, shimmer) => {
          expect(seen.has(sprite), `${kind} shares a plate's sprite with another shell`).toBe(false);
          seen.add(sprite);
          const plate = shieldPlateOf(sprite);
          expect(plate?.shell, `${SPRITE_KINDS[sprite]} is not found as ${kind}'s plate`).toBe(shell);
          expect(plate?.place).toBe(place);
          expect(plate?.shimmer).toBe(shimmer);
        }),
      );
    }
  });
});

describe('the slot', () => {
  it('its own shell always; another ship’s on the dash’s rule; a bought one on any ship, won in or not', () => {
    const none = holding(0).hangar;
    expect(shellOpen(none, 'fighter', 'honeycomb')).toBe(true);
    expect(shellOpen(none, 'fighter', 'storm'), 'the Thunderbolt’s cage on a fighter never won in').toBe(false);
    expect(shellOpen(holding(0, 'fighter').hangar, 'fighter', 'storm'), 'borrowed from a ship never won in').toBe(false);
    expect(shellOpen(holding(0, 'fighter', 'thunderbolt').hangar, 'fighter', 'storm')).toBe(true);
    for (const kind of SOLD) expect(shellOpen(none, 'estate', kind), `${kind} never bought`).toBe(false);
    const bought = reduce(holding(10_000), { slice: 'hangar', type: 'bought', ware: 'disco' });
    expect(bought.hangar.shards).toBe(10_000 - OWNABLES.disco.price!);
    for (const ship of SHIP_KINDS) {
      expect(shellOpen(bought.hangar, ship, 'disco'), ship).toBe(true);
      expect(reduce(bought, { slice: 'hangar', type: 'shell', ship, shell: 'disco' }).hangar.shell[ship], ship).toBe('disco');
    }
  });

  it('refuses a shell not open to the ship, and moves nothing', () => {
    const tried = reduce(initialState, { slice: 'hangar', type: 'shell', ship: 'caddie', shell: 'aurora' });
    expect(tried, 'a shell was worn before it was bought').toBe(initialState);
    const borrowed = reduce(initialState, { slice: 'hangar', type: 'shell', ship: 'caddie', shell: 'plumes' });
    expect(borrowed, 'a shell was borrowed before either ship was won in').toBe(initialState);
  });

  it('is a band on Paint & Parts, every shell in the table’s order, saying why the shut ones are shut', () => {
    const band = SCREENS.parts.choices.find((c) => c.name === 'shell');
    expect(band?.options.map((o) => o.label)).toEqual(SHELL_KINDS.map((kind) => SHELLS[kind].name));
    expect(SCREENS.parts.stand?.groups.some((g) => g.bands.includes('shell')), 'the shield band is in no group').toBe(true);
    expect(shellWhy('fighter', false, false, false)).toContain('Cosmo');
    expect(shellWhy('fighter', true, true, false)).toBe(null);
    expect(optionWhy('shell', 'fighter', SHELL_KINDS.indexOf('aurora'), initialHangar.won)).toContain('Cosmo');
    expect(optionWhy('shell', 'fighter', SHELL_KINDS.indexOf('storm'), initialHangar.won)).toContain('Fighter');
  });

  it('is kept, and a document fits no shell its own wins or what it owns do not open', () => {
    const bought = reduce(holding(10_000), { slice: 'hangar', type: 'bought', ware: 'runes' });
    const worn = reduce(bought, { slice: 'hangar', type: 'shell', ship: 'firebird', shell: 'runes' });
    expect(hangarFrom(serialiseHangar(worn.hangar), initialHangar).shell.firebird).toBe('runes');
    const forged = JSON.parse(serialiseHangar(initialHangar)) as Record<string, unknown>;
    forged.shell = { fighter: 'aurora', caddie: 'storm', estate: 'nonsense' };
    const read = hangarFrom(JSON.stringify(forged), initialHangar);
    for (const ship of SHIP_KINDS) expect(read.shell[ship], `${ship} wears a shell its document never opened`).toBe(initialHangar.shell[ship]);
    // A document written before 0584 reads as every ship in its own.
    const before = JSON.parse(serialiseHangar(initialHangar)) as Record<string, unknown>;
    delete before.shell;
    expect(hangarFrom(JSON.stringify(before), initialHangar).shell).toEqual(initialHangar.shell);
  });

  it('0585: the shells are priced on the shop’s scale, raised', () => {
    expect(OWNABLES.runes.price).toBe(priced(600));
    expect(OWNABLES.aurora.price).toBe(priced(750));
    expect(OWNABLES.disco.price).toBe(priced(900));
  });
});

describe('the run', () => {
  it('begins in the shell the hangar fitted, and the shell stands its plates', () => {
    const built = playableWorld(NO_LEVEL);
    let current = initialState;
    const lifecycle = makeLifecycle(built.world, (action: Action) => {
      current = reduce(current, action);
    }, () => current.run);
    lifecycle.begin('savior', 'fighter', 'free', undefined, undefined, undefined, undefined, 'aurora');
    expect(built.world.shipRow.shield, 'the run did not open in the shell fitted').toBe(SHELLS.aurora.shell);
    const w = built.world;
    w.ship.health = SHIPS.fighter.health + MAX_SHIELDS;
    const frame = new GameFrame(w);
    for (let step = 0; step < 4; step++) frame.step();
    expect(w.shieldOrbs.size, 'no plate stood round the ship').toBeGreaterThan(0);
    const aurora = SHELLS.aurora.shell.places.flat();
    for (let i = 0; i < w.shieldOrbs.size; i++) expect(aurora, 'a plate was not the aurora’s').toContain(w.shieldOrbs.at(i).sprite);
  });

  it('a ship in its own shell is its own row, so nothing is copied for it', () => {
    for (const ship of SHIP_KINDS) expect(shelled(SHIPS[ship], SHIPS[ship].shield.look)).toBe(SHIPS[ship]);
    expect(ownFit('estate').shell).toBe('lattice');
  });
});

describe('the pictures', () => {
  it('every shell, at every place, curves round the ship at its orbit — and no two shells are one picture', () => {
    const ink = PALETTES[DEFAULT_PALETTE];
    const pictures = new Set<string>();
    for (const kind of SHELL_KINDS) {
      const shell = SHELLS[kind].shell;
      const orbit = shellOrbit(shell);
      shell.places.forEach((frames, place) => {
        const sprite = SPRITE_KINDS[frames[0]]!;
        const unit = 10;
        const size = SPRITE_EXTENT[sprite] * unit;
        const { pen, trace } = tracingPen();
        drawKind(pen, sprite, ink, size, 'rime');
        const sx = size / 2 - Math.cos(SHIELD_ANGLES[place]!) * orbit * unit;
        const sy = size / 2 - Math.sin(SHIELD_ANGLES[place]!) * orbit * unit;
        let marks = 0;
        for (const mark of [...trace.passes, ...trace.inks]) {
          for (const sub of mark.subpaths) {
            for (const [x, y] of sub) {
              marks++;
              const off = Math.hypot(x - sx, y - sy) / unit - orbit;
              expect(Math.abs(off), `${sprite} draws a mark ${off.toFixed(2)} units off the shell`).toBeLessThan(1.6);
            }
          }
        }
        expect(marks, `${sprite} draws nothing`).toBeGreaterThan(0);
        if (place === 0) pictures.add(JSON.stringify(trace.inks.map((s) => s.subpaths)));
      });
    }
    expect(pictures.size, 'two shells are one picture').toBe(SHELL_KINDS.length);
  });

  it('a sold shell’s shimmer frames are three pictures, so it moves', () => {
    const ink = PALETTES[DEFAULT_PALETTE];
    for (const kind of SOLD as readonly ShellKind[]) {
      const frames = SHELLS[kind].shell.places[0];
      const drawn = new Set(
        frames.map((sprite) => {
          const { pen, trace } = tracingPen();
          drawKind(pen, SPRITE_KINDS[sprite]!, ink, SPRITE_EXTENT[SPRITE_KINDS[sprite]!] * 10, 'approach');
          return JSON.stringify([trace.passes.map((p) => p.subpaths), trace.inks.map((p) => [p.subpaths, p.colour])]);
        }),
      );
      expect(drawn.size, `${kind} shimmers as one picture`).toBe(3);
    }
  });
});
