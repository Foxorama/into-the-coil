import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * The shipped shell: what the build emits, and what the boot watchdog is promised to be.
 *
 * The behavioural half of the watchdog contract — that it actually catches what it claims to —
 * needs a browser and lives in `tests/watchdog.browser.test.ts`. What is asserted here is the
 * shape the browser cannot see: that the watchdog is present, is first, and shipped with its
 * placeholder filled in.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/** Every file the build emitted, relative to `dist/`. */
function distFiles(dir = 'dist', prefix = ''): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(root, dir))) {
    const rel = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(resolve(root, dir, entry)).isDirectory()) out.push(...distFiles(`${dir}/${entry}`, rel));
    else out.push(rel);
  }
  return out;
}

/**
 * The page is one self-contained file; the sidecars beside it are the ones that CANNOT be a file.
 *
 * Decisions 0003 and 0008. This list is closed on purpose. `dist/` growing a fourth entry means
 * either a real decision was made or the bundler quietly stopped inlining something — and the whole
 * value of the rule is that those two look identical until something asserts the difference.
 *
 * `404.html` is the decision, and it is `_headers`'s kind of sidecar rather than the manifest's:
 * the HOST serves it, by filename, and nothing on the page ever fetches it. It cannot be inlined
 * because being a separate file at a known name is the entire mechanism. Without it Cloudflare
 * Pages answers every unmatched route with `index.html` and a 200, which hands the whole bundle
 * to any scanner probing for `/.env` and flattens the 404 rate the access log is read by.
 */
const SIDECARS = [
  '404.html',
  'CNAME',
  '_headers',
  'manifest.webmanifest',
  'sw.js',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
];

describe('the build emits one self-contained page', () => {
  /**
   * Decision 0003, enforced — narrowed by 0008 to what it was always actually about.
   *
   * The rule is not tidiness: an EXTERNAL module script is a cross-origin request that Chrome
   * blocks under `file://`, so the page renders, the module never evaluates, and the only evidence
   * is a console error. It is also the whole 404 class the predecessor paid for repeatedly —
   * hashed-asset misses, CDN index/asset skew, a service worker serving a stale pair.
   *
   * None of the three sidecars is in that class. A manifest is fetched from a URL by definition, a
   * service worker must be its own top-level file to have a scope at all, and `_headers` is read by
   * the host and never fetched by anything. If any of them 404s, the page still boots.
   */
  it('dist/ is the page, plus exactly the files that could not be inlined', () => {
    expect(distFiles().sort()).toEqual(['index.html', ...SIDECARS].sort());
  });

  /**
   * THE BUILD UNDER TEST MUST BE THE BUILD THAT SHIPS.
   *
   * The registration in `src/main.ts` is guarded by `import.meta.env.PROD`, and a build that
   * believes it is not a production build strips the whole branch — leaving a `dist/` that looks
   * entirely normal, passes every other assertion in this file, and has no offline story at all.
   * That is not hypothetical: vitest sets `NODE_ENV=test`, `tests/globalSetup.ts` inherited it, and
   * this is exactly what happened. The offline tests found it; this is the cheap guard that names
   * it, because the expensive one needs a browser and a server.
   */
  it('the built page still registers the service worker', () => {
    expect(
      read('dist/index.html'),
      'the registration was eliminated from the bundle — this build does not think it is production',
    ).toContain('serviceWorker.register');
  });

  it('the shipped page references no external script or stylesheet', () => {
    const html = read('dist/index.html');
    const external = [
      ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi),
      ...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["']/gi),
    ].map((m) => m[1]);
    expect(external, `the build emitted a page that loads ${external.join(', ')} over the network`).toEqual([]);
  });

  /**
   * The sidecars are the only things the page may reach for, and it must survive not getting them.
   * A `<link rel="manifest">` that 404s costs installability; nothing else on the page notices.
   */
  it('every URL the page points at is a sidecar the build actually emitted', () => {
    const html = read('dist/index.html');
    const refs = [...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi)]
      .map((m) => m[1]!)
      .filter((href) => !/^(https?:|data:|#)/.test(href));
    expect(refs.length, 'the manifest link has gone missing from the built page').toBeGreaterThan(0);
    for (const href of refs) expect(SIDECARS, `the page links ${href}, which the build does not emit`).toContain(href);
  });
});

describe('the install manifest', () => {
  const manifest = (): Record<string, unknown> =>
    JSON.parse(read('dist/manifest.webmanifest')) as Record<string, unknown>;

  /**
   * THE assertion this file was worth writing for, and the one that has since changed its mind.
   *
   * The predecessor's manifest says `"orientation": "portrait"`, and it is right to — it is a golf
   * game. Carried forward without being read, that one word installs a game as the wrong shape of
   * app, and the player who notices is the one who already installed it. So this file has always
   * held the value; what it held was `landscape`, landed as scaffold before any design argued it.
   *
   * It is now `any`, per `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`: the long axis of
   * the screen is the scroll axis, so portrait is a native way to play rather than a broken one, and
   * a lock is the one thing that could make it unreachable. `src/sim/camera.ts` is what earns this.
   */
  it('installs unlocked, because both orientations are the game', () => {
    expect(manifest().orientation).toBe('any');
  });

  /**
   * Relative, all three. A PWA binds to the origin AND path it was installed from; an absolute
   * `start_url` is a promise about where the app lives that a staging deploy, an itch upload and a
   * `next.` subdomain each break differently.
   */
  it('is anchored relatively, so it installs correctly from any path', () => {
    const m = manifest();
    for (const key of ['id', 'start_url', 'scope']) {
      expect(String(m[key]), `manifest ${key} must be relative`).toMatch(/^\.\//);
    }
  });

  it('declares a display mode and a splash colour, so the install is not half-specified', () => {
    const m = manifest();
    expect(m.display).toBe('standalone');
    expect(String(m.background_color)).toMatch(/^#[0-9a-f]{6}$/i);
    expect(m.theme_color).toBe(m.background_color);
  });

  /**
   * The `<meta name="theme-color">` and the manifest's `theme_color` are the same decision written
   * twice, in two files that cannot share a constant. Disagree and the browser chrome flashes one
   * colour on load and settles on another.
   */
  it('agrees with the page about the theme colour', () => {
    const meta = /<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/i.exec(read('index.html'))?.[1];
    expect(meta, 'index.html has no theme-color meta').toBeTruthy();
    expect(meta).toBe(manifest().theme_color);
  });
});

/**
 * Icons, and the one thing about them that fails silently.
 *
 * Chrome will not offer to install a PWA without an icon of at least 192px, and it does not say so
 * anywhere the developer will see — the install prompt simply never appears. Since the plan expects
 * most players to install from the site rather than play in a tab, a missing or mis-declared icon
 * does not degrade the product, it closes the front door.
 *
 * The declared size is the part worth guarding. A manifest saying `512x512` over a file that is
 * actually 500px is REJECTED, and every symptom of that is the absence of something.
 */
describe('the launcher icons', () => {
  interface Icon {
    src: string;
    sizes: string;
    type: string;
    purpose: string;
  }
  const icons = (): Icon[] => (JSON.parse(read('dist/manifest.webmanifest')) as { icons: Icon[] }).icons;

  /** A PNG's real dimensions, straight out of the IHDR chunk that follows the 8-byte signature. */
  function pngSize(rel: string): [number, number] {
    const buf = readFileSync(resolve(root, rel));
    expect(buf.subarray(1, 4).toString('ascii'), `${rel} is not a PNG`).toBe('PNG');
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }

  it('are declared at the size they actually are', () => {
    for (const icon of icons()) {
      const [w, h] = pngSize(`dist/${icon.src}`);
      expect(
        `${w}x${h}`,
        `the manifest declares ${icon.src} as ${icon.sizes} but the file is ${w}x${h} — Chrome ` +
          'rejects the icon and silently stops offering to install',
      ).toBe(icon.sizes);
      expect(icon.type).toBe('image/png');
    }
  });

  it('include the 192 and 512 that installability actually requires', () => {
    const any = icons().filter((i) => i.purpose === 'any');
    expect(any.map((i) => i.sizes).sort()).toEqual(['192x192', '512x512']);
  });

  /**
   * A maskable icon is a DIFFERENT FILE, not a label on the same one. Android crops to whatever
   * shape the launcher likes and only the central 80% is guaranteed to survive, so the maskable
   * variant carries the art pulled in to fit. Declaring the ordinary icon as maskable — which is
   * what the predecessor does — hands the launcher art it is entitled to crop the edges off.
   */
  it('ship a maskable variant that is not just the ordinary icon relabelled', () => {
    const maskable = icons().filter((i) => i.purpose === 'maskable');
    expect(maskable, 'no maskable icon — Android will crop the plain one').toHaveLength(1);
    const plain = icons().find((i) => i.purpose === 'any' && i.sizes === maskable[0]!.sizes);
    expect(plain, 'expected a plain icon at the same size to compare against').toBeTruthy();
    expect(
      readFileSync(resolve(root, `dist/${maskable[0]!.src}`)).equals(
        readFileSync(resolve(root, `dist/${plain!.src}`)),
      ),
      'the maskable icon is byte-identical to the plain one, so its art is not inside the safe zone',
    ).toBe(false);
  });

  /** iOS reads none of the above. It reads one link tag, and ignores the manifest entirely. */
  it('include the apple-touch-icon, which the manifest cannot supply', () => {
    const href = /<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i.exec(read('index.html'))?.[1];
    expect(href, 'no apple-touch-icon — an iPhone home-screen install gets a page screenshot').toBeTruthy();
    expect(SIDECARS).toContain(href);
    expect(pngSize(`dist/${href}`)).toEqual([180, 180]);
  });

  /** Offline, an uncached splash icon is a blank rectangle that reads as a failure to start. */
  it('are precached by the worker, so an offline launch still draws its splash', () => {
    const sw = read('public/sw.js');
    for (const icon of icons()) expect(sw, `${icon.src} is not in the worker's SHELL list`).toContain(icon.src);
  });
});

describe('the service worker', () => {
  const source = (): string => read('public/sw.js');

  /**
   * ONE decision, ONE place — which is the point of decision 0009 rather than a happy accident.
   *
   * The predecessor wrote this prefix in three files that could not share a constant and needed a
   * test to hold them in agreement. Dropping the page's origin-wide cache sweep removed the third
   * site and collapsed the other two into a local variable, so what is asserted here is not that
   * the copies agree — it is that there are no copies.
   */
  it('spells its cache prefix exactly once', () => {
    const occurrences = source().split('into-the-coil-').length - 1;
    expect(occurrences, 'the cache prefix has been inlined again — it belongs in the PREFIX constant').toBe(1);
  });

  /**
   * The sweep in `activate` must be able to name what it deletes. A sweep that deletes everything
   * it did not create is the behaviour 0009 exists to keep off this origin, and the worker is the
   * one place with enough context to be trusted with `caches.delete` at all.
   */
  it('retires only its own previous versions', () => {
    const activate = source().slice(source().indexOf("addEventListener('activate'"));
    expect(activate).toContain('caches.delete');
    expect(activate, 'the activate sweep must be gated on OUR prefix, or it deletes a stranger’s cache').toMatch(
      /indexOf\(PREFIX\)\s*===\s*0/,
    );
  });

  /**
   * Network-first is the whole safety argument for shipping a worker at all: a cache-first worker
   * that ships a broken shell has bricked every installed copy, and the players who most need the
   * fix are the ones who can no longer receive it.
   */
  it('answers the network first, and the cache only when there is no network', () => {
    const fetchHandler = source().slice(source().indexOf("addEventListener('fetch'"));
    const fetchAt = fetchHandler.indexOf('fetch(');
    const cacheAt = fetchHandler.indexOf('caches.match');
    expect(fetchAt, 'the fetch handler never reaches the network').toBeGreaterThan(-1);
    expect(cacheAt, 'the fetch handler never falls back to the cache').toBeGreaterThan(-1);
    expect(cacheAt, 'the cache is consulted before the network — that is cache-first').toBeGreaterThan(fetchAt);
    // The shell specifically must be revalidated, because `fetch()` reads the browser's HTTP cache
    // and GitHub Pages sends the shell with `max-age=600` that it will not let you change.
    expect(fetchHandler).toContain("cache: 'no-cache'");
  });

  /**
   * A byte-identical `sw.js` is never re-installed by the browser, so a cache name carrying only
   * the package version freezes the precached shell at whichever build first shipped that version.
   * The commit is the only identifier that always moves.
   */
  it('ships stamped with both the version and the commit it was built from', () => {
    const src = source();
    expect(src, 'public/sw.js must carry the version placeholder').toContain('%ITC_VERSION%');
    expect(src, 'public/sw.js must carry the build placeholder').toContain('%ITC_BUILD%');

    const built = read('dist/sw.js');
    expect(built, 'a placeholder shipped unsubstituted').not.toContain('%ITC_');
    const pkg = JSON.parse(read('package.json')) as { version: string };
    const sha = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
    // The prefix stays a variable through the copy, so the cache name only exists concatenated at
    // runtime — what ships is the prefix and the stamped tail, asserted separately.
    expect(built, 'the cache prefix did not survive the copy into dist/').toContain('into-the-coil-');
    expect(built, `the worker must name the build it belongs to (${pkg.version}+${sha})`).toContain(
      `${pkg.version}+${sha}`,
    );
  });
});

describe('the cache headers ship with the shell', () => {
  /**
   * Only Cloudflare reads this file — GitHub Pages ignores it and itch serves a zip. It is written
   * to be correct on any host precisely so that being ignored on two of them costs nothing, and so
   * that a move can only ever make the shell fresher.
   *
   * `/sw.js` is the row that matters most: a cached service worker is a cached DECISION about how
   * everything else gets served, and it outlives the tab that installed it.
   */
  it('revalidates every part of the shell, sw.js included', () => {
    // The rules only — the file's own commentary discusses `no-store` at length, and a guard that
    // reads prose cannot tell a warning about a mistake from the mistake.
    const rules = read('dist/_headers')
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('#'))
      .join('\n');
    for (const path of ['/', '/index.html', '/sw.js', '/manifest.webmanifest']) {
      const rule = new RegExp(`^${path.replace(/[/.]/g, '\\$&')}\\s*\\n\\s+Cache-Control:\\s*no-cache\\s*$`, 'im');
      expect(rules, `${path} is not held to no-cache`).toMatch(rule);
    }
    // `no-store` would bypass the cache in both directions and re-download the whole single-file
    // bundle on every launch, on mobile data. `no-cache` sends If-None-Match; unchanged costs a 304.
    expect(rules, 'no-store re-downloads the entire bundle every launch').not.toContain('no-store');
  });
});

describe('the boot watchdog is where it has to be', () => {
  /**
   * Position IS the contract. A watchdog after the module script cannot catch that script failing
   * to load, and a watchdog inside a module cannot run at all when the module graph is what broke.
   */
  it('runs before the module script, in the source page', () => {
    const html = read('index.html');
    const watchdog = html.indexOf('__ITC_BOOT__');
    const moduleScript = html.indexOf('<script type="module"');
    expect(watchdog, 'index.html has no boot watchdog').toBeGreaterThan(-1);
    expect(moduleScript).toBeGreaterThan(-1);
    expect(watchdog, 'the watchdog must be registered before the module script it guards').toBeLessThan(
      moduleScript,
    );
  });

  it('is a classic script, so no bundler can transpile or defer it', () => {
    const html = read('index.html');
    const tag = /<script(?![^>]*\btype=)[^>]*>/.exec(html.slice(0, html.indexOf('__ITC_BOOT__')));
    expect(tag, 'the watchdog must be a plain <script> — a module is deferred and cannot guard the boot').toBeTruthy();
  });

  /**
   * Decision 0009, held where it can actually be broken.
   *
   * The predecessor's pre-boot script deleted every Cache Storage entry on the origin that did not
   * carry its own prefix. On a shared origin — itch serves every HTML game on the site from
   * `html-classic.itch.zone` — that is one game deleting another game's offline copy on every
   * boot, and it protects nothing: a cache is inert data, and only a WORKER controlling this page
   * can serve from one.
   *
   * This is the most re-addable line in the repo. It reads as tidying up, the damage is invisible
   * from here, and the code it came from is a file away in the predecessor.
   */
  it('never deletes a cache it did not create — the page does not touch Cache Storage at all', () => {
    const html = read('index.html');
    expect(html, 'the page is sweeping caches again — that belongs to sw.js, on its own prefix').not.toMatch(
      /caches\s*\.\s*(delete|keys)\b/,
    );
  });

  /**
   * The other half of the same decision: the page MAY remove a worker that can intercept it, but
   * only one that can. A registration at a sibling scope cannot reach this page, so unregistering
   * it is pure collateral damage on a shared origin.
   */
  it('unregisters only ancestor-scoped workers, never siblings', () => {
    const html = read('index.html');
    expect(html, 'the page no longer guards against a foreign worker intercepting it').toContain('unregister');
    expect(
      html,
      'the scope narrowing is gone — this now unregisters every worker on the origin, including strangers',
    ).toMatch(/ours\.indexOf\(scope\)\s*===\s*0/);
  });

  /**
   * The watchdog cannot import `src/brand.ts`, so the version arrives by string substitution — and
   * a string substitution that silently does nothing looks exactly like one that worked.
   */
  it('ships with its version placeholder substituted', () => {
    expect(read('index.html'), 'the source page must carry the placeholder').toContain('%ITC_VERSION%');
    const built = read('dist/index.html');
    const pkg = JSON.parse(read('package.json')) as { version: string };
    expect(built, 'the placeholder shipped unsubstituted').not.toContain('%ITC_VERSION%');
    expect(built).toContain(pkg.version);
  });
});
