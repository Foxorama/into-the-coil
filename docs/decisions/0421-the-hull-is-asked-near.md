# 0421 — The hull is asked about the edges near the point

**Accepted 2026-09-30.** The third of the changes toward a CI run under ten minutes, ideally under
five — after [0419](0419-the-baseline-is-the-suites-own-run.md) and
[0420](0420-the-ci-is-sharded-and-joined.md) took it from 61 minutes to 5 min 50 s. Pays the first of
[0344](0344-a-probe-runs-warm.md)'s *seventy*: the guard its own comment said to make cheaper *"not to
raise this again for"*.

## The rule

**`tests/paths.ts`'s `edgeIndex` answers `inside` and the nearest-edge distance for a pass, exactly as
asking every edge does**, and the containment guards in `tests/accents.test.ts` ask it instead of the
full walk. Exact is the contract: `tests/paths.test.ts` holds the index to the full walk, bit for bit,
on every pass of every kind the game draws.

## Measured before anything changed

The 0149 hull guard — *every solid mark on a body is inside its hull* — instrumented in place, alone,
on the development box:

| | |
|---|---|
| the whole test | **80.9 s** |
| tracing every body in every place (329 bodies × 7) | **0.3 s** |
| the clearance search | **78.8 s — 99.6%** |
| the worst body, `boss10Gape` | 81,515 samples against a hull of 2,401 edges, 3.4 s |

⚠️ **THE BUDGET WAS SIZED WHEN IT TOOK 26.7 s ALONE.** It is 345 s, three times 113.9 s under the
suite (2026-09-21). By today the same test took **89 s alone, 142–169 s in CI and 168–378 s under the
suite locally** — and timed out twice in a row on the development box, the second time on an idle
machine, stopping `npm run prove` at its baseline. The comment above the budget already said what to
do, and it was not to raise it.

## Why an index, and why it is exact

Each sample asked every edge twice — once for the distance, once for the ray — and a curved hull
flattens to 2,400 edges a fraction of a pixel long, almost all of them nowhere near the point.

- **`inside`**: an edge can only cross the horizontal ray through `py` if its height spans `py`. Every
  edge is filed in every band its height touches, so `py`'s band holds every edge the full walk would
  count. Crossings and winding are sums, and a sum does not depend on order.
- **`distance`**: every edge is filed in every cell its box touches, so its nearest point to anything
  is in a cell it is filed in. The search walks rings of cells outward and stops once the best found
  is a whole cell inside the ring's reach — **a cell of slack on purpose**, because the stop compares a
  distance with cell arithmetic done in floating point, and one more ring costs less than reasoning
  about ulps. Each edge's distance is the full walk's own function, `segmentDistance`, and a minimum
  does not depend on order either.

So the numbers the guard compares against its floors are the same numbers. **What it measures has not
moved; only which edges it had to ask.**

⚠️ **The reference moved with it rather than being copied.** `nearestEdge` — the full walk, with the
accents suite's `Math.sqrt` rather than `strokeOutside`'s `Math.hypot`, which can round differently —
now lives in `tests/paths.ts` beside the index, and the two share `segmentDistance`.

## What it cost, measured

| | before | after |
|---|---|---|
| the 0149 hull guard, alone | 89 s | **8.6 s** |
| the 0149 hull guard, whole suite, development box | 168–378 s, and two timeouts | **36.8 s, 51.0 s** |
| `tests/accents.test.ts`, in CI's suite shard (#447) | 182 s | this PR's run |
| the new exactness guard, alone | — | **7.9 s**, 278,504 questions |
| the new exactness guard, whole suite | — | **45.1 s** |

**Budgets, per [0245](0245-a-budget-is-sized-under-load.md): three times the worst under the whole
suite** — the hull guard 345 s → **155 s**, the exactness guard **140 s**, each with its measurement
beside it.

⚠️ **The exactness guard is the full walk's cost, paid once per distinct shape instead of on every
body in every place.** It asks 62 hard points a shape: on vertices, level with them, a hair either
side of an edge, all round, and far outside the grid. A hurt, a charged and a charged-hurt twin are the
same geometry under another ink, so shapes are asked once — **that halved it, 15 s → 7.9 s alone and
115 s → 45.1 s under the suite, with the same answers asked**. Its floor is 150,000 questions, well
under the count, so a sample that has quietly stopped reaching the shapes cannot pass.

⚠️ **Found beside it, not caused by it:** two whole-suite runs on the development box each failed one
browser test on a page-boot wait — `room.browser`'s 15 s for the canvas, `intro.browser`'s 12.5 s for
the golfers — while both pass alone and in CI's lighter shards. [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s
class, and a change of its own; not this one.

## What was rejected

**Raising the budget again.** It is 0245's rule applied to a quantity that had grown threefold, and
the file already said it was the wrong answer.

**Sampling the hull more coarsely, or fewer places.** Faster, and it measures less — a mark over the
edge between two samples is exactly what 0149 exists to find.

**A bounding-box reject per edge.** 0318 measured it slower; its note moved with the reference.

## Confirmed, not assumed

Probes in `scripts/probes/0421-the-hull-is-asked-near.mjs`.

| broken on purpose | went red |
|---|---|
| an edge filed in one band of the several its height spans, so a ray through the rest misses it | `THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly` |
| an edge filed in all but the last column its box touches, so the ring search walks past it | `THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly` |
| the ring search stopping two cells early, before an unseen edge could be ruled out | `THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly` |
| the seen-marks never cleared between questions, so every question after the first skips every edge | `THE ONE IT IS FOR: on every pass of every kind, inside and distance are the full walk’s, exactly` |
| the fill rule read as nonzero always, so a hole cut by evenodd is solid again | `and a hole is a hole` |

⚠️ **And the guard it speeds up still fires.** Every probe already aimed at *THE 0149 ONE* — 0149,
0194, 0227, 0228, 0264, 0294 — was proven against the index:

| broken on purpose | went red |
|---|---|
| a boss’s eye moved out through its lobe, so the interior pokes out of the silhouette | `THE 0149 ONE: every solid mark on a body is inside its hull` |
| a boss’s mark laid across one of its holes, so a gap becomes opaque void | `THE 0149 ONE: every solid mark on a body is inside its hull` |
| a livery mark run out past the hull it is drawn on | `THE 0149 ONE: every solid mark on a body is inside its hull` |
| the missile’s exhaust plume drawn solid, so a translucent mark outside the hull becomes a solid one | `THE 0149 ONE: every solid mark on a body is inside its hull` |
| a motif kept wherever the grid put it, so scales run off the hull and into its holes | `THE 0149 ONE: every solid mark on a body is inside its hull` |
| the lit wedge widened on the leading side, so it hangs off the edge of the star | `THE 0149 ONE: every solid mark on a body is inside its hull` |

Thirty probes over those six decisions in all, every one red and every tree restored; 0276's five,
which edit `tests/paths.ts` itself, are red too.

⚠️ **No probe breaks the speed**, for 0115's reason; the wall clock is the table above and this PR's
own CI run.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). `tests/` and documents; nothing
shipped moves.
