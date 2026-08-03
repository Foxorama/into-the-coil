// The weekly report. ADVISORY — it gates nothing, so there is no incentive to game it.
//
// Two signals, because either alone misses half the problem. TOUCH RATE finds attractors: the
// predecessor's `app.ts` was touched by 35.2% of all commits while a file of the same size next to
// it was touched by 0.6% — sixty-fold difference in cost, identical line count. **Line count does
// not predict pain; touch rate does.** NET GROWTH finds bloat: that same project's constitution was
// touched by 67.3% of recent commits *by design*, so touch rate alone would have watched it
// quadruple and said nothing. Growth caught it at +1,682 lines.
//
// ⚠️ THE WINDOW IS A COMMIT COUNT, NOT A TIME SPAN. A time window fails to hold the denominator
// constant: at two PRs a day, "last 7 days" is ~14 commits, where any percentage threshold fires on
// a file touched twice.
//
// ⚠️ NO THRESHOLDS, DELIBERATELY. The predecessor's `touch > 10%` was validated against a
// 150-commit window *on that repo*. Importing it here would be an unvalidated threshold wearing a
// validated one's clothes — this repo has no history to calibrate against yet. A RANKING cannot be
// miscalibrated, and it is useful from commit twenty rather than commit one hundred and fifty.
// Add thresholds when there is history to validate them against, and say what they were validated
// against when you do.

import { execFileSync } from 'node:child_process';

const WINDOW = Number(process.env.HOTSPOTS_WINDOW ?? process.argv[2] ?? 150);
const TOP = Number(process.env.HOTSPOTS_TOP ?? 10);

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/**
 * Excluded ENTIRELY. A committed build artifact drowns both signals — the predecessor's census
 * found one generated file at +10,594 lines in a single commit.
 */
const GENERATED = [/^package-lock\.json$/, /^dist\//, /\.min\.(js|css)$/, /^public\/assets\//];

/**
 * Living documents: excluded from TOUCH, kept in GROWTH. They are supposed to be edited constantly,
 * so their touch rate is noise — but their growth is exactly what went unnoticed last time.
 */
const LIVING_DOCS = [/^CLAUDE\.md$/, /^docs\//, /^README\.md$/];

const matches = (file, patterns) => patterns.some((p) => p.test(file));

/** `{old => new}/path` and `old => new` both appear in --numstat. Take the current name. */
function currentName(path) {
  if (!path.includes('=>')) return path;
  return path
    .replace(/\{([^}]*) => ([^}]*)\}/g, '$2')
    .replace(/^.* => /, '')
    .replace(/\/\//g, '/');
}

/** Files that still exist at HEAD. A deleted file's score is history, not something to act on. */
const alive = new Set(git(['ls-files']).split('\n').filter(Boolean));

/** One record per commit in the window: which files it touched, and the numstat for each. */
function readWindow() {
  const raw = git(['log', `-n${WINDOW}`, '--no-merges', '--format=%x00%H', '--numstat']);
  const commits = [];
  for (const chunk of raw.split('\0').slice(1)) {
    const [, ...lines] = chunk.split('\n');
    const files = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const [added, deleted, ...rest] = line.split('\t');
      const file = currentName(rest.join('\t'));
      // `-` is a binary file; it has no line counts, but it was still touched.
      files.push({ file, added: added === '-' ? 0 : Number(added), deleted: deleted === '-' ? 0 : Number(deleted) });
    }
    commits.push(files);
  }
  return commits;
}

function report() {
  const commits = readWindow();
  const n = commits.length;
  if (n === 0) return '_No commits in range._';

  const touch = new Map();
  const growth = new Map();

  for (const files of commits) {
    const seen = new Set();
    for (const { file, added, deleted } of files) {
      if (matches(file, GENERATED) || !alive.has(file)) continue;

      growth.set(file, (growth.get(file) ?? 0) + added - deleted);

      if (matches(file, LIVING_DOCS)) continue;
      if (seen.has(file)) continue; // one commit touching a file twice is still one touch
      seen.add(file);
      touch.set(file, (touch.get(file) ?? 0) + 1);
    }
  }

  const top = (map, fmt) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP)
      .map(([file, v], i) => `| ${i + 1} | \`${file}\` | ${fmt(v)} |`)
      .join('\n') || '| | _nothing yet_ | |';

  const short = git(['rev-parse', '--short=7', 'HEAD']).trim();

  return `## Hotspots — last ${n} commit${n === 1 ? '' : 's'} (through \`${short}\`)

Advisory. Gates nothing. **Ranked, not thresholded** — see the header of \`scripts/hotspots.mjs\`.
${n < 40 ? `\n> ⚠️ Only ${n} commits of history. Treat this as a shape, not a signal, until there are more.\n` : ''}
### Attractors — touch rate

Code only; living docs excluded, because they are *supposed* to be edited constantly.

| # | file | commits |
|---|---|---|
${top(touch, (v) => `${v} / ${n} (${((v / n) * 100).toFixed(1)}%)`)}

### Bloat — net line growth

Includes docs, which is the point: the last project's constitution quadrupled while every
touch-rate report stayed quiet.

| # | file | net lines |
|---|---|---|
${top(growth, (v) => (v > 0 ? `+${v}` : String(v)))}
`;
}

process.stdout.write(report());
