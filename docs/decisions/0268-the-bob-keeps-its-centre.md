# 0268 — The bob keeps its centre

**Accepted 2026-09-06**, from the play of the alpha build. A bug, reported in the player's own words:

> *"There's also a bug when bosses and minibosses get health reduced and then start bouncing up and
> down, they keep bouncing up and down off screen."*

**Fixes a defect in [0111](0111-a-boss-has-one-idea.md)**, which gave the boss its `bob`.

## What was wrong

`stepBoss`'s `bob` arm set `velAcross` to the derivative of `amplitude × sin(cameraAlong × τ /
wavelength)`. That is the right derivative — **while the wavelength is constant.** It is not: the
line above it divides the wavelength by the phase's `patrolScale`, so it changes every time the
boss's health crosses a phase boundary.

The renderer interpolates, so what the hull integrates is the velocity. A jump in the cosine's
argument therefore does not move the hull — it **re-centres the swing on wherever the hull happened
to be**, and every later phase adds another offset. And there is no `across` cull on a boss; the
`patrol` arm says so in as many words, because that arm turns at the lane edges instead.

Driven through every phase, four of the six bobbing bosses left the lane — three of them mid-bosses,
which is what the report is mostly about:

| boss | hull's centre, across | lane is 0…100 |
|---|---|---|
| harrow — mid-boss | 27.1 … **105.0** | out |
| chorus — mid-boss | 26.9 … **114.8** | out |
| axis — mid-boss | **−14.2** … 69.4 | out |
| hydra | 34.4 … **124.3** | out |
| jormungandr | 25.3 … 98.2 | in |
| medusa | 23.8 … 69.5 | in |

⚠️ **The two that stayed in were luck**, not correctness — their phase boundaries fell where the
offset happened to cancel. *It looks fine* was never evidence about any of them.

## The rule

**A bobbing hull carries its own angle, and the angle and the hull move together or neither moves.**
`boss.bobPhase` advances by `rate` a step and `velAcross` is `amplitude × rate × cos(bobPhase)`, so
the position is `amplitude × sin(bobPhase)` about wherever the fight opened it — for **any** sequence
of wavelengths, because nothing is recomputed from a camera the wavelength has to agree with.
`reset` starts it at zero, so a fight opens centred and moving.

**It is on the hull rather than returned.** `stepBoss` returns one number; a second would mean an
object, which is an allocation in the frame loop and
[0022](0022-frame-rate-is-a-feature.md) bans it outright. `bobPhase` is the field
`src/sim/entity.ts` already carries for a pickup's bob: different pools, same meaning, which makes it
a shared field rather than an overloaded one — unlike `firePhase`, which a spinner's turn already
owns for something else.

**The angle does not advance while the hull is braced.** A beam holds the hull still
([0250](0250-the-quetzal-screams.md)) by zeroing `velAcross`; an angle that went on turning through
that would come out describing a place the hull never travelled to.

## ⚠️ The second cause was found by measuring, not by reading

The wavelength fix alone left the hydra reaching **8.6** across against an amplitude of 18 about the
middle — 23 units of centre it had no other way to lose. It is the one bobbing boss with a laser head
([0254](0254-the-hydra-grows-heads.md)), so it is the only one that braces.

The first fix was correct and incomplete, and the difference was one number in a table of six that
did not land where the arithmetic said it should. [0027](0027-measure-the-picture-not-the-model.md)
is the rule; what it bought here is the *class* rather than the instance —
[0028](0028-quality-is-the-constraint.md) asks for the class after a miss, and the class is **anything
that stops the hull while the angle keeps turning**.

## The figures

Hull centres after the fix, against `50 ± the row's own amplitude`:

| boss | amplitude | measured | expected |
|---|---|---|---|
| harrow | 22 | 28.3 … 72.7 | 28 … 72 |
| chorus | 22 | 28.0 … 72.4 | 28 … 72 |
| axis | 20 | 30.2 … 70.3 | 30 … 70 |
| jormungandr | 24 | 26.1 … 74.2 | 26 … 74 |
| hydra | 18 | 32.1 … 68.2 | 32 … 68 |
| medusa | 14 | 36.1 … 64.1 | 36 … 64 |

The slack is the Euler step's own error, not a budget anybody chose — which is why
`tests/bob.test.ts` holds the swing to within two units of the amplitude rather than to a tolerance.

## What is owed

- **A play**, and it is the cheap one: fly any level to its mid-boss and watch it through a phase
  change. The bug was visible from the first fight, which is worth remembering — it shipped anyway,
  because every guard about a boss was about where it settles ALONG the lane.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One arm of one switch and a field
that was already on the entity; nothing persisted, no storage key, no schema.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0268`:

| broken on purpose | went red |
|---|---|
| the bob's angle read off the camera again, so a phase change re-centres the swing | `THE REPORTED ONE: a bobbing hull never leaves the lane` |
| the bob's angle turning through a brace, so a held hull loses its place in the swing | `and it stays centred on the lane, rather than merely staying inside it` |

⚠️ **The second guard is not a restatement of the first.** A hull that drifted to one side and
oscillated there passes *never leaves the lane* on any boss whose amplitude is small enough — the
medusa's is 14 against a lane of 100, so it could sit twenty units off centre for a whole fight with
nothing to say so. The brace probe reddens only the centring one, which is what proves the pair
are two invariants rather than one written twice.
