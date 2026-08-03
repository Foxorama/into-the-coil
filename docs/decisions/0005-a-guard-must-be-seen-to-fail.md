# 0005 — A guard that has only ever been green is not known to work

**Accepted 2026-08-03.**

## The rule

When a test is written to enforce something, break the thing on purpose and watch the test go red
before trusting it. Restore, and note in the commit that it was confirmed.

## Why

A guard has two failure modes and only one of them is visible. It can fail to hold — which shows
up. Or it can never run, never match, or assert something vacuously true — which shows up as
green, forever.

The predecessor lost months to the second kind. Fifty browser tests found no browser and skipped;
local and CI both reported green every time, and the tell — an identical skip count on two very
different machines — was visible the whole time and read by nobody. A skipped test is not a failing
test.

The same shape recurs in cheaper forms: a regex that no longer matches the file it scans, a `runIf`
gated on a directory that exists without the binary inside it, an assertion against a value the
bundler tree-shook out.

## Applied so far

- The `index.html` `<title>` guard was confirmed by changing one character of case
  (`Into The Coil`) and watching it fail — see [0002](0002-brand-identity-contract.md).
- The no-test-file-builds-`dist` guard was confirmed by planting an offending file.
- The one browser test reports **passed, not skipped**, and the count is quoted in the commit
  message so a future drift to "skipped" is visible in the log rather than only in a terminal
  nobody kept.

`PRIVACY.md`'s storage-key cross-check, arriving with SHELL & IDENTITY, is to be confirmed the same
way: remove a row, watch it fail, put it back.
