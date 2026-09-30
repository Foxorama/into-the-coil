# 0423 — The pool is taken out, and a page boot is sized under the suite

**Accepted 2026-09-30.** **Supersedes the pool in [0422](0422-a-place-is-baked-on-every-core.md)** —
its worker threads, `primeLoops`, `bakeInPool` and `tests/clean.ts`'s prime. What 0422 did that stands
is kept: the byte-identical `pow` skip in `src/app/sound.ts`, 0099's re-aimed probe, and the guard on
`tests/bakes.ts`'s copies. And it re-sizes the browser suites' page-boot wait, which is what it was
started for.

## The rules

**A test does not add threads to a suite that already runs one worker per core.** vitest's pool is the
machine; a thread a test starts is a thread some neighbour waits behind, and the neighbours that wait
worst are the ones reading the wall clock.

**The golfer screen's wait is 42 s and every suite's canvas wait is one 25 s**, each three times the
worst measured under the whole suite ([0245](0245-a-budget-is-sized-under-load.md)), with the
measurements beside the number in `tests/intro.ts`.

## What was measured, and it is 0422's own mistake

The task was the browser suites' page-boot waits, failing on the development box one at a time and a
different test each run. So the boots were timed the way 0412 timed them: a separate script loading
the built page over and over **while the whole suite ran beside it**, from `goto` to the canvas, to
the golfers, to the title, and through the music room's two clicks.

| whole-suite run, development box | pool | loads | canvas worst | golfers worst | suite | the 60 s music guard |
|---|---|---|---|---|---|---|
| 1 | none (`main` before 0422) | 36 | 5.1 s | 8.3 s | green | passed |
| 2 | half the cores | 39 | 8.2 s | 15.7 s | 3 failed | **timed out** |
| 3 | two threads | 36 | 4.7 s | 14.4 s | 468 s, 1 failed | **timed out** |
| 4 | none | 37 | 4.3 s | 7.5 s | 389 s, green | 39.7 s |
| 5 | none | 39 | 8.2 s | **13.7 s** | 534 s, 1 failed | 40.1 s |

Alone, six loads: canvas 0.44 s, golfers 2.2 s, title 12 ms, the room's two clicks 25–144 ms.

⚠️ **RUN 5 IS THE ONE THAT MATTERS, AND IT OVERTURNED WHAT RUNS 1–3 SEEMED TO SAY.** After three runs the
pool looked like the neighbour: the tails had roughly doubled with it. With it gone the tails were
just as long, and an intro boot failed the same way. **The page-boot tails are the machine's load,
which moves by 40% between two runs of the same suite** — 389 s against 534 s — and a single run per
configuration cannot see past that. The pool was blamed on three samples, and the user was asked to
choose on that framing before the fifth corrected it.

⚠️ **WHAT THE POOL DID DO IS THE MUSIC GUARD**: *the band a chest resolves is a real share of the mix*,
60 s, timed out in both pooled runs and passed at about 40 s in both without. It reads its music
through `tests/bakes.ts`, so it waited behind the pool. And the mechanism is not subtle: vitest runs a
worker per core, so every thread a test adds is oversubscription, and a pool only helps in the moments
the suite is idle.

⚠️ **0422 SHIPPED WITH THIS IN HAND AND CALLED IT INCONCLUSIVE.** Its *2 of 5, 2 of 2, 1 of 2* table was
honest and its conclusion was not: *five runs against two is not a rate* is true, and it was used to
wave the pool through rather than to go and take the runs that would say.
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md): the pool was measured alone and in CI's tail,
and the case it is applied to is a saturated suite.

## What 0422's pool bought in CI, which is what is given back

`tests/themes.test.ts` in a CI suite shard: 284 s on #447, **236 s** on #449 — the `pow` skip's share of
that stays. CI's run went 5 min 48 s → 5 min 08 s over #449, and this PR's own run is what it is without
the pool. The user was offered the pool back with its budgets raised, and asked instead for a better
way to do the whole section: that is the next decision, not this one.

## The golfer screen

`INTRO_READY_MS` was sized on 2026-09-29: 1.1–4.1 s under the whole suite, so 12.5 s. A day later,
with no pool, **the golfer screen alone takes 2.2 s** — the load itself has grown — and the worst under
the suite is **13.7 s**. Three times that is **42 s**. Runs 2 and 3 are left out: they measured a suite
that no longer exists.

⚠️ **It is a budget and it no longer doubles as the regression guard 0413 wrote into it** — *a slower
load now is a prewarm back on the page's own thread*. That claim has its own guard, which counts the
layers posted to the bake pool, and it does not depend on a clock.

## The canvas

**Eleven suites wait for the canvas and spelled it ten times as `15_000` and once as nothing at all**
(`hud.browser`, Playwright's default). None had a measurement beside it. It is `CANVAS_MS` in
`tests/intro.ts` now, **25 s**: 0.44 s alone and 8.2 s at worst under the suite, three times over.

## What this does not size, and why

⚠️ **TWO MUSIC GUARDS NOW RUN PAST THE RULE, AND THIS DOES NOT RAISE THEM.** Without the pool the clip
guard took **341.9 s** under run 5's suite against its 420 s budget, and *the band a chest resolves* 40.1 s
against 60 s — each under 3× its worst. Both are the same cost, the seven places baked in every file
that needs them, and the next change is the one that removes it: each bake done once for a source
tree and read by every file. Raising them first would be sizing a clock around work that is about to
stop being done.

⚠️ **ONE FAILURE STAYS UNEXPLAINED.** `tests/room.browser.test.ts` once waited 30 s for *The Approach*
to become clickable, in the run with the uncapped pool. Across 187 measured loads under the suite
since, the worst for that click was 1.3 s, and 3.2 s for the one before it. It is recorded here, not
sized away and not called flaky — [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md).

## Confirmed, not assumed

⚠️ **No new guard, so no new probe.** Two numbers are re-sized and a pool is removed; a probe cannot
make a test slow, for 0115's reason, and the measurements are the evidence. 0422's probes on the pool
went with it; its one on the cache's copies stays, and was run: red.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). `tests/`, `scripts/probes/` and
documents; nothing shipped changes.
