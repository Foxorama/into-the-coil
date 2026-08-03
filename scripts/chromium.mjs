// THE one way this repo finds and launches Chromium.
//
// It is here on day one, before there is a browser test to run, because of a specific failure in the
// predecessor project: fifty browser tests skipped silently for months. Each test file carried its
// own copy of this lookup, the copies drifted into two different answers — some checked
// `CHROME_PATH`, others searched Linux-only Playwright cache paths — and on a Windows machine most
// of them simply found nothing. A skipped test is not a failing test, so local and CI both reported
// green the whole time. The tell was there and unread: an identical skip count on two very
// different machines.
//
// Plain ESM, not TypeScript, so a `.mjs` script can `import` it with no vite server and no build
// step. That is why the home is here and the shim is `tests/chromium.ts` rather than the other way
// round — in the predecessor, four scripts had resorted to standing up a whole vite server just to
// load a forty-line lookup. A seam a caller has to boot a build tool to reach is a seam the next
// caller copy-pastes around instead.

import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Playwright cache roots, every platform's layout. A missing one is skipped, not an error. */
function cacheBases() {
  return [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    '/opt/pw-browsers', // pre-installed in some cloud sandboxes
    join(homedir(), '.cache', 'ms-playwright'), // Linux
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'ms-playwright') : undefined,
    join(homedir(), 'AppData', 'Local', 'ms-playwright'), // Windows
    join(homedir(), 'Library', 'Caches', 'ms-playwright'), // macOS
  ].filter((b) => b && existsSync(b));
}

/** Every binary under the cache dirs matching `prefix`, at any of `layouts`. */
function fromCache(prefix, layouts) {
  const out = [];
  for (const base of cacheBases()) {
    let dirs;
    try {
      dirs = readdirSync(base);
    } catch {
      continue; // raced, or unreadable
    }
    for (const d of dirs) {
      if (!d.startsWith(prefix)) continue;
      for (const rel of layouts) {
        const bin = join(base, d, ...rel);
        // ALWAYS check for the BINARY, never the directory: a `chromium-*` dir can exist without one
        // (a partial or revision-mismatched `playwright install`), and testing the directory makes a
        // `runIf` gate lie — hard-failing CI instead of skipping cleanly.
        if (existsSync(bin)) out.push(bin);
      }
    }
  }
  return out;
}

const FULL_LAYOUTS_LINUX = [['chrome-linux', 'chrome']];
const FULL_LAYOUTS_OTHER = [
  ['chrome-win64', 'chrome.exe'],
  ['chrome-win', 'chrome.exe'],
  ['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'],
];
const SHELL_LAYOUTS = [
  ['chrome-headless-shell-linux64', 'chrome-headless-shell'],
  ['chrome-headless-shell-win64', 'chrome-headless-shell.exe'],
  ['chrome-headless-shell-mac-x64', 'chrome-headless-shell'],
  ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell'],
];

/** Chrome and Edge are both Chromium; playwright-core drives either. */
const SYSTEM_BROWSERS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

/**
 * Every launchable-LOOKING Chromium on this machine, best first.
 *
 * The ranking is deliberate, and THE ORDER OF THE FIRST THREE RANKS IS LOAD-BEARING: `findChromium`
 * answers with rank 1, and that is what a browser suite gates on. Anything new goes at the END of
 * the list unless you have measured what moving it does.
 *
 *   1. `CHROME_PATH` — the explicit override, and what CI can pin.
 *   2. A Playwright-managed full Chromium in the LINUX layout — that is what the CI runner is, so on
 *      CI this is the pinned browser and it wins.
 *   3. A system Chrome/Edge — ahead of the Windows/macOS Playwright downloads on purpose, see 4.
 *   4. A Playwright-managed full Chromium in the Windows/macOS layouts. Below the system browser
 *      because a Windows bundled-Chromium download has been observed refusing to start at all ("the
 *      side-by-side configuration is incorrect") on a machine whose system Chrome runs fine — so a
 *      developer with a broken cached download still gets a browser rather than a hard failure.
 *   5. The headless SHELL. Last, and never what `findChromium` returns: it is a different binary,
 *      and viewport and focus assertions do not always behave identically under it. It rasterises a
 *      page perfectly well, so it is a real last resort — and on the Windows box above it was the
 *      download that DID run.
 *
 * Existing on disk is not the same as launching (rank 4 is the standing proof), which is why this
 * returns a LIST and `launchChromium` tries them in turn.
 *
 * @returns {string[]}
 */
export function chromiumCandidates() {
  const out = [];
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) out.push(process.env.CHROME_PATH);
  out.push(...fromCache('chromium-', FULL_LAYOUTS_LINUX).filter((p) => !p.includes('headless')));
  out.push(...SYSTEM_BROWSERS.filter((p) => existsSync(p)));
  out.push(...fromCache('chromium-', FULL_LAYOUTS_OTHER).filter((p) => !p.includes('headless')));
  out.push(...fromCache('chromium_headless_shell-', SHELL_LAYOUTS));
  return [...new Set(out)];
}

/**
 * The best single candidate, or `null`.
 *
 * Browser tests use it as `it.runIf(chromePath)` so the suite still passes on a machine with no
 * browser at all — but READ THE SKIPPED COUNT. A jump in skips means the browser gate quietly
 * stopped running, not that the code got simpler. That is the whole reason this file exists.
 *
 * @returns {string | null}
 */
export function findChromium() {
  return chromiumCandidates()[0] ?? null;
}

/** @type {string | null} */
export const chromePath = findChromium();

/**
 * Launch Chromium, trying each candidate in turn, and THROW if none of them start.
 *
 * Throwing is the point. In the predecessor every eyes-on preview script swallowed a missing
 * browser and exited 0, so "the preview did not render" was indistinguishable from "the preview
 * looked fine" — around forty of them were silently dead on Windows and nobody could tell. A rig
 * that cannot show you the picture has failed at its only job and must say so with a non-zero exit.
 *
 * @param {import('playwright-core').LaunchOptions & { wrote?: string }} [opts]
 *   Standard playwright launch options. `wrote` is the path to any un-screenshotted fallback the
 *   caller has already written — it is named in the failure so the run is not a total loss.
 * @returns {Promise<import('playwright-core').Browser>}
 */
export async function launchChromium(opts = {}) {
  const { wrote, ...launch } = opts;
  const { chromium } = await import('playwright-core');
  const candidates = chromiumCandidates();
  const failures = [];
  for (const executablePath of candidates) {
    try {
      return await chromium.launch({ executablePath, ...launch });
    } catch (e) {
      failures.push(`  ${executablePath}\n    ${String(e).split('\n')[0]}`);
    }
  }
  throw new Error(
    [
      candidates.length
        ? `No Chromium would launch. Tried ${candidates.length}:`
        : 'No Chromium found on this machine.',
      ...failures,
      '',
      'Set CHROME_PATH to a Chrome/Edge binary, or run `npx playwright install chromium`.',
      wrote ? `\nThe un-screenshotted page was written to ${wrote} — open it in any browser.` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}
