# 0409 — A failed build says what failed

**Accepted 2026-09-29.** Written on 2026-08-09 as half of a branch that was never pushed, and found
again in [the review of what never landed](../../reports/the-unlanded-work-2026-09-29.md). The other
half of that branch — a verdict for a suite that never ran — landed separately as `verdictOf`'s
`ran === 0` arm in `scripts/prove-guard.mjs` ([0177](0177-a-red-is-a-verdict.md)). This is the half
that did not.

## What was wrong

When the source does not compile, a test run says nothing useful about why, at two layers.

**`tests/globalSetup.ts` built with `stdio: 'ignore'`.** A failed build threw
`Command failed: …vite.js build` and nothing else — no file, no line. `npm run prove` applies breaks
that sometimes do not compile, and a probe that does not compile is exactly when the reader needs the
bundler's message.

**`stampBuildIdentity`'s `closeBundle` runs whether or not a bundle was written.** So when the bundler
refused the source, nothing reached `dist/`, and the hook threw about `sw.js` — either *"dist/sw.js is
missing"*, or, with a previous build's stamped copy still on disk, *"public/sw.js has no %ITC_VERSION%
placeholder"*. Both are sentences about a healthy tracked file, and the one printed in place of the real
error.

## What changed

- **globalSetup pipes the build's output and rethrows it** inside an error that says no test could
  start. `'pipe'` is as quiet as `'ignore'` on a passing build; the output goes to the error object.
- **The hook records `buildEnd`'s error and `closeBundle` returns early after one.** The placeholder
  guard itself is unchanged and still fails a build that wrote a bundle whose `sw.js` is wrong.
- `stampBuildIdentity` is exported so `tests/build.test.ts` can call its hooks directly.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). The early return is guarded in both directions, because
an early return that fires always is the same defect pointing the other way — the stamp silently stops
and the worker ships its placeholders. `scripts/probes/0409-a-failed-build-says-what-failed.mjs`
removes it and makes it unconditional; each reddens its own test in *a build that failed says what
failed*.

The globalSetup half has no probe. Breaking it means a build that fails, and a failed build is what
stops every test in the run, including the one that would read the message.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Test setup and a build plugin's
error path; the built page is byte-identical.
