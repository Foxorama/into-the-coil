/**
 * The yellow submarine hangs — `docs/decisions/0596-the-yellow-submarine-hangs.md`, item 4 of
 * [`the-secret-pilots-planned`](../reports/the-secret-pilots-planned-2026-10-11.md). The page: *"Yellow
 * submarine hangy"*, read as a yellow submarine to hang from the dash.
 *
 * What it looks like hanging is `tests/cosmo.browser.test.ts`'s, which tries every dangle on the dash and
 * asks that the thing on its strand is drawn with a width.
 */

import { describe, expect, it } from 'vitest';
import { DANGLES } from '../src/content/dangles.ts';
import { SHELVES, WARES } from '../src/content/wares.ts';

describe('0596 — the yellow submarine is sold to hang from the dash', () => {
  it('is a dangle, sold on the hanging shelf at the dearer dangles’ price', () => {
    expect(DANGLES.submarine.name).toBe('Yellow submarine');
    expect(WARES).toContain('submarine');
    expect(SHELVES.hanging.wares).toContain('submarine');
    expect(DANGLES.submarine.price, 'not priced with the mirror ball and the bobblehead').toBe(DANGLES.mirrorball.price);
  });
});
