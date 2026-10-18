// The breaks behind docs/decisions/0638-the-ball-says-its-heat.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0638',
    suite: 'tests/ball-readout.browser.test.ts',
    broke: 'the ball’s heat never handed to the readout, so the gauge is never drawn',
    guard: 'draws the heat gauge whole and readable in the readout',
    edit: { path: 'src/app/mount.ts', find: '  world.onHeat = chrome.setHeat;\n', replace: '' },
  },
  {
    decision: '0638',
    suite: 'tests/ball.test.ts',
    broke: 'the mending shield said to be nowhere along until it lands',
    guard: '0638 — the readout is told the gauge and how far the next shield is back',
    edit: { path: 'src/app/frame.ts', find: '  const done = 1 - Math.max(0, w.regenIn) / w.regenSpan;', replace: '  const done = w.regenSpan * 0;' },
  },
];
