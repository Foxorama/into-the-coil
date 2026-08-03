import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * PRIVACY.md is checked against the source, in BOTH directions.
 *
 * A privacy policy is a claim about what software does, and it is the one document that rots
 * silently: the code gains a storage key, nobody thinks of the policy, and the page goes on saying
 * something that is no longer true. Being wrong here is worse than being vague — it is a statement
 * to players that stopped matching the program.
 *
 * ── LANDED BEFORE THE FIRST KEY, DELIBERATELY ────────────────────────────────────────────────────
 *
 * The scaffold plan says this arrives "in the same commit as the first real key". It arrives one
 * commit earlier instead, and the reason is the direction the failure actually runs. The danger is
 * not a documented key going missing; it is an UNDOCUMENTED key being added. Landing the guard with
 * the first key means the first key is the one case it never protected. Landing it now means the
 * very first `itc_*` anyone writes fails until it is written down.
 *
 * ── AND SO IT IS NOT VACUOUS ─────────────────────────────────────────────────────────────────────
 *
 * There are no `itc_*` keys today, so both cross-checks pass over empty sets — which is
 * indistinguishable from a guard whose extraction is simply broken, and is exactly the shape
 * decision 0005 exists to refuse. The extractors are therefore proved against samples: if the source
 * scanner or the table parser stops working, THAT fails here and now, not in six months when
 * somebody adds a key and nothing complains.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

/** Every `itc_*` identifier appearing in a tree. */
function keysIn(text: string): string[] {
  return [...new Set(text.match(/\bitc_[a-z0-9_]+/gi) ?? [])].sort();
}

function sourceText(dir = 'src'): string {
  let out = '';
  for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out += sourceText(p);
    else if (entry.name.endsWith('.ts')) out += `\n${read(p)}`;
  }
  return out;
}

/**
 * The keys a document DECLARES — table rows only, never prose.
 *
 * Takes the markdown rather than reading the file, so the scoping can be proved against a fixture
 * below. Tying it to PRIVACY.md's own wording would make the proof depend on whatever the policy
 * happens to say today, which is how the first version of that assertion passed while this function
 * was broken.
 */
function tableKeys(markdown: string): string[] {
  return keysIn(
    markdown
      .split('\n')
      .filter((l) => l.trimStart().startsWith('|'))
      .join('\n'),
  );
}

const documentedKeys = (): string[] => tableKeys(read('PRIVACY.md'));

describe('PRIVACY.md describes exactly what the game stores', () => {
  it('every storage key in src/ is written down', () => {
    const undocumented = keysIn(sourceText()).filter((k) => !documentedKeys().includes(k));
    expect(
      undocumented,
      `these keys are used in src/ but PRIVACY.md does not mention them: ${undocumented.join(', ')}.\n` +
        'A privacy policy that omits what the software stores is not an oversight, it is an untrue ' +
        'statement to players. Add a row.',
    ).toEqual([]);
  });

  it('every storage key it claims is actually used', () => {
    const inSource = keysIn(sourceText());
    const phantom = documentedKeys().filter((k) => !inSource.includes(k));
    expect(
      phantom,
      `PRIVACY.md documents keys nothing uses: ${phantom.join(', ')}.\n` +
        'The reverse direction matters too — a policy describing storage the game does not have ' +
        'teaches nobody to trust the ones it does.',
    ).toEqual([]);
  });

  /**
   * The one thing the game DOES store today. Named in the policy, and the name has to be real —
   * a cache prefix documented as one thing and shipped as another is the same untruth in a
   * different place.
   */
  it('the cache it admits to is the cache the worker actually opens', () => {
    const prefix = /`(into-the-coil-[^`]*)`/.exec(read('PRIVACY.md'))?.[1];
    expect(prefix, 'PRIVACY.md no longer names the offline cache').toBeTruthy();
    expect(read('public/sw.js'), 'the documented cache name does not match public/sw.js').toContain(
      prefix!.replace(/<[^>]*>/g, ''),
    );
  });

  it('says plainly that nothing is sent, because that is the claim being made', () => {
    const doc = read('PRIVACY.md');
    expect(doc).toMatch(/## What the game sends\s*\n\s*\nNothing\./);
  });

  /**
   * ⚠️ THE ASSERTION THAT KEEPS THE TWO ABOVE HONEST WHILE THERE ARE NO KEYS.
   *
   * With an empty set, `[].filter(...)` equals `[]` no matter how broken the extraction is. These
   * run the real extractors over samples of the thing they exist to find.
   */
  it('the extractors actually find a key — in source and in the table', () => {
    expect(keysIn("localStorage.setItem('itc_save', JSON.stringify(run));")).toEqual(['itc_save']);
    expect(keysIn('const k = `itc_settings`;')).toEqual(['itc_settings']);
    // A document shaped like the policy: a key mentioned in PROSE, and a different key DECLARED in
    // a table row. Only the row is a declaration. Proved against a fixture rather than against
    // PRIVACY.md's own wording — the first version of this assertion leaned on the real document
    // and so passed while the parser was reading the entire file.
    const fixture = [
      'Storage keys are all named like `itc_mentioned_in_prose`.',
      '',
      '| What | Where | Why |',
      '|---|---|---|',
      '| Your save | `localStorage`, key `itc_declared_in_table` | So a run survives closing the tab |',
    ].join('\n');
    expect(tableKeys(fixture)).toEqual(['itc_declared_in_table']);
  });
});
