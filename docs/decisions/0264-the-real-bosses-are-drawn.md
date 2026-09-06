# 0264 — The real bosses are drawn

**Accepted 2026-09-06**, the same day as [0263](0263-the-frost-ship-shatters.md), from
[`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"The boss graphics are bad (compare Jörmungandr in Golf-Stars vs the grey tentacle here). The
> new bosses look terrible (the hydra shows no heads)."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the seven real bosses' hulls
and paint. **Extends [0228](0228-an-enemy-wears-its-place.md)**: a place's lord wears a skin of its
own. **Rides [0227](0227-a-sprite-is-painted-not-filled.md)** unchanged: the hull is the sealed
path and everything after it is paint on it.

## The rules

**A lord wears its own skin.** `ThemeRow.lord` is a `FoeSkin` beside `foe`, and `lordOf` is
`foeOf` for it — the same palette rule, the same `null` on the high-contrast palette. The
serpent was *"the grey tentacle"* because a boss was a foe and a foe wore the Approach's raider
grey; a creature is not a raider, and the one body a level is named for does not wear the uniform
of the things it sends. The mid-boss still does: it is one of them. `THE LORD` in
`tests/foes.test.ts` holds every lord's skin to `foe`'s floors and off `foe`'s hull, and reads
off the trace that the lord's hull is sealed in it and the mid-boss's in the place's.

**Six hulls redrawn as the creatures the brief names.** What the predecessor's serpent taught —
`C:\Golf-Stars`'s `shipArt.ts`, read for that reason and nothing else: a body is one spine with a
taper and everything hangs off it; a skull is edged in its own light or it vanishes into the
dark; the maw is lit in the gap the jaws leave; fins and scutes sit on the body's own heading.
So: the **serpent** is a ribbon on one spine, an S across the box, a fifth of the box wide at
the neck, with a solid skull at the front and four fins leaning tailward — scales down the
spine, venom-light between them, the belly in shadow, a lit brow, a gold eye, a dark mouth with
the maw lit in it and a fang off each jaw. The **hydra** is a body and five necks, each a ribbon
on its own spine and each ending in a skull; the heads are the outline and not paint on it,
which is what *"shows no heads"* asked for. The **eagle** has a hooked beak, wings with the
primaries notched down their trailing edges and a fanned tail, quills radiating from each
shoulder. The **pterodactyl** has a beak, a crest, and wings scalloped between the wing-fingers,
ribbed. The **frost ship** is a crystal with two great ice-spires swept back and a smaller pair
at the prow, facets up the spires and a cold core. The **jellyfish** is a bell with six tendrils
trailing and spreading, a lit rim and the black heart big in it. The gyre's cog was not in the
report and is untouched.

**Nothing on a hull thinner than a quarter of `r`.** The outline is stroked at a tenth of `r` in
the void's ink, centred on the edge, so a jaw, a neck or a tendril finer than that is outline and
no body — the first pass drew open jaws and the sheet showed a skull with a hole where the mouth
was. A mouth is paint: a dark wedge with the maw lit in it. The rule is a comment beside the
serpent's taper, because a guard over every vertex of every hull would be a guard over drawing.

**The heads are held.** `0264 — THE HEADS` in `tests/accents.test.ts` counts the hydra's hull's
reaches into the front fifth of its box — five, a head's width apart — and holds the serpent's
skull wider than its neck. Over the hull pass, on 0081's argument: paint may not supply the
difference.

## ⚠️ What was rejected

**Strokes after the seal.** The predecessor's serpent is stacked strokes on one path, and it
would be the natural way to draw a taper; `tests/paths.ts` models a stroke as its fill, so a
stroked spine would be a mark the containment guard cannot see. Ribbons are polygons.

**Bullets, mid-boss attacks.** The same report's *"mid-boss attacks nearly invisible"* and
*"enemy bullets hard to see"* are the hostile ladder's, not the hulls', and get their own decision.

## What is owed

- **Eyes on all seven at the shipped camera**, in a fight — the sheet at four times is where these
  were judged, and thirty units in motion is another picture. `shots/lords/` is the sheet.
- **The eagle's head**, which is the least of the six; and the jellyfish's tendrils, which read
  as spines at the outline's width.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art and a table column; nothing
persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0264`:

| broken on purpose | went red |
|---|---|
| the Approach's lord given its raiders' skin, which is the grey tentacle | `THE LORD: every place skins its real boss in a skin of its own` |
| the lord skinned on the high-contrast palette, which 0024 says gets the flat game | `THE LORD: every place skins its real boss in a skin of its own` |
| the painter sealing every boss in the place's foe skin, so the lord row is a row nobody reads | `and the lord's hull is sealed in it` |
| the hydra's skulls taken off its necks, so the hull is five stumps | `0264 — THE HEADS` |
| the serpent's skull no wider than its neck, which is the tentacle the report named | `0264 — THE HEADS` |
