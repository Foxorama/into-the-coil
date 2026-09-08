# 0277 — The serpent has menace, and a boss fires from its face

**Accepted 2026-09-08**, from the first play of the redrawn serpent on the deployed preview:

> *"played the dev preview page, the serpent is looking better, but it's way too small and needs to
> actually move/undulate, it's a static image that bounces up and down now and like y'know looks a
> bit weird."*
>
> *"it'll also needs to be firing the acid blasts from it's mouth, void blasts from it's eyes or
> somewhere and have scales and spines and some actual boss menace to it, maybe a glow effect etc"*
>
> *"the acid blasts and voids currently originate from the back half of the body"*

**Builds on [0276](0276-the-kit-draws-a-creature.md)**, and **amends
[0264](0264-the-real-bosses-are-drawn.md)**'s sizing of the serpent.

⚠️ **THE UNDULATION IS NOT HERE.** It is architectural — see *What this deliberately does not do* —
and bundling it with an art pass would make a verdict on either unattributable, which is 0109's
standing argument. Everything else asked for is.

## The rules

**A boss row says where its shots leave the hull.** `BossRow.muzzle: { along, across } | null`, in
world units from the hull's centre; `null` is the centre, which is where a gyre's and a jellyfish's
shots belong. `throwAttack` spawns every arm at it — `spray`, `rake`, `ring`, `wall`, `whip`, and a
`heads` round through the recursion. **`rain` and `belch` are untouched**: neither leaves the hull.

**The serpent is 56 units and its hurtbox is 22.** It is the largest extent in the game.

## ⚠️ Why the muzzle is a row field and not a constant

`(boss.along, boss.across)` is close enough to a muzzle on a hull that fills its own box, and every
boss had one until this one. A serpent's skull is at the far down-lane end of the **widest sprite in
the game** — twenty-four units in front of the centre — so the same code that reads fine on a
redoubt reads as *the body coughing*.

⚠️ **AND IT IS A CONSTANT PER ROW, BECAUSE A BOSS HAS NO HEADING.** `src/sim/entity.ts` carries no
rotation and `src/render/scene.ts` says *"`blit` cannot rotate"*; every hull is baked facing down-lane.
So a point in the sprite's frame IS a point in the world's, and no trigonometry is owed.

⚠️ **`null` ON SIX ROWS IS AN ANSWER AND NOT A PLACEHOLDER.** Only a hull with its face at one end has
to say where that end is.

## ⚠️ Why the hurtbox moved with the hull, and why that is 0036 backwards

The sprite went 40 → 56. A disc left at 16 would let a shot pass through forty per cent of the drawn
animal and register nothing — **an event the picture mentions and the model does not**, which is
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) with its two sides swapped.
Scaled with the hull: 16 × 56/40 = 22.4. `station + drift + radius` is **155 against the 160**
`tests/level.test.ts` allows, so this spends five of the row's eleven units of headroom, checked
rather than assumed.

## The menace

**Spines are in the outline, where the ticks of light were paint.** A boss's collision is a disc, not
its polygon, so the hull owes the sim nothing and may carry a ridge; what it still owes is
`tests/accents.test.ts`, which measures every mark against it. One spine between each pair of samples,
a third of the local half-width tall so the ridge thins with the animal, raked tailward.

⚠️ **WHAT MADE 0264's FOUR FINS READ AS SAWTEETH WAS NO ROOT, NOT THEIR BEING IN THE HULL.** A polygon
fin shares one edge with the body and nothing marks where one ends. Each of these has a shadow in its
socket — and that shadow was a round-capped stroke a third of the half-width wide in the first pass,
which baked as **a row of dark pills lying on the back**. A spine in the outline wants a seam, not a
capsule.

**Scales up from 0.20 to 0.34 alpha.** They were a texture you had to be told about.

**An aura, painted BEHIND the hull.** `globalCompositeOperation = 'destination-over'` — the pickup
bubble's trick from 0236, and the only way a mark sits under a hull that was sealed first, because the
first fill IS the silhouette. Three rings of the body's own shape, blown out and dimmed, which is what
the predecessor's serpent does and what a radial `glow` cannot: a disc of light around a ribbon lights
the empty half of the box.

⚠️ **BRIGHTEST RING FIRST, AND THE ORDER IS THE WHOLE OF IT.** `destination-over` puts each new fill
*behind* everything drawn so far, so a falloff built outside-in hides its bright ring behind its dim
one. The first pass did exactly that and baked as two flat slabs with a hard edge.

⚠️ **AND THE SWELL IS A SHARE OF THE HALF-WIDTH, NOT A CONSTANT, BECAUSE THE GUARD SAID SO TWICE.** An
aura is the one mark that leaves its hull on purpose, so it is the one that can run off its own tile
and bleed into a neighbour in the atlas. A flat swell reached **1.52 of the drawing radius against the
1.16 where the next bitmap begins**; tapered, the tail still reached 1.20, because there the spine runs
down the screen and the swell is all in x. The last two spine samples came in 0.04 for the halo's sake
and not the body's.

## ⚠️ And the neck is a waist, which is what stopped it being a worm

Reported once the size and the menace had landed:

> *"it's also still pretty wormy to be honest."*

⚠️ **A WORM IS WIDEST DIRECTLY BEHIND ITS HEAD. A SNAKE HAS A NECK.** Every profile until now —
0264's linear taper, 0276's `(1 - t^2.6)^1.1` — fell **monotonically from the neck**, so the thickest
part of the animal was the part touching the skull. That is a leech, and no quantity of scales,
spines or glow on it reads as anything else.

**So the profile is two terms**: a taper down the whole length, times a dip near the front. The neck
comes out about a quarter narrower than the girth a third of the way down, and the skull — authored
in absolute coordinates, and untouched — is suddenly half again wider than the neck behind it. **That
step is the head-neck junction, and it says *snake* before any paint is on the animal.**

**And a worm is one uniform tube along its whole length**, so the surface got the same treatment:
saddles down the back and flank, stopping short of the belly because one running the whole way round
is a *ring* and rings are what make an earthworm an earthworm; and transverse ventral scutes, struck
at twice the saddles' rate so the two rhythms do not line up into a grid.

⚠️ **THE FIRST SADDLES BAKED AS FACETS**, because each was three points at one station and three at
the next — its two long edges straight chords across a curving body. Eight samples an edge, filled as
a curve.

## ⚠️ And no bend is tighter than the animal's own spine allows

> *"the tail uplift is really really sharp and a snake/serpent would be more curved because of the
> spine, where a worm with no spine can sharp twist"*

⚠️ **MEASURED, AND IT WAS WORSE THAN THE REPORT SAID.** Bend radius as a multiple of the local girth:
the tail turned **sixty degrees in one step at 1.15**, and the CREST — the thickest part of the
animal, and therefore the part needing the largest radius of anything on it — was **0.85**, a bend
tighter than the body is wide. Eighteen samples now, and the tightest bend anywhere is **1.80**.
`0264 — THE HEADS` holds it above 1.5.

⚠️ **A RATIO AND NOT AN ABSOLUTE, BECAUSE FLEXIBILITY SCALES WITH THICKNESS.** A whip-thin tail has
more vertebrae per unit length than a thick midriff and really does bend tighter. An absolute floor
would either forbid a tail tip from curling at all or wave a hairpin through the midriff.

⚠️ **AND THE GUARD MEASURES THE SKELETON RATHER THAN THE FLATTENED OUTLINE, DELIBERATELY.** An
outline's curvature at a tail's point is legitimately unbounded — a tip IS a corner — so the quantity
the rule is about lives on the spine. Nothing in `bake.ts` computes a bend radius, so the arithmetic
is the guard's own and not the code agreeing with itself.

### ⚠️ THE COST, WHICH IS A GEOMETRY FACT AND NOT A PREFERENCE

**Gentle bends and many undulations do not both fit in one sprite box.** For a body of girth `g`
waving with wavelength `L` and amplitude `A`, the tightest radius is about `L² / (4π²A)`. Holding it
above `1.8g` with this girth and the ~1.75 of x-budget the box leaves buys **one broad arch**. Two
undulations at any amplitude worth looking at needs radii the spine cannot have.

**So the serpent is one gentle arch now, where it was one-and-a-half kinked ones.** That is the right
trade — the report was about kinks — but it is a ceiling, and it is the box that sets it.

⚠️ **THE SEGMENT CHAIN LIFTS THAT CEILING TOO, WHICH IS THE THIRD TIME IT HAS COME UP.** A chain is
not confined to a sprite box at all: the animal can be **longer than the screen**, as the reference's
is — it runs off both edges — and a long body waves through several gentle undulations without any of
them turning tightly. A boxed sprite can never do that, at any amount of authoring.

## ⚠️ And the art made a guard time out, which was fixed in the guard and not in the art

`tests/accents.test.ts`'s containment claim went from **452ms to 76 seconds** and blew the file's own
60-second timeout. The cause is this decision's: the serpent went to 56 units with a curved outline of
some twelve hundred flattened points, and the number of marks on it roughly tripled.

⚠️ **THINNING THE ART TO SUIT IT WOULD HAVE BEEN [0192](0192-a-guard-holds-an-invariant.md) EXACTLY
BACKWARDS, AND RAISING THE TIMEOUT WOULD HAVE BEEN [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s
*raised until it goes quiet*.** What was actually wrong is that the guard asks its most expensive
question where that question cannot have an answer.

**The interior grid — the mark's bounding box swept at two pixels a step — exists to catch a mark laid
across a HOLE**: `boss3`'s lattice, `boss5`'s ports, `boss7`'s ring, the warden's aperture. A hull of
one sub-path has no holes, and then Jordan settles it: a closed mark whose whole boundary is inside a
simply-connected hull has its interior inside too. **An exact short-circuit, not a sampling
compromise** — the claim is unchanged and the holed hulls still pay for it. **76s → under a second.**

## ⚠️ What this deliberately does not do

**The undulation.** *"It's a static image that bounces up and down."* True, and it cannot be otherwise
today: a bitmap is baked once and `blit` cannot rotate or deform. There are two ways out and they are
a real fork:

| | phase frames | segment chain |
|---|---|---|
| how | bake N phases of the wave, pick one off the step clock | bake body segments, blit them along a travelling spine |
| precedent | **exact** — `src/content/exhaust.ts`, *"a bitmap cannot rotate, so each frame is baked three ways"* | none |
| blits | **1**, unchanged | ~14, and `tests/budget.test.ts` asserts blits equal one per entity EXACTLY |
| atlas | 8–12 × 1.25 MB × 2 for the hurt twin | a handful of small bitmaps |
| bake time | 8–12 more of the largest bitmaps in the game, on every resize and place change | negligible |
| motion | a fixed cycle, quantised | continuous |
| the muzzle and the hurtbox | a table of positions per phase | **fall out of it** — the head is a real point and the segments are the hurt shape |

⚠️ **THE SEGMENT CHAIN ALSO ANSWERS THE REQUEST THIS DECISION COULD NOT** — *"we need to update the
boss collision to no longer be a disc if we can."* A serpent's disc is a bad fit for a ribbon, and the
chain's segment positions ARE a chain of hurt nodes. Doing the collision first and the undulation
second would be doing it twice, because an undulating body moves its own hurt shape.

⚠️ **AND THE COIL BELONGS WITH IT TOO, WHICH 0276 DID NOT FORESEE.** 0276 deferred a self-crossing
body because `seal` fills `evenodd` and a crossing hull gets a HOLE where it crosses, and because the
overlap only reads if the near body carries its own dark contour over the far one. **A segment chain
answers both by construction**: segments are blitted in order, so the near one covers the far one and
brings its own outline with it. A serpent coils and a worm does not, so this is likely a real part of
what *"still pretty wormy"* is naming — and it is not fixable in paint.

**So the three belong in one decision, and it is the next one.** What it has to buy is a change to the
blit budget, which is why it is not smuggled in here.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art, a table column and a spawn
point; nothing persisted, no storage key, no schema, no cache prefix.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0277`:

| broken on purpose | went red |
|---|---|
| a boss throwing from its hull's centre again, which is the body coughing | `THE MOUTH: the acid and the void leave the serpent's SKULL` |
| the serpent's row no longer naming a mouth, so the table forgets where its face is | `THE MOUTH: the acid and the void leave the serpent's SKULL` |
| the serpent's aura swelling by a constant, so its thinnest end runs off its own tile | `and a translucent mark — a plume, a halo — stays inside the sprite's own box` |

⚠️ **THE MUZZLE GUARD IS WRITTEN IN THE PLAYER'S UNITS AND NOT IN THE TABLE'S** —
[0027](0027-measure-the-picture-not-the-model.md). It asserts how far down-lane of the hull's centre
a shot actually appears, as a share of the hull's half-extent, so it cannot be satisfied by the middle
of the body however the row is written. Broken, it reports: *"the opening rake of acid left the hull
0.8 units down-lane of its centre, against a half-extent of 28."*

`node scripts/prove-guard.mjs 0254` still passes, with its head probe re-anchored for the threaded row.
