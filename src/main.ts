import { APP_VERSION, BUILD_ID, GAME_TITLE } from './brand.ts';

/**
 * The boot watchdog's half of the contract, declared where TypeScript can see it.
 *
 * The watchdog itself lives in `index.html` and runs before this module exists — see
 * `docs/decisions/0007-the-boot-watchdog.md`. Optional because a page can legitimately be
 * assembled without it (a test fixture, a future embed), and a missing watchdog must not be the
 * thing that stops the app from starting.
 */
declare global {
  interface Window {
    __ITC_BOOT__?: { ok(): void };
  }
}

// Deliberately trivial. Its one job at this phase is to be a real module graph with a real
// consumer of `brand.ts`, so `npm run build` proves the version and commit injections actually
// reach the bundle rather than only type-checking — and so they are not tree-shaken back out,
// which would make the guards in `tests/brand.test.ts` assert nothing.
const app = document.querySelector('#app');
if (app) app.textContent = `${GAME_TITLE} ${APP_VERSION} (${BUILD_ID})`;

// LAST, and only here. This is the single statement that tells the watchdog the module graph
// evaluated; anything that throws above leaves it unsaid, which is exactly the report wanted.
window.__ITC_BOOT__?.ok();
