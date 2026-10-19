/**
 * Where a kept thing is read from and written to — the browser's `localStorage` in the game, a map in
 * a test. One store for every `itc_*` key, since 0510 made the table's the second of them.
 *
 * ⚠️ **ONE FILE BECAUSE TWO KEYS SHARE IT, AND THE TABLE'S HAD IT FIRST.** It lived in
 * `src/save/scores.ts` while that was the only thing kept; a settings file importing the table's
 * store would be a settings file that says *score* about itself.
 */

/** What a kept thing is read from and written to. */
export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * One step of a kept document's shape — 0643: a document of version `n` as version `n + 1` reads it.
 * A key's lifts are a list in version order, so the first lifts version 1 to 2.
 */
export type Lift = (doc: Readonly<Record<string, unknown>>) => Record<string, unknown>;

/**
 * `data` as version `current` reads it — 0643 — or `null` when it is not a document, or its version is
 * not one this build has ever written: none, not a whole number, below 1, or newer than `current`.
 *
 * ⚠️ **AN OLDER DOCUMENT IS LIFTED, NEVER DROPPED.** A reader that read nothing on a version it did not
 * know would empty every player's key the first time the shape moved, because the next write lays the
 * empty state over it. So each step from the document's version to `current` runs its lift, in order.
 *
 * ⚠️ **A NEWER ONE IS STILL `null`**, because nothing here can know what a later build meant by it. What
 * a newer document costs on the next write is written down in 0643 and not answered here.
 */
export function lifted(data: unknown, current: number, lifts: readonly Lift[]): Record<string, unknown> | null {
  if (typeof data !== 'object' || data === null) return null;
  let doc = data as Record<string, unknown>;
  const v = doc.v;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > current) return null;
  for (let at = v; at < current; at++) {
    const lift = lifts[at - 1];
    if (lift === undefined) return null;
    doc = { ...lift(doc), v: at + 1 };
  }
  return doc;
}

/**
 * The browser's storage, or `null` where there is none to be had — a sandboxed frame, a private
 * window that throws on access, a browser with site data blocked. Nothing is then kept, and nothing
 * else about the game changes.
 */
export function browserStore(): Store | null {
  try {
    const store = globalThis.localStorage;
    return store === undefined ? null : store;
  } catch {
    return null;
  }
}
