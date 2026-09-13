# 0321 — The shoal is drawn

**Status:** accepted
**Builds on:** [0276](0276-the-kit-draws-a-creature.md) — the kit; [0318](0318-the-fish-is-drawn.md) — the pass this cuts down
**Corrects:** [0314](0314-the-shoal-comes-in-while-it-fights.md) — a comment claiming a guard that does not exist

## The ask

The last of the four in *"a fully great graphics pass over the fish and the shoal and kites and get
them up to par with the serpent pass in style."* The kite was
[0249](0249-the-eagle-summons.md)'s flat diamond — a ten-point polygon with four flat marks on it,
which is the exact list `reports/the-vocabulary-is-the-ceiling-2026-09-08.md` makes about the
predecessor's serpent. The minnow was honest and still flat.

## What does not survive the scale, which is the whole of this decision

⚠️ **THE FISH IS 42 UNITS AND THESE ARE 6.5 AND 5.** On a 1280×720 screen the kite is 47 CSS pixels
wide, so its drawing radius is 20 — and [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s
2.5px floor is **0.13 of that radius**, against 0.02 of the fish's. The minnow is worse: **0.17**.

| the fish carries | at this size |
|---|---|
| fin rays at 0.022 | a fifth of a pixel — nothing |
| a lateral line at 0.03 | nothing |
| a dust of motes at 0.07 radius | nothing |
| trailing filaments | nothing |
| **a halo** | **reads, and reads best** |
| **a form-shade** | **reads** |

⚠️ **A HALO IS THE ONE MARK THAT GETS BETTER SMALL, AND IT IS BECAUSE IT IS TRANSLUCENT.** 0106 is
about a mark being *drawn at all* and applies to solid ink; a halo has no width to lose. At 47 pixels
it is most of what says *this thing is made of the place it is in*, where a seam at the same scale
would just be the outline again.

## The kite was drawn as a curve, photographed, and put back

⚠️ **IT WAS THE HANDSOMER DRAWING AND THE WRONG ONE.** 0314 separates these two animals on exactly two
channels — *straight-edged and symmetrical about its long axis* against *curved, with a top and a
bottom* — because the pair a player has to separate at twenty pixels is **the one coming for me** and
**the one going somewhere else**. Rounding the kite spends one of the two, and the photograph showed
the result: two curved bodies differing only in symmetry.

⚠️ **AND THE BRIEF'S WORD IS *FLAT*, WHICH IS A CLAIM ABOUT SHADING RATHER THAN ABOUT EDGES.** What
made the kite flat was four marks in four flat tones on a cut-out, not the fact that its edges were
straight. So the volume arrives and the angles stay.

## Three more things the photographs decided

- ⚠️ **THE PLACE'S MOTIF IS OFF THE KITE, AND THE ARITHMETIC IS THE REASON.** `motif` scatters on a
  fixed 0.24 grid and keeps only a mark whose whole 0.09 square fits, so on a hull this small it
  survives **exactly one cell** — and 0.09 of a 19.7px radius is a 3.5px disc, the size of this
  animal's **eye**. Shot twice, with the belly across the body and again moved aft: both times the
  kite came back reading as a thing with two eyes. One speck the size of an eye is worse than none,
  and a lit leading edge at 0.13 does the job the scale can carry. The place is still on the animal in
  its hull, plate and lit inks ([0228](0228-an-enemy-wears-its-place.md)); the motif was a fourth
  channel and it is the one that does not survive.
- ⚠️ **AN EYE HAS A MINIMUM RADIUS HERE AND THE PUPIL SETS IT.** A pupil is 0.62 of its eye, so below
  **0.102** of the drawing radius it is under 2.5px and what bakes is a dark hole with nothing in it.
  Written at 0.1 and the guard reported **2.44px** — six hundredths of a pixel, which is the whole of
  the difference between a creature looking at you and a hole in its face. The minnow's floor is 0.134
  and it ships at 0.14; its old drawing was a flat `disc` with no pupil at all.
- ⚠️ **A `curveLoop` OVERSHOOTS ITS OWN SAMPLES, AND THE HALO'S CAP IS COMPUTED OFF THEM.** Authored to
  1.0, the kite's first curved hull flattened to **1.05**, so every swell was a twentieth low and the
  outer ring landed at 1.19 of the drawing radius — into the next bitmap of the atlas. That draft is
  gone with the curve, but the finding is not: **a cap read off authored points is a cap on a shape
  nobody draws.**

## The comment that claimed a guard that does not exist

⚠️ **0314 WROTE, IN `src/render/bake.ts`: *"`tests/legibility.test.ts` holds the distance between every
pair of hulls in this game."* IT DOES NOT, AND NEVER DID.** What exists is *no two BOSS hulls are the
same drawing* (`tests/accents.test.ts`, bosses only) and *every sprite kind appears exactly once on the
sheet*. **Identity is held; distance is not held anywhere, for any pair of enemies** — so the sentence
justifying the minnow's silhouette being deliberately unlike the kite's named a checker that never
checked it. That is a claim labelled rather than discharged, which
[0028](0028-quality-is-the-constraint.md) is explicit about, and it is mine.

⚠️ **AND THE DISTANCE GUARD IS REFUSED RATHER THAN OWED.** It would be a loop over a content table
comparing every instance of a kind against every other on one channel with a `>` in it — the exact
shape [0295](0295-a-ranking-guard-is-a-content-limiter.md) deleted five of at once, and it would
forbid a legitimately similar pair the day somebody wants one. **What is held instead is the PAIR's
own property**: that the two are not drawn the same way. Which of them is the polygon is a drawing
decision; that they are not both is not.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0321`:

| broken on purpose | went red |
|---|---|
| the halo taken off both adds, so each is a cut-out on the void again | `THE ASKED-FOR ONE: neither add is FLAT` |
| the kite drawn as a curve, so both adds are curves and one legibility channel is spent | `the two are not drawn the SAME way` |

⚠️ **THE SECOND GUARD MEASURES SAMPLES PER CORNER AND NOT CORNERS.** Counting corners separates
nothing: the minnow's flattened outline turns sharply at its fin tips and its tail fork just as the
kite's does at its own, and both come back with **ten**. A polygon is its own corners and needs no
samples between them; a curve is nearly all samples — 1.6 against 44.9, and 51.3 against 44.9 when the
kite is curved too.

## What this deliberately does not do

- **It does not touch the raptor, the moth, the jelly or any other enemy.** Eleven bodies still ride
  0249's flat marks; this is the two the ask named, and
  [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) is why that is a finished
  change rather than half of one.
- **It does not change `motif`.** Sizing its marks off the body they land on is the 0282-correct fix
  and it would move the art of every enemy in the game, which is its own measurement and its own PR.
- **It has not been played.** The whole ask — six items of fight and four of art — is now photographed
  and unplayed, and `docs/state-of-play.md` lists what to look at in the order the fight shows it.
