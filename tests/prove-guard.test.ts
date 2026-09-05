import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {
  anchorFailures,
  asPattern,
  drift,
  fingerprintTrees,
  firstLine,
  planEdit,
  isAVerdict,
  verdictOf,
  verifyApplied,
} from '../scripts/prove-guard.mjs';

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
 * AND THE SAME REFUSAL, ASKED BEFORE ANYTHING IS COPIED.
 *
 * ⚠️ **This exists because the answer used to arrive twelve minutes late, from CI.** A change to
 * `src/app/frame.ts` moved two lines and stranded probes belonging to **0041 and 0050** — neither of
 * which the session had any reason to open — and `npm run prove` reported it after the baseline
 * suites, six tree copies and 384 vitest runs.
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.
 *
 * ⚠️ **It is not a second mechanism.** `anchorFailures` calls `planEdit`, so *does this anchor
 * resolve* still has one description — what moved is when it is asked, and over which probes.
 */
describe('a stranded probe is found before anything runs', () => {
  /** The harness's own shape, borrowed rather than restated — it is a JSDoc typedef over there. */
  type Probe = import('../scripts/prove-guard.mjs').Probe;

  const edit = (path: string, find: string): Probe => ({
    decision: '0000',
    broke: 'something',
    guard: 'something',
    suite: 'tests/x.test.ts',
    edit: { path, find, replace: 'gone' },
  });

  it('says nothing about a probe whose anchor still resolves', () => {
    expect(anchorFailures([edit('a.ts', 'const a = 1;')], () => 'const a = 1;\n')).toEqual([]);
  });

  it('names the probe whose anchor the code moved out from under', () => {
    // THE case, and the one that cost a CI cycle: the edit was somewhere else entirely.
    const found = anchorFailures([edit('a.ts', 'const a = 1;')], () => 'const a = 2;\n');
    expect(found.length).toBe(1);
    expect(found[0]).toContain('does not appear');
  });

  it('names a probe whose file has gone', () => {
    const found = anchorFailures([edit('gone.ts', 'x')], () => null);
    expect(found.length).toBe(1);
    expect(found[0]).toContain('does not exist');
  });

  it('names a plant whose file is already there', () => {
    // A plant must CREATE its file, so the anchor's health is that nothing is at that path yet.
    const plant = {
      decision: '0000',
      broke: 'something',
      guard: 'something',
      suite: 'tests/x.test.ts',
      plant: { path: 'src/x.ts', content: 'x' },
    };
    expect(anchorFailures([plant], () => 'already here').length).toBe(1);
    expect(anchorFailures([plant], () => null)).toEqual([]);
  });

  it('every probe in the repository can still be applied to the tree as it stands', { timeout: 60_000 }, async () => {
    /*
      ⚠️ **The live one, and it is the reason the four above are not enough.** They prove the check
      works; this asks it about the actual probe set, which is the thing that goes stale — and it
      answers in a second rather than at the end of a full `npm run prove`.

      ⚠️ The generous timeout is the one the probe-shape test below carries and for the same reason:
      the cost is 57-and-growing dynamic imports under parallel load, and a default sized for an
      ordinary unit test was always going to be crossed —
      `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`.
    */
    const all: Probe[] = [];
    for (const file of readdirSync(resolve(root, 'scripts/probes')).filter((f) => f.endsWith('.mjs'))) {
      const mod: { PROBES: Probe[] } = await import(`../scripts/probes/${file.replace(/\.mjs$/, '')}.mjs`);
      all.push(...mod.PROBES);
    }
    expect(
      anchorFailures(all),
      'a probe can no longer be applied. The code moved and the probe did not — by hand, this is ' +
        'exactly the point at which nothing changes and the suite reports green.',
    ).toEqual([]);
  });
});

/**
 * THE CHECK THAT A PROBE RUN IS INDEPENDENT OF THE ONE BEFORE IT.
 *
 * See `docs/decisions/0054-the-proof-runs-beside-the-work-not-on-it.md`. A worker applies one probe
 * at a time to its own copy of the repository and restores between them, so a restore that half
 * worked does not fail — it silently hands the next probe a tree that is already broken, and that
 * probe's red then belongs to somebody else's break.
 *
 * ⚠️ **This is what replaced *"and the suite is green again afterwards"*, and it is stronger.** The
 * old check ran the suites again at the end: it could only see a bad restore that some test happened
 * to assert on, and 0019's own worked example — a probe that reverted its own file but left a
 * planted one behind — is precisely the case where no test imports the leftover. Comparing the whole
 * tree to the copy it started as has no such blind spot.
 */
describe('a worker tree is known to come back to what it was copied as', () => {
  const before = new Map([
    ['src/sim/rng.ts', 'aaa'],
    ['src/app/frame.ts', 'bbb'],
  ]);

  it('says nothing about a tree that came back unchanged', () => {
    expect(drift(before, new Map(before))).toEqual([]);
  });

  it('sees a file the probe did not restore', () => {
    // The `edit` probe's failure mode: the undo wrote, and wrote the wrong thing.
    const after = new Map([...before, ['src/sim/rng.ts', 'MUTATED'] as [string, string]]);
    expect(drift(before, after)).toEqual(['src/sim/rng.ts — not restored']);
  });

  it('sees a file the probe left behind', () => {
    // ⚠️ THE ONE 0019 NAMES. A `plant` whose undo missed leaves a file no suite imports, so every
    // later probe in that tree runs against a repository with an extra module in it.
    const after = new Map([...before, ['src/sim/harmless.ts', 'ccc'] as [string, string]]);
    expect(drift(before, after)).toEqual(['src/sim/harmless.ts — LEFT BEHIND']);
  });

  it('sees a file that went missing altogether', () => {
    const after = new Map(before);
    after.delete('src/app/frame.ts');
    expect(drift(before, after)).toEqual(['src/app/frame.ts — GONE']);
  });

  it('THE ONE THAT MADE A CLEAN RUN REPORT FAILURE: each tree is judged against ITS OWN copy', () => {
    /*
      ⚠️ **SIX COPIES OF ONE TREE ARE NOT ONE TREE, BECAUSE THEY ARE TAKEN ONE AFTER ANOTHER.** The
      runner used to fingerprint `trees[0]` and judge all six against it, which is exactly right for
      six simultaneous copies and wrong for six sequential ones: anything that changes in the source
      between the first and the last is drift in five trees that no probe put there.

      ⚠️ **AND THIS REPOSITORY GUARANTEES SOMETHING CHANGES.** `.claude/typecheck.log` is appended to
      by its own PostToolUse hook on every edit, and `.claude/skills/ship/SKILL.md` says to start
      `prove` *"at commit time in the background"* — so the ritual walks you into it. Observed:
      **774 probes red, five workers reported as not restored, and an exit code of 1** over a
      gitignored log. `docs/decisions/0199-a-verdict-is-an-exit-code.md` is about a verdict thrown
      away by a pipe; this is one manufactured by the check that IS the verdict.

      0192: name a change that would redden this and be correct. Fingerprinting once and reusing it is
      never correct — it is the assumption, stated, that the source cannot move mid-copy.
    */
    const seen: string[] = [];
    // A source that changes between copies, which is the only condition that distinguishes the two.
    const take = (path: string): Map<string, string> => {
      seen.push(path);
      return new Map([['.claude/typecheck.log', `hash-${seen.length}`]]);
    };
    const trees = fingerprintTrees(['/w0', '/w1', '/w2'], take);
    expect(seen, 'the manifest was not taken once per tree').toEqual(['/w0', '/w1', '/w2']);
    for (const tree of trees) {
      expect(
        drift(tree.pristine, take(tree.path)).length === 0,
        `${tree.path} is being judged against another tree's copy — a file that moved between two ` +
          'copies is reported as a probe that did not restore, and the whole run reports failure',
      ).toBe(false);
      // What matters is that each tree kept its OWN fingerprint, not a shared one.
      expect(drift(tree.pristine, new Map(tree.pristine))).toEqual([]);
    }
    const hashes = trees.map((tree) => tree.pristine.get('.claude/typecheck.log'));
    expect(new Set(hashes).size, 'every tree carries the same fingerprint — it was taken once').toBe(3);
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
  // The third exemption that is not a hole: a table whose subject no longer exists. 0242 replaced
  // the ring 0240 built with a coil, and the lead and stretch its three probes broke are gone from
  // the tree; the table records a session that was real and cannot be re-run against code that
  // has no ring. 0242's own table covers what replaced it.
  '0240': 'its ring was superseded by 0242 — the lead and stretch its probes broke no longer exist, and the coil that replaced them has its own table and probes',
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
  // 0044 applied to the budgets themselves: a budget's number cannot be broken in a way the suite
  // would see, because lowering one reddens a test only under a load a probe cannot arrange. What
  // backs it is the table of alone, suite and baseline costs in the decision.
  '0245': 'a budget goes red only under a load a probe cannot stage; what backs it is the measured table of costs alone, under the suite and under the baseline',
  // The third exemption that is not a hole, and the first one that is a REVERSAL rather than a gap.
  // 0052 shipped with probes; 0082 removed the mechanism they broke, so they were deleted along with
  // `CYCLE`, `faceOf` and `tests/cycling.test.ts`. Its confirmation table is still a true account of
  // what was measured in 2026-08 and stays; what cannot be re-run is a break against code that is no
  // longer in the repository. Repointing them at anything would be theatre — 0019's STILL GREEN.
  '0052': 'superseded by 0082, which removed the cycle its probes broke; the table records what was measured and there is no longer any code to break',
  // The fourth exemption that is not a hole, and the first one a DEMOTION produced.
  // docs/decisions/0192-a-guard-holds-an-invariant.md moved 0167's *a build does not duck* into
  // `tests/authored.ts`, where it is measured on every run and cannot fail one. A probe proves a
  // guard goes red; an advisory has no red to go, so probing it would be
  // docs/decisions/0019-a-probe-must-be-seen-to-apply.md's STILL GREEN by construction. What is
  // proven instead is the mechanism under it, by `scripts/probes/0192-a-guard-holds-an-invariant.mjs`
  // — including that an unmet claim does not throw, which is the property this exemption rests on.
  // ⚠️ 0167's OTHER guard — that the re-based mix is additive — is arithmetic rather than taste and
  // stays hard. It has NEVER had a probe: both of 0167's broke the duck guard. That is a pre-existing
  // hole this exemption inherits rather than creates, and 0192 names it as a debt found on the way
  // past rather than quietly covering it with this sentence.
  // The fifth exemption that is not a hole, and the second one a DEMOTION produced.
  // docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md changes WHEN a pass happens and
  // WHICH column a rule sits in. There is no file to break that would make a suite refuse a sequencing
  // choice — 0044's own shape, one channel over. What backs it instead is that every floor it defers is
  // now a measured claim in tests/authored.ts, printed on every run, and those carry 0192's probes.
  '0198': 'its subject is when a pass runs and which column a rule sits in, and no edit to any file can stage that; what backs it is that every deferred floor is a measured claim in tests/authored.ts, with 0192 probes behind the mechanism',
  '0167': 'its duck guard is advisory under 0192 and has no red to prove; the mechanism that replaces the proof is probed under 0192, and the additive half stayed hard but was never probed by either of the two this file removed',
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

  /**
   * ⚠️ **THIS TEST WAS INTERMITTENT AND IT WAS TIMING, NOT FLAKING** —
   * `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`, which is explicit
   * that *"a rerun is not evidence"* and that the answer is to establish which it is.
   *
   * It failed once in a full `npm test` at **5024ms** against vitest's default 5000ms, and passed in
   * isolation at well under a second. That is not an assertion failing: it is the default timeout,
   * and the quantity it was measuring is **how long 57 dynamic imports take to transform under
   * parallel load** — which has nothing whatever to do with the claim being made, that every probe
   * names its decision, its break and its guard.
   *
   * ⚠️ **The cost grows with the probe count, so the ceiling has to be stated rather than inherited.**
   * There are 57 probe files today and every decision adds one; a default sized for an ordinary unit
   * test was always going to be crossed eventually, on whichever machine happened to be busiest.
   *
   * ⚠️ **The import is REAL and stays real.** Reading the files as text would make the timeout go
   * away and would stop checking the thing that matters — that each module actually exports a
   * `PROBES` array of the right shape. The slow part is the point.
   */
  it('every probe names the decision, the break and the guard it must redden', { timeout: 60_000 }, async () => {
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

/**
 * A PROBE RUNS ITS OWN GUARD — `docs/decisions/0115-a-probe-runs-its-own-guard.md`.
 *
 * ⚠️ **The verdict has only ever depended on one test and the harness ran forty-eight.** Filtering to
 * the named guard is the same claim asked of the same test; what these hold is the two ways the
 * filter can lie, and both of them are SILENT.
 */
describe('0115 — a probe runs the guard it names, and not the suite around it', () => {
  const probeFiles = readdirSync(resolve(root, 'scripts/probes')).filter((f) => f.endsWith('.mjs'));

  /** A failure of the ordinary kind: the guard's own `expect` fired. 0177's shape, at 0115's arms. */
  const assertion = (title: string) => ({
    title,
    message: 'AssertionError: expected 1 to be 2\n    at C:/into-the-coil/tests/themes.test.ts:745:9',
  });

  /*
    ⚠️ **`-t` IS A REGEX AND A GUARD TITLE IS PROSE.** The verdict compares titles with
    `String.includes`, so a guard is a literal substring; vitest's `--testNamePattern` is not, and the
    two disagreeing is a difference nobody would see — a title with a `.` in it quietly matching a
    different test, or a lone `(` throwing inside a worker.
  */
  it('THE SILENT ONE: every guard title in the repository still matches itself as a pattern', async () => {
    /*
      ⚠️ **Driven over EVERY probe rather than over an example**, on `tests/music.test.ts`'s own
      lesson about the aura range: a hand-written case proves the escape works on the characters the
      hand thought of. Eight of the five hundred and fifty-two carry one of `( ) . *` today, and the
      set that does is not a thing anybody maintains.
    */
    let checked = 0;
    for (const file of probeFiles) {
      const mod: { PROBES: { guard: string }[] } = await import(`../scripts/probes/${file.replace(/\.mjs$/, '')}.mjs`);
      for (const p of mod.PROBES) {
        expect(
          new RegExp(asPattern(p.guard)).test(p.guard),
          `the guard "${p.guard}" does not match itself once escaped, so its probe would filter to nothing`,
        ).toBe(true);
        checked++;
      }
    }
    expect(checked, 'no probes were checked, so this asserted nothing').toBeGreaterThan(100);
  }, 60_000);

  it('and a metacharacter is a character, not a pattern', () => {
    // Unescaped, `.` matches any character and this test would find a guard nobody named.
    expect(new RegExp(asPattern('a level is a place.')).test('a level is a placeX')).toBe(false);
    expect(new RegExp(asPattern('a level is a place.')).test('a level is a place.')).toBe(true);
    // Unescaped, this throws rather than matching — an unbalanced group.
    expect(() => new RegExp(asPattern('the gap (in units) closed'))).not.toThrow();
  });

  /*
    ⚠️ **THE OTHER WAY THE FILTER CAN LIE, AND IT IS THE ONE THAT COSTS THE MOST.** A pattern that
    resolves to no test makes vitest run nothing and exit ZERO — no failures, no error — which reads
    as `the suite stayed green` and would be reported as a guard that does not fire. It is
    `planEdit`'s stale-anchor failure arriving on the test side, and while the whole suite was run it
    could not happen, because a suite always ran something.
  */
  it('THE NEW CLASS: a guard title that resolves to no test is refused, not read as green', () => {
    expect(verdictOf({ ran: 0, failed: [] }, 'a test that was renamed')).toBe('NO SUCH GUARD');
  });

  it('and a guard that fires is the only thing that passes', () => {
    expect(verdictOf({ ran: 1, failed: [assertion('the boss mix does not clip')] }, 'does not clip')).toBe('red');
    expect(verdictOf({ ran: 1, failed: [] }, 'does not clip')).toBe('NOT THIS GUARD');
    // Red on something else is NOT a pass, and the caller re-runs the suite to say what.
    expect(verdictOf({ ran: 2, failed: [assertion('some other test')] }, 'does not clip')).toBe('NOT THIS GUARD');
  });
});

/*
  ⚠️ **`docs/decisions/0177-a-red-is-a-verdict.md`, AND IT IS 0115'S EMPTY-RUN ARM ONE STEP FURTHER.**
  That one exists because *zero failures is what a green suite reports too*; this exists because **a failed
  title is what a timed-out or crashed test reports too** — and `npm run prove` said `red` about one
  of those on CI while this machine said `WRONG TEST` about a byte-identical tree, with no record
  anywhere of which it had been.

  ⚠️ **THE FIXTURES BELOW ARE TRANSCRIBED FROM A REAL RUN, NOT WRITTEN.** vitest 4.1.10, staged in
  `tests/` and read back out of the JSON reporter. A hand-written timeout would have said
  *Test timed out in 300ms*, which is on `error.message`; the reporter prints `error.stack || message`
  and the stack of a timeout is the literal string below.
*/
describe('0177 — a red is a verdict, and not any failure with the right name', () => {
  const ASSERTION =
    'AssertionError: expected 1 to be greater than or equal to 2\n' +
    '    at C:/into-the-coil/tests/themes.test.ts:745:9';
  const FIXTURE =
    'Error: the bomb never went off — the fixture is not measuring what it says it is\n' +
    '    at boom (C:/into-the-coil/tests/bombs.test.ts:41:9)\n' +
    '    at C:/into-the-coil/tests/bombs.test.ts:60:3';
  const TIMEOUT =
    'Error: STACK_TRACE_ERROR\n' +
    '    at task (file:///C:/into-the-coil/node_modules/@vitest/runner/dist/chunk-artifact.js:1784:27)\n' +
    '    at C:/into-the-coil/tests/themes.test.ts:738:3';
  // 0024's own probe, off the run that refuted clause 2 alone: `.not.toContain` raises inside chai.
  const ASSERTION_IN_LIB =
    "AssertionError: motion is presentation and must not change the model: expected [ Array(7) ] to not include 'motion'\n" +
    '    at Proxy.<anonymous> (file:///C:/into-the-coil/node_modules/@vitest/expect/dist/index.js:1319:15)\n' +
    '    at C:/Users/foxor/AppData/Local/Temp/itc-prove-6WIE4a/w5/tests/assist.test.ts:139:89';
  // 0135's own probe, off the same run: the break names an identifier `src/app/music.ts` does not have.
  const SRC_CRASH =
    'ReferenceError: PHRASE_SECONDS is not defined\n' +
    '    at placeArrivesAt (C:/Users/foxor/AppData/Local/Temp/itc-prove-6WIE4a/w5/src/app/music.ts:855:53)\n' +
    '    at C:/Users/foxor/AppData/Local/Temp/itc-prove-6WIE4a/w5/tests/music.test.ts:1758:20';

  it('THE ONE THIS IS FOR: a guard that timed out is NOT a guard that was seen to fail', () => {
    expect(verdictOf({ ran: 1, failed: [{ title: 'the pace holds', message: TIMEOUT }] }, 'the pace holds')).toBe(
      'NEVER REACHED ITS CLAIM',
    );
  });

  /*
    ⚠️ **THE FRAME, NOT THE STACK — AND THE FIRST VERSION OF THIS RULE GOT IT WRONG.** A timed-out
    test's stack still carries the frame for its own `it(...)` declaration, so *the suite is named
    anywhere in the stack* reads a timeout as a real red. `TIMEOUT` above names `themes.test.ts` on
    its last line for exactly that reason, and this is the assertion that would have caught it.
  */
  it('and the difference is WHERE IT WAS THROWN, because a timeout names the suite too', () => {
    expect(TIMEOUT).toContain('tests/themes.test.ts');
    expect(isAVerdict(TIMEOUT)).toBe(false);
    expect(isAVerdict(ASSERTION)).toBe(true);
  });

  /*
    ⚠️ **A REAL RUN OF ALL 686 PROBES REFUTED THE WIDER RULE, AND THIS IS THE CASE THAT DID IT.**
    *The throw site is not in `node_modules`* called FOUR working probes proofless — 0024 twice, 0072
    and 0154 — because `.not.toContain` raises inside `@vitest/expect` and not at the line that called
    it. Chai is a library the test CALLED; the runner is the thing that stops it, and only the second
    of those is not a verdict.
  */
  it('and an ASSERTION is a verdict wherever chai threw it, which is not where the guard is', () => {
    expect(ASSERTION_IN_LIB).toContain('node_modules/@vitest/expect');
    expect(isAVerdict(ASSERTION_IN_LIB)).toBe(true);
  });

  /*
    ⚠️ **AND IT IS `src/` AS MUCH AS `tests/`, FROM THE SAME RUN.** Three probes break a file into
    throwing — `ReferenceError: PHRASE_SECONDS is not defined` — and the module dies before the guard
    asserts. That is still this repository deciding rather than the runner giving up, so it is a red;
    **it is a weaker one than an assertion**, which is why the message now prints beside it. The
    sixteen fixtures under `tests/` that refuse by throwing are the same case.
  */
  it('and code of ours that throws HAS decided, whether it is in src/ or in tests/', () => {
    expect(isAVerdict(SRC_CRASH)).toBe(true);
    expect(isAVerdict(FIXTURE)).toBe(true);
    expect(verdictOf({ ran: 1, failed: [{ title: 'the bomb clears the screen', message: FIXTURE }] }, 'the bomb')).toBe(
      'red',
    );
  });

  /*
    ⚠️ **THE TRIPWIRE UNDER THE ONE PACKAGE PATH THIS RULE NAMES.** `isAVerdict` excludes
    `@vitest/runner` by name, so a vitest that restructured its internals would silently start
    counting timeouts as real reds again — quiet, and in the direction that costs. This is the
    cheapest thing that goes loud when that day comes.
  */
  it('and the one package path the rule names is still where the runner lives', () => {
    expect(existsSync(resolve(root, 'node_modules/@vitest/runner'))).toBe(true);
    expect(TIMEOUT).toContain('@vitest/runner');
  });

  it('and the arms stay in this order: no such guard, not this guard, no verdict, red', () => {
    // An empty run outranks everything — 0115's arm, and it must not be reachable past this one.
    expect(verdictOf({ ran: 0, failed: [{ title: 'the pace holds', message: TIMEOUT }] }, 'the pace holds')).toBe(
      'NO SUCH GUARD',
    );
    // A different test timing out is NOT this guard, and must not be read as this guard's non-verdict.
    expect(verdictOf({ ran: 2, failed: [{ title: 'something else', message: TIMEOUT }] }, 'the pace holds')).toBe(
      'NOT THIS GUARD',
    );
    // One verdict among the failures is enough, whichever order they arrive in.
    expect(
      verdictOf(
        {
          ran: 2,
          failed: [
            { title: 'the pace holds, at any rung', message: TIMEOUT },
            { title: 'the pace holds, at any rung', message: ASSERTION },
          ],
        },
        'the pace holds',
      ),
    ).toBe('red');
  });

  /*
    ⚠️ **THE LINE THAT GOES IN THE LOG, AND THE POINT IS THAT IT IS THE QUANTITY.** 679 of these in a
    CI run make the next two-machine disagreement a diff. This one was a dead end because `red` was
    the entire record.
  */
  it('and what the log keeps is what the guard SAID, not that it spoke', () => {
    expect(firstLine(ASSERTION)).toBe('AssertionError: expected 1 to be greater than or equal to 2');
    expect(firstLine('')).toBe('');
  });
});
