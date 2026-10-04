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
