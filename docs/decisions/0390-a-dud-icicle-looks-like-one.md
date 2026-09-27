# 0390 — A dud icicle looks like one

**Accepted 2026-09-27.** Frost that will melt rather than burst is drawn as a plain icicle — a slim
two-pointed needle flown point first — and frost that will still burst keeps the six-pointed shard.
Everywhere frost is thrown: the hoarfrost, the hydra's ice head, and the shard add's shatter.

## The ask

> for the ice attacks (across all levels) we need a different icicle art for the non-exploding icicles
> so that the player knows whether an icicle is going to explode or not

## What changed

**The frost row's stages** ([0263](0263-the-frost-ship-shatters.md)) are a shard, which bursts into two
bolts, which each burst into a ring of six, which melt. All three wore one star. A shot row may now name
`spriteSpent`, and a child whose next stage is a melt — or who has no next stage — wears it, turned to
the heading it flies straight on. Which children those are is read off the row's own `fission`, not
listed, so a stage added later is dressed by what it does; the shard add's shatter
([0299](0299-a-shard-is-killable.md)) throws its six at the last stage, so they are dressed too.

**The art is `frostSpent`**: a faceted needle, point at −x, in the frost ink at the shard's size and
with no heart. Told from the shard by silhouette alone — the star has points all round and a dark heart,
the needle two points and none — because the ink is the same, and has to be: both hurt the same.

## The guards, and that each was seen to fail

Four breaks in `scripts/probes/0390-a-dud-icicle-looks-like-one.mjs`, each red:

| guard | the break |
|---|---|
| `tests/accents.test.ts` — THE ASK, IN CSS PIXELS: the icicle is at least twice as long as wide on a 1280×720 screen, the shard within 1.5 of square | the icicle drawn squat |
| `tests/accents.test.ts` — every shot that can melt names spent art, and not its bursting art | the frost row's spent art set to the shard |
| `tests/frost.test.ts` — 0263's driven fission: the bolts wear the shard, the flakes the icicle | a flake left in the shard's art; a bolt dressed as spent |

0263's and 0299's assertions that a flake *is frost* read the spent art now.

## Not held by any guard

**Whether the player reads it at speed**, in a volley of both. Photographed on the bench in the
hoarfrost's fight, stars and needles together; owed a play.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
