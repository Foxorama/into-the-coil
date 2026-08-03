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
   * ⚠️ THE PROPERTY CONSOLIDATION COULD SILENTLY COST.
   *
   * Two separate workflows were buying INDEPENDENT FAILURE — if butler is down, Pages still ships.
   * Merging them into one graph gives that back only if the two destinations are SIBLINGS: both
   * depending on `build`, neither on the other. Chaining `itch` behind `deploy` would look tidier,
   * pass every other test here, and quietly mean an itch outage blocks a Pages release.
   */
  it('ships to both destinations as siblings, so neither can gate the other', () => {
    const yaml = rules('.github/workflows/release.yml');
    expect(yaml, 'the itch job is gone').toMatch(/^\s{2}itch:/m);
    for (const job of ['deploy', 'itch']) {
      const needs = new RegExp(`^\\s{2}${job}:\\s*\\n\\s*needs:\\s*(\\S.*)$`, 'm').exec(yaml)?.[1]?.trim();
      expect(needs, `${job} has no needs: line`).toBeTruthy();
      expect(
        needs,
        `${job} depends on "${needs}" rather than build alone — the two destinations are chained, ` +
          'so one being down now blocks the other',
      ).toBe('build');
    }
  });

  /**
   * The same bytes, not merely the same build command. Two independent `npm ci && npm run build`
   * runs resolve dependencies separately and stamp a build id separately, so the two destinations
   * could ship different artifacts under one version number with nothing to say so.
   */
  it('gives both destinations one build, not one build command', () => {
    const yaml = rules('.github/workflows/release.yml');
    const job = (name: string, next: string): string =>
      yaml.slice(yaml.search(new RegExp(`^\\s{2}${name}:`, 'm')), yaml.search(new RegExp(`^\\s{2}${next}:`, 'm')));

    // ⚠️ MATCHED WITH THE `@`, and scoped to the job. A bare /upload-artifact/ also matches
    // `upload-artifactX@v4` — which is exactly how a probe disabled this step and the test still
    // passed. A substring of an action's name is not evidence the action runs.
    expect(job('build', 'deploy'), 'the build job no longer publishes an artifact for itch').toMatch(
      /uses:\s*actions\/upload-artifact@/,
    );
    const itch = job('itch', 'verify');
    expect(itch, 'the itch job does not collect the build it was given').toMatch(/uses:\s*actions\/download-artifact@/);
    expect(itch, 'the itch job runs its own build — that is two artifacts under one version').not.toMatch(
      /npm run build/,
    );
  });

  /**
   * An itch HTML5 game is served from a per-upload path and `localStorage` is scoped to origin AND
   * path, so a new upload hands players a fresh empty origin with their save stranded in the old
   * one. butler patches the existing upload on a named channel; the channel name is load-bearing.
   */
  it('pushes to a named channel, which is what keeps saves reachable', () => {
    expect(rules('.github/workflows/release.yml'), 'the butler target lost its :channel suffix').toMatch(
      /ITCH_TARGET:\s*\S+\/\S+:\S+/,
    );
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
