/**
 * THE SPRITE SHEET — every bitmap the game bakes, at the size it blits them, on the backdrop they
 * are found against.
 *
 * `docs/decisions/0193-the-sheet-is-the-instrument.md`.
 *
 * ⚠️ **THE BROWSER HALF, AND NO GUARD OPENS IT** — 0126's split. The arithmetic is `rig/sheet.ts`.
 *
 * ⚠️ **IT BAKES THE GAME'S OWN ATLAS.** `bakeAtlas` is `src/app/mount.ts`'s own call, at
 * `viewOf(...).scale * dpr`, which is `src/render/bake.ts` doing exactly what it does at run time.
 * Nothing here draws a sprite; it asks for the ones that ship and puts them on the page.
 * `docs/decisions/0116-the-rig-plays-the-level.md` is the rule and the reason: the rig that came
 * apart from the game had a verdict taken from it twice.
 */

import { INK_OF, bakeAtlas } from '../src/render/bake.ts';
import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { THEMES, THEME_KINDS, type ThemeKind } from '../src/content/themes.ts';
import { VIEWPORTS, rows, scaleFor } from './sheet.ts';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (el === null) throw new Error(`sheet: no #${id}`);
  return el as T;
};

/** A canvas holding one baked bitmap, at bake resolution, so its pixels can be read. */
function pixelsOf(source: CanvasImageSource, size: number): ImageData {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (ctx === null) throw new Error('sheet: no 2D context');
  ctx.drawImage(source, 0, 0);
  return ctx.getImageData(0, 0, size, size);
}

/**
 * What share of pixels differ between two bitmaps, 0 to 1.
 *
 * ⚠️ **THE DEFECT THIS PAGE EXISTS FOR IS `0` HERE** —
 * [`where-the-art-ceiling-is`](../reports/where-the-art-ceiling-is-2026-08-14.md): a boss and its hit
 * sprite share a `case` arm in `drawKind`, so five of the seven baked as **the same bitmap twice** and
 * had no hit interaction at all. **Every guard was green**, because no guard could read a bitmap.
 * A number beside the two pictures is what makes that visible without one.
 */
function differenceOf(a: ImageData, b: ImageData): number {
  if (a.data.length !== b.data.length) return 1;
  let differing = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      a.data[i] !== b.data[i] ||
      a.data[i + 1] !== b.data[i + 1] ||
      a.data[i + 2] !== b.data[i + 2] ||
      a.data[i + 3] !== b.data[i + 3]
    ) {
      differing++;
    }
  }
  return differing / (a.data.length / 4);
}

interface State {
  palette: PaletteName;
  theme: ThemeKind;
  viewport: number;
  zoom: number;
  identicalOnly: boolean;
}

const state: State = {
  palette: 'vivid',
  theme: 'approach',
  viewport: 1,
  zoom: 1,
  identicalOnly: false,
};

function render(): void {
  const vp = VIEWPORTS[state.viewport] ?? VIEWPORTS[0];
  if (vp === undefined) throw new Error('sheet: no viewport');
  const dpr = window.devicePixelRatio || 1;
  const scale = scaleFor(vp.w, vp.h, dpr);
  const palette = PALETTES[state.palette];
  const backdrop = THEMES[state.theme].space[state.palette];

  /*
    The game's own bake, at the game's own resolution, FOR THE PLACE CHOSEN. One call, every bitmap.

    ⚠️ **THE PLACE WAS NOT PASSED, AND THE SHEET SHOWED LEVEL ONE UNDER EVERY BACKDROP** — found by
    0228, whose skins are per place and came out identical in all seven. `bakeAtlas` defaults its
    theme to `approach`, so since 0195 the sky tiles here were The Approach's on every place too, and
    nothing said so: the backdrop changed and the bake did not. 0116's rule — the rig plays the
    level — arriving on the sheet.
  */
  const atlas = bakeAtlas(palette, 'side', scale, state.theme);

  const host = $('sheet');
  host.textContent = '';
  host.style.background = backdrop;

  let identical = 0;
  let shown = 0;

  for (const row of rows()) {
    const index = SPRITE[row.kind];
    const bitmap = atlas.bitmaps[index];
    if (bitmap === undefined) continue;
    const size = (bitmap as HTMLCanvasElement).width;

    let diff: number | null = null;
    if (row.twin !== null) {
      const twinBitmap = atlas.bitmaps[SPRITE[row.twin]];
      if (twinBitmap !== undefined) {
        diff = differenceOf(pixelsOf(bitmap, size), pixelsOf(twinBitmap, (twinBitmap as HTMLCanvasElement).width));
        if (diff === 0) identical++;
      }
    }

    if (state.identicalOnly && diff !== 0) continue;
    shown++;

    const card = document.createElement('div');
    card.className = 'card';
    if (diff === 0) card.classList.add('same');

    const head = document.createElement('div');
    head.className = 'name';
    head.textContent = row.kind;
    card.append(head);

    const art = document.createElement('div');
    art.className = 'art';
    art.style.background = backdrop;
    for (const kind of [row.kind, row.twin]) {
      if (kind === null) continue;
      const src = atlas.bitmaps[SPRITE[kind]];
      if (src === undefined) continue;
      const px = (src as HTMLCanvasElement).width;
      const shownPx = Math.round(px * state.zoom);
      const c = document.createElement('canvas');
      c.width = px;
      c.height = px;
      c.style.width = `${shownPx}px`;
      c.style.height = `${shownPx}px`;
      // Nearest-neighbour above 1×, so a zoom shows the pixels rather than a guess about them.
      c.style.imageRendering = state.zoom > 1 ? 'pixelated' : 'auto';
      const cx = c.getContext('2d');
      if (cx !== null) cx.drawImage(src, 0, 0);
      c.title = kind;
      art.append(c);
    }
    card.append(art);

    const meta = document.createElement('div');
    meta.className = 'meta';
    // What the sheet can say about a kind without opening the drawing: its size, and the ink its
    // hull is sealed in. What is painted on it is the picture beside this line — 0227.
    const bits = [`${SPRITE_EXTENT[row.kind]}u`, `${size}px`, INK_OF[row.kind]];
    meta.textContent = bits.join(' · ');
    card.append(meta);

    if (diff !== null) {
      const d = document.createElement('div');
      d.className = diff === 0 ? 'diff bad' : 'diff';
      d.textContent =
        diff === 0
          ? 'HIT SPRITE IS THE SAME BITMAP'
          : `hit differs on ${(diff * 100).toFixed(1)}% of pixels`;
      card.append(d);
    }

    host.append(card);
  }

  $('summary').textContent =
    `${SPRITE_KINDS.length} kinds · ${rows().length} rows · ${shown} shown · ` +
    `${identical} identical pair${identical === 1 ? '' : 's'} · ` +
    `${scale.toFixed(2)} px/unit at ${vp.label}, dpr ${dpr}`;
  $('summary').className = identical > 0 ? 'bad' : '';
}

function boot(): void {
  const paletteSel = $<HTMLSelectElement>('palette');
  for (const name of Object.keys(PALETTES) as PaletteName[]) {
    paletteSel.append(new Option(name, name));
  }
  paletteSel.value = state.palette;
  paletteSel.addEventListener('change', () => {
    state.palette = paletteSel.value as PaletteName;
    render();
  });

  const themeSel = $<HTMLSelectElement>('theme');
  for (const kind of THEME_KINDS) themeSel.append(new Option(`${THEMES[kind].title} (${kind})`, kind));
  themeSel.value = state.theme;
  themeSel.addEventListener('change', () => {
    state.theme = themeSel.value as ThemeKind;
    render();
  });

  const vpSel = $<HTMLSelectElement>('viewport');
  VIEWPORTS.forEach((v, i) => vpSel.append(new Option(v.label, String(i))));
  vpSel.value = String(state.viewport);
  vpSel.addEventListener('change', () => {
    state.viewport = Number(vpSel.value);
    render();
  });

  const zoomSel = $<HTMLSelectElement>('zoom');
  for (const z of [1, 2, 4, 8]) zoomSel.append(new Option(`${z}×${z === 1 ? ' (actual)' : ''}`, String(z)));
  zoomSel.value = String(state.zoom);
  zoomSel.addEventListener('change', () => {
    state.zoom = Number(zoomSel.value);
    render();
  });

  const only = $<HTMLButtonElement>('identical');
  only.addEventListener('click', () => {
    state.identicalOnly = !state.identicalOnly;
    only.setAttribute('aria-pressed', String(state.identicalOnly));
    render();
  });

  render();
}

boot();
