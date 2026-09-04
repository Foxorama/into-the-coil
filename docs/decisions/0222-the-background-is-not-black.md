# 0222 — The background is not black

**Accepted 2026-09-04.**

> *"as far as interactive objects go we can also highlight and brighten important objects while also
> filling the background with detail.*
>
> *a plain black background is a plain boring game you know what I'm saying?"*

## The rules

- **The contrast floor counts everything the sky draws**, not only the clouds — `skyCover`.
- **0203's forbidden band applies to structure**, and it applies to *compact* marks.
- **A body above the band carries a lit edge.**

## ⚠️ Those are not two requests, they are one trade

Detail is bought with **cover**; cover costs **contrast**; and the only way to buy contrast back is to
make the things that matter **louder**. The report names both halves in one sentence and they have to
be done together or the first one is refused by the floor.

So this decision starts with an instrument — `scripts/weigh-sky.mjs` — and not with a drawing.

## ⚠️ And the instrument immediately found a place under the floor

`cloudCover` counts **clouds**. Structure marks arrived in
[0211](0211-every-place-has-its-own-structure.md); a *lit* one is drawn in the same gas colour a cloud
is, on top of it. [0220](0220-a-place-is-somewhere-you-are.md) added lit crests and wall faces and
wrote the gap down. [0221](0221-a-planet-is-not-a-space.md) added a whole ground layer and wrote it
down again. **Neither closed it, because neither needed the headroom.**

| | `enemy`, Rime Shelf, vivid |
|---|---|
| against the bare backdrop | 5.84 |
| against clouds only — what every guard saw | 5.84 |
| **against everything the sky draws** | **2.67** |
| the floor | 3.00 |

Shipped the day before, by the decision that made Rime's blowing ice lit — correctly, since drawn dark
it was black scratches over the palest sky in the game. Every guard in the repository was green.

## ⚠️ `skyCover` is a share of area where `cloudCover` is a peak, and that is not an inconsistency

A cloud is forty units across, so its peak **is** a region and a worst-point is honest about it. A lit
structure mark is a few pixels wide, and four crossing composite to 0.94 over an area the size of a
full stop:

| Rime Shelf | |
|---|---|
| peak cover | 0.938 |
| share of the tile above 0.7 | **0.32%** |
| share above 0.9 | **0.00%** |

[0196](0196-the-backdrop-is-rounded-out.md) refused a bound of exactly that shape and said why: *"a
guard that cannot be satisfied by correct content is a guard that gets switched off."* `skyCover`
reports the brightest level at least **half a percent** of the tile reaches. A cloud's plateau still
counts in full; four hairlines do not.

⚠️ **THE ALTERNATIVE IS NOT GUARDABLE AND IS RECORDED HERE INSTEAD.** A probe for *the measure is an
area and not a peak* cannot exist: over-strictness shows up as a **false red**, never a false green,
and `npm run prove` said so by returning STILL GREEN on it. Prose, not a guard —
[0192](0192-a-guard-holds-an-invariant.md).

## ⚠️ What the band allows is a speck or a hulk, and nothing in between

[0203](0203-the-rule-was-never-about-size.md) forbids the sky anything between a bullet (**1.8 units**)
and twice the largest body (**16**). The music room's motes — the thing this report points at — sit
squarely in that gap, which is free there because no game is running and is not available in one. **So
the mid-sized chunk that is the obvious answer is the one thing that cannot be drawn.**

⚠️ **AND THE BAND HAD NEVER BEEN CHECKED AGAINST `STRUCTURE_OF` AT ALL.** It was written for landmarks
and star fields; structure arrived a year of decisions later. Found while sizing this pass's debris:

| | across | |
|---|---|---|
| Saurian Belt's belt rocks | **2.4 – 8 units** | in the band since 0211 |
| Ember Nebula's globules | up to ~6 | in the band since 0220 |

The rocks' own comment claimed the polygon was chosen *"deliberately not a disc — a disc at this size
is a bullet's silhouette, which 0203's band is about."* **The band is about size.**

⚠️ **COMPACT MARKS ONLY, WHICH IS 0112's REASONING RATHER THAN AN EXEMPTION.** *"What makes something
confusable is a hard edge at a bullet's scale, not area."* A corridor wall eleven units thick and a
whole tile long is not mistakable for a body; neither is a frond or an infall streak. **And a stroke's
aspect is its length over its width, not its bounding box** — the first version measured boxes, and a
wandering Toxic Mire frond has a nearly square one, so it counted as a compact fifty-unit object and
satisfied the *something is above the band* claim on its own.

## ⚠️ A hulk with no rim is drawn perfectly and cannot be seen

The first set were the right shapes, in the right places, at the right sizes, and were **invisible**: a
dark mark is a hole in the gas and The Approach's gas is the thinnest of the seven. That is 0220's
finding about The Labyrinth's corridor walls arriving in a second place, and it is now a guard, because
no size, position or count claim can catch it.

⚠️ **AND A SILHOUETTE IN SPACE IS NOW DARKER THAN THE VOID.** 0221 handed a place in space its own
`space` colour, so a dark mark was *exactly* the backdrop. **A body does not merely fail to add light;
it blocks what little there is.** Half way to black, inside the mark only.

## What the foreground lift cost and bought

`enemy` is the worst ink in all fourteen place-by-palette cells, so it alone decides how much
background the game can afford.

| | worst ratio, all seven places | more cover the tightest place could carry |
|---|---|---|
| `#ff4d6d` | 3.11 (and **2.67 before Rime was fixed**) | +0.06 |
| `#ff667f` | 3.55 | +0.27 |
| **`#ff7286`** | **3.83** | **+0.40** |
| `#ff8093` | 4.17, visibly pink | +0.51 |

⚠️ **THE HUE IS THE THING BEING SPENT.** Every step towards white buys background and costs the colour
the player has learned means *this can kill you*.

⚠️ **AND THE LIFT TURNED OUT TO PAY FOR THE CONTENT THAT WAS FAILING** — found by a probe that refused
to go red. Restoring Rime's blowing ice to the exact width and alpha it shipped under the floor with
came back **STILL GREEN** against the brightened ink. The narrowing is kept anyway, because *"icy and
austere"* is 0221's brief and thinner ice is more austere — but it is a taste now, and the record says
so rather than claiming a fix it no longer is.

## What is held

| claim | how |
|---|---|
| every ink clears the floor against **everything** the sky draws | `tests/sky.test.ts`, through `skyCover` |
| no compact structure mark is body-sized | `tests/places.test.ts`, in world units off `SHOTS` and `ENEMIES` |
| something is above the band, so the far end is not decoration | same |
| a body above the band has a lit edge | same |

⚠️ **AND `cloudsAt` EXISTS BECAUSE `npm run prove` CAUGHT A SECOND COPY.** `skyCover` first duplicated
the cloud accumulation, which made 0196's probe anchor **ambiguous** — a duplicated anchor is a
duplicated description arriving somewhere it can be seen. One function now, and both covers read
through it, so 0196's break costs strictly more than it did.

## What is owed

- **The hulks ride the weather tile, so they share its rate.** That is internally consistent — the
  weather is the furthest thing in this game's parallax by construction (0112), so a nearer star drawn
  over a farther rock is correct — but it means the debris has no rate of its own. A dedicated
  occluding layer, on `skyGround`'s pattern, is what would give it one. It is a sprite and 16MB, and it
  is a decision rather than a tuning.
- **The highlight half is only the ink.** *"Highlight and brighten"* was answered by making the objects
  brighter; a rim or halo ON the hulls is the other reading and is untouched. `drawKind` outlines every
  hull in the backdrop colour, which separates it from its neighbours and not from a busy background.
- **Saurian's volcanoes**, which were next in the queue before this and still are.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0222` — four breaks, four guards red. Two probes belonging to other
decisions were re-anchored: 0026, by the brighter `enemy`, and 0196 by `cloudsAt`.

⚠️ **AND THREE OF THIS DECISION'S OWN PROBES CAME BACK STILL GREEN BEFORE THEY WERE RIGHT.** One
emptied a single place's hulks against a claim about the game; one removed a count that nothing
currently breaches; one tested a design choice that cannot fail green at all. **A budget guard only
fires when the budget is breached**, so the only honest break is the breach — which here is the content
that actually shipped.
