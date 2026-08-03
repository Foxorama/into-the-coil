/**
 * Product identity — the ONE place the game's name and version are written.
 *
 * Here from day one, before there is anything to rename. In the predecessor project the title
 * was a bare literal in six places, and the single free rename it got — free only because
 * nobody was holding the contract yet — still did not fully land: surfaces move one at a time,
 * and the one you forget keeps shipping the old name.
 *
 * ⚠️ **Some surfaces can never read this file**, and no constant can fix that: `index.html`'s
 * `<title>` and the boot watchdog run before any module, and a service worker is not in the
 * module graph at all. Those get a placeholder substituted at build time, or a literal — and
 * what holds them honest is a TEST asserting the spellings still agree, not a constant they
 * cannot import. That test lands with TEST SPINE.
 *
 * NOT rename targets: the npm package name and the repo.
 */

/**
 * Injected by Vite from package.json (see `vite.config.ts`). Declared, never defined here —
 * under a bare `tsc` run no bundler has substituted it, which `APP_VERSION` handles.
 */
declare const __APP_VERSION__: string;

/** The game's name, as shown to players. */
export const GAME_TITLE = 'Into the Coil';

/**
 * The shipped version, from package.json — the string a player quotes in a bug report.
 *
 * The `typeof` guard reads an undeclared global safely (it yields `'undefined'` rather than
 * throwing), so the constant still resolves under node and the test runner, where nothing has
 * substituted it. An unbundled run is visibly marked rather than silently claiming a release.
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev';
