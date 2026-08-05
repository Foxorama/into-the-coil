import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * EVERY RELATIVE LINK IN THE PROSE POINTS AT SOMETHING THAT EXISTS.
 *
 * This project routes almost everything through links. `CLAUDE.md` names the decision behind each
 * rule, every decision cites the ones it amends, every report cites the decision it fed, and
 * `docs/state-of-play.md` is nothing *but* links by design —
 * `docs/decisions/0029-the-tracked-record-is-the-record.md` says a document restating another cites
 * the line rather than summarising it, because *"a summary is a second copy, and one drifted here
 * inside a single day."*
 *
 * ⚠️ **That rule trades one failure mode for another.** A summary drifts silently; a citation rots
 * silently. A link to a decision that was renamed, or to a report that was never written, reads
 * exactly like a link that works — and the reader who follows it is the one who finds out, usually
 * months later and in the middle of something else.
 *
 * ── WHAT THIS DELIBERATELY DOES NOT CHECK ────────────────────────────────────────────────────────
 *
 * **Anchors** (`#some-heading`). The file has to exist; whether the heading inside it does is a
 * second question, and heading text is edited far more often than filenames. Checking it would make
 * this fire on prose changes, which is how a guard gets switched off.
 *
 * **External URLs.** A test that reaches the network fails on a train, and a link rotting on
 * someone else's server is not something this repository can fix.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

/**
 * Every path git actually carries, plus every directory on the way to one.
 *
 * ⚠️ **"It exists" is the wrong question, and asking it is how this shipped broken.** The first
 * version of this test checked the filesystem, passed locally, and failed on the first clean
 * checkout — because four decisions cite `docs/milestones/`, which is **gitignored**. Those files
 * are on the author's machine and in nobody else's clone, so the citations had been dead for
 * everyone but the person who could not tell.
 *
 * A tracked document may only cite tracked material. That is the property, and the filesystem cannot
 * answer it on the one machine where the answer differs.
 */
function trackedPaths(): Set<string> | null {
  const listed = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  if (listed.status !== 0) return null; // no git, or not a repo: fall back to the filesystem
  const out = new Set<string>();
  for (const path of listed.stdout.split('\n').filter(Boolean)) {
    out.add(path);
    // Directories are not listed, so add each one on the way — `docs/`, `docs/decisions/`, …
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) out.add(parts.slice(0, i).join('/'));
  }
  return out;
}

/**
 * Directories with no prose in them worth checking.
 *
 * ⚠️ **This used to be `name.startsWith('.')`, and that skipped `.github/`.** The intent was to
 * avoid walking `.git`, and the shorthand quietly took a tracked directory with it —
 * `.github/PULL_REQUEST_TEMPLATE.md` is prose every contributor reads, and it was outside the scan
 * from the day the scan was written. It had no links at the time, so nothing was broken; a guard
 * with a hole in it that happens to be empty is still a guard with a hole in it.
 */
const NOT_PROSE = new Set(['node_modules', 'dist', '.git']);

/** Every markdown file that is tracked prose. */
function markdownFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
      if (NOT_PROSE.has(entry.name)) continue;
      const path = dir === '' ? entry.name : `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.md')) out.push(path);
    }
  };
  walk('');
  return out;
}

/**
 * Relative markdown links in a source, as `[text](target)`.
 *
 * ⚠️ Skips fenced code blocks. A README showing an example path is not a claim that the path exists,
 * and flagging one would teach a reader that this test is noise.
 */
function linksIn(source: string): string[] {
  const withoutFences = source.replace(/```[\s\S]*?```/g, '');
  const out: string[] = [];
  for (const m of withoutFences.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1]!;
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    out.push(target);
  }
  return out;
}

describe('the prose does not cite things that are not there', () => {
  it('every relative link in every markdown file resolves, in a clean checkout', () => {
    const tracked = trackedPaths();
    const broken: string[] = [];
    for (const file of markdownFiles()) {
      /*
        ⚠️ **The tracked-ness rule runs one way only.** A tracked document may cite only tracked
        material, because a clone has nothing else. An UNTRACKED one — `docs/milestones/`,
        `docs/scaffold-plan.md`, `docs/machine.md` — is machine-local working material by definition,
        and it may cite its equally machine-local neighbours freely.

        The first version of this check missed that and flagged every milestone citing another
        milestone, which is the shape of over-firing that gets a guard switched off.
      */
      const sourceIsShipped = tracked === null || tracked.has(file);
      for (const link of linksIn(readFileSync(resolve(root, file), 'utf8'))) {
        // The file has to exist; the anchor inside it is a second question and not this one.
        const relative = normalize(join(dirname(file), link.split('#')[0]!)).replace(/\\/g, '/');
        const here = existsSync(resolve(root, relative));
        const shipped = tracked === null ? here : tracked.has(relative.replace(/\/$/, ''));
        if (!here) broken.push(`${file} → ${link}  (nothing there)`);
        else if (sourceIsShipped && !shipped) {
          broken.push(`${file} → ${link}  (exists here, GITIGNORED — no clone has it)`);
        }
      }
    }
    expect(
      broken,
      'these citations point at nothing a reader can follow:\n  ' +
        broken.join('\n  ') +
        '\nA citation that rots reads exactly like one that works, which is the cost of the rule ' +
        'that everything cites rather than summarises (0029). A GITIGNORED target is the same defect ' +
        'wearing a disguise: it resolves on the machine that wrote it and on no other.',
    ).toEqual([]);
  });

  it('walks the dot-directories that hold prose, and not the ones that hold git', () => {
    // The hole this closes, asserted rather than described: a scan that skips every dotted directory
    // looks identical to one that skips the right ones.
    const files = markdownFiles();
    expect(files, 'the contributor-facing template is outside the scan').toContain('.github/PULL_REQUEST_TEMPLATE.md');
    expect(
      files.filter((f) => f.startsWith('.git/')),
      'the scan is walking git internals',
    ).toEqual([]);
  });

  it('and the scanner is known to work, rather than merely green', () => {
    // Decision 0005: a guard that has only ever been green is not known to work. The scan above runs
    // over prose written to pass it, so these prove it can see what it is looking for.
    expect(linksIn('see [the ladder](docs/decisions/0015-the-layer-ladder.md)')).toEqual([
      'docs/decisions/0015-the-layer-ladder.md',
    ]);
    expect(linksIn('[with an anchor](docs/game.md#controls)')).toEqual(['docs/game.md#controls']);
    expect(linksIn('[external](https://example.com/x.md)'), 'a URL is not this repo to fix').toEqual([]);
    expect(linksIn('[bare anchor](#voice)'), 'an anchor names no file').toEqual([]);
    expect(
      linksIn('```\n[in a fence](nowhere.md)\n```'),
      'an example inside a code fence is not a claim that the path exists',
    ).toEqual([]);
  });

  it('the state of play cites on every settled row rather than summarising', () => {
    /*
      `docs/state-of-play.md` holds pointers and intentions and nothing else
      ([0038](../docs/decisions/0038-the-handover-is-a-file.md)), because a status document is a
      summary generator and 0029 refuses a second copy of anything.

      ⚠️ **This assertion was first written as "the file contains more than ten links", and
      `npm run prove` reported STILL GREEN.** A count is a proxy: it only fires when a file is
      gutted, and it cannot see the realistic drift, which is one row quietly explaining a result
      instead of pointing at it. A magic number would also have to be raised every time the file
      legitimately grew.

      So the property is stated directly. Every row of the settled table names where its claim is
      recorded, which is the rule rather than a stand-in for it.
    */
    const path = 'docs/state-of-play.md';
    expect(existsSync(resolve(root, path)), `${path} is missing — the handover has no home`).toBe(true);

    const body = readFileSync(resolve(root, path), 'utf8');
    const section = body.split('## What is settled')[1]?.split('\n## ')[0] ?? '';
    const rows = section
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('|') && !/^\|[\s|-]*\|$/.test(line));

    expect(rows.length, 'the settled table is gone, so the handover states nothing').toBeGreaterThan(3);
    for (const row of rows) {
      expect(
        linksIn(row).length,
        `this row explains a result instead of citing one, which is the drift 0029 refuses:\n  ${row}`,
      ).toBeGreaterThan(0);
    }
  });
});
