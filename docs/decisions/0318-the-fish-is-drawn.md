# 0318 — The fish is drawn

**Status:** accepted
**Discharges:** [0312](0312-the-eagle-was-always-a-fish.md) — *"the hull is deliberately not repainted"*
**Builds on:** [0276](0276-the-kit-draws-a-creature.md) — the kit; [0284](0284-the-head-is-a-serpents.md) — the order
**Extends:** [`tests/paths.ts`](../../tests/paths.ts) — a fill records its composite mode

## The ask, in two halves

> *"Now do a fully great graphics pass over the fish and the shoal and kites and get them up to par
> with the serpent pass in style."*

and then, having been shown it:

> *"Extend the wings to have longer finny trails coming off them and give it overall a more nebulous
> astral look as well. The shape is good, just needs some extra flavour enhancements."*

**This is the first of the four the ask contains** — the fish's own body. The `Face`, the morph between
phases and the adds' art are the other three and are queued in `docs/state-of-play.md`.

## The hull: 0312's debt, paid

⚠️ **`VOLANS_HULL` WAS STILL 0264's EAGLE PATH, AND 0312 SAID SO OUT LOUD.** *"A boss hull is a long
authored path that wants eyes rather than a confident hour at two in the morning"* — so the rename
shipped with the drawing untouched and the debt named. It is drawn now: a flying fish **seen from
above**, which is the view every other hull in this game is drawn in, as a spindle with two enormous
pectorals thrown wide and swept back, a pelvic pair, a pinched peduncle and a deeply forked tail.

⚠️ **A CURVE AND NOT A POLYGON.** `curveLoop` rather than `trace` — every point is a sample of a curve,
and a fin tip is a doubled point, which is 0284's own trick for a fang. **The span does not move**, so
nothing about what shares the screen with it changes ([0295](0295-a-ranking-guard-is-a-content-limiter.md)'s
*consider the screen*).

## The trails went in the silhouette first, and the photograph refused it

⚠️ **DRAWN AS HULL, A TRAIL GETS THE OUTLINE TRACED ROUND IT.** The first draft ran each filament out
of the wing tip and back, as part of the closed path. At 4× the wing read as a **hook**, and the gap
between the streamer and the fin it left read as a black wedge bitten out of the animal. The
photograph is the whole finding: nothing in the model was wrong, and
[0027](0027-measure-the-picture-not-the-model.md) is the rule that says go and look.

⚠️ **AND *"THE SHAPE IS GOOD"* IS THE SENTENCE THAT SETTLES WHICH HALF MOVES.** The hull the ask
approved is the hull that ships. The trails are **paint on it**: five tapering filaments a side —
three off the pectoral at falling lengths, one off the pelvic, one off the tail lobe — each rooted
inside the fin and fading to a point outside it.

⚠️ **AND A TRAIL SHOULD BE SOFT ANYWAY, WHICH IS THE HALF THE FIRST DRAFT HAD BACKWARDS.** These are
the marks on this body allowed to leave the hull, on the halo's own terms, bounded by
`tests/accents.test.ts` at 1.16 of the drawing radius.

**Three drafts of the filament itself, and the first two were photographed:**

| | |
|---|---|
| a fat seam down the band | a stroke has ONE width. The band is 0.215 across at its root and 0.036 at its point, so a seam wide enough to light the root **inked the void at the tip** — 9.25px outside the hull |
| a shaped wash at 0.6 | shape right, colour wrong: a `lit` ink laid at a third over the void bakes **olive**, and four of them read as smears |
| **a five-sided taper at 0.8** | the root ON the trailing edge, the far end a single vertex. Still under the 0.9 where `tests/accents.test.ts` starts calling a mark solid |

## The astral look is four marks, and one of them was deleted after being seen

- **A three-ring halo behind the hull.** `destination-over`, **brightest ring first**, so each new fill
  goes further back and the falloff stacks outward — [0277](0277-the-serpent-has-menace.md) shipped it
  the other way round once and it baked as two flat slabs with a hard edge. It stops at 1.12 because
  the tail reaches 1.0.
- **Two cores lighting the body from inside**, which is the half of *astral* a halo cannot do: a halo
  says there is light around the animal, a core says the light is coming out of it. **`source-atop`**,
  because at 0.42 the disc reaches ±0.42 across while the snout is 0.17 wide, and unclipped it baked
  as a haze sitting beside the fish.
- **A dust of motes along the back**, three a side, staggered and shrinking aft.
- ⚠️ **AND A WAKE OF EIGHT LOOSE GLOWS, WHICH WAS DRAWN, PHOTOGRAPHED AND CUT.** Hung behind each side
  where the streamers end, they baked as **detached brown smudges**: a glow over the void at a fifth
  alpha is not a light, it is a stain, and nothing joined them to the animal. One survives, in the
  tail's own notch, where there is hull on both sides of it to pick it up.

## What `tests/accents.test.ts` found, which is the part worth keeping

⚠️ **THE REDRAWN HULL HAD EIGHT MARKS OVER ITS OWN EDGE, AND HAD NEVER BEEN RUN PAST THE GUARD.** The
hull and its paint were written and photographed twice before the suite was asked, and it was red the
first time it ran:

| | |
|---|---|
| a pectoral ray | ran to **0.74 across at 0.32 along**, where the fin reaches 0.64 |
| both membrane washes | their roots sat 0.02 inside the outline — inside for a straight polygon, **outside for a smoothed one**, because `curveLoop` overshoots a corner a `trace` would sit inside |
| a pelvic ray, a tail ray, the gill seam | the same, smaller |

**Nothing was added to hold this**, and that is the point: 0227's containment claim is the right guard,
it fired, and it named every one in CSS pixels of the screen the reports were made on. What it cost was
an hour and no argument.

## `tests/paths.ts` records a fill's composite mode now

⚠️ **THE SAME EXTENSION 0276 MADE FOR A STROKE, AND FOR THE SAME REASON.** *A halo is BEHIND the
animal* is not a shape, a size or an alpha — it is one string, and until now the only way to check the
one thing 0277 got wrong was to read the source and believe it. `Stroke`'s own note in that file says
what that costs: **a claim the harness cannot see picks the drawing technique**, which is
[0192](0192-a-guard-holds-an-invariant.md) read backwards. Recorded and not applied, exactly as the
pen's existing note about `destination-over` already said it would be.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0318`:

| broken on purpose | went red |
|---|---|
| the streamers pulled back inside the fin, so the wings are striped rather than trailing | `THE ASKED-FOR ONE: the wings TRAIL` |
| the halo laid dimmest ring first, so the bright one goes behind the dim one and the falloff steps | `the astral light is BEHIND the animal, brightest ring first` |
| the halo composited over the hull rather than behind it, so it is a slab on the animal | `the astral light is BEHIND the animal, brightest ring first` |

⚠️ **THE FIRST GUARD WAS WRITTEN WRONG AND THE SUITE CAUGHT IT BEFORE THE PROBE DID.** Its first draft
asked whether a streamer reached further **down the lane than the tail**, and four of the ten did —
which says nothing, because a wing sits forward of the tail and a trail coming off one streams past the
fin it left. The quantity is the **overhang from the hull's edge where the mark is**, and it is asserted
at 8px, which is 0106's floor three times over.

## What this deliberately does not do

- **It does not give the fish a `Face`.** `wearFace` writes `spriteBase` on any boss, so the fish can
  track, gape and snap with no new mechanism — that is the next one and it is six baked kinds.
- **It does not morph between phases.** `look` per phase, as [0305](0305-the-serpent-darkens.md) does for
  the serpent, is the one after that.
- **It does not touch the shoal or the kites.** The minnow is honest and the kite is still
  [0249](0249-the-eagle-summons.md)'s flat diamond; both are the fourth item of the same ask.
- **It repaints no other boss.** Six still ride the lifted kit undrawn, and
  [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) is why that is a finished
  change rather than half of one.
