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

/**
 * The offline shell, registered AFTER boot has been signalled — which is the whole point of putting
 * this here rather than in `index.html` beside the watchdog.
 *
 * `public/sw.js` precaches the shell on install. If the module graph has just failed, that shell is
 * a broken page, and precaching it turns a bad deploy into a bad deploy the player can no longer
 * escape by going offline and back. Registering below `ok()` means a page that cannot start also
 * cannot preserve itself.
 *
 * `PROD` only. The dev server would hand this worker a page whose placeholders no build has stamped,
 * and an offline cache is the last thing wanted in front of HMR.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Absolute URLs from the document, not bare relative strings: `scope` on `register()` resolves
  // against the script's URL, and in a single-file build that is the HTML document — a coincidence
  // worth not depending on.
  const scope = new URL('./', location.href).href;
  void navigator.serviceWorker.register(new URL('./sw.js', location.href).href, { scope }).catch(() => {
    // A worker that will not register costs offline play and nothing else. It must never be the
    // reason a page that has already booted stops working.
  });
}
