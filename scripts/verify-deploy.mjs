// IS THE THING BEING SERVED THE THING THAT WAS BUILT?
//
//   node scripts/verify-deploy.mjs https://intothecoil.vulpecula.games/
//
// Runs against a live origin — from `release.yml` after a deploy, or by hand against staging. Plain
// ESM with no dependencies so it needs no build step and no browser; every check here is about what
// the HOST returns, which `fetch` can see perfectly well.
//
// It exists because a deployment reporting success proves only that files were uploaded somewhere.
// The predecessor's first staging deploy went green while serving its repository root, and this
// project repeated it exactly: the build was correct, the upload was correct, and the URL served
// raw TypeScript. Every check upstream of the host was green the whole time.
//
// ⚠️ TWO THINGS MAKE THE OBVIOUS VERSION OF THIS CHECK USELESS, both learned the hard way:
//
//   1. STATUS CODES PROVE NOTHING. Cloudflare Pages answers an unknown path with `200` and the
//      contents of index.html, so `/src/main.ts` never 404s no matter what is deployed. Every
//      assertion below is therefore about CONTENT.
//   2. THE CDN WILL LIE TO YOU. A plain request returned a 66-minute-old cached copy of the
//      previous deployment — correct-looking, and describing a build that had been replaced. Every
//      request here carries a cache-buster, and that is not belt-and-braces: without it this script
//      reports on whatever the edge happened to keep.

const origin = process.argv[2];
if (!origin) {
  console.error('usage: node scripts/verify-deploy.mjs <url>');
  process.exit(2);
}
const base = origin.endsWith('/') ? origin : `${origin}/`;

const failures = [];
const check = (ok, what, detail) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${what}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(what);
};

/** Never a bare URL: see the CDN note above. */
const bust = (path) => new URL(path, base).href + (path.includes('?') ? '&' : '?') + `v=${Date.now()}-${process.pid}`;

/** Pages can serve a deploy a moment after reporting it, so a first miss is not yet a failure. */
async function get(path, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(bust(path), { redirect: 'follow', cache: 'no-store' });
      if (res.ok) return res;
      last = `HTTP ${res.status}`;
    } catch (e) {
      last = String(e);
    }
    await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
  }
  throw new Error(`${path}: ${last}`);
}

console.log(`verifying ${base}\n`);

const html = await (await get('')).text();

// THE RAW-SOURCE SIGNATURE. A Vite build cannot emit this string; a host serving the repository
// root emits it in the first ten lines. It is the single cheapest way to tell the two apart, and it
// is a CONTENT test precisely because the status code is 200 either way.
check(!html.includes('/src/main.ts'), 'the served page is a build, not the repository root', 'found /src/main.ts');

// A placeholder that shipped is a substitution step that silently did nothing — and the boot
// watchdog would quote it back to a player inside a bug report.
check(!/%ITC_[A-Z]+%/.test(html), 'no build placeholder survived into the page');

const pkg = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../package.json', import.meta.url), 'utf8'));
check(html.includes(pkg.version), `the page reports version ${pkg.version}`);

// Decision 0003: nothing on the render path may be an external fetch.
const external = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]);
check(external.length === 0, 'the page loads no external script', external.join(', '));

// The install path. An icon that 404s costs the install PROMPT and nothing else — which is to say
// it fails in the one way nobody notices until they try to install.
//
// ⚠️ PARSED DEFENSIVELY, and that is not politeness. On a host that answers unknown paths with
// index.html, a MISSING manifest arrives as a 200 full of HTML — so the first version of this
// script threw an unhandled `SyntaxError` here and died mid-run with a stack trace and a garbage
// exit code, on precisely the broken deploy it was written to describe. A verifier that crashes
// when it finds the fault reports less than one that says nothing.
let manifest = null;
try {
  manifest = JSON.parse(await (await get('manifest.webmanifest')).text());
} catch (e) {
  check(false, 'the manifest is served and parses as JSON', String(e).split('\n')[0]);
}

if (manifest) {
  check(manifest.orientation === 'any', 'the manifest installs unlocked', manifest.orientation);
  check(manifest.name === 'Into the Coil', 'the manifest carries the product name', manifest.name);

  for (const icon of manifest.icons ?? []) {
    try {
      const res = await get(icon.src, 2);
      const type = res.headers.get('content-type') ?? '';
      // The fallback page is an HTML 200. An icon that "loads" as text/html is a missing icon.
      check(type.startsWith('image/'), `icon ${icon.src} is an image`, type);
    } catch (e) {
      check(false, `icon ${icon.src} is reachable`, String(e));
    }
  }
}

try {
  const sw = await get('sw.js');
  const type = sw.headers.get('content-type') ?? '';
  check(type.includes('javascript'), 'sw.js is served as JavaScript', type);
  const swBody = await sw.text();
  check(!swBody.includes('%ITC_'), 'the worker shipped stamped, not with placeholders');
  check(swBody.includes('into-the-coil-'), 'the worker carries its cache prefix');
} catch (e) {
  check(false, 'sw.js is reachable', String(e).split('\n')[0]);
}

console.log('');
if (failures.length) {
  console.error(`${failures.length} check(s) failed against ${base}`);
  // `process.exitCode`, never `process.exit()`. Calling `exit()` here tore down libuv while undici
  // still held keep-alive sockets from the checks above, and node aborted — printing every finding
  // correctly and then exiting 0xC0000409 instead of 1. A gate that reports the fault and then
  // crashes on the way out is a gate whose exit code cannot be trusted, which is the only part of
  // it CI reads.
  process.exitCode = 1;
} else {
  console.log(`all checks passed against ${base}`);
}
