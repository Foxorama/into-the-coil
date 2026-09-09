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

## ⚠️ The second play, the same day, on the head 0284 drew

> *"getting better, there's a weird green bit in the mouth, no forked tongue or anything and the body
> is short and squat, it should be long enough to stretch off the screen for a serpent → I mean add
> more segements, not stretch out the segments that are there."*
>
> *"it also needs to be aggresively moving is mouth to watch the player's ship moving — the body is
> animated now which is good, but it still feels like a non-interactive wall object rather than a
> living space serpent trying to battle the player."*

**The green bit was a copied reason rather than a copied mark.** The gape was filled with `skin.lit`
at 0.55, reasoned from the predecessor's lit gullet — and the predecessor's serpent breathes venom.
The reference handed over shows a dark red mouth, which is what a mouth is.

⚠️ **AND THE SECOND HALF IS NOT *THE MOUTH DOES NOT MOVE*.** It already moved: 0284's `boss8Gape`
opens the jaw wide in the steps before a volley. What was reported is *non-interactive* — the mouth
moved when the FIGHT said so, never when the PLAYER did, so it was the same animation at the same
moment for every player and every run. That is
[0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s subject
arriving from the other direction, and it is why the fix is a snap armed by the ship crossing the head
rather than a jaw on a timer — a timer answers the words and not the report.

## ⚠️ And the loop paid for itself again, in both directions

Four defects on this pass were **invisible to every guard and obvious in one photograph**: the mouth
interior spiking out past the chin on every face, the tongue torn in half and reading as a crimson
spike through the snout, a black bite out of the jaw where the wedge cut a chord across the notch,
and — for the fourth time — a serpent sprite baking in the generic foe skin, a grey head with a red
eye.

⚠️ **AND ONE DEFECT WAS THE OPPOSITE: A GUARD REPORTING A REAL FAULT IN A NUMBER THAT LOOKED
TUNEABLE.** Sub-pixel containment failures on the painted fangs were chased for half a day by moving
a shrink factor between two floors it could not satisfy at once. The fault was that the upper teeth
were being swung by the lower jaw, and the number the guard reported was the size of the tear rather
than the size of the margin. **A floor that cannot be satisfied from either side is not a floor that
needs moving.**

## What was answered, and where

[0284](../docs/decisions/0284-the-head-is-a-serpents.md): the gap, the tail's point, and the face.

[0285](../docs/decisions/0285-the-mouth-is-alive.md): the green mouth, the forked tongue, and the jaw
that answers the player.

[0286](../docs/decisions/0286-a-serpent-runs-off-the-screen.md): the length, and the two guards it
had to change to get there.

## ⚠️ And the body was not too short for the screen — it was exactly short enough to fit on it

Measured before anything was changed: the body was **46 units** and the head stands at **119** on a
screen **178** wide at its narrowest. The tail stopped about twelve units short of the leading edge.

⚠️ **SO THE REPORT IS ABOUT SEEING THE ANIMAL END, NOT ABOUT ITS LENGTH IN UNITS.** A serpent whose
tapered tail is on screen is a serpent with a length; one that leaves the edge at full girth is
endless. It is 133 units now — off the leading edge of a 21:9 view as well as a 16:9 one — and the
taper is still authored and simply never seen.

⚠️ **AND THE COST WAS ALREADY WRITTEN DOWN BESIDE THE CODE**, which is
[0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md)'s last rule paying off:
`src/content/bosses.ts` had said since 0283 that *"a longer, thinner serpent is more nodes, and more
nodes is pool the game does not have."* The eleven were never an art choice — they were what the
particle share could spare. There was nothing left to shed (`tests/flares.test.ts` prices the debris
pool's fullest moment at 148.9 against 149), so the fifteen came from raising 0022's worst case,
which had been a phone's number since 0153 superseded the sizing half of it.

## ⚠️ One defect that could not have existed at eleven segments

**The serpent fought the whole fight one segment short and nothing said so.** A chain's nodes have no
velocity — they are written to `head.along + offset` every step — but they sat in a pool culled at the
leading edge like anything that flies, and a serpent ARRIVES from that edge. At 46 units the tail was
never past the margin; at 133 it was, the node was released, and `layChain` re-lays only when the pool
is empty.

⚠️ **The count had been solved with the boss parked on station**, which is
[0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s fourth
rule word for word — *a boss fight has an arrival, phases, windows and a death.* The guard that now
holds it watches every step of the fight rather than sampling the end.

**Still owed on this animal:** nobody has yet played a body this long. It shows about 1.7 waves where
it used to show half of one, on a `sway` and a `wavelength` tuned for the short version.

## ⚠️ The third play, on the long body, and the first verdict is *"pretty cool"*

> *"ok played the preview branch, it's looking pretty cool, the hitbox flash for the mouth doesn't
> look right though, it's a slightly off white triangle inside the mouth and it looks pretty weird."*
>
> *"also can we give it more motion, like have it rear back a bit rather than just have the head go up
> and down?"*
>
> *"and the head itself needs to be slightly bigger and also slightly longer — I know this is going to
> need the whole eyes, teeth and tongue and horns etc rejigged, but the head looks just a bit weird at
> the moment."*

**So the length is answered and the three that are left are a bug, a movement and an art pass** —
which is three verdicts, and they are being taken one PR at a time so each gets one.
[0109](../docs/decisions/0109-a-death-is-a-drum.md)'s standing argument — *"changing two channels at
once is what makes the next verdict unattributable"* — and the reason 0283 and 0284 were split in the
first place.

⚠️ **THE OFF-WHITE TRIANGLE IS THE MOUTH INTERIOR WEARING THE HIT WASH**, and the chain from cause to
symptom runs through two decisions that were each right on their own. 0284 made the gape a NOTCH in
the silhouette rather than a hole through it — so the dark red filling it is a mark in open space
rather than an absence. 0278 lays the flash over exactly the pixels the art covered. A mark is covered
pixels, so the cavity washed with everything else and flattened.
[0287](../docs/decisions/0287-a-cavity-is-not-washed.md) takes the cavity out of the wash.

⚠️ **AND IT IS ON SCREEN FOR MOST OF THE FIGHT**, which is 0278's own finding pointed at this: at four
steps a hit, every gun in the game holds the hurt twin on continuously while it fires. The base
frame's mouth is what the player sees between hits.

## ⚠️ The head, and what a resize costs a fight nobody was measuring

[0288](../docs/decisions/0288-the-skull-is-longer.md). *Bigger* is the extent, 20 → 24. *Longer* could
not be a longer snout: the aura sits at 1.075 of the hull against a 1.16 ceiling where the next bitmap
in the atlas begins, and the snout is at 1.06 — **there is 1.8% of room in front of this animal's
nose.** A sprite's box is square, so longer inside it is bought by giving up height: 1.96 × 1.34 where
it was 1.96 × 1.52, a length-to-height of 1.46 against 1.29.

⚠️ **AND THE HURTBOX WENT WITH IT, WHICH THE FIGHT-LENGTH FLOOR COULD NOT HAVE TOLD ANYBODY.** 0260
computes time-to-kill as `health × toughness / FASTEST` — a MODEL quantity with no hurtbox in it — so
a head drawn twenty per cent larger with a disc left at seven would have stayed green while the animal
grew edges a shot passes through. Driven at max weapons, parked on the boss's lane: **66.0s at radius
7, 59.0s at 8.4.** Eleven per cent, on a fight with nineteen seconds of room above the floor.

⚠️ **THE RIG FOR THAT IS A SCRATCH SCRIPT AND IT IS A DEBT.** `scripts/weigh-fight.mjs` measures a
MID-boss and splits its walk on `world.fight`; it cannot answer this without a flag that changes what
every number in it means, which is its own argument about its own sibling. If the next change to this
animal moves the fight again, `scripts/weigh-boss.mjs` is owed before the tuning rather than after it —
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md).

## What was asked for next, in the order it was asked

Recorded here because chat evaporates between sessions and this is what `reports/` is for — 0029.

1. ~~**The motion.**~~ *"Can we give it more motion, like have it rear back a bit rather than just
   have the head go up and down?"* Answered by
   [0289](../docs/decisions/0289-a-bob-can-rear.md) — a `rear` on the bob, phase-locked so the head
   sweeps an arc, and **the station moved 114 → 130 to pay for it**: 0101 holds every boss out of the
   player's half at the near end of its swing, the serpent sat at 57% with two per cent of room, and
   every unit of lunge came straight out of the player's. It holds off further and closes when it
   strikes. **Not played yet** — and the withdrawal and the strike take the same time, because both
   are the same cosine; if it reads as a sway rather than a strike, warping the angle is the next
   lever and not a bigger `rear`.
2. ~~**The acid.**~~ *"The acid attacks should fire out in a serpentine spray, as opposed [to] like
   the 3 blobs now."* Answered by [0290](../docs/decisions/0290-the-acid-is-serpentine.md) — nine
   beads on a wave, `whip`'s own mechanism with the heading waving instead of the speed. **The bead
   count had to ride the attack rather than the phase**, because this boss hands one `shots` to the
   acid, the void and the lightning in turn, and raising it would have given the rain three times its
   columns. **Measured, not photographed**: the bench would not catch a volley in flight across four
   attempts, so the shape was read off the beads' own world coordinates — and *does it read as
   serpentine* is a play verdict, not a plot's.
3. ~~**The void.**~~ *"The void blasts should be bigger and a bit random and should eat x amount of
   damage and then explode in a void blast."* Answered by
   [0291](../docs/decisions/0291-the-void-has-an-appetite.md) — 1.3 → 2.2 with a size rolled per
   blast, an appetite of six that IS its health, a swell of a tenth a bite so the picture says it is
   eating, and a ring of seven shards when it is full.

   ⚠️ **TWO THINGS THE BRIEF ASKED FOR THAT THIS DOES NOT DO**, and they are named rather than
   quietly dropped. It feeds on the guns alone: *"absorb the player's weapons/missiles/bomb"* wants
   two more pairings, and a missile is guided while a bomb's blast is an area rather than a body.
   And *"it'll be interesting to see how it interacts with the lightning gun"* has an answer already,
   which is **it does not** — the arc's bolts are strokes rather than pooled shots (0233), so they
   never pass through `playerShots` and cannot feed a void as things stand. Worth knowing before it
   is played, because *the lightning gun ignores void blasts* is a finding and not a bug.

⚠️ **AND THE LIGHTNING IS NOT TO BE TOUCHED**: *"don't change the lightning attack it's really good."*
Said twice now, two plays apart. It is the one attack on this boss with a verdict already in.
