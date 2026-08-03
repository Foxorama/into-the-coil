# 0002 — Product identity is single-sourced, and the surfaces that cannot read it are tested

**Accepted 2026-08-03**, landed with SKELETON and TEST SPINE.

## The rule

`src/brand.ts` is the only place the product name and version are written: `GAME_TITLE`,
`APP_VERSION` (injected from `package.json` by a Vite `define`), and `BUILD_ID` (injected from the
commit being built). No user-facing name or version literal exists anywhere else in the module
graph.

**Some surfaces cannot import it, and no constant can fix that** — `index.html`'s `<title>` and the
coming boot watchdog run before any module; a service worker is not in the module graph at all.
Those are held by a **test**, not a constant: `tests/brand.test.ts` asserts the spellings agree.

## Why

The predecessor's title was a bare literal in six places, which is exactly how a rename half-lands:
five surfaces move and the sixth ships the old name for a year. It got one free rename — free only
because nothing was holding the contract yet — and even that one did not fully land, because the
surface it missed was a native resource no constant could ever have reached.

That incident is often read as an argument for a constant. It is not; it is an argument for a test.
The constant is what makes the reachable surfaces cheap; the test is what covers the rest.

**`BUILD_ID` is separate from `APP_VERSION` on purpose.** `APP_VERSION` only moves when
`package.json` does — in the predecessor it stood at one version across fourteen merges and five
deploys, so it could not answer *"is this the build I just deployed"*. A play-test walked into
exactly that gap and nobody — player, developer, or a support reply — could establish which build
either device was running. The commit is the one identifier that always moves.

## Confirmed, not assumed

The title guard was verified to **fail** before being trusted: changing `index.html` to
`Into The Coil` — one character of case — turned it red. A guard that has only ever been green is
not known to work.

`src/main.ts` is trivial but consumes all three constants deliberately: unused exports are
tree-shaken, and a guard asserting the bundle contains a value that was optimised out asserts
nothing.
