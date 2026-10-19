import { describe, expect, it } from 'vitest';
import { initialState } from '../src/state/root.ts';
import { SHIP_KINDS } from '../src/content/ships.ts';
import { OWNABLE_KINDS } from '../src/content/wares.ts';
import { GOLFER_KINDS } from '../src/content/golfers.ts';
import { DIFFICULTY_KINDS } from '../src/content/difficulty.ts';
import { HANGAR_KEY, serialiseHangar } from '../src/save/hangar.ts';
import { SCORES_KEY, TABLE_SIZE, type ScoreEntry } from '../src/save/scores.ts';
import { SETTINGS_KEY } from '../src/save/settings.ts';
import { BACKUP_KIND, CODE_HASH, UNDO_KEY, backupOf, backupOfCode, codeOf, lossesOf, restoreFrom, undoOf, writeKept, type Kept } from '../src/save/backup.ts';
import type { Store } from '../src/save/store.ts';
import { QR_MOST_BYTES, versionFor } from '../src/app/qr.ts';

/**
 * THE SAVE TRAVELS — `docs/decisions/0641-the-save-travels.md`.
 *
 * ⚠️ **WHAT IS HELD IS THAT A RESTORE NEVER REPORTS A SAVE IT DID NOT READ.** The readers it shares
 * with boot read anything doubtful as the defaults, which on a restore would put an empty hangar over
 * a full one and call it done; so every way a file can be wrong is a refusal here, and a save that
 * goes out comes back whole.
 */

const base = { settings: initialState.settings, hangar: initialState.hangar };

/** A save with everything in it: every ship won, every ware owned, a full table of different runs. */
function fullest(): Kept {
  const won = Object.fromEntries(SHIP_KINDS.map((kind) => [kind, true])) as Kept['hangar']['won'];
  const owned = Object.fromEntries(OWNABLE_KINDS.map((kind) => [kind, true])) as Kept['hangar']['owned'];
  const scores: ScoreEntry[] = Array.from({ length: TABLE_SIZE }, (_, i) => ({
    score: 98_765_432 - i * 7_123_391,
    bonus: 987_654 - i * 79_193,
    pilot: GOLFER_KINDS[i % GOLFER_KINDS.length] ?? 'feather',
    difficulty: DIFFICULTY_KINDS[i % DIFFICULTY_KINDS.length] ?? 'savior',
    levels: (i * 3) % 8,
    cleared: i % 3 === 0,
    continues: i % 4,
    when: 1_792_000_000_000 + i * 86_400_123 + i * i * 7_777,
  }));
  return {
    scores,
    settings: { ...initialState.settings, sound: 'off' },
    hangar: { ...initialState.hangar, won, owned, shards: 1_234_567, crashes: 9_999 },
  };
}

/** A save with nothing earned. */
const withNothing = (): Kept => ({ scores: [], settings: initialState.settings, hangar: initialState.hangar });

/** A store in a map, which can be told to refuse a write. */
function storeOf(refuses: 'keeps' | 'throws' | 'drops' = 'keeps'): Store & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      if (refuses === 'throws') throw new Error('full');
      // A store that takes the write and keeps nothing — a sandboxed frame's, or a browser's in a private window.
      if (refuses === 'keeps') map.set(key, value);
    },
  };
}

/** `text` with one field of its envelope set to `value`. */
function edited(text: string, key: string, value: unknown): string {
  const doc = JSON.parse(text) as Record<string, unknown>;
  doc[key] = value;
  return JSON.stringify(doc);
}

describe('a backup', () => {
  it('comes back as everything that went out', () => {
    const kept = fullest();
    const read = restoreFrom(backupOf(kept, 1_800_000_000_000), base);
    expect(read).toEqual({ ok: true, at: 1_800_000_000_000, kept });
  });

  it('carries all three keys, each as its own module writes it', () => {
    const doc = JSON.parse(backupOf(fullest(), 0)) as Record<string, unknown>;
    expect(doc.kind).toBe(BACKUP_KIND);
    expect(Object.keys(doc).sort()).toEqual(['at', 'kind', 'v', HANGAR_KEY, SCORES_KEY, SETTINGS_KEY].sort());
    expect(JSON.stringify(doc[HANGAR_KEY])).toBe(serialiseHangar(fullest().hangar));
  });

  it('is refused, and never read as the defaults, for every way it can be wrong', () => {
    const good = backupOf(fullest(), 0);
    const cases: [string, string][] = [
      ['not JSON', good.slice(0, good.length / 2)],
      ['another file', JSON.stringify({ name: 'x' })],
      ['another kind', edited(good, 'kind', 'golf-stars-backup')],
      ['no envelope version', edited(good, 'v', undefined)],
      ['a newer envelope', edited(good, 'v', 2)],
      ['no hangar', edited(good, HANGAR_KEY, undefined)],
      ['a hangar that is not a document', edited(good, HANGAR_KEY, 'won')],
      ['a newer hangar', edited(good, HANGAR_KEY, { ...(JSON.parse(good) as Record<string, Record<string, unknown>>)[HANGAR_KEY], v: 2 })],
      ['an unversioned table', edited(good, SCORES_KEY, { entries: [] })],
      ['newer settings', edited(good, SETTINGS_KEY, { v: 9 })],
    ];
    for (const [what, text] of cases) {
      const read = restoreFrom(text, base);
      expect(read.ok, what).toBe(false);
      if (!read.ok) expect(read.why.length, what).toBeGreaterThan(0);
    }
    expect((restoreFrom(edited(good, 'v', 2), base) as { why: string }).why).toMatch(/newer/);
  });

  it('is written whole, and a store that refuses it says so', () => {
    const kept = fullest();
    const store = storeOf();
    expect(writeKept(store, kept)).toBe(true);
    expect([...store.map.keys()].sort()).toEqual([HANGAR_KEY, SCORES_KEY, SETTINGS_KEY].sort());
    expect(writeKept(storeOf('throws'), kept), 'a store that threw').toBe(false);
    expect(writeKept(storeOf('drops'), kept), 'a store that kept nothing').toBe(false);
    expect(writeKept(null, kept)).toBe(false);
  });
});

describe('a load undone — 0642', () => {
  it('puts the save it replaces aside first, as a backup a load reads back whole', () => {
    const store = storeOf();
    const before = fullest();
    const after = { ...fullest(), hangar: { ...fullest().hangar, shards: 3 } };
    expect(writeKept(store, after, before, 1_800_000_000_000)).toBe(true);
    const put = undoOf(store);
    expect(put, 'nothing was put aside').not.toBeNull();
    expect(restoreFrom(put ?? '', base)).toEqual({ ok: true, at: 1_800_000_000_000, kept: before });
  });

  it('refuses the load when the save it replaces cannot be put aside', () => {
    const map = new Map<string, string>();
    // A store with room for everything but the copy.
    const store: Store = {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, value) => {
        if (key === UNDO_KEY) throw new Error('full');
        map.set(key, value);
      },
    };
    expect(writeKept(store, fullest(), withNothing(), 0)).toBe(false);
    expect(map.size, 'the load went ahead without its undo').toBe(0);
  });

  it('says what a load would lose, and nothing for one that loses nothing', () => {
    const empty = withNothing();
    expect(lossesOf(empty, fullest())).toEqual([]);
    expect(lossesOf(fullest(), fullest())).toEqual([]);
    const lost = lossesOf(fullest(), empty);
    expect(lost[0]).toBe(`${SHIP_KINDS.length} fewer ships won`);
    expect(lost.join(', ')).toContain('1,234,567 fewer ✦');
    expect(lost.join(', ')).toContain(`${TABLE_SIZE} fewer high scores`);
    expect(lost.join(', ')).toContain('a best run 98,765,432 lower');
  });
});

describe('a code', () => {
  it('comes back as the backup it was made of, pasted bare, in a link, or broken over lines', async () => {
    const text = backupOf(fullest(), 0);
    const code = await codeOf(text);
    expect(await backupOfCode(code)).toBe(text);
    expect(await backupOfCode('https://example.test/' + CODE_HASH + code)).toBe(text);
    expect(await backupOfCode(' ' + code.slice(0, 40) + '\n' + code.slice(40) + ' ')).toBe(text);
  });

  it('is told apart from anything that is not one', async () => {
    const code = await codeOf(backupOf(fullest(), 0));
    for (const pasted of ['', 'hello', code.slice(4), code.slice(0, code.length - 30), code + '!']) {
      expect(await backupOfCode(pasted), JSON.stringify(pasted.slice(0, 20))).toBeNull();
    }
  });

  /*
    ⚠️ **THE WHOLE SAVE FITS A PICTURE A PHONE CAN READ OFF A MONITOR.** A budget, owned by whoever adds
    to what is kept: every ship won, every ware owned and a full table, in a link off an address longer
    than the game's own, is a symbol of version 30 at most — 137 modules a side, which the Save tab's
    sheet draws at about four CSS pixels a module on a desktop 1080 high. 0641 measured the fullest save
    at 1509 bytes, version 28. Past the budget the save still has a code; it is the picture that thins.
  */
  it('fits a QR symbol a phone reads off a screen, for the fullest save there is', async () => {
    const code = await codeOf(backupOf(fullest(), 0));
    const link = 'https://into-the-coil-longest-preview.pages.dev/' + CODE_HASH + code;
    const bytes = new TextEncoder().encode(link).length;
    expect(bytes).toBeLessThan(QR_MOST_BYTES);
    const version = versionFor(bytes) ?? 41;
    expect(version, `a full save is ${bytes} bytes of link, a symbol of version ${version}`).toBeLessThanOrEqual(30);
  });
});
