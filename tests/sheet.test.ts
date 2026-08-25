/**
 * THE SPRITE SHEET'S ARITHMETIC — `docs/decisions/0193-the-sheet-is-the-instrument.md`.
 *
 * ⚠️ **NOTHING HERE IS ABOUT HOW A SPRITE LOOKS, AND THAT IS DELIBERATE** —
 * `docs/decisions/0192-a-guard-holds-an-invariant.md`. *Does this hull read as a raptor* is a taste,
 * and a taste that could fail a suite is a specification nobody wrote. What is held here is that the
 * instrument **cannot lie about what it is showing**: that it shows every kind, that it pairs each
 * one with the right twin, and that *actual size* is the size the game actually bakes at.
 *
 * ⚠️ **THE SAMENESS READOUT IS NOT GUARDED HERE AND IS NOT UNGUARDED.** It reads real pixels in a
 * browser; the DOM-free form of the same claim is `tests/accents.test.ts` over `tests/paths.ts`,
 * which traces `drawKind` without one. Two instruments, one claim.
 */

import { describe, expect, it } from 'vitest';

import { SPRITE_KINDS, type SpriteKind } from '../src/content/sprites.ts';
import { VIEWPORTS, covered, rows, scaleFor, twinOf } from '../rig/sheet.ts';
import { viewOf } from '../src/sim/camera.ts';

describe('0193 — the sheet shows the whole atlas, and it cannot quietly show less', () => {
  it('THE ONE THAT CANNOT BE RECOVERED FROM: every sprite kind appears exactly once', () => {
    /*
      ⚠️ **A CONTACT SHEET THAT OMITS A SPRITE IS WORSE THAN NO CONTACT SHEET**, because it reads as
      a complete answer to the one question the page exists to answer. The rows are derived from
      `SPRITE_KINDS`, so the failure this refuses is a future kind that lands in the union and never
      reaches the page — which nothing on the page could show you.
    */
    const seen = covered();
    expect(seen.length, 'the sheet covers a different number of kinds than exist').toBe(SPRITE_KINDS.length);
    expect(new Set(seen).size, 'a kind is drawn twice').toBe(seen.length);
    for (const kind of SPRITE_KINDS) {
      expect(seen, `${kind} is a sprite kind and the sheet never shows it`).toContain(kind);
    }
  });

  it('and a hurt twin is DERIVED from the union, never a table beside it', () => {
    /*
      ⚠️ **`docs/decisions/0016-a-hub-enumerates-kinds.md` OVER A PAIRING.** A hand-written list of
      pairs would go on looking complete the day a kind is added — and `src/content/sprites.ts` has
      the incident that argues for deriving rather than restating.
    */
    for (const kind of SPRITE_KINDS) {
      const twin = twinOf(kind);
      if (kind.endsWith('Hit')) {
        expect(twin, `${kind} is a hurt sprite and claims a twin of its own`).toBeNull();
        const base = kind.slice(0, -3) as SpriteKind;
        expect(SPRITE_KINDS, `${kind} is a hurt sprite for ${base}, which is not a kind`).toContain(base);
        continue;
      }
      if (twin !== null) {
        expect(SPRITE_KINDS, `${kind} claims the twin ${twin}, which is not a kind`).toContain(twin);
        expect(twin, `${kind}'s twin is not its own hurt sprite`).toBe(`${kind}Hit`);
      }
    }
    // And every hurt sprite is somebody's twin, so none can be stranded off the page.
    const twins = rows().flatMap((r) => (r.twin === null ? [] : [r.twin]));
    const hurt = SPRITE_KINDS.filter((k) => k.endsWith('Hit'));
    expect([...twins].sort(), 'a hurt sprite belongs to nobody').toEqual([...hurt].sort());
  });

  it('ACTUAL SIZE IS THE GAME’S OWN SCALE, never a number typed into the rig', () => {
    /*
      ⚠️ **THE RULE `tests/dash.test.ts` HOLDS OVER THE GUN'S CADENCE, POINTED AT A RESOLUTION.**
      `src/app/mount.ts` bakes at `viewOf(w, h).scale * dpr`. A sheet that derived its own scale
      would show the art at a resolution the game never uses, and every legibility verdict taken from
      it would be about a picture nobody sees —
      `docs/decisions/0027-measure-the-picture-not-the-model.md`.
    */
    for (const vp of VIEWPORTS) {
      for (const dpr of [1, 1.5, 2]) {
        expect(
          scaleFor(vp.w, vp.h, dpr),
          `${vp.label} at dpr ${dpr} is not what the game would bake at`,
        ).toBe(viewOf(vp.w, vp.h).scale * dpr);
      }
    }
  });

  it('AND THE OFFERED VIEWPORTS SPAN THE CLAMP, or the worst case is unreachable', () => {
    /*
      ⚠️ **THE FINDING THIS GUARD IS MADE OF, AND IT IS NOT THE OBVIOUS ONE.** The first run of the
      sheet put 1280×800 at **7.19 px/unit** against 1920×1080's **10.79** — a third smaller for the
      same world extent, on the screen that is *taller*. `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`
      clamps lookahead to 178–240 units, so a 16:10 view cannot show its natural 160 and buys the
      extra span out of scale instead. **The binding legibility case is the narrow laptop, not the
      ultrawide**, which is the opposite of what the aspect suggests.
    *
      ⚠️ **SO AN INSTRUMENT THAT ONLY OFFERED 16:9 AND WIDER WOULD BE ANSWERING THE EASY QUESTION.**
      One viewport at or below the clamp's floor and one at or above its ceiling, or this page cannot
      show the case a sprite actually has to survive.
    */
    const alongs = VIEWPORTS.map((v) => viewOf(v.w, v.h).alongSpan);
    const scales = VIEWPORTS.map((v) => viewOf(v.w, v.h).scale);
    expect(
      Math.min(...alongs),
      'no offered viewport is narrow enough to be clamped, so the smallest bake is unreachable',
    ).toBeLessThanOrEqual(178);
    expect(
      Math.max(...alongs),
      'no offered viewport reaches the wide end of the clamp',
    ).toBeGreaterThan(230);
    expect(
      Math.min(...scales),
      'the narrowest viewport does not bake smallest, so the clamp is not being exercised',
    ).toBe(viewOf(1280, 800).scale);
  });
});
