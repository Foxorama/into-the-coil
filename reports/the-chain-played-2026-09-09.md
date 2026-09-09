# The chain played — 2026-09-09

The first play of [0283](../docs/decisions/0283-the-serpent-is-a-chain.md) on the branch preview,
given the same day it landed, with the predecessor's Jörmungandr card attached a second time as the
target.

## What was said

> *"definitely better, the segmented sections work well to give it a sense of movement"*
>
> *"bit of a problem though, slight gap between head and body."*
>
> *"it's also still very cute instead of menacing."*
>
> *"tip of the tail needs to be more pointed if we can and it needs a much more menacing face."*
>
> *"I originally attached the image from what we had for Jormungandr for the first session on this
> from the Golf-Stars project and I like the curved disc design of the body here, but we had a much
> more menacing head in Golf-Stars → I've reattached it as the second image here."*
>
> *"what I'm after is that the current body is good (aside from the gap) but the head and tail-tip
> are way too cute"*

**And the process question, which is the more important half:**

> *"do I need to export from golf-stars instructions or something on how to do bosses or more complex
> shapes because it took ages there as well and we got some really good stuff, but the same process
> is now repeating with days and days of re-iteration"*

## ⚠️ The answer to the process question, and it is not *export something*

**The predecessor's serpent SKULL had never been read.** `reports/the-vocabulary-is-the-ceiling-2026-09-08.md`
read `C:\Golf-Stars\src\render\shipArt.ts` `case 'serpent'` once, for the BODY — the stroked spine,
the stacked widths, the dashed venom-light. Nobody read the same function for the head, and
[0020](../docs/decisions/0020-the-fiction-transfers-the-code-does-not.md) has always permitted it:
*read named files for a named reason.*

Read now, it is built completely differently from anything this repository had:

| the predecessor's skull | what this repository had |
|---|---|
| **crown horns swept back** over the skull | nothing |
| the jaws as **two plates thrown open**, with a **lit throat** behind them | a mouth painted on a closed wedge |
| **four fangs** — two hanging, two standing | two small ones |
| a **brow plate** over the eye | nothing |
| **barbels** streaming off the jaw hinge | nothing |

⚠️ **AND ITS OWN NOTE IS THE ONE THAT TRANSFERS FURTHEST**: *"jaws filled in the hull green and
outlined in #07130f simply vanish into the dark — the first pass drew a fully-detailed head that read
as a blunt stump."* A head against open space needs its own light, not only its outline.

**So the answer is: nothing needs exporting. What was missing was a read that the constitution
already allows, of the specific thing being copied.** The re-iteration was not a tooling problem — it
was four passes of adjectives against a reference nobody had opened.

## ⚠️ And the second half of the answer: the loop that converged, once it was used

Every pass on the head after that read was **photographed rather than reasoned**: `shot-sheet` at 4×
for the skull, and a Playwright shot of `rig/bench.html` standing at the boss for the whole animal.
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) is exactly this instruction and
`reports/the-vocabulary-is-the-ceiling-2026-09-08.md` names the fastest channel this project has:
*the player drawing on a screenshot* — and a reference image is that, handed over.

Four defects in this pass were **invisible to every guard in the repository** and obvious in one
photograph: the body baking pink, a chord ruled across every node, a stack of croissants, and a
caterpillar at four-to-one. Four more were invisible in a photograph and obvious to a guard.

## What was answered, and where

[0284](../docs/decisions/0284-the-head-is-a-serpents.md): the gap, the tail's point, and the face.
