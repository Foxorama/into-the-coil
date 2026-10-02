// The runner's first Chrome start, paid by a step of its own rather than inside a test's budget.
//
// `docs/decisions/0456-a-fresh-runner-pays-its-first-chrome-start-once.md`. A hosted runner is a
// fresh machine, and the first time anything starts Chrome on it costs 1.3 to 32.5 s to launch and
// open a context — every launch after that costs under one. That one-off cost used to land in
// whichever browser test happened to come first, under a budget sized for the test, and on
// 2026-10-02 it was the whole of a 60 s one.
//
// ⚠️ **THE NUMBER IS PRINTED, EVERY RUN.** It is the only place the cost is visible at all once it is
// paid here, and the decision's table is a sample of twenty runners; every CI log now adds one.
//
// ⚠️ **NO BUDGET OF ITS OWN.** Its job is to absorb a cost whose tail nobody has seen the end of, so a
// timeout here would put back exactly the failure it removes. A Chrome that never comes up is a hang
// the job bounds — 0245: *the CI job bounds the hang* — and the suite behind it would hang the same.

import { launchChromium } from './chromium.mjs';

const started = performance.now();
const browser = await launchChromium({ headless: true });
const launched = performance.now();
// The context is part of it: the cold half of a first `newContext` measured up to 5.8 s on its own.
const context = await browser.newContext();
await context.newPage();
const opened = performance.now();
await browser.close();

console.log(
  `This runner's first Chrome start: ${Math.round(launched - started)} ms to launch, ` +
    `${Math.round(opened - launched)} ms to open a page — paid here, outside every test's budget.`,
);
