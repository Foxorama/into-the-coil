# 0010 — The build under test is the build that ships

**Accepted 2026-08-03**, landed with SHELL & IDENTITY. Found by accident, which is the point.

## The rule

`tests/globalSetup.ts` builds `dist/` with `NODE_ENV=production`, set explicitly rather than
inherited. `tests/shell.test.ts` asserts that a `PROD`-only branch actually survives into the built
page.

## What happened

The service worker is registered from `src/main.ts` behind `import.meta.env.PROD`, so the dev server
never installs a worker in front of HMR. The offline browser test then sat waiting twenty seconds
for a worker to take control, and none ever did. The page was fine. The worker was fine. The
registration was **not in the bundle**.

Vitest sets `NODE_ENV=test` in its own process. `globalSetup` builds through `execFileSync`, which
inherits the environment, and Vite honours an already-set `NODE_ENV` rather than forcing
`production`. So `import.meta.env.PROD` was `false`, every `PROD`-guarded branch was eliminated as
dead code, and the build was a production build in every respect except the one that mattered.

## Why this is a decision and not a bug fix

The suite was green. It had been green through the whole phase. It was green **against an artifact
nobody would ever ship**, and there was no observable difference between that and being green
against the real one — the missing code left no trace in `dist/` other than its own absence.

That is the same failure shape as three incidents already recorded in this repo, and the reason the
scaffold's ordering exists at all:

- fifty browser tests skipping for months, reported as green
  ([the Chromium lookup](../../scripts/chromium.mjs));
- GitHub Pages serving raw source, where every code fix was correct but never the file being served
  ([0007](0007-the-boot-watchdog.md));
- a guard that has only ever been green not being known to work ([0005](0005-a-guard-must-be-seen-to-fail.md)).

Each one is a rig reporting on something other than the thing under test. `NODE_ENV` is a fourth,
and it is the cheapest to reintroduce: nothing in the test files mentions it, and the value comes
from a process nobody wrote.

**It was found by a test that needed the real artifact.** No static assertion about `dist/` would
have noticed, because the file was well-formed. The offline test found it only because a service
worker cannot be faked — it either takes control or it does not. That is an argument for the
expensive kind of test, in the specific places where the cheap kind cannot see.

## The guard

`the built page still registers the service worker` — one `toContain` against `dist/index.html`.
Cheap, and it fails loudly the next time the rig and the release disagree about what they are
building. Confirmed red by removing `env` from `globalSetup` again, per
[0005](0005-a-guard-must-be-seen-to-fail.md).

## Known limit

The guard names one branch. It catches `NODE_ENV` drift because the service worker happens to be the
first `PROD`-only code in the repo — it would not catch a second `PROD`-only branch going missing on
its own. The honest scope is: **this asserts the build mode, via a branch that depends on it.** A
general "no branch was silently eliminated" check is not something a build can answer, and pretending
otherwise would be the wallpaper failure the weekly report is separately designed to avoid.
