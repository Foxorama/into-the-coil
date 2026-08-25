/**
 * THE SPRITE SHEET'S ARITHMETIC — what to draw, in what order, and at what size.
 *
 * `docs/decisions/0193-the-sheet-is-the-instrument.md`.
 *
 * ⚠️ **DOM-FREE, AND THAT IS 0126's RULE RATHER THAN A PREFERENCE.**
 * `docs/decisions/0126-the-dashboard-is-the-instrument.md` split `rig/transport.ts` from
 * `rig/dash.ts` for a reason it had to discover: *a guard has to reach the values.* Everything a
 * test needs to ask about this instrument is here; the canvas half is `rig/sheet-page.ts` and no
 * guard opens it.
 *
 * ⚠️ **AND THE SAMENESS READOUT IS DELIBERATELY NOT HERE.** *Are these two bitmaps the same drawing*
 * is answered on the page, in real pixels, because that is the honest form of the question — the
 * defect it exists for is five bosses that baked as **the same bitmap twice**, which is a fact about
 * ink as well as about paths. The DOM-free version of the same claim already exists and is stronger
 * for a suite: `tests/accents.test.ts` over `tests/paths.ts` traces `drawKind` without a browser.
 * **Two instruments, one claim, neither a copy of the other.**
 */

import { SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { viewOf } from '../src/sim/camera.ts';

/** The suffix that makes a kind the hurt twin of another. */
const HIT = 'Hit';

/**
 * A kind and the twin that is drawn when it has just been shot, or `null` where it has none.
 *
 * ⚠️ **DERIVED FROM `SPRITE_KINDS` AND NEVER A SECOND TABLE.** A hand-written pairing is exactly the
 * shape `docs/decisions/0016-a-hub-enumerates-kinds.md` refuses: the day a kind is added, a list here
 * would go on looking complete. `src/content/sprites.ts` has the incident that argues for deriving.
 */
export function twinOf(kind: SpriteKind): SpriteKind | null {
  if (kind.endsWith(HIT)) return null;
  const twin = `${kind}${HIT}`;
  return (SPRITE_KINDS as readonly string[]).includes(twin) ? (twin as SpriteKind) : null;
}

/** One row of the sheet: a kind, and its hurt twin beside it where there is one. */
export interface Row {
  readonly kind: SpriteKind;
  readonly twin: SpriteKind | null;
}

/**
 * Every row, in `SPRITE_KINDS` order, with each `…Hit` folded into the row of the thing it hurts.
 *
 * ⚠️ **EVERY KIND APPEARS EXACTLY ONCE, AND `tests/sheet.test.ts` HOLDS THAT.** A contact sheet that
 * silently omits a sprite is worse than no contact sheet: it reads as a complete answer to *what does
 * the art look like*, which is the one question this page exists to answer.
 */
export function rows(): Row[] {
  const out: Row[] = [];
  for (const kind of SPRITE_KINDS) {
    if (kind.endsWith(HIT)) continue;
    out.push({ kind, twin: twinOf(kind) });
  }
  return out;
}

/** Every kind the rows above account for, twins included. */
export function covered(): SpriteKind[] {
  return rows().flatMap((r) => (r.twin === null ? [r.kind] : [r.kind, r.twin]));
}

/**
 * How many device pixels a world unit is, on a viewport of the given size.
 *
 * ⚠️ **ASKED OF `viewOf`, NEVER TYPED HERE** — the same rule `tests/dash.test.ts` holds over the
 * gun's cadence: *the ship's, never a number typed into the rig.* `src/app/mount.ts` bakes at
 * `view.scale * dpr`, so an *actual size* that derived its own scale would be showing the art at a
 * resolution the game never uses, and every legibility verdict taken from it would be about a picture
 * nobody sees. `docs/decisions/0027-measure-the-picture-not-the-model.md`.
 */
export function scaleFor(widthPx: number, heightPx: number, dpr: number): number {
  return viewOf(widthPx, heightPx).scale * dpr;
}

/**
 * The viewports offered, in CSS pixels, and why these three.
 *
 * ⚠️ **DESKTOP FIRST AND DESKTOP ONLY** —
 * `docs/decisions/0153-desktop-is-the-target.md`. These are three desktop shapes rather than a phone
 * ladder: the narrowest and widest landscape aspects
 * `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md` clamps lookahead between, plus the one in
 * the middle that most people are actually sitting at. **A sprite is legible or it is not at the size
 * it ships**, and the short axis is what decides that, so the middle number is the one that moves.
 */
export const VIEWPORTS: readonly { readonly label: string; readonly w: number; readonly h: number }[] = [
  { label: '1280×800 · 16:10', w: 1280, h: 800 },
  { label: '1920×1080 · 16:9', w: 1920, h: 1080 },
  { label: '2560×1080 · 21:9', w: 2560, h: 1080 },
];
