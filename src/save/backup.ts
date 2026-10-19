/**
 * Everything the game keeps, as one thing that can leave the device — `docs/decisions/0641-the-save-travels.md`.
 *
 * Asked for 2026-10-19: *"is there a way for a player to export/import their save data if they want to
 * uninstall or move from browser to phone?"* Every `itc_*` key lives in one browser's storage for one
 * origin, and there is no server to hold a second copy, so the only way across is the player carrying
 * it: as a file, or as a code a phone's camera opens.
 *
 * ⚠️ **ALL THREE KEYS, BECAUSE A BACKUP THAT DROPS ONE HAS LOST IT.** The predecessor's first backup
 * wrote its save and not its campaign, and the player who restored it had *"worked, but lost half
 * your stuff"* — the failure a backup exists to prevent. The table, the settings and the hangar go
 * together, each as the document its own module writes.
 *
 * ⚠️ **A RESTORE REFUSES; IT NEVER FALLS BACK.** The three readers below are lenient on purpose — a
 * document they cannot trust is the defaults, never an error on the title — and that leniency is
 * exactly wrong here: a restore that read a damaged hangar as an empty one would overwrite a real
 * one with it and say it had worked. So the envelope and every document's own version are checked
 * first, and anything short of a document this build can read is a reason, not a default. What
 * survives that is still read through the readers, so a restored hangar can hold nothing they would
 * not have read off the device.
 *
 * Pure apart from compression, which is the platform's: no storage, no DOM and no clock — the shell
 * hands in the time and does the writing.
 */

import { APP_ID } from '../brand.ts';
import type { SettingsState } from '../state/slices/settings.ts';
import type { HangarState } from '../state/slices/hangar.ts';
import { SCORES_KEY, SCORES_VERSION, parseScores, serialiseScores, type ScoreEntry } from './scores.ts';
import { SETTINGS_KEY, SETTINGS_VERSION, serialiseSettings, settingsFrom } from './settings.ts';
import { HANGAR_KEY, HANGAR_VERSION, hangarFrom, serialiseHangar } from './hangar.ts';
import type { Store } from './store.ts';

/**
 * What marks a file as one of these. Off the frozen application id and never the title, so a rename
 * leaves every backup a player holds readable — `src/brand.ts` says why that id does not move.
 */
export const BACKUP_KIND = APP_ID + '/save';

/** The envelope's version — not the documents', which carry their own. A change an old file cannot be read as bumps it. */
export const BACKUP_VERSION = 1;

/** What prefixes a code, so a paste of anything else is told apart from a damaged code. */
export const CODE_PREFIX = 'ITC1';

/** Where a code rides in a link — after the `#`, which a browser never sends to the server. */
export const CODE_HASH = '#save=';

/** Everything the game keeps. */
export interface Kept {
  scores: ScoreEntry[];
  settings: SettingsState;
  hangar: HangarState;
}

/** What a restore found: everything, and when it was saved — or the reason it is refused, said to the player. */
export type Restored = { ok: true; kept: Kept; at: number | null } | { ok: false; why: string };

/** `kept` as the text of a backup, saved at `at` (milliseconds since the epoch). */
export function backupOf(kept: Kept, at: number): string {
  return JSON.stringify({
    kind: BACKUP_KIND,
    v: BACKUP_VERSION,
    at,
    [SCORES_KEY]: JSON.parse(serialiseScores(kept.scores)) as unknown,
    [SETTINGS_KEY]: JSON.parse(serialiseSettings(kept.settings)) as unknown,
    [HANGAR_KEY]: JSON.parse(serialiseHangar(kept.hangar)) as unknown,
  });
}

const NEWER = 'This save is from a newer version of the game. Update it here first, then try again.';
const DAMAGED = 'This save is damaged, and nothing was changed.';
const NOT_A_SAVE = 'That is not a save from this game, and nothing was changed.';

/**
 * Why a document cannot be restored, or `null` if this build can read it: an object, at the version
 * its own module writes. A higher version is a newer game, and anything else is damage.
 */
function refusal(doc: unknown, version: number): string | null {
  if (typeof doc !== 'object' || doc === null) return DAMAGED;
  const v = (doc as { v?: unknown }).v;
  if (typeof v === 'number' && v > version) return NEWER;
  return v === version ? null : DAMAGED;
}

/**
 * The save in `text`, read over `base` (whose pilot the settings keep, as a visit's are) — or why not.
 * Never throws.
 */
export function restoreFrom(text: string, base: { settings: SettingsState; hangar: HangarState }): Restored {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, why: NOT_A_SAVE };
  }
  if (typeof data !== 'object' || data === null) return { ok: false, why: NOT_A_SAVE };
  const doc = data as Partial<Record<'kind' | 'v' | 'at' | typeof SCORES_KEY | typeof SETTINGS_KEY | typeof HANGAR_KEY, unknown>>;
  if (doc.kind !== BACKUP_KIND) return { ok: false, why: NOT_A_SAVE };
  if (typeof doc.v === 'number' && doc.v > BACKUP_VERSION) return { ok: false, why: NEWER };
  if (doc.v !== BACKUP_VERSION) return { ok: false, why: DAMAGED };
  const why =
    refusal(doc[SCORES_KEY], SCORES_VERSION) ?? refusal(doc[SETTINGS_KEY], SETTINGS_VERSION) ?? refusal(doc[HANGAR_KEY], HANGAR_VERSION);
  if (why !== null) return { ok: false, why };
  const at = typeof doc.at === 'number' && Number.isFinite(doc.at) ? doc.at : null;
  return {
    ok: true,
    at,
    kept: {
      scores: parseScores(JSON.stringify(doc[SCORES_KEY])),
      settings: settingsFrom(JSON.stringify(doc[SETTINGS_KEY]), base.settings),
      hangar: hangarFrom(JSON.stringify(doc[HANGAR_KEY]), base.hangar),
    },
  };
}

/**
 * `kept` written to `store`, and whether every key reads back as written.
 *
 * ⚠️ **READ BACK, BECAUSE THE OTHER WRITERS NEED NOT BE.** A settings write that a full store refuses
 * still holds for the visit; a restore that a full store refuses has done nothing at all, and the
 * page it reloads into would show the old save as if it were the one restored.
 */
export function writeKept(store: Store | null, kept: Kept, replaced: Kept | null = null, at = 0): boolean {
  if (store === null) return false;
  // 0642: the save being replaced kept first, and the load refused if it cannot be — no undo, no load.
  if (replaced !== null && !keepUndo(store, replaced, at)) return false;
  const docs: readonly (readonly [string, string])[] = [
    [SCORES_KEY, serialiseScores(kept.scores)],
    [SETTINGS_KEY, serialiseSettings(kept.settings)],
    [HANGAR_KEY, serialiseHangar(kept.hangar)],
  ];
  try {
    for (const [key, text] of docs) store.setItem(key, text);
    return docs.every(([key, text]) => store.getItem(key) === text);
  } catch {
    return false;
  }
}

/**
 * Where the save a load replaced is kept — `docs/decisions/0642-a-load-can-be-undone.md`. Named once;
 * `PRIVACY.md` names it too, and a test holds the two together.
 *
 * ⚠️ **A WHOLE BACKUP, IN THE ENVELOPE A FILE CARRIES**, so undoing is a load like any other, read by
 * `restoreFrom` and refused on its terms — and it keeps the save it puts aside, so an undo can be undone.
 * One step back and no further: a second load puts aside the save the first one brought.
 */
export const UNDO_KEY = 'itc_undo';

/** `replaced` put aside in `store`, and whether it reads back as written. */
function keepUndo(store: Store, replaced: Kept, at: number): boolean {
  const text = backupOf(replaced, at);
  try {
    store.setItem(UNDO_KEY, text);
    return store.getItem(UNDO_KEY) === text;
  } catch {
    return false;
  }
}

/**
 * The backup of the save the last load replaced, or `null` when there is none. Never throws. The text and
 * not the save, so an undo goes through `restoreFrom` as every load does, and is refused on its terms.
 */
export function undoOf(store: Store | null): string | null {
  if (store === null) return null;
  try {
    return store.getItem(UNDO_KEY);
  } catch {
    return null;
  }
}

/**
 * What `here` has that `incoming` does not — 0642: each a phrase for the player, in a fixed order, and empty
 * when the load loses nothing. Counted on what was earned: ships won, Star Shards, what was bought, the
 * best run on the table, and the table's rows.
 */
export function lossesOf(here: Kept, incoming: Kept): string[] {
  const out: string[] = [];
  const count = <K extends string>(record: Readonly<Record<K, boolean>>): number => Object.values<boolean>(record).filter((on) => on).length;
  const fewer = (have: number, get: number, what: string): void => {
    if (get < have) out.push(`${(have - get).toLocaleString('en')} fewer ${what}`);
  };
  fewer(count(here.hangar.won), count(incoming.hangar.won), 'ships won');
  fewer(here.hangar.shards, incoming.hangar.shards, '✦');
  fewer(count(here.hangar.owned), count(incoming.hangar.owned), 'things bought');
  const best = (kept: Kept): number => kept.scores[0]?.score ?? 0;
  if (best(incoming) < best(here)) out.push(`a best run ${(best(here) - best(incoming)).toLocaleString('en')} lower`);
  fewer(here.scores.length, incoming.scores.length, 'high scores');
  return out;
}

/** Bytes as base64url — the alphabet a link carries without escaping. */
function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Base64url as bytes, or `null` if it is not. */
function bytesOf(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/** All of a stream's bytes. */
async function drain(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * A backup as a code: compressed, then base64url, after the prefix. A full save is about a kilobyte of
 * code — a QR symbol of about version 25 — where the text it holds is three and a half.
 */
export async function codeOf(backup: string): Promise<string> {
  const packed = new Blob([backup]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return CODE_PREFIX + base64url(await drain(packed));
}

/**
 * The backup a code holds, or `null` if it is not a code. Takes a link with the code in it as well, and
 * anything a paste wraps round a code — spaces, line breaks.
 */
export async function backupOfCode(pasted: string): Promise<string | null> {
  const squeezed = pasted.replace(/\s+/g, '');
  const hash = squeezed.indexOf(CODE_HASH);
  const code = hash >= 0 ? squeezed.slice(hash + CODE_HASH.length) : squeezed;
  if (!code.startsWith(CODE_PREFIX)) return null;
  const bytes = bytesOf(code.slice(CODE_PREFIX.length));
  if (bytes === null || bytes.length === 0) return null;
  try {
    const unpacked = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new TextDecoder().decode(await drain(unpacked));
  } catch {
    return null;
  }
}
