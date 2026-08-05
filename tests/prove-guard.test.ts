import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { planEdit, verifyApplied } from '../scripts/prove-guard.mjs';

/**
 * THE HARNESS THAT PROVES THE GUARDS IS ITSELF A GUARD.
 *
 * See `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`. `scripts/prove-guard.mjs` exists
 * because breaking a guard by hand failed silently in two separate sessions — a `node -e` whose
 * backslashes did not survive the shell, and a bash loop that wrote `${probe%%|*}` to the probe file
 * verbatim. Both times nothing changed, the suite went green, and green is what a correctly-proven
 * guard also reports.
 *
 * Its three failure modes are exercised by running it (the decision records the output). The two
 * checks below are the ones that must hold on every commit, because they are what stands between
 * "this guard is proven" and "my probe did nothing":
 *
 *   planEdit      refuses a `find` that is absent or ambiguous — the stale-probe case
 *   verifyApplied refuses to proceed when the bytes did not move — the wrong-path case
 */

const root = fileURLToPath(new URL('..', import.meta.url));

describe('a probe must be seen to apply', () => {
  it('refuses a find string that is not there — the stale probe', () => {
    // THE case. By hand this is silent; here it is an exception with the reason in it.
    expect(() => planEdit('const a = 1;\n', { find: 'const b', replace: 'const c' })).toThrow(/does not appear/);
  });

  it('refuses an ambiguous find string', () => {
    expect(() => planEdit('x = 1;\nx = 1;\n', { find: 'x = 1;', replace: 'x = 2;' })).toThrow(/appears 2 times/);
  });

  it('refuses a probe that replaces something with itself', () => {
    expect(() => planEdit('x = 1;\n', { find: 'x = 1;', replace: 'x = 1;' })).toThrow(/changes nothing/);
  });

  it('applies exactly one occurrence when the find string is unique', () => {
    expect(planEdit('const a = 1;\nconst b = 2;\n', { find: 'const b = 2;', replace: 'const b = 3;' })).toBe(
      'const a = 1;\nconst b = 3;\n',
    );
  });

  it('refuses to continue when the bytes on disk did not move', () => {
    expect(() => verifyApplied('same', 'same', 'tests/x.ts')).toThrow(/byte-identical/);
    expect(() => verifyApplied('before', 'after', 'tests/x.ts')).not.toThrow();
  });
});

/**
 * Decisions whose confirmation table is NOT re-runnable, each with the reason.
 *
 * ⚠️ This is a real hole and it is written down rather than papered over. All six landed before the
 * harness existed. Several of their rows would script today; several genuinely cannot, because the
 * harness runs vitest against the working tree and those breaks need a built `dist/`, a browser, or
 * the live repository. Backfilling the scriptable ones — and teaching the harness a build step — is
 * named as follow-up work in 0019 rather than left as an unexplained gap.
 */
const WITHOUT_PROBES: Record<string, string> = {
  '0002': 'a one-character case change in index.html — would script; not backfilled yet',
  '0007': 'every row needs `npm run build` and a browser run first, and the harness runs vitest against the tree rather than a built dist/',
  '0008': 'the manifest and `_headers` rows assert on a built dist/, which the harness does not produce',
  '0009': "the cache-sweep rows drive a real page against a built dist/ with a stranger's cache seeded on the origin",
  '0012': 'the workflow-YAML rows would script; the verifier row was run against a deliberately broken LIVE deploy, which no local harness can stage',
  '0014': 'the src/ and PRIVACY.md rows would script; the last runs settings-drift against the live repository with a token',
  // The one exemption that is not a hole. 0019's table records the harness refusing three bad
  // probes — so its probes are probes that MUST fail, and a permanent set containing them would
  // fail every run by design. They were run once from a temporary file, and the two refusals that
  // can hold on every commit are the unit tests in this file.
  '0019': 'its breaks are probes that must FAIL, so a permanent probe set cannot contain them; the two refusals that can be held continuously are unit-tested above',
  // The second exemption that is not a hole. What 0044 asserts is a rule about how a HUMAN answers a
  // red test — there is no file to break that would make the suite refuse the sentence "that was
  // flaky". What it carries instead of a probe is a measurement: 5/5 in both directions on the
  // shipped page, and a full `npm run prove` under the load that produced the original failure.
  '0044': 'its subject is what a person does when a guard goes red, and no edit to any file can stage that; what backs it is a measurement rather than a break',
};

describe('the probe set stays honest', () => {
  const probeFiles = readdirSync(resolve(root, 'scripts/probes')).filter((f) => f.endsWith('.mjs'));

  it('every decision that claims a confirmation table has probes behind it, or says why not', () => {
    // A "Confirmed, not assumed" table is a claim about something that happened once. Backing it
    // with probes is what turns it into something re-runnable — decision 0004's rule, applied to a
    // guard instead of to a repository setting.
    const claiming = readdirSync(resolve(root, 'docs/decisions'))
      .filter((f) => /^\d{4}-/.test(f))
      .filter((f) => readFileSync(resolve(root, 'docs/decisions', f), 'utf8').includes('## Confirmed, not assumed'))
      .map((f) => f.slice(0, 4));
    const covered = new Set(probeFiles.map((f) => f.slice(0, 4)));
    const unbacked = claiming.filter((n) => !covered.has(n) && WITHOUT_PROBES[n] === undefined);
    expect(
      unbacked,
      `these decisions carry a "Confirmed, not assumed" table with no probes behind it: ${unbacked.join(', ')}.\n` +
        'Either add scripts/probes/<n>-<slug>.mjs so `npm run prove` re-runs the table, or say in the ' +
        'decision why the break cannot be scripted — a shell-level or host-level break sometimes ' +
        'genuinely cannot be, and that is worth writing down rather than leaving as a gap.\n' +
        'A table nothing re-runs is a claim about a session nobody can repeat.',
    ).toEqual([]);
  });

  it('every exemption names a reason, and no exemption outlives its probes', () => {
    const covered = new Set(probeFiles.map((f) => f.slice(0, 4)));
    for (const [decision, why] of Object.entries(WITHOUT_PROBES)) {
      expect(why.length, `${decision} is exempt without saying why`).toBeGreaterThan(30);
      // An exemption that has been backfilled is a stale excuse sitting next to working probes,
      // which is how a hole outlives the reason for it.
      expect(covered.has(decision), `${decision} now has probes — delete its WITHOUT_PROBES row`).toBe(false);
    }
  });

  it('every probe names the decision, the break and the guard it must redden', async () => {
    for (const file of probeFiles) {
      // The extension stays in the static part: vite's dynamic-import analysis warns otherwise.
      const mod: { PROBES: unknown[] } = await import(`../scripts/probes/${file.replace(/\.mjs$/, '')}.mjs`);
      expect(Array.isArray(mod.PROBES), `${file} does not export a PROBES array`).toBe(true);
      expect(mod.PROBES.length, `${file} exports no probes`).toBeGreaterThan(0);
      for (const p of mod.PROBES as Record<string, unknown>[]) {
        expect(typeof p.decision, `a probe in ${file} has no decision`).toBe('string');
        expect(String(p.broke).length, `a probe in ${file} does not say what it breaks`).toBeGreaterThan(5);
        expect(String(p.guard).length, `a probe in ${file} does not name the guard it must redden`).toBeGreaterThan(10);
        expect(String(p.suite).startsWith('tests/'), `a probe in ${file} has no suite`).toBe(true);
        // Exactly one of the two shapes. A probe with both would apply one and report the other.
        expect(
          (p.plant === undefined) !== (p.edit === undefined),
          `a probe in ${file} must be either a plant or an edit, not both and not neither`,
        ).toBe(true);
      }
    }
  });
});
