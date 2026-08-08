// THE one way a guard is broken on purpose.
//
// Decision 0005 says a guard that has only ever been green is not known to work: break the thing,
// watch the test go red, restore. Doing that by hand has now failed the same way in two separate
// sessions, and both times it failed SILENTLY — a `node -e` one-liner whose backslashes did not
// survive the shell, and a bash loop whose `${...}` was written to the probe file verbatim. In both
// cases nothing was modified, the suite reported green, and green is exactly what a correctly-proven
// guard also reports. The developer cannot tell "the guard is vacuous" from "my probe did nothing",
// which is the one distinction the whole exercise exists to make.
//
// ⚠️ "Write it in a real language" was the previous answer and it is WRONG. `node -e` is a real
// language and it failed identically, because the shell owns the quoting either way. The fix is
// structural: probes are declared in FILES that no shell ever parses, and the harness refuses to run
// the suite unless it has read the target back and seen the bytes change.
//
// ── The tree a probe is applied to ──────────────────────────────────────────────────────────────
//
// ⚠️ **A probe is applied to a DISPOSABLE COPY of the repository, never to your tree.** 0019 sized
// this at *"twenty-two probes cost about twenty seconds"*; the same design reached nine minutes at
// 234, and it grew as a straight line because every probe waited for the one before it — not because
// the suites got slow. Probes are independent, so the only thing serialising them was that they all
// wrote to the same files. Give each worker its own copy and they stop colliding.
//
// **Nothing about what a probe PROVES moves.** The edit is a real edit, `verifyApplied` still reads
// the bytes back off disk, and a real `vitest run` of the whole suite still has to go red on the
// named test. What changes is only which directory that happens in — see
// `docs/decisions/0054-the-proof-runs-beside-the-work-not-on-it.md`, which also records the faster
// shortcut that was measured and refused.
//
// Two things follow, and both are worth more than the time:
//
//   - **Your working tree is never opened for writing**, so `prove` no longer has to refuse a dirty
//     one, and no crash mid-probe can cost you real work.
//   - **The restore is checked by comparing the whole tree to the copy it started as**, which is a
//     stronger statement than the suite going green again — it sees a leftover file in a corner no
//     test looks at.
//
// Usage:
//   node scripts/prove-guard.mjs            every probe
//   node scripts/prove-guard.mjs 0015       one decision's probes
//   PROVE_WORKERS=1 node scripts/prove-guard.mjs    one at a time, for a confusing failure
//
// It exits non-zero if any probe fails to apply, fails to go red, reddens the WRONG test, or leaves
// its tree changed — and it prints the markdown table a decision's "Confirmed, not assumed" wants.

import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { availableParallelism, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const abs = (p) => resolve(root, p);

/**
 * @typedef {object} Probe
 * @property {string} decision   the four-digit decision the break belongs to
 * @property {string} suite      the test file that must go red, e.g. `tests/combat.test.ts`
 * @property {string} broke      what was broken, in the words the decision's table will print
 * @property {string} guard      a substring of the title of the test that must fail
 * @property {{path: string, find: string, replace: string}} [edit]   exactly one of edit…
 * @property {{path: string, content: string}} [plant]                …or plant
 */

// ── The two checks that make this different from doing it by hand ───────────────────────────────

/**
 * The file's next contents, or a thrown explanation.
 *
 * Exactly one occurrence is required. Zero means the probe is stale — the code moved and the probe
 * kept passing a string nobody has. More than one means the probe is ambiguous and would change
 * something it was not aiming at.
 *
 * @param {string} source
 * @param {{find: string, replace: string}} edit
 * @returns {string}
 */
export function planEdit(source, { find, replace }) {
  if (find === replace) throw new Error('find and replace are identical — this probe changes nothing');
  const count = source.split(find).length - 1;
  if (count === 0) {
    throw new Error(
      `the probe's \`find\` does not appear in the file.\n` +
        `  looking for: ${JSON.stringify(find)}\n` +
        'The code moved and the probe did not. THIS IS THE FAILURE THIS HARNESS EXISTS FOR: by hand, ' +
        'this is the point at which nothing changes and the suite reports green.',
    );
  }
  if (count > 1) throw new Error(`the probe's \`find\` appears ${count} times — make it unique`);
  return source.split(find).join(replace);
}

/**
 * Throw unless the bytes on disk actually moved.
 *
 * The last line of defence, and the one the shell one-liners never had. Everything above can be
 * right and the write can still have gone to the wrong path.
 */
export function verifyApplied(before, after, path) {
  if (before === after) {
    throw new Error(`${path} is byte-identical after the probe was applied — nothing was changed`);
  }
}

// ── Probes ───────────────────────────────────────────────────────────────────────────────────────

/** Every probe file under `scripts/probes/`, newest-numbered last. An explicit read, not a glob of src. */
async function loadProbes(filter) {
  const dir = abs('scripts/probes');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.mjs'))
    .sort();
  const out = [];
  for (const f of files) {
    const mod = await import(new URL(`probes/${f}`, import.meta.url).href);
    for (const probe of mod.PROBES) {
      if (!filter || probe.decision === filter) out.push(probe);
    }
  }
  return out;
}

/**
 * Every probe whose anchor no longer resolves against the tree as it stands, with the reason.
 *
 * ── THE CHECK `planEdit` ALREADY MAKES, ASKED BEFORE ANYTHING IS COPIED ─────────────────────────
 *
 * ⚠️ **It is NOT a second mechanism, and one would be refused.** `src/app/mount.ts` learned *one
 * guarantee, one mechanism* over the orientation gate — a redundant safety net does not make a system
 * safer, it makes the original untestable. This CALLS `planEdit`, so *does this anchor resolve* has
 * exactly one description and it is the one `apply` uses.
 *
 * ⚠️ **What it changes is WHEN it is asked, and that is what earns it a function.** The answer used
 * to arrive after the baseline suites, six tree copies and up to 384 vitest runs — about twelve
 * minutes, and in practice from CI rather than from the machine that moved the line. It costs one
 * read per probe here, so a probe orphaned by an unrelated edit is a two-second failure.
 *
 * ⚠️ **It checks EVERY probe even on a filtered run, which is the whole point.** A run filtered to
 * one decision has no business running the other suites — that is `main`'s own rule — but it has
 * every business telling you that today's edit stranded somebody else's break. The change that made
 * this necessary moved two lines in `src/app/frame.ts` and orphaned probes belonging to 0041 and
 * 0050, neither of which the session had any reason to look at.
 *
 * `read` returns a file's contents, or `null` when there is no such file — injected so the failure
 * modes can be unit-tested without staging a repository.
 *
 * @param {Probe[]} probes
 * @param {(path: string) => string | null} [read]
 * @returns {string[]}
 */
export function anchorFailures(probes, read = (p) => (existsSync(abs(p)) ? readFileSync(abs(p), 'utf8') : null)) {
  const out = [];
  for (const probe of probes) {
    const label = `${probe.decision}  ${probe.broke}`;
    const detail = (message) => out.push(`${label}\n    ${String(message).split('\n').join('\n    ')}`);
    if (probe.plant) {
      // A plant must CREATE its file, so the anchor's health is that nothing is there yet.
      if (read(probe.plant.path) !== null) detail(`${probe.plant.path} already exists — a plant must create the file`);
      continue;
    }
    const source = read(probe.edit.path);
    if (source === null) {
      detail(`${probe.edit.path} does not exist. The file moved and the probe did not.`);
      continue;
    }
    try {
      planEdit(source, probe.edit);
    } catch (e) {
      detail(e.message ?? e);
    }
  }
  return out;
}

/** Directories created for a plant, innermost last, so they can be removed in reverse. */
function makeDirs(path, treeRoot) {
  const made = [];
  let d = dirname(path);
  const stack = [];
  while (d && d !== treeRoot && !existsSync(d)) {
    stack.push(d);
    d = dirname(d);
  }
  for (const dir of stack.reverse()) {
    mkdirSync(dir);
    made.push(dir);
  }
  return made;
}

/**
 * Apply a probe inside one worker's tree. Returns the undo, having already proved the change
 * reached the disk.
 */
function apply(probe, treeRoot) {
  const at = (p) => resolve(treeRoot, p);
  if (probe.plant) {
    const path = at(probe.plant.path);
    if (existsSync(path)) throw new Error(`${probe.plant.path} already exists — a plant must create the file`);
    const made = makeDirs(path, treeRoot);
    writeFileSync(path, probe.plant.content);
    verifyApplied('', readFileSync(path, 'utf8'), probe.plant.path);
    return () => {
      rmSync(path, { force: true });
      for (const dir of made.reverse()) rmSync(dir, { recursive: true, force: true });
    };
  }
  const path = at(probe.edit.path);
  const before = readFileSync(path, 'utf8');
  writeFileSync(path, planEdit(before, probe.edit));
  verifyApplied(before, readFileSync(path, 'utf8'), probe.edit.path);
  return () => {
    writeFileSync(path, before);
    if (readFileSync(path, 'utf8') !== before) throw new Error(`${probe.edit.path} did not restore`);
  };
}

// ── The worker trees ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ **Copied, not `git worktree add`, and the difference is the point.** A worktree carries what is
 * COMMITTED; `prove` has to judge the code you actually have, uncommitted edits included. So the
 * copy is taken off the disk.
 *
 * ⚠️ **And it copies gitignored files too.** 0038's second probe breaks a tracked document by
 * pointing it at `docs/scaffold-plan.md` — a file that must be PRESENT and UNTRACKED for the guard
 * to fire on the right thing. A tracked-files-only copy leaves it absent, the guard still goes red
 * (*"nothing there"* rather than *"gitignored"*), and the probe passes having proven the other half
 * of the test. That is 0019's blind spot exactly: a break and its guard agreeing for the wrong
 * reason.
 *
 * `.git` comes with it, so `git ls-files` answers inside a worker and answers about the worker.
 * Copied rather than shared, because `git ls-files` refreshes the index — six workers sharing one
 * would be six processes writing one file.
 */
const NOT_COPIED = ['node_modules', 'dist'];

/**
 * ⚠️ `node_modules` is a JUNCTION, not a copy: 95MB per worker is not a trade, and nothing in a
 * probe run writes to it. Which is also why no report file may be written inside it — six workers
 * would share one path. They go in the temp base instead.
 */
function makeTree(work) {
  const skip = new Set(NOT_COPIED.map((d) => resolve(root, d)));
  cpSync(root, work, { recursive: true, filter: (src) => !skip.has(resolve(src)) });
  // A junction on Windows and a symlink elsewhere. Windows is where this repo is developed and
  // Linux is where CI runs it, so both are real paths rather than one being defensive tidiness.
  const link =
    process.platform === 'win32'
      ? spawnSync('cmd', ['/c', 'mklink', '/J', resolve(work, 'node_modules'), resolve(root, 'node_modules')], { encoding: 'utf8' })
      : spawnSync('ln', ['-s', resolve(root, 'node_modules'), resolve(work, 'node_modules')], { encoding: 'utf8' });
  if (!existsSync(resolve(work, 'node_modules/vitest/vitest.mjs'))) {
    throw new Error(
      `could not link node_modules into ${work}:\n${link.stdout ?? ''}${link.stderr ?? ''}\n` +
        'Without it the worker has no vitest, and every probe would fail for a reason that has ' +
        'nothing to do with the guard it is aiming at.',
    );
  }
}

/**
 * Every file in a tree that a probe could have touched, hashed.
 *
 * `.git` moves on its own — a test that runs `git ls-files` refreshes the index — so it is copied
 * but not compared.
 */
function manifest(treeRoot) {
  const skip = new Set([...NOT_COPIED, '.git']);
  const out = new Map();
  const walk = (rel) => {
    for (const entry of readdirSync(resolve(treeRoot, rel), { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const path = rel === '' ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) {
        out.set(path, createHash('sha256').update(readFileSync(resolve(treeRoot, path))).digest('hex'));
      }
    }
  };
  walk('');
  return out;
}

/**
 * How a tree differs from the one it was copied as.
 *
 * This is what replaces *"and the suite is green again afterwards"*, and it is a stronger claim: the
 * old check could only see a bad restore that some test happened to assert on, and 0019's own
 * worked example — *"a probe that reverted its own file but left a planted one behind"* — is exactly
 * the case a suite can miss.
 *
 * Exported so it can be unit-tested and probed. It is the check that stands between "every probe
 * restored" and "every probe after the first ran in a tree the one before it had broken", and a
 * check in that position is exactly what 0005 refuses to take on trust.
 *
 * @param {Map<string, string>} before
 * @param {Map<string, string>} after
 * @returns {string[]}
 */
export function drift(before, after) {
  const out = [];
  for (const [path, hash] of before) {
    if (!after.has(path)) out.push(`${path} — GONE`);
    else if (after.get(path) !== hash) out.push(`${path} — not restored`);
  }
  for (const path of after.keys()) if (!before.has(path)) out.push(`${path} — LEFT BEHIND`);
  return out;
}

// ── Running the suite ────────────────────────────────────────────────────────────────────────────

/**
 * Run test files in one tree and resolve to the NAMES of the tests that failed.
 *
 * The JSON reporter rather than the human one on purpose: reading pass/fail out of formatted console
 * output is a second description of vitest's result, and the kind that rots quietly.
 */
function runSuite(suites, cwd, report) {
  return new Promise((done, fail) => {
    rmSync(report, { force: true });
    const child = spawn(
      process.execPath,
      [resolve(cwd, 'node_modules/vitest/vitest.mjs'), 'run', ...suites, '--reporter=json', `--outputFile=${report}`],
      { cwd, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('error', fail);
    child.on('close', () => {
      if (!existsSync(report)) return fail(new Error(`vitest produced no report for ${suites.join(' ')}.\n${out}`));
      const parsed = JSON.parse(readFileSync(report, 'utf8'));
      const failed = [];
      let ran = 0;
      for (const file of parsed.testResults ?? []) {
        for (const t of file.assertionResults ?? []) {
          if (t.status !== 'skipped') ran++;
          if (t.status === 'failed') failed.push(t.title);
        }
      }
      done({ failed, ran });
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * Browser probes first.
 *
 * They are the long ones — one of them flies a real run until the ship dies and then waits seven
 * real seconds for the countdown — so a run that starts them last finishes when the last of them
 * does, with every other worker idle behind it.
 */
const longestFirst = (a, b) => Number(b.suite.includes('.browser.')) - Number(a.suite.includes('.browser.'));

async function main(filter) {
  const probes = await loadProbes(filter);
  if (probes.length === 0) {
    console.error(filter ? `No probes for ${filter}.` : 'No probes found under scripts/probes/.');
    return 1;
  }
  /*
    ⚠️ **FIRST, over EVERY probe, before a tree is copied or a suite is run** — see `anchorFailures`.
    A filtered run still checks the whole set, because the probe an edit strands is almost never one
    belonging to the decision being worked on.
  */
  const stale = anchorFailures(await loadProbes());
  if (stale.length) {
    console.error(`${stale.length} probe(s) can no longer be applied at all:\n`);
    for (const s of stale) console.error(`  ${s}\n`);
    console.error(
      'Nothing was run. Fix the anchors — a probe that cannot be applied proves nothing, and by hand ' +
        'this is exactly the point at which the suite reports green.',
    );
    return 1;
  }

  const suites = [...new Set(probes.map((p) => p.suite))];
  const base = mkdtempSync(join(tmpdir(), 'itc-prove-'));

  try {
    /*
      ⚠️ **GREEN FIRST, and this is a check the serial harness never made.** A probe passes when its
      guard's test is RED with the break in. If that test was ALREADY red, every probe over that
      suite passes having proven nothing — 0005's vacuous green, one level further in. Establishing
      the baseline before breaking anything is what makes each red attributable, and it turns a
      confusing failure two and a half minutes from now into a clear one forty seconds from now.

      Only the suites these probes judge: a filtered run has no business running the rest, and
      whether the WHOLE suite passes is `npm test`'s question, asked by `npm run check` before this.
    */
    process.stdout.write(`Baseline: ${suites.length} suite(s) must be green before anything is broken ... `);
    const baseline = await runSuite(suites, root, join(base, 'baseline.json'));
    if (baseline.failed.length) {
      console.log('RED');
      console.error(
        `\nThese are already failing before a single probe has been applied:\n  ${baseline.failed.join('\n  ')}\n\n` +
          'Every probe over those suites would report `red` and prove NOTHING — a break cannot be ' +
          'shown to have caused a failure that was there first. Fix them, then prove.',
      );
      return 1;
    }
    console.log(`green (${baseline.ran} tests)`);

    const workers = Math.max(
      1,
      Math.min(Number(process.env.PROVE_WORKERS) || availableParallelism() - 1, 6, probes.length),
    );
    process.stdout.write(`Copying ${workers} disposable ${workers === 1 ? 'tree' : 'trees'} to prove in ... `);
    const trees = [];
    for (let i = 0; i < workers; i++) {
      const work = join(base, `w${i}`);
      makeTree(work);
      trees.push(work);
    }
    // One manifest for all of them: they are copies of the same tree, taken before anything ran.
    const pristine = manifest(trees[0]);
    console.log(`done (${pristine.size} files each)`);

    const rows = [];
    const failures = [];
    const queue = [...probes].sort(longestFirst);
    let taken = 0;
    let finished = 0;

    await Promise.all(
      trees.map(async (tree, w) => {
        const report = join(base, `w${w}.json`);
        while (true) {
          const probe = queue[taken++];
          if (probe === undefined) return;
          const label = `${probe.decision}  ${probe.broke}`;
          let undo = null;
          let verdict = 'red';
          try {
            undo = apply(probe, tree);
            const { failed } = await runSuite([probe.suite], tree, report);
            if (failed.length === 0) {
              failures.push(
                `${label}\n    the suite stayed GREEN. The guard does not fire on the thing it exists to catch.`,
              );
              verdict = 'STILL GREEN';
            } else if (!failed.some((t) => t.includes(probe.guard))) {
              failures.push(
                `${label}\n    went red, but on the wrong test.\n` +
                  `    expected a failure containing: ${probe.guard}\n` +
                  `    got: ${failed.join(' | ')}`,
              );
              verdict = 'WRONG TEST';
            } else {
              rows.push(`| ${probe.broke} | \`${probe.guard}\` |`);
            }
          } catch (e) {
            failures.push(`${label}\n    ${String(e.message ?? e).split('\n').join('\n    ')}`);
            verdict = 'PROBE FAILED';
          } finally {
            try {
              undo?.();
            } catch (e) {
              failures.push(`${label}\n    RESTORE FAILED — ${String(e.message ?? e)}`);
              verdict = 'RESTORE FAILED';
            }
          }
          const n = String(++finished).padStart(String(probes.length).length);
          console.log(`[${n}/${probes.length}] ${label} ... ${verdict}`);
        }
      }),
    );

    /*
      Every tree back to the bytes it was copied as. A probe that reverted its own file but left a
      planted one behind is the case 0019 names, and it is invisible to a suite that never imports
      the leftover — but it is not invisible to the next probe that runs in the same tree, which is
      what makes this the check that has to hold.
    */
    for (const [w, tree] of trees.entries()) {
      const changed = drift(pristine, manifest(tree));
      if (changed.length) {
        failures.push(`worker ${w}'s tree did not come back to what it was copied as:\n    ${changed.join('\n    ')}`);
      }
    }

    if (failures.length) {
      console.error(`\n${failures.length} probe(s) did not do what the decision says they do:\n`);
      for (const f of failures) console.error(`  ${f}\n`);
      return 1;
    }

    console.log(`\n${rows.length} guards seen failing, and every tree back to what it was copied as.\n`);
    console.log('| broken on purpose | went red |');
    console.log('|---|---|');
    for (const row of rows) console.log(row);
    return 0;
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

// Only when run as a command. Imported — by `tests/prove-guard.test.ts`, which proves the two checks
// above against samples — this file must do nothing but export.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main(process.argv[2]));
}
