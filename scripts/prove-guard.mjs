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
// Usage:
//   node scripts/prove-guard.mjs            every probe
//   node scripts/prove-guard.mjs 0015       one decision's probes
//
// It exits non-zero if any probe fails to apply, fails to go red, reddens the WRONG test, or fails
// to restore — and it prints the markdown table a decision's "Confirmed, not assumed" section wants.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const abs = (p) => resolve(root, p);

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

/** Directories created for a plant, innermost last, so they can be removed in reverse. */
function makeDirs(path) {
  const made = [];
  let d = dirname(path);
  const stack = [];
  while (d && d !== root && !existsSync(d)) {
    stack.push(d);
    d = dirname(d);
  }
  for (const dir of stack.reverse()) {
    mkdirSync(dir);
    made.push(dir);
  }
  return made;
}

/** Apply a probe. Returns the undo, having already proved the change reached the disk. */
function apply(probe) {
  if (probe.plant) {
    const path = abs(probe.plant.path);
    if (existsSync(path)) throw new Error(`${probe.plant.path} already exists — a plant must create the file`);
    const made = makeDirs(path);
    writeFileSync(path, probe.plant.content);
    verifyApplied('', readFileSync(path, 'utf8'), probe.plant.path);
    return () => {
      rmSync(path, { force: true });
      for (const dir of made.reverse()) rmSync(dir, { recursive: true, force: true });
    };
  }
  const path = abs(probe.edit.path);
  const before = readFileSync(path, 'utf8');
  writeFileSync(path, planEdit(before, probe.edit));
  verifyApplied(before, readFileSync(path, 'utf8'), probe.edit.path);
  return () => {
    writeFileSync(path, before);
    if (readFileSync(path, 'utf8') !== before) throw new Error(`${probe.edit.path} did not restore`);
  };
}

// ── Running the suite ────────────────────────────────────────────────────────────────────────────

const REPORT = abs('node_modules/.vitest-probe-report.json');

/**
 * Run one test file and return `{ failed: string[] }` — the NAMES of the tests that failed.
 *
 * The JSON reporter rather than the human one on purpose: reading pass/fail out of formatted console
 * output is a second description of vitest's result, and the kind that rots quietly.
 */
function runSuite(suite) {
  rmSync(REPORT, { force: true });
  const r = spawnSync(
    process.execPath,
    [abs('node_modules/vitest/vitest.mjs'), 'run', suite, '--reporter=json', `--outputFile=${REPORT}`],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  if (!existsSync(REPORT)) {
    throw new Error(`vitest produced no report for ${suite}.\n${r.stdout}\n${r.stderr}`);
  }
  const report = JSON.parse(readFileSync(REPORT, 'utf8'));
  const failed = [];
  for (const file of report.testResults ?? []) {
    for (const t of file.assertionResults ?? []) {
      if (t.status === 'failed') failed.push(t.title);
    }
  }
  return { failed };
}

/** Refuse to touch a path git already sees as modified — a crash mid-probe must not cost real work. */
function assertClean(paths) {
  const r = spawnSync('git', ['status', '--porcelain', '--', ...paths], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) return; // no git, or not a repo: the byte-exact restore is still in force
  const dirty = r.stdout.trim();
  if (dirty) {
    throw new Error(
      `these probe targets have uncommitted changes:\n${dirty}\n` +
        'Commit or stash first. The harness restores byte-for-byte, but a probe interrupted by a ' +
        'crash would leave the tree mid-mutation, and losing real work to a proof is not a trade.',
    );
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────

async function main(filter) {
  const probes = await loadProbes(filter);
  if (probes.length === 0) {
    console.error(filter ? `No probes for ${filter}.` : 'No probes found under scripts/probes/.');
    return 1;
  }

  assertClean([...new Set(probes.map((p) => (p.plant ?? p.edit).path))]);

  const rows = [];
  const failures = [];

  for (const [i, probe] of probes.entries()) {
    const label = `${probe.decision}  ${probe.broke}`;
    process.stdout.write(`[${String(i + 1).padStart(2)}/${probes.length}] ${label} ... `);
    let undo = null;
    try {
      undo = apply(probe);
      const { failed } = runSuite(probe.suite);
      if (failed.length === 0) {
        failures.push(`${label}\n    the suite stayed GREEN. The guard does not fire on the thing it exists to catch.`);
        console.log('STILL GREEN');
      } else if (!failed.some((t) => t.includes(probe.guard))) {
        failures.push(
          `${label}\n    went red, but on the wrong test.\n` +
            `    expected a failure containing: ${probe.guard}\n` +
            `    got: ${failed.join(' | ')}`,
        );
        console.log('WRONG TEST');
      } else {
        rows.push(`| ${probe.broke} | \`${probe.guard}\` |`);
        console.log('red');
      }
    } catch (e) {
      failures.push(`${label}\n    ${String(e.message ?? e).split('\n').join('\n    ')}`);
      console.log('PROBE FAILED');
    } finally {
      try {
        undo?.();
      } catch (e) {
        failures.push(`${label}\n    RESTORE FAILED — ${String(e.message ?? e)}`);
      }
    }
  }

  // The suite has to be green again afterwards, or a restore was wrong in a way the byte compare
  // missed — a probe that reverted its own file but left a planted one behind, say.
  for (const suite of [...new Set(probes.map((p) => p.suite))]) {
    const { failed } = runSuite(suite);
    if (failed.length) failures.push(`${suite} is still failing after every probe was restored: ${failed.join(' | ')}`);
  }
  rmSync(REPORT, { force: true });

  if (failures.length) {
    console.error(`\n${failures.length} probe(s) did not do what the decision says they do:\n`);
    for (const f of failures) console.error(`  ${f}\n`);
    return 1;
  }

  console.log(`\n${rows.length} guards seen failing, and green again afterwards.\n`);
  console.log('| broken on purpose | went red |');
  console.log('|---|---|');
  for (const row of rows) console.log(row);
  return 0;
}

// Only when run as a command. Imported — by `tests/prove-guard.test.ts`, which proves the two checks
// above against samples — this file must do nothing but export.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main(process.argv[2]));
}
