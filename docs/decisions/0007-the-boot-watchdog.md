# 0007 — The boot watchdog, and what it is allowed to say

**Accepted 2026-08-03**, landed with SHELL & IDENTITY.

## The rule

`index.html` carries a classic inline script, before the module script it guards. It latches the
**first** pre-boot failure — an import-time throw, a resource that never loads, an unhandled
rejection, or no boot signal at all — into `window.__ITC_BOOT__`, and renders it under the
signature `ITC-BOOT-FAILED` **only if the module graph never signalled boot**. `src/main.ts` gives
that signal as its last statement.

The watchdog cannot import `src/brand.ts`, so its version arrives as a `%ITC_VERSION%` placeholder
substituted by `vite.config.ts`. **A missing placeholder fails the build.**

## Why

A blank page is the predecessor's most expensive failure and its least informative one: the
evidence is a console error nobody has open, on a device that belongs to someone else. Every
variety of it — a hashed asset that 404s, a CDN serving mismatched index and asset, a service
worker answering with a stale pair, and the long hunt where GitHub Pages served raw source and
every code fix was correct but never the file being served — presents identically. The watchdog is
the only thing that made the last of those diagnosable, because it is the only code that runs when
nothing else did.

**Latch the first, not the last.** One import-time throw cascades: the module that failed leaves
half a dozen others with an undefined import, and each of those throws too. The last error is a
consequence, the first is the cause.

**Capture phase is the load-bearing detail.** A failed `<script>`/`<link>`/`<img>` load fires
`error` on the element and does not bubble, so only a capture-phase listener sees it. Without that
one argument the watchdog still catches every thrown exception — it still *looks* like it works —
while going blind to the 404 that the white screens were actually made of.

**A timeout, because the worst case emits no event at all.** A module blocked by CORS under
`file://`, or a bundle whose syntax the engine rejects, can leave nothing observable behind.
Nothing has failed that anything can watch for; what is observable is that nothing has *succeeded*.

## Rejected: paint the panel on the first error

The obvious design, and it makes the watchdog the second-worst thing on the page. A decorative
asset can 404 while the app starts perfectly well, and a full-page diagnostic over a working game
is a self-inflicted outage. Recording a failure and declaring one are therefore separate: the panel
waits out a grace period and asks the only question that matters — did boot ever signal? The test
`stays silent when something failed but the app booted anyway` is what holds that apart.

## Rejected: a copy of the watchdog in the test file

The browser test lifts the script out of `dist/index.html` rather than re-typing it. A copy would
pass forever while the real page shipped something else — the failure shape of
[0005](0005-a-guard-must-be-seen-to-fail.md), in the place it costs most, since this code only ever
runs when everything else has already failed.

## Confirmed, not assumed

Each guard was watched failing before it was trusted:

| broken on purpose | went red |
|---|---|
| capture-phase `true` → `false` | 3 tests, incl. `catches a resource that never loads` |
| `vite-plugin-singlefile` removed | `dist/ is index.html and nothing else` + the external-reference guard |
| the version-substitution plugin removed | `ships with its version placeholder substituted` |
| the `%ITC_VERSION%` placeholder removed | **the build**, with the message telling you to restore it |
| `ok()` removed from `src/main.ts` | `the real built page boots clean, and says so` |

The browser tests report **passed, not skipped** — 7 of them, 0 skipped on this machine.
