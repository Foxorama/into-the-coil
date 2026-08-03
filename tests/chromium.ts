/**
 * THE one way a test finds Chromium. The lookup lives in `scripts/chromium.mjs`; this is a
 * one-line re-export so a `.ts` test does not have to know that.
 *
 * The home has to be the plain-ESM file so `.mjs` scripts can import it without a build step —
 * see the header there for why that direction, and why fifty silently-skipping tests are the
 * reason any of this exists.
 */
export { chromiumCandidates, findChromium, chromePath, launchChromium } from '../scripts/chromium.mjs';
