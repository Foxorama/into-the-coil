// The break behind the browser-timeout guard in tests/toolchain.test.ts.
//
// ⚠️ There is no decision 0033 and this file is not claiming one. It is a guard over the SUITE
// rather than over the game, and `docs/decisions/README.md` is explicit that a decision needs a rule
// and not the reverse. What it needs is to have been seen to fail, which is 0005, and that is what
// this is.
//
// The history is the whole reason it exists: `plays in landscape` timed out in CI, the fix set a
// file-level timeout in ONE file, and the next run took a different browser test down exactly the
// same way. A guard whose absence let the same bug ship twice is worth proving.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: 'suite',
    suite: 'tests/toolchain.test.ts',
    broke: 'a browser test left on vitest’s 5s default, which is how this shipped twice',
    guard: 'watchdog.browser.test.ts sets a file-level testTimeout',
    edit: {
      path: 'tests/watchdog.browser.test.ts',
      find: 'vi.setConfig({ testTimeout: 60_000 });',
      replace: 'void 0;',
    },
  },
  {
    // The vacuity control. A scan that finds no files passes every assertion it makes about them.
    decision: 'suite',
    suite: 'tests/toolchain.test.ts',
    broke: 'the timeout read as a bare number, so `testTimeout: 1` satisfies the guard',
    guard: 'frame.browser.test.ts sets a file-level testTimeout',
    edit: {
      path: 'tests/frame.browser.test.ts',
      find: 'vi.setConfig({ testTimeout: 60_000 });',
      replace: 'vi.setConfig({ testTimeout: 1_000 });',
    },
  },
];
