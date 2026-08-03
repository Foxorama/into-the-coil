import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * The release path — the only route to the origin players have installed.
 *
 * Nothing here type-checks YAML for its own sake. Each assertion covers a one-line edit that would
 * be invisible in review and expensive in production, and every one of them is a change somebody
 * would make for a good reason.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/**
 * YAML with the commentary removed.
 *
 * These files explain themselves at length, and the explanations name the very things being
 * searched for — `release.yml` has a paragraph about why it has no `workflow_dispatch`. A guard
 * that reads prose cannot tell a warning about a mistake from the mistake.
 */
const rules = (p: string): string =>
  read(p)
    .split('\n')
    .map((l) => (l.trimStart().startsWith('#') ? '' : l))
    .join('\n');

describe('a release is a tag, and only a tag', () => {
  /**
   * ⚠️ THE ONE-LINE CHANGE THIS FILE EXISTS FOR.
   *
   * Adding `workflow_dispatch:` back is a reasonable-looking convenience — the predecessor has it —
   * and it puts a Run button on the path to every installed app. The environment's branch policy is
   * supposed to be the backstop, but that policy does not exist until the first deployment creates
   * the environment, and until it is set the environment allows everything. The scaffold plan's
   * ladder puts removing the affordance above every softer tier; this holds it removed.
   */
  it('has no manual trigger, so nothing can publish main to installed apps', () => {
    expect(
      rules('.github/workflows/release.yml'),
      'workflow_dispatch is back on release.yml — that is a Run button that deploys whatever is on main',
    ).not.toMatch(/^\s*workflow_dispatch:/m);
  });

  it('fires on version tags and on nothing else', () => {
    const yaml = rules('.github/workflows/release.yml');
    expect(yaml).toMatch(/tags:\s*\['v\*'\]/);
    expect(yaml, 'release.yml fires on a branch push — main is staging, not production').not.toMatch(
      /^\s*branches:/m,
    );
  });

  /**
   * The suite is DESCRIBED in one place. A release that copies the test steps instead of calling
   * them drifts from the suite the moment either changes, and the copy is the one guarding players.
   */
  it('calls the suite rather than restating it', () => {
    expect(rules('.github/workflows/release.yml')).toContain('uses: ./.github/workflows/tests.yml');
  });

  /**
   * `v1.2.3` deploying a build that reports `1.2.0` is unfalsifiable from outside: the page says one
   * thing, the release says another, and a bug report quoting either leads nowhere.
   */
  it('refuses to ship a tag that disagrees with package.json', () => {
    const yaml = rules('.github/workflows/release.yml');
    expect(yaml).toContain('GITHUB_REF_NAME');
    expect(yaml).toMatch(/require\('\.\/package\.json'\)\.version/);
  });

  /**
   * Pages and itch are meant to be SIBLINGS — both depending on the build, neither on the other —
   * so one destination being down cannot gate the other. itch is not here yet; what this holds is
   * the shape that lets it arrive without rewiring, which is the entire reason for consolidating
   * into one workflow rather than two.
   */
  it('keeps deploy hanging off build alone, so a second destination can sit beside it', () => {
    expect(rules('.github/workflows/release.yml')).toMatch(/deploy:\s*\n\s*needs:\s*build\b/);
  });
});

describe('the production hostname', () => {
  /**
   * `public/CNAME` is the origin, and the origin is the one thing that can never move: a PWA binds
   * to it and `localStorage` is per-origin, so changing it orphans every install and every save.
   *
   * The predecessor has no CNAME file at all — with a workflow-built Pages site the domain lives in
   * repo settings, and that works. This ships one anyway, because a setting that only exists in the
   * admin UI is precisely what decision 0004 is about: it cannot be seen from git, and it comes back
   * empty if the repo or the Pages environment is ever recreated.
   */
  it('is a bare hostname — a scheme or a path here silently breaks Pages', () => {
    const cname = read('public/CNAME');
    expect(cname.split('\n').filter((l) => l.trim()), 'CNAME must hold exactly one hostname').toHaveLength(1);
    expect(cname.trim()).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/);
    expect(cname).not.toMatch(/https?:|\//);
  });

  it('is not the staging origin, which is a different host entirely', () => {
    expect(read('public/CNAME').trim()).not.toMatch(/^next\./);
  });
});
