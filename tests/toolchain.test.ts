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
