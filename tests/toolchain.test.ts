import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * The Node version, which is now one decision written in two places that cannot share a value.
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

  it('CI installs the same major that Cloudflare Pages will build with', () => {
    const pinned = read('.node-version').trim();
    const ci = /node-version:\s*['"]?(\d+)/.exec(read('.github/workflows/tests.yml'))?.[1];
    expect(ci, 'tests.yml no longer pins a node-version').toBeTruthy();
    expect(
      ci,
      `CI builds on Node ${ci} and staging would build on Node ${pinned} — the suite would be green ` +
        'about a toolchain nobody deploys on',
    ).toBe(pinned);
  });
});
