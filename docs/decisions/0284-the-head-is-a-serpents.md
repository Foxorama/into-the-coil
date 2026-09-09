# 0284 — The head is a serpent's

**Accepted 2026-09-09**, from the first play of the chain —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"the segmented sections work well to give it a sense of movement… bit of a problem though, slight
> gap between head and body."*
>
> *"it's also still very cute instead of menacing. tip of the tail needs to be more pointed if we can
> and it needs a much more menacing face."*
>
> *"the current body is good (aside from the gap) but the head and tail-tip are way too cute"*

**Follows [0283](0283-the-serpent-is-a-chain.md)**, which said a play was owed and got one.

## The rules

**The skull is drawn for its own box.** 0283 rescaled the head 0264 had authored as one detail of a
fifty-six-unit animal, deliberately, so a verdict on the chain would not be tangled with a change to
the art — 0109's standing argument, as 0277 cites it. That verdict is in and the rescaled detail is
gone.

**A tooth is silhouette, not paint.**

**A body starts where the head ENDS, not where the skull's centre is.**

## ⚠️ Where the menace actually comes from, which was read rather than guessed

`C:\Golf-Stars\src\render\shipArt.ts`, `case 'serpent'`, read for this reason and nothing else —
[0020](0020-the-fiction-transfers-the-code-does-not.md). The report has the full comparison; the
short version is that the predecessor's skull carries **crown horns raked back**, **two jaw plates
thrown open** with a **lit throat** behind them, **four fangs**, and a **brow plate**, and this
repository's serpent had none of the five. **No amount of shading makes a closed mouth menacing**,
which is what four passes of adjectives had been trying to do.

⚠️ **AND THE HEAD IS NOW BUILT OF THOSE FIVE THINGS RATHER THAN OF DESCRIPTIONS OF THEM.** Two horns
with roots wider than their reach, a brow that juts over the eye, a gape opening to the front with
four teeth in it, a throat behind and a venom light in front, and an eye four times the area of the
one 0277 sized for a detail.

## ⚠️ The gap was a measurement, not a nudge

*"Slight gap between head and body."* The drawn skull's back edge is **6.95** world units behind the
head's centre. The first node sat at **6.5** with a radius of 3 — so the node meant to fill the neck
was a small disc hiding *inside* the skull, and the first one the player could see began at **6.09**,
nine tenths of a unit short of where the head ends. A notch.

⚠️ **`neck` IS WHERE THE BODY STARTS AND NOT WHERE THE SKULL ENDS**, which is the thing that made it
easy to get wrong: the first node belongs *under* the head, and what has to meet the skull's back is
the second or the third. At 3 the second node's leading edge is 2.6 and the third's is 6.6, so the
join is covered twice over.

## ⚠️ A tooth is silhouette, and the guard is what proved it

The first pass painted the fangs standing in the gape, and `tests/accents.test.ts` reported them
**9.5 CSS pixels outside the hull**. It is right: the gape is a NOTCH, so the space between the jaws
is not part of the silhouette, and a solid mark drawn there is a mark over a hole — which is exactly
what [0149](0149-a-hull-has-an-interior.md)'s guard exists to catch.

⚠️ **AND PAINTED FANGS COULD ONLY EVER SIT *ON* A JAW, WHICH IS NOT WHERE TEETH ARE.** So the four
teeth are in the outline, on [0277](0277-the-serpent-has-menace.md)'s own terms for the dorsal
spines: a boss's collision is a disc rather than its polygon, so the hull owes the sim nothing and
may carry a ridge — or four of them pointing the other way. Each tip is doubled, because `curveLoop`
smooths a lone point into a bump and a fang is a corner.

⚠️ **THE WHITE IS THEN DRAWN INSIDE THE TOOTH RATHER THAN TO IT.** A curve through a set of samples
cuts inside the polygon they describe wherever the outline is convex, so paint taken to a fang's
authored tip is paint taken to an edge that is no longer there — measured at **0.58 of a pixel** over,
invisible on the sheet. 0277 has the same finding about a belly band.

## ⚠️ And the tail ended in a full stop rather than a point

*"Tip of the tail needs to be more pointed if we can."* It did not: the profile fell to two units and
stopped, so the animal finished on a disc two units across. Falling **4 → 2 → 0.8** converges instead,
and because a node's spacing is a share of its own girth the last two sit almost on top of each other.

## ⚠️ What the photographs found and what the guards found, kept apart on purpose

**Four defects were invisible to every guard and obvious in one photograph** — 0027, again, and this
is the fifth decision in a row where that has been true. **Four more were invisible in a photograph
and obvious to a guard.** Neither instrument would have got there alone:

| the photograph | the guard |
|---|---|
| a skull that read as a green brick with a face on the front | four fangs 9.5 px outside the hull |
| horns like antennae, because their roots were narrower than their reach | a halo 0.01 of a radius past where the next bitmap begins |
| a back that ran at full height to a vertical wall | the white of a tooth 0.58 px over its own edge |
| the join still reading as a step | — |

## Confirmed, not assumed

⚠️ **NO NEW GUARD, AND SO NO NEW PROBE — WHICH IS THE HONEST STATEMENT RATHER THAN A GAP.** Every
claim this decision makes is already held by a guard 0264, 0149, 0277 or 0283 wrote: the skull is
longer than it is tall and wider than its neck; every solid mark is inside the hull; every translucent
one is inside the tile; the body's nodes and the animal's reach fit the screen and the pool.

**What did change is where three of those probes point**, and `npm run prove` refused all three until
they did:

| probe | why it moved |
|---|---|
| `0264` — the skull squashed | the skull cannot be squashed any more without stranding the eye, the nostril or a fang outside it, so `THE 0149 ONE` fired first. **Re-aimed at the other half of the same claim**: the neck thickened past the skull, which needs no art moved and is the same sentence read backwards |
| `0276` — the mouth line dragged off the skull | anchored on a comment the redraw split in two |
| `0283` — the neck inside the skull | anchored on `neck: 6.5`, which is 3 now |

⚠️ **THE FIRST OF THOSE IS THE INTERESTING ONE.** A probe that reddens two guards has not shown which
one holds what, and the old break now reddens containment before it reaches the claim it is about.
That is not a weaker probe — it is a break aimed at a hull that has since become covered in paint.

## What is owed

**A play, in motion.** The head is judged from two photographs and a sheet; whether it reads as
menacing at speed, with the body flowing behind it, is a hand's verdict.

**And the horns are the one mark that may be wrong at size.** They are legible at 4× on the sheet and
subtle at the shipped camera; the predecessor's card is a much larger picture than a twenty-unit
sprite, and a mark that only works when zoomed in is the thing
`reports/the-vocabulary-is-the-ceiling-2026-09-08.md` warns about from the other direction.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art, two row numbers and three
probe anchors; nothing persisted, no storage key, no save schema, no cache prefix, no origin.
