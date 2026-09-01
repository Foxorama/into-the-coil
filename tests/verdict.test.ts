import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * The guard behind `docs/decisions/0199-a-verdict-is-an-exit-code.md`.
 *
 * A pipe discards the exit code of everything left of it. `npm run prove | tail -20` reports `tail`'s
 * status, and `tail` succeeds on any input including none — so every verdict
 * `docs/decisions/0115-a-probe-runs-its-own-guard.md` and
 * `docs/decisions/0177-a-red-is-a-verdict.md` buy inside the harness is thrown away by one character
 * in the shell around it.
 *
 * ⚠️ **THE NAIVE VERSION OF THIS GUARD REDDENS THREE HEALTHY LINES**, which is the failure mode
 * `CLAUDE.md` names for counting guards — *every one flagged its healthy file as loudly as its sick
 * one.* Both of these are correct today and must stay green:
 *
 *   --jq "[.[] | select(.title == \"$TITLE\")][0].number"   ← a jq pipe INSIDE a double-quoted string
 *   open=$(gh pr list … 2>/dev/null || echo "")             ← a deliberate `||`, with its own comment
 *
 * So the scan strips comments and quoted spans before it looks for a pipe, and `||` is not a pipe.
 * That is the whole reason this is a tokenizer and not a `grep`.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const workflows = resolve(root, '.github/workflows');

/**
 * A shell line with its comment and its quoted spans removed, so what remains is operators.
 *
 * Single quotes take everything literally; double quotes honour a backslash escape, which is how
 * `\"$TITLE\"` survives inside an already-quoted jq argument. Getting that wrong is what makes the
 * difference between reading three real files correctly and banning a construct they all use.
 */
export function stripQuoted(line: string): string {
  let out = '';
  let state: 'bare' | 'single' | 'double' = 'bare';
  for (let i = 0; i < line.length; i += 1) {
    // `charAt` rather than `line[i]`: this file runs under `noUncheckedIndexedAccess`, and an index
    // that TypeScript types as `string | undefined` appends the literal text "undefined" to `out`
    // when it is wrong. `charAt` is always a string.
    const c = line.charAt(i);
    if (state === 'bare') {
      if (c === '#') break; // a comment runs to end of line
      if (c === "'") state = 'single';
      else if (c === '"') state = 'double';
      else out += c;
    } else if (state === 'single') {
      if (c === "'") state = 'bare';
    } else {
      if (c === '\\') i += 1; // the escaped character is content, never a delimiter
      else if (c === '"') state = 'bare';
    }
  }
  return out;
}

/** Whether a stripped line pipes. `||` is a fallback, not a pipe, and does not count. */
export function pipes(stripped: string): boolean {
  return stripped.replaceAll('||', '').includes('|');
}

type Step = { file: string; line: number; body: string[] };

/**
 * Every `run:` step in a workflow, as its own shell script.
 *
 * A block scalar (`run: |`) owns every following line indented past the `run:` key. An inline
 * `- run: cmd` is a one-line script. The `|` that OPENS a block is the YAML indicator and is
 * consumed here rather than reaching `pipes()` — mistaking it for a shell pipe would redden every
 * multi-line step in the repository.
 */
export function stepsIn(file: string, source: string): Step[] {
  const lines = source.split(/\r?\n/);
  const steps: Step[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^(\s*)(?:-\s+)?run:\s*(.*)$/.exec(lines[i] ?? '');
    if (!m) continue;
    const indent = m[1] ?? '';
    const rest = m[2] ?? '';
    if (/^[|>][-+]?\d*$/.test(rest.trim())) {
      const body: string[] = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        const next = lines[j] ?? '';
        const blank = next.trim() === '';
        const deeper = next.search(/\S/) > indent.length;
        if (!blank && !deeper) break;
        body.push(next);
      }
      steps.push({ file, line: i + 1, body });
    } else if (rest.trim() !== '') {
      steps.push({ file, line: i + 1, body: [rest] });
    }
  }
  return steps;
}

const files = readdirSync(workflows).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
const allSteps = files.flatMap((f) => stepsIn(f, readFileSync(resolve(workflows, f), 'utf8')));

describe('a verdict is an exit code', () => {
  it('reads at least one step from every workflow, so an empty scan cannot pass as a clean one', () => {
    // 0199's own subject: a scan that collected nothing reports exactly what a clean scan reports.
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect(allSteps.filter((s) => s.file === f).length).toBeGreaterThan(0);
  });

  it('every piped shell step in a workflow sets pipefail', () => {
    const offenders = allSteps
      .filter((s) => s.body.some((l) => pipes(stripQuoted(l))))
      .filter((s) => !s.body.some((l) => stripQuoted(l).includes('set -o pipefail')))
      .map((s) => `${s.file}:${s.line}`);
    expect(offenders).toEqual([]);
  });

  it('does not mistake a quoted pipe or a fallback for a shell pipe', () => {
    // The three lines this guard would otherwise redden, pinned as fixtures so a future widening of
    // `stripQuoted` cannot quietly start flagging them again.
    expect(pipes(stripQuoted('  --jq "[.[] | select(.title == \\"$TITLE\\")][0].number"'))).toBe(false);
    expect(pipes(stripQuoted('open=$(gh pr list --json number --jq \'length\' 2>/dev/null || echo "")'))).toBe(false);
    expect(pipes(stripQuoted('          # `node … | tee` reports TEE\'s exit code'))).toBe(false);
    // And the ones it must catch.
    expect(pipes(stripQuoted('npm run prove | tail -20'))).toBe(true);
    expect(pipes(stripQuoted('node scripts/x.mjs | tee out.txt'))).toBe(true);
  });
});
