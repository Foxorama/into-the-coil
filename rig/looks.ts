/**
 * Every look the hangar can fit, on one page — `docs/decisions/0530-the-ions-burn-blue.md`, for the review
 * the plan owed of items 5 to 10 (`reports/the-hangar-planned-2026-10-05.md`).
 *
 * Asked, after item 6: *"Do we need to verify each and every item? or is there a better way?"* The tests
 * hold every rule; what they cannot hold is whether a look looks right. This draws every ship in every gun,
 * every look, every rim, a spread of paints and both flames, each at the size the fight ships it and three
 * times that, on a place's own sky — `?theme=rime` for the frost ship's, and so on — so one page is the
 * review rather than ten plays.
 *
 * Dev only: `vite.config.ts` builds the root page alone, as for every page under `rig/`.
 */

import { bakeShell, drawKind, drawPlayerShip, withFlame, type Pen } from '../src/render/bake.ts';
import { SHELLS, SHELL_KINDS } from '../src/content/shells.ts';
import { DEFAULT_PALETTE, PALETTES } from '../src/content/palette.ts';
import { SHELL_SPAN, SHIPS, SHIP_KINDS, type ShipKind } from '../src/content/ships.ts';
import { WEAPONS, WEAPON_KINDS, type WeaponKind } from '../src/content/weapons.ts';
import { ART, type ArtKind } from '../src/content/art.ts';
import { RIMS, RIM_KINDS, type RimKind } from '../src/content/rims.ts';
import { HUES, TONES, liveryInk } from '../src/content/livery.ts';
import { FLAMES, FLAME_KINDS } from '../src/content/flames.ts';
import { THEME_KINDS, THEMES, type ThemeKind } from '../src/content/themes.ts';
import { SHIP_BOX, SPRITE_EXTENT } from '../src/content/sprites.ts';

const palette = PALETTES[DEFAULT_PALETTE];
const asked = new URLSearchParams(location.search).get('theme');
const theme: ThemeKind = THEME_KINDS.find((kind) => kind === asked) ?? 'approach';
const sky = THEMES[theme].space.vivid;
document.body.style.background = sky;

/** The shipped camera at 1280x720: about six pixels a world unit. */
const PX = 6;

/** One cell: a label, and the picture at the shipped size and three times it. */
function cell(row: HTMLElement, label: string, draw: (pen: Pen, size: number) => void, extent: number): void {
  const box = document.createElement('figure');
  box.style.cssText = 'display:inline-block;margin:6px;text-align:center;color:#cfd3e6;font:11px sans-serif';
  for (const scale of [3, 1]) {
    const size = Math.round(extent * PX * scale);
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    c.style.verticalAlign = 'bottom';
    c.style.marginRight = '4px';
    draw(c.getContext('2d') as unknown as Pen, size);
    box.appendChild(c);
  }
  const caption = document.createElement('figcaption');
  caption.textContent = label;
  box.appendChild(caption);
  row.appendChild(box);
}

/** A ship drawn as the hangar can fit it. */
function ship(kind: ShipKind, fit: { gun?: WeaponKind; rim?: RimKind; art?: ArtKind; livery?: string }): (pen: Pen, size: number) => void {
  const row = SHIPS[kind];
  return (pen, size) =>
    drawPlayerShip(pen, { half: size / 2, r: size * 0.42 }, palette, kind, 0, fit.gun ?? row.weapon, fit.rim ?? row.wheels?.rim ?? null, fit.art ?? row.arts[0], fit.livery ?? null);
}

const host = document.getElementById('looks')!;
const heading = document.createElement('h1');
heading.textContent = 'Every look, on ' + theme + ' — the shipped size beside three times it';
heading.style.cssText = 'color:#e8e9f2;font:600 14px sans-serif';
host.appendChild(heading);

for (const kind of SHIP_KINDS) {
  const section = document.createElement('section');
  const title = document.createElement('h2');
  title.textContent = SHIPS[kind].label;
  title.style.cssText = 'color:#e8e9f2;font:600 13px sans-serif;margin:14px 6px 2px';
  section.appendChild(title);
  const extent = 9.4;
  const guns = document.createElement('div');
  for (const gun of WEAPON_KINDS) cell(guns, 'Gun: ' + WEAPONS[gun].label, ship(kind, { gun }), extent);
  section.appendChild(guns);
  const arts = document.createElement('div');
  for (const art of SHIPS[kind].arts) cell(arts, 'Art: ' + ART[art].name, ship(kind, { art }), extent);
  section.appendChild(arts);
  if (SHIPS[kind].wheels !== null) {
    const rims = document.createElement('div');
    for (const rim of RIM_KINDS) cell(rims, 'Wheels: ' + RIMS[rim].name, ship(kind, { rim }), extent);
    section.appendChild(rims);
  }
  const paints = document.createElement('div');
  cell(paints, 'Paint: Factory', ship(kind, {}), extent);
  for (const [hue, tone] of [[0, 1], [3, 2], [6, 0], [8, 1], [9, 0], [11, 2]] as const) {
    cell(paints, 'Paint: ' + HUES[hue]!.name + ' ' + TONES[tone]!.name, ship(kind, { livery: liveryInk({ hue, tone }) }), extent);
  }
  section.appendChild(paints);
  host.appendChild(section);
}

const flames = document.createElement('section');
for (const flame of FLAME_KINDS) {
  for (const sprite of ['thrustBurn0', 'thrustIdle0'] as const) {
    cell(flames, 'Flame: ' + FLAMES[flame].name, (pen, size) => withFlame(flame, () => drawKind(pen, sprite, palette, size, theme)), SPRITE_EXTENT[sprite]);
  }
}
cell(flames, 'The frost ship’s shard', (pen, size) => drawKind(pen, 'frost', palette, size, theme), SPRITE_EXTENT.frost);
host.appendChild(flames);

// 0584: every shell, as three shields wear it, round the ship it comes on — or the fighter, for one sold.
const shells = document.createElement('section');
for (const kind of SHELL_KINDS) {
  const wearer = SHELLS[kind].from ?? 'fighter';
  cell(
    shells,
    'Shield: ' + SHELLS[kind].name,
    (pen, size) => {
      drawPlayerShip(pen, { half: size / 2, r: (SHIP_BOX / SHELL_SPAN) * size * 0.42 }, palette, wearer, 0, SHIPS[wearer].weapon, SHIPS[wearer].wheels?.rim ?? null, SHIPS[wearer].arts[0], null);
      (pen as unknown as CanvasRenderingContext2D).drawImage(bakeShell(kind, palette, size, 0, SHELL_SPAN), 0, 0);
    },
    SHELL_SPAN,
  );
}
host.appendChild(shells);

// 0586: every ship's lights, laid on it as the fight lays them, in each of their pictures and turned a little.
const lit = document.createElement('section');
for (const kind of SHIP_KINDS) {
  const row = SHIPS[kind];
  if (row.lamps.length === 0) continue;
  const pictures = Math.max(...row.lamps.map((lamp) => lamp.frames.length));
  for (let n = 0; n < pictures; n++) {
    cell(
      lit,
      'Lights: ' + row.label + ' ' + String(n),
      (pen, size) => {
        drawPlayerShip(pen, { half: size / 2, r: size * 0.42 }, palette, kind, 0, row.weapon, row.wheels?.rim ?? null, row.arts[0], null);
        const ctx = pen as unknown as CanvasRenderingContext2D;
        const unit = size / SHIP_BOX;
        for (const lamp of row.lamps) {
          const sprite = lamp.frames[n % lamp.frames.length]!;
          const side = Math.max(2, Math.round(SPRITE_EXTENT[sprite] * unit));
          const tile = document.createElement('canvas');
          tile.width = side;
          tile.height = side;
          drawKind(tile.getContext('2d') as unknown as Pen, sprite, palette, side, theme);
          ctx.save();
          ctx.translate(size / 2 + lamp.at.along * unit, size / 2 + lamp.at.across * unit);
          ctx.rotate(lamp.turn === null ? 0 : n * 0.3);
          ctx.drawImage(tile, -side / 2, -side / 2);
          ctx.restore();
        }
      },
      SHIP_BOX,
    );
  }
}
host.appendChild(lit);

// 0588: the ray's four rings in each of their pages, straight ahead and steered to the edge of their arc.
const rays = document.createElement('section');
for (const page of ['ray', 'rayRipple', 'raySwell'] as const) {
  for (const turn of [0, -WEAPONS.ray.aim]) {
    cell(
      rays,
      'Ray: ' + page + (turn === 0 ? '' : ' steered'),
      (pen, size) => {
        const tile = document.createElement('canvas');
        tile.width = size;
        tile.height = size;
        drawKind(tile.getContext('2d') as unknown as Pen, page, palette, size, theme);
        const ctx = pen as unknown as CanvasRenderingContext2D;
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(turn);
        ctx.drawImage(tile, -size / 2, -size / 2);
        ctx.restore();
      },
      SPRITE_EXTENT[page],
    );
  }
}
host.appendChild(rays);
document.body.dataset.ready = '1';
