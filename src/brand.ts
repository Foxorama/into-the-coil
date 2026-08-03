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
 * cannot import. That test is `tests/brand.test.ts`.
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
 * The reserved application identifier — **frozen, and deliberately not derived from `GAME_TITLE`.**
 *
 * Reverse-DNS is the shape every app store and package manager wants, and reserving one costs
 * nothing now while there is no store listing to contradict. What it buys is that the identifier
 * cannot be *invented under pressure* later, at the one moment it is least revisable.
 *
 * ⚠️ It does not track the title, and a test must never make it. An app id is the thing that says
 * two installs are the same app; changing it after publication does not rename anything, it forks
 * the app and orphans every install under the old id. So a rename moves `GAME_TITLE` and leaves
 * this exactly where it is — which is only possible because they were never tied together.
 *
 * Unused by any shipped surface today. The web manifest identifies the app by its start URL, which
 * is what the spec asks for; this waits for a native shell, a store listing, or neither.
 */
export const APP_ID = 'com.foxorama.intothecoil';

/**
 * The shipped version, from package.json — the string a player quotes in a bug report.
 *
 * The `typeof` guard reads an undeclared global safely (it yields `'undefined'` rather than
 * throwing), so the constant still resolves under node and the test runner, where nothing has
 * substituted it. An unbundled run is visibly marked rather than silently claiming a release.
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev';

/** Injected by Vite from the commit being built (see `buildId()` in `vite.config.ts`). */
declare const __BUILD_ID__: string;

/**
 * WHICH BUILD, not which release.
 *
 * `APP_VERSION` comes from package.json, so every build between two releases carries the same
 * string — in the predecessor it stood at one version across fourteen merges and five deploys.
 * That is the gap a play-test walked into: *"my phone still hasn't updated, but my wife's has"*,
 * with no way for the player, the developer, or a support reply to establish which build either
 * device was actually running.
 *
 * The commit is the one identifier that always moves. Shown beside the version wherever the
 * version is shown, so the answer is readable off the device rather than inferred from when
 * somebody last opened the app.
 */
export const BUILD_ID: string = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';
