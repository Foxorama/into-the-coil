# 0632 — The enemies are finished

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 17. Its *Pressure-tested* says
what this is: the shared level of finish every body lacks, built before any one body's own detail.

## The ask

> *"Enemy Sprites: still look overall a lot like placeholders, can we do something overall with the enemy art"*

## What was there, photographed first

Ten bodies on the sprite sheet at 4×, at The Approach and at the Saurian Belt (`shots/enemies-before.png`, not
tracked). After 0601–0603 every body has a place's own shape and paint, but each is four or five flat shapes on a flat
hull, with no light on it:

- The Approach's are grey cut-outs with a pink strip;
- the Saurian Belt's are flat green with a motif.

The report warned that a fourth repaint per place at the same detail would answer this ask with a rename
([0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md)). This is the other half of what it found missing: a
finish over every body.

## The rule

Every solid body a place sends is finished over its own paint (`finishBody`, `src/render/bake.ts`):

- **A form-shade on the hull's own path.** The place's lit ink lies along the top and fades out by the middle; the
  plate darkens along the bottom. Both are spread over the body's own height, not its box's. Over the box, a body a
  third of its box tall got only the faint middle of the gradient: the first try changed 5,000 to 21,000 pixels a
  body and could not be seen at the sheet's 4×.
- **A rim light inside every edge that faces up.** It is the body's own outline, lowered by half the seal's width
  and half its own, then stroked `source-atop` in the lit ink brightened, fading out by the middle. `source-atop`
  lands it only where the body already has ink, so it cannot widen a silhouette. Its alpha is under 0.9, so
  `tests/accents.test.ts` reads it as light rather than ink.
- **The rim is 0.07 of the radius and never under 2.5 px**, 0106's floor. At the fight's camera a small enemy's
  radius is about fourteen pixels, and its share alone was 0.97 px.

The strengths are each place's own, on its `foe` row (`FoeSkin.finish`, `src/content/themes.ts`):

| place | light | shadow | rim | why |
|---|---|---|---|---|
| The Approach | 0.45 | 0.65 | 0.9 | steel under a hard light |
| Ember Nebula | 0.4 | 0.6 | 0.6 | warm, soft, lit by the embers round it |
| Saurian Belt | 0.35 | 0.65 | 0.6 | hide under a canopy |
| The Labyrinth | 0.3 | 0.7 | 0.95 | machines in the dark, edges like lit traces |
| Rime Shelf | 0.5 | 0.5 | 1 | ice: light through it, the brightest rim |
| The Toxic Mire | 0.38 | 0.6 | 0.9 | wet flesh, glossy |
| The Black Heart | 0.32 | 0.72 | 0.8 | the deepest shadow |

`FINISH` in shared code is the fallback for a place that names none
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)); all seven name their own.

The high-contrast palette has no skin, so it gets no finish, as it gets no paint. A hurt twin is its base finished,
under the flash's one wash.

**The moon jelly is not finished.** It is its own light, glowing through a hull at a third of its ink. A form-shade
is light falling on a solid body from outside it.

## What guards it

`tests/accents.test.ts`, *0632: every enemy in every place is finished*. For every frame of every enemy but the moon
jelly, in every place:

- a gradient fill lies on the hull's own path;
- a `source-atop` gradient stroke is drawn, at least 2.5 px wide on a 1280×720 screen.

The guard found the kite and the minnow unfinished on its first run. Each draws its own hull outside the two shared
painters, and both are now finished. The moon jelly is exempt by name.

Probes are in `scripts/probes/0632-the-enemies-are-finished.mjs`, both seen red:

- the shared kinds left unfinished;
- the rim at its share of the radius alone.

**The finish blinded one guard, and it is mended.** `tests/foes.test.ts` *every enemy and boss is painted* counted
fills and asked for more than one. The form-shade is a second fill, so a body sealed and given no paint passed, and
0228's probe that leaves the charger flat stayed green. The count now leaves out a gradient on the hull's own path,
which is the finish and not paint. All six of 0228's probes were seen red again.

Re-anchored, because this change moved the text they find: three of 0228's probes and three of 0626's (each place's
`foe` row now spans lines), and one of 0321's (the kite's posed hull is kept, to trace again).

## What this does not do

It gives every body light and an edge. It does not give any body more detail than its paint already had. The pages
asked for something *overall*, and this is the overall half. Whether each body also needs its own redraw is for a
look in play to say, and this decision makes no claim either way.

## Owed

- **A run through the seven places**, judging whether the bodies still read as placeholders at the fight's size. At
  the bench's 1280×720 the lancer reads lit along its top and dark under, but an enemy is twenty to thirty pixels
  there.
