# 0008 — The shell sidecars, and what "one file" now means

**Accepted 2026-08-03**, landed with SHELL & IDENTITY. Refines
[0003](0003-single-file-build.md), which is not superseded.

## The rule

`dist/` is `index.html` plus exactly three files that **cannot** be inlined:

| file | why it cannot be part of the page |
|---|---|
| `manifest.webmanifest` | a manifest is fetched from a URL by definition — `<link rel="manifest">` takes a href, not a body |
| `sw.js` | a worker's SCOPE is derived from its own URL; inlined, it has no scope and cannot be registered |
| `_headers` | read by the host at deploy time and never fetched by anything |

The list is closed and asserted. `dist/` growing a fourth entry means either a decision was made or
the bundler quietly stopped inlining something, and those two look identical until something names
the difference.

The manifest sets **`"orientation": "landscape"`**, and `id`, `start_url` and `scope` are all
relative.

## Why the refinement, rather than an exception

0003's rule reads "the build emits one self-contained file", and the reasoning under it is entirely
about one thing: **an external request the page needs in order to render**. A module script blocked
by CORS under `file://`; a hashed asset that 404s; a CDN serving a mismatched index and chunk; a
service worker answering with a stale pair. Every one of those is a white screen.

None of the three sidecars is in that class, and the test is simply whether the page still boots
when the file is missing. All three pass it: a 404 on the manifest costs installability, a 404 on
`sw.js` costs offline play, a missing `_headers` costs a cache header. The page renders regardless,
because there is still nothing it must fetch to run.

So the rule was never really "one file" — it was "no external dependency on the render path", and
one file was how that was measured while the render path was all there was. `dist/ is index.html and
nothing else` would now have to be either deleted or granted an exception, and an assertion that
accrues exceptions stops being read. A closed allowlist keeps the same pressure.

## Orientation, which is the whole reason this phase reads the predecessor rather than copies it

The predecessor's manifest says `"orientation": "portrait"`, and it is right to — it is a golf game.
Carried forward unread, that one word installs a landscape game as a portrait app, and the person
who discovers it is a player who has already installed it. It is a one-line change no risk rating
would ever have flagged, which is the case
[0001](0001-revertability-not-risk-rating.md) was decided on.

## Rejected: icons in this phase

A manifest with no icons is valid, and Chrome will decline to offer installation without a 192px and
a 512px. That is a real gap and it is left open deliberately: the fix is artwork, not scaffold, and
inventing placeholder art to satisfy a checklist would ship a launcher icon nobody chose. **The
shell is complete; the install prompt is not.**

## Rejected: version-stamping the worker from the package version alone

A worker is re-installed only when its **bytes** change. Stamp the cache name with the package
version and every build between two releases emits a byte-identical `sw.js` — the browser finds no
difference, never runs `install` again, and the precached shell stays frozen at whichever build
happened to ship first. The cache name carries the commit as well, which is the same argument
`BUILD_ID` was already made for: a version answers *which release*, only the commit answers *which
build*.

Both placeholders are required. A missing one fails the build rather than shipping a literal `%`.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md), each guard was watched failing before it was
trusted:

| broken on purpose | went red |
|---|---|
| `"orientation"` → `portrait` | `installs landscape, which is the orientation this game is played in` |
| manifest `name` → a different spelling | `the install manifest's name agrees with brand.ts` |
| manifest `short_name` → `Coil` | the same test — the label that actually fits under the icon |
| `theme_color` ≠ the page's `<meta>` | `agrees with the page about the theme colour` |
| `%ITC_BUILD%` removed from `sw.js` | **the build**, with the message telling you to restore it |
| `_headers` loses its `/sw.js` row | `revalidates every part of the shell, sw.js included` |
| `no-cache` → `no-store` | the same test |
| `public/_headers` removed entirely | `dist/ is the page, plus exactly the files that could not be inlined` |
| the registration removed from `src/main.ts` | `the built page still registers the service worker`, and both offline tests |
