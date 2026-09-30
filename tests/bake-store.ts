/**
 * THE MUSIC, BAKED ONCE FOR A SOURCE TREE AND READ BY EVERY FILE THAT NEEDS IT.
 *
 * `docs/decisions/0424-a-bake-is-kept-for-its-source.md`. Every suite that measures the music baked the
 * same seven places for itself — `tests/themes.test.ts` twice, at two rates — in its own process, and
 * every run did it again whether `src/` had changed or not. Nothing here makes a bake faster; it makes
 * each one happen once.
 *
 * ── A COPY ON DISK IS ONLY EVER READ FOR THE SOURCE THAT MADE IT ────────────────────────────────
 *
 * ⚠️ **THE KEY IS EVERY BYTE OF `src/` AND THE NODE THAT RAN IT.** A bake is a function of the synth,
 * the content tables and the maths library, and nothing else — so a key over the whole of `src/` is a
 * superset of what the bake reads, and a key that changes too often is only a miss. A key over less
 * would be a guard measuring last week's music, green: `docs/decisions/0027-measure-the-picture-not-the-model.md`
 * arriving in the harness. `sourceKey` is a pure function so `tests/bake-store.test.ts` can hold that.
 *
 * ⚠️ **A WRITE IS A RENAME**, so a reader sees a whole layer or none; and a file of any other length
 * than the layer's is a miss, never a read.
 *
 * ⚠️ **ONE PROCESS BAKES A LAYER AND THE OTHERS WAIT FOR IT.** Suites start together and would all miss
 * the same layer at once; the first takes a lock file and bakes, the rest poll for the file. No
 * threads — 0423 is why.
 *
 * ⚠️ **A PROOF ONLY READS.** Most music probes break `src/`, which is a new key and a whole new set of
 * bakes a probe — sixteen hundred of them, hundreds of megabytes each. So `npm run prove` sets
 * `ITC_BAKE_STORE=read`: a probe of an untouched `src/` reads the tree's bakes, and one that breaks it
 * bakes in its own process exactly as before.
 *
 * ── WHERE IT LIVES ─────────────────────────────────────────────────────────────────────────────
 *
 * `node_modules/.cache/itc-bakes/<key>/`, which is ignored, is shared by every worktree through the
 * `node_modules` junction, and is what `npm ci` starts empty. Only the newest few keys are kept.
 */

import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
// `existsSync` for `prune` only; a layer's presence is asked by reading it, so there is no gap between the two.
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bakeLayer, layerNotes } from '../src/app/music.ts';
import type { MusicLayer } from '../src/content/music.ts';
import type { ThemeKind } from '../src/content/themes.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const STORE = resolve(root, 'node_modules/.cache/itc-bakes');

/**
 * How many source trees' bakes are kept: this one, and one more for the branch beside it.
 *
 * ⚠️ **A TREE'S BAKES ARE 720 MB** — 545 layers, every place at the rates the suites ask for, measured
 * 2026-09-30. Two is 1.4 GB in `node_modules/.cache`; more buys a hit on a third branch at the price of
 * the disk. Only the key a run is standing in ever reads, so an old one is pure weight.
 */
const KEPT = 2;

/**
 * How old a lock may be before a waiter takes it over. A layer bakes in under a minute on the
 * development box under the whole suite; a lock ten times that is a process that died holding it.
 */
const STALE_LOCK_MS = 600_000;

/**
 * The key for a source tree: every file's path and bytes, in path order, and the Node that runs it.
 *
 * @param files  path → sha256 of its bytes
 */
export function sourceKey(files: ReadonlyMap<string, string>, node: string): string {
  const hash = createHash('sha256');
  hash.update(`node ${node}\n`);
  for (const path of [...files.keys()].sort()) hash.update(`${path}\0${files.get(path)}\n`);
  return hash.digest('hex').slice(0, 32);
}

/** Every file under `dir`, hashed — `sourceKey`'s input for a tree on disk. */
export function sourceFiles(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (rel: string): void => {
    for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
      const path = rel === '' ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) out.set(path, createHash('sha256').update(readFileSync(join(dir, path))).digest('hex'));
    }
  };
  walk('');
  return out;
}

/**
 * This tree's key, re-hashed whenever anything under `src/` has a new modification time or the file
 * count moves — a probe that edits and then restores a file gets the original key back, because the
 * key is the bytes and the stat is only what says to look again.
 */
let known: { stamp: string; key: string } | undefined;
function treeKey(): string {
  const src = resolve(root, 'src');
  const stats: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) stats.push(`${path}:${statSync(path).mtimeMs}`);
    }
  };
  walk(src);
  const stamp = stats.join('|');
  if (known?.stamp !== stamp) known = { stamp, key: sourceKey(sourceFiles(src), process.version) };
  return known.key;
}

/** Where this source tree keeps one layer of one place at one rate. */
export function keptPath(layer: MusicLayer, rate: number, theme?: ThemeKind): string {
  return join(STORE, treeKey(), `${rate}-${theme ?? 'base'}-${layer}.f32`);
}

/** A synchronous pause, for a process waiting on another's bake. */
function pause(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** The layer at `path` if it is whole — exactly `samples` long — or null. */
export function readLayer(path: string, samples: number): Float32Array | null {
  let bytes: Buffer;
  try {
    bytes = readFileSync(path);
  } catch {
    // Not there, or pruned from under us by another process: a miss either way.
    return null;
  }
  if (bytes.byteLength !== samples * 4) return null;
  const out = new Float32Array(samples);
  new Uint8Array(out.buffer).set(bytes);
  return out;
}

/** Write a layer so that a reader sees all of it or none of it. */
export function writeLayer(path: string, layer: Float32Array): void {
  const scratch = `${path}.${process.pid}.${Math.random().toString(36).slice(2)}.part`;
  writeFileSync(scratch, new Uint8Array(layer.buffer, layer.byteOffset, layer.byteLength));
  renameSync(scratch, path);
}

/** Keep the newest `KEPT` source trees' bakes, by when each was last written to. */
function prune(): void {
  if (!existsSync(STORE)) return;
  const dirs = readdirSync(STORE, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ path: join(STORE, entry.name), at: statSync(join(STORE, entry.name)).mtimeMs }))
    .sort((a, b) => b.at - a.at);
  for (const old of dirs.slice(KEPT)) rmSync(old.path, { recursive: true, force: true });
}

/**
 * One layer of one place at `rate`, exactly as `bakeLayer(layer, rate, theme)` returns it — read from
 * this source tree's store if it is there, baked and kept if it is not. A fresh array every call.
 */
export function layerAt(layer: MusicLayer, rate: number, theme?: ThemeKind): Float32Array {
  const samples = layerNotes(layer, rate, theme).buffer.length;
  const path = keptPath(layer, rate, theme);
  const dir = join(path, '..');
  const kept = readLayer(path, samples);
  if (kept !== null) return kept;
  if (process.env.ITC_BAKE_STORE === 'read') return bakeLayer(layer, rate, theme);

  mkdirSync(dir, { recursive: true });
  const lock = `${path}.lock`;
  for (;;) {
    let held: number | undefined;
    try {
      held = openSync(lock, 'wx');
    } catch {
      held = undefined;
    }
    if (held !== undefined) {
      try {
        const baked = bakeLayer(layer, rate, theme);
        writeLayer(path, baked);
        prune();
        return Float32Array.from(baked);
      } finally {
        closeSync(held);
        rmSync(lock, { force: true });
      }
    }
    // Another process is baking it. Wait for the file, or for the lock to go or go stale.
    pause(250);
    const ready = readLayer(path, samples);
    if (ready !== null) return ready;
    try {
      if (Date.now() - statSync(lock).mtimeMs > STALE_LOCK_MS) rmSync(lock, { force: true });
    } catch {
      // The lock is gone: the holder finished or failed. Go round and look again.
    }
  }
}
