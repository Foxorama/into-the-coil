# 0014 — The privacy guard lands before the first key, not with it

**Accepted 2026-08-03.** Deviates from the scaffold plan's sequencing, deliberately.

## The rule

`PRIVACY.md` and `tests/privacy.test.ts` ship now, with **no `itc_*` key in existence**. The test
cross-checks the policy against `src/` in both directions, and proves its own extractors against
fixtures so that passing over an empty set means something.

The `github-pages` environment policy joins `.github/expected-settings.json`, so the setting that
refused the first release is now read back on a schedule rather than by memory.

## Why not wait for the first key

The plan says `PRIVACY.md` lands "in the same commit as the first real key, and **confirmed to fail**
by removing a row". The instinct is right and the sequencing is one commit late.

**The failure runs the other way.** A documented key going missing is not the realistic accident —
nobody deletes a storage key and leaves the row. What happens is a key gets ADDED and the policy is
not touched, because the person adding it is thinking about the feature. Landing the guard alongside
the first key means the first key is the single case it never protected; landing it now means the
very first `itc_*` anyone writes fails the build until it is written down.

The plan's proof still works, from the other side: instead of removing a row, add a key to `src/`
and watch it go red. That is a better proof anyway — it exercises the direction the danger actually
comes from.

There is also a publishing reason. The itch page and the public site exist now, and *"collects
nothing"* is true today and worth being able to point at.

## The part that would have made it decorative

With zero keys, both cross-checks compare empty sets. `[].filter(…)` equals `[]` however broken the
extraction is — a guard that has never been anything but green, which is exactly what
[0005](0005-a-guard-must-be-seen-to-fail.md) refuses. So the extractors are proved against samples:
a `localStorage.setItem('itc_save', …)` line, a template literal, and a markdown table row.

⚠️ **One of those proofs was itself broken, and a mutation caught it.** The assertion that the table
parser ignores PROSE was written against `PRIVACY.md` itself — and since the real document happens to
mention no key outside its table, the assertion passed while the parser was reading the entire file.
It is now proved against a fixture carrying a key in prose and a different key in a row, so the
scoping is tested rather than coincidentally satisfied. **A guard proved against real content is
only as strong as what that content happens to contain.**

## What the policy has to admit

The game stores one thing today: the service worker's offline copy of the page, in a cache the
policy names and the test checks against `public/sw.js`. Naming it is not pedantry — it is
client-side storage, and a policy that says "we store nothing" while the browser holds a cache is
inaccurate in the direction that costs trust.

⚠️ **Staging is not the game.** `next.intothecoil.vulpecula.games` sits behind Cloudflare's proxy,
which injects a bot-detection script at the edge — code the build does not contain and no
`src/`-scanning guard can see ([0011](0011-three-environments-and-a-separate-origin-for-staging.md)).
Production is unproxied and carries none of it. The policy says so plainly rather than making a
claim that is true of one origin and false of another.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| an undocumented `itc_seen` written in `src/` | `every storage key in src/ is written down` |
| a row for a key nothing uses | `every storage key it claims is actually used` |
| the documented cache name changed | `the cache it admits to is the cache the worker actually opens` |
| the source scanner's pattern broken | `the extractors actually find a key` |
| the table parser widened to the whole document | the same test — **after** it was fixed to use a fixture |
| *"Nothing."* softened to *"Almost nothing."* | `says plainly that nothing is sent` |
| the expected env policy given a second `main` rule | `settings-drift` reports drift, exit 1 |

The environment check was exercised against the live repository in both directions, and the exit
code confirmed separately — because the workflow opens its issue on a non-zero exit, and a report
that describes drift while exiting 0 would never reach anybody.
