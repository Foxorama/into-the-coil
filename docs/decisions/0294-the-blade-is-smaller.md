# 0294 — The blade is smaller

**Accepted 2026-09-10**, from the overnight queue —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"The shuriken guns have a parabola that's too high, they need bounce out from the ship about
> 2/3rds the distance they do now and then have that as the helix path going ahead, and the
> shurikens also need to be smaller and neater, it's too hard to see enemy elements with them
> onscreen at the moment."*

**Tunes [0238](0238-the-picture-answers-the-second-play-test.md), [0244](0244-a-blade-rides-a-helix.md) and
[0237](0237-the-blades-answer-the-first-play-test.md)**, all of which asked for the opposite and were
right at the time.

## The rules

**`coil` is both halves of that sentence.** How far the blade bounces out and how wide the helix runs
afterwards were never two numbers.

**A blade's two frames are one size.**

## ⚠️ The advisory register called this before it was fired

0237 was given *"shuriken stars need to be a lot bigger"* and made the star bigger than the ship. It
did not write that into a hard guard. It wrote it into `tests/authored.ts`, with the change that
would one day make it wrong stated in advance:

> `0237-blade` — *a blade is drawn as big as the ship that threw it* · **correctly: a smaller star,
> once a dozen of them at the cap are judged to bury the lane.**

That is this report, two words off, from the person who asked for the big ones. **The register turned
what would have been an argument into one number**, and it now prints *a blade is 74% of the ship*
against its own claim with the reason beside it — [0192](0192-a-guard-holds-an-invariant.md) paying
for itself rather than merely costing less.

## ⚠️ Two thirds has a floor, and the guard knew where

A flat two thirds of `[7, 9, 12, 15, 18]` is `[4.7, 6, 8, 10, 12]` — and **the ship's own wingtip is
at 6.04**, so the first two rungs would have had the blade leave the hull and swing back inside it
without ever clearing the wing. 0244 wrote *a blade leaves the wingtip* from a photograph reporting
*"there's a big gap between helix start and wingtips"*; it fails the other way just as hard.

⚠️ **SO THE CUT IS TWO THIRDS AT THE CAP AND TAPERS TO NOTHING AT THE BOTTOM** — 0.93, 0.83, 0.75,
0.70, 0.67 of each rung. That is where the report points anyway: *a parabola too high* is a complaint
about the widest arc the player sees, and the first rung was already sitting on its floor.

## ⚠️ Smaller is three numbers, and only one of them was the sprite

- **The star**: 8 → 5.6 units.
- **The hurtbox**: 3.2 → 2.24, which is the same 0.4 of the drawing it always was. A hurtbox left
  where it was is a blade that cuts what it visibly missed — [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)
  in the direction nobody reports. `tests/combat.test.ts` caught it at 0.57 against a 0.55 ceiling.
- **The glow**: drawn at the whole drawing radius at 0.55, so a blade veiled a disc far wider than the
  blade and a dozen at the cap veiled the lane. **What is behind a blade is the thing the player is
  trying to shoot.** 0.75 and 0.35 is what 0238 asked for in the first place: *"a bit of a glow."*

## ⚠️ And a defect nothing in the repository could see

`shuriken` and `shurikenTurn` are the two frames of one spinning blade, swapped every four steps. The
star was shrunk and **the turn face was left at 8 for a commit** — a blade that grows and shrinks four
times a second — and every guard was green about it.

⚠️ **A PAIR THAT MUST AGREE AND IS NEVER ASKED TO.** The same shape 0035 names about hurt twins, about
a turn instead. It is a guard now.

## ⚠️ The thinness floor names an index, and it took two wrong guesses to read it

Shrinking the box put a mark under 0106's floor of 2.5 CSS pixels — below which a mark is not drawn
faintly, it is not drawn. The guard said **mark 3 at 1.97px**.

⚠️ **THE TRAILING SHADOW WAS WIDENED FIRST**, on the strength of its own comment recording exactly
this fix at the last size change. The number did not move. **Then the hub.** The number did not move.
Mark 3 is the *lit* wedge: the guard counts the glow as mark 1.

⚠️ **AND THE FIRST WIDENING OF IT WENT BOTH WAYS AND CAME BACK 0.17px OVER THE HULL** — which is the
sentence already written three lines above that code, arriving as a failure rather than as advice.
The leading point sits on the star's own edge; only the trailing side has room.

**A floor that names an index is naming something.** Read it before editing what feels likely.

## What is held, and where

| Claim | Where |
|---|---|
| a blade's two frames are one size | `tests/weapons.test.ts` — new |
| a blade leaves the wingtip and swings at one width | `tests/weapons.test.ts`, 0244's, unchanged |
| every solid mark is drawn, and stays on the hull | `tests/accents.test.ts`, 0106's and 0149's |
| the hurtbox sits inside its band of the drawing | `tests/combat.test.ts`, unchanged |
| a blade is drawn as big as the ship | `tests/authored.ts`, `0237-blade` — advisory, and now unmet on purpose |
