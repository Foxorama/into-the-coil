import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * The Node version — one decision that three workflows and a host outside this repo all need.
 *
 * `.github/workflows/tests.yml` tells the CI runner what to install. `.node-version` tells
 * **Cloudflare Pages** what to build staging with — it is the only way to say so, since nothing
 * about that build lives in this repository. They cannot import each other: one is YAML consumed by
 * GitHub, the other a bare file consumed by a host neither of them knows about.
 *
 * This is exactly the admission rule the scaffold plan sets for a guard — a fact earns one once it
 * has two or more callers. Until staging existed it had one, and a guard would have been banning
 * re-derivation of something nobody re-derived.
 *
 * ⚠️ The cost of disagreement is paid on a host with no test suite. CI stays green on the version it
 * pins while staging builds on a different one, and the first sign is a deploy that fails — or
 * worse, succeeds against a toolchain nobody chose.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

describe('the Node version agrees everywhere it is written', () => {
  it('.node-version is a bare major, which is what every reader of it expects', () => {
    // Cloudflare Pages, nvm, fnm and asdf all read this file. A major alone lets each pick its own
    // latest patch; pinning further here would silently stop a security patch from being taken.
    expect(read('.node-version').trim()).toMatch(/^\d+$/);
  });

  /**
   * ONE SOURCE, not two kept in agreement — which is a better outcome than this test was originally
   * written for.
   *
   * The first version asserted that `tests.yml`'s literal `node-version: 24` matched the file. Then
   * `release.yml` arrived needing a Node too, and a third spelling of a fact with one true value is
   * the shape the scaffold plan's ladder says to remove rather than guard. `setup-node` reads
   * `node-version-file`, so both workflows now point at `.node-version` and there is nothing left to
   * disagree. What is guarded is that nobody puts a literal back.
   */
  it('no workflow spells a Node version — they all read the file', () => {
    for (const wf of readdirSync(resolve(root, '.github/workflows')).filter((f) => f.endsWith('.yml'))) {
      const yaml = read(`.github/workflows/${wf}`)
        .split('\n')
        .map((l) => (l.trimStart().startsWith('#') ? '' : l))
        .join('\n');
      if (!yaml.includes('setup-node')) continue;
      expect(
        yaml,
        `${wf} hardcodes a Node version. Cloudflare Pages reads .node-version and cannot read this ` +
          'file, so a literal here is a second spelling that will drift.',
      ).not.toMatch(/node-version:\s*['"]?\d/);
      expect(yaml, `${wf} uses setup-node without pointing at .node-version`).toMatch(
        /node-version-file:\s*'\.node-version'/,
      );
    }
  });
});

/*
  EVERY BROWSER TEST CARRIES A BROWSER TEST'S TIMEOUT.

  ⚠️ This guard exists because the same bug was fixed twice. `plays in landscape` timed out in CI on
  vitest's 5s default; the fix set a file-level timeout in `tests/orientation.browser.test.ts` and
  stopped there. Four of the five browser files still had no timeout, and the next CI run took
  `tests/watchdog.browser.test.ts` down the same way.

  A browser test pays for a browser launch, a navigation and real frames. The FIRST test in a file
  pays for the launch on top of its own work, which is why the failure lands on whichever test
  happens to be first and looks like a problem with that test.

  Scanning for the declaration rather than trusting a convention, because the convention had already
  been written down once and the second file still shipped without it.
*/
describe('a browser test cannot run on the default timeout', () => {
  const testsDir = fileURLToPath(new URL('.', import.meta.url));
  const browserTests = readdirSync(testsDir).filter((f) => f.endsWith('.browser.test.ts'));

  it('finds browser tests to check, so this cannot pass by scanning nothing', () => {
    expect(browserTests.length, 'no *.browser.test.ts files found — this guard is vacuous').toBeGreaterThan(2);
  });

  for (const file of browserTests) {
    it(`${file} sets a file-level testTimeout`, () => {
      const source = readFileSync(resolve(testsDir, file), 'utf8');
      const match = /vi\.setConfig\(\s*\{\s*testTimeout:\s*([0-9_]+)\s*\}\s*\)/.exec(source);
      expect(match, `${file} runs on vitest's 5s default, which is not a browser test's timeout`).not.toBeNull();
      const ms = Number((match?.[1] ?? '0').replace(/_/g, ''));
      expect(ms, `${file}'s timeout is too short to survive a cold runner`).toBeGreaterThanOrEqual(30_000);
    });
  }
});
