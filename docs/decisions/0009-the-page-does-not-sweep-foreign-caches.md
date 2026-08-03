# 0009 — The page does not sweep foreign caches

**Accepted 2026-08-03**, landed with SHELL & IDENTITY.

## The rule

`index.html` never touches Cache Storage. The only code that calls `caches.delete` is `public/sw.js`,
and it deletes only keys carrying its own `into-the-coil-` prefix.

The page keeps one narrower guard: it unregisters service-worker registrations whose scope is a
**strict ancestor** of its own. Siblings are left alone.

## Why — the sweep is carried forward examined, and most of it does not survive

The predecessor's pre-boot script did two origin-wide things: unregister every worker whose scope
was not its own, and delete every cache not named `far-carry-*`. Its stated motive is sound — the
app shares `foxorama.github.io` with other projects, and a root-scoped worker belonging to one of
them can intercept this page and blank it.

Read against where the game is actually served, the two halves come apart.

**The cache sweep protects nothing.** A Cache Storage entry is inert data. Nothing reads it but the
worker that owns it, and no worker can answer for this page unless it is already controlling this
page. If a foreign worker is controlling us, it serves from its own caches and deleting them changes
which stale response we get, not whether we get one. The sweep does not defend the page; it only
looks like it does, because deleting things reads as tidying up.

**And it does real damage, in the place this game is most likely to ship first.** itch.io serves
every HTML game on the site from one origin, `html-classic.itch.zone`. A rule that deletes every
cache it did not create is one game deleting another game's offline copy, on every boot, forever.
The predecessor ships that today. Nothing in its own testing could have caught it: the damage is
invisible from inside the app doing it.

**The worker sweep survives, narrowed.** Only an ancestor scope can intercept this page — that is
what scope means. A sibling registration is unreachable from here, so unregistering it is the same
collateral damage as the cache sweep with none of the protection. The prefix test is a plain string
prefix, which is safe because scopes always end in `/`.

## What this buys beyond correctness

The scaffold plan flagged the cache prefix as **one decision in three places that cannot share a
constant** — `sw.js` twice, plus the page's sweep — and specified a test to hold the three in
agreement. Removing the sweep removes the third site, and the remaining two collapse into a local
`PREFIX` variable inside one file.

That is the strongest tier of the ladder in the scaffold plan: **remove the affordance**. A guard
holding three copies in agreement is a rule about a hazard; one constant is the hazard gone. The
test that remains asserts something better than agreement — that there are no copies.

## Rejected: unregister only the worker currently controlling the page

Tighter, and it was the first design. It fails on the load that matters: on a first visit our own
worker is not registered yet, so *any* controller is foreign and the check degenerates — while on
the visit after a foreign worker has been installed, the page is already being intercepted before
any script of ours runs. Scope is a static fact and testable at any moment; "is controlling us right
now" is neither.

## Known limit, stated rather than fixed

Unregistering does not un-control the **current** page — that worker keeps answering until the next
load. The alternative is reloading out from under a page that may well be fine, and the diagnosis
this exists for survives one more load. The boot watchdog
([0007](0007-the-boot-watchdog.md)) is what makes that load legible.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md):

| broken on purpose | went red |
|---|---|
| an origin-wide `caches.keys()/delete` re-added to `index.html` | `never deletes a cache it did not create` |
| the scope narrowing dropped back to `scope !== ours` | `unregisters only ancestor-scoped workers, never siblings` |
| the prefix gate removed from the worker's `activate` sweep | `retires only its own previous versions`, **and** the browser test `retires its own stale cache and leaves a stranger's alone` |
| the prefix inlined a second time in `sw.js` | `spells its cache prefix exactly once` |

The last two are the pair that matters. The static test says the code still names its own prefix;
the browser test seeds a stranger's cache on the origin, stands a next release in front of the
browser, and watches the sweep run for real — one cache retired, one left standing.
