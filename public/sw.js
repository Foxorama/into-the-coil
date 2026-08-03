/*
 * Into the Coil service worker — OFFLINE PLAY, WITHOUT THE STALE-SERVE BUG.
 *
 * See docs/decisions/0008-the-shell-sidecars.md.
 *
 * ES5 and standalone, by necessity rather than taste. A worker is not in the module graph: it
 * cannot import `src/brand.ts`, it is not transpiled by the bundler, and it is copied out of
 * `public/` verbatim. The two values it needs from the build arrive as placeholders that
 * `vite.config.ts` stamps into `dist/sw.js` — and a missing placeholder fails the build.
 *
 * NETWORK-FIRST, deliberately, because the failure this is most likely to CAUSE is worse than the
 * one it exists to prevent. A cache-first worker that ships a bad shell has bricked every installed
 * copy of the app, and the players who most need the fix are exactly the ones who can no longer
 * receive it. So the cache is only ever read when the network genuinely is not there: online, a
 * fresh deploy always wins on the next load. Caching here buys offline play. It never buys speed at
 * the price of staleness.
 */

/*
 * THE CACHE PREFIX. Written once, and read three times below — the cache name, the retire-old-
 * versions sweep, and nothing else on the page.
 *
 * The predecessor wrote this same decision in three FILES that could not share a constant (here
 * twice, plus an index.html sweep that deleted every cache not carrying it), and the cost of
 * disagreement was the page deleting its own offline snapshot on every boot while believing it was
 * tidying up after a sibling app. That third site is gone — see
 * docs/decisions/0009-the-page-does-not-sweep-foreign-caches.md — which is why this is a local
 * constant now and not a contract held across files by a test.
 */
var PREFIX = 'into-the-coil-';

/*
 * THE VERSION AND THE BUILD, and the build is the load-bearing half.
 *
 * A worker is only re-installed when its BYTES change. Stamp the cache name with the package
 * version alone and every build between two releases emits a byte-identical `sw.js` — the browser
 * compares, finds no difference, and never runs `install` again, so the precached shell below stays
 * frozen at whichever build happened to be first. The commit always moves, which is the entire
 * reason `BUILD_ID` exists in `src/brand.ts`.
 */
var CACHE = PREFIX + '%ITC_VERSION%+%ITC_BUILD%';

/*
 * The whole app is one inlined `index.html` (decision 0003), so the shell is very nearly the whole
 * program. Precaching it means a cold offline launch works from the very next visit rather than
 * only after the player has already been offline once.
 */
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  // The icons are precached for the SPLASH SCREEN, not for the launcher. Android draws the splash
  // from the manifest's icon while the app starts, and an installed app launched with no network
  // and no cached icon opens on a blank rectangle — which looks exactly like the app failing to
  // start, on the one path this worker exists to make work.
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './icon-180.png',
];

self.addEventListener('install', function (e) {
  /*
   * `skipWaiting` is safe HERE specifically, and would not be in a multi-asset build: with one
   * self-contained file there is no second asset for a half-swapped worker to skew against. The
   * classic hazard — a new worker serving a new index against an old chunk — has no material.
   */
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // Best-effort, one at a time. `cache.addAll` is atomic: one entry 404s and the whole install
      // rejects, leaving the worker unactivated and the app with no offline copy at all. A missing
      // manifest should cost the manifest, not the shell.
      return Promise.all(
        SHELL.map(function (u) {
          return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
        }),
      );
    }),
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (k) {
            // OUR previous versions, and nothing else. A cache without this prefix belongs to
            // somebody else on this origin — which on itch.io is every other HTML game there.
            if (k.indexOf(PREFIX) === 0 && k !== CACHE) return caches.delete(k);
            return undefined;
          }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

/*
 * THE SHELL IS ALWAYS REVALIDATED, BECAUSE "NETWORK-FIRST" IS NOT ENOUGH ON ITS OWN.
 *
 * `fetch(req)` consults the browser's HTTP cache like any other fetch. GitHub Pages serves
 * `index.html` with `Cache-Control: max-age=600` and offers no way to change it, so for ten minutes
 * after any load a "network-first" worker answers a navigation out of the HTTP cache without ever
 * asking the server — and an installed app relaunched inside that window shows the previous build.
 * The predecessor reproduced this against a real deploy and confirmed the diagnosis the only way
 * that settles it: the stale page appeared **with the service worker removed entirely**.
 *
 * `cache: 'no-cache'` forces a conditional request, so the shell is revalidated on every launch and
 * a deploy is picked up on the next one. It is NOT `no-store`, which would bypass the cache in both
 * directions and re-download the entire single-file bundle over mobile data every time. `no-cache`
 * sends `If-None-Match`; an unchanged build costs a 304.
 *
 * Only the shell pays for this. Making every request conditional would put a round-trip in front of
 * each one and slow every cold start to buy freshness nothing else needs.
 */
function isShell(req, url) {
  return req.mode === 'navigate' || url.pathname === '/' || /(^|\/)index\.html$/.test(url.pathname);
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return; // only idempotent reads are cacheable
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin

  e.respondWith(
    (isShell(req, url) ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req))
      .then(function (res) {
        // Refresh the cache as a side effect; the live response is returned immediately either way.
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copy).catch(function () {});
          });
        }
        return res;
      })
      .catch(function () {
        // Genuinely offline. Serve the cached copy, falling back to the shell for a navigation so
        // a deep link still opens the app rather than the browser's error page.
        return caches.match(req).then(function (hit) {
          if (hit) return hit;
          if (req.mode === 'navigate') {
            return caches.match('./index.html').then(function (shell) {
              return shell || caches.match('./');
            });
          }
          return Response.error();
        });
      }),
  );
});
