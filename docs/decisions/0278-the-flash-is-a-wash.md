# 0278 — The flash is a wash, not a cutout

**Accepted 2026-09-08**, from play against the deployed preview:

> *"the 'hit' flash needs to be far more translucent instead of pure white - with the attack speed of
> all weapons, esentially you are just fighting a white outline."*

The screenshot sent with it shows the serpent as a solid cream silhouette with none of its art
visible — no scales, no eye, no fangs, no aura.

**Amends [0035](0035-damage-is-legible-on-the-body-that-took-it.md)**, and changes a guard in
`tests/accents.test.ts` — [0192](0192-a-guard-holds-an-invariant.md) requires that said out loud.

## The rule

**A hurt twin is its base's art with ONE translucent wash of the flash ink over it.** `drawKind` draws
a twin by drawing its base and laying `palette.impact` over exactly those pixels with `source-atop`,
at `FLASH_WASH`.

## ⚠️ 0035 was right about a hit and wrong about a steady state

0035's reasoning, which is still correct as far as it goes:

> A flash has to read as *that thing being hurt* rather than as a second object, and a white
> silhouette with every panel still on it is a paler ship, not a hit.

**That holds while a hit is an EVENT.** `IMPACT_FLASH_STEPS` is **four**, so any weapon landing more
often than every fifteenth of a second holds the twin on **continuously** — and after
[0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s arsenal and
[0260](0260-a-boss-is-fought-to-the-end.md)'s doubled boss health, every gun in the game does, for
most of every boss fight.

⚠️ **SO THE THING 0035 WAS PROTECTING STOPPED BEING THE EXCEPTION AND BECAME THE PICTURE.** The
argument against *a paler ship* was that it fails to read as a hit; what actually happened is that the
cutout reads as a hit perfectly and the animal underneath is never seen at all. Every mark
[0276](0276-the-kit-draws-a-creature.md) and [0277](0277-the-serpent-has-menace.md) added is invisible
for the part of the game it was added for.

⚠️ **THIS IS NOT A CLAIM THAT 0035 WAS SLOPPY.** It is a rule whose premise moved — the rate of fire —
and the report is the first play where the premise was false for most of a fight.

## ⚠️ `source-atop` is what keeps it one blit, and it removes a guard's job

The twin is drawn by calling `drawKind` on its own base and then filling the whole box in the flash
ink with `globalCompositeOperation = 'source-atop'`, which paints only where the base already put
pixels.

⚠️ **SO *THE SAME SILHOUETTE* AND *THE SAME MARKS* STOP BEING CLAIMS.** They were two `expect`s
comparing hand-drawn shapes; they are now identities, because there is only one drawing. What is left
to hold is what can still go wrong — that there is **exactly one** wash and that it is **translucent**
— and `tests/accents.test.ts` holds those off the trace's `rects`.

⚠️ **AND IT IS STILL ONE BLIT AND ONE BITMAP.** The cost is a `fillRect` at bake time, which is cold —
`src/render/bake.ts` is in `DELIBERATELY_COLD`. 0022 and 0025 are untouched.

## The number

`FLASH_WASH = 0.55`. At 1 this is 0035's cutout, which is what play rejected; at a quarter a hit stops
registering. The guard holds it between 0.3 and 0.75, so the number can be tuned by ear without the
rule moving, and neither end can be reached by accident.

## ⚠️ What this does NOT do

**It does not touch `IMPACT_FLASH_STEPS`.** Four steps is a duty-cycle question and this is a
legibility one; changing both at once would leave neither attributable — 0109. If the flash still
reads as constant once this is played, the four is the next thing to look at, and it is one number.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art only; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0278`:

| broken on purpose | went red |
|---|---|
| the wash laid opaque, which is 0035's cutout back | `a hurt twin is its base's art under ONE translucent wash of the flash ink` |
| the wash laid twice, so a flash is two washes deep | `a hurt twin is its base's art under ONE translucent wash of the flash ink` |
| the twin drawn without its base under it, so the art is gone again | `a hurt twin is its base's art under ONE translucent wash of the flash ink` |
