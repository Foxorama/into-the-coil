# A shape has to be looked at, and neither of these was

**2026-08-05.** Third play-test verdict, on the legibility fix
([0035](../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md)) — which was itself a
fix for the second verdict. Both of the things 0035 left explicitly unjudged came back judged, and
both came back wrong.

## The verdict

- *"I think the previous ship flash was better than the new one."*
- *"The diamond shapes took two shots to take down, with a white flash between, but sometimes they
  looked like they just disappeared. I assume it was bullet fire rate, but it looked buggy when
  sometimes they'd get hit, go white, then need a second shot and other times they appeared to just
  die straight away."*

## The second one is not the bug it looks like, and the screenshot said so

The hypothesis in the report — *"I assume it was bullet fire rate"* — is the natural one and it is
wrong. Two shots cannot bunch: they leave 9 steps apart and travel at the same speed, so they arrive
9 steps apart, and the flash is 8. Nor is the collision dropping one.

**The drifter dies to one shot and never flashes. The lancer takes two and flashes between them.**
That is exactly the described behaviour, and it is correct — *if the player can tell them apart*.

⚠️ **They could not, and this was findable in one screenshot of the shipped page.** The lancer's
arrowhead — five sides, a nose at −x, a 0.25r notch — rendered at the size it actually ships as a
small mushy lump that reads as **a slightly smaller diamond**. So the player saw diamonds, some
dying to one shot and some to two, which is indistinguishable from a game that decides at random.

The shape was reasoned about and never looked at. 0035 even named the risk — *"whether the lancer's
nose reads at speed … about 21 pixels of silhouette, and no instrument here can judge it"* — and
then shipped it anyway rather than spending two minutes taking a picture.
`docs/decisions/0027-measure-the-picture-not-the-model.md` is about exactly this and it did not stop
it, because the thing 0027 tells you to measure is *motion*, and this is *form*.

### What replaced it

| | |
|---|---|
| lancer shape | **a plain triangle**, nose at −x. Three points against four survives twenty pixels; five points with a notch in them does not |
| lancer size | **7 units against the drifter's 5.5** |
| lancer hurtbox | 3.2, up from 2.6 — bigger on screen, bigger to hit |

**The size is doing more work than the shape.** Size carries toughness and needs no learning at all;
every game the player has ever played taught it. Two enemies of different shapes that were the same
size would still have made *"how many shots does this take"* a thing to memorise rather than a thing
to see.

## The ship flash, reversed

The blink was replaced by a solid flash lasting the whole invulnerable window, on the argument that
one signal saying both *that hurt* and *you are briefly safe* was simpler. The hand disagrees, and
the hand is right: **an impact is an event and a recovery is a state**, and a state that does not
pulse just looks like the ship has changed colour.

Both are back, and both are generic rather than ship-specific — anything with `invulnFor` blinks,
anything with `flashFor` flashes. The ship is simply the only thing that currently gets both, in that
order: a solid white hit, then a pulse while it recovers.

⚠️ **The unification is what caused the regression, and it was not asked for.** It arrived as a
by-product of generalising the flash to enemies, which was the actual job. Worth naming: a
generalisation that changes behaviour at the site it started from is two changes, and the second one
was never argued.

## The instrument this session was missing

`scripts/trace-frame.mjs` traces **motion** — where a thing was drawn, per frame, in pixels. It has
now caught three bugs and it could not have caught either of these, because both are about **form**:
what a shape looks like at the size it ships at.

There is no rig for that and there did not need to be one. What was missing was the habit: a
screenshot of `dist/index.html` at a real viewport, opened and looked at. It took one throwaway
script and about a minute, and it answered in one image a question two rounds of reasoning had got
wrong.

⚠️ Not proposing a guard. A test cannot look at a triangle and say whether it reads as one — that is
the whole of why 0027 refuses thresholds on unvalidated picture quantities. What is worth carrying is
the trigger: **when a change is about what something LOOKS like rather than where it moves, take the
picture before shipping it, not after the report.**

---

## Still not re-opened

Nothing in the tuning ladder. `SHIP_SPEED` and the scroll rate remain step 1 and remain untouched
across all three of these verdicts.
