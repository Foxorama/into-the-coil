// Post-merge tidy. Fast-forwards `main`, deletes branches whose work is provably on `main`, and
// prunes worktrees. Advisory about nothing — it either proves a branch is safe to delete or keeps it.
//
// ⚠️ WHY A SCRIPT AND NOT THREE COMMANDS IN A DOC. The commands are easy; knowing a branch is safe to
// delete is not, and that is the part that gets skipped. Local `main` lags every merge silently — a
// session that starts from it reads a stale `docs/decisions/` and a stale constitution while
// everything looks normal — and squash-merged branches are the case git itself gets wrong:
// `git branch -d` REFUSES them, because the squash commit shares no sha with anything on the branch.
// So the answer to "was this merged" comes from the PR, not from a patch-id heuristic. Decision 0004's
// rule, pointed at a branch instead of a repository setting: read it back from the thing that knows.
//
// ⚠️ EVERY git CALL PASSES AN ARGUMENT ARRAY, never a shell string. That is 0019's lesson — the shell
// owns quoting before the tool sees it, and a mangled argument here deletes the wrong branch quietly.
//
// Usage:  node scripts/tidy.mjs [--dry-run]

import { execFileSync } from 'node:child_process';
import { readdirSync, rmdirSync } from 'node:fs';
import { resolve } from 'node:path';

const DRY = process.argv.includes('--dry-run');

/** Branches this never touches, whatever the evidence says. */
const PROTECTED = ['main'];

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
const git = (...args) => run('git', args);

/** Exit status only — for the `git` calls whose answer IS the exit code. */
function gitOk(...args) {
  try {
    execFileSync('git', args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Why a branch may be deleted, or why not. Pure, and exported, so the reasoning that stands between
 * "tidy" and "lost work" is unit-tested rather than trusted — the same argument
 * `tests/prove-guard.test.ts` makes for `planEdit`.
 *
 * `facts.mergedPr`  the PR whose HEAD was this branch and which was merged, or null
 * `facts.mergedSha` the sha GitHub recorded as that PR's head at merge time
 * `facts.localSha`  where the local branch points NOW
 * `facts.identical` the branch's tree is byte-identical to main's
 * `facts.worktree`  the path of a LINKED worktree holding this branch, or null
 */
export function classify(branch, facts) {
  if (PROTECTED.includes(branch)) return { remove: false, reason: 'protected' };
  if (facts.isCurrent) return { remove: false, reason: 'checked out here' };
  /*
    ⚠️ **`isCurrent` IS ONE CHECKOUT AND THIS REPOSITORY HAS TWENTY-SEVEN.** Found by running the
    tool: it reached `a-boss-is-fought-to-the-end`, which is merged and is also checked out at
    `C:/into-the-coil-boss`, and git refused — so the run died on the second branch it looked at and
    deleted NOTHING. A tidy that crashes on the first worktree in an alphabetical list is a tidy that
    has never run to the end here.

    ⚠️ **AND THE CRASH WAS THE GOOD OUTCOME**, which is why this keeps rather than forces. A branch
    held by a worktree is a session's checkout —
    `docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md` is about exactly that,
    and the merge proof says nothing about whether somebody is standing in the directory. Deleting
    the branch would leave that worktree on a detached HEAD with no name for what it was doing.

    ⚠️ **REMOVING THE WORKTREE IS NOT THIS TOOL'S JOB**, and `orphanWorktrees` below already draws
    that line: it removes registered-and-gone directories, never a live one. 0200 makes
    `worktree remove` a thing that stops for an answer, and a script cannot be asked.
  */
  if (facts.worktree) return { remove: false, reason: `checked out at ${facts.worktree}` };

  if (facts.mergedPr !== null && facts.mergedPr !== undefined) {
    // ⚠️ THE CASE THAT MAKES THIS SAFE RATHER THAN NEARLY SAFE. A merged PR proves the branch was
    // merged AS IT STOOD THEN. Commits pushed to it afterwards are not covered by that proof, and
    // deleting on the PR alone would throw them away.
    if (facts.mergedSha && facts.localSha && facts.mergedSha !== facts.localSha) {
      return {
        remove: false,
        reason: `PR #${facts.mergedPr} merged ${facts.mergedSha.slice(0, 7)}, but the branch is now at ${facts.localSha.slice(0, 7)}`,
      };
    }
    return { remove: true, reason: `merged as #${facts.mergedPr}` };
  }

  // No PR, but nothing to lose either: the trees agree, so the branch describes main exactly.
  if (facts.identical) return { remove: true, reason: 'tree identical to main' };

  const n = facts.ahead ?? 0;
  return { remove: false, reason: `${n} commit${n === 1 ? '' : 's'} not on main, and no merged PR` };
}

/** Merged PRs keyed by the branch they were opened from. Empty when `gh` cannot answer. */
function mergedPrsByBranch() {
  try {
    const raw = run('gh', ['pr', 'list', '--state', 'merged', '--limit', '100', '--json', 'number,headRefName,headRefOid']);
    const out = new Map();
    for (const pr of JSON.parse(raw)) {
      // Newest wins: a branch name can be reused across PRs, and the latest merge is the live claim.
      if (!out.has(pr.headRefName)) out.set(pr.headRefName, pr);
    }
    return { prs: out, asked: true };
  } catch {
    // Degraded, and it says so rather than pretending: without gh the only evidence left is the tree
    // comparison, which keeps more branches than it should instead of deleting more than it should.
    return { prs: new Map(), asked: false };
  }
}

function fastForward(current) {
  if (git('rev-parse', '--git-dir') !== git('rev-parse', '--git-common-dir')) {
    return 'skipped — this is a linked worktree, so main lives in the main checkout';
  }
  if (current !== 'main') return `skipped — on ${current}, not main`;
  if (git('status', '--porcelain', '--untracked-files=no')) return 'skipped — the working tree has uncommitted changes';

  const before = git('rev-parse', '--short', 'HEAD');
  if (!gitOk('merge', '--ff-only', 'origin/main')) {
    // ⚠️ TWO DIFFERENT FAILURES, and reporting the wrong one sends you off fixing the wrong thing.
    // Divergence means local main has commits origin does not; anything else is usually an untracked
    // file standing where an incoming one wants to land. Nothing is merged automatically either way.
    const extra = Number(git('rev-list', '--count', 'origin/main..main'));
    return extra > 0
      ? `⚠️ REFUSED — local main has ${extra} commit(s) origin/main does not. Nothing merged; sort it out by hand.`
      : '⚠️ REFUSED — the fast-forward would not apply, and main has no commits of its own. Usually an untracked file in the way; `git merge --ff-only origin/main` will name it.';
  }
  const after = git('rev-parse', '--short', 'HEAD');
  return before === after ? 'already up to date' : `${before} → ${after}`;
}

/**
 * Which branch each LINKED worktree is standing on, keyed by branch.
 *
 * ⚠️ **`--porcelain` BECAUSE THE HUMAN FORMAT PUTS THE BRANCH IN SQUARE BRACKETS** and a path with a
 * space in it makes the columns ambiguous. The porcelain form is one block per worktree, so the
 * `branch` line is read against the `worktree` line above it.
 */
function branchesInWorktrees() {
  const out = new Map();
  let path = null;
  for (const line of git('worktree', 'list', '--porcelain').split('\n')) {
    if (line.startsWith('worktree ')) path = line.slice('worktree '.length).trim();
    else if (line.startsWith('branch refs/heads/') && path) out.set(line.slice('branch refs/heads/'.length).trim(), path);
    else if (line === '') path = null;
  }
  return out;
}

/** Worktree directories git no longer knows about. The live one cannot be removed from inside it. */
function orphanWorktrees(root) {
  const dir = resolve(root, '.claude/worktrees');
  const registered = new Set(
    git('worktree', 'list', '--porcelain')
      .split('\n')
      .filter((l) => l.startsWith('worktree '))
      .map((l) => resolve(l.slice('worktree '.length))),
  );

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());
  } catch {
    return [];
  }

  const out = [];
  for (const e of entries) {
    const path = resolve(dir, e.name);
    if (registered.has(path)) continue;
    if (readdirSync(path).length > 0) {
      out.push(`${e.name} — NOT empty, left alone`);
      continue;
    }
    if (DRY) {
      out.push(`${e.name} — empty, would remove`);
      continue;
    }
    try {
      rmdirSync(path);
      out.push(`${e.name} — removed`);
    } catch {
      // Windows will not unlink a directory that is some process's cwd. Harmless, and it clears
      // itself when that process exits, so this reports rather than fights it.
      out.push(`${e.name} — empty but locked (a session is inside it); it clears on exit`);
    }
  }
  return out;
}

function main() {
  const root = git('rev-parse', '--show-toplevel');
  const current = git('rev-parse', '--abbrev-ref', 'HEAD');

  git('fetch', '--prune', 'origin');
  console.log(`fetched. main: ${fastForward(current)}\n`);

  const { prs, asked } = mergedPrsByBranch();
  if (!asked) console.log('⚠️ `gh` could not list merged PRs. Falling back to tree comparison only — more\n   branches will be kept than strictly need to be.\n');

  const branches = git('for-each-ref', '--format=%(refname:short)', 'refs/heads').split('\n').filter(Boolean);
  const held = branchesInWorktrees();

  const removed = [];
  const kept = [];
  for (const branch of branches) {
    const pr = prs.get(branch);
    const verdict = classify(branch, {
      isCurrent: branch === current,
      worktree: branch === current ? null : (held.get(branch) ?? null),
      mergedPr: pr?.number ?? null,
      mergedSha: pr?.headRefOid ?? null,
      localSha: git('rev-parse', branch),
      identical: gitOk('diff', '--quiet', 'main', branch),
      ahead: Number(git('rev-list', '--count', `main..${branch}`)),
    });

    if (!verdict.remove) {
      kept.push(`  ${branch} — ${verdict.reason}`);
      continue;
    }
    const sha = git('rev-parse', '--short', branch);
    if (!DRY) git('branch', '-D', branch);
    // The sha is printed BECAUSE the branch is gone: `git branch <name> <sha>` puts it back.
    removed.push(`  ${branch} — ${verdict.reason} (was ${sha}${DRY ? ', dry run' : ''})`);
  }

  console.log(removed.length ? `${DRY ? 'would delete' : 'deleted'}:\n${removed.join('\n')}\n` : 'no branches to delete\n');
  if (kept.length) console.log(`kept:\n${kept.join('\n')}\n`);

  git('worktree', 'prune');
  const orphans = orphanWorktrees(root);
  if (orphans.length) console.log(`worktrees:\n${orphans.map((o) => `  ${o}`).join('\n')}\n`);

  if (DRY) console.log('(dry run — nothing was changed)');
}

// Importable for the test without running the sweep.
if (process.argv[1] && process.argv[1].endsWith('tidy.mjs')) main();
