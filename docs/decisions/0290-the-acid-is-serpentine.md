# 0290 — The acid is serpentine

**Accepted 2026-09-09**, from the first play of the long serpent —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"the acid attacks should fire out in a serpentine spray, as opposed [to] like the 3 blobs now"*

**Follows [0261](0261-the-serpent-throws-together.md)**, which made the acid a fan that rakes.

## The rules

**A serpentine spray is `whip`'s mechanism with the other term waving.**

**A shape's own bead count rides the attack, not the phase.**

**The lightning is not touched.**

## ⚠️ Why the wave is in where the beads are AIMED and not in how they fly

The obvious build is a weaving bullet: give the shot a phase and swing its `across` every step. That
is a change to `ShotRow`, to the frame's hot loop, and to every one of nineteen shot rows.

None of it is needed. [0249](0249-the-eagle-summons.md)'s `whip` already bows a line of fire by
marching the SPEED across its fan, so the far end outruns the near one — **this marches the speed the
same way and swings the HEADING on a sine.** The beads sit on an S rooted at the mouth, they all
leave on the same step, and they travel straight afterwards. Nothing per step, nothing on the shot,
one arm in the switch.

⚠️ **AND THE OTHER OBVIOUS BUILD IS FORBIDDEN BY A GUARD THAT IS RIGHT.** Staggering bead `i`
backwards along its own heading would make the volley leave the mouth as a wave over several steps,
which is closer to what the words describe — and it puts the later beads inside the skull and then
inside the body. `tests/serpent.test.ts` holds that this animal's acid leaves its SKULL and not the
middle of its body, a guard written because it once did exactly that.

## ⚠️ The bead count rides the attack, and that is a departure from 0110

0110 says the union says **where** the fan points and the phase says **how wide and how many**. This
takes the count.

⚠️ **BECAUSE A WAVE CANNOT BE DRAWN WITH THREE POINTS**, which is a fact about the shape rather than
about the fight — and because of what this boss's phases actually are. Its later phases hand the same
`phases[].shots` to the acid, the void and the **lightning** in turn (`heads`), so raising it to get a
spray gives the rain three times its columns.

> *"Don't change the lightning attack it's really good."*

Said twice, two plays apart. **The phase still owns `spread` and `fireEvery`**, which is what
escalates on this fight — the counts have been 3 in all three phases since 0248, and the escalation
was never in them.

## ⚠️ It still rakes, and that is load-bearing rather than decorative

The serpent's opening phase turns; its later phases index their heads by a count.
`tests/serpent.test.ts` holds the crash that came of sharing one field between the two — `heads[5.4 %
2]` is `undefined`, a TypeError at every serpent's first phase change — and that guard **opens by
asserting the opening phase actually raked.**

⚠️ **AN ATTACK THAT REPLACED THE RAKE AND STOOD STILL WOULD HAVE LEFT IT GREEN AND MEASURING
NOTHING.** So `serpentine` carries `turn` on `rake`'s own field, the whole wave rakes between
volleys, and the guard above it now asks for the turn by its property rather than by the kind's name.

## What is held, and where

| Claim | Where |
|---|---|
| the acid leaves as a WAVE — its beads' headings turn back on themselves | `tests/serpent.test.ts`, driven |
| and there are more than three of them | `tests/serpent.test.ts`, against the phase's own count |
| the opening acid still turns | `tests/serpent.test.ts`, beside the shape it is named by |
| the acid still leaves the skull and not the body | `tests/serpent.test.ts`, 0283's, unchanged |

⚠️ **THE SHAPE IS THE HALF A COUNT WOULD MISS.** Nine beads in a plain fan is three blobs with more
blobs, and the report is about the picture. A fan's angles march one way from first to last and a
wave's reverse, so what is counted is the reversals — the humps.

## ⚠️ Measured, not yet photographed, and that is a debt

`rig/bench.html` would not catch a volley in flight across four attempts, so the shape was read off a
plot of the beads' own world coordinates rather than off a screenshot: 45 steps after the throw, nine
beads spanning about 20 units along the lane and 30 across it, their `across` running down-up-down-up
through a wave and a half, with the whole spray turned off-axis by the rake.

⚠️ **THAT IS A MEASUREMENT OF THE PICTURE IN THE PLAYER'S UNITS AND IT IS NOT A VERDICT ON IT.**
[0027](0027-measure-the-picture-not-the-model.md) asks for eyes, and *does this read as serpentine*
is a question only a play answers. What is owed if the answer is no: the rake turns the whole spray
off the lane, so the wave arrives as a wavy FRONT rather than as a snake stretching toward the ship —
`sweep` against `reach` is the lever, and a smaller `turn` is the other one.

## What this does not touch

The void blasts, which are their own change and the next one:
*"the void blasts should be bigger and a bit random and should eat x amount of damage and then explode
in a void blast."*

And the hydra's acid, which throws the same shot from a different animal.
**A specific instruction about a specific segment is not generalised** — the player's own rule, from
the session that drew this skull.
