// ONE vitest, kept alive for the life of a worker tree — docs/decisions/0343-a-probe-runs-warm.md.
//
// `scripts/prove-guard.mjs` used to start a new vitest for every probe. The median guard's own test
// takes a hundredth of a second and the process around it takes 4.7, so at 1,216 probes the proof was
// ninety-five worker-minutes of starting vitest. This is the same run — the same config, the same
// test, the same `-t` pattern, the same failure shapes — asked of an instance that is already up.
//
// ⚠️ **WHAT A WARM INSTANCE CAN GET WRONG IS A STALE MODULE, AND IT CAN GET IT WRONG BOTH WAYS.** An
// edit it has not seen is a guard that stays green, which is loud. A RESTORE it has not seen is the
// previous probe's break still in the cache, and then the next probe over that file goes red for a
// break that is not its own — 0005's vacuous proof, arriving from the harness. So `flush` does not
// trust `invalidateFile`: it reads the module graph back and throws if anything for that file still
// holds a transform. `verifyApplied`, asked of the cache instead of the disk.
//
// ⚠️ **FOUND BY IT HAPPENING.** The first spike passed `path.resolve`'s backslashes to
// `invalidateFile`, whose lookup is keyed on forward slashes. Nothing threw, nothing was invalidated,
// and 60 real probes read: most edits unseen, one restore unseen. A lookup that misses is
// indistinguishable from a file that was never loaded — which is why the read-back below walks every
// module and compares the paths itself rather than asking the same keyed lookup a second time.
//
// It is a child process rather than a function because `createVitest` takes its root from the
// working directory, and six trees want six of them on six cores.

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** A path as the module graph spells it. Vite keys files on forward slashes on every platform. */
export function asModulePath(path) {
  return path.replaceAll('\\', '/');
}

/**
 * Every module for `path` that still holds a transform — which after a flush must be none.
 *
 * ⚠️ **IT COMPARES PATHS ITSELF, CASE AND SLASHES FOLDED, AND DOES NOT CALL `getModulesByFile`.** The
 * keyed lookup is what the invalidation used; asking it again would agree with itself about a key
 * that was wrong. `modules` is every node in a graph, so a spelling the lookup would miss is still
 * found here.
 *
 * @param {Iterable<{file: string | null, id: string | null, transformResult: unknown}>} modules
 * @param {string} path
 * @returns {string[]}
 */
export function unflushed(modules, path) {
  const want = asModulePath(path).toLowerCase();
  const out = [];
  for (const mod of modules) {
    if (mod.file == null || asModulePath(mod.file).toLowerCase() !== want) continue;
    if (mod.transformResult != null) out.push(mod.id ?? mod.file);
  }
  return out;
}

function everyGraph(vitest) {
  return vitest.projects.flatMap(({ vite }) => Object.values(vite.environments).map((e) => e.moduleGraph));
}

/** Drop what the instance holds for each path, and refuse to go on if it is still holding it. */
function flush(vitest, tree, touched) {
  for (const rel of touched) {
    const path = asModulePath(resolve(tree, rel));
    vitest.invalidateFile(path);
    for (const graph of everyGraph(vitest)) {
      const still = unflushed(graph.idToModuleMap.values(), path);
      if (still.length) {
        throw new Error(
          `${rel} was invalidated and the instance still holds a transform for ${still.join(', ')}. ` +
            'The next run would be judged against a module that is not the one on disk.',
        );
      }
    }
  }
}

/** The named guard, run in the live instance. The same shape `runSuite` resolves to. */
async function run(vitest, suite, pattern) {
  vitest.setGlobalTestNamePattern(new RegExp(pattern));
  const specs = (await vitest.globTestSpecifications([suite])).filter((s) =>
    asModulePath(s.moduleId).endsWith(`/${suite}`),
  );
  if (specs.length !== 1) throw new Error(`${suite} resolved to ${specs.length} test files, and a probe names one`);
  const result = await vitest.runTestSpecifications(specs, true);
  if (result.unhandledErrors.length) {
    throw new Error(`unhandled: ${String(result.unhandledErrors[0]?.stack ?? result.unhandledErrors[0])}`);
  }
  const failed = [];
  let ran = 0;
  for (const mod of result.testModules) {
    for (const test of mod.children.allTests()) {
      const { state, errors } = test.result();
      if (state !== 'skipped') ran++;
      // `stack || message`, which is what the JSON reporter prints and what `isAVerdict` reads.
      if (state === 'failed') failed.push({ title: test.name, message: errors?.[0]?.stack || errors?.[0]?.message || '' });
    }
  }
  return { failed, ran };
}

// Only as a forked child. Imported — by `tests/prove-worker.test.ts` — it must do nothing but export.
if (process.send && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tree = process.cwd();
  // From the tree's own node_modules, so the instance is the vitest the cold path would have started.
  const { createVitest } = await import(pathToFileURL(resolve(tree, 'node_modules/vitest/dist/node.js')).href);
  // An empty reporter: results are read off the API, and six instances printing is nobody's log.
  //
  // ⚠️ NO `globalSetup`, AND THE HARNESS BUILDS `dist/` ITSELF. vitest runs it before the FIRST run,
  // and the first run here has a probe's break applied — so the one build this instance ever made
  // would have been of a broken tree, read by every suite after it.
  const vitest = await createVitest('test', { watch: false, reporters: [{}], globalSetup: [] });
  process.on('message', async (msg) => {
    try {
      if (msg.op === 'close') {
        await vitest.close();
        process.exit(0);
      }
      flush(vitest, tree, msg.touched ?? []);
      const result = msg.op === 'run' ? await run(vitest, msg.suite, msg.pattern) : {};
      process.send({ id: msg.id, ok: true, ...result });
    } catch (e) {
      process.send({ id: msg.id, ok: false, error: String(e?.stack ?? e) });
    }
  });
  // A harness that died must not leave six vite servers behind it; the server alone keeps a loop alive.
  process.on('disconnect', () => process.exit(0));
  process.send({ ready: true });
}
