# 0392 — The heads take a breath

**Accepted 2026-09-27.** Each of the hydra's heads gets 0.4 s of air after its attack before the next
head throws, on every tier. **Amends [0254](0254-the-hydra-grows-heads.md)**'s round, through the per-head
`gap` [0322](0322-the-ball-is-worth-shooting.md) made for the serpent.

## The ask

> with the hydra boss, the changes are good, but the attacks from the different heads come too fast too
> each and merge together, needs to be a slightly longer pause, maybe .4 sec for each heads attack, it's
> fine if they go out of sync with each, but at the moment they're clustered together and it's too hard to
> dodge

## What was measured

The quiet between one head's attack finishing — its fan thrown, its beam gone out, its staggered wall's
last shard away — and the next head's volley, flown at each phase and tier:

| tier | 80% | 60% | 40% | 20% |
|---|---|---|---|---|
| Legendary | 1.10 s | 1.00 | 0.72 | 0.72 |
| Savior | 0.80 | 0.70 | 0.52 | 0.50 |
| Burn | 0.60 | 0.50 | 0.40 | 0.40 |

**So *at least 0.4 s* was already true, and the ask is 0.4 s more.** The heads leave different mouths at
different angles, and fans half a second apart from five places read as one curtain.

## What changed

**`gap: 24` on every head in every round** — the field 0322 wrote for exactly this, *how much air this head
gets*, added after the head's attack on top of whatever it already costs. **Flat across the tiers**, as that
field always is: a tier makes a boss harder through its cadence, and the air is the head's. Tier-scaling it
was weighed and refused, because it would change the serpent's own gaps under 0322 too, shortest on Burn
where they were asked for.

## Guards changed, and why

**0371's *a harder tier throws more of it* now counts over thirty seconds, where it counted twenty.** A
wall is four shards, so it counts in fours, and with the breath the hydra's frost phase threw two walls in
twenty seconds on Burn and on Savior alike. Over a minute Burn threw 26 to Savior's 22 and Legend's 18: the
order held, and the window was too short to see it. Thirty is the length the claim was first made over.

## The guard, and that it was seen to fail

`tests/hydra.test.ts`, *0392*: flown at every round of heads on every tier, no head throws within 0.8 s of
the last one finishing — the tightest round's 0.4 s plus the 0.4 s asked for. One break in
`scripts/probes/0392-the-heads-take-a-breath.mjs`, the head's gap ignored, red at 0.72 s on Legendary.
**Re-anchored**: 0254's 80% probe, whose line now carries the gaps.

## What it costs

The rounds are slower, so fewer shots are in the air at once and each phase lasts as long as its health
does — the fight's length is unchanged, since nothing here touches damage. Owed a play.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
